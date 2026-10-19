# Jev image-goal verification: the measured follow-up

DVIDIA robotics research · 19 October 2026.

We ran all **64 frozen requests** against `jev-1.14.0`: 32 PiPER scenes, each evaluated once with images alone and once with privileged simulator measurements, in the prespecified shuffled order. Every request returned a valid structured response. No request was retried, and no fixture, prompt, threshold or scoring rule changed after the protocol was frozen.

**Jev made no false-completion declaration in this cohort, but it usually failed to recognize a genuinely finished task.** With images and telemetry it declared only **1/8 physically complete cases** complete. Images alone produced **0/8**. All four occluded finished scenes were called incomplete under both input conditions. The result is useful for designing the next experiment; it does not qualify Jev as a robot completion gate.

This is a measured follow-up to the unchanged [v0.1 protocol](https://research.dvidia.org/papers/image-goal-jev-v01/). The `v02` publication path records the new run. The original unrun release remains available with its original evidence and status.

## What we tested

The native cohort contains eight authored conditions across four deterministic layouts: settled completion, missing target, wrong object, wrong position, wrong orientation, unreleased grasp, a moving alias and occlusion. Every fixture has an independent physical reference and a declared expected judgment for each input condition.

Completion requires the correct shoe pose, table support, released robot contact and sufficiently low linear/angular velocity at every recorded sample in a 200 ms native window. The shoe is a rigid, narrow, 30 g proxy. Neither deformable footwear nor real hardware is tested.

Four settled/moving pairs have byte-identical current and goal images and identical complete RGB requests. The moving states have an authored 0.12 m/s velocity. The distinction is deliberately absent from the still image. RGB-only judgment should therefore be `unknown` for both members of each pair. Telemetry supplies presence, pose error, contact measurements and full-window extrema; it is privileged simulator evidence, not a learned camera or contact estimator.

## Results, with the denominators retained

| Measurement | Images only | Images + native telemetry |
| --- | ---: | ---: |
| Valid structured responses | 32/32 | 32/32 |
| Frozen observability-aware verdict matched | 24/32 (75.0%) | 25/32 (78.1%) |
| Known-verdict cases answered correctly | 16/16 | 25/32 |
| Required ambiguous-case abstentions | 8/16 | Not applicable: 0 ambiguous cases |
| Physically incomplete cases called complete | 0/24 | 0/24 |
| Physically complete cases called complete | 0/8 | 1/8 |
| Physically absent targets called present | 0/8 | 0/8 |
| Presence judgment matched its reference | 28/32 | 27/32 |
| Explicit completion/incompletion decisions | 24/32 | 29/32 |
| Physical agreement among explicit decisions | 20/24 | 25/29 |
| Completion-probability Brier score, lower is better | 0.1858 (32 responses) | 0.1174 (32 responses) |

All 24 negative cases per condition also have valid model responses, so planned-negative and valid-negative false-completion denominators are both 24. No service errors or missing responses improve the observed false-completion count. An analytical always-incomplete rule would match 24/32 telemetry reference verdicts, compared with Jev's 25/32. Yet zero false completion alone is insufficient: refusing almost every positive case can produce the same result. The eight physically complete cases per condition must remain beside it.

The two observability-aware accuracies are not a clean improvement estimate. The required answer changes when telemetry makes hidden state observable. These are paired diagnostics across four correlated layouts, not independent samples of a broad robot population. We did not tune the prompt or repeat the cohort after seeing these results.

## Where the judgments fail

**Occlusion defeats completion recognition.** All four occluded fixtures are physically complete. Images-only input requires abstention; telemetry establishes completion. Jev instead answered incomplete in all eight requests. This is a concrete failure of the current frozen evaluation, not evidence that the hidden object was physically absent.

**Telemetry resolves movement but often not successful completion.** Every moving alias was called incomplete with telemetry. In the four visible settled scenes, however, the same condition produced three unknown answers and one complete answer. The remaining four physically complete cases are the occluded scenes, all called incomplete. Our interpretation is that image plausibility, physical evidence and conservative decision rules are not yet reconciled reliably; the output alone does not reveal the model's internal reason.

**Abstention is selective.** Images-only Jev correctly abstained on the four settled and four moving aliases, totaling 8/16 required abstentions. It did not abstain on the four unreleased or four occluded scenes. In the unreleased scenes, an incomplete answer agrees with physical truth but exceeds what the frozen single-image observability contract establishes about contact and dwell.

**No false presence does not mean every absence was identified.** The empty-target scenes received four unknown presence answers with images alone and three absent/one unknown with telemetry. All eight task verdicts were incomplete. The wrong-object scenes supplied the other absent-target cases and were correctly labeled absent in both conditions.

## Measured speed and cost

| Online latency | Images only, 32 attempts | Images + telemetry, 32 attempts |
| --- | ---: | ---: |
| Median | 1.585 s | 1.914 s |
| p95 | 3.548 s | 3.221 s |
| p99 | 4.022 s | 3.339 s |
| Maximum | 4.091 s | 3.371 s |

Across all 64 attempts, median online latency was **1.776 s**, p95 **3.287 s** and maximum **4.091 s**. All attempts succeeded, so all-attempt and successful-response distributions coincide. These are measured hosted-request durations on this run, not actuator reaction times, simulation timesteps or a real-time guarantee.

Timing starts with preloaded PNG bytes and includes request construction, upload, hosted response and parsing. It excludes fixture-file loading, earlier scene rendering, live-camera acquisition, robot motion and physical task duration. Quantiles use the frozen linear interpolation rule. A 64-request cohort cannot establish production tail latency, throughput under concurrency or hardware control performance.

The recorded usage yields an estimated **$0.007644756 input cost** across the 64 requests; every attempt has usage data. This is the frozen client's input-cost estimate, not a billing receipt or a complete service-cost audit. Output-token usage remains in the sanitized run records. The measured model is hosted; this run demonstrates no offline Jev inference or model-weight release.

## What this changes in the architecture

The promising use is a slower supervisory observation layer: assess visible arrangement, identify uncertainty, then request another observation or a bounded physical check. Contact limits, stopping, grasp retention and rapid movement still need local feedback and control. The measured seconds-long round trip should not sit in that fast actuator loop.

For this benchmark, supplied telemetry already contains enough evidence for the frozen deterministic physical rule. A local verifier should evaluate that rule directly and expose its reason. A model can help interpret the image or suggest what to observe next; it should not silently replace an available measured predicate. That is an architectural conclusion from this diagnostic, not a tested new controller.

The next experiment should isolate the failures: compare a deterministic telemetry verifier, the frozen visual evaluator and a separately frozen fusion rule; include occlusion, delayed/incorrect telemetry and an additional camera view. Positive-case recall, false completion, abstention and latency must all remain visible. Any new prompt or decision threshold belongs in a fresh protocol and held-out run.

## Inspect and reproduce

[Current/goal viewer](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-19-image-goal-jev-v02/lab/) · [Every recorded request result](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-19-image-goal-jev-v02/lab/results.json) · [Frozen evaluation plan](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-19-image-goal-jev-v02/lab/evaluation-plan.json) · [Independent run review](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-19-image-goal-jev-v02/lab/independent-run-review.json) · [Independent native audit](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-19-image-goal-jev-v02/lab/native-validation.json) · [Complete package checksums](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-19-image-goal-jev-v02/lab/publication-integrity.json) · [Reproduction and licenses](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-19-image-goal-jev-v02/lab/README.md)

The native generator, client and evaluator remain frozen at [core commit `19acf0734d63ecebc07140c8d84302a54baee4c4`](https://github.com/Dvidia-Inference/dvidia-training/tree/19acf0734d63ecebc07140c8d84302a54baee4c4). The [publication source](https://github.com/Dvidia-Inference/dvidia-training/tree/a3e9afb59f3a9cd7da617cf61416e24fad0a0a5c) adds the measured release and makes positive-case recall explicit in the viewer. The public run retains all 64 rows, typed judgments, probabilities, semantic request hashes, usage and measured timing. Raw provider response bodies and credentials are excluded. The original native, viewer and outer publication inventories remain distinct, and every original fixture and evaluation-plan byte is preserved.

Original DVIDIA code and authored fixture records use MIT. The PiPER asset's upstream MIT notice is retained. Jev remains TypeSafe's hosted model under its own terms. This release contains no trained weights, learned robot policy or physical-robot qualification.
