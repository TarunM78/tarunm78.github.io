# Personal site build spec

You are building a personal portfolio and blog for a mechanical engineering student and researcher working on robotics and humanoids. Read this whole file before writing any code.

## How to work

1. First, produce a short design plan: token system (color, type, spacing), the component vocabulary, and ASCII wireframes for the home page and a project page. Do not write code yet.
2. Check the plan against the "What this must not become" section below. Revise anything that matches, and say what you changed.
3. Build the home page only. Stop. Screenshot it and critique it against this spec.
4. Then build the rest.

## Stack

Astro, with MDX for blog posts and project write-ups. Fully static output, deployed to GitHub Pages. No CMS, no database, no SSR adapter. Content lives in `src/content/` as markdown with frontmatter, so posts are added by committing a file.

## Deployment

The repository is named `<username>.github.io`, so the site serves from the root domain. Set `site: 'https://<username>.github.io'` in `astro.config.mjs` and do **not** set a `base`. Every internal link and asset path is written as root-relative.

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v7
      - name: Install, build, and upload site
        uses: withastro/action@v6
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

In the repo settings, Pages source must be set to **GitHub Actions**, not "Deploy from a branch." The workflow file has to be on the default branch to run at all.

Add a `public/.nojekyll` file. Without it GitHub's Jekyll layer strips directories beginning with an underscore, which silently breaks Astro's build output.

Images live in `src/assets/` and go through Astro's `<Image />` component so they are optimized at build time. Do not put project photos in `public/`, they will ship unoptimized and the hero images on this site are large.

Custom domain later: add a `public/CNAME` file containing the domain and point a CNAME DNS record at `<username>.github.io`. Nothing else in the build changes.

Tailwind for layout utilities only. All drawing-specific components get real CSS in a design-system file, not utility soup. Do not install a component library. No shadcn.

## The core concept

The site borrows the *information grammar* of mechanical engineering drawings, not the texture of them. Real drawings encode meaning through title blocks, revision tables, part numbers, leader lines, callouts, section markers, dimension lines, and notes blocks. Every one of those has a job. On this site, each drawing convention must also carry real information. Nothing from the drawing vocabulary is allowed to appear as pure decoration.

The site is a set of sheets. The visitor is reading a drawing package.

## Color

Paper, not blueprint. This is a firm decision.

- `--paper: #F7F5EF` warm off-white, the page background
- `--ink: #1C1C1A` near black, all body text
- `--grid: #DCDCD2` the printed grid, extremely light
- `--annotation: #B23A32` muted drafting red, for callouts, leader lines, revision marks, and the current-page indicator
- `--reference: #2A4E8C` reference blue, used *only* for links and interactive elements
- `--released: #2E6B3C` release green, used *only* to stamp completed work
- `--faint: #8A8A82` for secondary metadata, sheet numbers, timestamps

A hue enters this system only when it names a class of information, and it has to hold that meaning in both themes. A colour that survives one theme and collapses in the other was never carrying the meaning; it was carrying the theme. Three jobs are defined, and nothing is added without a fourth job to name:

- Red means "annotation added on top of the drawing."
- Blue means "you can click this."
- Green means "released" — the status already authored on every project.

None of them is ever used for general emphasis or decoration.

Dark mode inverts to a true blueprint: `#0D2340` ground, `#C8D8EC` lines. This is the only place blueprint blue is permitted. Annotations stay red there — `#FF7A6E`, 6.20:1 on the ground — because that is the rule above applied honestly: white annotations separated from `#C8D8EC` ink by lightness alone, so the annotation layer stopped reading as a layer and the theme collapsed to blue and white. Red on a blueprint is not an invention; redlining is the one mark on a blueprint that was never blue.

## Type

IBM Plex, whole family. It has genuine technical and industrial provenance, and gives sans, mono, and serif that already harmonize.

- Plex Sans for body copy and headings
- Plex Mono for every piece of drawing metadata: sheet numbers, part numbers, revision tables, dimensions, callout text, timestamps
- Plex Serif for blog post body text only, at generous line height, max 68 characters per line

Metadata in mono is set in caps with wide letterspacing, matching drafting convention. This is deliberate and specific to the brief. Do not extend caps-mono to headings or body text anywhere else on the site.

## Component vocabulary

Build these as real, reusable components. Each carries information.

**Title block.** Lower-right, as on a real drawing — and it belongs to a drawing, not to a page. It docks into the corner of a framed figure on the Projects sheet, where its outer edges and the drawing border are the same two lines. Contains the part number, title, rev, scale, medium, and the drafter's initials. Not the full name: that is stated once, in the sheet's identity strip, and five copies of it would be five statements of one fact.

