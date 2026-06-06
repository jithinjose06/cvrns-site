# GitHub setup (one-time, after first push)

The repo is ready for CI. Complete these steps on GitHub once a remote exists.

## 1. Push the repository

```bash
git remote add origin git@github.com:YOUR_ORG/cvrns-site.git
git push -u origin main
```

Use `master` instead of `main` if that is your default branch name locally.

## 2. Branch protection on `main`

Settings -> Branches -> Add rule for `main`:

| Setting                               | Recommendation                                        |
| ------------------------------------- | ----------------------------------------------------- |
| Require a pull request before merging | On                                                    |
| Require status checks to pass         | On                                                    |
| Required checks                       | `Lint, format & types`, `Build & cross-browser tests` |
| Require branches to be up to date     | On                                                    |
| Do not include administrators         | Optional                                              |

The Lighthouse job is informational (`continue-on-error`) -- do not require it.

The `npm audit` step is informational until vulnerabilities are cleared.

## 3. Secret scanning

Settings -> Code security and analysis:

- Enable **Secret scanning** (public repos: free).
- Enable **Push protection** if available.

Never commit `.env` or API keys. `.gitignore` already excludes `.env*`.

## 4. Dependabot

`.github/dependabot.yml` is included. After push, enable Dependabot alerts under
Settings -> Code security if not already on.

Review Dependabot PRs weekly; CI must pass before merge.

## 5. First baseline commit

If you have not committed yet, create one baseline commit so husky lint-staged
backup/stash behavior is fully active. See `docs/agent-prompts.md`.
