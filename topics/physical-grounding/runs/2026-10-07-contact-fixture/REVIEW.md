# Independent review of the native CPU fixture

An independent AI-assisted agent reviewed the finalized source, dependency pins, README, three-repeat output and separate offline-check output. No external human review is claimed. This was a read-only semantic review; no simulation was rerun and no benchmark source or output was changed.

The fixture is suitable as a bounded regression and failure-detection foundation. It is not evidence of a completed robot-training product, GPU throughput, calibrated physical contact, deformable accuracy or robot transfer.

## Verified

- The final JSON contains 54 trials and nine passing declared checks. Its recorded source SHA-256 matches the current `bench.py`: `e66cdfcf5fbce9bc20fe83a3b3c48ce9597777a6c03d3fd37c8367962c501394`.
- Recomputed every stored realtime factor as simulated seconds divided by measured wall seconds, and every group median from its trials. All match the JSON. The observed package versions match `requirements.lock.txt`; MuJoCo is 3.15.0.
- Sliding and stopping analytical references are correct for the declared translating block, nominal normal load `mg`, equal static/dynamic Coulomb coefficient and sufficiently long stopping horizon. The ramp's velocity-defined onset is correctly distinguished from an exact static-friction threshold.
- Finest sliding final-velocity error is approximately 0.45%; stopping-distance error is approximately 0.72%. These are endpoint checks under the stated model assumptions, not instantaneous force validation.
- The thin-wall probe distinguishes a sampled compliant contact response from missing the collision entirely. At 10 microseconds the sphere is contacted and does not fully cross. At 5/20 milliseconds it fully crosses with zero sampled contacts. This latter case demonstrates a missed collision query, rather than interpreting every soft penetration as tunneling.
- Block and wall use different explicitly recorded contact coefficients, held fixed within each sweep. Changing the timestep still changes the discrete response. The wall retains approximately 1.679 mm finest sampled penetration and a rebound, both disclosed rather than described as a perfect hard wall.
- All trial finiteness checks now cover every repeat. Three coarse ramp trials capture the textual `Linesearch objective is not convex` warning through the MuJoCo warning callback. The code/README no longer claim that all stress cases are warning-free; finest-trial warning checks are scoped separately.
- Timing includes Python diagnostics. The wall's additional `mj_forward` refresh is disclosed, preventing direct timing comparison with the differently instrumented friction loop. Setup time is recorded separately; measured runtime excludes model setup, settling and report writing. It is not a pure engine-kernel or full-training measurement.
- The separate installed-package offline sweep reports exit zero with no attempted Python socket operations; its denial guard self-test passed. The script exposes no required remote service or credential path. Its stated limitation is accurate: native C networking and an air-gapped dependency installation were not tested.

## Material limits

The finest sliding trial contacts the ground on only 326 of 1,200 sampled steps and reaches a 43.58 N peak normal force against nominal weight 9.81 N. Endpoint agreement therefore does not establish continuous contact, realistic force transients or tactile fidelity. The README now calls out this distinction explicitly.

The declared checks intentionally pass when coarse unsupported regimes are detected. They do not qualify those regimes for use in a product. No general penetration, force-error or physical-transfer tolerance follows from their passing status. Finer sampling can reveal a larger missed peak; decreasing timestep does not guarantee a monotonically decreasing sampled-penetration number.

The version lock records packages, not wheel hashes or a complete cross-platform installation proof. Offline packaging and GPU worker requirements remain separate future gates. There is no production GPU measurement, minimum VRAM result, learned controller, rope/cloth state, tactile observation model or physical calibration in this prototype.

No unresolved blocking defect was found in the finalized fixture within this declared scope. Continue with a calibrated material/contact benchmark and a separately instrumented production-GPU workload before making accuracy or throughput product claims.
