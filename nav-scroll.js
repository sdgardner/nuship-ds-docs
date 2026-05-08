(function () {
  const SCROLL_KEY = 'leftNavScrollTop';
  const COLLAPSE_PREFIX = 'lnGroup:';

  // ── Nav data ────────────────────────────────────────────
  const designSystemItems = [
    { name: "What's new",        href: '#' },
    { name: 'Design principles', href: '#' },
    { name: 'Accessibility',     href: '#' },
    { name: 'Content guidelines',href: '#' },
  ];

  const webTokensItems = [
    { name: 'Foundations', href: 'tokens.html' },
    { name: 'Color',       href: '#' },
    { name: 'Typography',  href: '#' },
    { name: 'Spacing',     href: '#' },
    { name: 'Radius',      href: '#' },
    { name: 'Elevation',   href: '#' },
  ];

  // All 39 components A-Z
  const componentItems = [
    { name: 'Accordion',         href: 'accordion.html' },
    { name: 'Alert',             href: 'alert.html' },
    { name: 'Avatar',            href: 'avatar.html' },
    { name: 'Badge',             href: 'badge.html' },
    { name: 'Button',            href: 'button.html' },
    { name: 'Carousel',          href: 'carousel.html' },
    { name: 'Checkbox',          href: 'checkbox.html' },
    { name: 'Date Picker',       href: 'datepicker.html' },
    { name: 'Divider',           href: 'divider.html' },
    { name: 'Dropdown',          href: 'dropdown.html' },
    { name: 'File Row',          href: 'filerow.html' },
    { name: 'File Upload',       href: 'fileupload.html' },
    { name: 'Footer',            href: 'footer.html' },
    { name: 'Header',            href: 'header.html' },
    { name: 'Link',              href: 'link.html' },
    { name: 'Menu',              href: 'menu.html' },
    { name: 'Metrics',           href: 'metrics.html' },
    { name: 'Modal',             href: 'modal.html' },
    { name: 'Number Input',      href: 'numberinput.html' },
    { name: 'Pagination',        href: 'pagination.html' },
    { name: 'Password Input',    href: 'passwordinput.html' },
    { name: 'Popover',           href: 'popover.html' },
    { name: 'Progress Bar',      href: 'progressbar.html' },
    { name: 'Radio Button',      href: 'radiobutton.html' },
    { name: 'Search',            href: 'search.html' },
    { name: 'Segmented Control', href: 'segmentedcontrol.html' },
    { name: 'Select',            href: 'select.html' },
    { name: 'Skeleton',          href: 'skeleton.html' },
    { name: 'Slider',            href: 'slider.html' },
    { name: 'Star Rating',       href: 'starrating.html' },
    { name: 'Step Indicator',    href: 'stepindicator.html' },
    { name: 'Switch',            href: 'switch.html' },
    { name: 'Tabs',              href: 'tabs.html' },
    { name: 'Tag',               href: 'tag.html' },
    { name: 'Text Area',         href: 'textarea.html' },
    { name: 'Text Input',        href: 'textinput.html' },
    { name: 'Tile',              href: 'tile.html' },
    { name: 'Toast',             href: 'toast.html' },
    { name: 'Tooltip',           href: 'tooltip.html' },
  ];

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

  // ── 2 · Rebuild nav HTML with new Fluent-style structure ──
  function currentPage() {
    const path = window.location.pathname;
    const file = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    return file.toLowerCase();
  }

  function buildSearchEl() {
    const wrap = document.createElement('div');
    wrap.className = 'ln-search';
    wrap.innerHTML =
      '<svg class="ln-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>' +
      '</svg>' +
      '<input type="search" class="ln-search-input" placeholder="Search components" autocomplete="off" aria-label="Search components">' +
      '<span class="ln-search-shortcut">/</span>';
    return wrap;
  }

  function buildGroup(label, items, currentFile) {
    const group = document.createElement('div');
    group.className = 'ln-group';

    const labelEl = document.createElement('div');
    labelEl.className = 'ln-label';
    labelEl.setAttribute('role', 'button');
    labelEl.setAttribute('tabindex', '0');
    labelEl.innerHTML =
      '<svg class="ln-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="m6 9 6 6 6-6"/>' +
      '</svg>' +
      '<span class="ln-label-text">' + label + '</span>';
    group.appendChild(labelEl);

    const list = document.createElement('ul');
    list.className = 'ln-list';
    let hasActive = false;
    items.forEach(item => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.name;
      const itemFile = (item.href.split('/').pop() || '').toLowerCase();
      if (itemFile && itemFile === currentFile) {
        a.classList.add('active');
        hasActive = true;
      }
      li.appendChild(a);
      list.appendChild(li);
    });
    group.appendChild(list);

    // Persisted collapse state — but keep open if active item lives here
    const key = COLLAPSE_PREFIX + slug(label);
    const persisted = localStorage.getItem(key);
    if (persisted === 'collapsed' && !hasActive) {
      group.classList.add('ln-group--collapsed');
      labelEl.setAttribute('aria-expanded', 'false');
    } else {
      labelEl.setAttribute('aria-expanded', 'true');
    }

    const toggle = () => {
      const collapsed = group.classList.toggle('ln-group--collapsed');
      labelEl.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      localStorage.setItem(key, collapsed ? 'collapsed' : 'open');
    };
    labelEl.addEventListener('click', toggle);
    labelEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });

    return group;
  }

  function buildNav(inner) {
    const file = currentPage();
    inner.innerHTML = '';
    inner.appendChild(buildSearchEl());
    inner.appendChild(buildGroup('Design system', designSystemItems, file));
    inner.appendChild(buildGroup('Web tokens',    webTokensItems,    file));
    inner.appendChild(buildGroup('Components',    componentItems,    file));
    return inner.querySelector('.ln-search-input');
  }

  // ── 3 · Search filter with auto-expand on match ──
  function bindSearch(input, inner) {
    if (!input) return;
    let emptyMsg = null;

    function applyFilter(query) {
      const q = query.trim().toLowerCase();
      const groups = inner.querySelectorAll('.ln-group');

      if (!q) {
        groups.forEach(group => {
          group.classList.remove('ln-group--hidden');
          group.querySelectorAll('.ln-list li').forEach(li => { li.style.display = ''; });
          const label = group.querySelector('.ln-label-text');
          const labelText = label ? label.textContent.trim() : '';
          const persisted = localStorage.getItem(COLLAPSE_PREFIX + slug(labelText));
          const containsActive = !!group.querySelector('a.active');
          if (persisted === 'collapsed' && !containsActive) {
            group.classList.add('ln-group--collapsed');
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
          emptyMsg.textContent = 'No matches';
          inner.appendChild(emptyMsg);
        }
      } else if (emptyMsg) {
        emptyMsg.remove();
        emptyMsg = null;
      }
    }

    input.addEventListener('input', (e) => applyFilter(e.target.value));

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

    const input = buildNav(inner);
    restoreScroll();
    bindScrollSave();
    bindSearch(input, inner);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
