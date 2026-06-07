# GitHub setup

Repository: **https://github.com/jithinjose06/cvrns-site** (public, default branch `master`)

One-time setup is complete. This doc describes what is configured and how to work with it day to day.

## Current configuration

| Item                        | Status                                 |
| --------------------------- | -------------------------------------- |
| Visibility                  | Public                                 |
| Default branch              | `master`                               |
| Branch protection           | Enabled on `master`                    |
| CI workflow                 | `.github/workflows/ci.yml` (push + PR) |
| Dependabot                  | `.github/dependabot.yml`               |
| PR template                 | `.github/pull_request_template.md`     |
| Secret scanning             | Enabled                                |
| Push protection             | Enabled                                |
| Dependabot security updates | Enabled                                |

### Branch protection on `master`

Configured at Settings → Branches → `master`:

| Setting                               | Value                                                 |
| ------------------------------------- | ----------------------------------------------------- |
| Require a pull request before merging | On (0 approvals — fine for solo work)                 |
| Require status checks to pass         | On                                                    |
| Required checks                       | `Lint, format & types`, `Build & cross-browser tests` |
| Require branches to be up to date     | On                                                    |
| Allow force pushes                    | Off                                                   |
| Allow deletions                       | Off                                                   |

Do **not** require the Lighthouse job — it is informational (`continue-on-error` in CI).

The `npm audit` step in the quality job is also informational (`continue-on-error`).

## Day-to-day workflow

`master` rejects direct pushes. Use a branch and PR:

```bash
git checkout -b feat/short-description
# make changes, commit (husky runs lint-staged + encoding on staged files)
git push -u origin feat/short-description
gh pr create --fill
```

Merge the PR on GitHub after both required checks are green. GitHub blocks merge if CI failed or is still running.

To update your branch after `master` moved:

```bash
git fetch origin
git rebase origin/master   # or merge origin/master
git push
```

## CI jobs

| Job                               | Required to merge? | What it runs                                                                |
| --------------------------------- | ------------------ | --------------------------------------------------------------------------- |
| Lint, format & types              | Yes                | encoding, lint, format, typecheck, build, `validate:html`, `validate:links` |
| Build & cross-browser tests       | Yes                | Playwright (desktop, mobile, Firefox, WebKit, mobile-safari)                |
| Lighthouse budget (informational) | No                 | Perf budget via Playwright Lighthouse                                       |

View runs: https://github.com/jithinjose06/cvrns-site/actions

## Public repo benefits

- **Actions:** unlimited minutes on GitHub-hosted standard runners (no per-minute charge for normal CI).
- **Branch protection:** free on public repos (enforced on `master` as above).
- **Secret scanning:** available free under Settings → Code security and analysis.

## Secret scanning + push protection

Enabled under Settings → **Code security and analysis**:

- **Secret scanning** — scans commits for known secret patterns
- **Push protection** — blocks pushes that contain detected secrets
- **Dependabot security updates** — opens PRs for vulnerable dependencies

Never commit `.env` or API keys. `.gitignore` already excludes `.env*`.

## Dependabot

Dependabot version PRs are configured in `.github/dependabot.yml`. Review weekly; **do not merge** until required CI checks pass.

Major bumps (e.g. Astro 4 → 6) should be deliberate migrations, not auto-merged Dependabot PRs.

Dependabot security alerts: Settings → Code security → Dependabot alerts (enable if not already on).

## Cloning / remotes

```bash
git clone https://github.com/jithinjose06/cvrns-site.git
cd cvrns-site
npm install
```

Existing local clone — confirm remote:

```bash
git remote set-url origin https://github.com/jithinjose06/cvrns-site.git
```

## Deploy (GitHub Pages)

Workflow: `.github/workflows/deploy.yml` — runs on every push to `master`.

| Item                  | Value                                                               |
| --------------------- | ------------------------------------------------------------------- |
| Public URL            | https://jithinjose06.github.io/cvrns-site/                          |
| Astro `site` / `base` | Set via `PAGES_SITE` and `PAGES_BASE` env vars in the workflow only |

### One-time: enable Pages

After the deploy workflow is merged to `master`:

1. **Settings** → **Pages** → **Build and deployment** → Source: **GitHub Actions**
2. Push to `master` (or re-run the Deploy workflow) if the first run happened before Pages was enabled

CLI (optional):

```bash
gh api --method POST repos/jithinjose06/cvrns-site/pages -f build_type=workflow
```

### Custom domain

Add the domain under Pages settings, then update `PAGES_SITE` in `deploy.yml` to `https://your.domain`.

## Historical note

The repo was briefly under the `jjcvrns` organization during a Team plan trial, then transferred to `jithinjose06` and made public. Old org URLs may redirect for a time; use the personal URL above.
