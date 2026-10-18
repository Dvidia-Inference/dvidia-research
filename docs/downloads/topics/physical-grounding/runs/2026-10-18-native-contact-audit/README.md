# Native contact audit — 18 October 2026

This complete diagnostic archive contains fourteen exact replays of previously inspected synthetic episodes: seven controller tapes and seven paired open-jaw controls. It records 249,502 native ticks with unchanged commands, physics, force limits and scoring. Zero new policy trials and no controller promotion are claimed. The model is the simplified rigid-box arm; PiPER shoe studies and physical hardware are separate.

Read the [research paper](https://research.dvidia.org/papers/goal-images-physical-feedback/). The immutable `audit/` bundle contains 59 files totaling 151,876,079 bytes. Every file fits below the static host's per-file limit. We distribute the full extracted evidence without duplicating it as a large combined archive.

## Download all evidence

Download and inspect [download-audit.py](download-audit.py), then run:

```sh
python3 download-audit.py --output native-contact-audit-evidence
```

The downloader uses standard-library Python, pins the integrity inventory, verifies each file's size and SHA-256, and refuses an existing output directory. A failed download leaves a `DOWNLOAD_INCOMPLETE` marker. Retry into another new directory after resolving the failure.

Inventory SHA-256: `dc7b6091b1c680b9479ea65157c7d553043af688e159463db6174696ad5949fa`.

Protocol SHA-256: `f5ded43bc66dd512e223ffea76ad51897ffea15bb016fa2c29dcd1b4fb6601e2`.

## Reproduce locally

Install Python 3.12+ and the pinned implementation:

```sh
git clone https://github.com/Dvidia-Inference/dvidia-training.git
cd dvidia-training
git checkout ff40985ec076eaed8421821b1244217d8502777e
python3 -m venv .venv
.venv/bin/python -m pip install '.[arm]'
```

Then run with the downloaded evidence path:

```sh
.venv/bin/python -m dvidia_training.native_contact_audit \
  --from-audit /absolute/path/to/native-contact-audit-evidence \
  --output runs/native-contact-audit-reproduction
```

The output directory must be new. No original run folders are required. Bundled source snapshots are evidence and are never executed by the loader; the installed implementation must match the frozen source and dependency contract. Exact replay can fail across platforms or dependency changes rather than silently accepting numerical drift.

Downloading requires networking. Replay runs locally on a CPU, with no visual-model or cloud-inference dependency. No GPU was required for this audit. Minimum RAM and latency on other hardware are unmeasured. The recorded primary 54.18-second wall duration includes instrumentation and export, so it is not a pure physics-throughput benchmark.

## Files and scope

- `audit/protocol.json`: frozen attempts, runtime and source hashes, scoring and limitations.
- `audit/inputs/`: all fourteen original compressed input tapes.
- `audit/episodes/`: complete native traces and per-episode receipts.
- `audit/report.json`: every result and measured contact interval.
- `audit/upstream/`: original retention experiment protocols and reports.
- `audit/sources/`: eight exact implementation snapshots.
- `audit/integrity.json`: complete immutable bundle inventory.
- `provenance.json`: publication source and copied-evidence identity.

Stored observations are nominally 50 Hz; the successful scene14 ends with a partial 2 ms interval. The audit records each native 1 ms step and reconstructs the original 100 ms retained-lift dwell without changing it. Simulated micrometre-scale gaps are not calibrated real-world slip or a sufficient causal explanation of failure. Timestep and solver convergence are the next validation step.

Writing is CC BY 4.0 under the research repository license. Original DVIDIA code and synthetic fixtures retain the training repository's MIT license, copied as `LICENSE-CODE`. Dependencies retain their separate terms; no Jev or RoboJEPA model weights or code are included.
