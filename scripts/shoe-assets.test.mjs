import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import test from "node:test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RUN = resolve(ROOT, "topics/physical-grounding/runs/2026-10-12-shoe-asset-library-v01");
const LIBRARY = resolve(RUN, "library");
const BENCHMARK = "441ee2871620104246ab9caeb89825f12a14b889";
const ROBOTS = ["ur5e", "piper", "so101"];
const FAMILIES = ["trainer", "ankle-boot", "slipper"];
const SHOE_IDS = FAMILIES.flatMap(family => [family+"-left", family+"-right"]);
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const json = async path => JSON.parse(await readFile(path, "utf8"));
const near = (a, b, tolerance=1e-9) => assert.ok(Math.abs(a-b) <= tolerance, `${a} differs from ${b}`);

async function inventory(directory, prefix="") {
  const files = [];
  for (const entry of await readdir(directory, {withFileTypes:true})) {
    if (entry.isDirectory()) files.push(...await inventory(resolve(directory, entry.name), prefix+entry.name+"/"));
    else {assert.ok(entry.isFile(), "Release evidence must be regular files"); files.push(prefix+entry.name);}
  }
  return files;
}

async function verifySeal(root, sealName, schema, expectedCount) {
  const seal = await json(resolve(root, sealName));
  assert.equal(seal.schema, schema);
  const files = await inventory(root);
  assert.equal(files.length, expectedCount);
  assert.deepEqual(new Set(files), new Set([...Object.keys(seal.files), sealName]));
  for (const [name, record] of Object.entries(seal.files)) {
    assert.ok(!name.startsWith("/") && !name.split("/").includes(".."));
    const bytes = await readFile(resolve(root, name));
    assert.equal(bytes.length, record.bytes, name);
    assert.equal(sha(bytes), record.sha256, name);
  }
  return seal;
}

function privacy(value) {
  if (typeof value === "string") assert.ok(!/(?:\/Users\/|\/private\/tmp\/|\/var\/folders\/|hf_[A-Za-z0-9]{30,}|gh[pousr]_[A-Za-z0-9]{30,}|-----BEGIN .*PRIVATE KEY-----)/.test(value));
  else if (Array.isArray(value)) value.forEach(privacy);
  else if (value && typeof value === "object") Object.entries(value).forEach(([key,item])=>{privacy(key);privacy(item);});
  else if (typeof value === "number") assert.ok(Number.isFinite(value));
}

