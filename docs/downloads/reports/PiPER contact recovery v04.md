# Restore speed after settling, and avoid an unchanged failed grip

DVIDIA research · 11 October 2026 · Contact recovery v0.4

**v0.4 completes the same 4/12 placements as v0.3 on fresh layouts, while two completed recoveries finish 2.440 and 2.640 simulated seconds sooner.** The carry-only and full versions have the same completion count; none is gained or lost. Four low-friction failures reach refusal 2.88–2.90 seconds sooner. All **84 planned attempts** are numerically valid, including **48 failed negative controls**. Eight placements still fail in each mode. Two nominal-friction 60 g cases that succeeded in the older cohort now remain suspended below the unchanged resume-height gate and time out in every mode. This establishes faster progress after settling on two tasks, with continuing acquisition and resume limitations. It is not a learned skill, true-slip accuracy or physical robot qualification. ([Complete frozen report](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-11-piper-recovery-v04/receipt/report.json))

The six failed placements in [contact history v0.3](https://research.dvidia.org/papers/piper-contact-history-v03/) all fail before acquiring a load-bearing grasp. A faster carry response cannot repair a grip that never lifts its object. Version 0.4 therefore separates two changes: restoring requested movement after a settled carry hold, and avoiding an unchanged supported retry when current observations indicate that it is not helping. Completed placement, successful recovery and faster refusal remain separate results.

## Diagnose the six failures first

The frozen v0.3 cohort contains two failed 60 g placements at friction 0.55 and four failed placements at friction 0.15, split between 40 g and 60 g blocks. All first alarms occur during the slow acquisition probe. At each alarm the object remains supported while the tool rises several millimetres. The object never reaches the required 6 mm test-lift rise, much less the independent task’s 60 mm lift.

| Failed v0.3 scene | First alarm (s) | Object / tool rise at alarm (mm) | Final abort (s) | Time spent on the repeated grasp (s) | Maximum episode lift (mm) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Friction 0.15, 40 g, layout 0 | 11.52 | 0.050 / 3.428 | 14.42 | 2.90 | 0.080 |
| Friction 0.15, 40 g, layout 1 | 11.50 | 0.052 / 3.448 | 14.40 | 2.90 | 0.080 |
| Friction 0.15, 60 g, layout 0 | 11.54 | 0.018 / 3.849 | 14.44 | 2.90 | 0.044 |
| Friction 0.15, 60 g, layout 1 | 11.50 | 0.016 / 3.435 | 14.40 | 2.90 | 0.040 |
| Friction 0.55, 60 g, layout 0 | 11.56 | 0.104 / 3.644 | 14.48 | 2.92 | 0.148 |
| Friction 0.55, 60 g, layout 1 | 11.54 | 0.088 / 3.680 | 14.46 | 2.92 | 0.142 |

Every alarm snapshot is supported. Eleven of twelve probe windows remain supported throughout; the remaining retry contains one unsupported observation. Bilateral pad contact occupies 94.7–100% of each window. The zero jaw target is already the strongest closing request permitted by this position-command interface. All six history traces match their probe-only counterpart in every recorded native position, velocity and command. All six original-motion baselines also fail, with maximum lifts of only 0.108–0.301 mm. These observations point to acquisition rather than a new failure caused by the v0.3 carry monitor. ([Complete forensic analysis and reproduction source](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-11-piper-recovery-v04/forensics/README.md), [All event and probe statistics](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-11-piper-recovery-v04/forensics/analysis.json))

### Contact force, not the actuator cap

The pinned gripper uses a position servo: before clipping, its drive force is `40 × (target − measured slide) − 5 × slide velocity`. At rest with the measured slide around 0.0196 m and target zero, this gives about −0.784 N. The coupled fingers produce roughly 0.39 N per pad. The ±10 N actuator cap is not reached. The current gain, legal position target and grasp geometry determine the available squeeze; this is not evidence that physical PiPER hardware is too weak.

For nearly vertical sides, `friction × sum of pad normal forces` estimates vertical friction support. At friction 0.15 this is about 0.118 N, compared with weights of 0.392 N and 0.589 N. At friction 0.55 it is about 0.43 N, compared with 0.589 N for the failed 60 g cases. The successful 40 g cases at friction 0.55 have a small positive margin under the same approximation.

A native contact-parameter check at the recorded first-alarm poses confirms both sliding-friction coefficients match each scene’s declared value. The object’s contact priority supplies them, and contact normals have absolute vertical component below 0.00204. This supports the side-pinch approximation. It is not a reconstructed tangential wrench or a proof that every grasp is impossible; normal forces below the recording threshold are omitted. A different grasp, support-assisted motion or an explicitly different squeeze interface could change the result and would need a separate comparison.

Simply moving more slowly does not remove a static support deficit. Opening and repeating the same pinch also adds no sustained force. These findings motivate an observation-based refusal criterion while keeping material parameters out of the controller’s decision inputs.

## Two independently observable changes

The carry change begins **after** the unchanged v0.3 closed hold has qualified relative settling and resumed. It starts from the same 0.45 requested joint-delta scale. A further 100 ms of stable observed history enables a linear increase toward the original scale of 1, accumulated over 300 ms of additional stable observed time. The evidence remains the v0.3 gate: known history, endpoint displacement and maximum pairwise excursion within 1.5 mm, relative rate at most 8 mm/s, loaded bilateral contacts throughout, no support and at least 6 mm object rise. Unstable evidence pauses the increase at its current scale; it does not itself reduce that scale. The unchanged persistent-trend and bilateral-contact-loss responses remain active, and a new hold resets restoration. This tests faster task progress after settling, rather than shortening the settling test.

The full mode adds one acquisition decision. When the original two-observation `object_not_following` alarm fires while the object remains supported, it examines the past 120 ms with at least 100 ms of observed span. Every sample must have loaded bilateral contact, table support and an already-issued closed-jaw request. Each jaw may vary by no more than 0.5 mm and each pad normal force by no more than 0.05 N. If these observations support a stable closed grasp that still does not follow, the controller holds closed and declines the otherwise available unchanged retry. Short, unloaded, varying-force or otherwise ambiguous windows keep the original bounded retry. No hidden mass or friction is consulted, and this refusal does not claim that another grasp is impossible.

All modes retain the pinned native robot, gain and force limits, free-object contact dynamics, and independent task scorer. Acquisition still requires the original 10 mm slow probe, at least 6 mm of object rise, loaded bilateral contact, absent support and no more than 3 mm relative drift for 100 ms. The task still requires bilateral table-free lift of at least 60 mm for 100 ms, retained carry, supported opening and release, destination dwell within 25 mm for 250 ms, and 100 mm tool retreat without prohibited contact. Consecutive 40 ms loss of bilateral contact after qualifying full lift permanently disqualifies the attempt. Refusal or resumption cannot reset that failure. Every episode keeps its entire 20-second budget.

Three placement modes distinguish the changes. `history` is the frozen v0.3 behavior. `recovery_carry` changes carry recovery only. `recovery` combines the new carry response with the supported-acquisition decision. Each has its own exact requested-arm replay with open jaws, plus one shared initial-arm hold per scene. This is seven variants per scene; a no-grip replay uses the actual requested arm tape of its associated placement.

## Freeze development before confirmation

The fresh confirmation protocol reserves seed **941827** after the runtime is committed as [`ccf8f3d1c2a1977da855ba8f601499aa543a7b6c`](https://github.com/Dvidia-Inference/dvidia-training/tree/ccf8f3d1c2a1977da855ba8f601499aa543a7b6c). Two new start/target XY layouts recur across friction 0.8, 0.55 and 0.15 and masses 40 g and 60 g. Twelve scenes each run seven variants, for **84 planned attempts**. The source archive is built into an installed wheel whose thirteen runtime source/lock hashes match the frozen protocol. The command runs with OS process-level network denial, pinned local assets, no source-path override, and one OpenBLAS/OpenMP thread each. Physics advances every 1 ms; observations and commands occur every 20 ms. Every full valid attempt retains 1,000 commands and 1,001 states across 20 simulated seconds. These related synthetic fixtures provide a descriptive paired comparison, not a population reliability estimate. ([Protocol](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-11-piper-recovery-v04/receipt/protocol.json), [Execution boundary](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-11-piper-recovery-v04/execution.json))

The v0.3 scenes used for this diagnosis are known development evidence. They are not added to the new confirmation denominator. Failed candidates and unsuccessful confirmation attempts remain in their respective archives. A new source revision and protocol must be frozen before a fresh reserved seed is run. Outcomes use unchanged task criteria rather than controller-generated success labels.

## Completion, recovery and refusal

| Synthetic friction | Mass | v0.3 history | v0.4 carry-only | v0.4 full | Matched open-jaw + hold controls | Numerically valid |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 0.8 | 40 g | 2/2 | 2/2 | 2/2 | 0/8 | 14/14 |
| 0.8 | 60 g | 0/2 | 0/2 | 0/2 | 0/8 | 14/14 |
| 0.55 | 40 g | 2/2 | 2/2 | 2/2 | 0/8 | 14/14 |
| 0.55 | 60 g | 0/2 | 0/2 | 0/2 | 0/8 | 14/14 |
| 0.15 | 40 g | 0/2 | 0/2 | 0/2 | 0/8 | 14/14 |
| 0.15 | 60 g | 0/2 | 0/2 | 0/2 | 0/8 | 14/14 |
| Total | — | 4/12 | 4/12 | 4/12 | 0/48 | 84/84 |

At friction 0.55 with 40 g objects, both resumed placements finish sooner. Layout 0 changes from **18.468 to 16.028 seconds**; layout 1 changes from **18.526 to 15.886 seconds**. Both keep their original 220 ms and 240 ms settling holds. Time from resume to completion falls from 6.028 to 3.588 seconds and from 6.446 to 3.806 seconds. The improvement comes after the unchanged settling test. The two nominal-friction 40 g successes have equal task clocks across modes. Averaged over all four shared successes, the completion-time change is **−1.270 simulated seconds**; that average includes the two unchanged tasks.

Full recovery and carry-only produce the same successful task clocks. The full version additionally declines four unchanged low-friction retries, reaching refusal **2.88–2.90 seconds sooner**. All four remain failed placements and all still retain 20-second episodes. The two heavier moderate-friction acquisitions keep the old retry because force/contact observations are ambiguous; neither qualifies or completes.

### Fresh layouts expose two more limitations

The nominal-friction 60 g cases qualify the initial probe at 11.98 and 11.76 seconds. Bilateral-contact loss then starts closed holds at 12.10 and 11.84 seconds. Loaded bilateral contact returns after 40 ms in each case, and neither has sampled table support after qualification. The objects are still held.

Relative contact history becomes settled again at 12.26 and 12.00 seconds, but object rise relative to the probe origin falls below **6 mm** at 12.30 and 12.02 seconds. The eligible dwell reaches only 20 ms and 0 ms, short of the required 100 ms. Both holds time out at the next observed boundary after 800 ms: **820 ms**, at 12.92 and 12.66 seconds. At abort, object rise is only 4.241 and 4.009 mm even though contact is loaded, support is absent and relative excursion is just 0.029 and 0.027 mm. Calling the entire hold continued slipping would misdescribe the evidence.

Neither failed task reaches the independent 60 mm lift; peak lift above its initial settled pose is 10.206 and 9.088 mm. Neither resumes, so v0.4’s speed restoration never runs. All three policies have exactly equal commands and every native position/velocity row throughout these two episodes. The frozen v0.3 controller also completes only 4/12 on this fresh cohort. Its old 6/12 result describes different layouts; it is not the fresh confirmation denominator or a matched v0.4 regression.

Each placement mode therefore has four holds: two that resume and complete, and two that time out. The independent evaluation observes loaded unsupported contact in both pre-resume windows, but only **one of two** meets its separate absolute TCP peak-speed limit of 10 mm/s. Relative settling is not equivalent to a stationary tool. No unresolved hold is counted as a recovered task, and no observed task failure is removed. ([Every complete attempt and paired outcome](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-11-piper-recovery-v04/receipt/report.html))

## Actual motion and computing cost

After full requested scale is restored, the first 100 ms of actual TCP motion average **159.3 and 171.1 mm/s**, compared with **67.9 and 74.1 mm/s** for the matched v0.3 controller over the same simulated intervals. This confirms increased actual movement on those recorded windows; requested scale alone would not establish it. The two final object-position errors are 4.916 and 6.027 mm, within the unchanged 25 mm task tolerance.

The successful holds still average 8.093 and 39.866 mm/s of actual tool motion over their complete 220 ms and 240 ms intervals. Immediately after the hold request, their first 100 ms average 13.476 and 60.218 mm/s. The two timed-out heavy holds average 13.708 and 11.511 mm/s over 820 ms; their first 100 ms still travel 6.190 and 5.256 mm. Holding measured targets does not erase movement.

| Measurement | Recorded result | Boundary |
| --- | ---: | --- |
| Host/runtime | macOS 26.5.2 arm64, 10 logical CPUs; Python 3.12.9, MuJoCo 3.15.0, NumPy 2.5.3; no GPU | Host load uncontrolled; one OpenBLAS/OpenMP thread each |
| Attempt wall time | 1.175–1.728 s | Setup, policy/IK, native rollout and state capture |
| Per-attempt control computation p95 | 1.087–3.181 ms | Software decision/step/snapshot boundary |
| Maximum raw computation window | 13.473 ms | All attempted placements, controls and aborts |
| Computation windows exceeding 20 ms | 0/84,000 | Descriptive result on this run |
| Whole installed command | 133.629 s for 1,680 simulated seconds | Startup, evaluation, compression, serialization and inspection included |
| Process lifetime peak RSS before inspection | 727.19 MiB | High-water mark, not per-episode allocation |
| Child lifetime peak RSS including inspection | 738.41 MiB | Wrapper child lifetime, including preceding Git children |

Unlike the previous release, v0.4 retains **all 84,000 raw per-decision computation durations**, allowing medians, p95, maxima and missed-window counts to be recomputed. Whole-command time excludes software installation, asset provisioning, browser rendering and publication. This single-host timing result does not establish that v0.4 is intrinsically faster in wall time than the previous run, whose host load and workload differed. ([Execution receipt](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-11-piper-recovery-v04/execution.json))

A target reduction is not a physical speed measurement, and requesting a hold does not instantly arrest native inertia. Task clocks use simulated seconds. Computation clocks cover the declared software boundary on one host; they do not measure physical sensing, transport or actuator delay. State observations at 20 ms do not resolve all motion between those boundaries. No universal minimum RAM or hardware real-time claim follows from this experiment.

## Reproduce and build on the evidence

The [complete confirmation archive](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-11-piper-recovery-v04/README.md) retains the original **90-file** bundle byte-for-byte: all 84 full compressed attempts, report, protocol, integrity record and model notices. Seal-listed files total **58,450,596 stored bytes** and **327,061,224 bytes with attempt JSON decoded**. Storage size is separate from runtime memory. The [GitHub confirmation archive](https://github.com/Dvidia-Inference/dvidia-training/tree/d5c1cc6adbf6566947aef6defb1bbc04207a96c4/benchmarks/piper-recovery-v04-20261011) and [local installation guide](https://github.com/Dvidia-Inference/dvidia-training/blob/3044029aa287e7aa18280d829982d38a041d7f20/docs/piper-contact-recovery-v04.md) provide the runnable source and offline inspection workflow. The [Robot Simulation Lab](https://huggingface.co/spaces/Dvidia/robot-simulation-lab) publishes the same [paired report](https://huggingface.co/spaces/Dvidia/robot-simulation-lab/resolve/be267fe5a2419e2b0d8098b5126f5f351d7df48f/tasks/piper-recovery-v04/report.html) and [complete original bundle](https://huggingface.co/spaces/Dvidia/robot-simulation-lab/tree/be267fe5a2419e2b0d8098b5126f5f351d7df48f/tasks/piper-recovery-v04) at immutable commit `be267fe5a2419e2b0d8098b5126f5f351d7df48f`. The [publication receipt](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-11-piper-recovery-v04/huggingface-publication.json) records verification of all 293 published payload files, including earlier unchanged evidence.

The [separate development archive](https://github.com/Dvidia-Inference/dvidia-training/tree/ccf8f3d1c2a1977da855ba8f601499aa543a7b6c/benchmarks/piper-recovery-development-20261011) retains 44 controller/development/regression attempts and a separate 84-attempt historical benchmark integration, including failed candidates, exact source snapshots and an inspector tuple/list repair. Twelve historical v0.3 reproductions match all original commands, native positions/velocities and task metrics. The historical integration retains 6/12 completions in each mode, while fresh confirmation has 4/12; neither archive is substituted for the other.

The sealed bundle retains every complete compressed attempt, commands, native state, protocol, outcomes, timing summaries and original model notices. Execution and publication records remain outside the original seal. Offline inspection checks bounded decompression and recorded consistency. It does not independently integrate the physics again or authenticate a publisher.

The result informs the decision component of an installable Skillspace skill: know whether the object follows, separate settling from continued loss, and preserve evidence for a bounded next action. It remains an authored controller using privileged simulator observations. It does not learn a skill from footage, identify real material properties, model deformation or damage, or qualify a physical arm.

The next acquisition experiment needs an alternative that can actually change the failed grasp: a separately declared force-command interface, different contact geometry or support-assisted manipulation. A separate candidate for the two newly exposed suspended holds is a second controlled load-bearing probe or gentler acceleration after the initial probe, tested against the unchanged retention and task criteria. Neither is implemented here; simply lowering the 6 mm resume floor after observing these failures would not be a fresh test.

The next sensing experiment needs controlled noise, latency and missing observations, with unknown states retained and measured native motion used as reference. Physical calibration is still required before transferring speed, force or safety claims.

A later [v0.5 reliability comparison](https://research.dvidia.org/papers/piper-reliability-v05/) tests a bounded second lift and fixed alternative grasp on three separately frozen fresh cohorts. It completes 23/36 placements versus 15/36 for the matched v0.4 controller, with eight gains and no losses, while shared successes take longer. Those new cohorts and their remaining failures are separate from this v0.4 result.

Original DVIDIA code and the pinned PiPER model retain their MIT terms. This research writing is CC BY 4.0 under the repository’s publication license.

*Published by DVIDIA. Contact [hello@dvidia.org](mailto:hello@dvidia.org) and follow [@iammrriver](https://x.com/iammrriver).*
