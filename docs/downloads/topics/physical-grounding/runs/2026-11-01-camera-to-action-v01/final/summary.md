# Camera-to-action study: posthoc evidence tables

These tables summarize sealed evidence without running or tuning policies.

| Stage / controller | Strict success / scheduled | Complete | Native assessable | All-attempt success |
|---|---:|---:|---:|---:|
| confirmation / student | 5 / 64 | 64 | 64 | 7.8% |
| confirmation / blind | 9 / 64 | 64 | 64 | 14.1% |
| confirmation / fixed | 31 / 64 | 64 | 64 | 48.4% |
| confirmation / teacher | 64 / 64 | 64 | 64 | 100.0% |
| corrections / mixed | 1 / 32 | 32 | 32 | 3.1% |
| demonstrations / teacher | 80 / 80 | 80 | 80 | 100.0% |
| development-corrected / student | 1 / 16 | 16 | 16 | 6.2% |
| development-corrected / blind | 1 / 16 | 16 | 16 | 6.2% |
| development-initial / student | 0 / 16 | 16 | 16 | 0.0% |
| development-initial / blind | 0 / 16 | 16 | 16 | 0.0% |
| diagnostic / teacher | 4 / 4 | 4 | 4 | 100.0% |
| negative / student | 0 / 16 | 4 | 4 | 0.0% |

Component failures are conditional on the stated prerequisite. Unknown counts are retained.

