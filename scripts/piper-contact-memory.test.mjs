import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import test from "node:test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RUN = resolve(ROOT, "topics/physical-grounding/runs/2026-10-11-piper-contact-v03");
const RECEIPT = resolve(RUN, "receipt");
const SOURCE = "c8868c873f075116b71d908d464890e09778726b";
const REPORT_SHA = "2ca43a89d2c8afe2d62af6179f5be2893ad61cc05193e029a5b8887d2b0eff80";
const INTEGRITY_SHA = "a539d7d9ab37a18007135915e2702fe3ebb33cc2d9f6ede98f759892b7179740";
const HF = "a6bf57fd64e61486dafaa93fd96168f953ccff80";
const EXPECTED_COUNTS = "[{\"friction\":0.8,\"mass\":0.04,\"counts\":[2,0,2,0,2,0,0]},{\"friction\":0.8,\"mass\":0.06,\"counts\":[0,0,0,0,2,0,0]},{\"friction\":0.55,\"mass\":0.04,\"counts\":[2,0,2,0,2,0,0]},{\"friction\":0.55,\"mass\":0.06,\"counts\":[0,0,0,0,0,0,0]},{\"friction\":0.15,\"mass\":0.04,\"counts\":[0,0,0,0,0,0,0]},{\"friction\":0.15,\"mass\":0.06,\"counts\":[0,0,0,0,0,0,0]}]";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const variants = ["baseline_placement", "baseline_open_jaw", "probe_only_placement", "probe_only_open_jaw", "history_placement", "history_open_jaw", "hold"];
const distance = (a, b) => Math.hypot(...a.map((x, i) => x - b[i]));
const norm = a => Math.hypot(...a);

async function inventory(path, prefix = "") {
  const names = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const name = `${prefix}${entry.name}`;
    if (entry.isDirectory()) names.push(...await inventory(resolve(path, entry.name), `${name}/`));
    else { assert.ok(entry.isFile(), name); names.push(name); }
  }
  return names;
}

function privacy(value) {
  if (typeof value === "string") assert.ok(!/(?:\/Users\/|\/private\/tmp\/|\/var\/folders\/|hf_[A-Za-z0-9]{30,}|gh[pousr]_[A-Za-z0-9]{30,}|-----BEGIN .*PRIVATE KEY-----)/.test(value));
  else if (Array.isArray(value)) value.forEach(privacy);
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, item]) => { privacy(key); privacy(item); });
  else if (typeof value === "number") assert.ok(Number.isFinite(value));
}

function localOffset(state) {
  const [w, x, y, z] = state.tcp_quaternion_wxyz;
  const rotation = [[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)],
    [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)], [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]];
  const v = state.object_position_m.map((position, i) => position-state.tcp_position_m[i]);
  return v.map((_, column) => rotation.reduce((sum, row, i) => sum+row[column]*v[i], 0));
}

function near(actual, expected, label) {
  if (expected === null || typeof expected === "boolean") assert.equal(actual, expected, label);
  else assert.ok(typeof actual === "number" && Number.isFinite(actual) && Math.abs(actual-expected) <= 1e-8, label);
}

