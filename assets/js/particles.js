/* Fundo interativo: partículas lilás que se movem, se conectam e reagem ao mouse.
   Canvas puro, sem dependências. Pausa com a aba em segundo plano. */

(() => {
  "use strict";

  const canvas = document.getElementById("bgCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const LINK = 150;
  const CURSOR_LINK = 170;
  const CURSOR_PUSH = 120;

  let width = 0;
  let height = 0;
  let dots = [];
  let raf = null;
  let resizeTimer = null;

  const pointer = { x: -9999, y: -9999, active: false };

  function build() {
    const total = Math.min(110, Math.max(34, Math.round((width * height) / 20000)));

    dots = Array.from({ length: total }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.34,
      vy: (Math.random() - 0.5) * 0.34,
      r: 1.2 + Math.random() * 1.9,
      a: 0.22 + Math.random() * 0.36,
      hue: Math.random() < 0.28 ? 268 : 259,
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
        ctx.strokeStyle = `rgba(139, 92, 246, ${((1 - dist / LINK) * 0.16).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      if (pointer.active) {
        const dx = a.x - pointer.x;
        const dy = a.y - pointer.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < CURSOR_LINK * CURSOR_LINK) {
          const dist = Math.sqrt(dist2);
          ctx.strokeStyle = `rgba(124, 58, 237, ${((1 - dist / CURSOR_LINK) * 0.4).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }
    }

    dots.forEach((dot) => {
      const glow = pointer.active
        ? Math.max(0, 1 - Math.hypot(dot.x - pointer.x, dot.y - pointer.y) / 220)
        : 0;

      ctx.beginPath();
      ctx.fillStyle = `hsla(${dot.hue}, 82%, ${52 - glow * 8}%, ${(dot.a + glow * 0.3).toFixed(3)})`;
      ctx.arc(dot.x, dot.y, dot.r + glow * 1.6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function step() {
    for (const dot of dots) {
      dot.x += dot.vx;
      dot.y += dot.vy;

      if (pointer.active) {
        const dx = dot.x - pointer.x;
        const dy = dot.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < CURSOR_PUSH && dist > 0.001) {
          const force = ((1 - dist / CURSOR_PUSH) * 1.4) / dist;
          dot.x += dx * force;
          dot.y += dy * force;
        }
      }

      if (dot.x < -30) dot.x = width + 30;
      if (dot.x > width + 30) dot.x = -30;
      if (dot.y < -30) dot.y = height + 30;
      if (dot.y > height + 30) dot.y = -30;
    }

    draw();
    raf = requestAnimationFrame(step);
  }

  function start() {
    if (raf) return;
    raf = requestAnimationFrame(step);
  }

  function stop() {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = null;
  }

  window.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    },
    { passive: true }
  );

  window.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  document.addEventListener("mouseleave", () => {
    pointer.active = false;
  });

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
