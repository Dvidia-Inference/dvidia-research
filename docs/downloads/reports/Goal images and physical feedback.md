# A visual goal still needs physical feedback

## The destination and the movement

A photograph of an organized shoe rack is a useful way to ask for a result. It does not fully specify which shoe to grasp, how to approach it, or how much force will hold it. Our proposed bridge is a visual planner above a measured motor loop: use the goal to choose useful actions, then use physical observations to establish what those actions actually achieved.

For a shoe, completion could mean that the correct shoe rests on the assigned shelf, points in the requested direction, remains settled and has been released. A similar-looking image with the shoe still in the gripper should fail. The position, angle, force and dwell tolerances belong in the task's benchmark.

This note joins a proposed image-goal experiment to a separate measurement tool. The visual planner has not been integrated or benchmarked by DVIDIA. The companion passive audit concerns our **simplified rigid-box arm**, not the PiPER shoe workstation or physical hardware.

## How intention reaches a motor

| Layer | What it supplies | What must be checked |
| --- | --- | --- |
| Goal and observation | Desired arrangement; current images, joint state and contact history | Object identity, viewpoint, calibration and observation age |
| Visual planner | Candidate short tool motions and predicted outcomes | Whether the prediction improves a physically defined task |
| Robot adapter | Reachable joint targets and jaw commands | Coordinate frames, units, joint order, travel and collision limits |
| Servo and mechanism | Bounded motor effort and physical movement | Measured position, motion and actual contact force |
| Feedback and completion | Continue, stop, replan or release | Grip retention, world support and a sustained final state |

The first experiment should use a fixed calibrated camera and one known object. Image pixels must be related to the robot's coordinate frame before they become metric motion commands. Different viewpoints require registration or a representation that separates viewpoint from arrangement. A single RGB image does not reliably reveal metric depth, hidden contact, mass or friction.

Our simplified arm accepts six joint-position targets in radians and one jaw-gap command in metres, implemented through eight simulated actuators. Its current controller fixes the tool orientation. The separate PiPER profile has its own coupling, geometry and commands. Neither establishes a calibrated hardware adapter or general learned six-axis control.

