#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  REQUIRED_REPORT_SECTIONS,
  createIssueRunState,
  ensureNumericIssueNumber,
  filterProjectIssues,
  hasVerificationFailure,
  nowIso,
  parseWorkerReport,
  slugify,
  validateImplementationWorker,
} from './lib/core.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = process.cwd();
const CONFIG_PATH = path.join(__dirname, 'config.json');
const ISSUE_IMPLEMENT_PROMPT_PATH = path.join(__dirname, 'prompts', 'issue-implement.md');

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeFileSyncSafe(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function commandResultToError(command, result) {
  const stderr = result.stderr || '';
  const stdout = result.stdout || '';
  const output = [stderr, stdout].filter(Boolean).join('\n').trim();

  return new Error(`${command} failed with exit code ${result.status}. ${output}`.trim());
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    env: options.env || process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0 && !options.allowFailure) {
    throw commandResultToError(`${command} ${args.join(' ')}`, result);
  }

  return result;
}

function runJsonCommand(command, args, options = {}) {
  const result = runCommand(command, args, options);
  const output = (result.stdout || '').trim();

  if (!output) {
    return null;
  }

  return JSON.parse(output);
}

function inferRepoFromRemote(remoteUrl) {
  const ssh = remoteUrl.match(/^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/);
  if (ssh) {
    return `${ssh[1]}/${ssh[2]}`;
  }

  const https = remoteUrl.match(/^https:\/\/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/);
  if (https) {
    return `${https[1]}/${https[2]}`;
  }

  return null;
}

