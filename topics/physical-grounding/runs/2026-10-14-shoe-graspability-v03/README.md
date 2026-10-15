# Shoe graspability v0.3: complete recorded evidence

Frozen source [`73057dc259c6a19344906f4a43a283553e17ade0`](https://github.com/Dvidia-Inference/dvidia-training/tree/73057dc259c6a19344906f4a43a283553e17ade0).

All 24 native attempts are valid. Lightweight 30 g controls retain 8/12 lifts; 300 g controls retain 0/12, including the block. Removing the rake gains one narrow-shoe case and loses one block case. The current rigid shoe retains 1/2 lightweight cases under each tool condition. Both retained shoe cases also exceed nominal 70 mm jaw span under the model's compliant joint limits; the frozen retention scores remain unchanged and physical aperture is unvalidated.

[Recorded 3D comparison](lab/index.html), [all-attempt index](lab/benchmark.json), [protocol](lab/protocol.json), [sealed export inventory](lab/integrity.json), [derived measurements](analysis.json), [independent native audit](audit/native-audit.json), [jaw-limit diagnostic](audit/jaw-limit-audit.json), [release acceptance](audit/acceptance.json), [browser checks](audit/browser-qa.json).

The `lab` folder is an unchanged copy of the 107-file, 55,750,637-byte frozen export. Every native trace remains in its full trial JSON. The audit recomputes scores and compiles models without taking physics steps. Audit scripts are included; execute them from a source checkout with the pinned assets and explicit --repository, --assets, --export and --output arguments. The analysis and audit are outside the sealed lab folder and have their own records in `provenance.json`.

The factors are rigid shape, assumed mass, attached-tool presence and paired layout/friction. Object and tool model hashes deliberately differ; the robot actuator fingerprint is shared. One authored policy uses fixed shape-specific grasp offsets. The tool starts absent in the tool-free control: no autonomous detachment, retrieval, learned skill or hardware qualification is demonstrated. A 30 g shoe-shaped control is not a measured shoe mass. CPU-native physics and WebGL2 replay are distinct.

Original code and synthetic geometry: MIT. Original writing: CC BY 4.0. Upstream robot, Three.js and font notices remain in `lab/licenses` and third-party files. No trademark rights granted.
