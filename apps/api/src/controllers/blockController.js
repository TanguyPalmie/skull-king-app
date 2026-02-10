const blockRepo = require('../repositories/blockRepo');

const blockController = {
  /**
   * POST /blocks
   * Shadow-block a user. The blocked user is NOT notified.
   * They will silently be excluded from matchmaking results.
   * Body: { blocked_id }
   */
  async createBlock(req, res, next) {
    try {
      const { blocked_id } = req.body;

      if (!blocked_id) {
        return res.status(400).json({ error: 'blocked_id is required' });
      }

      if (blocked_id === req.user.id) {
        return res.status(400).json({ error: 'Cannot block yourself' });
      }

      await blockRepo.create(req.user.id, blocked_id);

      // Return 200 with a generic message — don't reveal the block to the other user
      res.status(200).json({ message: 'Action completed' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = blockController;
