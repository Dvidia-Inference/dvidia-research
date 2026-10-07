# Evaluation and provenance

**Question:** Test episode readback, original-to-derivative lineage and split integrity using small, auditable fixtures.

Status: **evaluating** · Updated 6 October 2026 · Results: **image feasibility run complete; reference accuracy and provenance baselines not run**

[Open a research question](https://github.com/Dvidia-Inference/dvidia-research/issues/new?template=research-question.yml) · [Baseline protocol](experiments/0001-baseline.md) · [Bibliography](references.bib)

## Primary sources

- [ramos2021rlds] — RLDS: an Ecosystem to Generate, Share and Use Datasets in Reinforcement Learning. 2021; see bibliography for authors and publication/access dates.
- [rlds2026schema] — RLDS dataset schema (repository accessed 2026). 2026; see bibliography for authors and publication/access dates.
- [lerobot2026v3] — LeRobotDataset v3.0 (documentation accessed 2026). 2026; see bibliography for authors and publication/access dates.
- [gebru2021datasheets] — Datasheets for Datasets. 2021; see bibliography for authors and publication/access dates.
- [lerobot2026license] — LeRobot source license and third-party notices (accessed 2026). 2026; see bibliography for authors and publication/access dates.

## What is known and unknown

RLDS describes episode boundaries and optional action fields [rlds2026schema]. LeRobot v3 stores episode metadata alongside tabular/video shards and requires writer finalization [lerobot2026v3]. Datasheets motivates describing collection and intended uses [gebru2021datasheets].

**Unknown:** whether a selected observation-only export loads in the pinned reader, whether timestamps remain aligned, and how reliably near-duplicates can be detected. A familiar directory structure or a hash alone does not answer those questions.

**Terms:** RLDS source uses Apache-2.0; LeRobot uses Apache-2.0 with third-party notices [rlds2026schema], [lerobot2026license]. Referenced data retains its own terms. Missing robot actions remain missing.

## Open questions

1. **ep-01** — Can independent environments reproduce identical inventories, grouped splits and supported episode readback?
2. **ep-02** — Which corruptions and duplicated derivatives evade a small provenance validator?
3. **ep-03** — How much does recording-level leakage change the selected evaluation metric?
4. **ep-04** — Do grounded temporal annotations reduce false completion labels, and what evidence should gate a robot-tested skill release? See the [Argus review and graduation proposal](../../reports/From%20Skillspace%20to%20robot%20skill.md) and [proposed pilot](experiments/0002-skill-graduation.md).

## First small experiment

**Design a five-episode fixture with three deliberate faults.**

Create five tiny original or permission-cleared video episodes. Seed a wrong hash, a truncated file and a derivative placed in the wrong split. Build a neutral manifest and check it before adding optional RLDS/LeRobot adapters.

The first acceptance target is detection of all three seeded faults and reproducible inventory/split hashes in two clean environments. Use CPU only, 16 GB RAM and a 1 GB fixture ceiling. Stop on ambiguous rights, unknown timebase or a reader requiring unavailable signals. A proposed expansion has 30 episodes and at least 12 controlled faults.

All sample sizes, thresholds and resource ceilings here are proposed. See the [full baseline protocol](experiments/0001-baseline.md) before running.

## Milestones

- [x] Primary sources reviewed
- [ ] Pilot protocol reviewed
- [ ] Baseline executed and artifacts published
- [ ] Independent result review

## Results

The [five-clip Clef feasibility run](../../reports/Clef%20and%20grounded%20video%20observations.md) completed ten image calls for an estimated $0.00140634. It exposed caption omissions and a checker-agreed object error. [Raw results and preregistration](runs/2026-10-06-clef-feasibility/) are available; independent review and the original baselines remain outstanding.

[ramos2021rlds]: https://arxiv.org/abs/2111.02767
[rlds2026schema]: https://github.com/google-research/rlds
[lerobot2026v3]: https://huggingface.co/docs/lerobot/lerobot-dataset-v3
[gebru2021datasheets]: https://arxiv.org/abs/1803.09010v8
[lerobot2026license]: https://github.com/huggingface/lerobot/blob/main/LICENSE
