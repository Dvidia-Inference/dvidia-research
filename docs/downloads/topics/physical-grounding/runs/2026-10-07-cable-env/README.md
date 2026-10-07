# DVIDIA Simulation Lab — first product build

A local training environment, episode runner and inspectable skill-pack export. The first task, `CableEndReach-v0`, bends an anchored cable by applying bounded world-frame forces at its actual terminal site. Native MuJoCo performs the dynamics. A small feedback controller uses the measured simulator state; local cross-entropy search can train its proportional, damping and gravity-bias parameters.

This is a **simulation-only prototype** with ideal endpoint attachment and privileged simulator observations. It does not model gripping jaws, slipping/regrasping, cameras, tactile sensors, rope stretch or shoe knots. Authored elasticity/contact coefficients have not been calibrated to a physical lace. Its downloadable pack is compatible with this declared simulation profile; it is not a qualified physical-robot controller.

## Run locally

Python 3.12, MuJoCo 3.15.0 and NumPy 2.5.3 are pinned. The first build was exercised on Apple M5/arm64 with no GPU or renderer. Install the lock file once in a local environment or on your server:

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements.lock.txt
.venv/bin/python -m simlab run --seeds 0,1,2 --offline --output runs/demo
.venv/bin/python -m simlab train --seeds 0,1,2 --eval-seeds 200,201,202 --offline --output runs/training
.venv/bin/python -m simlab verify-pack runs/training/skill-pack.zip
.venv/bin/python -m unittest discover -s tests -v
```

`run` exports `run.json`, `policy.json`, `RESULTS.md`, a self-contained `replay.html`, and `skill-pack.zip`. Open the HTML directly in a browser: playback, episode selection, frame scrubbing and view rotation work without a server or network. An optional local server can serve the saved outputs; it is not needed for training. `train` records every candidate, keeps training and evaluation seeds disjoint, freezes its selected parameters, and evaluates the held-out suite once. These are explicit controller parameters, not vision-language weights.

For air-gapped installation, pre-stage wheels for the matching Python/OS/architecture using `pip download -r requirements.lock.txt -d wheelhouse`, then install with `--no-index --find-links wheelhouse`. That installation procedure remains untested on an air-gapped machine. The runtime contains no hosted inference, online asset loader, telemetry or credentials. `--offline` denies Python socket construction, DNS and connections during execution and records an intentional guard self-test. It does not intercept native C networking. A separate recorded macOS `sandbox-exec` run denied `network*`, confirmed that a libc connection attempt failed with `EPERM`, and completed three seeded episodes. See [the native policy](native-offline/native-policy.json) and [its recorded results](native-offline/RESULTS.md); this does not establish air-gapped installation or another operating system.

## Environment contract

`Config` declares SI units, 1 ms physics steps, 20 ms controls, a six-second horizon, 25 mm goal tolerance and 200 ms continuous dwell. Default force commands have a two-newton norm bound. Seeded variations cover cable length, radius, density, bending/twisting coefficients and target jitter within an authored profile. Goals must require movement and pass a conservative reach test. The settled tip defines the local goal offset; a target is not teleported to the cable.

`reset(seed)` returns observations and provenance. `step(force_xyz)` advances real dynamics and returns observations, reward, termination/truncation and diagnostics. Reward does not establish success: the actual terminal point must remain in the target throughout the dwell period. Invalid actions are rejected before mutation. Divergence, solver warnings, invalid workspace, rejected starts and horizon exhaustion cannot become successful episodes.

Snapshots preserve MuJoCo's complete integration state, plugin state, target and task counters. Restoring a snapshot validates its configuration and generated scene. The first implementation serializes its own MuJoCo callback sections because warning callbacks are process-global; it does not claim threaded world batching.

## Evidence and cost boundaries

The runner stores per-seed outcomes, complete sampled traces, scene/configuration hashes, authored material parameters, solver warnings, dependency versions and memory/timing observations. Episode wall time includes construction, reset/settling, policy, dynamics, observations and trace collection. Control-loop latency excludes reset and trace append. Output I/O, visualization and installation are reported outside those clocks. Peak RSS is the process's lifetime maximum, not a minimum memory requirement.

The exported archive includes the exact Python source, dependency lock, controller parameters, fixed evaluation results and a SHA-256 manifest. Verification detects altered artifacts and inconsistent qualification counts. It establishes content consistency, not publisher authenticity or physical competence. The archive does not bundle dependency wheels; prepare those separately for offline installation.

See `release-v0/` for the final frozen run and `release-v0/qualification.json` for zero-force/release comparisons and numerical checks. Only the final `release-v0/` and `native-offline/` records are included in this public archive; development runs are excluded. The original [contact fixture](../2026-10-07-contact-fixture/README.md) and its recorded results remain separate and unchanged.

## Additional runtime and reproduction checks

The [reproduction receipt](release-v0/reproduction.json) records an isolated extraction of `release-v0/skill-pack.zip`: only the unpacked source was used, dependencies were preinstalled, and seeds 200–202 reproduced every trace value and final diagnostic exactly. This does not establish air-gapped installation.

On macOS, the native network-denial check can be rerun after installation, writing a new output directory:

```sh
sandbox-exec -p '(version 1) (allow default) (deny network*)' .venv/bin/python -m simlab.native_offline_check runs/native-recheck
```

The module intentionally fails unless its native connection self-test is denied. The archived [native-policy.json](native-offline/native-policy.json) records `EPERM` and three successful episodes; another OS requires its own network-denial harness.

## Next capability gates

The current product establishes an offline author-to-practice-to-pack path. Next, add measured bend/twist and force calibration, contact-based jaws with slipping/regrasping, a known eyelet fixture, and realistic observations. Qualify a GPU backend with the same task semantics and frozen action tapes before measuring batch throughput. Independent rollout processes can then be sharded across owned GPUs/servers; this first build has no GPU backend or cluster scheduler. Physical task success requires calibrated hardware trials and a separate compatibility manifest.

Original product code uses MIT. Dependencies retain their own licenses; no dependency code or weights are bundled. The cable implementation builds on the installed MuJoCo cable plugin and its generated MJCF API.
