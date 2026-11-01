# Checking grip retention without changing the squeeze

DVIDIA research · 1 November 2026 · PiPER retention v0.2

In 36 valid simulated attempts, freezing the preceding issued joint target retained four grips for five seconds, compared with two for the measured-joint baseline. It also moved the tool too far: none of those four met the common stationary-pause limit. The bounded Cartesian controller refused all four admitted holds after exceeding its 4 mm position-error limit. This does not establish a new motion controller ready for use.

## From a successful probe to a retained grip

The [previous probe study](https://research.dvidia.org/papers/piper-probe-evidence-v01/) found that a correct admission did not guarantee a lasting grip. Four of six evidence-gated admissions later lost the required height. Recorded object and tool motion suggested that both tool droop and motion relative to the tool mattered. That decomposition describes motion; it does not identify a material property or prove a physical cause.

This follow-up compares three authored ways of requesting the arm hold under the same evidence-gated acquisition process. A bounded refusal can prevent a hold from starting. The comparison keeps the last issued jaw target unchanged and tests whether changing the arm reference can preserve grip without increasing the requested squeeze. No model is trained, no physical sensor is added and no controller proceeds into transport or placement.

## Three fixed hold rules

| Variant | Arm request after admission | Jaw request |
| --- | --- | --- |
| Measured joint | Freeze the six measured joint coordinates at admission | Freeze the preceding issued jaw target |
| Issued joint | Freeze the six preceding issued joint targets | Freeze the same preceding issued jaw target |
| Cartesian | Hold the measured admission TCP pose using a fixed admission bias and bounded joint corrections | Freeze the same preceding issued jaw target |

Measured joint preserves the earlier hold rule. Issued joint preserves the servo reference that was already being requested, rather than replacing it with measured coordinates. Cartesian first repeats the preceding issued target exactly. Later pose updates retain the fixed admission bias; active corrections are bounded to ±0.03 rad per joint and change by at most 0.10 rad/s. An initial bias above 0.08 rad, native target-margin exhaustion, a TCP position error above 4 mm, an orientation error above 0.05 rad or a refused pose solve causes terminal refusal. The controller does not chase a grip it has already invalidated.

All variants retain the original native 1 ms target slew, position servos and actuator force caps. A jaw position request is not a measured squeeze force. The common 10 N per-finger ceiling is an arbitrary synthetic checking threshold, not a damage calibration or force limiter. The policies check observations at 20 ms boundaries; native dynamics continue between those checks, including after a measured-position hold request.

## Frozen method and endpoints

The fresh roster contains twelve rigid-block scenes: masses of 45 g and 55 g, friction settings of 0.75, 0.50 and 0.20, and starts at (0.303, −0.026) m and (0.307, −0.037) m. Seeds are fixed at 311100–311111. Each scene is scheduled once with each variant for 36 attempts of 20 simulated seconds. Six variant permutations are repeated twice, so each variant occupies each run position four times. No trial is retried, selected or tuned after seeing these results.

The primary endpoint is **five-second native grip retention after the first admission**. Admission must have a correct continuous 100 ms native prefix. Every 1 ms sample through the next five seconds must retain bilateral contact counts, pad forces strictly above 0.01 N and at most 10 N, no table support or unexpected contact, at least 6 mm rise from that probe's origin and at most 3 mm TCP-local offset drift. A run must also be complete, valid and warning-free, with no unexpected contact anywhere. Any recorded post-admission force above 10 N vetoes primary success, including one after the five-second endpoint. Missing admission and insufficient follow-up remain failures; no missing interval is padded.

A separate common endpoint requires primary grip retention **and TCP stationarity**: every native TCP pose over those five seconds must stay within 4 mm and 0.05 rad of its admission pose. The same limits apply to all three variants. Freezing a target can retain a grip while the tool still moves, so grip retention alone is not described as a stationary pause. Controller qualification at five seconds and final controller/native qualification are reported separately from these native endpoints.

The read-only inspector reconstructs every applied control from the issued tape and unchanged native slew law. It compares acquisition traces through the earliest treatment boundary across the three variants: an admission or an explicit pre-admission hold-bound refusal. Native rows include that boundary; commands strictly before it must match. If no treatment starts, full traces are compared. This permits a genuine bounded Cartesian refusal without hiding a difference in the shared acquisition prefix.

## Measured outcomes

All 36 scheduled attempts completed valid native recordings, retaining **720,000 one-millisecond rows and 36,000 issued commands**. The read-only inspector reconstructed every applied command and verified all twelve common acquisition-prefix triplets. Each variant admitted the same four friction-0.75 scenes, with no false initial admission against the native prefix. All eight lower-friction scenes lacked admission under every variant. Those refusals remain in the denominator; changing the later hold rule did not solve their acquisition.

| Variant | Admissions | False initial admissions | Native grip retained for 5 s | Grip + stationary TCP for 5 s | Controller qualified at 5 s | Final controller + native qualification |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Measured joint | 4/12 | 0/4 admitted | 2/12 | 2/12 | 2/12 | 0/12 |
| Issued joint | 4/12 | 0/4 admitted | 4/12 | 0/12 | 4/12 | 4/12 |
| Cartesian | 4/12 | 0/4 admitted | 4/12 | 0/12 | 0/12 | 0/12 |

The measured-joint baseline satisfied both five-second endpoints in the two 45 g admitted scenes. Both later lost the required probe height before the 20-second recording ended. The two admitted 55 g baseline scenes lost the native grip predicate before five seconds. Thus its two qualified short pauses are not two lasting final holds.

Issued joint preserved all four admitted native grips and remained qualified at the final observation. Its maximum admission-relative TCP displacement over five seconds was **4.68–4.80 mm**, exceeding the common 4 mm bound in every admitted scene. The arm can keep an object while moving beyond the task's allowed pose region. A grip-only score would conceal that failure.

Cartesian also retained the native grip predicate for five seconds in the four admitted scenes, but that does not mean its regulator stayed active successfully. It terminally refused at **1.62–1.74 s after admission** because observed TCP position error exceeded 4 mm. Subsequent dynamics followed its measured-position fallback. Its recorded five-second TCP excursions were **4.20–4.28 mm**; all four failed stationarity, and none remained controller-qualified at five seconds or the final observation. The primary grip score includes the actual post-refusal trajectory and is separate from controller success. Orientation stayed within the 0.05 rad bound in these admitted cases; translation was the failing pose limit.

The largest recorded active Cartesian correction was approximately 0.000240–0.000244 rad across the four admitted cases, with no recorded correction rate-limit activation. The declared ±0.03 rad correction ceiling was not exhausted. This is a retained negative result for this specific biased pose-update rule, not evidence that increasing a gain or squeezing harder will fix the task. No controller is promoted from these results.

An independent NumPy readback, without importing the controller or scorer, reconstructed all 36,000 commands and inspected all 720,000 native rows. It matched the reported outcomes and all twelve shared acquisition prefixes, checked the correction bounds and unchanged jaw targets, and rehashed the retained source and every study file. Its receipt is SHA-256 `710516172db5e7851ed88a37278d8696271860b84643b456fcb2b3e64b2bb5ec`. Initial readback implementation errors were fixed with their logs retained locally; no simulation was rerun or raw study file changed.

## Compute scope

| Variant | Mean policy-call CPU | Mean whole-step CPU | Mean per-attempt whole-step CPU p95 | Mean per-attempt whole-step CPU p99 | Whole-step wall samples over 20 ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| Measured joint | 0.048 ms | 1.715 ms | 2.970 ms | 3.743 ms | 9/12,000 |
| Issued joint | 0.048 ms | 1.743 ms | 3.037 ms | 3.876 ms | 5/12,000 |
| Cartesian | 0.049 ms | 1.754 ms | 3.118 ms | 4.115 ms | 12/12,000 |

These are descriptive summaries of the recorded unpaced shared-host runs. Percentile columns average the twelve per-attempt percentiles; they are not pooled percentiles or confidence bounds. Whole-step timing includes native simulation, control work and dense telemetry. Reset/compile and evidence serialization are separate. The 26 wall samples above 20 ms are compute observations, not physical deadline misses. Timing excludes cameras, sensor transport and actuation and establishes no hardware latency or hard real-time guarantee.

## The retained Cartesian development failure

Before the fresh roster, one authorized Cartesian development smoke used an earlier 40 g, friction-0.80 scene at (0.300, −0.030) m. It completed the 20-second recording without an API error, admitted at 11.86 s and terminally refused at 13.46 s when observed TCP error exceeded the declared 4 mm ceiling: 1.60 s after admission. Its failure was retained, with no parameter adjustment or rerun. It is excluded from the 36-attempt fresh roster and its denominators. This smoke was an integration check, not a successful stationary hold or independent confirmation trial.

## What this comparison can establish

These are finite deterministic development cells for authored control rules. They do not estimate real-object reliability, establish a general advantage for a controller or qualify an unseen mass, friction, material, arm or loaded pose. A successful native grip predicate does not infer mass or friction. The independent record is privileged simulator state, not authenticated hardware telemetry; hashes detect changes and bind artifacts, not the truth of an external claim.

No human video, learned perception, policy training or complete placement is evaluated here. The previously reported learned PiPER placement result remains **5/12**, against its authored teacher at **12/12**. Neither number is updated by this study. Tool regulation and position-target refusal do not implement physical stopping, calibrated force control or hardware safety.

The next comparison needs to preserve both a native grip and an admission-relative pose region. It should retain the measured and issued references as controls, investigate why the present Cartesian update produces so little compensation, and freeze a new bounded controller before fresh cells are run. It must keep acquisition failures visible, retain the same force assumptions and score tool motion independently of object retention. This result supplies a narrower diagnostic target; it does not complete video-to-skill transfer.

## Source and records

Runtime source is frozen at [commit `6ab5e34`](https://github.com/Dvidia-Inference/dvidia-training/commit/6ab5e34ecbdd39ba58f4bb143135d0bfd0db3202). Protocol SHA-256: `a6b16cce45f364995787baf456d6c3e0b858c8572402957c777c784beeaf4565`. The protocol's UTC creation date is 1 November 2026; the run directory retains the initiating 31 October research checkpoint date.

The complete record accompanies the [GitHub release](https://github.com/Dvidia-Inference/dvidia-training/releases/tag/piper-retention-v0.2-preview) and [Hugging Face evidence dataset](https://huggingface.co/datasets/Dvidia/piper-retention-v02). Public records: [HTML report](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-31-piper-retention-v02/report/report.html), [report JSON](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-31-piper-retention-v02/report/report.json), [protocol](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-31-piper-retention-v02/report/protocol.json), [independent audit](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-31-piper-retention-v02/report/audit.json) and [inspection receipt](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-31-piper-retention-v02/report/inspection.json).

Reproduction and publication tools are at [commit `bc106d6`](https://github.com/Dvidia-Inference/dvidia-training/commit/bc106d6f66367f8896787a2303aa0a124c69ea56); runtime bytes remain identical to the earlier freeze. The dataset revision is [`89ebc1b`](https://huggingface.co/datasets/Dvidia/piper-retention-v02/tree/89ebc1b82e11f346c8f06a23b6b6ea6ecf2438aa). The 181,454,260-byte evidence archive preserves 392 inventory files, including the separate development smoke. Archive SHA-256: `832cbf5ed26ad8a16fe873df0a2ea9c0a23818f95ed433025b8cb53b9613e99d`.

Original DVIDIA source and authored synthetic records are MIT. Robot simulation assets and dependencies retain their upstream licenses and notices. No physical footage, credentials, private model or hardware data are part of this study.
