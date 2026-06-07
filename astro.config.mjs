// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Vercel sets production URL in project settings; override with SITE env if needed.
  site: process.env.SITE ?? 'http://localhost:4321',
  server: { port: 4321 },
});
