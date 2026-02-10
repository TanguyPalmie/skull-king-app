const { Router } = require('express');
const ctrl = require('../controllers/eventController');

const router = Router();

router.post('/', ctrl.createEvent);
router.get('/', ctrl.listEvents);
router.post('/:id/join', ctrl.joinEvent);

module.exports = router;
