import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Marked } from "marked";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const ORIGIN = "https://research.dvidia.org";
export const REPOSITORY = "https://github.com/Dvidia-Inference/dvidia-research";
const HUGGING_FACE = "https://huggingface.co/Dvidia";
const DOCS = resolve(ROOT, "docs");
const TOPICS = ["capture-quality", "skill-relations", "evaluation-provenance", "physical-grounding"];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const READERS = {
  "task-environments-v02": {
    eyebrow: "Task environments · Local simulation preview", deck: "Arrange the scene. Define the finish. Keep the failures.",
    entry: "https://dvidia-robot-simulation-lab.static.hf.space/task-environments/v02/index.html",
    action: "Explore the recorded environments and draft editor"
  },
  "learned-piper-grip-clock-v03": {
    eyebrow: "Learned acquisition timing · Frozen simulation study", deck: "Learn when to wait. Measure what it costs.",
    entry: "https://dvidia-robot-simulation-lab.static.hf.space/learned-placement/v03/viewer/index.html",
    action: "Compare the grip-aware and blind clocks"
  },
  "native-action-capture-v01": {
    eyebrow: "Native capture · Local engineering preview", deck: "Keep the image. Preserve the action. Measure the response.",
    entry: "https://dvidia-robot-simulation-lab.static.hf.space/action-capture/v01/index.html",
    action: "Inspect the recorded camera and actuator evidence"
  },
  "bounded-grip-waiting-v04": {
    eyebrow: "Bounded grip waiting · Recovered simulation evidence", deck: "Wait briefly. Preserve the failures.",
    entry: "downloads/topics/physical-grounding/runs/2026-10-30-piper-grip-wait-v04/index.html",
    action: "Inspect all 512 scheduled outcomes"
  },
  "openusd-workstation-v01": {
    eyebrow: "OpenUSD environment · Native CPU validation", deck: "A reusable scene with testable physics.",
    entry: "https://dvidia-robot-simulation-lab.static.hf.space/usd-workstation/v01/index.html",
    action: "Inspect the recorded workstation"
  },
  "learned-piper-grip-v02": {
    eyebrow: "Learned grip feedback · Frozen simulation study", deck: "Keep the arm references. Measure the grip.",
    entry: "downloads/topics/physical-grounding/runs/2026-10-27-learned-piper-grip-v02/viewer/index.html",
    action: "Inspect the paired grip attempts"
  },
  "learned-piper-placement-v01": {
    eyebrow: "Learning from demonstrations · Frozen simulation study", deck: "Learn the motion. Measure the whole task.",
    entry: "downloads/topics/physical-grounding/runs/2026-10-27-piper-imitation-v01/viewer/index.html",
    action: "Inspect the recorded placements"
  },
  "local-goal-verifier-v03": {
    eyebrow: "Local CPU verifier · Native and sensor-fault diagnostics", deck: "Measure the goal. Question the evidence.",
    entry: "downloads/topics/physical-grounding/runs/2026-10-19-local-goal-verifier-v03/lab/index.html",
    action: "Inspect every local decision"
  },
  "image-goal-jev-v02": {
    eyebrow: "Measured Jev evaluation · Frozen native protocol", deck: "No false finish. Too many missed finishes.",
    entry: "downloads/topics/physical-grounding/runs/2026-10-19-image-goal-jev-v02/lab/index.html",
    action: "Inspect the measured cases"
  },
  "image-goal-jev-v01": {
    eyebrow: "Native benchmark · Jev evaluation pending", deck: "Does it only look finished?",
    entry: "downloads/topics/physical-grounding/runs/2026-10-18-image-goal-jev-v01/lab/index.html",
    action: "Inspect the image-goal benchmark"
  },
  "goal-images-physical-feedback": {
    eyebrow: "Research direction · Native contact evidence", deck: "A destination to aim for. Feedback to get there.",
    entry: "downloads/topics/physical-grounding/runs/2026-10-18-native-contact-audit/audit/report.json",
    action: "Inspect the contact audit"
  },
  "live-piper-shoe-workstation-v01": {
    eyebrow: "Live simulation · Research note", deck: "One arm. One shoe. A measurable place to practice.",
    entry: "downloads/topics/physical-grounding/runs/2026-10-13-live-piper-workstation-v01/workstation/index.html",
    action: "Open workstation"
  },
  "skill-prerequisites-v01": {
    eyebrow: "Native simulation · Recorded evidence", deck: "Know when to enter. Bring the goal within reach.",
    entry: "downloads/topics/physical-grounding/runs/2026-10-13-skill-prerequisites-v01/lab/index.html",
    action: "Explore both experiments"
  },
  "continuous-shoe-grip-v02": {
    eyebrow: "Native simulation · Recorded evidence", deck: "Reach the shoe. Verify the grip. React to loss.",
    entry: "downloads/topics/physical-grounding/runs/2026-10-13-continuous-shoe-grip-v02/lab/index.html",
    action: "Explore the grip comparison"
  },
  "shoe-graspability-v03": {
    eyebrow: "Native simulation · Recorded evidence", deck: "Give the gripper a fair test.",
    entry: "downloads/topics/physical-grounding/runs/2026-10-14-shoe-graspability-v03/lab/index.html",
    action: "Explore the graspability comparison"
  }
};

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
}

export function safeUrl(value) {
  if (typeof value !== "string" || /[\\\u0000-\u0020\u007f]/.test(value) || value.startsWith("//")) return false;
  let decoded;
  try { decoded = decodeURIComponent(value); } catch { return false; }
  if (/[\\\u0000-\u001f\u007f]/.test(decoded) || decoded.startsWith("//")) return false;
  if (value.startsWith("#")) return true;
  if (value === "mailto:hello@dvidia.org") return true;
  if (/^[a-z][a-z0-9+.-]*:/i.test(decoded)) {
    try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
  }
  return !value.startsWith("/");
}

