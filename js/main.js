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
   * Barra de progresso de leitura + sombra do header ao rolar.
   * Vanilla JS (sem depender do GSAP) para funcionar sempre, em PC e
   * mobile, mesmo se os scripts do GSAP falharem ao carregar.
   * Os dois efeitos escutam o mesmo evento "scroll", então são
   * atualizados juntos num único rAF por frame em vez de dois
   * listeners/leituras de scrollY independentes.
   * --------------------------------------------------------------- */
  (function initScrollEffects() {
    var bar = document.getElementById("scroll-progress-bar");
    var header = document.querySelector(".site-header");
    if (!bar && !header) return;
    var ticking = false;

    function update() {
      ticking = false;
      if (bar) {
        var scrollable = document.documentElement.scrollHeight - window.innerHeight;
        var pct = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
        bar.style.transform = "scaleX(" + pct.toFixed(4) + ")";
      }
      if (header) {
        header.classList.toggle("is-scrolled", window.scrollY > 8);
      }
    }

    update();
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    window.addEventListener("resize", update);
  })();

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

    hero.addEventListener("mousemove", onMove, { passive: true });
    hero.addEventListener("mouseleave", onLeave, { passive: true });
  })();

  /* -----------------------------------------------------------------
   * Pausa as animações CSS contínuas (badge, blob, foto, pulso do
   * WhatsApp) quando a aba fica em segundo plano, para não gastar
   * CPU/GPU com algo que não está sendo visto. Não afeta a aparência
   * enquanto a aba está visível.
   * --------------------------------------------------------------- */
  (function initPauseWhenHidden() {
    if (prefersReducedMotion) return;
    function apply() {
      document.body.classList.toggle("tab-hidden", document.hidden);
    }
    document.addEventListener("visibilitychange", apply);
    apply();
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
      } else if (
        node.nodeType === Node.ELEMENT_NODE &&
        (node.classList.contains("accent") || node.classList.contains("rotating-text"))
      ) {
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
   * Rotating Text — percorre a sequência de palavras no título da hero
   * (melhorar -> evoluir -> recuperar) uma única vez, ao carregar a
   * página, e para na última palavra da sequência. Troca letra por
   * letra em onda escalonada para uma transição mais fluida, inspirado
   * no componente "Rotating Text" da lib React Bits, recriado em JS
   * puro sem React.
   * --------------------------------------------------------------- */
  (function initRotatingText() {
    var containers = Array.prototype.slice.call(
      document.querySelectorAll(".rotating-text[data-rotating-words]")
    );
    if (!containers.length) return;

    var CHAR_STAGGER = 22; // ms entre o início da animação de cada letra
    var TRANSFORM_DURATION = 620; // deve casar com a transition do CSS
    var HOLD_DURATION = 1600; // ms que cada palavra fica visível antes de trocar

    containers.forEach(function (container) {
      var sequence = container
        .getAttribute("data-rotating-words")
        .split(",")
        .map(function (w) { return w.trim(); })
        .filter(Boolean);
      if (sequence.length < 2) return;

      var wordEl = container.querySelector(".rotating-text-word");
      if (!wordEl) return;

      function buildChars(text) {
        wordEl.innerHTML = "";
        return text.split("").map(function (ch, i) {
          var span = document.createElement("span");
          span.className = "rotating-text-char";
          span.textContent = ch === " " ? " " : ch;
          span.style.transitionDelay = (i * CHAR_STAGGER) + "ms";
          wordEl.appendChild(span);
          return span;
        });
      }

      var index = 0; // posição atual dentro de sequence
      var lastIndex = sequence.length - 1;
      var chars = buildChars(sequence[0]);

      function step() {
        if (index >= lastIndex) return; // já chegou na última palavra: fica parado nela
        var next = sequence[index + 1];

        chars.forEach(function (c, i) {
          c.style.transitionDelay = (i * CHAR_STAGGER) + "ms";
          c.classList.add("is-leaving");
        });

        var leaveDuration = (chars.length - 1) * CHAR_STAGGER + TRANSFORM_DURATION;

        window.setTimeout(function () {
          chars = buildChars(next);
          // Salta para a posição de entrada sem transição, força reflow
          // e só então reativa a transição — evita que o navegador anime
          // direto do estado "saindo" para o "entrando" (ver initBlurText
          // para o mesmo padrão de dupla animação por rAF).
          chars.forEach(function (c) {
            c.style.transition = "none";
            c.classList.add("is-entering");
          });
          void wordEl.offsetHeight;
          chars.forEach(function (c, i) {
            c.style.transition = "";
            c.style.transitionDelay = (i * CHAR_STAGGER) + "ms";
          });

          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              chars.forEach(function (c) { c.classList.remove("is-entering"); });
            });
          });

          index++;
          if (index < lastIndex) window.setTimeout(step, HOLD_DURATION);
        }, leaveDuration);
      }

      window.setTimeout(step, HOLD_DURATION);
    });
  })();

  /* -----------------------------------------------------------------
   * Cards flutuantes da hero — remove a animação de entrada assim que
   * ela termina. Com animation-fill-mode: both o navegador continua
   * segurando o `transform` com prioridade de animação para sempre,
   * o que travava/deixava bugada a transição do :hover (mais visível
   * no Chrome). Sem a animação ativa, a transição de hover volta a
   * funcionar normalmente.
   * --------------------------------------------------------------- */
  document.querySelectorAll(".hero-float-card").forEach(function (card) {
    card.addEventListener(
      "animationend",
      function (e) {
        if (e.animationName === "hero-card-in") card.classList.add("is-settled");
      },
      { once: true }
    );
  });

  /* -----------------------------------------------------------------
   * Magnet Cards — os 3 cards flutuantes da hero são levemente
   * atraídos em direção ao cursor quando ele passa perto, e voltam à
   * posição original quando o cursor se afasta, inspirado no
   * componente "Magnet" da lib React Bits, recriado em JS puro sem
   * React. A força é aplicada via custom properties
   * (--magnet-x/--magnet-y), lidas pelo CSS em .hero-float-card, para
   * não conflitar com a transição de :hover nem com a animação de
   * entrada dos cards.
   * --------------------------------------------------------------- */
  (function initMagnetHeroCards() {
    var hero = document.querySelector(".hero");
    var cards = Array.prototype.slice.call(document.querySelectorAll(".hero-float-card"));
    if (!hero || !cards.length) return;
    if (prefersReducedMotion) return;
    if (window.matchMedia("(hover: none)").matches) return;

    var PAD = 60; // px de raio extra ao redor do card que já reage ao cursor
    var MAX_PULL = 16; // px de deslocamento máximo
    var STRENGTH = 0.4; // fração da distância convertida em deslocamento

    var ticking = false;
    var lastEvent = null;

    function resetCard(card) {
      card.style.setProperty("--magnet-x", "0px");
      card.style.setProperty("--magnet-y", "0px");
    }

    function update() {
      ticking = false;
      if (!lastEvent) return;

      cards.forEach(function (card) {
        var rect = card.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = lastEvent.clientX - cx;
        var dy = lastEvent.clientY - cy;
        var reachX = rect.width / 2 + PAD;
        var reachY = rect.height / 2 + PAD;

        if (Math.abs(dx) < reachX && Math.abs(dy) < reachY) {
          var x = Math.max(-MAX_PULL, Math.min(MAX_PULL, dx * STRENGTH));
          var y = Math.max(-MAX_PULL, Math.min(MAX_PULL, dy * STRENGTH));
          card.style.setProperty("--magnet-x", x.toFixed(2) + "px");
          card.style.setProperty("--magnet-y", y.toFixed(2) + "px");
        } else {
          resetCard(card);
        }
      });
    }

    hero.addEventListener(
      "mousemove",
      function (e) {
        lastEvent = e;
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );

    hero.addEventListener("mouseleave", function () {
      lastEvent = null;
      cards.forEach(resetCard);
    });
  })();

  /* -----------------------------------------------------------------
   * Scroll animations — GSAP + ScrollTrigger.
   * Revela as seções em cascata (stagger) ao entrarem na tela e aplica
   * um parallax sutil na foto do hero durante a rolagem. Os alvos do
   * reveal (cards, itens, mídia) não têm nenhuma animação CSS própria
   * competindo por `transform`, então o GSAP pode controlá-los direto
   * via inline style sem o bug de prioridade descrito nos comentários
   * de .hero-float-card acima. Sem GSAP/ScrollTrigger disponíveis (ex.:
   * falha de carregamento) ou com prefers-reduced-motion, cai para o
   * reveal simples via IntersectionObserver, sem parallax.
   * --------------------------------------------------------------- */
  var hasGsapScroll = !prefersReducedMotion && window.gsap && window.ScrollTrigger;

  if (hasGsapScroll) {
    gsap.registerPlugin(ScrollTrigger);

    // .specialty-card, .contact-card e .gallery-item img já têm sua própria
    // `transition: transform ...` em CSS (para o :hover). Se o GSAP anima o
    // mesmo `transform` por cima com essa transition ainda ativa, o CSS
    // tenta "correr atrás" de cada frame do tween e o movimento fica
    // pastoso. Por isso ela é suspensa só durante o tween de entrada e
    // devolvida ao elemento logo depois (mesma ideia do ajuste já feito
    // para .hero-float-card, ver comentário acima).
    function suspendCssTransition(els) {
      els.forEach(function (el) { el.style.transition = "none"; });
    }
    function restoreCssTransition(els) {
      els.forEach(function (el) { el.style.removeProperty("transition"); });
    }

    var staggerGroups = [
      ".specialty-grid .specialty-card",
      ".gallery-grid .gallery-item",
      ".diff-grid .diff-item",
      ".testimonial-grid .testimonial-card",
    ];
    var singleReveals = [".about-media", ".about-content", ".contact-card"];

    staggerGroups.forEach(function (selector) {
      var items = gsap.utils.toArray(selector);
      if (!items.length) return;
      gsap.set(items, { autoAlpha: 0, y: 32 });
      ScrollTrigger.batch(items, {
        start: "top 88%",
        once: true,
        onEnter: function (batch) {
          suspendCssTransition(batch);
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.12,
            onComplete: function () { restoreCssTransition(batch); },
          });
        },
      });
    });

    singleReveals.forEach(function (selector) {
      var el = document.querySelector(selector);
      if (!el) return;
      gsap.set(el, { autoAlpha: 0, y: 32 });
      gsap.to(el, {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        onStart: function () { suspendCssTransition([el]); },
        onComplete: function () { restoreCssTransition([el]); },
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });

    // Parallax sutil: a foto do hero se desloca um pouco mais devagar
    // que o resto da página enquanto o usuário sai da seção inicial.
    // Ativo em PC e mobile; no mobile o deslocamento é menor porque a
    // seção inicial é mais curta na tela.
    var heroPhotoWrap = document.querySelector(".hero-photo-wrap");
    if (heroPhotoWrap) {
      var isMobileViewport = window.matchMedia("(max-width: 900px)").matches;
      gsap.to(heroPhotoWrap, {
        yPercent: isMobileViewport ? -6 : -10,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 },
      });
    }

    // Zoom sutil nas fotos da galeria: a imagem entra levemente
    // ampliada e assenta em escala normal ao aparecer na tela.
    var galleryImages = gsap.utils.toArray(".gallery-item img");
    if (galleryImages.length) {
      gsap.set(galleryImages, { scale: 1.12 });
      ScrollTrigger.batch(galleryImages, {
        start: "top 92%",
        once: true,
        onEnter: function (batch) {
          suspendCssTransition(batch);
          gsap.to(batch, {
            scale: 1,
            duration: 1,
            ease: "power2.out",
            stagger: 0.1,
            onComplete: function () { restoreCssTransition(batch); },
          });
        },
      });
    }

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  } else if (!prefersReducedMotion && "IntersectionObserver" in window) {
    var revealTargets = document.querySelectorAll(
      ".specialty-card, .diff-item, .testimonial-card, .gallery-item, .about-media, .about-content, .contact-card"
    );

    if (revealTargets.length) {
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
