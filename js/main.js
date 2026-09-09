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
});