| Stage / controller | Component | Prerequisite | Failed / conditional assessed | Eligible but unassessed | All-attempt unassessed |
|---|---|---|---:|---:|---:|
| confirmation / student | grasp | all valid native score receipts | 42 / 64 | 0 | 0 |
| confirmation / student | lift | native_recomputed.grasp_seen == true | 1 / 22 | 0 | 0 |
| confirmation / student | carry | native_recomputed.lift_seen == true | 15 / 21 | 0 | 0 |
| confirmation / student | retention | native_recomputed.lift_seen == true | 0 / 21 | 0 | 0 |
| confirmation / student | terminal_composite | native_recomputed.carry_complete == true | 1 / 6 | 0 | 0 |
| confirmation / student | release | native_recomputed.carry_complete == true | 1 / 6 | 0 | 0 |
| confirmation / student | settling | native_recomputed.carry_complete == true | 1 / 6 | 0 | 0 |
| confirmation / student | retreat | native_recomputed.carry_complete == true | 1 / 6 | 0 | 0 |
| confirmation / blind | grasp | all valid native score receipts | 1 / 64 | 0 | 0 |
| confirmation / blind | lift | native_recomputed.grasp_seen == true | 0 / 63 | 0 | 0 |
| confirmation / blind | carry | native_recomputed.lift_seen == true | 25 / 63 | 0 | 0 |
| confirmation / blind | retention | native_recomputed.lift_seen == true | 5 / 63 | 0 | 0 |
| confirmation / blind | terminal_composite | native_recomputed.carry_complete == true | 19 / 38 | 0 | 0 |
| confirmation / blind | release | native_recomputed.carry_complete == true | 10 / 38 | 0 | 0 |
| confirmation / blind | settling | native_recomputed.carry_complete == true | 1 / 38 | 0 | 0 |
| confirmation / blind | retreat | native_recomputed.carry_complete == true | 6 / 38 | 0 | 0 |
| confirmation / fixed | grasp | all valid native score receipts | 0 / 64 | 0 | 0 |
| confirmation / fixed | lift | native_recomputed.grasp_seen == true | 0 / 64 | 0 | 0 |
| confirmation / fixed | carry | native_recomputed.lift_seen == true | 10 / 64 | 0 | 0 |
| confirmation / fixed | retention | native_recomputed.lift_seen == true | 17 / 64 | 0 | 0 |
| confirmation / fixed | terminal_composite | native_recomputed.carry_complete == true | 0 / 54 | 0 | 0 |
| confirmation / fixed | release | native_recomputed.carry_complete == true | 0 / 54 | 0 | 0 |
| confirmation / fixed | settling | native_recomputed.carry_complete == true | 0 / 54 | 0 | 0 |
| confirmation / fixed | retreat | native_recomputed.carry_complete == true | 0 / 54 | 0 | 0 |
| confirmation / teacher | grasp | all valid native score receipts | 0 / 64 | 0 | 0 |
| confirmation / teacher | lift | native_recomputed.grasp_seen == true | 0 / 64 | 0 | 0 |
| confirmation / teacher | carry | native_recomputed.lift_seen == true | 0 / 64 | 0 | 0 |
| confirmation / teacher | retention | native_recomputed.lift_seen == true | 0 / 64 | 0 | 0 |
| confirmation / teacher | terminal_composite | native_recomputed.carry_complete == true | 0 / 64 | 0 | 0 |
| confirmation / teacher | release | native_recomputed.carry_complete == true | 0 / 64 | 0 | 0 |
| confirmation / teacher | settling | native_recomputed.carry_complete == true | 0 / 64 | 0 | 0 |
| confirmation / teacher | retreat | native_recomputed.carry_complete == true | 0 / 64 | 0 | 0 |
| corrections / mixed | grasp | all valid native score receipts | 8 / 32 | 0 | 0 |
| corrections / mixed | lift | native_recomputed.grasp_seen == true | 7 / 24 | 0 | 0 |
| corrections / mixed | carry | native_recomputed.lift_seen == true | 0 / 17 | 0 | 0 |
| corrections / mixed | retention | native_recomputed.lift_seen == true | 0 / 17 | 0 | 0 |
| corrections / mixed | terminal_composite | native_recomputed.carry_complete == true | 4 / 17 | 0 | 0 |
| corrections / mixed | release | native_recomputed.carry_complete == true | 3 / 17 | 0 | 0 |
| corrections / mixed | settling | native_recomputed.carry_complete == true | 2 / 17 | 0 | 0 |
| corrections / mixed | retreat | native_recomputed.carry_complete == true | 4 / 17 | 0 | 0 |
| demonstrations / teacher | grasp | all valid native score receipts | 0 / 80 | 0 | 0 |
| demonstrations / teacher | lift | native_recomputed.grasp_seen == true | 0 / 80 | 0 | 0 |
| demonstrations / teacher | carry | native_recomputed.lift_seen == true | 0 / 80 | 0 | 0 |
| demonstrations / teacher | retention | native_recomputed.lift_seen == true | 0 / 80 | 0 | 0 |
| demonstrations / teacher | terminal_composite | native_recomputed.carry_complete == true | 0 / 80 | 0 | 0 |
| demonstrations / teacher | release | native_recomputed.carry_complete == true | 0 / 80 | 0 | 0 |
| demonstrations / teacher | settling | native_recomputed.carry_complete == true | 0 / 80 | 0 | 0 |
| demonstrations / teacher | retreat | native_recomputed.carry_complete == true | 0 / 80 | 0 | 0 |
| development-corrected / student | grasp | all valid native score receipts | 12 / 16 | 0 | 0 |
| development-corrected / student | lift | native_recomputed.grasp_seen == true | 0 / 4 | 0 | 0 |
| development-corrected / student | carry | native_recomputed.lift_seen == true | 3 / 4 | 0 | 0 |
| development-corrected / student | retention | native_recomputed.lift_seen == true | 0 / 4 | 0 | 0 |
| development-corrected / student | terminal_composite | native_recomputed.carry_complete == true | 0 / 1 | 0 | 0 |
| development-corrected / student | release | native_recomputed.carry_complete == true | 0 / 1 | 0 | 0 |
| development-corrected / student | settling | native_recomputed.carry_complete == true | 0 / 1 | 0 | 0 |
| development-corrected / student | retreat | native_recomputed.carry_complete == true | 0 / 1 | 0 | 0 |
| development-corrected / blind | grasp | all valid native score receipts | 0 / 16 | 0 | 0 |
| development-corrected / blind | lift | native_recomputed.grasp_seen == true | 0 / 16 | 0 | 0 |
| development-corrected / blind | carry | native_recomputed.lift_seen == true | 7 / 16 | 0 | 0 |
| development-corrected / blind | retention | native_recomputed.lift_seen == true | 1 / 16 | 0 | 0 |
| development-corrected / blind | terminal_composite | native_recomputed.carry_complete == true | 5 / 9 | 0 | 0 |
| development-corrected / blind | release | native_recomputed.carry_complete == true | 1 / 9 | 0 | 0 |
| development-corrected / blind | settling | native_recomputed.carry_complete == true | 0 / 9 | 0 | 0 |
| development-corrected / blind | retreat | native_recomputed.carry_complete == true | 1 / 9 | 0 | 0 |
| development-initial / student | grasp | all valid native score receipts | 16 / 16 | 0 | 0 |
| development-initial / student | lift | native_recomputed.grasp_seen == true | 0 / 0 | 0 | 0 |
| development-initial / student | carry | native_recomputed.lift_seen == true | 0 / 0 | 0 | 0 |
| development-initial / student | retention | native_recomputed.lift_seen == true | 0 / 0 | 0 | 0 |
| development-initial / student | terminal_composite | native_recomputed.carry_complete == true | 0 / 0 | 0 | 0 |
| development-initial / student | release | native_recomputed.carry_complete == true | 0 / 0 | 0 | 0 |
| development-initial / student | settling | native_recomputed.carry_complete == true | 0 / 0 | 0 | 0 |
| development-initial / student | retreat | native_recomputed.carry_complete == true | 0 / 0 | 0 | 0 |
| development-initial / blind | grasp | all valid native score receipts | 14 / 16 | 0 | 0 |
| development-initial / blind | lift | native_recomputed.grasp_seen == true | 2 / 2 | 0 | 0 |
| development-initial / blind | carry | native_recomputed.lift_seen == true | 0 / 0 | 0 | 0 |
| development-initial / blind | retention | native_recomputed.lift_seen == true | 0 / 0 | 0 | 0 |
| development-initial / blind | terminal_composite | native_recomputed.carry_complete == true | 0 / 0 | 0 | 0 |
| development-initial / blind | release | native_recomputed.carry_complete == true | 0 / 0 | 0 | 0 |
| development-initial / blind | settling | native_recomputed.carry_complete == true | 0 / 0 | 0 | 0 |
| development-initial / blind | retreat | native_recomputed.carry_complete == true | 0 / 0 | 0 | 0 |
| diagnostic / teacher | grasp | all valid native score receipts | 0 / 4 | 0 | 0 |
| diagnostic / teacher | lift | native_recomputed.grasp_seen == true | 0 / 4 | 0 | 0 |
| diagnostic / teacher | carry | native_recomputed.lift_seen == true | 0 / 4 | 0 | 0 |
| diagnostic / teacher | retention | native_recomputed.lift_seen == true | 0 / 4 | 0 | 0 |
| diagnostic / teacher | terminal_composite | native_recomputed.carry_complete == true | 0 / 4 | 0 | 0 |
| diagnostic / teacher | release | native_recomputed.carry_complete == true | 0 / 4 | 0 | 0 |
| diagnostic / teacher | settling | native_recomputed.carry_complete == true | 0 / 4 | 0 | 0 |
| diagnostic / teacher | retreat | native_recomputed.carry_complete == true | 0 / 4 | 0 | 0 |
| negative / student | grasp | all valid native score receipts | 4 / 4 | 0 | 12 |
| negative / student | lift | native_recomputed.grasp_seen == true | 0 / 0 | 0 | 12 |
| negative / student | carry | native_recomputed.lift_seen == true | 0 / 0 | 0 | 12 |
| negative / student | retention | native_recomputed.lift_seen == true | 0 / 0 | 0 | 12 |
| negative / student | terminal_composite | native_recomputed.carry_complete == true | 0 / 0 | 0 | 12 |
| negative / student | release | native_recomputed.carry_complete == true | 0 / 0 | 0 | 12 |
| negative / student | settling | native_recomputed.carry_complete == true | 0 / 0 | 0 | 12 |
| negative / student | retreat | native_recomputed.carry_complete == true | 0 / 0 | 0 | 12 |

