# Reference actions v0.1 publication

This publication adds a separate engineering report and a read-only replay of
all eight registered reference-model development attempts. Neither candidate
completes strict placement (0/4 each); both remain unqualified. The original
camera-to-action 5/64 confirmation result remains unchanged.

Runtime/model source: 78ea4fbb4b2733e7738eb425eeecd7cb67a52195.
Training source/cards/weights publication: 8774265fdf2a4516520cdf36ff2eb41dcd04dfda.
Native result: 597277fd6c4671a7d2791aa861beb5da896573fcbf51f8db08e30d4bc501284e.
Independent native audit: 098c3c7b8c678790cc089dbec50d5c7c874e0a54da72844e48c49222683f9d7f.
Public matched-teacher diagnosis: fc643317955a4ca83ab27605851e147bb50bb439de9d6ad9ff4fdf570a15cf0c.

The replay contains 400 byte-identical RGB frames and all 8,000 recorded motor
rows, with camera and applied-command timestamps separated. Display selection
retains the full eight-attempt roster, independent of outcome. Native recording
is 25 Hz RGB-D / 50 Hz controls / 1 ms physics. Display RGB is 2.5 Hz. No new
simulation, policy inference, fitting or scoring occurs in the viewer builder.
The two prior batches contain sixteen infrastructure refusals and stay separate
from the measured 0/4 manipulation results.

Validation: independent source/viewer/report review, all display inventory hashes,
`npm run check`, five existing camera-action publication/viewer regressions, and
real browser article → replay navigation, case selection, play/pause, timeline,
gripper selection and missing-observation state. No browser console warnings or
errors. Default browser Playwright label selection was unavailable; native
accessible controls completed the flow. No account, auth, billing, storage or
apex website behavior changes.

Deployment is scoped to the existing dedicated research Worker. Public HTTP and
browser readback are required after deployment. GitHub models are research API
artifacts; the new schema is not supported by the skill installer. No physical
qualification or arbitrary video-to-any-arm claim is made.
