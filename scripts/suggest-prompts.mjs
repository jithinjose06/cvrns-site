#!/usr/bin/env node
/**
 * Inspect git changes and suggest which agent prompts apply before push/commit.
 * Run: npm run suggest-prompts
 */
import { execSync } from 'node:child_process';
import { getGitContext, printManualReminders } from './git-context.mjs';

const PROMPTS = {
  routine: {
    title: 'Every push (routine)',
    text: `Pre-push: run quality gates (check:encoding, lint, format:check, typecheck, build,
validate:dist), run targeted Playwright tests (smoke, store, keyboard), quick diff
review for scope creep and DRY violations. Tell me what blocks push. Do not commit
unless I say.`,
  },
  bugfix: {
    title: 'After fixing a bug',
    text: `We fixed [describe issue]. Append it to docs/known-issues.md (symptom, cause, fix,
symptom index if new). Confirm all quality gates still pass.`,
  },
  ui: {
    title: 'After UI or layout changes',
    text: `UI changed in [pages/components]. Update Playwright visual baselines if intentional,
run smoke + a11y tests, verify encoding on any glyph-bearing files. Report failures.`,
  },
  glyphs: {
    title: 'After copy with special characters',
    text: `Touched copy with em dashes, middots, or arrows in [files]. Verify UTF-8 bytes on
disk, run check:encoding, confirm glyphs render correctly. Do not commit unless I say.`,
  },
  milestone: {
    title: 'Before a milestone or PR',
    text: `Code review: redundancy, coding standards, test coverage, known-issues log,
README accuracy. Run full quality gates. Summarize risks. No commit unless I say.`,
  },
  feature: {
    title: 'New feature or interaction',
    text: `Adding [feature] to [area]. Match existing patterns, add Playwright coverage
(functional + keyboard/a11y if interactive), extract shared constants/components
if duplicated. Run gates when done.`,
  },
  commit: {
    title: 'Commit (when ready)',
    text: `Create a commit for [scope]. Message should explain why. Run pre-commit hooks.
Do not push unless I also ask.`,
  },
  pr: {
    title: 'Push and open PR (when ready)',
    text: `Push to [remote/branch] and open a PR. Summarize changes and test plan.`,
  },
  debug: {
    title: 'Debugging something broken',
    text: `[Symptom]. Read docs/known-issues.md first, then investigate. Fix root cause,
add a guard or test if appropriate, update known-issues.md if this is a new class
of problem.`,
  },
};

function git(args) {
  try {
    return execSync(`git ${args}`, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function changedFiles() {
  const status = git('status --porcelain');
  if (!status) return [];
  return status
    .split('\n')
    .map((line) => line.replace(/^\?\? |^[ MADRCU?!]{2}/, '').trim())
    .filter(Boolean);
}

function main() {
  const ctx = getGitContext();

  if (!ctx.inRepo) {
    console.log('Not a git repo. Use the routine pre-push prompt before your first commit.\n');
    printPrompt('routine');
    printManualReminders(ctx);
    return;
  }

  const files = changedFiles();

  if (!files.length) {
    console.log('Working tree clean. No code prompts required until you have new changes.\n');
    console.log('Before your next push, start with the routine prompt (docs/agent-prompts.md).\n');
    printManualReminders(ctx);
    return;
  }

  const glyphRe = /^src\/(pages|layouts|components)\/.+\.astro$|^src\/styles\/site\.css$/;
  const uiRe = /^src\/.+\.(astro|css)$/;
  const testRe = /^tests\//;
  const toolingRe =
    /^(package\.json|package-lock\.json|eslint\.config|\.prettierrc|\.github\/|\.husky\/|playwright\.config|tsconfig\.json|scripts\/)/;
  const docsRe = /^(docs\/|README\.md$)/;
  const interactiveRe = /store\.astro|focus\.ts|Layout\.astro/;

  const glyphFiles = files.filter((f) => glyphRe.test(f));
  const uiFiles = files.filter((f) => uiRe.test(f));
  const testFiles = files.filter((f) => testRe.test(f));
  const toolingFiles = files.filter((f) => toolingRe.test(f));
  const docsFiles = files.filter((f) => docsRe.test(f));
  const hasInteractive = files.some((f) => interactiveRe.test(f));
  const knownIssuesTouched = files.includes('docs/known-issues.md');
  const docsOnly =
    files.length > 0 && files.every((f) => docsRe.test(f) || f.startsWith('.cursor/'));

  const suggestions = new Map();

  const add = (id, reason) => {
    if (!suggestions.has(id)) suggestions.set(id, []);
    suggestions.get(id).push(reason);
  };

  add('routine', `${files.length} changed file(s)`);

  if (glyphFiles.length) {
    add('glyphs', glyphFiles.join(', '));
  }

  if (uiFiles.length && !docsOnly) {
    add('ui', uiFiles.slice(0, 4).join(', ') + (uiFiles.length > 4 ? ', ...' : ''));
  }

  if (hasInteractive) {
    add('feature', 'cart, drawer, or overlay logic touched');
  }

  if (testFiles.length && uiFiles.length) {
    add('feature', 'tests and source changed together -- confirm coverage matches behavior');
  }

  if (toolingFiles.length) {
    add('milestone', 'tooling or CI config changed');
  }

  if (files.length >= 12) {
    add('milestone', `large diff (${files.length} files)`);
  }

  // Heuristic: scripts/tests/config changed but known-issues not -- nudge after bugfix sessions
  if (!knownIssuesTouched && (toolingFiles.length || testFiles.length) && !docsOnly) {
    add('bugfix', 'if this session fixed a novel bug, log it before push');
  }

  if (docsOnly && docsFiles.length) {
    console.log(
      'Docs-only change detected. Routine pre-push is optional unless you also changed app code.\n'
    );
  }

  console.log('Suggested prompts for your current changes:\n');

  const order = ['routine', 'glyphs', 'ui', 'feature', 'bugfix', 'milestone', 'commit', 'pr'];
  for (const id of order) {
    if (!suggestions.has(id)) continue;
    const { title, text } = PROMPTS[id];
    const reasons = suggestions.get(id);
    console.log(`## ${title}`);
    console.log(`Why: ${reasons.join('; ')}\n`);
    console.log(text);
    console.log('\n---\n');
  }

  const skipped = ['commit', 'pr'].filter((id) => !suggestions.has(id));
  if (skipped.length) {
    console.log(
      'Also available when you are ready: ' + skipped.map((id) => PROMPTS[id].title).join(', ')
    );
    console.log('(See docs/agent-prompts.md)\n');
  }

  console.log(
    'Tip: ask the agent "what prompts should I run?" -- it will assess the session too.\n'
  );
  printManualReminders(ctx);
}

function printPrompt(id) {
  const { title, text } = PROMPTS[id];
  console.log(`## ${title}\n\n${text}\n`);
}

main();
