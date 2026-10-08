# Physical grounding

## Installable learned movement capsule — 7 October 2026

[Skill capsule acquisition and optimization](../../reports/Skill%20capsule%20acquisition%20and%20optimization.md) packages a learned CPU movement head inside an authored placement supervisor. A new frozen evaluation preserves teacher/student 7/8 outcomes, with no overall speedup. The local lab imports the JSON capsule, qualifies the exact scene with native placement and an identical-command/open-jaw control, and runs without retraining. Changed inputs require another test. [Source and evidence](runs/2026-10-07-skill-capsule-v1/README.md), [capsule](runs/2026-10-07-skill-capsule-v1/simlab/placement_candidate.skill.json), [browser-run replay](runs/2026-10-07-skill-capsule-v1/demo/replay.html). The capsule does not supply video learning or physical qualification.

## Paired arm benchmark and Skillspace evolution — 7 October 2026

[Skillspace arm benchmarks and evolution](../../reports/Skillspace%20arm%20benchmarks%20and%20evolution.md) publishes two development revisions and their frozen comparison. Development completion rises from 14/20 to 17/20, while held-out completion falls from 30/32 to 29/32: nominal remains 24/24 and actuator stress falls from 6/8 to 5/8. Observed instrumented CPU throughput falls from 12.28× to 11.39×. These results support explicit inputs, feedback and failure reporting; they do not establish better overall completion or calibrated physics. [Protocol and measurements](runs/2026-10-07-arm-benchmark-v1/benchmark/RESULTS.md), [source release](runs/2026-10-07-arm-benchmark-v1/release/simlab-v0.3.zip), [browser-run replay](runs/2026-10-07-arm-benchmark-v1/demo/replay.html). The proposed release inspector keeps draft simulation/hardware readiness false; future tasks require their own evidence.

## Skillspace link to articulated arm — 7 October 2026

[Installing a Skillspace on a simulated arm](../../reports/Installing%20a%20Skillspace%20on%20a%20simulated%20arm.md) publishes a one-click local installer, authored placement adapter and native articulated-arm environment. The same controller completes 6/6 changed layouts; no-motion and replayed joint commands with jaws held open each complete 0/6. Three layouts repeat successfully under native network denial. [Local product guide and source](runs/2026-10-07-skillspace-arm/PRODUCT.md). DVIDIA metadata provides task identity, not a learned policy; the box proxy, privileged state and collision-excluded arm links bound the result.

## Runnable cable environment — 7 October 2026

[Offline cable training environment](../../reports/Offline%20cable%20training%20environment.md) publishes the first practice-to-pack prototype: native CPU cable dynamics, local controller search, frozen simulated evaluation, replay and hashed export. The selected controller and fixed feedback baseline both completed 10/10 held-out episodes; zero-force and release controls completed 0/10. Search did not improve held-out completion. A separate native macOS network-denial check completed 3/3 additional episodes. [Runnable archive and instructions](runs/2026-10-07-cable-env/README.md). Ideal endpoint attachment and privileged state remain explicit; this is not the retrieval baseline, physical gripping, calibrated rope accuracy or GPU qualification.

## Recorded contact fixture — 7 October 2026

The separate [native CPU contact fixture](runs/2026-10-07-contact-fixture/) records 54 deterministic trials across 18 cases and three repeats. [The decision report](../../reports/Fast%20accurate%20robot%20training%20simulation.md) explains why endpoint agreement does not establish fingertip-force fidelity, and why coarse timesteps can miss collisions. Benchmark source, pinned dependencies, per-trial JSON, an independent AI-assisted code review and a bounded Python-network denial check are published. This fixture does not execute the retrieval baseline below or validate rope materials, GPU training or physical robot transfer.

**Question:** Which observed states, contact signals or controlled synthetic examples improve a defined task beyond coarse video tags?

Status: **scoping** · Updated 6 October 2026 · Results: **not run**

