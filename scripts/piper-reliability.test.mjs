import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import test from "node:test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RUN = resolve(ROOT, "topics/physical-grounding/runs/2026-10-12-piper-reliability-v05");
const SOURCE = "e76b2e41256604d5b4314e45ca45959cab9aa571";
const RESULTS = "0545ac47aedcd7c197341986533aa3e74c263ac6";
const SEEDS = [832847, 227037, 862186];
const REPORT_HASHES = {"832847": "fada95d16e09c7458c7ef96b1edeb9075c360716c08007b9d5ce558a44d0216f", "227037": "525ec1f9b87fae472463df58e6b9c7d1976dba73e4ba729f02c53dd73ef0df18", "862186": "665b11c4cb35fa200823ad97052bd768b0a72bdc5e2fa05321265a852b80a1f7"};
const MODES = ["recovery", "reacquire", "reacquire_grasp"];
const VARIANTS = MODES.flatMap(mode => [mode+"_placement", mode+"_open_jaw"]).concat("hold");
const EXPECTED = {"832847": {"recovery": 4, "reacquire": 6, "reacquire_grasp": 7}, "227037": {"recovery": 6, "reacquire": 6, "reacquire_grasp": 8}, "862186": {"recovery": 5, "reacquire": 6, "reacquire_grasp": 8}, "total": {"recovery": 15, "reacquire": 18, "reacquire_grasp": 23}};
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const json = async path => JSON.parse(await readFile(path, "utf8"));
const near = (a,b) => assert.ok(Math.abs(a-b)<=1e-8, `${a} differs from ${b}`);

async function inventory(path, prefix="") {
  const files=[];
  for (const entry of await readdir(path, {withFileTypes:true})) {
    if (entry.isDirectory()) files.push(...await inventory(resolve(path,entry.name),prefix+entry.name+"/"));
    else { assert.ok(entry.isFile(), "Only regular sealed files are publishable"); files.push(prefix+entry.name); }
  }
  return files;
}
function privacy(value) {
  if (typeof value === "string") assert.ok(!/(?:\/Users\/|\/private\/tmp\/|\/var\/folders\/|hf_[A-Za-z0-9]{30,}|gh[pousr]_[A-Za-z0-9]{30,}|-----BEGIN .*PRIVATE KEY-----)/.test(value));
  else if (Array.isArray(value)) value.forEach(privacy);
  else if (value && typeof value === "object") Object.entries(value).forEach(([key,item])=>{privacy(key);privacy(item);});
  else if (typeof value === "number") assert.ok(Number.isFinite(value));
}

