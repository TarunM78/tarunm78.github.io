// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import { checkContent } from './scripts/check-content.mjs';

/**
 * Runs the content gate on every build, however that build was started.
 * An npm `prebuild` hook would be bypassed by a direct `astro build`.
 */
function contentGate() {
  return {
    name: 'content-gate',
    hooks: {
      'astro:config:setup': async ({ command, logger }) => {
        if (command !== 'build') return;
        await checkContent({ log: logger });
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  // Repo is <username>.github.io, so the site serves from the root domain.
  // No `base` is set on purpose; every internal link is root-relative.
  site: 'https://tarunm78.github.io',

  integrations: [mdx(), contentGate()],

  // IBM Plex, self-hosted and subset at build time via the Fontsource provider.
  // Sans: body + headings. Mono: drawing metadata. Serif: blog post body only.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'IBM Plex Sans',
      cssVariable: '--font-plex-sans',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-plex-mono',
      weights: [400, 500, 600],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'SFMono-Regular', 'monospace'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'IBM Plex Serif',
      cssVariable: '--font-plex-serif',
      weights: [400, 600],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['ui-serif', 'Georgia', 'serif'],
    },
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
