# Constructing task environments with independent completion checks

DVIDIA research · 31 October 2026 · Task environments v0.2 preview

## Abstract

An editable, versioned scene recipe now constructs a bounded multi-object environment around the pinned six-axis PiPER. A static table, an open-top bin and one to four original rigid object instances are authored as a self-contained OpenUSD stage, parsed with the real USD SDK and compiled into native MuJoCo mechanics. A frozen study retains six accepted completion fixtures, six correctly rejected native counterexamples and four rejected layout inputs. An independent read-only audit reconstructs 13,262 recorded 1 ms observations and 1,337 replay frames with zero mismatches. These are environment and completion-verifier checks: the arm holds home commands, and no learned placement, human-video action recovery or physical transfer is demonstrated.

## From an asset list to a task environment

Our intended product connects Skillspace footage to reusable practice environments, evaluated policies and compatible robot installation. Knowing which USD assets appear in a demonstration is one input. Useful practice also requires metric scale, object layout, a robot frame, contact assumptions and a measurable outcome.

This preview adds that explicit environment contract. A recipe supplies the tabletop, bin, object instances, poses, mass and sliding friction. It pins source, catalog and robot-profile identities. Distances use metres, mass kilograms and time seconds; Z points upward, and pose quaternions use wxyz order. The robot remains a separately verified native MJCF model with six arm axes and one coupled-jaw command. Its actuators, joints, inertial properties and coupling are preserved.

The browser edits a draft. Selecting an object and dragging it across the table changes its metric position; numerical controls expose the actual values. Running the preview invokes local Python physics and returns a recording. The browser renders saved native poses rather than simulating dynamics itself. Terminal commands use the same recipe and runner.

## Geometry and assumptions remain visible

The supported environment consists of a horizontal tabletop at Z=0, one static open-top bin and one to four dynamic rigid objects. Objects are boxes or an original shoe surrogate made from three touching, stepped boxes. The surrogate has no scanned geometry, laces, flexibility, crushing or measured shoe material properties. Its uniform compound mass distribution and contact properties are labelled authored assumptions.

The bin has five separate colliders: a floor and four walls. Its interior remains empty, so an object can actually enter it. Rendering an attractive bin while using a solid collision box would make containment physically impossible. Visual and collision dimensions here derive from the same bounded recipe, and compiled native geometry is checked against the SDK-parsed USD values.

The stage declares SI units, gravity and local geometry explicitly. Unsupported composition arcs, external assets, arbitrary meshes, time samples and USD articulations are rejected. This is a deliberately narrow scene compiler, rather than a general USD or NVIDIA asset importer. Richer licensed assets can later join through separately qualified import profiles.

Validation rejects ambiguous JSON, duplicate object identities, unsupported fields, nonfinite values, initial object overlap, penetration of bin colliders, table overhang and objects that cannot fit upright in the bin. It permits a bounded initial drop. It does not establish arm reachability, grasp feasibility, a collision-free insertion path or physical safety.

## Completion considers the whole object

A finished-looking image or an object origin inside the bin can conceal a failure. The independent native goal requires every corner of every collision piece to lie inside the rotated bin interior. Every required object must contact the bin floor, remain free of robot and gripper contact, and stay below both linear and angular speed limits for the continuous dwell interval. The default dwell is 250 ms; a declared 1 mm floor tolerance permits bounded solver contact penetration.

The verifier updates at every 1 ms physics step. Repeated observations at one timestamp add no settling time. Time resets, missing intervals and invalid native states clear history and remain unknown. Saved replay snapshots are 10 ms apart; the separate full 1 ms observation trace preserves the evidence needed to reconstruct continuous dwell.

These predicates use native simulator ground truth for evaluation. They are not camera estimates or measurements available automatically on a real robot. Requiring all objects to contact the bin floor also excludes stacked completion from this release's task definition.

## Frozen protocol and counterexamples

