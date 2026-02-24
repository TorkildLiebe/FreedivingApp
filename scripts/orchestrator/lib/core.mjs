const DEFAULT_REQUIRED_REPORT_SECTIONS = [
  'Changes made',
  'Verification run',
  'Not run / limitations',
  'Risk notes',
];

function normalizeHeading(value) {
  return value.trim().toLowerCase();
}

export function slugify(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function ensureNumericIssueNumber(value) {
  if (!/^\d+$/.test(String(value).trim())) {
    throw new Error(`Issue number must be numeric. Received: ${value}`);
  }

  return Number(value);
}

export function validateImplementationWorker(config) {
  const worker = config?.implementationWorker;

  if (!worker || typeof worker !== 'object') {
    throw new Error('Missing implementationWorker config.');
  }

  if (worker.type !== 'agent') {
    throw new Error(`implementationWorker.type must be "agent". Received: ${worker.type}`);
  }

  if (worker.name !== 'vertical-slice-implementor') {
    throw new Error(
      `implementationWorker.name must be "vertical-slice-implementor". Received: ${worker.name}`,
    );
  }

  return worker;
}

export function extractFieldValue(item, fieldName) {
  const expected = normalizeHeading(fieldName);
  const values = Array.isArray(item?.fieldValues)
    ? item.fieldValues
    : Array.isArray(item?.fieldValues?.nodes)
      ? item.fieldValues.nodes
      : [];

  for (const value of values) {
    const currentName =
      value?.field?.name ?? value?.fieldName ?? value?.name ?? value?.title ?? '';

    if (normalizeHeading(currentName) !== expected) {
      continue;
    }

    if (typeof value?.text === 'string') {
      return value.text;
    }

    if (typeof value?.name === 'string') {
      return value.name;
    }

    if (typeof value?.optionName === 'string') {
      return value.optionName;
    }

    if (value?.number != null) {
      return String(value.number);
    }

    if (typeof value?.date === 'string') {
      return value.date;
    }

    if (typeof value?.value === 'string') {
      return value.value;
    }
  }

  return '';
}

export function filterProjectIssues(items, options) {
  const {
    milestone,
    milestoneFieldName,
    statusFieldName,
    doneStatusValues,
  } = options;

  const doneSet = new Set(doneStatusValues.map((value) => normalizeHeading(value)));
  const milestoneValue = normalizeHeading(milestone);

  return items
    .map((item, index) => {
      const content = item?.content ?? {};
      const issueNumber = content?.number;
      const title = content?.title;
      const url = content?.url;

      if (!issueNumber || !title || !url) {
        return null;
      }

      const currentMilestone = extractFieldValue(item, milestoneFieldName);
      const currentStatus = extractFieldValue(item, statusFieldName);

      return {
        order: index,
        itemId: item?.id,
        issueNumber: ensureNumericIssueNumber(issueNumber),
        title,
        url,
        milestone: currentMilestone,
        status: currentStatus,
      };
    })
    .filter(Boolean)
    .filter((item) => normalizeHeading(item.milestone) === milestoneValue)
    .filter((item) => !doneSet.has(normalizeHeading(item.status)))
    .sort((a, b) => a.order - b.order);
}

export function parseWorkerReport(markdown, requiredSections = DEFAULT_REQUIRED_REPORT_SECTIONS) {
  const headingRegex = /^##\s+(.+)$/gm;
  const headings = [];
  let match = headingRegex.exec(markdown);

  while (match) {
    headings.push({
      heading: match[1].trim(),
      index: match.index,
      contentStart: headingRegex.lastIndex,
    });

    match = headingRegex.exec(markdown);
  }

  const allowed = new Set(requiredSections.map((section) => normalizeHeading(section)));
  const sections = {};

  for (let index = 0; index < headings.length; index += 1) {
    const current = headings[index];
    const next = headings[index + 1];
    const normalized = normalizeHeading(current.heading);

    if (!allowed.has(normalized)) {
      throw new Error(`Unexpected report section: ${current.heading}`);
    }

    const sectionText = markdown
      .slice(current.contentStart, next ? next.index : markdown.length)
      .trim();

    sections[current.heading] = sectionText;
  }

  const missing = requiredSections.filter((section) => !(section in sections));

  if (missing.length > 0) {
    throw new Error(`Missing report sections: ${missing.join(', ')}`);
  }

  if (Object.keys(sections).length !== requiredSections.length) {
    throw new Error('Worker report must include exactly the required sections.');
  }

  return sections;
}

export function hasVerificationFailure(verificationSection) {
  const text = verificationSection.toLowerCase();

  if (text.includes('all passed') || text.includes('pass') || text.includes('success')) {
    const explicitFailure = /\b(fail|failed|failing|error|errors|blocked)\b/.test(text);
    if (!explicitFailure) {
      return false;
    }
  }

  return /\b(fail|failed|failing|error|errors|blocked)\b/.test(text);
}

export function createIssueRunState(issue, issueBranch) {
  return {
    issue_number: issue.issueNumber,
    issue_title: issue.title,
    issue_url: issue.url,
    item_id: issue.itemId,
    issue_branch: issueBranch,
    merged: false,
    status: 'pending',
    agent_started_at: null,
    agent_finished_at: null,
    agent_result: null,
    agent_blocker: null,
    merge_commit: null,
    error: null,
  };
}

export function nowIso() {
  return new Date().toISOString();
}

export const REQUIRED_REPORT_SECTIONS = DEFAULT_REQUIRED_REPORT_SECTIONS;
