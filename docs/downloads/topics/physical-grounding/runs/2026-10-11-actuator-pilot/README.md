# Compact CPU actuator pilot, 11 October 2026

[Open the interactive report](report.html). This exact simulation receipt and
original MIT model bundle comes from DVIDIA Training's
[measured source commit](https://github.com/Dvidia-Inference/dvidia-training/tree/0d3f05f186423e18b15ed8362d772b7d74ec0207).
The [complete benchmark](https://github.com/Dvidia-Inference/dvidia-training/blob/0d3f05f186423e18b15ed8362d772b7d74ec0207/benchmarks/actuator-pilot-20261011/README.md)
records baselines, denominators, transient failures and timing boundaries.

All six JSON receipt/model files are exact final-run bytes. `source.json` is a
post-run source reference, and `report.html` is a self-contained reader of the
exact receipt. The source corpus manifest retains relative native tape paths
and hashes; tapes are omitted. No footage, credentials or third-party weights
are distributed here.

With the candidate source installed, `dvidia-transition inspect DIRECTORY`
checks the five bound artifacts against `integrity.json`. This verifies internal
consistency only, not source authenticity or physical accuracy. Original
DVIDIA coefficients and evidence use the supplied [MIT license](LICENSE).

The predictor estimates the next 20 ms of joint/jaw motion from native state
and issued commands. It issues no commands, predicts no task success and is
unqualified for physical robots. Shoe data, shoe physics and a hardware adapter
remain open. Model-only compute timing excludes sensing and actuation.
