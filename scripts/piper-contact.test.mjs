import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RUN = resolve(ROOT, "topics/physical-grounding/runs/2026-10-11-piper-contact");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");

test("PiPER summary mirror binds the full frozen denominator without claiming a complete local bundle", async () => {
  const [reportBytes, protocolBytes, integrityBytes, readme, paper] = await Promise.all([
    readFile(resolve(RUN, "report.json")), readFile(resolve(RUN, "protocol.json")), readFile(resolve(RUN, "integrity.json")),
    readFile(resolve(RUN, "README.md"), "utf8"), readFile(resolve(ROOT, "reports/Hardware matched robot simulation.md"), "utf8")
  ]);
  const report = JSON.parse(reportBytes), protocol = JSON.parse(protocolBytes), integrity = JSON.parse(integrityBytes);
  assert.equal(report.schema, "dvidia.piper-task-benchmark/v1");
  assert.equal(integrity.schema, "dvidia.piper-task-integrity/v1");
  for (const [name, content] of [["report.json", reportBytes], ["protocol.json", protocolBytes]]) {
    assert.equal(content.length, integrity.files[name].bytes);
    assert.equal(sha(content), integrity.files[name].sha256);
  }
  assert.deepEqual(report.protocol, protocol);
  assert.equal(report.protocol_sha256, sha(protocolBytes));
  assert.equal(report.physical_robot_ready, false);
  assert.equal(report.learned_policy, false);
  assert.equal(report.cohort, "confirmation");
  assert.equal(protocol.seed, 642103);
  assert.deepEqual(protocol.native_command_units, ["rad", "rad", "rad", "rad", "rad", "rad", "m"]);
  assert.equal(report.attempted, 9);
  assert.equal(report.valid_attempts, 9);
  const expected = new Set(protocol.scenes.flatMap(scene => protocol.controls.map(control => `${scene.id}--${control}`)));
  assert.equal(expected.size, 9);
  assert.deepEqual(new Set(report.attempts.map(row => row.id)), expected);
  let misses = 0;
  for (const row of report.attempts) {
    assert.equal(row.physical_robot_ready, false);
    assert.equal(row.valid, true);
    assert.ok(Math.abs(row.simulated_seconds - 20) < 1e-8);
    assert.equal(row.timing.control_boundaries, 1000);
    assert.ok(Object.hasOwn(integrity.files, row.result_file));
    misses += row.timing.missed_control_boundaries;
  }
  assert.equal(misses, 1, "Keep the slow computation window in the published receipt");
  for (const summary of report.summary) {
    const sceneIds = new Set(protocol.scenes.filter(scene => scene.stratum === summary.stratum).map(scene => scene.id));
    const rows = report.attempts.filter(row => sceneIds.has(row.scene_id) && row.control === summary.control);
    assert.equal(summary.attempted, rows.length);
    assert.equal(summary.valid, rows.filter(row => row.valid).length);
    assert.equal(summary.success, rows.filter(row => row.valid && row.success).length);
    assert.equal(summary.failed_or_invalid, rows.length - summary.success);
  }
  assert.deepEqual(report.summary.map(row => row.success), [2, 0, 0, 0, 0, 0]);
  assert.match(readme, /not a standalone\s+complete benchmark bundle/i);
  assert.ok(readme.includes("tree/b07b6e0e95a19158384734d140abb36a9adb670b/tasks/piper"));
  assert.ok(paper.includes("c9a72584b4f35c38ad2616894f56da719bba0182"));
  assert.ok(paper.includes("resolve/b07b6e0e95a19158384734d140abb36a9adb670b/tasks/piper/report.html"));
});
