import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { ROOT } from "./build-papers.mjs";

const RUN = resolve(ROOT, "topics/physical-grounding/runs/2026-10-13-skill-prerequisites-v01");
const SHA = "756306a2beda60ac54567971626080a56227e781";
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const json = async path => JSON.parse(await readFile(path));

async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    assert.ok(!entry.isSymbolicLink());
    if (entry.isDirectory()) result.push(...await files(path));
    else { assert.ok(entry.isFile()); result.push(path); }
  }
  return result;
}

test("prerequisites archive preserves the complete frozen export and scoped development evidence", async () => {
  const archive = await json(resolve(RUN, "provenance.json"));
  assert.equal(archive.source_commit, SHA);
  assert.equal(archive.lab_copied_without_modification, true);
  const actual = (await files(RUN)).map(path => path.slice(RUN.length + 1)).filter(name => name !== "provenance.json");
  assert.deepEqual(actual.sort(), Object.keys(archive.files).sort());
  for (const [name, record] of Object.entries(archive.files)) {
    const bytes = await readFile(resolve(RUN, name));
    assert.equal(bytes.length, record.bytes, name);
    assert.equal(hash(bytes), record.sha256, name);
    assert.ok(bytes.length < 25 * 1024 * 1024, name);
  }
  const seal = await json(resolve(RUN, "lab/integrity.json"));
  assert.deepEqual(Object.keys(seal.files).sort(), actual.filter(name => name.startsWith("lab/") && name !== "lab/integrity.json").map(name => name.slice(4)).sort());
  for (const [name, record] of Object.entries(seal.files)) assert.deepEqual(record, archive.files[`lab/${name}`], name);
  assert.equal(actual.filter(name => name.startsWith("lab/")).length, archive.lab_export_files);
  assert.equal(actual.filter(name => name.startsWith("lab/")).reduce((n, name) => n + archive.files[name].bytes, 0), archive.lab_export_bytes);
});

test("prerequisites results retain every planned failure and separate checkpoints from completed tasks", async () => {
  const protocolBytes = await readFile(resolve(RUN, "lab/protocol.json"));
  const protocol = JSON.parse(protocolBytes);
  const report = await json(resolve(RUN, "lab/benchmark.json"));
  assert.equal(protocol.source_commit, SHA);
  assert.equal(report.source.commit, SHA);
  assert.equal(report.source.protocol_sha256, hash(protocolBytes));
  assert.equal(report.learned_policy, false);
  assert.equal(report.hardware_validated, false);
  assert.equal(protocol.attempts.length, 16);
  assert.equal(report.attempts.length, 16);
  assert.equal(new Set(protocol.attempts.map(row => row.id)).size, 16);
  for (let i = 0; i < 16; i++) {
    const expected = protocol.attempts[i], actual = report.attempts[i];
    for (const name of ["id", "task", "policy", "case"]) assert.deepEqual(actual[name], expected[name]);
    const receipt = await json(resolve(RUN, `lab/trials/${actual.id}.json`));
    const trace = receipt.native_trace;
    delete receipt.native_trace;
    assert.deepEqual(receipt, actual);
    assert.ok(trace.length > 0);
    assert.ok(trace.every(row => row.length === receipt.native_trace_columns.length && row.every(Number.isFinite)));
    assert.ok(trace.slice(1).every((row, index) => Math.abs(row[0] - trace[index][0] - .002) < 1e-8));
  }
  const rows = (task, policy) => report.attempts.filter(row => row.task === task && row.policy === policy);
  const sum = (data, pick) => data.reduce((n, row) => n + Number(pick(row)), 0);
  assert.equal(report.attempts.filter(row => row.valid).length, 16);
  for (const policy of ["baseline", "recovery"]) assert.equal(sum(rows("hinged-box", policy), r => r.success), 2);
  assert.equal(sum(rows("hinged-box", "baseline"), r => r.metrics.lid_robot_collision), 2);
  assert.equal(sum(rows("hinged-box", "recovery"), r => r.metrics.lid_robot_collision), 0);
  assert.equal(sum(rows("hinged-box", "recovery"), r => r.metrics.safe_abort && !r.success), 2);
  for (const row of rows("hinged-box", "recovery").filter(r => r.metrics.intervention_count)) {
    assert.equal(row.metrics.first_hazard_s, 0);
    assert.equal(row.metrics.first_command_s, 0);
  }
  assert.equal(sum(rows("tool-reach", "recovery"), r => r.metrics.retrieval_success), 3);
  assert.equal(sum(rows("tool-reach", "recovery"), r => r.metrics.retained_lift_success), 0);
  assert.equal(sum(rows("tool-reach", "baseline"), r => r.success), 0);
  assert.equal(sum(rows("tool-reach", "recovery"), r => r.success), 0);
  assert.equal(rows("tool-reach", "recovery").filter(r => r.metrics.outcome === "deferred_insufficient_reach").length, 1);
});

test("prerequisites timing uses the common native timer and mirror headers stay scoped", async () => {
  const analysis = await json(resolve(RUN, "analysis.json"));
  const raw = await readFile(resolve(RUN, "lab/benchmark.json"));
  const report = JSON.parse(raw);
  assert.equal(analysis.benchmark_sha256, hash(raw));
  const simulated = report.attempts.reduce((n, r) => n + (r.metrics.simulated_seconds ?? r.metrics.simulation_seconds), 0);
  const native = report.attempts.reduce((n, r) => n + r.wall_seconds, 0);
  const exported = report.attempts.reduce((n, r) => n + r.export_seconds, 0);
  const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} differs from ${expected}`);
  close(analysis.simulated_seconds_total, simulated);
  close(analysis.native_execution_wall_seconds_total, native);
  close(analysis.export_wall_seconds_total, exported);
  close(analysis.ratio_of_summed_simulation_to_native_execution_wall_seconds, simulated / native);
  const headers = await readFile(resolve(ROOT, "docs/_headers"), "utf8");
  const block = headers.split("\n\n").find(value => value.startsWith("/downloads/topics/physical-grounding/runs/2026-10-13-skill-prerequisites-v01/lab/assets/*\n"));
  assert.ok(block);
  assert.match(block, /Access-Control-Allow-Origin: https:\/\/dvidia-robot-simulation-lab\.static\.hf\.space/);
  assert.match(block, /Content-Type: application\/gzip/);
  for (const file of await files(resolve(RUN, "lab/assets"))) assert.ok(file.endsWith(".bin.gz"));
});
