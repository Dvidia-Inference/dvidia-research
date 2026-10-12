# A reusable shoe scene for every supported arm

DVIDIA research · 12 October 2026 · Asset library v0.1

**The first DVIDIA asset library loads six original rigid shoe proxies into native simulation with UR5e/Robotiq, PiPER or SO-101.** A versioned scene file records the exact catalog, robot, shoe identities and timestep. Users can browse the native geometry in 3D, download a selected pair's scene descriptor, and reproduce it locally using `dvidia-assets`. This release supplies reusable scene components and passive contact tests. A shoe-organizing policy is a subsequent task.

[Explore the asset library](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-shoe-asset-library-v01/library/) · [Hugging Face lab](https://huggingface.co/spaces/Dvidia/robot-simulation-lab) · [Every benchmark attempt](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-shoe-asset-library-v01/library/benchmark/report.html)

## What a shoe asset contains

The initial collection has a left and right trainer, ankle boot and slipper: six persistent instance IDs and three pair identities. Each is original procedural geometry composed of native collision primitives. The model includes a gravity-active free rigid body, assigned mass, derived inertia, surface contact parameters and a sole-bottom reference frame in meters. Native collision and rendering geometry describe the same pieces.

The shoes are **synthetic proxies**. Their dimensions, mass distribution, friction and solver settings are explicit assumptions, with per-property evidence marked untested. No real specimen was scanned, weighed or mechanically calibrated for this release. The boot's rigid upper does not flex, a slipper does not bend, and there are no simulated shoelaces or damage thresholds. A more detailed mesh alone would not resolve these missing physical properties.

Original shoe assets and tooling use MIT licensing. UR5e, Robotiq, PiPER and SO-101 retain their pinned upstream notices and individual simulation-asset licenses. These licenses describe the supplied simulation files; they do not establish that a manufacturer's complete hardware design is open source.

## Compose once, reload explicitly

The loader verifies the existing native robot asset hashes before building a scene. It preserves each model's arm and gripper mechanics and command units. UR5e and PiPER have six arm axes; SO-101 has five. The gripper adds its own command interface. An axis count is not a shared action adapter, and scene-loading compatibility does not establish that the robot can reach or grasp every shoe.

`dvidia-assets scene` builds the native scene and records two seconds of gravity and settling. The offline browser preview renders the compiled robot mesh geometry and recorded body transforms. Users can orbit, zoom, scrub time, select a shoe family and download its scene file. Family selection filters the recorded display; loading the downloaded descriptor runs a newly composed native scene containing that selection.

`dvidia-assets load scene.json --assets runs/assets --output runs/my-scene` checks the catalog version and hash before loading. Unknown objects, changed catalog identity or unsupported fields are rejected. A descriptor contains data, not executable extensions, arbitrary model paths or network URLs. Network access is an explicit provisioning step; native scene construction and stepping use the verified local assets.

The library has three fully native arm previews. These are recorded scenes, not browser physics or robot control. Their two-second animations do not demonstrate manipulation or measure the user's computer's simulation throughput.

## Benchmark native loading, gravity and support

The frozen protocol tests three arms × three shoe pairs × three seeded layouts × two support conditions: **54 attempts**. The same layouts are reused across arms and controls. Each run compiles the declared model, holds the initial robot commands, advances one simulated second at a 2 ms physics timestep and retains sampled joint positions, velocities, object state and contact observations. Every native step's computation duration is also retained.

One condition provides the table's collision surface. Its matched control disables only that surface's collision masks. The shoes retain free joints and gravity in both. The scorer checks mass and joint contracts, early gravity response, and actual shoe/table contact. A supported outcome additionally needs near-surface height and low linear/angular motion throughout the final 200 ms. The disabled-table control must fall and fail that support criterion. All failures, warnings and incomplete attempts remain in the denominator.

| Native arm | Numerically valid | Supported with table | Supported without table | Gravity checks |
| --- | ---: | ---: | ---: | ---: |
| UR5e + Robotiq 2F-85 | 18/18 | 9/9 | 0/9 | 18/18 |
| AgileX PiPER | 18/18 | 9/9 | 0/9 | 18/18 |
| The Robot Studio SO-101 | 18/18 | 9/9 | 0/9 | 18/18 |
| **Total** | **54/54** | **27/27** | **0/27** | **54/54** |

All 27 disabled-table controls fall as required. No numerical warnings occur.
No loaded shoe contact with non-table geometry appears in the recorded 20 ms
samples. Contacted geometry names and counts are retained, and any observed
unexpected contact fails the expected outcome. The sampling interval cannot rule
out shorter contacts between recorded observations. The shoes are deliberately
clear of the held arms; this is not a collision-avoidance or manipulation test.

The 108 shoe appearances reuse six authored proxies and nine seeded pair layouts.
They are not independent physical specimens. Both successes and controls retain
their complete sampled states and all **27,000 native-step durations** in the
[sealed evidence](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-shoe-asset-library-v01/library/benchmark/attempts.json).

These checks establish that the declared objects load and respond to native gravity/contact in this narrow setup. They do not establish friction accuracy, deformation, grasp success, robot reachability, physical reliability or independently sampled real-world performance. The inspector verifies complete file inventories, hashes and recorded scoring consistency; it does not authenticate a third-party claim merely because someone recomputed their hashes.

## Performance and practical requirements

Python 3.12+, the pinned NumPy/MuJoCo dependencies and the robot asset downloads run the CPU simulation. A discrete GPU is not required. The interactive preview requires a WebGL2-capable browser. After provisioning, the physics and preview resources are local. The release does not establish a universal minimum RAM requirement or a hard real-time sensor-to-actuator guarantee.

The frozen run used an **Apple M5 with 10 logical CPUs and 24 GiB RAM**, macOS
arm64, Python 3.12.9, MuJoCo 3.15.0 and NumPy 2.5.3. A fresh environment installed
a wheel built from the frozen source archive; fourteen installed files were
byte-compared with that archive. The operating-system sandbox denied network
access during the benchmark and preview exports, with a denied socket-bind check
before the first attempt. This demonstrates an offline execution path after
provisioning.

| Measurement | Observed result | Included work |
| --- | ---: | --- |
| Complete benchmark | 54 simulated seconds in 12.3616 wall seconds, **4.37× throughput** | Fresh asset verification, scene compilation, stepping and state extraction; ends before report serialization |
| Slowest attempt | **6.7047 wall seconds** | Complete attempt; retained in the receipt |
| Native `mj_step` | Median **8.50 µs**, p95 **15.75 µs**, p99 **23.42 µs**, maximum **111.92 µs** | Only the native step call, across all 27,000 calls |
| Scene construction | Median **65.66 ms** | Asset verification, composition and native compilation |
| Peak process memory | **1,111,916,544 bytes** | Process peak RSS, including earlier allocations; not a minimum RAM specification |

The native-step percentile is much narrower than end-to-end runtime. In
particular, the retained 6.7047-second attempt prevents treating the median as a
worst-case latency bound. Rendering, physical sensing, transport and actuator
response are outside these timings. A short passive scene does not establish
training throughput or a real-time robot control guarantee.

The downloadable library contains **64 files totaling 21,197,840 bytes**,
including all three recorded native previews, their original license notices,
portable scene descriptors and the complete benchmark. Initial pinned robot
downloads and installed dependencies require additional storage.

## How this advances Skillspace

A future skill package can point to these immutable object IDs, an exact robot profile, scene descriptor and benchmark receipt. This supplies a reproducible environment for learning rather than implying that downloading objects installs a trained policy.

The next shoe-specific step is a feasible grasp and placement task on one selected arm: candidate grasp regions, gripper fit, retained lift, orientation, target placement and failure scoring. Controlled real-shoe and gripper-pad measurements can then replace the assumptions that matter most. Shoe flexibility needs separate measured deformation evidence. The existing rigid-block PiPER recovery work remains a separate experiment until those interactions are tested on the new object family.

## Reproduce and inspect

The frozen benchmark runtime is
[`441ee2871620104246ab9caeb89825f12a14b889`](https://github.com/Dvidia-Inference/dvidia-training/tree/441ee2871620104246ab9caeb89825f12a14b889).
The publication and installation guide use the source revision
[`d291ee11f28b0d3c7a0b9ed062174e46fe764d15`](https://github.com/Dvidia-Inference/dvidia-training/tree/d291ee11f28b0d3c7a0b9ed062174e46fe764d15).
The browser JavaScript was built from the earlier source revision
[`17a7c81784362697f09757712efbe00d98743501`](https://github.com/Dvidia-Inference/dvidia-training/tree/17a7c81784362697f09757712efbe00d98743501).
The publication updates HTML navigation to explicit `index.html` links for static
hosting while preserving that JavaScript and the native recordings. No physics
benchmark was rerun.
The [viewer build receipt](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-shoe-asset-library-v01/viewer-build.json)
records the corrected browser bundle; the subsequent
[navigation build receipt](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-shoe-asset-library-v01/navigation-build.json)
binds the published HTML and updated seals. Native geometry, motion, scene
descriptors and license notices remain byte-identical to the frozen exports.
The original execution receipt retains its original preview byte counts; the
current library seal identifies the published viewer files.
The [installation and loading guide](https://github.com/Dvidia-Inference/dvidia-training/blob/d291ee11f28b0d3c7a0b9ed062174e46fe764d15/docs/asset-library.md)
explains provisioning the three robot profiles and opening a local preview. The
[benchmark protocol](https://github.com/Dvidia-Inference/dvidia-training/blob/441ee2871620104246ab9caeb89825f12a14b889/docs/asset-library-benchmark-protocol.md)
defines the exact support, gravity and unexpected-contact criteria.

After installing the pinned arm dependencies and fetching the robot assets:

```sh
dvidia-assets benchmark --assets ./robot-assets --seed 612047 --repeats 3 --source-commit 441ee2871620104246ab9caeb89825f12a14b889 --output ./asset-benchmark
dvidia-assets inspect ./asset-benchmark
dvidia-assets scene --robot piper --assets ./robot-assets --pair all --output ./shoe-preview
python -m http.server 8360 --bind 127.0.0.1 --directory ./shoe-preview
```

This release used the frozen seed once. Development smoke used a separate seed;
no outcome-triggered rerun or omitted attempt changes the published result. The
[installed-runtime receipt](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-shoe-asset-library-v01/installed-runtime.json),
[execution receipt](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-shoe-asset-library-v01/execution.json),
[execution log](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-shoe-asset-library-v01/execution-log.txt)
and [25 native and contract tests](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-shoe-asset-library-v01/native-tests.txt)
retain the provenance and validation boundaries.

Browse the [research-site library](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-12-shoe-asset-library-v01/library/),
the [Hugging Face Robot Simulation Lab](https://huggingface.co/spaces/Dvidia/robot-simulation-lab)
or its [direct asset-library page](https://dvidia-robot-simulation-lab.static.hf.space/asset-library/v01/index.html).
The library links separate UR5e/Robotiq, PiPER and SO-101 previews. Original DVIDIA
tooling and shoe proxies use MIT; upstream simulation models retain BSD-3-Clause,
BSD-2-Clause, MIT and Apache-2.0 notices as applicable. This article is original
DVIDIA research writing under CC BY 4.0.

Follow [@iammrriver](https://x.com/iammrriver) or contact
[hello@dvidia.org](mailto:hello@dvidia.org).
