/**
 * The leader line a legend does not print.
 *
 * A legend figure deliberately has no leaders. Section 5b of the design system
 * says why: the list sits in the sheet's top-right corner, so every leader
 * would have to cross the drawing to reach it, and seven lines laid over the
 * drawing is worse than no lines at all. The balloon numbers do the tying
 * instead, the way a parts list is keyed to an assembly.
 *
 * That holds for the printed state. It stops holding the moment someone is
 * looking for one particular callout, because then there is exactly one line to
 * draw and nothing for it to compete with. So the leader is drawn on demand:
 * point at a legend entry, or at its balloon on the drawing, and the line
 * between the two circles appears. Let go and it is gone. The sheet is never
 * carrying more than one.
 *
 * Progressive enhancement, like everything else in this component. The
 * cross-highlight that dims the other callouts is CSS and is already working
 * before this file loads; with scripting off the figure is exactly what it was.
 *
 * Geometry is measured, not computed from the authored coordinates. The balloon
 * sits at a percentage of the image and the legend entry sits wherever its text
 * put it, so the only honest source for both is the layout itself. That is also
 * what lets it survive a reflow, a font swap and the detail viewer's transform
 * without knowing about any of them.
 */

const NS = 'http://www.w3.org/2000/svg';

/** The width the legend layout exists at. Below it the list is an ordinary
 *  numbered list under the drawing, and a line reaching down to it would run
 *  the height of the sheet to say what two matching numbers already say. */
const WIDE = window.matchMedia('(min-width: 1024px)');

/** Horizontal run into the legend bullet. A leader arrives level with the thing
 *  it points at; the angled part is the shank and this is the shoulder. */
const SHOULDER = 10;

/** Gap between the leader and the circle at either end, so the line stops at
 *  the balloon rather than printing across the number inside it. */
const CLEAR = 2;

function wire(fig: HTMLElement): void {
  const box = fig.querySelector<HTMLElement>('.afig__sheetbox');
  const legend = fig.querySelector<HTMLElement>('.afig__list--legend');
  if (!box || !legend) return;

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'afig__links');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  /* Two strokes, the same construction the printed leaders use: a wider one in
     the page ground underneath, then the annotation stroke on top. It is what
     keeps a red line legible where it crosses the drawing. */
  const halo = document.createElementNS(NS, 'path');
  halo.setAttribute('class', 'afig__linkhalo');
  const stroke = document.createElementNS(NS, 'path');
  stroke.setAttribute('class', 'afig__linkstroke');
  svg.append(halo, stroke);
  box.append(svg);

  const clear = (): void => {
    fig.classList.remove('is-linked');
  };

  const draw = (n: string): void => {
    if (!WIDE.matches) return clear();

    const balloon = fig.querySelector<HTMLElement>(
      `.afig__dot[data-callout="${n}"] .afig__balloon`
    );
    const item = legend
      .querySelector<HTMLElement>(`[data-callout="${n}"]`)
      ?.closest<HTMLElement>('.afig__item');
    if (!balloon || !item) return clear();

    /* The viewBox is the sheet's padding box, which is the region the SVG
       covers. Reading the scale off the SVG's own rect rather than off the box
       means a transform anywhere above it, the detail viewer's for instance,
       costs nothing here. */
    const vw = box.clientWidth;
    const vh = box.clientHeight;
    if (!vw || !vh) return clear();
    svg.setAttribute('viewBox', `0 0 ${vw} ${vh}`);

    const sr = svg.getBoundingClientRect();
    if (!sr.width || !sr.height) return clear();
    const kx = vw / sr.width;
    const ky = vh / sr.height;

    const b = balloon.getBoundingClientRect();
    const bx = (b.left + b.width / 2 - sr.left) * kx;
    const by = (b.top + b.height / 2 - sr.top) * ky;
    const br = (b.width * kx) / 2 + CLEAR;

    /* The legend's number is a ::before, so it has no box to measure. It is the
       first grid column of the entry, top-aligned, so its centre is half its
       own size in from the entry's corner, and its size is readable even though
       its position is not. */
    const bullet = getComputedStyle(item, '::before');
    const bw = parseFloat(bullet.width) || 19;
    const bh = parseFloat(bullet.height) || bw;
    const i = item.getBoundingClientRect();
    const lx = (i.left - sr.left) * kx + bw / 2;
    const ly = (i.top - sr.top) * ky + bh / 2;

    const end = lx - bw / 2 - CLEAR;
    const knee = end - SHOULDER;

    /* Aim the shank at wherever it is going, then start it on the balloon's
       edge rather than at its centre. */
    const aimX = knee > bx + br ? knee : end;
    const aimY = ly;
    const dx = aimX - bx;
    const dy = aimY - by;
    const d = Math.hypot(dx, dy) || 1;
    const sx = bx + (dx / d) * br;
    const sy = by + (dy / d) * br;

    /* No shoulder where there is no room for one: an entry whose bullet sits
       almost above its balloon gets a single straight leader instead of a
       doubled-back one. */
    const path =
      knee > bx + br
        ? `M${sx.toFixed(1)},${sy.toFixed(1)} L${knee.toFixed(1)},${ly.toFixed(1)} L${end.toFixed(1)},${ly.toFixed(1)}`
        : `M${sx.toFixed(1)},${sy.toFixed(1)} L${end.toFixed(1)},${ly.toFixed(1)}`;

    halo.setAttribute('d', path);
    stroke.setAttribute('d', path);
    fig.classList.add('is-linked');
  };

  /* Hover and focus are two separate claims on the line and either can outlive
     the other: focus is the pin, so moving the pointer off a pinned entry
     returns the line to the pinned one rather than clearing it. Same rule the
     CSS highlight follows, which is why the two never disagree. */
  let hot: string | null = null;
  let pinned: string | null = null;
  const render = (): void => {
    const n = hot ?? pinned;
    if (n) draw(n);
    else clear();
  };

  const triggers = fig.querySelectorAll<HTMLElement>(
    '.afig__dot[data-callout], .afig__list--legend [data-callout]'
  );

  for (const el of triggers) {
    const n = el.dataset.callout;
    if (!n) continue;

    el.addEventListener('pointerenter', () => {
      hot = n;
      render();
    });
    el.addEventListener('pointerleave', () => {
      if (hot === n) hot = null;
      render();
    });
    el.addEventListener('focus', () => {
      pinned = n;
      render();
    });
    el.addEventListener('blur', () => {
      if (pinned === n) pinned = null;
      render();
    });
  }

  /* A line measured at one size is wrong at the next, so a resize redraws it
     rather than dropping it. Nothing is cached to go stale: every draw reads
     the two circles where they are now, so redrawing is the same work as
     drawing was. Crossing below 1024px is the same event, and draw() already
     knows there is no legend layout down there to point at. */
  window.addEventListener('resize', render, { passive: true });
  WIDE.addEventListener('change', render);
}

for (const fig of document.querySelectorAll<HTMLElement>('.afig--legend')) {
  wire(fig);
}
