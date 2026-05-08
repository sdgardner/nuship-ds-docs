(function () {
  const SCROLL_KEY = 'leftNavScrollTop';
  const COLLAPSE_PREFIX = 'lnGroup:';

  function getNav() { return document.getElementById('leftNav'); }

  function slug(s) { return s.toLowerCase().replace(/\s+/g, '-'); }

  // ── 1 · Save & restore scroll position across page navigation ──
  function restoreScroll() {
    const nav = getNav();
    if (!nav) return;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved !== null) nav.scrollTop = parseInt(saved, 10) || 0;
  }

  function bindScrollSave() {
    const nav = getNav();
    if (!nav) return;
    nav.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http')) return;
      sessionStorage.setItem(SCROLL_KEY, String(nav.scrollTop));
    }, { capture: true });
  }

  // ── 2 · Inject search field at top of nav ──
  function buildSearch(inner) {
    if (inner.querySelector('.ln-search')) return null;

    const wrap = document.createElement('div');
    wrap.className = 'ln-search';
    wrap.innerHTML =
      '<svg class="ln-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>' +
      '</svg>' +
      '<input type="search" class="ln-search-input" placeholder="Search components" autocomplete="off" aria-label="Search components">' +
      '<span class="ln-search-shortcut">/</span>';
    inner.insertBefore(wrap, inner.firstChild);
    return wrap.querySelector('.ln-search-input');
  }

  // ── 3 · Make groups collapsible with persisted state ──
  function enhanceGroups(inner) {
    const groups = inner.querySelectorAll('.ln-group');
    groups.forEach(group => {
      const label = group.querySelector('.ln-label');
      const list = group.querySelector('.ln-list');
      if (!label || !list || label.dataset.enhanced === '1') return;

      const labelText = label.textContent.trim();
      const key = COLLAPSE_PREFIX + slug(labelText);

      label.dataset.enhanced = '1';
      label.innerHTML =
        '<svg class="ln-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<path d="m6 9 6 6 6-6"/>' +
        '</svg>' +
        '<span class="ln-label-text">' + labelText + '</span>';
      label.setAttribute('role', 'button');
      label.setAttribute('tabindex', '0');
      label.setAttribute('aria-expanded', 'true');

      // Restore persisted state — but don't collapse a group containing the active item
      const containsActive = !!group.querySelector('a.active');
      const persisted = localStorage.getItem(key);
      if (persisted === 'collapsed' && !containsActive) {
        group.classList.add('ln-group--collapsed');
        label.setAttribute('aria-expanded', 'false');
      }

      const toggle = () => {
        const collapsed = group.classList.toggle('ln-group--collapsed');
        label.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        localStorage.setItem(key, collapsed ? 'collapsed' : 'open');
      };

      label.addEventListener('click', toggle);
      label.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  // ── 4 · Search filter (auto-expands groups with matches) ──
  function bindSearch(input, inner) {
    if (!input) return;
    let emptyMsg = null;

    function applyFilter(query) {
      const q = query.trim().toLowerCase();
      const groups = inner.querySelectorAll('.ln-group');

      if (!q) {
        // Reset to persisted collapsed/open state
        groups.forEach(group => {
          group.classList.remove('ln-group--hidden');
          group.querySelectorAll('.ln-list li').forEach(li => { li.style.display = ''; });
          const label = group.querySelector('.ln-label');
          const labelText = label ? label.querySelector('.ln-label-text')?.textContent.trim() : '';
          const persisted = localStorage.getItem(COLLAPSE_PREFIX + slug(labelText));
          const containsActive = !!group.querySelector('a.active');
          if (persisted === 'collapsed' && !containsActive) {
            group.classList.add('ln-group--collapsed');
          } else {
            group.classList.remove('ln-group--collapsed');
            // Only re-collapse if user had it collapsed and doesn't contain active
          }
        });
        if (emptyMsg) { emptyMsg.remove(); emptyMsg = null; }
        return;
      }

      let totalMatches = 0;
      groups.forEach(group => {
        const items = group.querySelectorAll('.ln-list li');
        let visible = 0;
        items.forEach(li => {
          const a = li.querySelector('a');
          if (!a) return;
          const matches = a.textContent.toLowerCase().includes(q);
          li.style.display = matches ? '' : 'none';
          if (matches) visible++;
        });
        if (visible > 0) {
          group.classList.remove('ln-group--hidden', 'ln-group--collapsed');
          totalMatches += visible;
        } else {
          group.classList.add('ln-group--hidden');
        }
      });

      if (totalMatches === 0) {
        if (!emptyMsg) {
          emptyMsg = document.createElement('div');
          emptyMsg.className = 'ln-empty';
          emptyMsg.textContent = 'No components match';
          inner.appendChild(emptyMsg);
        }
      } else if (emptyMsg) {
        emptyMsg.remove();
        emptyMsg = null;
      }
    }

    input.addEventListener('input', (e) => applyFilter(e.target.value));

    // ── Global "/" shortcut to focus search ──
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
        e.preventDefault();
        input.focus();
      }
    });
  }

  function init() {
    const nav = getNav();
    if (!nav) return;
    const inner = nav.querySelector('.left-nav-inner');
    if (!inner) return;

    restoreScroll();
    bindScrollSave();
    const input = buildSearch(inner);
    enhanceGroups(inner);
    bindSearch(input, inner);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
