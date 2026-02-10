const { Router } = require('express');
const ctrl = require('../controllers/matchController');

const router = Router();

router.get('/:id', ctrl.getMatch);

module.exports = router;