test("shoe library retains all sealed native assets, three previews and their licenses", async () => {
  await verifySeal(LIBRARY, "library-integrity.json", "dvidia.asset-library-release/v0.1", 64);
  const catalog = await json(resolve(LIBRARY, "catalog.json"));
  privacy(catalog);
  assert.equal(catalog.schema, "dvidia.asset-catalog/v1");
  assert.equal(catalog.version, "0.1.0");
  assert.equal(catalog.license, "MIT");
  assert.deepEqual(catalog.robots.map(robot=>robot.id), ROBOTS);
  assert.deepEqual(catalog.robots.map(robot=>robot.arm_axes), [6,6,5]);
  assert.deepEqual(catalog.shoes.map(shoe=>shoe.id), SHOE_IDS);
  assert.equal(catalog.catalog_sha256, "592f363389a96fef7f9223737aa72a2f1a74f400238924bf6790ec5bfd3302b7");
  for (const shoe of catalog.shoes) {
    assert.equal(shoe.source.kind, "original_procedural");
    assert.equal(shoe.license, "MIT");
    assert.equal(shoe.fidelity.physical_robot_ready, false);
    assert.equal(shoe.fidelity.shoe_grasp_qualified, false);
    assert.ok(Object.values(shoe.properties).every(property=>property.evidence==="untested"));
  }
  const provenance = await json(resolve(LIBRARY, "provenance.json"));
  const viewerBuild = await json(resolve(RUN, "viewer-build.json"));
  privacy(provenance);
  privacy(viewerBuild);
  assert.match(provenance.source_commit, /^[0-9a-f]{40}$/);
  assert.equal(provenance.source_commit, "45bef6315c9632b33915e1ce993babd2926b8f7d");
  assert.equal(provenance.benchmark_source_commit, BENCHMARK);
  assert.equal(viewerBuild.source_commit, "17a7c81784362697f09757712efbe00d98743501");
  assert.equal(viewerBuild.benchmark_source_commit, BENCHMARK);
  assert.equal(provenance.physical_robot_ready, false);
  assert.equal(provenance.learned_policy, false);
  assert.deepEqual(provenance.robots, ROBOTS);
  for (const [index, robot] of ROBOTS.entries()) {
    const root = resolve(LIBRARY, "previews", robot);
    await verifySeal(root, "preview-integrity.json", "dvidia.asset-preview-integrity/v1", index===0?19:17);
    assert.equal(sha(await readFile(resolve(root,"preview-integrity.json"))),viewerBuild.previews[robot].corrected_integrity_sha256);
    assert.equal(viewerBuild.previews[robot].native_geometry_motion_and_descriptors_byte_identical,true);
    assert.equal(sha(await readFile(resolve(root,"asset_library.bundle.js"))),viewerBuild.installed_module_sha256["asset_library.bundle.js"]);
    const scene = await json(resolve(root, "scene.json"));
    const model = await json(resolve(root, "model.json"));
    const motion = await json(resolve(root, "motion.json"));
    privacy(scene); privacy(model); privacy(motion);
    assert.equal(scene.schema, "dvidia.asset-scene/v1");
    assert.equal(scene.robot, robot);
    assert.equal(scene.catalog_version, catalog.version);
    assert.equal(scene.catalog_sha256, catalog.catalog_sha256);
    assert.deepEqual(scene.shoe_ids, SHOE_IDS);
    assert.equal(scene.timestep, .002);
    assert.equal(model.schema, "dvidia.asset-preview-model/v1");
    assert.equal(motion.schema, "dvidia.asset-preview-motion/v1");
    assert.equal(model.bodies.length, [28,16,15][index]);
    assert.equal(motion.body_count, model.bodies.length);
    assert.equal(motion.frame_count, 101);
    assert.equal(motion.duration_seconds, 2);
    assert.equal(motion.frame_stride_floats, model.bodies.length*7);
    assert.deepEqual(motion.source, model.source);
    assert.equal(model.source.robot, robot);
    assert.equal(model.source.mujoco, "3.15.0");
    assert.equal(model.source.scene_sha256, sha(await readFile(resolve(root, "scene.json"))));
    assert.deepEqual(model.bodies.filter(body=>body.name.startsWith("shoe_")).map(body=>body.name),
                     SHOE_IDS.map(name=>"shoe_"+name.replaceAll("-", "_")));
    for (const property of [model.geometry_binary, motion.motion_binary]) {
      const compressed = await readFile(resolve(root, property.href));
      const decoded = gunzipSync(compressed, {maxOutputLength:32*1024*1024});
      assert.equal(compressed.length, property.compressed_bytes);
      assert.equal(decoded.length, property.bytes);
      assert.equal(sha(decoded), property.sha256);
      if (property===motion.motion_binary) {
        assert.equal(decoded.length, motion.frame_count*motion.frame_stride_floats*4);
        for(let offset=0;offset<decoded.length;offset+=4)assert.ok(Number.isFinite(decoded.readFloatLE(offset)));
      }
    }
    assert.ok(model.meshes.length>0, "Native robot meshes must accompany the preview");
    for (const family of FAMILIES) {
      const selected = await json(resolve(root, "scenes", family+".json"));
      assert.equal(selected.robot, robot);
      assert.equal(selected.catalog_sha256, catalog.catalog_sha256);
      assert.deepEqual(selected.shoe_ids, [family+"-left", family+"-right"]);
    }
    for(const row of motion.rows)assert.equal(row.joint_position.length,[14,8,6][index]);
    assert.ok(motion.scope.includes("does not run physics"));
    assert.ok(motion.scope.includes("No learned shoe skill"));
    for (const name of Object.keys(catalog.robots[index].licenses))
      assert.ok((await readFile(resolve(root, "licenses", name, "LICENSE"))).length>100);
  }
});

