// ── Theme persistence ───────────────────────────────────
// Runs as soon as the script is parsed (defer fires after HTML parse
// but before DOMContentLoaded), so the stored theme is applied to
// <html data-theme> before most paints. Inline page scripts may run
// after this; we also override window.toggleTheme below so future
// clicks save to localStorage.
(function applyStoredTheme() {
  try {
    const t = localStorage.getItem('theme');
    if (t === 'dark' || t === 'light') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch (e) { /* localStorage may be unavailable */ }
})();

// Override the per-page inline toggleTheme so toggling persists.
window.toggleTheme = function () {
  const html = document.documentElement;
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  try { localStorage.setItem('theme', next); } catch (e) { /* noop */ }
};

// ── uShip logo: inject the SVG symbol + link in the top nav ────
// Runs on every page (this script is deferred + global). The logo
// links back to index.html so the topnav has a consistent return
// affordance. Skips re-injection on pages that already include the
// symbol (e.g. header.html).
(function injectTopnavLogo() {
  const LOGO_SYMBOL =
    '<defs><symbol id="uship-logo" viewBox="0 0 69.956 35.399">' +
      '<path fill="currentColor" d="M40.902 19.584H35.671V15.026H31V30.188H35.671V24.252H40.902V30.188H45.573V15H40.902V19.584Z"/>' +
      '<path fill="currentColor" d="M47 30.19H51.668V15H47V30.19Z"/>' +
      '<path fill="currentColor" d="M49.727 9.00016C48.237 8.98416 47.016 10.1792 47 11.6692C47 11.6882 47 11.7072 47 11.7262C46.999 13.2322 48.22 14.4542 49.726 14.4542C51.232 14.4552 52.453 13.2352 52.454 11.7282C52.455 10.2222 51.234 9.00116 49.728 9.00016H49.727Z"/>' +
      '<path fill="currentColor" d="M60.764 25.802C59.121 25.781 57.794 24.454 57.772 22.811C57.772 21.219 59.171 19.823 60.764 19.823C62.357 19.823 63.752 21.223 63.752 22.811C63.752 24.399 62.356 25.802 60.764 25.802M60.764 15.416C59.766 15.411 58.777 15.616 57.864 16.019L57.772 16.06V15H53V33.393H57.772V29.587L57.864 29.628C58.777 30.03 59.766 30.235 60.764 30.229C64.91 30.229 68.271 26.968 68.271 22.822C68.271 18.676 64.91 15.315 60.764 15.416"/>' +
      '<path fill="currentColor" d="M11.086 22.386C11.086 24.101 9.617 25.551 7.88 25.551C6.142 25.551 4.671 24.108 4.671 22.386V15H0V22.386C0 26.672 3.535 30.161 7.875 30.161C12.215 30.161 15.749 26.674 15.749 22.386V15H11.086V22.386Z"/>' +
      '<path fill="currentColor" d="M32.652 7.134L36.702 8.599L32.672 0L24.074 4.033L27.776 5.371L27.752 5.434C27.462 6.171 27.211 6.725 27.112 6.844C26.967 7.016 26.769 7.251 25.64 7.326C25.367 7.344 25.139 7.352 24.919 7.352H24.421C23.869 7.358 23.32 7.408 22.776 7.501C21.174 7.73 19.966 8.268 18.847 9.227C17.918 10.03 16.993 11.065 16.51 13.214C16.168 14.737 16.395 16.247 17.184 17.703C17.676 18.615 18.801 20.028 21.36 21.586C22.51 22.284 23.3 22.827 23.678 23.377C23.931 23.747 24.037 24.149 23.971 24.481C23.94 24.665 23.837 24.828 23.683 24.934C23.388 25.125 22.813 25.284 22.205 25.451L22.165 25.461C21.232 25.724 20.075 26.036 19.146 26.643C17.729 27.561 17.309 28.277 16.074 33.752L16 34.076L20.641 35.399L20.729 35.044C21.167 33.278 21.516 32.24 21.759 31.958C22.036 31.638 22.195 31.506 22.896 31.288L23.33 31.157L23.51 31.103C24.547 30.819 25.554 30.438 26.521 29.967C28.279 29.11 29.523 26.994 29.767 24.444C30.03 21.74 29.05 20.268 27.958 19.082C27.206 18.268 23.926 16.155 23.457 15.876C22.88 15.533 22.204 14.957 22.257 14.122C22.3 13.466 23.006 13.178 23.192 13.134C23.334 13.103 23.577 13.079 23.96 13.042H23.998C24.531 12.992 25.335 12.911 26.48 12.747C28.673 12.423 29.853 11.363 30.258 10.922C31.268 9.833 32.073 8.572 32.636 7.198L32.652 7.134Z"/>' +
    '</symbol></defs>';

  function go() {
    // 1) Symbol — skip if header.html already defined it
    if (!document.getElementById('uship-logo')) {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
      wrap.setAttribute('aria-hidden', 'true');
      wrap.innerHTML = '<svg width="0" height="0">' + LOGO_SYMBOL + '</svg>';
      document.body.insertBefore(wrap, document.body.firstChild);
    }
    // 2) Logo link — insert after the hamburger inside .topnav
    const topnav = document.querySelector('.topnav');
    if (!topnav || topnav.querySelector('.topnav-logo')) return;
    const ham = topnav.querySelector('.hamburger');
    const a = document.createElement('a');
    a.className = 'topnav-logo';
    a.href = 'index.html';
    a.setAttribute('aria-label', 'nuShip Design System home');
    a.setAttribute('data-tooltip', 'nuShip home');
    a.innerHTML = '<svg viewBox="0 0 69.956 35.399"><use href="#uship-logo"/></svg>';
    if (ham && ham.nextSibling) topnav.insertBefore(a, ham.nextSibling);
    else topnav.appendChild(a);

    // 3) Top-nav controls — add data-tooltip to common icon buttons so
    //    the site-wide tooltip helper picks them up.
    if (ham && !ham.hasAttribute('data-tooltip')) {
      ham.setAttribute('data-tooltip', 'Menu');
    }
    const themeToggle = topnav.querySelector('.toggle-wrap');
    if (themeToggle && !themeToggle.hasAttribute('data-tooltip')) {
      themeToggle.setAttribute('data-tooltip', 'Toggle theme');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', go);
  } else { go(); }
})();

// ── Site-wide Skid tooltips ─────────────────────────────────
// Any element marked with `data-tooltip="Some text"` (or
// `data-tooltip-html="..."` for richer markup) gets a Skid .tt-tooltip
// on hover or focus. Position is controlled by `data-tooltip-pos`
// (up | bottom | left | right) — defaults to "up" for icon buttons in
// the top nav and "bottom" for in-page content. The tooltip is a
// fixed-position floating layer rendered once on body, so it never
// breaks the trigger's own layout.
(function initSkidTooltips() {
  if (window.__skidTooltipsReady) return;
  window.__skidTooltipsReady = true;

  // Arrow centering — the Skid spec pins the arrow to left:24px which is
  // off-center for small icon-button triggers. Center it for our floating
  // instance only (selector targets body > .tt-tooltip).
  function ensureArrowCSS() {
    if (document.getElementById('tt-floating-arrow-css')) return;
    const s = document.createElement('style');
    s.id = 'tt-floating-arrow-css';
    s.textContent = [
      'body > .tt-tooltip--up::after,',
      'body > .tt-tooltip--bottom::after {',
      '  left: 50%; transform: translateX(-50%);',
      '}',
      'body > .tt-tooltip { font-family: "Lato", sans-serif; }',
    ].join('');
    document.head.appendChild(s);
  }

  function buildHost() {
    ensureArrowCSS();
    const host = document.createElement('div');
    host.className = 'tt-tooltip tt-tooltip--simple tt-tooltip--up';
    host.style.cssText = [
      'position:fixed',
      'top:-9999px',
      'left:-9999px',
      'z-index:9999',
      'pointer-events:none',
      'opacity:0',
      'transition:opacity 120ms ease',
      'will-change:transform, opacity',
      'white-space:nowrap',
    ].join(';');
    host.setAttribute('role', 'tooltip');
    const txt = document.createElement('span');
    txt.className = 'tt-tooltip-text';
    host.appendChild(txt);
    return { host: host, txt: txt };
  }

  function placeHost(host, trigger, pos) {
    const r = trigger.getBoundingClientRect();
    // Reset so transform doesn't accumulate
    host.style.transform = '';
    // Set position class so the arrow matches
    host.classList.remove('tt-tooltip--up', 'tt-tooltip--bottom', 'tt-tooltip--left', 'tt-tooltip--right');
    host.classList.add('tt-tooltip--' + pos);

    // Measure the host once positioned roughly so we can center it
    host.style.top = '0px';
    host.style.left = '0px';
    const h = host.getBoundingClientRect();
    let top, left, tx, ty;
    const gap = 10; // distance between trigger and tooltip
    switch (pos) {
      case 'bottom':
        top = r.bottom + gap;
        left = r.left + r.width / 2 - h.width / 2;
        break;
      case 'left':
        top = r.top + r.height / 2 - h.height / 2;
        left = r.left - h.width - gap;
        break;
      case 'right':
        top = r.top + r.height / 2 - h.height / 2;
        left = r.right + gap;
        break;
      case 'up':
      default:
        top = r.top - h.height - gap;
        left = r.left + r.width / 2 - h.width / 2;
        break;
    }
    // Clamp to viewport so we don't paint off-screen
    const pad = 6;
    left = Math.max(pad, Math.min(left, window.innerWidth - h.width - pad));
    top  = Math.max(pad, Math.min(top,  window.innerHeight - h.height - pad));
    host.style.left = left + 'px';
    host.style.top  = top  + 'px';
  }

  let host, txt;
  function ensureHost() {
    if (host) return;
    const built = buildHost();
    host = built.host;
    txt = built.txt;
    document.body.appendChild(host);
  }

  let active = null;
  let showTimer = null;

  function defaultPos(el) {
    return el.closest('.topnav') ? 'bottom' : (el.getAttribute('data-tooltip-pos') || 'up');
  }

  function show(el) {
    ensureHost();
    const text = el.getAttribute('data-tooltip');
    if (!text) return;
    txt.textContent = text;
    placeHost(host, el, el.getAttribute('data-tooltip-pos') || defaultPos(el));
    host.style.opacity = '1';
    active = el;
  }

  function hide() {
    if (!host) return;
    host.style.opacity = '0';
    active = null;
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
  }

  document.addEventListener('mouseover', function (e) {
    const trigger = e.target.closest && e.target.closest('[data-tooltip]');
    if (!trigger || trigger === active) return;
    if (showTimer) clearTimeout(showTimer);
    showTimer = setTimeout(function () { show(trigger); }, 300);
  });

  document.addEventListener('mouseout', function (e) {
    const trigger = e.target.closest && e.target.closest('[data-tooltip]');
    if (!trigger) return;
    // If the new mouse position is still inside the same trigger, ignore
    const to = e.relatedTarget;
    if (to && to.closest && to.closest('[data-tooltip]') === trigger) return;
    hide();
  });

  document.addEventListener('focusin', function (e) {
    const trigger = e.target.closest && e.target.closest('[data-tooltip]');
    if (trigger) show(trigger);
  });

  document.addEventListener('focusout', function () { hide(); });

  // Hide on scroll / resize so it doesn't drift away from the trigger
  window.addEventListener('scroll', hide, true);
  window.addEventListener('resize', hide);

  // Escape dismisses
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hide();
  });
})();

(function () {
  const SCROLL_KEY = 'leftNavScrollTop';
  const COLLAPSE_PREFIX = 'lnGroup:';

  // ── Nav data ────────────────────────────────────────────
  const designSystemItems = [
    { name: "What's new",        href: '#' },
    { name: 'Design principles', href: 'design-principles.html' },
    { name: 'Accessibility',     href: 'accessibility.html' },
    { name: 'Content guidelines',href: 'content-guidelines.html' },
  ];

  const webTokensItems = [
    { name: 'Foundations', href: 'tokens.html' },
    { name: 'Color',       href: 'colors.html' },
    { name: 'Typography',  href: 'typography.html' },
    { name: 'Spacing',     href: 'spacing.html' },
    { name: 'Radius',      href: 'radius.html' },
    { name: 'Elevation',   href: 'elevation.html' },
    { name: 'Iconography', href: 'icons.html' },
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
