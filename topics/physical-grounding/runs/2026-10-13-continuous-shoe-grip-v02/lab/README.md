# DVIDIA continuous shoe grip v0.2

Authored PiPER policies in native MuJoCo with synthetic rigid objects and privileged simulator observations. Browser replay uses recorded poses; no learned policy, hardware safety qualification or real-world transfer result.

Paired authored controllers use identical mounted-rake models. The v0.1 baseline is the original tool-enabled recovery controller, not the earlier no-tool capability control.

Serve this export: `python -m http.server 8000`. Browser visualization replays recorded native poses.

Reproduce using the exact source commit, install `.[arm]`, fetch PiPER assets with `dvidia-robot-sim fetch piper --output robot-assets`, then `dvidia-grip-benchmark --assets robot-assets --output fresh-results --split heldout`.

All attempts are retained. Native retention is independently checked from dense contact traces. Privileged simulator observations, rigid synthetic shoes, and assumed contact properties limit transfer claims.

DVIDIA code and synthetic objects: MIT. Upstream robot, Three.js and font notices are retained. Branding does not grant trademark rights. CPU benchmark; WebGL2 replay. Minimum RAM is not established.
