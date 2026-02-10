/**
 * WebAuthn (FIDO2/passkeys) controller stubs.
 *
 * Full WebAuthn implementation requires HTTPS origin and
 * the @simplewebauthn/server package configured with the
 * relying party ID and origin. These stubs provide the
 * correct response structure for future implementation.
 */

const webauthnController = {
  /**
   * POST /webauthn/register/options
   * Generate registration options for a new passkey (authenticated).
   */
  async registerOptions(req, res, next) {
    try {
      // Full WebAuthn implementation requires HTTPS origin
      res.status(200).json({
        challenge: 'placeholder-challenge-base64url',
        rp: {
          name: 'Taggy',
          id: 'localhost',
        },
        user: {
          id: req.user.id,
          name: req.user.email || req.user.phone || 'user',
          displayName: 'Taggy User',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        timeout: 60000,
        attestation: 'none',
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /webauthn/register/verify
   * Verify and store the passkey registration (authenticated).
   */
  async registerVerify(req, res, next) {
    try {
      // Full WebAuthn implementation requires HTTPS origin
      // TODO: Use @simplewebauthn/server verifyRegistrationResponse
      res.status(200).json({
        verified: false,
        message: 'WebAuthn registration verification not yet implemented. Requires HTTPS origin.',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /webauthn/login/options
   * Generate authentication options for passkey login.
   */
  async loginOptions(req, res, next) {
    try {
      // Full WebAuthn implementation requires HTTPS origin
      res.status(200).json({
        challenge: 'placeholder-challenge-base64url',
        timeout: 60000,
        rpId: 'localhost',
        allowCredentials: [],
        userVerification: 'preferred',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /webauthn/login/verify
   * Verify the passkey authentication assertion.
   */
  async loginVerify(req, res, next) {
    try {
      // Full WebAuthn implementation requires HTTPS origin
      // TODO: Use @simplewebauthn/server verifyAuthenticationResponse
      res.status(200).json({
        verified: false,
        message: 'WebAuthn login verification not yet implemented. Requires HTTPS origin.',
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = webauthnController;