| Stage / controller | Contact-affected / native assessed | Unassessed | Critical 1 ms ticks |
|---|---:|---:|---:|
| confirmation / student | 2 / 64 | 0 | 122 |
| confirmation / blind | 34 / 64 | 0 | 14953 |
| confirmation / fixed | 30 / 64 | 0 | 2306 |
| confirmation / teacher | 0 / 64 | 0 | 0 |
| corrections / mixed | 29 / 32 | 0 | 11746 |
| demonstrations / teacher | 0 / 80 | 0 | 0 |
| development-corrected / student | 0 / 16 | 0 | 0 |
| development-corrected / blind | 9 / 16 | 0 | 2816 |
| development-initial / student | 16 / 16 | 0 | 25368 |
| development-initial / blind | 10 / 16 | 0 | 1716 |
| diagnostic / teacher | 0 / 4 | 0 | 0 |
| negative / student | 0 / 4 | 12 | 0 |

Posthoc terminal predicates are measured separately from the frozen task gate.

| Stage / controller | Predicate | False at final tick / assessed | Final dwell min / median | Required dwell |
|---|---|---:|---:|---:|
| confirmation / student | release | 20 / 64 | 0.000 / 20.000 s | 0.250 s |
| confirmation / student | settling | 6 / 64 | 0.000 / 20.000 s | 0.250 s |
| confirmation / student | retreat | 57 / 64 | 0.000 / 0.000 s | 0.250 s |
| confirmation / blind | release | 31 / 64 | 0.000 / 2.875 s | 0.250 s |
| confirmation / blind | settling | 2 / 64 | 0.000 / 6.855 s | 0.250 s |
| confirmation / blind | retreat | 27 / 64 | 0.000 / 2.639 s | 0.250 s |
| confirmation / fixed | release | 0 / 64 | 5.288 / 5.811 s | 0.250 s |
| confirmation / fixed | settling | 0 / 64 | 5.551 / 6.099 s | 0.250 s |
| confirmation / fixed | retreat | 0 / 64 | 4.513 / 5.114 s | 0.250 s |
| confirmation / teacher | release | 0 / 64 | 5.147 / 5.748 s | 0.250 s |
| confirmation / teacher | settling | 0 / 64 | 5.563 / 6.046 s | 0.250 s |
| confirmation / teacher | retreat | 0 / 64 | 4.492 / 5.095 s | 0.250 s |
| corrections / mixed | release | 16 / 32 | 0.000 / 0.327 s | 0.250 s |
| corrections / mixed | settling | 3 / 32 | 0.000 / 4.940 s | 0.250 s |
| corrections / mixed | retreat | 19 / 32 | 0.000 / 0.000 s | 0.250 s |
| demonstrations / teacher | release | 0 / 80 | 4.907 / 5.718 s | 0.250 s |
| demonstrations / teacher | settling | 0 / 80 | 5.316 / 6.038 s | 0.250 s |
| demonstrations / teacher | retreat | 0 / 80 | 4.252 / 5.062 s | 0.250 s |
| development-corrected / student | release | 3 / 16 | 0.000 / 20.000 s | 0.250 s |
| development-corrected / student | settling | 1 / 16 | 0.000 / 20.000 s | 0.250 s |
| development-corrected / student | retreat | 15 / 16 | 0.000 / 0.000 s | 0.250 s |
| development-corrected / blind | release | 7 / 16 | 0.000 / 2.094 s | 0.250 s |
| development-corrected / blind | settling | 0 / 16 | 5.044 / 7.665 s | 0.250 s |
| development-corrected / blind | retreat | 7 / 16 | 0.000 / 2.971 s | 0.250 s |
| development-initial / student | release | 10 / 16 | 0.000 / 0.000 s | 0.250 s |
| development-initial / student | settling | 0 / 16 | 0.496 / 3.769 s | 0.250 s |
| development-initial / student | retreat | 11 / 16 | 0.000 / 0.000 s | 0.250 s |
| development-initial / blind | release | 4 / 16 | 0.000 / 10.312 s | 0.250 s |
| development-initial / blind | settling | 0 / 16 | 0.248 / 20.000 s | 0.250 s |
| development-initial / blind | retreat | 5 / 16 | 0.000 / 0.905 s | 0.250 s |
| diagnostic / teacher | release | 0 / 4 | 5.267 / 5.529 s | 0.250 s |
| diagnostic / teacher | settling | 0 / 4 | 5.698 / 5.859 s | 0.250 s |
| diagnostic / teacher | retreat | 0 / 4 | 4.612 / 4.885 s | 0.250 s |
| negative / student | release | 0 / 4 | 20.000 / 20.000 s | 0.250 s |
| negative / student | settling | 0 / 4 | 20.000 / 20.000 s | 0.250 s |
| negative / student | retreat | 4 / 4 | 0.000 / 0.000 s | 0.250 s |

