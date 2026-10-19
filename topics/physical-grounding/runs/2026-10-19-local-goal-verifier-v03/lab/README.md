# Local physical-goal verifier v0.3

DVIDIA robotics research · 19 October 2026.

A deterministic CPU verifier checks a trusted placement goal against timestamped observations. It returns complete, incomplete or unknown with per-predicate reasons and uncertainty intervals. The images in this report illustrate native scenes; the verifier does not read pixels or drive actuators.

The fresh cohort retains 200 cases:

| Cohort | Cases | Packet-contract matches | Recognized physical completions | Physical false completions | Abstentions |
| --- | ---: | ---: | ---: | ---: | ---: |
| Fresh native scenes | 64 | 64/64 | 16/16 | 0/48 | 0/64 |
| Injected evidence faults | 128 | 128/128 | 0/128 | Not applicable: 0 negatives | 120/128 |
| Consistent fabricated readings | 8 | 8/8 | Not applicable: 0 positives | 8/8 | 0/8 |

Eight fabricated contact spikes are expected incomplete answers relative to the supplied evidence, but disagree with the unchanged complete physical scene. All eight consistent forgeries are false physical completions even though their packets satisfy the rules. Overall false completion is 8/56 physical negatives. Packet-contract agreement is not perception accuracy.

CPU-only latency across 20,000 repeated calls was 266.583 microseconds median, 318.169 microseconds p95 and 962.875 microseconds maximum. These are repeated microbenchmarks of parsed Python objects, not 20,000 independent scenes. The required 200 ms history, acquisition, inference, parsing, rendering, I/O, network and actuation are excluded. A submillisecond computation does not imply submillisecond physical reaction or hardware qualification.

There are no new Jev calls. The [offline forensic audit](jev-forensics/README.md) documents the original seven misses: three unknown decisions on visible completed scenes, four incorrect incomplete decisions on covered completed scenes. Request hashes, typed output handling and supplied telemetry were correct. The internal model cause remains unknown. Earlier Jev protocol and measured releases remain unchanged.

## Inspect the evidence

Open `index.html` for current/goal images, all three cohorts, every predicate and exact observation-packet links. `cases.json` keeps physical truth separate from expected evidence verdicts. `results.json` contains all 200 results and every timing repetition. No cases or failed readings are omitted.

The original `integrity.json` binds generated inputs before evaluation. `report-integrity.json` binds the viewer. `publication-integrity.json` binds the full public release. Each seal has a separate scope; none replaces another. The source protocol and all 12 source-file hashes are retained in `protocol.json`.

## Run the verifier

Use Python 3.12 or later. The verifier itself uses only the standard library and requires no GPU, API key or network. Install the pinned repository to use its CLI:

```sh
git clone https://github.com/Dvidia-Inference/dvidia-training.git
cd dvidia-training
git checkout 180e26c2d20220869f834355b92e570c142e323f
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -e .
```

The package installation also installs its pinned NumPy dependency; direct `verify_goal` evaluation does not use NumPy. `docs/local-goal-verifier.md` explains the trusted goal and exact observation schema. A stored packet can be checked with `dvidia-local-goal verify --packet observations.json --contract goal.json --now-s 0.6`.

To recompute all saved decisions and scores without MuJoCo or another physics run, execute this from the downloaded release directory after installing the pinned source:

```sh
python - <<'PYTHON'
from hashlib import sha256
import json
from pathlib import Path, PurePosixPath
from dvidia_training.local_goal_verifier import GoalContract, verify_goal
from dvidia_training.local_goal_benchmark import score
root = Path.cwd()
def load(name): return json.loads((root / name).read_text())
for name, expected in load('integrity.json')['files'].items():
    relative = PurePosixPath(name)
    assert not relative.is_absolute() and '..' not in relative.parts
    raw = (root / relative).read_bytes()
    assert len(raw) == expected['bytes']
    assert sha256(raw).hexdigest() == expected['sha256']
cases = load('cases.json')['cases']
results = load('results.json')
rows = {row['case_id']: row for row in results['results']}
assert len(rows) == len(cases) == len(results['results']) == 200
for case in cases:
    actual = verify_goal(load(case['packet_file']),
        contract=GoalContract(**case['contract']), now_s=case['now_s'])
    assert actual == rows[case['id']]['decision']
assert score(results['results'], cases) == results['metrics']
print('200 decisions, sealed inputs and all stored metrics verified')
PYTHON
```

This checks decisions and arithmetic against the recorded timing samples; it does not reproduce elapsed timings or independently validate sensor truth. Native generation requires the project's `.[arm]` extra, pinned PiPER assets and a working graphics context. The source has full generation instructions. Generate into a new directory and retain the new protocol before evaluation; existing results are immutable. One default-seed layout was inspected during early development, so the release does not claim a wholly unseen holdout.

## Viewer quality status

Static checks verified JavaScript syntax, case filters, unique element IDs and local evidence links. Desktop/mobile browser rendering and interactive-control checks remain pending because the browser environment was unavailable while the host was locked. No browser screenshots or visual pass are claimed. The exact status is retained in `ui-qa.json`.

## Licenses and limits

Original DVIDIA code and authored synthetic evidence use MIT (`LICENSE`). The PiPER asset comes from MuJoCo Menagerie revision `0059d4335f8156206f63a35662313385f7ad6d74`; its upstream MIT notice is retained in `licenses/agilex_piper/LICENSE`. Runtime libraries and mesh files are not redistributed here. DVIDIA marks identify the project; the code license grants no trademark rights.

The benchmark uses privileged simulation state for a narrow rigid 30 g shoe proxy. Zero native uncertainty bounds assume exact simulator observations, not noiseless real sensors. Sampled history does not prove continuous-time behavior. Consistent false readings require a separately trusted sensing/provenance path. This release contains no learned policy, trained weights, new Jev inference or real-hardware validation.

[Research](https://research.dvidia.org/papers/local-goal-verifier-v03/) · [Source](https://github.com/Dvidia-Inference/dvidia-training/tree/180e26c2d20220869f834355b92e570c142e323f) · [Hugging Face](https://huggingface.co/spaces/Dvidia/robot-simulation-lab)
