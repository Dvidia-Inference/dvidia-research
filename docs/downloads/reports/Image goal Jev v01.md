# Image-goal verification: native benchmark and Jev protocol

## What is ready, and what remains unmeasured

We have built and validated **32 native PiPER scene fixtures** for an image-goal experiment. Four pairs have byte-identical current images and different physical completion labels: a settled shoe and the same shoe with an assigned velocity. The images alone cannot distinguish those states. A useful decision layer must recognize when the available evidence is insufficient.

**Jev has not been run.** A TypeSafe credential was unavailable for this execution. All 64 planned provider trials remain explicitly `not_run`, and model accuracy, false-completion rates, service latency and cost remain unmeasured. This publication contains the native benchmark, frozen Jev protocol and runnable evaluation tools. It reports no successful model evaluation or learned robot controller.

[Inspect all current and goal images](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-18-image-goal-jev-v01/lab/) · [Frozen evaluation plan](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-18-image-goal-jev-v01/lab/evaluation-plan.json) · [Explicit provider status](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-18-image-goal-jev-v01/lab/results.json)

## The visual goal and the physical goal

The task is to leave the green shoe at a marked position and orientation, supported by the table and released by the robot. Completion requires every declared condition to hold at each native sample throughout the final 200 ms window.

| Physical requirement | Frozen threshold |
| --- | ---: |
| Position error in the table plane | At most 25 mm |
| Yaw error | At most 15° |
| Linear speed | At most 0.01 m/s |
| Angular speed | At most 0.05 rad/s |
| Table support force | Greater than 0.01 N |
| Robot contact force | At most 0.01 N |
| Final qualifying window | 100 consecutive samples, 2 ms apart |

This is a sampled simulation criterion, not a continuous-time or physical hardware certification. Native force, motion and pose measurements determine the physical labels; no image model participates in their construction.

The PiPER profile uses its existing six arm joints and coupled parallel gripper. The object is a declared **30 g rigid proxy with half the packaged trainer's width**. Narrowing the object permits contact with the unchanged gripper for this diagnostic. It does not improve the full-size shoe results in our [previous graspability study](https://research.dvidia.org/papers/shoe-graspability-v03/), which remain unchanged.

The model assets are pinned to MuJoCo Menagerie commit `0059d4335f8156206f63a35662313385f7ad6d74`. Ninety files, totaling 34,562,302 bytes, were verified against the existing lock before generation. The PiPER asset's MIT notice is retained in the evidence bundle. [Pinned upstream asset](https://github.com/google-deepmind/mujoco_menagerie/tree/0059d4335f8156206f63a35662313385f7ad6d74/agilex_piper).

## Eight conditions, four layouts

The cohort crosses eight authored conditions with four deterministic layouts and camera azimuths. These are correlated diagnostic fixtures, not 32 independent real-world tasks or an unseen-object generalization study.

| Condition | Cases | Physical completion | Expected judgment from one RGB view | Expected judgment with native telemetry |
| --- | ---: | --- | --- | --- |
| Settled at the goal | 4 | Complete | Unknown | Complete |
| Target missing | 4 | Incomplete | Incomplete | Incomplete |
| Orange shoe in place of green target | 4 | Incomplete | Incomplete | Incomplete |
| Wrong position | 4 | Incomplete | Incomplete | Incomplete |
| Wrong orientation | 4 | Incomplete | Incomplete | Incomplete |
| Robot still in contact | 4 | Incomplete | Unknown | Incomplete |
| Moving, with the settled pose and pixels | 4 | Incomplete | Unknown | Incomplete |
| Completed target under an opaque cover | 4 | Complete | Unknown | Complete |

Each fixture starts from an authored state. The unreleased condition uses a native approach and gripper closure; it does not demonstrate lifting. The moving condition assigns 0.12 m/s velocity without advancing time, deliberately preserving the settled pose and image. This is a declared state intervention, not a measured physical impulse or a completed manipulation episode.

The four moving/settled pairs are the central negative control. Their current images and goal references match exactly, while the native velocity and completion labels differ. A single-image evaluator cannot recover an unobserved velocity from those identical inputs. Returning `unknown` is the intended behavior for both RGB-only cases. All four pairs also have identical complete RGB request hashes in the frozen evaluation plan; their telemetry requests differ. The RGB inputs do not leak the distinction through filenames or case categories.

An image of visibly closed fingers also cannot establish the 0.01 N force threshold. The RGB-only label for the unreleased condition is therefore `unknown`. For an absent target, wrong identity or clear pose violation, a visible failed requirement is sufficient to answer `incomplete`.

The generated cohort contains **8 physically complete and 24 physically incomplete cases**, with **8 absent-target cases** counting both missing objects and orange decoys. RGB-only evaluation has 16 known incomplete verdicts and 16 intended abstentions. The telemetry condition has 8 complete and 24 incomplete expected verdicts.

## What we give Jev

The experiment pins TypeSafe's experimental image-capable `jev-1.14.0`. Each scheduled request contains the task contract, current image, goal image and one of two input conditions. Three typed questions request target-presence probability, physical-completion probability and a `complete`, `incomplete` or `unknown` verdict. Presence is declared only at probability 0.8 or greater, absence at 0.2 or less; values between them abstain. These thresholds and prompts are frozen before service calls. [Image contract](https://docs.typesafe.ai/images), [model versions](https://docs.typesafe.ai/models).

The two conditions are:

- **RGB:** current and goal images with the task contract.
- **RGB plus telemetry:** the same images and task, with privileged simulator measurements of target presence, pose error, speed, contact forces, observation count and extrema across the full native window.

