# Design plan — drawing-package portfolio

Status: plan only. No CSS written yet.
Governing document: `SITE-SPEC.md`. Where this file and the spec disagree, the spec wins
unless the disagreement is listed under "Deviations" below and has been accepted.

---

## 1. Principle

Every mark on this site is a drawing convention *doing its original job*. A leader line
points at a real component. A revision row records a real change. A section marker marks a
real cut. If a mark cannot name the information it carries, it does not ship.

The corollary, which is the harder half: the site is allowed to look plain. Restraint is
the design. There is no ornament budget to spend.

---

## 2. Color tokens

Semantic names stay constant across themes; only values swap. Light is paper. Dark is a
true blueprint, and is the only place blueprint blue is permitted.

### Light (paper) — default

| Token          | Value     | Job                                                      | Contrast on paper |
|----------------|-----------|----------------------------------------------------------|-------------------|
| `--paper`      | `#F7F5EF` | Page ground                                               | —                 |
| `--ink`        | `#1C1C1A` | All body text, headings, line work                        | 15.1:1  AAA       |
| `--grid-minor` | `#DCDCD2` | 5 mm grid line                                            | non-text          |
| `--grid-major` | `#CFCFC3` | Every 5th grid line (25 mm)                               | non-text          |
| `--annotation` | `#B23A32` | Callouts, leader lines, revision marks, current-sheet triangle, focus ring | 5.3:1  AA |
| `--reference`  | `#2A4E8C` | Links and interactive elements ONLY                       | 7.3:1  AA         |
| `--faint`      | `#6E6E66` | Secondary metadata text: sheet numbers, timestamps        | 4.6:1  AA         |
| `--faint-rule` | `#8A8A82` | Hairlines and tick marks only. Never text.                | non-text          |

### Dark (blueprint) — `prefers-color-scheme: dark`

| Token          | Value                     | Contrast on ground |
|----------------|---------------------------|--------------------|
| `--paper`      | `#0D2340`                 | —                  |
| `--ink`        | `#C8D8EC`                 | 10.9:1  AAA        |
| `--grid-minor` | `rgb(200 216 236 / 0.09)` | non-text           |
| `--grid-major` | `rgb(200 216 236 / 0.16)` | non-text           |
| `--annotation` | `#FFFFFF`                 | 15.8:1  AAA        |
| `--reference`  | `#7FB2F0`                 | 7.2:1   AAA        |
| `--faint`      | `#8A9CB4`                 | 5.6:1   AA         |
| `--faint-rule` | `rgb(200 216 236 / 0.35)` | non-text           |

Red and blue keep exactly one job each. Neither is ever used for emphasis. In blueprint
mode the pair inverts rather than breaking: annotation goes neutral-white (red is illegible
on navy and would read as an error state), interactive stays blue but brightens away from
the line color. Links additionally carry an underline in both themes, so the dark mode does
not lean on hue alone.

A reproduction switch, defaulting to `prefers-color-scheme`. The two themes are the two
ways a drawing gets reproduced — printed on paper, or run as a blueprint — and the control
names them that way rather than naming a brightness. Nothing is pinned until someone
chooses; until then the OS is in charge, and the choice persists per browser once made.

This replaces "no theme toggle, which keeps the site at zero JavaScript". The cost is real
and is stated in section 9: every sheet now carries a script, where four of them carried
none. It buys a reader who is on a dark OS the ability to read the paper sheet, which the
old rule left them no way to do. The `[data-theme]` hooks the tokens and the drawing
inversion already carried existed for exactly this and cost nothing to turn on.

### Line weights — not line colors

Drawings encode hierarchy in stroke weight, so the tokens do too. There is one line color
(`--ink`, or `--annotation` for annotation layers) and three weights.

| Token        | Value  | Used for                                        |
|--------------|--------|-------------------------------------------------|
| `--lw-thin`  | 0.5px  | Leader lines, dimension lines, extension lines  |
| `--lw-med`   | 1px    | Table rules, section markers                    |
| `--lw-heavy` | 2px    | Sheet border, title-block outer frame           |

