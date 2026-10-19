import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const ROOT = resolve(import.meta.dirname, '..');
const LAB = resolve(ROOT, 'topics/physical-grounding/runs/2026-10-19-local-goal-verifier-v03/lab');
const hash = raw => createHash('sha256').update(raw).digest('hex');
const json = async name => JSON.parse(await readFile(resolve(LAB, name)));
async function files(dir) {
  const names = [];
  for (const item of await readdir(dir, {withFileTypes:true})) {
    assert.ok(!item.isSymbolicLink());
    const path = resolve(dir, item.name);
    if (item.isDirectory()) names.push(...await files(path));
    else { assert.ok(item.isFile()); names.push(path.slice(LAB.length+1)); }
  }
  return names;
}

test('local verifier publication binds complete native inputs, decisions and public review', async () => {
  const seal = await json('publication-integrity.json');
  assert.deepEqual((await files(LAB)).filter(n=>n!=='publication-integrity.json').sort(), Object.keys(seal.files).sort());
  for (const [name, expected] of Object.entries(seal.files)) {
    const raw = await readFile(resolve(LAB, name));
    assert.equal(raw.length, expected.bytes, name); assert.equal(hash(raw), expected.sha256, name);
    assert.ok(raw.length < 8*1024*1024, name);
  }
  const native = await json('integrity.json'), protocol = await json('protocol.json'), results = await json('results.json');
  assert.equal(protocol.provider_calls, 0); assert.equal(results.provider_calls, 0);
  assert.equal(protocol.source.commit, 'b4c76b13ccbdaff4f01726bee50fae5fcc1e4e4a');
  assert.equal(Object.keys(protocol.source.files).length, 12);
  assert.equal(protocol.planned_cases, 200); assert.equal(protocol.repeats, 100);
  assert.equal(results.source_commit, protocol.source.commit);
  assert.equal(results.protocol_sha256, hash(await readFile(resolve(LAB, 'protocol.json'))));
  assert.equal(results.input_integrity_sha256, hash(await readFile(resolve(LAB, 'integrity.json'))));
  for (const [name, expected] of Object.entries(native.files)) {
    assert.deepEqual(seal.files[name], expected, name);
  }
  const review = await json('independent-review.json');
  assert.equal(review.status, 'passed');
  const qa = await json('ui-qa.json');
  assert.equal(qa.viewer_sha256, hash(await readFile(resolve(LAB, 'index.html'))));
  assert.equal(qa.status, 'partial-browser-blocked');
  assert.deepEqual(qa.browser.screenshots, []);
});

test('all three cohorts retain physical errors and abstentions beside packet agreement', async () => {
  const results = await json('results.json'), report = await json('report.json'), cases = (await json('cases.json')).cases;
  assert.equal(results.status, 'completed'); assert.equal(cases.length, 200); assert.equal(results.results.length, 200);
  const byId = new Map(cases.map(c=>[c.id,c]));
  for (const row of results.results) {
    assert.ok(byId.has(row.case_id)); assert.equal(row.timing_ns.length, 100);
    assert.ok(row.timing_ns.every(t=>Number.isSafeInteger(t)&&t>=0));
  }
  for (const [cohort,count,positive,negative,abstained] of [['native',64,16,48,0],['evidence_fault',128,128,0,120],['blind_spot',8,0,8,0]]) {
    const rows = results.results.filter(r=>byId.get(r.case_id).cohort===cohort);
    const summary = report.summaries.find(s=>s.cohort===cohort);
    assert.equal(rows.length,count); assert.equal(summary.planned,count);
    assert.equal(summary.positive_recognition.total,positive); assert.equal(summary.false_completion.total,negative);
    assert.equal(summary.abstentions,abstained);
    assert.equal(rows.filter(r=>r.decision.verdict===byId.get(r.case_id).expected_verdict).length,count);
    assert.equal(summary.contract_agreement.correct,count);
  }
  const native = report.summaries.find(s=>s.cohort==='native'), forged = report.summaries.find(s=>s.cohort==='blind_spot');
  assert.equal(native.positive_recognition.correct,16); assert.equal(native.false_completion.count,0);
  assert.equal(forged.false_completion.count,8); assert.equal(forged.negative_recognition.correct,0);
  assert.equal(results.metrics.overall.physical_false_completion.numerator,8);
  assert.equal(results.metrics.overall.physical_false_completion.denominator,56);
  assert.equal(results.metrics.overall.latency_us.samples,20000);
  const html = await readFile(resolve(LAB,'index.html'),'utf8');
  for (const text of ['Consistent fabricated readings','Requires 200 ms observation history','Zero Jev calls','Reference completed placement for layout','?.focus()']) assert.ok(html.includes(text),text);
});

test('prior Jev releases stay exact and new claims retain sensor-trust limits', async () => {
  for (const [folder,expected] of [['2026-10-18-image-goal-jev-v01','66c3c69db88f8bb84edf3f1c92141c075ab19aefc5a0e434f00e0e4edc55a840'],['2026-10-19-image-goal-jev-v02','8a43ca2ea5e3827a048ea41e04b755f3b76af9775c3df3871403701b29185e7c']]) {
    assert.equal(hash(await readFile(resolve(ROOT,'topics/physical-grounding/runs',folder,'lab/publication-integrity.json'))),expected);
  }
  const paper = await readFile(resolve(ROOT,'reports/Local goal verifier v03.md'),'utf8');
  for (const text of ['16/16','0/48','8/56','200 ms observation history','internal cause','wholly unseen','not a matched speedup comparison']) assert.ok(paper.includes(text),text);
  assert.ok(!paper.includes('_PENDING'));
  const catalog = JSON.parse(await readFile(resolve(ROOT,'publications.json')));
  assert.equal(catalog.contributor,null);
  for (const slug of ['local-goal-verifier-v03','image-goal-jev-v01','image-goal-jev-v02']) assert.ok(catalog.publications.some(p=>p.slug===slug));
});
