# Continuous shoe grip v0.2

[Research paper](../../../../reports/Continuous%20shoe%20grip%20v02.md) · [Recorded 3D comparison](lab/index.html) · [Hugging Face](https://huggingface.co/spaces/Dvidia/robot-simulation-lab) · [Pinned native source](https://github.com/Dvidia-Inference/dvidia-training/tree/af8933994b4626e28a0554abc782ae9d22cff06c)

The unchanged frozen export retains **20 valid attempts** and every full native trace. Both controllers complete 2/10 on the same cases, with no gains or losses. Both enter the retrieval region in 8/10 and defer two insufficient-tool cases. Twelve new lowering responses across six failed grasp cases do not create any additional completion.

- [Protocol](lab/protocol.json), [benchmark index](lab/benchmark.json), [complete file inventory](lab/integrity.json).
- [Timing derivation and failure details](analysis.json).
- [Supplemental regression and development evidence](supplemental/README.md).
- [Outer archive provenance](provenance.json).

`lab/` is an exact, unmodified copy: 87 files, 75,142,307 bytes, from source `af8933994b4626e28a0554abc782ae9d22cff06c`. Its browser renders recorded native motion. For new physics run `dvidia-grip-benchmark` locally from that source, after installing `.[arm]` and provisioning the pinned PiPER assets. The full reproduction instructions are in the paper.

The baseline is v0.1's mounted-rake controller; both sides use identical compiled models. No-tool control results from the earlier study are a different comparison. The final retained-lift predicate independently excludes world, rake and non-finger robot support. A shoe origin height is not its lowest physical point when rotated. Contact thresholds are synthetic conventions, not calibrated force limits.

Original DVIDIA code and scene assets are MIT. PiPER retains its MIT notice, Three.js MIT, MuJoCo Apache-2.0, and IBM Plex Sans SIL OFL 1.1. Original research writing is CC BY 4.0. Notices accompany the sealed export; branding grants no trademark rights. No learned policy or physical qualification is implied.

## Independent audit

The [native audit](audit/native-audit.md), [machine-readable findings](audit/native-audit.json) and [portable audit script](audit/native_audit.py) independently verify full receipts and recorded contact. Nine bilateral-loss alarms take 20–52 ms from the latest uninterrupted native loss segment, median 30 ms; three acquisition failures are separate. Native control packet timing does not measure physical response. The [local release acceptance](audit/acceptance.json) records source tests and browser checks before publication; it does not assert public deployment verification.
