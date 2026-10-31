# Testing before trusting a PiPER grip

DVIDIA research · 31 October 2026 · PiPER probe evidence v0.1

## A short lift as a bounded check

If mass, friction, reach or grip are uncertain, a policy should not infer safe transport from appearance alone. This study tests a narrow simulated method: after an authored approach and grasp attempt, command a TCP probe target up to 10 mm above probe start, then request a hold at measured arm positions and the last issued jaw target. Actual object and TCP motion can continue under native dynamics and target rate limits. One policy waits for sampled bilateral-contact evidence; a control admits on a fixed timer. Neither continues into a full transfer or placement.

The evidence rule requires bilateral native pad force above 0.01 N, no table support, at least 6 mm object rise and at most 3 mm TCP-local offset drift continuously across at least 100 ms of sampled control boundaries. Those boundaries are 20 ms apart. An independent post-run reconstruction checks every recorded 1 ms native simulator row and compares the policy's admission claims to the native predicate. It can reveal disagreement between sampled decisions and the denser simulator record. Native state is privileged simulation data, not a physical sensor.

The timer control follows the same bounded 10 mm, 20 mm/s probe target law, but admits after 600 ms from probe start without evaluating the evidence predicate. Both variants retain the same authored approach/close prefix and at most one supported open/recenter/retry. Alarms, retry and hold behavior are part of the closed-loop controllers.

## Frozen finite roster

The study scheduled 12 authored synthetic scenes: 40 g and 60 g rigid blocks, three friction settings (0.80, 0.55 and 0.15), and two XY layouts. Each scene ran once with each controller, for 24/24 valid native attempts. The report retains 480,000 one-millisecond native rows and 24,000 issued control commands. These repeated deterministic cells are finite engineering evidence, not independent physical trials or a statistical estimate.

| Variant | Sampled admissions | False qualifications at admission | Conservative abstentions | Later invalidations | Final admissible native evidence | Final planning gate |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Evidence | 6/12 | 0 | 0 | 4/6 admitted probes | 2/12 | 2 ready for simulated transport · 10 require another test lift |
| Timer | 12/12 | 8 | 0 | 10 total (2 of 4 correct initial admissions) | 2/12 | 2 ready for simulated transport · 10 require another test lift |

“False qualification” counts positive admission claims that disagreed with the independent 1 ms native predicate. “Conservative abstention” is a separate category for a submitted negative claim when the native predicate qualified; omitted decisions are not inferred. It was zero among the checked claims in both variants. The timer's 12/12 admissions therefore do not mean 12 valid grips: eight were false initial qualifications. Four of six evidence admissions later lost the required probe height and were invalidated. Ten timer attempts were invalidated in total: the eight false admissions plus two of four initially correct admissions. Six timer invalidations followed support return and four followed loss of probe height. Two attempts per variant ended still in an admission hold.

An independent readback audit reconstructed the native predicate from saved arrays without importing the receipt derivation code or rerunning physics. It verified all 24 attempts, 29 probes and 480,000 1 ms rows; frozen source and raw evidence were unchanged. Eight timer admissions lacked a qualifying 100 ms native window at their decision. Four evidence admissions were initially correct but later lost the hold condition. Both variants finished with two of twelve still qualified. The audit preserves paired outcomes and hold-loss timing; it does not turn the finite roster into an accuracy or recovery-rate estimate. Audit receipt SHA-256: `b333f788d388f5e43a035b6bcd85bb6517e197d24a18c92c12efbd6ae3ccbe8f`.

The final gate combines the latest evidence receipt with caller-declared geometry, load, friction and force assumptions. Ten attempts per variant return `test_lift_required`; two return `ready_for_simulated_transport`. The latter is a planning label, not a transport execution, control permission, or hardware statement. The test does not estimate object mass or friction and does not establish that an authored 10 N per-finger ceiling is safe. That value is an arbitrary synthetic admission ceiling, not a force limiter or measured damage threshold.

