(() => {
  const section = document.querySelector(".evidence");
  const grid = section && section.querySelector(".evidence__grid");
  const values = grid ? [...grid.querySelectorAll(".evidence__value")] : [];
  if (!values.length) return;
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const duration = 1400;
  const stats = values.map(el => {
    const original = el.textContent.trim();
    const parts = original.match(/^(\+)?([\d,]+)(.*)$/);
    if (!parts) return { el, original };
    return {
      el,
      original,
      prefix: parts[1] || "",
      end: Number(parts[2].replace(/,/g, "")),
      suffix: parts[3] || "",
      commas: parts[2].includes(",")
    };
  });

  const format = (stat, value) => {
    const rounded = Math.max(0, Math.min(stat.end, Math.round(value)));
    const digits = stat.commas ? rounded.toLocaleString("en-US") : String(rounded);
    return `${stat.prefix}${digits}${stat.suffix}`;
  };

  const easeOut = t => 1 - Math.pow(1 - t, 3);

  stats.forEach(stat => {
    if (typeof stat.end === "number" && !Number.isNaN(stat.end)) {
      stat.el.textContent = format(stat, 0);
    }
  });

  let played = false;
  const animate = () => {
    const start = performance.now();
    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      stats.forEach(stat => {
        if (typeof stat.end !== "number" || Number.isNaN(stat.end)) return;
        stat.el.textContent = progress === 1 ? stat.original : format(stat, stat.end * easeOut(progress));
      });
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(entries => {
    if (played || !entries.some(entry => entry.isIntersecting)) return;
    played = true;
    observer.disconnect();
    animate();
  }, { threshold: 0.25 });

  observer.observe(grid);
})();
