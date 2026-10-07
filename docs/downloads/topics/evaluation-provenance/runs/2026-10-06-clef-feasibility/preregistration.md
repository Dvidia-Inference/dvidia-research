# Preregistered hosted temporal-vision engineering pilot

Registered before model calls or frame inspection. Date: 2026-10-06.

Fixed sample: five existing public/ego/sources/{onion,melon,shirt,jeans,pack}.mp4 files in that order. No replacement based on results. Sources are existing public EgoAnnotate CC BY 4.0 examples with attribution in public/ego/sources/provenance.json; the pilot makes no claim of original full-dataset hash verification. Frame timestamps are relative to these exact local source bytes.

Protocol: source-frames-v1 extractor selects at most four presentation-timestamp frames in each bounded <=6 second window. For each clip, select only its first and last available windows, deduplicating a single-window clip. This is at most 10 windows, each receives exactly one Gemma caption request followed by one independent image-grounded Clef check. No automatic retries or outcome-based reselection. Maximum 20 provider calls, total engineering ceiling $1. Reserve $0.03 for each attempt; stop before exceeding $0.60 reserved (20 attempts) or $1 reported estimated spend. The reservation exceeds documented per-call worst case for Gemma's 256k context at $0.10/M plus bounded 768 output tokens at $0.30/M; Clef context 65,536 at $0.09/M. Endpoint only official api.cloudflare.com. Errors/latencies/unknowns retained. Missing usage is reported as missing/failure, never zero inferred.

Gemma receives only sampled images and exact source timestamps, no filename, topic title, publisher task labels or reference outcomes. It proposes a plain factual description, visible objects, short action tags, sampled action outcome, and final-frame evidence. Clef receives the same ordered images and treats the proposed caption as an untrusted claim, independently checking support and whether the last frame visibly supports success/failure/unknown. Exposed outcome is unknown unless independent support and clear final evidence agree. No text embedded in frames may direct either model.

Evidence logged: immutable source hash/bytes, actual selected frame IDs/PTS/seconds/hashes, window bounds, model IDs, sanitized raw responses, measured latency, provider token usage, price-derived estimated cost, final bounded outputs/errors. No keys, account IDs, private media or source code in results. Images remain local derived evidence only.

Feasibility criteria: requests accepted with real images; bounded schema parses; time/usage recorded; original frame provenance preserved; no fabricated completion or calibrated confidence. No benchmark accuracy claim. Human spot review occurs only after outputs are frozen and reports concerns, not ground-truth success percentages. Selection is small and nonrandom; sparse images miss between-frame motion, audio and full task completion; direct captions and agreement can both be wrong. Existing JEV analysis remains separate.

Fixed files:

[
  {
    "id": "onion",
    "path": "public/ego/sources/onion.mp4",
    "bytes": 209273,
    "sha256": "100e25698ee99e99dc648c41d9864144e312f0fce7c07dc9a7b06b487b9a2a5f"
  },
  {
    "id": "melon",
    "path": "public/ego/sources/melon.mp4",
    "bytes": 298547,
    "sha256": "f32cf75d28602d169b4f302830ba633a351ac890596887c54c8e928efcf2650e"
  },
  {
    "id": "shirt",
    "path": "public/ego/sources/shirt.mp4",
    "bytes": 468174,
    "sha256": "8392c62f4e9590a15745311746114c2b6355e24c60fa87fef68e834f20762113"
  },
  {
    "id": "jeans",
    "path": "public/ego/sources/jeans.mp4",
    "bytes": 538358,
    "sha256": "95845362951b3f78b7b731691df6d472bf176ced4b07ecef4d99d0b8a21da3e2"
  },
  {
    "id": "pack",
    "path": "public/ego/sources/pack.mp4",
    "bytes": 394403,
    "sha256": "87a67e5b10f124a65df7d669086d4a9b2cb7ae25a5d758594b9b3aa7b0938f4c"
  }
]
