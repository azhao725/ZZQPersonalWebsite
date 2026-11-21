(function () {
  const pad = (n) => String(n).padStart(2, "0");

  // ---------- position in the project list + "next project" from data.js ----------
  const data = window.SITE_DATA;
  if (data) {
    const list = data.projects;
    const i = list.findIndex((p) => p.slug === "infanttower");
    if (i >= 0) {
      document.querySelector(".it-top span").textContent = `${pad(i + 1)} / ${pad(list.length)}`;
      const n = list[(i + 1) % list.length];
      const next = document.querySelector(".it-next");
      next.href = n.page || "project.html?p=" + encodeURIComponent(n.slug);
      next.innerHTML = "<small>Next project</small>";
      next.appendChild(document.createTextNode(n.title));
    }
  }

  // ---------- scroll reveal ----------
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !reduce) {
    document.body.classList.add("reveal-on");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
  }

  // ---------- walkthrough video (YouTube) in a modal ----------
  const modal = document.getElementById("videoModal");
  const frame = modal.querySelector(".it-modal__frame");
  let opener = null;
  function openVideo(id, from) {
    opener = from;
    frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0"
      title="Infant Tower — walkthrough" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    modal.hidden = false;
    document.documentElement.style.overflow = "hidden";
    modal.querySelector(".it-modal__close").focus();
  }
  function closeVideo() {
    modal.hidden = true;
    frame.innerHTML = "";
    document.documentElement.style.overflow = "";
    if (opener) opener.focus();
  }
  document.querySelectorAll("[data-video]").forEach((b) =>
    b.addEventListener("click", () => openVideo(b.dataset.video, b)));
  modal.querySelector(".it-modal__close").addEventListener("click", closeVideo);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeVideo(); });

  // ---------- image lightbox for every [data-zoom] ----------
  const imgs = [...document.querySelectorAll("img[data-zoom]")];
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
    cur = (k + imgs.length) % imgs.length;
    const big = document.createElement("img");
    big.src = imgs[cur].currentSrc || imgs[cur].src;
    big.alt = imgs[cur].alt;
    stage.replaceChildren(big);
    lb.querySelector(".lightbox__count").textContent = `${pad(cur + 1)} / ${pad(imgs.length)}`;
  }
  function closeLb() {
    lb.hidden = true;
    stage.replaceChildren();
    document.documentElement.style.overflow = "";
    imgs[cur].focus({ preventScroll: true });
  }
  imgs.forEach((img, k) => {
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    const open = () => { show(k); lb.hidden = false; document.documentElement.style.overflow = "hidden"; lb.querySelector(".lightbox__close").focus(); };
    img.addEventListener("click", open);
    img.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  });
  lb.querySelector(".lightbox__close").addEventListener("click", closeLb);
  lb.querySelector(".lightbox__prev").addEventListener("click", () => show(cur - 1));
  lb.querySelector(".lightbox__next").addEventListener("click", () => show(cur + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target === stage) closeLb(); });

  document.addEventListener("keydown", (e) => {
    if (!modal.hidden && e.key === "Escape") return closeVideo();
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") show(cur - 1);
    if (e.key === "ArrowRight") show(cur + 1);
  });
})();
