# Native 3D replay browser checks

Eight browser acceptance groups passed for the v3 replay with zero page errors and zero external requests. The screenshot shows native geometry at a recorded arm-sweep frame, not a photograph or learned task. Desktop, phone and landscape layouts, camera controls, timeline, joint readouts, partial-case selection, visible error handling and uncompressed fallback were checked.

Rendering used Chromium headless with SwiftShader and Playwright 1.64.0. This is a UI acceptance check, not a GPU performance, physical-fidelity or robot-skill benchmark. Source and replay hashes are recorded in source.json.

DVIDIA UI/software: MIT. The rendered UR5e and Robotiq models retain their BSD-3-Clause and BSD-2-Clause notices under ../replay/licenses/. Viewer dependency notices are under ../replay/reference_replay.third-party.txt.
