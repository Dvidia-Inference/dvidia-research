# Skill capsules in v0.4

A capsule carries task source, authored grounding, a learned NumPy movement head, compatibility declarations and an exact local runtime binding. Import creates a simulation-only candidate. Native qualification can enable that candidate for one exact scene; changing the scene or runtime requires qualification again.

The learned head predicts incremental joint targets from joints, Cartesian pose error and object/target positions relative to the tool. Waypoints, task phases, contact checks, gripper commands and recovery remain authored. Observations are privileged MuJoCo state. This release does not learn from uploaded videos or qualify physical hardware.

## Install dependencies and try the candidate

Run from the extracted source directory with Python 3.12+. Install the pinned dependencies once:

```sh
python -m pip install -r requirements.lock.txt
python -m simlab.studio --offline --port 8240
```

Open the printed loopback URL and choose **Load distilled skill capsule · offline**, or drop `simlab/placement_candidate.skill.json`. The browser checks compatibility and automatically attempts native scene qualification. **Run** becomes available only after placement succeeds and the recorded-arm/open-jaw control fails to complete the task. The feedback panel and downloadable receipt expose the native result.

For the CLI, import the same candidate and copy the returned installation ID:

```sh
python -m simlab.capsule_installer install simlab/placement_candidate.skill.json
python -m simlab.capsule_installer qualify INSTALLATION_ID --output runs/my-qualification
python -m simlab.capsule_installer run INSTALLATION_ID --output runs/my-execution
```

Both `qualify` and `run` accept `--directory` (default `runs/capsule-installs`) and `--scene scene.json`. Omitting `--scene` selects the default scene. Inspect the printed qualification status: only `validated_simulation_scene` enables execution. A failed qualification remains a candidate even if the command saved diagnostic files.

An explicit default scene file uses full box dimensions in metres, mass in kilograms, jaw force in newtons and joint torque in newton-metres:

```json
{
  "object_position": [0.42, -0.04, 0.31],
  "target_position": [0.54, 0.10, 0.31],
  "object_size": [0.04, 0.04, 0.04],
  "object_mass": 0.04,
  "object_friction": 0.8,
  "jaw_force_limit": 15,
  "joint_torque_limit": 40,
  "seed": 0
}
```

Use the same scene file for qualification and execution. Every normalized input, including seed, participates in the scene binding. A different seed with zero scene jitter does not establish a new layout.

## Author supervision, fit a head and build a capsule

`arm_distill` provides `protocol`, `collect`, `train`, `selection` and `evaluate`. The `protocol` command generates the original fixed template, so running it in another directory reproduces known cases. For a new experiment, author a distinct seeded protocol before observing evaluation outcomes:

```sh
python - <<'PY'
from pathlib import Path
from simlab.arm_distill import canonical, make_protocol
root = Path('runs/my-head')
root.mkdir(parents=True, exist_ok=True)
path = root / 'protocol.json'
if path.exists():
    raise ValueError('Choose a new experiment directory.')
path.write_bytes(canonical(make_protocol(seed=804213)) + b'\n')
PY
python -m simlab.arm_distill collect --output runs/my-head
python -m simlab.arm_distill train --output runs/my-head --centers 32 --regularization 0.00001
python -m simlab.arm_distill selection --output runs/my-head
python -m simlab.arm_distill evaluate --output runs/my-head
python -m simlab.capsule_installer build --model runs/my-head/model.json --output runs/my-head/candidate.skill.json
python -m simlab.capsule_installer install runs/my-head/candidate.skill.json
```

Collection records teacher movement targets on the declared training scenes and explicitly labels same-state Cartesian-goal augmentation. `train` fits normalized RBF ridge weights. Use only development selection to choose settings, then freeze before the one-time evaluation. Evaluation seals this output directory; subsequent training or evaluation there is rejected. Future experiments need new development and evaluation scenes.

`build` also accepts `--source task.json` and `--grounding grounding.json`. The default source is bundled `place_cup` metadata; a source without inline grounding receives the explicit local authored adapter if `--grounding` is omitted. Inline grounding is preserved. The capsule preserves exact task-source bytes separately from numeric model data. Its default embedded evaluation is absent: ship the actual experiment protocol and receipts alongside it, and perform current-runtime scene qualification after import.

## Evidence and execution boundary

The frozen study in `benchmark/` used 16 training scenes and 6,344 teacher-supervised rows, with a 34,171-byte canonical model. Teacher and student both passed 4/4 development selection cases. On eight separate evaluation scenes, both passed 7/8: six nominal successes and one of two actuator-stress successes, with the same insufficient-grip-force failure. No teacher IK fallback was used.

The student's observed mean movement computation was 35.43 microseconds versus 56.29 for teacher IK on their own trajectories. Episode wall time increased from 6.273 to 6.360 seconds. Native stepping and observations dominated; no end-to-end speedup is established. `protocol.json`, `evaluate.json`, `profiling.json` and `bindings.json` retain the scope and hashes. Historical v0.3 results remain unchanged.

Import accepts bounded JSON data, validates model/profile compatibility and binds ten runtime source files plus MuJoCo/NumPy versions. It does not execute uploaded Python or pickle. Hashes establish consistency, not publisher identity or experimental truth. Restart the lab after source edits; build/import against the new runtime and qualify again. Installed receipts preserve source/model evidence rather than silently upgrading an old candidate.

The supported scene is an upright-tool, axis-aligned rigid-box proxy with native jaw/object/table contacts. Arm-link and palm collisions are excluded. Cup handles, obstacles, perception, deformables, arbitrary orientations and other embodiments require additional implementations and evidence. The unchanged success gate checks retained lift, release, clearance, table support and settled target dwell.

Collection and native execution use the Python network guard after dependencies are imported; there is no hosted inference. Offline dependency installation requires pre-staged compatible wheels, for example `python -m pip install --no-index --find-links wheelhouse -r requirements.lock.txt`. That wheel-install workflow and other platforms are not qualified by the recorded macOS CPU runs. A scene receipt covers its known simulated scene and current runtime.
