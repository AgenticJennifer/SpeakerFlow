const crypto = require('crypto');
const Airtable = require('airtable');
const withRetry = require('../lib/withRetry');
const { FIELDS, STATUS } = require('../constants/fields');

function getTable() {
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME } = process.env;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
    const error = new Error(
      'Airtable is not configured. Set AIRTABLE_API_KEY, AIRTABLE_BASE_ID, and AIRTABLE_TABLE_NAME.'
    );
    error.statusCode = 503;
    throw error;
  }

  return new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID)(
    AIRTABLE_TABLE_NAME
  );
}

function toSubmission(record, { includeToken = false } = {}) {
  const submission = {
    id: record.id,
    name: record.get(FIELDS.NAME) || '',
    email: record.get(FIELDS.EMAIL) || '',
    bio: record.get(FIELDS.BIO) || '',
    talkTitle: record.get(FIELDS.TALK_TITLE) || '',
    talkDescription: record.get(FIELDS.TALK_DESCRIPTION) || '',
    status: record.get(FIELDS.STATUS) || STATUS.SUBMITTED,
    aiSuggestedScore: record.get(FIELDS.AI_SUGGESTED_SCORE) ?? null,
    aiRationale: record.get(FIELDS.AI_RATIONALE) || '',
    aiSummary: record.get(FIELDS.AI_SUMMARY) || '',
    aiSuggestedTrack: record.get(FIELDS.AI_SUGGESTED_TRACK) || '',
    evaluatorScore: record.get(FIELDS.EVALUATOR_SCORE) ?? null,
    evaluatorNotes: record.get(FIELDS.EVALUATOR_NOTES) || '',
    sessionDay: record.get(FIELDS.SESSION_DAY) || '',
    sessionRoom: record.get(FIELDS.SESSION_ROOM) || '',
    sessionStart: record.get(FIELDS.SESSION_START) || '',
    sessionEnd: record.get(FIELDS.SESSION_END) || '',
    createdTime: record._rawJson.createdTime,
  };
  if (includeToken) {
    submission.editToken = record.get(FIELDS.EDIT_TOKEN) || '';
  }
  return submission;
}

const EDIT_TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeFormulaString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function createSpeakerSubmission({ name, email, bio, talkTitle, talkDescription }) {
  const editToken = crypto.randomUUID();

  const record = await withRetry(() =>
    getTable().create({
      [FIELDS.NAME]: name,
      [FIELDS.EMAIL]: email,
      [FIELDS.BIO]: bio || '',
      [FIELDS.TALK_TITLE]: talkTitle || '',
      [FIELDS.TALK_DESCRIPTION]: talkDescription || '',
      [FIELDS.STATUS]: STATUS.SUBMITTED,
      [FIELDS.EDIT_TOKEN]: editToken,
    })
  );

  return { ...toSubmission(record), editToken };
}

async function findRecordByToken(token) {
  if (typeof token !== 'string' || !EDIT_TOKEN_RE.test(token)) {
    return null;
  }

  const records = await withRetry(() =>
    getTable()
      .select({
        filterByFormula: `{${FIELDS.EDIT_TOKEN}} = '${escapeFormulaString(token)}'`,
        maxRecords: 1,
      })
      .firstPage()
  );

  return records[0] || null;
}

async function getSubmissionByToken(token) {
  const record = await findRecordByToken(token);
  return record ? toSubmission(record, { includeToken: true }) : null;
}

