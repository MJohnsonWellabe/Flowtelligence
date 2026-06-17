/* nav.js – shared navigation behavior */
(function () {
  const hamburger = document.getElementById('hamburger');
  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('sidebar-overlay');

  function toggleSidebar() {
    hamburger.classList.toggle('open');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  }
  function closeSidebar() {
    hamburger.classList.remove('open');
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  }

  if (hamburger) hamburger.addEventListener('click', toggleSidebar);
  if (overlay)   overlay.addEventListener('click', closeSidebar);

  // Sub-menu toggles
  document.querySelectorAll('.has-submenu > span').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      const li = this.parentElement;
      li.classList.toggle('open');
      const sub = li.querySelector('.sidebar-submenu');
      if (sub) sub.classList.toggle('open');
    });
  });

  // FAQ accordion
  document.querySelectorAll('.faq-trigger').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const body = this.nextElementSibling;
      const isOpen = this.classList.contains('open');
      // Close all
      document.querySelectorAll('.faq-trigger').forEach(function (b) {
        b.classList.remove('open');
        b.nextElementSibling.classList.remove('open');
      });
      if (!isOpen) {
        this.classList.add('open');
        body.classList.add('open');
      }
    });
  });

  // Mark active sidebar link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar-menu a').forEach(function (a) {
    if (a.getAttribute('href') === path) {
      a.classList.add('active');
    }
  });
})();