function checkHistory(raw) {
  if (raw.policy_mode === "baseline" || !raw.grip_guard.active) return;
  const cfg = raw.grip_guard.contract.parameters;
  let history = [], probing = false, qualified = false;
  const events = raw.grip_guard.events;
  for (const state of raw.trajectory) {
    if (!state.command) { assert.equal(state.guard_diagnostic, null); continue; }
    const current = events.filter(event => Math.abs(event.t_seconds-state.t_seconds) < 1e-8);
    if (current.some(event => event.type === "probe_started")) probing = true;
    if (probing || qualified) {
      history.push(state);
      history = history.filter(row => row.t_seconds >= state.t_seconds-cfg.history_window_s-1e-9);
    } else history = [];
    const diag = state.guard_diagnostic;
    const span = history.length ? history.at(-1).t_seconds-history[0].t_seconds : 0;
    const known = span+1e-9 >= cfg.minimum_history_s;
    const offsets = history.map(localOffset);
    const displacement = offsets.length ? distance(offsets[0], offsets.at(-1)) : null;
    const path = offsets.slice(1).reduce((sum, offset, i) => sum+distance(offsets[i], offset), 0);
    const excursion = offsets.length ? Math.max(...offsets.flatMap(a => offsets.map(b => distance(a, b)))) : 0;
    near(diag.history_count, history.length, "past sample count");
    near(diag.history_known, known, "unknown history window");
    near(diag.history_span_seconds, span, "past observed span");
    near(diag.history_displacement_m, displacement, "TCP-local endpoint displacement");
    near(diag.history_rate_m_s, known ? displacement/span : null, "causal relative rate");
    near(diag.history_path_m, path, "relative path");
    near(diag.history_excursion_m, excursion, "pairwise excursion prevents endpoint cancellation");
    assert.equal(diag.t_seconds, state.t_seconds);
    if (diag.unscaled_joint_targets_rad !== null) {
      const scaled = diag.unscaled_joint_targets_rad.map((target, i) => state.joint_position_rad[i]+diag.joint_delta_scale*(target-state.joint_position_rad[i]));
      scaled.forEach((target, i) => near(state.command.joint_targets_rad[i], target, "requested delta scaling"));
    }
    for (const event of current) {
      if (event.type === "acquisition_qualified") { qualified = true; probing = false; }
      if (event.type === "retry_started") { qualified = false; probing = false; }
      if (event.type === "abort") probing = false;
    }
  }
}

async function rawAttempt(name) {
  return JSON.parse(gunzipSync(await readFile(resolve(RECEIPT, name)), { maxOutputLength: 32 * 1024 * 1024 }));
}