The second condition deliberately supplies information that the image cannot establish. It includes oracle object presence and pose errors; it is not a demonstrated camera-based estimator. Its outcome would measure whether a decision service uses those supplied observations correctly. It would not demonstrate that Jev inferred force, speed or object identity from pixels.

Ground-truth completion, expected verdicts and case-category names are excluded from model inputs. The complete native-window extrema preserve the evidence needed to evaluate the dwell rule, without substituting a precomputed completion label. The plan records semantic request hashes for all 64 paired trials in a deterministic shuffled order.

## Measure errors without rewarding an outage

The tools preserve every planned trial. There are no automatic retries or post-result changes to prompts, thresholds or case selection. An interrupted in-flight request remains marked for investigation; the public report refuses to export an unresolved run.

| Measure | Meaning |
| --- | --- |
| Observability-aware accuracy | Expected `complete`, `incomplete` or `unknown` verdicts over the planned cohort |
| Known-verdict accuracy | Correct judgments on cases with a defined observable completion verdict |
| Justified abstention | `unknown` on cases whose inputs cannot establish completion |
| Physical false completion | Model says complete while the independent physical reference is incomplete |
| Missing-object false presence | Model says present when the target is physically absent |
| Coverage and errors | Explicit decisions, abstentions, failed requests and unrun cases, reported separately |
| Probability error | Completion-probability Brier score against physical labels, with its valid-response count |
| Latency | p50, p95, p99 and maximum wall time, with errors retained in the all-attempt distribution |
| Cost | Known-usage input-cost estimate and a separate count of attempts with unknown cost |

False-completion counts retain all planned incomplete cases and also show the denominator of valid negative-case responses. This prevents a service outage from appearing to improve the model merely because fewer answers arrive. Selective physical accuracy is reported with its answered-only denominator and coverage; abstention is not counted as successful physical completion.

Online timing starts with preloaded image bytes and includes request preparation, image upload, hosted response and parsing. It excludes fixture-file loading, the earlier rendering, a live camera, robot actuation and physical task duration. The client has a bounded socket-operation timeout; this is not a real-time deadline guarantee. Small-sample p99 values describe this diagnostic cohort and cannot establish production tail latency.

## Native measurements and current limits

The final local generation took **6.30 wall seconds** for the 32 fixtures, including native scene construction, state validation, RGB/segmentation rendering and export. This is a fixture-generation measurement, not Jev inference speed, raw physics throughput or robot reaction time.

The native generator verifies each declared condition and the four byte-identical image pairs. Each physical record retains its model state, current measurement and native history. The complete case manifest also retains target visibility from MuJoCo geometry segmentation. This segmentation is ground-truth diagnostic evidence; no open-vocabulary detector or learned perception model was evaluated here.

An [independent native audit](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-18-image-goal-jev-v01/lab/native-validation.json) recomputes all 32 physical labels, the sampled dwell rule and full-window telemetry extrema from recorded numbers. It verifies 67 original files, with eight physically complete cases and 24 incomplete cases. The [runnable verifier](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-18-image-goal-jev-v01/lab/verify-image-goal-fixtures.py) checks recorded evidence without calling Jev or running a new simulation. Its source hash is included in the audit; the reproduction guide explains how to extract the original fixture tree.

The shoe remains rigid, friction and actuation remain simulated, and the camera is authored and calibrated inside the simulation. The cohort does not cover deformable footwear, unmodeled clutter, arbitrary goal viewpoints, unseen objects or real sensor failures. The fixed arm reaches and closes only to construct the unreleased fixture; no Jev answer enters the actuator path.

## Run and inspect the benchmark

The [native generator and evaluator](https://github.com/Dvidia-Inference/dvidia-training/tree/19acf0734d63ecebc07140c8d84302a54baee4c4) are frozen at `19acf0734d63ecebc07140c8d84302a54baee4c4`, based on the published graspability branch. The [publication source](https://github.com/Dvidia-Inference/dvidia-training/tree/3d3c8f660f6f9544d6a58c654bab143dd1eddc00) adds the viewer, independent verifier and publication tools without changing that core. Original DVIDIA code and authored fixture records use MIT. No Jev model weights or third-party training code are redistributed.

[Current/goal viewer](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-18-image-goal-jev-v01/lab/) · [Every physical label](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-18-image-goal-jev-v01/lab/cases.json) · [Native protocol](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-18-image-goal-jev-v01/lab/protocol.json) · [Complete package checksums](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-18-image-goal-jev-v01/lab/publication-integrity.json) · [Reproduction and licenses](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-18-image-goal-jev-v01/lab/README.md)

The original native inventory, viewer inventory and outer publication inventory remain separate. Frozen native files are copied without modification. Public provider records exclude raw service responses and credentials; no provider response exists for this unrun execution.

Python 3.12+, the repository's `.[arm]` dependencies and the pinned PiPER assets are sufficient for local generation. The static viewer runs without a GPU, credential or server-side model. Hosted Jev evaluation additionally needs a TypeSafe account and network access. The source guide documents secure environment-variable or explicitly named Keychain credentials; tokens never belong in the public files.

Jev output is evaluated here, not used for training or distillation. The model remains subject to TypeSafe's own terms. [Service agreement](https://typesafe.ai/legal/mca).

## What this adds to Skillspace

An installable skill needs a completion contract alongside its goal image. The record should preserve the image, object identity, expected pose, relevant contacts and the interval over which the state must hold. The decision layer can then distinguish a visible failure from a state that needs another observation.

The immediate next measurement is the frozen Jev cohort once credentials are available. After that, the useful comparison is a local state-based verifier, a visual evaluator and the same evaluator with measured feedback. Physical skill execution remains a separate benchmark: choose a subgoal, move the arm under local limits, and verify the resulting state. This experiment prepares that boundary; it does not yet cross it.
