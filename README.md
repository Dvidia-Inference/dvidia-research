# DVIDIA Research

[Official site](https://dvidia.org/) · [Research notebook](https://research.dvidia.org/) · [Install DVIDIA Training](https://github.com/Dvidia-Inference/dvidia-training/blob/main/docs/installation.md) · [Hardware guide](https://github.com/Dvidia-Inference/dvidia-training/blob/main/docs/hardware.md) · [Frozen benchmark evidence](https://github.com/Dvidia-Inference/dvidia-training/blob/main/benchmarks/sample-count-19047/README.md)

[Recorded demo](https://huggingface.co/spaces/Dvidia/dvidia-training) · [Synthetic datasets](https://huggingface.co/datasets/Dvidia/dvidia-training-examples) · [Pilot models](https://huggingface.co/Dvidia/dvidia-training-pilot)

Small, reproducible studies of what makes a physical demonstration useful: visible evidence, defensible relationships, traceable data and measured physical grounding.

**Status: a public local CPU training tool, recorded simulation evidence, source reviews and bounded experiments.** DVIDIA Training is research alpha: visual prediction and telemetry-supervised movement remain separate. The recorded demo and pilot models cover the original one-scene simulation pilot. Human-video action recovery and qualified hardware skills remain unestablished.

Five licensed POV excerpts and 54 native CPU contact-fixture trials are recorded. The offline cable environment executes controller search, fixed-seed evaluation and skill-pack export. The original baseline protocols, GPU training and physical robot transfer remain unrun.

[Read the research agenda](reports/Physical%20skill%20research%20agenda.md) · [Start contributing](CONTRIBUTING.md)

## Choose a question

| Capture quality | Skill relations |
| --- | --- |
| [![Illustration of hands and objects framed by a POV camera](docs/assets/capture-quality.webp)](topics/capture-quality/) | [![Illustration of POV hands pouring from a pitcher into a blue mug](docs/assets/skill-relations.webp)](topics/skill-relations/) |
| **[Can we see the evidence?](topics/capture-quality/)** Compare hand visibility with human judgments of observable interactions and outcomes. | **[Can we describe what changed?](topics/skill-relations/)** Calibrate relations, then link events to actual video intervals. |
| **Evaluation and provenance** | **Physical grounding** |
| [![Illustration of a notebook with contact-sheet photos](docs/assets/evaluation-provenance.webp)](topics/evaluation-provenance/) | [![Illustration of a robotic gripper with tactile pads touching a soft block](docs/assets/physical-grounding.webp)](topics/physical-grounding/) |
| **[Can someone reproduce the result?](topics/evaluation-provenance/)** Test manifests, episode readback and split integrity. | **[What information does RGB leave out?](topics/physical-grounding/)** Compare state/contact evidence and carefully controlled synthetic augmentation. |

All four covers are **AI-generated editorial illustrations**, not footage, measurements or experimental evidence. [Image provenance](docs/assets/PROMPTS.md).

## Latest studies

[Bounded grip waiting v0.4](reports/Bounded%20grip%20waiting%20v04.md) retains **508 scored attempts and four unknown interruptions** across 512 scheduled requests. Strict successes per 128 scheduled attempts are **42 bounded, 32 learned clock, 44 fixed and 41 teacher**. Both paired comparisons are inconclusive; waiting is bounded at 200 ms with 22 explicit aborts. [Inspect every scheduled outcome](https://research.dvidia.org/papers/bounded-grip-waiting-v04/). The compact release preserves the interruption and audit lineage; the full raw native archive remains local.

[OpenUSD workstation v0.1](reports/OpenUSD%20workstation%20v01.md) parses original rigid scene properties into a pinned PiPER/MuJoCo workstation. A frozen CPU matrix passes **45/45 passive physics checks**, including nine negative controls; all 27 normal drops also satisfy an independent settling goal. [Inspect the recorded workstation](https://dvidia-robot-simulation-lab.static.hf.space/usd-workstation/v01/index.html) or [download the local kit](https://github.com/Dvidia-Inference/dvidia-training/releases/tag/usd-workstation-v0.1). This validates a bounded scene bridge; learned manipulation and physical transfer remain open.


[Live PiPER shoe workstation v0.1](reports/Live%20PiPER%20shoe%20workstation%20v01.md)
lets readers drag a tool target, adjust the gripper and nudge a free rigid shoe
while MuJoCo runs locally in the browser. Native physics, bounded authored
control and live diagnostics now accompany the recorded asset previews.
The final native run retains **20 valid attempts**, with **14/16** target trials
passing and both high-target repetitions failing. Jaw, nudge, gravity and a
600-second native hold pass. Development and native/browser comparisons remain
separate. All fifteen development shoe-lift attempts failed;
retained lifting, learned shoe skills and hardware transfer remain unqualified.
[Open the live workstation](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-13-live-piper-workstation-v01/workstation/index.html)
or [run the Hugging Face copy](https://dvidia-robot-simulation-lab.static.hf.space/workstation/v01/index.html).


[PiPER placement reliability v0.5](reports/PiPER%20reliability%20v05.md)
completes **23/36 placements**, versus **15/36** for frozen v0.4 and **18/36**
with second lift alone. Three fresh cohorts retain **252 valid attempts** and
**0/144 negative-control successes**. The revised grasp gains eight completions
and loses none, while shared successful tasks average **0.772 simulated seconds
slower**. Twelve low-friction acquisitions and one retention failure remain.
All raw timing is retained, including 1,035 windows exceeding 20 ms on a loaded
host. The [complete evidence](topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/README.md)
keeps the unchanged task rules and separate development history; physical
qualification remains open.

[PiPER contact recovery v0.4](reports/PiPER%20contact%20recovery%20v04.md)
traces all six earlier failures to acquisition under the pinned position servo
and tests carry recovery separately from avoiding an unchanged supported retry.
Fresh confirmation retains **84 valid attempts**, with **4/12 completed placements in
every mode and 0/48 negative-control successes**. Two resumed placements finish
2.440–2.640 simulated seconds sooner while keeping their original settling holds.
Four failed acquisitions reach refusal 2.88–2.90 seconds sooner; no completion is
gained or lost. Fresh layouts expose two held-but-too-low resume failures in every
mode, alongside six acquisition failures. The [complete receipt](topics/physical-grounding/runs/2026-10-11-piper-recovery-v04/README.md)
retains every attempt and all 84,000 raw computation durations; hardware remains
unqualified.

[PiPER contact history v0.3](reports/PiPER%20contact%20history%20v03.md)
compares original motion, an identical acquisition probe without carry monitoring,
and causal contact history with requested slowdown, closed reassessment and resume.
History completes **6/12** placements versus **4/12** for both original and
probe-only motion; all **48 negative controls fail**. Four tasks complete after
closed reassessment/resume, while all six supported acquisition retries fail.
Only four of five resume windows meet the independent low absolute tool-speed
criterion; recorded motion and each attempt’s timing maximum/miss count remain visible.
The [complete confirmation receipt](topics/physical-grounding/runs/2026-10-11-piper-contact-v03/README.md)
retains all 84 planned attempts; the source-snapshotted development appendix remains
separate. Privileged simulation is not detector accuracy or physical qualification.

[PiPER grip validation and recovery](reports/PiPER%20grip%20validation%20and%20recovery.md)
adds a slow test lift, measured hold and one supported retry, but **moderate-friction
completion regresses from baseline 2/2 to guarded 0/2**. Normal cases both pass
2/2; low-friction cases both fail 0/2. No successful recovery or overall completion
improvement is demonstrated. All 30 full attempts and 53 missed computation
windows remain in the [complete confirmation receipt](topics/physical-grounding/runs/2026-10-11-piper-grip/README.md).
The authored privileged-state experiment supplies decision evidence for the next
policy study; it establishes no detector accuracy or physical qualification.

[Native grasp task benchmark](reports/Native%20grasp%20task%20benchmark.md) gives
the pinned six-axis reference a free-object contact task and matched controls.
Frozen scenario plans, complete attempt records and an
[offline 3D replay](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-11-native-grasp/replay/)
provide the next test environment for our own small action policy. The current
controller is authored; shoe physics and physical transfer remain unqualified.

[Hardware matched robot simulation](reports/Hardware%20matched%20robot%20simulation.md)
now includes an [interactive 3D arm/gripper replay](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-11-hardware-reference/replay/)
and the [hardware support map](https://github.com/Dvidia-Inference/dvidia-training/blob/c9a72584b4f35c38ad2616894f56da719bba0182/docs/hardware-roadmap.md).
PiPER and SO-101 have runnable CPU simulation profiles with unloaded numerical
receipts. PiPER also has a bounded authored block-task pilot: nominal placement
2/2, low-friction placement 0/1, and both controls 0/3, with all nine attempts retained.
Learned task and physical adapter qualification remain open; SO-101 object-task work is upcoming.
YAM, OpenArm, ARX X5 and PAROL6 remain planned integration targets. The replay displays frozen native poses and geometry;
it adds no live physics, learned skill or physical-fidelity result.

[DVIDIA Observation Lab pilot](reports/DVIDIA%20Observation%20Lab%20pilot.md) publishes our local video detection and review workflow: sampled object/palm proposals, editable timeline revisions and JSON export. Each recorded engineering run completed six public excerpts (19 seconds and 38 sampled frames); independent annotation accuracy remains unmeasured. [Read the paper](https://research.dvidia.org/papers/dvidia-observation-lab/), [install the versioned open-source release](https://github.com/Dvidia-Inference/dvidia-training/releases/tag/observation-lab-v0.1.0), or [try the synthetic browser review demo](https://huggingface.co/spaces/Dvidia/observation-lab). The hosted demo uses authored clips and boxes; real detection runs locally with separately provisioned upstream models. No action captions, validated depth or robot skill are established.

The [image-motion source alpha](https://github.com/Dvidia-Inference/dvidia-training/pull/7) adds manually seeded causal image tracking, pixel speed, short-horizon forecasts and local replay. Its six authored cases cover 720 frames and process in 1.454 seconds for 24 source seconds on one CPU run; occlusion/low-texture losses and an 89.975 px worst 500 ms reversal forecast remain explicit. [Exact source, benchmark and installation](https://github.com/Dvidia-Inference/dvidia-training/blob/ade2b541d8ca4a785bbd1effdfd33eb2a306f150/docs/motion-observations.md). The v0.1 release/Space remain separate; real-scene accuracy, metric speed, live robot latency and the full v0.2 are not established.

[Robotics research pipeline](reports/Robotics%20research%20pipeline.md) maps the path from Skillspace originals and synchronized robot measurements to reviewed episodes, local training, frozen simulation evaluation and compatible skill installation. The diagram distinguishes implemented simulation components from proposed automatic labeling and a learned task supervisor. A new annotation-labor pilot and feedback-supervisor experiment are specified; neither has been run, and physical robot qualification remains open. [Read the public architecture](https://research.dvidia.org/papers/robotics-research-pipeline/).

[Skillspace footage training pipeline](reports/Skillspace%20footage%20training%20pipeline.md) introduces the standalone [DVIDIA Training repository](https://github.com/Dvidia-Inference/dvidia-training): audit actual footage, freeze connected source groups, fit visual weights locally and export inspectable results. Its optional movement branch requires aligned numerical actions and a supported simulation adapter. The separate [frozen sample-count benchmark](https://github.com/Dvidia-Inference/dvidia-training/blob/main/benchmarks/sample-count-19047/README.md) compares two, four and seven training groups on the same twelve layouts: nominal completion is 8/8, 7/8 and 8/8; actuator-stress completion is 3/4 for each, and all 36 matched open-jaw controls fail. This single composition-order pilot establishes no sufficient video count, human-video action bridge or hardware skill. [Inspect the protocol, outcomes and recorded evidence release](https://github.com/Dvidia-Inference/dvidia-training/releases/tag/benchmark-2026-10-08).

[Installing a Skillspace on a simulated arm](reports/Installing%20a%20Skillspace%20on%20a%20simulated%20arm.md) publishes the first public-link-to-execution product path. A local installer binds DVIDIA task metadata to one authored native-contact placement controller. The same controller completes six changed scenes; no-motion and identical arm commands with open jaws each complete 0/6. [Run the local lab, inspect the source or replay the arm](topics/physical-grounding/runs/2026-10-07-skillspace-arm/PRODUCT.md). This virtual box/arm profile has no learned video policy or physical qualification.

[Offline cable training environment](reports/Offline%20cable%20training%20environment.md) publishes the first executable practice-to-pack loop. The selected controller and fixed feedback baseline both completed 10/10 held-out simulated episodes; zero-force and release controls completed 0/10. The selected controller did not outperform the baseline. [Run the source, open its replay or inspect the pack](topics/physical-grounding/runs/2026-10-07-cable-env/README.md). This remains an ideal-attachment, privileged-state CPU simulation prototype.

[Fast accurate robot training simulation](reports/Fast%20accurate%20robot%20training%20simulation.md) translates observation-to-skill research into an offline training-environment design. The published [contact fixture](topics/physical-grounding/runs/2026-10-07-contact-fixture/) contains byte-identical benchmark code and recorded outputs for 54 CPU trials. Contact-force fidelity, deformable calibration, GPU throughput and physical transfer remain separate gates.

[Grok robotics research on X](reports/Grok%20robotics%20research%20on%20X.md) checks the initial thesis against primary literature. [Spatially grounded downloadable robot skills](reports/Spatially%20grounded%20downloadable%20robot%20skills.md) sets out the proposed controller, compatibility and evaluation contract.

[Clef and grounded video observations](reports/Clef%20and%20grounded%20video%20observations.md): five licensed POV excerpts processed, with actual costs, timings and important caption/checker failures. This is an engineering feasibility result; the separate 40-episode accuracy pilot still needs its reference set.

[From Skillspace to robot skill](reports/From%20Skillspace%20to%20robot%20skill.md) reviews Argus and proposes a measurable path from accepted videos to robot-tested releases. Includes a current implementation gap analysis, DOF compatibility requirements and an unrun [annotation pilot](topics/evaluation-provenance/experiments/0002-skill-graduation.md).

## A useful first contribution

Choose one numbered question in a topic README. Open a [research question](https://github.com/Dvidia-Inference/dvidia-research/issues/new?template=research-question.yml), identify the uncertainty and link the primary source. A source correction, clearer annotation definition or tiny reproducible fixture is a useful contribution before any model run.

Each topic has a short README, `topic.json`, `references.bib` and a proposed `experiments/0001-baseline.md`. For a new run, use the [experiment template](templates/experiment.md) and [experiment issue](https://github.com/Dvidia-Inference/dvidia-research/issues/new?template=experiment.yml). Register the split, metric and resource limit before looking at results. Negative and inconclusive results belong here when someone else can reproduce them.

The four [starter issues](https://github.com/Dvidia-Inference/dvidia-research/issues?q=is%3Aissue%20is%3Aopen%20label%3A%22help%20wanted%22) are open for contributors. Each links its protocol and acceptance checklist.

## Preview and maintain the site

Use Node.js 22 or newer. The pinned build-time Markdown parser is installed by `npm ci`; readers require no JavaScript or external font service.

```sh
npm ci --ignore-scripts
npm run check
npm test
python3 -m http.server 8201 --directory docs
```

Open `http://localhost:8201`. Edit report Markdown and `publications.json` for publications; edit topic metadata and bibliographies for questions. `npm run build` generates the topic catalog, publication and topic readers, portable downloads, RSS and sitemap. Commit source edits and generated output. The static `docs/` directory supports the custom research subdomain and a subfolder preview through relative links. Validation checks references, safe links, source provenance and deterministic output.

The journal lists actual research footprints and distinguishes source reviews, proposed protocols and executed fixtures. DVIDIA is the publisher and `hello@dvidia.org` is the team contact. Individual contributor attribution is intentionally empty pending confirmation; `@iammrriver` is a general follow link, not an asserted author identity. Raw authenticated research sessions, environment files and private execution paths are excluded from the public archive.

## Read claims at their actual scope

The [agenda](reports/Physical%20skill%20research%20agenda.md) responds to Sam Padilla's **5 October 2026** essay, [*Robotics Data: Bet Hard Or Get Out*](https://x.com/theSamPadilla/status/2107237887091843182), through specific experiments. It separates the essay's strategic opinion, author-reported technical results and our untested proposals. No private website implementation or participant data is included.

Citation keys such as `zhang2020hands` are local to each topic's `references.bib`; the same keys appear in `topic.json`. Topic prose links keys to primary URLs. Living documents use an explicitly labelled access year when a publication date is unavailable. Cite original work for its findings and [CITATION.cff](CITATION.cff) for these protocols. Record an immutable revision when actually running code or using a dataset.

Original writing and metadata use [CC BY 4.0](LICENSE); original code uses [MIT](LICENSE-CODE). Referenced code, checkpoints, media and datasets keep their own terms. Repository openness does not establish permission to redistribute a cited dataset.

## Robot simulation library

[Public Robot Simulation Lab](https://huggingface.co/spaces/Dvidia/robot-simulation-lab) combines the recorded UR5e contact task with separate PiPER and SO-101 CPU mechanics receipts. [Run the open-source profiles locally](https://github.com/Dvidia-Inference/dvidia-training/blob/928fed79eca09a1a5081aae7720ab78c2e5b817c/docs/robot-simulation-library.md). Additional profile support does not transfer task or hardware qualification.
