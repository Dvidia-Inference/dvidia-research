import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const ROOT = resolve(import.meta.dirname, '..');
const LAB = resolve(ROOT, 'topics/physical-grounding/runs/2026-10-19-image-goal-jev-v02/lab');
const PRIOR = resolve(ROOT, 'topics/physical-grounding/runs/2026-10-18-image-goal-jev-v01/lab');
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

test('measured publication seals every artifact and preserves the original native protocol bytes', async () => {
  const manifest = await json('publication-integrity.json');
  assert.deepEqual((await files(LAB)).filter(name => name !== 'publication-integrity.json').sort(), Object.keys(manifest.files).sort());
  for (const [name, expected] of Object.entries(manifest.files)) {
    const raw = await readFile(resolve(LAB, name));
    assert.equal(raw.length, expected.bytes, name); assert.equal(hash(raw), expected.sha256, name);
    assert.ok(raw.length < 4 * 1024 * 1024, name);
  }
  const plan = await json('evaluation-plan.json');
  assert.equal(plan.source_commit, '19acf0734d63ecebc07140c8d84302a54baee4c4');
  assert.equal(plan.trials.length, 64);
  for (const [name, expected] of Object.entries(plan.files)) {
    const raw = await readFile(resolve(LAB, name));
    assert.equal(raw.length, expected.bytes, name); assert.equal(hash(raw), expected.sha256, name);
    assert.deepEqual(raw, await readFile(resolve(PRIOR, name)), name);
  }
  assert.deepEqual(await readFile(resolve(LAB, 'evaluation-plan.json')), await readFile(resolve(PRIOR, 'evaluation-plan.json')));
  const provenance = await json('provenance.json');
  assert.equal(provenance.publication_source_commit, 'a3e9afb59f3a9cd7da617cf61416e24fad0a0a5c');
  assert.equal(provenance.protocol_version, 'v0.1');
  const review = await json('independent-run-review.json');
  assert.equal(review.status, 'passed');
  assert.equal(review.original_results_sha256, provenance.original_results_sha256);
  assert.equal(review.evaluation_plan_sha256, hash(await readFile(resolve(LAB, 'evaluation-plan.json'))));
});

test('all measured results and positive misses remain visible with paired denominators', async () => {
  const results = await json('results.json'), report = await json('report.json'), cases = (await json('cases.json')).cases;
  assert.equal(results.status, 'completed'); assert.equal(results.active_trial, null);
  assert.equal(results.results.length, 64); assert.equal(report.results.length, 64);
  assert.ok(results.results.every(row => row.status === 'ok' && row.attempts === 1 && row.http_status === 200));
  assert.ok(results.results.every(row => !Object.hasOwn(row, 'response')));
  const byId = new Map(cases.map(row => [row.id, row]));
  for (const [condition, positives, accuracy] of [['rgb', 0, 24], ['rgb_telemetry', 1, 25]]) {
    const rows = results.results.filter(row => row.condition === condition);
    assert.equal(rows.length, 32);
    const complete = rows.filter(row => byId.get(row.case_id).physical_truth.complete);
    const incomplete = rows.filter(row => !byId.get(row.case_id).physical_truth.complete);
    assert.equal(complete.length, 8); assert.equal(incomplete.length, 24);
    assert.equal(complete.filter(row => row.verdict === 'complete').length, positives);
    assert.equal(incomplete.filter(row => row.verdict === 'complete').length, 0);
    assert.equal(rows.filter(row => row.verdict === byId.get(row.case_id).expected_verdict[condition]).length, accuracy);
    const summary = report.summary.find(row => row.condition === condition);
    assert.equal(summary.true_completion.count, positives); assert.equal(summary.true_completion.planned_complete, 8);
    assert.equal(summary.false_completion.planned_incomplete, 24); assert.equal(summary.false_completion.valid_incomplete, 24);
    assert.equal(summary.observability_aware_accuracy.correct, accuracy);
  }
  const occluded = results.results.filter(row => byId.get(row.case_id).category === 'occluded');
  assert.equal(occluded.length, 8); assert.ok(occluded.every(row => row.verdict === 'incomplete'));
  assert.equal(results.metrics.overall.completed_requests, 64);
  assert.equal(results.metrics.overall.unknown_cost_attempts, 0);
  assert.ok(results.metrics.overall.online_ms_all_attempts.p50 > 1000);
  const html = await readFile(resolve(LAB, 'index.html'), 'utf8');
  assert.ok(html.includes('<option value="complete">Physically complete</option>'));
  assert.ok(html.includes('Physically complete cases recognized in this input condition:'));
});

test('measured claims are conservative and the original unrun release remains intact', async () => {
  const prior = JSON.parse(await readFile(resolve(PRIOR, 'results.json')));
  assert.equal(prior.status, 'not_run'); assert.equal(prior.metrics, null);
  assert.ok(prior.results.every(row => row.status === 'not_run' && row.attempts === 0));
  const paper = await readFile(resolve(ROOT, 'reports/Image goal Jev measured v02.md'), 'utf8');
  assert.ok(paper.includes('1/8 physically complete cases'));
  assert.ok(paper.includes('Images alone produced **0/8**'));
  assert.ok(paper.includes('seconds-long round trip'));
  assert.ok(paper.includes('not a clean improvement estimate'));
  const catalog = JSON.parse(await readFile(resolve(ROOT, 'publications.json')));
  assert.ok(catalog.publications.some(row => row.slug === 'image-goal-jev-v01'));
  assert.ok(catalog.publications.some(row => row.slug === 'image-goal-jev-v02'));
  assert.equal(catalog.contributor, null);
});
