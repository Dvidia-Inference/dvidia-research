# Test the grip before committing to a carry

DVIDIA research · 11 October 2026 · Authored native simulation experiment

**The guarded controller regresses completion at moderate friction: baseline 2/2, guarded 0/2.** Both complete 2/2 normal-friction placements and neither completes the two low-friction cases. Across the six paired scenes, placement completion falls from baseline 4/6 to guarded 2/6; all 18 open-jaw/hold controls fail and all 30 attempts remain numerically valid. The new controller exposes acquisition decisions, alarms, one supported retry and refusal, but demonstrates neither a successful recovery nor an overall completion improvement. These are synthetic rigid-block results, not a learned skill or physical robot qualification. ([Complete original report](../topics/physical-grounding/runs/2026-10-11-piper-grip/receipt/report.json))

## A pinch is not yet a load-bearing grasp

The earlier PiPER contact pilot completed both nominal placements but failed to lift its slippery block. Both fingers registered contact while the tool moved away from the table and the block stayed supported. The missing decision was whether the object followed the gripper under load. This experiment adds a bounded test lift before the full carry. It preserves the pinned model, native servo settings, force limits, free-body object and independent task scorer. ([Earlier pilot](Hardware%20matched%20robot%20simulation.md#piper-contact-pilot-retains-a-low-friction-failure))

The grip check uses current recorded tool/object poses, finger contacts and table support, plus its own prior observations. It does not read the declared mass, friction coefficient, future states or task outcome flag to decide whether to proceed. The original downstream motion policy still uses its existing lift flag after qualification. These inputs are privileged simulator measurements. A physical version needs calibrated camera, force or tactile observations and measured uncertainty and latency; this result does not supply that sensing pipeline.

## Check, hold and retry once

After the original closure reaches bilateral contact, the guard requests a **10 mm probe at 20 mm/s**. Acquisition qualifies when the object rises at least 6 mm, both pads retain normal contact above 0.01 N, table support is absent and TCP-local object offset drifts no more than 3 mm for 100 ms. Only then may the original full lift/carry continue. Two successive observations of relative slip, bilateral-contact loss, or a supported object failing to follow a moving probe trigger an alarm. Closure and probe stages each have a 1.4-second timeout. These hand-authored thresholds were frozen before confirmation, rather than fit to its outcomes. ([Frozen guard](https://github.com/Dvidia-Inference/dvidia-training/blob/3ee94706f436690c6d1d8554eda9202d23620e3c/src/dvidia_training/piper_grip_guard.py))

An alarm requests the measured six arm positions with closed jaws. It does not overwrite joint velocities, apply an external force or freeze the object. Native rate limits and dynamics continue, so the experiment measures actual motion after each alarm. Only a currently supported object without critical contact may be opened, recentered above the object and retried; the budget is one retry. Loss of support during recovery aborts closed. An abort continues to record the original full episode duration and is never relabeled as successful placement.

The original outcome scorer requires a table-free bilateral lift of at least 60 mm for 100 ms, retained carry, supported release, settled destination within 25 mm for 250 ms and 100 mm tool retreat without prohibited contact. From qualifying lift until still-held supported arrival, a consecutive 40 ms loss of bilateral contact permanently disqualifies that attempt. Stationary base/floor contact has a declared exemption; destination orientation is not scored. A grip decision and eventual task completion remain separate measurements. ([Frozen controller and installation](https://github.com/Dvidia-Inference/dvidia-training/blob/3ee94706f436690c6d1d8554eda9202d23620e3c/docs/piper-grip-recovery.md))

## Compare complete paired attempts

Before any confirmation attempt, the protocol freezes source hashes, controller and evaluation parameters, seed **731209**, two start/target XY layouts with offsets bounded by 5 mm, and three synthetic friction settings: **0.8, 0.55 and 0.15**. The same two layouts recur at each friction. Each scene runs baseline placement, its own complete arm-tape/open-jaw replay, guarded placement, its own separately matched open-jaw replay, and a common initial-arm hold. All five share the scene's exact native mechanics and starting state. No incomplete placement tape is extended to invent a control. ([Frozen protocol](../topics/physical-grounding/runs/2026-10-11-piper-grip/receipt/protocol.json))

The installed wheel runs with process-level network denial and local pinned assets. Every one of the 30 attempts retains **20 simulated seconds, 1,000 commands and 1,001 states**, including aborted attempts. Native physics steps at 1 ms and controller observations occur at 20 ms. Commands use six arm targets in radians and one single-finger jaw slide target in metres; both actual finger coordinates remain recorded. There are no captured warnings or critical-contact ticks in these attempts.

| Synthetic friction | Baseline completed / attempted | Guarded completed / attempted | Baseline open-jaw | Guarded open-jaw | Common hold | Numerically valid |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 0.8, normal | 2/2 | 2/2 | 0/2 | 0/2 | 0/2 | 10/10 |
| 0.55, moderate | **2/2** | **0/2** | 0/2 | 0/2 | 0/2 | 10/10 |
| 0.15, low | 0/2 | 0/2 | 0/2 | 0/2 | 0/2 | 10/10 |

Normal-friction guarded completion occurs at 15.551 and 15.653 simulated seconds, compared with paired baseline times 14.971 and 15.052 seconds. The probe adds about 0.58–0.60 simulated seconds in these successful pairs. Across all six completed placements, final position errors span 3.906–6.500 mm.

At moderate friction, each guard qualifies the small probe, then emits `relative_slip` 120 ms later and aborts because the block is unsupported. It never performs the full 60 mm qualifying lift; maximum rise is about 14.03–14.20 mm. The same scenes succeed under the baseline. Successful moderate baseline lifts also accumulate TCP-local displacement beyond the guard’s 3 mm limit and eventually complete. An overconservative displacement threshold is therefore a plausible explanation, but the experiment has no same-motion/no-abort counterfactual. It cannot label every alarm a false positive or isolate probe motion from abort behavior. This is a completion regression, not evidence that the guard rescued an otherwise doomed baseline. At low friction each guard finds no qualified acquisition, performs one supported open/recenter/retry, then aborts when the object again fails to follow. Both retries execute; **neither produces a completed placement**.

## Separate qualification, later following and task success

The independent recorded-state evaluation uses different, predeclared conditions: within 600 ms after a qualification decision, the object must be table-free, at least 10 mm above its initial height, with TCP-local offset stable within 8 mm for 100 ms. It reads later recorded boundary states and does not call the controller's decision predicate. This is a sampled outcome proxy, not a physics rerun or detector-accuracy benchmark.

| Guarded stratum | Qualification decisions | Later following observed | Unresolved decisions | No qualification decision | No following opportunity | Alarms | Retries | Aborted attempts |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Normal | 2 | 2 | 0 | 0/2 | 0/2 | 0 | 0 | 0/2 |
| Moderate | 2 | 2 | 0 | 0/2 | 0/2 | 2 | 0 | 2/2 |
| Low | 0 | 0 | 0 | 2/2 | 2/2 | 4 | 2 | 2/2 |

All four qualification decisions are followed by a brief qualifying following window, but two of those four tasks still fail. The low-friction rows have **zero qualification decisions**, rather than a perfect score on an empty denominator. There are no unresolved future windows in this complete cohort. Moderate trials later record two losses of the sampled following/height proxy, not two verified physical drops. Both finish with bilateral finger contact and no table support, about 6.49–6.59 mm above their initial object height. Falling below the proxy’s 10 mm rise threshold is enough to lose that proxy even while the block remains held. The stronger native task scorer has not entered its 60 mm retained-carry stage; its `retention_lost=false` does not qualify a completed carry. This distinction prevents a transient following proxy from becoming a claim of mastered acquisition or “100% accuracy.”

All six alarms have no preceding loss opportunity under the separately defined sampled following/loss proxy, so loss-to-alarm delay is **null**, not zero. Moderate alarms precede the later observed following/loss window; low-friction cases never establish that window. They do not supply six measured true-positive reaction delays. Controller event timing uses the simulation clock, independently of wall computation timing.

| Alarm case | Actual TCP path over the next 100 ms | Maximum TCP rise in that window | Maximum object rise |
| --- | ---: | ---: | ---: |
| Moderate layout 0 | 6.407 mm | 5.348 mm | 2.885 mm |
| Moderate layout 1 | 6.429 mm | 5.345 mm | 2.967 mm |
| Four low-friction alarms | 0.366–0.376 mm | 0.306–0.314 mm | 0 mm |

Every post-alarm window is complete. These path lengths use the recorded 20 ms boundaries, so they do not resolve motion between samples. The continued moderate-friction movement illustrates why requesting a hold is not instantaneous physical arrest. ([All decisions and motion measurements](../topics/physical-grounding/runs/2026-10-11-piper-grip/receipt/report.html))

The friction values are synthetic stress settings, not measured shoe materials. Six related configurations and their controls do not constitute a population reliability estimate. Earlier development is separate: the retained r0 low-friction trial has an `AttributeError` from a list/array mismatch; source-snapshotted r1 development covers normal, moderate and low friction. These local development trials informed the implementation and are not additional confirmation attempts or part of this public receipt.

## Runtime and reproducible evidence

The cohort runs on macOS 26.5.2 arm64, Python 3.12.9, MuJoCo 3.15.0 and NumPy 2.5.3, with ten reported logical CPUs, single-thread BLAS settings and no GPU workload. Host load is uncontrolled. **Fifty-three of 30,000 measured computation windows exceed 20 ms**, and the worst window reaches **210.045 ms**; none are excluded.

| Measurement across all 30 attempts | Recorded value | Boundary |
| --- | ---: | --- |
| Complete-attempt wall time | 1.916–7.577 s | Verification, compilation, settling, planning/IK, native stepping, scoring and state capture |
| Per-attempt computation p95 | 2.173–16.071 ms | Each observed 20 ms control window; not sensor-to-actuator latency |
| Worst computation window | 210.045 ms | Retained outlier in first normal baseline placement |
| Missed 20 ms computation windows | 53/30,000 | All attempts, including controls and aborts |
| Whole installed command | 104.261 s | Startup, all attempts, evaluation, compression, serialization and final inspection |
| Process lifetime RSS before inspection | 721.36 MiB | High-water mark, not per-episode usage or minimum RAM |
| Child lifetime RSS including inspection | 837.58 MiB | Execution wrapper high-water mark, also includes its preceding Git child |

The first normal baseline takes 7.577 wall seconds and misses 28 computation windows; its paired guarded attempt takes 3.343 seconds and misses one. Initialization and host scheduling are not controlled for a speed comparison, and the remaining timings stay in the report with equal weight. The computation p95 range does not establish real-time operation. Attempt timing excludes file serialization, rendering, training and physical sensing/transport/actuation; the separately reported whole-command measurement includes compression and final inspection. ([Exact runtime receipt](../topics/physical-grounding/runs/2026-10-11-piper-grip/receipt/report.json), [Execution wrapper](../topics/physical-grounding/runs/2026-10-11-piper-grip/execution.json))

The [complete local receipt](../topics/physical-grounding/runs/2026-10-11-piper-grip/README.md) preserves all 36 original bundle files byte-for-byte, including all 30 full compressed attempts and the original MIT model notices. The execution wrapper is outside the original seal. The seal-listed files total 18,727,085 stored bytes and 100,403,752 bytes when attempt JSON is decoded; this is storage, not runtime memory. The [public Robot Simulation Lab](https://huggingface.co/spaces/Dvidia/robot-simulation-lab) supplies the same [paired comparison](https://huggingface.co/spaces/Dvidia/robot-simulation-lab/resolve/bf64e4c3592058d3cf30616f0202e7ffc6cc2b4e/tasks/piper-grip/report.html) and [full hosted bundle](https://huggingface.co/spaces/Dvidia/robot-simulation-lab/tree/bf64e4c3592058d3cf30616f0202e7ffc6cc2b4e/tasks/piper-grip). Source is pinned to [`3ee94706`](https://github.com/Dvidia-Inference/dvidia-training/tree/3ee94706f436690c6d1d8554eda9202d23620e3c) with a [local installation and inspection guide](https://github.com/Dvidia-Inference/dvidia-training/blob/3ee94706f436690c6d1d8554eda9202d23620e3c/docs/piper-grip-recovery.md).

Complete raw state and command records use deterministic compressed JSON with both stored and decoded byte lengths and hashes. Local inspection checks bounded decompression, source/protocol identities, all planned attempts, matched controls, identical native mechanics, actual requested hold/support gates, sustained recorded probe qualification and final decision/event consistency. This establishes artifact consistency, not publisher authentication or an independent rerun of contact dynamics.

## What this adds to Skillspace

The follow-up [contact history v0.3 comparison](PiPER%20contact%20history%20v03.md)
separates the shared test lift from later intervention through a probe-only ablation.
Its own fresh cohort preserves the original scorer and records requested slowdown,
closed reassessment and resume separately from eventual completion. The earlier
regression and full receipt remain part of the record.

This authored decision primitive distinguishes contact, load-bearing acquisition, slip, supported retry and an incomplete task. Those distinctions can become recorded supervision and benchmark cases for a compact learned DVIDIA policy. The present experiment does not train that policy from human footage and does not improve overall completion.

The next useful experiment preregisters probe-only versus probe-plus-abort on fresh paired scenes, separating the probe’s motion from the intervention. A subsequent graded response can slow movement, hold closed and reassess using drift rate and persistent bilateral contact rather than accumulated displacement alone. Separately introduce a genuinely recoverable grasp misalignment to test whether opening/recentering fixes it. Keep a fresh frozen cohort and the same independent success rules; do not retune on these confirmation scenes and call the result confirmation. Require at least one demonstrated recovery that completes the task before promoting recovery as a product capability.

Shoe organization adds shapes, grasp locations, pair identity, orientation, deformable materials and perception. Sensor noise, delayed observations, model mismatch and physical arm trials remain separate tests before a hardware claim. Original DVIDIA tooling is MIT; the pinned upstream PiPER model retains its original MIT notice.

*Published by DVIDIA. Contact [hello@dvidia.org](mailto:hello@dvidia.org) and follow [@iammrriver](https://x.com/iammrriver).*
