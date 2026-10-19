# Independent camera and actuator corroboration v0.4

DVIDIA robotics research · 19 October 2026.

The [local physical-goal verifier v0.3](../reports/Local%20goal%20verifier%20v03.md) trusts its observation packet. This experiment adds separately processed RGB and PiPER drive channels, then asks whether those channels can contradict a primary “complete” reading. It is a simulator study of evidence fusion, not a hardware safety claim.

The frozen benchmark contains **272 cases across eight layouts**: 96 native scenes, 80 primary-packet forgeries, 64 sensor faults and 32 cross-channel controls. All 96 native cases generated validly. The v0.3 baseline called 192 cases complete, including 112 physical false completions. The v0.4 gate retained 50 complete verdicts: seven physical positives and 43 false completions. It prevented 69/112 baseline false completions, but 43 remained. It also abstained on 73/80 baseline true completions; 64 had deliberately missing, stale, gapped or malformed auxiliary evidence, and nine were physically complete but visually unobservable.

The result is useful because it shows both what a second signal catches and what two weak signals cannot establish. The camera detects large motion, position disagreement and many target-visibility failures. The drive path checks finger aperture, command, motor effort, settling and servo consistency. Neither authenticates its source. These channels still miss a 180° orientation reversal, a green lookalike, elevated support, motion that aliases between samples, and refreshed or fully replayed channels.

## Paired outcome

| Measure | v0.3 primary packet | v0.4 camera + drive gate |
| --- | ---: | ---: |
| Scheduled cases | 272 | 272 |
| Complete verdicts | 192 | 50 |
| Physically true completions recognized | 80/80 | 7/80 |
| False completions among physical negatives | 112/192 | 43/192 |
| Baseline false completions prevented | — | 69/112 |
| Baseline true completions lost | — | 73/80 |
| Unknown verdicts | 0/272 | 142/272 |
| Invalid native generation | 0 | 0 |

The 64 sensor-fault controls remain physically complete; all 64 return `unknown` when their required camera or drive evidence is missing or invalid. In the native cohort, seven of eight visible settled scenes pass. Every explicitly occluded scene abstains, and one nominally visible shoe is obscured by the simulated arm. These are conservative refusals, not evidence that the physical task failed.

Among the 112 baseline false completions, the gate prevents 69 and leaves 43. The residual cases are not one generic detector error:

| Residual control | False completions that pass |
| --- | ---: |
| Instantaneous motion alias | 7/8 |
| 180° yaw flip | 8/8 |
| Visually identical green lookalike | 7/8 |
| Elevated object with hidden support surface | 7/8 |
| Refreshed camera replay | 7/8 |
| Coherent replay of all channels | 7/8 |

The layout with an occluded camera path abstains, which is why several controls show seven rather than eight false completions. A coherent replay remains compatible with the channels' declared clock labels; there is no cryptographic sensor provenance in this simulator.

## What the channels measure

The camera observer receives only eleven 640×480 RGB frames at 20 ms intervals. A fixed orthographic projection maps a green elongated proxy to XY position and an undirected axis. It receives no object ID, simulator pose, segmentation mask or physical truth. Its color-and-shape rule is not a general shoe detector. Axial geometry cannot distinguish the toe from a 180°-reversed shoe, a same-color decoy is ambiguous, and RGB alone cannot measure height above the table.

The drive observer receives one hundred PiPER joint/drive samples at 2 ms intervals: six arm channels, two signed finger positions and velocities, gripper command and simulated motor effort. It validates ranges, units, finger symmetry and a declared spring/servo consistency relation, then checks that the fingers are open, commanded open, settled and at low effort. Motor effort is not object contact force. Neither channel can verify table support or rule out contact from every arm link.

Both channels originate in the same MuJoCo model as the primary packet. They use separate processing code, but are **not independent physical sensors**. Calibration bounds and IDs are synthetic declarations, not authenticated measurements. An unknown result means the verifier refuses to confirm; it does not mean the scene is physically incomplete.

## Compute and limits

On the recorded Apple Silicon host, the complete processed decision path had **22.1 ms median and 31.5 ms p95** across 816 repeated case evaluations. RGB extraction alone had 14.3 ms median and 20.1 ms p95; the baseline verifier had 0.42 ms median. The optional OpenCV CPU kernel was installed for this run. No GPU or hosted model call was used.

The processed-path timer includes local JSON reads, PNG decoding, primary verification, RGB observation, drive observation and fusion. It excludes the 200 ms observation history, native rendering/acquisition, networking and robot actuation. The p95 is longer than a 20 ms camera frame interval, so this is not a demonstrated real-time control loop or hard-real-time bound. The observer uses an optional CPU package for speed and keeps a NumPy-only fallback; no minimum hardware specification has been established.

The next useful measurement is a hardware-in-the-loop capture with timestamped camera, encoders, motor current and a second view that can see object height and support. Before that, the simulator needs stronger toe-direction and identity cues, explicit bounded-motion claims, and anti-replay provenance. Training a decision model on these labels would not remove those missing observables.

## Reproduce and inspect

- [Interactive case viewer and downloadable inputs](https://dvidia-robot-simulation-lab.static.hf.space/image-goals/v04/index.html)
- [Pinned implementation](https://github.com/Dvidia-Inference/dvidia-training/tree/90e84701ce7d5bc330ef41b02793e2ce037d702d)
- [Full run directory and scored results](https://github.com/Dvidia-Inference/dvidia-training/tree/main/runs/sensor-goal-verifier-v04-final)
- [Protocol and reproduction commands](https://github.com/Dvidia-Inference/dvidia-training/blob/main/docs/sensor-goal-verifier.md)

Source commit `90e84701ce7d5bc330ef41b02793e2ce037d702d` freezes the final seed, eight layouts, 272-case inventory, and three timing repetitions. Every scheduled case and every sensor stream remains in the release. No provider, Jev API, physical robot or learned controller was used. Original DVIDIA code is MIT; the pinned simulator and robot assets retain their upstream terms.
