const { Router } = require('express');
const { authenticate } = require('../middlewares/auth');
const authRoutes = require('./auth');
const webauthnRoutes = require('./webauthn');
const meRoutes = require('./me');
const queueRoutes = require('./queue');
const matchRoutes = require('./matches');
const eventRoutes = require('./events');
const billingRoutes = require('./billing');
const ratingRoutes = require('./ratings');
const blockRoutes = require('./blocks');
const kycRoutes = require('./kyc');
const notificationRoutes = require('./notifications');

const router = Router();

router.use('/auth', authRoutes);
router.use('/webauthn', webauthnRoutes);
router.use('/me', authenticate, meRoutes);
router.use('/queue', authenticate, queueRoutes);
router.use('/matches', authenticate, matchRoutes);
router.use('/events', authenticate, eventRoutes);
router.use('/billing', billingRoutes);
router.use('/ratings', authenticate, ratingRoutes);
router.use('/blocks', authenticate, blockRoutes);
router.use('/kyc', authenticate, kycRoutes);
router.use('/notifications', authenticate, notificationRoutes);

module.exports = router;