[Open a research question](https://github.com/Dvidia-Inference/dvidia-research/issues/new?template=research-question.yml) · [Baseline protocol](experiments/0001-baseline.md) · [Bibliography](references.bib)

## Primary sources

- [trex2026paper] — Dantong Niu et al., *T-Rex: Tactile-Reactive Dexterous Manipulation*, 15 June 2026.
- [trex2026data] — T-Rex public dataset card, 2026. Subset size, modalities and preprocessing provenance.
- [gr00t2025n1] — NVIDIA (Johan Bjorck et al.), *GR00T N1: An Open Foundation Model for Generalist Humanoid Robots*, 18 March 2025.
- [nvidia2025motion] — NVIDIA, *Building a Synthetic Motion Generation Pipeline for Humanoid Robot Learning*, 18 March 2025.
- [nvidia2026blueprint] — NVIDIA's synthetic manipulation blueprint, repository accessed 2026; this year is an access date.

## What is known and unknown

T-Rex reports **100 collected hours** of tactile robot data; its public dataset is **approximately 50 hours**, not the full training mixture. The card includes RGB, tactile/deformation streams, joints/actions and wrench measurements, and records preprocessing such as imputation [trex2026paper], [trex2026data]. The dataset card carries an MIT license tag; pin the revision and audit the actual artifacts before reuse. These terms do not grant rights to unrelated human videos.

NVIDIA's **11-hour simulation generation** and GR00T N1's **neural-video generation GPU-hours** describe different processes. The vendor article's **40% gain has an unresolved denominator in this review**; it is not a DVIDIA result [nvidia2025motion], [gr00t2025n1]. The blueprint's 48 GB A6000 and optional separate 80 GB H100-class workflow are documented workflow requirements, not a universal minimum [nvidia2026blueprint].

**Unknown:** whether richer metadata improves held-out-object retrieval, whether annotation cost is worthwhile, and whether a synthetic intervention transfers outside its controlled setting. This topic starts with retrieval; physical execution requires its own robot evaluation.

## Open questions

1. **pg-01** — Do temporal state descriptions and measured contact descriptors improve retrieval across held-out objects?
2. **pg-02** — Which failures require physical sensing rather than additional RGB labels?
3. **pg-03** — Does controlled synthetic augmentation improve held-out simulated completion under equal training budgets?

## First small experiment

**Audit a capped public T-Rex subset for state-aware retrieval.** Inspect metadata first, then double-annotate a small eligible subset. Compare coarse tags with temporal preconditions/effects and, separately, measured contact descriptors. Aim for up to 60 episodes across six primitives only if real coverage and a **2 GB download cap** permit it.

Measure Recall@5, state compatibility, disagreement, annotation minutes, decoded bytes, runtime and peak memory. The proposed continuation threshold is a ten-percentage-point Recall@5 gain without lower state compatibility. Use CPU and a fixed simple retrieval method first. Stop if rights, sensor provenance or object-disjoint evaluation are unresolved, or if the cap is reached; reduce the sample transparently rather than downloading the whole dataset.

A later simulator experiment must compare fixed real/teleoperated demonstrations with the same set plus generated trajectories under equal updates and held-out scene seeds. Keep strict completion distinct from partial progress, and appearance generation separately costed. This follow-on is **not authorized or run by the baseline**.

## Milestones

- [x] Primary sources reviewed
- [ ] Public-subset and annotation pilot reviewed
- [ ] Retrieval baseline executed and artifacts published
- [ ] Independent review before simulator expansion

## Results

**Not run.** No data acquisition, annotation, training, robot execution or synthetic-generation result is claimed. Published vendor/paper figures remain attributed to their original settings.

[trex2026paper]: https://arxiv.org/html/2606.17055v1
[trex2026data]: https://huggingface.co/datasets/zekaiwang/trex_dataset
[gr00t2025n1]: https://arxiv.org/html/2503.14734v1
[nvidia2025motion]: https://developer.nvidia.com/blog/building-a-synthetic-motion-generation-pipeline-for-humanoid-robot-learning/
[nvidia2026blueprint]: https://github.com/NVIDIA-Omniverse-blueprints/synthetic-manipulation-motion-generation
