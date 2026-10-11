import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import test from "node:test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RUN = resolve(ROOT, "topics/physical-grounding/runs/2026-10-11-piper-grip");
const RECEIPT = resolve(RUN, "receipt");
const SOURCE = "3ee94706f436690c6d1d8554eda9202d23620e3c";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const variants = ["baseline_placement", "baseline_open_jaw", "guarded_placement", "guarded_open_jaw", "hold"];

async function inventory(path, prefix = "") {
  const names = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const name = `${prefix}${entry.name}`;
    if (entry.isDirectory()) names.push(...await inventory(resolve(path, entry.name), `${name}/`));
    else { assert.ok(entry.isFile(), name); names.push(name); }
  }
  return names;
}

test("PiPER grip receipt preserves all original compressed attempts and paired denominators", async () => {
  const integrity = JSON.parse(await readFile(resolve(RECEIPT, "integrity.json")));
  assert.equal(integrity.schema, "dvidia.piper-grip-integrity/v1");
  assert.equal(Object.keys(integrity.files).length, 35);
  assert.deepEqual(new Set(await inventory(RECEIPT)), new Set([...Object.keys(integrity.files), "integrity.json"]));
  const files = new Map(), attempts = new Map();
  let stored = 0, decoded = 0;
  for (const [name, record] of Object.entries(integrity.files)) {
    assert.ok(!name.startsWith("/") && !name.split("/").includes(".."), name);
    const bytes = await readFile(resolve(RECEIPT, name));
    assert.equal(bytes.length, record.bytes, name);
    assert.equal(sha(bytes), record.sha256, name);
    stored += bytes.length;
    if (name.startsWith("attempts/")) {
      assert.match(name, /^attempts\/[a-z0-9_-]+\.json\.gz$/);
      assert.equal(record.encoding, "gzip");
      assert.equal(bytes.readUInt32LE(4), 0, "Canonical gzip must not contain a wall timestamp");
      const raw = gunzipSync(bytes, { maxOutputLength: 32 * 1024 * 1024 });
      assert.equal(raw.length, record.decoded_bytes, name);
      assert.equal(sha(raw), record.decoded_sha256, name);
      assert.ok(!/(?:\/Users\/|\/private\/tmp\/|hf_[A-Za-z0-9]{30,})/.test(raw.toString("utf8")), name);
      decoded += raw.length;
      attempts.set(name, JSON.parse(raw));
    } else { files.set(name, bytes); decoded += bytes.length; }
  }
  assert.equal(stored, 18727085);
  assert.equal(decoded, 100403752);
  assert.equal(sha(files.get("report.json")), "5b62a14e5e3e8ac9ddfa5e809c03f99f4a83a7d00ec8e6d76859eab9c26f5c1e");
  const report = JSON.parse(files.get("report.json")), protocol = JSON.parse(files.get("protocol.json"));
  assert.equal(report.schema, "dvidia.piper-grip-benchmark/v1");
  assert.deepEqual(report.protocol, protocol);
  assert.equal(report.protocol_sha256, sha(files.get("protocol.json")));
  assert.equal(protocol.seed, 731209);
  assert.equal(protocol.cohort, "confirmation");
  assert.deepEqual(protocol.variants, variants);
  assert.deepEqual(protocol.native_command_units, ["rad", "rad", "rad", "rad", "rad", "rad", "m"]);
  assert.equal(protocol.guard_contract.parameters.max_retries, 1);
  assert.equal(report.physical_robot_ready, false);
  assert.equal(report.learned_policy, false);
  assert.equal(report.attempted, 30);
  assert.equal(report.valid_attempts, 30);
  const expected = new Set(protocol.scenes.flatMap(scene => variants.map(variant => `${scene.id}--${variant}`)));
  assert.equal(expected.size, 30);
  assert.deepEqual(new Set(report.attempts.map(row => row.id)), expected);
  let misses = 0, worst = 0;
  for (const row of report.attempts) {
    const raw = attempts.get(row.result_file);
    assert.ok(raw, row.id);
    const summary = Object.fromEntries(Object.entries(raw).filter(([key]) => !["trajectory", "actions", "arm_tape"].includes(key)));
    assert.deepEqual(summary, Object.fromEntries(Object.entries(row).filter(([key]) => key !== "result_file")));
    assert.equal(raw.valid, true);
    assert.equal(raw.physical_robot_ready, false);
    assert.equal(raw.learned_policy, false);
    assert.ok(Math.abs(raw.simulated_seconds - 20) < 1e-8);
    assert.equal(raw.actions.length, 1000);
    assert.equal(raw.arm_tape.length, 1000);
    assert.equal(raw.trajectory.length, 1001);
    assert.deepEqual(raw.warnings, []);
    assert.equal(raw.metrics.unexpected_contact_native_ticks, 0);
    for (const key of ["issued_joint_targets_rad", "issued_gripper_position_m", "command"]) assert.equal(raw.trajectory.at(-1)[key], null);
    misses += row.timing.missed_control_boundaries;
    worst = Math.max(worst, row.timing.control_step_seconds.max);
  }
  assert.equal(misses, 53, "Retain every slow window and control attempt");
  assert.ok(Math.abs(worst - 0.210044875042513) < 1e-12);
  for (const scene of protocol.scenes) {
    const rows = variants.map(variant => attempts.get(`attempts/${scene.id}--${variant}.json.gz`));
    for (const row of rows) {
      assert.equal(row.compiled_model_sha256, rows[0].compiled_model_sha256);
      assert.deepEqual(row.native_model_settings, rows[0].native_model_settings);
      assert.deepEqual(row.trajectory[0].qpos, rows[0].trajectory[0].qpos);
    }
    for (const [placement, opened] of [[rows[0], rows[1]], [rows[2], rows[3]]]) {
      assert.deepEqual(opened.arm_tape, placement.arm_tape);
      assert.ok(opened.actions.every(action => action.gripper_position_m === .035));
    }
    assert.ok(rows[4].arm_tape.every(target => JSON.stringify(target) === JSON.stringify(rows[4].trajectory[0].joint_position_rad)));
  }
  for (const row of report.summary) {
    const relevant = report.attempts.filter(attempt => attempt.config.friction === row.friction && attempt.variant === row.variant);
    assert.equal(row.attempted, relevant.length);
    assert.equal(row.valid, relevant.filter(attempt => attempt.valid).length);
    assert.equal(row.success, relevant.filter(attempt => attempt.valid && attempt.success).length);
    assert.equal(row.failed_or_invalid, relevant.length - row.success);
  }
  const counts = friction => variants.map(variant => report.summary.find(row => row.friction === friction && row.variant === variant).success);
  assert.deepEqual(counts(.8), [2, 0, 2, 0, 0]);
  assert.deepEqual(counts(.55), [2, 0, 0, 0, 0], "Keep the guarded completion regression");
  assert.deepEqual(counts(.15), [0, 0, 0, 0, 0]);
  const guarded = report.attempts.filter(row => row.variant === "guarded_placement");
  assert.equal(guarded.reduce((sum, row) => sum + row.grip_guard.acquisition_qualification_count, 0), 4);
  assert.equal(guarded.reduce((sum, row) => sum + row.grip_evaluation.qualification_decisions.filter(d => d.following_observed).length, 0), 4);
  const moderate = guarded.filter(row => row.config.friction === .55);
  for (const row of moderate) {
    const end = attempts.get(row.result_file).trajectory.at(-1);
    assert.equal(row.success, false);
    assert.equal(row.grip_guard.aborted, true);
    assert.equal(row.grip_evaluation.sampled_drop_events, 1);
    assert.ok(end.grasp_contact_counts.left > 0 && end.grasp_contact_counts.right > 0, "Proxy loss is not a verified block drop");
    assert.equal(end.table_object_contact_count, 0);
  }
  for (const row of guarded.filter(row => row.config.friction === .15)) {
    assert.equal(row.grip_guard.retry_count, 1);
    assert.equal(row.grip_guard.acquisition_qualification_count, 0);
    assert.equal(row.grip_evaluation.following_opportunity, false);
    assert.equal(row.success, false, "A performed retry must not become a successful recovery");
  }
  const alarms = guarded.flatMap(row => row.grip_evaluation.alarms);
  assert.equal(alarms.length, 6);
  assert.ok(alarms.every(alarm => alarm.sampled_loss_to_alarm_delay_s === null && alarm.no_preceding_sampled_loss_opportunity));
  assert.ok(alarms.every(alarm => alarm.post_alarm_window_complete));
});