`--radius: 0`. There is deliberately **no shadow token** anywhere in the system, so a card
cannot be built by accident.

---

## 3. Type scale

IBM Plex, self-hosted and subset at build time.

- **Plex Sans** — body copy and headings, everywhere.
- **Plex Mono** — drawing metadata only: sheet numbers, part numbers, revision tables,
  dimensions, callout text, timestamps, table headers. Always caps, `0.12em` tracking.
- **Plex Serif** — blog post body only.

The scale is the ISO 3098 lettering-height series (1.8 / 2.5 / 3.5 / 5 / 7 / 10 / 14 / 20 mm),
which is a root-2 progression and is the real standard for text height on engineering
drawings. Token numbers are the ISO height in mm, times ten.

| Token      | px   | rem     | Role                                               |
|------------|------|---------|----------------------------------------------------|
| `--t-h18`  | 11   | 0.6875  | Sheet number, title-block field labels (mono caps) |
| `--t-h25`  | 12   | 0.75    | Metadata default, table headers (mono caps)        |
| `--t-h35`  | 14   | 0.875   | Table body, captions, callout text                 |
| `--t-h50`  | 16   | 1.0     | Body copy base (sans)                              |
| `--t-h70`  | 22   | 1.375   | h3 / subsection                                    |
| `--t-h100` | 31   | 1.9375  | h2                                                 |
| `--t-h140` | 44   | 2.75    | h1                                                 |
| `--t-h200` | 62   | 3.875   | Sheet title, 1024px and up, clamped down below     |

Blog serif body sits outside this scale at 18px / 1.75, capped at **68ch**, per the spec.

| Context         | Line height | Tracking | Weight  |
|-----------------|-------------|----------|---------|
| Mono metadata   | 1.2         | 0.12em   | 400/500 |
| Sans body       | 1.55        | 0        | 400     |
| Sans headings   | 1.15        | -0.01em  | 600     |
| Serif blog body | 1.75        | 0        | 400     |

Mono uses `font-variant-numeric: tabular-nums` everywhere so part numbers and dates align
in columns.

**Boundary, stated explicitly because it is the easiest rule to erode:** caps-mono is for
metadata. It is not for headings, not for body copy, not for link text, not for buttons.
The one sanctioned prose-adjacent use is the home page's short identity block, which the
spec calls for directly and which is capped at three lines.

---

## 4. Spacing

The background grid is a 5 mm sheet grid rendered at **20px minor / 100px major**. Layout
spacing is a multiple of that module wherever it is structural, so the page reads as drawn
on the sheet rather than floating above it.

| Token    | Value | Use                                    |
|----------|-------|----------------------------------------|
| `--sp-1` | 4px   | Inside table cells                     |
| `--sp-2` | 8px   | Label to value                         |
| `--sp-3` | 12px  | Tight stack                            |
| `--sp-4` | 20px  | 1 grid module. Paragraph rhythm.       |
| `--sp-5` | 40px  | 2 modules. Between blocks.             |
| `--sp-6` | 60px  | 3 modules. Sheet margin, desktop.      |
| `--sp-7` | 100px | 1 major module. Between page sections. |
| `--sp-8` | 160px | Hero clearance.                        |

Sheet margin: 20px at 375, 40px at 768, 60px at 1024 and up. Text column max 72ch (sans),
68ch (serif).

---

## 5. Component vocabulary

Eight named by the spec, plus four structural primitives that exist to stop the eight from
being reimplemented four times each.

**From the spec**

1. **`TitleBlock`** — Docked into the lower-right corner of a framed `AnnotatedFigure`,
   its outer edges meeting the drawing border exactly. Fields: part number, title,
   revision letter, scale, start date, medium, drafter's initials. It belongs to a
   drawing, not to a page: nothing docks it to the viewport, and the full name is not
   repeated here — the sheet's identity strip states it once.
