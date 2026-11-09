# Camera-to-action v0.1 diagnostic evidence

**Draft; student results pending.** [Open the recorded evidence](viewer/index.html)
or [read the registered study](../../../../reports/Camera%20to%20action%20v01.md).
This compact subset has four sealed authored-teacher episodes, 204 original
320×240 RGB frames sampled at 2.5 Hz, and all 4,000 50 Hz motor decisions.
The source camera ran at 25 Hz. No image interpolation or new physics is used.

All four diagnostics pass strict placement. They cover two development starting
groups and two goals per group. The independent reader verified 24,040 source
files; its [audit](viewer/diagnostic-audit.json) retains the scope and all four
results. These teacher successes are not learned-policy successes.

The [phase analysis](viewer/diagnostic-phase-coverage.json) finds zero object-pose
estimates in 749 close/lift/transfer/place/release decisions. The viewer shows
those absences without filling missing poses. It distinguishes simulation
capture time, source-camera age, display-frame time, issued target, measured
position at the decision, and rate-limited target at the interval's final tick.
None of these clocks is physical sensor-to-actuator latency.

`viewer/evidence.json` contains the display data and source recording/manifest
hashes. `viewer/viewer-integrity.json` lists every display file's SHA-256 and
length. The raw RGB files retain their source bytes; the full RGB-D/native
recordings are separate from this compact publication.

To generate a fresh viewer from a local sealed study and independently audited
diagnostics, run this from the research repository:

```sh
python3 scripts/build-camera-action-evidence.py STUDY_DIRECTORY \
  --audit DIAGNOSTIC_AUDIT_JSON \
  --phases DIAGNOSTIC_PHASE_COVERAGE_JSON \
  --out NEW_OUTPUT_DIRECTORY
npm run check
```

The builder imports no simulation, tracker, training or policy runtime. It
verifies the exact four sealed diagnostic identities and the referenced
recording, sidecar and selected image hashes before deriving the viewer.
It refuses to overwrite an existing output directory. It does not audit the
whole study, infer success from incomplete stages, or award qualification.

The broader study is still pending. Its [protocol](viewer/protocol.json) freezes
72 starting groups, split isolation, fixed training/correction budgets,
comparison controllers and qualification gates. Failure or incomplete
collection must remain explicit when the final report replaces this draft.

Original DVIDIA source and generated records: MIT. Research prose: CC BY 4.0.
Upstream [PiPER notices](viewer/licenses/agilex_piper/README.md) are preserved.
No robot meshes, model weights, private human footage or credentials are bundled.
