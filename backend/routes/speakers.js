const express = require('express');
const {
  submitSpeaker,
  getSubmissionByTokenHandler,
  updateSubmissionByTokenHandler,
} = require('../controllers/speakers');

const router = express.Router();

router.post('/', submitSpeaker);
router.get('/by_token/:token', getSubmissionByTokenHandler);
router.patch('/by_token/:token', updateSubmissionByTokenHandler);

module.exports = router;
