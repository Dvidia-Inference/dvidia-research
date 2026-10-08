# Learned movement-head experiment v1

This is a separate simulation-only teacher-to-student acquisition experiment. It preserves all historical v0.3 evidence. The learned NumPy RBF head replaces differential IK; waypoint, phase/contact/gripper and recovery supervision remain authored. There is no teacher IK fallback, learned vision or hardware qualification.

`protocol.json` declares 16 training development scenes, four separate development selection scenes and eight separate evaluation scenes. `dataset.json` stores 6,344 teacher-supervised rows, including explicit same-state goal augmentation. `collection.json`, `training.json`, and `model.json` bind collection and learned weights. The 34,171-byte canonical model uses JSON numeric arrays, not pickle or code.

The first fit passed 4/4 development selection cases. Frozen evaluation produced teacher 7/8 and student 7/8: both 6/6 nominal and 1/2 actuator stress, with the same insufficient-static-grip-force failure. No tuning followed evaluation. `evaluation-started.json` seals the experiment; the CLI refuses to repeat or retune it in this directory. This experiment did not run recorded-arm/open-jaw controls, so current-runtime capsule qualification is additional evidence.

`evaluate.json` contains full native outcome and per-phase timing receipts. `profiling.json` aggregates the measured scope. The student head's own-trajectory mean call cost was 35.43 microseconds versus 56.29 for teacher IK, but episode wall time increased from 6.273 to 6.360 seconds. Native stepping/observations dominated; no end-to-end speedup is established. There was one CPU world and one run per controller/scene, without a repeated order/thermal-controlled timing campaign.

`bindings.json` separates canonical document identities from exact file-byte SHA256 values. `collection-source/arm_distill.py` preserves the exact collector version; `frozen-sources/` preserves the measured experiment's core source files. The complete source package also supplies their normal `simlab` imports and pinned dependencies. Do not change this directory's frozen results for a future model experiment.

API: `validate_model(document)`, `collect(cases)`, `train(dataset)` and `DistilledPlacementPolicy(env, model)` live in `simlab.arm_distill`. Create a new policy instance for each episode. Imported models remain candidates until the local capsule path validates the current runtime and exact scene with native execution and negative control. The model's imported numeric envelope also needs the capsule boundary's additional protection against float32 overflow.

Run dedicated non-native unit checks with `python -m unittest tests.test_arm_distill -q`. To start a future study, choose a new output directory and freshly declared protocol; do not reuse these evaluation cases as an unseen test.
