import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { inflateRawSync } from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RUN = resolve(ROOT, "topics/physical-grounding/runs/2026-10-08-footage-pipeline-v1");
const SPLITS = ["train", "dev", "test"];
const files = new Map(), documents = new Map(), archives = new Map(), datasets = new Map();
const hashes = new WeakMap();
const sha = bytes => {
  if (Buffer.isBuffer(bytes) && hashes.has(bytes)) return hashes.get(bytes);
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (Buffer.isBuffer(bytes)) hashes.set(bytes, digest);
  return digest;
};
function safe(name) {
  assert.ok(typeof name === "string" && name && !name.includes("\\") && !name.includes(":"), name);
  assert.ok(name.split("/").every(part => part && part !== "." && part !== ".."), name);
  const path = resolve(RUN, name);
  assert.ok(path.startsWith(RUN + sep), name);
  return path;
}
const bytes = name => {
  if (!files.has(name)) files.set(name, readFile(safe(name)));
  return files.get(name);
};

// Published hashes use Python's sorted compact JSON. Retain original finite
// numeric tokens: JSON.stringify would turn 15.0 into 15 and 1e-06 into 0.000001.
function tree(raw) {
  const source = raw.toString("utf8"); JSON.parse(source); let offset = 0;
  const skip = () => { while (/\s/.test(source[offset] ?? "x")) offset++; };
  const string = () => {
    const start = offset++;
    while (offset < source.length) {
      const char = source[offset++];
      if (char === "\\") offset++;
      else if (char === '"') break;
    }
    const value = JSON.parse(source.slice(start, offset));
    return { text: JSON.stringify(value).replace(/[\u007f-\uffff]/g, c => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`), value };
  };
  const parse = () => {
    skip();
    if (source[offset] === '"') return string();
    if (source[offset] === "{") {
      offset++; skip(); const fields = new Map();
      if (source[offset] !== "}") while (true) {
        const key = string(); skip(); assert.equal(source[offset++], ":");
        assert.ok(!fields.has(key.value), `Duplicate JSON key: ${key.value}`);
        fields.set(key.value, parse()); skip();
        if (source[offset] !== ",") break;
        offset++; skip();
      }
      assert.equal(source[offset++], "}"); return object(fields);
    }
    if (source[offset] === "[") {
      offset++; skip(); const elements = [];
      if (source[offset] !== "]") while (true) {
        elements.push(parse()); skip();
        if (source[offset] !== ",") break;
        offset++;
      }
      assert.equal(source[offset++], "]"); return array(elements);
    }
    const token = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(source.slice(offset))?.[0];
    assert.ok(token, `Unexpected JSON token at ${offset}`); offset += token.length;
    if (!/^(true|false|null)$/.test(token)) assert.ok(Number.isFinite(Number(token)));
    return { text: token };
  };
  const result = parse(); skip(); assert.equal(offset, source.length); return result;
}
function object(fields) {
  return { fields, text: `{${[...fields].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([name, node]) => `${JSON.stringify(name)}:${node.text}`).join(",")}}` };
}
const array = elements => ({ elements, text: `[${elements.map(node => node.text).join(",")}]` });
const literal = value => ({ text: JSON.stringify(value) });
const field = (node, name) => { assert.ok(node.fields?.has(name), `Missing field: ${name}`); return node.fields.get(name); };
const select = (node, names) => object(new Map(names.map(name => [name, field(node, name)])));
const without = (node, names) => object(new Map([...node.fields].filter(([name]) => !names.includes(name))));
const digest = node => sha(node.text);
const document = name => {
  if (!documents.has(name)) documents.set(name, bytes(name).then(raw => ({ bytes: raw, data: JSON.parse(raw), tree: tree(raw) })));
  return documents.get(name);
};

// Read bounded data archives in memory. Never extract, import or execute them.
function zipEntries(raw) {
  assert.ok(raw.length <= 64 * 1024 * 1024);
  let end = raw.length - 22;
  while (end >= Math.max(0, raw.length - 65557) && raw.readUInt32LE(end) !== 0x06054b50) end--;
  assert.ok(end >= 0, "Missing ZIP directory");
  assert.equal(raw.readUInt16LE(end + 4), 0); assert.equal(raw.readUInt16LE(end + 6), 0);
  const count = raw.readUInt16LE(end + 10), central = raw.readUInt32LE(end + 16);
  assert.ok(count > 0 && count < 1000); assert.equal(raw.readUInt16LE(end + 8), count);
  assert.equal(central + raw.readUInt32LE(end + 12), end);
  assert.equal(end + 22 + raw.readUInt16LE(end + 20), raw.length);
  const entries = new Map(); let offset = central, expandedTotal = 0;
  for (let index = 0; index < count; index++) {
    assert.equal(raw.readUInt32LE(offset), 0x02014b50);
    const flags = raw.readUInt16LE(offset + 8), method = raw.readUInt16LE(offset + 10);
    const compressed = raw.readUInt32LE(offset + 20), expanded = raw.readUInt32LE(offset + 24);
    const namesize = raw.readUInt16LE(offset + 28), extra = raw.readUInt16LE(offset + 30), comment = raw.readUInt16LE(offset + 32);
    const local = raw.readUInt32LE(offset + 42), mode = raw.readUInt32LE(offset + 38) >>> 16;
    const name = raw.subarray(offset + 46, offset + 46 + namesize).toString("utf8");
    safe(name.endsWith("/") ? name.slice(0, -1) : name);
    assert.ok(!entries.has(name), `Duplicate archive entry: ${name}`);
    assert.equal(flags & 1, 0); assert.notEqual(mode & 0o170000, 0o120000, "Archive symlink");
    assert.ok(method === 0 || method === 8); assert.ok(expanded <= 8 * 1024 * 1024);
    expandedTotal += expanded; assert.ok(expandedTotal <= 64 * 1024 * 1024);
    assert.equal(raw.readUInt32LE(local), 0x04034b50);
    assert.equal(raw.readUInt16LE(local + 6), flags); assert.equal(raw.readUInt16LE(local + 8), method);
    const localName = raw.readUInt16LE(local + 26), localExtra = raw.readUInt16LE(local + 28);
    assert.equal(raw.subarray(local + 30, local + 30 + localName).toString("utf8"), name);
    const start = local + 30 + localName + localExtra;
    assert.ok(start + compressed <= central);
    const encoded = raw.subarray(start, start + compressed);
    const data = method === 0 ? encoded : inflateRawSync(encoded, { maxOutputLength: 8 * 1024 * 1024 });
    assert.equal(data.length, expanded); entries.set(name, data);
    offset += 46 + namesize + extra + comment;
  }
  assert.equal(offset, end); return entries;
}
const archive = name => {
  if (!archives.has(name)) archives.set(name, bytes(name).then(zipEntries));
  return archives.get(name);
};
const close = (a, b, tolerance = 1e-12) => assert.ok(Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance, `${a} != ${b}`);
const norm = values => Math.hypot(...values);
const distance = (a, b) => norm(a.map((x, i) => x - b[i]));

async function dataset(name) {
  if (!datasets.has(name)) datasets.set(name, (async () => {
    const [data, source, run, report, model, receipt] = await Promise.all([
      "dataset/dataset", "dataset/source_manifest", "run", "training/report", "training/model", "dataset-receipt"
    ].map(part => document(`${name}/${part}.json`)));
    const rows = data.data.episodes, splitIDs = Object.fromEntries(SPLITS.map(split => [split, rows.filter(row => row.split === split).map(row => row.id)]));
    assert.equal(data.data.kind, "dvidia.footage-dataset"); assert.equal(source.data.synthetic, true);
    assert.equal(source.data.license, "MIT"); assert.match(source.data.description, /no human footage/);
    assert.equal(rows.length, data.data.actual_media_episodes); assert.equal(new Set(rows.map(row => row.id)).size, rows.length);
    assert.deepEqual(data.data.splits, splitIDs); assert.ok(SPLITS.every(split => splitIDs[split].length));
    assert.equal(sha(source.bytes), data.data.source_manifest_sha256);
    assert.deepEqual(data.data.source_manifest, source.data);
    const identitySplits = new Map();
    for (const row of rows) {
      assert.ok(row.duration_seconds > 0 && row.fps > 0 && row.width > 0 && row.height > 0);
      assert.equal(row.task, data.data.task);
      const media = await bytes(`${name}/dataset/${row.media_path}`);
      assert.equal(sha(media), row.media_sha256); assert.equal(media.length, row.media_bytes);
      assert.equal(media.toString("ascii", 4, 8), "ftyp", "Fixture must be encoded MP4 rather than reference metadata");
      for (const key of ["group_id", "media_sha256", "source_recording_id", "session_id", "shoe_pair_id"]) {
        if (row[key] === null) continue;
        const identity = `${key}:${row[key]}`;
        if (identitySplits.has(identity)) assert.equal(identitySplits.get(identity), row.split, `Cross-split ${identity}`);
        identitySplits.set(identity, row.split);
      }
    }
    assert.equal(data.data.independent_groups, new Set(rows.map(row => row.group_id)).size);
    assert.equal(data.data.groups.length, data.data.independent_groups);
    for (const group of data.data.groups) {
      assert.deepEqual(group.episode_ids, rows.filter(row => row.group_id === group.id).map(row => row.id).sort());
      assert.ok(group.episode_ids.length && rows.filter(row => row.group_id === group.id).every(row => row.split === group.split));
    }
    for (const record of [report.data, model.data]) {
      assert.equal(record.dataset_sha256, sha(data.bytes)); assert.equal(record.source_manifest_sha256, sha(source.bytes));
      assert.equal(record.physical_robot_ready, false);
    }
    assert.deepEqual(model.data.training.train_episode_ids, splitIDs.train);
    assert.deepEqual(model.data.training.selection_episode_ids, splitIDs.dev);
    assert.deepEqual(report.data.parameters, model.data.training);
    assert.deepEqual(run.data.visual, report.data);
    assert.equal(run.data.capability.robot_skill_acquired, false); assert.equal(run.data.capability.physical_robot_ready, false);
    assert.equal(run.data.capability.visual_trained, true); assert.equal(run.data.environment.gpu_required, false);
    assert.equal(run.data.offline, true); assert.equal(data.data.capability.movement_ready, false);
    assert.equal(receipt.data.media_included, false); assert.equal(receipt.data.source_manifest_sha256, sha(source.bytes));
    assert.deepEqual(receipt.data.counts, run.data.counts);
    assert.equal(run.data.counts.episodes, rows.length);
    close(run.data.counts.total_seconds, rows.reduce((sum, row) => sum + row.duration_seconds, 0));
    for (const split of SPLITS) {
      assert.equal(run.data.counts[split], splitIDs[split].length);
      assert.equal(report.data.counts[split].episodes, splitIDs[split].length);
      assert.equal(report.data.counts[split].frames, splitIDs[split].length * model.data.training.frames_per_clip);
      if (split === "train") continue;
      const metrics = report.data[split]; assert.deepEqual(metrics.per_episode.map(row => row.episode_id), splitIDs[split]);
      assert.equal(metrics.transitions, metrics.per_episode.reduce((sum, row) => sum + row.transitions, 0));
      for (const key of ["learned_rgb_mse", "persistence_rgb_mse", "train_mean_rgb_mse", "learned_latent_mse"]) {
        assert.ok(metrics[key] >= 0); close(metrics[key], metrics.per_episode.reduce((sum, row) => sum + row[key] * row.transitions, 0) / metrics.transitions);
      }
    }
    const selected = [...report.data.selection].sort((a, b) => a.dev_rgb_mse - b.dev_rgb_mse || a.regularization - b.regularization)[0];
    assert.equal(model.data.training.regularization, selected.regularization);
    const arrays = await bytes(`${name}/training/visual_model.npz`);
    assert.equal(sha(arrays), model.data.arrays_sha256); assert.equal(sha(arrays), report.data.visual_model_arrays_sha256);
    return { data, source, run, report, model, receipt, splitIDs };
  })());
  return datasets.get(name);
}

test("footage release manifest binds bounded artifacts and explicit synthetic research scope", async () => {
  const manifest = (await document("manifest.json")).data, ledger = (await document("release-ledger.json")).data;
  assert.equal(manifest.schema_version, 1); assert.equal(manifest.kind, "dvidia.footage-pipeline-release");
  assert.ok(Array.isArray(manifest.files) && manifest.files.length > 20);
  assert.equal(new Set(manifest.files.map(row => row.path)).size, manifest.files.length);
  for (const row of manifest.files) {
    assert.notEqual(row.path, "manifest.json"); assert.match(row.sha256, /^[a-f0-9]{64}$/);
    const data = await bytes(row.path); assert.equal(data.length, row.bytes); assert.equal(sha(data), row.sha256, row.path);
  }
  async function inventory(directory = "") {
    const names = [];
    for (const entry of await readdir(resolve(RUN, directory), { withFileTypes: true })) {
      assert.ok(!entry.isSymbolicLink()); const name = directory ? `${directory}/${entry.name}` : entry.name;
      if (entry.isDirectory()) names.push(...await inventory(name)); else names.push(name);
    }
    return names;
  }
  assert.deepEqual(manifest.files.map(row => row.path).sort(), (await inventory()).filter(name => name !== "manifest.json").sort());
  assert.equal(ledger.repository, "https://github.com/Dvidia-Inference/dvidia-training");
  assert.match(ledger.source_commit, /^[a-f0-9]{40}$/); assert.equal(ledger.code_license, "MIT");
  assert.equal(ledger.footage_license, "MIT"); assert.equal(ledger.hardware_minimum_verified, false);
  assert.match(ledger.footage_origin, /synthetic.*no human or private footage/i);
  assert.match(ledger.pilot_scope, /one exact.*no physical robot/i);
  assert.ok(ledger.runs.some(row => row.status === "failed_export"), "Retain the reported integration failure");
});

for (const name of ["visual-training", "native-training"]) test(`${name} binds actual footage, train-only weights and disjoint development/test evidence`, async () => {
  const { run, report, data } = await dataset(name);
  assert.equal(report.data.scope, "visual-only"); assert.equal(report.data.robot_policy_trained, false);
  assert.equal(run.data.capability.movement_candidate_trained, name === "native-training");
  assert.equal(run.data.capability.simulation_capsule_exported, name === "native-training");
  assert.equal(data.data.capability.action_sidecars_present, name === "native-training" ? data.data.episodes.length : 0);
});

test("native movement hash reconstructs train-only telemetry and binds synthetic source evidence", async () => {
  const { data, source, run, splitIDs } = await dataset("native-training");
  const [head, report, capsule] = await Promise.all(["movement/movement_head", "movement/report", "candidate.skill-capsule"].map(part => document(`native-training/${part}.json`)));
  const original = await archive("native-skillspace.zip"), sampleNodes = [], trainingProvenance = [], counts = { train: 0, dev: 0, test: 0 }, trajectories = new Map();
  const wheel = await archive("release/dvidia_training-0.1.0-py3-none-any.whl");
  for (const row of data.data.episodes) {
    const sidecar = await document(`native-training/dataset/${row.actions_path}`);
    assert.equal(sha(sidecar.bytes), row.actions_sha256);
    assert.equal(sidecar.data.media_sha256, row.media_sha256);
    assert.equal(sidecar.data.feature_contract, head.data.feature_contract);
    assert.equal(sidecar.data.provenance.source_kind, "native-simulation-telemetry");
    const sourceRow = source.data.media.find(value => value.id === row.id); assert.ok(sourceRow);
    assert.equal(sha(original.get(sourceRow.path)), row.media_sha256);
    assert.equal(sha(original.get(sourceRow.actions_path)), row.actions_sha256);
    const evidenceBytes = original.get(`evidence/${row.id}.json`); assert.ok(evidenceBytes);
    const evidence = JSON.parse(evidenceBytes), validation = sidecar.data.provenance.validation;
    assert.equal(sha(evidenceBytes), validation.evidence_sha256);
    assert.equal(validation.samples_sha256, digest(field(sidecar.tree, "samples")));
    assert.equal(validation.status, "validated"); assert.equal(validation.scope, "simulation-only");
    assert.equal(evidence.scope, "simulation-only"); assert.equal(evidence.samples.length, sidecar.data.samples.length);
    for (const [name, hash] of Object.entries(evidence.source_files_sha256)) assert.equal(sha(wheel.get(`dvidia_training/${name}`)), hash);
    let previous = -1;
    for (const [index, sample] of sidecar.data.samples.entries()) {
      assert.ok(sample.timestamp_seconds > previous && sample.timestamp_seconds <= row.duration_seconds); previous = sample.timestamp_seconds;
      const recorded = evidence.samples[index]; assert.equal(recorded.timestamp_seconds, sample.timestamp_seconds);
      assert.equal(sample.context.length, 12); assert.equal(sample.error.length, 6); assert.equal(sample.delta.length, 6);
      for (let joint = 0; joint < 6; joint++) {
        close(sample.context[joint], Math.fround(recorded.observation.joint_position[joint]), 1e-7);
        close(sample.delta[joint], recorded.joint_targets[joint] - recorded.observation.joint_position[joint]);
      }
    }
    const trajectory = array(field(sidecar.tree, "samples").elements.map(node => select(node, ["context", "error", "delta"])));
    const identity = digest(trajectory);
    if (trajectories.has(identity)) assert.equal(trajectories.get(identity), row.split, "Reencoded motor trajectory crossed splits");
    trajectories.set(identity, row.split); counts[row.split] += sidecar.data.samples.length;
    const provenance = object(new Map([["episode_id", literal(row.id)], ["split", literal(row.split)], ["actions_sha256", literal(row.actions_sha256)], ...field(sidecar.tree, "provenance").fields]));
    if (row.split === "train") {
      trainingProvenance.push(provenance);
      sampleNodes.push(...field(sidecar.tree, "samples").elements.map(node => object(new Map([
        ...select(node, ["context", "error", "delta"]).fields, ["case_id", literal(row.id)]
      ]))));
    }
  }
  const training = object(new Map([["kind", literal("dvidia.footage-aligned-movement-training")], ["schema_version", literal(1)],
    ["feature_contract", field(head.tree, "feature_contract")], ["source_dataset_sha256", literal(sha(data.bytes))],
    ["scene_ids", literal(splitIDs.train)], ["samples", array(sampleNodes)], ["source_sidecars", array(trainingProvenance)]]));
  assert.equal(digest(training), head.data.dataset_sha256);
  assert.deepEqual(head.data.train_cases, splitIDs.train); assert.deepEqual(report.data.train_episode_ids, splitIDs.train);
  assert.equal(head.data.training.sample_count, counts.train); assert.deepEqual(head.data.training, report.data.training);
  assert.equal(report.data.dataset_sha256, sha(data.bytes)); assert.equal(report.data.movement_head_sha256, digest(head.tree));
  assert.deepEqual(run.data.movement, report.data); assert.equal(report.data.capability.closed_loop_qualified, false);
  for (const split of SPLITS) { assert.equal(report.data.counts[split].samples, counts[split]); assert.equal(report.data.counts[split].episodes, splitIDs[split].length); }
  const selected = [...report.data.selection].sort((a, b) => a.dev_joint_delta_mse - b.dev_joint_delta_mse || a.regularization - b.regularization)[0];
  assert.equal(head.data.training.regularization, selected.regularization);
  assert.equal(head.data.status, "candidate"); assert.equal(head.data.physical_robot_ready, false);
  assert.equal(capsule.data.status, "candidate"); assert.equal(capsule.data.physical_robot_ready, false);
  assert.deepEqual(capsule.data.movement_head, head.data); assert.equal(capsule.data.provenance.evaluation, null);
  assert.equal(capsule.data.provenance.dataset.sha256, digest(training));
  assert.equal(capsule.data.provenance.training.movement_head_sha256, digest(head.tree));
  assert.equal(capsule.data.payload_sha256, digest(without(capsule.tree, ["payload_sha256"])));
});

test("downloaded numerical results contain data only and retain exact metric and model bindings", async () => {
  for (const name of ["visual-training", "native-training"]) {
    const { run, model } = await dataset(name), entries = await archive(`${name}/training-result.zip`);
    const manifest = (await document(`${name}/export-manifest.json`)).data;
    assert.equal(manifest.physical_robot_ready, false);
    assert.deepEqual([...entries.keys()].sort(), [...Object.keys(manifest.files), "export-manifest.json"].sort());
    assert.deepEqual(Object.keys(run.data.artifacts).sort(), Object.keys(manifest.files).filter(value => value !== "run.json").sort());
    for (const [path, receipt] of Object.entries(manifest.files)) {
      assert.match(path, /\.(json|npz)$/); const data = entries.get(path); assert.ok(data);
      assert.equal(sha(data), receipt.sha256); assert.equal(data.length, receipt.bytes);
      assert.equal(sha(data), sha(await bytes(`${name}/${path}`)));
      if (path !== "run.json") assert.deepEqual(run.data.artifacts[path], receipt);
    }
    const numerical = zipEntries(entries.get("training/visual_model.npz"));
    assert.deepEqual([...numerical.keys()].sort(), ["basis.npy", "mean.npy", "transition.npy"]);
    for (const [filename, data] of numerical) {
      assert.equal(data.toString("latin1", 0, 6), "\x93NUMPY");
      const major = data[6]; assert.ok(major === 1 || major === 2);
      const start = major === 1 ? 10 : 12, headerSize = major === 1 ? data.readUInt16LE(8) : data.readUInt32LE(8);
      const header = data.toString("ascii", start, start + headerSize);
      assert.match(header, /'descr': '<f4'/); assert.match(header, /'fortran_order': False/);
      const shape = /'shape': \(([^)]*)\)/.exec(header)?.[1].split(",").map(value => value.trim()).filter(Boolean).map(Number);
      assert.deepEqual(shape, model.data.arrays[filename.slice(0, -4)].shape);
      assert.equal(data.length, start + headerSize + shape.reduce((a, b) => a * b, 1) * 4);
      for (let offset = start + headerSize; offset < data.length; offset += 4) assert.ok(Number.isFinite(data.readFloatLE(offset)) && Math.abs(data.readFloatLE(offset)) <= 1e6);
    }
  }
});

test("published candidate qualification is bound to its one held-out scene and identical-arm open-jaw control", async () => {
  const [capsule, run, controls, receipt, heldout] = await Promise.all([
    "native-training/candidate.skill-capsule.json", "qualification/run.json", "qualification/controls.json", "qualification/qualification.json", "heldout-scene.json"
  ].map(document));
  const { splitIDs } = await dataset("native-training"), source = await archive("native-skillspace.zip");
  assert.equal(splitIDs.test.length, 1);
  const evidence = JSON.parse(source.get(`evidence/${splitIDs.test[0]}.json`));
  assert.equal(evidence.seed, heldout.data.seed);
  // Recording coordinates were computed by index arithmetic; the separately
  // authored held-out JSON writes rounded decimal coordinates. Permit only
  // binary roundoff here; receipt-to-execution identity below remains exact.
  const recordedConfig = evidence.final_info.config, testedConfig = run.data.environment_config;
  assert.deepEqual(Object.keys(recordedConfig).sort(), Object.keys(testedConfig).sort());
  for (const key of Object.keys(recordedConfig)) {
    if (key === "object_position" || key === "target_position") {
      assert.equal(recordedConfig[key].length, testedConfig[key].length);
      recordedConfig[key].forEach((value, index) => close(value, testedConfig[key][index]));
    } else assert.deepEqual(recordedConfig[key], testedConfig[key]);
  }
  assert.deepEqual(receipt.data.scene, heldout.data); assert.equal(receipt.data.status, "validated_simulation_scene");
  assert.equal(receipt.data.scope, "simulation-only"); assert.equal(receipt.data.physical_robot_ready, false);
  assert.equal(receipt.data.capsule_payload_sha256, capsule.data.payload_sha256);
  assert.equal(receipt.data.receipt_sha256, digest(without(receipt.tree, ["receipt_sha256"])));
  assert.equal(receipt.data.result_sha256, digest(without(run.tree, ["local_qualification"])));
  assert.equal(receipt.data.control_result_sha256, digest(controls.tree));
  assert.equal(receipt.data.scene_sha256, digest(field(receipt.tree, "scene")));
  assert.equal(receipt.data.runtime_sha256, digest(field(run.tree, "runtime")));
  assert.deepEqual(run.data.runtime, capsule.data.runtime); assert.deepEqual(controls.data.runtime, run.data.runtime);
  assert.deepEqual(run.data.local_qualification, receipt.data); assert.equal(run.data.qualification_scope, "one exact simulated scene");
  assert.equal(sha(capsule.data.source.text), capsule.data.source.sha256);
  assert.equal(sha(await bytes("qualification/source.json")), capsule.data.source.sha256);
  assert.deepEqual(controls.data.environment_config, run.data.environment_config); assert.deepEqual(controls.data.skill, run.data.skill);
  assert.equal(run.data.skill.robot_ready, false); assert.equal(run.data.skill.source_has_robot_policy, false);
  assert.equal(capsule.data.compatibility.independent_commands, 7);
  assert.equal(capsule.data.compatibility.observation_origin, "privileged_native_simulator_state");
  const student = run.data.episodes[0], control = controls.data.episodes[0], config = run.data.environment_config;
  assert.equal(run.data.episodes.length, 1); assert.equal(controls.data.episodes.length, 1);
  assert.equal(student.policy, "distilled_placement"); assert.equal(control.policy, "replay_open_jaw");
  assert.equal(student.seed, heldout.data.seed); assert.equal(control.seed, student.seed);
  assert.equal(student.success, true); assert.equal(control.success, false); assert.equal(control.reason, "horizon");
  assert.equal(student.final_info.valid, true); assert.equal(control.final_info.valid, true);
  assert.deepEqual(student.final_info.warnings, []); assert.deepEqual(control.final_info.warnings, []);
  assert.equal(student.controller_diagnostics.teacher_fallback_calls, 0);
  assert.equal(student.controller_diagnostics.student_inference_calls, student.control_steps);
  assert.equal(student.controller_diagnostics.movement_head_sha256, digest(field(capsule.tree, "movement_head")));
  assert.equal(student.final_info.grasp_seen, true); assert.equal(student.final_info.lift_seen, true);
  assert.ok(student.final_info.max_object_lift >= .055 && student.final_info.dwell_elapsed >= config.dwell_seconds);
  assert.equal(student.actions.length, student.control_steps); assert.equal(student.trace.length, student.control_steps + 1);
  assert.equal(control.actions.length, control.control_steps); assert.equal(control.trace.length, control.control_steps + 1);
  const terminal = student.trace.at(-1);
  assert.deepEqual(terminal.grasp_contacts, { left: 0, right: 0 }); assert.ok(terminal.table_contacts > 0 && terminal.gripper_width > .055);
  assert.ok(distance(terminal.object_position, config.target_position) <= config.position_tolerance);
  assert.ok(Math.abs(terminal.object_position[2] - config.target_position[2]) < .008);
  assert.ok(terminal.end_effector_position[2] >= terminal.object_position[2] + .10);
  assert.ok(norm(terminal.object_velocity) < .035 && norm(terminal.object_angular_velocity) < .3);
  assert.ok(student.trace.some(row => row.grasp_contacts.left > 0 && row.grasp_contacts.right > 0 && row.table_contacts === 0
    && row.object_position[2] - student.final_info.initial_object_position[2] >= .055));
  for (const [index, action] of control.actions.entries()) {
    const actual = student.actions[Math.min(index, student.actions.length - 1)];
    assert.deepEqual(action.action.joint_targets, actual.action.joint_targets); assert.equal(action.stage, actual.stage);
    assert.equal(action.action.gripper_width, .08);
  }
  for (const result of [run, controls]) {
    assert.equal(result.data.network_guard.guard_self_test_passed, true); assert.deepEqual(result.data.network_guard.attempted_calls, []);
    assert.match(result.data.network_guard.scope, /not native C/);
  }
  const wheel = await archive("release/dvidia_training-0.1.0-py3-none-any.whl"), code = await archive("release/dvidia-training-v0.1.zip");
  for (const [name, hash] of Object.entries(capsule.data.runtime.files_sha256)) {
    assert.equal(sha(wheel.get(`dvidia_training/${name}`)), hash, `Wheel runtime ${name}`);
    assert.equal(sha(code.get(`dvidia-training/src/dvidia_training/${name}`)), hash, `Source runtime ${name}`);
  }
});

test("CPU benchmark stays scoped to repeated synthetic footage and Python-only memory", async () => {
  const benchmark = (await document("cpu-benchmark.json")).data, { report, run } = await dataset("visual-training");
  assert.equal(benchmark.scope, "synthetic-software-throughput"); assert.equal(benchmark.gpu_used, false);
  assert.equal(benchmark.trials.length, 3); assert.equal(new Set(benchmark.trials.map(row => row.repeat)).size, 3);
  assert.ok(benchmark.python_process_lifetime_peak_rss_bytes > 0);
  assert.match(benchmark.limits.join(" "), /excludes FFmpeg\/ffprobe child processes/);
  assert.match(benchmark.limits.join(" "), /not independent success evidence/);
  assert.match(benchmark.limits.join(" "), /not total memory or a minimum/);
  for (const trial of benchmark.trials) {
    assert.deepEqual(trial.counts, run.data.counts); assert.equal(trial.gpu_required, false);
    assert.ok(trial.pipeline_wall_seconds >= trial.pipeline_report_seconds && trial.integrity_inspection_seconds > 0);
    close(trial.test_rgb_mse, report.data.test.learned_rgb_mse);
    close(trial.persistence_rgb_mse, report.data.test.persistence_rgb_mse);
  }
});
