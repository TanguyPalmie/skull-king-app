const userRepo = require('../repositories/userRepo');
const sportRepo = require('../repositories/sportRepo');
const languageRepo = require('../repositories/languageRepo');

const meController = {
  /**
   * GET /me
   * Fetch the authenticated user's profile, including their sports and languages.
   */
  async getProfile(req, res, next) {
    try {
      const user = await userRepo.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const [sports, languages] = await Promise.all([
        sportRepo.findUserSports(user.id),
        languageRepo.findUserLanguages(user.id),
      ]);

      // Strip sensitive fields
      const { password_hash, ...safeUser } = user;

      res.status(200).json({
        ...safeUser,
        sports,
        languages,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /me
   * Update profile fields: display_name, bio, avatar_url.
   */
  async updateProfile(req, res, next) {
    try {
      const { display_name, bio, avatar_url } = req.body;

      const user = await userRepo.updateProfile(req.user.id, {
        display_name,
        bio,
        avatar_url,
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { password_hash, ...safeUser } = user;
      res.status(200).json(safeUser);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /me/languages
   * Replace the user's language list.
   * Body: { languages: ['fr', 'en', ...] }
   */
  async updateLanguages(req, res, next) {
    try {
      const { languages } = req.body;

      if (!Array.isArray(languages)) {
        return res.status(400).json({ error: 'languages must be an array of language codes' });
      }

      await languageRepo.replaceUserLanguages(req.user.id, languages);

      const updated = await languageRepo.findUserLanguages(req.user.id);
      res.status(200).json({ languages: updated });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /me/sports
   * Replace the user's sport list with skill levels.
   * Body: { sports: [{ sport_id: 1, level_id: 2 }, ...] }
   */
  async updateSports(req, res, next) {
    try {
      const { sports } = req.body;

      if (!Array.isArray(sports)) {
        return res.status(400).json({ error: 'sports must be an array of { sport_id, level_id }' });
      }

      await sportRepo.replaceUserSports(req.user.id, sports);

      const updated = await sportRepo.findUserSports(req.user.id);
      res.status(200).json({ sports: updated });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = meController;
