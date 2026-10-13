# DVIDIA skill prerequisites v0.1

Authored PiPER policies in native MuJoCo with synthetic rigid objects and privileged simulator observations. Browser replay uses recorded poses; no learned policy, hardware safety qualification or real-world transfer result.

Open the replay by serving this folder: `python -m http.server 8000`. All visual assets are local. The browser plays recorded native poses; it does not run physics.

Reproduce native experiments using the matching Git source commit, install `.[arm]`, fetch pinned PiPER assets with `dvidia-robot-sim fetch piper --output robot-assets`, then run `dvidia-prerequisites --assets robot-assets --output fresh-results --split heldout`.

DVIDIA code and synthetic objects: MIT. Upstream arm and viewer notices are retained under licenses/ and reference_replay.third-party.txt. Minimum RAM and cross-device throughput are not established.
