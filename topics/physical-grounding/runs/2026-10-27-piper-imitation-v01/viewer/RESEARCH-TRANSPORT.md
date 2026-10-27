# Research replay transport reliability projection

This frontend derives from the published PiPER learned-placement v0.1 replay.
The model, geometry, motion, metadata, native tapes, scores, original sealed
run, evidence archive and installable wheel are unchanged. Only browser
transport reliability and download links differ from the original frontend.

Same-origin downloads send same-origin browser credentials so the site's own
access clearance can be honored. External public Hugging Face Hub downloads
continue to omit credentials. Referrers are omitted and origins remain
restricted. This does not change any site access or security policy.

A compressed binary attempt has an 8-second total deadline covering headers,
body reading, decompression and verification. If it fails, the uncompressed
binary has its own 30-second deadline. Both representations must match the
original decompressed byte count and SHA-256. Metadata requests have a
30-second total deadline. Abort races cover stalled streams, including
cancellation that never acknowledges completion, and errors surface in the
existing replay startup message. A secure context with SHA-256 support is
required. No unverified binary fallback is accepted.

Fifteen Node tests pass. They cover exact hosted namespace restrictions,
unchanged local resource paths, untrusted redirects, credential behavior,
valid gzip decoding, stalled headers/body/decompression, raw fallback,
corrupt or oversized raw data, and actionable metadata/raw timeout errors.
Actual research-site browser loading must be verified after deployment.

| Frontend | SHA-256 |
| --- | --- |
| Original sealed replay bundle | `e4b152f23571eeb9c325f9a034ec22d7af8ab25a1ae2a7869fde769dab5e4aed` |
| Earlier Hugging Face transport bundle, unchanged | `350efae7d2d1c6e3a74db30cd964d6be0ee117890e2ad68b9f1440ce2ca0a7a4` |
| Research reliability bundle | `d5c1290c0ab081d0814b26d1531ff198130f81cd226652f50e8464f4cc7b23af` |
| Research reliability source | `1c05ab9c728745e7130c03c3fcec1a53aa8815a38857ef178ecca32391325028` |

The research projection records these new frontend bytes in its own integrity
manifest; the original evidence seal remains separately available. This
research transport patch is distinct from the Hugging Face deployment.
