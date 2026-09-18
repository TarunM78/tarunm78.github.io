import { getCollection } from 'astro:content';

/**
 * The sheet package.
 *
 * Six top-level sheets — home, projects, experience & awards, notebook, about,
 * photography — and nothing else.
 *
 * Photography was deliberately kept out of this index and reached from a button
 * on the About sheet instead, on the grounds that it carries none of the
 * drawing vocabulary. That was a rule about the contents of the sheet enforced
 * on the index to it: two dozen frames is a sheet by any measure, and a sheet
 * you can only find by reading another sheet first is a sheet most people never
 * find. It is listed. What it does not carry — part numbers, revisions,
 * callouts — is still true of the sheet itself and stays true.
 * Individual projects are not top-level sheets: they are sub-sheets of the
 * projects sheet, numbered 02-1, 02-2 and so on, which is how a real drawing
 * package carries a detail series without inflating the main index. That keeps
 * the index short enough to sit in one row of the head band, and it is why the
 * index reads Home / Projects / Experience / Notebook / About rather than
 * listing every part.
 *
 * Every number is computed, never hardcoded, so adding a project cannot leave a
 * title block claiming a sheet number that no longer exists.
 *
 * Notebook entries are deliberately not sheets at all. They carry entry numbers
 * instead, which is what lets the drawing language go quiet on the blog without
 * abandoning the metaphor.
 */

export interface SheetRef {
  number: number;
  title: string;
  href: string;
}

export interface SubSheetRef {
  /** Printed form, e.g. "02-3". Sub-sheets have no place in the main sequence. */
  label: string;
  partNumber: string;
  title: string;
  href: string;
}

/** The main index: the sheets that get a number of their own. */
export const SHEETS: SheetRef[] = [
  { number: 1, title: 'Home', href: '/' },
  { number: 2, title: 'Projects', href: '/projects/' },
  { number: 3, title: 'Experience', href: '/experience/' },
  { number: 4, title: 'Notebook', href: '/notebook/' },
  { number: 5, title: 'About', href: '/about/' },
  { number: 6, title: 'Photography', href: '/photography/' },
];

/** Sheet number of the projects sheet, which the detail series hangs off. */
const PROJECTS_SHEET = 2;

export async function getSheets(): Promise<SheetRef[]> {
  return SHEETS;
}

/**
 * Projects in part-number order, which is the order they are meant to be read
 * in. The lowest part number leads the series, and the home sheet reads the
 * front of it from here rather than naming a part of its own.
 */
export async function getProjects() {
  return (await getCollection('projects')).sort((a, b) =>
    a.data.partNumber.localeCompare(b.data.partNumber)
  );
}

/** The detail series under sheet 02, in the same order. */
export async function getProjectSheets(): Promise<SubSheetRef[]> {
  const projects = await getProjects();
  return projects.map((p, i) => ({
    label: subSheetNo(i),
    partNumber: p.data.partNumber,
    title: p.data.title,
    href: projectHref(p.id),
  }));
}

/**
 * A detail sheet's own page. Each project has one now, rather than being a
 * block on a single very long sheet — which is what a detail series is: you
 * pull the sheet you want out of the set instead of reading the whole set.
 */
export const projectHref = (id: string) => `/projects/${id}/`;

/** Printed form of a detail sheet in the series, e.g. "02-3". */
export const subSheetNo = (i: number) => `${sheetNo(PROJECTS_SHEET)}-${i + 1}`;

/**
 * Employment in authored order. Not a date sort: two roles can be current at
 * once, and which one leads is a judgement the dates do not encode.
 */
export async function getExperience() {
  return (await getCollection('experience')).sort((a, b) => a.data.order - b.data.order);
}

/** A role with no end date is the one being held now. */
export const isCurrent = (e: { data: { end?: string } }) => !e.data.end;

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** "2026-05" reads as "May 2026"; a bare year is left alone. */
export function month(v: string): string {
  const [y, m] = v.split('-');
  return m ? `${MONTHS[Number(m) - 1]} ${y}` : y;
}

/** A role's span. No end date means the role is current. */
export function period(start: string, end?: string): string {
  return `${month(start)} — ${end ? month(end) : 'Present'}`;
}

/** Awards and honours in authored order. They sit on the experience sheet. */
export async function getAwards() {
  return (await getCollection('awards')).sort((a, b) => a.data.order - b.data.order);
}

/** Release status, stamped the way a drawing package states where a sheet
 *  stands. The wording and the colour travel together so a status cannot be
 *  worded one way and coloured another, and both pages that show a status read
 *  it from here rather than keeping their own copy of the map. */
export function statusStamp(status: 'active' | 'shipped' | 'shelved') {
  switch (status) {
    case 'shipped':
      return { label: 'Complete', class: 'tag-state tag-state--released' };
    case 'shelved':
      return { label: 'Shelved', class: 'tag-state tag-state--superseded' };
    default:
      return { label: 'In build', class: 'tag-state' };
  }
}

/** Zero-padded to two digits, as sheet numbers are written on a drawing. */
export const sheetNo = (n: number) => String(n).padStart(2, '0');
