# A validated OpenUSD workstation for local robot simulation

DVIDIA research · 30 October 2026 · Simulation infrastructure v0.1

## Abstract

A small OpenUSD scene recipe now compiles into a local MuJoCo workstation with a pinned six-axis PiPER arm. Geometry, pose, explicit mass, centred inertia, gravity and friction are parsed with the real USD SDK and checked against the native model. A frozen 45-case passive physics benchmark passes 36 normal drop/sliding cases and nine negative controls. All 27 normal drops also satisfy an independent settling goal. This validates a deliberately narrow scene bridge; it does not demonstrate a learned manipulation skill, calibrated shoe mechanics, arbitrary USD import or physical transfer.

## A reusable environment contract

Our longer-term aim is footage → task and scene estimate → reusable environment → varied simulation practice → evaluated policy → compatible robot installation. Reusable scenes make that chain easier to reproduce, but do not supply missing action labels or establish that simulated contacts match hardware.

The recipe binds a local USD stage by SHA-256, explicit metre/kilogram/Z-up conventions, a verified robot asset lock, seeded reset variation and an independent task goal. The first supported scene contains a static tabletop and one original rigid cube. The robot remains a separately pinned native MJCF model; USD articulation import is not implemented.

The bridge supports equal static and dynamic friction mapped to native isotropic sliding friction. Torsional and rolling friction are zero, and contact solver assumptions are declared. Authored zero restitution is required; the native contact response is not a calibrated restitution measurement. External composition, other geometry types, animated properties and deformable materials are rejected.

NVIDIA's [OpenUSD curriculum](https://docs.nvidia.com/learn-openusd/latest/index.html) provides the scene-composition and asset-parameterization foundation. The [USD Physics specification](https://openusd.org/dev/api/usd_physics_page_front.html) defines physical properties. MuJoCo's [native USD importer](https://mujoco.readthedocs.io/en/stable/OpenUSD/importing.html) is experimental and needs a USD-enabled build; this implementation uses explicit Python USD parsing and bounded property conversion.

## Frozen experiment

The source, protocol, thresholds and exact USD input inventory were published before native benchmark execution. There are 27 drops: three masses (40, 80 and 160 g), three friction coefficients (0.1, 0.5 and 1.0) and three drop clearances (5, 10 and 20 cm). Nine sliding cases cross the same masses and friction values with an initial speed of 0.4 m/s. Nine negative controls remove support, gravity or friction.

The native timestep and goal updates are 1 ms; saved pose and trajectory snapshots are 10 ms apart. Drop checks compare early freefall with gravity, final height, speed and support. Sliding checks require the initial velocity, actual travel, stopping and agreement with a Coulomb stopping-distance calculation. A stationary object cannot pass a sliding check merely by looking settled. The arm holds native home commands throughout.

During implementation, a native inertial-frame offset made a vertical drop drift sideways. A physical settling test exposed the construction error; the bridge now explicitly maps the USD centre of mass and principal axes. This was corrected before freezing the benchmark.

## Results

| Cohort | Scheduled | Passed |
|---|---:|---:|
| Normal drops | 27 | 27 |
| Normal slides | 9 | 9 |
| Missing support | 3 | 3 |
| Missing gravity | 3 | 3 |
| Missing friction | 3 | 3 |
| Total | 45 | 45 |

Every scheduled case is retained. Negative-control passes mean the intended missing effect was observable, not that the task succeeded. Independent goal checks accept 27/27 normal drops and 6/9 normal slides. The remaining three slides correctly stop outside the recipe's original XY goal; passive physics correctness and task completion are separate quantities.

The maximum early freefall position error is 0.2453 mm. For the 40 g object, measured stopping distances at friction 0.1, 0.5 and 1.0 are 81.373, 16.302 and 8.195 mm; their analytic-distance errors are 0.176, 0.008 and 0.040 mm, respectively. These comparisons test this authored rigid-box setup, not general contact accuracy.

The complete matrix took 47.613 seconds including native scene construction on a shared Apple host, with no dedicated GPU for physics. The runtime was Python 3.12.9, NumPy 2.5.3, MuJoCo 3.15.0 and OpenUSD 26.11. Publication and a separate controller study shared the host. This is not isolated throughput, a hardware minimum or a hard real-time result. The local setup used a fresh USD wheel with an existing pinned native environment; a clean dependency resolver installation was not qualified.

## What this unlocks

The next environment iteration can vary object placement and physical assumptions while preserving the robot interface and independent verifier. Policy evaluation can then identify which conditions need more demonstrations. Adding scene assets alone does not train a controller, infer hidden material properties from video or transfer a skill to a different arm.

The recorded 3D view uses native saved body poses; it does not run browser physics or send robot commands. The public kit includes every authored input, recorded trajectory, result, source snapshot and license notice. Its read-only audit reconstructs saved score calculations and checks pose/trace consistency; 10 ms snapshots cannot independently verify unrecorded 1 ms goal intervals or authenticate physical truth.

[Open the recorded workstation](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-30-usd-workstation-v01/) · [Reproduction guide](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-30-usd-workstation-v01/docs/usd-workstation-v01.md) · [Source and releases](https://github.com/Dvidia-Inference/dvidia-training) · [Hugging Face](https://huggingface.co/Dvidia)

Original scene and bridge: MIT. PiPER assets retain their MIT license. Dependencies retain their own licenses. Follow [@iammrriver](https://x.com/iammrriver) · hello@dvidia.org.


## Separate installed-package follow-up

After packaging the frozen kit, a fresh Python 3.12.9 virtual environment completed a full installation with pip 26.2.2 and bounded download resumption. Earlier truncated downloads failed hash checks; verification was never disabled. The installed bridge and benchmark module hashes match the frozen source. CLI inspection/build ran outside the checkout, and a separate 1,200-tick passive smoke reached its settling goal with zero native warnings. No existing native environment was injected. The test reused previously verified local robot assets, so it does not qualify fresh asset fetching, other hosts or hardware minima. It is not part of the 45-case confirmation matrix. [Installed-package smoke record](https://research.dvidia.org/downloads/topics/evaluation-provenance/runs/2026-10-30-usd-and-grip-publication/usd-clean-install-smoke.json).

[Exact Hugging Face revisions and anonymous byte checks](https://research.dvidia.org/downloads/topics/evaluation-provenance/runs/2026-10-30-usd-and-grip-publication/usd-workstation-anonymous-readback.json) cover all 354 new files, with all 3,777 pre-existing Space paths preserved. [GitHub release downloads](https://research.dvidia.org/downloads/topics/evaluation-provenance/runs/2026-10-30-usd-and-grip-publication/usd-github-downloads.json) preserve the original ZIP and receipt checks.
