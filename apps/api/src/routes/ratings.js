const { Router } = require('express');
const ctrl = require('../controllers/ratingController');

const router = Router();

router.post('/', ctrl.createRating);

module.exports = router;
