# Agent prompts

Copy-paste these when starting a session or before a push. The agent is configured
to update `docs/known-issues.md` after novel bugs (see `.cursor/rules/coding-standards.mdc`).

## Automatic suggestions

**You can ask:** `What prompts should I run?` or `Assess and suggest next steps.`

The agent will assess the conversation and git diff, then suggest only what applies.

**Or run locally:**

```bash
npm run suggest-prompts   # prompts + manual GitHub reminders for current git state
npm run remind:manual    # PR workflow on master, optional secret scanning, etc.
```

The agent also surfaces manual steps when you mention commit, push, PR, or deploy.

---

## Every push (routine)

`master` is protected — push a feature branch and open a PR (see README **GitHub & CI**).

```
Pre-push: run quality gates (check:encoding, lint, format:check, typecheck, build,
validate:dist), run targeted Playwright tests (smoke, store, keyboard), quick diff
review for scope creep and DRY violations. Tell me what blocks push. Do not commit
unless I say. Remind me if I am on master — use a feature branch instead.
```

---

## After fixing a bug

```
We fixed [describe issue]. Append it to docs/known-issues.md (symptom, cause, fix,
symptom index if new). Confirm all quality gates still pass.
```

---

## After UI or layout changes

```
UI changed in [pages/components]. Update Playwright visual baselines if intentional,
run smoke + a11y tests, verify encoding on any glyph-bearing files. Report failures.
```

---

## After copy with special characters

```
Touched copy with em dashes, middots, or arrows in [files]. Verify UTF-8 bytes on
disk, run check:encoding, confirm glyphs render correctly. Do not commit unless I say.
```

---

## Before a milestone or PR

```
Code review: redundancy, coding standards, test coverage, known-issues log,
README accuracy. Run full quality gates. Summarize risks. No commit unless I say.
```

---

## New feature or interaction

```
Adding [feature] to [area]. Match existing patterns, add Playwright coverage
(functional + keyboard/a11y if interactive), extract shared constants/components
if duplicated. Run gates when done.
```

---

## Commit and push (only when you are ready)

`master` requires a PR — never push directly to it.

```
Create a commit on branch [branch-name] for [scope]. Message should explain why.
Run pre-commit hooks. Do not push unless I also ask.
```

```
Push branch [branch-name] to origin and open a PR into master. Summarize changes
and test plan. Confirm required CI checks (Lint, format & types; Build & cross-browser
tests) before merge.
```

---

## Debugging something broken

```
[Symptom]. Read docs/known-issues.md first, then investigate. Fix root cause,
add a guard or test if appropriate, update known-issues.md if this is a new class
of problem.
```

---

## What runs automatically (no prompt needed)

| Trigger          | Checks                            |
| ---------------- | --------------------------------- |
| `npm run dev`    | `predev` -> encoding              |
| `npm run test`   | `pretest` -> encoding             |
| `git commit`     | lint-staged + encoding            |
| CI `quality` job | encoding, lint, format, typecheck |
| CI `test` job    | cross-browser Playwright          |
