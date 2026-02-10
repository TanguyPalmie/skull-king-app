const { Router } = require('express');
const { authenticate } = require('../middlewares/auth');
const ctrl = require('../controllers/webauthnController');

const router = Router();

router.post('/register/options', authenticate, ctrl.registerOptions);
router.post('/register/verify', authenticate, ctrl.registerVerify);
router.post('/login/options', ctrl.loginOptions);
router.post('/login/verify', ctrl.loginVerify);

module.exports = router;
