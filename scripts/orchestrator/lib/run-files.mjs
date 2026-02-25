import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { renderRoadmapMarkdown } from './core.mjs';

export function resolveRunPaths(runId) {
  const normalized = String(runId).trim();
  if (!normalized) {
    throw new Error('Run id is required.');
  }

  const runDir = path.join('docs', 'orchestration', 'runs', normalized);
  return {
    runDir,
    runStatePath: path.join(runDir, 'run.json'),
    roadmapPath: path.join(runDir, 'roadmap.md'),
    issuesDir: path.join(runDir, 'issues'),
  };
}

export async function readJsonFile(filePath) {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

export async function readRunState(runId) {
  const paths = resolveRunPaths(runId);
  const state = await readJsonFile(paths.runStatePath);
  return { paths, state };
}

export function parseRoadmapIssueMetadata(markdown) {
  const metadata = {};
  const lines = String(markdown).split('\n');

  for (const line of lines) {
    const match = line.match(
      /^\|\s*#(\d+)\s*\|\s*(.*?)\s*\|\s*(pending|planning|implementing|verifying|committed|merged_local|blocked)\s*\|\s*(\d+)\s*\|\s*(.*?)\s*\|$/,
    );
    if (!match) {
      continue;
    }

    const [, issue, title, , , note] = match;
    metadata[issue] = {
      title,
      note: note || '',
    };
  }

  return metadata;
}

export async function readRoadmapIssueMetadata(roadmapPath) {
  const markdown = await readFile(roadmapPath, 'utf8');
  return parseRoadmapIssueMetadata(markdown);
}

export async function writeFileAtomic(filePath, content) {
  const directory = path.dirname(filePath);
  await mkdir(directory, { recursive: true });

  const tempPath = path.join(
    directory,
    `.${path.basename(filePath)}.${Date.now()}.${process.pid}.tmp`,
  );
  await writeFile(tempPath, content, 'utf8');
  await rename(tempPath, filePath);
}

export async function writeRunStateAndRoadmap({
  runStatePath,
  roadmapPath,
  state,
  issueMetadata,
}) {
  const runStateJson = `${JSON.stringify(state, null, 2)}\n`;
  const roadmapMarkdown = renderRoadmapMarkdown(state, issueMetadata);

  await writeFileAtomic(runStatePath, runStateJson);
  await writeFileAtomic(roadmapPath, roadmapMarkdown);
}
