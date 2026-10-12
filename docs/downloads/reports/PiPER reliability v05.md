# Earn more complete placements with a second lift and a different grasp

DVIDIA research · 12 October 2026 · Placement reliability v0.5

**The revised grasp completes 23/36 placements, compared with 15/36 for frozen v0.4 and 18/36 with the second lift alone.** Across three fresh cohorts, it gains eight completions and loses none, reducing failed placements from 21 to 13 in this narrow synthetic comparison. All **252 attempts** are numerically valid; all **144 negative controls fail**, with no solver warnings or prohibited native contact ticks. The fifteen shared successes take **0.772 simulated seconds longer on average** with the revised grasp. Twelve low-friction acquisitions and one carry-retention failure remain. This is a measured completion improvement with a task-speed tradeoff, not learned competence or physical qualification. ([Complete aggregate evidence](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/analysis.json))

The previous [v0.4 recovery experiment](https://research.dvidia.org/papers/piper-contact-recovery-v04/) made two recovered tasks finish sooner but did not complete more placements. Its failures exposed two different problems: a held object could settle below the original resume-height gate, or a supported object could never follow the initial pinch. Faster refusal did not solve either placement. Version 0.5 tests a separate response to each mechanism and measures the entire task again.

## Two changes, one unchanged physical task

The first candidate adds **one bounded second lift** when a postqualification hold is loaded, unsupported and relatively settled, yet remains below the original 6 mm resume floor. The second candidate also uses **one fixed alternative grasp**. It does not search for an angle from the scene's hidden material parameters. The −45° yaw and planning limits are chosen during development and frozen before confirmation.

| Mode | Acquisition and carry behavior | Purpose |
| --- | --- | --- |
| `recovery` | Frozen v0.4 grip test, contact history, settling hold and speed restoration | Matched reference |
| `reacquire` | v0.4 plus one bounded second lift for an eligible low hold | Isolate the new recovery response |
| `reacquire_grasp` | Second-lift controller plus fixed −45° downward grasp and bounded pose-planning change | Measure the alternative grasp's additional effect |

Every mode uses the same pinned PiPER model, collision geometry, free rigid block, gravity, position servos, gains, force limits, command units and target-rate limits. Physics advances every 1 ms; observations and commands occur every 20 ms. Each attempt retains the full 20-second budget, including failed probes, refusals, recovery and holding after abort. Nothing attaches the object to the gripper or resets its pose during a rollout.

The independent task criteria remain unchanged: bilateral unsupported lift of at least 60 mm for 100 ms, retained carry, supported destination within 25 mm, actual opening and release, settled destination dwell for 250 ms and 100 mm tool retreat, with no prohibited contacts. The existing 40 ms post-lift bilateral-contact-loss latch is permanent for that attempt. A newly qualified probe, resumed movement or object landing in the target cannot erase it.

### Re-test a held object without weakening the resume gate

The new probe can start only inside an existing postqualification settling hold. The controller requires the original known contact-history window, loaded bilateral contacts throughout, absent table support, endpoint displacement and maximum relative excursion no greater than 1.5 mm, and relative rate no greater than 8 mm/s. After at least 120 ms of holding, that evidence must remain low and stable for another 100 ms. Object rise must be at least 1 mm but still below the original 6 mm resume floor.

The jaw remains closed. From the measured tool pose, the controller requests a vertical rise of at most 8 mm at 10 mm/s with the measured orientation held fixed. Only one second probe is allowed, with a 1.2-second budget that includes qualification. A moving request is not a measured movement: resumption additionally requires at least 4 mm of observed tool rise from the second-probe origin, the original 6 mm object rise from initial acquisition, and 100 ms of the original loaded relative-settling evidence. The task's independent 60 mm lift criterion is unchanged.

Unknown history, an unloaded or lost pad, renewed table support, prohibited contact, relative drift above 3 mm, persistent original slip trend or timeout causes a closed hold and abort. Support returning during the second probe cannot bypass the probe into normal release. The timeout is checked before accepting qualification; a favorable observation after the budget cannot rescue the attempt. A successful probe refreshes the measured relative object offset and resumes the original v0.4 reduced movement and restoration sequence.

### Change the grip geometry while preserving the servo

The fixed grasp candidate rotates the downward grasp target −45° about the world vertical axis. Initial approach and carry retain the original yaw. Only pose commands change: a read-through policy view preserves the real environment configuration, native model and state. The same view supplies bounded differential inverse kinematics. Its orientation-error bound is 0.10 rad when the requested quaternion matches the downward grasp target; all other target orientations keep the original 0.05 rad bound. The 15 mm translation-error bound, 0.06 rad joint-delta bound, damping and original native command limits remain unchanged.

A diagonal pinch can leave the position-controlled jaws farther apart against the block, changing the observed pad forces even though the closing request, gains and force caps are unchanged. It must still earn acquisition, full lift, retention and completed placement through native contact. It is not a force-cap increase, an inferred material property or evidence about the real PiPER's maximum grip strength.

The candidate uses current recorded poses and contacts. It does not choose its grasp using mass, friction, a future observation or task outcome. The inherited authored motion teacher still reads the original native `lift_seen` flag; this privileged input is now recorded at every control boundary and disclosed in the replay audit. This is authored simulator control, not a learned or deployable camera-to-action policy.

## Separate development from fresh confirmation

Development retains **200 native attempts in separate groups**: 76 grasp alternatives, 40 second-lift controller experiments, 24 original-mode regressions and one 60-attempt known-scene benchmark integration. These groups are not pooled with fresh confirmation. Exact source snapshots preserve rejected and unsuccessful alternatives; none is silently replaced by a later source version.

The 76 grasp attempts include a useful negative lesson. Raising the orientation-planning bound to 0.20 rad caused prohibited contacts in discarded candidates. Keeping diagonal yaw throughout carry also failed to improve the difficult pair. The selected 0.10 rad downward-target change therefore follows recorded development evidence rather than a general claim that stronger or faster planning is better.

On the two known cohorts, the selected full candidate completes 7/12 versus v0.4's 4/12 for seed 941827, and 8/12 versus 6/12 for seed 813407. It loses no prior success and records no prohibited contact or solver warning in those 24 final development attempts. However, common successes are **0.841 and 0.7335 simulated seconds slower on average**, respectively. None of those full-candidate development scenes starts a second probe: the added completions there concern the fixed grasp and planning change, not evidence that the second probe contributed. One moderate-friction/heavy placement and every low-friction placement remain unsuccessful in the newer cohort.

All three fresh seeds—**832847, 227037 and 862186**—are reserved before execution. Runtime [`e76b2e41256604d5b4314e45ca45959cab9aa571`](https://github.com/Dvidia-Inference/dvidia-training/tree/e76b2e41256604d5b4314e45ca45959cab9aa571) and the three preregistered protocols are committed first. A wheel built from that source archive matches all sixteen installed runtime/lock hashes. Every emitted protocol exactly matches its preregistered JSON values; formatting differs, so the original file hashes are retained separately. Each installed command runs with OS process-level network denial, an `EPERM` socket self-check, local pinned assets and one OpenBLAS/OpenMP thread each. No outcome-triggered substitute rerun is used. ([Installed runtime check](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/installed-runtime.json), [Execution receipts](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/README.md))

Each confirmation cohort has two new start/target XY layouts repeated across three friction values, 0.8, 0.55 and 0.15, and two masses, 40 g and 60 g. Twelve scenes run the three placement modes, three own-tape open-jaw replays and one shared initial-arm hold: seven variants and 84 attempts per cohort. Three separately reserved cohorts therefore plan **252 attempts**, including **108 placements and 144 negative controls**. The source, thresholds, scorer, modes and evaluation are frozen before any confirmation result, with no tuning between cohorts.

The six independently drawn layout pairs across three cohorts provide a narrow test of this synthetic distribution. The friction/mass variants share layouts, and repeated deterministic rollouts are not independent physical trials. These counts do not support a real-world reliability probability or an IID confidence interval.

## Complete placement outcomes

| Fresh cohort | Frozen v0.4 | Second lift only | Revised grasp + second lift | Matched controls | Valid attempts |
| --- | ---: | ---: | ---: | ---: | ---: |
| 832847 | 4/12 | 6/12 | 7/12 | 0/48 | 84/84 |
| 227037 | 6/12 | 6/12 | 8/12 | 0/48 | 84/84 |
| 862186 | 5/12 | 6/12 | 8/12 | 0/48 | 84/84 |
| Total | 15/36 | 18/36 | 23/36 | 0/144 | 252/252 |

| Synthetic friction | Mass | Frozen v0.4 | Second lift only | Revised grasp + second lift |
| --- | ---: | ---: | ---: | ---: |
| 0.8 | 40 g | 6/6 | 6/6 | 6/6 |
| 0.8 | 60 g | 3/6 | 6/6 | 6/6 |
| 0.55 | 40 g | 6/6 | 6/6 | 6/6 |
| 0.55 | 60 g | 0/6 | 0/6 | 5/6 |
| 0.15 | 40 g | 0/6 | 0/6 | 0/6 |
| 0.15 | 60 g | 0/6 | 0/6 | 0/6 |

The second-lift candidate gains three nominal-friction 60 g completions and loses none. All fifteen common successful task clocks are unchanged; its three new successes finish at 16.903, 17.043 and 17.050 simulated seconds. It leaves the eighteen acquisition failures unchanged.

The full candidate gains eight placements against v0.4, including those three nominal-friction cases and five moderate-friction 60 g cases. All fifteen common successes are slower by **0.417–1.050 seconds**, averaging **+0.772 seconds**. Compared with second lift alone, it gains five placements and loses none; the eighteen common successes average +0.578 seconds. A faster or slower subset is not substituted for the full completion denominator.

All twelve low-friction full-candidate attempts still fail to qualify acquisition. The remaining failure is cohort 832847, friction 0.55, mass 60 g, layout 1. It reaches **86.46 mm** lift and resumes once, then slips later in carry. A second settling hold begins at 15.12 seconds and aborts at **15.94 seconds**; the object falls about **80.55 mm** over that interval. At the end, the block is only **19.88 mm from the target**, but retained carry never completes and its retention-loss latch remains set. It is correctly retained as a failed task. Landing near the target does not replace controlled placement and release. ([Exact failed attempt](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/receipts/832847/attempts/friction055-mass060-layout01--reacquire_grasp_placement.json.gz))

## Recovery decisions and actual motion

All **three second probes** occur in the lift-only candidate. Each qualifies after **0.860 seconds** and subsequently completes its placement. Every sampled probe state remains loaded bilaterally and unsupported. Actual tool rise is **4.921–4.966 mm**, while object rise during the probe is **4.703–4.753 mm**. The final object height relative to the original acquisition origin is **9.589–9.804 mm**, so the unchanged 6 mm resume gate is earned again. Maximum sampled relative drift is below 0.199 mm.

The maximum requested rise is 8 mm, but the native servo does not track that request instantaneously. Sampled peak tool speeds during these probes are **10.485–10.797 mm/s** despite the 10 mm/s target progression. The complete recovery intervals last **1.140–1.160 seconds** and include active lifting; describing them as entirely stationary holds would be inaccurate. A later hold event in one successful episode has no explicit resume event before supported arrival, and remains an unresolved event interval in the receipt rather than being silently reclassified.

The full candidate starts **no second probes** in these fresh cohorts. Its greater completion count therefore demonstrates the alternative grasp/planning path here, not a contribution from an unused recovery branch. It still has one resumed task that later fails, preserving the distinction between recovering once and finishing the task.

Maximum observed pad normal forces across placements are **1.261 N for v0.4, 3.872 N for second lift alone and 1.448 N for the revised grasp**. The second-lift force peak is higher even though its completion count improves. These uncalibrated simulated contact peaks are diagnostics, not damage limits or evidence that stronger squeezing is safe. ([All motion, force and recovery intervals](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/analysis.json))

A completed placement, successful probe and resumption remain separate measurements. A requested hold does not remove native inertia, and a requested speed bound does not establish actual tool speed. The receipts retain tool/object motion, relative history, contact loss, pad forces, actual commands and unresolved recovery. Nothing labels the controller's own decision as physical task success.

## Computing cost and offline execution

The three offline commands run on macOS 26.5.2 arm64 with ten logical CPUs, Python 3.12.9, MuJoCo 3.15.0 and NumPy 2.5.3. No GPU is used. All **252,000 raw computation durations** remain available, including every overrun.

| Measurement | Recorded result | Boundary |
| --- | ---: | --- |
| Whole installed commands | 964.796 wall seconds for 5,040 simulated seconds | Startup, rollout, reporting, compression and both inspection layers |
| Pooled computation p50 / p95 / p99 | 1.813 / 7.453 / 14.050 ms | All modes, controls and attempts |
| Maximum computation window | 3,082.138 ms | Single retained software window |
| Windows exceeding 20 ms | 1,035 / 252,000 (0.411%) | No dropped outliers |
| Worst individual-attempt p95 | 42.947 ms | Pooled percentiles conceal difficult intervals |
| Peak process RSS before inspection | 738.52 MiB | Maximum process-lifetime high-water mark |
| Peak child lifetime RSS including inspection | 816.27 MiB | Wrapper child lifetime, including preceding Git children |

The host was heavily loaded. One snapshot records a one-minute load average of 23.30 and 9,409.38 MiB of swap in use. This supplies contention context; it does not attribute each delay to a particular cause. The three whole-command durations are **568.949, 218.985 and 176.862 seconds**. Their variation, and the retained three-second outlier, prevent an isolated-host speed or physical real-time guarantee. A low pooled p95 does not make the long delays disappear. ([Host-load snapshot](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/host-load.json), [Per-mode and per-attempt timings](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/analysis.json))

Computation durations cover the declared software decision, physics and state-recording boundary on this host. Whole-command time additionally includes preparation, result compression, report generation and both inspection layers. Rendering, training, physical sensing, transport and actuator latency are outside this measurement. Peak resident memory is a process-lifetime high-water mark, not the software's minimum RAM requirement. Host load is uncontrolled; comparing these times with a previous release on a different run does not isolate an implementation speedup.

## Reproduce, inspect and build on the result

The [complete local evidence archive](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/README.md) contains three original 90-file sealed bundles, copied byte-for-byte: **270 files and 178,935,621 stored bytes**. With compressed attempt JSON decoded, seal-listed contents total **1,022,818,422 bytes**. Storage size is distinct from runtime memory.

- **832847:** [Report](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/receipts/832847/report.html) · [JSON](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/receipts/832847/report.json) · [Protocol](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/receipts/832847/protocol.json) · [Seal](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/receipts/832847/integrity.json)
- **227037:** [Report](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/receipts/227037/report.html) · [JSON](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/receipts/227037/report.json) · [Protocol](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/receipts/227037/protocol.json) · [Seal](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/receipts/227037/integrity.json)
- **862186:** [Report](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/receipts/862186/report.html) · [JSON](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/receipts/862186/report.json) · [Protocol](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/receipts/862186/protocol.json) · [Seal](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/receipts/862186/integrity.json)

The [frozen controller source](https://github.com/Dvidia-Inference/dvidia-training/tree/e76b2e41256604d5b4314e45ca45959cab9aa571) and [separate 200-attempt development archive](https://github.com/Dvidia-Inference/dvidia-training/tree/e76b2e41256604d5b4314e45ca45959cab9aa571/benchmarks/piper-reliability-development-20261011) retain the method and rejected alternatives. The [GitHub results archive](https://github.com/Dvidia-Inference/dvidia-training/tree/0545ac47aedcd7c197341986533aa3e74c263ac6/benchmarks/piper-reliability-v05-20261012) and [installation and reproduction guide](https://github.com/Dvidia-Inference/dvidia-training/blob/0545ac47aedcd7c197341986533aa3e74c263ac6/docs/piper-reliability-v05.md) are pinned to the subsequent results commit; [pull request #15](https://github.com/Dvidia-Inference/dvidia-training/pull/15) collects the proposed release for review.

The [Robot Simulation Lab](https://huggingface.co/spaces/Dvidia/robot-simulation-lab) publishes all three [complete original bundles](https://huggingface.co/spaces/Dvidia/robot-simulation-lab/tree/d10b2c8a3b2484600585c16f897befc1ff0374b0/tasks/piper-reliability-v05) at immutable Hugging Face commit `d10b2c8a3b2484600585c16f897befc1ff0374b0`. Each cohort has its own report: [832847](https://huggingface.co/spaces/Dvidia/robot-simulation-lab/resolve/d10b2c8a3b2484600585c16f897befc1ff0374b0/tasks/piper-reliability-v05/confirmation-832847/report.html), [227037](https://huggingface.co/spaces/Dvidia/robot-simulation-lab/resolve/d10b2c8a3b2484600585c16f897befc1ff0374b0/tasks/piper-reliability-v05/confirmation-227037/report.html) and [862186](https://huggingface.co/spaces/Dvidia/robot-simulation-lab/resolve/d10b2c8a3b2484600585c16f897befc1ff0374b0/tasks/piper-reliability-v05/confirmation-862186/report.html). The [publication receipt](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/huggingface-publication.json) records completed readback verification of **all 563 payload files**, including unchanged earlier evidence.

The [GitHub validation receipt](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/github-validation.json) records all 28 passing push and pull-request checks for code/results commit `0545ac47aedcd7c197341986533aa3e74c263ac6`. That snapshot is scoped to this exact head; later publication-only commits require their own checks.

The portable inspector checks bounded decompression, sealed inventory, source/model/config identities, original native task evidence, own-tape controls, retained failures, every raw computation duration and explicit second-probe prerequisites and budgets. A separate asset-backed audit reconstructs the frozen authored policy and inverse kinematics at every recorded native state. It checks the complete issued command and diagnostic/event history. These checks validate recorded consistency; they do not reintegrate a native trajectory, authenticate its publisher or establish physical contact accuracy.

All complete compressed attempts, commands, native states, task outcomes, timing samples and original model notices remain in the sealed receipts. Execution and publication records sit outside those original seals. Development remains a separate archive and must not be added to the confirmation denominator.

The result advances one part of the installable Skillspace vision: a skill needs a measured initiation condition, a known compatible arm and gripper, a bounded recovery policy and evidence that it completes the whole task. A video label, geometry guess or successful short test lift alone is not an installed skill. This release does not learn from shoe-organizing footage, identify deformable material behavior, calibrate tactile sensors or qualify a physical arm.

The next contact experiment should target the remaining retention failure with a separately frozen acceleration or transport-path change, measured against these exact controls. The low-friction acquisitions need a geometrically different grasp, support-assisted manipulation or an explicitly separate contact/interface model; the present evidence does not justify repeating the same pinch faster. Any changed force cap, friction or geometry must be declared as a new physical comparison.

The next runtime experiment should repeat a preregistered workload on an isolated host and exercise scheduling delays explicitly, without replacing this loaded-host result. Sensor noise, stale observations, calibrated contacts, deformation and real actuator feedback require separate models and hardware evidence before a skill can earn a physical release.

Original DVIDIA code and the pinned PiPER model retain their MIT terms. This research writing is CC BY 4.0 under the repository's publication license.

*Published by DVIDIA. Contact [hello@dvidia.org](mailto:hello@dvidia.org) and follow [@iammrriver](https://x.com/iammrriver).*
