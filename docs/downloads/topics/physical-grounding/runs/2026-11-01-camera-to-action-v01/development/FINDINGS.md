# Sealed development findings

The correction candidate has less observed early closure and rate-limit clipping, but it does not yet complete the task reliably. The initial full learner succeeds in 0/16 development attempts; the corrected full learner succeeds in 1/16. The matched blind learner also succeeds in 1/16 after correction. These are development results, not the frozen confirmation result or a qualified-skill claim.

All 64 registered learned attempts and all 16 matched teacher demonstrations have complete, valid numeric trajectories. None was removed or replaced. The helper independently reconstructed native scores and checked 581 source-file identities, all four model identities, all five relevant stage seals and all 19 registered runtime hashes. It did not run physics, inference or training, and did not read confirmation outcomes. This is a sealed local descriptive analysis pending the independent full-study audit, not a full camera/media audit.

| Cohort | Strict placement | Never commanded jaw below 20 mm | Strict grasp / lift | Critical-contact attempts (native ticks) | Rate-limited control intervals |
| --- | ---: | ---: | ---: | ---: | ---: |
| Matched teachers | 16/16 | 0/16 | 16/16 grasp; 16/16 lift | 0/16 (0) | 1,200/16,000 |
| Initial full learner | 0/16 | 0/16 | 0/16 grasp; 0/16 lift | 16/16 (25,368) | 15,706/16,000 |
| Initial blind learner | 0/16 | 2/16 | 2/16 grasp; 0/16 lift | 10/16 (1,716) | 1,127/16,000 |
| Corrected full learner | 1/16 | 12/16 | 4/16 grasp; 4/16 lift | 0/16 (0) | 187/16,000 |
| Corrected blind learner | 1/16 | 0/16 | 16/16 grasp; 16/16 lift | 9/16 (2,816) | 1,175/16,000 |

The first-case pattern recurs throughout the initial full cohort: all 16 command closure more than 20 mm from the block in XY, with median distance **129.25 mm**, median command time **1.22 s**, and no recorded bilateral object contact. The matched teachers command closure at median **10.45 s** and **3.89 mm** XY separation. These are issued single-finger targets, not measured jaw closure or total aperture; geometry is taken from the preceding native tick at the command boundary.

For the corrected full learner, 12 attempts never issue a single-finger target below 20 mm and never acquire bilateral/strict grasp. The remaining four command closure at median **15.18 s** and **5.40 mm** XY separation; all four attain the native grasp and lift predicates, and one completes strict placement. The zero critical-contact result is limited to this simulator's registered contact predicate and development cases. It does not establish physical safety or transfer.

The corrected blind learner grasps and lifts in all 16 attempts while completing one strict placement. Its first closure median is **8.50 s** and **4.41 mm** XY separation. This demonstrates why grasp acquisition alone is not a complete-task score. This helper does not attribute its remaining failures to release, settling, retention or retreat; those require the corresponding independently reconstructed predicates.

The generated README labels event-time comparisons “unavailable” when a trajectory has no closure command. In this cohort, that means **two initial-blind and twelve corrected-full non-events**, not lost trajectories or missing native samples. Their complete trajectories remain in all scheduled denominators; closure-time/distance medians are conditional on a command existing. The JSON explicitly records each no-command case.

## Frozen selection cross-check

The recorded selection of **corrected** is consistent with the registered ranking: full-learner strict placements first, critical-contact ticks second, common physical-scale prediction loss third, then original candidate order. Reconstructed candidate values are:

| Candidate | Strict placements | Critical-contact ticks | Development action-scale MSE |
| --- | ---: | ---: | ---: |
| Initial | 0/16 | 25,368 | 0.00011331751004871413 |
| Corrected | 1/16 | 0 | 0.00017347599825870777 |

The corrected model is selected despite its larger teacher-state prediction error. Lower supervised error did not correspond to better task completion in these two candidates. The check independently hashes all 11 artifacts named by `freeze.json`, the fixed comparator and the protocol, and reconstructs the candidate ranking from the sealed development analysis and model validation records. It reads no confirmation outcomes and changes no selection. The saved “frozen before confirmation” flag is reported; this small check does not independently establish temporal chronology.

## Boundaries and identities

These comparisons establish observed differences only. They do not isolate whether action normalization, closed-loop distribution shift, history, visual occlusion or teacher quality caused them. No new ablation, model update or hidden retry was performed. Synthetic depth accuracy remains unvalidated; recorded renderer warnings are a separate limitation, not a demonstrated failure cause.

- Development summary SHA-256: `ae3790c8afcbbe6740ae7b0c736798a871c10a89d6eb80e5773ca0a0c158ea3d`.
- Source inventory SHA-256: `1983596c784b3c01e66b80701fff5edaeebfb2e525f8ab043b308dae2db884fc`.
- Selection check SHA-256: `efa2ea99dc336f35c3227bde159df910a777612a69a16c39e481b03ecb8b3e0b`.
- Frozen selection file SHA-256: `88ef3ae4f5639dc00c2570debf099dc33d52445c9600d3d681aa634c4ddb4087`.

The first-case proof is unchanged. All evidence here is additional, offline posthoc analysis of sealed development recordings.
