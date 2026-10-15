import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { ROOT } from './build-papers.mjs';
const RUN = resolve(ROOT, 'topics/physical-grounding/runs/2026-10-14-shoe-graspability-v03');
const SOURCE = '73057dc259c6a19344906f4a43a283553e17ade0';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = async path => JSON.parse(await readFile(path));
async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    assert.ok(!entry.isSymbolicLink());
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(path));
    else { assert.ok(entry.isFile()); result.push(path); }
  }
  return result;
}
test('graspability archive retains exactly the sealed export and source-bound audit', async () => {
  const archive = await json(resolve(RUN, 'provenance.json'));
  assert.equal(archive.source_commit, SOURCE);
  assert.equal(archive.lab_copied_without_modification, true);
  const actual = (await files(RUN)).map(path => path.slice(RUN.length + 1)).filter(path => path !== 'provenance.json');
  assert.deepEqual(actual.sort(), Object.keys(archive.files).sort());
  for (const [name, record] of Object.entries(archive.files)) {
    const raw = await readFile(resolve(RUN, name));
    assert.equal(raw.length, record.bytes, name); assert.equal(hash(raw), record.sha256, name);
    assert.ok(raw.length < 25 * 1024 * 1024, name);
  }
  const seal = await json(resolve(RUN, 'lab/integrity.json'));
  const labFiles = actual.filter(path => path.startsWith('lab/'));
  assert.equal(labFiles.length, 107); assert.equal(archive.lab_export_bytes, 55750637);
  assert.deepEqual(Object.keys(seal.files).sort(), labFiles.filter(path => path !== 'lab/integrity.json').map(path => path.slice(4)).sort());
  for (const [name, record] of Object.entries(seal.files)) assert.deepEqual(record, archive.files['lab/' + name]);
  const audit = await json(resolve(RUN, 'audit/native-audit.json'));
  assert.equal(audit.source_commit, SOURCE); assert.equal(audit.native_steps_executed_by_audit, 0);
  assert.equal(audit.compiled_models_verified, 24); assert.equal(audit.attempts_verified, 24);
  assert.equal(audit.integrity_sha256, hash(await readFile(resolve(RUN, 'lab/integrity.json'))));
  const acceptance = await json(resolve(RUN, 'audit/acceptance.json'));
  assert.equal(acceptance.source_commit, SOURCE);
  assert.equal(acceptance.independent_audit_sha256, hash(await readFile(resolve(RUN, 'audit/native-audit.json'))));
  assert.equal(acceptance.browser_qa_passed, true); assert.equal(acceptance.tests_passed, true);
  const script = await readFile(resolve(RUN, 'audit/audit_frozen.py'), 'utf8');
  assert.ok(!script.includes('/Users/')); assert.match(script, /--assets/);
});
test('graspability keeps all shape/load/tool cells and does not turn failed loads into omitted attempts', async () => {
  const raw = await readFile(resolve(RUN, 'lab/protocol.json'));
  const protocol = JSON.parse(raw), report = await json(resolve(RUN, 'lab/benchmark.json'));
  assert.equal(report.source.commit, SOURCE); assert.equal(protocol.source_commit, SOURCE);
  assert.equal(report.source.protocol_sha256, hash(raw));
  assert.equal(report.learned_policy, false); assert.equal(report.hardware_validated, false);
  assert.equal(report.attempts.length, 24); assert.equal(protocol.attempts.length, 24);
  for (let index = 0; index < 24; index++) {
    const row = report.attempts[index];
    for (const name of ['id', 'task', 'policy', 'case']) assert.deepEqual(row[name], protocol.attempts[index][name]);
    const trial = await json(resolve(RUN, 'lab/trials/' + row.id + '.json'));
    const trace = trial.native_trace; delete trial.native_trace; assert.deepEqual(trial, row);
    assert.equal(trace.length, 3300); assert.equal(row.valid, true);
    assert.equal(row.success, row.independent_score.task_success);
    assert.equal(row.independent_score.reference.valid, true);
  }
  const rows = (shape, mass, tool) => report.attempts.filter(row => row.case.object_shape === shape && row.case.mass === mass && row.case.tool_condition === tool);
  for (const [shape, mounted, absent] of [['easy-block', 2, 1], ['simplified-shoe', 1, 2], ['current-shoe', 1, 1]]) {
    assert.equal(rows(shape, .03, 'mounted').filter(row => row.success).length, mounted);
    assert.equal(rows(shape, .03, 'absent').filter(row => row.success).length, absent);
    for (const tool of ['mounted', 'absent']) {
      assert.equal(rows(shape, .03, tool).length, 2); assert.equal(rows(shape, .3, tool).length, 2);
      assert.equal(rows(shape, .3, tool).filter(row => row.success).length, 0);
    }
  }
  assert.equal(new Set(report.attempts.map(row => row.robot_actuator_sha256)).size, 1);
  assert.equal(report.paired_comparisons.filter(row => row.absent_gain).length, 1);
  assert.equal(report.paired_comparisons.filter(row => row.absent_loss).length, 1);
});
test('graspability timing and new mirror headers remain bound to the fresh export', async () => {
  const analysis = await json(resolve(RUN, 'analysis.json')), report = await json(resolve(RUN, 'lab/benchmark.json'));
  assert.equal(analysis.benchmark_sha256, hash(await readFile(resolve(RUN, 'lab/benchmark.json'))));
  const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8);
  close(analysis.native_wall_seconds, report.attempts.reduce((n, row) => n + row.wall_seconds, 0));
  close(analysis.audit_export_wall_seconds, report.attempts.reduce((n, row) => n + row.export_seconds, 0));
  close(analysis.simulated_seconds, report.attempts.reduce((n, row) => n + row.metrics.simulation_seconds, 0));
  assert.equal(analysis.target_solver_calls, report.attempts.reduce((n, row) => n + row.control_compute_ms.length, 0));
  const headers = await readFile(resolve(ROOT, 'docs/_headers'), 'utf8');
  const block = headers.split('\n\n').find(value => value.startsWith('/downloads/topics/physical-grounding/runs/2026-10-14-shoe-graspability-v03/lab/assets/*\n'));
  assert.ok(block); assert.match(block, /Access-Control-Allow-Origin: https:\/\/dvidia-robot-simulation-lab\.static\.hf\.space/);
  assert.match(block, /Content-Type: application\/gzip/);
  for (const file of await files(resolve(RUN, 'lab/assets'))) assert.ok(file.endsWith('.bin.gz'));
});
