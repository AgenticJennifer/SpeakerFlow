const FIELDS = {
  NAME: 'Name',
  EMAIL: 'Email',
  BIO: 'Bio',
  TALK_TITLE: 'Talk Title',
  TALK_DESCRIPTION: 'Talk Description',
  STATUS: 'Status',
  EDIT_TOKEN: 'Edit Token',
  AI_SUGGESTED_SCORE: 'AI Suggested Score',
  AI_RATIONALE: 'AI Rationale',
  AI_SUMMARY: 'AI Summary',
  AI_SUGGESTED_TRACK: 'AI Suggested Track',
  EVALUATOR_SCORE: 'Evaluator Score',
  EVALUATOR_NOTES: 'Evaluator Notes',
  SESSION_DAY: 'Session Day',
  SESSION_ROOM: 'Session Room',
  SESSION_START: 'Session Start',
  SESSION_END: 'Session End',
};

const STATUS = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
};

const DECIDED_STATUSES = [STATUS.ACCEPTED, STATUS.REJECTED];

module.exports = { FIELDS, STATUS, DECIDED_STATUSES };
