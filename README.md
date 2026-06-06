# CVRNS - Band Site

Production site for **CVRNS**, an alternative-rock / melodic-metalcore band, built around their debut EP **HERE.AFTER (2025)**. Three pages: **Home**, **Music**, **Store**.

Built with **[Astro](https://astro.build)**. Recreated from the design handoff in `../design_handoff_cvrns_site/` (kept as reference, not shipped).

## Design

Monochrome only - warm bone `#e9e4d8` on cool near-black `#0a0b0d`. No accent hue. Oversized condensed display type (Anton), Archivo body, Space Mono UI labels. Rectangular buttons, film-grain + vignette overlay, scroll-reveal animations, and `prefers-reduced-motion` support. All design tokens live as CSS custom properties in `src/styles/site.css` (`:root`).

## Develop

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # output to dist/
npm run preview  # preview the production build
```

## Code quality

Standards are enforced automatically so cleanup never has to be manual:

```bash
npm run lint           # ESLint (correctness)
npm run format         # Prettier (writes)
npm run format:check   # Prettier (verify only)
npm run typecheck      # astro check
npm run check:encoding # UTF-8 / mojibake guard
npm run build          # prebuild: encoding + copy verification
npm run validate:dist  # HTML + links on dist/ (after build)
npm run suggest-prompts # suggest agent prompts for current diff
```

- **EditorConfig + `.gitattributes`** pin UTF-8 and LF line endings.
- **Prettier** owns formatting; **ESLint** owns correctness. `src/styles/site.css`
  is intentionally hand-formatted (see `.prettierignore`).
- **`predev` / `pretest` / `prebuild`** run encoding (+ copy verification on
  build) before dev, tests, or production output.
- **`validate:dist`** runs `html-validate` and `linkinator` on `dist/` (skips
  `#` placeholder links until launch URLs are wired).
- **Dependabot** (`.github/dependabot.yml`) and **PR template** keep deps and
  review checklists on track. See [`docs/github-setup.md`](docs/github-setup.md)
  for branch protection and secret scanning after first push.
- **Node 20** pinned via `.nvmrc` and `package.json` `engines`.
- **Pre-commit hook** (husky + lint-staged) auto-runs eslint `--fix`, prettier
  `--write`, and the encoding guard on staged files. CI re-runs all of these in
  the `quality` job so nothing slips through if a hook is bypassed.
- `.cursor/rules/coding-standards.mdc` keeps the AI agent aligned with the same
  conventions (DRY, event delegation, UTF-8-safe edits).

> Note: `lint-staged` is pinned to 13.x for Git 2.31 compatibility. If you
> upgrade Git to >= 2.32, you can move back to the latest `lint-staged`.

Past bugs, flakes, and fixes are logged in [`docs/known-issues.md`](docs/known-issues.md).
Reusable session prompts are in [`docs/agent-prompts.md`](docs/agent-prompts.md).
Run `npm run suggest-prompts` (or ask the agent) to get suggestions for your current diff.
`npm run remind:manual` prints context-based manual steps (baseline commit, GitHub remote,
branch protection) when those still apply.

## Testing

End-to-end, accessibility, keyboard, visual, and performance tests run with [Playwright](https://playwright.dev) against the built + previewed site. Functional, accessibility, and keyboard specs run across five engine/profiles: **Chromium**, **Firefox**, **WebKit**, plus **Pixel 5** and **iPhone 13** mobile.

```bash
npm test                 # run the whole suite (all browsers + perf)
npm run test:ui          # interactive runner
npm run test:report      # open the last HTML report
npx playwright test --project=desktop     # single engine, faster local loop
npx playwright test --project=perf        # Lighthouse budget only
npx playwright test --update-snapshots    # refresh visual baselines after intended UI changes
```

- **Functional** (`tests/smoke`, `navigation`, `store`, `interactions`): page loads, routing, cart add/qty/remove/persistence, category filter, mobile drawer (incl. the Cart entry), newsletter mock, reduced-motion.
- **Accessibility** (`tests/a11y`): axe-core scan against WCAG 2.0/2.1 A & AA. Fails the build on violations.
- **Content integrity** (`tests/content` + `npm run check:encoding`): guards against text/encoding corruption (mojibake). The rendered test asserts each page declares UTF-8 and contains no `U+FFFD` replacement characters; the source scan (`scripts/check-encoding.mjs`, also run as `pretest` and in CI) fails fast on non-UTF-8 bytes or a literal `?` left in place of the arrow glyph in an `.ar` span. Both are content-agnostic, so they survive copy edits with no upkeep.
- **Keyboard & focus** (`tests/keyboard`): cart and mobile drawer open with focus moved inside, trap Tab/Shift+Tab, close on `Escape`, and restore focus to the triggering control. Shared logic lives in `src/scripts/focus.ts`.
- **Visual** (`tests/visual`): full-page screenshot baselines per page x viewport in `tests/visual.spec.ts-snapshots/`. Chromium-only; baselines are platform-specific (committed as `-win32`) and are **skipped on CI** - run them locally.
- **Performance** (`tests/perf`, `perf` project): Lighthouse budget per page (performance >= 85, accessibility = 100, best-practices >= 75, SEO >= 95). Runs Chromium over CDP. Best-practices is capped near 77 on Home/Music by the Spotify embed's third-party cookies.

CI runs automatically via GitHub Actions (`.github/workflows/ci.yml`) on push/PR in two jobs: a required **cross-browser** job (encoding check + build + functional + a11y + keyboard + content across all engines) and an informational, non-blocking **Lighthouse** job. The HTML report is uploaded as an artifact.

## Project structure

```
src/
  components/   Nav, Footer, Media (real <img> replacing design-time slots)
  layouts/      Layout.astro - head, fonts, global scripts, nav + footer
  pages/        index.astro (Home), music.astro, store.astro
  scripts/      focus.ts - accessible overlay focus trap (cart + drawer)
  styles/       site.css - design tokens + all styles
public/
  images/       cvrns-logo.png, placeholder.svg (swap in real photos here)
```

## What still needs wiring before launch

These mock pieces are flagged with `// TODO` markers in the code:

1. **Store checkout** (`src/pages/store.astro`) - cart UI/filter work and persist to `localStorage`; the **Checkout** button is mocked. Wire to **Shopify Storefront API** or **Stripe Checkout**.
2. **Newsletter** (`src/layouts/Layout.astro`) - the form intercepts submit but does not post anywhere. Connect to **Mailchimp / Klaviyo / Beehiiv**.
3. **Photography** - every `<Media>` uses `public/images/placeholder.svg`. Drop real images into `public/images/` and pass them via the `src` prop (slot ids: `release-art`, `feat-1`, `feat-2`, `m-art-1`, `p-vinyl`, `p-tee`, `p-hoodie`, `p-poster`, `p-cap`, `p-long`).
4. **Links** - placeholder `#` hrefs (Apple Music, Bandcamp, YouTube, socials, store policies) need real URLs.

The **Spotify embed is real** (album `0cLwfhERSggSwKM7PwPqu6`) and the hero is hard-coded to the **monolith** layout, per the handoff spec.

## Secrets

Never commit API keys. Use `.env.local` (gitignored) locally; set the same vars in your host (Vercel/Netlify) for production.