## Compute scope

| Variant | Mean policy-call CPU | Mean whole-step CPU | Mean of per-attempt whole-step CPU p95 | Whole-step wall samples over 20 ms |
| --- | ---: | ---: | ---: | ---: |
| Evidence | 0.045 ms | 1.707 ms | 2.872 ms | 5/12,000 |
| Timer | 0.044 ms | 1.722 ms | 2.559 ms | 5/12,000 |

Values are descriptive summaries of these runs. Policy-call timing covers the controller call. Whole-step timing includes native simulation stepping, control work and dense recording; it excludes evidence serialization. Timing is unpaced on a shared host. It excludes physical sensing, transport and actuation, and does not establish a sensor-to-actuator deadline or hard real-time behavior.

## What this evidence supports

In this small finite roster, the sampled evidence rule admitted fewer attempts and made no false initial qualifications in the checked claims; the fixed timer admitted every attempt and made eight false initial qualifications. The audit also shows why a one-time admission is insufficient: four evidence-gated and ten timer-gated attempts later lost a required condition. The controller moved to a measured-position hold, but this is not instantaneous physical stopping; native inertia and existing target rate limits continue to matter.

This is not a causal classifier ablation. Both rules operate inside closed-loop policies, and an earlier admission or alarm can change retry timing and later trajectories. It is a bounded comparison of two complete authored admission-and-hold rules on one deterministic scene roster. It does not establish performance on unseen objects, arbitrary video-derived tasks, deformable materials, other arms, or physical robots.

No policy was trained in this study. The previously reported synthetic learned PiPER placement result remains **5/12**, against the authored teacher at **12/12**; neither number is updated here. The study adds no camera input, learned perception, full-placement result or physical qualification.

## Source and records

The runtime sources are frozen at [commit `a6a1d15`](https://github.com/Dvidia-Inference/dvidia-training/commit/a6a1d15db905214da52eb3942ebead3f85254762). The frozen protocol and run archive accompany the [GitHub release](https://github.com/Dvidia-Inference/dvidia-training/releases/tag/piper-probe-evidence-v0.1-preview) and [Hugging Face evidence dataset](https://huggingface.co/datasets/Dvidia/piper-probe-evidence-v01). Run records: [HTML report](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-31-probe-evidence-v01/report/report.html), [report JSON](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-31-probe-evidence-v01/report/report.json), [protocol](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-31-probe-evidence-v01/report/protocol.json), [independent audit](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-31-probe-evidence-v01/report/audit.json) and [inspection receipt](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-31-probe-evidence-v01/report/inspection.json).

Original DVIDIA source and authored synthetic records are MIT. PiPER simulation assets and dependencies retain their upstream licenses and notices. No physical footage, credentials, private model or hardware data are part of this study.

Release tooling and reproduction instructions are at [commit `e264c9b`](https://github.com/Dvidia-Inference/dvidia-training/commit/e264c9bd09ddc58b063f26ebce80b24a363628d2); the runtime bytes match the earlier frozen source. The evidence dataset revision is [`33aecb6`](https://huggingface.co/datasets/Dvidia/piper-probe-evidence-v01/tree/33aecb600f22d109604f8d6b0ba5effdcdf58db5). The 115,092,802-byte archive has SHA-256 `9ac7ab4167a9aea703b69f93e8fde4771777950eec272420249291a108d3fb8e`. It preserves every frozen study file and the original independent audit. A separately guarded reusable audit refuses optimized Python; its normal-mode readback reproduced the original audit receipt exactly.

The next experiment should address the observed retention failures: distinguish actual downward object drift from tool motion, then compare a bounded, force-limited response against this frozen hold baseline. Any new policy needs a fresh protocol, all attempted outcomes and an independent hold/placement score. A short successful probe provides local evidence; it does not identify the object's material or qualify a different loaded arm pose.
