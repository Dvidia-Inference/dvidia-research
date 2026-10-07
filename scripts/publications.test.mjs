import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { gunzipSync } from "node:zlib";
import { buildPublications, renderMarkdown, ROOT, safeUrl, validatePublications } from "./build-papers.mjs";

const DOCS = resolve(ROOT, "docs");
async function files(directory) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) paths.push(...await files(path));
    else paths.push(path);
  }
  return paths.sort();
}

test("publication URLs reject executable schemes, credentials and disguised paths", () => {
  for (const url of ["javascript:alert(1)", "java%0ascript:alert(1)", "data:text/html,hello", "https://user:password@example.org/", "//evil.example/", "%2F%2Fevil.example/", "file:///Users/example", "https://example.org/\\evil", "mailto:other@example.org", "/Users/example"]) assert.equal(safeUrl(url), false, url);
  for (const url of ["https://arxiv.org/html/2607.08436", "https://example.org/paper%20title", "../downloads/reports/paper%20title.md", "#section", "mailto:hello@dvidia.org"]) assert.equal(safeUrl(url), true, url);
});

test("Markdown escapes raw HTML, preserves tables/citations, and rejects unsafe links", () => {
  const result = renderMarkdown('## Evidence\n\n<script>alert(1)</script>\n\n[Paper](https://example.org/paper)\n\n| Method | Result |\n| --- | --- |\n| CPU | 54 |\n\n## Evidence\n');
  assert.ok(!result.html.includes("<script>"));
  assert.match(result.html, /&lt;script&gt;/);
  assert.match(result.html, /<table>/);
  assert.match(result.html, /href="https:\/\/example.org\/paper"/);
  assert.deepEqual(result.toc.map(item => item.id), ["evidence", "evidence-2"]);
  assert.throws(() => renderMarkdown("[Danger](javascript:alert%281%29)"), /Unsafe publication link/);
});

test("publication attribution remains intentionally empty", async () => {
  const catalog = JSON.parse(await readFile(resolve(ROOT, "publications.json")));
  validatePublications(catalog);
  assert.equal(catalog.contributor, null);
  assert.ok(catalog.publications.length >= 6);
  assert.throws(() => validatePublications({ ...catalog, contributor: { name: "Someone" } }), /intentionally unset/);
});

test("publication dates support new research entries and reject impossible calendar days", async () => {
  const catalog = JSON.parse(await readFile(resolve(ROOT, "publications.json")));
  const withDate = date => ({ ...catalog, publications: catalog.publications.map((p, i) => i ? p : { ...p, date }) });
  assert.doesNotThrow(() => validatePublications(withDate("2027-03-01")));
  assert.doesNotThrow(() => validatePublications(withDate("2028-02-29")));
  assert.throws(() => validatePublications(withDate("2027-02-29")), /Invalid publication date/);
});