function repositoryUrl(path, directory = false) {
  return `${REPOSITORY}/${directory ? "tree" : "blob"}/main/${path.split("/").map(encodeURIComponent).join("/")}`;
}

function href(from, target) {
  return posix.relative(posix.dirname(from), target) || "./";
}

function dateLabel(date) {
  const [year, month, day] = date.split("-").map(Number);
  return `${day} ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][month - 1]} ${year}`;
}

export function validatePublications(catalog) {
  if (catalog.schemaVersion !== 1 || catalog.publisher !== "DVIDIA" || catalog.contact !== "hello@dvidia.org" || catalog.follow !== "https://x.com/iammrriver") throw new Error("Unexpected publisher configuration.");
  if (catalog.contributor !== null) throw new Error("Individual contributor attribution is intentionally unset.");
  if (!Array.isArray(catalog.publications) || !catalog.publications.length) throw new Error("Publications are required.");
  const slugs = new Set();
  for (const paper of catalog.publications) {
    if (!SLUG.test(paper.slug) || slugs.has(paper.slug)) throw new Error(`Invalid/duplicate publication slug: ${paper.slug}`);
    slugs.add(paper.slug);
    if (!/^reports\/[A-Za-z0-9 -]+\.md$/.test(paper.source)) throw new Error(`Invalid source: ${paper.source}`);
    for (const key of ["title", "type", "status", "abstract"]) if (typeof paper[key] !== "string" || !paper[key].trim()) throw new Error(`Missing ${key}: ${paper.slug}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(paper.date) || !Number.isFinite(Date.parse(paper.date)) || new Date(paper.date).toISOString().slice(0, 10) !== paper.date) throw new Error(`Invalid publication date: ${paper.slug}`);
    if (!paper.topics.length || paper.topics.some(topic => !TOPICS.includes(topic))) throw new Error(`Invalid topic: ${paper.slug}`);
  }
}

function slugify(text, counts) {
  const base = text.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[^;]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
  const count = counts.get(base) || 0;
  counts.set(base, count + 1);
  return count ? `${base}-${count + 1}` : base;
}

export function renderMarkdown(source, resolveLink = value => value) {
  const toc = [];
  const counts = new Map();
  const parser = new Marked({ gfm: true, breaks: false });
  parser.use({ renderer: {
    html({ text }) { return escapeHtml(text); },
    heading(token) {
      const text = this.parser.parseInline(token.tokens);
      const id = slugify(token.text, counts);
      toc.push({ depth: token.depth, title: token.text.replace(/[*`]/g, ""), id });
      return `<h${token.depth} id="${id}">${text}</h${token.depth}>\n`;
    },
    link(token) {
      const text = this.parser.parseInline(token.tokens);
      const url = resolveLink(token.href);
      if (!safeUrl(url)) throw new Error(`Unsafe publication link: ${token.href}`);
      return `<a href="${escapeHtml(url)}"${token.title ? ` title="${escapeHtml(token.title)}"` : ""}>${text}</a>`;
    },
    image(token) {
      const url = resolveLink(token.href);
      if (!safeUrl(url) || url.startsWith("mailto:")) throw new Error(`Unsafe publication image: ${token.href}`);
      return `<figure><img src="${escapeHtml(url)}" alt="${escapeHtml(token.text)}" loading="lazy"><figcaption>${escapeHtml(token.text)}</figcaption></figure>`;
    },
    table(token) { return `<div class="table-scroll" role="region" aria-label="Research table" tabindex="0">${defaultTable.call(this, token)}</div>\n`; }
  } });
  return { html: parser.parse(source), toc };
}

function defaultTable(token) {
  const row = (cells, tag) => `<tr>${cells.map((cell, i) => `<${tag}${token.align[i] ? ` style="text-align:${escapeHtml(token.align[i])}"` : ""}>${this.parser.parseInline(cell.tokens)}</${tag}>`).join("")}</tr>`;
  return `<table><thead>${row(token.header, "th")}</thead><tbody>${token.rows.map(cells => row(cells, "td")).join("")}</tbody></table>`;
}

function navigation(page, publications, topics, active = "") {
  const a = (path, label, slug) => `<a href="${escapeHtml(href(page, path))}"${active === slug ? ' aria-current="page"' : ""}>${escapeHtml(label)}</a>`;
  return `<div class="nav-section"><span class="nav-label">Notebook</span>${a("index.html", "Research journal", "index")}${a("index.html#progress", "Progress", "progress")}</div><div class="nav-section"><span class="nav-label">Publications</span>${publications.map(p => a(`papers/${p.slug}/index.html`, p.title, p.slug)).join("")}</div><div class="nav-section"><span class="nav-label">Questions</span>${topics.map(t => a(`topics/${t.id}/index.html`, t.title, t.id)).join("")}</div><div class="nav-section"><span class="nav-label">Follow the work</span>${a("feed.xml", "RSS feed", "feed")}<a href="${REPOSITORY}">GitHub</a><a href="${HUGGING_FACE}">Hugging Face</a><a href="https://x.com/iammrriver">X · @iammrriver</a><a href="mailto:hello@dvidia.org">hello@dvidia.org</a></div>`;
}

