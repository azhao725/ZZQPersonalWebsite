(function () {
  const data = window.SITE_DATA;
  if (!data) {
    document.body.insertAdjacentHTML("beforeend",
      "<p style='position:fixed;bottom:20px;left:20px'>content/data.js is missing — run tools/build_index.py</p>");
    return;
  }
  const { site, projects } = data;
  const src = (p, v) => "content/" + p.split("/").map(encodeURIComponent).join("/") + (v ? "?v=" + v : "");
  const pad = (n) => String(n).padStart(2, "0");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // --- background video ---
  const video = document.getElementById("bgVideo");
  if (site.homePoster) video.poster = src(site.homePoster);
  video.src = src(site.homeVideo);
  const show = () => video.classList.add("is-ready");
  video.addEventListener("loadeddata", show, { once: true });
  if (video.readyState >= 2) show();
  video.play().catch(() => {});           // some browsers need an explicit nudge

  // --- name + project list ---
  document.getElementById("name").textContent = site.name;
  document.getElementById("readoutName").textContent = site.name;
  document.getElementById("count").textContent = "(" + pad(projects.length) + ")";
  document.title = site.name + " — Portfolio";

  const list = document.getElementById("list");
  list.innerHTML = projects.map((p, i) => {
    const meta = [p.year, p.medium].filter(Boolean).map(esc);
    return `
      <li class="reveal" style="--i:${i + 2}">
        <a class="work" href="${p.page ? esc(p.page) : "project.html?p=" + encodeURIComponent(p.slug)}" data-i="${i}">
          <span class="work__title">${esc(p.title)}</span>
          <span class="work__meta">
            <span class="work__num">${pad(i + 1)}</span>
            ${meta.map((m) => `<span>${m}</span>`).join("")}
          </span>
        </a>
      </li>`;
  }).join("");

  document.getElementById("name").classList.add("reveal");
  document.querySelector(".stack__divider").classList.add("reveal");
  document.querySelector(".stack__divider").style.setProperty("--i", 1);

  // --- right-hand readout follows hover/focus ---
  const readout = document.getElementById("readout");
  const idle = readout.innerHTML;
  const describe = (p, i) =>
    `${pad(i + 1)} / ${esc(p.title)}<br>${[p.year, p.medium].filter(Boolean).map(esc).join(" — ") || "&nbsp;"}`;

  list.querySelectorAll(".work").forEach((el) => {
    const i = +el.dataset.i;
    const on = () => { readout.innerHTML = describe(projects[i], i); };
    el.addEventListener("mouseenter", on);
    el.addEventListener("focus", on);
  });
  list.addEventListener("mouseleave", () => { readout.innerHTML = idle; });
  list.addEventListener("focusout", (e) => {
    if (!list.contains(e.relatedTarget)) readout.innerHTML = idle;
  });
})();
