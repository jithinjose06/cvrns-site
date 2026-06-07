// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Vercel sets production URL in project settings; override with SITE env if needed.
  site: process.env.SITE ?? 'http://localhost:4321',
  server: { port: 4321 },
  adapter: vercel({
    // Edge middleware runs on every request (including static assets) on Vercel.
    middlewareMode: 'edge',
  }),
});
