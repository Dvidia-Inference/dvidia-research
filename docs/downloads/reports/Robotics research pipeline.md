# Robotics research pipeline

DVIDIA's product goal is a local training environment that converts Skillspace evidence into a versioned skill a compatible robot can install, test and execute with feedback. The next architectural step couples reviewed task descriptions to **measured robot state**, allowing a skill to decide whether a grasp worked, whether progress stopped and whether to retry or abstain. This paper specifies that pipeline and its validation gates. It adds no trained supervisor, human-video action bridge or hardware qualification. The implemented foundation remains a CPU research alpha with bounded simulation evidence. ([Public training package](https://github.com/Dvidia-Inference/dvidia-training), [Published measurements](https://research.dvidia.org/papers/skillspace-footage-training/))

## Pipeline at a glance

![DVIDIA robotics pipeline: source evidence branches into reviewed label proposals and synchronized numerical telemetry; grouped datasets feed separate visual and motor learners, a proposed state supervisor, frozen simulation evaluation and compatible skill installation. Runtime observations return to bounded decisions and future reviewed recordings.](https://research.dvidia.org/assets/robotics-pipeline.svg)

**Figure 1.** Solid elements represent implemented components within the bounded simulation pipeline; dashed elements represent proposed integrations. Physical robot execution remains unqualified. A visual model, reviewed label and executable motor policy have different evidence requirements. The diagram describes a target architecture, not a newly completed end-to-end system.

The intended flow is **original recordings → label proposals and synchronized telemetry → reviewed episodes → frozen grouped datasets → appropriate learners → frozen simulation evaluation → versioned skill → compatibility checks and local qualification → feedback execution**. Today, media intake, grouping, visual diagnostics, numerical movement fitting and simulation capsule qualification exist. Automatic task labeling and learned task supervision require new contracts and experiments.

| Component | Implemented evidence | Next addition |
|---|---|---|
| Intake and provenance | Local media audit, hashes and connected source groups | Immutable annotation revisions and richer synchronized telemetry |
| Learning | RGB next-frame diagnostic; numerical six-joint movement head | Reviewed task/outcome consumer and state supervisor |
| Task decisions | Authored phases, goals, gripper, completion and recovery | Learned bounded decisions using observation history |
| Evaluation and installation | Frozen simulation trials; runtime-bound capsule and exact-scene gate | Fresh supervisor confirmation and qualified embodiment adapters |
| Physical execution | No qualified hardware skill | Calibrated sensing, dynamics and independent arm tests |

## 1. Preserve originals; propose labels separately

Skillspace should evolve from a media folder into an evidence container. Preserve original bytes, source/session identifiers, camera identity, task declarations and redistribution rights. Existing connected-group checks keep declared related recordings and duplicate media together before train/development/test assignment. Twelve cuts from one long recording remain one dependent source group; a “complete” flag does not prove task completion. ([Current format](https://github.com/Dvidia-Inference/dvidia-training/blob/2f372698e941bbcdd9342499592cc6baf9227d8d/docs/skillspace-format.md))

An optional detector, tracker and vision-language model can propose intervals, objects, relations and observed outcomes. Grounded SAM 2 demonstrates detection, tracking and JSON export, but these outputs still need event and identity review. Distinguish reaching, attempting grasp, closing jaws, visibly holding, lifting, placing, releasing and observed completion. Preserve retries, drops, occlusion and unknown outcomes instead of turning every attempt into success. ([Grounded SAM 2](https://github.com/IDEA-Research/Grounded-SAM-2))

The proposed annotation sidecar stores original presentation timestamps, clip mappings, track identities, box conventions, visibility, model/prompt revisions, evidence frames, raw scores and reviewer edits. Revision states distinguish proposed, accepted, corrected, rejected and unknown. Detector scores are not calibrated accuracy, and hashes bind an artifact without certifying its truth. Current Training does not consume segment/box annotations; this must be a separate versioned addition, not an annotation file renamed as numerical actions.

## 2. Synchronize measured state and action intent

Teleoperation and simulator recordings can provide aligned numerical actions. Egocentric human video can provide task semantics while lacking robot actions, metric geometry and contact measurements. Reviewed captions cannot manufacture those channels. DIAL supports language augmentation of existing robot demonstrations using a human-labeled seed and fine-tuned CLIP; it does not establish arbitrary human-video conversion into controls. ([DIAL](https://instructionaugmentation.github.io/))

The richer telemetry contract should retain the distinction between what the controller requested and what the robot did:

| Channel | Required interpretation |
|---|---|
| Joint and tool state | Measured position/velocity, units, frame and acquisition time |
| Gripper state | Actual aperture and available effort/contact observations |
| Commands | Requested targets, issue time and application time |
| Camera and objects | Presentation times, visibility, identity and calibration |
| Synchronization | Clock mapping, resampling method, sensor age and uncertainty |
| Missing data | Explicit unavailable/stale flags; unknown is not zero |

“Close jaws” records intent. Holding requires supporting aperture, contact, effort or object-motion evidence. The current simulator exposes joints, velocities, jaw gap, actuator forces and pad contacts separately from commands; the strict movement sidecar retains only its narrower timestamp/context/error/joint-delta features. Exporting the richer tape therefore needs a new schema and alignment checks. LeRobot's separate video, state, action and task channels offer an interoperability target through an explicit adapter. ([Environment observations](https://github.com/Dvidia-Inference/dvidia-training/blob/2f372698e941bbcdd9342499592cc6baf9227d8d/src/dvidia_training/arm_env.py#L244), [Recorder](https://github.com/Dvidia-Inference/dvidia-training/blob/2f372698e941bbcdd9342499592cc6baf9227d8d/src/dvidia_training/footage_example.py#L71), [LeRobot v3](https://huggingface.co/docs/lerobot/en/lerobot-dataset-v3))

The original spatial-prior thesis remains useful: shoes often lie low and tables near the torso, conditional on viewpoint, posture and scene. Such expectations can prioritize search while preserving exceptions. A pixel box is not robot-base XYZ, orientation or a grasp point. Metric targets require calibration, depth or geometric constraints and frame transforms; semantic labels cannot supply friction or deformability. ([OpenCV calibration](https://docs.opencv.org/4.x/d9/d0c/group__calib3d.html))

## 3. Train distinct models for distinct claims

The current visual learner measures next-frame prediction on small synthetic RGB samples. It does not control the arm. The current movement learner consumes privileged simulator context and an authored Cartesian goal to predict six joint increments, replacing a differential inverse-kinematics calculation. Phases, targets, gripper decisions, completion and recovery remain authored. These boundaries explain what today's successful placement trials establish. ([Movement learner](https://github.com/Dvidia-Inference/dvidia-training/blob/2f372698e941bbcdd9342499592cc6baf9227d8d/src/dvidia_training/arm_distill.py), [Authored supervisor](https://github.com/Dvidia-Inference/dvidia-training/blob/2f372698e941bbcdd9342499592cc6baf9227d8d/src/dvidia_training/arm_policy.py))

The next learner should be a compact local supervisor over recent measured-state history. It proposes a bounded phase, local goal and gripper intent, together with progress, recovery or abstention. State estimation establishes what observations support; supervision chooses what to attempt; the motor policy produces bounded targets; the fast controller tracks accepted targets and enforces limits. Teacher phases may label training examples but must not appear as deployment inputs.

ACT demonstrates observation-conditioned action chunks; SayCan combines instruction usefulness with skill feasibility in the current state; FoAR combines visual and force/torque inputs with reactive contact refinement. These mechanisms motivate the design without validating DVIDIA's exact architecture or arbitrary-arm installation. Start with the CPU specialist and measure complete inference cost before selecting larger models. ([ACT](https://tonyzhaozh.github.io/aloha/), [SayCan](https://say-can.github.io/), [FoAR](https://tonyfang.net/FoAR/))

## 4. Validate curation and decisions independently

The proposed annotation pilot uses twenty independent source sessions: ten teleoperation and ten egocentric, reported separately. Reserve four development and six untouched test sessions per domain. Two reference annotators, blinded to model suggestions, adjudicate events and outcomes. Separate operators compare manual, VLM-assisted and detector-plus-VLM-assisted labeling with balanced assignments, without showing the same operator the same source in multiple conditions.

Measure correction plus audit time at matched quality, boundary errors, missed/extra events, object/target errors, tracking identity errors, false completion and abstention. Include inference, storage, retries and setup in cost per approved episode. The proposed go/no-go target is 30% less reviewer labor without an observed increase in serious errors and with reliable provenance-preserving exports. This companion triage pilot targets annotation labor and retrieval; the earlier forty-episode graduation proposal remains separate and unrun. Neither establishes production reliability; policy benefits require a compatible consumer and separate learning evaluation. ([Earlier graduation protocol](https://research.dvidia.org/downloads/topics/evaluation-provenance/experiments/0002-skill-graduation.md))

For the supervisor, keep the movement head, physics, servos, limits and success predicate fixed against authored supervision. Add empty grasps, slips, response delay and lost observations to training/intervention recordings. Successful demonstrations alone cannot establish recovery. Use the known twelve benchmark layouts for regression, then freeze model, thresholds and protocol before a fresh confirmation suite with nominal, recoverable, impossible and sensor-fault cases. Preserve whole connected groups and matched open-jaw controls. ([Existing frozen protocol](https://github.com/Dvidia-Inference/dvidia-training/blob/2f372698e941bbcdd9342499592cc6baf9227d8d/benchmarks/sample-count-19047/protocol.json))

Report all attempted episodes: completion, false success, drops, recovery success/time, interventions, unnecessary aborts and abstention coverage. Record latency distributions, sensor-to-command age and deadline misses. Ablate measured sensors versus command history, contact/force, temporal history and object context. Test task conditioning with distinct intentions; one placement task cannot establish multi-task arbitration. Adoption requires preserved nominal performance and a preregistered improvement in recovery or intervention burden, beyond lower imitation loss.

## 5. Qualify physics and performance before expanding coverage

Simulation practice must preserve task-relevant geometry, contact, friction, compliance, actuator response and sensor behavior. Stable trajectories alone do not establish physical accuracy. Our earlier fixture study found endpoint agreement insufficient to establish contact transients, with coarse timesteps missing collisions. Calibration against measurements, timestep checks and explicit parameter uncertainty remain required before physical-transfer claims. ([Simulation study](https://research.dvidia.org/papers/fast-accurate-robot-training-simulation/), [MuJoCo contact modeling](https://mujoco.readthedocs.io/en/stable/modeling.html))

The current base trainer runs locally on CPU; arm simulation adds MuJoCo. Offline execution follows dependency/data installation. Keep future annotation models optional, cache decoded evidence by source/model/recipe hashes and refine uncertain intervals. Measure cold/warm latency, total wall time, memory and quality together. Published hardware guidance is provisional; small CPU measurements do not establish universal minima, GPU scaling or faster production annotation. Audit exact model licenses before redistribution. ([Installation](https://github.com/Dvidia-Inference/dvidia-training/blob/main/docs/installation.md), [Hardware guidance](https://github.com/Dvidia-Inference/dvidia-training/blob/main/docs/hardware.md))

## 6. Release a skill with its operating contract

The target bundle contains weights, observation/action semantics, units, timing and missingness rules, required sensors, calibrated frames, robot/gripper adapter, tested support envelope, bounded recovery and qualification receipts. Compatibility includes joint ordering, limits, kinematics, gripper geometry and sensing; degree-of-freedom count alone is insufficient. One click should automate inspection, adapter checks and local qualification. An incompatible or failed qualification remains a failed installation gate.

The existing runtime-bound simulation capsule provides a starting point. Execution must retain feedback and scene-specific qualification rather than treat an installed file as competence. New failures return to immutable recordings and reviewed future datasets without changing frozen tests. Public [source](https://github.com/Dvidia-Inference/dvidia-training), [dataset](https://huggingface.co/datasets/Dvidia/dvidia-training-examples), [pilot models](https://huggingface.co/Dvidia/dvidia-training-pilot) and [recorded evidence Space](https://huggingface.co/spaces/Dvidia/dvidia-training) make the present baseline inspectable. Physical arm execution, shoe organization and sufficient human-video counts remain open research questions. This architecture makes the next product milestone measurable: an installed skill uses measured feedback to make better decisions within a declared operating envelope.
