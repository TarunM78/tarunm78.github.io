/**
 * Zoom to detail.
 *
 * What you do with a drawing sheet: put it under a lens and move it around.
 * The whole sheet travels — image, leader lines, labels, title block — because
 * they are one drawing and panning half of it would be a lie.
 *
 * The figure is MOVED into the viewer, not cloned. Cloning would duplicate
 * every id the callouts describe themselves by, duplicate the accessible tree,
 * and force a second decode of the image. Moving keeps one of everything, so
 * the cross-highlight, the pins and the title block all keep working inside the
 * viewer with no code of their own. A placeholder holds the figure's space in
 * the page so closing lands you back where you were.
 *
 * One overlay per page, built on first use, reused by every figure.
 *
 * **Zoom is width, not transform.** This is the whole design of this file and
 * it is not a stylistic choice. A line drawing is composited with
 * `mix-blend-mode` so it sits on the sheet's own paper, and Chrome will not
 * paint a blended element inside a transformed ancestor — the drawing simply
 * vanishes. Resizing the plate instead keeps the drawing rendering exactly as
 * it does on the page, and three things fall out of it for free:
 *
 *   - Leader lines stay true weight at any magnification, because
 *     `vector-effect: non-scaling-stroke` is doing its ordinary job against a
 *     re-laid-out SVG rather than fighting a rasterised layer.
 *   - Callout labels and the title block stay readable instead of ballooning.
 *   - Panning is the browser's own scrolling, so touch, momentum, scrollbars
 *     and keyboard all work without being reimplemented.
 *
 * Zoom stops at 1.5x the image's own pixels. Past that you are looking at
 * interpolation, and presenting interpolation as detail is the same lie as
 * printing a scale on a web page that has none.
 */

let overlay: HTMLElement | null = null;
let viewport: HTMLElement;
let plate: HTMLElement;
let readout: HTMLElement;

/** The figure currently in the viewer, and where to put it back. */
let figure: HTMLElement | null = null;
let placeholder: HTMLElement | null = null;
let anchor: { parent: Node; next: Node | null } | null = null;

/** Plate width at 1x — the width the sheet had on the page. */
let baseWidth = 0;
let scale = 1;
let fitScale = 1;
let maxScale = 4;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/* ---------------------------------------------------------------- chrome */

function build(): void {
  overlay = document.createElement('div');
  overlay.className = 'afigz';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Drawing detail view');
  overlay.hidden = true;

  overlay.innerHTML = `
    <div class="afigz__viewport" tabindex="0"
         aria-label="Drawing. Drag or scroll to pan, plus and minus to zoom, 0 to fit."></div>
    <div class="afigz__bar">
      <span class="meta afigz__hint">Drag to pan &middot; ctrl-scroll to zoom</span>
      <span class="afigz__controls">
        <button type="button" class="afigz__btn" data-z="out" aria-label="Zoom out">&minus;</button>
        <span class="meta meta--ink afigz__readout" role="status">100%</span>
        <button type="button" class="afigz__btn" data-z="in" aria-label="Zoom in">+</button>
        <button type="button" class="afigz__btn" data-z="fit">Fit</button>
        <button type="button" class="afigz__btn" data-z="close">Close</button>
      </span>
    </div>`;

  viewport = overlay.querySelector('.afigz__viewport') as HTMLElement;
  readout = overlay.querySelector('.afigz__readout') as HTMLElement;

  plate = document.createElement('div');
  plate.className = 'afigz__plate';
  viewport.append(plate);

  document.body.append(overlay);

  overlay.addEventListener('click', (e) => {
    // The margin around the sheet is a way out, the sheet itself is not.
    if (e.target === viewport && !dragged) close();
  });

  overlay.querySelector('.afigz__bar')!.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-z]');
    if (!btn) return;
    const mid = { x: viewport.clientWidth / 2, y: viewport.clientHeight / 2 };
    if (btn.dataset.z === 'in') zoomAt(mid, 1.4);
    else if (btn.dataset.z === 'out') zoomAt(mid, 1 / 1.4);
    else if (btn.dataset.z === 'fit') fit();
    else close();
  });

  bindPointer();
  bindKeys();
}