2. **`SheetIndex`** — The navigation: SHT / TITLE / REV, in one horizontal row at the right
   of the head band. Current sheet carries a red triangle. Not a nav bar, not a hamburger;
   below 1024px it wraps in the flow at the top of the sheet. Formerly a table, and before
   that a bordered column — one horizontal row is what
   same table, narrower.
3. **`RevisionTable`** — The whole About page. REV / DATE / DESCRIPTION / BY, ordered oldest
   first, read bottom-up as on a real drawing. Each role, lab, or award is one revision.
4. **`Callout`** — Leader line plus label. See section 6; it is the centerpiece and gets its
   own section.
5. **`PartNumber`** — `PN-0XX` plus rev letter. Rendered in the project header and index.
   Assigned in order of project start date. Appears on projects and nothing else.
6. **`NotesBlock`** — Numbered notes at the foot of a project sheet. Real content only:
   what failed, what the next rev changes, what tools were used.
7. **`SectionMarker`** — `SECTION A-A` rules between major content breaks. Constrained: see
   the revisions list, item 2.
8. **`SheetGrid`** — The CSS 5 mm grid. Two stacked `repeating-linear-gradient`s, no image,
   `z-index: -1`, `pointer-events: none`. A `--grid-alpha` multiplier lets the blog layout
   drop it to near-invisible.

**Structural primitives**

9. **`Sheet`** — The layout every page uses. Owns the grid, the head strip and the sheet
   index. The sheet's identity (number, title, rev, date) is stated in the head strip.
   Pages declare their metadata; the Sheet renders it.
10. **`AnnotatedFigure`** — Owns an image plus its callout coordinate space and the gutters
    the labels land in. Host for `Callout`. Used by the home hero and every project image.
11. **`DataTable`** — The shared table: mono caps headers, `--lw-med` hairline rules,
    tabular numerals, no zebra striping, no radius. `SheetIndex`, `RevisionTable`, the
    projects index and the blog index are all specializations. One implementation.
12. **`DimensionLine`** — Extension lines plus arrowheads bracketing a row's extent, shown
    on hover. **Exactly one use site: project index rows.** It is the site's only motion.

---

## 6. Callout with leader line — the hard component

Authored per image in MDX frontmatter as normalized coordinates:

```yaml
callouts:
  - x: 0.42      # 0..1 across the image
    y: 0.31      # 0..1 down the image
    text: PA12 PRINTED LINK
```

**Structure.** A `figure` with `position: relative` containing the `<Image>`, an absolutely
positioned SVG overlay covering exactly the image box, and HTML label elements positioned in
the same coordinate space. Labels are HTML, not SVG `text`, so they get real font loading,
real wrapping, and real selection.

**The scaling problem and its fix.** The overlay uses `viewBox="0 0 100 100"` with
`preserveAspectRatio="none"` so normalized coordinates map directly to percentages
regardless of image aspect ratio. That non-uniform scale would distort stroke weights;
`vector-effect="non-scaling-stroke"` on every path pins them to their true weight.

**Desktop (1024px and up).** The figure carries a gutter of 26% of the drawing width on
each side, which is the label measure plus the shoulder that reaches it. Callouts with
`x < 0.5` land left, `x >= 0.5` land right. Each leader is the standard two-segment form: an
angled shank from the anchor dot, then a short horizontal shoulder that the label sits on.
Vertical collisions are resolved at build time — callouts are sorted by `y` within each
side, then pushed apart to a minimum gap, so labels never overlap and never need JS.

**One element, both layouts.** The gutter label and the entry in the list below the figure
are the same node, moved. They used to be two: an `aria-hidden` label beside the drawing
and a second copy of the text in a list clipped out of view above 1024px, so that assistive
tech read exactly one of them. That duplication is what kept the callouts inert — the thing
you could see was hidden from screen readers, and the thing screen readers read was
invisible, so neither could safely become the control. Collapsed into one element it can be
a real button, and a callout with no coordinates stops disappearing on desktop.

