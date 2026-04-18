/* YONGIN COUNCIL · DOSSIER №001
   Minimal JS — scroll progress + intersection reveal.
   No framework. No tracking. Works without JS (progressive enhancement). */

(() => {
  'use strict';

  // --- Scroll progress bar ----------------------------------------------
  const progress = document.getElementById('progress');
  if (progress) {
    let ticking = false;
    const update = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      const pct = total > 0 ? Math.min(1, Math.max(0, h.scrollTop / total)) : 0;
      progress.style.transform = `scaleX(${pct})`;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };
    document.addEventListener('scroll', onScroll, { passive: true });
    update();
  }

  // --- Intersection reveal ----------------------------------------------
  const revealables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealables.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.08
    });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add('is-visible'));
  }

  // --- Respectful motion: reduce for prefers-reduced-motion --------------
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealables.forEach((el) => el.classList.add('is-visible'));
  }
})();
