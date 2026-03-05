const projects = [
  {
    title: "Bi-stable auxetic vascular stents",
    year: "2025",
    tags: ["biomed", "research"],
    desc: "Patient-specific conformability via auxetic geometry + bistability; modeling + prototyping pipeline.",
    links: [
      { label: "paper", href: "#" },
      { label: "repo", href: "#" }
    ]
  },
  {
    title: "Assistive navigation (OAK-D + haptics)",
    year: "2025–2026",
    tags: ["software", "hardware", "biomed"],
    desc: "Real-time detection + zone-based feedback; haptic motors via microcontroller; TTS for alerts.",
    links: [
      { label: "demo", href: "#" },
      { label: "repo", href: "#" }
    ]
  },
  {
    title: "FRC: Divide by Zero (DIV/0)",
    year: "2023–2025",
    tags: ["robotics", "hardware"],
    desc: "Mechanical/design lead work + systems build; outreach and scaling team infrastructure.",
    links: [
      { label: "highlights", href: "#" }
    ]
  }
];

const elList = document.getElementById("list");
const elQ = document.getElementById("q");
const elTag = document.getElementById("tag");
const elReset = document.getElementById("reset");

function render(items){
  if (!items.length){
    elList.innerHTML = `<div class="card"><div class="meta">no matches. try clearing filters.</div></div>`;
    return;
  }

  elList.innerHTML = items.map(p => {
    const tags = p.tags.map(t => `<span class="pill">${t}</span>`).join("");
    const links = (p.links || []).map(l => `<a class="pill" href="${l.href}" target="_blank" rel="noreferrer">${l.label}</a>`).join("");
    return `
      <article class="card">
        <div class="top">
          <div class="title">${escapeHtml(p.title)}</div>
          <div class="meta">${escapeHtml(p.year)}</div>
        </div>
        <div class="desc">${escapeHtml(p.desc)}</div>
        <div class="tags">
          ${tags}
          ${links}
        </div>
      </article>
    `;
  }).join("");
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function applyFilters(){
  const q = elQ.value.trim().toLowerCase();
  const tag = elTag.value;

  const filtered = projects.filter(p => {
    const matchesQ =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.desc.toLowerCase().includes(q) ||
      p.tags.some(t => t.includes(q));

    const matchesTag = !tag || p.tags.includes(tag);

    return matchesQ && matchesTag;
  });

  render(filtered);
}

elQ.addEventListener("input", applyFilters);
elTag.addEventListener("change", applyFilters);
elReset.addEventListener("click", () => {
  elQ.value = "";
  elTag.value = "";
  applyFilters();
});

function setClock(){
  const now = new Date();
  const t = now.toLocaleString(undefined, { weekday:"short", hour:"2-digit", minute:"2-digit" });
  document.getElementById("clock").textContent = t;
  document.getElementById("year").textContent = String(now.getFullYear());
}
setClock();
setInterval(setClock, 15000);

// keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey){
    e.preventDefault();
    elQ.focus();
  }
  if (e.key.toLowerCase() === "g"){ location.hash = "#projects"; }
  if (e.key.toLowerCase() === "a"){ location.hash = "#about"; }
  if (e.key.toLowerCase() === "c"){ location.hash = "#contact"; }
  if (e.key === "?"){
    const d = document.querySelector("details.hint");
    d.open = !d.open;
  }
});

render(projects);