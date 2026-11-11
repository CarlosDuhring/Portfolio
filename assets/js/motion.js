/* Movimento: reveal no scroll (com variações e stagger), parallax do retrato
   e um brilho que segue o cursor.

   O reveal usa medição direta de posição (sem IntersectionObserver) para
   funcionar igual em qualquer navegador. */

(() => {
  "use strict";

  const items = Array.from(document.querySelectorAll(".reveal"));

  items.forEach((el) => {
    const parent = el.parentElement;
    if (!parent) return;

    const step = parseFloat(parent.dataset.stagger || "0");
    if (step > 0) {
      const index = Array.from(parent.children).indexOf(el);
      el.style.setProperty("--d", `${Math.min(index, 8) * step}s`);
    }
  });

  let lastCheck = 0;

  function check(force) {
    const now = performance.now();
    if (!force && now - lastCheck < 60) return;
    lastCheck = now;

    const limit = window.innerHeight - 80;

    for (const el of items) {
      if (el.classList.contains("is-visible")) continue;

      const rect = el.getBoundingClientRect();
      if (rect.top > limit) continue;

      el.classList.add("is-visible");
    }
  }

  window.addEventListener("scroll", () => check(false), { passive: true });
  window.addEventListener("resize", () => check(true), { passive: true });
  window.addEventListener("load", () => check(true));
  document.addEventListener("DOMContentLoaded", () => check(true));

  check(true);

  /* rede de segurança: garante o reveal mesmo se algum evento falhar */
  setInterval(() => check(true), 500);

  /* Parallax: o retrato desce e some conforme o hero sai da tela */
  const hero = document.querySelector(".hero");
  const art = document.querySelector(".hero__art");

  if (hero && art) {
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

  /* Brilho que acompanha o cursor */
  const glow = document.getElementById("cursorGlow");

  if (glow) {
    let shown = false;

    window.addEventListener(
      "pointermove",
      (event) => {
        glow.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;

        if (!shown) {
          glow.style.opacity = "1";
          shown = true;
        }
      },
      { passive: true }
    );

    document.addEventListener("mouseleave", () => {
      glow.style.opacity = "0";
      shown = false;
    });
  }
})();
