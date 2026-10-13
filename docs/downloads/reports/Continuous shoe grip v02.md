# From reaching a shoe to keeping hold

## What we built

**Continuous grip checks did not increase completed tasks in this comparison.** Both controllers finish **2 of 10 fresh cases**, on the same two shoes. The new controller issues twelve bounded lowering responses across six unsuccessful grasp cases, adding time without producing another completion. All twenty native attempts are numerically valid and remain public.

This follows the [first prerequisite study](https://research.dvidia.org/papers/skill-prerequisites-v01/), where the mounted rake could bring a shoe closer but all held-out retained lifts failed. Version 0.2 keeps the physical scene and asks whether better acquisition checks and an online response to contact loss can improve the controller.

Both sides use the same six-axis PiPER, coupled gripper, mounted rake and rigid synthetic shoe. Here, **baseline means v0.1's tool-enabled controller**. The earlier no-tool capability control is a different experiment. All ten paired compiled-model hashes agree. Policies are authored, observations come directly from MuJoCo, and material parameters are assumed. No physical robot or learned model is involved.

### A small change to the decision loop

The new policy checks the grasp and watches bilateral contact and relative motion while lifting. At **40 mm of observed tool-center-point travel**, it checks incipient shoe rise and partial unloading during the continuing trajectory. This checkpoint is not a stopped test, a 40 mm shoe lift or independently qualified retention.

When the controller refuses acquisition or detects a loss under its own predicate, it requests bounded lowering, checks support, opens the jaws and permits one recentered retry using the original grasp geometry. There are at most two grasp attempts, with a 30-second episode budget and time reserved for cleanup. The second failed attempt can also lower before requesting help.

The release keeps the original controller workspace, including its **55 mm TCP floor**. Joint position commands remain rate limited. Neither a bounded command nor a help request establishes physical safety or completed manipulation.

## Try it

[Explore the recorded comparison](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-13-continuous-shoe-grip-v02/lab/) · [Hugging Face laboratory](https://huggingface.co/spaces/Dvidia/robot-simulation-lab) · [Pinned runnable source](https://github.com/Dvidia-Inference/dvidia-training/tree/af8933994b4626e28a0554abc782ae9d22cff06c)

Choose a case and controller, play or seek its trajectory, inspect an event, and download the complete trial. The browser replays **recorded native MuJoCo poses**. It does not run live physics or change the result. The local Python command below executes new physics.

The same sealed evidence is distributed through the research site and Hugging Face. Binary assets are bundled; the Hugging Face viewer can use a hash-checked research-site mirror with a local fallback. Download and rendering performance are separate from the native simulation measurements.

## What we measured

### A frozen paired comparison

The [protocol](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-13-continuous-shoe-grip-v02/lab/protocol.json) declares ten deterministic parameter combinations and two controllers. Eight cases have enough declared tool reach and two are insufficient-tool controls. Source `af893399` was frozen before the single confirmation run. These are joint parameter holdouts, not a random population sample or an estimate of real-world reliability.

| Fresh cohort | v0.1 mounted-rake baseline | v0.2 recovery |
| --- | ---: | ---: |
| Numerically valid attempts | **10/10** | **10/10** |
| Entered the retrieval region at least once | **8/10** | **8/10** |
| Completed retrieval and final retained lift | **2/10** | **2/10** |
| Correct short-tool deferrals | **2/10** | **2/10** |
| Issued controlled-lowering responses | **0** | **12** |

The two completions are `fresh-05` and `fresh-08`, each ending at **19.80 simulated seconds** under either policy. There are **zero paired gains and zero losses**. The six failed grasp pairs take **34.02 additional simulated seconds** in total under v0.2, averaging 5.67 seconds extra per pair. Correctly declining the two short tools remains an unfinished task.

A separate historical regression run preserves **18/18 valid attempts and 1/9 completion under either controller**, on the same known development case. Old v0.1 held-outs are now known regression data; they do not add unseen confirmation samples. Its compact index and the nine-round development ledger are in the [supplement](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-13-continuous-shoe-grip-v02/supplemental/README.md).

### Retention, monitoring and independent scoring

Native physics and contact records advance every **2 ms**. Policy observations and requested target updates use a **20 ms** clock. The controller's contact-loss debounce requires three failed sampled observations spanning 40 ms, rather than proving continuously absent contact between them. A relative-motion check uses a 200 ms window and sampled debounce.

The independent scorer ignores the controller's success flag. It requires the shoe's sole-bottom **frame** above 35 mm, normal contact with each finger above 0.01 N, and world, rake and non-finger robot support each below 0.01 N at all **250 ticks of the final 500 ms**. Frame height is not the object's lowest surface under rotation. Support exclusion prevents a tilted or externally carried shoe from passing through height alone. These thresholds are synthetic scoring conventions, not calibrated force or damage limits.

An independent condition-loss witness first requires 100 ms of qualifying retention. A sustained failure then lasts at least 20 ms. All twelve new controller detections are unmatched to that witness: they arise under other predicates or before that qualification. They are not automatically false alarms. Planned releases can also break a scored condition, so uncovered episodes are not certified missed-slip counts.

The [independent native audit](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-13-continuous-shoe-grip-v02/audit/native-audit.md) verifies **nine bilateral-contact-loss alarms at 20–52 ms, median 30 ms**, after the latest uninterrupted native contact-loss segment. The three other alarms are acquisition failures and have no acquired-grip loss origin. Contact can briefly recover between failed decision samples, explaining why the latest native segment can be shorter than the sampled debounce. The audit checks 148,610 native ticks, 14,861 replay frames and every export checksum, and recompiles ten models without running another simulation. Its [portable script](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-13-continuous-shoe-grip-v02/audit/native_audit.py) is included.

Detection, recovery request and the first native control packet are recorded separately. In these twelve responses, request and first-packet timestamps coincide at a native clock boundary. That establishes neither an immediately changed target nor instantaneous physical response. Actual movement remains in the trajectory, but first physical response, stopping distance, camera latency and hardware transport delay are not measured.

### Compute on the tested host

The run used an **Apple M5 with 10 logical CPUs and 24 GiB RAM**, macOS arm64, Python 3.12.9 and MuJoCo 3.15.0.

| Timed region, summed over each policy | Baseline | v0.2 |
| --- | ---: | ---: |
| Simulated task duration | 131.60 s | 165.62 s |
| Native execution wall time | 4.9601 s | 5.7716 s |
| Separate audit and replay export | 8.9476 s | 8.7451 s |
| Recorded target-solver calls | 6,580 | 8,281 |
| Target-solver p95 / maximum | 0.0305 / 0.5635 ms | 0.0316 / 0.3753 ms |

The native timer includes model setup, control, physics and recording. Solver samples cover target computation, excluding most monitoring, contact observation and physics. None of the 14,861 recorded calls exceeds 20 ms; this is not a whole-loop deadline guarantee. Startup, final report writing, browser rendering, downloads and physical hardware latency are outside these totals. [Timing derivation and raw index](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-13-continuous-shoe-grip-v02/analysis.json).

The native benchmark uses CPU computation. These shared-host observations do not establish minimum RAM, GPU scaling or hard real-time performance.

## Where it fails

**More feedback has not yet supplied a better grasp.** The twelve lowering cycles demonstrate executable refusal and retry, but none turns one of the six failed grasp cases into a completed task. Acquiring usable contact with this rigid shoe, gripper and attached rake remains the central limitation.

There is also a gap between the controller's monitor and the independent retention criterion. In completed case `fresh-05`, both policies accumulate **82 failed native ticks from 19.076 to 19.238 seconds** because of non-finger robot support. Height, bilateral finger contact, world support and rake support remain within their thresholds during that interval. Neither controller reports a loss. Independent requalification completes at 19.338 seconds, after 100 ms of good observations; the final window still passes. This is unmonitored support contamination, not demonstrated physical slipping. Calling the monitor complete would hide this distinction.

Development explored nine controller variants and **32 separate geometric probes**. None of those probes passed strict retained lift. A diagnostic that lowered the software TCP floor to 35 mm reached a **181.6 mm shoe-frame height**, but approximately **1.816 N of rake support** remained; it correctly failed. That relaxed floor is not used by the release. These finite probes suggest examining gripper clearance and mounted-tool interference, but they do not prove the morphology incapable of grasping a shoe.

The development ledger preserves failures and source-hash limitations: the first five iterations did not record their source hash, and the first iteration's reported peak height included initialization. The compact supplement is not presented as a complete trajectory archive for every prototype. The fresh confirmation export is complete and unchanged.

The next controlled comparison should test a contact geometry or tool-clearance change against the same independent criterion, and align online monitoring with non-finger support. It needs a new frozen parameter cohort after development. Physical transfer also needs measured gripper limits, object compliance, friction and sensor uncertainty; collecting more video does not by itself establish those properties.

## Reproduce it

```sh
git clone https://github.com/Dvidia-Inference/dvidia-training.git
cd dvidia-training
git checkout af8933994b4626e28a0554abc782ae9d22cff06c
python3.12 -m venv .venv
.venv/bin/python -m pip install '.[arm]'
.venv/bin/dvidia-robot-sim fetch piper --output runs/robot-assets
.venv/bin/dvidia-grip-benchmark --assets runs/robot-assets \
  --output runs/my-grip-comparison --split heldout \
  --source-commit af8933994b4626e28a0554abc782ae9d22cff06c
.venv/bin/python -m http.server 8000 --bind 127.0.0.1 \
  --directory runs/my-grip-comparison
```

Open `http://127.0.0.1:8000/`. Use `development` or `regression` for the known cases. A repeat of the existing held-out cohort is a reproduction, not independent new evidence. The output directory must be new. On Windows use the virtual environment's `Scripts` executables and single-line commands.

Installation and initial asset provisioning need network access; native simulation and replay use local files afterward. The viewer requires WebGL2. PiPER assets are pinned to MuJoCo Menagerie commit `0059d4335f8156206f63a35662313385f7ad6d74`, with 90 asset files verified. The [87-file fresh export](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-13-continuous-shoe-grip-v02/README.md) preserves every full trial, model, recorded motion, protocol and [integrity inventory](https://research.dvidia.org/downloads/topics/physical-grounding/runs/2026-10-13-continuous-shoe-grip-v02/lab/integrity.json). A hash checks consistency, not physical validity or publisher authenticity.

DVIDIA code and synthetic assets are MIT. PiPER retains MIT, MuJoCo Apache-2.0, Three.js MIT and embedded IBM Plex Sans SIL OFL 1.1 notices. Original research writing is CC BY 4.0. No learned skill, force calibration or physical-robot qualification is claimed.

Follow [@iammrriver](https://x.com/iammrriver) or contact [hello@dvidia.org](mailto:hello@dvidia.org).