function layout({ page, title, description, content, catalog, topics, active = "", date, readerToc = null }) {
  const nav = readerToc
    ? `<div class="nav-section paper-section-nav"><span class="nav-label">In this study</span>${readerToc.map(h => `<a href="#${h.id}">${escapeHtml(h.title)}</a>`).join("")}</div><div class="nav-section"><span class="nav-label">Explore</span><a href="${escapeHtml(href(page, "index.html"))}">Research journal</a><a href="${escapeHtml(href(page, "topics/physical-grounding/index.html"))}">Physical grounding</a><a href="${HUGGING_FACE}">Hugging Face</a><a href="${REPOSITORY}">GitHub</a></div>`
    : navigation(page, catalog.publications, topics, active);
  const canonical = `${ORIGIN}/${page === "index.html" ? "" : page.replace(/index\.html$/, "")}`;
  const jsonLd = { "@context": "https://schema.org", "@type": active === "index" ? "CollectionPage" : "Article", headline: title, description, url: canonical, publisher: { "@type": "Organization", name: "DVIDIA", url: "https://dvidia.org" }, ...(date ? { datePublished: date } : {}) };
  return `<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)} · DVIDIA Research</title><meta name="description" content="${escapeHtml(description)}"><meta name="theme-color" content="#faf9f6"><link rel="canonical" href="${canonical}"><link rel="alternate" type="application/rss+xml" title="DVIDIA Research" href="${escapeHtml(href(page, "feed.xml"))}"><link rel="icon" href="${escapeHtml(href(page, "assets/favicon.svg"))}" type="image/svg+xml"><link rel="stylesheet" href="${escapeHtml(href(page, "styles.css") + (readerToc ? "?v=editorial-v1" : ""))}"><script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script><script src="${escapeHtml(href(page, "app.js") + (readerToc ? "?v=editorial-v1" : ""))}" defer></script></head>\n<body${readerToc ? ' class="workstation-reader"' : ""}><a class="skip-link" href="#main">Skip to content</a><aside class="site-sidebar" aria-label="Research navigation"><a class="brand" href="${escapeHtml(href(page, "index.html"))}"><span class="brand-name">DVIDIA</span><span class="brand-subtitle">Research notebook</span></a><nav class="site-nav" id="site-navigation" aria-label="Main">${nav}</nav><details class="mobile-navigation"><summary>Contents</summary><nav aria-label="Mobile">${nav}</nav></details></aside><main class="page-shell" id="main">${content}<footer class="site-footer"><p>Published by DVIDIA · <a href="mailto:hello@dvidia.org">hello@dvidia.org</a></p><p><a href="${REPOSITORY}">Source and revisions</a> · <a href="${HUGGING_FACE}">Hugging Face</a> · <a href="${escapeHtml(href(page, "feed.xml"))}">RSS</a> · <a href="https://x.com/iammrriver">@iammrriver</a></p><p>Writing: <a href="${REPOSITORY}/blob/main/LICENSE">CC BY 4.0</a>. Original code: <a href="${REPOSITORY}/blob/main/LICENSE-CODE">MIT</a>. External work retains its own terms.</p></footer></main></body></html>\n`;
}

function stripTitle(source) { return source.replace(/^# [^\n]+\n+/, ""); }

async function allFiles(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) found.push(...await allFiles(path));
    else if (entry.isFile()) found.push(path);
    else throw new Error(`Nonregular publication source: ${path}`);
  }
  return found;
}

