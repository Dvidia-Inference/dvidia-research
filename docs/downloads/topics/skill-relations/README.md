# Skill relations

**Question:** Calibrate hand–object relations, then test temporal event graphs whose claims point back to video intervals.

Status: **scoping** · Updated 6 October 2026 · Results: **not run**

[Open a research question](https://github.com/Dvidia-Inference/dvidia-research/issues/new?template=research-question.yml) · [Baseline protocol](experiments/0001-baseline.md) · [Bibliography](references.bib)

## Primary sources

- [neau2026relateanything] — RelateAnything: Real-Time Open-Vocabulary Relation Prediction From Any Inputs. 2026; see bibliography for authors and publication/access dates.
- [maelic2026code] — Maelic/RelateAnything. 2026; see bibliography for authors and publication/access dates.
- [maelic2026model] — relsgg-vits16plus model card. 2026; see bibliography for authors and publication/access dates.
- [ram2026access] — RAM: Relate-Anything-Model (undated repository, accessed 2026). 2026; see bibliography for authors and publication/access dates.
- [ji2019actiongenome] — Action Genome: Actions as Composition of Spatio-temporal Scene Graphs. 2019; see bibliography for authors and publication/access dates.

## What is known and unknown

The 2026 model by **Maëlic Neau** accepts regions and predicate strings [neau2026relateanything]. Its code is **AGPL-3.0-only plus NOTICE**, while the released weights carry separate **DINOv3** terms [maelic2026code], [maelic2026model]. It does not supply object detection itself.

The older **EvolvingLMMs-Lab RAM** project by Zujin Guo, Bo Li, Jingkang Yang and Zijian Zhou is a different SAM-mask relation project with **Apache-2.0 repository code** [ram2026access]. Its exact release date is unverified; the bibliography uses the access year. Do not mix the two projects' artifacts or claims.

Action Genome motivates changing relationships over time [ji2019actiongenome]. **Unknown:** POV transfer, score calibration, occlusion behavior and whether temporal persistence improves evidence rather than preserving mistakes. A relation graph does not establish causal prerequisites or executable robot actions.

## Open questions

1. **sr-01** — Which hand–object relations can be calibrated on held-out POV clips while abstaining on ambiguous evidence?
2. **sr-02** — How much error comes from supplied regions and track identities rather than relation scoring?
3. **sr-03** — Do simple temporal rules reduce false events without hiding short interactions or missing steps?

## First small experiment

**Define four relations and audit a 20-frame model run.**

Define `holding`, `touching`, `inside`, `on` and `unknown` with two annotators. Run 20 permission-cleared frames using human boxes and a frozen checkpoint. Audit outputs and measure RAM/VRAM, runtime and disagreement before expanding.

The pilot is CPU-capable; an available GPU is optional, with a four-hour ceiling and no training. Stop on unresolved artifact terms, out-of-memory failures or ambiguous labels. Expansion compares relation precision/coverage and then temporal event F1, boundary error and false events using cached predictions.

All sample sizes, thresholds and resource ceilings here are proposed. See the [full baseline protocol](experiments/0001-baseline.md) before running.

## Milestones

- [x] Primary sources reviewed
- [ ] Pilot protocol reviewed
- [ ] Baseline executed and artifacts published
- [ ] Independent result review

## Results

**Not run.** Source review is complete; no experiment, validation claim or independent reproduction is complete. Add measured results and their limitations only after execution.

[neau2026relateanything]: https://arxiv.org/abs/2609.12552
[maelic2026code]: https://github.com/Maelic/RelateAnything
[maelic2026model]: https://huggingface.co/maelic/relsgg-vits16plus
[ram2026access]: https://github.com/EvolvingLMMs-Lab/RelateAnything
[ji2019actiongenome]: https://arxiv.org/abs/1912.06992
