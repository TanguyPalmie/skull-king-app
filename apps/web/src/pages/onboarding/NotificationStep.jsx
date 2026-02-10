import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';

export default function NotificationStep() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const prevState = location.state || {};
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const finishOnboarding = async (notificationsEnabled) => {
    setLoading(true);
    setError('');

    try {
      const payload = {
        phone: prevState.phone,
        displayName: prevState.displayName,
        email: prevState.email || undefined,
        password: prevState.password || undefined,
        birthdate: prevState.birthdate,
        spokenLanguages: prevState.spokenLanguages || [],
        sports: prevState.sports || [],
        notificationsEnabled,
      };

      const data = await apiClient.post('/auth/register', payload);
      login(data.accessToken, data.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    // Request browser push notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch {
        // ignore
      }
    }
    finishOnboarding(true);
  };

  const handleSkip = () => {
    finishOnboarding(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        px: 3,
        py: 4,
        textAlign: 'center',
      }}
    >
      <NotificationsActiveIcon
        sx={{ fontSize: 80, color: 'primary.main', mb: 3 }}
      />

      <Typography variant="h4" sx={{ mb: 2 }}>
        {t('onboarding.enableNotifications')}
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 5, maxWidth: 320 }}
      >
        {t('onboarding.notificationsDescription')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleEnable}
        disabled={loading}
        sx={{ minHeight: 52, mb: 2, maxWidth: 360 }}
      >
        {t('onboarding.enableNotificationsBtn')}
      </Button>

      <Button
        variant="text"
        onClick={handleSkip}
        disabled={loading}
        sx={{ minHeight: 48 }}
      >
        {t('onboarding.maybeLater')}
      </Button>
    </Box>
  );
}
