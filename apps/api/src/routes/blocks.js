const { Router } = require('express');
const ctrl = require('../controllers/blockController');

const router = Router();

router.post('/', ctrl.createBlock);

module.exports = router;
