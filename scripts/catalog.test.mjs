import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  copyFile,
  readFile,
  writeFile,
  rm,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const REPOSITORY = "https://github.com/Dvidia-Inference/dvidia-research";
const topic = () => ({
  id: "sample-topic",
  title: "A small testable question",
  kicker: "Methods",
  summary: "A fixture for checking the catalog, not a research result.",
  status: "scoping",
  cover: "assets/sample-topic.webp",
  imageAlt: "Editorial illustration fixture",
  updated: "2026-10-06",
  sources: [
    {
      id: "reference2024",
      title: "A reference",
      url: "https://example.org/paper",
      type: "paper",
      year: 2024,
    },
  ],
  questions: [
    {
      id: "first-question",
      text: "What can we measure?",
      state: "open",
      issueUrl: null,
    },
  ],
  milestones: [{ label: "Define a baseline", done: false }],
  firstTask: { title: "Write down the measurement", issueUrl: null },
});

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "dvidia-research-catalog-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const path of [
    "scripts",
    "topics/sample-topic",
    "docs/assets",
    "reports",
  ])
    await mkdir(resolve(root, path), { recursive: true });
  for (const path of [
    "scripts/validate.mjs",
    "scripts/build-catalog.mjs",
    "docs/index.html",
    "docs/styles.css",
    "docs/app.js",
    "docs/assets/favicon.svg",
    "docs/assets/capture-quality.webp",
  ])
    await copyFile(resolve(ROOT, path), resolve(root, path));
  // Reuse an actual public editorial asset; tests never fetch images or source URLs.
  await copyFile(
    resolve(ROOT, "docs/assets/capture-quality.webp"),
    resolve(root, "docs/assets/sample-topic.webp"),
  );
  await writeFile(
    resolve(root, "reports/Physical skill research agenda.md"),
    "# Fixture agenda\n",
  );
  await writeFile(
    resolve(root, "topics/sample-topic/README.md"),
    "# Fixture topic\n\nSee [references](references.bib).\n",
  );
  await writeFile(
    resolve(root, "topics/sample-topic/references.bib"),
    "@article{reference2024,\n title={A reference},\n year={2024},\n url={https://example.org/paper}\n}\n",
  );
  const writeTopic = (value) =>
    writeFile(
      resolve(root, "topics/sample-topic/topic.json"),
      JSON.stringify(value, null, 2),
    );
  await writeTopic(topic());
  const run = (name) => {
    // An unrelated working directory verifies that path resolution follows the script.
    const result = spawnSync(
      process.execPath,
      [resolve(root, "scripts", name)],
      { cwd: tmpdir(), encoding: "utf8", timeout: 15000 },
    );
    assert.equal(result.error, undefined);
    return {
      status: result.status,
      output: `${result.stdout}${result.stderr}`,
    };
  };
  return {
    root,
    writeTopic,
    build: () => run("build-catalog.mjs"),
    validate: () => run("validate.mjs"),
  };
}

function rejects(result, pattern) {
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, pattern);
}

test("valid minimal fixture builds deterministically and validates with real bibliography and cover", async (t) => {
  const f = await fixture(t);
  assert.equal(f.build().status, 0);
  const first = await readFile(resolve(f.root, "docs/topics.json"), "utf8");
  assert.deepEqual(JSON.parse(first), {
    schemaVersion: 1,
    repository: REPOSITORY,
    topics: [topic()],
  });
  assert.equal(f.build().status, 0);
  assert.equal(
    await readFile(resolve(f.root, "docs/topics.json"), "utf8"),
    first,
  );
  const result = f.validate();
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /Validated 1 topics/);
});

test("importing validation helpers performs no CLI validation or output", async (t) => {
  const f = await fixture(t);
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      `const module = await import(${JSON.stringify(pathToFileURL(resolve(f.root, "scripts/validate.mjs")).href)}); if (typeof module.collectTopics !== 'function' || typeof module.validateRepository !== 'function') process.exit(2);`,
    ],
    { encoding: "utf8", timeout: 15000 },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "");
});

test("rejects unsafe source protocols and credential-bearing URLs without contacting them", async (t) => {
  const f = await fixture(t);
  for (const url of [
    "javascript:alert(1)",
    "https://user:secret@example.org/paper",
    "https://example.org/\\paper",
  ]) {
    const value = topic();
    value.sources[0].url = url;
    await f.writeTopic(value);
    rejects(f.build(), /HTTPS URL without credentials, spaces or backslashes/);
  }
});

