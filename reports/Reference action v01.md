# Fast local fits still fail complete placement

Two small PiPER controllers each trained on 96,000 demonstrated action samples
in about five seconds on a local CPU. Both then failed all four scheduled
placement attempts. Fast fitting and accurate recorded-action prediction have
not yet produced a reliable downloadable skill.

This is a separate engineering follow-up to the [camera-to-action study](../reports/Camera%20to%20action%20v01.md).
It leaves that study's frozen **5/64** result and failed qualification unchanged.
The new candidates remain **simulation-only, unqualified research models**.

## What changed

The original learner predicts joint and gripper targets. This follow-up learns
an endpoint consistent with the actuator's existing rate limits. It compares
an absolute endpoint with an endpoint relative to the preceding applied servo
reference. Both use the same 269 causal features, two 64-unit hidden layers,
initial weights, training data, optimizer budget and actuator constraints.

The preceding reference is stored as float64. It is the reference actually
applied to the servo, not a measured joint position or the teacher's next
command. In correction recordings, teacher suggestions remain distinct from
executed commands. Initial visual position is explicitly historical; unavailable
current observations keep their masks and ages. No teacher phase, current
teacher command, native object/contact truth or future frame enters the policy.

For network output `g`, reset reference `r₀`, preceding reference `r`, and
per-command scale `D`, the decoders are `r₀ + Dg` and `r + Dg`. The common scale
is 0.03 rad for each arm joint and 0.001 m for one gripper finger. Both optimize
the same physically scaled, unprojected endpoint loss. At execution they use
the original bounds and exact twenty 1 ms reference updates. These limit
commands; they do not guarantee safe contact or bound actual joint motion.

