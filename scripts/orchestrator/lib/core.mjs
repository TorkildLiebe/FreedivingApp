const DEFAULT_REQUIRED_REPORT_SECTIONS = [
  'Changes made',
  'Verification run',
  'Not run / limitations',
  'Risk notes',
];
const DEFAULT_REQUIRED_UI_EVIDENCE_LABELS = [
  'Design OS assets used:',
  'Component mapping:',
  'Design parity evidence:',
  'Approved deviations:',
];

const REQUIRED_TRAILER_FIELDS = [
  'RESULT',
  'VERIFICATION',
  'MOBILE_UI_TOUCHED',
  'IOS_VERIFIED',
  'ISSUE_NUMBER',
];

export const RUN_STATUSES = ['running', 'blocked', 'completed', 'time_cap_reached'];
export const ISSUE_STATUSES = [
  'pending',
  'planning',
  'implementing',
  'verifying',
  'committed',
  'merged_local',
  'blocked',
];

const COMMIT_SHA_REGEX = /^[0-9a-f]{7,40}$/i;

function normalizeHeading(value) {
  return value.trim().toLowerCase();
}

function normalizeBoolean(value) {
  return String(value).trim().toLowerCase() === 'true';
}

function deepClone(input) {
  return structuredClone(input);
}

export function nowIso() {
  return new Date().toISOString();
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

export function parseWorkerReport(markdown, requiredSections = DEFAULT_REQUIRED_REPORT_SECTIONS) {
  const cleanedMarkdown = markdown
    .replace(/^(RESULT|VERIFICATION|MOBILE_UI_TOUCHED|IOS_VERIFIED|ISSUE_NUMBER):\s*.+$/gm, '')
    .trim();
  const headingRegex = /^##\s+(.+)$/gm;
  const headings = [];
  let match = headingRegex.exec(cleanedMarkdown);

  while (match) {
    headings.push({
      heading: match[1].trim(),
      index: match.index,
      contentStart: headingRegex.lastIndex,
    });
    match = headingRegex.exec(cleanedMarkdown);
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

    const sectionText = cleanedMarkdown
      .slice(current.contentStart, next ? next.index : cleanedMarkdown.length)
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

export function parseWorkerTrailer(markdown) {
  const trailer = {};
  const trailerRegex = /^(RESULT|VERIFICATION|MOBILE_UI_TOUCHED|IOS_VERIFIED|ISSUE_NUMBER):\s*(.+)$/gm;
  let match = trailerRegex.exec(markdown);

  while (match) {
    trailer[match[1]] = match[2].trim();
    match = trailerRegex.exec(markdown);
  }

  return trailer;
}

export function validateWorkerTrailer(trailer, expectedIssueNumber = null) {
  for (const field of REQUIRED_TRAILER_FIELDS) {
    if (!(field in trailer)) {
      throw new Error(`Missing trailer field: ${field}`);
    }
  }

  const result = String(trailer.RESULT || '').toUpperCase();
  const verification = String(trailer.VERIFICATION || '').toUpperCase();
  const issueNumber = ensureNumericIssueNumber(trailer.ISSUE_NUMBER);

  if (!['PASS', 'FAIL'].includes(result)) {
    throw new Error(`Invalid trailer RESULT value: ${trailer.RESULT}`);
  }

  if (!['PASS', 'FAIL'].includes(verification)) {
    throw new Error(`Invalid trailer VERIFICATION value: ${trailer.VERIFICATION}`);
  }

  if (!['true', 'false'].includes(String(trailer.MOBILE_UI_TOUCHED).trim().toLowerCase())) {
    throw new Error(`Invalid MOBILE_UI_TOUCHED value: ${trailer.MOBILE_UI_TOUCHED}`);
  }

  if (!['true', 'false'].includes(String(trailer.IOS_VERIFIED).trim().toLowerCase())) {
    throw new Error(`Invalid IOS_VERIFIED value: ${trailer.IOS_VERIFIED}`);
  }

  if (expectedIssueNumber != null && issueNumber !== expectedIssueNumber) {
    throw new Error(
      `Trailer ISSUE_NUMBER mismatch. Expected ${expectedIssueNumber}, received ${issueNumber}`,
    );
  }

  return {
    RESULT: result,
    VERIFICATION: verification,
    MOBILE_UI_TOUCHED: normalizeBoolean(trailer.MOBILE_UI_TOUCHED),
    IOS_VERIFIED: normalizeBoolean(trailer.IOS_VERIFIED),
    ISSUE_NUMBER: issueNumber,
  };
}

function findMissingUiEvidenceLabels(sections, requiredUiEvidenceLabels) {
  const combinedSectionsText = Object.values(sections)
    .map((section) => String(section))
    .join('\n');

  return requiredUiEvidenceLabels.filter((label) => !combinedSectionsText.includes(label));
}

export function validateWorkerReportContract(
  markdown,
  {
    expectedIssueNumber = null,
    requiredSections = DEFAULT_REQUIRED_REPORT_SECTIONS,
    requiredUiEvidenceLabels = DEFAULT_REQUIRED_UI_EVIDENCE_LABELS,
  } = {},
) {
  const sections = parseWorkerReport(markdown, requiredSections);
  const trailer = validateWorkerTrailer(parseWorkerTrailer(markdown), expectedIssueNumber);
  const errors = [];

  if (trailer.VERIFICATION === 'FAIL' && trailer.RESULT === 'PASS') {
    errors.push('RESULT cannot be PASS when VERIFICATION is FAIL.');
  }

  if (trailer.MOBILE_UI_TOUCHED) {
    if (!trailer.IOS_VERIFIED) {
      errors.push('Mobile UI reports must set IOS_VERIFIED: true.');
    }

    const missingEvidenceLabels = findMissingUiEvidenceLabels(
      sections,
      requiredUiEvidenceLabels,
    );
    if (missingEvidenceLabels.length > 0) {
      errors.push(
        `Missing required UI evidence labels: ${missingEvidenceLabels.join(', ')}`,
      );
    }
  } else if (trailer.IOS_VERIFIED) {
    errors.push('Non-mobile reports must set IOS_VERIFIED: false.');
  }

  if (errors.length > 0) {
    throw new Error(`Worker report contract validation failed:\n- ${errors.join('\n- ')}`);
  }

  return { sections, trailer };
}

export function hasVerificationFailure(verificationSection, trailer = null) {
  const text = String(verificationSection || '').toLowerCase();
  const hasErrorKeywords = /\b(fail|failed|failing|error|errors|blocked)\b/.test(text);

  if (trailer && String(trailer.VERIFICATION || '').toUpperCase() === 'FAIL') {
    return true;
  }

  if (text.includes('all passed') || text.includes('pass') || text.includes('success')) {
    return hasErrorKeywords;
  }

  return hasErrorKeywords;
}

function createIssueState(now) {
  return {
    status: 'pending',
    attempts: 0,
    note: null,
    commit_sha: null,
    history: [{ status: 'pending', at: now }],
  };
}

function assertKnownIssue(state, issueNumber) {
  const key = String(issueNumber);
  if (!state.issues[key]) {
    throw new Error(`Issue ${issueNumber} is not present in run state.`);
  }
  return key;
}

function assertValidIssueStatus(status) {
  if (!ISSUE_STATUSES.includes(status)) {
    throw new Error(`Invalid issue status: ${status}`);
  }
}

function withUpdatedTimestamp(state, timestamp) {
  const clone = deepClone(state);
  clone.updated_at = timestamp;
  return clone;
}

export function createRunState({ runId, milestone, issueOrder, startedAt = nowIso() }) {
  if (!runId || !milestone) {
    throw new Error('createRunState requires runId and milestone.');
  }

  const normalizedOrder = issueOrder.map(ensureNumericIssueNumber);
  const attempts = {};
  const issues = {};

  for (const issueNumber of normalizedOrder) {
    const key = String(issueNumber);
    attempts[key] = 0;
    issues[key] = createIssueState(startedAt);
  }

  return {
    run_id: runId,
    milestone,
    status: 'running',
    started_at: startedAt,
    updated_at: startedAt,
    issue_order: normalizedOrder,
    current_issue: normalizedOrder[0] ?? null,
    attempts_by_issue: attempts,
    completed_issues: [],
    blocked_issue: null,
    stop_reason: null,
    issues,
  };
}

export function setCurrentIssue(state, issueNumber, timestamp = nowIso()) {
  const clone = withUpdatedTimestamp(state, timestamp);

  if (issueNumber == null) {
    clone.current_issue = null;
    return clone;
  }

  const normalized = ensureNumericIssueNumber(issueNumber);
  assertKnownIssue(clone, normalized);
  clone.current_issue = normalized;
  return clone;
}

export function setIssueStatus(state, issueNumber, status, timestamp = nowIso(), note = null) {
  assertValidIssueStatus(status);
  const clone = withUpdatedTimestamp(state, timestamp);
  const key = assertKnownIssue(clone, issueNumber);

  clone.issues[key].status = status;
  clone.issues[key].history.push({
    status,
    at: timestamp,
  });

  if (note !== null) {
    clone.issues[key].note = String(note);
  }

  return clone;
}

export function isValidCommitSha(value) {
  return COMMIT_SHA_REGEX.test(String(value).trim());
}

export function setIssueCommitSha(state, issueNumber, commitSha, timestamp = nowIso()) {
  if (!isValidCommitSha(commitSha)) {
    throw new Error(`Invalid commit SHA: ${commitSha}`);
  }

  const clone = withUpdatedTimestamp(state, timestamp);
  const key = assertKnownIssue(clone, issueNumber);
  clone.issues[key].commit_sha = String(commitSha).trim();
  return clone;
}

export function recordIssueAttempt(state, issueNumber, timestamp = nowIso()) {
  const clone = withUpdatedTimestamp(state, timestamp);
  const key = assertKnownIssue(clone, issueNumber);
  clone.attempts_by_issue[key] += 1;
  clone.issues[key].attempts += 1;
  return clone;
}

export function canRetryIssue(state, issueNumber, retryBudget) {
  const key = assertKnownIssue(state, issueNumber);
  const attempts = state.attempts_by_issue[key] ?? 0;
  return attempts <= retryBudget;
}

export function markIssueCompleted(state, issueNumber, timestamp = nowIso(), commitSha = null) {
  let clone = setIssueStatus(state, issueNumber, 'committed', timestamp);
  const normalized = ensureNumericIssueNumber(issueNumber);

  if (commitSha != null) {
    clone = setIssueCommitSha(clone, normalized, commitSha, timestamp);
  }

  if (!clone.completed_issues.includes(normalized)) {
    clone.completed_issues.push(normalized);
    clone.completed_issues.sort((a, b) => a - b);
  }

  clone = setCurrentIssue(clone, nextPendingIssue(clone), timestamp);
  return clone;
}

export function markIssueBlocked(state, issueNumber, reason, timestamp = nowIso()) {
  let clone = setIssueStatus(state, issueNumber, 'blocked', timestamp, reason);
  clone.status = 'blocked';
  clone.blocked_issue = ensureNumericIssueNumber(issueNumber);
  clone.stop_reason = String(reason);
  clone.current_issue = ensureNumericIssueNumber(issueNumber);
  return clone;
}

export function markIssuesMergedLocal(state, issueNumbers, timestamp = nowIso()) {
  let clone = withUpdatedTimestamp(state, timestamp);
  for (const issueNumber of issueNumbers.map(ensureNumericIssueNumber)) {
    clone = setIssueStatus(clone, issueNumber, 'merged_local', timestamp);
  }
  return clone;
}

export function completeRun(state, timestamp = nowIso()) {
  const clone = withUpdatedTimestamp(state, timestamp);
  clone.status = 'completed';
  clone.current_issue = null;
  clone.stop_reason = null;
  clone.blocked_issue = null;
  return clone;
}

export function nextPendingIssue(state) {
  for (const issueNumber of state.issue_order) {
    const key = String(issueNumber);
    if (!state.completed_issues.includes(issueNumber) && state.issues[key].status !== 'blocked') {
      return issueNumber;
    }
  }
  return null;
}

export function isMobileUiImpacting({ affectedSlices = [], touchedFiles = [] } = {}) {
  const normalizedSlices = affectedSlices.map((slice) => String(slice).toLowerCase());
  const mentionsMobileUi = normalizedSlices.some((slice) =>
    ['mobile', 'ui', 'mobile-ui', 'mobile_ui', 'frontend'].some((marker) => slice.includes(marker)),
  );

  const pathMatch = touchedFiles.some((filePath) => {
    const normalized = String(filePath).replace(/\\/g, '/').toLowerCase();
    if (!normalized.startsWith('apps/mobile/')) {
      return false;
    }

    return /(\/|^)(ui|screen|screens|component|components|navigation|route|routes)(\/|$)/.test(
      normalized,
    );
  });

  return mentionsMobileUi || pathMatch;
}

export function renderRoadmapMarkdown(state, issueMetadata = {}) {
  const lines = [];
  lines.push(`# Run Roadmap ${state.run_id}`);
  lines.push('');
  lines.push(`- Milestone: ${state.milestone}`);
  lines.push(`- Status: ${state.status}`);
  lines.push(`- Current issue: ${state.current_issue ?? 'none'}`);
  lines.push(`- Updated at: ${state.updated_at}`);
  lines.push('');
  lines.push('| Issue | Title | Status | Attempts | Note |');
  lines.push('| --- | --- | --- | --- | --- |');

  for (const issueNumber of state.issue_order) {
    const key = String(issueNumber);
    const issue = state.issues[key];
    const title = issueMetadata[key]?.title || `Issue ${issueNumber}`;
    lines.push(
      `| #${issueNumber} | ${title} | ${issue.status} | ${issue.attempts} | ${issue.note ?? ''} |`,
    );
  }

  return `${lines.join('\n')}\n`;
}

export const REQUIRED_REPORT_SECTIONS = DEFAULT_REQUIRED_REPORT_SECTIONS;
export const REQUIRED_TRAILER_KEYS = REQUIRED_TRAILER_FIELDS;
export const REQUIRED_UI_EVIDENCE_LABELS = DEFAULT_REQUIRED_UI_EVIDENCE_LABELS;
