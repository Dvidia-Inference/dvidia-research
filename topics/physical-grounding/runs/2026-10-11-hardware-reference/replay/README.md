# DVIDIA native reference replay

Recorded authored simulation from the frozen reference receipt. Native mesh geometry and recorded joint/linkage positions, reconstructed with mj_forward only. No live physics, robot control, task policy, physical accuracy or new speed measurement.

Serve this directory with a local static HTTP server and open index.html. All geometry, motion, viewer code, receipts and license notices are local. Receipt hashes establish consistency, not authenticity. The viewer uses Float32 body poses; receipt reconstruction checks used native Float64.

DVIDIA exporter/viewer code: MIT. UR5e model: BSD-3-Clause. Robotiq 2F-85 model: BSD-2-Clause. Original model notices and READMEs are under licenses/. Viewer dependencies are listed in reference_replay.third-party.txt.
