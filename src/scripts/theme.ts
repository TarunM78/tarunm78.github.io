/**
 * Wiring for the reproduction switch.
 *
 * The theme itself is applied by the inline script in the head, before first
 * paint. This file only handles clicks and keeps the buttons' pressed state
 * honest, so it can load whenever it likes.
 *
 * `data-theme` on the root is the pin. Its absence means nothing is pinned and
 * the OS preference is still in charge, which is the state every sheet starts
 * in until someone chooses.
 */
const KEY = 'sheet-theme';
const root = document.documentElement;
const dark = matchMedia('(prefers-color-scheme: dark)');

type Theme = 'light' | 'dark';

/** What the sheet is actually being reproduced as: the pin if there is one,
 *  otherwise whatever the OS asked for. */
function current(): Theme {
  const pinned = root.getAttribute('data-theme');
  if (pinned === 'light' || pinned === 'dark') return pinned;
  return dark.matches ? 'dark' : 'light';
}

const options = document.querySelectorAll<HTMLButtonElement>('[data-theme-set]');

function mark(theme: Theme) {
  for (const opt of options) {
    opt.setAttribute('aria-pressed', String(opt.dataset.themeSet === theme));
  }
}

for (const opt of options) {
  opt.addEventListener('click', () => {
    const theme = opt.dataset.themeSet as Theme;
    root.setAttribute('data-theme', theme);
    /* Private browsing and blocked site data both throw here. A switch that
       works for this page but forgets is better than one that fails. */
    try {
      localStorage.setItem(KEY, theme);
    } catch {}
    mark(theme);
  });
}

mark(current());

/* Nothing is pinned until someone picks, so until then the OS is still in
   charge and the marked button follows it. */
dark.addEventListener('change', () => {
  if (!root.hasAttribute('data-theme')) mark(current());
});
