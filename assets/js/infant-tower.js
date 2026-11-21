(function () {
  const pad = (n) => String(n).padStart(2, "0");

  // position in the project list + "next project", from data.js
  const data = window.SITE_DATA;
  if (data) {
    const list = data.projects;
    const i = list.findIndex((p) => p.slug === "infanttower");
    if (i >= 0) {
      document.getElementById("itNum").textContent = `${pad(i + 1)} / ${pad(list.length)}`;
      const n = list[(i + 1) % list.length];
      const next = document.querySelector(".it-next");
      next.href = n.page || "project.html?p=" + encodeURIComponent(n.slug);
      next.innerHTML = "<small>Next project</small>";
      next.appendChild(document.createTextNode(n.title));
    }
  }

  // walkthrough video (YouTube) in a modal
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
  document.addEventListener("keydown", (e) => { if (!modal.hidden && e.key === "Escape") closeVideo(); });
})();