**Live callouts.** `data-callout` carries one integer shared by a leader path, its anchor
dot and its label; `:has()` on that integer lights all three and dims the rest of the
figure. The state is three custom properties, so the enumerated per-index rules stay one
line each and every element decides what "hot" means for it. Nothing in the highlight
changes a box — only stroke width, colour and opacity — so it cannot cost a reflow. The
selector keys off `:focus` rather than `:focus-visible`, which is the whole of the
click-to-pin behaviour: clicking a label focuses it, focus outlives the pointer, clicking
away releases it. Keyboard focus gets the same treatment for free. Dimmed text swaps to
`--faint` rather than fading, because `--faint` is the darkest value still clearing AA and
an opacity fade would drop it under the floor immediately.

**Mobile (below 768px).** Labels stack below the image as a numbered list. Per the spec the
leaders shorten rather than disappear: each anchor keeps a numbered balloon and a short stub
leader pointing toward the nearest image edge, and the number is what ties the dot to its
entry in the list below.

**Numbering rule.** Balloon numbers appear *only* in the stacked mobile layout, where they
carry the dot-to-text mapping. On desktop the leader line already carries that mapping, so
the number would be decoration and is omitted. Same component, same data, number shown only
where it does work.

Between 768 and 1024px: labels stack below, but the figure keeps a single narrow gutter, so
the transition is gradual rather than a jump.

---

## 7. Wireframes

### Home — Sheet 1, desktop

Three things have changed since this wireframe was drawn.

The identity block moved above the drawing. The name is set at display size in the body
face and the metadata sits beside it rather than under it, so the card is one name tall.
It does not pin: it is the sheet's opening statement, not chrome, and the head band is
the only thing that stays.

The page frame and its corner title block are gone. The border and the block moved onto
the figures on the Projects sheet, where a border around a drawing means something.

The sheet index is a horizontal row in the head band, and the head band is what stays
fixed at 1024px and up. Nothing is reserved horizontally any more, so a drawing gets the
full width of the sheet.

The wireframe still shows the old arrangement; everything else in it holds.

```
+---------------------------------------------------------------- sheet frame -+
|                                                                              |
|  TARUN MALARVASAN                                        ROBOTICS / COMP ENG |  mono caps, --faint
|  --------------------------------------------------------------------------- |
|                                                                              |
|                  +------------------------------------+                      |
|                  |                                    |---- PA12 PRINTED LINK|
|                  |                                    |                      |
|  HARMONIC -------|      HERO - annotated drawing      |                      |
|  DRIVE 50:1      |        of the current build        |---- ODRIVE S1, 40 A  |
|                  |                                    |                      |
|                  +------------------------------------+                      |
|                              |                                               |
|                              +---- FT SENSOR, 6-AXIS                         |
|                                                                              |
|  +--------------------------------------------+                              |
|  | TARUN MALARVASAN - ROBOTICS / COMP ENG     |   3 lines max, mono caps,    |
|  | I BUILD <...>                              |   the one sanctioned         |
|  | CURRENTLY: <...>                           |   prose-adjacent mono use    |
|  +--------------------------------------------+                              |
|                                                                              |
|  ======================= SECTION A-A =======================                 |  real break: intro -> index
|                                                                              |
|  +-------+----------------------------------------------+-------+            |
|  | SHT   | TITLE                                        | REV   |            |
|  +-------+----------------------------------------------+-------+            |
|  | >  1  | HOME                                         |  C    |  > = red   |
|  |    2  | PROJECTS                                     |  C    |            |
|  |    3  | SIX-AXIS FORCE-TORQUE WRIST                  |  B    |            |
|  |    4  | ...                                          |  A    |            |
|  |    5  | NOTEBOOK                                     |  B    |            |
|  |    6  | ABOUT                                        |  A    |            |
|  +-------+----------------------------------------------+-------+            |
|                                                                              |
|                                      +-----------------------------------+   |
|                                      | TARUN MALARVASAN                  |   |  fixed,
|                                      | ROBOTICS / COMPUTER ENGINEERING   |   |  docked to
|                                      +---------+---------+---------------+   |  frame corner
|                                      | SHEET 1 | REV C   | SCALE NTS     |   |
|                                      | 2026-09-08                        |   |
+--------------------------------------+---------+---------+---------------+---+
```