[Source commit 14759c5](https://github.com/Dvidia-Inference/dvidia-training/commit/14759c5) was public before the confirmation run. The protocol fixes sixteen cases, exact inputs, thresholds and source identities. An execution intent is written before stepping; started attempts cannot be silently repeated or overwritten. An earlier prepared directory was superseded before native execution when geometry export was deduplicated. That preparation remains separate from the executed confirmation study.

The six positive fixtures drop a block, a rigid shoe surrogate, two blocks, a block and a shoe, two objects into a rotated bin, or four distinct blocks into the bin. PiPER holds its native home commands throughout; gravity and contact settle the objects.

Six negative controls cover an object outside the bin, a rim overhang, unsupported apparent containment, excessive motion, insufficient dwell and one required object outside a two-object task. Two stationary counterexamples explicitly disable gravity; the speed counterexample declares an initial 0.3 m/s velocity and zero friction. These interventions are recorded separately. No pose, velocity or external force is overwritten during stepping. Four invalid input cases test overlap, table overhang, impossible fit and duplicate identity before native execution.

## Results

| Cohort | Scheduled | Expected behavior observed |
|---|---:|---:|
| Accepted completion fixtures | 6 | 6 |
| Native negative controls | 6 | 6 |
| Rejected layout inputs | 4 | 4 |
| Total environment checks | 16 | 16 |

All twelve scheduled native runs are valid. The six negative controls correctly remain incomplete, and all four invalid layouts are explicitly refused. Agreement across this small authored roster is not a learned robot success rate, a general false-completion rate or a statistical estimate of arbitrary scene accuracy.

Deliberately weakened verifiers expose the value of separate checks. Origin-only containment accepts four negative fixtures at some point; geometry-only containment accepts three. Removing speed permits the moving counterexample, removing dwell permits the short observation, and checking only one instance permits the incomplete two-object task. These are declared counterexamples, rather than measurements on a representative deployment distribution.

The independent auditor uses separate pure geometry and quaternion calculations to reconstruct containment, contact labels, speed gates, all-object conjunction, continuous dwell and the five weakened verifiers from the saved observations. It checks frozen input/source identities, exported collision geometry, compressed resources and 100 Hz replay correspondence. All 13,262 physics observations and 1,337 replay frames agree, with zero mismatches. Maximum object-pose float32 replay roundoff is 2.90 × 10⁻⁸ in the corresponding position/quaternion components. This is evidence consistency, not independent proof that the simulator or contact observations match physical reality.

Targeted validation includes 48 core, benchmark and localhost-studio tests; ten independent-audit tests; four viewer resource-path tests; and eight publisher tests. These check different parts of the engineering release and do not add independent physical trials.

## Performance is an engineering target

The twelve native cases simulate 13.25 seconds in 16.550 wall seconds through final study outputs, including scene construction, verification, per-step evidence, geometry export, compression and report writes. The corresponding shared-host throughput is 0.801 simulated seconds per wall second. It is not yet an ultra-fast end-to-end training loop.

The tested host uses Apple arm64, Python 3.12.9, NumPy 2.5.3, MuJoCo 3.15.0 and OpenUSD 26.11. Physics runs on CPU without CUDA; the browser uses WebGL2 to display the recording. These measurements do not qualify hardware minima, other operating systems or hard real-time robot control.

A separate development-only profile repeated observation of a paused native state without stepping physics. Geometry/contact lookup and duplicate observation work cost more than JSON encoding in that microcheck. This suggests caching immutable model indices, capturing one causal state per physics step and measuring compile/export costs separately. No performance change or extra trial was applied to the frozen confirmation run.

## Run locally and inspect the evidence

The [portable environment kit](../topics/physical-grounding/runs/2026-10-31-task-environments-v02/environment/index.html) includes all sixteen scheduled outcomes, frozen inputs and source, native observation traces, recorded geometry, the independent audit and license notices. The [local reproduction guide](../topics/physical-grounding/runs/2026-10-31-task-environments-v02/environment/docs/task-environments-v02.md) explains draft editing, fresh scene authoring, local simulation and Terminal export. Outputs use fresh destinations so changes do not replace earlier evidence.

[Open the environment studio on Hugging Face](https://dvidia-robot-simulation-lab.static.hf.space/task-environments/v02/index.html) · [Download the dataset and evidence](https://huggingface.co/datasets/Dvidia/task-environments-v02) · [Install the GitHub preview](https://github.com/Dvidia-Inference/dvidia-training/releases/tag/task-environments-v0.2-preview)

## Separate installed-package follow-up

After the frozen study was packaged, a fresh Python 3.12 environment installed preview wheel 0.1.3.dev2 and its dependencies through the official package resolver. Outside the checkout, with PYTHONPATH removed, the installed init → validate → author → run → export workflow completed. A separate 1.5-second, two-object passive fixture was valid and reached the native goal. This smoke reuses previously verified local PiPER assets; fresh asset fetching, other operating systems and hardware minima were not tested. It is not an extra confirmation trial. The [installed-package proof](../topics/physical-grounding/runs/2026-10-31-task-environments-v02/publication-proofs/installed-smoke.json) binds the 5,685,053-byte wheel by SHA-256.

[Anonymous Hugging Face byte checks](../topics/physical-grounding/runs/2026-10-31-task-environments-v02/publication-proofs/huggingface-anonymous-readback.json) verify all nine dataset files and 175 new Space files at their exact published revisions. All 4,422 pre-existing Space objects remain unchanged. The sealed environment kit is mirrored here without changing its scientific or source bytes.

## The next bridge to an installable skill

The scene recipe gives us repeatable practice and a checkable destination. To learn from actual Skillspace footage, we still need causal object pose estimates in the robot frame, preserved camera timing and reviewed corrective action demonstrations. The [native camera/action capture preview](./Native%20PiPER%20action%20capture%20v01.md) supplies actual simulated images and measured/issued actuator history, while keeping missing tracker channels explicit and refusing unsupported training exports.

The next learning experiment should connect qualified observations to corrective action targets, train on one partition and evaluate unseen starts and perturbations against the fixed controller. A reliable skill must earn its installable release through that comparison. Adding more scene assets is useful infrastructure; it does not by itself recover human motor commands, learn robust manipulation or transfer a policy to any arm.

Original DVIDIA code, authored scenes and synthetic rigid assets are MIT licensed. Pinned PiPER assets retain their MIT notices; Three.js and other dependencies retain their own licenses. No learned model weights are published with this study. Follow [@iammrriver](https://x.com/iammrriver) · hello@dvidia.org.
