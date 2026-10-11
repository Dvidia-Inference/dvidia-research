# PiPER grip validation and recovery — complete confirmation receipt

The `receipt/` directory is a **complete, byte-identical 36-file benchmark bundle**,
including the original protocol, report, HTML report, 30 compressed attempts,
integrity manifest and upstream MIT model notices. Seed **731209** is the frozen
confirmation cohort. The sibling execution record was captured by the installed-
command wrapper and sits **outside the original bundle seal**.

- [Readable complete comparison](receipt/report.html)
- [All outcomes, decisions, motion and timing](receipt/report.json)
- [Frozen six-scene, thirty-attempt protocol](receipt/protocol.json)
- [Stored and decoded byte integrity](receipt/integrity.json)
- [Original MIT simulation-model license](receipt/licenses/agilex_piper/LICENSE)
- [Installed-command execution boundary](execution.json)
- [Pinned source and offline inspection guide](https://github.com/Dvidia-Inference/dvidia-training/blob/3ee94706f436690c6d1d8554eda9202d23620e3c/docs/piper-grip-recovery.md)
- [Full hosted bundle](https://huggingface.co/spaces/Dvidia/robot-simulation-lab/tree/bf64e4c3592058d3cf30616f0202e7ffc6cc2b4e/tasks/piper-grip)

**Completion regresses at moderate friction: baseline 2/2, guarded 0/2.**
Normal-friction placements both complete 2/2; low-friction placements both
complete 0/2. All 18 negative controls fail. All 30 attempts remain numerically
valid and retain 20 simulated seconds, 1,000 commands and 1,001 states each.
No successful recovery or overall completion improvement is demonstrated.
Four guarded qualification decisions have a later following window; two still
end in failed tasks. This is not detector accuracy or physical reliability.

For a complete download, preserve all paths inside `receipt/` and pass that
folder to the pinned `dvidia-piper-grip inspect` CLI. No extraction is required:
the inspector verifies stored gzip bytes and bounded decoded JSON against the
original seal. The seal-listed files total 18,727,085 stored bytes and
100,403,752 bytes with the attempt JSON decoded. Writing in this wrapper follows
the research repository's CC BY 4.0; DVIDIA tooling and the preserved model
notices retain their original MIT terms.

Synthetic rigid blocks and privileged simulator state do not establish a
learned skill, camera perception, shoe physics, calibrated contact or physical
robot qualification. Earlier development trials informed implementation and
remain separate from this confirmation denominator. Hashes establish recorded
consistency, not publisher authentication or independent physics recomputation.