function parseArgs(argv, config) {
  const args = {
    owner: null,
    repo: null,
    projectTitle: config.projectTitle,
    milestone: null,
    baseBranch: 'main',
    timeCapMinutes: config.timeCapMinutes,
    implementationNotes: '',
    dryRun: false,
    runId: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    switch (current) {
      case '--owner':
        args.owner = argv[index + 1];
        index += 1;
        break;
      case '--repo':
        args.repo = argv[index + 1];
        index += 1;
        break;
      case '--project-title':
        args.projectTitle = argv[index + 1];
        index += 1;
        break;
      case '--milestone':
        args.milestone = argv[index + 1];
        index += 1;
        break;
      case '--base-branch':
        args.baseBranch = argv[index + 1];
        index += 1;
        break;
      case '--time-cap-min':
        args.timeCapMinutes = Number(argv[index + 1]);
        index += 1;
        break;
      case '--implementation-notes':
        args.implementationNotes = argv[index + 1] || '';
        index += 1;
        break;
      case '--run-id':
        args.runId = argv[index + 1];
        index += 1;
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      default:
        throw new Error(`Unknown argument: ${current}`);
    }
  }

  if (!args.milestone) {
    throw new Error('Missing required argument: --milestone');
  }

  if (!args.runId) {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hour = String(now.getUTCHours()).padStart(2, '0');
    const minute = String(now.getUTCMinutes()).padStart(2, '0');
    const second = String(now.getUTCSeconds()).padStart(2, '0');
    args.runId = `${year}${month}${day}-${hour}${minute}${second}`;
  }

  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/orchestrator/milestone-manager.mjs --milestone <name> [options]

Options:
  --owner <owner>                 GitHub project owner (required when --repo is omitted)
  --repo <owner/repo>             Repository slug; inferred from git remote when omitted
  --project-title <title>         GitHub project title (default: freedive-project)
  --milestone <value>             Milestone field value to execute (required)
  --base-branch <name>            Base branch for milestone branch creation (default: main)
  --time-cap-min <minutes>        Runtime cap in minutes (default: 120)
  --implementation-notes <text>   Extra worker notes appended to agent invocation
  --run-id <id>                   Explicit run id (default: UTC timestamp)
  --dry-run                       Skip mutating git/GitHub operations
  --help                          Show this help message
`);
}

function assertCommandExists(name) {
  const result = runCommand('bash', ['-lc', `command -v ${name}`], { allowFailure: true });
  if (result.status !== 0) {
    throw new Error(`Required command not found: ${name}`);
  }
}

function assertGhAuthAndScopes() {
  const statusResult = runCommand('gh', ['auth', 'status', '--json', 'hosts'], {
    allowFailure: true,
  });

  if (statusResult.status !== 0) {
    throw commandResultToError('gh auth status --json hosts', statusResult);
  }

  const status = JSON.parse(statusResult.stdout || '{}');
  const hostEntries = Array.isArray(status?.hosts?.['github.com']) ? status.hosts['github.com'] : [];
  const activeHost = hostEntries.find((entry) => entry.active) || hostEntries[0];

  if (!activeHost) {
    throw new Error('No active GitHub auth host found.');
  }

  const scopes = String(activeHost.scopes || '').toLowerCase();

  if (!scopes.includes('project')) {
    throw new Error('GitHub token is missing required scope: project');
  }

  if (!scopes.includes('repo')) {
    throw new Error('GitHub token is missing required scope: repo');
  }

  const apiProbe = runCommand('gh', ['api', 'user'], { allowFailure: true });
  if (apiProbe.status !== 0) {
    throw commandResultToError('gh api user', apiProbe);
  }
}

function resolveRepoAndOwner(cliArgs) {
  let repo = cliArgs.repo;

  if (!repo) {
    const remote = runCommand('git', ['config', '--get', 'remote.origin.url']).stdout.trim();
    repo = inferRepoFromRemote(remote);
    if (!repo) {
      throw new Error('Unable to infer --repo from remote.origin.url. Pass --repo explicitly.');
    }
  }

  const owner = cliArgs.owner || repo.split('/')[0];
  return { repo, owner };
}

function resolveProject(owner, projectTitle) {
  const projects = runJsonCommand('gh', ['project', 'list', '--owner', owner, '--format', 'json']);
  const projectList = Array.isArray(projects)
    ? projects
    : Array.isArray(projects?.projects)
      ? projects.projects
      : [];

  const project = projectList.find(
    (current) => String(current.title || '').toLowerCase() === projectTitle.toLowerCase(),
  );

  if (!project) {
    throw new Error(`Project "${projectTitle}" not found for owner "${owner}".`);
  }

  if (!project.number || !project.id) {
    throw new Error('Resolved project is missing required identifiers (number/id).');
  }

  return project;
}

function resolveStatusField(project, owner, config) {
  const fields = runJsonCommand('gh', [
    'project',
    'field-list',
    String(project.number),
    '--owner',
    owner,
    '--format',
    'json',
  ]);

  const list = Array.isArray(fields) ? fields : Array.isArray(fields?.fields) ? fields.fields : [];
  const statusField = list.find(
    (field) => String(field?.name || '').toLowerCase() === config.projectFieldNames.status.toLowerCase(),
  );

  if (!statusField) {
    return null;
  }

  const options = Array.isArray(statusField.options) ? statusField.options : [];
  const doneOption = options.find((option) =>
    config.doneStatusValues.some(
      (doneValue) => String(doneValue).toLowerCase() === String(option.name || '').toLowerCase(),
    ),
  );

  if (!doneOption) {
    return null;
  }

  return {
    fieldId: statusField.id,
    doneOptionId: doneOption.id,
  };
}

function loadMilestoneIssues(project, owner, config, milestone) {
  const items = runJsonCommand('gh', [
    'project',
    'item-list',
    String(project.number),
    '--owner',
    owner,
    '-L',
    '500',
    '--format',
    'json',
  ]);

  const itemList = Array.isArray(items) ? items : Array.isArray(items?.items) ? items.items : [];

  const issues = filterProjectIssues(itemList, {
    milestone,
    milestoneFieldName: config.projectFieldNames.milestone,
    statusFieldName: config.projectFieldNames.status,
    doneStatusValues: config.doneStatusValues,
  });

  if (issues.length === 0) {
    throw new Error(`No open project issues found for milestone "${milestone}".`);
  }

  return issues;
}

function localBranchExists(branchName) {
  const result = runCommand('git', ['show-ref', '--verify', '--quiet', `refs/heads/${branchName}`], {
    allowFailure: true,
  });

  return result.status === 0;
}

function checkoutOrCreateMilestoneBranch(branchName, baseBranch, dryRun) {
  if (dryRun) {
    return;
  }

  runCommand('git', ['fetch', 'origin', baseBranch]);
  runCommand('git', ['checkout', baseBranch]);
  runCommand('git', ['pull', '--ff-only', 'origin', baseBranch]);

  if (localBranchExists(branchName)) {
    runCommand('git', ['checkout', branchName]);
    return;
  }

  runCommand('git', ['checkout', '-b', branchName, baseBranch]);
}

function checkoutIssueBranch(milestoneBranch, issueBranch, dryRun) {
  if (dryRun) {
    return;
  }

  runCommand('git', ['checkout', milestoneBranch]);
  runCommand('git', ['checkout', '-B', issueBranch]);
}

function ensureIssueArtifacts(issue) {
  const issueSlug = `${String(issue.issueNumber).padStart(3, '0')}-${slugify(issue.title)}`;
  const issueDir = path.join(REPO_ROOT, 'specs', issueSlug);
  const packetDir = path.join(issueDir, 'packets');

  fs.mkdirSync(packetDir, { recursive: true });

  const briefPath = path.join(issueDir, 'brief.md');
  const planPath = path.join(issueDir, 'plan.md');
  const verificationPath = path.join(issueDir, 'verification.md');
  const packetPath = path.join(packetDir, '01-packet-template.md');

  if (!fs.existsSync(briefPath)) {
    writeFileSyncSafe(
      briefPath,
      `# Brief: ${issueSlug}\n\n## Issue\n\n- Issue ID: \`${issue.issueNumber}\`\n- Issue link: ${issue.url}\n\n## Scope\n\n- Describe target behavior from issue #${issue.issueNumber}.\n`,
    );
  }

  if (!fs.existsSync(planPath)) {
    writeFileSyncSafe(
      planPath,
      `# Plan: ${issueSlug}\n\n## Context\n\n- Issue: #${issue.issueNumber}\n\n## Goal\n\n- Implement issue #${issue.issueNumber} as a vertical slice.\n\n## In scope\n\n- Behavior requested in issue body and acceptance criteria.\n\n## Out of scope\n\n- Unrelated milestone backlog items.\n\n## Affected slices\n\n- Determine backend/mobile/shared/doc impact before implementation.\n\n## Change map (files)\n\n- To be completed by implementation agent.\n\n## API/DTO/type changes\n\n- To be completed by implementation agent.\n\n## Risk tier\n\n- low|medium|high (to be decided during implementation plan).\n\n## Verification plan\n\n- Tests, lint, type-check, and screenshot evidence when UI changes.\n\n## Rollback notes\n\n- Revert issue branch merge from milestone branch.\n\n## Assumptions\n\n- Milestone execution is sequential.\n\n## Open questions\n\n- None at PM scaffolding stage.\n`,
    );
  }

  if (!fs.existsSync(verificationPath)) {
    writeFileSyncSafe(
      verificationPath,
      '# Verification\n\n## Changes made\n\n## Verification run\n\n## Not run / limitations\n\n## Risk notes\n',
    );
  }

  if (!fs.existsSync(packetPath)) {
    writeFileSyncSafe(
      packetPath,
      '# Packet 01\n\n- Owned files:\n- Dependencies:\n- Acceptance checks:\n',
    );
  }

  return { issueDir, planPath };
}

