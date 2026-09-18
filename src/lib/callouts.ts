/**
 * Callout leader-line geometry, resolved at build time.
 *
 * Everything here runs once during `astro build`. Nothing ships to the browser,
 * which is why the site can carry annotated figures at zero JavaScript.
 *
 * Coordinate space: 0..100 in both axes, matching the overlay SVG's
 * viewBox="0 0 100 100" with preserveAspectRatio="none". A unit is therefore a
 * percentage of the image box on that axis, and negative / >100 values land in
 * the gutters either side, which the SVG is allowed to overflow into.
 */

export interface CalloutInput {
  /**
   * Position on the image, 0..1. Both optional: several projects have their
   * callout text written but no photograph to place it on. An unplaced callout
   * appears in the list beneath the figure and gets no dot and no leader,
   * rather than being given invented coordinates.
   */
  x?: number;
  y?: number;
  text: string;
}

export interface ResolvedCallout {
  /** 1-based, in authored order. Ties a balloon to its list entry. */
  index: number;
  /** False when no coordinates were authored: list entry only, no geometry. */
  placed: boolean;
  x: number;
  y: number;
  side: 'left' | 'right';
  /** Vertical position of the label after collision resolution. */
  slotY: number;
  /** Two-segment leader for the gutter layout: angled shank, then shoulder. */
  widePath: string;
  /** Shortened stub for the stacked layout. */
  narrowPath: string;
  /**
   * Where on the drawing the anchor sits, in words: "upper left", "centre",
   * "lower right". Spoken to assistive tech, which is why it is not a
   * percentage — "x 30%, y 27%" is a coordinate, not information a listener
   * can use. Empty for an unplaced callout, which is nowhere on the drawing.
   */
  region: string;
  text: string;
}

/**
 * Nine-cell verbal position. Thirds on each axis, and the middle cell is just
 * "centre" rather than "centre centre".
 */
function regionOf(x: number, y: number): string {
  const band = (n: number, lo: string, mid: string, hi: string) =>
    n < 33.34 ? lo : n < 66.67 ? mid : hi;
  const v = band(y, 'upper', 'centre', 'lower');
  const h = band(x, 'left', 'centre', 'right');
  if (v === 'centre' && h === 'centre') return 'centre';
  if (v === 'centre') return `centre ${h}`;
  if (h === 'centre') return `${v} centre`;
  return `${v} ${h}`;
}

/** Gutter width either side, as a percentage of image width.
 *  Sized so a 30-40 character callout wraps to at most two lines at the widths
 *  this figure actually renders at. 22 was too tight and wrapped to four; 38
 *  held that measure by taking it out of the drawing, which on the home sheet
 *  left the drawing a third narrower than the one below it for no gain — the
 *  labels were simply set further out. The label keeps its measure in
 *  millimetres here: the gutter is narrower, but the drawing it is a fraction
 *  of is wider. */
const GUTTER = 26;
/** Inner edge of the label box. The shoulder lands here — close to the drawing,
 *  because the shoulder is the segment that says which label goes with which
 *  anchor and length adds nothing to that. */
const LABEL_INNER = 4;
/** Where the leader bends, just outside the image edge. Inside LABEL_INNER, or
 *  there is no shoulder left to run: the bend has to happen before the label
 *  starts, and the gap between the two is the whole horizontal segment. */
const KNEE = 1.5;
/** Minimum vertical separation between two labels on the same side. */
const MIN_GAP = 14;
/** Labels stay inside this vertical band so they never overhang the figure. */
const SLOT_LO = 7;
const SLOT_HI = 93;
/** Length of the shortened leader in the stacked layout. */
const STUB = 12;
/** Stubs may not run past this margin, in either direction. */
const STUB_MARGIN = 2;

export const CALLOUT_GUTTER = GUTTER;

/**
 * Figure ids only have to be unique within a page, and a page is rendered in
 * one pass, so a counter is enough. Callers that have a real designator to hand
 * — a part number — should pass it instead, so the ids stay stable across
 * builds and survive a view transition.
 */
let figureSeq = 0;
export const nextFigureId = (): string => `afig-${++figureSeq}`;

const round = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * Push labels apart so none overlap, keeping each as close to its anchor as it
 * can get.
 *
 * Three passes. Forward enforces the minimum gap and the top of the band;
 * backward enforces the bottom; a final forward pass restores the top bound,
 * which cannot break the bottom one because the stack is already known to fit.
 *
 * A single rigid shift is not enough here: if the stack overflows the bottom
 * while its first label already sits at the top of the band, shifting the whole
 * block up pushes that first label out of the figure.
 */
