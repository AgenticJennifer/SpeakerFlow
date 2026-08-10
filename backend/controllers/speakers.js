const {
  createSpeakerSubmission,
  getSubmissionByToken,
  updateSubmissionByToken,
} = require('../models/airtable');
const { sendConfirmationEmail } = require('../services/email');

async function submitSpeaker(req, res, next) {
  try {
    const { name, email, bio, talkTitle, talkDescription } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }

    const submission = await createSpeakerSubmission({
      name,
      email,
      bio,
      talkTitle,
      talkDescription,
    });

    sendConfirmationEmail(submission).catch((error) => {
      console.error('Failed to send confirmation email:', error);
    });

    return res.status(201).json({
      message: 'Speaker submission received',
      submission,
    });
  } catch (error) {
    return next(error);
  }
}

async function getSubmissionByTokenHandler(req, res, next) {
  try {
    const submission = await getSubmissionByToken(req.params.token);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    return res.json({ submission });
  } catch (error) {
    return next(error);
  }
}

async function updateSubmissionByTokenHandler(req, res, next) {
  try {
    const { name, email, bio, talkTitle, talkDescription } = req.body || {};
    const submission = await updateSubmissionByToken(req.params.token, {
      name,
      email,
      bio,
      talkTitle,
      talkDescription,
    });
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    return res.json({ submission });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  submitSpeaker,
  getSubmissionByTokenHandler,
  updateSubmissionByTokenHandler,
};
