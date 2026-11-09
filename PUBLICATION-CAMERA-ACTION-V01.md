# Camera-to-action v0.1 publication checklist

This is a release handoff, not a result or a qualification certificate. The
current paper contains the complete sealed study result: 5/64 learner placements,
failed qualification and research-candidate status. Independent full-study audit
passed on 9 November 2026: all 452 registered attempts and saved native scores
(including 12 early refusals), 2,384,532 files and zero errors. Audit SHA-256:
`2774959f8e1a5be7283cea129da0ffea000d8375eb445140c8c7a60ab15efed8`.
The original viewer stays an immutable four-diagnostic archive; `viewer-v02`
adds the first protocol-ordered student attempt without outcome-based selection.
Local browser verification is complete within the scope recorded below;
remote publication and public readback remain separate pending steps.

## Freeze and attempt accounting

- [x] Runtime freeze identified: `c9a7c55531533f60e24651a99d509f721e195051`.
- [x] Registered protocol identified: SHA-256
  `576851e321034a0f6d3cb4d0818b3a5ca97975fcc6f2c7fa30b07ffd203a2d76`.
- [x] Draft budgets match registration: 4 diagnostics, 80 teacher recordings,
  32 mixed corrections, 64 development rollouts, 256 confirmation attempts,
  16 negative controls; 452 maximum native attempts.
- [x] Stop the worker before full-study audit or packaging. Resolve an orphaned
  worker lock from actual process state; do not remove an active worker's lock.
- [x] Account for every registered attempt, including refused, failed, interrupted,
  unknown and unattempted outcomes. Preserve original attempts and stage seals;
  no replacement scenes, repeat fits or confirmation-driven tuning.
- [x] Confirm the exact teacher-data quality gate before reporting training:
  every training start covered by at least one usable successful teacher recording,
  with at least 28 usable successes per destination. Publish a blocker if it fails.

## Independent result and provenance checks

- [x] Four-diagnostic audit verified 24,040 files and four strict teacher successes.
- [x] Diagnostic phase readback confirms 0/749 object estimates during close,
  lift, transfer, place and release. Its teacher-phase labels are analysis only.
- [x] Run the reviewed full-study byte/numeric auditor on the stopped study. Bind
  its own source, diagnostic helper, numeric scorer, protocol, source freeze,
  stage receipts, episode manifests, model receipts and model files.
- [x] Verify exact eligible training and development recording identities,
  ordering, groups and sample counts. Initial and corrected full/blind pairs
  must use identical source recordings; correction labels are separately sealed
  teacher suggestions rather than falsely claimed executed commands.
- [x] Independently reproduce strict grasp/lift/retention/release/settling/retreat
  scores from saved native traces, and compare all reported stage summaries.
- [x] Reproduce frozen selection: development success, critical-contact ticks,
  shared physical-action-scale prediction loss, then initial before corrected.
  Use the matched blind model from that same selected stage.
- [x] Reproduce all final gates: at least 58/64 strict student successes; positive
  97.5% paired bootstrap intervals against fixed and blind on 32 whole starting
  groups; positive intervals on at least 24 common admitted groups; no increase
  in critical-contact episode frequency; all 16 negatives correct; no privileged
  learner inputs or teacher intervention during evaluation.
- [x] A passing consistency audit is not a passing skill gate. A failed or
  incomplete qualification remains `research_candidate`. The publisher must
  require a passed full-study proof before accepting `qualified: true`.

## Methodology and public claims

- [x] Starts, two goals and small interpolation domain match the protocol;
  both goals and all related recordings remain in one starting-position split.
- [x] Draft distinguishes 25 Hz camera pairs, 50 Hz commands and 1 ms native
  scoring. A complete episode has 501 RGB-D pairs and 1,000 motor intervals.
- [x] Draft distinguishes the historical initial camera anchor from current
  observations, explicit missing masks and source-frame age. No pose is filled
  forward as a fresh measurement.
- [x] Draft states the legacy `tcp_*` observation fields are the encoder-derived
  link6 body-origin pose. The native scorer uses a different distal site at
  local `[0, 0, 0.12003]` m; this is not a calibrated physical tool point.
- [x] Fault descriptions match implementation: blank initial RGB with the object
  still present; initial capture/availability set to −0.2 s; a rotation-matrix
  element scaled by 1.1; forced-open jaw. These do not establish robustness to
  real object absence, valid-but-old arrival or small valid rigid calibration error.
- [x] Replace pending sections only from sealed receipts. Report learned, blind,
  fixed and teacher denominators together, including all failures and refusals.
- [x] Report perception coverage and longest missing intervals beside
  available-only error percentiles. Reused camera frames are correlated.
- [x] Report actual training time, peak-memory scope, model bytes, inference and
  full-loop latency distributions with hardware/software context. Teacher
  inference fields containing zero are not learned-model latency measurements.
- [x] Keep simulation time, image age, wall-clock compute and playback time
  distinct. Shared-host offline timings do not establish real-time hardware control.
- [x] Preserve limitations: authored synthetic labels, one PiPER/block setup,
  unverified physical depth/contact fidelity, no ordinary-human-video action
  recovery, no shoe skill, no arbitrary-arm installation or hardware qualification.

## Source, install and artifact delivery

- [x] Record the final reviewed source commit separately from the unchanged
  runtime freeze. Bind the exact source archive and installable wheel to all
  frozen runtime file hashes; retain original model/simulator notices.
