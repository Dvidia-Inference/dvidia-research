import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { gunzipSync } from "node:zlib";
import { renderMarkdown } from "./build-papers.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RUN = resolve(ROOT, "topics/physical-grounding/runs/2026-10-11-hardware-reference");
const REPLAY = resolve(RUN, "replay");
const JOINTS = ["shoulder_pan_joint", "shoulder_lift_joint", "elbow_joint",
  "wrist_1_joint", "wrist_2_joint", "wrist_3_joint"];
const cache = new Map();
const sha = bytes => createHash("sha256").update(bytes).digest("hex");

function safe(root, name) {
  assert.ok(typeof name === "string" && name && !/[\\:]/.test(name), name);
  assert.ok(name.split("/").every(part => part && part !== "." && part !== ".."), name);
  const path = resolve(root, name);
  assert.ok(path.startsWith(root + sep), name);
  return path;
}
function bytes(root, name) {
  const path = safe(root, name);
  if (!cache.has(path)) cache.set(path, readFile(path));
  return cache.get(path);
}
const json = async (root, name) => JSON.parse(await bytes(root, name));
const integer = (value, minimum = 0) => assert.ok(Number.isSafeInteger(value) && value >= minimum, String(value));

test("3D replay retains the exact frozen numerical receipt and simulation-only scope", async () => {
  for (const name of ["report.json", "report.html", "integrity.json"]) {
    assert.deepEqual(await bytes(REPLAY, `receipt/${name}`), await bytes(RUN, name), name);
  }
  const [report, scene, motion] = await Promise.all([
    json(RUN, "report.json"), json(REPLAY, "scene.json"), json(REPLAY, "motion.json")
  ]);
  assert.equal(report.physical_robot_ready, false);
  assert.equal(report.task_success_evaluated, false);
  assert.equal(scene.schema, "dvidia.reference-replay-scene/v1");
  assert.equal(motion.schema, "dvidia.reference-replay-motion/v1");
  assert.deepEqual(motion.arm_joint_names, JOINTS);
  assert.equal(scene.geoms.filter(row => row.collision).length, report.audit.inventory.collision_geom_count);
  assert.deepEqual(scene.source, motion.source);
  assert.equal(motion.source.profile, report.profile);
  assert.equal(motion.source.report_sha256, sha(await bytes(RUN, "report.json")));
  assert.equal(motion.source.asset_commit, report.audit.asset_provenance.commit);
  assert.equal(motion.source.asset_lock_sha256, report.audit.asset_provenance.lock_sha256);
  assert.deepEqual(motion.source.asset_licenses, {
    universal_robots_ur5e: "BSD-3-Clause", robotiq_2f85: "BSD-2-Clause"
  });
  for (const document of [scene, motion]) {
    assert.match(document.scope, /recorded/i);
    assert.match(document.scope, /no live physics/i);
    assert.match(document.scope, /no .*physical accuracy/i);
  }
  const expected = report.attempts.filter(row => row.valid && row.repeat === 0);
  assert.equal(expected.length, 9);
  assert.deepEqual(motion.cases.map(row => [row.name, row.timestep_seconds, row.repeat]),
    expected.map(row => [row.case, row.timestep_seconds, row.repeat]));
  for (const [index, replay] of motion.cases.entries()) {
    const original = expected[index];
    assert.equal(replay.frame_count, original.trajectory.length);
    assert.equal(motion.source.compiled_model_sha256[String(replay.timestep_seconds)], original.compiled_model_sha256);
    for (const [frame, row] of replay.rows.entries()) {
      for (const [field, value] of Object.entries(row)) assert.deepEqual(value, original.trajectory[frame][field], field);
    }
  }
});

