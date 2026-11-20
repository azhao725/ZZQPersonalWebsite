(function () {
  const data = window.SITE_DATA;
  if (!data) return;
  const { site, projects } = data;
  const src = (p) => "content/" + p.split("/").map(encodeURIComponent).join("/");
  const pad = (n) => String(n).padStart(2, "0");

  const slug = new URLSearchParams(location.search).get("p");
  const i = projects.findIndex((p) => p.slug === slug);
  if (i < 0) { location.replace("index.html"); return; }
  const p = projects[i];

  document.title = `${p.title} — ${site.name}`;
  document.getElementById("back").textContent = "← " + site.name;
  document.getElementById("num").textContent = `${pad(i + 1)} / ${pad(projects.length)}`;
  document.getElementById("title").textContent = p.title;
  document.getElementById("meta").textContent =
    [p.year, p.medium].filter(Boolean).join(" — ") || " ";

  const media = document.getElementById("media");
  if (!p.media.length) {
    media.outerHTML = '<p class="project__empty">Coming soon</p>';
  }
  p.media.forEach((m) => {
    let el;
    if (m.type === "video") {
      el = document.createElement("video");
      Object.assign(el, { src: src(m.src), controls: true, playsInline: true, preload: "metadata" });
    } else {
      el = document.createElement("img");
      Object.assign(el, { src: src(m.src), alt: p.title, loading: "lazy", decoding: "async" });
    }
    media.appendChild(el);
  });

  const n = projects[(i + 1) % projects.length];
  const next = document.getElementById("next");
  next.href = "project.html?p=" + encodeURIComponent(n.slug);
  next.innerHTML = "<small>Next project</small>";
  next.appendChild(document.createTextNode(n.title));
})();
