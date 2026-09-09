# Design plan — REV B delta

Amends `DESIGN.md` (REV A) for the updated `SITE-SPEC.md` and the new `CONTENT.md`.
Everything in REV A not contradicted here still stands.

---

## 1. Content is now real. Sheet numbering resolves.

`CONTENT.md` supplies four projects, the identity block, the revision table and the hero
callouts. Nothing carries `placeholder: true`. Part numbers are already assigned in start
order by the manifest, so the sheet package is fixed:

| Sheet | Content                                        |
|-------|------------------------------------------------|
| 1     | Home                                           |
| 2     | Projects index                                 |
| 3     | PN-001 · DIVA                                  |
| 4     | PN-002 · SAAR                                  |
| 5     | PN-003 · Auxetic stents                        |
| 6     | PN-004 · Low-cost bimanual humanoid arm        |
| 7     | Notebook index                                 |
| 8     | About (revision table)                         |

About is still computed as `last`, not hardcoded to 8, so adding a project cannot make the
title block lie.

The revision table has eight rows, A through H, oldest first. Six of the eight dates are
`TODO`. Sheet rev letters for the About sheet therefore start at REV H.

---

## 2. New frontmatter fields, and where each one surfaces

```yaml
attribution: solo | team      # required, no default
attributionNote:              # required non-empty when attribution: team
externalLink:
externalLinkLabel:
heroImageType: photo | render | drawing
placeholder: false
```

Enforcement lives in the Zod schema in `src/content.config.ts`, using
`superRefine` so `team` + empty `attributionNote` is a schema error, not a runtime check.
That makes it fail at build time with a file path, which is what the spec is asking for.

**Three new render targets, each carrying information:**

- **`AttributionTag`** — mono `TEAM PROJECT` beside the part number, in both the index row
  and the project header. Rendered **only** for `attribution: team`. Solo projects render
  nothing; absence is the default state, and a `SOLO PROJECT` tag on every other row would
  be exactly the decorative badge the spec forbids.
- **`ImageTypeLabel`** — small mono caps `RENDER` or `DRAWING` under the figure. Rendered
  only for those two values; `photo` renders nothing, for the same reason. PN-003 is the
  live use site: it is computational, and the manifest is explicit that a render is the
  honest artifact.
- **`ExternalLink`** — reference blue, underlined, no arrow. Three of the four projects
  carry an ISEF link.

---

## 3. TODO markers

`CONTENT.md` marks unfilled fields `TODO` and calls for them to render as a visible red
marker in dev. These are **not** placeholder files, so the placeholder gate does not catch
them and they will reach the deployed site.

**`TodoMarker`** renders `TODO` plus its trailing text in mono caps, `--annotation` red, in
both dev and production. In dev it additionally gets a 1px annotation outline.

This is deliberate and it is drawing-correct: released sheets routinely ship with open
fields, and marking them in red is what a drafter does. The alternative — hiding them in
production — would make the deployed site quietly drop content, and would hide the one case
below that actually matters.

**The case that matters.** PN-001 and PN-002 are `attribution: team`, and their
`attributionNote` currently reads `TODO: state your specific contribution in one line.`
That is non-empty, so it satisfies the spec's schema rule and the build passes — while the
authorship note says nothing about authorship. The spec's own reasoning ("an unmarked team
project misrepresents authorship, so the build should not let it through") applies here
too, just one level down.

Resolution: the schema enforces non-empty as specified, and the content check reports every
`TODO` with its file and field as a build warning. `STRICT_TODO=1` escalates those warnings
to a failing exit. It is off by default so the build is not blocked today, and it is there
to be switched on once the fields are filled.

---

## 4. Placeholder gate

`scripts/check-content.mjs`, zero new dependencies.

- Scans `src/content/**/*.{md,mdx}` and reads the frontmatter block.
- Exits non-zero on any `placeholder: true` unless `ALLOW_PLACEHOLDER=1`.
- Reports every `TODO` found, with file and field. Fails on them only under `STRICT_TODO=1`.
- Also gates the dev-only `src/pages/test/` route, so isolated component test pages cannot
  reach a production build either.

**Where it runs.** Registered as a tiny inline Astro integration in `astro.config.mjs`,
gated to `command === 'build'`. This is more robust than an npm `prebuild` hook, which is
bypassed if anything invokes `astro build` directly rather than `npm run build` — including
some CI runner configurations. As an integration it runs on every build, however that build
was started. `npm run check:content` runs it standalone.

**Frontmatter parsing.** A ~40-line scanner over the `---` block rather than a YAML
library. `js-yaml` is physically present in `node_modules` but only as a transitive
dependency of Astro, and reaching into another package's dependency tree is the kind of
thing that breaks silently on a minor upgrade. The keys the gate needs (`placeholder`,
`attribution`, `attributionNote`) are top-level scalars. Full type validation is Zod's job,
not the gate's.

**Dev sets the flag, CI does not.** `npm run dev` and `npm run build:local` set
`ALLOW_PLACEHOLDER=1` through a small Node wrapper rather than an inline `VAR=value` prefix,
which does not work on Windows shells. `npm run build` — what `withastro/action` invokes —
sets nothing, so the gate is armed in CI.

---

## 5. Dev-only preliminary marking

Two marks, both `import.meta.env.DEV` only, both CSS.

- **Hatch** — 45-degree `repeating-linear-gradient` in `--annotation` at low alpha across a
  placeholder project's index row and its sheet body.
- **Stamp** — `PRELIMINARY - NOT FOR CONSTRUCTION` in large mono caps, rotated, low alpha,
  `position: fixed`, `pointer-events: none`, `aria-hidden`.

Neither is an image texture, so both stay inside the "grid is CSS" rule.

**One inconsistency worth naming.** The updated spec says to hatch "any placeholder project
card," but the same spec's prohibitions reject cards outright. I am reading this as the
project's index *row* and its sheet, since that is what the site actually has. No card is
being introduced to hold a hatch.

**No live use site today.** Every file from `CONTENT.md` is real, so nothing will be
hatched or stamped. The mechanism is still built and is verified against a temporary
fixture, then the fixture is removed.

---

## 6. Hero image

`CONTENT.md` specifies the hero as PN-004, an orthographic side view of one assembled joint
module. That image does not exist yet and I will not fabricate it: an invented line drawing
of a real GIM6010-8 joint module would be a made-up depiction of specific hardware
presented as the honest artifact, which is the failure mode this whole spec is organised
against.

For step 3's isolated test I generate an obvious **calibration target** instead — a gridded
fixture with crosshairs at the exact four coordinates from the manifest and their numeric
values printed beside them. It is unmistakably a test fixture, it makes anchor placement
verifiable to the pixel rather than by eye, and it is deleted before deploy.

---

## 7. Component vocabulary, updated count

REV A listed twelve. REV B adds four, all information-carrying, none decorative:

13. **`AttributionTag`** — team authorship. Team only.
14. **`ImageTypeLabel`** — render/drawing medium. Non-photo only.
15. **`TodoMarker`** — unfilled field. Red, mono, ships.
16. **`PreliminaryStamp`** — unapproved sheet. Dev only, includes the hatch.

`ExternalLink` is not a component; it is a link with the standard `--reference` styling.
