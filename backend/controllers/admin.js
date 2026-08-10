const {
  listSubmissions,
  getSubmissionById,
  updateSubmissionStatus,
  updateSubmissionEvaluation,
  updateSubmissionScore,
  seedDemoSubmissions,
  clearDemoSubmissions,
} = require('../models/airtable');
const { DEMO_SUBMISSIONS } = require('../constants/demoData');
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
    const { score, rationale, summary, suggestedTrack } = await scoreSubmission({
      bio: submission.bio,
      talkTitle: submission.talkTitle,
      talkDescription: submission.talkDescription,
    });

    const updated = await updateSubmissionScore(req.params.id, {
      aiScore: score,
      aiRationale: rationale,
      aiSummary: summary,
      aiSuggestedTrack: suggestedTrack,
    });

    return res.json({ submission: updated });
  } catch (error) {
    return next(error);
  }
}

// Judge demo mode: seed a realistic set of submissions in one click, and wipe
// exactly those records (matched by demo email domain) in one click.
async function seedDemoHandler(req, res, next) {
  try {
    const created = await seedDemoSubmissions(DEMO_SUBMISSIONS);
    return res.status(201).json({ created: created.length });
  } catch (error) {
    return next(error);
  }
}

async function clearDemoHandler(req, res, next) {
  try {
    const deleted = await clearDemoSubmissions();
    return res.json({ deleted });
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
  seedDemoHandler,
  clearDemoHandler,
};
