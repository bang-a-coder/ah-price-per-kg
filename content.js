(() => {
  const STYLE_ID = 'ahpkg-styles';
  const CARD_SELECTOR = 'article[data-testid="product-card"]';
  const PRICE_SELECTOR = '[data-testid="price-amount"]';
  const UNIT_SELECTOR = '[data-testid="product-unit-size"]';

  let active = false;
  let productObserver = null;
  let floater = null;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #ahpkg-floater {
        position: fixed;
        top: 8px;
        right: 8px;
        z-index: 999999;
        display: none;
        align-items: center;
        gap: 8px;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 8px 12px;
        font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        color: #374151;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06);
        user-select: none;
        animation: ahpkg-slide-in 0.2s ease-out;
      }
      @keyframes ahpkg-slide-in {
        from { opacity: 0; transform: translateY(-6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      #ahpkg-floater .ahpkg-label {
        font-weight: 500;
        color: #374151;
        font-size: 13px;
        line-height: 1;
      }
      #ahpkg-floater .ahpkg-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: none;
        border-radius: 6px;
        padding: 5px 14px;
        font-family: inherit;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        line-height: 1;
        transition: background 0.15s;
      }
      #ahpkg-floater .ahpkg-btn-primary {
        background: #00457c;
        color: #fff;
      }
      #ahpkg-floater .ahpkg-btn-primary:hover {
        background: #003663;
      }
      #ahpkg-floater .ahpkg-close {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: #9ca3af;
        font-size: 14px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        transition: color 0.15s, background 0.15s;
      }
      #ahpkg-floater .ahpkg-close:hover {
        color: #374151;
        background: #f3f4f6;
      }
      #ahpkg-floater .ahpkg-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #10b981;
        flex-shrink: 0;
      }
      .ahpkg-price {
        display: block;
        font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 11px;
        font-weight: 600;
        color: #6b7280;
        white-space: nowrap;
        line-height: 1;
        margin-bottom: 2px;
        letter-spacing: -0.01em;
      }
    `;
    document.head.appendChild(style);
  }

  function removeStyles() {
    document.getElementById(STYLE_ID)?.remove();
  }

  // --- Floater ---

  function createFloater() {
    floater = document.createElement('div');
    floater.id = 'ahpkg-floater';
    renderFloater();
    document.body.appendChild(floater);
  }

  function renderFloater() {
    if (!floater) return;
    floater.innerHTML = '';

    if (active) {
      const dot = document.createElement('span');
      dot.className = 'ahpkg-dot';
      floater.appendChild(dot);

      const label = document.createElement('span');
      label.className = 'ahpkg-label';
      label.textContent = '€/kg prices';
      floater.appendChild(label);

      const close = document.createElement('button');
      close.className = 'ahpkg-close';
      close.innerHTML = '&#x2715;';
      close.title = 'Disable';
      close.addEventListener('click', toggle);
      floater.appendChild(close);
    } else {
      const label = document.createElement('span');
      label.className = 'ahpkg-label';
      label.textContent = 'Show €/kg?';
      floater.appendChild(label);

      const btn = document.createElement('button');
      btn.className = 'ahpkg-btn ahpkg-btn-primary';
      btn.textContent = 'Enable';
      btn.addEventListener('click', toggle);
      floater.appendChild(btn);
    }
  }

  function showFloater() {
    if (floater) floater.style.display = 'flex';
  }

  // --- Toggle ---

  function toggle() {
    active ? deactivate() : activate();
    renderFloater();
  }

  function activate() {
    active = true;
    processAllCards();
    startObserving();
  }

  function deactivate() {
    active = false;
    if (productObserver) {
      productObserver.disconnect();
      productObserver = null;
    }
    document.querySelectorAll('.ahpkg-price').forEach(el => el.remove());
    document.querySelectorAll('[data-ahpkg]').forEach(el => el.removeAttribute('data-ahpkg'));
  }

  // --- Price logic ---

  function parseUnit(text) {
    const m = text.trim().match(/^([\d.,]+)\s*(g|kg|ml|cl|l|stuks?|stuk)$/i);
    if (!m) return null;
    const val = parseFloat(m[1].replace(',', '.'));
    const unit = m[2].toLowerCase();
    if (isNaN(val) || val <= 0) return null;
    return { val, unit };
  }

  function pricePerBase(price, { val, unit }) {
    switch (unit) {
      case 'g':  return { amount: price * 1000 / val, label: 'kg' };
      case 'kg': return { amount: price / val, label: 'kg' };
      case 'ml': return { amount: price * 1000 / val, label: 'l' };
      case 'cl': return { amount: price * 100 / val, label: 'l' };
      case 'l':  return { amount: price / val, label: 'l' };
      default:   return null;
    }
  }

  function processCard(card) {
    if (card.hasAttribute('data-ahpkg')) return;
    card.setAttribute('data-ahpkg', '1');

    const priceEl = card.querySelector(PRICE_SELECTOR);
    const unitEl = card.querySelector(UNIT_SELECTOR);
    if (!priceEl || !unitEl) return;

    const intEl = priceEl.querySelector('span[class*="integer"]');
    const fracEl = priceEl.querySelector('span[class*="fractional"]');
    if (!intEl || !fracEl) return;

    const price = parseFloat(intEl.textContent.trim() + '.' + fracEl.textContent.trim());
    if (isNaN(price)) return;

    const parsed = parseUnit(unitEl.textContent);
    if (!parsed) return;

    const result = pricePerBase(price, parsed);
    if (!result) return;

    const container = unitEl.closest('div[class*="price_portrait"]');
    if (!container) return;

    const el = document.createElement('span');
    el.className = 'ahpkg-price';
    el.textContent = `€${result.amount.toFixed(2)}/${result.label}`;
    container.insertBefore(el, container.firstChild);
  }

  function processAllCards() {
    document.querySelectorAll(CARD_SELECTOR).forEach(processCard);
  }

  // --- Observer ---

  function startObserving() {
    if (productObserver) return;
    productObserver = new MutationObserver((mutations) => {
      for (const { addedNodes } of mutations) {
        for (const node of addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.matches?.(CARD_SELECTOR)) processCard(node);
          node.querySelectorAll?.(CARD_SELECTOR).forEach(processCard);
        }
      }
    });
    productObserver.observe(document.body, { childList: true, subtree: true });
  }

  // --- Detection ---

  function checkForProducts() {
    if (document.querySelector(CARD_SELECTOR)) {
      showFloater();
      if (active) processAllCards();
    }
  }

  // --- Init ---

  injectStyles();
  createFloater();
  checkForProducts();

  const detector = new MutationObserver(checkForProducts);
  detector.observe(document.body, { childList: true, subtree: true });
})();
