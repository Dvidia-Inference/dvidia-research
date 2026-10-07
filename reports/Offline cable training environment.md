# Offline cable training environment

**Product prototype and local qualification · 7 October 2026 · Native CPU simulation only**

The first runnable product loop now connects **an authored environment → local practice → a frozen controller → evaluation → an inspectable skill pack**. `CableEndReach-v0` bends an anchored cable using bounded forces at its terminal site. The selected controller completed 10/10 held-out simulated episodes, but a fixed feedback baseline also completed 10/10 and finished faster. The result establishes an executable research and packaging foundation, with explicit failure controls. It does not establish physical rope accuracy, shoe tying, realistic grasping or a performance advantage over existing simulators.

[Runnable source and instructions](../topics/physical-grounding/runs/2026-10-07-cable-env/README.md) · [Open the recorded replay](../topics/physical-grounding/runs/2026-10-07-cable-env/release-v0/replay.html) · [Download the skill pack](../topics/physical-grounding/runs/2026-10-07-cable-env/release-v0/skill-pack.zip) · [Complete qualification](../topics/physical-grounding/runs/2026-10-07-cable-env/release-v0/qualification.json)

## The task has an explicit operating envelope

Native MuJoCo 3.15.0 supplies the cable dynamics; Python 3.12.9 and NumPy 2.5.3 were used on Apple M5/arm64 without a GPU or renderer. A fixed anchor supports a nominal 0.5 m cable with 21 centerline points. Seeded variations change length, radius, density, bending/twisting settings and target position within a small authored profile. These coefficients have not been fitted to measured textile behavior.

The controller applies a world-frame force through `mj_applyFT` at an explicit site at the final capsule's centerline endpoint. The attachment is ideal. There are no gripping jaws, calibrated slip, tactile observations, camera reconstruction, axial elasticity or shoe knots. Observations expose simulator positions and velocities directly. Recorded successful episodes do not exercise contact-based gripping; their contact counts are zero.

The default contract uses 1 ms physics steps, 20 ms controls, a 2 N force-norm limit and a six-second active horizon. Success requires the actual terminal point to remain within 25 mm of the goal continuously for 200 ms. Reward and success are separate. Invalid forces are rejected before mutation; unsupported starts, solver warnings, workspace violations and numerical failures cannot become successful episodes. A goal must require movement and pass a conservative reach check.

Snapshots retain the complete MuJoCo integration state, plugin state and episode counters. Restoration validates scene/configuration identity, timing, dwell and termination consistency before replacing live state. Invalid numerical episodes preserve failure traces but cannot export resumable snapshots. Nonfinite states and clocks are represented as unavailable observations and values, rather than invalid JSON.

## Practice and evaluation ran with separate seeds

Local cross-entropy search tuned three explicit controller parameters: proportional gain, damping gain and upward force bias. It evaluated nine candidates—the baseline plus two populations of four—on three training seeds, for 27 training rollouts. This is controller-parameter search, not training a vision-language model. The selected parameters were frozen before evaluating seeds 200–209, which remained excluded from parameter search. Development had already evaluated these seeds; the final qualification repeated the fixed protocol after failure-handling and packaging fixes. Their outcomes did not drive parameter selection or changes to the search schedule.

| Controller on the same ten evaluation seeds | Successful episodes | Cumulative active simulation time |
| --- | ---: | ---: |
| Selected controller | 10/10 | 4.56 s |
| Fixed feedback baseline | 10/10 | 4.18 s |
| Zero applied force | 0/10 | 60.00 s |
| Feedback for ten control steps, then zero force | 0/10 | 60.00 s |

The selected candidate improved the training score slightly. It **did not improve held-out success or completion time** over the baseline. The negative controls show that the completion verifier requires useful sustained action in this fixture. They do not establish grasp recovery: the release intervention removes applied force from an ideal attachment. Ten seeds from one authored distribution are a bounded check, not evidence of universal coverage. [Protocol, candidate records and outcomes](../topics/physical-grounding/runs/2026-10-07-cable-env/release-v0/run.json).

The qualification run took **22.8128 wall seconds before output writing**, including controller search, comparisons and numerical probes. The selected controller's ten evaluation episodes accounted for **0.9434 wall seconds and 4.56 active simulation seconds**. Episode wall time includes construction, reset/settling, policy inference, dynamics, observations and trace collection. The active-time numerator excludes settling. Output I/O, replay display and installation are outside those clocks; control-loop latency has a narrower scope. These measurements describe one CPU workload and establish neither minimum GPU memory nor production training throughput.

## Numerical and offline checks have bounded meanings

A seed-2 regression compared twelve identical force commands at 1 ms and 0.5 ms physics steps. Maximum endpoint separation was **0.835 mm**. Independent settling already produced a **35.1 µm** initial-position difference and changed the corresponding goals. This is numerical regression evidence, not matched-start convergence or physical accuracy. The maximum centerline-length error was **1.33 × 10⁻⁸ m**, consistent with the inextensible model; it does not validate real axial elasticity.

All 23 meaningful checks passed, covering deterministic resets, complete snapshot continuation, malformed-state rejection, dwell-based completion, negative controls, rope-length preservation, replay scope and pack integrity. Independent AI-assisted agents reviewed the environment/replay contracts and exercised tests. No external human review or physical reproduction is claimed.

The qualification used a Python socket-denial guard. A separate installed-runtime check then ran under macOS `sandbox-exec` with `network*` denied. An intentional libc connection attempt returned `EPERM`; seeds 300–302 completed **3/3** simulated episodes. This strengthens the offline-runtime evidence on that platform. It does not test air-gapped dependency installation or another operating system. [Native policy](../topics/physical-grounding/runs/2026-10-07-cable-env/native-offline/native-policy.json), [run record](../topics/physical-grounding/runs/2026-10-07-cable-env/native-offline/run.json).

## Run and inspect the same product foundation

From the [public source folder](../topics/physical-grounding/runs/2026-10-07-cable-env/README.md), install pinned dependencies once and write new runs separately from the archived evidence:

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements.lock.txt
.venv/bin/python -m unittest discover -s tests -v
.venv/bin/python -m simlab run --seeds 0,1,2 --offline --output runs/demo
.venv/bin/python -m simlab train --seeds 0,1,2 --eval-seeds 200,201,202 --offline --output runs/training
.venv/bin/python -m simlab verify-pack runs/training/skill-pack.zip
```

The self-contained HTML replay supports episode selection, scrubbing and rotation without a server. The pack includes exact source, dependency lock, controller parameters, fixed evaluation evidence and a SHA-256 manifest. Its compatibility is the declared ideal endpoint-force, privileged-state simulation profile. Hash verification checks content consistency; it does not authenticate the publisher or qualify a physical robot. Dependency wheels are not bundled.

A separate reproduction extracted the published pack into a temporary folder and used only its unpacked code with preinstalled pinned dependencies. Seeds 200–202 reproduced all recorded trace values and final diagnostics exactly. This verifies that the packaged code runs independently of the original workspace; it does not exercise air-gapped installation. [Reproduction receipt](../topics/physical-grounding/runs/2026-10-07-cable-env/release-v0/reproduction.json).

The initial thesis now has a running **practice-to-evidence-to-package** segment. Demonstration intake, language grounding, spatial inspection, calibrated materials, actual gripping/recovery, realistic sensors and physical qualification remain capability gates. A GPU backend and independent worker scheduling must preserve those task semantics before making scaling claims. The next product advance should close one of these measured gaps while keeping its evidence visible.
