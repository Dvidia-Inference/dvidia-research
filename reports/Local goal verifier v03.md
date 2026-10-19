# A local verifier for physical completion

DVIDIA robotics research · 19 October 2026.

The [measured Jev experiment](../reports/Image%20goal%20Jev%20measured%20v02.md) recognized only one of eight physically complete scenes when given images and simulator telemetry. We traced the other seven decisions, then built a small local verifier that checks the physical conditions directly and explains its verdict.

This release separates three questions: does the physical scene satisfy the task, is the observation history sufficient to decide, and can internally consistent false readings fool the check? The third question matters as much as the first two. Arithmetic can verify a supplied measurement; it cannot establish that the sensor told the truth.

The fresh native cohort produced **16/16 recognized completions and 0/48 false completions**. Invalid or uncertain evidence produced 120 abstentions; eight injected contact spikes produced incomplete verdicts. All **eight consistent fabricated streams fooled the verifier**, producing eight physical false completions. The result supports a small local completion check when its inputs are trustworthy, while making the remaining sensing problem explicit.

## Results, separated by evidence source

| Measurement | Fresh native scenes | Evidence faults | Consistent fabricated readings |
| --- | ---: | ---: | ---: |
| Scheduled and evaluated cases | 64/64 | 128/128 | 8/8 |
| Packet-contract verdict matched | 64/64 | 128/128 | 8/8 |
| Physically complete cases called complete | 16/16 | 0/128 | Not applicable: 0 positive cases |
| Physically incomplete cases called incomplete | 48/48 | Not applicable: 0 negative cases | 0/8 |
| Physically incomplete cases called complete | 0/48 | Not applicable: 0 negative cases | 8/8 |
| Abstentions | 0/64 | 120/128 | 0/8 |
| Invalid native generation | 0 | 0 | 0 |

The aggregate physical false-completion count is **8/56**, including every deliberately forged negative. Across all 200 cases there are 24 complete, 56 incomplete and 120 unknown verdicts. Matching all 200 packet-contract references is not 100% physical accuracy: the fabricated readings are designed to pass the arithmetic, and the fault cases retain a completed physical scene while withholding or corrupting the evidence.

The 128 evidence faults contain 120 cases expected to abstain and eight cases with an injected contact spike expected to return incomplete. All these expected decisions were observed. The spike answers disagree with the unchanged completed scene, which is why the report keeps physical truth separate from evidence-based expectations.

## Measured local computation

| Cohort | Repeated calls | Median | p95 | Maximum |
| --- | ---: | ---: | ---: | ---: |
| Fresh native scenes | 6,400 | 295.083 μs | 317.461 μs | 799.084 μs |
| Evidence faults | 12,800 | 260.583 μs | 314.583 μs | 929.750 μs |
| Consistent fabricated readings | 800 | 299.875 μs | 374.079 μs | 962.875 μs |
| All cases | 20,000 | 266.583 μs | 318.169 μs | 962.875 μs |

The isolated verifier's overall p95 was **0.318 ms**, with parsed observations and the trusted goal already in memory. It still requires a **200 ms observation history**. The timer excludes history accumulation, sensing, image inference, parsing, I/O, rendering, network and actuation. These numbers are neither end-to-end robot reaction times nor a hard real-time guarantee, and they are not a matched speedup comparison with the earlier hosted Jev request.

Each case received ten warm-up calls and 100 measured repetitions. The repetitions measure compute variation, not 20,000 independent physical trials. This run used Python 3.12.9 on Darwin 25.5.0, arm64, with ten logical CPUs. No GPU or model service is required by the verifier. Native scene generation and rendering additionally need the pinned MuJoCo/NumPy dependencies, assets and a graphics context; a minimum supported hardware specification has not been measured. Generating the complete case set, including 64 native scene renders, took 13.101 seconds on this host.

## What the seven misses actually tell us

The seven telemetry-condition misses comprise three `unknown` answers on visible completed scenes and four `incomplete` answers on occluded completed scenes. They are not seven identical failures.

