# Test contact history before abandoning a grasp

DVIDIA research · 11 October 2026 · Contact history v0.3

**History completes 6/12 placements, versus 4/12 for both original motion and probe-only motion.** The two additional completions are the 60 g, nominal-friction cases; all three modes complete both 40 g moderate-friction cases and fail the 60 g moderate-friction and all low-friction cases. All **84 planned attempts** remain numerically valid, including **48 unsuccessful negative controls**. Four history tasks resume after a closed hold and complete, but all six supported acquisition retries still fail. This is a descriptive result on synthetic rigid blocks with privileged state, not detector accuracy, a learned skill or physical robot qualification. ([Complete original report](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-11-piper-contact-v03/receipt/report.json))

## The question left by the previous guard

The [earlier grip experiment](https://research.dvidia.org/papers/piper-grip-validation-and-recovery/)
completed 2/6 guarded placements versus 4/6 original placements. At intermediate
friction, both original controllers completed while the guard aborted after
relative motion exceeded a fixed displacement limit. Both aborted blocks remained
held. This motivated two separate questions: how does the acquisition probe
change the motion, and when does responding to sliding help the task?

The v0.3 comparison preserves an original-motion baseline, adds a probe-only
ablation, and adds a controller that considers recent relative motion and contact
history before slowing, holding closed and reassessing. These are authored
controllers with privileged simulator observations. This experiment does not
learn material properties or establish a sensor-based grasp detector.

## A finite response to changing contact

All three placement modes share the unchanged native model and original task scorer. `probe_only` and `history` inherit the exact earlier acquisition check: a requested **10 mm test lift at 20 mm/s** qualifies only after a table-free object rise of at least **6 mm**, loaded bilateral pad contacts above **0.01 N**, and TCP-local offset drift no greater than **3 mm for 100 ms**. Closure and probe time out after 1.4 seconds. A supported, clear object may be opened, recentered and retried once; losing support during that retry aborts closed. Probe-only removes only the postqualification carry monitor.

History uses the inclusive past **120 ms** of object offset in the moving tool frame. A window shorter than **100 ms** remains unknown. The decision uses endpoint displacement divided by observed span, and displacement divided by summed path as a straightness measure; the recorded least-squares vector slope is a diagnostic, not an additional decision input. Relative movement of at least **2.5 mm**, rate at least **25 mm/s**, and straightness at least **0.7** for two snapshots starts an intervention. Two snapshots without bilateral contact can request closed hold directly.

An intervention first scales the original requested joint-position delta from the measured six joint positions by **0.35 for 120 ms**, then requests those measured positions with closed jaws. This is requested target scaling, not proof that actual speed immediately falls. Reassessment holds for at least **120 ms** and at most **800 ms**. A known window must keep endpoint displacement and maximum pairwise excursion within **1.5 mm**, relative rate within **8 mm/s**, loaded bilateral contact throughout, absent table support, and at least a 6 mm object rise for a sustained **100 ms** before resume. The excursion bound prevents a reversing object from appearing settled merely because its endpoint returns to its starting offset.

Resume refreshes the original motion teacher's held offset from the current recorded TCP-local object position and uses a **0.45 requested joint-delta scale** until supported arrival. The controller allows at most **two reassessment holds**; continued loss, an unsettled or unknown timeout, or exhausted reassessment budget aborts closed. A resume boundary still issues the final held command, with resumed motion beginning at the next observation. Events separately record qualification, supported retry, requested slowdown, closed reassessment, resume and abort. The full **20-second** episode budget includes every intervention.

The independent task scorer requires bilateral table-free lift of at least **60 mm for 100 ms**, retained carry, supported actual opening and release, settled destination within **25 mm for 250 ms**, and **100 mm tool retreat** without prohibited contact. From qualifying lift until still-held supported arrival, a consecutive **40 ms** loss of bilateral contact permanently disqualifies that attempt. Destination orientation is not scored. A settling or resume decision cannot erase that failure or stand in for completed placement.

Mass and friction are declared scene variables used to construct the simulator.
The contact decision does not receive their true values as observations. The
existing downstream motion policy still uses its original lift flag. Native
joint control, servo gains, force limits, collision geometry, free-object dynamics
and the independent task scorer remain fixed across modes within each scene.
An abort does not clear a task failure or end its recording early.

## Freeze the comparison before running it

The confirmation protocol reserves seed **813407**. Two fresh start/target XY
layouts recur across three friction settings (0.8, 0.55 and 0.15) and two masses
(40 g and 60 g). Each of the twelve scenes runs original placement, probe-only
placement and history-based placement, each with its own matched requested-arm
open-jaw replay, plus a shared initial-arm hold. The denominator is **84 planned
attempts**. These related synthetic scenes are descriptive evidence, not a
population reliability sample.

The source was committed before execution as [`c8868c873f075116b71d908d464890e09778726b`](https://github.com/Dvidia-Inference/dvidia-training/tree/c8868c873f075116b71d908d464890e09778726b). The frozen protocol binds eleven runtime source/lock hashes and the controller/evaluation parameters. The installed wheel matches those hashes and runs with OS process-level network denial, local pinned assets, no `PYTHONPATH` override, and one thread each for OpenBLAS and OpenMP. Every attempt retains **20 simulated seconds, 1,000 commands and 1,001 states**; physics steps at 1 ms and controller observations occur at 20 ms. Commands remain six arm targets in radians and one independent single-finger jaw slide target in metres, with both actual finger coordinates recorded. No warnings or prohibited-contact ticks were captured. ([Protocol](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-11-piper-contact-v03/receipt/protocol.json), [Execution wrapper](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-11-piper-contact-v03/execution.json))

The separate [development appendix](https://github.com/Dvidia-Inference/dvidia-training/tree/c8868c873f075116b71d908d464890e09778726b/benchmarks/piper-contact-development-20261011) retains all thirteen scripted exploratory attempts, including four unsuccessful tasks, and exact r0/r1/r2 source snapshots plus the frozen v0.2 comparator. Candidate refinements add an excursion correctness check, original target logging, and clear completed dwell bookkeeping; no threshold was retuned between candidates. The retained baseline comparison has exactly equal commands and every native `qpos`/`qvel` row. These repeated development fixtures do not increase the confirmation denominator.

## Completion and recovery are separate outcomes

| Synthetic friction | Mass | Original completed / attempted | Probe-only completed / attempted | History completed / attempted | All matched open-jaw and hold controls | Numerically valid |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 0.8 | 40 g | 2/2 | 2/2 | 2/2 | 0/8 | 14/14 |
| 0.8 | 60 g | 0/2 | 0/2 | 2/2 | 0/8 | 14/14 |
| 0.55 | 40 g | 2/2 | 2/2 | 2/2 | 0/8 | 14/14 |
| 0.55 | 60 g | 0/2 | 0/2 | 0/2 | 0/8 | 14/14 |
| 0.15 | 40 g | 0/2 | 0/2 | 0/2 | 0/8 | 14/14 |
| 0.15 | 60 g | 0/2 | 0/2 | 0/2 | 0/8 | 14/14 |
| Total | — | 4/12 | 4/12 | 6/12 | 0/48 | 84/84 |

All six history placements that qualify acquisition eventually complete. Four intervene and resume: the two 60 g nominal-friction tasks and the two 40 g moderate-friction tasks. These four tasks produce **five closed reassessments and five resume events**; the second nominal 60 g layout needs two holds. No resumed task fails in this cohort. The two 40 g nominal-friction history tasks complete without a carry intervention.

The independent recorded-state evaluation finds loaded, unsupported contact in all five pre-resume windows. Only **four of five** meet its separate absolute TCP peak-speed limit of 10 mm/s. The first resume in the second 60 g nominal layout exceeds that criterion and later needs another hold. Relative settling is the controller's hypothesis; a small tool-relative change does not necessarily mean low absolute tool speed.

The 60 g nominal baseline in layout 0 never sustains the required full lift, reaching 30.75 mm; its probe-only counterpart reaches 34.04 mm. In layout 1, the original controller reaches a qualifying lift but later loses retention, while probe-only never qualifies the full lift. Probe-only and history have exactly equal native states and commands until the first history intervention at 11.920 and 11.900 seconds. Both history versions retain carry and finish at 18.431 and 18.693 simulated seconds. This matched comparison supports a benefit from the complete history-mode configuration on these fixtures. It does not isolate whether target scaling, the pause, offset refresh, or their combination causes the extra completions.

At moderate friction with a 40 g block, all three modes complete 2/2. History takes 18.308–18.354 seconds, versus 15.451–15.471 for probe-only and 14.911–14.951 for original motion: **2.837 and 2.903 additional simulated seconds** versus its paired probe-only trials, without adding a completion. At nominal friction with a 40 g block, history and probe-only have the same first-success times; their common probe adds about 0.58 seconds over the baseline. These task clocks are separate from CPU wall time. Each new mode has six supported open/recenter retries across the heavier moderate-friction and low-friction scenes; **none of those retries qualifies acquisition or completes**. A performed retry is not a demonstrated repair.

All six acquisition-qualification decisions in each new mode have a later independent following window, but two probe-only tasks still fail. Four of the five history holds have no preceding sampled following-loss opportunity. The remaining 0.4-second delay is measured against that proxy loss, not physical slip onset or sensor-to-actuator reaction latency. There is no basis for calling the other holds false positives or assigning perfect slip-detection accuracy: the independent height/following proxy is not a complete true-slip label, and interventions change subsequent motion. ([Every attempt and independent sampled evaluation](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-11-piper-contact-v03/receipt/report.html))

A controller's settling/slip hypothesis is distinct from independent recorded
motion and task success. A resume event alone does not demonstrate successful
recovery. Likewise, falling below a following-height threshold does not by itself
mean an object was dropped: contact, support, motion and subsequent task outcome
must remain visible. The original native success criteria are unchanged.

## Actual motion and runtime

The report measures actual 100 ms windows around every intervention and retains the full recorded intervention interval. Two requested slowdown stages end early when bilateral contact is lost, after **80 ms and 20 ms**; their 100 ms after-windows include the subsequent hold. During the actual reduced-target intervals, mean TCP speeds are **98.44 and 143.33 mm/s**, compared with **93.13 and 93.41 mm/s** in the preceding 100 ms: speed initially increases despite the requested reduction. Whole-window reductions cannot be attributed entirely to target scaling.

Across five closed holds, actual mean TCP speed over the whole held interval ranges from **7.211 to 20.503 mm/s**. The first 100 ms after each hold request still average **11.248–33.074 mm/s**. Tool movement continues; this is not instantaneous arrest. The archived development fixture also shows acceleration immediately after a reduced target request, underscoring the difference between commanded deltas and physical velocity.

| Measurement | Recorded result | Boundary |
| --- | ---: | --- |
| Hardware/runtime | macOS 26.5.2 arm64, 10 logical CPUs, Python 3.12.9, MuJoCo 3.15.0, NumPy 2.5.3; no GPU | One host, uncontrolled host load; OpenBLAS/OMP each one thread |
| Attempt wall time | 1.269–5.017 s | Setup and native rollout, including policy/IK/state capture |
| Per-attempt computation p95 | 1.369–8.316 ms | Decision-to-native-step/state-snapshot computation; no physical sensing or actuation |
| Worst computation boundary | 225.096 ms | The outlier remains in the record |
| Missed 20 ms computation windows | 75/84,000 | All attempts, controls and aborts |
| Whole installed command | 213.620 s | Startup, attempts, evaluation, compression, serialization and final inspection |
| Process lifetime RSS before inspection | 770.80 MiB | High-water mark, not per-episode or minimum RAM |
| Child lifetime RSS including inspection | 770.80 MiB | Wrapper high-water mark; preceding Git child also belongs to child lifetime |

The source and complete report retain every attempt’s timing summaries, maxima and deadline-miss counts. They do not contain a raw per-decision wall-timing series. Computation percentiles do not establish real-time sensor-to-actuator behavior. Whole-command timing excludes wheel installation, asset provisioning, browser rendering and publication. ([Runtime receipt](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-11-piper-contact-v03/receipt/report.json), [Execution boundary](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-11-piper-contact-v03/execution.json))

Requested slowdown and hold commands do not directly determine actual velocity.
The simulator retains native inertia and rate limiting. Measurements taken at
20 ms observation boundaries do not resolve motion between those boundaries.
CPU computation timing does not measure sensing, transport or physical actuator
latency, and peak process memory is not a universal minimum RAM requirement.

## Complete evidence and the next test

The [complete local receipt](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-11-piper-contact-v03/README.md) preserves all **90 original bundle files** byte-for-byte, including all 84 complete compressed attempts and upstream MIT notices. Seal-listed files total **55,578,406 stored bytes** and **300,141,159 bytes with attempt JSON decoded**; storage is separate from runtime memory. The [public Robot Simulation Lab](https://huggingface.co/spaces/Dvidia/robot-simulation-lab) supplies the same [paired report](https://huggingface.co/spaces/Dvidia/robot-simulation-lab/resolve/a6bf57fd64e61486dafaa93fd96168f953ccff80/tasks/piper-contact-v03/report.html) and [full hosted original bundle](https://huggingface.co/spaces/Dvidia/robot-simulation-lab/tree/a6bf57fd64e61486dafaa93fd96168f953ccff80/tasks/piper-contact-v03). The [published confirmation archive](https://github.com/Dvidia-Inference/dvidia-training/tree/2a5fceaea8c2c7eeae808ea6656233d2a7f433fe/benchmarks/piper-contact-v03-20261011) and [pinned local guide](https://github.com/Dvidia-Inference/dvidia-training/blob/2a5fceaea8c2c7eeae808ea6656233d2a7f433fe/docs/piper-contact-memory-v03.md) provide installation and offline inspection instructions without native simulation or network access.

The complete original bundle retains every compressed native state/command
trajectory, protocol, outcome, per-attempt timing summaries/maxima/miss counts, integrity record and MIT model
notice. Additional execution and publication records live outside the original
seal. Inspection checks bounded decompression and recorded consistency; it does
not independently rerun physics or authenticate the publisher.

The next useful comparison isolates the history controller's components on another preregistered cohort: a fixed slow-carry ablation, hold/reassessment without offset refresh, and the complete adaptive version. Preserve the same task scorer and every control/failure. Introduce a separately declared, genuinely repairable initial grasp misalignment to test whether the supported open/recenter retry can qualify and complete; the present six failed retries establish no successful acquisition repair.

Then test bounded observation noise, delays and missing contact/pose samples against native truth, retaining unknown windows and actual post-intervention motion. Those experiments can measure decision robustness and sensor requirements. A calibrated physical arm trial is still needed before a real-world speed, force, safety or transfer claim. Frozen v0.3 confirmation cases must remain evaluation evidence rather than become a new tuning set presented as confirmation.

This is one decision component toward an installable Skillspace skill. Future
training needs synchronized footage, issued commands, robot response, calibrated
contact observations and complete outcomes. Measured compliance, damage behavior,
noisy or delayed sensors and physical robot qualification remain separate work.
Original DVIDIA code and the pinned PiPER model retain their MIT terms; research
writing follows this repository's publication license.

*Published by DVIDIA. Contact [hello@dvidia.org](mailto:hello@dvidia.org) and follow
[@iammrriver](https://x.com/iammrriver).*
