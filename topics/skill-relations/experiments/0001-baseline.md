# Define four relations and audit a 20-frame model run

Status: **proposed / not run** · Topic: [Skill relations](../README.md) · Issue: [starter task](https://github.com/Dvidia-Inference/dvidia-research/issues/4)

All numeric thresholds below are proposed decisions, not published results.

## Question and hypothesis

Can calibrated, frozen relation predictions support evidence-linked event intervals? Evaluate single-frame perception first and temporal processing second, so a failed detector does not masquerade as a temporal reasoning result.

## Sources and artifact identity

Use **Maelic/RelateAnything**, associated with [neau2026relateanything], for the proposed frozen model. Pin [maelic2026code] and [maelic2026model], including AGPL/NOTICE and DINOv3 terms. [ram2026access] is a separate, older project; it is not a drop-in checkpoint. [ji2019actiongenome] motivates temporal relationships but is not ground truth for this study.

## Protocol

1. Define relation direction and scope for `holding`, `touching`, `inside`, `on`, plus `unknown`. Double-annotate 20 permission-cleared frames with human regions and plausible negative object pairs. Keep uncertainty visible.
2. Run a pinned model at batch size one. Record outputs, preprocessing, latency and peak RAM/VRAM. Stop if the probe exceeds resources or definitions fail.
3. If the probe is viable, separately preregister about 600 frames from at least 60 clips. Split by contributor/original recording. Fit thresholds only on validation; compare human boxes, one pinned detector and geometry-only baselines. Keep oracle and detected-region results separate.
4. For the temporal stage, annotate complete relation intervals and track IDs on 40–60 short clips across two procedures. Compare independent predictions, hysteresis/minimum-duration rules, and rules with explicit unknown spans. Start with human tracks, then measure tracker identity errors separately.

## Metrics and decision

Relations: per-predicate precision/recall, PR curves, coverage at fixed precision, support counts and grouped confidence intervals. Proposed continuation target: ≥80% precision at ≥50% coverage; unknown cases and abstentions are reported separately.

Events: F1 at temporal IoU 0.5, boundary error, false events/minute, order accuracy and track-ID switches. Proposed continuation target: ≥10% relative reduction in false events with no more than five percentage points of recall loss. Every event/edge must reference original clip, interval, tracks and producing method. Do not infer causality from ordering.

## Budget and stop condition

Start with 20 frames; cap the initial model run at four GPU-hours if using an available GPU. CPU fallback is allowed. An 8–12 GB VRAM envelope is a proposal to probe, not a verified minimum. No fine-tuning, bulk training-data reproduction or automatic paid jobs. Temporal processing uses cached predictions on CPU; cap source clips at 30 minutes total. Stop on unresolved licenses, broken splits, exceeded budget or an inconclusive pilot that needs new labels.

## Reproduction artifacts

Publish the predicate guide, permission-cleared manifests, region/track labels, model and dependency hashes, raw predictions, calibrated thresholds and evaluator. Keep observed, human-labelled and model-estimated edges distinct.

## Results

**Not run.** No accuracy, latency, temporal improvement or transfer has been measured.

## Decision

Pending. Publish negative transfer and calibration failures as results rather than silently replacing the test set.

[neau2026relateanything]: https://arxiv.org/abs/2609.12552
[maelic2026code]: https://github.com/Maelic/RelateAnything
[maelic2026model]: https://huggingface.co/maelic/relsgg-vits16plus
[ram2026access]: https://github.com/EvolvingLMMs-Lab/RelateAnything
[ji2019actiongenome]: https://arxiv.org/abs/1912.06992
