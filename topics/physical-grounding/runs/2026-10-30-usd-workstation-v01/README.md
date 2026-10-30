# DVIDIA USD workstation v0.1

A recorded PiPER workstation and complete passive physics benchmark: 45 valid cases, 36 normal checks and 9 deliberately disabled-physics controls. These are physics checks, not a robot skill success rate.

Serve this folder with `python -m http.server 8000` and open `http://127.0.0.1:8000/`. The browser replays recorded native poses; it does not run physics. See `docs/usd-workstation-v01.md` for source installation, pinned assets and native CLI reproduction. Frozen sources here are evidence snapshots, not a complete Python distribution.

`audit.json` reconstructs all 45 recorded trajectory scores and checks the saved pose/trace/receipt identities. It cannot reconstruct the unrecorded 1 ms goal-monitor interval or authenticate physical truth. `manifest.json` hashes every other public file; the manifest omits itself. The deterministic ZIP lives outside this folder.

Original DVIDIA code and scene: MIT. PiPER simulation assets: MIT. Viewer dependencies retain their notices. No calibrated shoe physics, policy learning or physical-robot readiness is claimed.
