# DVIDIA native block-task replay

Recorded authored, privileged-state rigid-block contact simulation. Native arm, gripper, table and free-object geometry reconstructed from full recorded qpos with mj_forward only. Success and failure labels are copied from the sealed benchmark; the viewer does not recompute them. No live physics, learned policy, shoe physics or physical robot qualification.

Targets are issued at the recorded observation boundary. At the terminal row, the viewer carries forward the last issued target for reference; no new terminal command is invented. Targets are requested controller commands, not measured joint torque or fingertip force.

Serve this directory with a local static HTTP server. All viewer code, native geometry, recorded motion, receipts and licensing notices are local. Replay selection is an excerpt; the complete planned denominator and every raw attempt remain under receipt/. Artifact hashes show consistency, not authenticity or physical qualification. Float64 reconstruction is checked before Float32 poses are written.

DVIDIA exporter/viewer: MIT. UR5e: BSD-3-Clause. Robotiq2F-85: BSD-2-Clause. Native model notices and READMEs are retained under licenses/. Bundled viewer dependency notices: reference_replay.third-party.txt.
