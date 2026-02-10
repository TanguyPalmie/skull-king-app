const config = require('../config');
const eventRepo = require('../repositories/eventRepo');

/**
 * Lazy-initialize Stripe to allow the app to start even if
 * STRIPE_SECRET_KEY is not configured (e.g. in dev without Stripe).
 */
let stripe = null;
function getStripe() {
  if (!stripe) {
    if (!config.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in environment.');
    }
    stripe = require('stripe')(config.STRIPE_SECRET_KEY);
  }
  return stripe;
}

const billingController = {
  /**
   * POST /billing/checkout
   * Create a Stripe Checkout session for events that require payment (>20 participants).
   * Body: { event_id }
   */
  async createCheckout(req, res, next) {
    try {
      const { event_id } = req.body;

      const event = await eventRepo.findById(event_id);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (!event.requires_payment) {
        return res.status(400).json({ error: 'This event does not require payment' });
      }

      const stripeClient = getStripe();

      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Event: ${event.title}`,
                description: event.description || undefined,
              },
              unit_amount: event.price_cents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          event_id: event.id,
          user_id: req.user.id,
        },
        success_url: `${config.CORS_ORIGIN}/events/${event.id}?payment=success`,
        cancel_url: `${config.CORS_ORIGIN}/events/${event.id}?payment=cancelled`,
      });

      res.status(200).json({ sessionId: session.id, url: session.url });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /billing/webhook
   * Handle Stripe webhook events. Verifies the webhook signature.
   * NOT authenticated — Stripe sends requests directly.
   * The route must use express.raw() for body parsing.
   */
  async handleWebhook(req, res, next) {
    try {
      const stripeClient = getStripe();
      const sig = req.headers['stripe-signature'];

      let event;
      try {
        event = stripeClient.webhooks.constructEvent(
          req.body,
          sig,
          config.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.error('[Stripe Webhook] Signature verification failed:', err.message);
        return res.status(400).json({ error: 'Webhook signature verification failed' });
      }

      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const eventId = session.metadata.event_id;

          if (eventId) {
            await eventRepo.updateStatus(eventId, 'active');
            console.log(`[Stripe Webhook] Event ${eventId} activated after payment`);
          }
          break;
        }

        case 'checkout.session.expired': {
          const session = event.data.object;
          const eventId = session.metadata.event_id;

          if (eventId) {
            console.log(`[Stripe Webhook] Checkout expired for event ${eventId}`);
          }
          break;
        }

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = billingController;
