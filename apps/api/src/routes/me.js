const { Router } = require('express');
const ctrl = require('../controllers/meController');

const router = Router();

router.get('/', ctrl.getProfile);
router.patch('/', ctrl.updateProfile);
router.put('/languages', ctrl.updateLanguages);
router.put('/sports', ctrl.updateSports);

module.exports = router;
