# Draft and double-annotate a 12-clip observability pilot

Status: **proposed / not run** · Topic: [Capture quality](../README.md) · Issue: [starter task](https://github.com/Dvidia-Inference/dvidia-research/issues/1)

All numeric thresholds below are proposed decisions, not published results.

## Question and hypothesis

Does a hand-presence signal distinguish observable hand–object interactions from obscured ones? The hypothesis fails if it accepts hand-visible intervals in which relevant objects or state changes cannot be inspected.

## Sources

Use [zhang2020hands], [google2026hands] and [ego4d2026fho] in the topic bibliography. Check [mediapipe2026license] and model-specific terms. No Ego4D download is required.

## Protocol

1. Select 12 newly permission-cleared, short clips: four each of cloth folding, object transfer and packing. Include two viewpoints plus natural blur, occlusion and out-of-frame objects. Record selection criteria before annotation.
2. Two annotators mark intervals independently: relevant hand visible, relevant object visible, interaction inspectable, before/after state inspectable, or unknown. Retain disagreements before adjudication.
3. Run a pinned hand-landmark model at 5 fps. Compare a preregistered hand-presence threshold with observability labels. Log decode/inference time and missing results. Do not tune on test clips.
4. If the definitions are workable, preregister a separate expansion to 120 clips. Group derivatives, sessions and contributors in splits; choose thresholds on validation only. Compare hand presence, sharpness/exposure features and their combination.

## Metrics and decision

Pilot: agreement rate and disagreement categories, annotation minutes, usable-interval coverage, and false acceptance = accepted non-observable intervals / all non-observable intervals. Use interval definitions fixed before scoring. Do not treat adjacent frames as independent samples.

Expansion target: ≤10% false acceptance while retaining ≥60% of observable intervals; report contributor/clip-grouped confidence intervals and per-task slices. This is a proposed continuation rule, not a known capability. A 10-minute device test should separately compare capture alone with capture plus inference; proposed overhead limit is <5% decoded-frame-rate degradation.

## Budget and stop condition

Pilot ceiling: 12 clips, 1 GB and two annotator-hours, laptop/available phone only. No training or paid compute. Stop if rights are unresolved, labels remain ambiguous after one revision, capture becomes unstable or the ceiling is reached. Document the reason instead of expanding automatically.

## Reproduction artifacts

Release the label guide, permission-cleared manifest, split IDs, model hash, software/hardware versions, predictions and failure examples. State whether stress variants are synthetic derivatives.

## Results

**Not run.** No measured agreement, accuracy or device performance.

## Decision

Pending the pilot. A negative result can justify revising the quality signal or keeping it descriptive.

[zhang2020hands]: https://arxiv.org/abs/2006.10214
[google2026hands]: https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker
[ego4d2026fho]: https://ego4d-data.org/docs/tutorials/FHO_Overview/
[mediapipe2026license]: https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE
[ego4d2026access]: https://ego4d-data.org/docs/start-here/