function validatePlanFile(planPath) {
  const plan = fs.readFileSync(planPath, 'utf8');
  const requiredHeadings = [
    '## Context',
    '## Goal',
    '## In scope',
    '## Out of scope',
    '## Affected slices',
    '## Verification plan',
  ];

  for (const heading of requiredHeadings) {
    if (!plan.includes(heading)) {
      throw new Error(`Plan approval failed. Missing required heading "${heading}" in ${planPath}`);
    }
  }
}

function renderWorkerPrompt(issue, notes) {
  const template = fs.readFileSync(ISSUE_IMPLEMENT_PROMPT_PATH, 'utf8');

  return template
    .replaceAll('{{ISSUE_NUMBER}}', String(issue.issueNumber))
    .replaceAll('{{ISSUE_URL}}', issue.url)
    .replaceAll('{{ISSUE_TITLE}}', issue.title)
    .replaceAll('{{IMPLEMENTATION_NOTES}}', notes || 'No additional notes.');
}

function dispatchImplementationAgent(issue, notes, requiredSections) {
  const prompt = renderWorkerPrompt(issue, notes);
  const outputFile = path.join(os.tmpdir(), `pm-agent-${issue.issueNumber}-${Date.now()}.md`);

  const result = runCommand(
    'codex',
    ['exec', '--cd', REPO_ROOT, '--output-last-message', outputFile, prompt],
    { allowFailure: true },
  );

  if (result.status !== 0) {
    const output = [result.stderr, result.stdout].filter(Boolean).join('\n').trim();
    return {
      ok: false,
      blocker: output || `Agent exited with status ${result.status}`,
      sections: null,
    };
  }

  const raw = fs.existsSync(outputFile)
    ? fs.readFileSync(outputFile, 'utf8')
    : [result.stdout, result.stderr].filter(Boolean).join('\n');

  let sections;
  try {
    sections = parseWorkerReport(raw, requiredSections);
  } catch (error) {
    return {
      ok: false,
      blocker: `Invalid worker report format: ${error.message}`,
      sections: null,
    };
  }

  if (hasVerificationFailure(sections['Verification run'])) {
    return {
      ok: false,
      blocker: 'Worker reported unresolved verification failure.',
      sections,
    };
  }

  return { ok: true, blocker: null, sections };
}

