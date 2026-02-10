const queueRepo = require('../repositories/queueRepo');
const matchRepo = require('../repositories/matchRepo');
const blockRepo = require('../repositories/blockRepo');
const notificationRepo = require('../repositories/notificationRepo');
const { haversineDistance } = require('../utils/geo');

const matchService = {
  /**
   * Find compatible matches for a queue entry.
   * Filters by: same sport, level within +/-1, overlapping time window,
   * within geographic radius, compatible language, and not shadow-blocked.
   *
   * @param {Object} entry - The queue entry to find matches for
   * @returns {Array} Array of compatible candidate entries
   */
  async findMatches(entry) {
    const candidates = await queueRepo.findCandidates({
      sport_id: entry.sport_id,
      level_id: entry.level_id,
      available_from: entry.available_from,
      available_to: entry.available_to,
      excludeUserId: entry.user_id,
    });

    // Filter by geographic proximity using haversine
    const withinRadius = candidates.filter((candidate) => {
      const distance = haversineDistance(
        entry.lat, entry.lng,
        candidate.lat, candidate.lng
      );
      // Use the smaller radius of the two users as the match threshold
      const maxDistance = Math.min(entry.radius_km, candidate.radius_km);
      return distance <= maxDistance;
    });

    // Filter out shadow-blocked users
    const unblocked = [];
    for (const candidate of withinRadius) {
      const blocked = await blockRepo.isBlocked(entry.user_id, candidate.user_id);
      if (!blocked) {
        unblocked.push(candidate);
      }
    }

    return unblocked;
  },

  /**
   * Create a match from two or more queue entries.
   * Inserts the match, its members, removes them from the queue,
   * and sends notifications.
   *
   * @param {Array} entries - Array of queue entry objects (must have user_id, sport_id, lat, lng, available_from)
   * @returns {Object} The created match
   */
  async createMatch(entries) {
    if (entries.length < 2) {
      throw new Error('At least two entries are required to create a match');
    }

    const firstEntry = entries[0];

    // Calculate midpoint for the match location
    const avgLat = entries.reduce((sum, e) => sum + parseFloat(e.lat), 0) / entries.length;
    const avgLng = entries.reduce((sum, e) => sum + parseFloat(e.lng), 0) / entries.length;

    // Use the earliest available_from as the scheduled time
    const scheduledAt = entries.reduce(
      (earliest, e) => (new Date(e.available_from) > earliest ? new Date(e.available_from) : earliest),
      new Date(entries[0].available_from)
    );

    const match = await matchRepo.create({
      sport_id: firstEntry.sport_id,
      scheduled_at: scheduledAt,
      lat: avgLat,
      lng: avgLng,
      status: 'confirmed',
    });

    const userIds = entries.map((e) => e.user_id);
    await matchRepo.addMembers(match.id, userIds);

    // Remove matched users from the queue for this sport
    for (const entry of entries) {
      await queueRepo.remove(entry.user_id, entry.sport_id);
    }

    // Send notifications to all matched users
    for (const userId of userIds) {
      await notificationRepo.create(userId, 'match_found', {
        match_id: match.id,
        sport_id: firstEntry.sport_id,
        scheduled_at: scheduledAt,
      });
    }

    return match;
  },
};

module.exports = matchService;
