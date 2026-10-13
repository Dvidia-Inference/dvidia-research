# Two small environments for skill prerequisites

## What we built

**A usable skill must know when its next action is possible.** We built two native MuJoCo environments around that idea: a hinged shoe box that can close on the arm, and a shoe outside the controller's usable reach that a mounted rake can pull closer.

The frozen comparison retains **16 attempts, all numerically valid**. A geometric lid guard avoids two simulated collisions without increasing completed tasks. The rake brings three of four shoes into reach at an intermediate checkpoint, but **none passes the subsequent retained-lift test**. That failure identifies the next practical bottleneck: keeping a bilateral grip after reaching the shoe.

Both environments use a six-axis PiPER with its coupled gripper, authored control and privileged simulator observations. The shoe, box and rake are rigid synthetic assets. No model learns from footage in this release. Contact parameters are assumed, and no physical robot is connected.

### Keep the mechanism small

The lid controller observes hinge angle, angular velocity and tool position. A descending lid in the access region triggers withdrawal; a stable open aperture permits resuming; a closed box leads to a help request. The shoe remains in the box. Success means reaching an inspection waypoint, dwelling there and returning without a contact above the declared threshold; it does not mean extracting a shoe.

The tool controller moves a **pre-mounted rigid rake** behind the shoe, pulls, checks the resulting position and can recenter once if the pull fails. It then attempts a jaw grasp and lift. The comparison baseline has no rake. This tests the capability added by the fixture together with its controller, rather than isolating a policy improvement on identical hardware. It does not test selecting or acquiring a free tool.

After reset, native joint actuators drive the arm. Shoes remain free bodies. There is no shoe weld, teleport or hidden carrying force, and the lid has no motor. Reset poses and hinge velocities are declared initial conditions.

## Try it

