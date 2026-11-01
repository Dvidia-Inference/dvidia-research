# Incremental PiPER hold correction exhausted its bound after 320 ms

DVIDIA research · 1 November 2026 UTC · PiPER incremental hold v0.3

The proposed incremental PiPER hold did not sustain active regulation for five seconds in any of eight fresh synthetic scenes. It admitted four grasps and terminally refused all four after 320 ms, when the proposed cumulative joint correction exceeded its fixed bound. One recorded trajectory nevertheless satisfied the five-second native grip-and-stationarity endpoint after switching to the measured-position fallback. That outcome does not establish a successful active incremental hold.

## A fixed comparison

We compared one authored candidate with the three unchanged v0.2 controls: measured-joint, issued-joint and Cartesian holds. Each ran once in each of eight scenes, for 32 attempts of 20 simulated seconds. The saved report records all 32 attempts as valid. Every variant admitted the same four higher-friction scenes, with no false initial admissions. The four lower-friction scenes never reached admission and remain failures in every denominator.

| Hold | Native grip for 5 s | Native grip + stationary TCP for 5 s — primary | Controller qualified at 5 s | Primary + controller qualified |
|---|---:|---:|---:|---:|
| Measured joint | 0/8 | 0/8 | 0/8 | 0/8 |
| Issued joint | 4/8 | 0/8 | 4/8 | 0/8 |
| Cartesian v0.2 | 4/8 | 0/8 | 0/8 | 0/8 |
| Incremental candidate | 1/8 | 1/8 | 0/8 | 0/8 |

The distinction between the last three columns matters. The issued-joint controller continued to qualify its grips, but TCP displacement reached 4.67–4.80 mm, exceeding the common 4 mm stationarity limit. The old Cartesian controller refused after 1.62–1.74 seconds when its position error crossed that limit; its four grip-only successes include fallback behavior. Measured-joint controllers refused for insufficient retained probe height after 3.00–4.98 seconds. No method achieved the combined native-task and controller-qualified endpoint in this comparison.

## The proposed correction

The candidate addressed a specific failure observed in the prior recorded study. The existing pose solver returns an absolute joint target: measured joints plus a damped inverse-kinematic error step. The old Cartesian correction subtracts the solver's admission target, which can largely cancel the measured drift against the corrective step. The candidate instead subtracts the current measured joints from each solver output and accumulates the resulting increment around the target issued immediately before admission.

The first admitted command repeats that preceding target exactly. Subsequent updates use gain 1.0 at 20 ms boundaries, limit each accepted correction change to 0.002 rad per joint, and refuse any unlimited cumulative proposal beyond ±0.03 rad. The jaw target, native gains, force caps and native target slew remain unchanged. Refusal is terminal: no further integration or requalification occurs.

## Where active regulation ended

In all four admitted candidate runs, joint 5 triggered the total-correction refusal. The last accepted correction magnitude was 0.02723–0.02727 rad; the next unlimited proposal reached 0.03125–0.03147 rad and was rejected before applying it. TCP position error at refusal was only 0.77–0.81 mm, below the pose-error ceiling. The bound therefore ended active regulation before the requested five-second pause. Three subsequent fallback trajectories lost the native grip predicate 3.307–4.471 seconds after admission. The remaining trajectory passed the native endpoint, but its controller had already refused after 0.32 seconds. These records do not establish a better gain or justify increasing the bound.

## Measurement and scope

The primary endpoint requires a correctly qualified 100 ms native admission prefix, followed by continuous grip and TCP stationarity through the next five seconds. Every 1 ms native sample must satisfy the original contact, force, support, rise and relative-drift predicates. TCP displacement must remain within 4 mm and orientation error within 0.05 rad of admission. A complete warning-free recording, no unexpected contact anywhere in the episode, and no post-admission force-ceiling violation are also required. The 10 N per-finger ceiling is an authored simulator check, not a calibrated physical safety limit. Controller qualification and final-state evidence are reported separately.

The fixed scene matrix crosses masses of 0.0475 and 0.0525 kg, friction values of 0.78 and 0.52, and starts at `(0.304, -0.024, 0.082)` and `(0.308, -0.035, 0.082)` metres. Four balanced variant orders are repeated twice. Source commit `3f30847a7285a180f93b8b0beac0def1a7ceb912`, runtime, assets, limits and protocol were frozen before the matrix. No scheduled attempt was repeated to improve its outcome, and no parameter was tuned after observing these results. The study ran with Python 3.12.9, NumPy 2.5.3 and MuJoCo 3.15.0 on Darwin arm64.

## Independent readback

The read-only inspector reconstructed 32,000 issued commands and 640,000 native
1 ms samples. All eight acquisition prefixes match across four variants up to
the first treatment boundary. A separate NumPy reader, without importing the
controller, scorer or simulator, matched the native endpoints, correction law,
control slew and source identities. Its audit binds all 354 study files. Reader
implementation errors were corrected with their failed logs retained locally;
no simulation was repeated or raw study file changed. Audit SHA-256:
`9eacbf481e0bba82a815f6ee0cd9de85d0b235515fee86bb062a0c300eaebc41`.

