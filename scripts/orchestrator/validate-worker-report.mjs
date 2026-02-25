#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { ensureNumericIssueNumber, validateWorkerReportContract } from './lib/core.mjs';

export async function runValidateWorkerReport({ reportPath, issueNumber }) {
  const normalizedIssueNumber = ensureNumericIssueNumber(issueNumber);
  const markdown = await readFile(reportPath, 'utf8');
  const { trailer } = validateWorkerReportContract(markdown, {
    expectedIssueNumber: normalizedIssueNumber,
  });

  console.log(
    `Worker report contract validation passed for issue #${trailer.ISSUE_NUMBER}.`,
  );

  return trailer;
}

function parseCliArgs(argv) {
  const normalizedArgs = argv[0] === '--' ? argv.slice(1) : argv;
  const { values } = parseArgs({
    args: normalizedArgs,
    options: {
      'report-path': { type: 'string' },
      'issue-number': { type: 'string' },
    },
    strict: true,
  });

  if (!values['report-path'] || !values['issue-number']) {
    throw new Error(
      'Usage: node scripts/orchestrator/validate-worker-report.mjs --report-path <path> --issue-number <n>',
    );
  }

  return {
    reportPath: values['report-path'],
    issueNumber: values['issue-number'],
  };
}

async function main() {
  try {
    const args = parseCliArgs(process.argv.slice(2));
    await runValidateWorkerReport(args);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