function resolveSlots(ys: number[]): number[] {
  const n = ys.length;
  if (n === 0) return [];
  if (n === 1) return [clamp(ys[0], SLOT_LO, SLOT_HI)];

  const span = (n - 1) * MIN_GAP;
  const range = SLOT_HI - SLOT_LO;

  // More callouts on one side than the band can hold at full spacing:
  // distribute evenly rather than letting them collide.
  if (span > range) {
    const gap = range / (n - 1);
    return ys.map((_, i) => SLOT_LO + i * gap);
  }

  const slots: number[] = [Math.max(SLOT_LO, ys[0])];
  for (let i = 1; i < n; i++) {
    slots.push(Math.max(ys[i], slots[i - 1] + MIN_GAP));
  }

  slots[n - 1] = Math.min(slots[n - 1], SLOT_HI);
  for (let i = n - 2; i >= 0; i--) {
    slots[i] = Math.min(slots[i], slots[i + 1] - MIN_GAP);
  }

  slots[0] = Math.max(slots[0], SLOT_LO);
  for (let i = 1; i < n; i++) {
    slots[i] = Math.max(slots[i], slots[i - 1] + MIN_GAP);
  }

  // If every gap ended up at the minimum, the block is fully compressed and its
  // position is arbitrary. Centre it on the anchors instead of leaving it where
  // the forward pass happened to land it, which otherwise drags the last leader
  // across most of the image.
  const compressed = slots[n - 1] - slots[0] <= span + 0.001;
  if (compressed) {
    const centroid = ys.reduce((a, b) => a + b, 0) / n;
    const start = clamp(centroid - span / 2, SLOT_LO, SLOT_HI - span);
    return ys.map((_, i) => start + i * MIN_GAP);
  }

  return slots;
}

/**
 * How many callouts one figure may carry.
 *
 * The cross-highlight in section 5b of the design system enumerates callout
 * indices — CSS cannot parameterise an attribute value — so the stylesheet and
 * this number have to agree. Exceeding it would silently drop the highlight on
 * the extra callouts, which is the kind of quiet failure this build gate exists
 * to prevent. Ten is already twice what any drawing here carries; a figure
 * needing more is a figure that should be two figures.
 */
export const MAX_CALLOUTS = 10;

export interface ResolveOptions {
  /**
   * Which gutters the wide layout has.
   *
   * 'both' is the drawing-sheet default: a label goes to whichever side of the
   * drawing its anchor sits on, and the figure is read with paper either side
   * of it.
   *
   * 'right' puts every label in one gutter. That is what a figure set beside a
   * column of text needs — a left-hand label would land on the prose rather
   * than on paper, and a leader line crossing a paragraph reads as a mistake.
   * It also buys the drawing width back: one gutter instead of two takes the
   * figure's span from 152% of the drawing to 126%.
   *
   * The stacked layout below 1024px is unaffected either way. There the labels
   * are a numbered list under the figure, not gutter labels, so `side` carries
   * no meaning and only the stub direction reads from it.
   */
  gutter?: 'both' | 'right';
}

export function resolveCallouts(
  callouts: CalloutInput[] = [],
  { gutter = 'both' }: ResolveOptions = {}
): ResolvedCallout[] {
  if (!callouts.length) return [];
  if (callouts.length > MAX_CALLOUTS) {
    throw new Error(
      `A figure carries ${callouts.length} callouts; the limit is ${MAX_CALLOUTS}. ` +
        `Raise MAX_CALLOUTS in src/lib/callouts.ts and extend the enumerated ` +
        `cross-highlight rules in section 5b of design-system.css to match, or split the figure.`
    );
  }

  const unplaced: ResolvedCallout[] = [];
  const points: Array<{
    index: number;
    text: string;
    x: number;
    y: number;
    side: 'left' | 'right';
  }> = [];

  callouts.forEach((c, i) => {
    if (typeof c.x !== 'number' || typeof c.y !== 'number') {
      unplaced.push({
        index: i + 1,
        placed: false,
        x: 0,
        y: 0,
        side: 'left',
        slotY: 0,
        widePath: '',
        narrowPath: '',
        region: '',
        text: c.text,
      });
      return;
    }
    points.push({
      index: i + 1,
      text: c.text,
      x: clamp(c.x * 100, 0, 100),
      y: clamp(c.y * 100, 0, 100),
      /* One gutter means one band, so every label lands in the same stack and
         resolveSlots pushes all of them apart together rather than two
         half-length groups. Past roughly six callouts that band is full and
         they distribute evenly — which is the same ceiling a one-sided
         engineering drawing has, and the reason drawings use both margins. */
      side: gutter === 'right' ? 'right' : c.x < 0.5 ? 'left' : 'right',
    });
  });

  const out: ResolvedCallout[] = [...unplaced];

  for (const side of ['left', 'right'] as const) {
    const group = points.filter((p) => p.side === side).sort((a, b) => a.y - b.y);
    const slots = resolveSlots(group.map((p) => p.y));

    group.forEach((p, i) => {
      const slotY = round(slots[i]);
      const x = round(p.x);
      const y = round(p.y);

      const kneeX = side === 'left' ? -KNEE : 100 + KNEE;
      const shoulderX = side === 'left' ? -LABEL_INNER : 100 + LABEL_INNER;
      // The stub normally runs outward, toward the nearer edge. When the anchor
      // is already hard against that edge there is no room, so it flips inward
      // rather than collapsing to zero length — the spec requires these to
      // shorten, not disappear.
      const outward = side === 'left' ? x - STUB : x + STUB;
      const stubX = round(
        outward >= STUB_MARGIN && outward <= 100 - STUB_MARGIN
          ? outward
          : side === 'left'
            ? x + STUB
            : x - STUB
      );

      out.push({
        ...p,
        placed: true,
        x,
        y,
        slotY,
        widePath: `M${x},${y} L${kneeX},${slotY} L${shoulderX},${slotY}`,
        narrowPath: `M${x},${y} L${stubX},${y}`,
        region: regionOf(x, y),
      });
    });
  }

  // Back to authored order, so balloon numbers match the list below.
  return out.sort((a, b) => a.index - b.index);
}
