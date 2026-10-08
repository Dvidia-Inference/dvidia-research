# Installable learned skill capsule v1

This simulation-only source release packages a learned NumPy movement head inside an authored placement supervisor. [The research report](../../../../reports/Skill%20capsule%20acquisition%20and%20optimization.md) records 7/8 teacher/student parity and no end-to-end speedup. The new study is distinct from historical arm benchmarks.

Download [simlab-v0.4.zip](release/simlab-v0.4.zip), extract it, install the pinned dependencies once, and run `python -m simlab.studio --offline`. Drop [placement_candidate.skill.json](simlab/placement_candidate.skill.json), or use the bundled capsule button. Import triggers native placement and identical arm-command replay with open jaws; execution is enabled for that exact scene only after qualification. [CAPSULES.md](CAPSULES.md) documents the full author/train/build/install/qualify/run workflow and numeric inputs.

The capsule contains 39,845 JSON bytes. It carries frozen learned movement parameters, exact task source and a ten-file execution/runtime binding. Waypoints, task phases, grasp/contact and recovery logic remain authored. It does not learn from video, provide arbitrary robot compatibility, or qualify hardware. Hashes prove consistency, not publisher identity or experimental authenticity.

- `benchmark/`: complete 16-scene collection, 4-scene development selection and frozen 8-scene evaluation; dataset, model, protocol, timing and exact collector/experiment sources.
- `demo/`: browser-imported capsule requalified in the 60 g scene, including native placement, recorded-arm/open-jaw control and local receipt. `demo-repeat/` executes that qualified scene without retraining. These are known-scene integration checks, not unseen task tests.
- `native-offline/`: one default scene plus repeat under native macOS network denial, with a direct libc connection denied by EPERM. Dependencies were already installed.
- `release/manifest.json`: exact included file-byte hashes. `release/reproduction.json` records extracting the final archive and repeating the known scene using its own source.

Reproduce the installed-runtime native offline check on macOS, from the extracted directory, with preinstalled dependencies:

```sh
/usr/bin/sandbox-exec -p '(version 1) (allow default) (deny network*)' python native-offline/check.py runs/my-native-check
```

[Native replay](demo/replay.html), [model profiling](benchmark/profiling.json), [native network-denial receipt](native-offline/native-policy.json). The normal studio and recorded replay use exact simulator state and a box proxy. Arm-link/palm collisions, physical contact calibration, perception, other embodiments and GPU throughput remain unqualified. Original code, simulator-teacher data and movement coefficients are released under MIT; dependencies retain their own licenses and are not bundled. Task source is the existing public DVIDIA export.