/* ------------------------------------------------------------------ zoom */

function render(): void {
  plate.style.width = `${Math.round(baseWidth * scale)}px`;
  readout.textContent = `${Math.round((scale / fitScale) * 100)}%`;
}

/**
 * Zoom about a point, keeping whatever is under it still.
 *
 * The plate is centred by the viewport's own layout while it is smaller than
 * the window, so the offset has to come out of the sum before scrolling can
 * be corrected — otherwise the sheet jumps sideways the moment it grows past
 * the edges.
 */
function zoomAt(at: { x: number; y: number }, factor: number): void {
  const next = clamp(scale * factor, fitScale * 0.9, maxScale);
  if (Math.abs(next - scale) < 0.0001) return;

  const before = plate.getBoundingClientRect();
  const box = viewport.getBoundingClientRect();
  // Where the point sits within the sheet, 0..1 on each axis.
  const u = (at.x + box.left - before.left) / before.width;
  const v = (at.y + box.top - before.top) / before.height;

  scale = next;
  render();

  const after = plate.getBoundingClientRect();
  viewport.scrollLeft += after.left - box.left + u * after.width - at.x;
  viewport.scrollTop += after.top - box.top + v * after.height - at.y;
}

function measure(): void {
  plate.style.width = `${baseWidth}px`;
  const w = plate.offsetWidth;
  const h = plate.offsetHeight;
  // A drawing is not trimmed to its border. Leave a margin so the sheet reads
  // as a sheet rather than as something cropped by the window.
  fitScale = Math.min(viewport.clientWidth / w, viewport.clientHeight / h) * 0.94;

  const img = figure?.querySelector<HTMLImageElement>('.afig__img');
  maxScale = img?.naturalWidth
    ? clamp((img.naturalWidth / img.offsetWidth) * 1.5, fitScale, 8)
    : fitScale * 3;
}

function fit(): void {
  measure();
  scale = fitScale;
  render();
  viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;
  viewport.scrollTop = (viewport.scrollHeight - viewport.clientHeight) / 2;
}

/* -------------------------------------------------------------- gestures */

let dragged = false;

function bindPointer(): void {
  let from: { x: number; y: number; left: number; top: number } | null = null;

  viewport.addEventListener('pointerdown', (e) => {
    // Touch and pen already pan this element natively, and hijacking them
    // would cost momentum and the browser's own pinch-zoom for nothing.
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;
    from = {
      x: e.clientX,
      y: e.clientY,
      left: viewport.scrollLeft,
      top: viewport.scrollTop,
    };
    dragged = false;
    viewport.setPointerCapture(e.pointerId);
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!from) return;
    const dx = e.clientX - from.x;
    const dy = e.clientY - from.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) dragged = true;
    viewport.scrollLeft = from.left - dx;
    viewport.scrollTop = from.top - dy;
  });

  const release = () => {
    from = null;
  };
  viewport.addEventListener('pointerup', release);
  viewport.addEventListener('pointercancel', release);

  // A plain wheel scrolls the sheet, which is what a scrollable thing should
  // do. Ctrl-wheel — which is also what a trackpad pinch sends — zooms.
  viewport.addEventListener(
    'wheel',
    (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const box = viewport.getBoundingClientRect();
      zoomAt({ x: e.clientX - box.left, y: e.clientY - box.top }, Math.exp(-e.deltaY * 0.01));
    },
    { passive: false }
  );

  viewport.addEventListener('dblclick', (e) => {
    const box = viewport.getBoundingClientRect();
    const at = { x: e.clientX - box.left, y: e.clientY - box.top };
    if (scale > fitScale * 1.05) fit();
    else zoomAt(at, 2);
  });
}

