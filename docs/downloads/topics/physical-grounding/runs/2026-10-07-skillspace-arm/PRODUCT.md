# DVIDIA Simulation Lab

## Skillspace link → install → arm execution

The local Skillspace lab now accepts a public DVIDIA store link such as `https://dvidia.org/store/dvidia/place_cup`. Click **Install skill**, create an environment by setting the object and target coordinates, then **Run installed skill**. The same installed controller can execute in a changed scene. Installations persist on disk and reload without downloading the source again.

```sh
.venv/bin/python -m simlab.studio
# Open http://127.0.0.1:8240/
```

The installer downloads the public task envelope, preserves its exact bytes/hash and binds a locally authored placement controller to one original six-joint, parallel-jaw simulation profile. DVIDIA's existing metadata exports have no trained robot policy. The tool supports `place_cup` and `place_object`; the first implementation explicitly represents them with a rigid box proxy. Unsupported skills, unreachable positions and incompatible profiles produce a reason instead of execution.

The arm uses native MuJoCo joint actuators and real jaw/object/table contacts. It lifts a free object, carries it, opens its jaws, retreats, and checks stable placement. No object teleport, weld or mocap carries the object. The browser renders actual recorded poses with a simplified link view. Success requires a retained bilateral grasp and lift, released object, table support, hand clearance and 250 ms of stable target dwell. Arm link/palm collisions are excluded; camera perception, cup geometry, physical hardware and demonstration-based policy learning remain unqualified.

Run the whole lab with `--offline` to disable new URL downloads. **Install bundled source · offline** and JSON drop still work. Physics executes in one isolated CPU worker with Python socket calls denied; the loopback browser/server connection stays available. A separate installed-runtime test under macOS's native `(deny network*)` sandbox completed three distinct scene layouts after a direct libc connection was denied with `EPERM`. This repeats qualified layouts and does not test air-gapped dependency installation.

The frozen six-layout protocol completed **6/6 placements**; no-motion and identical joint-command replay with jaws held open each completed **0/6**. Successful runs totalled 73.90 simulated seconds in 3.91 episode wall seconds on Apple M5 CPU, about 18.9×, including compilation/reset, controller, physics and trace collection. These are bounded workload measurements recorded while another test process ran; UI, process startup, installation and file I/O are excluded. All scenes use a 40 mm, 40 g box and authored contact parameters. Changing seeds with jitter disabled repeats a scene; the six configurations differ in object and target positions.

```sh
.venv/bin/python -m simlab.arm_runner install --url https://dvidia.org/store/dvidia/place_cup
.venv/bin/python -m simlab.arm_runner run INSTALLATION_ID --output runs/placement
.venv/bin/python -m simlab.arm_qualify --output runs/arm-v0
/usr/bin/sandbox-exec -p '(version 1) (allow default) (deny network*)' .venv/bin/python -m simlab.arm_native_offline_check runs/arm-native-offline
```

See `runs/arm-v0/` for full control traces/action commands, sampled standalone replay and an integrity-checked source adapter archive. See [ARM_RESEARCH.md](ARM_RESEARCH.md) for the installation contract, source provenance, effective friction floors and remaining research. This is the first working link-to-execution product path, limited to its declared virtual arm and placement adapter. A physical robot needs calibrated embodiment/sensing and measured qualification before any motor driver is connected.

## Cable training foundation

A local training environment, episode runner and inspectable skill-pack export. The first task, `CableEndReach-v0`, bends an anchored cable by applying bounded world-frame forces at its actual terminal site. Native MuJoCo performs the dynamics. A small feedback controller uses the measured simulator state; local cross-entropy search can train its proportional, damping and gravity-bias parameters.

This is a **simulation-only prototype** with ideal endpoint attachment and privileged simulator observations. It does not model gripping jaws, slipping/regrasping, cameras, tactile sensors, rope stretch or shoe knots. Authored elasticity/contact coefficients have not been calibrated to a physical lace. Its downloadable pack is compatible with this declared simulation profile; it is not a qualified physical-robot controller.

## Run locally

