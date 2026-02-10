import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

export default function DetailsStep() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone || '';

  const [form, setForm] = useState({
    email: '',
    password: '',
    displayName: '',
    birthdate: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.displayName.trim()) {
      newErrors.displayName = t('common.required');
    }
    if (!form.birthdate) {
      newErrors.birthdate = t('common.required');
    }
    if (form.password && form.password.length < 8) {
      newErrors.password = t('common.passwordTooShort');
    }
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = t('common.invalidEmail');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    navigate('/onboarding/spoken-languages', {
      state: { phone, ...form },
    });
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
        {t('onboarding.enterDetails')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {t('onboarding.step', { current: 3, total: 7 })}
      </Typography>

      <TextField
        fullWidth
        label={t('onboarding.displayName')}
        placeholder={t('onboarding.displayNamePlaceholder')}
        value={form.displayName}
        onChange={handleChange('displayName')}
        error={!!errors.displayName}
        helperText={errors.displayName}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label={t('onboarding.birthdate')}
        type="date"
        value={form.birthdate}
        onChange={handleChange('birthdate')}
        error={!!errors.birthdate}
        helperText={errors.birthdate}
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label={t('onboarding.emailOptional')}
        type="email"
        value={form.email}
        onChange={handleChange('email')}
        error={!!errors.email}
        helperText={errors.email || t('onboarding.emailDescription')}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label={t('auth.password')}
        type="password"
        value={form.password}
        onChange={handleChange('password')}
        error={!!errors.password}
        helperText={errors.password || t('onboarding.passwordDescription')}
        sx={{ mb: 3 }}
      />

      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleNext}
        disabled={!form.displayName.trim() || !form.birthdate}
        sx={{ minHeight: 52 }}
      >
        {t('onboarding.next')}
      </Button>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="text"
          onClick={() => navigate('/onboarding/otp', { state: { phone } })}
          sx={{ minHeight: 48 }}
        >
          {t('onboarding.back')}
        </Button>
      </Box>
    </Box>
  );
}
