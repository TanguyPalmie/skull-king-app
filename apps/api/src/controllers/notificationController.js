const notificationRepo = require('../repositories/notificationRepo');

const notificationController = {
  /**
   * GET /notifications
   * List the authenticated user's notifications.
   * Query params: limit (default 50)
   */
  async list(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
      const notifications = await notificationRepo.findByUser(req.user.id, limit);

      res.status(200).json({ notifications });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = notificationController;
