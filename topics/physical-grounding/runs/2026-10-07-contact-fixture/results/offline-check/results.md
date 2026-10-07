# Native CPU contact fixture results

Analytical approximations and timestep failure probes; no physical ground truth, training or transfer claim.
Measured realtime factor includes stepping plus Python observations; excludes model compile/settling/output.

MuJoCo 3.15.0; None; Darwin 26.5.2; Python 3.12.9; repeats=1.

| Fixture | dt (s) | median realtime factor | x error (m) / max penetration (m) | v error (m/s) | onset (N) | crossed | contacts | warnings |
|---|---:|---:|---:|---:|---:|---|---:|---:|
| friction:ramp | 0.00025 | 24.404 | — | — | 5.36638 | — | 1499 | 0 |
| friction:slide | 0.00025 | 59.098 | 2.4045e-05 | 0.00359617 | — | — | 326 | 0 |
| friction:stop | 0.00025 | 25.156 | 0.000183709 | 3.45005e-11 | — | — | 1039 | 0 |
| friction:ramp | 0.001 | 95.425 | — | — | 5.2974 | — | 367 | 0 |
| friction:slide | 0.001 | 231.645 | -0.000133295 | 0.0105657 | — | — | 79 | 0 |
| friction:stop | 0.001 | 106.627 | -0.000110071 | 1.48248e-08 | — | — | 253 | 0 |
| friction:ramp | 0.004 | 290.988 | — | — | 1.61865 | — | 84 | 0 |
| friction:slide | 0.004 | 842.401 | 0.00196668 | -0.0795269 | — | — | 18 | 0 |
| friction:stop | 0.004 | 431.473 | -0.000326977 | 5.15349e-08 | — | — | 57 | 0 |
| friction:ramp | 0.02 | 4560.587 | — | — | 0.367875 | — | 1 | 1 |
| friction:slide | 0.02 | 5820.606 | -0.146585 | -0.0091474 | — | — | 1 | 0 |
| friction:stop | 0.02 | 5638.142 | -0.135744 | -0.500998 | — | — | 1 | 0 |
| thin_wall:impact | 1e-05 | 3.790 | 0.00167919 | — | — | False | 151 | 0 |
| thin_wall:impact | 0.0001 | 29.782 | 0.001 | — | — | False | 11 | 0 |
| thin_wall:impact | 0.0005 | 175.566 | 0.001 | — | — | False | 1 | 0 |
| thin_wall:impact | 0.001 | 356.217 | 0.011 | — | — | False | 1 | 0 |
| thin_wall:impact | 0.005 | 1828.570 | 0 | — | — | True | 0 | 0 |
| thin_wall:impact | 0.02 | 6574.642 | 0 | — | — | True | 0 | 0 |

## Semantic checks

These are declared prototype checks, not universal simulation tolerances.

- PASS: finest sliding velocity within 3%
- PASS: finest stopping distance within 5%
- PASS: finest static onset within 10%
- PASS: finest below-threshold creep below 0.1 mm
- PASS: fine wall reference contacts and does not cross
- PASS: fine wall does not create kinetic energy
- PASS: coarse deliberately unsupported wall case exposes tunneling
- PASS: all sweep trials remain finite
- PASS: finest fixture trials have no engine warnings

## Interpretation

The ramp measures a velocity-defined onset, so onset depends on ramp rate and the 5 mm/s criterion. The block is restricted to translation in x/z. Coulomb comparisons apply to sustained horizontal sliding under gravity, with nominal normal load mg and equal static/dynamic coefficients.

The wall's ideal hard-contact time and stop position are analytical references for geometry. MuJoCo uses compliant regularized contact. Penetration and contact-time deviations are reported rather than hidden. The finest run is a numerical reference, never a physical truth. A coarse step can cross the entire wall between collision queries. The intentionally coarse failure belongs outside a candidate product's declared envelope.

JSON includes solver/contact configuration, hardware/package versions, warnings, contact/energy diagnostics, per-trial timing, and sampled traces. Runtimes are local observations, not an engine ranking. Friction contact counts are steps with contact; wall counts sum detected contacts. Wall timing includes an explicit mj_forward refresh every step in addition to mj_step; timings across different fixtures are therefore not directly comparable.

Engine warning messages: ['Linesearch objective is not convex']
