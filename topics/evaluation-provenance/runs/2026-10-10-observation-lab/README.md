# DVIDIA Observation Lab public evidence

Six public excerpts completed two local detector/review engineering attempts on
10 October 2026. Accuracy was not assessed, all automatic outcomes remain unknown,
and no robot skill was trained or qualified.

The six JSON documents here are byte-for-byte copies of the public benchmark
records in [DVIDIA Training commit d355a4a](https://github.com/Dvidia-Inference/dvidia-training/tree/d355a4a284cf9bcc4f48dd375ca072d2da188dad/benchmarks/observation-20261010).
They retain model/source credits, license declarations, hashes, timing scope,
grouping, complete attempted-run denominators and interface-check scope.

[Read the paper](../../../../reports/DVIDIA%20Observation%20Lab%20pilot.md) ·
[Original benchmark description](https://github.com/Dvidia-Inference/dvidia-training/blob/d355a4a284cf9bcc4f48dd375ca072d2da188dad/benchmarks/observation-20261010/README.md)

| Evidence | Scope |
| --- | --- |
| [Initial protocol](initial-protocol.json) | First frozen source order, excerpt identities, model recipe and declared limits |
| [Initial run](initial-run.json) | Six attempted/completed excerpts, no failures, timing and source grouping |
| [Hardened protocol](hardened-protocol.json) | Revised zero-start admission recipe and model/license provenance |
| [Hardened run](hardened-run.json) | Separate second-attempt receipt on the same six inputs |
| [Episode summary](episode-summary.json) | Per-excerpt duration, proposal count, processing time and source hash |
| [Browser checks](ui-validation.json) | Isolated review-copy behavior; no model-accuracy inference |

Raw media, sampled frames, weights, private metadata and test review edits are not
redistributed in this evidence folder. A receipt hash binds a retained artifact;
it does not establish authenticity, semantic truth or reproduction without the
permitted inputs. Full upstream-original hashes were not independently verified.
The six excerpts share one conservative unknown-session group and cannot be
counted as six independent complete cup-placement attempts.
