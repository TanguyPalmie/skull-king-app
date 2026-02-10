import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import apiClient from '../../api/client';

export default function PhoneStep() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      setError(t('common.required'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiClient.post('/auth/otp/send', { phone: phone.trim() });
      navigate('/onboarding/otp', { state: { phone: phone.trim() } });
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
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
        {t('onboarding.enterPhone')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {t('onboarding.phoneDescription')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label={t('auth.phone')}
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+1 234 567 8900"
        sx={{ mb: 3 }}
        inputProps={{ inputMode: 'tel' }}
      />

      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleSendOtp}
        disabled={loading || !phone.trim()}
        sx={{ minHeight: 52 }}
      >
        {t('auth.sendOtp')}
      </Button>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="text"
          onClick={() => navigate('/onboarding/language')}
          sx={{ minHeight: 48 }}
        >
          {t('onboarding.back')}
        </Button>
      </Box>
    </Box>
  );
}