test("v0.5 publishes every complete paired attempt from three frozen cohorts", async () => {
  let frozenHashes=null;
  const totals=Object.fromEntries(MODES.map(mode=>[mode,0]));
  let attempts=0, controls=0, controlSuccesses=0, computationWindows=0;
  for (const seed of SEEDS) {
    const root=resolve(RUN,"receipts",String(seed));
    const seal=await json(resolve(root,"integrity.json"));
    assert.equal(seal.schema,"dvidia.piper-reliability-integrity/v0.5");
    assert.equal(Object.keys(seal.files).length,89);
    assert.deepEqual(new Set(await inventory(root)),new Set([...Object.keys(seal.files),"integrity.json"]));
    assert.equal(sha(await readFile(resolve(root,"report.json"))),REPORT_HASHES[String(seed)]);
    const report=await json(resolve(root,"report.json"));
    const protocol=await json(resolve(root,"protocol.json"));
    assert.equal(report.schema,"dvidia.piper-reliability-benchmark/v0.5");
    assert.equal(protocol.schema,"dvidia.piper-reliability-protocol/v0.5");
    assert.equal(protocol.seed,seed);assert.equal(protocol.cohort,"confirmation");
    assert.deepEqual(protocol.variants,VARIANTS);assert.equal(protocol.planned_attempts,84);
    assert.deepEqual(report.protocol,protocol);
    assert.equal(report.protocol_sha256,sha(await readFile(resolve(root,"protocol.json"))));
    assert.equal(report.attempted,84);assert.equal(report.scenes.length,12);
    assert.equal(report.physical_robot_ready,false);assert.equal(report.learned_policy,false);
    if (frozenHashes) assert.deepEqual(protocol.implementation_sha256,frozenHashes);
    else frozenHashes=protocol.implementation_sha256;
    assert.ok(frozenHashes["piper_grasp_strategy.py"]&&frozenHashes["piper_reacquisition.py"]);
    const byScene=new Map(), summaries=new Map();
    const counts=Object.fromEntries(MODES.map(mode=>[mode,0]));
    for (const [name,record] of Object.entries(seal.files)) {
      assert.ok(!name.startsWith("/")&&!name.split("/").includes(".."));
      const bytes=await readFile(resolve(root,name));
      assert.equal(bytes.length,record.bytes,name);assert.equal(sha(bytes),record.sha256,name);
      if (!name.startsWith("attempts/")) continue;
      assert.match(name,/^attempts\/[a-z0-9_-]+\.json\.gz$/);
      assert.equal(record.encoding,"gzip");assert.equal(bytes.readUInt32LE(4),0);
      const decoded=gunzipSync(bytes,{maxOutputLength:32*1024*1024});
      assert.equal(decoded.length,record.decoded_bytes);assert.equal(sha(decoded),record.decoded_sha256);
      const raw=JSON.parse(decoded);privacy(raw);
      attempts++;
      assert.equal(raw.physical_robot_ready,false);assert.equal(raw.learned_policy,false);
      assert.equal(typeof raw.valid,"boolean");assert.equal(typeof raw.success,"boolean");
      assert.equal(raw.valid,true);assert.deepEqual(raw.warnings,[]);
      assert.equal(raw.metrics.unexpected_contact_native_ticks,0);
      assert.ok(!raw.success||raw.valid);
      if (raw.valid) {
        near(raw.simulated_seconds,20);assert.equal(raw.actions.length,1000);assert.equal(raw.trajectory.length,1001);
        const durations=raw.timing.control_step_samples_seconds;
        assert.equal(durations.length,1000);assert.ok(durations.every(v=>Number.isFinite(v)&&v>=0));
        computationWindows+=durations.length;
        assert.equal(raw.timing.missed_control_boundaries,durations.filter(v=>v>.02).length);
        for (let i=0;i<1000;i++) {
          near(raw.trajectory[i].t_seconds,i*.02);
          assert.deepEqual(raw.actions[i],raw.trajectory[i].command);
          assert.deepEqual(raw.arm_tape[i],raw.actions[i].joint_targets_rad);
          assert.equal(typeof raw.trajectory[i].native_lift_seen,"boolean");
          assert.ok(!raw.trajectory[i].native_lift_seen||raw.trajectory[i+1].native_lift_seen);
        }
        assert.equal(raw.trajectory.at(-1).command,null);
        assert.equal(raw.trajectory.at(-1).native_lift_seen,raw.metrics.lift_seen);
      }
      if (raw.control==="placement") {
        counts[raw.policy_mode]+=Number(raw.valid&&raw.success);
        assert.equal(raw.recovery_evaluation.completion_time_s,raw.success?raw.metrics.first_success_time_seconds:null);
      } else {controls++;controlSuccesses+=Number(raw.valid&&raw.success);}
      const rows=byScene.get(raw.scene_id)||new Map();
      rows.set(raw.variant,{valid:raw.valid,success:raw.success,model:raw.compiled_model_sha256,config:raw.config,
        initial:raw.trajectory[0]&&[raw.trajectory[0].qpos,raw.trajectory[0].qvel,raw.trajectory[0].native_actuator_controls],
        tape:raw.arm_tape,completion:raw.recovery_evaluation.completion_time_s});
      byScene.set(raw.scene_id,rows);
      summaries.set(name,Object.fromEntries(Object.entries(raw).filter(([key])=>!["trajectory","actions","arm_tape"].includes(key))));
    }
    for (const row of report.attempts) {
      assert.deepEqual(summaries.get(row.result_file),Object.fromEntries(Object.entries(row).filter(([key])=>key!=="result_file")));
    }
    for (const rows of byScene.values()) {
      assert.deepEqual([...rows.keys()].sort(),[...VARIANTS].sort());
      const reference=rows.get("recovery_placement");
      for (const row of rows.values()) {
        assert.deepEqual(row.config,reference.config);
        if (row.valid&&reference.valid) {assert.equal(row.model,reference.model);assert.deepEqual(row.initial,reference.initial);}
      }
      for (const mode of MODES) assert.deepEqual(rows.get(mode+"_open_jaw").tape,rows.get(mode+"_placement").tape);
    }
    for (const comparison of report.paired_comparisons) {
      let gains=0,losses=0,common=0;const deltas=[];
      for (const rows of byScene.values()) {
        const a=rows.get(comparison.reference+"_placement"),b=rows.get(comparison.candidate+"_placement");
        gains+=Number(!a.success&&b.success);losses+=Number(a.success&&!b.success);
        if(a.success&&b.success){common++;deltas.push(b.completion-a.completion);}
      }
      assert.equal(comparison.gained_successes,gains);assert.equal(comparison.lost_successes,losses);assert.equal(comparison.common_successes,common);
      if(deltas.length)near(comparison.common_success_mean_delta_s,deltas.reduce((a,b)=>a+b)/deltas.length);
      else assert.equal(comparison.common_success_mean_delta_s,null);
    }
    assert.deepEqual(counts,EXPECTED[String(seed)]);
    for(const mode of MODES)totals[mode]+=counts[mode];
  }
  assert.equal(attempts,252);assert.equal(controls,144);assert.equal(controlSuccesses,0);assert.equal(computationWindows,252000);
  assert.deepEqual(totals,EXPECTED.total);
});

