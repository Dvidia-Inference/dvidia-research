# A First Study of Learned PiPER Block Placement from Synthetic State–Action Demonstrations

**DVIDIA Research** · Research v0.1 · 27 October 2026  
Contact: [hello@dvidia.org](mailto:hello@dvidia.org) · [DVIDIA](https://dvidia.org) · [X: @iammrriver](https://x.com/iammrriver)

## Abstract

A compact learned policy completed 5 of 12 frozen simulator confirmation trials in a narrow PiPER block-placement task. The authored teacher completed all 12, while three controls completed none. This result demonstrates partial transfer from synthetic demonstrations to held-out starting positions under one fixed simulated setup; it does not establish robust placement, visual grounding, contact recovery, hardware readiness, or generalization beyond two trained destinations. The selected policy is a time-conditioned feed-forward mapping from initial object position and known goal to joint and jaw references. It uses privileged simulator state and retains the simulator’s native low-level servo and generic command limits.

## Study and data

The task used a simulated PiPER arm to pick up and place a 40 g rigid block. The block used the same friction and geometry throughout. Initial block positions were sampled from a 30 × 30 mm start region. Two destinations were used in every split: one at (0.35, 0.08) m and one at (0.40, −0.08) m. Complete episodes were grouped by exact initial XY, so both goal cases for a start remained in the same split. The training set comprised 16 starts × 2 known goals (32 episodes); development comprised four new starts × 2 goals (8 cases); confirmation comprised six new starts × 2 goals (12 cases). Only independently successful complete teacher episodes supplied training labels. All 32 synthetic teacher episodes succeeded and yielded 32,000 causal state/action frames.

These demonstrations came from an authored synthetic controller, not human video or teleoperation. The learned policy uses privileged initial object XY, the known goal, elapsed time, and live joint state for generic command limiting. It predicts joint and jaw references from the reset position, goal, and clock. Pinned native position servos track those references. At inference, the policy calls no teacher, task phase machine, inverse kinematics or tape lookup. It has no vision input or learned contact correction or recovery.

Five variants were evaluated on the same 12 frozen confirmation cases. The learned model and protocol hashes were frozen before confirmation. The scorer sampled full episode traces every 20 ms and also used recorded 1 ms simulator counters. Success required a bilateral lift maintained for at least 100 ms, carrying with contact-loss gaps strictly shorter than 40 ms until the block was supported at the target, jaw opening, settling within 25 mm for 250 ms, and a 10 cm TCP retreat, with no unintended contacts. These are simulator-authored records, not independently authenticated sensor measurements.

| Variant | Confirmation successes / scheduled |
|---|---:|
| Learned primitive401 policy | 5 / 12 |
| Authored teacher | 12 / 12 |
| Reset arm targets held, jaw open | 0 / 12 |
| Learned arm references, jaw held open | 0 / 12 |
| Framewise shuffled labels | 0 / 12 |

## Model selection and result

Two multilayer perceptrons were tried first: a 64-hidden-unit delta-output network trained for 160 epochs, and an absolute-output network trained for 240 epochs. Each scored 0/8 on development. A quadratic spatial primitive model with 9 spatial features, 201 Gaussian time bases (σ = 0.075), and ridge coefficient 10⁻⁵ also scored 0/8. It reached all 8 correct final XY locations, but failed the full sequence success criterion. The selected primitive401 model used cubic spatial features, 16 spatial features, 401 Gaussian time bases (σ = 0.025), and ridge coefficient 10⁻⁷; it scored 1/8 on development. Training took about 1.42 seconds and its serialized model was 2,031,879 bytes. Selection was based on development performance, not confirmation outcomes.

On confirmation, the selected policy succeeded in five trials. The teacher’s 12/12 indicates that these fixed cases were achievable by the authored controller, while 0/12 for the jaw and shuffled-label controls provides a basic task-specific contrast. The shuffled-label control permuted all 32,000 framewise labels using seed 19217. This is a weak temporal control: it does not shuffle whole trajectories, and no nearest-trajectory baseline was evaluated. With only 12 held-out trials and two known goals, the difference does not establish a general performance estimate or causal account of the learned policy’s failures.

An [independent confirmation audit](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-27-piper-imitation-v01/model/independent-review.md) recomputed all 60 scores and verified their identities and hashes. All 12 learned episodes passed the independent terminal-position and settling check, yet seven failed the full native contact-history gates. Four recorded retention loss, three did not complete the carry gate, and five recorded unintended-contact ticks; these categories overlap. Their final XY errors were 3.57–11.01 mm. Reaching the right final pose therefore does not establish a successful manipulation sequence. The raw contact-pair IDs do not identify a particular colliding body in these tapes, so the audit does not infer a physical cause.

## Operational record and limitations

During confirmation, a mechanical driver configuration comparison (live tuples versus persisted JSON lists) paused the driver after each fresh tape was saved. A bounded adapter verified its identity and resumed the original driver, which scored that saved tape and advanced to the next scheduled case. There were 60 unique native physics executions and 60 logged serialization recoveries; no completed tape was re-executed. The model, native runtime and scorer remained frozen. The recovery log and adapter are published as a reproducibility deviation, separately from policy outcome counts.

Across 12,000 learned-policy calls, CPU inference measured 0.148 ms median, 1.039 ms p95 and 3.259 ms p99. The maximum was 129.2 ms. The whole control step, including native physics, measured 2.159 ms median and 14.441 ms p95; 344 of 12,000 steps exceeded the 20 ms compute budget. These measurements establish neither hard real-time scheduling nor physical reaction latency. Camera processing, transport and real actuation are excluded. The process peak RSS was 736,444,416 bytes, a cumulative high-water mark rather than a per-model memory requirement. The numerical experiment used no GPU; minimum hardware requirements are not certified.

The study addresses only interpolation among starting positions for one 40 g rigid block, one simulated arm setup, one friction and geometry configuration, and two destinations seen during training. Contact, friction, and actuator behavior are uncalibrated. The task supplies privileged simulator measurements; no camera pipeline or visual representation was trained. No learned contact feedback or recovery was evaluated. The simulator’s native outcome fields are not authenticated physical sensing, and this study does not qualify a real robot, establish transfer to another arm, or certify compute minima or end-to-end control latency.

## Artifacts and next work

The [recorded study viewer](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-27-piper-imitation-v01/viewer/), [Hugging Face replay](https://dvidia-robot-simulation-lab.static.hf.space/learned-placement/v01/viewer/index.html), [model card](https://huggingface.co/Dvidia/piper-block-placement-v01), [demonstration dataset](https://huggingface.co/datasets/Dvidia/piper-block-placement-demonstrations-v01), and [GitHub release](https://github.com/Dvidia-Inference/dvidia-training/releases/tag/piper-imitation-v0.1) preserve the model, runnable local code, protocol and complete attempts. The viewer plays recorded states; fresh physics runs through the installed local CLI. The [publication provenance](https://research.dvidia.org/downloads/topics/evaluation-provenance/runs/2026-10-27-learned-publication/provenance.json) records the GitHub downloads, exact Hugging Face revisions, anonymous byte checks and separately derived browser hosting fixes. These fixes preserve the original model and native evidence.

A future direction is to add learned contact feedback and recovery, then test camera-derived state and action data with explicit camera-to-robot calibration. NVIDIA Cosmos could later support optional synthetic RGB observations generated from depth and segmentation while preserving simulator state; generated image alignment would require validation. Cosmos was not downloaded, integrated, or evaluated here ([NVIDIA Cosmos Simulation](https://research.nvidia.com/labs/cosmos-lab/cosmos-simulation/), [Cosmos3-Nano-Sim-Transfer](https://huggingface.co/nvidia/Cosmos3-Nano-Sim-Transfer)).
