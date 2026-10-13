# Live PiPER shoe workstation v0.1

[Open the live workstation](workstation/index.html) · [Research report](../../../../reports/Live%20PiPER%20shoe%20workstation%20v01.md) · [Hugging Face](https://huggingface.co/spaces/Dvidia/robot-simulation-lab) · [GitHub implementation](https://github.com/Dvidia-Inference/dvidia-training/pull/17)

Drag the tool target, actuate the native gripper and nudge a free rigid trainer. MuJoCo runs locally in the browser with 500Hz physics and 50Hz authored control. The 99-file export works offline after provisioning and local HTTP serving.

**14/16 target attempts passed; 20/20 attempts were numerically valid.** Both high-target repeats failed. Jaw travel, shoe impulse, removed-table gravity and 600 simulated seconds of native holding passed. The 15 development grasp attempts all failed retained lift. This release does not contain a trained shoe-organizing policy or hardware qualification.

The [final ten-minute browser run](evidence/browser/browser-benchmark.json) reports **51.39 render calls/s** and a **0.99998 simulation/wall-time ratio** on the tested Apple M5 / Chromium 151 host, with no reported lag or warnings. Simulated TCP movement response is **61.9 ms p95** across 61 commands. Render calls do not measure GPU presentation or robot actuator latency.

The [native/WASM comparison](evidence/parity/wasm-parity.json) passes numerical state and loaded-contact-count checks. **Strict raw-contact-count parity fails in 13/1,500 states**, and the [nonzero exit status](evidence/parity/run-status.json) is retained.

[Complete evidence, failures and screenshots](evidence/README.md) · [Native report](evidence/native/report.json) · [Sealed simulator inventory](workstation/workstation-integrity.json) · [Source binding](evidence/source-binding.json)

Frozen runtime: [79ffdda1c0759bce1201ce3391c40403c385c39b](https://github.com/Dvidia-Inference/dvidia-training/tree/79ffdda1c0759bce1201ce3391c40403c385c39b). Publication tooling and reproducible browser-check instructions are available in the linked PR. Source binding preserves the original receipt's null commit field and proves every recorded implementation hash matches the frozen revision.

Shoe material properties are synthetic assumptions. The visible laces and fabric are cosmetic; collision geometry remains rigid. GPU rendering, native CPU timing, state publication and actual robot latency are separate quantities.

DVIDIA code and original assets: MIT. PiPER simulation assets and Three.js: MIT. MuJoCo: Apache-2.0 with dependency notices preserved in the export. Original research writing: CC BY 4.0.
