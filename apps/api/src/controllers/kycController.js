const kycRepo = require('../repositories/kycRepo');

const kycController = {
  /**
   * POST /kyc/submit
   * Upload an ID document for KYC verification.
   * Uses multer for file upload — the file is available on req.file.
   */
  async submit(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded. Please attach an ID document.' });
      }

      const filePath = req.file.path;

      const kyc = await kycRepo.create(req.user.id, filePath);

      res.status(201).json({
        id: kyc.id,
        status: kyc.status,
        message: 'Document submitted for review',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /kyc/status
   * Get the current KYC verification status.
   */
  async getStatus(req, res, next) {
    try {
      const kyc = await kycRepo.findByUser(req.user.id);

      if (!kyc) {
        return res.status(200).json({ status: 'not_submitted' });
      }

      res.status(200).json({
        id: kyc.id,
        status: kyc.status,
        submitted_at: kyc.created_at,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = kycController;