test("shoe benchmark preserves all 54 frozen attempts, matched controls and raw timing", async () => {
  const root = resolve(LIBRARY, "benchmark");
  await verifySeal(root, "integrity.json", "dvidia.asset-library-integrity/v1", 5);
  assert.equal(sha(await readFile(resolve(root, "report.json"))), "83cc1d82bfcb4463dc6e34077b7b496b59216165dad1d91eabdfa2c33978a243");
  const protocol = await json(resolve(root, "protocol.json"));
  const payload = await json(resolve(root, "attempts.json"));
  const report = await json(resolve(root, "report.json"));
  const installed = await json(resolve(RUN, "installed-runtime.json"));
  const viewerBuild = await json(resolve(RUN, "viewer-build.json"));
  privacy(protocol);privacy(payload);privacy(report);privacy(installed);
  assert.equal(protocol.source_commit, BENCHMARK);
  assert.equal(installed.source_commit, BENCHMARK);
  assert.equal(installed.network_denied_socket_bind, true);
  assert.equal(Object.keys(installed.installed_module_sha256).length, 14);
  for(const [name,hash] of Object.entries(protocol.implementation_sha256))assert.equal(installed.installed_module_sha256[name],hash,name);
  assert.deepEqual(viewerBuild.native_implementation_sha256,protocol.implementation_sha256);
  assert.equal(protocol.seed, 612047); assert.equal(protocol.repeats, 3);
  assert.equal(protocol.planned_attempts, 54); assert.equal(report.attempted, 54);
  assert.equal(payload.attempts.length, 54);
  assert.equal(new Set(payload.attempts.map(row=>row.plan.id)).size, 54);
  assert.equal(report.protocol_sha256, sha(await readFile(resolve(root, "protocol.json"))));
  assert.equal(payload.protocol_sha256, report.protocol_sha256);
  assert.equal(report.attempts_sha256, sha(await readFile(resolve(root, "attempts.json"))));
  assert.equal(report.physical_robot_ready, false); assert.equal(report.shoe_manipulation_qualified, false);
  let support=0, controls=0, nativeSteps=0;
  for(const [index,attempt] of payload.attempts.entries()) {
    assert.deepEqual(attempt.plan, protocol.attempts[index]);
    assert.equal(attempt.error,null);assert.deepEqual(attempt.warnings,[]);assert.equal(attempt.native_warning_count,0);
    assert.equal(attempt.scores.valid,true);assert.equal(attempt.scores.expected_outcome,true);
    assert.equal(attempt.scores.gravity_success,true);assert.equal(attempt.scores.unexpected_contact_detected,false);
    assert.equal(attempt.simulated_seconds,1);assert.equal(attempt.trajectory.length,51);
    assert.equal(attempt.native_step_wall_seconds.length,500);
    assert.ok(attempt.native_step_wall_seconds.every(value=>Number.isFinite(value)&&value>=0));
    nativeSteps+=attempt.native_step_wall_seconds.length;
    const supported=attempt.plan.control==="table_support";
    assert.equal(attempt.scores.support_success,supported);
    if(supported)support++;else controls++;
    assert.deepEqual(attempt.model_contract.table_collision_masks,supported?[1,1]:[0,0]);
    assert.deepEqual(attempt.model_contract.gravity_m_s2,[0,0,-9.81]);
    for(const [frame,row] of attempt.trajectory.entries()) {
      near(row.t_seconds,frame*.02);
      assert.deepEqual(row.controls_native,attempt.trajectory[0].controls_native);
      assert.equal(Object.keys(row.shoes).length,2);
      for(const shoe of Object.values(row.shoes)) {assert.equal(shoe.other_contacts,0);assert.deepEqual(shoe.other_contact_geoms,[]);}
    }
    for(const placement of attempt.plan.placements) {
      const name=placement.shoe_id;
      const first=attempt.trajectory[0].shoes[name], last=attempt.trajectory.at(-1).shoes[name];
      assert.deepEqual(first.body_position_m,placement.position_m);
      assert.equal(attempt.model_contract.shoes[name].free_joint,true);
      assert.equal(attempt.model_contract.shoes[name].gravity_compensation,0);
      if(supported) {assert.ok(last.support_contacts>0);assert.ok(last.support_normal_force_n>0);assert.ok(Math.abs(last.bottom_m)<.008);}
      else {assert.ok(first.body_position_m[2]-last.body_position_m[2]>=.1);assert.equal(last.support_contacts,0);}
    }
    if(index%2===1)assert.deepEqual(attempt.plan.placements,payload.attempts[index-1].plan.placements);
  }
  assert.equal(support,27);assert.equal(controls,27);assert.equal(nativeSteps,27000);
  for(const row of report.summary) {
    assert.equal(row.attempted,9);assert.equal(row.valid,9);assert.equal(row.gravity_success,9);
    assert.equal(row.expected_outcome,9);assert.equal(row.unexpected_contact_attempts,0);
    assert.equal(row.support_success,row.control==="table_support"?9:0);
  }
  assert.equal(report.hardware.cpu_model,"Apple M5");assert.equal(report.hardware.logical_cpu_count,10);
  assert.equal(report.hardware.total_memory_bytes,24*1024**3);
  near(report.timing.run_wall_seconds,12.361563832964748);
  near(report.timing.attempt_wall.max_seconds,6.704695750027895);
  assert.equal(report.timing.process_peak_rss_bytes,1111916544);
});