**Sheet index.** The navigation. Sheet number, title, rev, with the current sheet marked by a red triangle. Sheet 02 carries its detail series beneath it, opening on hover or keyboard focus — the sub-sheet listing a drawing index gives a series, so the main index stays one line. Five items only — Home, Projects, Experience, Notebook, About — laid out in one horizontal row at the right of the head band. It was a bordered column down the right-hand side of every sheet, which spent 20rem of width on a handful of links; the drawings need that width more. Individual projects are sub-sheets of sheet 02 (02-1, 02-2, ...) and are listed on that sheet, not in the index: an index that grew with every part would stop fitting on one line and stop being an index.

**Revision table.** The About/experience page, in full. Columns: REV / DATE / DESCRIPTION / BY. Each role, lab, or award is a revision. Read bottom-up, oldest first, exactly as a real drawing.

**Callout with leader line.** A thin red line from a point on a photo out to a mono caption. Implemented in SVG, positioned by coordinates in the MDX frontmatter so callouts can be authored per image. This component is the centerpiece of the project pages and it must work well on mobile, where callouts stack below the image and the leader lines shorten rather than disappear.

Callouts are live. Pointing at either end of a leader — the label or its anchor dot — states that one tie louder and drops the rest of the figure back, which is what a finger on a drawing does. A leader's job *is* to tie a label to a feature, so this is that job rather than an effect added on top of it; nothing is highlighted that was not already pointing at something. Clicking a label pins it, because the label is a button and focus outlives the pointer. It costs no JavaScript.

**Detail viewer.** A framed drawing opens full-window, where it can be zoomed and panned: what you do with a real sheet when you want to read a detail. The sheet travels whole — image, leaders, labels, title block — because it is one drawing. Zoom resizes the sheet rather than scaling a picture of it, so leader lines stay true weight at any magnification and the callout text stays readable, and it stops at 1.5x the image's own pixels, because past that you are looking at interpolation and this site does not present interpolation as detail. It is the only part of the site that needs script, it is loaded only when a drawing is actually opened, and without it every drawing still reads in place.

**Part number.** Every project gets `PN-0XX` and a rev letter, displayed in the project header and the index. Assign them in order of when the project started.

**Notes block.** The footer of a project page. A numbered list of notes in drawing style, used for real content: what failed, what the next revision changes, what tools were used.

**Section marker.** Used between major page sections, styled as a section cut symbol (A-A, B-B). Only where there is an actual break in content.

**Grid.** A CSS-drawn 5mm grid on the paper background, roughly 8% opacity, with a heavier line every fifth. Drawn in CSS, never an image texture. It sits at the very back and must never fight the text.

## Pages

**Home (Sheet 1).** A title sheet that runs into the package. The first screen carries the essentials only — the name at display size, its metadata beside it, and the index in the head band — because a full annotated drawing on load is a wall. The name is the one thing on the site set at display size, and the only h1 outside a sheet heading. Nothing on this sheet is pinned; the head band is what stays.

Below the fold it is a continuous scroll through the front of each index, one section per sheet it leads to: the current drawing at SECTION A-A, the current role at SECTION B-B, each showing the first entry with a link to the rest. A scroll cue at the fold says how many sections follow and links to the first, because an empty first screen has to state that there is more below it. Below the fold, at SECTION A-A, the current work: one hero project image or line drawing with three or four red callouts pointing at real components, then a link through to the rest of the series. The home figure is bare: no border, no title block. Those start on the Projects sheet.

**Experience (Sheet 3).** Current and past employment in authored order, current work first, drawn as a contact sheet — the same grid the projects use, because both are a set of sheets. Each card carries the period, location, role, organisation, one sentence, the drawing the work produced, and a part number where the role produced one. A portrait drawing takes two frames of the grid, so the set packs flush rather than leaving a ragged cell. Five roles: the rest of the history is not on the site. It was an index of the roles followed by a full block for each one, carrying three bullets apiece; that is a resume retyped as a web page, and it read like one. Roles carry no part numbers of their own: a job is not a part and has no revision, and inventing a PN for one would be the drawing vocabulary used as decoration. Order is explicit rather than derived from the dates, because two roles can be current at once and the more recently started one is not automatically the one to lead with — it is also what places the tall sheet in the second column. The awards used to close this sheet and no longer do; `src/content/awards.json` is still on disk, unrendered.

**Photography (not a sheet).** A hobby page reached from About, and the one place the drawing vocabulary steps back — including the sheet number, because the index of a drawing package should not list a page that is not part of it: no part numbers, no revisions, no callouts, because a photograph is not a part. What carries over is the plate — a bordered frame with a mono caption strip — and the contact-sheet reading of the grid. Filtered by subject (nature, places, cars) with a radio group and one `:checked ~` rule per category, so it costs no JavaScript and gets keyboard and screen-reader behaviour from the browser. Masonry by CSS columns rather than a fixed ratio, so a portrait frame is not cropped to match the landscape ones.