test("rejects a cover path escaping the permitted assets folder", async (t) => {
  const f = await fixture(t);
  const value = topic();
  value.cover = "../research_notes/private.webp";
  await f.writeTopic(value);
  rejects(f.build(), /expected assets\/sample-topic.webp/);
});

test("rejects a local README link escaping the repository, including encoded traversal", async (t) => {
  const f = await fixture(t);
  for (const target of [
    "../../../outside.md",
    "%2e%2e/%2e%2e/%2e%2e/outside.md",
  ]) {
    await writeFile(
      resolve(f.root, "topics/sample-topic/README.md"),
      `# Fixture\n[Outside](${target})\n`,
    );
    rejects(f.build(), /path escapes the repository/);
  }
});

test("rejects duplicate metadata citation IDs and duplicate BibTeX keys", async (t) => {
  const f = await fixture(t);
  const value = topic();
  value.sources.push({ ...value.sources[0] });
  await f.writeTopic(value);
  rejects(f.build(), /duplicate ID reference2024/);
  await f.writeTopic(topic());
  await writeFile(
    resolve(f.root, "topics/sample-topic/references.bib"),
    "@article{reference2024,title={One}}\n@book{reference2024,title={Two}}\n",
  );
  rejects(f.build(), /references.bib: duplicate ID reference2024/);
});

test("rejects duplicate question IDs", async (t) => {
  const f = await fixture(t);
  const value = topic();
  value.questions.push({ ...value.questions[0], text: "A different question" });
  await f.writeTopic(value);
  rejects(f.build(), /questions: duplicate ID first-question/);
});

test("requires the bibliography file and a matching entry for every listed source", async (t) => {
  const f = await fixture(t);
  await rm(resolve(f.root, "topics/sample-topic/references.bib"));
  rejects(f.build(), /references.bib: required file is missing/);
  await writeFile(
    resolve(f.root, "topics/sample-topic/references.bib"),
    "@article{different2024,title={Different}}\n",
  );
  rejects(f.build(), /source reference2024 has no entry/);
});

test("requires a cover file with WebP content", async (t) => {
  const f = await fixture(t);
  const path = resolve(f.root, "docs/assets/sample-topic.webp");
  await rm(path);
  rejects(f.build(), /sample-topic.webp: required file is missing/);
  await writeFile(path, "This is not image data");
  rejects(f.build(), /cover must contain an actual WebP image/);
});

test("rejects symlinked topic files instead of following them into other directories", async (t) => {
  const f = await fixture(t);
  const path = resolve(f.root, "topics/sample-topic/references.bib");
  await rm(path);
  await symlink(
    resolve(f.root, "reports/Physical skill research agenda.md"),
    path,
  );
  rejects(f.build(), /not a symbolic link/);
});

test("rejects off-repository issue links, unsupported states and impossible dates", async (t) => {
  const f = await fixture(t);
  const link = topic();
  link.questions[0].issueUrl = "https://github.com/other/repository/issues/1";
  await f.writeTopic(link);
  rejects(f.build(), /exact issue URL/);
  const state = topic();
  state.status = "proven";
  await f.writeTopic(state);
  rejects(f.build(), /expected scoping, reproducing, evaluating or findings/);
  const date = topic();
  date.updated = "2026-02-30";
  await f.writeTopic(date);
  rejects(f.build(), /real date/);
});

test("validator detects stale generated data and a rebuild restores consistency", async (t) => {
  const f = await fixture(t);
  assert.equal(f.build().status, 0);
  const value = topic();
  value.summary = "An updated question, still without a claimed result.";
  await f.writeTopic(value);
  rejects(f.validate(), /stale or modified/);
  assert.equal(f.build().status, 0);
  assert.equal(f.validate().status, 0);
});

test("a failed build preserves the last valid catalog instead of publishing partial output", async (t) => {
  const f = await fixture(t);
  assert.equal(f.build().status, 0);
  const path = resolve(f.root, "docs/topics.json");
  const before = await readFile(path, "utf8");
  const value = topic();
  value.id = "wrong-folder";
  await f.writeTopic(value);
  rejects(f.build(), /id must match the topic folder/);
  assert.equal(await readFile(path, "utf8"), before);
});