async function updateSubmissionByToken(token, fields) {
  const record = await findRecordByToken(token);
  if (!record) return null;

  const currentStatus = record.get(FIELDS.STATUS) || STATUS.SUBMITTED;
  if (currentStatus === STATUS.ACCEPTED || currentStatus === STATUS.REJECTED) {
    const error = new Error('This submission is locked and can no longer be edited.');
    error.statusCode = 403;
    throw error;
  }

  const allowedFields = {};
  if (fields.name !== undefined) allowedFields[FIELDS.NAME] = fields.name;
  if (fields.email !== undefined) allowedFields[FIELDS.EMAIL] = fields.email;
  if (fields.bio !== undefined) allowedFields[FIELDS.BIO] = fields.bio;
  if (fields.talkTitle !== undefined) allowedFields[FIELDS.TALK_TITLE] = fields.talkTitle;
  if (fields.talkDescription !== undefined) {
    allowedFields[FIELDS.TALK_DESCRIPTION] = fields.talkDescription;
  }

  const updated = await withRetry(() => getTable().update(record.id, allowedFields));
  return toSubmission(updated, { includeToken: true });
}

async function getSubmissionById(id) {
  const record = await withRetry(() => getTable().find(id));
  return toSubmission(record);
}

async function listSubmissions({ status } = {}) {
  const selectOptions = {
    sort: [{ field: FIELDS.NAME, direction: 'asc' }],
  };
  if (status) {
    selectOptions.filterByFormula = `{${FIELDS.STATUS}} = '${escapeFormulaString(status)}'`;
  }

  const records = await withRetry(() => getTable().select(selectOptions).all());
  return records
    .map((record) => toSubmission(record))
    .sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));
}

async function updateSubmissionStatus(id, status) {
  const updated = await withRetry(() =>
    getTable().update(id, { [FIELDS.STATUS]: status })
  );
  // includeToken so the status-change email can build the self-service link.
  // The admin controller strips editToken before sending the HTTP response.
  return toSubmission(updated, { includeToken: true });
}

async function updateSubmissionEvaluation(id, { evaluatorScore, evaluatorNotes }) {
  const fields = {};
  if (evaluatorScore !== undefined) fields[FIELDS.EVALUATOR_SCORE] = evaluatorScore;
  if (evaluatorNotes !== undefined) fields[FIELDS.EVALUATOR_NOTES] = evaluatorNotes;

  const updated = await withRetry(() => getTable().update(id, fields));
  return toSubmission(updated);
}

async function updateSubmissionScore(id, { aiScore, aiRationale, aiSummary, aiSuggestedTrack }) {
  const updated = await withRetry(() =>
    getTable().update(id, {
      [FIELDS.AI_SUGGESTED_SCORE]: aiScore,
      [FIELDS.AI_RATIONALE]: aiRationale,
      [FIELDS.AI_SUMMARY]: aiSummary || '',
      [FIELDS.AI_SUGGESTED_TRACK]: aiSuggestedTrack || '',
    })
  );
  return toSubmission(updated);
}

// --- Agenda / scheduling ------------------------------------------------
// HH:MM strings compare correctly with plain string comparison (zero-padded,
// no timezone math needed since a single conference runs on one local clock).
function timeRangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function sessionsConflict(a, b) {
  return (
    a.id !== b.id &&
    a.sessionDay &&
    b.sessionDay &&
    a.sessionDay === b.sessionDay &&
    a.sessionRoom &&
    b.sessionRoom &&
    a.sessionRoom === b.sessionRoom &&
    timeRangesOverlap(a.sessionStart, a.sessionEnd, b.sessionStart, b.sessionEnd)
  );
}

async function getAgenda() {
  const scheduled = await listSubmissions({ status: STATUS.ACCEPTED });
  const withSchedule = scheduled.filter((s) => s.sessionDay && s.sessionRoom && s.sessionStart && s.sessionEnd);

  return withSchedule.map((session) => ({
    ...session,
    conflictsWith: withSchedule
      .filter((other) => sessionsConflict(session, other))
      .map((other) => other.id),
  }));
}

async function updateSubmissionSchedule(id, { sessionDay, sessionRoom, sessionStart, sessionEnd }) {
  const updated = await withRetry(() =>
    getTable().update(id, {
      [FIELDS.SESSION_DAY]: sessionDay || '',
      [FIELDS.SESSION_ROOM]: sessionRoom || '',
      [FIELDS.SESSION_START]: sessionStart || '',
      [FIELDS.SESSION_END]: sessionEnd || '',
    })
  );
  const submission = toSubmission(updated, { includeToken: true });

  const agenda = await getAgenda();
  const conflictsWith = agenda.find((s) => s.id === id)?.conflictsWith || [];

  return { submission, conflictsWith };
}

