import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve('topics/physical-grounding/runs/2026-10-11-native-grasp/replay');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = path => JSON.parse(readFileSync(path, 'utf8'));

test('native grasp publication retains every sealed artifact and original attempt', () => {
  const seal = json(resolve(root, 'replay-integrity.json'));
  for (const [name, expected] of Object.entries(seal.files)) {
    assert.ok(!name.startsWith('/') && !name.split('/').includes('..'));
    const path = resolve(root, name);
    assert.equal(statSync(path).size, expected.bytes);
    assert.equal(hash(readFileSync(path)), expected.sha256, name);
  }
  const manifest = readFileSync(resolve(root, 'receipt/integrity.json'));
  assert.equal(hash(manifest), 'd72d3bbd1b443d735437dc18fed875e0f957886a7b05bd0aac3424ac195905a0');
  const report = json(resolve(root, 'receipt/report.json'));
  assert.equal(report.attempted, 18);
  assert.equal(report.valid_attempts, 18);
  assert.equal(report.physical_robot_ready, false);
  assert.equal(report.learned_policy, false);
  for (const control of ['placement', 'replay_open_jaw', 'hold']) {
    const rows = report.attempts.filter(row => row.control === control);
    assert.equal(rows.length, 6);
    assert.equal(rows.filter(row => row.success).length, control === 'placement' ? 6 : 0);
  }
  const slow = report.attempts.find(row => row.id === 'nominal-03--placement');
  assert.ok(slow.attempt_wall_seconds > 29);
  assert.equal(slow.timing.missed_control_boundaries, 251);
});

test('native task replay exposes its excerpt and complete denominator', () => {
  const motion = json(resolve(root, 'motion.json'));
  assert.equal(motion.cases.length, 9);
  assert.equal(motion.cases.reduce((sum, item) => sum + item.frame_count, 0), 9009);
  assert.equal(motion.source.benchmark_attempted, 18);
  assert.equal(motion.source.excluded_attempts.length, 9);
  assert.ok(motion.scope.includes('No live physics'));
  assert.ok(readFileSync(resolve(root, 'index.html'), 'utf8').includes('complete denominator'));
});
