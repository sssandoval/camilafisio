/*
 * Interações do site — vanilla JS, sem dependências externas.
 * Módulos: menu mobile, header ao rolar, scroll-reveal, lightbox da galeria,
 * ano dinâmico no rodapé.
 */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -----------------------------------------------------------------
   * Ano dinâmico no rodapé
   * --------------------------------------------------------------- */
  var anoEl = document.getElementById("ano-atual");
  if (anoEl) anoEl.textContent = String(new Date().getFullYear());

  /* -----------------------------------------------------------------
   * Header: sombra ao rolar
   * --------------------------------------------------------------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScrollHeader = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScrollHeader();
    window.addEventListener("scroll", onScrollHeader, { passive: true });
  }

  /* -----------------------------------------------------------------
   * Menu mobile
   * --------------------------------------------------------------- */
  var navToggle = document.querySelector(".nav-toggle");
  var navLinks = document.getElementById("menu-principal");

  function closeMenu() {
    if (!navToggle || !navLinks) return;
    navToggle.setAttribute("aria-expanded", "false");
    navLinks.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  function openMenu() {
    if (!navToggle || !navLinks) return;
    navToggle.setAttribute("aria-expanded", "true");
    navLinks.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var isOpen = navToggle.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  /* -----------------------------------------------------------------
   * Hero Spotlight — glow radial que segue suavemente o cursor
   * sobre a seção hero (posição em --spot-x / --spot-y, ver CSS).
   * --------------------------------------------------------------- */
  (function initHeroSpotlight() {
    var hero = document.querySelector(".hero");
    if (!hero) return;
    if (prefersReducedMotion) return;
    if (window.matchMedia("(hover: none)").matches) return;

    var target = { sx: 62, sy: 32 };
    var current = { sx: 62, sy: 32 };
    var rafId = null;

    function closeEnough(a, b) { return Math.abs(a - b) < 0.01; }

    function render() {
      current.sx += (target.sx - current.sx) * 0.12;
      current.sy += (target.sy - current.sy) * 0.12;

      hero.style.setProperty("--spot-x", current.sx.toFixed(1) + "%");
      hero.style.setProperty("--spot-y", current.sy.toFixed(1) + "%");

      var settled = closeEnough(current.sx, target.sx) && closeEnough(current.sy, target.sy);
      rafId = settled ? null : requestAnimationFrame(render);
    }

    function schedule() {
      if (!rafId) rafId = requestAnimationFrame(render);
    }

    function onMove(e) {
      var rect = hero.getBoundingClientRect();
      var relX = Math.max(-0.5, Math.min(0.5, (e.clientX - rect.left) / rect.width - 0.5));
      var relY = Math.max(-0.5, Math.min(0.5, (e.clientY - rect.top) / rect.height - 0.5));

      target.sx = (relX + 0.5) * 100;
      target.sy = (relY + 0.5) * 100;
      schedule();
    }

    function onLeave() {
      target.sx = 62;
      target.sy = 32;
      schedule();
    }

    hero.addEventListener("mousemove", onMove);
    hero.addEventListener("mouseleave", onLeave);
  })();

  /* -----------------------------------------------------------------
   * Blur Text — título da hero surge palavra por palavra, do desfoque
   * e opacidade zero até nítido no lugar (inspirado no componente
   * "Blur Text" da lib React Bits, recriado em JS puro sem React).
   * --------------------------------------------------------------- */
  (function initBlurText() {
    var heading = document.querySelector(".hero-content h1");
    if (!heading) return;
    if (prefersReducedMotion) return;

    var nodes = Array.prototype.slice.call(heading.childNodes);
    var frag = document.createDocumentFragment();

    function appendWords(text, target) {
      var parts = text.split(/(\s+)/);
      parts.forEach(function (part) {
        if (part === "") return;
        if (/^\s+$/.test(part)) {
          target.appendChild(document.createTextNode(part));
        } else {
          var span = document.createElement("span");
          span.className = "blur-word";
          span.textContent = part;
          target.appendChild(span);
        }
      });
    }

    nodes.forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        appendWords(node.textContent, frag);
      } else if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains("accent")) {
        node.classList.add("blur-word");
        frag.appendChild(node);
      } else {
        frag.appendChild(node);
      }
    });

    heading.innerHTML = "";
    heading.appendChild(frag);

    var words = heading.querySelectorAll(".blur-word");
    words.forEach(function (word, i) {
      word.style.transitionDelay = (i * 45) + "ms";
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        heading.classList.add("is-blur-in");
      });
    });
  })();

  /* -----------------------------------------------------------------
   * Scroll-reveal (IntersectionObserver)
   * --------------------------------------------------------------- */
  var revealTargets = document.querySelectorAll(
    ".specialty-card, .diff-item, .testimonial-card, .gallery-item, .about-media, .about-content, .contact-card"
  );

  if (!prefersReducedMotion && "IntersectionObserver" in window && revealTargets.length) {
    revealTargets.forEach(function (el) { el.setAttribute("data-reveal", ""); });

    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  }

  /* -----------------------------------------------------------------
   * Lightbox da galeria de trabalhos
   * --------------------------------------------------------------- */
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
  var lightbox = document.getElementById("lightbox");
  var lightboxImage = document.getElementById("lightbox-image");
  var lightboxCaption = document.getElementById("lightbox-caption");
  var lightboxClose = document.getElementById("lightbox-close");
  var lightboxPrev = document.getElementById("lightbox-prev");
  var lightboxNext = document.getElementById("lightbox-next");
  var currentIndex = 0;
  var lastFocusedEl = null;

  function renderLightbox(index) {
    if (!galleryItems.length) return;
    currentIndex = (index + galleryItems.length) % galleryItems.length;
    var item = galleryItems[currentIndex];
    var caption = item.querySelector(".gallery-caption");
    var sourceImg = item.querySelector("img");

    lightboxImage.classList.add("is-loading");
    lightboxImage.innerHTML = "";

    if (sourceImg) {
      var img = document.createElement("img");
      img.alt = sourceImg.alt || "";
      img.decoding = "async";
      img.addEventListener(
        "load",
        function () { lightboxImage.classList.remove("is-loading"); },
        { once: true }
      );
      img.src = sourceImg.currentSrc || sourceImg.src;
      lightboxImage.appendChild(img);
    }

    lightboxCaption.textContent = caption ? caption.textContent : "";
  }

  function openLightbox(index) {
    if (!lightbox) return;
    lastFocusedEl = document.activeElement;
    renderLightbox(index);
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
    lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  galleryItems.forEach(function (item, index) {
    item.addEventListener("click", function () { openLightbox(index); });
  });

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener("click", function () { renderLightbox(currentIndex - 1); });
  if (lightboxNext) lightboxNext.addEventListener("click", function () { renderLightbox(currentIndex + 1); });

  if (lightbox) {
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") renderLightbox(currentIndex - 1);
      if (e.key === "ArrowRight") renderLightbox(currentIndex + 1);
    });
  }

})();
