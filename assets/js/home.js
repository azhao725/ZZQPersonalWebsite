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
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (id) => document.getElementById(id);

  // ---------- background video ----------
  const video = $("bgVideo");
  if (site.homePoster) video.poster = src(site.homePoster);
  video.src = src(site.homeVideo);
  const show = () => video.classList.add("is-ready");
  video.addEventListener("loadeddata", show, { once: true });
  if (video.readyState >= 2) show();
  video.play().catch(() => {});

  // ---------- text decode: random glyphs settle into the real text, left to right ----------
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>_$@";
  const jobs = new WeakMap();
  function decode(el, text, dur = 650, delay = 0) {
    if (calm) { el.textContent = text; return; }
    const id = {};
    jobs.set(el, id);
    const t0 = performance.now() + delay;
    const step = (now) => {
      if (jobs.get(el) !== id) return;                       // a newer decode took over
      const k = Math.max(0, Math.min(1, (now - t0) / dur));
      const fixed = Math.floor(k * text.length);
      let out = text.slice(0, fixed);
      for (let i = fixed; i < text.length; i++) {
        out += text[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (k < 1) requestAnimationFrame(step); else el.textContent = text;
    };
    requestAnimationFrame(step);
  }

  // ---------- name + project list ----------
  $("name").textContent = site.name;
  $("readoutName").textContent = site.name;
  $("count").textContent = "(" + pad(projects.length) + ")";
  document.title = site.name + " — Portfolio";

  const list = $("list");
  list.innerHTML = projects.map((p, i) => {
    const meta = [p.year, p.medium].filter(Boolean).map(esc);
    return `
      <li class="reveal" style="--i:${i + 2}">
        <a class="work" href="${p.page ? esc(p.page) : "project.html?p=" + encodeURIComponent(p.slug)}" data-i="${i}">
          <span class="work__title" data-text="${esc(p.title)}">${esc(p.title)}</span>
          <span class="work__meta">
            <span class="work__num">${pad(i + 1)}</span>
            ${meta.map((m) => `<span>${m}</span>`).join("")}
          </span>
        </a>
      </li>`;
  }).join("");

  $("name").classList.add("reveal");
  const divider = document.querySelector(".stack__divider");
  divider.classList.add("reveal");
  divider.style.setProperty("--i", 1);

  const works = [...list.querySelectorAll(".work")];
  const titles = works.map((w) => w.querySelector(".work__title"));

  // intro: everything decodes in sequence
  decode($("name"), site.name, 900, 150);
  titles.forEach((t, i) => decode(t, projects[i].title, 700, 300 + i * 110));

  // ---------- progress rail ----------
  const stack = $("stack");
  $("railTicks").innerHTML = projects.map((_, i) => `<li data-i="${i}">${pad(i + 1)}</li>`).join("");
  const ticks = [...$("railTicks").children];

  // ---------- readout (right) + focus line ----------
  const readout = $("readout");
  const describe = (i) =>
    `${pad(i + 1)} / ${projects[i].title}\n${[projects[i].year, projects[i].medium].filter(Boolean).join(" — ") || " "}`;
  function setReadout(i) {
    if (!readout) return;
    readout.style.whiteSpace = "pre-line";
    decode(readout, describe(i), 420);
  }

  let focus = -1, hovering = -1;
  function setFocus(i) {
    if (i === focus) return;
    focus = i;
    works.forEach((w, k) => w.classList.toggle("is-focus", k === i));
    ticks.forEach((t, k) => t.classList.toggle("is-on", k === i));
    stack.classList.add("has-focus");
    decode(titles[i], projects[i].title, 380);
    decode($("focuslabel"), `${pad(i + 1)} / ${pad(projects.length)}`, 300);
    if (hovering < 0) setReadout(i);
  }

  // the focus line runs through the first project's centre when the list is at the top
  let focusY = innerHeight * 0.4;
  function placeFocusLine() {
    const r = works[0].getBoundingClientRect();
    const y = r.top + stack.scrollTop + r.height / 2;
    focusY = Math.max(innerHeight * 0.22, Math.min(innerHeight * 0.55, y));
    $("focusline").style.top = focusY + "px";
    const lastH = works[works.length - 1].getBoundingClientRect().height;
    stack.style.paddingBottom = Math.ceil(innerHeight - focusY - lastH / 2 + 2) + "px";   // last project can reach the line
  }
  function nearestToFocusLine() {
    const y = focusY;
    let best = 0, dist = Infinity;
    works.forEach((w, k) => {
      const r = w.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - y);
      if (d < dist) { dist = d; best = k; }
    });
    return best;
  }

  // ---------- scroll: progress, focus, velocity skew ----------
  let last = stack.scrollTop, skew = 0, target = 0, ticking = false;
  function onScroll() {
    const max = stack.scrollHeight - stack.clientHeight;
    const k = max > 0 ? stack.scrollTop / max : 0;
    $("railFill").style.transform = `scaleY(${k})`;
    $("railPct").textContent = String(Math.round(k * 100)).padStart(3, "0");
    setFocus(nearestToFocusLine());
    if (!calm) {
      target = Math.max(-7, Math.min(7, (stack.scrollTop - last) * 0.35));
      last = stack.scrollTop;
      if (!ticking) { ticking = true; requestAnimationFrame(settle); }
    }
  }
  function settle() {
    skew += (target - skew) * 0.18;
    target *= 0.85;                                   // velocity decays when scrolling stops
    list.style.setProperty("--skew", skew.toFixed(2) + "deg");
    if (Math.abs(skew) > 0.02 || Math.abs(target) > 0.02) requestAnimationFrame(settle);
    else { list.style.setProperty("--skew", "0deg"); ticking = false; }
  }
  stack.addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", () => { placeFocusLine(); onScroll(); });
  placeFocusLine();
  setTimeout(onScroll, 50);
  document.fonts && document.fonts.ready.then(() => { placeFocusLine(); onScroll(); });

  // ---------- hover / keyboard: glitch + readout ----------
  works.forEach((el, i) => {
    const on = () => {
      hovering = i;
      setReadout(i);
      if (!calm) {
        el.classList.remove("is-glitch"); void el.offsetWidth; el.classList.add("is-glitch");
      }
    };
    el.addEventListener("mouseenter", on);
    el.addEventListener("focus", on);
    el.addEventListener("animationend", () => el.classList.remove("is-glitch"));
  });
  const leave = () => { hovering = -1; if (focus >= 0) setReadout(focus); };
  list.addEventListener("mouseleave", leave);
  list.addEventListener("focusout", (e) => { if (!list.contains(e.relatedTarget)) leave(); });

  // clicking a rail number scrolls that project to the focus line
  ticks.forEach((t, i) => t.addEventListener("click", () => {
    const r = works[i].getBoundingClientRect();
    stack.scrollBy({ top: r.top + r.height / 2 - focusY, behavior: calm ? "auto" : "smooth" });
  }));
})();
