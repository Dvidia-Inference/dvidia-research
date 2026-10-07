# Clef and grounded video observations

**Engineering pilot executed · 6 October 2026 · Accuracy evaluation outstanding**

We executed a small, preregistered feasibility run: five existing public, licensed three-second POV excerpts, four original-timestamped frames per excerpt, one Gemma caption call and one Clef-flash check per excerpt. All five completed. The estimated inference cost was **$0.00140634**. This establishes that the image APIs and bounded data contract work; it does not establish that the annotations are accurate.

The useful finding was a failure: a caption called a pink plate a cutting board, and the second model agreed. Several descriptions listed objects or hand positions while missing visible folding or transfer. **Model agreement must not become a “verified” badge.** The observations below come from AI-assisted inspection of the exact input frames after outputs were frozen, not independent human annotations.

[Preregistration](https://research.dvidia.org/downloads/topics/evaluation-provenance/runs/2026-10-06-clef-feasibility/preregistration.md) · [Complete sanitized results and source/frame hashes](https://research.dvidia.org/downloads/topics/evaluation-provenance/runs/2026-10-06-clef-feasibility/results.json) · [Prompts and request recipes](https://research.dvidia.org/downloads/topics/evaluation-provenance/runs/2026-10-06-clef-feasibility/request-recipes.json) · [Next evaluation protocol](https://research.dvidia.org/downloads/topics/evaluation-provenance/experiments/0002-skill-graduation.md)

The request recipes were reconstructed after execution by replaying the frozen responses through the unchanged adapter, with all five normalized results matching. They retain prompts, schemas, model parameters and frame hashes in place of image bytes. They are a reproducibility aid, not a captured wire log.

## Is Clef a better JEV?

They share the useful pattern of state plus typed questions producing decisions. Our current JEV integration still provides category-based tag suggestions. Jev 1.13 accepts text, not images or video, and does not generate descriptions. Its documented price is $0.042 per million input tokens. [TypeSafe model reference](https://docs.typesafe.ai/models), [typed primitives](https://docs.typesafe.ai/introduction).

Cloudflare presents Clef as an open, JEV-compatible decision model with visual input. That makes it a candidate for judgments grounded in actual frames rather than only a coarse category. The announcement's comparisons are vendor evaluations, not an evaluation of DVIDIA footage. [Cloudflare announcement](https://blog.cloudflare.com/clef-decision-models/).

| Role | Candidate used or retained | Boundary |
| --- | --- | --- |
| Broad text classification / routing | Existing JEV 1.13 path | Cannot inspect pixels; a label derived from text is not a visual check |
| Readable observation | Gemma 4 26B A4B | Generates a description; can miss changes or invent details |
| Bounded visual judgment | Clef-flash | Directly checks sampled images; can still agree with an incorrect caption |
| Hand/object coordinates | Separate measured tracker, not implemented by this pilot | Captions and decision scores supply neither meshes nor boxes |
| Robot control | Separate policy and robot profile | No control actions or robot learning demonstrated here |

For the hosted Clef APIs, use the actual input schema: at most four embedded images per request, not an arbitrary video URL. Clef and Clef-flash are listed at $0.24 and $0.09 per million input tokens respectively. Local model-card video support must not be confused with the hosted image endpoint. [Clef API](https://developers.cloudflare.com/workers-ai/models/clef/), [Clef-flash API](https://developers.cloudflare.com/workers-ai/models/clef-flash/), [model card](https://huggingface.co/Cloudflare/clef).

Gemma supplies the generated text in this experiment; its listed rates are $0.10 per million input tokens and $0.30 per million output tokens. No conclusion about it being the best captioner follows from this run. [Gemma API](https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/).

**Decision:** retain JEV for its existing text decisions and evaluate Clef as an additional visual check. There was no head-to-head labeled test, so we cannot rank their accuracy.

The requested Grok CLI research was attempted twice, but the runs ended before producing a sourced memo. A direct X search for “Clef Cloudflare” reached a sign-in wall; indexed X search supplied no reliable result. We therefore attribute no community consensus or X-specific finding. The technical comparison above uses primary documentation and the actual API run.

## What ran

Fixed inputs were the local `onion`, `melon`, `shirt`, `jeans` and `pack` excerpts from EgoAnnotate, attributed to Taher Panbiharwala and Zainab Barwaniwala under CC BY 4.0. The result manifest links each source at dataset revision `156d13adaee4110cf63e54fa940ec16ff199d12f`. Hashes identify the exact excerpt bytes; full upstream originals were not independently hash-verified. No private contributor footage was used.

Each input supplied four ordered frames at 0, 1, 2 and approximately 2.95833 seconds, resized to a maximum 512-pixel side. The models received the images and timing, not the filenames or publisher task labels. No prompt changes or automatic retries occurred after inspecting results.

| Measurement | Observed result |
| --- | --- |
| Windows with schema-valid results | 5 / 5 |
| Image inference calls | 10 |
| Provider-reported input / output tokens | 12,682 / 665 |
| Price-derived estimate | $0.00140634; not an invoice or total operating cost |
| Gemma latency, median / range | 5.378 s / 3.762–29.025 s |
| Clef-flash latency, median / range | 1.704 s / 1.448–2.825 s |
| Clef support decisions | 5 “supported”; no accuracy implication |
| Accepted local outcome | 5 “unknown” |

An earlier synthetic text-only schema probe is separately recorded and excluded from these image-run totals. Extraction, storage, networking, review, taxes and application operations are not included in the estimate. Five tiny excerpts cannot estimate production latency or cost distributions.

| Excerpt | Post-run inspection finding |
| --- | --- |
| Onion | Pink plate apparently mislabeled as cutting board; checker agreed |
| Melon | Visible knife/watermelon identified; cutting progression underdescribed |
| Shirt | Inward fold visible in final frame; caption mostly described hands |
| Jeans | Folded shape visible across samples; caption mostly described holding |
| Pack | Item moves toward a container; transfer underdescribed |

These are qualitative assistant observations, not five independently adjudicated correctness labels. All raw responses and the inspection method remain in the results. Unknown local endings are preferable to fabricated task completion, but abstention alone does not establish a useful recognizer.

## Product integration and next research

The implementation path is a separately versioned annotation alongside existing capture checks. It binds source hash/bytes, original PTS, frame digests, sampling windows, model identifiers and recipe. Generated observations stay distinct from creator notes. The interface should show a small timeline, tap-to-seek moments and optional tag/description acceptance. Agreement reads “Models agree,” with the overall result explicitly unreviewed. One video decoder is sufficient.

Extraction runs next to the original. Up to six windows and 24 stills are a bounded first implementation, with gaps explicitly shown. New frame transfer requires its own opt-in; old coarse-tag consent does not grant it. Model failures never block saving. Durable attempt leases prevent refreshes from creating repeated billable calls; deletion/expiry remove derived evidence. This public report describes the contract, not private implementation code. Live activation and deployment evidence are separate from this engineering experiment.

The original [40-episode pilot](https://research.dvidia.org/downloads/topics/evaluation-provenance/experiments/0002-skill-graduation.md) remains **unrun**. This five-clip feasibility check is not a replacement for its grouped development/test split, human references or success criteria. Next steps:

- [ ] Collect the consented one-task cohort, including incomplete attempts and recoveries; freeze session-grouped splits.
- [ ] Establish independent reference labels for objects, state changes, local outcomes and temporal intervals.
- [ ] Improve the caption recipe on development data: explicitly compare before/after state and identify the manipulated object and relation.
- [ ] Compare caption-only, caption-plus-Clef and the existing coarse baseline under fixed input and cost budgets; count checker-agreed errors.
- [ ] Evaluate a stronger temporal visual model and denser sampling separately; report the cost/recall tradeoff on untouched test data.
- [ ] Persist accepted annotation revisions with account originals and task versions; retain model and creator provenance.
- [ ] Add tracking only with actual coordinates, timing, visibility and uncertainty; no decorative meshes presented as measurements.

## From a command to a learned physical skill

“Put both bottles in the cart” needs an observable goal, objects and starting conditions. A useful annotation might describe reaching, grasping, lifting, transporting and releasing, each with evidence and uncertainty. These are the proposed representation, not observations from our five clips or the user's screenshot.

That symbolic sequence is not muscle memory. The latter analogy fits a learned control policy only after it maps observations to actions on a specified robot, with measured feedback and evaluation. DOF counts alone do not define compatibility. Keep the chain explicit: **observations → accepted task episodes → versioned dataset → robot-specific training → held-out physical evaluation**. A Skillspace can organize that history, but more videos do not automatically advance its readiness. See [the graduation and compatibility proposal](https://research.dvidia.org/papers/from-skillspace-to-robot-skill/).