### Home — 375px

```
+-----------------------------+
| TARUN MALARVASAN            |
| ROBOTICS / COMP ENG         |
| --------------------------- |
|                             |
| +-------------------------+ |
| |        (1)              | |
| |  HERO IMAGE      (2)    | |   balloons stay on the
| |     (3)                 | |   image; stub leaders
| |            (4)          | |   shorten, do not vanish
| +-------------------------+ |
|                             |
| (1)-- PA12 PRINTED LINK     |
| (2)-- ODRIVE S1, 40 A       |
| (3)-- HARMONIC DRIVE 50:1   |
| (4)-- FT SENSOR, 6-AXIS     |
|                             |
| TARUN MALARVASAN - ...      |
| I BUILD ...                 |
| CURRENTLY: ...              |
|                             |
| ====== SECTION A-A ======   |
|                             |
| SHT | TITLE          | REV  |
| ----+----------------+----- |
| > 1 | HOME           |  C   |
|   2 | PROJECTS       |  C   |
|   . | ...            |  .   |
|                             |
| --------------------------- |
| TARUN MALARVASAN            |
| ROBOTICS / COMP ENG         |
| SHEET 1 / REV C / NTS       |   title block collapses
| 2026-09-08                  |   into the footer
+-----------------------------+
```

### Project detail — Sheet 3+, desktop

```
+---------------------------------------------------------------- sheet frame -+
|                                                                              |
|  PN-004    REV B    STARTED 2025-09    STATUS ACTIVE                         |  mono caps meta row
|  --------------------------------------------------------------------------- |
|                                                                              |
|  Six-Axis Force-Torque Wrist                                                 |  Plex Sans h1
|  One-sentence summary, Plex Sans, sentence case.                             |
|                                                                              |
|                  +------------------------------------+                      |
|  STRAIN ---------|                                    |                      |
|  GAUGE x4        |            HERO PHOTO              |---- FLEXURE BODY,    |
|                  |                                    |     7075-T6          |
|                  +------------------------------------+                      |
|                                                                              |
|  Body copy in Plex Sans, 72ch measure. Not mono. Not serif - serif is        |
|  reserved for the notebook.                                                  |
|                                                                              |
|  ======================= SECTION A-A =======================   -> id="build" |  marker letter is
|                                                                              |  the anchor target
|  Build                                                                       |
|  Body copy.                                                                  |
|                                                                              |
|  +--------------------------+  +--------------------------+                  |
|  |  GALLERY FIGURE          |  |  GALLERY FIGURE          |                  |
|  |  own callouts            |  |  own callouts            |                  |
|  +--------------------------+  +--------------------------+                  |
|  FIG 2 - caption, mono caps    FIG 3 - caption, mono caps                    |
|                                                                              |
|  ======================= SECTION B-B =======================   -> id="notes" |
|                                                                              |
|  NOTES                                                                       |
|  1.  Rev A flexure yielded at 40 N-m. Rev B thickens the web to 3 mm.        |
|  2.  Bridge amp noise floor 0.8 mV. Next rev moves to shielded twisted pair. |
|  3.  Tools - Fusion 360, Bambu X1C, LTspice.                                 |
|                                                                              |
|  RELATED NOTEBOOK ENTRIES                                                    |
|  +-------+------------------------------------------+------------+           |
|  | NO.   | ENTRY                                    | DATE       |           |
|  +-------+------------------------------------------+------------+           |
|  | 012   | Calibrating the wrist                    | 2026-02-14 |           |
|  +-------+------------------------------------------+------------+           |
|                                      +-----------------------------------+   |
|                                      | TARUN MALARVASAN                  |   |
|                                      | ROBOTICS / COMPUTER ENGINEERING   |   |
|                                      +---------+---------+---------------+   |
|                                      | SHEET 3 | REV B   | SCALE NTS     |   |
|                                      | 2026-02-20                        |   |
+--------------------------------------+---------+---------+---------------+---+
```

