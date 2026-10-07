# Frozen native arm engineering evaluation

The final controller improved the development score from 14/20 to 17/20, but the one-time held-out score fell from 30/32 to 29/32. Both versions succeeded on all 24 nominal held-out cases; one of eight actuator-stress cases regressed. This release supports an auditable CPU contact-manipulation workflow and preserves a failed improvement attempt. It supports no held-out generalization gain, speed gain, GPU result or physical transfer claim.

## Task results

| Evaluation | Baseline v0 | Round 1 | Round 2/final |
|---|---:|---:|---:|
| Development nominal | 12/14 | 14/14 | 14/14 |
| Development actuator stress | 2/6 | 2/6 | 3/6 |
| Development pooled | 14/20 | 16/20 | 17/20 |
| Held-out nominal | 24/24 | Not evaluated | 24/24 |
| Held-out actuator stress | 6/8 | Not evaluated | 5/8 |
| Held-out pooled | 30/32 | Not evaluated | 29/32 |

The paired final comparison contains **0 improvements, 1 regression, 29 both-success and 2 both-failure cases**. Final pooled success is 90.625%, with a Wilson 95% binomial reference interval of 75.78–96.76%; nominal 24/24 has bounds 86.20–100%, and stress 5/8 has bounds 30.57–86.32%. These small, fixed, heterogeneous engineering sets are not independent representative samples of physical robot use. Their intervals are reference calculations, not physical reliability guarantees. The Wilson method is documented by [NIST](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm).

The seven unsupported/out-of-range probes were correctly rejected by each development version and are counted separately from task successes. All 76 held-out task/control episodes completed with valid state and no captured warning counters or warning text. Each version ran three initial-pose/open-jaw and three identical-arm-target/open-jaw controls: zero unexpected successes, object displacement below 6.2×10⁻¹² m. No controller or task edits followed the held-out outcomes.

Canonical evidence: [assessment.json](assessment.json), [protocol](protocol.json), [baseline DEV](v0/dev.json), [round 1 DEV](round1/dev.json), [round 2 DEV](round2/dev.json), [baseline held-out](v0/heldout.json), [final held-out](final/heldout.json), [paired comparison](heldout-comparison.json).

## Preserved regression

`held-29` uses a 50 mm cube, mass 40 g, raw object friction 0.7, effective jaw friction 1.0, arm output caps 2 N·m and jaw drive caps 0.25 N each. Start and target centres are [0.302482, 0.194105, 0.315] and [0.414219, −0.106755, 0.315] m.

Baseline released and settled after 15.969 simulated seconds with 6.692 mm target error. Final achieved a 116.95 mm retained lift, triggered one recovery after a contact/relative-pose loss, and reached the unchanged 18 s horizon in `place`. It still had four loaded contacts on each jaw and no table contacts; the object centre was 80.35 mm above target height, with 80.70 mm total target error. It had not released or accumulated settled placement dwell. Recovery consumed part of the time budget; this compact measurement does not isolate which controller change caused the regression. No post-holdout ablation was run.

The other two failures, `held-24` and `held-28`, failed for both versions under 0.75 N·m arm/0.12 N jaw caps. Final explicitly reported insufficient static jaw capacity and held the object stationary on the table. Baseline remained in approach. All difficult cases remain in the denominators.

## What is simulated and commanded

The original articulated arm has six hinge DOF and two physical jaw slide DOF. The external action provides six joint-position targets in radians and one total jaw opening in metres, split equally between the jaw servos: **seven independent command values**. The dynamic free object adds six unactuated world DOF. Native dimensions are `nq=15`, `nv=14`, `nu=8`; there are no mocap bodies or equality constraints. The box state is initialized at reset and subsequently evolves through native gravity/contact dynamics, without an object trajectory or attachment.

Default native drive output caps are 40 N·m per hinge and 15 N per jaw. Accepted benchmark dimensions independently vary X/Y/Z full widths over 30–50 mm, mass 20–80 g, raw friction 0.4–1.5 and bounded tabletop layouts. Held-out positions use NumPy seed `2026100717`, rectangular uniform proposals X [0.251, 0.551] m/Y [−0.198, 0.198] m filtered by radial reach ≤0.555 m and transport ≥0.09 m. Deterministic size/material/capacity schedules and all exact cases are stored in the protocol. Stress caps are intentionally separated from nominal cases.

