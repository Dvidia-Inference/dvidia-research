import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Marked } from "marked";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const ORIGIN = "https://research.dvidia.org";
export const REPOSITORY = "https://github.com/Dvidia-Inference/dvidia-research";
const DOCS = resolve(ROOT, "docs");
const TOPICS = ["capture-quality", "skill-relations", "evaluation-provenance", "physical-grounding"];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
  if (catalog.schemaVersion !== 1 || catalog.publisher !== "DVIDIA" || catalog.contact !== "hello@dvidia.org" || catalog.follow !== "https://x.com/IAMMRRIVR") throw new Error("Unexpected publisher configuration.");
  if (catalog.contributor !== null) throw new Error("Individual contributor attribution is intentionally unset.");
  if (!Array.isArray(catalog.publications) || !catalog.publications.length) throw new Error("Publications are required.");
  const slugs = new Set();
  for (const paper of catalog.publications) {
    if (!SLUG.test(paper.slug) || slugs.has(paper.slug)) throw new Error(`Invalid/duplicate publication slug: ${paper.slug}`);
    slugs.add(paper.slug);
    if (!/^reports\/[A-Za-z0-9 -]+\.md$/.test(paper.source)) throw new Error(`Invalid source: ${paper.source}`);
    for (const key of ["title", "type", "status", "abstract"]) if (typeof paper[key] !== "string" || !paper[key].trim()) throw new Error(`Missing ${key}: ${paper.slug}`);
    if (!/^2026-10-0[67]$/.test(paper.date)) throw new Error(`Invalid publication date: ${paper.slug}`);
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
  return `<div class="nav-section"><span class="nav-label">Notebook</span>${a("index.html", "Research journal", "index")}${a("index.html#progress", "Progress", "progress")}</div><div class="nav-section"><span class="nav-label">Publications</span>${publications.map(p => a(`papers/${p.slug}/index.html`, p.title, p.slug)).join("")}</div><div class="nav-section"><span class="nav-label">Questions</span>${topics.map(t => a(`topics/${t.id}/index.html`, t.title, t.id)).join("")}</div><div class="nav-section"><span class="nav-label">Follow the work</span>${a("feed.xml", "RSS feed", "feed")}<a href="${REPOSITORY}">GitHub</a><a href="https://x.com/IAMMRRIVR">X · @IAMMRRIVR</a><a href="mailto:hello@dvidia.org">hello@dvidia.org</a></div>`;
}

