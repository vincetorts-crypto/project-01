document.addEventListener('DOMContentLoaded', function () {
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var navToggle = document.getElementById('nav-toggle');
  var mobileNav = document.getElementById('mobile-nav');
  var iconMenu = document.getElementById('icon-menu');
  var iconClose = document.getElementById('icon-close');

  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = !mobileNav.classList.contains('hidden');
      mobileNav.classList.toggle('hidden');
      iconMenu.classList.toggle('hidden');
      iconClose.classList.toggle('hidden');
      navToggle.setAttribute('aria-expanded', String(!isOpen));
    });
  }

  var filterButtons = document.querySelectorAll('[data-filter]');
  var galleryItems = document.querySelectorAll('[data-category]');
  if (filterButtons.length && galleryItems.length) {
    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.getAttribute('data-filter');

        filterButtons.forEach(function (b) {
          b.classList.remove('bg-steel', 'text-white');
          b.classList.add('bg-white', 'text-navy');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('bg-steel', 'text-white');
        btn.classList.remove('bg-white', 'text-navy');
        btn.setAttribute('aria-pressed', 'true');

        galleryItems.forEach(function (item) {
          var match = filter === 'all' || item.getAttribute('data-category') === filter;
          item.classList.toggle('hidden', !match);
        });
      });
    });
  }

  var messageField = document.getElementById('message');
  var serviceField = document.getElementById('service');
  var designBanner = document.getElementById('design-banner');
  if (messageField && window.location.search.indexOf('design=1') !== -1) {
    var summary = null;
    try { summary = localStorage.getItem('signcoDesignSummary'); } catch (e) { /* ignore */ }
    if (summary) {
      messageField.value = summary;
      if (serviceField) serviceField.value = 'Custom Sign Design';
      if (designBanner) designBanner.hidden = false;
      try { localStorage.removeItem('signcoDesignSummary'); } catch (e) { /* ignore */ }
    }
  }

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var revealTargets = document.querySelectorAll('[data-reveal]');
  if (revealTargets.length && !prefersReducedMotion && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
  }

  if (!prefersReducedMotion) {
    document.querySelectorAll('.spark-zoom').forEach(function (container) {
      var count = 9;
      for (var i = 0; i < count; i++) {
        var p = document.createElement('span');
        p.className = 'spark-particle';
        var startX = 25 + Math.random() * 55;
        var startY = 30 + Math.random() * 45;
        var dx = Math.round(Math.random() * 70 - 25) + 'px';
        var dy = Math.round(-(45 + Math.random() * 70)) + 'px';
        var duration = (1.6 + Math.random() * 2.2).toFixed(2) + 's';
        var delay = (Math.random() * 4).toFixed(2) + 's';
        p.style.left = startX + '%';
        p.style.top = startY + '%';
        p.style.setProperty('--dx', dx);
        p.style.setProperty('--dy', dy);
        p.style.animationDuration = duration;
        p.style.animationDelay = delay;
        container.appendChild(p);
      }
    });
  }
});
