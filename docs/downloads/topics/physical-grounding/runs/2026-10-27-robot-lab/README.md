# Photo, outcome and compatible robot skills

Publication date: 27 October 2026. Runtime receipt: 26 October 2026.

This archive supports [Chat to compatible robot skills](../../../../reports/Chat%20to%20compatible%20robot%20skills.md).
It contains real local runtime checks and an actual simulator reset, with no
learned policy rollout or steering result.

- [Runtime receipt](runtime-receipt.json): sanitized dependency versions,
  upstream source revisions, detector outputs, task/seed, reset digest and
  original worker source digests.
- [Example v1 skill manifest](skill-manifest.example.json): current catalog fields
  for task 5, marked unavailable until an actual runtime checks compatibility.
  It bundles no policy and is not an installation.
- [Native task-5 reset camera](libero-task5-reset.png): 256 × 256 image rendered
  after ten no-op settling steps, before any learned action.

The receipt is copied byte-for-byte from the app's original engineering evidence.
Its source digests describe that snapshot, not later installer or interface
revisions. The separate test fixtures recorded in it are explicitly synthetic;
the detector inference and simulator reset are actual runtime observations.
No private capability, photo payload or account credential is included.

## Reproduction boundary

The public upstream sources are pinned as follows:

| Artifact | Revision |
| --- | --- |
| OpenVLA source | `c8f03f48af692657d3060c19588038c7220e9af9` |
| LIBERO source | `8f1084e3132a39270c3a13ebe37270a43ece2a01` |
| `openvla/openvla-7b-finetuned-libero-10` | `80970322773f81baa2e22fe495d0487b93a05cfa` |

The model revision identifies the intended checkpoint; its weights were not
installed for this receipt. The interrupted transfer retained an 8 MiB partial
file and no activation marker. Only the task-5 study/book/caddy asset closure
was fetched. A complete standalone worker release is separate from this
documentation archive; these two evidence files are not an installable skill.

The reset uses task order index 0, LIBERO-10 task index 5 and seed 7. It performs
ten no-op settling steps and hashes the flattened simulator state. The worker
thread and independent main-thread run produced the same digest:

```text
b133849e34e709aaecf9f42e1a281d9dc53dfeeebf01d5e41077914b8d12893e
```

Apple MPS availability does not prove the full model fits or executes correctly.
The camera is simulation evidence, not physical hardware evidence. All upstream
model, simulator and asset terms remain applicable.

## Hugging Face publication

[Publication receipt](huggingface-publication.json) records the documentation-only
commit, exact file hashes and anonymous readback. The update preserves all 3,771
pre-existing files except the root card, which receives one additional concept
section. It adds no model weights, live inference endpoint or hardware control.
