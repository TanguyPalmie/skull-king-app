const { Router } = require('express');
const { authenticate } = require('../middlewares/auth');
const ctrl = require('../controllers/billingController');

const router = Router();

router.post('/checkout', authenticate, ctrl.createCheckout);
router.post('/webhook', ctrl.handleWebhook);

module.exports = router;
