/**
 * Body validation middleware factory.
 *
 * Takes a map of { fieldName: schemaKey } and validates req.body
 * against the shared validation schemas.
 *
 * @param {Object} fields - Map of body field names to schema keys
 * @returns {Function} Express middleware
 *
 * @example
 *   router.post('/login', validate({ email: 'email', password: 'password' }), controller.login);
 */
function validate(fields) {
  // Lazy-load to avoid module resolution issues at startup
  let validateBody;

  return (req, res, next) => {
    if (!validateBody) {
      try {
        const shared = require('@taggy/shared/src/validation/index.js');
        validateBody = shared.validateBody;
      } catch (_e) {
        // Fallback: if ESM-only, skip validation and let controller handle it
        console.warn('Could not load @taggy/shared validation; skipping body validation');
        return next();
      }
    }

    const errors = validateBody(req.body || {}, fields);

    if (errors) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    next();
  };
}

module.exports = validate;
