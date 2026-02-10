import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import apiClient from '../../api/client';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError(t('common.required'));
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t('common.invalidEmail'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiClient.post('/auth/forgot-password', { email: email.trim() });
      setSuccess(true);
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
        {t('auth.resetPassword')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {t('auth.resetInstructions')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success ? (
        <Alert severity="success" sx={{ mb: 3 }}>
          {t('auth.resetSent')}
        </Alert>
      ) : (
        <>
          <TextField
            fullWidth
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            sx={{ mb: 3 }}
          />

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleSubmit}
            disabled={loading || !email.trim()}
            sx={{ minHeight: 52 }}
          >
            {t('auth.resetPassword')}
          </Button>
        </>
      )}

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Link component={RouterLink} to="/login" variant="body2" underline="hover">
          {t('auth.login')}
        </Link>
      </Box>
    </Box>
  );
}