**Projects (Sheet 2).** The detail series as a set of sheets, not one very long one. A table of the sub-sheets — sheet, PN, title, rev — then the drawings as a contact sheet, two up, each carrying its designators, its title block and a way through to its own sheet. Callouts are deliberately absent at this size: a leader label needs a 26% gutter either side, and at grid width there is none, so the annotation lives on the detail sheet where it fits. Reading PN-005 no longer means scrolling past four complete drawings. Work still in build is marked the way a current role is on sheet 03: the index row inked, and a Current tag in annotation red on the block — on sheet 03 the ink is now the rule across the top of the role's cell, the index it used to mark having gone.

**Project detail (Sheets 02-1 and up).** One sheet per project, at `/projects/<slug>/`. Header with part number, revision, status and date; the drawing at full sheet width with its callouts live and a zoom control; body copy in Plex Sans; notes block; the external link; and a footer giving the sheets either side and the way back to the set. The head band states the real sub-sheet number — `SHEET 02-3` — and the index still marks sheet 02 as current, because that is the sheet this hangs off. A photo gallery per sheet is still to come.

**Blog index.** Notebook entries, listed by date and entry number. Until there are real entries the sheet says so on a dashed pending plate — the same plate a figure with no drawing on file gets — rather than standing in placeholder logs.

**About (Sheet 6).** One section and no prose. SECTION A-A is the revision table, the career read as a drawing reads its own history: oldest first, bottom-up, the last row being where things stand now. The awards used to sit below it at SECTION B-B; they are on sheet 03 now, beside the roles and the drawings they were given for.

**Blog post.** This is where the drawing language goes quiet. There is no drawing and so no title block. Grid drops to near-invisible, no callouts, no part numbers. Plex Serif body, single column, 68 characters. Just the entry number at the top. Reading comfort beats theme here, always.

**About (Sheet N).** The revision table, full width, plus a short paragraph.

## What this must not become

Reject these outright:

- A paper or blueprint texture image. The grid is CSS.
- Blueprint blue as the light-mode background.
- Any drawing element used decoratively. No dimension lines that do not measure something, no section markers between unrelated paragraphs, no part numbers on things that are not projects.
- Cards. This site uses tables, sheets, and rules. Not rounded rectangles with soft shadows.
- Fade-and-slide-up entrance animations on every section. One motion moment total, on the project index rows.
- Skeuomorphic paper effects: drop shadows on the page, curled corners, coffee stains, torn edges.
- Monospace applied to body text.
- A "→" appended to link text.

## Content

Content is authored in MDX. Real content is preferred, but placeholder content is permitted during the build so layout work is not blocked.

Every placeholder file must carry `placeholder: true` in its frontmatter. Add a prebuild check that scans `src/content/` and fails the build with a non-zero exit if any file has `placeholder: true`, unless the environment variable `ALLOW_PLACEHOLDER=1` is set. Local dev sets it, the GitHub Actions workflow does not. This means placeholder content can never reach the deployed site.

In dev only, render a thin red diagonal hatch across any placeholder project card and a `PRELIMINARY - NOT FOR CONSTRUCTION` stamp across the page, which is the real drawing convention for unapproved sheets. Fitting, and impossible to miss.

Placeholder text should be plausible robotics content, not lorem ipsum, so line lengths and wrapping behave like the real thing.

Content model for a project:

```yaml
partNumber: PN-005
rev: B
title:
started: 2025-09
status: active | shelved | shipped
attribution: solo | team
attributionNote:        # required when attribution is team; one line naming your own contribution
externalLink:           # optional, e.g. an ISEF project page
externalLinkLabel:
summary:
heroImage:
heroImageType: photo | render | drawing
placeholder: false
callouts:
  - x: 0.42
    y: 0.31
    text: PA12 PRINTED LINK
notes:
  - text:
tags: []
```

Enforce `attribution` in the content collection schema as a required field with no default. A project marked `team` renders a mono `TEAM PROJECT` tag beside the part number in both the index table and the project header, and fails the build if `attributionNote` is empty. This is a correctness rule, not a style choice: an unmarked team project misrepresents authorship, so the build should not let it through.

`heroImageType: render` or `drawing` renders a small mono label under the image saying so. Computational projects should not read as photographed hardware.

## Quality floor

Responsive to 375px. Keyboard focus visible and styled as a red annotation box. `prefers-reduced-motion` respected. All text meets WCAG AA against paper and against blueprint. Images lazy-loaded with width and height set. Lighthouse performance above 95 on the static build.
