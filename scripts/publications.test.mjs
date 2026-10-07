import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
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
  assert.equal(catalog.publications.length, 6);
  assert.throws(() => validatePublications({ ...catalog, contributor: { name: "Someone" } }), /intentionally unset/);
});

test("all generated readers, assets, downloads and fragments resolve without JavaScript", async () => {
  const built = await buildPublications();
  assert.equal(built.pages.length, 11);
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
  assert.equal([...rss.matchAll(/<item>/g)].length, 6);
  assert.equal([...rss.matchAll(/<guid isPermaLink="true">/g)].length, 6);
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