test("v0.5 public writing preserves evidence scope, identity, licenses and completed publication links", async () => {
  const paper=await readFile(resolve(ROOT,"reports/PiPER reliability v05.md"),"utf8");
  const readme=await readFile(resolve(RUN,"README.md"),"utf8");
  const catalog=await json(resolve(ROOT,"publications.json"));
  assert.equal(catalog.contributor,null);assert.equal(catalog.follow,"https://x.com/iammrriver");assert.equal(catalog.contact,"hello@dvidia.org");
  const entry=catalog.publications.find(row=>row.slug==="piper-reliability-v05");assert.ok(entry);
  assert.equal(entry.date,"2026-10-12");
  for(const phrase of ["252","144","200","0.841","0.7335","privileged","CC BY 4.0","MIT",SOURCE,"no tuning between cohorts"])
    assert.ok(paper.includes(phrase),phrase);
  for(const seed of SEEDS)assert.ok(paper.includes("receipts/"+seed+"/report.json"));
  for(const text of [paper,readme,JSON.stringify(entry)])assert.ok(!/__[A-Z_]+__|Draft awaiting|pending publication|TODO|TBD/.test(text));
  assert.ok(paper.includes("https://huggingface.co/spaces/Dvidia/robot-simulation-lab"));
  assert.ok(paper.includes("https://github.com/Dvidia-Inference/dvidia-training"));
  const provenance=await json(resolve(RUN,"provenance.json"));privacy(provenance);
  assert.equal(provenance.source_commit,SOURCE);
  assert.equal(provenance.publication_source_commit,RESULTS);
  assert.equal(provenance.huggingface_publication,"huggingface-publication.json");
  const publication=await json(resolve(RUN,provenance.huggingface_publication));privacy(publication);
  assert.equal(publication.repo_id,"Dvidia/robot-simulation-lab");assert.equal(publication.repo_type,"space");
  assert.match(publication.commit,/^[0-9a-f]{40}$/);assert.equal(provenance.huggingface_commit,publication.commit);
  assert.equal(publication.verified_files,563);assert.deepEqual(publication.removed_files,[]);
  assert.ok(paper.includes(publication.commit));assert.ok(paper.includes(RESULTS));assert.ok(readme.includes(RESULTS));
  assert.equal(sha(await readFile(resolve(RUN,"analysis.json"))),provenance.analysis_sha256);
  assert.equal(sha(await readFile(resolve(RUN,"installed-runtime.json"))),provenance.installed_runtime_sha256);
  const checks=await json(resolve(RUN,"github-validation.json"));privacy(checks);
  assert.equal(checks.head_commit,RESULTS);assert.equal(checks.checks.length,28);
  assert.ok(checks.checks.every(check=>check.state==="SUCCESS"));
  assert.ok(paper.includes("github-validation.json"));assert.ok(readme.includes("github-validation.json"));
});
