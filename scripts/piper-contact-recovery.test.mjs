import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import test from "node:test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RUN = resolve(ROOT, "topics/physical-grounding/runs/2026-10-11-piper-recovery-v04");
const RECEIPT = resolve(RUN, "receipt");
const SOURCE = "ccf8f3d1c2a1977da855ba8f601499aa543a7b6c";
const REPORT_SHA = "899a05b44e9b76a597fb2683d433e445d84ae485ed95d15de463f3dab3173164";
const INTEGRITY_SHA = "b0f6c0302fce5a44f4afe4bbe2451875b1c7a049340f08911465171958ec5156";
const HF = "be267fe5a2419e2b0d8098b5126f5f351d7df48f";
const SEED = "941827";
const COUNTS = "[[0.8,0.04,\"history_placement\",2],[0.8,0.04,\"history_open_jaw\",0],[0.8,0.04,\"recovery_carry_placement\",2],[0.8,0.04,\"recovery_carry_open_jaw\",0],[0.8,0.04,\"recovery_placement\",2],[0.8,0.04,\"recovery_open_jaw\",0],[0.8,0.04,\"hold\",0],[0.8,0.06,\"history_placement\",0],[0.8,0.06,\"history_open_jaw\",0],[0.8,0.06,\"recovery_carry_placement\",0],[0.8,0.06,\"recovery_carry_open_jaw\",0],[0.8,0.06,\"recovery_placement\",0],[0.8,0.06,\"recovery_open_jaw\",0],[0.8,0.06,\"hold\",0],[0.55,0.04,\"history_placement\",2],[0.55,0.04,\"history_open_jaw\",0],[0.55,0.04,\"recovery_carry_placement\",2],[0.55,0.04,\"recovery_carry_open_jaw\",0],[0.55,0.04,\"recovery_placement\",2],[0.55,0.04,\"recovery_open_jaw\",0],[0.55,0.04,\"hold\",0],[0.55,0.06,\"history_placement\",0],[0.55,0.06,\"history_open_jaw\",0],[0.55,0.06,\"recovery_carry_placement\",0],[0.55,0.06,\"recovery_carry_open_jaw\",0],[0.55,0.06,\"recovery_placement\",0],[0.55,0.06,\"recovery_open_jaw\",0],[0.55,0.06,\"hold\",0],[0.15,0.04,\"history_placement\",0],[0.15,0.04,\"history_open_jaw\",0],[0.15,0.04,\"recovery_carry_placement\",0],[0.15,0.04,\"recovery_carry_open_jaw\",0],[0.15,0.04,\"recovery_placement\",0],[0.15,0.04,\"recovery_open_jaw\",0],[0.15,0.04,\"hold\",0],[0.15,0.06,\"history_placement\",0],[0.15,0.06,\"history_open_jaw\",0],[0.15,0.06,\"recovery_carry_placement\",0],[0.15,0.06,\"recovery_carry_open_jaw\",0],[0.15,0.06,\"recovery_placement\",0],[0.15,0.06,\"recovery_open_jaw\",0],[0.15,0.06,\"hold\",0]]";
const variants = ["history_placement", "history_open_jaw", "recovery_carry_placement", "recovery_carry_open_jaw", "recovery_placement", "recovery_open_jaw", "hold"];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const distance = (a, b) => Math.hypot(...a.map((x, i) => x-b[i]));

async function inventory(path, prefix="") {
  const files=[];
  for (const entry of await readdir(path, { withFileTypes:true })) {
    if (entry.isDirectory()) files.push(...await inventory(resolve(path, entry.name), `${prefix}${entry.name}/`));
    else { assert.ok(entry.isFile()); files.push(prefix+entry.name); }
  }
  return files;
}
function privacy(value) {
  if (typeof value === "string") assert.ok(!/(?:\/Users\/|\/private\/tmp\/|\/var\/folders\/|hf_[A-Za-z0-9]{30,}|gh[pousr]_[A-Za-z0-9]{30,}|-----BEGIN .*PRIVATE KEY-----)/.test(value));
  else if (Array.isArray(value)) value.forEach(privacy);
  else if (value && typeof value === "object") Object.entries(value).forEach(([key,item]) => { privacy(key); privacy(item); });
  else if (typeof value === "number") assert.ok(Number.isFinite(value));
}
async function raw(name) {
  return JSON.parse(gunzipSync(await readFile(resolve(RECEIPT, name)), { maxOutputLength:32*1024*1024 }));
}
function near(a,b) { assert.ok(Math.abs(a-b)<=1e-8, `${a} != ${b}`); }

