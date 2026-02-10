const eventRepo = require('../repositories/eventRepo');

const LARGE_EVENT_THRESHOLD = 20;

const eventController = {
  /**
   * POST /events
   * Create a new event. Events with >20 participants require Stripe payment.
   */
  async createEvent(req, res, next) {
    try {
      const {
        sport_id, title, description,
        max_participants, scheduled_at,
        lat, lng, price_cents,
      } = req.body;

      const requiresPayment = max_participants > LARGE_EVENT_THRESHOLD;

      const event = await eventRepo.create({
        organizer_id: req.user.id,
        sport_id,
        title,
        description,
        max_participants: max_participants || LARGE_EVENT_THRESHOLD,
        scheduled_at,
        lat,
        lng,
        requires_payment: requiresPayment,
        price_cents: requiresPayment ? (price_cents || 0) : 0,
        status: requiresPayment ? 'pending_payment' : 'active',
      });

      res.status(201).json(event);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /events
   * List events with optional filters and pagination.
   * Query params: sport_id, status, limit, offset
   */
  async listEvents(req, res, next) {
    try {
      const filters = {
        sport_id: req.query.sport_id ? parseInt(req.query.sport_id, 10) : undefined,
        status: req.query.status || undefined,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 20,
        offset: req.query.offset ? parseInt(req.query.offset, 10) : 0,
      };

      const events = await eventRepo.findAll(filters);
      res.status(200).json({ events });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /events/:id/join
   * Join an event as a participant.
   */
  async joinEvent(req, res, next) {
    try {
      const { id } = req.params;

      const event = await eventRepo.findById(id);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (event.status !== 'active') {
        return res.status(400).json({ error: 'Event is not accepting participants' });
      }

      const member = await eventRepo.addMember(id, req.user.id);

      if (!member) {
        return res.status(409).json({ error: 'Already joined this event' });
      }

      res.status(200).json({ message: 'Joined event successfully', member });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = eventController;
