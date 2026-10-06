# Design a five-episode fixture with three deliberate faults

Status: **proposed / not run** · Topic: [Evaluation and provenance](../README.md) · Issue: [starter task](https://github.com/Dvidia-Inference/dvidia-research/issues/2)

All numeric thresholds below are proposed decisions, not published results.

## Question and hypothesis

Can a small, explicit manifest make episode integrity, derivative lineage and evaluation grouping independently reproducible? A successful validator must detect seeded defects; writing files into a named format is insufficient.

## Sources

Use [ramos2021rlds], [rlds2026schema], [lerobot2026v3] and [gebru2021datasheets]. Pin reader versions and inspect [lerobot2026license] plus each fixture's rights.

## Protocol

1. Start with five original/generated or explicitly permission-cleared episodes. Label synthetic fixtures. Record original SHA-256, pseudonymous recording/session ID, license record, source/revision, frame timebase, annotation version and transformation parameters. Keep personal consent documents outside the public repository.
2. Seed three faults: wrong hash, truncated media and a derivative assigned across splits. A derivative gets its own hash and `derived_from` link; its original's grouping must persist.
3. Validate metadata before reading bytes. Reproduce the canonical inventory and split hashes in two clean environments. Record exact commands and versions.
4. If useful, expand to 30 episodes with at least 12 faults, including absent files, shifted/non-monotonic timestamps, incorrect boundaries and incomplete license records. Include exact, transcoded and cropped duplicates.
5. Add an observation-only RLDS adapter and optional LeRobot v3 readback. Do not invent zero actions, force, reward or calibration. Declare unsupported adapters when required fields are unavailable. Finalize writers and actually decode/read episodes.

## Metrics and decision

Pilot: detect all three seeded faults and reproduce identical inventory/split hashes. Expansion: detect all seeded structural faults and exact duplicates; report near-duplicate precision/recall separately. Report episode counts, alignment errors and bytes decoded. Proposed alignment tolerance is one declared source-frame interval, with explicit resampling and frame-correspondence checks.

If comparing evaluation splits, freeze the model and metric first. Compare frame-random and recording/session-grouped splits to quantify leakage; only the grouped split supports the main result. Hashes establish byte identity, not semantic equivalence or permission validity.

## Budget and stop condition

CPU only; proposed ceiling 16 GB RAM and 1 GB for the pilot, 5 GB for an agreed expansion. No bulk dataset acquisition or training. Stop on unresolved rights, unknown timebases, unavailable required fields or any resource ceiling. Report unsupported export/readback plainly.

## Reproduction artifacts

Publish the original manifest, derivation graph, seeded-fault specification, fixture licenses, validation output, reader versions and checksummed split/evaluation configuration. Missing rights produce an unresolved status, not a public-ready label.

## Results

**Not run.** No validator, readback success or leakage measurement is claimed.

## Decision

Pending. The first review should check whether the fixture is small enough for a second contributor to reproduce.

[ramos2021rlds]: https://arxiv.org/abs/2111.02767
[rlds2026schema]: https://github.com/google-research/rlds
[lerobot2026v3]: https://huggingface.co/docs/lerobot/lerobot-dataset-v3
[gebru2021datasheets]: https://arxiv.org/abs/1803.09010v8
[lerobot2026license]: https://github.com/huggingface/lerobot/blob/main/LICENSE
