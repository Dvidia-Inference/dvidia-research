# PiPER contact pilot — summary-only research mirror

This mirror preserves the exact report, protocol and original integrity bytes
from the nine-attempt confirmation run, seed 642103. It is **not a standalone
complete benchmark bundle**. Raw attempts, the HTML report and original model
notices remain in the [full Hugging Face bundle](https://huggingface.co/spaces/Dvidia/robot-simulation-lab/tree/b07b6e0e95a19158384734d140abb36a9adb670b/tasks/piper).
The integrity file describes that full bundle, including files absent here;
run the offline inspector against a complete download.

- [Summary and runtime measurements](report.json)
- [Frozen synthetic scene/control protocol](protocol.json)
- [Original complete-bundle integrity manifest](integrity.json)
- [Complete HTML report](https://huggingface.co/spaces/Dvidia/robot-simulation-lab/resolve/b07b6e0e95a19158384734d140abb36a9adb670b/tasks/piper/report.html)
- [Versioned source and local installation](https://github.com/Dvidia-Inference/dvidia-training/blob/c9a72584b4f35c38ad2616894f56da719bba0182/docs/piper-contact-pilot.md)

All nine attempts are numerically valid: nominal placement 2/2, low-friction
placement 0/1, open-jaw 0/3 and hold 0/3. Every attempt retains 20 simulated
seconds, 1,000 commands and 1,001 recorded states in the full bundle. One of
9,000 measured computation windows exceeded 20 ms; real-time physical response
is not established.

The task uses an authored controller and privileged native state. These are
synthetic rigid-block scenes, with no learned skill, camera sensing, shoe
physics, calibrated contact or physical robot qualification. Earlier source-
snapshotted development attempts informed the controller and remain separate
from this confirmation denominator. The original PiPER model uses MIT licensing;
its notices are preserved in the full bundle. Hash consistency is not publisher
authentication or recomputation of native physics.
