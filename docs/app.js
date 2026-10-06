const REPOSITORY = "https://github.com/Dvidia-Inference/dvidia-research";
const STAGES = {
  scoping: "Scoping",
  reproducing: "Reproducing",
  evaluating: "Evaluating",
  findings: "Findings",
};
const grid = document.querySelector("#topic-grid");
const state = document.querySelector("#catalog-state");
const retry = document.querySelector("#catalog-retry");
const search = document.querySelector("#topic-search");
const filter = document.querySelector("#stage-filter");
const count = document.querySelector("#catalog-count");
let topics = [];
let request;

function node(tag, className, text) {
  const result = document.createElement(tag);
  if (className) result.className = className;
  if (text !== undefined) result.textContent = text;
  return result;
}
function link(text, href, className) {
  const result = node("a", className, text);
  result.href = href;
  return result;
}
function topicPath(topic) {
  return `${REPOSITORY}/tree/main/topics/${encodeURIComponent(topic.id)}`;
}
function questionPath(topic, question) {
  if (question.issueUrl) return question.issueUrl;
  const url = new URL(`${REPOSITORY}/issues/new`);
  url.searchParams.set("template", "research-question.yml");
  url.searchParams.set(
    "title",
    `[${topic.id}] ${question.text ?? question.title}`,
  );
  url.searchParams.set("topic", topic.id);
  url.searchParams.set("question", question.text ?? question.title);
  return url.href;
}
function dateLabel(value) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
function makeCard(topic) {
  const card = node("article", "topic-card");
  const titleId = `topic-${topic.id}`;
  card.setAttribute("aria-labelledby", titleId);
  const figure = node("figure", "topic-art");
  const image = node("img");
  image.src = `./${topic.cover}`;
  image.alt = topic.imageAlt;
  image.width = 1000;
  image.height = 540;
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener(
    "error",
    () => {
      image.hidden = true;
      figure.classList.add("is-unavailable");
      figure.append(
        node("span", "art-unavailable", "Editorial illustration unavailable"),
      );
    },
    { once: true },
  );
  figure.append(
    image,
    node("figcaption", "", "AI-generated editorial illustration"),
  );
  const body = node("div", "topic-body");
  const topline = node("div", "topic-topline");
  topline.append(
    node("p", "topic-kicker", topic.kicker),
    node("span", `stage stage-${topic.status}`, STAGES[topic.status]),
  );
  const title = node("h3");
  title.id = titleId;
  title.append(link(topic.title, topicPath(topic)));
  const meta = node("div", "topic-meta");
  const completed = topic.milestones.filter((item) => item.done).length;
  meta.append(
    node(
      "span",
      "milestone-count",
      `${completed}/${topic.milestones.length} milestones completed`,
    ),
  );
  const updated = node("time", "", `Updated ${dateLabel(topic.updated)}`);
  updated.dateTime = topic.updated;
  meta.append(updated);
  const first = node("div", "first-task");
  first.append(
    node("p", "first-task-label", "A first contribution"),
    node("p", "first-task-text", topic.firstTask.title),
  );
  const actions = node("div", "topic-actions");
  actions.append(
    link(
      "Pick a question ↗",
      questionPath(topic, topic.firstTask),
      "button button-primary",
    ),
    link("Topic notes ↗", topicPath(topic), "text-link"),
  );
  const details = node("details", "topic-details");
  const open = topic.questions.filter(
    (question) => question.state === "open",
  ).length;
  details.append(
    node(
      "summary",
      "",
      `${open} open ${open === 1 ? "question" : "questions"} · ${topic.sources.length} ${topic.sources.length === 1 ? "source" : "sources"}`,
    ),
  );
  const questions = node("ul", "question-list");
  for (const question of topic.questions) {
    const item = node("li");
    const anchor = link("", questionPath(topic, question));
    anchor.append(
      node("span", "", question.text),
      node(
        "span",
        `question-state${question.state === "answered" ? " is-answered" : ""}`,
        question.state === "answered" ? "Answered" : "Open ↗",
      ),
    );
    item.append(anchor);
    questions.append(item);
  }
  const sources = node("ul", "source-list");
  for (const source of topic.sources) {
    const item = node("li");
    const anchor = link("", source.url);
    anchor.append(
      node("span", "", `${source.title} (${source.year})`),
      node("span", "source-type", `${source.type} ↗`),
    );
    item.append(anchor);
    sources.append(item);
  }
  const milestones = node("ul", "milestone-list");
  for (const milestone of topic.milestones) {
    const item = node("li");
    const mark = node("span", "milestone-mark", milestone.done ? "✓" : "○");
    mark.setAttribute("aria-hidden", "true");
    item.append(
      mark,
      node(
        "span",
        "",
        `${milestone.done ? "Completed" : "To do"}: ${milestone.label}`,
      ),
    );
    milestones.append(item);
  }
  details.append(
    node("h4", "", "Questions"),
    questions,
    node("h4", "", "Sources to start with"),
    sources,
    node("h4", "", "Working checklist"),
    milestones,
  );
  body.append(
    topline,
    title,
    node("p", "topic-summary", topic.summary),
    meta,
    first,
    actions,
    details,
  );
  card.append(figure, body);
  return card;
}

