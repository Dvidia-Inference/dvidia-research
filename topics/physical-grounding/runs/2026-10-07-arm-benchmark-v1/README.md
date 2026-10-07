# DVIDIA Skillspace arm benchmark release v0.3

This source release includes the local CPU arm lab, a proposed future release inspector, frozen controller snapshots and a one-time paired benchmark. It is simulation-only, uses privileged state and an authored rigid-box controller, and contains no learned robot policy or physical qualification. Nominal held-out results are 24/24 for both; actuator stress is 6/8 baseline and 5/8 updated. Instrumented observed throughput is 12.28x baseline and 11.39x updated; no overall improvement is established.

The older v0 research release remains unchanged. `benchmark/assessment.json`, `benchmark/protocol.json`, and per-version receipts contain scores and their scope. `benchmark/heldout-started.json` prevents retuning or overwriting that sealed comparison. `native-offline/` repeats three known layouts under explicit macOS network denial. `demo/` contains the actual browser-run narrow 80 g box with exact source and grounding plus full commands/states and standalone replay.

Use Python 3.12+ with pinned MuJoCo 3.15.0 and NumPy 2.5.3. Install dependencies once: `python -m pip install -r requirements.lock.txt`. For disconnected machines, pre-stage compatible wheels and use `--no-index --find-links`; that wheel-install workflow and other OSes are unqualified. The archive contains source, not wheels.

Run the local lab with `python -m simlab.studio --offline --port 8240`. Open the printed loopback URL, click Install bundled source, set a scene, and Run installed skill. Receipt schema 2 binds executable source and native dependency versions. Existing receipts need reinstallation if the runtime changes. See PRODUCT.md for input domains and limits.

Inspect a proposed future contract: `python -m simlab.skill_release examples/skill_release_v1.json --artifact-root .`. Draft inspection never returns simulation or hardware readiness.

Repeat an individual frozen development case without altering stored evidence:

```python
from simlab.arm_benchmark import load_snapshot, read_protocol, run_case
env, policy, snapshot = load_snapshot('benchmark', 'final')
case = read_protocol('benchmark')['dev'][10]
record, _ = run_case(case, env, policy)
print(record['success'], record['final_info']['target_distance'])
```

`release/manifest.json` records SHA256 for all included files. These hashes establish byte consistency, not publisher authenticity, experiment truth, material calibration or hardware competence. Full regression command: `python -m unittest discover -s tests -q`; it includes localhost HTTP tests and native physics.