Only jaws, box and table collide; links and palm are collision-excluded. Perception is privileged simulator state. Reset boxes are axis-aligned, tool orientation is fixed upright, and there is no obstacle, self-collision, cup-handle, arbitrary-orientation or deformable qualification. Equal-priority friction mixing gives jaw coefficient `max(1, object_friction)` and table coefficient `max(.8, object_friction)`: a raw coefficient below those floors does not test a slippery interface. See [MuJoCo contact parameter rules](https://mujoco.readthedocs.io/en/stable/modeling.html#contact-parameters).

The success predicate is preserved independently of progress reward: prior loaded bilateral/table-free lift ≥55 mm for 100 ms, open/released jaws, tool ≥100 mm above the object, table support, position within 25 mm, linear speed <35 mm/s, angular speed <0.3 rad/s, and 250 ms settled dwell. Contact-law XML, contact gate, success gate, original configuration fields and embodiment constants have matching baseline/final signatures. Round 2 adds authored target ramps of 3 rad/s per hinge and 0.16 m/s for total jaw gap before gravity compensation; actual velocities are measured, not clamped.

Sampled task contact penetration reached 1.614 mm baseline and 3.497 mm final; the maximum normal force summed over contacts on one pad, sampled at 1 ms, reached 2.923 N and 1.393 N respectively. This statistic takes the larger per-pad sum; it does not add both pads. Transient contact force is not actuator drive output. All observed native actuator outputs respected the configured limits; final checked each 1 ms tick, baseline used the original 20 ms actuator diagnostics. A final low-torque case reached 3.636 rad/s actual hinge velocity despite a 3 rad/s target ramp. These diagnostics show bounded commanded actuation, contact and compliance limitations; there is no measured hardware force/material calibration.

## CPU timing and provenance

| Held-out tasks only | Baseline | Final |
|---|---:|---:|
| Episode wall seconds, total | 33.956 | 38.012 |
| Simulated episode seconds, total | 417.094 | 432.874 |
| Simulated seconds / wall second | 12.283 | 11.388 |
| Median episode real-time factor | 12.961 | 11.664 |
| Median of episode p50 control latencies | 1.404 ms | 1.588 ms |
| Median of episode p95 control latencies | 1.967 ms | 1.924 ms |

One CPU world runs on Apple M5/arm64, ten logical CPUs, 24 GiB RAM, macOS 26.5.2/Darwin 25.5.0, Python 3.12.9, MuJoCo 3.15.0 and NumPy 2.5.3. The timed boundary includes model compilation, reset/settling, policy/IK, native stepping, observations and diagnostic collection. It excludes process/import startup, source copying, installation, JSON I/O, rendering and the web UI. In-memory command recording is included; full episode traces are disabled. Simulated reset settling is excluded from the numerator although its wall cost is included. There is one task execution per version/case, no affinity/thermal control or repeated performance campaign, and no GPU measurement.

Round 2 development timing overlapped a separate native regression suite; its receipt explicitly labels that timing confounded, and it is excluded from throughput claims. Root and the runtime owner paused native tests during the final held-out measurement; ordinary desktop work was not controlled. Native joint/contact diagnostics are normally sampled at 20 ms. Final also records joint/actuator peaks at 1 ms, and both environments track aggregate pad-force peaks at 1 ms. Extra instrumentation contributes to timing; this is not a physics-core speed comparison.

Frozen protocol SHA-256: `b537ea78e004a0258ffca891dfd10cff8a283249f712f1503d7afd7caa591f05`.

Held-out harness SHA-256: `b45bce3072d6a3c0c5b67307b31c184907cd0c8f08f910c004fea79a4cb44412`.

| Frozen file | v0 SHA-256 | Final SHA-256 |
|---|---|---|
| arm_env.py | `395d9b7ab2fc09458081d8fae162ec701adcd8b944e65a171c7184deb45e5fb3` | `e4af9b75364a568284b1e6d96469deacf498dd87a60b067fa5e310fe15c54c00` |
| arm_policy.py | `6cb7d9644b6eda2f79e4253a37fe33b5942f736ca341756fb8b968dfb0a255b2` | `d6d53d87703fb8608390092309285afb6a2c8fd3103a7abd77668be85469eab3` |
| env.py dependency | `929c1d8c3c4cafe0054c633ee5f3e51c551dd6b26ae014ab1ea9219b58eca8e4` | Same |

The exact sources are isolated in [snapshots](snapshots); [final freeze](final-freeze.json) records unchanged predicate signatures. Baseline and round 1 DEV receipts name the archived contemporaneous [measurement-v1 harness](harnesses/measurement-v1.py); held-out baseline and final use the same current harness. Source/protocol/harness bytes were rehashed after completion. Seven benchmark integrity/isolation/native-negative-control tests passed before final freeze.

The CLI sequence was `.venv/bin/python -B -m simlab.arm_benchmark init`, `dev --label v0`, `dev --label round1`, `dev --label round2`, `freeze-final`, then `heldout`, with snapshots between authorized development edits. The held-out command now refuses to repeat this completed comparison. Future controller or Skillspace revisions need a new evaluation release and newly frozen holdout; these visible cases must not silently become a tuning set.
