# Robot simulation contact lab

An isolated, offline-capable native CPU MuJoCo foundation for measuring numerical contact error and runtime together. It contains analytical fixtures, not a robot training product. It does not validate deformable materials, tactile sensors, learned policies or physical transfer.

## Run

Python 3.12 was used for the recorded Apple arm64 run; the pinned engine is MuJoCo 3.15.0. A prebuilt wheel includes the C engine, so no separate simulator application or account is required. After the one-time package installation, fixtures run without network access or a renderer.

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements.lock.txt
.venv/bin/python bench.py --output results/local-cpu --repeats 3 --verify
```

The checked-in JSON and Markdown reports are actual local outputs. `--verify` returns a nonzero status when declared semantic checks fail. It intentionally expects the coarsest wall run to demonstrate tunneling: detecting this unsupported regime is a successful failure probe, not acceptable product physics.

For an air-gapped installation, prepare a wheel directory on a machine with the same Python/OS/architecture:

```sh
python3.12 -m pip download -r requirements.lock.txt -d wheelhouse
.venv/bin/python -m pip install --no-index --find-links wheelhouse -r requirements.lock.txt
```

These packaging commands are guidance; an air-gapped machine and NVIDIA backend have not been exercised. No cloud, telemetry, credentials or global configuration is required by this script.

The installed fixture was additionally run with `python offline_check.py`: Python socket construction, `create_connection` and DNS resolution were explicitly replaced with throwing guards, and an intentional connection attempt verified the guard. A separate one-repeat sweep passed with zero attempted socket operations. This check is scoped to Python networking; it does not intercept native C networking or exercise installation in an air-gapped machine. See `results/offline-check/socket-policy.json`. The recorded three-repeat performance results were not overwritten by this check.

## Fixtures and scope

The block has x/z translation and deliberately cannot rotate. It settles under gravity before three separate experiments: a slow force ramp measures a velocity-defined static onset; an initially sliding block receives constant horizontal force; and a sliding block is released to measure stopping distance. References use equal static/dynamic Coulomb friction with normal load `N = mg`, acceleration `(F - μmg)/m`, and stopping distance `v₀²/(2μg)`. Soft contact regularization allows creep and penetration, which are reported. The ramp's 5 mm/s onset criterion introduces a finite-delay bias.

A 20 m/s sphere approaches a 2 mm wall. Geometric hard-wall contact time is known analytically. The script records first sampled contact, signed sphere-to-wall gap, sampled penetration, contact count, impulse, energy and complete wall crossing. The finest run is a **numerical reference**, not physical ground truth. A timestep can carry the sphere entirely past the wall before collision is queried.

Both sweeps freeze solver tolerances, iterations, direct stiffness/damping parameters, geometry and physical horizons. Repeated trials assess timing noise; there is no randomized seed because the native CPU fixtures have fixed deterministic inputs. JSON records every trial, units/configuration, observed warnings and sampled traces. Contact work uses sampled force times displacement and is an estimate. All quantities are SI: seconds, metres, kilograms, newtons, newton-seconds and joules. Realtime factor is simulated seconds per wall second.

The block and impact use different explicitly authored contact coefficients: block `solref=-10000 -100`, wall `solref=-10000000 -10000`; each stays fixed within its sweep. They are uncalibrated simulator parameters, not a measured material law. The 10 µs wall run catches the sphere but still reaches approximately 1.679 mm sampled penetration; the 1 ms run penetrates 11 mm before retreating, and 5/20 ms miss all contact queries. A successful catch is therefore not a claim of geometric precision. The fine-run semantic checks do not qualify the deliberately coarse stress cases.

The finest sliding case matches aggregate horizontal velocity to about 0.45%, but has contact on only 326 of 1,200 sampled steps and peak normal force 43.58 N versus nominal weight 9.81 N (mean 9.786 N). Aggregate motion agreement therefore does **not** validate instantaneous contact forces, continuous contact or tactile fidelity. The fine wall reflects the sphere at approximately 1.410 m/s; its law is dissipative but not perfectly inelastic.

The superseded exploratory development log is excluded from this public fixture. Final per-trial JSON captures the warnings directly and is the canonical record: the 20 ms force ramp produces a nonconvex-linesearch warning, while finest fixtures are warning-free.

The measured runtime includes C stepping **and Python diagnostic collection**. The wall also refreshes `mj_forward` each step to avoid stale position/contact diagnostics, whereas the block reads the step's solved forces. Thus times across different fixtures are not directly comparable. Model compilation, settling, report generation and package installation are excluded; setup time is recorded separately. It is a one-world CPU diagnostic workload, not a GPU batch throughput measurement or an engine ranking. Increased timestep can appear faster while losing contact entirely. Authored direct contact coefficients stay fixed per fixture; changing timestep still changes the discrete approximation and effective response.

## Adapter contract for future GPU and deformable work

An adapter must preserve explicit scene units, initial/boundary conditions, solver/material settings, action and sensor rates, timestep, reset rules and observation semantics. It must report unsupported features, dropped/overflowed contacts, per-world contact forces/impulses and timing boundaries. Silent fallback is a failure.

GPU implementations should reproduce these physical cases first, then measure batch sizes with compilation, reset, memory, transfer and policy cost reported separately. Use scalar latency and aggregate simulated-seconds/wall-second together. Current native CPU cable plugins are not assumed to transfer to MJX/Warp.

Rod self-contact, finite thickness, bending/twist and knot-holding pull tests are separate gates. A straight tension fixture was omitted because the available cable abstraction is inextensible and would not meaningfully identify axial elasticity. The next material fixture needs a declared extensible constitutive law and measured parameters before it can support a deformable accuracy claim.

Primary implementation references: [MuJoCo computation/contact](https://mujoco.readthedocs.io/en/stable/computation/index.html), [MJX feature parity](https://mujoco.readthedocs.io/en/stable/mjx.html), [MJWarp throughput/latency](https://mujoco.readthedocs.io/en/stable/mjwarp/index.html).