test("All 84 native attempts, original hashes, paired tapes and independent outcomes remain public", async () => {
  const integrityBytes = await readFile(resolve(RECEIPT, "integrity.json"));
  assert.equal(sha(integrityBytes), INTEGRITY_SHA, "Original frozen seal bytes");
  const integrity = JSON.parse(integrityBytes);
  assert.equal(integrity.schema, "dvidia.piper-contact-integrity/v0.3");
  assert.equal(Object.keys(integrity.files).length, 89);
  assert.deepEqual(new Set(await inventory(RECEIPT)), new Set([...Object.keys(integrity.files), "integrity.json"]));
  const files = new Map(), summaries = new Map();
  let stored = 0, decoded = 0, misses = 0;
  for (const [name, record] of Object.entries(integrity.files)) {
    assert.ok(!name.startsWith("/") && !name.split("/").includes(".."), name);
    const bytes = await readFile(resolve(RECEIPT, name));
    assert.equal(bytes.length, record.bytes, name); assert.equal(sha(bytes), record.sha256, name);
    stored += bytes.length;
    if (!name.startsWith("attempts/")) { files.set(name, bytes); decoded += bytes.length; continue; }
    assert.match(name, /^attempts\/[a-z0-9_-]+\.json\.gz$/);
    assert.equal(record.encoding, "gzip"); assert.equal(bytes.readUInt32LE(4), 0);
    const rawBytes = gunzipSync(bytes, { maxOutputLength: 32 * 1024 * 1024 });
    assert.equal(rawBytes.length, record.decoded_bytes, name); assert.equal(sha(rawBytes), record.decoded_sha256, name);
    decoded += rawBytes.length;
    const raw = JSON.parse(rawBytes); privacy(raw);
    assert.equal(typeof raw.valid, "boolean"); assert.equal(typeof raw.success, "boolean");
    assert.equal(raw.physical_robot_ready, false); assert.equal(raw.learned_policy, false);
    assert.ok(!raw.success || raw.valid);
    if (raw.valid) {
      assert.ok(Math.abs(raw.simulated_seconds-20) < 1e-8);
      assert.equal(raw.actions.length, 1000); assert.equal(raw.arm_tape.length, 1000); assert.equal(raw.trajectory.length, 1001);
      assert.deepEqual(raw.warnings, []);
      for (const key of ["issued_joint_targets_rad", "issued_gripper_position_m", "command"]) assert.equal(raw.trajectory.at(-1)[key], null);
      for (let index=0; index<1000; index++) {
        const state=raw.trajectory[index], action=raw.actions[index];
        assert.ok(Math.abs(state.t_seconds-index*.02)<1e-8);
        assert.deepEqual(state.command, action); assert.deepEqual(state.issued_joint_targets_rad, raw.arm_tape[index]);
      }
      if (raw.success) {
        const final=raw.trajectory.at(-1), metrics=raw.metrics;
        assert.equal(metrics.carry_complete, true); assert.equal(metrics.retention_lost, false);
        assert.equal(metrics.unexpected_contact_native_ticks, 0);
        assert.ok(final.table_object_contact_count > 0);
        assert.ok(Object.values(final.grasp_contact_counts).every(count => count === 0));
        assert.ok(final.gripper_joint_position_m[0] > .028 && final.gripper_joint_position_m[1] < -.028);
        assert.ok(norm(final.object_linear_velocity_m_s) < .035 && norm(final.object_angular_velocity_rad_s) < .3);
        assert.ok(distance(final.object_position_m, final.target_position_m) <= .025);
        assert.ok(final.tcp_position_m[2]-final.object_position_m[2] >= .1);
      }
      checkHistory(raw);
    }
    summaries.set(name, Object.fromEntries(Object.entries(raw).filter(([key]) => !["trajectory", "actions", "arm_tape"].includes(key))));
    misses += raw.timing.missed_control_boundaries || 0;
  }
  assert.equal(summaries.size, 84);
  assert.equal(sha(files.get("report.json")), REPORT_SHA, "Original frozen confirmation report bytes");
  const report=JSON.parse(files.get("report.json")), protocol=JSON.parse(files.get("protocol.json"));
  assert.equal(report.schema, "dvidia.piper-contact-benchmark/v0.3");
  assert.deepEqual(report.protocol, protocol); assert.equal(report.protocol_sha256, sha(files.get("protocol.json")));
  assert.equal(protocol.seed, 813407); assert.equal(protocol.cohort, "confirmation");
  assert.equal(protocol.planned_attempts, 84); assert.equal(report.attempted, 84);
  assert.equal(protocol.scenes.length, 12); assert.deepEqual(protocol.variants, variants);
  assert.deepEqual(protocol.native_command_units, ["rad", "rad", "rad", "rad", "rad", "rad", "m"]);
  assert.equal(protocol.contact_contract.parameters.maximum_reassessments, 2);
  assert.equal(protocol.contact_contract.acquisition.parameters.max_retries, 1);
  assert.equal(protocol.implementation_sha256["piper_contact_memory.py"], "f608d6647046f6fa02d8ad5e87fad10853837520a6a0fae2043c7ad260a06c4c");
  assert.equal(protocol.implementation_sha256["piper_grip_guard.py"], "90895566cad8d5a3c158a14d3165fa1866cb3d7a4a3eecac3ca0ca8ab3e88dfb");
  const expected = new Set(protocol.scenes.flatMap(scene => variants.map(variant => `${scene.id}--${variant}`)));
  assert.equal(expected.size, 84); assert.deepEqual(new Set(report.attempts.map(row => row.id)), expected);
  for (const row of report.attempts) assert.deepEqual(summaries.get(row.result_file), Object.fromEntries(Object.entries(row).filter(([key]) => key !== "result_file")));
  for (const scene of protocol.scenes) {
    const rows = await Promise.all(variants.map(variant => rawAttempt(`attempts/${scene.id}--${variant}.json.gz`)));
    for (const raw of rows.filter(row => row.valid)) {
      assert.equal(raw.compiled_model_sha256, rows[0].compiled_model_sha256);
      assert.deepEqual(raw.native_model_settings, rows[0].native_model_settings);
      assert.deepEqual(raw.trajectory[0].qpos, rows[0].trajectory[0].qpos);
    }
    for (const [placement, opened] of [[rows[0], rows[1]], [rows[2], rows[3]], [rows[4], rows[5]]]) {
      if (opened.valid) { assert.equal(placement.valid, true); assert.deepEqual(opened.arm_tape, placement.arm_tape); }
      assert.ok(opened.actions.every(action => action.gripper_position_m === .035));
    }
    if (scene.friction === .8 && scene.mass_kg === .06) {
      const first=rows[4].grip_guard.events.find(event => event.type === "slowdown_started").t_seconds;
      for (let index=0; rows[4].trajectory[index].t_seconds<=first+1e-8; index++) {
        assert.deepEqual(rows[4].trajectory[index].qpos, rows[2].trajectory[index].qpos, "Same native state before first intervention");
        assert.deepEqual(rows[4].trajectory[index].qvel, rows[2].trajectory[index].qvel);
        if (rows[4].trajectory[index].t_seconds<first-1e-8) assert.deepEqual(rows[4].actions[index], rows[2].actions[index]);
      }
    }
    if (rows[6].actions.length) assert.ok(rows[6].arm_tape.every(target => JSON.stringify(target) === JSON.stringify(rows[6].trajectory[0].joint_position_rad)));
  }
  for (const row of report.summary) {
    const relevant = report.attempts.filter(attempt => attempt.config.friction===row.friction && attempt.config.mass_kg===row.mass_kg && attempt.variant===row.variant);
    assert.equal(row.attempted, relevant.length); assert.equal(row.valid, relevant.filter(attempt => attempt.valid).length);
    assert.equal(row.success, relevant.filter(attempt => attempt.valid && attempt.success).length);
    assert.equal(row.failed_or_invalid, relevant.length-row.success);
  }
  const observedCounts = [.8,.55,.15].flatMap(friction => [.04,.06].map(mass => ({friction,mass,counts:variants.map(variant => report.summary.find(row => row.friction===friction && row.mass_kg===mass && row.variant===variant).success)})));
  assert.deepEqual(observedCounts, JSON.parse(EXPECTED_COUNTS), "Freeze every completion and failure, including controls");
  assert.equal(stored, 55578406); assert.equal(decoded, 300141159); assert.equal(misses, 75);
});

