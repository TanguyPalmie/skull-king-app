const ratingRepo = require('../repositories/ratingRepo');

const ratingController = {
  /**
   * POST /ratings
   * Submit a rating and optional comment after a match/activity.
   * Body: { rated_id, match_id, score (1-5), comment }
   */
  async createRating(req, res, next) {
    try {
      const { rated_id, match_id, score, comment } = req.body;

      if (!rated_id || !match_id || score == null) {
        return res.status(400).json({ error: 'rated_id, match_id, and score are required' });
      }

      if (score < 1 || score > 5) {
        return res.status(400).json({ error: 'Score must be between 1 and 5' });
      }

      if (rated_id === req.user.id) {
        return res.status(400).json({ error: 'Cannot rate yourself' });
      }

      const rating = await ratingRepo.create({
        rater_id: req.user.id,
        rated_id,
        match_id,
        score,
        comment: comment || null,
      });

      res.status(201).json(rating);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = ratingController;