export async function buildPublications() {
  const catalog = JSON.parse(await readFile(resolve(ROOT, "publications.json"), "utf8"));
  validatePublications(catalog);
  const topics = await Promise.all(TOPICS.map(async id => JSON.parse(await readFile(resolve(ROOT, `topics/${id}/topic.json`), "utf8"))));
  const pageMap = new Map(catalog.publications.map(p => [p.source, `papers/${p.slug}/index.html`]));
  topics.forEach(t => pageMap.set(`topics/${t.id}/README.md`, `topics/${t.id}/index.html`));
  const downloadPaths = new Set(catalog.publications.map(p => p.source));
  for (const topic of topics) {
    for (const path of await allFiles(resolve(ROOT, `topics/${topic.id}`))) downloadPaths.add(relative(ROOT, path).split("\\").join("/"));
  }
  for (const path of ["CONTRIBUTING.md", "CITATION.cff", "LICENSE", "LICENSE-CODE"]) downloadPaths.add(path);
  await Promise.all(["papers", "topics", "downloads"].map(name => rm(resolve(DOCS, name), { recursive: true, force: true })));
  for (const path of downloadPaths) {
    const source = await readFile(resolve(ROOT, path));
    if (/\.(?:md|json|py|txt|bib|cff)$/.test(path) && /(?:\/Users\/|\/private\/tmp\/|file:\/\/|Bearer\s+[A-Za-z0-9_-]+)/.test(source.toString("utf8"))) throw new Error(`Private execution data in public source: ${path}`);
    const dest = resolve(DOCS, "downloads", path);
    await mkdir(dirname(dest), { recursive: true });
    await copyFile(resolve(ROOT, path), dest);
  }
  function resolveLink(sourcePath, outputPage, value, absolute = false) {
    if (/^(?:https:|mailto:|#)/.test(value)) {
      const prefix = `${REPOSITORY}/blob/main/`;
      if (!value.startsWith(prefix)) return value;
      value = value.slice(prefix.length);
      sourcePath = "./ROOT.md";
    }
    if (!safeUrl(value)) throw new Error(`Unsafe source link: ${value}`);
    const split = value.search(/[?#]/);
    const raw = split < 0 ? value : value.slice(0, split);
    const suffix = split < 0 ? "" : value.slice(split);
    let path = posix.normalize(posix.join(posix.dirname(sourcePath), decodeURIComponent(raw)));
    if (path.endsWith("/")) path = path.slice(0, -1);
    if (pageMap.has(`${path}/README.md`)) path += "/README.md";
    if (path.startsWith("../") || path.startsWith("/")) throw new Error(`Source link escapes archive: ${value}`);
    const target = pageMap.get(path) || (downloadPaths.has(path) ? `downloads/${path.split("/").map(encodeURIComponent).join("/")}` : null);
    if (target) return absolute ? `${ORIGIN}/${target.replace(/index\.html$/, "")}${suffix}` : `${href(outputPage, target)}${suffix}`;
    if ([...downloadPaths].some(candidate => candidate.startsWith(`${path}/`))) return repositoryUrl(path, true) + suffix;
    throw new Error(`Unresolved publication link in ${sourcePath}: ${value}`);
  }
  async function writePage(page, html) { await mkdir(dirname(resolve(DOCS, page)), { recursive: true }); await writeFile(resolve(DOCS, page), html); }
  const pages = [];
  for (const paper of catalog.publications) {
    const page = pageMap.get(paper.source);
    const source = await readFile(resolve(ROOT, paper.source), "utf8");
    const editorial = READERS[paper.slug];
    const readerSource = editorial
      ? stripTitle(source).replace(/^DVIDIA research · 13 October 2026 · Live workstation v0\.1\n+/, "")
      : stripTitle(source);
    const rendered = renderMarkdown(readerSource, value => resolveLink(paper.source, page, value));
    const readerToc = editorial ? rendered.toc.filter(h => h.depth === 2) : null;
    const toc = `<details class="paper-toc"><summary>In this paper</summary><nav aria-label="Table of contents"><ol>${rendered.toc.filter(h => h.depth === 2).map(h => `<li><a href="#${h.id}">${escapeHtml(h.title)}</a></li>`).join("")}</ol></nav></details>`;
    const abstract = `<section class="paper-abstract" aria-label="Abstract"><h2>Abstract</h2><p>${escapeHtml(paper.abstract)}</p></section>`;
    if (editorial && !safeUrl(editorial.entry)) throw new Error(`Unsafe reader entry: ${paper.slug}`);
    const entryLink = editorial ? escapeHtml(editorial.entry.startsWith("https://") ? editorial.entry : href(page, editorial.entry)) : null;
    const content = `<article class="paper"><header class="paper-header"><p class="eyebrow">${escapeHtml(editorial ? editorial.eyebrow : paper.type)}</p><h1>${escapeHtml(paper.title)}</h1><p class="paper-meta"><time datetime="${paper.date}">${dateLabel(paper.date)}</time> · DVIDIA</p>${editorial ? `<p class="paper-deck">${escapeHtml(editorial.deck)}</p>` : ""}<p class="paper-status">${escapeHtml(paper.status)}</p><p class="paper-actions">${editorial ? `<a href="${entryLink}">${escapeHtml(editorial.action)} ↗</a> · ` : ""}<a href="${repositoryUrl(paper.source)}">Source & history</a> · <a href="${escapeHtml(href(page, `downloads/${paper.source.split("/").map(encodeURIComponent).join("/")}`))}" download>Download Markdown</a></p></header>${editorial ? `<details class="paper-summary"><summary>Study abstract and scope</summary>${abstract}</details>` : abstract + toc}<div class="paper-body">${rendered.html}</div></article>`;
    await writePage(page, layout({ page, title: paper.title, description: paper.abstract, content, catalog, topics, active: paper.slug, date: paper.date, readerToc }));
    pages.push({ path: page, date: paper.date });
    // Downloaded Markdown remains useful outside the repository: links resolve to public pages/artifacts.
    const portable = source.replace(/\]\((<[^>]+>|[^\s)]+)\)/g, (match, url) => `](${resolveLink(paper.source, page, url.replace(/^<|>$/g, ""), true)})`);
    await writeFile(resolve(DOCS, "downloads", paper.source), portable);
  }
  for (const topic of topics) {
    const page = `topics/${topic.id}/index.html`;
    const sourcePath = `topics/${topic.id}/README.md`;
    const source = await readFile(resolve(ROOT, sourcePath), "utf8");
    const rendered = renderMarkdown(stripTitle(source), value => resolveLink(sourcePath, page, value));
    const papers = catalog.publications.filter(p => p.topics.includes(topic.id));
    const content = `<article class="paper topic-paper"><header class="paper-header"><p class="eyebrow">Research question</p><h1>${escapeHtml(topic.title)}</h1><p class="paper-meta">DVIDIA · ${escapeHtml(topic.kicker)}</p><p class="paper-status">Protocols and progress are scoped below</p></header><section class="paper-abstract"><h2>Question</h2><p>${escapeHtml(topic.summary)}</p></section><section class="related-papers"><h2>Publications in this area</h2><ul>${papers.map(p => `<li><a href="${href(page, pageMap.get(p.source))}">${escapeHtml(p.title)}</a></li>`).join("")}</ul></section><div class="paper-body">${rendered.html}</div></article>`;
    await writePage(page, layout({ page, title: topic.title, description: topic.summary, content, catalog, topics, active: topic.id }));
    pages.push({ path: page, date: papers.reduce((latest, paper) => paper.date > latest ? paper.date : latest, topic.updated) });
  }
  const paperRows = catalog.publications.map(p => `<article class="paper-row" data-paper-row><p class="paper-meta"><time datetime="${p.date}">${dateLabel(p.date)}</time> · ${escapeHtml(p.type)}</p><h2><a href="${href("index.html", pageMap.get(p.source))}">${escapeHtml(p.title)}</a></h2><p>${escapeHtml(p.abstract)}</p><p class="paper-status">${escapeHtml(p.status)}</p></article>`).join("");
  const content = `<header class="journal-header"><p class="eyebrow">An open research notebook</p><h1>From observation<br>to physical skill.</h1><p class="journal-intro">We study how demonstrations become usable evidence, how simulation becomes useful practice, and when a robot skill earns a release.</p><p class="paper-meta">Published by DVIDIA · <a href="mailto:hello@dvidia.org">hello@dvidia.org</a></p></header><section class="journal-publications" aria-labelledby="publications"><div class="section-heading"><h2 id="publications">Publications</h2><p>${catalog.publications.length} papers and working notes</p></div><div data-paper-search hidden><label for="paper-search">Find a publication</label><input id="paper-search" type="search" autocomplete="off" placeholder="Search titles, questions and findings"><span data-search-count aria-live="polite"></span></div><div class="paper-list">${paperRows}</div><p data-search-empty hidden>No publications match this search.</p></section><section class="journal-progress" aria-labelledby="progress"><h2 id="progress">Research footprints</h2><ol class="progress-list"><li><time datetime="2026-10-31">31 October 2026</time><div><h3>Construct scenes and test the whole finish</h3><p>An editable local recipe places up to four rigid objects around PiPER and an open bin. Six completion fixtures pass, six native counterexamples stay incomplete and four invalid layouts are refused. An independent audit checks 13,262 physics observations and 1,337 replay frames with zero mismatches. The arm holds home; this is environment infrastructure, not learned placement or hardware qualification.</p><a href="papers/task-environments-v02/index.html">Read the scene and verifier study</a> · <a href="https://dvidia-robot-simulation-lab.static.hf.space/task-environments/v02/index.html">Open the environment studio</a></div></li><li><time datetime="2026-10-30">30 October 2026</time><div><h3>Connect camera frames to the commands the arm received</h3><p>Native preview 0.1.3.dev1 captures actual RGB-D, measured joints and signed finger velocities beside issued, ramped and applied references. Two full 1,000-interval runs repeat one fixed start with identical frames and motion; interruption preserves a two-step unknown prefix. All 37 focused tests and an isolated installed-wheel capture pass. Missing object-tracker channels still refuse training export, and depth precision remains unverified. This is synchronized evidence collection, not a new learned skill.</p><a href="papers/native-action-capture-v01/index.html">Read the capture validation</a> · <a href="https://github.com/Dvidia-Inference/dvidia-training/releases/tag/piper-action-capture-v0.1-preview">Install the native preview</a></div></li><li><time datetime="2026-10-30">30 October 2026</time><div><h3>Preserve the motor evidence before fitting the next learner</h3><p>SDK 0.1.2 adds a causal PiPER data contract and installed Terminal validator/exporter. All 203 required default-branch tests pass, including 27 recorder tests. Native channel order, gripper units, missingness, interruptions and outcome separation remain explicit. The example is synthetic metadata; live capture, corrective demonstrations and policy training remain separate work.</p><a href="https://github.com/Dvidia-Inference/dvidia-training/releases/tag/training-v0.1.2">Install the local tools</a> · <a href="papers/bounded-grip-waiting-v04/index.html#engineering-follow-up-preserve-the-action-evidence">Read the engineering boundary</a></div></li><li><time datetime="2026-10-30">30 October 2026</time><div><h3>Bound acquisition waiting and preserve interrupted outcomes</h3><p>A 200 ms authored supervisor completes 42/128 scheduled placements versus 32/128 learned clock, 44/128 fixed and 41/128 teacher. Both paired comparisons are inconclusive. Recovery preserves the original 72 receipts and four unknowns, running only 436 never-started requests. All 556 complete development and confirmation attempts audit without mismatches; retention and critical contacts remain unresolved.</p><a href="papers/bounded-grip-waiting-v04/index.html">Read the recovered comparison</a> · <a href="downloads/topics/physical-grounding/runs/2026-10-30-piper-grip-wait-v04/index.html">Inspect all 512 outcomes</a></div></li><li><time datetime="2026-10-30">30 October 2026</time><div><h3>Make an OpenUSD scene testable in native physics</h3><p>A bounded USD recipe maps rigid geometry, mass, centred inertia, gravity and friction into a pinned PiPER workstation. All 45 passive checks pass, including nine disabled-effect controls; 27/27 normal drops also satisfy independent settling goals. Every input, recorded native pose and read-only audit is retained. Arbitrary asset import, learned manipulation and physical calibration remain open.</p><a href="papers/openusd-workstation-v01/index.html">Read the scene-bridge study</a> · <a href="https://dvidia-robot-simulation-lab.static.hf.space/usd-workstation/v01/index.html">Inspect the recorded workstation</a></div></li><li><time datetime="2026-10-27">27 October 2026</time><div><h3>Publish the limits of a learned grip clock</h3><p>A learned timing model completes 44/128 strict placements versus 26/128 for its matched blind clock, 72/128 for fixed progression and 67/128 for the acquisition teacher. Its advantage over blind is inconclusive and it trails fixed timing. All 768 main-study attempts audit without mismatches. The complete evidence and recorded comparison retain failed attempts; action corrections, camera-based control and physical transfer remain open.</p><a href="papers/learned-piper-grip-clock-v03/index.html">Read the frozen comparison</a> · <a href="https://dvidia-robot-simulation-lab.static.hf.space/learned-placement/v03/viewer/index.html">Inspect the recorded clocks</a></div></li><li><time datetime="2026-10-27">27 October 2026</time><div><h3>Learn a first PiPER placement primitive from demonstrations</h3><p>A compact feedforward model trained on 32 synthetic teacher demonstrations completes 5/12 frozen placement attempts from unseen starts. The teacher completes 12/12; three controls complete none. All twelve learned final poses settle near their targets, but seven fail full contact-history gates. The recorded viewer, complete evidence and installable local runner preserve the reliability gap. Learned feedback, human-video learning and physical transfer remain open.</p><a href="papers/learned-piper-placement-v01/index.html">Read the learned-placement study</a> · <a href="downloads/topics/physical-grounding/runs/2026-10-27-piper-imitation-v01/viewer/index.html">Inspect all twelve learned attempts</a></div></li><li><time datetime="2026-10-19">19 October 2026</time><div><h3>Measure Jev against physical completion</h3><p>All 64 frozen requests returned valid responses. No false completion was observed, but images plus telemetry recognized only 1/8 completed states, and images alone recognized 0/8. Occluded finished scenes failed in both conditions. Median hosted latency was 1.776 seconds. The original protocol remains unchanged; all measured cases and independent review are public.</p><a href="papers/image-goal-jev-v02/index.html">Read the measured follow-up</a> · <a href="downloads/topics/physical-grounding/runs/2026-10-19-image-goal-jev-v02/lab/index.html">Inspect every judgment</a></div></li><li><time datetime="2026-10-18">18 October 2026</time><div><h3>Make image-goal uncertainty testable</h3><p>Thirty-two native PiPER fixtures include four moving/settled pairs with identical images and different physical completion labels. The frozen 64-request Jev protocol compares RGB with privileged simulator telemetry. Jev has not been run; all provider trials remain explicitly unrun, with accuracy and service latency unmeasured. Native states, images, source hashes and physical labels are public.</p><a href="papers/image-goal-jev-v01/index.html">Read the benchmark and protocol</a> · <a href="downloads/topics/physical-grounding/runs/2026-10-18-image-goal-jev-v01/lab/index.html">Compare every current and goal image</a></div></li><li><time datetime="2026-10-18">18 October 2026</time><div><h3>Connect visual goals to measured physical feedback</h3><p>Fourteen passive rigid-box arm replays reproduce every original sampled state and outcome, recording 249,502 native ticks. Millisecond contact gaps appear between stored observations; a successful comparator also has gaps. The separate architecture note evaluates Jev as a candidate decision layer and defines a goal-image reaching test. No visual model is integrated and no controller is promoted.</p><a href="papers/goal-images-physical-feedback/index.html">Read the architecture and audit</a> · <a href="downloads/topics/physical-grounding/runs/2026-10-18-native-contact-audit/download-audit.py">Download verified evidence tool</a></div></li><li><time datetime="2026-10-14">14 October 2026</time><div><h3>Separate object difficulty from the gripper and attached tool</h3><p>A frozen direct-grasp diagnostic retains 24 valid attempts. Lightweight controls complete 8/12 lifts; every 300 g condition fails, including the small block. Removing the rake gains one narrow-shoe result and loses one block result. Relative lift, settled references and dense contact traces make the modeled drive and geometry limits visible. These are diagnostic controls, not a shoe retrieval rate or hardware qualification.</p><a href="papers/shoe-graspability-v03/index.html">Read the graspability study</a> · <a href="downloads/topics/physical-grounding/runs/2026-10-14-shoe-graspability-v03/lab/index.html">Inspect every recorded attempt</a></div></li><li><time datetime="2026-10-13">13 October 2026</time><div><h3>Measure contact-loss response without claiming a better grasp</h3><p>Twenty valid fresh attempts complete the same 2/10 cases under both controllers. Nine trace-verified bilateral-contact-loss alarms arrive in 20–52 ms; twelve supported lowering responses produce no additional completion. Full trajectories and an independent audit expose failed acquisition and an unmonitored support-contamination gap. Hardware transfer remains open.</p><a href="papers/continuous-shoe-grip-v02/index.html">Read the continuous-grip comparison</a> · <a href="downloads/topics/physical-grounding/runs/2026-10-13-continuous-shoe-grip-v02/lab/index.html">Inspect the recorded attempts</a></div></li><li><time datetime="2026-10-13">13 October 2026</time><div><h3>Make skill prerequisites and failed recovery measurable</h3><p>Two native environments retain sixteen valid held-out attempts. A lid guard avoids two baseline contacts while completion remains 2/4. A mounted rake reaches three of four intermediate retrieval checkpoints, but no subsequent retained lift succeeds. Recorded replays expose every failure; fresh physics runs locally. Tool acquisition, learned control and hardware transfer remain open.</p><a href="papers/skill-prerequisites-v01/index.html">Read the paired results</a> · <a href="downloads/topics/physical-grounding/runs/2026-10-13-skill-prerequisites-v01/lab/index.html">Explore both recorded experiments</a></div></li><li><time datetime="2026-10-13">13 October 2026</time><div><h3>Move the PiPER arm in a live browser workstation</h3><p>Drag a target and nudge a free rigid trainer with live browser MuJoCo physics. The final native run keeps 20 valid attempts: 14/16 targets pass, both high-target repeats fail, and four mechanics checks pass. A ten-minute browser run reports 51.39 render calls per second on the tested host. Strict raw-contact parity fails in 13/1,500 sampled states despite numerical agreement; all fifteen development shoe-lift attempts fail. Learned shoe skills, calibrated contact and hardware transfer remain open.</p><a href="papers/live-piper-shoe-workstation-v01/index.html">Read the workstation and evidence</a> · <a href="downloads/topics/physical-grounding/runs/2026-10-13-live-piper-workstation-v01/workstation/index.html">Open the live workstation</a></div></li><li><time datetime="2026-10-12">12 October 2026</time><div><h3>Load reusable shoes with three native robot arms</h3><p>Six original rigid shoe proxies now compose with UR5e/Robotiq, PiPER and SO-101. Versioned scene files, offline 3D previews and a frozen 54-attempt benchmark retain every trajectory: supported pairs 27/27, disabled-table support 0/27, all gravity checks pass. Native loading and passive contact are tested; shoe grasping, deformation and physical transfer remain unqualified.</p><a href="papers/shoe-asset-library-v01/index.html">Read the asset library results</a> · <a href="downloads/topics/physical-grounding/runs/2026-10-12-shoe-asset-library-v01/library/index.html">Browse shoes and arms</a></div></li><li><time datetime="2026-10-12">12 October 2026</time><div><h3>Complete more placements with a bounded second lift and revised grasp</h3><p>Three fresh cohorts retain 252 valid attempts. The revised grasp completes 23/36 placements versus 15/36 for v0.4 and 18/36 with second lift alone; all 144 controls fail. Eight completions are gained and none lost, while shared successes average 0.772 simulated seconds slower. Twelve low-friction acquisitions and one retention failure remain. All 1,035 computation overruns are retained; physical qualification is open.</p><a href="papers/piper-reliability-v05/index.html">Read the v0.5 reliability comparison</a> · <a href="downloads/topics/physical-grounding/runs/2026-10-12-piper-reliability-v05/README.md">Inspect all three cohorts</a></div></li><li><time datetime="2026-10-11">11 October 2026</time><div><h3>Separate faster recovery from an ineffective retry</h3><p>A fresh 84-attempt comparison completes 4/12 placements in every mode; all 48 controls fail. Two resumed tasks finish 2.440–2.640 simulated seconds sooner after unchanged settling holds, while four failed grips are refused 2.88–2.90 seconds sooner. Eight failures remain, including two held blocks below the resume-height gate. Every native trajectory and raw computation duration is retained; physical qualification is open.</p><a href="papers/piper-contact-recovery-v04/index.html">Read the v0.4 recovery comparison</a> · <a href="downloads/topics/physical-grounding/runs/2026-10-11-piper-recovery-v04/receipt/report.html">Inspect every paired attempt</a></div></li><li><time datetime="2026-10-11">11 October 2026</time><div><h3>Compare probe-only motion with contact history</h3><p>A frozen 84-attempt paired cohort completes 6/12 history placements versus 4/12 original and probe-only placements; all 48 controls fail. Four tasks complete after five closed holds/resumes, but all six supported acquisition retries fail. Only four of five resume windows meet the independent low absolute tool-speed check. Actual motion and 75 missed computation windows remain visible; physical robot qualification is open.</p><a href="papers/piper-contact-history-v03/index.html">Read the contact history comparison</a> · <a href="downloads/topics/physical-grounding/runs/2026-10-11-piper-contact-v03/receipt/report.html">Inspect all 84 attempts</a></div></li><li><time datetime="2026-10-11">11 October 2026</time><div><h3>Test the grip and publish a completion regression</h3><p>A slow probe and one supported retry retain 30 valid attempts. At moderate friction baseline completes 2/2 while guarded completes 0/2; normal cases both pass and low-friction cases both fail. No successful recovery or overall improvement is demonstrated. Four brief following windows do not establish detector accuracy; 53 computation windows miss 20 ms. Every full attempt remains public.</p><a href="papers/piper-grip-validation-and-recovery/index.html">Read the paired results and actual stop motion</a> · <a href="downloads/topics/physical-grounding/runs/2026-10-11-piper-grip/receipt/report.html">Inspect all 30 attempts</a></div></li><li><time datetime="2026-10-11">11 October 2026</time><div><h3>Measure PiPER contact and a friction failure</h3><p>A frozen authored rigid-block pilot retains nine valid attempts: nominal placement 2/2, low-friction placement 0/1, open-jaw 0/3 and hold 0/3. One of 9,000 computation windows exceeds 20 ms. Complete task receipts remain distinct from unloaded profiles; learned skills, shoe physics and physical qualification are open.</p><a href="papers/hardware-matched-robot-simulation/index.html#piper-contact-pilot-retains-a-low-friction-failure">Read the PiPER contact pilot</a> · <a href="https://huggingface.co/spaces/Dvidia/robot-simulation-lab">Open the Robot Simulation Lab</a></div></li><li><time datetime="2026-10-11">11 October 2026</time><div><h3>Run more arms on a local CPU</h3><p>PiPER and SO-101 join the library with pinned models, explicit arm/gripper units, preserved licenses and complete numerical receipts. Each completes six unloaded motion checks offline. Their learned-policy and physical qualification remain open. The PiPER contact pilot and UR5e grasp demonstration have separate task receipts.</p><a href="papers/hardware-matched-robot-simulation/index.html#piper-and-so-101-now-have-runnable-cpu-profiles">Read the profile measurements</a> · <a href="https://huggingface.co/spaces/Dvidia/robot-simulation-lab">Open the Robot Simulation Lab</a></div></li><li><time datetime="2026-10-11">11 October 2026</time><div><h3>Give the reference arm a contact task</h3><p>A free rigid block must be grasped, lifted, carried, released and left settled at its destination. Frozen scenarios compare the authored controller with identical arm commands and open jaws, and with a hold control. Full traces and 3D replay preserve the evidence for the next compact action-learning experiment. Shoe physics, a learned task policy and hardware transfer remain open.</p><a href="papers/native-grasp-task-benchmark/index.html">Read the native task benchmark</a> · <a href="downloads/topics/physical-grounding/runs/2026-10-11-native-grasp/replay/index.html">Replay grasp and placement</a></div></li><li><time datetime="2026-10-11">11 October 2026</time><div><h3>Build a hardware reference we can measure</h3><p>A pinned six-axis arm and coupled gripper expose fourteen coordinates and seven commands. All 18 unloaded numerical runs are valid; 1 ms CPU physics measures 40.80–47.29× elapsed-time throughput with sensing, rendering and policy excluded. A paired trace scorer makes physical mismatch measurable. Five-finger references and LeRobot collection have separate contracts; hardware fidelity and shoe competence remain unmeasured.</p><a href="papers/hardware-matched-robot-simulation/index.html">Read the mechanical contract and upcoming arms</a> · <a href="downloads/topics/physical-grounding/runs/2026-10-11-hardware-reference/replay/index.html">Open the 3D replay</a></div></li><li><time datetime="2026-10-11">11 October 2026</time><div><h3>Learn a compact command-to-motion predictor</h3><p>A 6,438-byte CPU model predicts the next 20 ms of joint/jaw movement from native state and issued commands. Twelve seeded groups retain 36 recordings; 4,553 test transitions are not independent trials. Warm computation measures 0.207 ms p95, but jaw mean absolute/worst errors regress against persistence and the first opening is overpredicted. Shoe collection, hardware sensing and validated shoe physics remain open.</p><a href="papers/dvidia-observation-lab/index.html#compact-cpu-pilot-learns-the-next-actuator-boundary">Read the measured pilot and shoe collection plan</a></div></li><li><time datetime="2026-10-10">10 October 2026</time><div><h3>Observe image motion and forecast its path</h3><p>A manually seeded CPU source alpha records pixel speed and causal forecasts. Six authored cases process 720 frames in 1.454 seconds; occlusion and low-texture losses remain visible, and a 500 ms reversal forecast misses by nearly 90 pixels. The v0.1 release/demo remain separate; real-scene accuracy, metric speed and live robot control are unqualified.</p><a href="papers/dvidia-observation-lab/index.html#image-motion-source-alpha-estimates-speed-and-future-paths">Read the source alpha and measured limitations</a></div></li><li><time datetime="2026-10-09">9 October 2026</time><div><h3>Publish the robotics research pipeline</h3><p>A diagram connects footage review, measured robot state, local training, frozen simulation evaluation and compatible skill installation. Automatic annotation and a learned task supervisor are proposed; their companion validation studies and physical robot qualification remain unrun.</p><a href="papers/robotics-research-pipeline/index.html">Read the architecture and validation gates</a></div></li><li><time datetime="2026-10-07">7 October 2026</time><div><h3>A public skill link reaches a simulated arm</h3><p>One-click local installation binds a DVIDIA placement envelope to an authored contact controller. Six scene layouts pass; identical joint commands with open jaws and no-motion controls each pass 0/6. Physical transfer and learned policies remain open.</p><a href="papers/skillspace-arm-installation/index.html">Read the installation contract and arm replay</a></div></li><li><time datetime="2026-10-07">7 October 2026</time><div><h3>The offline cable environment is runnable</h3><p>A local controller-training loop and simulation-only skill pack now run on CPU. Trained and baseline feedback each pass 10/10 simulated seeds; zero force and early release each pass 0/10. Real gripping, calibration and GPU qualification remain open.</p><a href="papers/offline-cable-training-environment/index.html">Read the first product build and replay</a></div></li><li><time datetime="2026-10-07">7 October 2026</time><div><h3>Contact accuracy meets runtime</h3><p>54 deterministic CPU fixture trials recorded. Endpoint agreement coexists with unqualified force transients; coarse wall tests expose missed contact. No GPU or physical-transfer claim.</p><a href="papers/fast-accurate-robot-training-simulation/index.html">Read the measurements</a></div></li><li><time datetime="2026-10-07">7 October 2026</time><div><h3>Compare the observation-to-skill thesis with prior work</h3><p>Spatial attention, demonstration coverage, executable simulation and reusable repairs are reviewed separately. Three parallel Grok 4.7 searches support discovery; primary sources support the claims.</p><a href="papers/grok-robotics-research-on-x/index.html">Read the comparison</a></div></li><li><time datetime="2026-10-06">6 October 2026</time><div><h3>Five licensed POV excerpts processed</h3><p>Ten image calls completed. A checker accepted an object error and captions omitted visible state changes. The separate accuracy pilot remains unrun.</p><a href="papers/clef-and-grounded-video-observations/index.html">Read the feasibility run</a></div></li><li><time datetime="2026-10-06">6 October 2026</time><div><h3>Define the evidence and release questions</h3><p>Four baseline protocols and a Skillspace graduation proposal establish the questions to test. A proposed protocol is distinct from an executed experiment.</p><a href="papers/physical-skill-research-agenda/index.html">Read the agenda</a></div></li></ol></section><section class="journal-questions"><h2>Open questions</h2><ul>${topics.map(t => `<li><a href="topics/${t.id}/index.html">${escapeHtml(t.title)}</a> — ${escapeHtml(t.summary)}</li>`).join("")}</ul><p>Follow new publications through <a href="feed.xml">RSS</a> or inspect <a href="${REPOSITORY}">the source and revisions on GitHub</a>.</p></section>`;
  await writePage("index.html", layout({ page: "index.html", title: "Research journal", description: "An open notebook on demonstrations, physical grounding, calibrated simulation and qualified robot skills.", content, catalog, topics, active: "index" }));
  pages.unshift({ path: "index.html", date: catalog.publications.reduce((latest, paper) => paper.date > latest ? paper.date : latest, "2026-10-07") });
  const rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>DVIDIA Research</title><link>${ORIGIN}/</link><description>Research footprints on demonstrations, calibrated simulation and robot skills.</description><language>en</language><atom:link href="${ORIGIN}/feed.xml" rel="self" type="application/rss+xml"/>${catalog.publications.map(p => { const url = `${ORIGIN}/papers/${p.slug}/`; return `<item><title>${escapeHtml(p.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${new Date(`${p.date}T12:00:00Z`).toUTCString()}</pubDate><description>${escapeHtml(`${p.status}. ${p.abstract}`)}</description></item>`; }).join("")}</channel></rss>\n`;
  await writeFile(resolve(DOCS, "feed.xml"), rss);
  await writeFile(resolve(DOCS, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(p => `<url><loc>${ORIGIN}/${p.path === "index.html" ? "" : p.path.replace(/index\.html$/, "")}</loc><lastmod>${p.date}</lastmod></url>`).join("")}</urlset>\n`);
  await writeFile(resolve(DOCS, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`);
  await writeFile(resolve(DOCS, "publications.json"), `${JSON.stringify(catalog, null, 2)}\n`);
  const fixturePath = "topics/physical-grounding/runs/2026-10-07-contact-fixture/bench.py";
  const fixtureHash = createHash("sha256").update(await readFile(resolve(ROOT, fixturePath))).digest("hex");
  const fixture = JSON.parse(await readFile(resolve(ROOT, "topics/physical-grounding/runs/2026-10-07-contact-fixture/results/local-cpu/results.json"), "utf8"));
  if (fixtureHash !== fixture.system.source_sha256 || fixture.groups.reduce((total, group) => total + group.trials.length, 0) !== 54) throw new Error("Published contact-fixture provenance does not match the recorded source/54 trials.");
  console.log(`Built ${catalog.publications.length} publications, ${topics.length} topic readers and ${downloadPaths.size} public artifacts.`);
  return { catalog, pages, downloadPaths };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildPublications().catch(error => { console.error(`Publication build failed: ${error.message}`); process.exitCode = 1; });
}
