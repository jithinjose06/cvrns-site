# Known issues log

Historical bugs, false positives, and environmental problems uncovered while
building and hardening the CVRNS site. Use this when something breaks and the
cause is not obvious from the latest diff.

**Last updated:** 2026-06-06

---

## How to use this log

1. Match your symptom to a section below.
2. Check whether it is an **app bug**, **test flake**, **tooling**, or **environment**.
3. Follow the documented fix or guard; do not re-discover from scratch.

Related automation: `npm run check:encoding`, `npm run lint`, `npm run typecheck`,
Playwright suite, CI `quality` + `test` jobs.

---

## 1. Encoding / mojibake (highest impact)

### Symptoms

- `?` appears next to buttons where an arrow was intended (should be U+2197 NE ARROW).
- Garbled sequences like `?"` instead of an em dash, or wrong punctuation in tags.
- `U+FFFD` replacement character in rendered HTML or source files.
- `check:encoding` or `tests/content.spec.ts` fails.

### Root cause

On this Windows dev environment, some editor/agent file-write tools silently
re-encode UTF-8 source as Windows-1252/Latin-1. When those bytes are later read
as UTF-8, glyphs corrupt or become literal `?`.

The Read tool in the IDE can _display_ valid UTF-8 em dashes as `?"` even when
on-disk bytes are correct (`e2 80 94`). Always verify with:

```bash
node -e "const fs=require('fs');const b=fs.readFileSync('PATH');console.log([...b.slice(0,80)].map(x=>x.toString(16)).join(' '))"
```

### Fixes applied

- `scripts/check-encoding.mjs` -- source guard (invalid UTF-8, U+FFFD, literal `?` in `.ar` spans).
- `tests/content.spec.ts` -- rendered-page guard (charset meta, no U+FFFD in DOM).
- `pretest` hook and CI step run encoding check before Playwright.
- Glyph-bearing `.astro` / `site.css` edits done via Node `fs` utf8 read/write or
  `prettier --write`, then `npm run check:encoding`.
- Test/docs files kept ASCII-only where possible to avoid re-corruption.

### Secondary bug during repair

A one-off `repair.mjs` script incorrectly converted middots (`?`) to em dashes
in `store.astro` product tags. Fixed with a targeted `fixmid.mjs` pass. Lesson:
repair scripts need assertions per glyph, not blind substitution.

### CRLF mismatch during Node edits

Batch replace scripts that assumed `\n` failed on CRLF files (`Footer.astro`,
`store.astro`). Fix: detect `nl = s.includes('\r\n') ? '\r\n' : '\n'` and
normalize replacement strings.

---

## 2. Playwright / CI flakes

### NS_ERROR_CONNECTION_REFUSED

- **Symptom:** Firefox or Chromium tests fail mid-run connecting to preview server.
- **Cause:** Preview server under load during long cross-browser runs; not an app bug.
- **Fix:** `playwright.config.ts` retries raised to `2` in CI, `1` locally.

### WebKit worker hang / Norton false positive

- **Symptom:** `WebKitNetworkProcess.exe` blocked; worker did not exit within 300s.
- **Cause:** Norton flagged `IDP.generic` on Playwright WebKit process (environmental).
- **Fix:** User added Norton exception. Confirmed not a problem on Linux CI.
- **Note:** Do not treat as application failure on Windows with AV interference.

### Clear-cart test: overlay intercepts click

- **Symptom:** Second `.product__add` click failed while cart drawer open.
- **Cause:** Cart overlay covered product buttons.
- **Fix:** Test bumps quantity via `[data-act="inc"]` inside the open drawer instead.

### Smoke test: `.footer__giant` text assertion

- **Symptom:** `toHaveText('CVRNS')` failed after a11y refactor.
- **Cause:** Watermark text moved to CSS `::before`; DOM element is empty by design.
- **Fix:** Assert `toBeVisible()` + `aria-hidden="true"` instead of text content.

---

## 3. Accessibility / Lighthouse (real app bugs)

| Issue                 | Symptom                                | Fix                                                                             |
| --------------------- | -------------------------------------- | ------------------------------------------------------------------------------- |
| `color-contrast`      | Footer watermark flagged               | Text via `.footer__giant::before`, `aria-hidden` on container                   |
| `heading-order`       | Footer `h5`, store `h3` skipped levels | Promoted to `h2`; CSS selectors updated                                         |
| `landmark-one-main`   | No main landmark                       | Wrapped page content in `<main id="main">`                                      |
| Render-blocking fonts | Low perf score, high LCP               | Google Fonts: `media="print" onload="this.media='all'"` + `<noscript>` fallback |

---

## 4. Code quality issues found in review

| Issue                                       | Risk                              | Fix                                             |
| ------------------------------------------- | --------------------------------- | ----------------------------------------------- |
| Spotify album ID duplicated 4x              | Drift on URL change               | `src/data/spotify.ts` + `SpotifyEmbed.astro`    |
| `goto/clear/reload` repeated in tests       | Brittle setup                     | `tests/helpers.ts` -> `gotoCleanStore()`        |
| Cart row listeners rebound every `render()` | Perf / leak pattern               | Event delegation on `.cart__items` + `data-key` |
| `setAttribute('data-empty')` vs `dataset`   | Inconsistency                     | `el.dataset.empty`                              |
| Redundant `nameHtml` on products            | Noise                             | Optional field; `p.nameHtml ?? p.name`          |
| Empty `catch {}` in `save()`                | Silent localStorage failure       | `console.warn` on catch                         |
| `countEls` typed as `Element`               | `astro check` error on `.dataset` | `querySelectorAll<HTMLElement>()`               |

