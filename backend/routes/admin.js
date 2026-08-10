const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const {
  listSubmissionsHandler,
  getSubmissionHandler,
  updateStatusHandler,
  updateEvaluationHandler,
  scoreSubmissionHandler,
} = require('../controllers/admin');

const router = express.Router();

router.use(adminAuth);

router.get('/submissions', listSubmissionsHandler);
router.get('/submissions/:id', getSubmissionHandler);
router.patch('/submissions/:id/status', updateStatusHandler);
router.patch('/submissions/:id/evaluation', updateEvaluationHandler);
router.post('/submissions/:id/score', scoreSubmissionHandler);

module.exports = router;
