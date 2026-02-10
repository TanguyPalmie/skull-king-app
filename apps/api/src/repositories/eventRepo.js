const pool = require('../db/pool');

const eventRepo = {
  async create(event) {
    const { rows } = await pool.query(
      `INSERT INTO events
         (creator_id, sport_id, title, description, max_participants,
          event_date, lat, lng, location_name, requires_payment, stripe_session_id, payment_status, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        event.organizer_id || event.creator_id,
        event.sport_id,
        event.title,
        event.description || null,
        event.max_participants || 10,
        event.scheduled_at || event.event_date,
        event.lat || null,
        event.lng || null,
        event.location_name || null,
        event.requires_payment || false,
        event.stripe_session_id || null,
        event.payment_status || 'none',
        event.status || 'active',
      ]
    );
    return rows[0];
  },

  async findAll(filters = {}) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (filters.sport_id) {
      conditions.push(`e.sport_id = $${paramIndex++}`);
      params.push(filters.sport_id);
    }

    if (filters.status) {
      conditions.push(`e.status = $${paramIndex++}`);
      params.push(filters.status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    params.push(limit, offset);

    const { rows } = await pool.query(
      `SELECT e.*, u.display_name AS creator_name,
              (SELECT COUNT(*)::int FROM event_members em WHERE em.event_id = e.id) AS member_count
       FROM events e
       JOIN users u ON u.id = e.creator_id
       ${where}
       ORDER BY e.event_date ASC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT e.*, u.display_name AS creator_name
       FROM events e
       JOIN users u ON u.id = e.creator_id
       WHERE e.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async addMember(eventId, userId) {
    const { rows } = await pool.query(
      `INSERT INTO event_members (event_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (event_id, user_id) DO NOTHING
       RETURNING *`,
      [eventId, userId]
    );
    return rows[0] || null;
  },

  async updateStatus(id, status) {
    const { rows } = await pool.query(
      'UPDATE events SET status = $2 WHERE id = $1 RETURNING *',
      [id, status]
    );
    return rows[0] || null;
  },
};

module.exports = eventRepo;
