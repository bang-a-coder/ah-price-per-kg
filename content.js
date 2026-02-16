(() => {
  // ── Selectors ──────────────────────────────────────────────────────────────

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => el.querySelectorAll(s);

  const SEL = {
    card:  'article[data-testid="product-card"]',
    price: '[data-testid="price-amount"]',
    unit:  '[data-testid="product-unit-size"]',
    container: 'div[class*="price_portrait"]',
  };

  // ── Unit conversion table ──────────────────────────────────────────────────
  //
  //   unit → [multiplier, base label]
  //   price_per_base = price × multiplier / quantity

  const UNITS = {
    g:  [1000, 'kg'],
    kg: [1,    'kg'],
    ml: [1000, 'l'],
    cl: [100,  'l'],
    l:  [1,    'l'],
  };

  const UNIT_RE = /^(?:ca\.\s*)?([\d.,]+)\s*(g|kg|ml|cl|l|stuks?|stuk)$/i;

  // ── State ──────────────────────────────────────────────────────────────────

  let active = false;
  let observer = null;

  // ── Styles ─────────────────────────────────────────────────────────────────

  const FONT = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  const CSS = /* css */ `
    #ahpkg {
      position: fixed; top: 8px; right: 8px; z-index: 999999;
      display: none; align-items: center; gap: 8px;
      padding: 8px 12px;
      font: 500 13px/1 ${FONT};
      color: #374151; background: #fff;
      border: 1px solid #e5e7eb; border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.06);
      user-select: none;
      animation: ahpkg-in .2s ease-out;
    }

    @keyframes ahpkg-in {
      from { opacity: 0; transform: translateY(-6px) }
    }

    #ahpkg button {
      font: 600 13px/1 ${FONT};
      border: none; border-radius: 6px;
      cursor: pointer; transition: all .15s;
    }

    #ahpkg .primary {
      padding: 5px 14px;
      color: #fff; background: #00457c;
    }

    #ahpkg .primary:hover { background: #003663 }

    #ahpkg .close {
      display: grid; place-items: center;
      width: 20px; height: 20px; padding: 0;
      color: #9ca3af; background: transparent; border-radius: 4px;
    }

    #ahpkg .close:hover { color: #374151; background: #f3f4f6 }

    #ahpkg .dot {
      width: 6px; height: 6px;
      border-radius: 50%; background: #10b981;
    }

    .ahpkg-price {
      display: block;
      margin-bottom: 2px;
      font: 600 11px/1 ${FONT};
      letter-spacing: -.01em;
      color: #6b7280;
      white-space: nowrap;
    }
  `;

  // ── DOM helpers ────────────────────────────────────────────────────────────

  const el = (tag, props = {}, children = []) => {
    const e = Object.assign(document.createElement(tag), props);
    children.forEach(c => e.append(c));
    return e;
  };

  // ── Price logic ────────────────────────────────────────────────────────────

  const readPrice = card => {
    const p = $(SEL.price, card);
    if (!p) return NaN;
    const i = $('span[class*="integer"]', p)?.textContent.trim();
    const f = $('span[class*="fractional"]', p)?.textContent.trim();
    return (i && f) ? parseFloat(`${i}.${f}`) : NaN;
  };

  const readUnit = card => {
    const raw = $(SEL.unit, card)?.textContent.trim();
    const m = raw?.match(UNIT_RE);
    if (!m) return null;
    const qty = parseFloat(m[1].replace(',', '.'));
    const conv = UNITS[m[2].toLowerCase()];
    return (conv && qty > 0) ? { qty, ...conv && { mult: conv[0], label: conv[1] } } : null;
  };

  const formatPrice = (price, { qty, mult, label }) =>
    `€${(price * mult / qty).toFixed(2)}/${label}`;

  // ── Card processing ────────────────────────────────────────────────────────

  const processCard = card => {
    if (card.dataset.ahpkg) return;
    card.dataset.ahpkg = '1';

    const price = readPrice(card);
    const unit = readUnit(card);
    const container = $(SEL.container, card);
    if (isNaN(price) || !unit || !container) return;

    container.prepend(
      el('span', { className: 'ahpkg-price', textContent: formatPrice(price, unit) })
    );
  };

  const processAll = () => $$(SEL.card).forEach(processCard);

  const cleanup = () => {
    $$('.ahpkg-price').forEach(e => e.remove());
    $$('[data-ahpkg]').forEach(e => delete e.dataset.ahpkg);
  };

  // ── Observer ───────────────────────────────────────────────────────────────

  const observe = (selector, fn) => {
    const mo = new MutationObserver(mutations => {
      for (const { addedNodes } of mutations)
        for (const n of addedNodes)
          if (n.nodeType === 1) {
            if (n.matches?.(selector)) fn(n);
            n.querySelectorAll?.(selector).forEach(fn);
          }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return mo;
  };

  // ── Floater ────────────────────────────────────────────────────────────────

  const floater = el('div', { id: 'ahpkg' });

  const render = () => {
    floater.replaceChildren(
      ...active
        ? [
            el('span', { className: 'dot' }),
            el('span', { textContent: '€/kg prices' }),
            el('button', { className: 'close', innerHTML: '&#x2715;', title: 'Disable', onclick: toggle }),
          ]
        : [
            el('span', { textContent: 'Show €/kg?' }),
            el('button', { className: 'primary', textContent: 'Enable', onclick: toggle }),
          ]
    );
  };

  // ── Toggle ─────────────────────────────────────────────────────────────────

  function toggle() {
    if (active) {
      observer?.disconnect();
      observer = null;
      cleanup();
    } else {
      processAll();
      observer = observe(SEL.card, processCard);
    }
    active = !active;
    render();
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  document.head.append(el('style', { textContent: CSS }));
  render();
  document.body.append(floater);

  observe(SEL.card, () => {
    floater.style.display = 'flex';
    if (active) processAll();
  });

  if ($(SEL.card)) floater.style.display = 'flex';
})();