test("v0.4 preserves complete frozen attempts, paired motion, raw timing and all outcomes", async () => {
  const sealBytes=await readFile(resolve(RECEIPT,"integrity.json"));
  assert.equal(sha(sealBytes), INTEGRITY_SHA);
  const seal=JSON.parse(sealBytes);
  assert.equal(seal.schema, "dvidia.piper-recovery-integrity/v0.4");
  assert.equal(Object.keys(seal.files).length,89);
  assert.deepEqual(new Set(await inventory(RECEIPT)),new Set([...Object.keys(seal.files),"integrity.json"]));
  const summaries=new Map();
  for (const [name,record] of Object.entries(seal.files)) {
    assert.ok(!name.startsWith("/")&&!name.split("/").includes(".."));
    const bytes=await readFile(resolve(RECEIPT,name));
    assert.equal(bytes.length,record.bytes,name);assert.equal(sha(bytes),record.sha256,name);
    if (!name.startsWith("attempts/")) continue;
    assert.match(name,/^attempts\/[a-z0-9_-]+\.json\.gz$/);
    assert.equal(record.encoding,"gzip");assert.equal(bytes.readUInt32LE(4),0);
    const decoded=gunzipSync(bytes,{maxOutputLength:32*1024*1024});
    assert.equal(decoded.length,record.decoded_bytes);assert.equal(sha(decoded),record.decoded_sha256);
    const a=JSON.parse(decoded);privacy(a);
    assert.equal(a.physical_robot_ready,false);assert.equal(a.learned_policy,false);
    assert.equal(typeof a.valid,"boolean");assert.equal(typeof a.success,"boolean");assert.ok(!a.success||a.valid);
    if (a.valid) {
      near(a.simulated_seconds,20);assert.equal(a.actions.length,1000);assert.equal(a.trajectory.length,1001);
      assert.deepEqual(a.warnings,[]);assert.equal(a.metrics.unexpected_contact_native_ticks,0);
      const times=a.timing.control_step_samples_seconds, ordered=[...times].sort((x,y)=>x-y);
      assert.equal(times.length,1000);assert.ok(times.every(t=>Number.isFinite(t)&&t>=0));
      assert.equal(a.timing.missed_control_boundaries,times.filter(t=>t>.02).length);
      near(a.timing.control_step_seconds.median,(ordered[499]+ordered[500])/2);
      near(a.timing.control_step_seconds.p95,ordered[949]);near(a.timing.control_step_seconds.max,ordered[999]);
      for (let i=0;i<1000;i++) {
        near(a.trajectory[i].t_seconds,i*.02);assert.deepEqual(a.trajectory[i].command,a.actions[i]);
        assert.deepEqual(a.arm_tape[i],a.actions[i].joint_targets_rad);
      }
      assert.equal(a.trajectory.at(-1).command,null);
      const events=a.grip_guard.events;
      assert.equal(a.recovery_evaluation.completion_time_s,a.success?a.metrics.first_success_time_seconds:null);
      const abort=events.find(e=>e.type==="abort");
      assert.equal(a.recovery_evaluation.abort_time_s,abort?abort.t_seconds:null);
      assert.equal(a.recovery_evaluation.holds.length,events.filter(e=>e.type==="reassessment_started").length);
      for (const e of events.filter(e=>e.type==="unchanged_retry_refused")) {
        assert.equal(a.policy_mode,"recovery");assert.equal(e.retry_index,0);
        assert.equal(e.diagnostic.acquisition_stable_closed_supported,true);
        assert.equal(a.success,false);
      }
      if (a.success) {
        const last=a.trajectory.at(-1);
        assert.equal(a.metrics.retention_lost,false);assert.equal(a.metrics.carry_complete,true);
        assert.ok(last.table_object_contact_count>0);assert.ok(Object.values(last.grasp_contact_counts).every(n=>n===0));
        assert.ok(last.gripper_joint_position_m[0]>.028&&last.gripper_joint_position_m[1]<-.028);
        assert.ok(distance(last.object_position_m,last.target_position_m)<=.025);
        assert.ok(last.tcp_position_m[2]-last.object_position_m[2]>=.1);
      }
    }
    summaries.set(name,Object.fromEntries(Object.entries(a).filter(([k])=>!["trajectory","actions","arm_tape"].includes(k))));
  }
  const reportBytes=await readFile(resolve(RECEIPT,"report.json"));assert.equal(sha(reportBytes),REPORT_SHA);
  const report=JSON.parse(reportBytes), protocolBytes=await readFile(resolve(RECEIPT,"protocol.json")), protocol=JSON.parse(protocolBytes);
  assert.equal(report.schema,"dvidia.piper-recovery-benchmark/v0.4");assert.equal(protocol.schema,"dvidia.piper-recovery-protocol/v0.4");
  assert.equal(protocol.cohort,"confirmation");assert.equal(protocol.seed,Number(SEED));assert.equal(protocol.planned_attempts,84);
  assert.deepEqual(report.protocol,protocol);assert.equal(report.protocol_sha256,sha(protocolBytes));
  assert.equal(report.attempted,84);assert.equal(report.attempts.length,84);assert.equal(summaries.size,84);
  assert.equal(protocol.scenes.length,12);assert.deepEqual(protocol.variants,variants);
  for (const a of report.attempts) assert.deepEqual(summaries.get(a.result_file),Object.fromEntries(Object.entries(a).filter(([k])=>k!=="result_file")));
  for (const scene of protocol.scenes) {
    const group=await Promise.all(variants.map(v=>raw(`attempts/${scene.id}--${v}.json.gz`)));
    for (const a of group.filter(a=>a.valid)) {
      assert.equal(a.compiled_model_sha256,group[0].compiled_model_sha256);
      assert.deepEqual(a.native_servo_gains,group[0].native_servo_gains);
      assert.deepEqual(a.native_force_limits,group[0].native_force_limits);
      assert.deepEqual(a.trajectory[0].qpos,group[0].trajectory[0].qpos);
    }
    for (const [a,b] of [[group[0],group[1]],[group[2],group[3]],[group[4],group[5]]]) {
      if (b.valid) assert.deepEqual(a.arm_tape,b.arm_tape);
      assert.ok(b.actions.every(x=>x.gripper_position_m===.035));
    }
    assert.ok(group[6].arm_tape.every(x=>JSON.stringify(x)===JSON.stringify(group[6].trajectory[0].joint_position_rad)));
    if (scene.friction===.8 && scene.mass_kg===.06) {
      for (const a of [group[0],group[2],group[4]]) {
        assert.equal(a.success,false);assert.equal(a.grip_guard.resume_count,0);
        assert.equal(a.grip_guard.abort_reason,"reassessment_timeout_unsettled_or_unknown");
        assert.ok(a.metrics.max_object_lift_m<.011);
        assert.deepEqual(a.actions,group[0].actions,"No speed restoration acts before this refusal");
        assert.deepEqual(a.trajectory.map(q=>[q.qpos,q.qvel]),group[0].trajectory.map(q=>[q.qpos,q.qvel]));
        const stop=a.trajectory[Math.round(a.recovery_evaluation.abort_time_s/.02)];
        assert.equal(stop.table_object_contact_count,0);
        assert.ok(Object.values(stop.pad_normal_forces_n).every(f=>f>.01));
        assert.ok(stop.guard_diagnostic.object_height_delta_m<.006);
        assert.ok(stop.guard_diagnostic.history_excursion_m<.0015);
      }
    }
  }
  for (const row of report.summary) {
    const group=report.attempts.filter(a=>a.variant===row.variant&&a.config.friction===row.friction&&a.config.mass_kg===row.mass_kg);
    assert.equal(row.attempted,group.length);assert.equal(row.valid,group.filter(a=>a.valid).length);assert.equal(row.success,group.filter(a=>a.valid&&a.success).length);
  }
  assert.deepEqual(report.summary.map(r=>[r.friction,r.mass_kg,r.variant,r.success]),JSON.parse(COUNTS));
  for (const comparison of report.paired_comparisons) for (const pair of comparison.pairs) {
    const [a,b]=[comparison.reference,comparison.candidate].map(m=>report.attempts.find(x=>x.scene_id===pair.scene_id&&x.variant===`${m}_placement`));
    const both=a.valid&&a.success&&b.valid&&b.success;
    if (both) near(pair.completion_delta_s,b.metrics.first_success_time_seconds-a.metrics.first_success_time_seconds);
    else assert.equal(pair.completion_delta_s,null);
    if (!a.success&&!b.success&&a.recovery_evaluation.abort_time_s!==null&&b.recovery_evaluation.abort_time_s!==null) near(pair.common_abort_delta_s,b.recovery_evaluation.abort_time_s-a.recovery_evaluation.abort_time_s);
    else assert.equal(pair.common_abort_delta_s,null);
  }
});

