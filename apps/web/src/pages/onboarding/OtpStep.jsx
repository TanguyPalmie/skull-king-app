import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import apiClient from '../../api/client';

const COUNTDOWN_SECONDS = 60;

export default function OtpStep() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone || '';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (!phone) {
      navigate('/onboarding/phone', { replace: true });
    }
  }, [phone, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) return;

    setLoading(true);
    setError('');

    try {
      await apiClient.post('/auth/otp/verify', { phone, code: otp });
      navigate('/onboarding/details', { state: { phone, otpVerified: true } });
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = useCallback(async () => {
    try {
      await apiClient.post('/auth/otp/send', { phone });
      setCountdown(COUNTDOWN_SECONDS);
      setError('');
    } catch (err) {
      setError(err.message || t('common.error'));
    }
  }, [phone, t]);

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        px: 3,
        py: 4,
        justifyContent: 'center',
      }}
    >
      <Typography variant="h4" sx={{ mb: 1 }}>
        {t('onboarding.verifyPhone')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {t('auth.otpSent')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label={t('auth.otpPlaceholder')}
        value={otp}
        onChange={handleOtpChange}
        placeholder="000000"
        inputProps={{
          inputMode: 'numeric',
          maxLength: 6,
          style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em' },
        }}
        sx={{ mb: 3 }}
      />

      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleVerify}
        disabled={loading || otp.length !== 6}
        sx={{ minHeight: 52, mb: 2 }}
      >
        {t('auth.verifyOtp')}
      </Button>

      <Box sx={{ textAlign: 'center' }}>
        {countdown > 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('auth.resendIn', { seconds: countdown })}
          </Typography>
        ) : (
          <Button
            variant="text"
            onClick={handleResend}
            sx={{ minHeight: 48 }}
          >
            {t('auth.resendOtp')}
          </Button>
        )}
      </Box>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="text"
          onClick={() => navigate('/onboarding/phone')}
          sx={{ minHeight: 48 }}
        >
          {t('onboarding.back')}
        </Button>
      </Box>
    </Box>
  );
}
