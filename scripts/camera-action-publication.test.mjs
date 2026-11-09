import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const run=resolve(root,'topics/physical-grounding/runs/2026-11-01-camera-to-action-v01/viewer');
const json=async name=>JSON.parse(await readFile(resolve(run,name),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

test('camera/action viewer bytes and original frame references match their inventory',async()=>{
  const manifest=await json('viewer-integrity.json'), data=await json('evidence.json');
  for(const [name,expected] of Object.entries(manifest.files)){
    const path=resolve(run,name);assert.ok(path.startsWith(run+'/'));
    const bytes=await readFile(path);assert.equal(bytes.length,expected.bytes,name);assert.equal(hash(bytes),expected.sha256,name);
  }
  for(const c of data.cases)for(const frame of c.frames){
    assert.equal(manifest.files[frame.path].sha256,frame.sha256);
    assert.equal(manifest.files[frame.path].bytes,frame.bytes);
    assert.equal(frame.index%10,0);assert.ok(frame.source_path.startsWith('frames/rgb-'));
  }
  const source=await readFile(resolve(root,'scripts/build-camera-action-evidence.py'));
  assert.equal(hash(source),data.builder_sha256);
});

test('diagnostic-only scope, complete motor traces, occlusion and causal display sampling remain explicit',async()=>{
  const data=await json('evidence.json'), phases=await json('diagnostic-phase-coverage.json'), audit=await json('diagnostic-audit.json');
  assert.equal(data.status,'diagnostic-only');assert.equal(data.result_status,'pending');
  assert.equal(data.qualified_skill,false);assert.equal(data.physical_robot_ready,false);
  assert.equal(data.cases.length,4);assert.equal(new Set(data.cases.map(c=>c.group)).size,2);
  assert.equal(data.camera_source_hz,25);assert.equal(data.display_rgb_hz,2.5);assert.equal(data.motor_hz,50);
  assert.equal(audit.passed,true);assert.equal(audit.attempts_verified,4);
  assert.equal(phases.manipulation_decisions,749);assert.equal(phases.manipulation_available,0);
  let available=0,contact=0;
  for(const c of data.cases){
    assert.equal(c.frames.length,51);assert.equal(c.rows.length,1000);assert.equal(c.strict_success,true);
    for(let i=0;i<c.rows.length;i++){
      const r=c.rows[i];assert.ok(Math.abs(r.time-i*.02)<1e-8);
      assert.ok(r.frame_time<=r.time+1e-8);assert.ok(r.time-r.frame_time<.4+1e-8);
      assert.ok(r.camera_source_time<=r.time+1e-8);assert.ok(r.camera_age>=-1e-8&&r.camera_age<=.02+1e-8);
      assert.ok(Math.abs(r.interval_end-r.time-.02)<1e-8);assert.equal(r.authority,'teacher');
      for(const name of ['measured','issued','applied']){assert.equal(r[name].length,7);assert.ok(r[name].every(Number.isFinite))}
      if(r.available)available++;
      if(phases.manipulation_phases.includes(r.phase)){contact++;assert.equal(r.available,false)}
    }
  }
  assert.equal(available,2444);assert.equal(contact,749);
  assert.equal(hash(await readFile(resolve(run,'protocol.json'))),data.protocol_sha256);
  assert.equal(hash(await readFile(resolve(run,'diagnostic-stage.json'))),data.diagnostic_stage_sha256);
});

test('publication attribution, failed qualification and original diagnostic image links stay honest',async()=>{
  const catalog=JSON.parse(await readFile(resolve(root,'publications.json'),'utf8'));
  const publication=catalog.publications.find(x=>x.slug==='camera-to-action-v01');
  assert.equal(catalog.contributor,null);assert.match(publication.status,/5\/64 learned/);
  assert.match(publication.status,/not qualified/);
  const paper=await readFile(resolve(root,publication.source),'utf8');
  for(const phrase of ['diagnostic evidence only','0/749','not four independent','−0.2 s','1.1','ordinary human video','2.5 Hz'])assert.ok(paper.includes(phrase),phrase);
  const html=await readFile(resolve(run,'index.html'),'utf8');
  for(const phrase of ['student benchmark pending','2.5 Hz','749 of 749','one finger','not a live arm'])assert.ok(html.includes(phrase),phrase);
  assert.ok(!/\/Users\/|Bearer |apikey_/.test(html+paper));
  for(const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    if(/^(https:|mailto:|#)/.test(url))continue;
    assert.ok((await stat(resolve(run,url))).isFile(),url);
  }
});
