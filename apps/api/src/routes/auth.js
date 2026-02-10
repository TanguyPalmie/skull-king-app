const { Router } = require('express');
const { sensitiveLimiter } = require('../middlewares/rateLimit');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const ctrl = require('../controllers/authController');

const router = Router();

router.post('/request-otp', sensitiveLimiter, validate({ phone: 'phone' }), ctrl.requestOtp);
router.post('/verify-otp', sensitiveLimiter, validate({ phone: 'phone', code: 'otp' }), ctrl.verifyOtp);
router.post('/register', sensitiveLimiter, ctrl.register);
router.post('/login', sensitiveLimiter, validate({ email: 'email', password: 'password' }), ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', authenticate, ctrl.logout);
router.post('/forgot-password', sensitiveLimiter, validate({ email: 'email' }), ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);

module.exports = router;
