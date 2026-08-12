const {
  listSubmissions,
  getSubmissionById,
  updateSubmissionStatus,
  updateSubmissionEvaluation,
  updateSubmissionScore,
  getAgenda,
  updateSubmissionSchedule,
  getDashboardStats,
  seedDemoSubmissions,
  clearDemoSubmissions,
} = require('../models/airtable');
const { DEMO_SUBMISSIONS } = require('../constants/demoData');
const { scoreSubmission } = require('../services/openaiScoring');
const { sendStatusChangeEmail, sendCalendarInviteEmail } = require('../services/email');
const { buildSessionInvite } = require('../services/icsCalendar');
const { STATUS } = require('../constants/fields');

const ORGANIZER_EMAIL = process.env.RESEND_FROM_EMAIL || 'organizer@sessionboard.local';

function isFullyScheduled(submission) {
  return Boolean(
    submission.sessionDay && submission.sessionRoom && submission.sessionStart && submission.sessionEnd
  );
}

function icsForSubmission(submission) {
  return buildSessionInvite({
    id: submission.id,
    talkTitle: submission.talkTitle,
    talkDescription: submission.talkDescription,
    sessionDay: submission.sessionDay,
    sessionRoom: submission.sessionRoom,
    sessionStart: submission.sessionStart,
    sessionEnd: submission.sessionEnd,
    attendeeEmail: submission.email,
    attendeeName: submission.name,
    organizerEmail: ORGANIZER_EMAIL,
  });
}

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
    const withToken = { ...submission, editToken };

    const icsContent =
      status === STATUS.ACCEPTED && isFullyScheduled(submission) ? icsForSubmission(withToken) : undefined;

    sendStatusChangeEmail(withToken, status, icsContent).catch((error) => {
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

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

async function getAgendaHandler(req, res, next) {
  try {
    const sessions = await getAgenda();
    return res.json({ sessions });
  } catch (error) {
    return next(error);
  }
}

async function updateScheduleHandler(req, res, next) {
  try {
    const { sessionDay, sessionRoom, sessionStart, sessionEnd } = req.body || {};

    const clearing = !sessionDay && !sessionRoom && !sessionStart && !sessionEnd;
    if (!clearing) {
      if (!sessionDay || !sessionRoom) {
        return res.status(400).json({ error: 'sessionDay and sessionRoom are required' });
      }
      if (!TIME_RE.test(sessionStart) || !TIME_RE.test(sessionEnd)) {
        return res.status(400).json({ error: 'sessionStart/sessionEnd must be HH:MM (24h)' });
      }
      if (sessionStart >= sessionEnd) {
        return res.status(400).json({ error: 'sessionStart must be before sessionEnd' });
      }
    }

    const { submission: withToken, conflictsWith } = await updateSubmissionSchedule(req.params.id, {
      sessionDay,
      sessionRoom,
      sessionStart,
      sessionEnd,
    });
    const { editToken, ...submission } = withToken;

    if (submission.status === STATUS.ACCEPTED && isFullyScheduled(submission)) {
      const icsContent = icsForSubmission(withToken);
      sendCalendarInviteEmail(withToken, icsContent).catch((error) => {
        console.error('Failed to send calendar invite email:', error);
      });
    }

    return res.json({ submission, conflictsWith });
  } catch (error) {
    return next(error);
  }
}

async function getDashboardHandler(req, res, next) {
  try {
    const stats = await getDashboardStats();
    return res.json(stats);
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
  getAgendaHandler,
  updateScheduleHandler,
  getDashboardHandler,
  seedDemoHandler,
  clearDemoHandler,
};