---

## 8. Numbering systems

Two systems, deliberately separate, because they count different things.

**Sheets** — the drawing package. `1` Home, `2` Projects index, `3..k` project details in
part-number order, `k+1` Notebook index, `k+2` About. About's number is computed, not
hardcoded, so adding a project does not silently make the title block lie.

**Entries** — the notebook. `ENTRY 001...` by date. Notebook entries are not sheets; a blog
post's title block reads `NOTEBOOK / ENTRY 012` where a sheet would read `SHEET 4`. This is
what lets the drawing language go quiet on the blog without abandoning the metaphor.

Sheet rev letters come from `rev:` in the content frontmatter and the revision date from
`updated:`. They are bumped when the content is actually revised, which is the only way the
title block stays honest.

---

## 9. Quality floor — how each item is met

- **375px** — Single column below 768px, sheet margin drops to 20px, callouts stack, title
  block becomes the footer, tables keep all columns (they are narrow by design).
- **Focus** — `outline: 2px solid var(--annotation); outline-offset: 2px`. Square. This is
  literally an annotation box drawn around the focused element.
- **`prefers-reduced-motion`** — The dimension lines on project rows appear instantly
  instead of drawing in, and the callout cross-highlight snaps rather than easing. Both are
  covered by the global `transition-duration: 0` block; nothing else moves.
- **WCAG AA** — Every text token is checked against both grounds in section 2.
  `--faint-rule` is the only sub-4.5:1 value and is barred from text.
- **Images** — `<Image />` from `astro:assets`, intrinsic width/height emitted,
  `loading="lazy"` except the home hero which is `eager` plus `fetchpriority="high"`.
- **Lighthouse 95+** — About 1 KB of JavaScript on a sheet carrying drawings, and, since
  the reproduction switch, roughly 0.9 KB on the other four — 312 bytes of pin plus a
  563-byte module, both inlined into the page rather than fetched, so the switch costs no
  request anywhere. Callout collision is
  resolved at build time and the cross-highlight is CSS, so the centerpiece still ships no
  script; the one KB wires up the detail viewer, whose own ~1.8 KB is a separate chunk
  fetched only if someone opens a drawing. The switch is two pieces: a blocking inline
  function in the head that applies the pin before first paint, because reading it any
  later flashes the wrong reproduction on every navigation, and a deferred module that
  handles clicks. No framework, no animation library. Fonts are self-hosted, subset,
  preloaded, with metric-matched fallbacks.

---

## 10. Checked against "What this must not become"

Eight rules, and what each one cost.

1. **No paper/blueprint texture image.** Compliant as planned. The grid is two stacked
   `repeating-linear-gradient`s.
2. **No blueprint blue as light-mode ground.** Compliant. Blueprint appears only under
   `prefers-color-scheme: dark`.
3. **No decorative drawing elements.** Three cuts, detailed in section 11 (items 1-3).
4. **No cards.** The projects index, sheet index, revision table and blog index are all one
   `DataTable`. `--radius: 0` and the absence of any shadow token are enforcement, not
   preference.
5. **No fade-and-slide-up entrances.** One cut, section 11 item 4. The rule is a principle
   rather than a count: motion is permitted only where it states a tie or a state change,
   never an entrance. A count says how much may move; it does not say what earns the right
   to, and it goes stale the moment a sixth sheet exists. The callout draw-in cut in
   section 11 item 4 still fails the principle, which is the test of it.
6. **No skeuomorphic paper effects.** The drawing border is a 2px rule, not a drop shadow.
   No curl, no stain, no torn edge, no page shadow.