We reconstructed all 64 original requests, checked the frozen image and telemetry hashes, reparsed the recorded typed answers, and checked the append-only attempt ledger. Every physically complete scene satisfied the declared pose, support, release and motion requirements across all 100 native samples. Each occluded scene carried the same measured-state object as its matching visible complete control. Its image contained zero target pixels, while the instructions explicitly allowed a cover and directed the model to use the supplied measurements.

Our client did not turn these outputs into misses with a new completion threshold. The 0.8 threshold applies to presence; completion preserves Jev's typed `Choice` answer. The sole successful completion also had a separate completion-probability estimate of 0.73. Changing a probability threshold after seeing the labels would be a different experiment.

| Physically complete case | Original telemetry verdict | Separate completion probability |
| --- | --- | ---: |
| Visible, layout 01 | Unknown | 0.56 |
| Occluded, layout 01 | Incomplete | 0.14 |
| Visible, layout 02 | Unknown | 0.51 |
| Occluded, layout 02 | Incomplete | 0.07 |
| Visible, layout 03 | Unknown | 0.62 |
| Occluded, layout 03 | Incomplete | 0.19 |
| Visible, layout 04 | Complete | 0.73 |
| Occluded, layout 04 | Incomplete | 0.11 |

This audit establishes an output inconsistency with sufficient supplied evidence. It does not identify the model's internal cause. We have not isolated visual bias, training history, instruction following or numerical reasoning, and we ran no new Jev requests or alternate prompts for this release. The probability field and the categorical answer remain distinct recorded outputs.

## Make the physical contract explicit

The local verifier accepts a trusted goal and clock plus a bounded observation packet. Each sample names the target and coordinate frame and supplies presence, position, yaw, linear and angular speeds, table-support force and robot-contact force. Units and uncertainty bounds must be explicit. An observation packet cannot replace the trusted goal, thresholds or verdict.

A complete placement requires the target to be present, within 25 mm of the goal, within 15 degrees of the target yaw, supported by the table above 0.01 N, released from robot contact at or below 0.01 N, moving no faster than 0.01 m/s and rotating no faster than 0.05 rad/s throughout the scored history. The verifier checks the worst applicable bound of each measurement's declared uncertainty interval.

The required history contains 100 contiguous samples at a declared 2 ms cadence: a 200 ms interval. The newest reading must be no more than 100 ms old relative to the trusted clock. Validation covers the entire supplied packet; physical scoring uses the latest 100 samples. Duplicate timestamps, gaps, accumulated cadence drift, wrong identity or frame, invalid numbers, contradictory presence, missing fields and unsupported units prevent certification. These checks cover sampled values and declared uncertainty; they do not establish what happened between samples.

The output is one of three values. Every required condition passing yields `complete`. A definite physical violation yields `incomplete`. Insufficient, invalid or uncertain evidence yields `unknown`. Each result includes predicate states, observed extrema or intervals, thresholds and reasons. The ordering matters: a stale packet cannot earn a confident physical verdict merely because some stale number appears to fail a threshold.

## Fresh scenes, faulty evidence, and a deliberate blind spot

The new protocol uses eight newly seeded PiPER layouts with eight native conditions per layout: **64 fresh native scenes**. These retain the narrow rigid 30 g shoe proxy and declared task geometry. Complete and occluded scenes supply positive cases; missing target, wrong object, wrong position, wrong orientation, unreleased contact and moving aliases supply negatives.

We then produce **128 evidence-fault cases**: sixteen predeclared modifications for each of eight complete scenes. The physical scene and its truth label stay unchanged. Most modifications require abstention. A deliberately injected contact spike is instead a definite violation in the supplied evidence, so its expected packet verdict is incomplete. It is still physically wrong relative to the unchanged completed scene. That distinction remains visible in the report.

