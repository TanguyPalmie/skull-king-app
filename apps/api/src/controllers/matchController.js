const matchRepo = require('../repositories/matchRepo');

const matchController = {
  /**
   * GET /matches/:id
   * Return a match with its members.
   */
  async getMatch(req, res, next) {
    try {
      const { id } = req.params;
      const match = await matchRepo.findById(id);

      if (!match) {
        return res.status(404).json({ error: 'Match not found' });
      }

      // Verify the requesting user is a member of the match
      const isMember = match.members.some((m) => m.user_id === req.user.id);
      if (!isMember) {
        return res.status(403).json({ error: 'Not a member of this match' });
      }

      res.status(200).json(match);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = matchController;
