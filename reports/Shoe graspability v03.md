# Give the gripper a fair test

## What we learned

**The shoe is difficult, but the load and gripper model also matter.** Our frozen direct-grasp study retains 24 valid native attempts. Lightweight 30 g controls complete eight of twelve lifts. All twelve 300 g attempts fail, including the small block. Removing the rake gains one narrow-shoe result and loses one block result; it produces no net completion gain.

This follows [continuous shoe grip v0.2](Continuous%20shoe%20grip%20v02.md), where improved contact checking and controlled retries left completion unchanged at 2/10. That experiment combined retrieval, tool clearance and pickup. Here the object starts within reach so we can inspect the grasp itself. These are different tasks and cohorts: **8/24 here is a mixture of diagnostic conditions, not a new shoe success rate or a measured improvement over 2/10.**

The useful advance is a clearer test. Shape, load and attached-tool condition are explicit; contact traces and independent scoring identify what the gripper actually supports. A failed easy-object control remains visible instead of being attributed to the shoe.

## Explore the evidence

[Open the recorded comparison](../topics/physical-grounding/runs/2026-10-14-shoe-graspability-v03/lab/index.html) · [Hugging Face laboratory](https://huggingface.co/spaces/Dvidia/robot-simulation-lab) · [Pinned runnable source](https://github.com/Dvidia-Inference/dvidia-training/tree/73057dc259c6a19344906f4a43a283553e17ade0)

Choose a shape, load and tool condition, then play or seek the measured trajectory. The viewer exposes the collision geometry, actual simulated actuator force, individual finger forces, settled reference and relative lift. The browser replays native MuJoCo recordings. The Python command below runs fresh physics locally.

All planned attempts, failures and complete traces remain downloadable. The research site and Hugging Face distribute the same sealed export. Binary assets are bundled; Hugging Face can load a hash-checked research mirror with a local fallback.

## A controlled grasping question

The final protocol contains three rigid shapes, two explicit loads, two layout/friction combinations and two tool conditions: **3 × 2 × 2 × 2 = 24 attempts**. Source `73057dc259c6a19344906f4a43a283553e17ade0` was frozen before this single confirmation execution. The separately declared parameter combinations were not used to tune the controller. They are not a random sample of physical shoes or an estimate of general robot reliability.

| Factor | Declared conditions |
| --- | --- |
| Shape | 40 × 40 × 40 mm block; 140 × 50 × 60 mm narrow shoe proxy; existing compound shoe proxy |
| Object mass | 30 g lightweight control; 300 g reference load |
| Tool | Rake mounted at reset; rake absent at reset |
| Replication | Two paired layout/friction combinations per load |
| Controller | One authored policy with fixed shape-specific grasp offsets |

The policy uses privileged native object pose and contact observations. Its trajectory, joint drive settings and command limits remain the same across tool and load conditions. Every object remains a free body, with no adhesive constraint or externally applied object force.

The absent-tool condition does **not** demonstrate tool detachment or retrieval followed by tool disposal. Removing the rake changes its collision geometry and wrist loading together. Changing the object shape changes both inertia and contact geometry. The current experiment does not isolate those changes further. Layout and friction also change together between the two replicates.

The full compiled-model hashes intentionally differ across cells. The compiled robot actuator fingerprint remains the same across all twelve tool pairs. That fingerprint excludes tool and object inertia, so its agreement means the declared robot drive settings are unchanged, not that the complete dynamics are identical.

## Results

| Retained direct lifts | 30 g, rake mounted | 30 g, rake absent | 300 g, mounted | 300 g, absent |
| --- | ---: | ---: | ---: | ---: |
| Small block | **2/2** | **1/2** | **0/2** | **0/2** |
| Narrow shoe proxy | **1/2** | **2/2** | **0/2** | **0/2** |
| Current shoe proxy | **1/2** | **1/2** | **0/2** | **0/2** |

All 24 attempts are numerically valid. Every episode lasts 6.60 simulated seconds. The full rigid shoe succeeds only in one lightweight layout under both tool conditions. The first lightweight layout supplies the opposite block and narrow-shoe changes when the rake is removed. The 300 g conditions all fail under both tool states.

This does not establish that the rake never interferes, that a block is always easy, or that a shoe cannot be grasped. It shows that removal alone is not a general solution for these cases. The failure across all heavier shapes makes the modeled drive response and grasp configuration a priority for the next experiment.

The [benchmark index](../topics/physical-grounding/runs/2026-10-14-shoe-graspability-v03/lab/benchmark.json), [protocol](../topics/physical-grounding/runs/2026-10-14-shoe-graspability-v03/lab/protocol.json) and [analysis](../topics/physical-grounding/runs/2026-10-14-shoe-graspability-v03/analysis.json) retain every cell, its force and timing evidence, and the matched tool comparisons.

## What counts as a lift

At 0.4 s, the independent scorer requires an initial reference supported by the world, clear of robot contact and stable to at most 1 mm variation on each position axis over the previous 100 ms. It derives the reference position from the native trace rather than trusting an event's coordinate claim.

A retained lift needs all of the following on **every native 2 ms tick of the final 500 ms**:

- Object-origin rise of at least **35 mm** relative to that qualified reference.
- Normal contact above **0.01 N** on each finger.
- World, rake and non-finger robot support each below **0.01 N**.

The analytic minimum height of the collision geometry is reported separately. Origin rise alone does not prove a lift; the support exclusions prevent a tilted object resting elsewhere from passing. The force thresholds are synthetic scoring conventions, not calibrated physical safety or damage limits.

The publisher independently recomputes these score fields from every full trial before accepting a release. It rejects incomplete native traces, forged pass flags, altered reference/contact evidence and changed actuator fingerprints. Consistency checks and hashes make evidence auditable; they do not validate the assumed physics.

The [independent audit](../topics/physical-grounding/runs/2026-10-14-shoe-graspability-v03/audit/native-audit.json) verifies the frozen evidence without rerunning the benchmark. The complete export contains **107 files, 55,750,637 bytes and 79,200 native ticks**. [Integrity inventory](../topics/physical-grounding/runs/2026-10-14-shoe-graspability-v03/lab/integrity.json).

## The force cap is not the force applied

The pinned gripper is a coupled position drive with proportional gain **40 N/m**, damping **5 N·s/m** and actuator-force bounds **±10 N**. The bounds limit the drive output; they do not command 10 N of grip. For example, 30 mm of position error contributes about 1.2 N before damping and transmission coupling. See the [MuJoCo position-actuator definition](https://mujoco.readthedocs.io/en/3.3.1/XMLreference.html#actuator-position).

The highest absolute gripper actuator force recorded anywhere in the fresh cohort is **1.7024 N**. This is a transient simulated drive observation, not a guaranteed gripping capacity. Individual fingertip normal forces are separate measurements. Neither quantity is calibrated to physical PiPER hardware, and we did not increase the gains or force bounds to obtain more passes.

The full shoe is also a rigid, solid proxy. Its 100 mm sole and 94 mm upper exceed the pinned gripper's nominal 70 mm slide-coordinate span, although the controller targets a narrower region. A hollow collar, deformable upper, heel tab and laces are absent. Several useful real shoe-grasp strategies therefore cannot be evaluated in this model. Finite failures do not prove all grasps impossible. The [recorded joint-limit diagnostic](../topics/physical-grounding/runs/2026-10-14-shoe-graspability-v03/audit/jaw-limit-audit.json) finds that both retained lightweight current-shoe attempts exceed the nominal 70 mm slide-coordinate span throughout their final 250 native ticks: **71.003–71.135 mm with the rake and 71.597–71.768 mm without it**. Sampled issued commands stay within their limits, while compliant simulator joint limits permit actual overtravel. The frozen retention rule did not include a joint-limit tolerance, so we retain the scores and expose this separate limitation. These openings do not establish a physical gripper aperture or show that the same lift works with hard travel stops. Joint-limit calibration remains necessary.

## Compute and reproduction

On the recorded macOS arm64 host with Python 3.12.9 and MuJoCo 3.15.0:

| Measurement | Fresh cohort |
| --- | ---: |
| Native attempts | 24 |
| Simulated duration, summed | 158.40 s |
| Native execution wall time | 8.4043 s |
| Separate audit and replay export | 20.0317 s |
| Timed target-solver calls | 7,920 |
| Target-solver p95 / maximum | 0.0443 / 4.2008 ms |
| Solver calls exceeding 20 ms | 0 |

Native timing includes model initialization, control, physics and recording. Target-solver samples omit most observation, monitoring and physics work. These measurements exclude browser rendering, downloads and physical sensor/actuator latency and do not establish a complete-loop real-time deadline. CPU simulation needs no discrete GPU; replay needs WebGL2. Minimum RAM and scaling across hosts remain unmeasured.

```sh
git clone https://github.com/Dvidia-Inference/dvidia-training.git
cd dvidia-training
git checkout 73057dc259c6a19344906f4a43a283553e17ade0
python3.12 -m venv .venv
.venv/bin/python -m pip install '.[arm]'
.venv/bin/dvidia-robot-sim fetch piper --output robot-assets
.venv/bin/dvidia-graspability-benchmark --assets robot-assets \
  --output my-graspability-results --split heldout \
  --source-commit 73057dc259c6a19344906f4a43a283553e17ade0
.venv/bin/python -m http.server 8000 --bind 127.0.0.1 \
  --directory my-graspability-results
```

Open `http://127.0.0.1:8000/`. Windows uses the environment's `Scripts` executables and single-line commands. Installation and initial pinned-asset provisioning need network access; simulation and local replay can run offline afterward. Use a new output directory. Reproducing these published cases does not create a new unseen evaluation cohort.

## What this means for a downloadable skill

A useful skill package needs evidence that the named hand can obtain a suitable contact arrangement under its declared object and drive assumptions. A replay or instruction such as “pick up the shoe” cannot supply missing grasping geometry or calibrated force response.

The next step is to measure a named gripper's force-versus-command behavior, fit its actuator profile, and add shoe geometry with an accessible collar and measured material behavior. This diagnostic becomes a regression test for those improvements. The current release remains an authored simulation study with rigid synthetic objects, not a footage-trained model or a physical robot qualification.

Original DVIDIA code and synthetic primitives are MIT; research writing is CC BY 4.0. PiPER, Three.js and font notices remain in the bundled export. Branding grants no trademark rights.