function layout({ page, title, description, content, catalog, topics, active = "", date }) {
  const nav = navigation(page, catalog.publications, topics, active);
  const canonical = `${ORIGIN}/${page === "index.html" ? "" : page.replace(/index\.html$/, "")}`;
  const jsonLd = { "@context": "https://schema.org", "@type": active === "index" ? "CollectionPage" : "Article", headline: title, description, url: canonical, publisher: { "@type": "Organization", name: "DVIDIA", url: "https://dvidia.org" }, ...(date ? { datePublished: date } : {}) };
  return `<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)} · DVIDIA Research</title><meta name="description" content="${escapeHtml(description)}"><meta name="theme-color" content="#faf9f6"><link rel="canonical" href="${canonical}"><link rel="alternate" type="application/rss+xml" title="DVIDIA Research" href="${escapeHtml(href(page, "feed.xml"))}"><link rel="icon" href="${escapeHtml(href(page, "assets/favicon.svg"))}" type="image/svg+xml"><link rel="stylesheet" href="${escapeHtml(href(page, "styles.css"))}"><script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script><script src="${escapeHtml(href(page, "app.js"))}" defer></script></head>\n<body><a class="skip-link" href="#main">Skip to content</a><aside class="site-sidebar" aria-label="Research navigation"><a class="brand" href="${escapeHtml(href(page, "index.html"))}"><span class="brand-name">DVIDIA</span><span class="brand-subtitle">Research notebook</span></a><nav class="site-nav" id="site-navigation" aria-label="Main">${nav}</nav><details class="mobile-navigation"><summary>Contents</summary><nav aria-label="Mobile">${nav}</nav></details></aside><main class="page-shell" id="main">${content}<footer class="site-footer"><p>Published by DVIDIA · <a href="mailto:hello@dvidia.org">hello@dvidia.org</a></p><p><a href="${REPOSITORY}">Source and revisions</a> · <a href="${escapeHtml(href(page, "feed.xml"))}">RSS</a> · <a href="https://x.com/IAMMRRIVR">@IAMMRRIVR</a></p><p>Writing: <a href="${REPOSITORY}/blob/main/LICENSE">CC BY 4.0</a>. Original code: <a href="${REPOSITORY}/blob/main/LICENSE-CODE">MIT</a>. External work retains its own terms.</p></footer></main></body></html>\n`;
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
    const rendered = renderMarkdown(stripTitle(source), value => resolveLink(paper.source, page, value));
    const toc = `<details class="paper-toc"><summary>In this paper</summary><nav aria-label="Table of contents"><ol>${rendered.toc.filter(h => h.depth === 2).map(h => `<li><a href="#${h.id}">${escapeHtml(h.title)}</a></li>`).join("")}</ol></nav></details>`;
    const content = `<article class="paper"><header class="paper-header"><p class="eyebrow">${escapeHtml(paper.type)}</p><h1>${escapeHtml(paper.title)}</h1><p class="paper-meta"><time datetime="${paper.date}">${dateLabel(paper.date)}</time> · DVIDIA</p><p class="paper-status">${escapeHtml(paper.status)}</p><p class="paper-actions"><a href="${repositoryUrl(paper.source)}">Source & history</a> · <a href="${escapeHtml(href(page, `downloads/${paper.source.split("/").map(encodeURIComponent).join("/")}`))}" download>Download Markdown</a></p></header><section class="paper-abstract" aria-label="Abstract"><h2>Abstract</h2><p>${escapeHtml(paper.abstract)}</p></section>${toc}<div class="paper-body">${rendered.html}</div></article>`;
    await writePage(page, layout({ page, title: paper.title, description: paper.abstract, content, catalog, topics, active: paper.slug, date: paper.date }));
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
    pages.push({ path: page, date: "2026-10-07" });
  }
  const paperRows = catalog.publications.map(p => `<article class="paper-row" data-paper-row><p class="paper-meta"><time datetime="${p.date}">${dateLabel(p.date)}</time> · ${escapeHtml(p.type)}</p><h2><a href="${href("index.html", pageMap.get(p.source))}">${escapeHtml(p.title)}</a></h2><p>${escapeHtml(p.abstract)}</p><p class="paper-status">${escapeHtml(p.status)}</p></article>`).join("");
  const content = `<header class="journal-header"><p class="eyebrow">An open research notebook</p><h1>From observation<br>to physical skill.</h1><p class="journal-intro">We study how demonstrations become usable evidence, how simulation becomes useful practice, and when a robot skill earns a release.</p><p class="paper-meta">Published by DVIDIA · <a href="mailto:hello@dvidia.org">hello@dvidia.org</a></p></header><section class="journal-publications" aria-labelledby="publications"><div class="section-heading"><h2 id="publications">Publications</h2><p>${catalog.publications.length} papers and working notes</p></div><div data-paper-search hidden><label for="paper-search">Find a publication</label><input id="paper-search" type="search" autocomplete="off" placeholder="Search titles, questions and findings"><span data-search-count aria-live="polite"></span></div><div class="paper-list">${paperRows}</div><p data-search-empty hidden>No publications match this search.</p></section><section class="journal-progress" aria-labelledby="progress"><h2 id="progress">Research footprints</h2><ol class="progress-list"><li><time datetime="2026-10-07">7 October 2026</time><div><h3>Contact accuracy meets runtime</h3><p>54 deterministic CPU fixture trials recorded. Endpoint agreement coexists with unqualified force transients; coarse wall tests expose missed contact. No GPU or physical-transfer claim.</p><a href="papers/fast-accurate-robot-training-simulation/index.html">Read the measurements</a></div></li><li><time datetime="2026-10-07">7 October 2026</time><div><h3>Compare the observation-to-skill thesis with prior work</h3><p>Spatial attention, demonstration coverage, executable simulation and reusable repairs are reviewed separately. Three parallel Grok 4.7 searches support discovery; primary sources support the claims.</p><a href="papers/grok-robotics-research-on-x/index.html">Read the comparison</a></div></li><li><time datetime="2026-10-06">6 October 2026</time><div><h3>Five licensed POV excerpts processed</h3><p>Ten image calls completed. A checker accepted an object error and captions omitted visible state changes. The separate accuracy pilot remains unrun.</p><a href="papers/clef-and-grounded-video-observations/index.html">Read the feasibility run</a></div></li><li><time datetime="2026-10-06">6 October 2026</time><div><h3>Define the evidence and release questions</h3><p>Four baseline protocols and a Skillspace graduation proposal establish the questions to test. A proposed protocol is distinct from an executed experiment.</p><a href="papers/physical-skill-research-agenda/index.html">Read the agenda</a></div></li></ol></section><section class="journal-questions"><h2>Open questions</h2><ul>${topics.map(t => `<li><a href="topics/${t.id}/index.html">${escapeHtml(t.title)}</a> — ${escapeHtml(t.summary)}</li>`).join("")}</ul><p>Follow new publications through <a href="feed.xml">RSS</a> or inspect <a href="${REPOSITORY}">the source and revisions on GitHub</a>.</p></section>`;
  await writePage("index.html", layout({ page: "index.html", title: "Research journal", description: "An open notebook on demonstrations, physical grounding, calibrated simulation and qualified robot skills.", content, catalog, topics, active: "index" }));
  pages.unshift({ path: "index.html", date: "2026-10-07" });
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
