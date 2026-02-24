#!/usr/bin/env node

console.error(
  [
    'The script-based milestone runner is deprecated.',
    'Use Codex multi-agent orchestration from the prompt window instead:',
    '  use monitor-agent run milestone <MILESTONE>',
  ].join('\n'),
);

process.exit(1);
