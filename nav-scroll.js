(function () {
  const KEY = 'leftNavScrollTop';

  function getNav() { return document.getElementById('leftNav'); }

  function restore() {
    const nav = getNav();
    if (!nav) return;
    const saved = sessionStorage.getItem(KEY);
    if (saved !== null) nav.scrollTop = parseInt(saved, 10) || 0;
  }

  function bindSave() {
    const nav = getNav();
    if (!nav) return;
    nav.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http')) return;
      sessionStorage.setItem(KEY, String(nav.scrollTop));
    }, { capture: true });
  }

  function init() { restore(); bindSave(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
