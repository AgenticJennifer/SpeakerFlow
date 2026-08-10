const {
  listSubmissions,
  getSubmissionById,
  updateSubmissionStatus,
  updateSubmissionEvaluation,
  updateSubmissionScore,
} = require('../models/airtable');
const { scoreSubmission } = require('../services/openaiScoring');
const { sendStatusChangeEmail } = require('../services/email');
const { STATUS } = require('../constants/fields');

const VALID_STATUSES = Object.values(STATUS);

async function listSubmissionsHandler(req, res, next) {
  try {
    const { status } = req.query;
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${VALID_STATUSES.join(', ')}` });
    }
    const submissions = await listSubmissions({ status });
    return res.json({ submissions });
  } catch (error) {
    return next(error);
  }
}

async function getSubmissionHandler(req, res, next) {
  try {
    const submission = await getSubmissionById(req.params.id);
    return res.json({ submission });
  } catch (error) {
    return next(error);
  }
}

async function updateStatusHandler(req, res, next) {
  try {
    const { status } = req.body || {};
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${VALID_STATUSES.join(', ')}` });
    }

    // Model returns editToken so the email can build the self-service link;
    // strip it from the HTTP response so it never reaches the admin UI.
    const { editToken, ...submission } = await updateSubmissionStatus(req.params.id, status);

    sendStatusChangeEmail({ ...submission, editToken }, status).catch((error) => {
      console.error('Failed to send status-change email:', error);
    });

    return res.json({ submission });
  } catch (error) {
    return next(error);
  }
}

async function updateEvaluationHandler(req, res, next) {
  try {
    const { evaluatorScore, evaluatorNotes } = req.body || {};
    const submission = await updateSubmissionEvaluation(req.params.id, {
      evaluatorScore,
      evaluatorNotes,
    });
    return res.json({ submission });
  } catch (error) {
    return next(error);
  }
}

async function scoreSubmissionHandler(req, res, next) {
  try {
    const submission = await getSubmissionById(req.params.id);
    const { score, rationale } = await scoreSubmission({
      bio: submission.bio,
      talkTitle: submission.talkTitle,
      talkDescription: submission.talkDescription,
    });

    const updated = await updateSubmissionScore(req.params.id, {
      aiScore: score,
      aiRationale: rationale,
    });

    return res.json({ submission: updated });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listSubmissionsHandler,
  getSubmissionHandler,
  updateStatusHandler,
  updateEvaluationHandler,
  scoreSubmissionHandler,
};
