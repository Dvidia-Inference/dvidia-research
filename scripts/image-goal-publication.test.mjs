import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const ROOT = resolve(import.meta.dirname, '..');
const LAB = resolve(ROOT, 'topics/physical-grounding/runs/2026-10-18-image-goal-jev-v01/lab');
const SOURCE = '19acf0734d63ecebc07140c8d84302a54baee4c4';
const hash = raw => createHash('sha256').update(raw).digest('hex');
const json = async name => JSON.parse(await readFile(resolve(LAB, name)));

async function files(directory) {
  const names = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    assert.ok(!entry.isSymbolicLink());
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) names.push(...await files(path));
    else { assert.ok(entry.isFile()); names.push(path.slice(LAB.length + 1)); }
  }
  return names;
}

test('image-goal publication preserves distinct native, evaluation and complete package seals', async () => {
  const manifest = await json('publication-integrity.json');
  assert.deepEqual((await files(LAB)).filter(name => name !== 'publication-integrity.json').sort(), Object.keys(manifest.files).sort());
  for (const [name, expected] of Object.entries(manifest.files)) {
    const raw = await readFile(resolve(LAB, name));
    assert.equal(raw.length, expected.bytes, name); assert.equal(hash(raw), expected.sha256, name);
    assert.ok(raw.length < 4 * 1024 * 1024, name);
  }
  const native = await json('integrity.json');
  for (const file of native.files) {
    const raw = await readFile(resolve(LAB, file.path));
    assert.equal(raw.length, file.bytes, file.path); assert.equal(hash(raw), file.sha256, file.path);
  }
  const audit = await json('native-validation.json');
  const provenance = await json('provenance.json');
  assert.equal(audit.status, 'passed');
  assert.equal(audit.case_count, 32);
  assert.equal(audit.physical_complete, 8);
  assert.equal(audit.physical_incomplete, 24);
  assert.equal(audit.source_digests.verifier_sha256, hash(await readFile(resolve(LAB, 'verify-image-goal-fixtures.py'))));
  assert.equal(provenance.publication_source_commit, '3d3c8f660f6f9544d6a58c654bab143dd1eddc00');
  const plan = await json('evaluation-plan.json');
  assert.equal(plan.source_commit, SOURCE);
  assert.equal(plan.model, 'jev-1.14.0');
  assert.equal(plan.trials.length, 64);
  for (const [name, expected] of Object.entries(plan.files)) {
    const raw = await readFile(resolve(LAB, name));
    assert.equal(raw.length, expected.bytes, name); assert.equal(hash(raw), expected.sha256, name);
  }
  assert.equal((await readFile(resolve(LAB, 'protocol.sha256'), 'utf8')).trim(), hash(await readFile(resolve(LAB, 'protocol.json'))));
});

test('all authored conditions and identical-image physical counterexamples remain public', async () => {
  const cases = await json('cases.json');
  assert.equal(cases.cases.length, 32);
  assert.equal(new Set(cases.cases.map(row => row.layout_id)).size, 4);
  const categories = new Map();
  for (const row of cases.cases) categories.set(row.category, (categories.get(row.category) ?? 0) + 1);
  assert.equal(categories.size, 8); assert.ok([...categories.values()].every(count => count === 4));
  assert.equal(cases.cases.filter(row => row.physical_truth.complete).length, 8);
  assert.equal(cases.cases.filter(row => !row.physical_truth.present).length, 8);
  assert.equal(cases.cases.filter(row => row.expected_verdict.rgb === 'unknown').length, 16);
  assert.equal(cases.aliases.length, 4);
  const byId = new Map(cases.cases.map(row => [row.id, row]));
  for (const alias of cases.aliases) {
    const moving = byId.get(alias.case_id), settled = byId.get(alias.pixel_identical_to);
    assert.equal(moving.physical_truth.complete, false); assert.equal(settled.physical_truth.complete, true);
    assert.deepEqual(await readFile(resolve(LAB, moving.current_image)), await readFile(resolve(LAB, settled.current_image)));
    assert.equal(moving.expected_verdict.rgb, 'unknown'); assert.equal(settled.expected_verdict.rgb, 'unknown');
    const plan = await json('evaluation-plan.json');
    const trial = (id, condition) => plan.trials.find(row => row.case_id === id && row.condition === condition);
    assert.equal(trial(moving.id, 'rgb').request_sha256, trial(settled.id, 'rgb').request_sha256);
    assert.notEqual(trial(moving.id, 'rgb_telemetry').request_sha256, trial(settled.id, 'rgb_telemetry').request_sha256);
  }
});

test('provider status, planned denominators and research claims agree', async () => {
  const results = await json('results.json'), publicReport = await json('report.json'), plan = await json('evaluation-plan.json');
  assert.equal(results.evaluation_plan_sha256, hash(await readFile(resolve(LAB, 'evaluation-plan.json'))));
  assert.equal(publicReport.status, results.status);
  const identity = row => `${row.case_id}/${row.condition}`;
  assert.deepEqual(results.results.map(identity).sort(), plan.trials.map(identity).sort());
  assert.deepEqual(publicReport.results.map(identity).sort(), plan.trials.map(identity).sort());
  const paper = await readFile(resolve(ROOT, 'reports/Image goal Jev v01.md'), 'utf8');
  const catalog = JSON.parse(await readFile(resolve(ROOT, 'publications.json')));
  assert.equal(catalog.contributor, null);
  assert.equal(catalog.follow, 'https://x.com/iammrriver');
  assert.ok(catalog.publications.some(row => row.slug === 'image-goal-jev-v01'));
  assert.ok(paper.includes(SOURCE));
  if (results.status === 'not_run') {
    assert.equal(results.metrics, null);
    assert.ok(results.results.every(row => row.status === 'not_run' && row.attempts === 0));
    assert.ok(publicReport.results.every(row => row.status === 'not_run' && row.verdict === null && row.p_complete === null));
    assert.ok(publicReport.summary.every(row => row.attempted === 0 && row.successful_response_latency_ms.p95 === null));
    assert.ok(paper.includes('**Jev has not been run.**'));
  } else {
    assert.equal(results.status, 'completed');
    assert.ok(results.metrics);
  }
});
