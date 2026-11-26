// Pull a bottom sheet (city search, wardrobe editor, outfit history) down to close
// it, like in a phone app. The sheet follows the finger; let go far or fast enough
// and it closes through its own backdrop tap, otherwise it springs back.
// A pull only starts when the sheet's content is scrolled to the top, so normal
// scrolling inside it still works; sliders, text fields and sideways rows are left alone.

const CLOSE_DISTANCE = 110; // px
const CLOSE_SPEED = 0.6;    // px per ms, for a quick flick

function scrolledDown(target, sheet) {
  for (let el = target; el && el !== sheet.parentElement; el = el.parentElement) {
    if (el.scrollTop > 0) return true;
  }
  return false;
}

export function initSheetSwipe() {
  let drag = null;

  document.addEventListener('touchstart', (e) => {
    drag = null;
    if (e.touches.length !== 1) return;
    const sheet = e.target.closest('.sheet-backdrop.open .sheet');
    if (!sheet) return;
    if (e.target.closest('input, textarea, select, .style-row, .chip-row, .swatch-grid, .warmth-row')) return;
    const t = e.touches[0];
    drag = { sheet, x0: t.clientX, y0: t.clientY, t0: Date.now(), dy: 0, active: false, blocked: scrolledDown(e.target, sheet) };
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!drag) return;
    const t = e.touches[0];
    const dx = t.clientX - drag.x0;
    const dy = t.clientY - drag.y0;
    if (!drag.active) {
      // Decide once: a downward pull from the top drags the sheet; anything else is a normal scroll.
      if (Math.abs(dx) > 10 || dy < -6 || drag.blocked) { drag = null; return; }
      if (dy < 8) return;
      drag.active = true;
      drag.sheet.style.transition = 'none';
    }
    drag.dy = Math.max(0, dy);
    drag.sheet.style.transform = `translateY(${drag.dy}px)`;
    e.preventDefault();
  }, { passive: false });

  const end = () => {
    if (!drag || !drag.active) { drag = null; return; }
    const { sheet, dy, t0 } = drag;
    drag = null;
    const speed = dy / Math.max(1, Date.now() - t0);
    sheet.style.transition = '';
    if (dy > CLOSE_DISTANCE || (speed > CLOSE_SPEED && dy > 40)) {
      sheet.style.transform = 'translateY(100%)';
      const backdrop = sheet.closest('.sheet-backdrop');
      setTimeout(() => {
        backdrop.click();
        sheet.style.transform = '';
      }, 180);
    } else {
      sheet.style.transform = '';
    }
  };
  document.addEventListener('touchend', end);
  document.addEventListener('touchcancel', end);
}
