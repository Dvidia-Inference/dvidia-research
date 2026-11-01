# A small RGB-D cube tracker passes at 320 pixels, not 160

We evaluated a simple current-frame estimator for one known object: an unmarked, upright orange cube with 40 mm sides. It uses color and metric optical-Z depth to estimate the cube center and yaw from a single image pair. In a frozen test of 16 held-out object poses, the estimator passed its preregistered gate at 320×240. At 160×120, it missed the coverage and yaw limits. The result supports a narrow simulated perception claim; it does not establish a physical-camera tracker or a robot skill.

## A frozen test with grouped poses

We rendered RGB-D with MuJoCo’s native renderer from the same fixed PiPER camera, at two resolutions. Sixteen held-out pose groups each appeared under ten conditions and both resolutions, for 320 scheduled fixtures. Variants of one pose are correlated, so these are 16 distinct pose groups, not 320 independent samples. The estimator received only RGB, aligned depth, camera calibration, and frame timing. Native pose was joined later by the offline scorer.

Before confirmation, development changed only the minimum red and green pixel intensities in the color mask, from 65/20 to 25/8. The geometry rules stayed fixed. On the eight development poses, clear-scene coverage rose from 3/8 to 6/8 at 160×120 and from 4/8 to 8/8 at 320×240. The configuration and source were frozen before the held-out evaluation (source freeze `846a1d9b04745a516ff060b4efa931e5e9898fbf`).

The gate required at least 90% coverage of clear upright cubes, 95th-percentile center error no greater than 10 mm, 95th-percentile yaw error no greater than 10°, and no available pose on the registered negative conditions. Yaw was scored modulo 90°, reflecting the rotational symmetry of an unmarked square cube.

| Resolution | Clear coverage | Center error, P95 | Symmetry-aware yaw error, P95 | Negative false availability | Gate |
|---|---:|---:|---:|---:|---|
| 160×120 | 12/16 (75%) | 2.34 mm | 11.31° | 0/128 | Fail: coverage and yaw |
| 320×240 | 16/16 (100%) | 1.98 mm | 6.36° | 0/128 | Pass |

The 256 negative fixtures across both resolutions included absent and fully occluded cubes, a second orange object, invalid depth, 15° and 30° tilt, and stale or future timestamps. The estimator abstained on all of them. A separate partial-occlusion characterization returned zero estimates across 32 cases (all abstained); this condition was not a positive gate and should not be read as evidence that partial occlusion is supported.

## What the measurements mean

The 320×240 clear-pose cohort met the frozen aggregate thresholds. The 160×120 result illustrates the tradeoff: center error remained below its limit among available estimates, while four clear poses were abstentions and the yaw tail exceeded its limit. Error percentiles use available estimates and must be read with coverage. The tracker’s position and orientation uncertainty values are heuristic scales; all evaluated errors fell within those scales in this small test, but that comparison does not calibrate confidence or establish a guaranteed error bound.

An independent readback checked all 320 confirmation IDs and 2,578 evidence files, verified source bytes, and found zero mismatches. It did not execute the estimator or simulator. It also checked the rendered foreground occluder depth at 32 sampled locations. The main report records about 7.58 ms P95 estimator wall time at 320×240 on the tested Apple-silicon host. Frames used instantaneous synthetic exposure at paused simulation boundaries. Stale/future tests used authored timestamps, so neither this compute time nor the 100 ms freshness rule measures physical sensor delivery or control-loop latency.

The renderer’s CGL depth accuracy remains unverified. Its depth output is metric optical-Z from the simulator, but finite values do not certify depth accuracy. The estimator reports that limitation explicitly. The experiment involved no physical robot commands, no learned policy, and no change to the action-learning export contract; object tracker channels still require a separate qualified integration before learning can consume them.

## The next bridge

The next useful test is a moving-cube sequence with independent trajectory groups, measured capture and arrival times, motion blur or dropped frames, and changing occlusion. It should retain full trajectories and score each frame against native pose offline, while testing that stale or missing estimates cause explicit abstention. Only after that should the frozen tracker feed a separately recorded action demonstration, with the visual estimate kept distinct from the authored controller’s privileged diagnostics. A later action-learning study would need its own corrected demonstrations, split, gate, and confirmation; this static pose result does not qualify those steps.

Source and evidence: [GitHub preview release](https://github.com/Dvidia-Inference/dvidia-training/releases/tag/piper-rgbd-tracker-v0.1-preview), [Hugging Face dataset](https://huggingface.co/datasets/Dvidia/piper-rgbd-tracker-v01), and [research page](https://research.dvidia.org/papers/piper-rgbd-tracker-v01/).


[Explore all confirmation images](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-11-01-piper-rgbd-tracker-v01/viewer/) · [Independent audit](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-11-01-piper-rgbd-tracker-v01/viewer/audit.json).

Original DVIDIA source and generated records are MIT. Upstream model and simulator notices are retained. Research writing follows the site’s CC BY license. No private footage, credentials, pretrained weights or robot meshes are bundled. The previous learned placement result remains 5/12 versus its authored teacher at 12/12; this perception milestone does not change it.


The full archive preserves 4,366 inventory files in 49,451,665 bytes. SHA-256: `9676e71b3a0074bd4fe1b19a8e77a08d7366fa71feb3ba041aa633af6eb60f33`. [Publication tools at 769d666](https://github.com/Dvidia-Inference/dvidia-training/commit/769d666ecd684406ae228daf722e41f0bf9ac17d) preserve the frozen estimator and runner bytes.
