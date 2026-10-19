# Jev image-goal verification: measured follow-up

DVIDIA robotics research · 19 October 2026.

All 64 frozen Jev requests returned valid structured responses, with no retries or omitted trials. There were zero false-completion declarations among 24 physically incomplete cases per input condition. That result must be read beside poor positive recognition: images alone recognized 0/8 physically complete cases, and images plus privileged simulator telemetry recognized 1/8. All four occluded complete fixtures were called incomplete in both conditions.

Observability-aware verdict agreement was 24/32 for images and 25/32 for images plus telemetry; the conditions have different expected labels, so this difference is not a broad accuracy improvement estimate. The RGB evaluator correctly abstained on 8/16 ambiguous cases. Overall online latency was 1.776 s median, 3.287 s p95 and 4.091 s maximum. These are hosted evaluation times, not robot reaction times.

This publication v0.2 is a measured follow-up to the unchanged v0.1 protocol. The original unrun release remains at `image-goals/v01` on Hugging Face. Frozen native fixtures, prompts, conditions, thresholds and scoring are preserved byte-for-byte. There is no learned policy, trained model-weight release or hardware validation.

Open `index.html` to inspect the current/goal images, positive cases, missing targets and every recorded judgment. `results.json` retains all typed outputs, probabilities, semantic request hashes, usage, timing and independently recomputed scores; raw provider response bodies are omitted. `report.json` is a smaller explicit allowlist for the offline viewer. No credential is included. `evaluation-plan.json` and `cases.json` preserve the original protocol and physical/observability references.

`integrity.json` remains the original native fixture inventory. `report-integrity.json` binds the measured viewer. `publication-integrity.json` binds this full public package. No inventory replaces an earlier seal.

The [independent run review](independent-run-review.json) verifies the frozen requests, append-only attempt ledger, stored provider records and metric arithmetic without rerunning the model.

## Reproduce

Use publication source commit `a3e9afb59f3a9cd7da617cf61416e24fad0a0a5c` (also recorded in `provenance.json`) and install Python 3.12+ with the repository's `.[arm]` extra. The native generator, client and evaluator remain frozen at core commit `19acf0734d63ecebc07140c8d84302a54baee4c4`. PiPER assets are fetched once and verified against the asset lock. Native fixture generation and the static viewer run locally; hosted Jev evaluation requires a TypeSafe account, network access and a securely provided credential.

The frozen evaluation command is `python -m dvidia_training.image_goal_benchmark evaluate --fixtures PATH --output NEW_DIRECTORY`. A new run has new latency and possibly different stochastic outputs; it does not replace this evidence. See `docs/image-goal-benchmark.md` in the source for complete setup and limits. Never paste tokens into a report or source file.

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

[Research](https://research.dvidia.org/papers/image-goal-jev-v02/) · [Source](https://github.com/Dvidia-Inference/dvidia-training/tree/a3e9afb59f3a9cd7da617cf61416e24fad0a0a5c) · [Hugging Face](https://huggingface.co/spaces/Dvidia/robot-simulation-lab)
