const { Router } = require('express');
const ctrl = require('../controllers/notificationController');

const router = Router();

router.get('/', ctrl.list);

module.exports = router;
