const { Router } = require('express');
const ctrl = require('../controllers/queueController');

const router = Router();

router.post('/join', ctrl.joinQueue);
router.post('/leave', ctrl.leaveQueue);
router.get('/status', ctrl.getQueueStatus);

module.exports = router;
