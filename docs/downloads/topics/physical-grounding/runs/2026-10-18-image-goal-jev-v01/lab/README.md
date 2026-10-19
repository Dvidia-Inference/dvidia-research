# Image-goal verification: native benchmark and Jev protocol

DVIDIA robotics research · 18 October 2026.

**Jev has not been run.** No TypeSafe credential was available for this execution. All 64 planned provider trials remain `not_run`; model accuracy, false-completion rates, service latency and costs are unmeasured. The report does not turn unavailable inference into zero-error results.

The completed local work generates 32 native PiPER scene fixtures: eight conditions across four deterministic layouts. Four moving/settled pairs have identical images and different physical completion labels. This is a controlled observation diagnostic, not a learned policy or hardware test. The rigid shoe proxy is deliberately narrow (half width) and 30 g; it is not a full-size calibrated shoe.

Open `index.html` to compare current/goal images and all case labels offline. `cases.json` preserves privileged physical truth and the declared expected judgment for each input condition. `states/` preserves every authored state, measured native history and physical reference. `evaluation-plan.json` freezes 64 semantic requests, prompt/source/image hashes, scoring and no-retry rules before provider use. `results.json` preserves the explicit unrun rows while omitting raw provider response fields.

`integrity.json` is the original unmodified native fixture inventory. `report-integrity.json` binds the offline viewer. `publication-integrity.json` binds the complete public package. These are distinct seals; none replaces an earlier inventory.

## Reproduce

Clone Dvidia-Inference/dvidia-training and check out publication commit `3d3c8f660f6f9544d6a58c654bab143dd1eddc00`. The native generator and evaluator remain frozen at core commit `19acf0734d63ecebc07140c8d84302a54baee4c4`; the later commit adds the viewer, publisher and independent verifier. Install Python 3.12+ and the repository's `.[arm]` extra. The PiPER model assets are fetched once by the existing robot profile setup and verified against the asset lock. Native simulation and viewer rendering then run locally. See `docs/image-goal-benchmark.md` in the source for complete commands, secure credential setup, model version and limits.

The passive evaluator can be run with `python -m dvidia_training.image_goal_benchmark evaluate --fixtures PATH --output NEW_DIRECTORY`. It reads `TYPESAFE_API_KEY` or an explicitly named Keychain entry; never paste a token into a public report or source file. Hosted Jev requires network access and a TypeSafe account. The supplied benchmark data and static viewer run without a credential. This publication contains no model weights.

## Independently check the native evidence

`native-validation.json` records the completed independent audit of all 32 physical labels and full-window telemetry extrema. `verify-image-goal-fixtures.py` recomputes those values from the saved native records; it does not call Jev, render images, or run a new physical simulation. Its source hash is recorded in both the audit and publication provenance.

After installing the pinned source above, extract only the original sealed fixture files to a fresh directory. From this downloaded package directory:

```sh
python - <<'PYTHON'
import hashlib, json
from pathlib import Path, PurePosixPath
source = Path.cwd()
destination = source.parent / "image-goal-native-fixtures"
destination.mkdir(exist_ok=False)
inventory = json.loads((source / "integrity.json").read_text())
for item in inventory["files"]:
    relative = PurePosixPath(item["path"])
    assert not relative.is_absolute() and ".." not in relative.parts
    data = (source / relative).read_bytes()
    assert len(data) == item["bytes"]
    assert hashlib.sha256(data).hexdigest() == item["sha256"]
    target = destination / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
for name in ("integrity.json", "evaluation-plan.json"):
    (destination / name).write_bytes((source / name).read_bytes())
PYTHON
python verify-image-goal-fixtures.py --fixtures ../image-goal-native-fixtures --output ../native-validation-reproduced.json
```

The verifier intentionally rejects extra files inside the native fixture directory. Keeping the report and its publication metadata outside that directory preserves the original manifest boundary. Expected result: 32 checked cases, 8 physically complete, 24 incomplete, 67 original files verified. Host metadata in a reproduction can differ.

## Licenses and scope

Original DVIDIA code and authored synthetic fixture records: MIT (`LICENSE`). The PiPER simulation asset is from MuJoCo Menagerie commit `0059d4335f8156206f63a35662313385f7ad6d74`; its MIT notice is preserved in `licenses/agilex_piper/LICENSE`. No MuJoCo runtime or upstream mesh files are redistributed in this viewer. DVIDIA marks are brand identifiers; the code license grants no trademark rights.

Jev is TypeSafe's hosted model and retains its own service terms. Its output is evaluated, not used to train or distill a DVIDIA policy. The two model-input conditions are RGB images alone and RGB plus privileged simulator measurements. The latter supplies object identity/presence, pose errors and complete native-window extrema; it is not a demonstrated real-camera or contact estimator. There is no direct motor-control path.

[Research](https://research.dvidia.org/papers/image-goal-jev-v01/) · [Source](https://github.com/Dvidia-Inference/dvidia-training/tree/19acf0734d63ecebc07140c8d84302a54baee4c4) · [Hugging Face](https://huggingface.co/spaces/Dvidia/robot-simulation-lab)
