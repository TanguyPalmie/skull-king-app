const queueRepo = require('../repositories/queueRepo');
const matchService = require('../services/matchService');

const queueController = {
  /**
   * POST /queue/join
   * Add the user to the matchmaking queue, then attempt to find a match.
   * Body: { sport_id, level_id, lat, lng, radius_km, available_from, available_to }
   */
  async joinQueue(req, res, next) {
    try {
      const { sport_id, level_id, lat, lng, radius_km, available_from, available_to } = req.body;

      const entry = await queueRepo.insert({
        user_id: req.user.id,
        sport_id,
        level_id,
        lat,
        lng,
        radius_km: radius_km || 10,
        available_from,
        available_to,
      });

      // Attempt matchmaking immediately
      const candidates = await matchService.findMatches(entry);

      let match = null;
      if (candidates.length > 0) {
        // Pick the first compatible candidate and create a match
        match = await matchService.createMatch([entry, candidates[0]]);
      }

      res.status(200).json({
        entry,
        matched: !!match,
        match: match || null,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /queue/leave
   * Remove the user from the queue for a specific sport.
   * Body: { sport_id }
   */
  async leaveQueue(req, res, next) {
    try {
      const { sport_id } = req.body;
      const removed = await queueRepo.remove(req.user.id, sport_id);

      if (!removed) {
        return res.status(404).json({ error: 'No queue entry found for this sport' });
      }

      res.status(200).json({ message: 'Left the queue successfully' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /queue/status
   * Return the user's current queue entries.
   */
  async getQueueStatus(req, res, next) {
    try {
      const entries = await queueRepo.findByUser(req.user.id);
      res.status(200).json({ entries });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = queueController;