7. **No monospace body text.** Mono is fenced to metadata by the explicit boundary in
   section 3. The one exception is spec-mandated and capped at three lines.
8. **No arrow appended to links.** One cut, section 11 item 5.

---

## 11. What I revised after that check

Five things in my first pass matched a prohibition and were changed.

1. **Cut corner registration marks and zone letters (A/B/C, 1/2/3), and later the page
   frame itself.** Zone markers are the most seductive drawing detail and pure decoration
   here — they exist so a phone caller can say "see zone B3," and nothing on this site
   references a zone. Rule 3. The frame lasted longer, on the argument that the title
   block docking into its corner made it structural. That argument only ever justified a
   border around a *drawing*, so the border moved to where it is true: around each framed
   figure on the Projects sheet, title block in the corner. Nothing is drawn around the
   page.

2. **Constrained the section marker so it cannot become a decorative divider.** First pass
   had `SECTION A-A` as a general rule between page sections, which is exactly the "section
   markers between unrelated paragraphs" the spec rejects. Now: a section marker is emitted
   only where content genuinely breaks, and the marker letter *is* the anchor id, so
   `SECTION B-B` is a real deep link to `#notes`. It marks a cut and it points somewhere.
   Rule 3.

3. **Cut the balloon numbers from the desktop callout layout.** On desktop the leader line
   already ties dot to text, so a number would be a drawing convention doing no work. They
   appear only in the mobile stacked layout, where they carry the mapping. Rule 3.

4. **Cut the hero callout draw-in animation.** I wanted the leader lines to stroke in on
   load. That is the fade-and-slide-up instinct wearing a better costume. The hero renders
   static. Rule 5.

5. **Cut arrows from "read the write-up" links.** Links are underlined `--reference` text and
   nothing else. Rule 8.

---

## 12. Deviations from the spec, for approval

1. **`--faint` darkened from `#8A8A82` to `#6E6E66`.** The spec's value gives 3.12:1 on
   paper. It is specified for sheet numbers and timestamps, which render at 11-12px, so the
   4.5:1 normal-text threshold applies and the spec's own "all text meets WCAG AA" floor is
   violated by its own token. `#6E6E66` gives 4.59:1 and still reads as clearly quieter than
   ink. The original value survives as `--faint-rule` for hairlines, where the 3:1 non-text
   bar applies and it passes.

2. **Dark-mode link color `#7FB2F0` invented.** The spec assigns blueprint values for ground,
   lines and annotations but not for links, and reference blue `#2A4E8C` is unreadable on
   `#0D2340`. `#7FB2F0` is 7.2:1 on the ground and sits clearly apart from the `#C8D8EC` line
   color in both hue and lightness.

   **Accepted and extended.** The blueprint annotation value the spec did assign — white —
   is the one that had to go. White gives 15.8:1 on the ground, so it never failed a
   contrast check; it failed the rule the contrast check does not measure. Against
   `#C8D8EC` ink it is 1.5:1, separated by lightness alone, so every one of the twenty
   `--annotation` usages stopped reading as a layer laid over the drawing and read instead
   as slightly brighter drawing. `#FF7A6E` is 6.20:1 on the ground and 1.75:1 against ink —
   hue-led, exactly as `#B23A32` is against `#1C1C1A` on paper. The spec now states this
   directly and the deviation is closed.

3. **Scale marker reads `NTS`, not `1:1`.** The title block carries a scale field. A web
   page has no true scale, and `1:1` would be a drawing convention stating something false —
   which is the thing this site is not supposed to do. `NTS` (not to scale) is authentic
   drafting vocabulary for exactly this case. `1:1` remains available if preferred.

4. **`--released: #2E6B3C` / `#6FD08C` added.** A third job for colour, carrying the
   `status` enum that every project already declares and that rendered as monochrome text.
   5.86:1 on paper, 8.32:1 on the blueprint ground. It replaces a genuine misuse: completed
   work was stamped in `--annotation`, which said "annotation added on top of the drawing"
   about a finished part.

