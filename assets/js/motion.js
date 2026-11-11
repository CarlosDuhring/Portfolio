/* Movimento: reveal no scroll (com variações e stagger) e parallax do retrato. */

(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const items = Array.from(document.querySelectorAll(".reveal"));

  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -100px 0px", threshold: 0.1 }
    );

    items.forEach((el) => {
      const parent = el.parentElement;
      if (parent) {
        const step = parseFloat(parent.dataset.stagger || "0");
        if (step > 0) {
          const index = Array.from(parent.children).indexOf(el);
          el.style.setProperty("--d", `${Math.min(index, 8) * step}s`);
        }
      }
      observer.observe(el);
    });
  }

  /* Parallax: o retrato desce e some conforme o hero sai da tela */
  const hero = document.querySelector(".hero");
  const art = document.querySelector(".hero__art");

  if (hero && art && !reduceMotion) {
    let ticking = false;

    const update = () => {
      const rect = hero.getBoundingClientRect();
      const progress = Math.min(Math.max(-rect.top / (rect.height || 1), 0), 1);

      art.style.transform = `translate3d(0, ${(progress * 16).toFixed(2)}%, 0)`;
      art.style.opacity = Math.max(1 - progress / 0.85, 0).toFixed(3);
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      },
      { passive: true }
    );

    update();
  }
})();