test("Publication exposes the regression, full receipt and separately scoped execution record", async () => {
  const [paper, readme, homepage, execution, catalog] = await Promise.all([
    readFile(resolve(ROOT, "reports/PiPER grip validation and recovery.md"), "utf8"),
    readFile(resolve(RUN, "README.md"), "utf8"), readFile(resolve(ROOT, "scripts/build-papers.mjs"), "utf8"),
    readFile(resolve(RUN, "execution.json"), "utf8"), readFile(resolve(ROOT, "publications.json"), "utf8")
  ]);
  assert.ok(paper.includes(SOURCE));
  assert.ok(!/__[A-Z_]+__/.test(paper), "No draft placeholders may be published");
  assert.match(paper, /regresses completion at moderate friction: baseline 2\/2, guarded 0\/2/i);
  assert.match(paper, /neither a successful recovery nor an overall completion improvement/i);
  assert.match(paper, /not two verified physical drops/i);
  assert.ok(homepage.includes("papers/piper-grip-validation-and-recovery/index.html"));
  assert.match(readme, /complete, byte-identical 36-file benchmark bundle/i);
  assert.match(readme, /outside the original bundle seal/i);
  const wrapper = JSON.parse(execution);
  assert.equal(wrapper.source_commit, SOURCE);
  assert.equal(wrapper.returncode, 0);
  assert.ok(wrapper.execution.includes("network denial"));
  assert.equal(wrapper.seed, 731209);
  const publication = JSON.parse(catalog).publications.find(row => row.slug === "piper-grip-validation-and-recovery");
  assert.ok(publication.status.includes("regression"));
  assert.ok(publication.abstract.includes("baseline completes 2/2 and guarded completes 0/2"));
});