The issued-target controller had 1,297 qualified control boundaries after the
continuous stationary-task predicate had failed. These are correlated 20 ms
checks, not 1,297 independent trials, and the controller's original qualification
checks grip rather than stationary-task completion. Native grip contradictions
and false initial admission counts were zero in all four variants.

## Recorded computation

| Controller | Mean policy CPU | Mean whole-step CPU | Mean per-attempt step CPU p95 | Whole-step wall samples over 20 ms |
| --- | ---: | ---: | ---: | ---: |
| measured joint | 0.101 ms | 3.137 ms | 5.725 ms | 99/8,000 |
| issued joint | 0.118 ms | 3.417 ms | 6.165 ms | 123/8,000 |
| cartesian | 0.119 ms | 3.305 ms | 5.798 ms | 59/8,000 |
| incremental | 0.135 ms | 3.629 ms | 6.271 ms | 134/8,000 |

Timing describes unpaced CPU simulation and dense telemetry on a shared host.
Percentiles are averaged per attempt, not pooled estimates. Compile/setup and
serialization are separate. No GPU is required for this experiment, but these
measurements establish neither hardware sensor latency nor real-time deadlines.

## Learning from EGM and Harness²

We also applied engineering workflow ideas. EGM separates design work with project context from reviewers who see the artifact and its referenced sources without the earlier discussion. Our independent design review used that separation and caught a concrete counterexample: absolute-target clipping could manufacture a nonzero increment even at zero pose error. The candidate now refuses measured joints outside the existing target margin before solving. This was a useful review finding before execution; it did not predict a successful controller. [EGM pinned source](https://github.com/google/elephant-goldfish-model/blob/403d8881d62022490637d740657b33f01e321ea8/README.md).

Harness² proposes and probes changes to an agent's surrounding tools and instructions while keeping model weights fixed, then retains evidence-supported lessons for later tasks. We adapted that idea to a bounded robotics workflow: propose one change, freeze the comparison, inspect its behavior and retain the negative result. We did not install or execute either upstream framework, train model weights, or transfer their reported benchmark gains to robotics. A future controller change would be a new proposal with a separate evaluation. [Harness² pinned source](https://github.com/google-research/harness2/blob/1cfe254e8d25b15f37048c3730134686abe60335/README.md), [experiment guide](https://github.com/google-research/harness2/blob/1cfe254e8d25b15f37048c3730134686abe60335/docs/EXPERIMENTS.md).

## What remains

A verified pause after a test lift remains a useful prerequisite for later movement. This candidate did not supply that active hold, and it could not address the acquisition failures that prevented half the scenes from reaching the hold stage. The experiment uses privileged simulator observations and authored controllers; it evaluates neither learned placement nor camera-based physical control. These eight deterministic development scenes cannot establish hardware readiness, population reliability or general transfer to other objects and arms. The results do not support adopting this candidate as a successful active hold.

## Source and records

Source was frozen at [commit 3f30847](https://github.com/Dvidia-Inference/dvidia-training/commit/3f30847a7285a180f93b8b0beac0def1a7ceb912).
Protocol SHA-256: `0638864729cffee0deb956ae2c20f5f907fd8c4237aad2e88eee0b29c1d2a778`.
The protocol was created on 1 November UTC; the run directory retains the
initiating 31 October local research date.

[GitHub source and evidence](https://github.com/Dvidia-Inference/dvidia-training/releases/tag/piper-incremental-hold-v0.3-preview) ·
[Hugging Face dataset](https://huggingface.co/datasets/Dvidia/piper-incremental-hold-v03) ·
[HTML report](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-31-piper-incremental-hold-v03/report/report.html) ·
[Report JSON](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-31-piper-incremental-hold-v03/report/report.json) ·
[Frozen protocol](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-31-piper-incremental-hold-v03/report/protocol.json) ·
[Independent audit](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-31-piper-incremental-hold-v03/report/audit.json) ·
[Inspection](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-31-piper-incremental-hold-v03/report/inspection.json).

Original DVIDIA source and synthetic records are MIT. Upstream assets and
dependencies retain their licenses. No private footage, credentials, third-party
robot meshes or pretrained weights are bundled. The prior learned PiPER
placement result remains 5/12 against its authored teacher at 12/12; this
authored hold study does not change it.

The full evidence archive is 157,163,987 bytes and preserves 364 inventory files.
SHA-256: `5129187d14f8d4ad691a69e3554cff2b5ba65489a19c1583609c767b36f42c44`.
[Publication tools at 569e8d3](https://github.com/Dvidia-Inference/dvidia-training/commit/569e8d3aec52f63eea6c87f109dc4e87d6a7af0e) preserve the frozen runtime bytes.
[Hugging Face revision ef896f5](https://huggingface.co/datasets/Dvidia/piper-incremental-hold-v03/tree/ef896f5a0a3266f39075df03e2525fd4236602d9) identifies the six published files.
