# Skill prerequisites v0.1: frozen native evidence

[Research paper](../../../../reports/Skill%20prerequisites%20v01.md) ·
[Explore recorded attempts](lab/index.html) ·
[Hugging Face laboratory](https://huggingface.co/spaces/Dvidia/robot-simulation-lab) ·
[Source revision](https://github.com/Dvidia-Inference/dvidia-training/tree/756306a2beda60ac54567971626080a56227e781)

The lab contains the sole frozen held-out run: sixteen planned attempts and
sixteen numerically valid results. Hinged access completes 2/4 under either
policy; guarded control avoids the two baseline lid collisions and stops for
help in those cases. The mounted rake reaches the intermediate retrieval check
in 3/4 conditions, but no retained lift succeeds. The short-tool condition is
deferred. These are authored policies with privileged simulator observations,
synthetic mechanics and no physical robot qualification.

## Frozen files

- [protocol.json](lab/protocol.json): scenario matrix, source hashes and scope.
- [benchmark.json](lab/benchmark.json): all sixteen outcomes and replay links.
- [integrity.json](lab/integrity.json): the exact exported file inventory.
- [analysis.json](analysis.json): timing totals derived from the frozen receipt
  plus the measured host configuration.
- [development/](development/README.md): separate tuning summaries and final
  development index, including failed lift criteria.
- [provenance.json](provenance.json): the complete research-archive inventory.

Each trial has complete JSON with its 2 ms native trace, plus 3D model and motion
metadata. The lightweight index omits only the dense trace. The browser replays
recorded native body poses; it does not run physics. Every file in `lab/` is
copied byte-for-byte from the frozen export, including its original seal.

The shoe coordinate reported as height is the authored sole-bottom frame. It is
not a geometric minimum under arbitrary rotation. Final lift qualification
also requires bilateral finger contact and excludes support by the tool or
world throughout the final 500 ms. A prior successful height or contact window
does not pass that final criterion.

Native execution totals 108.4 simulated seconds in 5.4958 measured wall seconds
on the tested Apple M5 host. That timer includes construction, initialization,
control, physics and recording. The separate replay export takes 12.9695 seconds.
These are shared-host measurements, not hardware minima or a real-time guarantee.
All observed hinge hazards start at simulation time zero; zero first-command
latency therefore describes a startup decision rather than sudden-hazard sensing.

## Reproduce

Use the exact source above and follow its
[local installation guide](https://github.com/Dvidia-Inference/dvidia-training/blob/756306a2beda60ac54567971626080a56227e781/docs/prerequisite-simulations.md).
The native CLI can run either environment separately or reproduce both. Local
replay serving needs Python and WebGL2. Native simulation needs the optional
MuJoCo dependency and provisioned PiPER assets; it does not need a discrete GPU.

DVIDIA code and original synthetic assets are MIT. The PiPER simulation model
retains its upstream MIT license. MuJoCo is Apache-2.0; Three.js is MIT; IBM Plex
Sans is SIL OFL 1.1. Notices remain in the export and embedded HTML. Research
writing outside the code export is CC BY 4.0. Hashes establish consistency, not
physical validity or publisher authenticity.
