"""Bounded analytical contact fixtures; native CPU MuJoCo, no renderer or policy."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import importlib.metadata
import hashlib
import json
import math
import os
from pathlib import Path
import platform
import statistics
import subprocess
import sys
import time

import mujoco
import numpy as np

PIN = "3.15.0"
GRAVITY, MASS, MU = 9.81, 1.0, 0.5
FRICTION_DTS = (0.00025, 0.001, 0.004, 0.02)
WALL_DTS = (0.00001, 0.0001, 0.0005, 0.001, 0.005, 0.02)
SOLVER = dict(solver="Newton", iterations=50, tolerance=1e-10,
              cone="elliptic", integrator="implicitfast", impratio=100,
              contact_solref="-10000 -100", contact_solimp="0.99 0.999 0.0001")
WALL_SOLREF = "-10000000 -10000"
BLOCK_GEOMETRY = '''<geom name="ground" type="plane" size="2 2 0.1"/>
  <body name="block" pos="0 0 0.05"><joint name="x" type="slide" axis="1 0 0"/>
    <joint name="z" type="slide" axis="0 0 1"/>
    <geom name="block_geom" type="box" size="0.05 0.05 0.05" mass="1"/></body>'''
ENGINE_WARNINGS = []


def system_info():
    def sysctl(name):
        try:
            return subprocess.check_output(["sysctl", "-n", name], text=True,
                                           stderr=subprocess.DEVNULL).strip()
        except (OSError, subprocess.CalledProcessError):
            return None
    packages = dict(sorted((dist.metadata["Name"], dist.version)
                           for dist in importlib.metadata.distributions()))
    return dict(engine=mujoco.mj_versionString(), packages=packages,
                python=sys.version, implementation=platform.python_implementation(),
                os=platform.system(), os_release=platform.release(), macos=platform.mac_ver()[0],
                machine=platform.machine(), cpu=sysctl("machdep.cpu.brand_string"),
                logical_cpus=os.cpu_count(), memory_bytes=sysctl("hw.memsize"),
                execution="native MuJoCo C engine, one CPU world, Python observation loop",
                rendering=False, training=False, utc=datetime.now(timezone.utc).isoformat(),
                source_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest())


def model_xml(dt, geometry, gravity, solref=SOLVER["contact_solref"]):
    return f'''<mujoco model="analytical-contact-fixture">
      <option timestep="{dt}" gravity="0 0 {gravity}" solver="Newton"
        iterations="50" tolerance="1e-10" cone="elliptic"
        integrator="implicitfast" impratio="100"/>
      <default><joint damping="0" armature="0" frictionloss="0"/>
        <geom solref="{solref}" solimp="0.99 0.999 0.0001" condim="3"
          friction="0.5 0 0" margin="0" gap="0"/></default>
      <worldbody>{geometry}</worldbody>
    </mujoco>'''


def block_model(dt):
    return mujoco.MjModel.from_xml_string(model_xml(dt, BLOCK_GEOMETRY, -GRAVITY))


def contact_measure(model, data):
    """Contact-frame normal force sum and horizontal force on the moving body."""
    normal = horizontal = 0.0
    for i in range(data.ncon):
        force = np.zeros(6)
        mujoco.mj_contactForce(model, data, i, force)
        contact = data.contact[i]
        normal += float(force[0])
        world = contact.frame.reshape(3, 3).T @ force[:3]
        # MuJoCo's contact force is on geom2, with the opposite on geom1.
        sign = 1 if model.geom_bodyid[contact.geom2] != 0 else -1
        horizontal += sign * float(world[0])
    return normal, horizontal


def warning_counts(data):
    return {mujoco.mjtWarning(i).name: int(item.number)
            for i, item in enumerate(data.warning) if item.number}


def friction_trial(dt, regime):
    ENGINE_WARNINGS.clear()
    setup_start = time.perf_counter()
    model, data = block_model(dt), None
    data = mujoco.MjData(model)
    for _ in range(round(0.2 / dt)):
        mujoco.mj_step(model, data)
    mujoco.mj_forward(model, data)
    settled_normal, _ = contact_measure(model, data)
    data.qpos[0], data.qvel[0] = 0.0, (0.5 if regime != "ramp" else 0.0)
    data.qfrc_applied[:] = 0
    mujoco.mj_forward(model, data)
    start_v = float(data.qvel[0])
    horizon = 0.4 if regime == "ramp" else 0.3
    steps = round(horizon / dt)
    actual_horizon = steps * dt
    limit = MU * MASS * GRAVITY
    onset = onset_normal = None
    creep = peak_normal = contact_steps = 0
    external_work = friction_work = normal_impulse = 0.0
    trace = []
    setup_wall = time.perf_counter() - setup_start
    start = time.perf_counter()
    for i in range(steps):
        t = i * dt
        applied = (1.5 * limit * t / horizon if regime == "ramp"
                   else 1.2 * limit if regime == "slide" else 0.0)
        data.qfrc_applied[0] = applied
        old_x, old_v = float(data.qpos[0]), float(data.qvel[0])
        mujoco.mj_step(model, data)
        normal, horizontal = contact_measure(model, data)
        normal_impulse += normal * dt
        peak_normal = max(peak_normal, normal)
        contact_steps += int(data.ncon > 0)
        dx = float(data.qpos[0]) - old_x
        external_work += applied * dx
        friction_work += horizontal * dx
        if regime == "ramp" and applied < 0.8 * limit:
            creep = max(creep, abs(float(data.qpos[0])))
        if regime == "ramp" and onset is None and float(data.qvel[0]) > 0.005:
            onset, onset_normal = applied, normal
        if i % max(1, steps // 100) == 0 or i == steps - 1:
            trace.append(dict(t=(i + 1) * dt, x=float(data.qpos[0]),
                              vx=float(data.qvel[0]), applied=applied,
                              normal=normal, contact_horizontal=horizontal,
                              contact_count=int(data.ncon)))
    wall = time.perf_counter() - start
    x, v = float(data.qpos[0]), float(data.qvel[0])
    expected_v = (start_v + (1.2 * limit / MASS - MU * GRAVITY) * actual_horizon
                  if regime == "slide" else max(0, start_v - MU * GRAVITY * actual_horizon))
    expected_x = (start_v * actual_horizon + 0.5 * (0.2 * MU * GRAVITY) * actual_horizon**2
                  if regime == "slide" else start_v**2 / (2 * MU * GRAVITY))
    energy_delta = 0.5 * MASS * (v**2 - start_v**2)
    analytic_work = (1.2 * limit - limit) * x if regime == "slide" else -limit * x
    return dict(fixture="friction", regime=regime, dt=dt, steps=steps,
                simulated_seconds=actual_horizon, wall_seconds=wall, setup_wall_seconds=setup_wall,
                realtime_factor=actual_horizon / wall, final_x=x, final_v=v,
                expected_x=None if regime == "ramp" else expected_x,
                expected_v=None if regime == "ramp" else expected_v,
                x_error=None if regime == "ramp" else x - expected_x,
                v_error=None if regime == "ramp" else v - expected_v,
                theoretical_threshold_force=limit, measured_onset_force=onset,
                onset_normal_force=onset_normal, below_threshold_creep=creep,
                mean_normal_force=normal_impulse / actual_horizon,
                settled_normal_force=settled_normal, expected_normal_force=MASS * GRAVITY,
                peak_normal_force=peak_normal, contact_steps=contact_steps,
                external_work=external_work, contact_work_estimate=friction_work,
                kinetic_energy_delta=energy_delta,
                horizontal_energy_residual=energy_delta - external_work - friction_work,
                analytic_work_residual=None if regime == "ramp" else energy_delta - analytic_work,
                finite=bool(np.isfinite(data.qpos).all() and np.isfinite(data.qvel).all()),
                warnings=warning_counts(data), engine_warning_messages=ENGINE_WARNINGS.copy(), trace=trace)


def wall_trial(dt):
    ENGINE_WARNINGS.clear()
    setup_start = time.perf_counter()
    radius, halfwall, initial_x, initial_v, mass, horizon = 0.01, 0.001, -0.08, 20.0, 0.1, 0.04
    geometry = f'''<geom name="wall" type="box" pos="0 0 0" size="{halfwall} 0.1 0.1"/>
      <body name="projectile" pos="{initial_x} 0 0"><joint type="slide" axis="1 0 0"/>
        <geom type="sphere" size="{radius}" mass="{mass}"/></body>'''
    model = mujoco.MjModel.from_xml_string(model_xml(dt, geometry, 0, WALL_SOLREF))
    data = mujoco.MjData(model)
    data.qvel[0] = initial_v
    mujoco.mj_forward(model, data)
    toi = (-halfwall - radius - initial_x) / initial_v
    first = first_resolution = None
    max_penetration = contacts = peak_normal = contact_impulse_x = 0
    crossed = False
    trace = []
    steps = round(horizon / dt)
    setup_wall = time.perf_counter() - setup_start
    start = time.perf_counter()
    for i in range(steps):
        # Refresh derived contacts at exactly the state about to advance.
        mujoco.mj_forward(model, data)
        normal, horizontal = contact_measure(model, data)
        peak_normal = max(peak_normal, normal)
        contact_impulse_x += horizontal * dt
        x = initial_x + float(data.qpos[0])
        gap = abs(x) - halfwall - radius
        if data.ncon:
            if first is None:
                first, first_resolution = i * dt, int(data.ncon)
            contacts += int(data.ncon)
        max_penetration = max(max_penetration, max(0.0, -gap))
        crossed = crossed or x > halfwall + radius
        if i % max(1, steps // 100) == 0 or data.ncon or i == steps - 1:
            trace.append(dict(t=i * dt, x=x, vx=float(data.qvel[0]),
                              signed_gap=gap, contacts=int(data.ncon)))
        mujoco.mj_step(model, data)
    wall = time.perf_counter() - start
    final_x, final_v = initial_x + float(data.qpos[0]), float(data.qvel[0])
    crossed = crossed or final_x > halfwall + radius
    max_penetration = max(max_penetration, max(0.0, halfwall + radius - abs(final_x)))
    return dict(fixture="thin_wall", dt=dt, steps=steps, simulated_seconds=steps * dt,
                wall_seconds=wall, setup_wall_seconds=setup_wall, realtime_factor=steps * dt / wall,
                initial_x=initial_x, initial_v=initial_v, sphere_radius=radius,
                sphere_mass=mass, wall_half_extents=[halfwall, 0.1, 0.1],
                wall_thickness=2 * halfwall, analytic_hard_wall_contact_time=toi,
                analytic_hard_wall_stop_x=-halfwall - radius,
                first_sampled_contact_time=first,
                first_contact_time_error=None if first is None else first - toi,
                first_contact_count=first_resolution, summed_contact_count=contacts,
                max_sampled_penetration=max_penetration, fully_crossed_wall=crossed,
                final_x=final_x, final_v=final_v,
                initial_energy=0.5 * mass * initial_v**2, final_energy=0.5 * mass * final_v**2,
                peak_normal_force=peak_normal, contact_impulse_x=contact_impulse_x,
                momentum_change=mass * (final_v - initial_v),
                impulse_residual=mass * (final_v - initial_v) - contact_impulse_x,
                finite=bool(np.isfinite(data.qpos).all() and np.isfinite(data.qvel).all()),
                warnings=warning_counts(data), engine_warning_messages=ENGINE_WARNINGS.copy(), trace=trace)


def checks(results):
    def first(fixture, regime=None):
        return next(r for r in results if r["fixture"] == fixture
                    and (regime is None or r.get("regime") == regime))
    slide, stop, ramp = (first("friction", r) for r in ("slide", "stop", "ramp"))
    fine, coarse = first("thin_wall"), [r for r in results if r["fixture"] == "thin_wall"][-1]
    values = [
        ("finest sliding velocity within 3%", abs(slide["v_error"]) / slide["expected_v"] < 0.03),
        ("finest stopping distance within 5%", abs(stop["x_error"]) / stop["expected_x"] < 0.05),
        ("finest static onset within 10%", ramp["measured_onset_force"] is not None and
         abs(ramp["measured_onset_force"] / ramp["theoretical_threshold_force"] - 1) < 0.1),
        ("finest below-threshold creep below 0.1 mm", ramp["below_threshold_creep"] < 1e-4),
        ("fine wall reference contacts and does not cross", fine["summed_contact_count"] > 0 and
         not fine["fully_crossed_wall"]),
        ("fine wall does not create kinetic energy", fine["final_energy"] <= fine["initial_energy"] * (1 + 1e-8)),
        ("coarse deliberately unsupported wall case exposes tunneling", coarse["fully_crossed_wall"] and
         coarse["summed_contact_count"] == 0),
        ("all sweep trials remain finite", all(r["finite"] for r in results)),
        ("finest fixture trials have no engine warnings", all(not r["warnings"] and
         not r["engine_warning_messages"] for r in results if r["dt"] ==
         (FRICTION_DTS[0] if r["fixture"] == "friction" else WALL_DTS[0]))),
    ]
    return [dict(check=name, passed=bool(value)) for name, value in values]


def markdown(payload):
    lines = ["# Native CPU contact fixture results", "",
             "Analytical approximations and timestep failure probes; no physical ground truth, training or transfer claim.",
             "Measured realtime factor includes stepping plus Python observations; excludes model compile/settling/output.", "",
             f"MuJoCo {payload['system']['engine']}; {payload['system']['cpu']}; {payload['system']['os']} "
             f"{payload['system']['macos']}; Python {platform.python_version()}; repeats={payload['repeats']}.", "",
             "| Fixture | dt (s) | median realtime factor | x error (m) / max penetration (m) | v error (m/s) | onset (N) | crossed | contacts | warnings |",
             "|---|---:|---:|---:|---:|---:|---|---:|---:|"]
    for group in payload["groups"]:
        r = group["trials"][0]
        label = r["fixture"] + ":" + r.get("regime", "impact")
        def fmt(value):
            return "—" if value is None else f"{value:.6g}"
        lines.append(f"| {label} | {r['dt']:.6g} | {group['realtime_factor_median']:.3f} | "
                     f"{fmt(r.get('x_error', r.get('max_sampled_penetration')))} | "
                     f"{fmt(r.get('v_error'))} | {fmt(r.get('measured_onset_force'))} | "
                     f"{r.get('fully_crossed_wall', '—')} | "
                     f"{r.get('summed_contact_count', r.get('contact_steps'))} | "
                     f"{len(r['engine_warning_messages']) + sum(r['warnings'].values())} |")
    lines.extend(["", "## Semantic checks", "", "These are declared prototype checks, not universal simulation tolerances.", ""])
    lines.extend(f"- {'PASS' if c['passed'] else 'FAIL'}: {c['check']}" for c in payload["checks"])
    lines.extend(["", "## Interpretation", "",
                  "The ramp measures a velocity-defined onset, so onset depends on ramp rate and the 5 mm/s criterion. "
                  "The block is restricted to translation in x/z. Coulomb comparisons apply to sustained horizontal sliding "
                  "under gravity, with nominal normal load mg and equal static/dynamic coefficients.", "",
                  "The wall's ideal hard-contact time and stop position are analytical references for geometry. MuJoCo uses "
                  "compliant regularized contact. Penetration and contact-time deviations are reported rather than hidden. "
                  "The finest run is a numerical reference, never a physical truth. A coarse step can cross the entire wall "
                  "between collision queries. The intentionally coarse failure belongs outside a candidate product's declared envelope.", "",
                  "JSON includes solver/contact configuration, hardware/package versions, warnings, contact/energy diagnostics, "
                  "per-trial timing, and sampled traces. Runtimes are local observations, not an engine ranking. "
                  "Friction contact counts are steps with contact; wall counts sum detected contacts. "
                  "Wall timing includes an explicit mj_forward refresh every step in addition to mj_step; "
                  "timings across different fixtures are therefore not directly comparable.", "",
                  "Engine warning messages: " + repr(sorted({message for group in payload["groups"]
                      for trial in group["trials"] for message in trial["engine_warning_messages"]}))])
    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("results/latest"))
    parser.add_argument("--repeats", type=int, default=3)
    parser.add_argument("--verify", action="store_true", help="exit nonzero on declared semantic checks")
    args = parser.parse_args()
    if args.repeats < 1:
        parser.error("--repeats must be positive")
    if mujoco.__version__ != PIN:
        parser.error(f"requires pinned MuJoCo {PIN}, found {mujoco.__version__}")
    mujoco.set_mju_user_warning(ENGINE_WARNINGS.append)
    groups, flat = [], []
    for dt in FRICTION_DTS:
        for regime in ("ramp", "slide", "stop"):
            trials = [friction_trial(dt, regime) for _ in range(args.repeats)]
            flat.extend(trials)
            groups.append(dict(trials=trials, realtime_factor_median=statistics.median(
                t["realtime_factor"] for t in trials)))
    for dt in WALL_DTS:
        trials = [wall_trial(dt) for _ in range(args.repeats)]
        flat.extend(trials)
        groups.append(dict(trials=trials, realtime_factor_median=statistics.median(
            t["realtime_factor"] for t in trials)))
    payload = dict(schema_version=1, system=system_info(), repeats=args.repeats,
                   config=dict(solver=SOLVER, gravity=GRAVITY, block_mass=MASS, friction=MU,
                               friction_dts=FRICTION_DTS, wall_dts=WALL_DTS,
                               onset_velocity_criterion=0.005, random_seed=None,
                               friction_normal_load_assumption="mg",
                               friction_fixture_xml=model_xml(FRICTION_DTS[0], BLOCK_GEOMETRY, -GRAVITY),
                               wall_contact_solref=WALL_SOLREF,
                               units="SI: s, m, kg, N, N*s, J; realtime factor = simulated s / wall s",
                               timing_notes="Instrumented one-world loops; wall also refreshes mj_forward every step; setup excluded and recorded separately"),
                   groups=groups, checks=checks(flat))
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "results.json").write_text(json.dumps(payload, indent=2, allow_nan=False) + "\n")
    report = markdown(payload)
    (args.output / "results.md").write_text(report)
    print(report)
    return 2 if args.verify and not all(c["passed"] for c in payload["checks"]) else 0


if __name__ == "__main__":
    raise SystemExit(main())
