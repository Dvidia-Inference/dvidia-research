# Audit a capped public T-Rex subset for state-aware retrieval

Status: **proposed / not run** · Topic: [Physical grounding](../README.md) · Issue: [starter task](https://github.com/Dvidia-Inference/dvidia-research/issues/3)

All thresholds and limits below are proposed decisions, not reported results.

## Question and hypothesis

Do temporal state and measured contact descriptors improve retrieval of useful skill segments across object identities enough to justify annotation cost? This tests a data representation; it does not test a robot controller.

## Sources

Use [trex2026paper] and [trex2026data] for dataset scope and sensor provenance. [gr00t2025n1], [nvidia2025motion] and [nvidia2026blueprint] motivate a separately gated synthetic follow-on; their headline numbers are not targets for this retrieval baseline.

## Protocol

1. Inspect public metadata and license records before acquiring episodes. Pin the exact dataset revision, preprocessing notes and selection seed. Target no more than 60 episodes spanning six primitives and multiple objects, subject to actual availability. Start with an annotation probe of no more than ten episodes.
2. Enforce a total 2 GB download ceiling. Select only needed modalities when the storage layout permits; if it does not, shrink or stop the subset and report missing coverage. Do not bulk-download the 50-hour release or imply it reproduces the 100-hour collection.
3. Two annotators mark primitive intervals, observable preconditions/effects, contact transitions and outcomes. Keep disagreement and unknown labels. Keep raw measurements, imputed values and model estimates distinct; a force threshold is not unquestionable contact truth.
4. Write retrieval queries and relevance judgments without system rankings. Compare A: primitive/object tags; B: A plus temporal states; C: B plus measured contact descriptors where available. Use one fixed simple ranking method; freeze representation/tokenization and tie-breaking before evaluation.
5. Hold out whole object identities and episodes. Keep near-duplicate segments together. If the eligible subset cannot support an object-disjoint split, report an annotation/coverage pilot rather than a generalization result.

## Metrics and decision

Recall@5 = relevant segments in the top five / all relevant segments for each query, macro-averaged across queries. Report relevance counts and the proportion of queries with no eligible relevant segment separately. State compatibility = retrieved top-five segments meeting the query's annotated start/end-state constraints / all returned top-five segments; unknown cases stay visible and do not count as compatible.

Report per-primitive results, grouped uncertainty, annotator agreement, annotation minutes, transfer/decoded bytes, CPU/GPU seconds and peak memory. Proposed continuation target: at least ten percentage points higher Recall@5 than coarse tags with no loss of state compatibility. Set the acceptable annotation cost before the run; do not infer product value solely from accuracy.

## Budget and stop condition

Metadata first, CPU-first retrieval, at most 2 GB acquired, and two annotator-hours for the initial probe. No trained foundation model, cloud job, new hardware or robot execution. Stop on unresolved artifact rights, insufficient object-disjoint coverage, ambiguous sensor provenance, unworkable labels after one revision or reached limits. Any proposed model/compute expansion needs a new preregistered budget.

## Controlled synthetic follow-on — separate proposal

Only after review, choose one simulator task with explicit success criteria. Compare the same fixed demonstration set with and without generated trajectories, equal training updates and identical held-out scene seeds. Hold geometry, physics ranges and evaluation policy fixed; record failed generations. Score strict completion and partial progress separately. Do not combine simulator trajectory costs with neural-video generation costs. Add appearance synthesis only as a separately budgeted ablation, and establish actual hardware requirements before any run.

## Reproduction artifacts

Publish the permission-cleared episode manifest, sensor/preprocessing revisions, annotation guide, query set, frozen splits, ranking configuration and a resource log. Do not publish personal consent records or unlicensed media.

## Results

**Not run.** No episodes acquired, scores measured or simulator/robot tests completed.

## Decision

Pending. A null retrieval gain or prohibitive annotation cost is a useful reason to stop the metadata expansion.

[trex2026paper]: https://arxiv.org/html/2606.17055v1
[trex2026data]: https://huggingface.co/datasets/zekaiwang/trex_dataset
[gr00t2025n1]: https://arxiv.org/html/2503.14734v1
[nvidia2025motion]: https://developer.nvidia.com/blog/building-a-synthetic-motion-generation-pipeline-for-humanoid-robot-learning/
[nvidia2026blueprint]: https://github.com/NVIDIA-Omniverse-blueprints/synthetic-manipulation-motion-generation