Python 3.12, MuJoCo 3.15.0 and NumPy 2.5.3 are pinned. The first build was exercised on Apple M5/arm64 with no GPU or renderer. Use the existing isolated environment here, or install the lock file once on another server:

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements.lock.txt
.venv/bin/python -m simlab run --seeds 0,1,2 --offline --output runs/demo
.venv/bin/python -m simlab train --seeds 0,1,2 --eval-seeds 200,201,202 --offline --output runs/training
.venv/bin/python -m simlab verify-pack runs/training/skill-pack.zip
.venv/bin/python -m unittest discover -s tests -v
.venv/bin/python -m simlab.qualify runs/release-v0
```

`run` exports `run.json`, `policy.json`, `RESULTS.md`, a self-contained `replay.html`, and `skill-pack.zip`. Open the HTML directly in a browser: playback, episode selection, frame scrubbing and view rotation work without a server or network. An optional local server can serve the saved outputs; it is not needed for training. `train` records every candidate, keeps training and evaluation seeds disjoint, freezes its selected parameters, and evaluates the held-out suite once. These are explicit controller parameters, not vision-language weights.

For air-gapped installation, pre-stage wheels for the matching Python/OS/architecture using `pip download -r requirements.lock.txt -d wheelhouse`, then install with `--no-index --find-links wheelhouse`. That installation procedure remains untested on an air-gapped machine. The runtime contains no hosted inference, online asset loader, telemetry or credentials. `--offline` denies Python socket construction, DNS and connections during execution and records an intentional guard self-test. It does not intercept native C networking.

## Environment contract

`Config` declares SI units, 1 ms physics steps, 20 ms controls, a six-second horizon, 25 mm goal tolerance and 200 ms continuous dwell. Default force commands have a two-newton norm bound. Seeded variations cover cable length, radius, density, bending/twisting coefficients and target jitter within an authored profile. Goals must require movement and pass a conservative reach test. The settled tip defines the local goal offset; a target is not teleported to the cable.

`reset(seed)` returns observations and provenance. `step(force_xyz)` advances real dynamics and returns observations, reward, termination/truncation and diagnostics. Reward does not establish success: the actual terminal point must remain in the target throughout the dwell period. Invalid actions are rejected before mutation. Divergence, solver warnings, invalid workspace, rejected starts and horizon exhaustion cannot become successful episodes.

Snapshots preserve MuJoCo's complete integration state, plugin state, target and task counters. Restoring a snapshot validates its configuration and generated scene. The first implementation serializes its own MuJoCo callback sections because warning callbacks are process-global; it does not claim threaded world batching.

## Evidence and cost boundaries

The runner stores per-seed outcomes, complete sampled traces, scene/configuration hashes, authored material parameters, solver warnings, dependency versions and memory/timing observations. Episode wall time includes construction, reset/settling, policy, dynamics, observations and trace collection. Control-loop latency excludes reset and trace append. Output I/O, visualization and installation are reported outside those clocks. Peak RSS is the process's lifetime maximum, not a minimum memory requirement.

The exported archive includes the exact Python source, dependency lock, controller parameters, fixed evaluation results and a SHA-256 manifest. Verification detects altered artifacts and inconsistent qualification counts. It establishes content consistency, not publisher authenticity or physical competence. The archive does not bundle dependency wheels; prepare those separately for offline installation.

The frozen qualification trained nine parameter candidates on three seeds each, then evaluated the selected controller on ten distinct seeds. Trained and baseline feedback each passed 10/10; zero force and early release each passed 0/10. Baseline feedback completed in 4.18 cumulative active simulated seconds and the trained controller in 4.56 seconds. The small training-score improvement did not improve held-out success or completion time. The complete local qualification took 22.81 wall seconds including training, comparisons and numerical probes. These are workload-specific CPU measurements.

See `runs/release-v0/` for the final frozen run and `runs/release-v0/qualification.json` for the full protocol. `reproduction.json` records an unpacked-pack replay on seeds 200–202 with exact trace and final-diagnostic agreement using the preinstalled dependencies. Earlier `runs/` directories are development executions. The original [contact fixture](README.md) and its recorded results remain separate and unchanged.

The installed runtime also passed three new seeds under macOS's native network-denial policy. A direct libc connection self-test returned `EPERM`, confirming the policy was active before rollouts. This is stronger than the Python-only guard for this tested host; it still does not establish another OS or air-gapped installation. Reproduce on macOS with:

```sh
/usr/bin/sandbox-exec -p '(version 1) (allow default) (deny network*)' .venv/bin/python -m simlab.native_offline_check runs/native-offline
```

## Next capability gates

The current product establishes an offline author-to-practice-to-pack path. Next, add measured bend/twist and force calibration, contact-based jaws with slipping/regrasping, a known eyelet fixture, and realistic observations. Qualify a GPU backend with the same task semantics and frozen action tapes before measuring batch throughput. Independent rollout processes can then be sharded across owned GPUs/servers; this first build has no GPU backend or cluster scheduler. Physical task success requires calibrated hardware trials and a separate compatibility manifest.

Original product code uses MIT. Dependencies retain their own licenses; no dependency code or weights are bundled. The cable implementation builds on the installed MuJoCo cable plugin and its generated MJCF API.
