# DVIDIA live shoe workstation v0.1

Live native PiPER position tracking with authored IK, pinned upstream mechanics and a free synthetic rigid shoe. No learned shoe manipulation policy, calibrated shoe contact, deformation or hardware qualification.

Serve this folder with `python -m http.server 8000` and open http://localhost:8000. It runs MuJoCo physics in a browser worker. JavaScript, WebAssembly, WebGL2 and DecompressionStream are required. No model download, remote inference or GPU training is needed; physics runs locally on the CPU and rendering uses WebGL. Browser performance depends on the machine. All assets and runtime files are included.

For faster startup, native-assets.bin.gz delivers the original mesh bytes in one compressed request. Each unpacked mesh is checked against its original SHA-256. The raw assets remain included for independent reproduction.

Native PiPER meshes and MIT notices are pinned to the upstream commit in workstation.json. The rigid procedural shoe is MIT, with assumed untested physical properties in catalog.json. The controller is authored differential IK, not a learned policy. The jaw can make physical contacts; retained shoe lifting is not qualified. MuJoCo and Three.js notices are in workstation.third-party.txt. Integrity hashes check file consistency, not authenticity.
