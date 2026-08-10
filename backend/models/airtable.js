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
    evaluatorScore: record.get(FIELDS.EVALUATOR_SCORE) ?? null,
    evaluatorNotes: record.get(FIELDS.EVALUATOR_NOTES) || '',
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
  return toSubmission(updated);
}

async function updateSubmissionEvaluation(id, { evaluatorScore, evaluatorNotes }) {
  const fields = {};
  if (evaluatorScore !== undefined) fields[FIELDS.EVALUATOR_SCORE] = evaluatorScore;
  if (evaluatorNotes !== undefined) fields[FIELDS.EVALUATOR_NOTES] = evaluatorNotes;

  const updated = await withRetry(() => getTable().update(id, fields));
  return toSubmission(updated);
}

async function updateSubmissionScore(id, { aiScore, aiRationale }) {
  const updated = await withRetry(() =>
    getTable().update(id, {
      [FIELDS.AI_SUGGESTED_SCORE]: aiScore,
      [FIELDS.AI_RATIONALE]: aiRationale,
    })
  );
  return toSubmission(updated);
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
};
