import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';

function TabPanel({ children, value, index }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [tab, setTab] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Phone login state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Email login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSendOtp = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/request-otp', { phone: phone.trim() });
      setOtpSent(true);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    if (!phone.trim() || otp.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.post('/auth/verify-otp', {
        phone: phone.trim(),
        code: otp,
      });
      login(data.accessToken, data.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.post('/auth/login', {
        email: email.trim(),
        password,
      });
      login(data.accessToken, data.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || t('auth.invalidCredentials'));
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
        {t('auth.login')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Tabs
        value={tab}
        onChange={(e, v) => {
          setTab(v);
          setError('');
        }}
        variant="fullWidth"
        sx={{ mb: 1 }}
      >
        <Tab label={t('auth.phoneLogin')} sx={{ minHeight: 48 }} />
        <Tab label={t('auth.emailLogin')} sx={{ minHeight: 48 }} />
      </Tabs>

      {/* Phone tab */}
      <TabPanel value={tab} index={0}>
        <TextField
          fullWidth
          label={t('auth.phone')}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 234 567 8900"
          inputProps={{ inputMode: 'tel' }}
          sx={{ mb: 2 }}
        />

        {otpSent && (
          <TextField
            fullWidth
            label={t('auth.otpPlaceholder')}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputProps={{
              inputMode: 'numeric',
              maxLength: 6,
              style: { textAlign: 'center', letterSpacing: '0.3em' },
            }}
            sx={{ mb: 2 }}
          />
        )}

        {!otpSent ? (
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
        ) : (
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handlePhoneLogin}
            disabled={loading || otp.length !== 6}
            sx={{ minHeight: 52 }}
          >
            {t('auth.login')}
          </Button>
        )}
      </TabPanel>

      {/* Email tab */}
      <TabPanel value={tab} index={1}>
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
          sx={{ mb: 1 }}
        />

        <Box sx={{ textAlign: 'right', mb: 2 }}>
          <Link
            component={RouterLink}
            to="/forgot-password"
            variant="body2"
            underline="hover"
          >
            {t('auth.forgotPassword')}
          </Link>
        </Box>

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleEmailLogin}
          disabled={loading || !email.trim() || !password}
          sx={{ minHeight: 52 }}
        >
          {t('auth.login')}
        </Button>
      </TabPanel>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('auth.noAccount')}{' '}
          <Link component={RouterLink} to="/register" underline="hover">
            {t('auth.register')}
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
