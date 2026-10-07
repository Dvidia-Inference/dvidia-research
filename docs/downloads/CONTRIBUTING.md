# Contribute one testable question

Start with a [topic](https://github.com/Dvidia-Inference/dvidia-research#choose-a-question) and its numbered open questions. Topic metadata remains **scoping** and the original baseline protocols are **not run**. Separately recorded source reviews, a Clef feasibility pilot and a CPU contact fixture are linked from the journal. No owner or result is implied by an open question.

## Pick a small entry point

1. Open a [research question](https://github.com/Dvidia-Inference/dvidia-research/issues/new?template=research-question.yml) for a source correction, missing definition or testable uncertainty. Link the exact topic and question ID.
2. For a run, open an [experiment issue](https://github.com/Dvidia-Inference/dvidia-research/issues/new?template=experiment.yml) and copy the [protocol template](https://github.com/Dvidia-Inference/dvidia-research/blob/main/templates/experiment.md) into the topic's `experiments/` folder with the next available number.
3. Use a [topic proposal](https://github.com/Dvidia-Inference/dvidia-research/issues/new?template=topic-proposal.yml) only when the question does not fit the four existing topics. Explain the smallest experiment that would resolve it.

Useful first work includes checking a citation, annotating a few permission-cleared examples, adding a malformed-file fixture, or documenting a failed reproduction. A large training run is not a prerequisite.

## Write the protocol before the result

State the hypothesis and a result that would contradict it. Specify data eligibility, exclusions, original/derived relationships, grouping by participant/session/episode, a frozen split and seeds. Name the baseline and change one factor at a time. Define the metric's numerator, denominator, aggregation and uncertainty estimate. Separate strict task completion from partial progress.

Set example, time, storage and accelerator limits before running. Stop when a limit is reached or when missing rights, broken splits or incompatible dependencies invalidate the comparison. Record failed runs and setup costs. Do not automatically acquire paid compute, buy hardware or upload data to a service as part of a contribution.

Keep observations, human judgments and model estimates in separate fields. Mark imputed sensor values and synthetic media. Missing actions, force or calibration remain missing; placeholder numbers are not measurements.

## Make evidence easy to audit

Use the topic's bibliography keys and add the exact primary URL to claims. Add new keys consistently to `references.bib` and `topic.json`; list only the topic's 3–5 central sources there. Preserve authors, titles, year and artifact type. For an undated living repository, label the access year explicitly rather than inventing a publication date. Record commit IDs, checkpoint hashes, dataset revisions, dependency versions, hardware and preprocessing for runs.

Prefer compact original summaries. Link papers and source datasets instead of copying them. Code, model weights, annotations and media can have different licenses; cite their individual terms. Our [license](LICENSE) does not replace them. Do not include credentials, private source, account records, personal consent documents or participant recordings without explicit permission for this public repository. A consent reference may be public while the underlying personal document remains outside the repository.

## Submit an independently reviewable change

- [ ] Link the question or experiment issue and describe what uncertainty the change resolves.
- [ ] Cite primary sources and distinguish published findings from hypotheses.
- [ ] Include a small reproduction command or a precise manual protocol.
- [ ] Report the baseline, denominator, uncertainty, failure slices and resource use.
- [ ] Confirm that fixtures and images are redistributable and labelled accurately.
- [ ] Leave results as **not run** until execution; use **inconclusive** when evidence is insufficient.
- [ ] Update the relevant milestone only when its stated work is complete.

Topic metadata uses `status: "scoping"` until the project agrees to a new stage. Question `issueUrl` fields remain `null` until a real issue exists; experiment and review milestones stay incomplete until evidence is available. Do not invent owners, endorsements, scores or badges.

Request a review through a pull request. A reviewer should be able to distinguish a protocol edit from an actual result without reading the conversation that produced it. Cite this repository through [CITATION.cff](CITATION.cff), and cite original papers separately for their findings.

## Keep the progress cards current

Use the linked starter issue to coordinate work and check off its acceptance criteria. Include the supporting artifact or result in your pull request before changing `topic.json` milestones. The stages are scoping, reproducing, evaluating and findings; they describe the kind of work underway, not a quality score.

The site is built from reviewed repository files. Closing an issue alone does not change a card: update its question state, milestone and date in the same pull request as the evidence, then run `npm run check` and `npm test`. Commit the regenerated `docs/topics.json` too.