test("all generated readers, assets, downloads and fragments resolve without JavaScript", async () => {
  const built = await buildPublications();
  const catalog = JSON.parse(await readFile(resolve(ROOT, "publications.json")));
  assert.equal(built.pages.length, catalog.publications.length + 5);
  for (const page of built.pages) {
    const path = resolve(DOCS, page.path);
    const html = await readFile(path, "utf8");
    assert.match(html, /<h1>/);
    assert.ok(!/Tarzelf|JasonMcz|\/Users\/|\/private\/|file:\/\//.test(html), page.path);
    if (page.path.startsWith("papers/")) {
      assert.match(html, /class="paper-body"/);
      assert.match(html, /class="paper-abstract"/);
      assert.match(html, /Download Markdown/);
    }
    for (const [, raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const url = raw.replaceAll("&amp;", "&");
      if (/^(https:|mailto:)/.test(url)) continue;
      const [local, fragment] = url.split("#");
      const target = local ? resolve(dirname(path), decodeURIComponent(local.split("?")[0])) : path;
      assert.ok(target === DOCS || target.startsWith(`${DOCS}/`), `${page.path}: ${url}`);
      assert.ok((await stat(target)).isFile(), `${page.path}: ${url}`);
      if (fragment && target.endsWith(".html")) {
        const targetHtml = target === path ? html : await readFile(target, "utf8");
        assert.ok(targetHtml.includes(`id="${fragment}"`), `${page.path}: missing ${url}`);
      }
    }
  }
  const rss = await readFile(resolve(DOCS, "feed.xml"), "utf8");
  assert.equal([...rss.matchAll(/<item>/g)].length, catalog.publications.length);
  assert.equal([...rss.matchAll(/<guid isPermaLink="true">/g)].length, catalog.publications.length);
});

test("published benchmark source matches its recorded SHA and 54-trial evidence", async () => {
  const run = resolve(ROOT, "topics/physical-grounding/runs/2026-10-07-contact-fixture");
  const sourceHash = createHash("sha256").update(await readFile(resolve(run, "bench.py"))).digest("hex");
  const result = JSON.parse(await readFile(resolve(run, "results/local-cpu/results.json")));
  assert.equal(sourceHash, result.system.source_sha256);
  assert.equal(result.groups.reduce((n, group) => n + group.trials.length, 0), 54);
  assert.equal(result.system.training, false);
  const offline = JSON.parse(await readFile(resolve(run, "results/offline-check/socket-policy.json")));
  assert.equal(offline.air_gapped_wheel_install_tested, false);
  assert.deepEqual(offline.attempted_operations, []);
});

test("published cable product source matches its measured skill manifest and offline evidence", async () => {
  const root = resolve(ROOT, "topics/physical-grounding/runs/2026-10-07-cable-env");
  const manifest = JSON.parse(await readFile(resolve(root, "release-v0/manifest.json")));
  for (const [name, expected] of Object.entries(manifest.files)) {
    if (!name.startsWith("code/simlab/")) continue;
    const bytes = await readFile(resolve(root, name.slice("code/".length)));
    assert.equal(bytes.length, expected.bytes, name);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expected.sha256, name);
  }
  const result = JSON.parse(await readFile(resolve(root, "release-v0/run.json")));
  assert.equal(createHash("sha256").update(await readFile(resolve(root, "release-v0/run.json"))).digest("hex"), manifest.files["run.json"].sha256);
  assert.equal(result.scope, "simulation-only");
  assert.equal(result.summary.episodes, 10);
  assert.equal(result.summary.successes, 10);
  const report = result.qualification_protocol;
  assert.equal(report.comparisons.feedback.summary.successes, 10);
  assert.equal(report.comparisons.zero.summary.successes, 0);
  assert.equal(report.comparisons.release.summary.successes, 0);
  assert.equal(report.physical_evidence, null);
  assert.equal(report.gpu_measurements, null);
  assert.deepEqual(report.network_guard.attempted_calls, []);
  const offline = JSON.parse(await readFile(resolve(root, "native-offline/native-policy.json")));
  assert.equal(offline.passed, true);
  assert.equal(offline.errno, 1);
  const reproduced = JSON.parse(await readFile(resolve(root, "release-v0/reproduction.json")));
  assert.equal(reproduced.exact_trace_and_final_info_match, true);
});

test("published arm adapter binds exact source, contact outcomes and offline reproduction", async () => {
  const root = resolve(ROOT, "topics/physical-grounding/runs/2026-10-07-skillspace-arm");
  const manifest = JSON.parse(await readFile(resolve(root, "release-v0/manifest.json")));
  const result = JSON.parse(gunzipSync(await readFile(resolve(root, "release-v0/run.json.gz"))));
  assert.equal(manifest.scope, "simulation-only");
  assert.equal(manifest.physical_robot_ready, false);
  assert.equal(manifest.source_has_robot_policy, false);
  for (const [name, expected] of Object.entries(manifest.files)) {
    const path = name.startsWith("simlab/") ? resolve(root, name) : name.startsWith("evidence/") ? resolve(root, "release-v0", name.slice(9)) : null;
    if (!path || name === "evidence/run.json" || name === "README.md") continue;
    assert.equal(createHash("sha256").update(await readFile(path)).digest("hex"), expected, name);
  }
  assert.equal(createHash("sha256").update(gunzipSync(await readFile(resolve(root, "release-v0/run.json.gz")))).digest("hex"), manifest.files["evidence/run.json"]);
  assert.equal(result.skill.source_sha256, createHash("sha256").update(await readFile(resolve(root, "release-v0/source.json"))).digest("hex"));
  assert.equal(result.summary.by_policy.placement.successes, 6);
  assert.equal(result.summary.by_policy.idle.successes, 0);
  assert.equal(result.summary.by_policy.replay_open_jaw.successes, 0);
  assert.equal(new Set(result.episodes.map(e => e.scene_id)).size, 6);
  for (const episode of result.episodes.filter(e => e.policy === "placement")) {
    assert.equal(episode.final_info.success, true);
    assert.equal(episode.final_info.grasp_seen, true);
    assert.equal(episode.final_info.lift_seen, true);
    assert.deepEqual(episode.final_info.warnings, []);
    assert.equal(episode.final_info.grasp_contacts.left + episode.final_info.grasp_contacts.right, 0);
    assert.ok(episode.final_info.table_contacts > 0);
    assert.ok(episode.final_info.max_object_lift >= .055);
  }
  const offline = JSON.parse(await readFile(resolve(root, "native-offline/native-policy.json")));
  assert.equal(offline.passed, true);
  assert.equal(offline.errno, 1);
  const reproduced = JSON.parse(await readFile(resolve(root, "release-v0/reproduction.json")));
  assert.equal(reproduced.source_imported_from_extracted_bundle, true);
  assert.equal(reproduced.exact_trace_actions_final_info_match, true);
  for (const file of await files(root)) assert.ok((await stat(file)).size < 25 * 1024 * 1024, file);
});

test("improved arm evidence binds the frozen protocol, source and paired heldout outcomes", async () => {
  const root = resolve(ROOT, "topics/physical-grounding/runs/2026-10-07-arm-benchmark-v1");
  const evidence = resolve(root, "benchmark");
  const hash = bytes => createHash("sha256").update(bytes).digest("hex");
  const json = async path => JSON.parse(await readFile(path));
  const assessment = await json(resolve(evidence, "assessment.json"));
  const protocolBytes = await readFile(resolve(evidence, "protocol.json"));
  const protocol = JSON.parse(protocolBytes);
  assert.equal(hash(protocolBytes), assessment.protocol_sha256);
  assert.equal(assessment.criteria.unchanged, true);
  assert.equal(protocol.dev.length, 20);
  assert.equal(protocol.heldout.length, 32);
  const layouts = rows => rows.map(row => JSON.stringify([row.config.object_position, row.config.target_position]));
  assert.equal(new Set(layouts(protocol.heldout)).size, 32);
  assert.ok(layouts(protocol.heldout).every(layout => !layouts(protocol.dev).includes(layout)));
  const freeze = await json(resolve(evidence, "final-freeze.json"));
  assert.equal(freeze.protocol_sha256, assessment.protocol_sha256);
  assert.deepEqual(await json(resolve(evidence, "heldout-started.json")), freeze);
  for (const [label, files] of Object.entries(assessment.source_hashes)) {
    for (const [name, digest] of Object.entries(files)) {
      assert.equal(hash(await readFile(resolve(evidence, "snapshots", label, name))), digest);
      if (label === "final") assert.equal(hash(await readFile(resolve(root, "simlab", name))), digest);
    }
  }
  for (const [label, summary] of [["v0", assessment.heldout.baseline], ["final", assessment.heldout.final]]) {
    const result = await json(resolve(evidence, label, "heldout.json"));
    assert.equal(result.protocol_sha256, assessment.protocol_sha256);
    assert.equal(result.records.length, 32);
    assert.equal(summary.successes, result.records.filter(row => row.success).length);
    assert.equal(summary.groups.nominal.cases, 24);
    assert.equal(summary.groups.actuator_stress.cases, 8);
    assert.equal(result.control_checks.length, 6);
    assert.ok(result.control_checks.every(row => !row.success));
    for (const row of result.records) {
      assert.deepEqual(row.warning_counts, {});
      assert.deepEqual(row.model, { nq: 15, nv: 14, nu: 8, nmocap: 0, neq: 0 });
      if (row.success) {
        assert.equal(row.final_info.grasp_seen, true);
        assert.equal(row.final_info.lift_seen, true);
        assert.ok(row.final_info.table_contacts > 0);
        assert.ok(row.final_info.max_object_lift >= .055);
      }
    }
  }
  const paired = assessment.heldout.paired;
  assert.equal(paired.improved + paired.regressed + paired.both_success + paired.both_failure, 32);
  const offline = await json(resolve(root, "native-offline", "native-policy.json"));
  assert.equal(offline.passed, true);
  assert.equal(offline.errno, 1);
  const manifest = await json(resolve(root, "release", "manifest.json"));
  for (const [name, digest] of Object.entries(manifest.files)) assert.equal(hash(await readFile(resolve(root, name))), digest);
  assert.equal(manifest.physical_robot_ready, false);
  assert.equal(manifest.source_has_robot_policy, false);
  const harnessHash = hash(await readFile(resolve(root, "simlab", "arm_benchmark.py")));
  assert.equal(harnessHash, assessment.measurement_harness_hashes.baseline);
  assert.equal(harnessHash, assessment.measurement_harness_hashes.final);
  const reproduced = await json(resolve(root, "release", "reproduction.json"));
  assert.equal(reproduced.archive_sha256, hash(await readFile(resolve(root, "release", "simlab-v0.3.zip"))));
  assert.equal(reproduced.source_imported_from_extracted_bundle, true);
  assert.equal(reproduced.protocol_sha256, assessment.protocol_sha256);
  assert.deepEqual(reproduced.final_source_hashes, assessment.source_hashes.final);
  assert.equal(reproduced.manifest_file_hashes_checked, Object.keys(manifest.files).length);
  assert.equal(reproduced.all_match, true);
  assert.equal(reproduced.checks.length, 3);
  assert.ok(reproduced.checks.every(row => row.exact_control_steps_final_state_metrics_diagnostics_match));
  assert.equal(reproduced.network_guard.guard_self_test_passed, true);
  assert.deepEqual(reproduced.network_guard.attempted_calls, []);
  const demo = await json(resolve(root, "demo", "run.json"));
  for (const [name, digest] of Object.entries(demo.runtime.files_sha256)) assert.equal(hash(await readFile(resolve(root, "simlab", name))), digest);
  assert.equal(Object.keys(demo.runtime.files_sha256).length, 7);
  assert.equal(demo.skill.source_sha256, hash(await readFile(resolve(root, "demo", "source.json"))));
  assert.equal(demo.summary.successes, 1);
  assert.deepEqual(demo.environment_config.object_half_size, [.015, .02, .015]);
  assert.equal(demo.environment_config.object_mass, .08);
  assert.equal(demo.episodes[0].final_info.success, true);
  for (const file of await files(root)) assert.ok((await stat(file)).size < 25 * 1024 * 1024, file);
});

test("generated publication output is deterministic and excludes local session data", async () => {
  const snapshot = async () => {
    const paths = (await files(DOCS)).filter(path => /\/(?:papers|topics|downloads)\//.test(path) || /\/(?:index\.html|publications\.json|feed\.xml|sitemap\.xml|robots\.txt)$/.test(path));
    const result = new Map();
    for (const path of paths) {
      const bytes = await readFile(path);
      assert.ok(!/(?:\/Users\/|\/private\/tmp\/|Bearer\s+[A-Za-z0-9_-]+)/.test(bytes.toString("utf8")), path);
      result.set(path, createHash("sha256").update(bytes).digest("hex"));
    }
    return result;
  };
  const before = await snapshot();
  await buildPublications();
  assert.deepEqual(await snapshot(), before);
});