[Source and API](https://github.com/Dvidia-Inference/dvidia-training/pull/36)
retain a separate model schema. The existing installer does not yet accept
this format. Neither model is a hardware controller or a qualified skill.

Download both [research candidates on Hugging Face](https://huggingface.co/Dvidia/piper-reference-actions-v01),
with model cards and benchmark evidence, for use through the custom Python API.
Both remain unqualified simulation models.

## Training and recorded-context checks

Exactly two real fits used the same **64 teacher and 32 mixed-control training
recordings**, covering 32 starting-position groups. Each fit used seed 17,
50 epochs, batch size 512 and Adam learning rate 0.003. Normalization used
training data only. No development or confirmation recording entered fitting.

| Measurement | Absolute endpoint | Reference-relative endpoint |
| --- | ---: | ---: |
| Fit time | 5.231 s | 5.098 s |
| Model JSON size | 539,345 bytes | 538,021 bytes |
| Recorded-context callback p95 | 0.205 ms | 0.207 ms |
| Saved/reloaded outputs | 1,000/1,000 exact matches | 1,000/1,000 exact matches |

The callback check reused the first training demonstration's observations and
previous references. Predictions never advanced the simulator or fed the next
input. This is **open-loop compatibility evidence**, not task success. Its
callback timing excludes camera processing, rendering, physics and data loading.
Whole-process peak RSS for this integration was 1,345,404,928 bytes. The shared
host ran arm64 macOS 26.5.2, Python 3.12.9 and NumPy 2.5.3 with one declared BLAS
thread. These are offline measurements, not a hardware response-time guarantee.

## Eight actual control attempts

A separate, fixed engineering roster used the first two original development
starting positions, each with both destinations and both retained models. These
are reused development scenes, not fresh confirmation. There was no teacher
intervention, fallback, model selection, tuning or replacement of a failed case.

All eight attempts completed 20 simulated seconds: **8,000 motor intervals,
4,008 RGB-D pairs and 160,000 native physics ticks** in total. Independent
readback verified the saved inventories and recomputed native scores without
running physics or model inference.

| Native outcome | Absolute endpoint | Reference-relative endpoint |
| --- | ---: | ---: |
| Recorded attempts | 4/4 | 4/4 |
| Grasp observed | 3/4 | 4/4 |
| Lift observed | 1/4 | 0/4 |
| Carry completed | 0/4 | 0/4 |
| Strict placement | **0/4** | **0/4** |
| Episodes with critical contacts | 2/4 | 4/4 |
| Critical-contact 1 ms ticks | 7,606 | 19,751 |
| Callback including disk guard, p95 | 0.295 ms | 0.284 ms |
| Full offline control boundary, p95 | 22.363 ms | 22.049 ms |

A grasp flag is not a completed test lift or a secure transported object. Native
metric consistency passed for all eight recordings, while all four relative
trajectories also failed the strict trajectory contract with
`invalid_state_value`: finite tool coordinates crossed its fixed ±0.5 m
component envelope. The first rejected components were x=0.501866 m,
x=0.503337 m, z=0.504985 m and x=0.500157 m, in relative-model roster order.
These were not NaNs or physics warnings. Outer native consistency does not
override a strict trajectory failure; no score was relaxed to make them pass.

[Inspect every attempt](../topics/physical-grounding/runs/2026-11-09-reference-action-v01/viewer/index.html)
using actual camera frames, measured joints, issued commands, applied references
and observation availability. The viewer includes **all eight** attempts in
registered order. It displays RGB at 2.5 Hz from the original 25 Hz capture and
retains all 50 Hz decisions. Its [independent readback](../topics/physical-grounding/runs/2026-11-09-reference-action-v01/viewer/readback.json)
binds the displayed evidence. This small comparison has no fixed or blind
comparator and does not establish superiority, a population success rate or
hardware performance.

## Failures before the control experiment

Two earlier eight-attempt batches stopped before any learned control. The first
was blocked by a subprocess guard rejecting MuJoCo's read-only macOS startup
check. The second passed that check but could not create a CoreGraphics context
inside the default execution sandbox. All sixteen refusals remain retained.

A separate static 48×64 frame check reproduced the graphics refusal and then
succeeded with scoped graphics access. The final eight-attempt batch used the
same source, weights, scenes, physics, scorer and resource guards as the second
batch, with the corrected execution access. No failed evidence was overwritten.
The renderer also warned that `ARB_clip_control` was unavailable with the
requested depth mode. Its stated depth-accuracy limitation remains a limitation;
we have not established that it caused the task failures.

## Where the actions diverge

Comparing the eight saved attempts with four teacher recordings from exactly the same development starts isolates two gaps. The teachers achieved sustained lift by 11.836–12.056 seconds. The strongest absolute candidate did not qualify its lift until 18.991 seconds; its finger reference began sustained closure 6.76 seconds later than the matching teacher. Another absolute attempt never closed below the diagnostic 30 mm threshold. Absolute joint tracking RMS was 0.0140–0.0200 rad versus 0.0197–0.0206 rad for the teachers, so missing progress is already present in the commands; this is not explained solely by the simulated actuators failing to follow them. All four relative candidates contacted the table with finger links before closing, at 7.344–7.574 seconds. Their first recorded critical-contact snapshots placed the tool 4.54–7.04 mm lower than the matched teacher. Millimetre-scale approach accuracy matters before grip waiting can help.

The next bounded experiment should test a short-horizon acquisition policy that learns tool-pose/gripper subgoals and completion progress through approach, closure and test lift, against the unchanged endpoint controller under matched data and correction budgets. Score contact-free approach, loaded grasp, sustained lift, stalls and false progress independently before adding transport. Any authored IK or progress scaffold must be disclosed, and teacher phase labels or native contact truth must remain outside evaluation inputs. This is a proposed experiment, not a demonstrated fix: the comparison reused saved development recordings without new fitting, model calls, teacher intervention or simulation, and it establishes no causal treatment effect or qualification.

[Read the matched-teacher diagnostic](../topics/physical-grounding/runs/2026-11-09-reference-action-v01/path-diagnosis.json).
The proposed larger 164-attempt screen has not run, and no candidate has been
promoted. The unchanged model files, cards and compact receipts are available
in the [GitHub benchmark](https://github.com/Dvidia-Inference/dvidia-training/tree/8774265fdf2a4516520cdf36ff2eb41dcd04dfda/benchmarks/camera-action-reference-model-integration-v01).

Original code, generated model weights and synthetic records use MIT with
upstream simulator and PiPER notices retained. No human footage or physical
robot commands were used. Research writing follows this site's CC BY 4.0 license.