| Stage / controller | Visual decisions available | Maximum missing span | Inference p95 | Full boundary p95 |
|---|---:|---:|---:|---:|
| confirmation / student | 55694 / 64000 | 10.680 s | 0.447 ms | 36.432 ms |
| confirmation / blind | 34884 / 64000 | 14.720 s | 0.254 ms | 35.627 ms |
| confirmation / fixed | 39510 / 64000 | 8.040 s | 0.439 ms | 37.593 ms |
| confirmation / teacher | 39776 / 64000 | 8.000 s | Not reported | 38.634 ms |
| corrections / mixed | 17064 / 32000 | 13.360 s | 2.821 ms | 161.639 ms |
| demonstrations / teacher | 49834 / 80000 | 7.960 s | Not reported | 132.478 ms |
| development-corrected / student | 14504 / 16000 | 10.040 s | 1.521 ms | 95.866 ms |
| development-corrected / blind | 8582 / 16000 | 14.640 s | 0.893 ms | 97.188 ms |
| development-initial / student | 11758 / 16000 | 1.800 s | 0.756 ms | 53.402 ms |
| development-initial / blind | 9376 / 16000 | 12.120 s | 0.530 ms | 55.644 ms |
| diagnostic / teacher | 2444 / 4000 | 7.960 s | Not reported | 85.588 ms |
| negative / student | 2996 / 4012 | 9.960 s | 0.459 ms | 38.688 ms |