test("shoe publication exposes source and evidence while preserving the limited qualification", async () => {
  const paper=await readFile(resolve(ROOT,"reports/Shoe asset library v01.md"),"utf8");
  const readme=await readFile(resolve(RUN,"README.md"),"utf8");
  const catalog=await json(resolve(ROOT,"publications.json"));
  const provenance=await json(resolve(LIBRARY,"provenance.json"));
  const entry=catalog.publications.find(row=>row.slug==="shoe-asset-library-v01");
  assert.ok(entry);assert.equal(entry.date,"2026-10-12");
  assert.equal(catalog.contributor,null);assert.equal(catalog.follow,"https://x.com/iammrriver");assert.equal(catalog.contact,"hello@dvidia.org");
  for(const phrase of ["27/27","0/27","54/54","6.7047","12.3616","15.75","23.42","20 ms","untested","CC BY 4.0",BENCHMARK,provenance.source_commit,"17a7c81784362697f09757712efbe00d98743501"])
    assert.ok(paper.includes(phrase),phrase);
  let publishedBytes=0;
  for(const name of await inventory(LIBRARY))publishedBytes+=(await readFile(resolve(LIBRARY,name))).length;
  assert.equal(publishedBytes,21197720);
  assert.ok(paper.includes(publishedBytes.toLocaleString("en-US")));
  assert.ok(readme.includes(publishedBytes.toLocaleString("en-US")));
  assert.ok(paper.includes("No real specimen was scanned, weighed or mechanically calibrated"));
  assert.ok(paper.includes("A shoe-organizing policy is a subsequent task"));
  assert.ok(paper.includes("https://dvidia-robot-simulation-lab.static.hf.space/asset-library/v01/index.html"));
  assert.ok(paper.includes("https://huggingface.co/spaces/Dvidia/robot-simulation-lab"));
  assert.ok(paper.includes("https://github.com/Dvidia-Inference/dvidia-training"));
  for(const text of [paper,readme,JSON.stringify(entry)])assert.ok(!/__[A-Z_]+__|RESULTS_PENDING|PERFORMANCE_PENDING|SOURCE_PENDING|TODO|TBD/.test(text));
  const build=await readFile(resolve(ROOT,"scripts/build-papers.mjs"),"utf8");
  assert.ok(build.includes("papers/shoe-asset-library-v01/index.html"));
  assert.ok(build.includes("downloads/topics/physical-grounding/runs/2026-10-12-shoe-asset-library-v01/library/index.html"));
});
