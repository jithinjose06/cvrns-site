#!/usr/bin/env node
/**
 * Git/repo context for contextual manual-step reminders.
 * Used by suggest-prompts.mjs; logic mirrored in .cursor/rules/coding-standards.mdc.
 */
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SETUP_DOC = 'docs/github-setup.md';

function git(args) {
  try {
    return execSync(`git ${args}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

export function getGitContext() {
  if (git('rev-parse --is-inside-work-tree') !== 'true') {
    return { inRepo: false };
  }

  const branch = git('rev-parse --abbrev-ref HEAD') || 'unknown';
  const countRaw = git('rev-list --count HEAD');
  const commitCount = countRaw ? Number(countRaw) : 0;
  const remotes = git('remote')
    .split('\n')
    .map((r) => r.trim())
    .filter(Boolean);
  const upstream = git('rev-parse --abbrev-ref @{upstream}');
  const hasUpstream = Boolean(upstream);

  return {
    inRepo: true,
    branch,
    commitCount,
    remotes,
    hasUpstream,
    upstream: hasUpstream ? upstream : null,
  };
}

/**
 * Manual steps that automation cannot do. Returns items only while still applicable.
 * @param {ReturnType<typeof getGitContext>} ctx
 */
export function getManualReminders(ctx) {
  if (!ctx || !ctx.inRepo) {
    return [
      {
        phase: 'init',
        title: 'Initialize git',
        why: 'No git repository detected.',
        steps: [
          'Run git init in the project root',
          'See docs/agent-prompts.md for baseline commit',
        ],
      },
    ];
  }

  const reminders = [];

  if (ctx.commitCount === 0) {
    reminders.push({
      phase: 'baseline-commit',
      title: 'Create baseline commit (before push)',
      why: 'No commits yet -- husky lint-staged stash/backup is limited until HEAD exists.',
      steps: [
        'Ask the agent to create a baseline commit (or commit yourself)',
        'Pre-commit hook will run lint-staged + check:encoding on staged files',
      ],
      doc: SETUP_DOC + ' section 5',
    });
  }

  if (ctx.remotes.length === 0) {
    reminders.push({
      phase: 'add-remote',
      title: 'Add GitHub remote (before first push)',
      why: 'No git remote configured -- CI and branch protection live on GitHub.',
      steps: [
        'git remote add origin git@github.com:YOUR_ORG/cvrns-site.git',
        'Create the empty repo on GitHub first if needed',
      ],
      doc: SETUP_DOC + ' section 1',
    });
  } else if (!ctx.hasUpstream) {
    reminders.push({
      phase: 'first-push',
      title: 'First push to GitHub',
      why: `Branch "${ctx.branch}" has no upstream tracking branch yet.`,
      steps: [`git push -u origin ${ctx.branch}`, 'Confirm CI workflows run on GitHub Actions tab'],
      doc: SETUP_DOC + ' section 1',
    });
  }

  if (ctx.remotes.length > 0 && ctx.branch === 'master') {
    reminders.push({
      phase: 'protected-branch',
      title: 'master is protected — use a feature branch + PR',
      why: 'Direct pushes to master are blocked; merge via PR after CI passes.',
      steps: [
        'git checkout -b feat/short-description',
        'Commit, push branch, open PR (gh pr create --fill)',
        'Required checks: Lint, format & types; Build & cross-browser tests',
      ],
      doc: SETUP_DOC,
    });
  }

  return reminders;
}

/** Print reminders to stdout (for npm run suggest-prompts / remind:manual). */
export function printManualReminders(ctx = getGitContext()) {
  const reminders = getManualReminders(ctx);
  if (!reminders.length) return false;

  console.log('=== MANUAL STEPS (context-based -- not automated) ===\n');
  for (const r of reminders) {
    console.log(`[${r.phase}] ${r.title}`);
    console.log(`Why: ${r.why}`);
    for (const step of r.steps) console.log(`  - ${step}`);
    if (r.doc) console.log(`  Doc: ${r.doc}`);
    console.log('');
  }
  console.log(`Full checklist: ${SETUP_DOC}\n`);
  return true;
}

// CLI: npm run remind:manual
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  printManualReminders();
}
