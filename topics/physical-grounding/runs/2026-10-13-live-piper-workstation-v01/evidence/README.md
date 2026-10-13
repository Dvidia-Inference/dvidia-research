# Live PiPER shoe workstation v0.1 — complete evidence

Frozen runtime: [79ffdda1c0759bce1201ce3391c40403c385c39b](https://github.com/Dvidia-Inference/dvidia-training/tree/79ffdda1c0759bce1201ce3391c40403c385c39b).

Native confirmation: **14/16 tracking attempts passed; all 20 attempts numerically valid**. Both high-target repeats failed, with 31.44mm final error. Jaw travel, physical shoe nudge, disabled-table gravity and 600 simulated seconds of native holding passed. This is authored control of a rigid synthetic shoe; retained shoe lifting is unqualified and physical robot transfer is unmeasured.

- [Native report](native/report.json), [frozen protocol](native/protocol.json), [all attempts and trajectories](native/attempts.json), and [native inventory](native/integrity.json).
- [Source binding](source-binding.json): native run began immediately before the Git commit. Its original null source-commit field remains unchanged; every protocol implementation hash matches the frozen revision.
- [UI acceptance](ui-acceptance/acceptance.json), [session receipt](ui-acceptance/session.json), [desktop screenshot](ui-acceptance/workstation-1440.png), [mobile screenshot](ui-acceptance/workstation-320.png).
- [Installed-wheel validation](wheel-validation.json): all 99 exported files match the frozen source export byte for byte.
- [All 15 failed development grasp attempts](development/grasp-search.json), [orientation exploration](development/orientation-search.json), and [four controller-cap trajectories](development/controller-caps-search.json).
- Earlier development [baseline report](development/native-benchmark/report.json) and [candidate report](development/native-candidate/report.json), including the invalid old push request and both high-target failures. Complete attempt records and integrity files accompany each.
- Preliminary [native comparison](development/native-parity-30s.json) and [strict WASM comparison failure](development/wasm-parity-30s.json), plus the contact-force audit. Raw near-zero contact-count differences remain failures of strict parity.
- Preliminary software-rendered [browser result](development/browser-dev-v05-20s-r2/browser-benchmark.json) and original [form-draft failure](development/browser-dev-20s/browser-failure.json). Development latency quantiles used an earlier estimator; final browser evidence uses nearest-rank quantiles. Software rasterization does not measure the laptop GPU.

- [Final 600-second browser benchmark](browser/browser-benchmark.json), [raw samples and durations](browser/browser-raw-samples.json), and [bounded session receipt](browser/session-receipt.json). Apple M5 Metal / Chromium 151: 51.39 render invocations/s, 0.99998× real time, no warnings or accumulated lag. Across 61 target commands, target echo p95=20.6ms and first observed>=1mm TCP movement p95=61.9ms; all responded. Rendering calls are not measured GPU presentation completions, and response is simulator/UI latency, not hardware latency.
- [Final native fixture](parity/native-parity.json) and [WASM comparison](parity/wasm-parity.json) include an off-control-boundary gripper command. Numerical and loaded-contact comparisons pass; strict raw counts differed in 13/1,500 states (extra forces<=4.44e-10N), so strict parity failed and the nonzero exit code is retained.

The development browser failure's exception stack has its local checkout prefix redacted in the public copy, with the original file hash recorded. All numerical results remain unchanged. Native timing includes control, ten physics steps, forward kinematics and diagnostics; browser rendering and hardware actuation are excluded. Tests ran on a shared development laptop, not an isolated real-time host.

DVIDIA software, original shoe geometry and screenshots: MIT. MuJoCo: Apache-2.0 with dependency notices; PiPER simulation assets and Three.js: MIT. Research prose: CC BY 4.0. Keep upstream notices with the full workstation export.