function mergeIssueIntoMilestone(issueState, milestoneBranch, dryRun) {
  if (dryRun) {
    return 'dry-run';
  }

  runCommand('git', ['checkout', milestoneBranch]);
  runCommand('git', [
    'merge',
    '--no-ff',
    issueState.issue_branch,
    '-m',
    `merge(issue #${issueState.issue_number}): ${issueState.issue_title}`,
  ]);

  return runCommand('git', ['rev-parse', '--short', 'HEAD']).stdout.trim();
}

function commentIssue(repo, issueState, sections, dryRun) {
  if (dryRun) {
    return;
  }

  const body = `PM orchestrator update for #${issueState.issue_number}\n\n` +
    `Milestone branch merge complete from \`${issueState.issue_branch}\`.\n\n` +
    `## Changes made\n${sections['Changes made']}\n\n` +
    `## Verification run\n${sections['Verification run']}\n\n` +
    `## Not run / limitations\n${sections['Not run / limitations']}\n\n` +
    `## Risk notes\n${sections['Risk notes']}\n\n` +
    `Merge commit: \`${issueState.merge_commit}\``;

  runCommand('gh', [
    'issue',
    'comment',
    String(issueState.issue_number),
    '--repo',
    repo,
    '--body',
    body,
  ]);
}

function markProjectItemDone(issueState, project, statusField, dryRun) {
  if (dryRun || !issueState.item_id || !statusField) {
    return;
  }

  runCommand('gh', [
    'project',
    'item-edit',
    '--id',
    issueState.item_id,
    '--project-id',
    project.id,
    '--field-id',
    statusField.fieldId,
    '--single-select-option-id',
    statusField.doneOptionId,
  ]);
}

function pushBranchesAtEnd(branches, dryRun) {
  if (dryRun) {
    return;
  }

  for (const branch of branches) {
    runCommand('git', ['push', '-u', 'origin', branch]);
  }
}

function buildRunMarkdown(ledger) {
  const lines = [];
  lines.push(`# PM Orchestrator Run ${ledger.run_id}`);
  lines.push('');
  lines.push(`- Project: ${ledger.project_title}`);
  lines.push(`- Milestone: ${ledger.milestone}`);
  lines.push(`- Worker: ${ledger.implementation_worker.type}:${ledger.implementation_worker.name}`);
  lines.push(`- Started: ${ledger.started_at}`);
  lines.push(`- Finished: ${ledger.finished_at || 'in-progress'}`);
  lines.push(`- Status: ${ledger.status}`);
  lines.push('');
  lines.push('## Issues');
  lines.push('');

  for (const issue of ledger.issue_runs) {
    lines.push(`- #${issue.issue_number} ${issue.issue_title}`);
    lines.push(`  - status: ${issue.status}`);
    lines.push(`  - branch: ${issue.issue_branch}`);
    lines.push(`  - agent_started_at: ${issue.agent_started_at || '-'}`);
    lines.push(`  - agent_finished_at: ${issue.agent_finished_at || '-'}`);
    lines.push(`  - agent_result: ${issue.agent_result || '-'}`);
    lines.push(`  - agent_blocker: ${issue.agent_blocker || '-'}`);
    lines.push(`  - merge_commit: ${issue.merge_commit || '-'}`);
  }

  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(ledger.summary || 'No summary yet.');

  return `${lines.join('\n')}\n`;
}

function persistLedger(ledger, jsonPath, markdownPath) {
  writeFileSyncSafe(jsonPath, `${JSON.stringify(ledger, null, 2)}\n`);
  writeFileSyncSafe(markdownPath, buildRunMarkdown(ledger));
}

function isDeadlineExceeded(deadlineMs) {
  return Date.now() >= deadlineMs;
}

