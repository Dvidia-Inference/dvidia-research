# Skillspace footage training tools

The training product has its own public, MIT-licensed repository:
[DVIDIA Training](https://github.com/Dvidia-Inference/dvidia-training).
The [v0.1.0 alpha release](https://github.com/Dvidia-Inference/dvidia-training/releases/tag/v0.1.0)
includes the installer, source, examples, result archives and checksums.
Start with its [installation guide](https://github.com/Dvidia-Inference/dvidia-training/blob/main/docs/installation.md),
[hardware guidance](https://github.com/Dvidia-Inference/dvidia-training/blob/main/docs/hardware.md)
and [Skillspace format](https://github.com/Dvidia-Inference/dvidia-training/blob/main/docs/skillspace-format.md).

The base package uses NumPy and system FFmpeg/ffprobe on a CPU. MuJoCo is an
optional extra for movement candidates and native simulation. The local studio
provides footage checks, grouped splits, offline fitting and a verified download.
It never turns a visual score into a robot task-success score.

[Download source](release/dvidia-training-v0.1.zip) ·
[Python wheel](release/dvidia_training-0.1.0-py3-none-any.whl) ·
[Visual example Skillspace](visual-skillspace.zip) ·
[Native telemetry example Skillspace](native-skillspace.zip)

The ten visual example videos each last six seconds. They are authored synthetic
moving-disc recordings, with seven training, two development and one test group.
The first learner fits train-only PCA and a ridge next-frame predictor. Held-out
RGB error is 0.000303879 against 0.001771414 persistence error, measured on one
recording and eleven correlated transitions. The [CPU benchmark](cpu-benchmark.json)
records a median 0.5106-second full pipeline run on an Apple M5 host and a
50,462,720-byte Python-process lifetime peak RSS, excluding child decoders.
These measurements do not establish minimum hardware requirements.

The optional native example has ten recorded simulation placement attempts.
Aligned state and authored target labels train the movement head on 4,029
samples, with 1,154 development and 621 test samples from separate recordings.
The [movement report](native-training/movement/report.json) records offline
joint-delta error. The [candidate capsule](native-training/candidate.skill-capsule.json)
is bound to the source archive's exact runtime and still uses authored gripper,
contact, phase and recovery logic plus privileged simulator state.

Its [local qualification](qualification/qualification.json) passed one exact
held-out synthetic scene. An identical arm-target sequence with open jaws failed.
[View the measured replay](qualification/replay.html). This establishes a local
simulation test of this candidate; it supplies no human-video action bridge,
shoe-organizing skill, general robot competence or physical robot qualification.

The [release ledger](release-ledger.json) records scope and the first integration
failure. [Visual result](visual-training/training-result.zip) and
[movement result](native-training/training-result.zip) downloads contain model
data and receipts, excluding original footage. The example Skillspace archives
separately contain the authored recordings and, for the native example, source
telemetry evidence. [Manifest](manifest.json) hashes every published artifact.

For reproduction, install the package and tools, extract one example Skillspace,
and run `dvidia-train run /path/to/extracted-skillspace --output runs/new-run`.
The native branch requires `.[arm]` and
`--task-source /path/to/extracted-skillspace/task.skill.json` to export a capsule.
Use a fresh output directory. See the separate repository's
[native pilot script](https://github.com/Dvidia-Inference/dvidia-training/blob/main/benchmarks/native_pilot.py)
for the complete collect, train, install and local qualification sequence.
