import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';

/**
 * Content schemas.
 *
 * These are the enforcement layer. The prebuild gate in scripts/check-content.mjs
 * handles the placeholder rule and reports open TODOs, but everything that is a
 * correctness rule about a single file lives here, so it fails at build time
 * with a file path attached.
 */

const callout = z.object({
  /**
   * Position on the image, 0..1. Both optional: several projects have their
   * callout text written but no photograph to place it on yet. An unplaced
   * callout renders in the list beneath the figure rather than being given
   * invented coordinates.
   */
  x: z.number().min(0).max(1).optional(),
  y: z.number().min(0).max(1).optional(),
  text: z.string().min(1),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z
      .object({
        partNumber: z.string().regex(/^PN-\d{3}$/),
        rev: z.string().regex(/^[A-Z]$/),
        title: z.string().min(1),
        /** YYYY-MM or YYYY. Absent while the date is still an open field. */
        started: z.string().regex(/^\d{4}(-\d{2})?$/).optional(),
        status: z.enum(['active', 'shelved', 'shipped']),

        /** Required, no default. An unmarked team project misrepresents authorship. */
        attribution: z.enum(['solo', 'team']),
        /** Required and non-empty when attribution is team. Checked below. */
        attributionNote: z.string().optional(),

        externalLink: z.string().url().optional(),
        externalLinkLabel: z.string().optional(),

        summary: z.string().min(1),
        heroImage: image().optional(),
        heroImageType: z.enum(['photo', 'render', 'drawing']).default('photo'),
        heroImageAlt: z.string().optional(),

        placeholder: z.boolean().default(false),
        callouts: z.array(callout).default([]),
        notes: z.array(z.object({ text: z.string().min(1) })).default([]),
        tags: z.array(z.string()).default([]),
      })
      .superRefine((data, ctx) => {
        if (data.attribution === 'team' && !data.attributionNote?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['attributionNote'],
            message:
              `${data.partNumber} is a team project, so attributionNote is required and ` +
              `must name your own contribution. An unmarked team project misrepresents authorship.`,
          });
        }
        if (data.externalLink && !data.externalLinkLabel) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['externalLinkLabel'],
            message: `${data.partNumber} has an externalLink with no externalLinkLabel to name it.`,
          });
        }
      }),
});

/**
 * Employment, current and past.
 *
 * Roles are not parts, so they carry no part number: a job is not a thing with a
 * revision. An entry with no `end` is the current one — which is why `end` is
 * optional rather than carrying a "Present" string that would have to be kept
 * true by hand.
 *
 * Order is explicit rather than derived from the dates. Two roles can be current
 * at once and the more recently started one is not automatically the one to lead
 * with, so a date sort would reorder the resume rather than reproduce it.
 */
const experience = defineCollection({
  loader: glob({ base: './src/content/experience', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z
    .object({
      /** Position in the list, 1-based. Lower comes first. */
      order: z.number().int().positive(),
      role: z.string().min(1),
      org: z.string().min(1),
      location: z.string().min(1),
      /** YYYY-MM or YYYY. */
      start: z.string().regex(/^\d{4}(-\d{2})?$/),
      /** Absent means the role is current. */
      end: z.string().regex(/^\d{4}(-\d{2})?$/).optional(),
      summary: z.string().min(1),
      /**
       * The drawing that stands for the work. Optional: a role without one gets
       * the same pending plate a project does, rather than a stand-in.
       */
      heroImage: image().optional(),
      heroImageType: z.enum(['photo', 'render', 'drawing']).default('drawing'),
      heroImageAlt: z.string().optional(),
      /** Part numbers of projects this role produced. */
      relatedProjects: z.array(z.string().regex(/^PN-\d{3}$/)).default([]),
      notes: z.array(z.object({ text: z.string().min(1) })).default([]),
      placeholder: z.boolean().default(false),
    })
    .superRefine((data, ctx) => {
      if (data.end && data.end < data.start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['end'],
          message: `${data.org}: end (${data.end}) is before start (${data.start}).`,
        });
      }
    }),
});

/**
 * The notebook. Entries are not sheets: they carry an entry number, and the
 * drawing language goes quiet on them.
 */
const notebook = defineCollection({
  loader: glob({ base: './src/content/notebook', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    entry: z.number().int().positive(),
    title: z.string().min(1),
    date: z.coerce.date().optional(),
    summary: z.string().optional(),
    placeholder: z.boolean().default(false),
    /** Part numbers of projects this entry belongs to. */
    relatedProjects: z.array(z.string().regex(/^PN-\d{3}$/)).default([]),
  }),
});

/**
 * Awards and honours. Rows, so one data file rather than ten documents.
 *
 * `relatedProjects` is what stops this becoming a separate, drifting account of
 * the same work: an award for the stents points at PN-003 rather than restating
 * it. Order is explicit, because several share a month and the tie is a
 * judgement about which mattered more.
 */
const awards = defineCollection({
  loader: file('./src/content/awards.json'),
  schema: z.object({
    id: z.string(),
    /** Position in the list, 1-based. Lower comes first. */
    order: z.number().int().positive(),
    title: z.string().min(1),
    /** Who gave it. */
    body: z.string().min(1),
    /** YYYY-MM or YYYY. */
    date: z.string().regex(/^\d{4}(-\d{2})?$/),
    relatedProjects: z.array(z.string().regex(/^PN-\d{3}$/)).default([]),
    notes: z.array(z.string().min(1)).default([]),
  }),
});

/**
 * Photography. A hobby, so it carries none of the drawing vocabulary: no part
 * numbers, no revisions, no callouts. What it does carry is a category, which
 * is what the sheet filters on, and alt text, which is required rather than
 * optional — a gallery of two dozen images with no alt text is the single
 * easiest way to make a site unusable.
 *
 * One data file rather than 24 content files, the same way the revision table
 * is one file: these are rows, not documents. `file` is resolved against
 * src/assets/photography at build time by the page, which fails loudly if a
 * row names an image that is not there.
 */
const photography = defineCollection({
  loader: file('./src/content/photography.json'),
  schema: z.object({
    id: z.string(),
    /** Filename within src/assets/photography. */
    file: z.string().regex(/^[a-z0-9_-]+\.jpg$/),
    category: z.enum(['nature', 'places', 'cars']),
    title: z.string().min(1),
    /** Required. See the note above. */
    alt: z.string().min(1),
  }),
});

/**
 * Where else to find him. Rows, so one data file rather than four documents.
 *
 * `url` carries the literal string TODO until a profile is actually confirmed,
 * which is what puts it in front of the content gate rather than letting an
 * empty link quietly ship. A row whose url is still TODO renders as a marked
 * open field, never as a link that goes nowhere.
 */
const links = defineCollection({
  loader: file('./src/content/links.json'),
  schema: z.object({
    id: z.string(),
    /** Position in the list, 1-based. Lower comes first. */
    order: z.number().int().positive(),
    service: z.string().min(1),
    handle: z.string().min(1),
    url: z.string().min(1),
  }),
});

export const collections = { projects, experience, awards, photography, notebook, links };
