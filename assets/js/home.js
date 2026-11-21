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

  // --- scroll motion: while scrolling, lines trail the scroll a little (lower lines more,
  //     so the stack stretches like a spring) and lean with the speed; at rest nothing changes ---
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const stack = document.getElementById("stack");
    const lines = [document.getElementById("name"), document.querySelector(".stack__divider"), ...list.children];
    // the load-in animation holds its own transform; release it once it has played
    lines.forEach((el) => el.addEventListener("animationend", () => el.classList.remove("reveal"), { once: true }));

    let current = stack.scrollTop, running = false;
    const frame = () => {
      const target = stack.scrollTop;
      current += (target - current) * 0.085;
      const diff = target - current;                       // how far the motion is behind the scroll
      if (Math.abs(diff) < 0.15) {
        current = target;
        lines.forEach((el) => { el.style.transform = ""; });
        running = false;
        return;
      }
      const lean = Math.max(-8, Math.min(8, diff * 0.06));
      lines.forEach((el, i) => {
        if (el.classList.contains("reveal")) return;       // still playing its load-in
        el.style.transform = `translate3d(0, ${(diff * (0.2 + i * 0.07)).toFixed(2)}px, 0) skewY(${lean.toFixed(2)}deg)`;
      });
      requestAnimationFrame(frame);
    };
    stack.addEventListener("scroll", () => {
      if (!running) { running = true; requestAnimationFrame(frame); }
    }, { passive: true });
  }
  list.addEventListener("focusout", (e) => {
    if (!list.contains(e.relatedTarget)) readout.innerHTML = idle;
  });
})();