test("Published reader exposes the frozen evidence, exact source and limitations without placeholders", async () => {
  const [paper, readme, homepage, runReadme, execution, catalog, previous] = await Promise.all([
    readFile(resolve(ROOT, "reports/PiPER contact history v03.md"), "utf8"), readFile(resolve(ROOT, "README.md"), "utf8"),
    readFile(resolve(ROOT, "scripts/build-papers.mjs"), "utf8"), readFile(resolve(RUN, "README.md"), "utf8"),
    readFile(resolve(RUN, "execution.json"), "utf8"), readFile(resolve(ROOT, "publications.json"), "utf8"),
    readFile(resolve(ROOT, "reports/PiPER grip validation and recovery.md"), "utf8")
  ]);
  for (const text of [paper, readme, homepage, runReadme, catalog]) assert.ok(!/__[A-Z_]+__/.test(text), "No draft placeholders may be published");
  assert.ok(paper.includes(SOURCE)); assert.ok(paper.includes(HF));
  assert.match(paper, /84 planned attempts/); assert.match(paper, /maximum pairwise excursion/i);
  assert.match(paper, /permanently disqualifies that attempt/); assert.match(paper, /not[\s\S]{0,30}population reliability/i);
  assert.ok(homepage.includes("papers/piper-contact-history-v03/index.html"));
  assert.ok(previous.includes("PiPER%20contact%20history%20v03.md"));
  assert.match(runReadme, /complete, byte-identical 90-file benchmark bundle/i); assert.match(runReadme, /outside\s+the original bundle seal/i);
  const wrapper=JSON.parse(execution); assert.equal(wrapper.source_commit, SOURCE); assert.equal(wrapper.returncode, 0); assert.equal(wrapper.seed, 813407);
  assert.ok(wrapper.execution.includes("network denial"));
  const publication=JSON.parse(catalog).publications.find(row => row.slug === "piper-contact-history-v03");
  assert.ok(publication); assert.equal(publication.source, "reports/PiPER contact history v03.md");
  assert.ok(publication.abstract.includes("84")); assert.ok(publication.status.includes("hardware unqualified"));
});
