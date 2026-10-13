# Supplemental evidence

These files provide compact historical regression and development evidence, separately from the complete fresh confirmation export in `../lab/`.

- [Regression benchmark](regression-benchmark.json), [protocol](regression-protocol.json) and [original export inventory](regression-integrity.json): 18 valid attempts, 1/9 completion in each policy, the same known development case. Fresh source `af8933994b4626e28a0554abc782ae9d22cff06c`. Prior v0.1 held-outs are now known regression data.
- [Nine-round development ledger](development-ledger.json): iteration names, hashes, results and failures. First-five source hashes were not captured; initial iteration peak height includes initialization and is not an earned lift. The full iteration files named by the ledger remain local and are not claimed as a complete public trajectory archive.
- [Original grasp probes](geometry-probes/probe.json), [shallower probes](geometry-probes/shallow.json), [yaw](geometry-probes/yaw.json), [side](geometry-probes/side.json), [side-facing](geometry-probes/side-facing.json), [side-toe](geometry-probes/side-toe.json), and [lower-envelope diagnostic](geometry-probes/lower-envelope.json): 32 finite exploratory probes, zero strict retained lifts. These summaries omit the dense trajectories and are not independent qualification evidence.

Regression receipt replay paths refer to its original local export. This compact supplement does not include those full traces, geometry and motion files; its inventory is preserved as the original export's hash record, not as a manifest of files contained here. The complete twenty-attempt fresh confirmation set remains available in `../lab/`.

The lower-envelope diagnostic changes the software TCP minimum to 35 mm; the release keeps 55 mm. The 181.6 mm diagnostic shoe height still has approximately 1.816 N of rake support and fails. None of these finite probes proves that the morphology can never grasp a shoe. Diagnostic scripts used development versions and are not presented as source-frozen release-controller runs.