test("The six-failure diagnosis links to unchanged original v0.3 bytes", async () => {
  const analysis=JSON.parse(await readFile(resolve(RUN,"forensics/analysis.json"),"utf8"));privacy(analysis);
  const prior=resolve(ROOT,"topics/physical-grounding/runs/2026-10-11-piper-contact-v03/receipt");
  assert.equal(sha(await readFile(resolve(prior,"report.json"))),analysis.source_report_sha256);
  const failures=analysis.history_attempts.filter(a=>!a.success);assert.equal(failures.length,6);
  for (const a of analysis.history_attempts) {
    const bytes=await readFile(resolve(prior,"attempts",basename(a.source_path)));
    assert.equal(sha(bytes),a.source_sha256);
    const original=JSON.parse(gunzipSync(bytes));assert.deepEqual(a.metrics,original.metrics);
    for (const e of a.events) {
      const state=original.trajectory[Math.round(e.t_seconds/.02)];
      assert.deepEqual(e.pad_normal_forces_n,state.pad_normal_forces_n);assert.deepEqual(e.gripper_joint_position_m,state.gripper_joint_position_m);
      assert.deepEqual(e.diagnostic,state.guard_diagnostic);
    }
  }
  for (const a of failures) {
    assert.ok(a.metrics.max_object_lift_m<.00015);assert.equal(a.history_matches_probe_only_all_qpos_qvel_commands,true);
    assert.equal(a.effective_contact_friction_check.all_mu_match_scene,true);
    assert.ok(a.effective_contact_friction_check.max_abs_normal_z<.00204);
  }
});

