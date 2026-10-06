# Pilot 0002 — Annotation quality before skill graduation

**Status: proposed, not run.** Linked question: **ep-04** ([issue #5](https://github.com/Dvidia-Inference/dvidia-research/issues/5)). No paid inference, recording transfer, hardware purchase or robot operation is authorized by this document. Resource ceilings below are proposed stop limits, not a spending commitment.

## Hypothesis and scope

For one narrowly defined object-placement task, timestamp-grounded annotations plus deterministic media checks reduce false task-completion labels compared with a fixed visual-annotation baseline (condition C versus B below). Existing coarse tagging is included only as product-capability and cost context. This measures annotation utility only. It does not establish policy improvement or robot transfer.

A result that contradicts the hypothesis is no improvement in false-completion errors on the held-out set, worse abstention-adjusted coverage, or higher cost without useful error reduction.

## Data and split

Use up to 40 original or permission-cleared episodes, at most 30 minutes of footage and 2 GB. No private account footage enters a third-party service without the applicable analysis permission. Source licenses and training eligibility are recorded separately.

Use one observable task: move an object into a specified tray and release it. Include success, incomplete attempts, successful recovery, camera motion and occlusion. Two reviewers independently mark the visible completion state and event intervals, then adjudicate disagreements. They must not see model output first. Keep unobservable outcomes unknown.

Freeze 20 development and 20 held-out episodes, grouped by capture session and demonstrator. No original/derivative or near-duplicate group crosses splits. If grouping cannot produce these sizes, report the actual split and reduce scope before opening the test set. Record original hashes, display rotation/mirroring, PTS/timebase and camera mount.

## Conditions

A. Existing coarse tag/routing output, retaining its actual capabilities. If it has no completion or interval field, report those metrics as unavailable; do not turn a category into a success label.

B. A fixed baseline visual annotation recipe supplying task/setup context and ordered sampled frames.

C. The same visual model and budget with timestamp-exact frames, explicit uncertainty and observation-grounded task verification. Keep deterministic check results separate from model judgments.

Use the same footage, source frame selection budget and pinned model settings where possible; record unavoidable differences. The Argus revision reviewed in the report is a reference implementation, not a result. Evaluate any cheaper model in a separate comparison using the frozen inputs and independent labels.

## Metrics and reporting

- Strict completion precision: adjudicated true successes among episodes called successful with an observable reference outcome. Report numerator, denominator and Wilson 95% interval; abstentions are not true negatives. Separately count unsupported success claims on reference-unknown episodes.
- False completion count, especially for occluded outcomes and success later undone.
- Success recall: correctly predicted successes divided by all adjudicated visible successes, including model abstentions in the denominator. Report numerator, denominator and Wilson 95% interval. Publish the full success/failure/unknown confusion matrix; reference-unknown episodes do not enter visible-success precision or recall denominators and are reported separately.
- Coverage: non-abstained episodes divided by eligible episodes, with abstention reason counts.
- Event matching: one-to-one same-type matching at temporal IoU >=0.5; report precision, recall, F1 and boundary absolute error for matched events. Unobserved events stay unknown.
- Deterministic faults: seed at least one truncated file, wrong episode boundary and incorrect display transform in separate synthetic fixtures. Report each detection and any false alarms on valid fixtures.
- Cost and time: actual billed or explicitly estimated inference cost, per-footage-minute processing time, retries, peak memory and cache reuse. Separate local preprocessing from model latency.

Predeclare failure slices and show per-episode errors. Advance C only if it reduces false-completion errors relative to B without lowering success recall or coverage or increasing unsupported success claims on the held-out set; otherwise report a tradeoff or an inconclusive result. A suggested engineering target is zero undetected seeded timestamp/boundary faults and >=90% completion precision, but the small pilot cannot certify a production model; intervals, coverage and critical errors govern the next decision. Review the protocol before running, not after seeing results.

## Resources and stop conditions

Proposed cap: 40 source episodes, 30 footage minutes, 2 GB, four operator-hours, CPU preprocessing concurrency <=2, and a separately approved inference cap <=US$20. Cache keys include source hash, timestamps, display transform, sampling recipe and model/prompt version. Retries consume the same cap. Stop on missing permission, unresolved dependency terms, frame mismatch, leakage, budget exhaustion or a model receiving media outside the allowlist.

Do not run upstream quickstarts that download unrelated datasets. No robot-control output or “Robot-tested” badge is produced by this pilot.

## Follow-up needed to test “more data improves the robot”

A separate preregistered experiment needs an actual compatible robot, validated calibration and synchronized action demonstrations. Freeze nested smaller/larger training sets by session and keep held-out sessions unchanged. Compare one pinned policy recipe at equal optimizer-step/compute budgets across several seeds; use the same randomized test conditions and a predeclared strict success rubric. Report successes/trials, interventions, confidence intervals, failure slices and all failed runs.

To isolate the benefit of ordinary human video, compare the same robot baseline with and without the proposed human-video-derived training signal. Simply adding robot demonstrations would test a different hypothesis. Video count, annotation count and a successful export are not outcome metrics.

Before physical trials, agree robot profile, allowed workspace, operating limits, supervision, stop mechanism and a bounded trial/compute budget. A resource estimate and power/precision analysis determine trial counts; this document does not pretend 40 annotation episodes are sufficient for hardware graduation.

## Reproducibility and publication

Publish eligible manifest metadata, split IDs, source/model/code revisions, recipe and frame digests, metrics and error analysis. Keep participant contacts, private consent documents, credentials and unlicensed media out of this repository. Record checkpoint lineage only after a real training run.

- [ ] Protocol and rights reviewed
- [ ] Fixture faults and split validated
- [ ] Independent reference labels completed
- [ ] Annotation pilot executed
- [ ] Results and limitations reviewed
- [ ] Separate control-learning experiment preregistered

**Results: not run.** [Design and source review](../../../reports/From%20Skillspace%20to%20robot%20skill.md).
