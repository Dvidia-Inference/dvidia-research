# DVIDIA graspability v0.3

Authored direct in-reach pickup with pinned PiPER drives, rigid object proxies and privileged native observations. Shape, explicit load and mounted-tool conditions are diagnostic controls. No learned skill, tool detachment, retrieval or hardware qualification.

Three rigid shapes, explicit 30 g and 300 g loads, and mounted versus absent rake conditions. Tool-free means absent from reset: no in-flight detachment or retrieval is simulated. A 30 g shoe-shaped control is not a physical shoe mass measurement.

All attempts and dense contact traces are retained, including failures. The independent score requires 500 ms continuous bilateral finger contact, object-origin rise >=35 mm from the initial verified settled state, and no world, rake or non-finger robot support.

Serve this folder using `python -m http.server 8000`. Browser visualization replays recorded poses; fresh physics runs through Python.

Reproduce from the exact source commit, install `.[arm]`, fetch assets using `dvidia-robot-sim fetch piper --output robot-assets`, then run `dvidia-graspability-benchmark --assets robot-assets --output fresh-results --split heldout`.

Pinned model gains are not measured hardware calibration. Collision geometry is a rigid approximation. CPU-only native benchmark; WebGL2 replay. Minimum RAM and real robot transfer are not established.

DVIDIA code and original synthetic object primitives: MIT. Robot, Three.js and font notices retained. No trademark rights are granted.