The servo turns a position error into bounded effort. A force cap only bounds that effort; it does not establish fingertip pressure or a retained grip. The [previous PiPER graspability study](https://research.dvidia.org/papers/shoe-graspability-v03/) made that distinction visible: every 300 g attempt failed under the pinned drive, including the block. Both retained lightweight shoe attempts also exceeded nominal jaw travel. Those results remain unchanged and separate from the new rigid-box audit.

## Where Jev could help

TypeSafe's 14 October release adds experimental images and a bounding-box output to Jev. We propose evaluating `jev-1.14.0` for target identification, progress assessment and selection among validated skills, using current and goal images plus measured state. It is a candidate decision layer, not an action-conditioned physics model. [Release](https://typesafe.ai/blog/jev-1-14).

A Box always returns four normalized edges, even when the target is absent. A separate presence decision and independently tested abstention rule are necessary; TypeSafe recommends no universal Box-confidence threshold. Valid types do not establish correct physical judgments. [Box contract](https://docs.typesafe.ai/primitives/box).

The vendor's 70–500 ms service-call claim generally comes from West Coast laptops calling its nearby service. It does not establish local inference, image-specific latency or robot stopping time. [Measurement scope](https://typesafe.ai/blog/introducing-system-one-models-and-jev).

Calibrated geometry must translate a two-dimensional proposal into a reachable tool target. Grip monitoring and motor limits remain local while optional remote proposals arrive asynchronously and expire. We have not called or benchmarked Jev; our simulation has no dependency on it.

## A related world-model precedent

RoboJEPA is relevant to this direction. Its paper describes action-conditioned predictions in a visual feature space, planning toward a goal image, and real-robot evaluation. Candidate action sequences are compared by their predicted distance from the goal, a portion is executed, and the process repeats. The reported robot deployment uses translation and gripper planning with a fixed orientation and blocking execution. [RoboJEPA paper](https://arxiv.org/html/2610.10515v1).

Small predictor size does not establish low system latency. The released predictors require a V-JEPA 2.1 ViT-G encoder, listed separately at two billion parameters. The documented eager 50M configuration takes roughly 20 seconds per planning iteration at horizon one on an H100. This is a configuration-specific planning measurement, not a universal speed limit or evidence of laptop real-time control. [Checkpoint requirements](https://github.com/facebookresearch/robo_jepa), [encoder sizes](https://github.com/facebookresearch/vjepa2#v-jepa-21-pretrained-checkpoints), [planning measurements](https://github.com/facebookresearch/robo_jepa/blob/main/docs/planning.md).

We have not downloaded, trained or benchmarked RoboJEPA weights. Its repository declares CC BY-NC-SA 4.0. No upstream code or weights have been incorporated into DVIDIA's MIT tools. [Repository license](https://github.com/facebookresearch/robo_jepa/blob/main/LICENSE).

## What the contact audit shows

The passive audit reproduces **14/14 frozen episodes exactly** and records **249,502 native physics ticks** at 1 kHz. These are seven previously inspected controller tapes and seven paired open-jaw controls from two scenes. Commands, physics, force limits and success scoring remain unchanged. They are zero new policy trials, and the evidence concerns the simplified rigid-box arm.

| Recorded controller tape | Longest qualifying lift streak | Largest loaded contact gap | Intervals hiding a gap / eligible intervals | Complete task |
| --- | ---: | ---: | ---: | --- |
| Baseline student, scene15 | 75 ms | 6 ms | 151 / 306 | Fail |
| Smoothed student, scene15 | 89 ms | 2 ms | 130 / 305 | Fail |
| Compliant student, scene15 | 947 ms | 6 ms | 105 / 291 | Fail |
| Baseline teacher, scene15 | 898 ms | 6 ms | 187 / 374 | Fail |
| Smoothed teacher, scene15 | 962 ms | 5 ms | 175 / 358 | Fail |
| Compliant teacher, scene15 | 951 ms | 4 ms | 172 / 358 | Fail |
| Baseline student, scene14 | 1,618 ms | 5 ms | 4 / 245 | Success |

The unchanged lift rule requires an individual normal contact above 0.01 N on each pad, no table contact, at least 55 mm rise and 100 ms uninterrupted dwell. Baseline and smoothed students never meet that dwell. Compliance and the teachers do, but still fail final placement. All seven open-jaw controls fail without a qualifying retained lift.

An eligible interval shows bilateral contact at both stored boundaries; the audit identifies missing contact between them. Stored observations are nominally 50 Hz, with the successful scene14 ending on a partial 2 ms interval. Loaded statistics include every recorded lift, transfer and place phase, including retries. They do not describe only the first grasp.

Across these seven controller tapes, missing loaded pad contacts classify as simulated geometric separation rather than positive force just below the scoring threshold. The baseline student's largest measured pad separation is approximately 80 micrometres. Small gaps can reflect contact-model or numerical behavior; this is not validated physical slip. The successful comparator also has gaps, so their existence alone cannot explain failure.

Recovery has a time cost. The baseline student's second lift begins at 16.06 s, leaving 1.94 s before the unchanged 18 s deadline. The compliant student retries at 17.46 s with 0.54 s left. Better retention during one phase does not establish complete placement.

## Inspect and reproduce the evidence

[Audit report](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-18-native-contact-audit/audit/report.json) · [Frozen protocol](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-18-native-contact-audit/audit/protocol.json) · [Complete file inventory](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-18-native-contact-audit/audit/integrity.json) · [Verified downloader](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-18-native-contact-audit/download-audit.py)

The sealed bundle contains **59 files and 151,876,079 bytes**, including all compressed input episodes, native traces, receipts, source snapshots and upstream experiment metadata. The implementation was frozen at [ff40985](https://github.com/Dvidia-Inference/dvidia-training/tree/ff40985ec076eaed8421821b1244217d8502777e). The downloader pins the inventory and verifies every file before reporting completion.

Every original sampled physical observation, action, initial/final state, reward and outcome must reproduce exactly. Independent lift-dwell reconstruction must match the original scorer at every stored boundary. Repeated reads cannot inflate dwell. A mismatch invalidates the audit; no controller was promoted.

A separate portable reproduction also verifies all fourteen episodes, with byte-identical compressed native traces and exact physical summaries. It takes **204.60 wall seconds** under different host load. [Validation receipt](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-18-native-contact-audit/qa.json).

The primary run took **54.18 wall seconds** for 249.502 simulated seconds, including instrumentation and export. It used no external inference. This is not uninstrumented throughput or hardware reaction time. The Python socket guard recorded zero attempts; native dependency networking was not audited.

Download and inspect the downloader above, then retrieve the bundle into a new directory:

```sh
python3 download-audit.py --output native-contact-audit-evidence
```

With Python 3.12+ and the pinned training source installed using its `.[arm]` extra, reproduce it with:

```sh
python -m dvidia_training.native_contact_audit \
  --from-audit native-contact-audit-evidence \
  --output native-contact-audit-reproduction
```

The [reproduction guide](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-18-native-contact-audit/README.md) gives the full installation commands. Downloading needs a network connection; replay runs locally without the original run folders. Exact replay is a validation gate, not a guarantee of identical floating-point behavior across platforms.

The next mechanics test should vary timestep and solver convergence while holding physical parameters, commands and time-based scoring fixed. Only then should a distinct grip or motion change be evaluated against full completion, retained lift, drift, recovery time and deadline use. The audit improves measurement; it has not yet improved the controller.

## Fast movement needs two timescales

Our proposed architecture lets a visual planner select subgoals while a compact local controller carries out familiar motions. That controller would use proprioception and recent contact history alongside visual features. Stop and contact responses continue between planner updates; a stale visual proposal must not suppress them.

This is the part of the muscle-memory analogy we can test. Train a smaller goal-conditioned policy on our own licensed robot and simulation trajectories, then measure whether it completes new layouts under the same physical constraints. Successful learning would reduce planning cost while retaining measured task performance. It remains a hypothesis for DVIDIA. Jev-output distillation is excluded from this proposal: TypeSafe’s published agreement restricts that use. [Section 2.3(b)](https://typesafe.ai/legal/mca).

Measure capture-to-command latency, observation age, missed deadlines, memory and p50/p95/p99/max response times on the intended laptop. Model-forward time alone omits capture, encoding, search, transport and motor response. Native simulation cadence is not a measured camera or hardware-control rate.

## What Skillspace should preserve

The useful record is **observation + action + elapsed time → next observation and outcome**. Keep current and goal images with their camera calibration, object identity, joint and jaw state, issued commands, actuator response, contact observations and timestamps. Preserve unsuccessful grasps, recovery and release alongside successes. Short clips retain their parent session and physical-instance identity so related examples cannot leak across evaluation splits.

Human footage can teach recognition and task structure. Robot interaction records establish how a named embodiment responds to an action. Simulation can produce these records cheaply once the model's actuation and contact assumptions have been checked against measurements.

## The next falsifiable test

Start with reaching, before shoe pickup. In the PiPER workstation, render a goal view for a declared reachable tool target with fixed camera and orientation. Freeze starts, goals, limits and stopping rules before evaluation. Compare a candidate visual planner with an authored state-based reference, a hold control and shuffled-goal controls. The state-based reference has privileged observations and is not a vision-only baseline.

Score actual tool-position error, native contacts, command-limit violations and end-to-end compute. Success needs a declared metric tolerance sustained for a declared dwell. Score shuffled-goal controls against the original requested target to test whether the goal determines the motion. Image similarity is a secondary diagnostic.

Advance to pickup and placement after reaching works. Add independent retained-lift, release, support and dwell checks; then vary camera pose, lighting, occlusion, object placement, force response and sensor delay in separately reported conditions. This will tell us whether a visual goal produces reliable physical progress under the same limits.
