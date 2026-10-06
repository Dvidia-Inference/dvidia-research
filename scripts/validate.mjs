import { readFile, readdir, lstat, realpath } from "node:fs/promises";
import { dirname, resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const REPOSITORY = "https://github.com/Dvidia-Inference/dvidia-research";
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CITATION = /^[A-Za-z][A-Za-z0-9_:.+-]{0,127}$/;
const STAGES = new Set(["scoping", "reproducing", "evaluating", "findings"]);
const ORDER = [
  "capture-quality",
  "skill-relations",
  "evaluation-provenance",
  "physical-grounding",
];

function fail(message) {
  throw new Error(message);
}
function object(value, label, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    fail(`${label}: expected an object.`);
  for (const key of keys)
    if (!Object.hasOwn(value, key)) fail(`${label}: missing ${key}.`);
  for (const key of Object.keys(value))
    if (!keys.includes(key)) fail(`${label}: unexpected field ${key}.`);
}
function text(value, label, max) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
  )
    fail(
      `${label}: expected nonempty text of at most ${max} characters, without control characters.`,
    );
}
function array(value, label, max) {
  if (!Array.isArray(value) || value.length < 1 || value.length > max)
    fail(`${label}: expected 1–${max} entries.`);
}
function unique(value, seen, label) {
  const key = value.toLowerCase();
  if (seen.has(key)) fail(`${label}: duplicate ID ${value}.`);
  seen.add(key);
}
function issue(value, label) {
  if (
    value !== null &&
    (typeof value !== "string" ||
      !/^https:\/\/github\.com\/Dvidia-Inference\/dvidia-research\/issues\/[1-9][0-9]*$/.test(
        value,
      ))
  )
    fail(`${label}: use null or an exact issue URL in ${REPOSITORY}.`);
}
function safeUrl(value, label) {
  text(value, label, 2048);
  let url;
  try {
    url = new URL(value);
  } catch {
    fail(`${label}: invalid URL.`);
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    /[\s\\]/.test(value)
  )
    fail(
      `${label}: use an HTTPS URL without credentials, spaces or backslashes.`,
    );
}
function within(path, label) {
  const rel = relative(ROOT, path);
  if (rel === ".." || rel.startsWith(`..${sep}`) || resolve(ROOT, rel) !== path)
    fail(`${label}: path escapes the repository.`);
  return path;
}
async function file(path, label = relative(ROOT, path)) {
  within(path, label);
  let info;
  try {
    info = await lstat(path);
  } catch {
    fail(`${label}: required file is missing.`);
  }
  if (!info.isFile() || info.isSymbolicLink())
    fail(`${label}: expected a regular file, not a symbolic link.`);
  within(await realpath(path), label);
  if (info.size === 0) fail(`${label}: file is empty.`);
  return info;
}
async function localLinks(source, path) {
  // Markdown inline links and reference definitions. HTML in README files is also checked.
  const urls = [
    ...Array.from(
      source.matchAll(
        /!?\[[^\]\n]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+["'][^\n]*?["'])?\s*\)/g,
      ),
      (match) => match[1],
    ),
    ...Array.from(
      source.matchAll(/^\s*\[[^\]\n]+\]:\s*(<[^>]+>|\S+)/gm),
      (match) => match[1],
    ),
    ...Array.from(
      source.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi),
      (match) => match[1],
    ),
  ];
  for (let url of urls) {
    url = url.replace(/^<|>$/g, "");
    if (url.startsWith("#")) continue;
    if (/^https:\/\//i.test(url)) {
      safeUrl(url, `${relative(ROOT, path)} link`);
      continue;
    }
    if (
      /^[a-z][a-z0-9+.-]*:/i.test(url) ||
      url.startsWith("//") ||
      /[\\\u0000-\u001f]/.test(url)
    )
      fail(`${relative(ROOT, path)}: unsafe link ${url}.`);
    let decoded;
    try {
      decoded = decodeURIComponent(url.split(/[?#]/)[0]);
    } catch {
      fail(`${relative(ROOT, path)}: malformed link ${url}.`);
    }
    if (!decoded) continue;
    if (/[\\\u0000-\u001f]/.test(decoded))
      fail(`${relative(ROOT, path)}: unsafe encoded link ${url}.`);
    const target = within(
      resolve(
        url.startsWith("/") ? ROOT : dirname(path),
        decoded.replace(/^\/+/, ""),
      ),
      `${relative(ROOT, path)} link ${url}`,
    );
    let info;
    try {
      info = await lstat(target);
    } catch {
      fail(`${relative(ROOT, path)}: broken local link ${url}.`);
    }
    if (info.isSymbolicLink())
      fail(
        `${relative(ROOT, path)}: symbolic link target ${url} is not allowed.`,
      );
    within(await realpath(target), `${relative(ROOT, path)} link ${url}`);
  }
}

export async function collectTopics() {
  let folders;
  try {
    folders = await readdir(resolve(ROOT, "topics"), { withFileTypes: true });
  } catch {
    fail("topics/: add at least one topic folder before building the catalog.");
  }
  for (const folder of folders)
    if (folder.isSymbolicLink())
      fail(`topics/${folder.name}: symbolic links are not allowed.`);
  folders = folders.filter(
    (folder) => folder.isDirectory() && !folder.name.startsWith("."),
  );
  if (!folders.length || folders.length > 100)
    fail("topics/: expected 1–100 topic folders.");
  const topics = [];
  for (const folder of folders) {
    const label = `topics/${folder.name}`;
    if (!SLUG.test(folder.name) || folder.name.length > 64)
      fail(`${label}: use a lowercase hyphenated folder name.`);
    const topicPath = resolve(ROOT, label, "topic.json");
    await file(topicPath);
    let topic;
    try {
      topic = JSON.parse(await readFile(topicPath, "utf8"));
    } catch {
      fail(`${label}/topic.json: invalid JSON.`);
    }
    object(topic, label, [
      "id",
      "title",
      "kicker",
      "summary",
      "status",
      "cover",
      "imageAlt",
      "updated",
      "sources",
      "questions",
      "milestones",
      "firstTask",
    ]);
    if (topic.id !== folder.name)
      fail(`${label}: id must match the topic folder.`);
    text(topic.title, `${label}.title`, 160);
    text(topic.kicker, `${label}.kicker`, 100);
    text(topic.summary, `${label}.summary`, 1000);
    text(topic.imageAlt, `${label}.imageAlt`, 500);
    if (!STAGES.has(topic.status))
      fail(
        `${label}.status: expected scoping, reproducing, evaluating or findings.`,
      );
    if (topic.cover !== `assets/${topic.id}.webp`)
      fail(`${label}.cover: expected assets/${topic.id}.webp.`);
    if (
      typeof topic.updated !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(topic.updated) ||
      !Number.isFinite(Date.parse(`${topic.updated}T00:00:00.000Z`)) ||
      new Date(`${topic.updated}T00:00:00.000Z`).toISOString().slice(0, 10) !==
        topic.updated
    )
      fail(`${label}.updated: expected a real date in YYYY-MM-DD format.`);
    array(topic.sources, `${label}.sources`, 60);
    const citations = new Set();
    for (const source of topic.sources) {
      object(source, `${label}.source`, ["id", "title", "url", "type", "year"]);
      if (typeof source.id !== "string" || !CITATION.test(source.id))
        fail(`${label}: invalid citation ID.`);
      unique(source.id, citations, label);
      text(source.title, `${label} source ${source.id}`, 500);
      safeUrl(source.url, `${label} source ${source.id}`);
      if (!["paper", "code", "essay", "docs"].includes(source.type))
        fail(`${label} source ${source.id}: unsupported source type.`);
      if (
        !Number.isInteger(source.year) ||
        source.year < 1800 ||
        source.year > new Date().getUTCFullYear() + 1
      )
        fail(`${label} source ${source.id}: invalid publication year.`);
    }
    array(topic.questions, `${label}.questions`, 40);
    const questions = new Set();
    for (const question of topic.questions) {
      object(question, `${label}.question`, [
        "id",
        "text",
        "state",
        "issueUrl",
      ]);
      if (
        typeof question.id !== "string" ||
        !SLUG.test(question.id) ||
        question.id.length > 100
      )
        fail(`${label}: invalid question ID.`);
      unique(question.id, questions, `${label} questions`);
      text(question.text, `${label} question ${question.id}`, 2000);
      if (!["open", "answered"].includes(question.state))
        fail(`${label} question ${question.id}: expected open or answered.`);
      issue(question.issueUrl, `${label} question ${question.id}`);
    }
    array(topic.milestones, `${label}.milestones`, 40);
    for (const milestone of topic.milestones) {
      object(milestone, `${label}.milestone`, ["label", "done"]);
      text(milestone.label, `${label} milestone`, 2000);
      if (typeof milestone.done !== "boolean")
        fail(`${label}: milestone.done must be a boolean.`);
    }
    object(topic.firstTask, `${label}.firstTask`, ["title", "issueUrl"]);
    text(topic.firstTask.title, `${label}.firstTask.title`, 2000);
    issue(topic.firstTask.issueUrl, `${label}.firstTask.issueUrl`);
    const readmePath = resolve(ROOT, label, "README.md");
    const bibPath = resolve(ROOT, label, "references.bib");
    await file(readmePath);
    await file(bibPath);
    await localLinks(await readFile(readmePath, "utf8"), readmePath);
    const bibliography = await readFile(bibPath, "utf8");
    const bibIds = new Set();
    for (const match of bibliography.matchAll(
      /@(?!comment\b|string\b|preamble\b)[A-Za-z]+\s*[{(]\s*([^,\s]+)\s*,/gi,
    )) {
      if (!CITATION.test(match[1]))
        fail(`${label}/references.bib: invalid citation ID ${match[1]}.`);
      unique(match[1], bibIds, `${label}/references.bib`);
    }
    if (!bibIds.size)
      fail(`${label}/references.bib: no citation entries found.`);
    for (const citation of citations)
      if (!bibIds.has(citation))
        fail(`${label}: source ${citation} has no entry in references.bib.`);
    const coverPath = resolve(ROOT, "docs", topic.cover);
    await file(coverPath);
    const image = await readFile(coverPath);
    if (
      image.length < 12 ||
      image.toString("ascii", 0, 4) !== "RIFF" ||
      image.toString("ascii", 8, 12) !== "WEBP"
    )
      fail(`${label}: cover must contain an actual WebP image.`);
    topics.push(topic);
  }
  return topics.sort((a, b) => {
    const rank = (id) =>
      ORDER.includes(id) ? ORDER.indexOf(id) : ORDER.length;
    return rank(a.id) - rank(b.id) || a.id.localeCompare(b.id, "en");
  });
}

export async function validateRepository() {
  const topics = await collectTopics();
  for (const path of [
    "docs/index.html",
    "docs/styles.css",
    "docs/app.js",
    "reports/Physical skill research agenda.md",
  ])
    await file(resolve(ROOT, path));
  const html = await readFile(resolve(ROOT, "docs/index.html"), "utf8");
  await localLinks(html, resolve(ROOT, "docs/index.html"));
  if (/<(?:script|link)\b[^>]*(?:src|href)=["']https?:/i.test(html))
    fail("docs/index.html: external scripts, styles or fonts are not allowed.");
  const app = await readFile(resolve(ROOT, "docs/app.js"), "utf8");
  if (/\.(?:innerHTML|outerHTML)\s*=|insertAdjacentHTML\s*\(/.test(app))
    fail("docs/app.js: use textContent and DOM methods for metadata.");
  const catalogPath = resolve(ROOT, "docs/topics.json");
  await file(catalogPath);
  let catalog;
  try {
    catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  } catch {
    fail("docs/topics.json: invalid JSON. Run npm run build.");
  }
  const expected = { schemaVersion: 1, repository: REPOSITORY, topics };
  if (JSON.stringify(catalog) !== JSON.stringify(expected))
    fail("docs/topics.json is stale or modified. Run npm run build.");
  return topics;
}

const invokedPath = process.argv[1]
  ? await realpath(resolve(process.argv[1])).catch(() => null)
  : null;
if (invokedPath === (await realpath(fileURLToPath(import.meta.url)))) {
  try {
    const topics = await validateRepository();
    console.log(
      `Validated ${topics.length} topics, ${topics.reduce((sum, topic) => sum + topic.sources.length, 0)} sources, local links, bibliography keys and cover images.`,
    );
  } catch (error) {
    console.error(`Validation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
