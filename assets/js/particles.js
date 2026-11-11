/* Fundo animado: partículas lilás que se movem devagar e se conectam.
   Canvas puro, sem dependências. Pausa com a aba em segundo plano. */

(() => {
  "use strict";

  const canvas = document.getElementById("bgCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const LINK = 140;

  let width = 0;
  let height = 0;
  let dots = [];
  let raf = null;
  let resizeTimer = null;

  function build() {
    const total = Math.min(90, Math.max(24, Math.round((width * height) / 26000)));

    dots = Array.from({ length: total }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      r: 1 + Math.random() * 1.7,
      a: 0.2 + Math.random() * 0.32,
    }));
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    build();
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < dots.length; i++) {
      const a = dots[i];
      for (let j = i + 1; j < dots.length; j++) {
        const b = dots[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 > LINK * LINK) continue;

        const dist = Math.sqrt(dist2);
        ctx.strokeStyle = `rgba(139, 92, 246, ${((1 - dist / LINK) * 0.15).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    dots.forEach((dot) => {
      ctx.beginPath();
      ctx.fillStyle = `rgba(124, 58, 237, ${dot.a.toFixed(3)})`;
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function step() {
    for (const dot of dots) {
      dot.x += dot.vx;
      dot.y += dot.vy;
      if (dot.x < -30) dot.x = width + 30;
      if (dot.x > width + 30) dot.x = -30;
      if (dot.y < -30) dot.y = height + 30;
      if (dot.y > height + 30) dot.y = -30;
    }

    draw();
    raf = requestAnimationFrame(step);
  }

  function start() {
    if (raf || reduceMotion) return;
    raf = requestAnimationFrame(step);
  }

  function stop() {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = null;
  }

  resize();
  start();

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      stop();
      resize();
      start();
    }, 180);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
})();