---

## 5. Tooling setup pitfalls

### Prettier cannot parse `store.astro`

- **Symptom:** `SyntaxError: Unexpected token` on HTML comment containing `{p.id}`.
- **Cause:** `prettier-plugin-astro` treats `{` inside `<!-- -->` as template syntax.
- **Fix:** Use Astro comment `{/* TODO: ... */}` instead of HTML comment with `{`.

### `astro check` on Playwright tests

- **Symptom:** `reducedMotion` not in Playwright `Fixtures` type.
- **Fix:** `tsconfig.json` excludes `tests/` from app typecheck. Tests validated by running.

### `lint-staged` requires newer Git

- **Symptom:** `lint-staged requires at least Git version 2.32.0` (user had 2.31.1).
- **Fix:** Pinned `lint-staged@13.3.0`. Upgrade Git to >= 2.32 to use latest lint-staged.

### Git CRLF warning on Windows

- **Symptom:** `LF will be replaced by CRLF` when staging.
- **Fix:** `.gitattributes` forces `eol=lf` for text files; matches `.editorconfig`.

### ESLint on generated / CLI files

- `src/env.d.ts` triple-slash reference -- ignored in `eslint.config.mjs` (Astro-generated).
- `scripts/check-encoding.mjs` -- `no-console` off for CLI scripts; removed dead `lineColAt` call in U+FFFD branch.

### Husky / lint-staged before first commit

- **Symptom:** `Skipping backup because there's no initial commit yet.`
- **Meaning:** Stash safety inactive until first commit exists. Hook still runs.
- **Optional:** One baseline commit enables full lint-staged backup behavior.

### `.cursor/rules/coding-standards.mdc` corruption

- Cursor rule file was written via a tool that corrupted non-ASCII examples.
- Keep agent rules **ASCII-only** or write via Node utf8. Verify with `check:encoding`.

---

## 6. Git / repo state (as of 2026-06-06)

- Repo initialized at project root for husky; **no commits yet**, **no remote**.
- Pre-commit hook: `lint-staged` + `check:encoding`.
- CI: `quality` job (encoding, lint, format, typecheck) + `test` job (Playwright) + informational `lighthouse`.

---

## 7. Quick symptom index

| If you see...                              | Look at section      |
| ------------------------------------------ | -------------------- |
| `?` or `` in UI copy                       | 1. Encoding          |
| `check:encoding` failed                    | 1. Encoding          |
| Playwright connection refused              | 2. Playwright flakes |
| WebKit timeout / Norton block              | 2. Playwright flakes |
| axe / Lighthouse a11y contrast or headings | 3. Accessibility     |
| Slow Lighthouse perf on fonts              | 3. Accessibility     |
| Prettier fails on `.astro`                 | 5. Tooling           |
| `astro check` dataset error                | 4. Code quality      |
| Pre-commit lint-staged Git version error   | 5. Tooling           |
| lint-staged "no initial commit"            | 5. Tooling           |

---

## 8. Prevention stack (current)

| Layer                                | What it catches                           |
| ------------------------------------ | ----------------------------------------- |
| `.editorconfig` + `.gitattributes`   | Wrong encoding / line endings             |
| `check:encoding`                     | Mojibake before tests or commit           |
| `verify-copy.mjs` (`prebuild`)       | Deleted/corrupted glyphs (arrow, middot)  |
| Prettier                             | Format drift; safe UTF-8 writes for astro |
| ESLint                               | Dead code, silent catches, var usage      |
| `astro check`                        | Type errors in app source                 |
| `validate:html` / `validate:links`   | Bad built HTML; broken real URLs in dist  |
| Pre-commit hook                      | Lint/format/encoding on staged files      |
| CI `quality` job                     | Hooks + build + dist validation + audit   |
| Playwright suite                     | Runtime, a11y, keyboard, content          |
| Dependabot + PR template             | Stale deps; human review checklist        |
| `.cursor/rules/coding-standards.mdc` | Agent conventions + test expectations     |
| `docs/github-setup.md`               | Branch protection (manual, after push)    |
| This file                            | Historical context for regressions        |

### html-validate config filename (v11)

- **Symptom:** Rules in `html-validate.config.json` ignored; strict false positives.
- **Cause:** html-validate v11 reads `.htmlvalidate.json`, not the hyphenated name.
- **Fix:** Config lives at `.htmlvalidate.json`; `npm run validate:html` uses it.

### html-validate v11 requires Node 22.22+

- **Symptom:** CI `Validate HTML` fails with `TypeError: fs.globSync is not a function`.
- **Cause:** html-validate 11.x uses the Node native `fs.globSync` API (added in Node 22). CI was on Node 20 via `.nvmrc`; local dev on Node 22 masked the mismatch.
- **Fix:** `.nvmrc` and `engines.node` set to `>=22.22.0 <23`. Re-run `npm run build && npm run validate:html` after switching Node versions.
