import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { ROOT } from './build-papers.mjs';
const RUN=resolve(ROOT,'topics/physical-grounding/runs/2026-10-13-continuous-shoe-grip-v02');
const SHA='af8933994b4626e28a0554abc782ae9d22cff06c';
const hash=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>JSON.parse(await readFile(p));
async function files(dir){let out=[];for(const e of await readdir(dir,{withFileTypes:true})){assert.ok(!e.isSymbolicLink());const p=resolve(dir,e.name);if(e.isDirectory())out.push(...await files(p));else{assert.ok(e.isFile());out.push(p);}}return out;}
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('continuous grip archive keeps the complete sealed export and independent audit',async()=>{
 const archive=await json(resolve(RUN,'provenance.json'));
 assert.equal(archive.source_commit,SHA);assert.equal(archive.lab_copied_without_modification,true);
 const actual=(await files(RUN)).map(p=>p.slice(RUN.length+1)).filter(p=>p!=='provenance.json');
 assert.deepEqual(actual.sort(),Object.keys(archive.files).sort());
 for(const [name,item] of Object.entries(archive.files)){const bytes=await readFile(resolve(RUN,name));assert.equal(bytes.length,item.bytes);assert.equal(hash(bytes),item.sha256);assert.ok(bytes.length<25*1024*1024);}
 const lab=actual.filter(p=>p.startsWith('lab/'));assert.equal(lab.length,87);assert.equal(archive.lab_export_files,87);
 assert.equal(lab.reduce((n,p)=>n+archive.files[p].bytes,0),75142307);
 const seal=await json(resolve(RUN,'lab/integrity.json'));
 assert.deepEqual(Object.keys(seal.files).sort(),lab.filter(p=>p!=='lab/integrity.json').map(p=>p.slice(4)).sort());
 for(const [p,item] of Object.entries(seal.files))assert.deepEqual(item,archive.files['lab/'+p]);
 const audit=await json(resolve(RUN,'audit/native-audit.json')), gate=await json(resolve(RUN,'audit/acceptance.json'));
 assert.equal(audit.source_commit,SHA);assert.equal(audit.fresh_simulations_executed_during_audit,0);
 assert.equal(audit.compiled_model_checks_without_physics_steps,10);
 assert.equal(audit.integrity_sha256,hash(await readFile(resolve(RUN,'lab/integrity.json'))));
 assert.equal(audit.protocol_sha256,hash(await readFile(resolve(RUN,'lab/protocol.json'))));
 assert.equal(gate.native_audit_sha256,hash(await readFile(resolve(RUN,'audit/native-audit.json'))));
 assert.equal(gate.benchmark_sha256,hash(await readFile(resolve(RUN,'lab/benchmark.json'))));
 assert.deepEqual(audit.bilateral_loss_to_detector_ms,{count:9,min:20,median:30,max:52});
 assert.deepEqual(audit.recovery_requests_by_reason,{bilateral_contact_lost:9,bilateral_acquisition_failed:3});
 assert.equal(audit.issued_recovery_packets,12);assert.equal(audit.completed_after_recovery,0);
 const script=await readFile(resolve(RUN,'audit/native_audit.py'),'utf8');assert.ok(!script.includes('/Users/'));assert.match(script,/--assets/);
});
test('continuous grip preserves all attempts and independently retains only the final qualified window',async()=>{
 const raw=await readFile(resolve(RUN,'lab/protocol.json')),p=JSON.parse(raw),b=await json(resolve(RUN,'lab/benchmark.json'));
 assert.equal(p.source_commit,SHA);assert.equal(b.source.commit,SHA);assert.equal(b.source.protocol_sha256,hash(raw));
 assert.equal(b.learned_policy,false);assert.equal(b.hardware_validated,false);assert.equal(p.attempts.length,20);assert.equal(b.attempts.length,20);
 const validWindow=r=>r[7]>.035&&r[3]>.01&&r[4]>.01&&r[8]<.01&&r[1]<.01&&Math.max(0,r[2]-r[3]-r[4])<.01;
 for(let i=0;i<20;i++){
  const row=b.attempts[i];for(const k of ['id','task','policy','case'])assert.deepEqual(row[k],p.attempts[i][k]);
  const trial=await json(resolve(RUN,'lab/trials/'+row.id+'.json'));const trace=trial.native_trace;delete trial.native_trace;assert.deepEqual(trial,row);
  assert.ok(row.valid);assert.ok(trace.every(x=>x.length===row.native_trace_columns.length&&x.every(Number.isFinite)));
  assert.ok(trace.slice(1).every((x,i)=>Math.abs(x[0]-trace[i][0]-.002)<1e-8));
  const last=trace.slice(-250);assert.equal(row.independent_score.strict_passing_ticks,last.filter(validWindow).length);
  assert.equal(row.independent_score.strict_retention_pass,last.every(validWindow));
  assert.equal(row.success,row.independent_score.retrieval_evidenced&&last.every(validWindow));
  if(row.case.id==='fresh-05'||row.id.includes('fresh-05')){const gap=trace.filter(x=>x[0]>=19.076-1e-8&&x[0]<=19.238+1e-8);assert.equal(gap.length,82);assert.ok(gap.every(x=>!validWindow(x)&&x[3]>.01&&x[4]>.01&&x[7]>.035&&x[8]<.01&&x[1]<.01));}
 }
 for(const policy of ['baseline','recovery'])assert.equal(b.attempts.filter(r=>r.policy===policy&&r.success).length,2);
 const a=b.attempts.filter(r=>r.policy==='baseline'),c=b.attempts.filter(r=>r.policy==='recovery');
 for(let i=0;i<10;i++){assert.deepEqual(a[i].case,c[i].case);assert.equal(a[i].success,c[i].success);assert.equal(a[i].independent_score.compiled_model_sha256,c[i].independent_score.compiled_model_sha256);}
});
test('continuous grip timing and historical regression remain separate and mirror CORS is scoped',async()=>{
 const b=await json(resolve(RUN,'lab/benchmark.json')),a=await json(resolve(RUN,'analysis.json'));
 assert.equal(a.benchmark_sha256,hash(await readFile(resolve(RUN,'lab/benchmark.json'))));
 for(const policy of ['baseline','recovery']){const rows=b.attempts.filter(r=>r.policy===policy),x=a.policies[policy];close(x.native_wall_seconds,rows.reduce((n,r)=>n+r.wall_seconds,0));close(x.audit_export_wall_seconds,rows.reduce((n,r)=>n+r.export_seconds,0));assert.equal(x.target_solver_calls,rows.reduce((n,r)=>n+r.control_compute_ms.length,0));}
 const reg=await json(resolve(RUN,'supplemental/regression-benchmark.json'));assert.equal(reg.attempts.length,18);assert.ok(reg.attempts.every(r=>r.valid));for(const policy of ['baseline','recovery'])assert.equal(reg.attempts.filter(r=>r.policy===policy&&r.success).length,1);
 const headers=await readFile(resolve(ROOT,'docs/_headers'),'utf8');const block=headers.split('\n\n').find(s=>s.startsWith('/downloads/topics/physical-grounding/runs/2026-10-13-continuous-shoe-grip-v02/lab/assets/*\n'));assert.ok(block);assert.match(block,/Access-Control-Allow-Origin: https:\/\/dvidia-robot-simulation-lab\.static\.hf\.space/);assert.match(block,/Content-Type: application\/gzip/);for(const p of await files(resolve(RUN,'lab/assets')))assert.ok(p.endsWith('.bin.gz'));
});
