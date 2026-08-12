const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const {
  listSubmissionsHandler,
  getSubmissionHandler,
  updateStatusHandler,
  updateEvaluationHandler,
  scoreSubmissionHandler,
  getAgendaHandler,
  updateScheduleHandler,
  getDashboardHandler,
  sendReminderHandler,
  seedDemoHandler,
  clearDemoHandler,
} = require('../controllers/admin');

const router = express.Router();

router.use(adminAuth);

router.get('/submissions', listSubmissionsHandler);
router.get('/submissions/:id', getSubmissionHandler);
router.patch('/submissions/:id/status', updateStatusHandler);
router.patch('/submissions/:id/evaluation', updateEvaluationHandler);
router.post('/submissions/:id/score', scoreSubmissionHandler);
router.get('/agenda', getAgendaHandler);
router.patch('/submissions/:id/schedule', updateScheduleHandler);
router.get('/dashboard', getDashboardHandler);
router.post('/submissions/:id/remind', sendReminderHandler);
router.post('/demo/seed', seedDemoHandler);
router.delete('/demo', clearDemoHandler);

module.exports = router;