Finally, **eight consistent-forgery cases** attach complete-state observations to physically moving native states. The fabricated stream has valid structure, identities, units, timestamps and mutually consistent values. Passing it is the declared algorithmic expectation, and a physical false completion. These cases expose the need for independent trusted sensing, calibration and provenance. A simulator observation is privileged evidence; naming an object in a JSON packet does not authenticate an identity estimate in the real world.

Every successfully constructed seeded case remains in its original cohort, including any mismatch with its intended category. A hard construction failure instead seals a diagnostic failure record and aborts scoring. One default-seed layout was inspected during an initial development check, so these fresh layouts are not claimed to be a wholly unseen holdout. Repeated calls measure computation; they do not create new independent physical examples. The report keeps packet-contract agreement, positive recognition, negative recognition, false completion and abstention separate. Neither the evidence faults nor the forged observations are folded into a flattering single accuracy number.

## What this means for the robot architecture

An image model can identify a candidate task state, propose what to observe next, or help define an object and goal. A local verifier can check a precise, measurable completion condition. A controller still has to move the robot, handle contact and react to disturbances. The verifier here neither reads pixels nor sends actuator commands.

For an installable skill, the useful addition is a small completion contract: the intended object and goal frame, required measurement channels, tolerances, observation history and explicit reasons to continue, recover or defer. The skill should not claim success from visual resemblance alone. Nor should it treat a valid-looking telemetry packet as proof of sensor authenticity.

The next transfer test should add real camera/object tracking, force or actuator observations, calibration error, delayed frames and independent physical checks. It should measure the whole observation-to-decision path and retain both missed completions and unsafe false completions. This benchmark establishes narrow behavior on privileged simulation inputs, not a learned perception model, a manipulation policy, deformable-shoe fidelity or hardware safety qualification.

## Inspect and reproduce

[Current/goal viewer and every decision](../topics/physical-grounding/runs/2026-10-19-local-goal-verifier-v03/lab/index.html) · [All recorded results](../topics/physical-grounding/runs/2026-10-19-local-goal-verifier-v03/lab/results.json) · [Frozen local protocol](../topics/physical-grounding/runs/2026-10-19-local-goal-verifier-v03/lab/protocol.json) · [Independent native and decision audit](../topics/physical-grounding/runs/2026-10-19-local-goal-verifier-v03/lab/independent-review.json) · [Jev miss forensics](../topics/physical-grounding/runs/2026-10-19-local-goal-verifier-v03/lab/jev-forensics/forensics.json) · [Full package checksums](../topics/physical-grounding/runs/2026-10-19-local-goal-verifier-v03/lab/publication-integrity.json) · [Reproduction and licenses](../topics/physical-grounding/runs/2026-10-19-local-goal-verifier-v03/lab/README.md)

The local benchmark is frozen at [source commit `b4c76b13ccbdaff4f01726bee50fae5fcc1e4e4a`](https://github.com/Dvidia-Inference/dvidia-training/tree/b4c76b13ccbdaff4f01726bee50fae5fcc1e4e4a). Its protocol records all twelve implementation and catalog hashes; the original Jev generator, client and evaluator remain unchanged from their earlier frozen core. [Publication source](https://github.com/Dvidia-Inference/dvidia-training/tree/180e26c2d20220869f834355b92e570c142e323f) adds the measured report and truthful quality status. The independent audit checked every saved packet decision, 64 native physical references and final-state restores, all evidence perturbations and 20,000 timing samples. It also verified the frozen source Git blobs and every input hash.

Native input, viewer and full-publication inventories retain separate seals. The viewer's static syntax, data, filter and link checks passed. Desktop/mobile browser rendering and interactive-control checks remain pending because the browser environment was unavailable while the host was locked; no screenshot or browser visual pass is claimed. The [QA receipt](../topics/physical-grounding/runs/2026-10-19-local-goal-verifier-v03/lab/ui-qa.json) preserves that limitation.

Original DVIDIA code and authored simulation records use MIT. The PiPER asset's upstream notice is retained separately. The prior Jev protocol and measured follow-up remain unchanged and available. No model weights, new Jev calls, credentials or raw provider responses are included in this release.
