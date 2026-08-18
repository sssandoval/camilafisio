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