function render() {
  const words = search.value
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const matches = topics.filter((topic) => {
    if (filter.value !== "all" && topic.status !== filter.value) return false;
    const haystack = [
      topic.title,
      topic.kicker,
      topic.summary,
      topic.firstTask.title,
      ...topic.questions.map((question) => question.text),
      ...topic.sources.map((source) => source.title),
    ]
      .join(" ")
      .toLocaleLowerCase();
    return words.every((word) => haystack.includes(word));
  });
  grid.replaceChildren(...matches.map(makeCard));
  count.textContent = `${matches.length} of ${topics.length} research ${topics.length === 1 ? "topic" : "topics"}`;
  state.hidden = matches.length > 0;
  state.classList.remove("is-error");
  if (!matches.length)
    state.textContent =
      "No matching topics. Try a broader question or choose another stage.";
}

// The build validates the complete schema. These checks also keep every rendered URL safe
// if an edited or malformed catalog reaches the static host independently of that build.
function readCatalog(data) {
  if (
    data?.schemaVersion !== 1 ||
    data.repository !== REPOSITORY ||
    !Array.isArray(data.topics) ||
    !data.topics.length ||
    data.topics.length > 100
  )
    throw new Error("Invalid catalog");
  const ids = new Set();
  const text = (value, max = 2000) =>
    typeof value === "string" && value.trim().length > 0 && value.length <= max;
  const safeUrl = (value) => {
    try {
      const url = new URL(value);
      return (
        typeof value === "string" &&
        url.protocol === "https:" &&
        !url.username &&
        !url.password &&
        !/[\s\\\u0000-\u001f]/.test(value)
      );
    } catch {
      return false;
    }
  };
  const issue = (value) =>
    value === null ||
    (typeof value === "string" &&
      /^https:\/\/github\.com\/Dvidia-Inference\/dvidia-research\/issues\/[1-9][0-9]*$/.test(
        value,
      ));
  for (const topic of data.topics) {
    if (
      !topic ||
      typeof topic.id !== "string" ||
      topic.id.length > 64 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(topic.id) ||
      ids.has(topic.id) ||
      !Object.hasOwn(STAGES, topic.status) ||
      topic.cover !== `assets/${topic.id}.webp` ||
      !text(topic.title, 160) ||
      !text(topic.kicker, 100) ||
      !text(topic.summary, 1000) ||
      !text(topic.imageAlt, 500) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(topic.updated) ||
      !Number.isFinite(Date.parse(`${topic.updated}T00:00:00Z`))
    )
      throw new Error("Invalid topic");
    ids.add(topic.id);
    if (
      !Array.isArray(topic.questions) ||
      !topic.questions.length ||
      topic.questions.length > 40 ||
      !topic.questions.every(
        (question) =>
          question &&
          text(question.text) &&
          ["open", "answered"].includes(question.state) &&
          issue(question.issueUrl),
      )
    )
      throw new Error("Invalid questions");
    if (
      !Array.isArray(topic.sources) ||
      !topic.sources.length ||
      topic.sources.length > 60 ||
      !topic.sources.every(
        (source) =>
          source &&
          text(source.title) &&
          safeUrl(source.url) &&
          ["paper", "code", "essay", "docs"].includes(source.type) &&
          Number.isInteger(source.year),
      )
    )
      throw new Error("Invalid sources");
    if (
      !Array.isArray(topic.milestones) ||
      !topic.milestones.length ||
      topic.milestones.length > 40 ||
      !topic.milestones.every(
        (item) => item && text(item.label) && typeof item.done === "boolean",
      ) ||
      !topic.firstTask ||
      !text(topic.firstTask.title) ||
      !issue(topic.firstTask.issueUrl)
    )
      throw new Error("Invalid checklist");
  }
  return data.topics;
}

async function load() {
  request?.abort();
  const abort = new AbortController();
  request = abort;
  const timeout = setTimeout(() => abort.abort(), 15000);
  retry.hidden = true;
  state.hidden = false;
  state.classList.remove("is-error");
  state.textContent = "Opening the research notebook…";
  try {
    const response = await fetch("./topics.json", {
      signal: abort.signal,
      cache: "no-cache",
    });
    if (!response.ok) throw new Error("Catalog unavailable");
    const raw = await response.text();
    if (raw.length > 1000000) throw new Error("Catalog too large");
    const next = readCatalog(JSON.parse(raw));
    if (request !== abort || abort.signal.aborted) return;
    topics = next;
    const available = Object.keys(STAGES).filter((stage) =>
      topics.some((topic) => topic.status === stage),
    );
    filter.replaceChildren(
      new Option("All stages", "all"),
      ...available.map((stage) => new Option(STAGES[stage], stage)),
    );
    document.querySelector("#stage-field").hidden = available.length < 2;
    document.querySelector("#catalog-tools").hidden = false;
    render();
  } catch {
    if (request !== abort) return;
    state.hidden = false;
    state.classList.add("is-error");
    state.replaceChildren(
      node(
        "p",
        "",
        "The topic browser could not load. Try again, or browse the notes directly on GitHub.",
      ),
      link(
        "Browse topic notes ↗",
        `${REPOSITORY}/tree/main/topics`,
        "text-link",
      ),
    );
    retry.hidden = false;
  } finally {
    clearTimeout(timeout);
  }
}
search.addEventListener("input", render);
filter.addEventListener("change", render);
retry.addEventListener("click", load);
void load();
