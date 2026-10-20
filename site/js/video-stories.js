(() => {
  const track = document.getElementById("video-stories-track");
  const dialog = document.getElementById("video-story-dialog");
  if (!track || !dialog) return;

  const originalCards = [...track.querySelectorAll(".video-story")];
  originalCards.forEach((card) => {
    const copy = card.cloneNode(true);
    copy.setAttribute("aria-hidden", "true");
    copy.querySelectorAll("button").forEach((button) => { button.tabIndex = -1; });
    track.appendChild(copy);
  });

  // One full set, including the gap after it, is exactly half of the track.
  function setConstantSpeed() {
    const loopWidth = track.getBoundingClientRect().width / 2;
    track.style.setProperty("--story-duration", `${loopWidth / 28}s`);
  }
  setConstantSpeed();
  track.classList.add("is-ready");
  window.addEventListener("resize", setConstantSpeed);

  const player = dialog.querySelector("video");
  const title = dialog.querySelector("#video-story-dialog-title");
  const close = dialog.querySelector(".video-story-dialog__close");
  let trigger;

  track.addEventListener("click", (event) => {
    const button = event.target.closest(".video-story__play");
    if (!button) return;

    const card = button.closest(".video-story");
    const preview = card.querySelector("video");
    const name = card.querySelector(".video-story__identity strong").textContent;
    const business = card.querySelector(".video-story__identity span").textContent;
    trigger = button;
    title.textContent = `${name} — ${business}`;
    player.poster = preview.poster;
    player.src = preview.querySelector("source").src;
    dialog.showModal();
    player.play().catch(() => {});
  });

  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    player.pause();
    player.removeAttribute("src");
    player.load();
    trigger?.focus({ preventScroll: true });
  });
})();
