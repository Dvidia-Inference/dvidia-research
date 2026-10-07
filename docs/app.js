// Every entry and paper is served as HTML. JavaScript only filters the existing
// bibliography and indicates the current section in the paper's contents.
const search = document.querySelector("#paper-search");
const entries = [...document.querySelectorAll(".paper-list .paper-row")];
if (search && entries.length) {
  const searchRegion = search.closest('[data-paper-search]');
  if (searchRegion) searchRegion.hidden = false;
  const count = document.querySelector("[data-search-count]");
  const empty = document.querySelector("[data-search-empty]");
  const searchable = entries.map((entry) => ({
    entry,
    text: entry.textContent.normalize("NFKC").toLocaleLowerCase(),
  }));
  function filterPapers() {
    const words = search.value.normalize("NFKC").trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const item of searchable) {
      const matches = words.every((word) => item.text.includes(word));
      item.entry.hidden = !matches;
      if (matches) visible += 1;
    }
    if (count) count.textContent = `${visible} of ${entries.length} research papers`;
    if (empty) empty.hidden = visible > 0;
  }
  search.addEventListener("input", filterPapers);
  search.addEventListener("search", filterPapers);
  filterPapers();
}
const tocLinks = [...document.querySelectorAll('.paper-toc a[href^="#"]')];
const headings = tocLinks.map((link) => {
  let id;
  try { id = decodeURIComponent(link.hash.slice(1)); } catch { return null; }
  const heading = document.getElementById(id);
  return heading ? { link, heading } : null;
}).filter(Boolean);
if (headings.length) {
  let pending = false;
  function updateCurrentSection() {
    pending = false;
    const readingPosition = Math.min(window.innerHeight * 0.25, 180);
    let current = null;
    for (const item of headings) {
      if (item.heading.getBoundingClientRect().top <= readingPosition) current = item;
      else break;
    }
    for (const item of headings) {
      if (item === current) item.link.setAttribute("aria-current", "location");
      else item.link.removeAttribute("aria-current");
    }
  }
  function scheduleSectionUpdate() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(updateCurrentSection);
  }
  window.addEventListener("scroll", scheduleSectionUpdate, { passive: true });
  window.addEventListener("resize", scheduleSectionUpdate, { passive: true });
  window.addEventListener("pageshow", scheduleSectionUpdate);
  updateCurrentSection();
}
