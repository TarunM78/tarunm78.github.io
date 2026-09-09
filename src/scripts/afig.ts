/**
 * Wires the detail viewer to every framed drawing on the sheet.
 *
 * Everything the callouts do — cross-highlight, click to pin, keyboard focus —
 * is CSS and is already working before this file loads. This adds one thing:
 * opening a drawing full size. So it is all progressive enhancement, and with
 * scripting off the sheet is exactly what it was.
 *
 * The trigger is injected rather than rendered, because a button that cannot do
 * anything has no business in the markup.
 *
 * The viewer itself is a separate chunk, fetched on the first sign of intent
 * and not before: a visitor who never opens a drawing never downloads it.
 */

type Viewer = typeof import('./afig-viewer');

let pending: Promise<Viewer> | null = null;
const load = (): Promise<Viewer> => (pending ??= import('./afig-viewer'));

const figures = document.querySelectorAll<HTMLElement>('.afig[data-zoom-src]');

for (const fig of figures) {
  const box = fig.querySelector('.afig__sheetbox');
  const img = fig.querySelector<HTMLImageElement>('.afig__img');
  if (!box || !img) continue;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'meta afig__zoom';
  btn.setAttribute('aria-haspopup', 'dialog');
  // The corner opposite the title block, which is the one corner of a sheet
  // that is deliberately empty.
  btn.textContent = 'View full sheet';
  box.prepend(btn);

  // The button is the only way in. The drawing itself is not a control: a
  // click on it is far more often the start of a drag over a callout, or a
  // selection, than a request to open anything.
  btn.addEventListener('click', () => load().then((v) => v.open(fig)));

  // Warm the chunk on intent, so the click itself is instant.
  const warm = () => load();
  btn.addEventListener('pointerenter', warm, { once: true });
  btn.addEventListener('focus', warm, { once: true });
}
