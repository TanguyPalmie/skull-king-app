import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');

    if (!email.trim() || !password) return;

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
      const data = await apiClient.post('/auth/register', {
        email: email.trim(),
        password,
        display_name: displayName.trim() || undefined,
      });
      login(data.accessToken, data.user);
      navigate('/', { replace: true });
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
      <Typography
        variant="h4"
        sx={{ mb: 1, textAlign: 'center', color: 'primary.main', fontWeight: 700 }}
      >
        Taggy
      </Typography>
      <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
        {t('auth.register')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label={t('onboarding.displayName')}
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder={t('onboarding.displayNamePlaceholder')}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label={t('auth.email')}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label={t('auth.password')}
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
        onClick={handleRegister}
        disabled={loading || !email.trim() || !password || !confirmPassword}
        sx={{ minHeight: 52 }}
      >
        {t('auth.register')}
      </Button>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('auth.hasAccount')}{' '}
          <Link component={RouterLink} to="/login" underline="hover">
            {t('auth.login')}
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
