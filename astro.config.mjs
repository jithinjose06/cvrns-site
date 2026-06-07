// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages project site uses PAGES_* only in the deploy workflow.
// Local dev and CI tests keep base "/" (no env vars).
const site = process.env.PAGES_SITE ?? 'http://localhost:4321';
const rawBase = process.env.PAGES_BASE ?? '/';
const base = rawBase === '/' ? '/' : rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

// https://astro.build/config
export default defineConfig({
  site,
  base,
  server: { port: 4321 },
});