- [x] Complete fresh-environment install and simulation execution outside the
  checkout. Bind the installed model and raw run receipt; installation cannot
  manufacture qualification. Test the UI and Terminal against the same run record.
- [x] Build original model/data cards from the same sealed report, clearly
  labeling the dataset and controller as synthetic and simulation only.
- [ ] Build deterministic per-episode archives and verify every decompressed
  member against the original manifests. Include failures and interrupted prefixes.
- [ ] Complete privacy/credential scanning, portable paths and exact license
  notices. Keep individual contributor identity blank as requested.
- [ ] Stage a plan-bound GitHub/Hugging Face publication. Use private APFS clones
  or bounded copies with independent inodes; never hardlink mutable originals.
  Protect the 30 GiB disk reserve and verify all payload hashes before credentials.
- [ ] Anonymous readback must pin the actual published revision, reject remote
  size mismatches before download, hash each full payload and remove only owned
  temporary caches. Scope optional Xet caches explicitly; preserve shared caches.

## Research site and browser verification

- [x] Paper source: `reports/Camera to action v01.md`.
- [x] Publication/catalog/topic navigation and generated pages are present.
- [x] Viewer contains 204 byte-identical native RGB samples and all 4,000
  diagnostic decisions. Display sampling is explicitly 2.5 Hz versus 25 Hz capture.
- [x] `npm run check` and the three new camera/action publication tests pass.
  Prior full regression: 78/79 inside sandbox; the existing localhost-only
  downloader test passes separately with scoped localhost permission.
- [x] Update paper/catalog/README summaries after final results. Keep the
  diagnostic subset distinct from student confirmation. Regenerate display
  manifests if modifying viewer files; do not hand-edit a sealed viewer.
- [x] Rebuild static output and rerun affected tests on final source. Final
  `npm run check` passes; 5 Python viewer-contract and 5 Node publication/viewer
  tests pass on 9 November 2026.
- [x] Real desktop browser: recording/actuator selection, play/pause, keyboard
  scrub, inspect-grip jump, image timestamps, missing masks and plot units.
  The article's report link opens valid JSON with failed qualification.
  No console errors were observed. A 390 CSS-pixel iframe verifies responsive
  paper/viewer layout without horizontal overflow; iframe focus automation
  did not establish narrow-screen playback or keyboard interaction. This is
  not physical-device or mobile Training Studio verification.
- [x] Verify current DVIDIA paper styling, empty contributor attribution,
  `@iammrriver`, team email, and accurate external artifact links.
- [ ] Publish reviewed GitHub, Hugging Face and research-site changes, then verify
  anonymous public pages/artifacts at their exact commits. Record deployment IDs,
  source commits, benchmark hashes, browser evidence and remaining limitations.

The existing diagnostic viewer is intentionally sufficient to inspect the
camera blind spot. It is not the full study archive or evidence that the student
has learned the task. Final publication must keep that distinction visible.

## 9 November audit and card checkpoint

- Reviewed source: `d89b24c82b7534a439bbaa3cac3ef5c9d3b80088`; all 19 runtime hashes unchanged.
- Full audit elapsed 839.323 s; no physics, tracker or learned model executed.
- 452 saved score reconstructions include 12 early refusals; 440 recordings complete the full interval.
- Model/data card receipt: `b4b976be7f33e0d40e3aead02a30bdfed32a3c0491bfbf7aee7afde1f4b73fa3`.
- The dataset card and four model cards retain failed qualification; all 13 relative links were checked against local source targets.
- Intended Hugging Face destination: `Dvidia/piper-camera-action-v01`; publication and pinned anonymous readback are pending.

- Final student viewer: five recordings, 5,000 motor decisions and 254 sampled RGB images. The added `confirmation-00-goal0-student` contains 1,000 decisions/50 images and is a strict task failure; it was not replaced.
- Original diagnostic viewer inventory remains `dd8e71e97b2d7c9b51412d5991bb1b008b581517a98ce9f3cdbd788a0adeeb52`.
- Public installed-smoke proof replaces only two private local path values. Public SHA-256: `ed0b411aaa1bafe94a6411851a42adcb4695b927801a02967fb2aedb21c1811a`; original proof SHA-256 remains recorded within it.
- The dated 9 November export-cache/action-reference follow-up is separate from the 452-attempt study. The [non-latest cache preview release](https://github.com/Dvidia-Inference/dvidia-training/releases/tag/camera-action-cache-v0.1-preview) is published at exact cc6746a; all six release assets passed anonymous download/SHA checks. The 36 exact-head CI checks and six OS/Python visual/cache jobs passed (ubuntu-latest, macos-latest, windows-latest × Python 3.12/3.13). These are software checks, not multiplatform native-study or physical qualification. Public evidence: `final/cache-preview-release.json`.

- The d89b24c publishing-only fix preserves the ab9082e installed execution attribution; all 19 runtime files and six resources match, with fresh archive/wheel/CLI checks passed.
- All five generated cards match saved-report, inspected-report and reversed-gate ordering byte-for-byte. Prior failed preparation and original card proofs remain local and unchanged.
- Latest full site regression: 80/81 passed inside the sandbox; the only failure
  was the existing localhost-binding test. All three tests in that file passed
  separately with localhost access, so every case has a passing result across
  those runs. This is not a claim of 81 passing in one execution.
- The research-only Cloudflare dry run passed with 5,593 assets and no bindings.
  It did not deploy or alter the official site's account services.
