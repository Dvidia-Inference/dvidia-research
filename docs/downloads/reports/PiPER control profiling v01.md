# Profiling the PiPER contact path

DVIDIA research · 31 October 2026 · PiPER control profile v0.1

## What changed

The candidate reduces allocations in the Python contact scan. It reuses a six-value force buffer within each call and constructs local membership sets once per scan. Every contact still queries fresh native forces. Contact predicates, thresholds, safety checks, dynamics and scoring are unchanged; no result is cached across physics ticks. The only runtime source difference in the frozen comparison is `piper_task.py`.

## Why profile first

The initial cProfile run was diagnostic only; profiling overhead makes its wall times unsuitable for a speed comparison. Across 21,002 contact scans, `_contacts` accumulated 0.457 s self time and 0.649 s inclusive time under cProfile, compared with 0.227 s in native `mj_step` and 0.199 s in `mj_forward`. Inclusive function totals overlap and should not be added. The profile suggested reducing repeated Python allocations while retaining each fresh native contact query and every safety/scoring check.

The candidate changes only local bookkeeping in the contact scan. The six-element force buffer is cleared before each native read; it is not shared across calls or physics ticks. Pad/non-pad and support membership sets are formed for that scan. Contact counts, force aggregation, critical-contact checks, returned observations, and outcome scoring remain active.

## Uninstrumented matched timing

The harness froze the baseline and candidate source inventories, Python executable, native assets, compiled model, preserved episode, command tape and ABBA order before timing. Each timed run executed the same 1,000 commands with no policy inference. The reported step interval includes input validation, twenty 1 ms native integrations, contact/safety/outcome work, and the returned observation and info. Reset, model compilation, setup, and evidence writes are excluded from these step means. Process CPU is measured separately from wall time.

| Run | Variant | Mean step wall (ms) | Mean step CPU (ms) | Step wall p95 (ms) |
| --- | --- | ---: | ---: | ---: |
| A1 | Baseline | 1.468496 | 1.412751 | 2.542359 |
| B1 | Candidate | 1.232893 | 1.220514 | 1.886604 |
| B2 | Candidate | 1.305327 | 1.293750 | 1.986173 |
| A2 | Baseline | 1.542341 | 1.463971 | 2.606366 |

Pooling the four run totals gives mean reductions of 15.70% for wall time and 12.60% for process CPU. In both AB/BA pairs, candidate mean step time is lower on both clocks. Two pairs on one shared host cannot establish performance across processes, machines, loads, object tasks, or different arm profiles. No hard real-time response or physical latency is measured.

## Retained mechanics diagnostics

Ten separate diagnostic processes cover five cases on both source versions: the original tape, open-jaw replay, hold control, the feedback-telemetry environment without a fault, and that environment with a 120 ms jaw-opening pulse at 8.0–8.12 s. Every process completed. The original, nominal feedback, and pulse cases passed their existing strict scorer; open-jaw and hold controls failed as expected. The scheduled jaw-opening fault did not cause a scored task failure. It does not establish slip detection or a recovery benefit; commands still come from the fixed tape.

Each diagnostic process retained 20,001 1 ms native states, numeric integration arrays, raw contacts, scorer inputs and scorer state. These instrumented runs copy state and reread contacts after scoring, so they are excluded from the timing comparison. Their expanded original-case JSON reached about 74.8 MB, above the first auditor's 64 MiB limit. The original auditor refused the document at that bound, retained its fail-closed result, and was not changed. A supplemental bounded-stream audit analyzed the same retained artifacts without rerunning physics. It verified all five dense baseline/candidate pairs exactly: 200,010 recorded snapshots across ten runs, comprising 200,000 post-step physics ticks and ten initial reset states. Each snapshot retains 19 numeric array fields, including integration state. Separate records retain raw and active contacts, force-threshold checks and cumulative histograms; the audit also recomputes scorer state independently. The supplemental audit receipt SHA-256 is `1a4f4a1093961b59c03a3a244d123afed35f5a5f77c98d1467a393a20c2d6fd4`. This confirms recorded-state equivalence for the finite diagnostic roster, not simulator correctness or physical equivalence.

## Scope and next check

The change is local CPU allocation work for one PiPER contact path. The prior frozen learned placement result remains 5/12 against the authored teacher at 12/12. This profile adds no training, camera input, new task result, cross-arm transfer, or hardware qualification. Existing releases and their evidence remain unchanged.

The source branch is `feat/piper-control-profile-v01`. No replacement wheel was created; the existing published arm-interface dev3 remains unchanged, and this experimental patch has not been promoted to a production runtime. Preserve this run as a one-scenario engineering comparison; broader optimization claims require more paired scenarios and hosts.


## Source and evidence

[Reviewed source and protocol](https://github.com/Dvidia-Inference/dvidia-training/tree/cd87f95e27f8c9351fd4fbd3b53600d95c4f1d7d/benchmarks/piper-control-profile-v01), [GitHub prerelease](https://github.com/Dvidia-Inference/dvidia-training/releases/tag/piper-control-profile-v0.1-preview), and [Hugging Face evidence dataset](https://huggingface.co/datasets/Dvidia/piper-control-profile-v01) provide the complete finite experiment, including the original reader refusal and its supplemental audit. The source commit is `cd87f95e27f8c9351fd4fbd3b53600d95c4f1d7d`.

The 127,941,580-byte evidence ZIP has SHA-256 `382eea1a7c4e82bae14b12271cb658a32cfe1562bfc211a8f31f80a911d588fa`. Its guarded verifier reconstructs source snapshots and recorded evidence from content-addressed blobs. Raw machine-path profiles, credentials, robot meshes, footage and learned weights are excluded; portable profiles and complete function tables remain. The source and synthetic evidence retain the project's MIT license.
