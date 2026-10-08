import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { inflateRawSync } from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ARCHIVE = resolve(ROOT, "topics/physical-grounding/runs/2026-10-07-skill-capsule-v1");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const vectorLength = values => Math.hypot(...values);
const distance = (left, right) => vectorLength(left.map((value, index) => value - right[index]));

function pathIn(root, name) {
  assert.ok(typeof name === "string" && name.length > 0 && !name.includes("\\") && !name.includes(":"), name);
  assert.ok(name.split("/").every(part => part && part !== "." && part !== ".."), name);
  const path = resolve(root, name);
  assert.ok(path.startsWith(`${root}${sep}`), name);
  return path;
}

// These published identities use Python json.dumps, not RFC 8785. Preserve the
// authored numeric tokens (notably 50.0 versus 50 and exponent formatting), while
// sorting object fields and removing whitespace outside quoted strings.
function canonicalTree(bytes, retainArrays = false) {
  const source = bytes.toString("utf8");
  JSON.parse(source);
  let offset = 0;
  const skip = () => { while (/\s/.test(source[offset] ?? "x")) offset++; };
  const string = () => {
    const start = offset++;
    while (offset < source.length) {
      const char = source[offset++];
      if (char === "\\") offset++;
      else if (char === '"') break;
    }
    const value = JSON.parse(source.slice(start, offset));
    const text = JSON.stringify(value).replace(/[\u007f-\uffff]/g, char => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`);
    return { text, value };
  };
  const parse = () => {
    skip();
    if (source[offset] === '"') return string();
    if (source[offset] === "{") {
      offset++; skip();
      const fields = new Map();
      if (source[offset] !== "}") {
        while (true) {
          const key = string(); skip(); assert.equal(source[offset++], ":");
          assert.ok(!fields.has(key.value), `Duplicate key: ${key.value}`);
          fields.set(key.value, { key: key.text, node: parse() }); skip();
          if (source[offset] !== ",") break;
          offset++; skip();
        }
      }
      assert.equal(source[offset++], "}");
      const text = `{${[...fields].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([, entry]) => `${entry.key}:${entry.node.text}`).join(",")}}`;
      return { text, fields };
    }
    if (source[offset] === "[") {
      offset++; skip(); const entries = [], elements = [];
      if (source[offset] !== "]") {
        while (true) {
          const node = parse(); entries.push(node.text);
          if (retainArrays) elements.push(node);
          skip();
          if (source[offset] !== ",") break;
          offset++;
        }
      }
      assert.equal(source[offset++], "]");
      return { text: `[${entries.join(",")}]`, ...(retainArrays ? { elements } : {}) };
    }
    const token = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(source.slice(offset))?.[0];
    assert.ok(token, `Unexpected token at ${offset}`); offset += token.length;
    if (!/^(true|false|null)$/.test(token)) assert.ok(Number.isFinite(Number(token)));
    return { text: token };
  };
  const tree = parse(); skip(); assert.equal(offset, source.length);
  return tree;
}

const canonicalHash = tree => sha(tree.text);
function without(tree, names) {
  assert.ok(tree.fields);
  return { text: `{${[...tree.fields].filter(([name]) => !names.includes(name)).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([, entry]) => `${entry.key}:${entry.node.text}`).join(",")}}` };
}
const field = (tree, name) => {
  assert.ok(tree.fields?.has(name), `Missing field: ${name}`);
  return tree.fields.get(name).node;
};
async function document(name) {
  const bytes = await readFile(pathIn(ARCHIVE, name));
  return { bytes, data: JSON.parse(bytes), tree: canonicalTree(bytes, name === "benchmark/protocol.json") };
}
async function runtimeFiles(runtime) {
  assert.deepEqual(runtime.dependencies, { mujoco: "3.15.0", numpy: "2.5.3" });
  assert.equal(runtime.kind, "hybrid-distilled-placement-runtime");
  assert.equal(Object.keys(runtime.files_sha256).length, 10);
  for (const [name, digest] of Object.entries(runtime.files_sha256)) {
    assert.match(digest, /^[a-f0-9]{64}$/);
    assert.equal(sha(await readFile(pathIn(ARCHIVE, `simlab/${name}`))), digest, name);
  }
}

function successGate(episode, config, headDigest) {
  const info = episode.final_info;
  assert.equal(episode.success, true);
  assert.equal(episode.reason, "success");
  assert.equal(info.success, true); assert.equal(info.valid, true);
  assert.deepEqual(info.warnings, []);
  assert.equal(info.qualification, "simulation-only");
  assert.equal(info.observations, "privileged simulator state");
  assert.equal(info.grasp_seen, true); assert.equal(info.lift_seen, true);
  assert.ok(info.max_object_lift >= .055);
  assert.ok(info.dwell_elapsed >= config.dwell_seconds);
  assert.ok(info.target_distance <= config.position_tolerance);
  assert.ok(info.table_contacts > 0);
  assert.deepEqual(info.grasp_contacts, { left: 0, right: 0 });
  const diagnostics = episode.controller_diagnostics ?? episode.policy_diagnostics;
  if (headDigest) {
    assert.equal(diagnostics.movement_head_sha256, headDigest);
    assert.equal(diagnostics.teacher_fallback_calls, 0);
    assert.equal(diagnostics.student_inference_calls, episode.control_steps);
  }
  if (!episode.trace) return;
  assert.equal(episode.actions.length, episode.control_steps);
  assert.equal(episode.trace.length, episode.control_steps + 1);
  const terminal = episode.trace.at(-1);
  assert.deepEqual(terminal.grasp_contacts, { left: 0, right: 0 });
  assert.ok(terminal.gripper_width > .055 && terminal.gripper_width <= .08000001);
  assert.ok(terminal.table_contacts > 0);
  assert.ok(terminal.end_effector_position[2] >= terminal.object_position[2] + .10 - 1e-8);
  assert.ok(Math.abs(terminal.object_position[2] - config.target_position[2]) < .008);
  assert.ok(distance(terminal.object_position, config.target_position) <= config.position_tolerance);
  assert.ok(vectorLength(terminal.object_velocity) < .035);
  assert.ok(vectorLength(terminal.object_angular_velocity) < .3);
  assert.equal(terminal.time, episode.simulated_seconds);
  assert.equal(info.simulation_time, episode.simulated_seconds);
  assert.ok(episode.trace.some(row => row.grasp_contacts.left > 0 && row.grasp_contacts.right > 0
    && row.table_contacts === 0 && row.object_position[2] - info.initial_object_position[2] >= .055));
}

test("published capsule binds its actual model, source and installed runtime without hardware claims", async () => {
  const capsule = await document("simlab/placement_candidate.skill.json");
  const model = await document("benchmark/model.json");
  assert.equal(capsule.bytes.length, 39845);
  assert.equal(capsule.data.format, "dvidia.skill-capsule");
  assert.equal(capsule.data.scope, "simulation-only");
  assert.equal(capsule.data.status, "candidate");
  assert.equal(capsule.data.physical_robot_ready, false);
  assert.equal(canonicalHash(without(capsule.tree, ["payload_sha256"])), capsule.data.payload_sha256);
  assert.equal(sha(capsule.data.source.text), capsule.data.source.sha256);
  assert.deepEqual(capsule.data.movement_head, model.data);
  assert.equal(canonicalHash(field(capsule.tree, "movement_head")), canonicalHash(model.tree));
  assert.equal(model.data.centers.length, 32);
  assert.equal(model.data.training.sample_count, 6344);
  assert.equal(model.data.training.algorithm, "normalized-rbf-ridge");
  assert.equal(model.data.physical_robot_ready, false);
  assert.equal(capsule.data.provenance.evaluation, null);
  assert.equal(capsule.data.provenance.dataset.sha256, model.data.dataset_sha256);
  assert.equal(capsule.data.provenance.training.movement_head_sha256, canonicalHash(model.tree));
  assert.equal(capsule.data.compatibility.observation_origin, "privileged_native_simulator_state");
  assert.equal(capsule.data.compatibility.independent_commands, 7);
  assert.equal(capsule.data.compatibility.physical_robot_joints, 8);
  await runtimeFiles(capsule.data.runtime);
});

test("published training, selection and evaluation preserve exact sources and disjoint native scenes", async () => {
  const names = ["bindings", "protocol", "dataset", "model", "training", "selection", "evaluate", "evaluation-started", "profiling", "collection"];
  const docs = Object.fromEntries(await Promise.all(names.map(async name => [name, await document(`benchmark/${name}.json`)])));
  const bindings = docs.bindings.data;
  for (const [name, digest] of Object.entries(bindings.files_sha256)) assert.equal(sha(await readFile(pathIn(ARCHIVE, `benchmark/${name}`))), digest, name);
  for (const [key, name] of [["protocol", "protocol"], ["dataset", "dataset"], ["movement_head", "model"], ["evaluation", "evaluate"]]) {
    assert.equal(canonicalHash(docs[name].tree), bindings.canonical_document_hashes[key], key);
  }
  for (const [name, digest] of Object.entries(bindings.frozen_experiment_source_sha256)) {
    assert.equal(sha(await readFile(pathIn(ARCHIVE, `benchmark/frozen-sources/${name}`))), digest, name);
    assert.equal(sha(await readFile(pathIn(ARCHIVE, `simlab/${name}`))), digest, name);
  }
  for (const [name, digest] of Object.entries(bindings.dataset_collector_source_sha256)) {
    const path = name === "arm_distill.py" ? `benchmark/collection-source/${name}` : `benchmark/frozen-sources/${name}`;
    assert.equal(sha(await readFile(pathIn(ARCHIVE, path))), digest, name);
  }
  const protocol = docs.protocol.data;
  assert.equal(protocol.development.length, 16); assert.equal(protocol.selection.length, 4); assert.equal(protocol.evaluation.length, 8);
  assert.equal(protocol.rules.teacher_fallback, "none");
  const groups = [protocol.development, protocol.selection, protocol.evaluation];
  const all = groups.flat();
  assert.equal(new Set(all.map(row => row.id)).size, 28);
  assert.equal(new Set(all.map(row => row.scene_sha256)).size, 28);
  assert.equal(new Set(all.map(row => JSON.stringify(row.config))).size, 28);
  for (const group of ["development", "selection", "evaluation"]) {
    for (const [index, row] of protocol[group].entries()) {
      const configTree = field(field(docs.protocol.tree, group).elements[index], "config");
      assert.equal(canonicalHash(configTree), row.scene_sha256, row.id);
    }
  }
  assert.deepEqual(docs.dataset.data.scene_ids, protocol.development.map(row => row.id));
  assert.deepEqual(docs.dataset.data.scene_sha256, protocol.development.map(row => row.scene_sha256));
  assert.deepEqual(docs.model.data.train_cases, docs.dataset.data.scene_ids);
  assert.equal(docs.dataset.data.samples.length, 6344);
  assert.ok(docs.dataset.data.samples.every(row => docs.dataset.data.scene_ids.includes(row.case_id)
    && row.context.length === 12 && row.error.length === 6 && row.delta.length === 6));
  assert.equal(docs.dataset.data.protocol_sha256, canonicalHash(docs.protocol.tree));
  assert.deepEqual(docs.dataset.data.teacher_files_sha256, bindings.dataset_collector_source_sha256);
  assert.deepEqual(docs["evaluation-started"].data.source_hashes, bindings.frozen_experiment_source_sha256);
  for (const name of ["training", "selection", "evaluate", "evaluation-started", "profiling"]) {
    assert.equal(docs[name].data.movement_head_sha256, canonicalHash(docs.model.tree), name);
    if (docs[name].data.protocol_sha256) assert.equal(docs[name].data.protocol_sha256, canonicalHash(docs.protocol.tree), name);
    if (docs[name].data.source_hashes) assert.deepEqual(docs[name].data.source_hashes, bindings.frozen_experiment_source_sha256, name);
  }
  assert.equal(docs.training.data.dataset_sha256, canonicalHash(docs.dataset.tree));
  for (const [name, scenes, count] of [["selection", protocol.selection, 4], ["evaluate", protocol.evaluation, 7]]) {
    const result = docs[name].data;
    assert.equal(result.training_dataset_sha256, canonicalHash(docs.dataset.tree));
    assert.deepEqual(result.trials.map(row => row.id), scenes.map(row => row.id));
    assert.deepEqual(result.baseline_trials.map(row => row.id), scenes.map(row => row.id));
    assert.equal(result.summary.student_successes, count);
    assert.equal(result.summary.teacher_successes, count);
    assert.equal(result.trials.filter(row => row.success).length, count);
    assert.equal(result.baseline_trials.filter(row => row.success).length, count);
    for (const [index, student] of result.trials.entries()) {
      const teacher = result.baseline_trials[index];
      assert.equal(student.scene_sha256, scenes[index].scene_sha256);
      assert.equal(teacher.scene_sha256, student.scene_sha256);
      assert.equal(student.valid, true); assert.equal(teacher.valid, true);
      assert.equal(student.policy_diagnostics.teacher_fallback_calls, 0);
      const inferenceCalls = student.policy_diagnostics.student_inference_calls;
      assert.ok(Number.isInteger(inferenceCalls) && inferenceCalls >= 0 && inferenceCalls <= student.control_steps);
      if (student.success) assert.equal(inferenceCalls, student.control_steps);
      else {
        assert.equal(student.policy_diagnostics.phase, "failed");
        assert.equal(student.policy_diagnostics.failure_reason, "insufficient_jaw_force_for_static_load");
        assert.equal(inferenceCalls, 0);
        assert.equal(teacher.success, false);
        assert.equal(teacher.policy_diagnostics.failure_reason, student.policy_diagnostics.failure_reason);
      }
      assert.equal(student.policy_diagnostics.movement_head_sha256, canonicalHash(docs.model.tree));
      if (student.success) successGate(student, student.final_info.config, canonicalHash(docs.model.tree));
      if (teacher.success) successGate(teacher, teacher.final_info.config);
    }
  }
  assert.deepEqual(docs.profiling.data.paired, { both_failure: 1, both_success: 7, improved: 0, regressed: 0 });
  assert.equal(docs.profiling.data.fallback, "none");
  assert.ok(Object.values(docs.profiling.data.student.phase_profile).every(phase => phase.teacher_ik_calls === 0 && phase.teacher_ik_seconds === 0));
  assert.equal(docs.profiling.data.split_integrity.historical_v03_heldout_used, false);
});

async function qualified(directory) {
  const capsule = await document("simlab/placement_candidate.skill.json");
  const [run, controls, receipt] = await Promise.all(["run", "controls", "qualification"].map(name => document(`${directory}/${name}.json`)));
  assert.equal(receipt.data.status, "validated_simulation_scene");
  assert.equal(receipt.data.scope, "simulation-only"); assert.equal(receipt.data.physical_robot_ready, false);
  assert.equal(receipt.data.capsule_payload_sha256, capsule.data.payload_sha256);
  assert.equal(receipt.data.receipt_sha256, canonicalHash(without(receipt.tree, ["receipt_sha256"])));
  assert.equal(receipt.data.runtime_sha256, canonicalHash(field(run.tree, "runtime")));
  assert.equal(receipt.data.scene_sha256, canonicalHash(field(receipt.tree, "scene")));
  assert.equal(receipt.data.result_sha256, canonicalHash(without(run.tree, ["local_qualification"])));
  assert.equal(receipt.data.control_result_sha256, canonicalHash(controls.tree));
  await runtimeFiles(run.data.runtime); assert.deepEqual(controls.data.runtime, run.data.runtime);
  assert.deepEqual(run.data.local_qualification, receipt.data);
  assert.equal(run.data.capsule_sha256, capsule.data.payload_sha256);
  assert.equal(run.data.movement_head_sha256, canonicalHash(field(capsule.tree, "movement_head")));
  assert.equal(sha(await readFile(pathIn(ARCHIVE, `${directory}/source.json`))), capsule.data.source.sha256);
  const student = run.data.episodes[0], control = controls.data.episodes[0];
  successGate(student, run.data.environment_config, run.data.movement_head_sha256);
  assert.equal(control.success, false); assert.equal(control.reason, "horizon");
  assert.equal(control.final_info.valid, true); assert.deepEqual(control.final_info.warnings, []);
  assert.equal(control.actions.length, 900);
  assert.equal(control.trace.length, 901);
  for (const [index, row] of control.actions.entries()) {
    const wanted = student.actions[Math.min(index, student.actions.length - 1)];
    assert.equal(row.stage, wanted.stage);
    assert.deepEqual(row.action.joint_targets, wanted.action.joint_targets);
    assert.equal(row.action.gripper_width, .08);
  }
  return run.data;
}

test("published 60g acquisition retains exact-scene contact qualification and repeat execution", async () => {
  const first = await qualified("demo");
  const repeat = (await document("demo-repeat/run.json")).data;
  assert.equal(first.environment_config.object_mass, .06);
  assert.deepEqual(repeat.environment_config, first.environment_config);
  assert.equal(repeat.installation_id, first.installation_id);
  assert.equal(repeat.capsule_sha256, first.capsule_sha256);
  assert.equal(repeat.qualification_scope, "one exact simulated scene");
  await runtimeFiles(repeat.runtime);
  successGate(repeat.episodes[0], repeat.environment_config, repeat.movement_head_sha256);
  assert.deepEqual(repeat.episodes[0].actions, first.episodes[0].actions);
  assert.deepEqual(repeat.episodes[0].trace, first.episodes[0].trace);
  assert.deepEqual(repeat.episodes[0].final_info, first.episodes[0].final_info);
});

test("published native offline receipt proves installed execution under EPERM with a preserved repeat", async () => {
  const policy = (await document("native-offline/native-policy.json")).data;
  assert.equal(policy.passed, true); assert.equal(policy.physical_robot_ready, false);
  assert.deepEqual(policy.native_network_denial, { connection_return: -1, errno: 1, expected_errno: 1 });
  assert.equal(policy.student_success, true); assert.equal(policy.open_jaw_control_success, false);
  assert.equal(policy.repeat_success, true);
  const first = await qualified("native-offline/qualification");
  const repeat = (await document("native-offline/repeat/run.json")).data;
  assert.equal(policy.capsule_sha256, first.capsule_sha256);
  successGate(repeat.episodes[0], repeat.environment_config, repeat.movement_head_sha256);
  assert.deepEqual(repeat.episodes[0].actions, first.episodes[0].actions);
  assert.deepEqual(repeat.episodes[0].trace, first.episodes[0].trace);
  assert.deepEqual(repeat.episodes[0].final_info, first.episodes[0].final_info);
  for (const result of [first, repeat]) {
    assert.equal(result.network_guard.guard_self_test_passed, true);
    assert.deepEqual(result.network_guard.attempted_calls, []);
  }
});

// Read this bounded known release ZIP in memory; never extract or execute it.
function zipEntries(bytes) {
  assert.ok(bytes.length <= 128 * 1024 * 1024);
  let end = bytes.length - 22;
  while (end >= Math.max(0, bytes.length - 65557) && bytes.readUInt32LE(end) !== 0x06054b50) end--;
  assert.ok(end >= 0, "ZIP end-of-directory missing");
  assert.equal(bytes.readUInt16LE(end + 4), 0); assert.equal(bytes.readUInt16LE(end + 6), 0);
  const count = bytes.readUInt16LE(end + 10);
  assert.ok(count > 0 && count < 1000); assert.equal(bytes.readUInt16LE(end + 8), count);
  const centralSize = bytes.readUInt32LE(end + 12), centralOffset = bytes.readUInt32LE(end + 16);
  assert.equal(centralOffset + centralSize, end);
  assert.equal(end + 22 + bytes.readUInt16LE(end + 20), bytes.length);
  const entries = new Map(); let offset = centralOffset, total = 0;
  for (let index = 0; index < count; index++) {
    assert.equal(bytes.readUInt32LE(offset), 0x02014b50);
    const flags = bytes.readUInt16LE(offset + 8), method = bytes.readUInt16LE(offset + 10);
    const compressed = bytes.readUInt32LE(offset + 20), expanded = bytes.readUInt32LE(offset + 24);
    const nameLength = bytes.readUInt16LE(offset + 28), extraLength = bytes.readUInt16LE(offset + 30), commentLength = bytes.readUInt16LE(offset + 32);
    const localOffset = bytes.readUInt32LE(offset + 42);
    const name = bytes.subarray(offset + 46, offset + 46 + nameLength).toString("utf8");
    pathIn(ARCHIVE, name);
    assert.ok(!entries.has(name), `Duplicate ZIP member: ${name}`);
    assert.equal(flags & 1, 0, "Encrypted ZIP member");
    assert.ok(method === 0 || method === 8, `Unsupported ZIP method: ${method}`);
    assert.ok(expanded < 25 * 1024 * 1024); total += expanded; assert.ok(total <= 128 * 1024 * 1024);
    assert.equal(bytes.readUInt32LE(localOffset), 0x04034b50);
    assert.equal(bytes.readUInt16LE(localOffset + 6), flags); assert.equal(bytes.readUInt16LE(localOffset + 8), method);
    const localNameLength = bytes.readUInt16LE(localOffset + 26), localExtraLength = bytes.readUInt16LE(localOffset + 28);
    assert.equal(bytes.subarray(localOffset + 30, localOffset + 30 + localNameLength).toString("utf8"), name);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    assert.ok(start + compressed <= centralOffset);
    const encoded = bytes.subarray(start, start + compressed);
    const data = method === 0 ? encoded : inflateRawSync(encoded, { maxOutputLength: 25 * 1024 * 1024 });
    assert.equal(data.length, expanded);
    entries.set(name, data);
    offset += 46 + nameLength + extraLength + commentLength;
  }
  assert.equal(offset, end);
  return entries;
}

test("published release ZIP matches its public manifest, evidence and fresh reproduction receipt", async () => {
  const manifest = (await document("release/manifest.json")).data;
  const reproduced = (await document("release/reproduction.json")).data;
  const archive = await readFile(pathIn(ARCHIVE, "release/simlab-v0.4.zip"));
  const entries = zipEntries(archive);
  assert.equal(manifest.scope, "simulation-only");
  assert.equal(manifest.physical_robot_ready, false);
  assert.equal(reproduced.archive_sha256, sha(archive));
  assert.equal(reproduced.source_imported_from_extracted_bundle, true);
  assert.equal(reproduced.exact_control_steps_final_state_metrics_actions_trace_match, true);
  assert.equal(reproduced.preinstalled_dependencies, true);
  assert.equal(reproduced.physical_robot_ready, false);
  assert.equal(reproduced.qualification_status, "validated_simulation_scene");
  assert.equal(reproduced.student_success, true);
  assert.equal(reproduced.open_jaw_control_success, false);
  assert.equal(reproduced.repeat_success, true);
  assert.deepEqual(reproduced.native_network_denial, { connection_return: -1, errno: 1, expected_errno: 1 });
  assert.deepEqual(reproduced.runtime, manifest.runtime);
  assert.equal(reproduced.manifest_file_hashes_checked, Object.keys(manifest.files).length);
  for (const [name, digest] of Object.entries(manifest.files)) {
    assert.ok(entries.has(name), `Manifest ZIP member missing: ${name}`);
    assert.equal(sha(entries.get(name)), digest, name);
    assert.equal(sha(await readFile(pathIn(ARCHIVE, name))), digest, `Public copy differs: ${name}`);
  }
  assert.deepEqual(JSON.parse(entries.get("manifest.json")), manifest);
  assert.equal(entries.size, Object.keys(manifest.files).length + 1);
  for (const name of entries.keys()) assert.ok(!/(?:^|\/)(?:\.venv|__pycache__|research_notes|auth)(?:\/|$)/.test(name), name);
  for (const name of await readdir(ARCHIVE)) assert.ok(![".venv", "__pycache__", "research_notes"].includes(name), name);
});
