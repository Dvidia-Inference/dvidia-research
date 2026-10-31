# DVIDIA task environments v0.2

A reusable PiPER scene recipe with multiple rigid instances, an open bin and whole-object completion checks. The complete frozen study retains six accepted passive completion fixtures, six correctly rejected completion controls and four invalid layout inputs. These are environment/verifier checks, not a learned robot skill success rate.

Serve this folder with `python -m http.server 8000 --bind 127.0.0.1` and open http://127.0.0.1:8000/. The browser edits draft recipes and displays saved native poses. Fresh physics runs require the local Python editor; see `docs/task-environments-v02.md` for installed UI and Terminal commands.

`benchmark/` preserves the unchanged frozen protocol, source snapshots, every input and attempt, native geometry, all 1 ms observation traces and 100 Hz body poses. Identical robot mesh data is stored once by content hash. `audit.json` reconstructs saved observations with a separately implemented verifier, without stepping simulation. This establishes evidence consistency, not physical truth, perception accuracy or authenticity.

Recorded duration: 13.25 simulation seconds in 16.550 wall seconds including compilation and evidence export on a shared Apple arm64 host. Preparation, camera capture, training, publication and hardware are outside that timing.

The arm holds its home commands. Original shoes are rigid three-box surrogates with assumed mechanics. Arbitrary USD import, calibrated shoe deformation, learned manipulation and physical transfer remain open.

`manifest.json` hashes every other file and excludes itself. Original DVIDIA code/scenes: MIT. PiPER assets: MIT, with upstream notices under licenses/. Viewer dependencies retain their notices. DVIDIA research · [@iammrriver](https://x.com/iammrriver) · hello@dvidia.org.
