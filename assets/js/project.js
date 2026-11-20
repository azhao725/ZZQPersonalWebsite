(function () {
  const data = window.SITE_DATA;
  if (!data) return;
  const { site, projects } = data;
  const src = (p) => "content/" + p.split("/").map(encodeURIComponent).join("/");
  const pad = (n) => String(n).padStart(2, "0");
  const $ = (id) => document.getElementById(id);

  const slug = new URLSearchParams(location.search).get("p");
  const i = projects.findIndex((p) => p.slug === slug);
  if (i < 0) { location.replace("index.html"); return; }
  const p = projects[i];

  document.title = `${p.title} — ${site.name}`;
  $("back").textContent = "← " + site.name;
  $("num").textContent = `${pad(i + 1)} / ${pad(projects.length)}`;
  if (p.layout) $("project").classList.add("layout-" + p.layout);

  // Title: a native-language title (e.g. 阳阳) takes the big slot; the English
  // title then moves into the small meta line.
  // With "titleBoth": English on the first line, the native title under it.
  const title = $("title");
  if (p.titleLocal && p.titleBoth) {
    title.classList.add("is-local", "is-both");
    const en = document.createElement("span");
    en.className = "title-en";
    en.textContent = p.title;
    const zh = document.createElement("span");
    zh.lang = "zh";
    zh.textContent = p.titleLocal;
    title.append(en, zh);
  } else if (p.titleLocal) {
    title.textContent = p.titleLocal;
    title.classList.add("is-local");
    title.lang = "zh";
  } else {
    title.textContent = p.title;
  }
  const showEnInMeta = p.titleLocal && !p.titleBoth;
  const metaText = [showEnInMeta ? p.title : null, p.year, p.medium].filter(Boolean).join(" — ");
  if (metaText) $("meta").textContent = metaText;
  else $("meta").remove();

  // Description: Chinese and/or English, line breaks kept as written in info.json
  const desc = $("desc");
  [["descriptionZh", "zh"], ["description", "en"]].forEach(([key, lang]) => {
    if (!p[key]) return;
    const para = document.createElement("p");
    para.lang = lang;
    para.textContent = p[key];
    desc.appendChild(para);
  });
  if (!desc.children.length) desc.remove();

  // Optional illustration beside the description
  const art = $("art");
  if (p.headerImage) {
    const img = document.createElement("img");
    img.src = src(`works/${p.folder}/${p.headerImage}`);
    img.alt = "";
    art.appendChild(img);
  } else {
    art.remove();
  }

  // Media
  const media = $("media");
  if (!p.media.length) {
    media.outerHTML = '<p class="project__empty">Coming soon</p>';
  }
  const isGrid = p.layout === "grid";
  const els = p.media.map((m, k) => {
    let el;
    if (m.type === "video" && isGrid) {
      // in a grid, videos behave like moving pictures: silent, looping, no controls
      el = document.createElement("video");
      Object.assign(el, { src: src(m.src), muted: true, loop: true, autoplay: true,
                          playsInline: true, preload: "metadata" });
      el.setAttribute("muted", "");
    } else if (m.type === "video") {
      el = document.createElement("video");
      Object.assign(el, { src: src(m.src), controls: true, playsInline: true, preload: "metadata" });
    } else {
      el = document.createElement("img");
      Object.assign(el, {
        src: src(m.src),
        alt: `${p.title} — ${k + 1}`,
        loading: k < 2 ? "eager" : "lazy",
        decoding: "async",
      });
      if (m.w && m.h) { el.width = m.w; el.height = m.h; }   // reserves space while loading
    }
    if (!isGrid) media.appendChild(el);
    return el;
  });

  if (isGrid && p.media.length) justifiedGrid(media, p.media, els);

  // ---------- grid: rows of 2–4 pieces that exactly fill the box width ----------
  function justifiedGrid(box, items, nodes) {
    const ratio = items.map((m) => (m.w && m.h ? m.w / m.h : 16 / 9));
    const cells = nodes.map((node, k) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "grid__cell";
      cell.setAttribute("aria-label", `Open image ${k + 1} of ${nodes.length}`);
      cell.appendChild(node);
      cell.addEventListener("click", () => openLightbox(k));
      return cell;
    });

    // Videos without recorded dimensions: correct the ratio once known, then re-lay out
    nodes.forEach((node, k) => {
      if (node.tagName === "VIDEO" && !(items[k].w && items[k].h)) {
        node.addEventListener("loadedmetadata", () => {
          ratio[k] = node.videoWidth / node.videoHeight; layout();
        }, { once: true });
      }
    });

    // Split the sequence into rows (2–4 per row) so every row's height is as
    // close as possible to the target height — dynamic programming over breaks.
    function rows(W, gap, target) {
      const n = ratio.length;
      if (n < 3) return [[0, n]];
      const best = new Array(n + 1).fill(Infinity), from = new Array(n + 1);
      best[0] = 0;
      for (let end = 2; end <= n; end++) {
        for (let k = 2; k <= 4 && k <= end; k++) {
          const start = end - k;
          if (best[start] === Infinity) continue;
          let sum = 0;
          for (let j = start; j < end; j++) sum += ratio[j];
          const h = (W - gap * (k - 1)) / sum;
          const cost = best[start] + Math.pow(Math.log(h / target), 2);
          if (cost < best[end]) { best[end] = cost; from[end] = start; }
        }
      }
      const out = [];
      for (let end = n; end > 0; end = from[end]) out.unshift([from[end], end]);
      return out;
    }

    function layout() {
      const W = box.clientWidth;
      if (!W) return;
      const gap = W < 600 ? 6 : 10;
      const target = Math.max(150, Math.min(420, W * 0.3));
      box.replaceChildren();
      rows(W, gap, target).forEach(([a, b]) => {
        let sum = 0;
        for (let j = a; j < b; j++) sum += ratio[j];
        const h = (W - gap * (b - a - 1)) / sum;
        const row = document.createElement("div");
        row.className = "grid__row";
        row.style.gap = gap + "px";
        row.style.marginBottom = gap + "px";
        for (let j = a; j < b; j++) {
          cells[j].style.width = ratio[j] * h + "px";
          cells[j].style.height = h + "px";
          row.appendChild(cells[j]);
        }
        box.appendChild(row);
      });
    }

    layout();
    let lastW = box.clientWidth;
    new ResizeObserver(() => {
      if (box.clientWidth !== lastW) { lastW = box.clientWidth; layout(); }
    }).observe(box);

    // ---------- lightbox ----------
    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.hidden = true;
    lb.innerHTML = `
      <button class="lightbox__close" type="button" aria-label="Close">Close ✕</button>
      <button class="lightbox__nav lightbox__prev" type="button" aria-label="Previous">←</button>
      <figure class="lightbox__stage"></figure>
      <button class="lightbox__nav lightbox__next" type="button" aria-label="Next">→</button>
      <p class="lightbox__count"></p>`;
    document.body.appendChild(lb);
    const stage = lb.querySelector(".lightbox__stage");
    let cur = 0;

    function show(k) {
      cur = (k + items.length) % items.length;
      const m = items[cur];
      const el = document.createElement(m.type === "video" ? "video" : "img");
      el.src = src(m.src);
      if (m.type === "video") Object.assign(el, { muted: true, loop: true, autoplay: true, controls: true, playsInline: true });
      else el.alt = `${p.title} — ${cur + 1}`;
      stage.replaceChildren(el);
      lb.querySelector(".lightbox__count").textContent = `${pad(cur + 1)} / ${pad(items.length)}`;
    }
    function openLightbox(k) {
      show(k);
      lb.hidden = false;
      document.documentElement.style.overflow = "hidden";
      lb.querySelector(".lightbox__close").focus();
    }
    function close() {
      lb.hidden = true;
      stage.replaceChildren();
      document.documentElement.style.overflow = "";
      cells[cur].focus();
    }
    lb.querySelector(".lightbox__close").addEventListener("click", close);
    lb.querySelector(".lightbox__prev").addEventListener("click", () => show(cur - 1));
    lb.querySelector(".lightbox__next").addEventListener("click", () => show(cur + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target === stage) close(); });
    document.addEventListener("keydown", (e) => {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(cur - 1);
      if (e.key === "ArrowRight") show(cur + 1);
    });
  }

  const n = projects[(i + 1) % projects.length];
  const next = $("next");
  next.href = "project.html?p=" + encodeURIComponent(n.slug);
  next.innerHTML = "<small>Next project</small>";
  next.appendChild(document.createTextNode(n.title));
})();
