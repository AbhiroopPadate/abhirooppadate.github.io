// A. Accessible 3D Flip Card with Focus Trap
(function initFlipCard() {
  const card = document.querySelector('[data-flip-card]');
  if (!card) return;

  const inner = card.querySelector('.flip-card__inner');
  const toggleBtn = card.querySelector('[data-flip-toggle]');
  const backPanel = card.querySelector('[data-flip-back]');
  const closeBtn = card.querySelector('[data-flip-close]');

  let isFlipped = false;
  let previousActiveElement = null;

  function setFlipped(next) {
    isFlipped = next;
    card.classList.toggle('is-flipped', isFlipped);
    toggleBtn.setAttribute('aria-expanded', String(isFlipped));

    if (isFlipped) {
      previousActiveElement = document.activeElement;
      backPanel.removeAttribute('inert');
      requestAnimationFrame(() => {
        backPanel.focus({ preventScroll: true });
      });
      document.addEventListener('keydown', onKeydown, true);
      document.addEventListener('focusin', maintainFocus, true);
    } else {
      document.removeEventListener('keydown', onKeydown, true);
      document.removeEventListener('focusin', maintainFocus, true);
      backPanel.setAttribute('tabindex', '-1');
      if (previousActiveElement && previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus({ preventScroll: true });
      } else {
        toggleBtn.focus({ preventScroll: true });
      }
    }
  }

  function onKeydown(e) {
    if (!isFlipped) return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      e.preventDefault();
      setFlipped(false);
      return;
    }
    if (e.key === 'Tab') {
      // Focus trap
      const focusable = getFocusable(backPanel);
      if (focusable.length === 0) {
        e.preventDefault();
        backPanel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
    }
  }

  function maintainFocus(e) {
    if (!isFlipped) return;
    if (!backPanel.contains(e.target)) {
      e.stopPropagation();
      const focusable = getFocusable(backPanel);
      (focusable[0] || backPanel).focus();
    }
  }

  function getFocusable(root) {
    const selectors = [
      'a[href]', 'button:not([disabled])', 'input:not([disabled])',
      'select:not([disabled])', 'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];
    return Array.from(root.querySelectorAll(selectors.join(',')))
      .filter(el => el.offsetParent !== null);
  }

  toggleBtn.addEventListener('click', () => setFlipped(true));
  toggleBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setFlipped(true);
    }
  });
  closeBtn.addEventListener('click', () => setFlipped(false));

  // Prevent page scroll while flipped with Escape handling only; no inert widely supported
})();

// B. Hover Parallax Card with CTA Reveal
(function initParallaxCard() {
  const card = document.querySelector('[data-parallax-card]');
  if (!card) return;
  const media = card.querySelector('.parallax-card__media');
  const rectOfMedia = () => media.getBoundingClientRect();

  function update(e) {
    const rect = rectOfMedia();
    const cx = e && typeof e.clientX === 'number' ? e.clientX : rect.left + rect.width / 2;
    const cy = e && typeof e.clientY === 'number' ? e.clientY : rect.top + rect.height / 2;
    const x = cx - rect.left;
    const y = cy - rect.top;
    const mx = Math.max(0, Math.min(1, x / rect.width));
    const my = Math.max(0, Math.min(1, y / rect.height));
    const tx = (mx - 0.5) * 18; // translate px
    const ty = (my - 0.5) * 14;
    card.style.setProperty('--tx', tx.toFixed(2) + 'px');
    card.style.setProperty('--ty', ty.toFixed(2) + 'px');
    media.style.setProperty('--mx', (mx * 100).toFixed(2) + '%');
    media.style.setProperty('--my', (my * 100).toFixed(2) + '%');
  }

  // Bind pointer tracking only to the media region so glow does not spill over text
  media.addEventListener('mousemove', update);
  media.addEventListener('mouseenter', update);
  media.addEventListener('mouseleave', () => {
    card.style.removeProperty('--tx');
    card.style.removeProperty('--ty');
    media.style.removeProperty('--mx');
    media.style.removeProperty('--my');
  });

  // Keyboard/focus accessibility: provide slight reveal when focused
  card.addEventListener('focusin', () => {
    const rect = rectOfMedia();
    update({ clientX: rect.left + rect.width * 0.72, clientY: rect.top + rect.height * 0.36 });
  });
  card.addEventListener('focusout', () => {
    card.style.removeProperty('--tx');
    card.style.removeProperty('--ty');
    media.style.removeProperty('--mx');
    media.style.removeProperty('--my');
  });
})();



