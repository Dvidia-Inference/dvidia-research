import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';
import test from 'node:test';
import { createGunzip, gunzipSync } from 'node:zlib';
import { ROOT } from './build-papers.mjs';

const RUN = resolve(ROOT, 'topics/physical-grounding/runs/2026-10-18-native-contact-audit');
const AUDIT = resolve(RUN, 'audit');
const SOURCE = 'ff40985ec076eaed8421821b1244217d8502777e';
const SEAL = 'dc7b6091b1c680b9479ea65157c7d553043af688e159463db6174696ad5949fa';
const PROTOCOL = 'f5ded43bc66dd512e223ffea76ad51897ffea15bb016fa2c29dcd1b4fb6601e2';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = async path => JSON.parse(await readFile(path));
const close = (a, b, tolerance = 1e-8) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
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

test('native contact archive preserves every frozen input, trace and source snapshot', async () => {
  const raw = await readFile(resolve(AUDIT, 'integrity.json'));
  assert.equal(hash(raw), SEAL);
  const seal = JSON.parse(raw), names = (await files(AUDIT)).map(path => path.slice(AUDIT.length + 1));
  assert.equal(names.length, 59);
  assert.deepEqual(names.filter(name => name !== 'integrity.json').sort(), Object.keys(seal.files).sort());
  let size = raw.length;
  for (const [name, record] of Object.entries(seal.files)) {
    const bytes = await readFile(resolve(AUDIT, name));
    assert.equal(bytes.length, record.bytes, name); assert.equal(hash(bytes), record.sha256, name);
    assert.ok(bytes.length < 25 * 1024 * 1024, name); size += bytes.length;
  }
  assert.equal(size, 151876079);
  const protocolBytes = await readFile(resolve(AUDIT, 'protocol.json'));
  assert.equal(hash(protocolBytes), PROTOCOL);
  assert.equal((await readFile(resolve(AUDIT, 'protocol.sha256'), 'utf8')).trim(), PROTOCOL);
  const protocol = JSON.parse(protocolBytes);
  assert.equal(protocol.scope, 'passive_replay_of_inspected_simulation_cases');
  assert.equal(protocol.attempts.length, 14);
  for (const [name, digest] of Object.entries(protocol.sources_sha256)) {
    assert.equal(hash(await readFile(resolve(AUDIT, 'sources', name))), digest);
  }
  const provenance = await json(resolve(RUN, 'provenance.json'));
  assert.equal(provenance.source_commit, SOURCE); assert.equal(provenance.audit_copied_without_modification, true);
  assert.equal(provenance.audit_integrity_sha256, SEAL);
  const downloader = await readFile(resolve(RUN, 'download-audit.py'), 'utf8');
  assert.ok(downloader.includes(SEAL)); assert.ok(!downloader.includes('PENDING'));
});

test('native evidence reconstructs unchanged dwell and hidden contact windows at every tick', async () => {
  const report = await json(resolve(AUDIT, 'report.json'));
  const protocol = await json(resolve(AUDIT, 'protocol.json'));
  assert.equal(report.status, 'verified'); assert.equal(report.new_policy_trials, 0);
  assert.equal(report.unique_scene_count, 2); assert.equal(report.verified_native_episodes, 14);
  assert.equal(report.protocol_sha256, PROTOCOL);
  assert.deepEqual(report.results.map(row => row.id), protocol.attempts.map(row => row.id));
  assert.equal(report.results.filter(row => row.role === 'recorded_open_jaw_control').length, 7);
  let total = 0;
  for (let index = 0; index < report.results.length; index++) {
    const result = report.results[index], plan = protocol.attempts[index];
    const receipt = await json(resolve(AUDIT, 'episodes', result.id, 'receipt.json'));
    assert.deepEqual(receipt, result);
    const inputBytes = await readFile(resolve(AUDIT, plan.input_path));
    assert.equal(hash(inputBytes), plan.compressed_input_sha256);
    const uncompressed = gunzipSync(inputBytes);
    assert.equal(hash(uncompressed), plan.input_sha256);
    const original = JSON.parse(uncompressed).episodes[0];
    assert.equal(original.success, result.reproduction.success);
    if (result.role === 'recorded_open_jaw_control') assert.equal(original.success, false);
    for (const field of ['exact_actions', 'exact_all_sampled_physical_fields', 'exact_initial_and_final_info', 'exact_outcome_and_rewards', 'independent_native_dwell_agrees_at_every_control_boundary']) assert.equal(result.reproduction[field], true);
    let count = 0, dwell = 0, longest = 0, seen = false, previousTime = 0;
    let previousBoundary = null, group = null, eligible = 0, missed = 0;
    const bilateral = row => row.pads.left.scored_count > 0 && row.pads.right.scored_count > 0;
    const finishGroup = () => {
      if (group && previousBoundary && group.loaded && bilateral(previousBoundary) && bilateral(group.last)) {
        eligible++; if (group.missing) missed++;
      }
      if (group) previousBoundary = group.last;
    };
    const lines = createInterface({ input: createReadStream(resolve(AUDIT, result.dense_trace_path)).pipe(createGunzip()), crlfDelay: Infinity });
    for await (const line of lines) {
      const row = JSON.parse(line); count++;
      assert.equal(row.native_tick, count); close(row.time - previousTime, .001, 1e-10); previousTime = row.time;
      for (const contact of [...Object.values(row.pads), row.table]) {
        const scored = contact.contacts.filter(c => c.force_contact_frame[0] > .01);
        assert.equal(scored.length, contact.scored_count);
        assert.equal(contact.contacts.length, contact.candidate_count);
        close(scored.reduce((sum, c) => sum + c.force_contact_frame[0], 0), contact.scored_normal_force_n);
      }
      const retained = bilateral(row) && row.table.scored_count === 0 && row.object_lift_m >= .055;
      dwell = retained ? dwell + .001 : 0; longest = Math.max(longest, dwell); seen ||= dwell + 1e-12 >= .1;
      assert.equal(row.retained_lift_predicate, retained); close(row.retained_lift_dwell_seconds, dwell);
      assert.equal(row.retained_lift_seen, seen);
      if (!group || row.action_index !== group.index) {
        finishGroup(); group = { index: row.action_index, loaded: true, missing: false, last: row };
      }
      group.loaded &&= ['lift', 'transfer', 'place'].includes(row.phase);
      group.missing ||= !bilateral(row); group.last = row;
    }
    finishGroup();
    assert.equal(count, result.reproduction.native_ticks); assert.equal(count, result.measurement.native_ticks);
    close(longest, result.measurement.maximum_retained_lift_streak_seconds);
    assert.equal(eligible, result.measurement.loaded_sampling_misses.eligible_bilateral_boundary_intervals);
    assert.equal(missed, result.measurement.loaded_sampling_misses.intervals_hiding_native_contact_loss);
    close(previousTime, result.reproduction.simulated_seconds); total += count;
  }
  assert.equal(total, report.total_native_ticks); assert.equal(total, 249502); close(total * .001, report.simulated_seconds);
});