| Fit | Model bytes | Fit/save seconds | Shared export seconds | Process peak RSS bytes |
|---|---:|---:|---:|---:|
| train-initial / blind | 517296 | 5.988883915822953 | 685.4365955828689 | 789200896 |
| train-initial / full | 521715 | 6.557560459244996 | 685.4365955828689 | 643891200 |
| train-corrected / blind | 540371 | 13.686696916818619 | 471.29602029128 | 1055539200 |
| train-corrected / full | 543977 | 10.947931208182126 | 471.29602029128 | 1055539200 |

Recorded renderer warning history (boundaries carrying a message, not new emissions or independent accuracy trials):

- confirmation / student: 0 affected / 64 reported episodes; 0 unreported. {}
- confirmation / blind: 0 affected / 64 reported episodes; 0 unreported. {}
- confirmation / fixed: 0 affected / 64 reported episodes; 0 unreported. {}
- confirmation / teacher: 0 affected / 64 reported episodes; 0 unreported. {}
- corrections / mixed: 0 affected / 32 reported episodes; 0 unreported. {}
- demonstrations / teacher: 1 affected / 80 reported episodes; 0 unreported. {"ARB_clip_control unavailable while mjDEPTH_ZEROFAR requested, depth accuracy will be limited": 501}
- development-corrected / student: 0 affected / 16 reported episodes; 0 unreported. {}
- development-corrected / blind: 0 affected / 16 reported episodes; 0 unreported. {}
- development-initial / student: 1 affected / 16 reported episodes; 0 unreported. {"ARB_clip_control unavailable while mjDEPTH_ZEROFAR requested, depth accuracy will be limited": 501}
- development-initial / blind: 0 affected / 16 reported episodes; 0 unreported. {}
- diagnostic / teacher: 1 affected / 4 reported episodes; 0 unreported. {"ARB_clip_control unavailable while mjDEPTH_ZEROFAR requested, depth accuracy will be limited": 501}
- negative / student: 0 affected / 16 reported episodes; 0 unreported. {}

Recorded execution environments:

- {"machine": "arm64", "mujoco": "3.15.0", "numpy": "2.5.3", "python": "3.12.9", "system": "Darwin"}; 452 episode receipts. CPU/GPU device identities were not recorded.

- Posthoc description only: no tuning, model inference, new episodes or qualification changes.
- All-attempt success denominators include scheduled refusals, interrupted attempts and missing receipts.
- Component counts use valid independent native score receipts. Missing or invalid evidence remains unassessed.
- Conditional component denominators require the preceding grasp, lift or supported carry predicate; they are not all-attempt success rates.
- Release, settling and retreat are separately reconstructed posthoc from sealed native arrays using the frozen scorer predicates. Final predicate and consecutive dwell are diagnostic localization, not new qualification gates.
- Latencies pool recorded boundary samples, never averages of episode percentiles. The simulator pauses for computation on a shared host; these are not physical sensor-to-actuator latencies.
- Camera acquisition and availability timestamps are synthetic. Depth and physical hardware accuracy remain unqualified.
- Renderer-warning counts describe boundaries carrying cumulative warning history, not new warning emissions or independent depth-error trials. An absent warning field is unreported, not evidence of warning-free rendering.
- Peak RSS is a process high-water mark including dataset export and any preceding fit, not an isolated model memory measurement.
- Evidence verification covers protocol/stage seals, referenced rollout/context receipts, native numeric evidence and model bytes. Image archives and full policy/scoring correctness remain the scope of the separately published independent audit.
