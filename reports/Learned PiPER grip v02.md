# Learning the Grip While Keeping PiPER Arm References Fixed

**DVIDIA Research** · Research v0.2 · 27 October 2026

Contact: [hello@dvidia.org](mailto:hello@dvidia.org) · [DVIDIA](https://dvidia.org) · [X: @iammrriver](https://x.com/iammrriver)

## Abstract

This study investigates learned grip feedback around the [first PiPER placement primitive](https://research.dvidia.org/papers/learned-piper-placement-v01/). Five candidates that learned all seven command residuals completed none of their 16 development cases. We preserved those attempts and opened a separate study for a restricted model: a compact classification tree that learns the jaw command while leaving all six arm references to the frozen movement model. The selected 25-node tree uses 64 synthetic teacher episodes and 64,000 causal jaw labels. On frozen confirmation it completed 6/24 cases, versus 8/24 for a matched blind tree, 5/24 for the unchanged feedforward model, 24/24 for the authored teacher and 0/24 for open jaws. The full adapter completed none of the 12 jaw-interruption cases. All 120 confirmation attempts were valid, and an independent numeric audit reconstructed 360 parent, development and confirmation records. These results do not demonstrate a live-feedback advantage, recovered grip or physical transfer.

## Question and study lineage

The earlier primitive could bring the block near its destination without reliably completing a retained lift and placement. The next question is whether recent grip measurements help a learned controller complete the whole manipulation sequence. The target remains a 40 g rigid block, a pinned simulated PiPER arm and coupled jaw, one friction/geometry configuration, two trained destinations and a 30 × 30 mm starting region. It is not a shoe-manipulation or human-video-learning benchmark.

The new starting positions differ from every training, development and confirmation start in v0.1. Whole initial XY groups remain together: training has 16 starts × two goals × two conditions, development has four starts × two goals × two conditions, and confirmation has six starts × two goals × two conditions. The two conditions are nominal control and an imposed jaw-actuator interruption. Its literal schedule is derived from the frozen reference's closing transition, with distinct training, development and confirmation offsets. Every variant receives the same schedule for a case.

The disturbance imposes a minimum jaw target and preserves the original actuator rate limit, including a closing tail after the pulse. It changes neither object pose nor force directly. A scheduled disturbance does not establish that contact actually disappeared. Actual loaded contact loss, restoration and object motion are measured separately. The policy receives no pulse schedule, condition label or intervention identifier.

The [measured pulse-exposure diagnostic](../topics/physical-grounding/runs/2026-10-27-learned-piper-grip-v02/docs/pulse-exposure.json) confirms an additional applied jaw-target effect in 10/12 full-adapter cases, 12/12 blind cases, 12/12 feedforward cases, 10/12 teacher cases and 0/12 open-jaw controls. The remaining full/teacher cases were already open. Every first effective change occurred while the object was table-supported. Neither the full adapter nor teacher had established 20 ms of loaded grip before that first effect; only the feedforward comparator had done so in six interrupted cases. This is principally an acquisition intervention. It does not provide twelve verified post-grasp slip/recovery trials.

The first feedback study retains all 64 teacher episodes, one 32-episode mixed-policy collection round and five unsuccessful development candidates. The jaw-only study imports that history under a separate protocol and source lineage. It fits only the original 64 teacher episodes; mixed-policy data and parent development attempts remain visible and are excluded from the jaw fit. No new teacher physics is collected. All 64 collected teacher attempts succeeded strictly. The collection contract retains every finite prefix, including unsuccessful ones when they occur; no teacher failure was filtered from this collection. Development cases were reused adaptively after the earlier failures and serve only as tuning evidence. Confirmation remains separate until selected models, protocol and runtime hashes are frozen.

## Why a small supervised error was insufficient

The initial architecture predicted six joint-target residuals and a jaw residual from 183 current/history features. Its NumPy ridge models combined linear terms with random Fourier features. Two candidates used 64,000 teacher labels; two used the combined 96,000 teacher/mixed-policy labels. A fifth combined-data candidate reduced capacity and increased regularization. Every candidate completed 0/16 development cases.

| Earlier residual candidate | Training labels | Development successes |
|---|---:|---:|
| Teacher-only, 256 Fourier features | 64,000 | 0 / 16 |
| Teacher-only, 512 Fourier features | 64,000 | 0 / 16 |
| Mixed-policy data, 256 Fourier features | 96,000 | 0 / 16 |
| Mixed-policy data, 512 Fourier features | 96,000 | 0 / 16 |
| Mixed-policy data, 128 features, ridge 100 | 96,000 | 0 / 16 |

Recorded development trajectories show substantial arm departures before grip acquisition, despite relatively small supervised errors on teacher states. Local sensitivity checks suggested strong responses to correlated joint, tool-pose and previous actuator-control measurements. This is diagnostic evidence of an unstable learned feedback mapping outside its demonstration states, rather than a formal stability proof or an exhaustive causal explanation. Increasing capacity or lowering a one-step fit error did not establish a useful controller.

We therefore narrowed the learned decision. The new adapter cannot independently steer six joints. The original `MotorPrimitivePolicy` still computes all six arm targets from its frozen references and generic native command caps; the adapter returns those targets unchanged for the same observation. Physical motion can still differ through contact and servo dynamics. Only the absolute jaw command is learned.

## A restricted learned jaw

The adapter is a deterministic weighted binary NumPy classification tree. It chooses a jaw target of 0 or 0.035 m from synthetic expert labels. These values are a single slide command, not the measured full finger gap. Tree training uses no additional ML framework or model service. At inference there is no teacher, inverse kinematics, authored task phase, success flag or future frame.

Its 56-feature contract contains reset XY, the known goal, physical episode time, the frozen nominal jaw reference, lag ages and three grip snapshots: current, 40 ms-old and 120 ms-old. Grip snapshots contain object position relative to the tool, destination relative to the object, object linear velocity, measured finger positions, pad normal forces, finger contacts and table support. Joint positions, joint velocities, absolute tool pose and actuator controls are excluded from the learned features. These remain privileged native simulator measurements, not a deployable camera or tactile sensor stack.

The matched blind control has the same feature dimensions, tree training recipe, teacher episodes and sample weights, with all live/current-history slots zeroed. Fixed context, the original jaw reference and time remain available. Different learned tree sizes are permitted under the same capacity limit; matching the recipe does not force identical trees.

Depth-three, depth-four and depth-six full-sensing candidates completed 3/16, 4/16 and 4/16 development cases. We selected the smaller tied depth-four tree: 25 nodes instead of 41. The maximum bin count was 31 and the minimum leaf size was 64 samples. Its JSON document was 23,183 bytes, including provenance. Reading the preserved teacher evidence, encoding features and fitting took 19.55 seconds on the shared local CPU. This is not video-processing time or a hardware minimum.

The selected tree misclassified 69 of 64,000 training jaw labels, yet completed only four development tasks. Its blind control completed five. Low label error therefore remains distinct from successful closed-loop manipulation, and the development comparison gives no evidence that live grip feedback improves success.

## Frozen confirmation and physical completion

Confirmation comprised 24 cases × five variants, interleaved by case, with 12 nominal and 12 jaw-interruption cases per variant. The selected jaw adapter, matched blind adapter, unchanged feedforward policy, authored teacher and open-jaw control used the same native environment and strict endpoint. All 120 attempts were valid. The full adapter completed 6/24, while the blind adapter completed 8/24.

| Variant | Nominal | Jaw interruption | All strict successes |
|---|---:|---:|---:|
| Learned jaw adapter | 6 / 12 | 0 / 12 | 6 / 24 |
| Matched blind jaw adapter | 7 / 12 | 1 / 12 | 8 / 24 |
| Unchanged feedforward policy | 4 / 12 | 1 / 12 | 5 / 24 |
| Authored teacher | 12 / 12 | 12 / 12 | 24 / 24 |
| Frozen arm references, jaw held open | 0 / 12 | 0 / 12 | 0 / 24 |

The paired comparison is especially informative: six cases succeeded with both full and blind adapters, none succeeded with the full adapter alone, two succeeded with the blind adapter alone, and sixteen failed with both. Against the unchanged feedforward model, the full adapter gained two successful cases and lost one. This small result does not establish a reliable improvement, and the blind comparison provides no demonstrated benefit from live grip measurements. The authored teacher's 24/24 shows these fixed cases were achievable by its state-dependent controller; it does not qualify that controller for hardware.

The primary endpoint remains the original native task criterion: a bilateral lift of at least 6 cm sustained for 100 ms; carrying without a contact-loss gap reaching 40 ms before supported destination contact; release; settling within 25 mm for 250 ms; 10 cm tool retreat; and no unintended contacts. A correct final position is reported separately and cannot erase a failed lift or retention history.

Numeric sidecars record every 1 ms native tick and are checked against the 20 ms control observations. A separate scorer reconstructs the task gates and sustained loaded-contact interruptions. Restoring loaded contact for 100 ms after a measured loss is a diagnostic, not proof of a recovered placement, an airborne regrasp or a physical tactile response. The continuous adapter has no discrete alarm output, so an alarm false-positive rate is not applicable.

The full adapter passed terminal-only checks in 14/24 cases but passed strict manipulation in only six. Fourteen cases established a lift and supported carry; ten did not establish the qualifying lift. Twelve cases recorded unintended-contact ticks. These categories overlap. The [named contact-pair reconstruction](../topics/physical-grounding/runs/2026-10-27-learned-piper-grip-v02/docs/failure-analysis.json) attributes every critical pair in those twelve cases to finger–table contact: the left finger appears in ten cases, the right in ten, and both in eight. Pair counters represent native ticks above 0.01 N normal force and can overlap; they are not independent collision-event counts or calibrated hardware forces.

No full-adapter attempt latched carry-retention loss, but that alone cannot establish recovery: its two detected loaded-contact interruptions occurred while supported and neither qualified as restored. No full-adapter airborne loss or restored event was recorded, so a recovery-latency distribution cannot be estimated.

The [independent audit](../topics/physical-grounding/runs/2026-10-27-learned-piper-grip-v02/audit.json) checked 2,317 artifact records and reconstructed 360 attempts: 64 parent teacher episodes, 32 mixed-policy episodes, 80 earlier residual-development attempts, 64 jaw/blind development attempts and 120 confirmation attempts. It found no native-metric mismatch. This verifies saved identity, source, roster and numeric-score consistency; it neither reruns physics nor authenticates hardware sensing. The earlier negative experiments remain part of the result.

## CPU timing

Across the selected full adapter's 24,000 confirmation calls, pooled recorded inference was 0.187 ms median, 0.501 ms p95 and 1.045 ms p99, with a 34.329 ms maximum. Whole control steps, including native physics and dense telemetry, were 2.167 ms median, 5.648 ms p95 and 10.734 ms p99, with a 117.567 ms maximum. Thirty-four of 24,000 full steps exceeded the 20 ms compute budget. These are recorded shared-host CPU measurements, not hard real-time bounds or physical reaction latency.

Each confirmation episode simulated 20 seconds. Full-adapter wall time was 2.723 seconds median and 4.795 seconds p95, with a 10.084-second maximum. The recorded process peak RSS was 747,274,240 bytes, a cumulative process high-water mark rather than a model memory minimum. Camera capture, transport, rendering and physical actuation are outside the measured control path; no GPU or minimum hardware requirement is qualified.

## Artifacts, limits and next experiment

The [recorded grip-study viewer](../topics/physical-grounding/runs/2026-10-27-learned-piper-grip-v02/viewer/index.html), [model card](https://huggingface.co/Dvidia/piper-block-placement-feedback-v02), [demonstration and benchmark dataset](https://huggingface.co/datasets/Dvidia/piper-block-placement-feedback-demonstrations-v02), and [GitHub release](https://github.com/Dvidia-Inference/dvidia-training/releases/tag/piper-feedback-v0.2) expose the model, complete evidence and runnable code. The earlier [placement model](https://huggingface.co/Dvidia/piper-block-placement-v01), [dataset](https://huggingface.co/datasets/Dvidia/piper-block-placement-demonstrations-v01) and [release](https://github.com/Dvidia-Inference/dvidia-training/releases/tag/piper-imitation-v0.1) remain a separate frozen result.

The [publication receipts](../topics/physical-grounding/runs/2026-10-27-learned-piper-grip-v02/publication/README.md) record exact public revisions, installation asset hashes, the preserved scientific README and hosting-only replay derivation. They distinguish the complete scientific dataset from its smaller recorded projection.

The local installer accepts strictly validated, data-only base and adapter JSON. It runs one fresh default-nominal native attempt, copies exact model bytes, preserves dense telemetry and independent scores, and writes SHA-256 receipts. It never silently overwrites or retries an attempt. Its manifest distinguishes the earlier seven-command residual architecture from the jaw-only adapter. Browser viewers replay recorded states; fresh physics runs locally through the CLI.

The broader goal has not been achieved. This study does not turn arbitrary human video into a transferable robot skill. Contact and drive behavior remain uncalibrated, perception and hardware sensing are absent, and other objects, goals, arms and environments are unevaluated. CPU timing excludes camera acquisition, network transport and physical actuators. Hard real-time performance and minimum hardware requirements are unqualified.

The completed traces make the next priorities concrete: ten full-adapter attempts never established a qualifying lift, twelve recorded finger–table contacts, and none of the twelve interrupted cases succeeded. A learned progress clock could wait for acquisition before advancing the frozen arm references; changes to grasp geometry and table clearance could address the measured contacts. These are distinct interventions and need separate evaluation. The jaw-only model has established neither capability. Fresh confirmation, paired controls and retained failures remain the test for progress toward an installable skill.

A separate [TRAINING-only clock-label diagnostic](../topics/physical-grounding/runs/2026-10-27-learned-piper-grip-v02/next-study/clock-label-feasibility/README.md) now checks a prerequisite to that next experiment. It reads only the 64 existing teacher trajectories, uses static forward kinematics and fits no model or new dynamics. Repeated poses and pauses make simple position-to-progress labels ambiguous under the tested full-horizon definitions; a monotonic alignment imposes a convention rather than proving intended progress. The note is unfrozen development evidence, separate from v0.2 confirmation. The next development check is therefore an explicitly instrumented same-path teacher that records causal hold/advance decisions before any clock learner is fitted. If timing alone cannot solve the task, geometry needs a separately versioned intervention.
