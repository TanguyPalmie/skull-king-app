const { Router } = require('express');
const multer = require('multer');
const ctrl = require('../controllers/kycController');

const upload = multer({
  dest: 'uploads/kyc/',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
});

const router = Router();

router.post('/submit', upload.single('document'), ctrl.submit);
router.get('/status', ctrl.getStatus);

module.exports = router;
