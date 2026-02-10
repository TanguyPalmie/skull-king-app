const bcrypt = require('bcrypt');
const otpService = require('../services/otpService');
const tokenService = require('../services/tokenService');
const emailService = require('../services/emailService');
const userRepo = require('../repositories/userRepo');
const tokenRepo = require('../repositories/tokenRepo');
const { hashToken, generateRandomToken } = require('../utils/crypto');

const SALT_ROUNDS = 12;

/**
 * Set the refresh token as an httpOnly cookie.
 */
function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

/**
 * Clear the refresh token cookie.
 */
function clearRefreshCookie(res) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth/refresh',
  });
}

const authController = {
  /**
   * POST /auth/request-otp
   * Request a one-time password sent to the given phone number.
   */
  async requestOtp(req, res, next) {
    try {
      const { phone } = req.body;
      await otpService.sendOtp(phone);
      res.status(200).json({ message: 'OTP sent successfully' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/verify-otp
   * Verify an OTP code. If the phone is new, create a user account.
   * Returns access token and sets refresh cookie.
   */
  async verifyOtp(req, res, next) {
    try {
      const { phone, code } = req.body;

      await otpService.verifyOtp(phone, code);

      // Find or create the user
      let user = await userRepo.findByPhone(phone);
      let isNewUser = false;

      if (!user) {
        user = await userRepo.create({ phone });
        isNewUser = true;
      }

      // Generate tokens
      const accessToken = tokenService.generateAccessToken(user);
      const refreshToken = await tokenService.generateRefreshToken(user);

      setRefreshCookie(res, refreshToken);

      res.status(200).json({
        accessToken,
        user: {
          id: user.id,
          phone: user.phone_e164,
          email: user.email,
          display_name: user.display_name,
        },
        isNewUser,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/login
   * Authenticate with email and password.
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await userRepo.findByEmail(email);
      if (!user || !user.password_hash) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const accessToken = tokenService.generateAccessToken(user);
      const refreshToken = await tokenService.generateRefreshToken(user);

      setRefreshCookie(res, refreshToken);

      res.status(200).json({
        accessToken,
        user: {
          id: user.id,
          phone: user.phone_e164,
          email: user.email,
          display_name: user.display_name,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/refresh
   * Rotate the refresh token from the cookie and return a new access token.
   */
  async refresh(req, res, next) {
    try {
      const oldToken = req.cookies.refreshToken;

      if (!oldToken) {
        return res.status(401).json({ error: 'No refresh token provided' });
      }

      const { refreshToken, userId } = await tokenService.rotateRefreshToken(oldToken);

      const user = await userRepo.findById(userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const accessToken = tokenService.generateAccessToken(user);

      setRefreshCookie(res, refreshToken);

      res.status(200).json({ accessToken });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/logout
   * Revoke the current refresh token and clear the cookie.
   */
  async logout(req, res, next) {
    try {
      const token = req.cookies.refreshToken;

      if (token) {
        try {
          const record = await tokenService.verifyRefreshToken(token);
          await tokenService.revokeRefreshToken(record.id);
        } catch (_e) {
          // Token already invalid/expired — that's fine, just clear cookie
        }
      }

      clearRefreshCookie(res);

      res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/forgot-password
   * Generate a password reset token and send it by email.
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await userRepo.findByEmail(email);

      // Always return 200 to prevent email enumeration
      if (!user) {
        return res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
      }

      const token = generateRandomToken();
      const tokenHash = hashToken(token);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await tokenRepo.createPasswordResetToken(user.id, tokenHash, expiresAt);

      await emailService.sendPasswordResetEmail(email, token);

      res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/reset-password
   * Validate reset token, hash the new password, update the user.
   */
  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: 'Token and password are required' });
      }

      const tokenHash = hashToken(token);
      const record = await tokenRepo.findPasswordResetByHash(tokenHash);

      if (!record) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      await userRepo.updatePassword(record.user_id, passwordHash);

      // Mark the token as used
      await tokenRepo.markPasswordResetUsed(record.id);

      res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
