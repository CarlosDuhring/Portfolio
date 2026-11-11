/* Comportamentos do portfólio: idioma, efeito de digitação, reveal no scroll,
   navegação ativa, menu mobile e cópia de e-mail. */

(() => {
  "use strict";

  const dict = window.I18N;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Idioma ---------------- */
  const STORAGE_KEY = "cd-lang";
  let lang = "pt";

  const stored = (() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return null;
    }
  })();
  if (stored && dict[stored]) lang = stored;

  const typedEl = $("#typed");
  const langBtn = $("#langToggle");
  const menuBtn = $("#menuBtn");
  let menuOpen = false;

  let typeTimer = null;

  function stopTyping() {
    if (typeTimer) {
      clearTimeout(typeTimer);
      typeTimer = null;
    }
  }

  function startTyping(phrases) {
    stopTyping();
    if (!typedEl || !phrases || !phrases.length) return;

    if (reduceMotion) {
      typedEl.textContent = phrases[0];
      return;
    }

    let phrase = 0;
    let chars = 0;
    let deleting = false;

    const tick = () => {
      const word = phrases[phrase];

      if (!deleting) {
        chars += 1;
        typedEl.textContent = word.slice(0, chars);
        if (chars >= word.length) {
          deleting = true;
          typeTimer = setTimeout(tick, 2000);
          return;
        }
        typeTimer = setTimeout(tick, 52);
      } else {
        chars -= 1;
        typedEl.textContent = word.slice(0, chars);
        if (chars <= 0) {
          deleting = false;
          phrase = (phrase + 1) % phrases.length;
          typeTimer = setTimeout(tick, 340);
          return;
        }
        typeTimer = setTimeout(tick, 26);
      }
    };

    tick();
  }

  function applyLang(next) {
    lang = dict[next] ? next : "pt";
    const d = dict[lang];

    document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
    document.title = d["meta.title"];

    const metaDesc = $('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", d["meta.desc"]);

    $$("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      if (d[key] != null) el.textContent = d[key];
    });

    $$("[data-lang-opt]").forEach((el) => {
      el.classList.toggle("is-on", el.dataset.langOpt === lang);
    });

    if (langBtn) {
      langBtn.setAttribute("aria-label", d["a11y.lang"]);
      langBtn.setAttribute("title", d["a11y.lang"]);
    }
    if (menuBtn) {
      menuBtn.setAttribute("aria-label", menuOpen ? d["a11y.menuClose"] : d["a11y.menuOpen"]);
    }

    startTyping(d.typing);

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (err) {
      /* modo privado */
    }
  }

  if (langBtn) {
    langBtn.addEventListener("click", () => applyLang(lang === "pt" ? "en" : "pt"));
  }

  /* ---------------- Menu mobile ---------------- */
  const nav = $("#nav");

  function setMenu(open) {
    menuOpen = open;
    if (nav) nav.classList.toggle("is-open", open);
    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", dict[lang][open ? "a11y.menuClose" : "a11y.menuOpen"]);
    }
    document.body.style.overflow = open ? "hidden" : "";
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", () => setMenu(!menuOpen));
  }

  if (nav) {
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a") && menuOpen) setMenu(false);
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuOpen) setMenu(false);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860 && menuOpen) setMenu(false);
  });

  /* ---------------- Header + progresso ---------------- */
  const header = $("#header");
  const progress = $("#scrollProgress");

  function onScroll() {
    const y = window.scrollY || 0;

    if (header) header.classList.toggle("is-scrolled", y > 8);

    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------- Nav ativa ---------------- */
  const navLinks = $$(".nav__link");
  const sections = $$("main section[id]");

  if ("IntersectionObserver" in window && navLinks.length && sections.length) {
    const byId = new Map();
    navLinks.forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (href.startsWith("#")) byId.set(href.slice(1), link);
    });

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => link.classList.remove("is-active"));
          const active = byId.get(entry.target.id);
          if (active) active.classList.add("is-active");
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    sections.forEach((section) => {
      if (byId.has(section.id)) sectionObserver.observe(section);
    });
  }

  /* ---------------- Copiar e-mail ---------------- */
  const copyBtn = $("#copyEmail");
  const toast = $("#toast");
  let toastTimer = null;

  function showToast() {
    if (!toast) return;
    toast.classList.add("is-visible");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const value = copyBtn.dataset.copy || "";

      try {
        await navigator.clipboard.writeText(value);
      } catch (err) {
        const field = document.createElement("textarea");
        field.value = value;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.top = "-1000px";
        document.body.appendChild(field);
        field.select();
        try {
          document.execCommand("copy");
        } catch (e) {
          /* ignora */
        }
        field.remove();
      }

      showToast();
    });
  }

  /* ---------------- Ano no rodapé ---------------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------------- Init ---------------- */
  applyLang(lang);
})();