test("3D replay binary geometry and recorded poses have complete bounded layouts", async () => {
  const [scene, motion, geometry, poses] = await Promise.all([
    json(REPLAY, "scene.json"), json(REPLAY, "motion.json"), bytes(REPLAY, "geometry.bin"), bytes(REPLAY, "motion.bin")
  ]);
  assert.equal(geometry.length, scene.geometry_binary.bytes);
  assert.equal(poses.length, motion.motion_binary.bytes);
  assert.equal(motion.body_count, scene.bodies.length);
  assert.equal(motion.frame_stride_floats, motion.body_count * 7);
  assert.deepEqual(scene.bodies.map(row => row.id), scene.bodies.map((_, index) => index));
  let cursor = 0;
  for (const [index, mesh] of scene.meshes.entries()) {
    assert.equal(mesh.id, index);
    integer(mesh.vertex_count, 1); integer(mesh.index_count, 3);
    assert.ok(mesh.vertex_count <= mesh.native_vertex_count);
    assert.equal(mesh.index_count % 3, 0);
    assert.equal(mesh.position_byte_offset, cursor);
    cursor += mesh.vertex_count * 3 * 4;
    assert.equal(mesh.index_byte_offset, cursor);
    cursor += mesh.index_count * 4;
    assert.ok(cursor <= geometry.length);
    for (let i = 0; i < mesh.vertex_count * 3; i++) {
      assert.ok(Number.isFinite(geometry.readFloatLE(mesh.position_byte_offset + i * 4)));
    }
    for (let i = 0; i < mesh.index_count; i++) {
      assert.ok(geometry.readUInt32LE(mesh.index_byte_offset + i * 4) < mesh.vertex_count);
    }
  }
  assert.equal(cursor, geometry.length);
  for (const geom of scene.geoms) {
    integer(geom.body_id); assert.ok(geom.body_id < motion.body_count);
    integer(geom.group); assert.ok(geom.group <= 5, "Native visibility group must be retained");
    if (geom.type === "mesh") {
      integer(geom.mesh_id); assert.ok(geom.mesh_id < scene.meshes.length);
    }
  }
  assert.ok(scene.geoms.some(geom => geom.group === 3 && geom.collision), "Retain hidden native contact proxies");
  cursor = 0;
  for (const row of motion.cases) {
    integer(row.frame_count, 1);
    assert.equal(row.rows.length, row.frame_count);
    assert.equal(row.pose_byte_offset, cursor);
    cursor += row.frame_count * motion.frame_stride_floats * 4;
    assert.ok(cursor <= poses.length);
  }
  assert.equal(cursor, poses.length);
  for (let offset = 0; offset < poses.length; offset += 7 * 4) {
    for (let i = 0; i < 7; i++) assert.ok(Number.isFinite(poses.readFloatLE(offset + i * 4)));
    const norm = Math.hypot(...[3, 4, 5, 6].map(i => poses.readFloatLE(offset + i * 4)));
    assert.ok(Math.abs(norm - 1) < 1e-6, "Float32 body quaternion must remain normalized");
  }
  for (const [name, metadata] of [["geometry", scene.geometry_binary], ["motion", motion.motion_binary]]) {
    assert.equal(metadata.href, `${name}.bin`);
    assert.equal(metadata.compressed_href, `${name}.bin.gz`);
    assert.equal(metadata.compression, "gzip");
    const compressed = await bytes(REPLAY, `${name}.bin.gz`);
    assert.equal(compressed.length, metadata.compressed_bytes);
    assert.deepEqual(gunzipSync(compressed), await bytes(REPLAY, `${name}.bin`));
  }
});

test("3D replay seals downloadable artifacts and retains upstream license notices", async () => {
  const seal = await json(REPLAY, "replay-integrity.json");
  assert.equal(seal.schema, "dvidia.reference-replay-integrity/v1");
  assert.match(seal.scope, /not authenticity or physical qualification/i);
  const required = ["scene.json", "motion.json", "geometry.bin", "motion.bin", "geometry.bin.gz", "motion.bin.gz",
    "index.html", "reference_replay.bundle.js", "reference_replay.third-party.txt", "LICENSE", "README.md",
    "receipt/report.json", "receipt/report.html", "receipt/integrity.json"];
  for (const folder of ["universal_robots_ur5e", "robotiq_2f85"]) {
    required.push(`licenses/${folder}/LICENSE`, `licenses/${folder}/README.md`);
    const license = (await bytes(REPLAY, `licenses/${folder}/LICENSE`)).toString("utf8");
    assert.match(license, /copyright/i);
    assert.match(license, /redistribution and use/i);
    assert.ok((await bytes(REPLAY, `licenses/${folder}/README.md`)).length > 0);
  }
  for (const name of required) assert.ok(Object.hasOwn(seal.files, name), `Unsealed required artifact: ${name}`);
  for (const [name, expected] of Object.entries(seal.files)) {
    const content = await bytes(REPLAY, name);
    assert.equal(content.length, expected.bytes, name);
    assert.equal(sha(content), expected.sha256, name);
  }
  assert.match((await bytes(REPLAY, "LICENSE")).toString("utf8"), /MIT License/);
  const notices = (await bytes(REPLAY, "reference_replay.third-party.txt")).toString("utf8");
  assert.match(notices, /three/i); assert.match(notices, /MIT/i);
});

test("research exposes recorded 3D replay and distinguishes runnable profiles from qualification", async () => {
  // Read source and render Markdown without rebuilding docs: another test file
  // owns publication generation, so this check never races its directory writes.
  const [paper, homepage] = await Promise.all([
    readFile(resolve(ROOT, "reports/Hardware matched robot simulation.md"), "utf8"),
    readFile(resolve(ROOT, "scripts/build-papers.mjs"), "utf8")
  ]);
  const rendered = renderMarkdown(paper).html;
  for (const target of ["YAM", "OpenArm", "PiPER", "ARX X5", "PAROL6", "SO-101"]) assert.ok(rendered.includes(target), target);
  assert.match(paper, /PiPER now has a pinned CPU simulation profile; YAM, OpenArm, ARX X5 and PAROL6 remain upcoming/i);
  assert.match(paper, /SO-101[\s\S]*pinned CPU simulation is now runnable; its object-task and physical adapter qualification remain open/i);
  assert.match(paper, /All five still need their own object-task qualification and physical adapter evidence/i);
  assert.doesNotMatch(paper, /all five additions remain upcoming|SO-101 remains the accessible planned entry profile/i);
  const replayPath = "downloads/topics/physical-grounding/runs/2026-10-11-hardware-reference/replay/index.html";
  assert.ok(rendered.includes(replayPath));
  assert.ok(homepage.includes(replayPath));
  assert.ok(homepage.includes("papers/hardware-matched-robot-simulation/index.html"));
});