[Explore both experiments](../topics/physical-grounding/runs/2026-10-13-skill-prerequisites-v01/lab/index.html) · [Hugging Face laboratory](https://huggingface.co/spaces/Dvidia/robot-simulation-lab) · [Pinned runnable source](https://github.com/Dvidia-Inference/dvidia-training/tree/756306a2beda60ac54567971626080a56227e781)

The browser shows **recorded 3D replays of native MuJoCo runs**. Choose an environment, case and policy; play or seek the timeline; inspect decisions, contact events and the complete trial receipt. Moving the timeline does not run physics or change the result. The Python command in [Reproduce it](#reproduce-it) runs fresh native simulation locally.

Geometry and recorded motion are bundled for local serving. The Hugging Face deployment may load hash-checked binary mirrors from the research site, then fall back to its own files. This delivery path is separate from the physics benchmark and does not establish a startup-time guarantee.

## What we measured

### One frozen cohort, every attempt retained

The [protocol](../topics/physical-grounding/runs/2026-10-13-skill-prerequisites-v01/lab/protocol.json) freezes four parameter combinations per environment and both policies, giving sixteen attempts. They are explicit parameter holdouts following development tuning, not independent samples of real-world reliability. Source `756306a` was frozen before this cohort ran; the publication preserves that run unchanged.

| Held-out measurement | Baseline | Recovery policy |
| --- | ---: | ---: |
| Hinged box: completed access and return | **2/4** | **2/4** |
| Hinged box: lid/robot collision above 0.5 N | **2/4** | **0/4** |
| Hinged box: stopped and requested reopening help without scored contact | **0/4** | **2/4** |
| Tool reach: shoe inside the retrieval checkpoint | **0/4** | **3/4** |
| Tool reach: completed retrieval and retained lift | **0/4** | **0/4** |
| Tool reach: short-tool deferral | **0/4** | **1/4** |

The two lid cases that collide under baseline produce peak single-contact normal forces of **75.15 N** and **51.78 N**. Recovery requests withdrawal at the initial observation and reaches its withdrawal waypoint after **0.24 simulated seconds** in each case. It then stops because the box has closed. These are unfinished tasks, not recovered access successes.

The transient-closing case resumes after withdrawal and finishes in **2.30 seconds**. Baseline finishes the same case without contact in **1.60 seconds**. The guard therefore costs **0.70 seconds** in a case where the matched baseline did not need the interruption. The ordinary open case finishes in 1.60 seconds under either policy. The guard improves this cohort's contact outcome, not its completion count.

All three rake retrieval checkpoints occur at **6.6 simulated seconds**. This is an intermediate position check, not a terminal retention result. In the offset case, later interaction pushes the shoe to approximately **0.562 m** along X, outside the declared 0.54 m controller envelope. All three subsequent lift attempts fail; the short rake asks for help before attempting a pull.

### Conditions, clocks and contact evidence

Physics advances at **2 ms** per native step; authored decisions update every **20 ms**. Full trial JSON retains the dense native contact trace. Replay/state-action frames are less frequent and must not be used to rule out brief contacts between frames. The small benchmark index omits only the dense trace; every full receipt remains linked and sealed.

The lid's 0.5 N threshold is an authored collision-scoring choice, not a calibrated damage or injury limit. Its contact integral accumulates the largest per-contact normal force at each native tick; it is not a sum of every contact impulse. The rake records shoe/tool forces separately from finger and world support.

**Every observed descending-lid hazard in this cohort is already present at time zero.** A reported zero delay between detection and the first withdrawal command is therefore a startup-state decision. It does not measure response to a suddenly appearing obstacle, camera latency, transport delay or actual actuator response.

Retained lift requires the shoe body's authored sole-bottom frame above 35 mm, contact with both fingers above 0.01 N, and tool and world support below 0.01 N throughout the final 500 ms. That frame is not the shoe's lowest physical point under rotation, which makes the independent support exclusion essential. A high shoe pose, closed jaws or brief bilateral contact alone cannot pass this test. The source records these synthetic thresholds explicitly; no material calibration is implied.

### Measured CPU cost

On the tested **Apple M5, 10 logical CPUs, 24 GiB RAM**, running macOS arm64, Python 3.12.9 and MuJoCo 3.15.0, the sixteen native attempts total **108.4 simulated seconds in 5.4958 wall seconds**. This is a **19.72×** ratio of summed simulation time to summed native execution time. The common timer includes model construction, initialization, authored control, physics and recording. Replay export takes a separate **12.9695 seconds**; process startup and the final report write are outside those totals. [Timing derivation and host supplement](../topics/physical-grounding/runs/2026-10-13-skill-prerequisites-v01/analysis.json).

These are observations on a shared host. They establish neither a hard real-time deadline nor minimum hardware requirements. Internal per-environment timers have different initialization boundaries and should not be used for cross-task speed comparisons. Browser rendering, downloads, physical sensors and hardware actuation are excluded from the native measurement.

## Where it fails

**Access and reach do not yet produce a dependable shoe skill.** The guarded arm cannot reopen the closed box. The rake starts mounted, the shoe properties are assumed, and reaching the shoe does not give the gripper a stable grasp.

The light tool case never meaningfully unloads the table and loses bilateral contact at approximately **10.944 seconds**. The offset case never obtains the required bilateral contact and later leaves the reach envelope. The heavy case holds the shoe without world or rake support from approximately **11.790 to 12.394 seconds**, then loses the grip. Its peak sole-bottom frame height is about **165 mm**, yet it fails the final retention window. Peak height or any earlier 500 ms hold would have produced a misleading success label.

The current lift controller checks retention at the end of its sequence. It does not interrupt motion immediately on contact loss: the final check follows the light case's bilateral-contact loss by about **1.656 seconds**, and the heavy case's loss by about **0.2 seconds**. Dense recording makes those failures inspectable; it does not itself provide an online slip reflex.

The 0.54 m reach bound is this controller's configured operating envelope at its chosen tool orientation. It is not a proof that every possible PiPER configuration is unable to reach the initial shoe. The mounted-rake comparison also changes robot geometry and inertia, so it cannot isolate memory, learning or planning quality.

Development includes an initially permissive lift check that could count world support as retention. The final criterion excludes world support. The [development archive](../topics/physical-grounding/runs/2026-10-13-skill-prerequisites-v01/development/README.md) retains tuning summaries, that failure and the final development index separately. One retained development lift did not generalize to these held-out cases. The archive's summaries are not a claim that every early prototype has a complete trajectory.

The next experiment should continuously recheck shoe pose after rake clearance, require bilateral acquisition before lifting, and test a low lift with continuous loss detection and recovery. It needs a fresh parameter cohort. Later tests need delayed hazard onset, sensor uncertainty, actuator delay, measured contact properties and free-tool acquisition. A future learned policy should face the same independent completion conditions and all-attempt denominator as these authored baselines.

## Reproduce it

Use the pinned source revision before installing the simulator extra:

```sh
git clone https://github.com/Dvidia-Inference/dvidia-training.git
cd dvidia-training
git checkout 756306a2beda60ac54567971626080a56227e781
python3.12 -m venv .venv
.venv/bin/python -m pip install '.[arm]'
.venv/bin/dvidia-robot-sim fetch piper --output runs/robot-assets
.venv/bin/dvidia-prerequisites --assets runs/robot-assets \
  --output runs/my-prerequisites --split heldout \
  --source-commit 756306a2beda60ac54567971626080a56227e781
.venv/bin/python -m http.server 8000 --bind 127.0.0.1 \
  --directory runs/my-prerequisites
```

Open `http://127.0.0.1:8000/` after the run. On Windows use the virtual environment's `Scripts` executables and single-line commands. Provisioning requires network access; native simulation and replay use local assets afterward. The native benchmark needs a CPU and MuJoCo; the viewer needs WebGL2. No CUDA or large language model is on the control path.

The [run archive](../topics/physical-grounding/runs/2026-10-13-skill-prerequisites-v01/README.md) links the protocol, lightweight index, sixteen complete trial receipts and the [immutable file inventory](../topics/physical-grounding/runs/2026-10-13-skill-prerequisites-v01/lab/integrity.json). A hash seal checks artifact consistency, not publisher authenticity or physical validity. Repeating the existing held-out cases reproduces this cohort; it does not create independent confirmation evidence.

The PiPER assets are pinned to MuJoCo Menagerie revision `0059d4335f8156206f63a35662313385f7ad6d74`; provisioning verifies 90 files and retains the original MIT notice. DVIDIA code and synthetic scene assets are MIT. MuJoCo is Apache-2.0; Three.js is MIT; the embedded IBM Plex Sans retains SIL OFL 1.1. Required notices accompany the exported files. Original DVIDIA research writing is CC BY 4.0.

Follow [@iammrriver](https://x.com/iammrriver) or contact [hello@dvidia.org](mailto:hello@dvidia.org).
