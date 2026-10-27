# PiPER imitation study replay

Recorded synthetic PiPER simulation replay. Native model meshes and saved states reconstructed with mj_forward only; no live physics, robot control, video-derived learning, physical qualification or new performance measurement.

Serve this directory over local HTTP and open index.html. All rendering code, geometry and states are local. Original compressed traces are linked for every report row. Integrity checks establish consistency, not authenticity. Native Float64 reconstruction residuals are recorded in motion.json; rendered body poses use Float32. PiPER model notices are under licenses/agilex_piper. Three.js/OrbitControls notices are in reference_replay.third-party.txt.
