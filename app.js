const projects = [
  {
    title: "bi-stable auxetic vascular stents",
    year: "2023 - present",
    tags: ["biomed", "research"],
    desc: "patient-specific conformability via auxetic geometries + bistability; CT segmentation + VTK prototyping pipeline.",
    links: [
      { label: "project_board", href: "https://isef.net/project/enbm047-patient-specific-optimization-using-auxetic-stents" },
    ]
  },
  {
    title: "assistive navigation (camera + haptics)",
    year: "2025 – 2026",
    tags: ["software", "hardware", "biomed"],
    desc: "Real-time detection + floor-segmentation and path-planning; haptic motors via microcontroller; tts for alerts.",
    links: [
      { label: "path_planning_demo", href: "https://drive.google.com/file/d/1dqa5QphN3HUc9oy6NQQ5Yq59y1JCHGTj/view?usp=sharing" },
      { label: "obj_detect_demo", href: "https://drive.google.com/file/d/1B6cWBmWnDPZSImrHdA1Kpx8dStLzJKKX/view?usp=sharing" },
    ]
  },
  {
    title: "ftc 18305, 8468, 9791",
    year: "2020–2025",
    tags: ["robotics", "hardware", "software"],
    desc: "mechanical/design lead work + systems build; 2024 world champs, 2021-22 2nd opr in the world.",
    links: [
      { label: "18305", href: "https://www.instagram.com/singularity_18305/?hl=en" },
      { label: "8468", href: "https://ftcscout.org/teams/8468?season=2023" }
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