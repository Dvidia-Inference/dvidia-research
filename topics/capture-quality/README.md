# Capture quality

**Question:** Test whether hands, relevant objects and state changes are actually observable in a POV demonstration.

Status: **scoping** · Updated 6 October 2026 · Results: **not run**

[Open a research question](https://github.com/Dvidia-Inference/dvidia-research/issues/new?template=research-question.yml) · [Baseline protocol](experiments/0001-baseline.md) · [Bibliography](references.bib)

## Primary sources

- [zhang2020hands] — MediaPipe Hands: On-device Real-time Hand Tracking. 2020; see bibliography for authors and publication/access dates.
- [google2026hands] — Hand landmarks detection guide (documentation accessed 2026). 2026; see bibliography for authors and publication/access dates.
- [ego4d2026fho] — FHO Overview (documentation accessed 2026). 2026; see bibliography for authors and publication/access dates.
- [mediapipe2026license] — MediaPipe source license (accessed 2026). 2026; see bibliography for authors and publication/access dates.
- [ego4d2026access] — Ego4D Start Here and license access (accessed 2026). 2026; see bibliography for authors and publication/access dates.

## What is known and unknown

MediaPipe predicts hand landmarks; Ego4D FHO describes interaction timing, objects and state changes. These establish different evaluation targets. [zhang2020hands], [ego4d2026fho].

**Unknown:** whether hand presence predicts useful task evidence, whether annotators agree, and what sustained capture overhead a particular phone/browser incurs. A published device latency is not a measurement of this protocol.

**Terms:** MediaPipe source is Apache-2.0 [mediapipe2026license]. Pin and check the model bundle separately. Ego4D media and annotations require its agreement [ego4d2026access]; this first pilot uses newly permission-cleared clips.

## Open questions

1. **cq-01** — When does visible-hand detection accept footage whose relevant object interaction is obscured?
2. **cq-02** — Do simple image-quality features improve agreement with human observability labels?
3. **cq-03** — What sampling rate preserves useful evidence without degrading sustained capture?

## First small experiment

**Draft and double-annotate a 12-clip observability pilot.**

Start with 12 short clips spanning cloth folding, object transfer and packing. Two annotators independently label hand visibility, object visibility, inspectable interaction, before/after evidence and unknown intervals. Compare hand presence with the labels before adding a detector.

Measure agreement, false acceptance of obscured intervals, usable-interval coverage and annotation minutes. Use 5 sampled frames/second and a laptop; cap the pilot at 1 GB and two annotator-hours. Stop expansion if the label definitions cannot be applied consistently. A later 120-clip study has a proposed target of ≤10% false acceptance while retaining ≥60% of observable intervals, with contributor-grouped confidence intervals.

All sample sizes, thresholds and resource ceilings here are proposed. See the [full baseline protocol](experiments/0001-baseline.md) before running.

## Milestones

- [x] Primary sources reviewed
- [ ] Pilot protocol reviewed
- [ ] Baseline executed and artifacts published
- [ ] Independent result review

## Results

**Not run.** Source review is complete; no experiment, validation claim or independent reproduction is complete. Add measured results and their limitations only after execution.

[zhang2020hands]: https://arxiv.org/abs/2006.10214
[google2026hands]: https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker
[ego4d2026fho]: https://ego4d-data.org/docs/tutorials/FHO_Overview/
[mediapipe2026license]: https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE
[ego4d2026access]: https://ego4d-data.org/docs/start-here/
