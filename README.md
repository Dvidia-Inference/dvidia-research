# DVIDIA Research

Small, reproducible studies of what makes a physical demonstration useful: visible evidence, defensible relationships, traceable data and measured physical grounding.

**Status: scoping. No experiments have run.** This repository contains source reviews, open questions and proposed protocols. It does not claim trained robot skills, validated transfer or measured improvements.

[Browse the research site](https://dvidia-inference.github.io/dvidia-research/) · [Read the research agenda](reports/Physical%20skill%20research%20agenda.md) · [Start contributing](CONTRIBUTING.md)

## Choose a question

| Capture quality | Skill relations |
| --- | --- |
| [![Illustration of hands and objects framed by a POV camera](docs/assets/capture-quality.webp)](topics/capture-quality/) | [![Illustration of POV hands pouring from a pitcher into a blue mug](docs/assets/skill-relations.webp)](topics/skill-relations/) |
| **[Can we see the evidence?](topics/capture-quality/)** Compare hand visibility with human judgments of observable interactions and outcomes. | **[Can we describe what changed?](topics/skill-relations/)** Calibrate relations, then link events to actual video intervals. |
| **Evaluation and provenance** | **Physical grounding** |
| [![Illustration of a notebook with contact-sheet photos](docs/assets/evaluation-provenance.webp)](topics/evaluation-provenance/) | [![Illustration of a robotic gripper with tactile pads touching a soft block](docs/assets/physical-grounding.webp)](topics/physical-grounding/) |
| **[Can someone reproduce the result?](topics/evaluation-provenance/)** Test manifests, episode readback and split integrity. | **[What information does RGB leave out?](topics/physical-grounding/)** Compare state/contact evidence and carefully controlled synthetic augmentation. |

All four covers are **AI-generated editorial illustrations**, not footage, measurements or experimental evidence. [Image provenance](docs/assets/PROMPTS.md).

## Latest study

[Clef and grounded video observations](reports/Clef%20and%20grounded%20video%20observations.md): five licensed POV excerpts processed, with actual costs, timings and important caption/checker failures. This is an engineering feasibility result; the separate 40-episode accuracy pilot still needs its reference set.

[From Skillspace to robot skill](reports/From%20Skillspace%20to%20robot%20skill.md) reviews Argus and proposes a measurable path from accepted videos to robot-tested releases. Includes a current implementation gap analysis, DOF compatibility requirements and an unrun [annotation pilot](topics/evaluation-provenance/experiments/0002-skill-graduation.md).

## A useful first contribution

Choose one numbered question in a topic README. Open a [research question](https://github.com/Dvidia-Inference/dvidia-research/issues/new?template=research-question.yml), identify the uncertainty and link the primary source. A source correction, clearer annotation definition or tiny reproducible fixture is a useful contribution before any model run.

Each topic has a short README, `topic.json`, `references.bib` and a proposed `experiments/0001-baseline.md`. For a new run, use the [experiment template](templates/experiment.md) and [experiment issue](https://github.com/Dvidia-Inference/dvidia-research/issues/new?template=experiment.yml). Register the split, metric and resource limit before looking at results. Negative and inconclusive results belong here when someone else can reproduce them.

The four [starter issues](https://github.com/Dvidia-Inference/dvidia-research/issues?q=is%3Aissue%20is%3Aopen%20label%3A%22help%20wanted%22) are open for contributors. Each links its protocol and acceptance checklist.

## Preview and maintain the site

Use Node.js 22 or newer; there are no package dependencies to install.

```sh
npm run check
npm test
python3 -m http.server 8201 --directory docs
```

Open `http://localhost:8201`. Edit each topic's metadata and bibliography, then run `npm run build` to regenerate `docs/topics.json`. Commit both the source edits and generated catalog. GitHub Pages serves `docs/` from `main`; the validation workflow checks references, metadata, safe links and deterministic output.

## Read claims at their actual scope

The [agenda](reports/Physical%20skill%20research%20agenda.md) responds to Sam Padilla's **5 October 2026** essay, [*Robotics Data: Bet Hard Or Get Out*](https://x.com/theSamPadilla/status/2107237887091843182), through specific experiments. It separates the essay's strategic opinion, author-reported technical results and our untested proposals. No private website implementation or participant data is included.

Citation keys such as `zhang2020hands` are local to each topic's `references.bib`; the same keys appear in `topic.json`. Topic prose links keys to primary URLs. Living documents use an explicitly labelled access year when a publication date is unavailable. Cite original work for its findings and [CITATION.cff](CITATION.cff) for these protocols. Record an immutable revision when actually running code or using a dataset.

Original writing and metadata use [CC BY 4.0](LICENSE); original code uses [MIT](LICENSE-CODE). Referenced code, checkpoints, media and datasets keep their own terms. Repository openness does not establish permission to redistribute a cited dataset.
