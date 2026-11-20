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
  const title = $("title");
  if (p.titleLocal) {
    title.textContent = p.titleLocal;
    title.classList.add("is-local");
    title.lang = "zh";
  } else {
    title.textContent = p.title;
  }
  $("meta").textContent =
    [p.titleLocal ? p.title : null, p.year, p.medium].filter(Boolean).join(" — ") || " ";

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
  p.media.forEach((m, k) => {
    let el;
    if (m.type === "video") {
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
    }
    media.appendChild(el);
  });

  const n = projects[(i + 1) % projects.length];
  const next = $("next");
  next.href = "project.html?p=" + encodeURIComponent(n.slug);
  next.innerHTML = "<small>Next project</small>";
  next.appendChild(document.createTextNode(n.title));
})();