test("Public v0.4 reader links exact evidence and has no draft placeholders", async () => {
  const paper=await readFile(resolve(ROOT,"reports/PiPER contact recovery v04.md"),"utf8");
  const catalog=JSON.parse(await readFile(resolve(ROOT,"publications.json"),"utf8"));
  const row=catalog.publications.find(p=>p.slug==="piper-contact-recovery-v04");assert.ok(row);
  for (const path of ["README.md","scripts/build-papers.mjs","publications.json","reports/PiPER contact recovery v04.md"]) {
    assert.ok(!/__[A-Z_]+__/.test(await readFile(resolve(ROOT,path),"utf8")),path);
  }
  assert.ok(paper.includes(SOURCE));assert.ok(paper.includes(HF));
  assert.match(paper,/84 planned attempts/);assert.match(paper,/not reached/);
  assert.match(paper,/declines the otherwise available unchanged retry/);
  assert.match(paper,/pauses the increase at its current scale/);
  assert.match(paper,/permanently disqualifies/);
  assert.ok(row.status.includes("hardware unqualified"));assert.equal(catalog.contributor,null);
  const execution=JSON.parse(await readFile(resolve(RUN,"execution.json"),"utf8"));
  assert.equal(execution.source_commit,SOURCE);assert.equal(execution.returncode,0);assert.equal(execution.seed,Number(SEED));
  const publication=JSON.parse(await readFile(resolve(RUN,"huggingface-publication.json"),"utf8"));
  assert.equal(publication.repo_id,"Dvidia/robot-simulation-lab");assert.equal(publication.repo_type,"space");
  assert.equal(publication.commit,HF);assert.equal(publication.verified_files,293);assert.deepEqual(publication.removed_files,[]);
});