function bindKeys(): void {
  overlay!.addEventListener('keydown', (e) => {
    const mid = { x: viewport.clientWidth / 2, y: viewport.clientHeight / 2 };
    switch (e.key) {
      case 'Escape':
        close();
        break;
      case '+':
      case '=':
        zoomAt(mid, 1.4);
        break;
      case '-':
        zoomAt(mid, 1 / 1.4);
        break;
      case '0':
        fit();
        break;
      default:
        return; // arrows and the rest scroll the viewport natively
    }
    e.preventDefault();
  });
}

/* ------------------------------------------------------------ open/close */

/** Full-resolution source, swapped in once the viewer is open. */
function swapIn(fig: HTMLElement): void {
  const img = fig.querySelector<HTMLImageElement>('.afig__img');
  const full = fig.dataset.zoomSrc;
  if (!img || !full || img.dataset.pageSrc) return;
  // A drawing being examined is not a candidate for deferral, whatever the
  // page decided when it was a thumbnail well below the fold.
  img.loading = 'eager';
  img.dataset.pageSrc = img.getAttribute('src') ?? '';
  img.dataset.pageSrcset = img.getAttribute('srcset') ?? '';

  // The responsive frame already on screen paints immediately; the full sheet
  // replaces it only once it has actually decoded, so nothing ever blanks.
  const next = new Image();
  next.src = full;
  next
    .decode()
    .then(() => {
      img.removeAttribute('srcset');
      img.setAttribute('src', full);
    })
    .catch(() => {});
}

function swapOut(fig: HTMLElement): void {
  const img = fig.querySelector<HTMLImageElement>('.afig__img');
  if (!img || img.dataset.pageSrc === undefined) return;
  img.setAttribute('src', img.dataset.pageSrc);
  if (img.dataset.pageSrcset) img.setAttribute('srcset', img.dataset.pageSrcset);
  delete img.dataset.pageSrc;
  delete img.dataset.pageSrcset;
}

export function open(fig: HTMLElement): void {
  if (!overlay) build();
  if (figure) return;

  figure = fig;
  anchor = { parent: fig.parentNode!, next: fig.nextSibling };
  baseWidth = fig.offsetWidth;

  // Hold the space so the page does not collapse behind the viewer and dump
  // you somewhere else in the scroll when it closes.
  placeholder = document.createElement('div');
  placeholder.style.height = `${fig.offsetHeight}px`;
  anchor.parent.insertBefore(placeholder, fig);

  plate.append(fig);
  swapIn(fig);

  overlay!.hidden = false;
  // The sheet behind is not merely covered: it is out of the tab order and out
  // of the accessibility tree while a drawing is open.
  document.querySelector('.sheet')?.setAttribute('inert', '');
  document.documentElement.classList.add('afigz-lock');

  requestAnimationFrame(() => {
    fit();
    viewport.focus();
    nudge(fig);
  });
}

/**
 * Force one paint invalidation on the drawing.
 *
 * Chrome does not always repaint a blended image that has been reparented:
 * the element is laid out, loaded and correct, and simply is not drawn, until
 * some style on it changes. Resizing an ancestor is not enough — the touch has
 * to land on the image itself.
 *
 * A frame later, deliberately. Doing it in the frame that first paints the
 * viewer is part of that paint and invalidates nothing.
 */
function nudge(fig: HTMLElement): void {
  const img = fig.querySelector<HTMLImageElement>('.afig__img');
  if (!img) return;
  requestAnimationFrame(() => {
    img.style.opacity = '0.999';
    requestAnimationFrame(() => {
      img.style.opacity = '';
    });
  });
}

function close(): void {
  if (!figure || !anchor || !placeholder) return;

  const returning = figure;
  swapOut(returning);
  anchor.parent.insertBefore(returning, placeholder);
  placeholder.remove();

  if (overlay) overlay.hidden = true;
  document.querySelector('.sheet')?.removeAttribute('inert');
  document.documentElement.classList.remove('afigz-lock');
  plate.style.width = '';

  figure = null;
  placeholder = null;
  anchor = null;

  // Put the reader back on the drawing they were looking at, not at the top of
  // the sheet — the viewer was a detour, not a navigation.
  returning.querySelector<HTMLElement>('.afig__zoom')?.focus();
}
