# Why Jev recognized one of eight completed states

Offline forensic review of the unchanged 19 October 2026 run. No new Jev calls were made.

The seven misses split into **three abstentions on visible completed states** and **four incorrect incomplete verdicts on covered completed states**. The client supplied the frozen telemetry and preserved the model’s typed answers correctly. The cause inside the model is unknown.

| Case | Jev verdict | Completion Noul | Presence Noul | Choice probabilities complete / incomplete / unknown | Visible target pixels |
| --- | --- | ---: | ---: | --- | ---: |
| layout-01-complete | unknown | 0.56 | 0.99 | 0.31 / 0.06 / 0.63 | 6192 |
| layout-01-occluded | incomplete | 0.14 | 0.57 | 0.02 / 0.60 / 0.38 | 0 |
| layout-02-complete | unknown | 0.51 | 0.97 | 0.19 / 0.19 / 0.62 | 6084 |
| layout-02-occluded | incomplete | 0.07 | 0.54 | 0.01 / 0.74 / 0.25 | 0 |
| layout-03-complete | unknown | 0.62 | 0.98 | 0.36 / 0.12 / 0.52 | 6191 |
| layout-03-occluded | incomplete | 0.19 | 0.55 | 0.04 / 0.68 / 0.28 | 0 |
| layout-04-complete | complete | 0.73 | 0.98 | 0.53 / 0.07 / 0.40 | 5693 |
| layout-04-occluded | incomplete | 0.11 | 0.49 | 0.02 / 0.69 / 0.29 | 0 |

## What was ruled out

All 64 requests were reconstructed from the frozen PNGs, task and telemetry. Their exact request hashes and semantic payloads match the run. Every receipt was reparsed with the frozen client; stored probabilities, choices, presence decisions and usage agree. The append-only ledger matches the completed results, and frozen source/fixture hashes remain intact.

Completion is **the provider’s Choice answer**, not a probability threshold in our code. The 0.8 threshold applies only to presence. The successful layout 04 completion has Noul probability 0.73; changing a completion cutoff is therefore not an explanation for the observed 1/8 score. Noul probabilities and Choice distributions answer related but distinct questions and need not be identical.

All eight positive states pass every declared physical predicate in the supplied native window: target present in 100 samples, 200 ms declared duration, position and yaw within tolerance, adequate table support, released robot contact and low linear/angular speed. Their values are comfortably inside the thresholds. Every occluded case has exactly the same measured-state object as its visible complete control; only the image evidence changes.

## What the evidence supports

The frozen prompt explicitly instructs the evaluator to use measured_state, lists all thresholds and notes that the inspection cover can hide the target. The occluded images contain zero target pixels. RGB therefore cannot certify the target or physical completion; the supplied simulator telemetry can. Nevertheless, all covered positives were called incomplete. Three visible positives instead remained unknown.

This shows unreliable conversion of sufficient supplied measurements into the required completion decision on this diagnostic. It does not reveal why the model responded this way. We did not test alternate prompts, evidence formats, models or repeated samples, so claims about its internal visual bias, numerical reasoning, training or trust of telemetry would be speculation.

## How the local verifier addresses this

The proposed split assigns identity, geometry and uncertainty estimation to an image or sensor layer. A local verifier checks an explicit physical goal against typed measurements and a timestamped observation window. It returns complete only when every required predicate is established; a measured violation returns incomplete, and insufficient or invalid evidence prevents certification. Its result should include the measured predicate and reason.

The new benchmark should separately test positives, measured failures and insufficient evidence. Missing fields, invalid numbers or units, wrong identity, stale/future data, timestamp gaps, contradictory readings, boundary equality and uncertainty intervals must all be covered. Fresh scene layouts and held-out combinations prevent these eight known positives from becoming the entire test.

This is a verification component, not a perception model or a robot controller. A consistently fabricated measurement stream can satisfy arithmetic while being physically wrong; sensor provenance and hardware calibration remain separate work. A 200 ms sampled simulator window does not prove continuous real-world conditions.

## Provenance

- Frozen core: 19acf0734d63ecebc07140c8d84302a54baee4c4.
- Original results SHA256: 18c71ad02cd50763b04a90028b46740b98bd91ffa9d6071f5a179d4c22537ae4.
- Frozen plan SHA256: 5f02006190d97bdaca43f139f5bf221cece23bba868a5e9ee0f424618ea87d8f.
- [Structured per-case forensic evidence](forensics.json).

Eight positive states share four authored layouts. No additional training, provider evaluation or real-hardware validation is claimed.