function main() {
  const config = readJsonFile(CONFIG_PATH);
  const requiredSections = config.requiredReportSections || REQUIRED_REPORT_SECTIONS;

  validateImplementationWorker(config);

  const args = parseArgs(process.argv.slice(2), config);
  const { repo, owner } = resolveRepoAndOwner(args);

  assertCommandExists('gh');
  assertCommandExists('git');
  assertCommandExists('codex');

  assertGhAuthAndScopes();

  const project = resolveProject(owner, args.projectTitle);
  const statusField = resolveStatusField(project, owner, config);
  const issues = loadMilestoneIssues(project, owner, config, args.milestone);

  const milestoneBranch = `codex/milestone/${slugify(args.milestone)}`;
  const deadlineMs = Date.now() + args.timeCapMinutes * 60_000;

  const runDir = path.join(REPO_ROOT, 'docs', 'orchestration', 'runs');
  const ledgerJsonPath = path.join(runDir, `${args.runId}.json`);
  const ledgerMarkdownPath = path.join(runDir, `${args.runId}.md`);

  const ledger = {
    run_id: args.runId,
    started_at: nowIso(),
    finished_at: null,
    status: 'running',
    summary: '',
    project_title: args.projectTitle,
    project_id: project.id,
    milestone: args.milestone,
    base_branch: args.baseBranch,
    milestone_branch: milestoneBranch,
    implementation_worker: config.implementationWorker,
    issue_runs: [],
  };

  persistLedger(ledger, ledgerJsonPath, ledgerMarkdownPath);

  checkoutOrCreateMilestoneBranch(milestoneBranch, args.baseBranch, args.dryRun);

  const branchesToPush = new Set([milestoneBranch]);

  for (const issue of issues) {
    if (isDeadlineExceeded(deadlineMs)) {
      ledger.status = 'time_cap_reached';
      ledger.summary = `Stopped after reaching time cap (${args.timeCapMinutes} minutes).`;
      break;
    }

    ensureNumericIssueNumber(issue.issueNumber);

    const issueBranch = `codex/issue/${issue.issueNumber}-${slugify(issue.title)}`;
    const issueState = createIssueRunState(issue, issueBranch);
    issueState.status = 'planning';
    ledger.issue_runs.push(issueState);
    persistLedger(ledger, ledgerJsonPath, ledgerMarkdownPath);

    try {
      checkoutIssueBranch(milestoneBranch, issueBranch, args.dryRun);
      branchesToPush.add(issueBranch);

      const artifacts = ensureIssueArtifacts(issue);
      validatePlanFile(artifacts.planPath);

      issueState.status = 'implementing';
      issueState.agent_started_at = nowIso();
      persistLedger(ledger, ledgerJsonPath, ledgerMarkdownPath);

      const workerResult = dispatchImplementationAgent(issue, args.implementationNotes, requiredSections);

      issueState.agent_finished_at = nowIso();

      if (!workerResult.ok) {
        issueState.status = 'blocked';
        issueState.agent_result = 'failed';
        issueState.agent_blocker = workerResult.blocker;
        ledger.status = 'blocked';
        ledger.summary = `Blocked on issue #${issue.issueNumber}: ${workerResult.blocker}`;
        persistLedger(ledger, ledgerJsonPath, ledgerMarkdownPath);
        break;
      }

      issueState.agent_result = 'passed';
      issueState.agent_blocker = null;

      issueState.status = 'merging';
      issueState.merge_commit = mergeIssueIntoMilestone(issueState, milestoneBranch, args.dryRun);
      issueState.merged = true;

      commentIssue(repo, issueState, workerResult.sections, args.dryRun);
      markProjectItemDone(issueState, project, statusField, args.dryRun);

      issueState.status = 'done';
      persistLedger(ledger, ledgerJsonPath, ledgerMarkdownPath);
    } catch (error) {
      issueState.status = 'blocked';
      issueState.error = error.message;
      issueState.agent_result = issueState.agent_result || 'blocked';
      issueState.agent_finished_at = issueState.agent_finished_at || nowIso();
      issueState.agent_blocker = issueState.agent_blocker || error.message;
      ledger.status = 'blocked';
      ledger.summary = `Blocked on issue #${issue.issueNumber}: ${error.message}`;
      persistLedger(ledger, ledgerJsonPath, ledgerMarkdownPath);
      break;
    }
  }

  if (ledger.status === 'running') {
    ledger.status = 'completed';
    ledger.summary = `Completed ${ledger.issue_runs.filter((issue) => issue.status === 'done').length} issues.`;
  }

  if (ledger.status !== 'blocked') {
    pushBranchesAtEnd([...branchesToPush], args.dryRun);
  }

  ledger.finished_at = nowIso();
  persistLedger(ledger, ledgerJsonPath, ledgerMarkdownPath);

  process.stdout.write(`${JSON.stringify({
    runId: ledger.run_id,
    status: ledger.status,
    milestoneBranch: ledger.milestone_branch,
    ledgerPath: ledgerJsonPath,
  }, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
