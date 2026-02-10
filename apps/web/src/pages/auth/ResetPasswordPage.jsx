import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import apiClient from '../../api/client';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');

    if (!password || !confirmPassword) {
      setError(t('common.required'));
      return;
    }
    if (password.length < 8) {
      setError(t('common.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('common.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/auth/reset-password', { token, password });
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
        {t('auth.newPasswordInstructions')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success ? (
        <>
          <Alert severity="success" sx={{ mb: 3 }}>
            {t('auth.resetSuccess')}
          </Alert>
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={() => navigate('/login', { replace: true })}
            sx={{ minHeight: 52 }}
          >
            {t('auth.login')}
          </Button>
        </>
      ) : (
        <>
          <TextField
            fullWidth
            label={t('auth.newPassword')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText={t('onboarding.passwordDescription')}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label={t('auth.confirmPassword')}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleSubmit}
            disabled={loading || !password || !confirmPassword}
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