async function getDashboardStats() {
  const all = await listSubmissions({});

  const acceptedUnscheduled = all.filter(
    (s) => s.status === STATUS.ACCEPTED && !(s.sessionDay && s.sessionRoom && s.sessionStart && s.sessionEnd)
  );
  const unscored = all.filter(
    (s) =>
      (s.status === STATUS.SUBMITTED || s.status === STATUS.UNDER_REVIEW) &&
      s.aiSuggestedScore == null &&
      s.evaluatorScore == null
  );
  const missingMaterials = all.filter(
    (s) => s.status === STATUS.ACCEPTED && (!s.bio || !s.talkDescription)
  );

  const summarize = (s) => ({ id: s.id, name: s.name, talkTitle: s.talkTitle, status: s.status });

  return {
    totalSubmissions: all.length,
    acceptedUnscheduled: { count: acceptedUnscheduled.length, items: acceptedUnscheduled.map(summarize) },
    unscored: { count: unscored.length, items: unscored.map(summarize) },
    missingMaterials: { count: missingMaterials.length, items: missingMaterials.map(summarize) },
  };
}

// --- Demo data (judge demo mode) --------------------------------------------
// Demo records are marked by this email domain so they can be wiped in one
// call without touching real submissions.
const DEMO_EMAIL_DOMAIN = 'demo.sessionboard.local';

async function seedDemoSubmissions(rows) {
  const created = [];
  for (const row of rows) {
    const record = await withRetry(() =>
      getTable().create({
        [FIELDS.NAME]: row.name,
        [FIELDS.EMAIL]: row.email,
        [FIELDS.BIO]: row.bio,
        [FIELDS.TALK_TITLE]: row.talkTitle,
        [FIELDS.TALK_DESCRIPTION]: row.talkDescription,
        [FIELDS.STATUS]: row.status,
        [FIELDS.EDIT_TOKEN]: crypto.randomUUID(),
        ...(row.aiSuggestedScore != null && {
          [FIELDS.AI_SUGGESTED_SCORE]: row.aiSuggestedScore,
          [FIELDS.AI_RATIONALE]: row.aiRationale || '',
          [FIELDS.AI_SUMMARY]: row.aiSummary || '',
          [FIELDS.AI_SUGGESTED_TRACK]: row.aiSuggestedTrack || '',
        }),
        ...(row.evaluatorScore != null && {
          [FIELDS.EVALUATOR_SCORE]: row.evaluatorScore,
          [FIELDS.EVALUATOR_NOTES]: row.evaluatorNotes || '',
        }),
      })
    );
    created.push(toSubmission(record));
  }
  return created;
}

async function clearDemoSubmissions() {
  const records = await withRetry(() =>
    getTable()
      .select({
        filterByFormula: `FIND('@${DEMO_EMAIL_DOMAIN}', {${FIELDS.EMAIL}})`,
      })
      .all()
  );
  let deleted = 0;
  // destroy() accepts at most 10 record ids per call.
  for (let i = 0; i < records.length; i += 10) {
    const batch = records.slice(i, i + 10).map((r) => r.id);
    await withRetry(() => getTable().destroy(batch));
    deleted += batch.length;
  }
  return deleted;
}

module.exports = {
  createSpeakerSubmission,
  getSubmissionByToken,
  updateSubmissionByToken,
  getSubmissionById,
  listSubmissions,
  updateSubmissionStatus,
  updateSubmissionEvaluation,
  updateSubmissionScore,
  getAgenda,
  updateSubmissionSchedule,
  getDashboardStats,
  seedDemoSubmissions,
  clearDemoSubmissions,
  DEMO_EMAIL_DOMAIN,
};
