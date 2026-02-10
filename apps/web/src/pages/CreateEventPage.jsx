import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import apiClient from '../api/client';

const SPORTS_LIST = [
  'football', 'basketball', 'tennis', 'volleyball', 'badminton', 'tableTennis',
  'running', 'cycling', 'swimming', 'boxing', 'mma', 'judo', 'padel',
  'pickleball', 'squash', 'rugby', 'handball', 'futsal', 'beachVolleyball',
  'yoga', 'crossfit', 'climbing', 'bouldering', 'hiking',
];

export default function CreateEventPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    sport: '',
    maxParticipants: '',
    date: '',
    location: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.sport || !form.date) {
      setError(t('common.required'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        sport: form.sport,
        maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants, 10) : undefined,
        date: form.date,
        location: form.location.trim() || undefined,
      };
      const data = await apiClient.post('/events', payload);
      navigate(`/events/${data.id || data.event?.id}`, { replace: true });
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('events.create')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label={t('events.eventTitle')}
        value={form.title}
        onChange={handleChange('title')}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        multiline
        rows={3}
        label={t('events.description')}
        value={form.description}
        onChange={handleChange('description')}
        sx={{ mb: 2 }}
      />

      <TextField
        select
        fullWidth
        label={t('events.sport')}
        value={form.sport}
        onChange={handleChange('sport')}
        sx={{ mb: 2 }}
      >
        {SPORTS_LIST.map((s) => (
          <MenuItem key={s} value={s}>
            {t(`sports.${s}`)}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        fullWidth
        label={t('events.maxParticipants')}
        type="number"
        value={form.maxParticipants}
        onChange={handleChange('maxParticipants')}
        inputProps={{ min: 2, max: 100 }}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label={t('events.date')}
        type="datetime-local"
        value={form.date}
        onChange={handleChange('date')}
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label={t('events.location')}
        value={form.location}
        onChange={handleChange('location')}
        sx={{ mb: 1 }}
      />

      {form.maxParticipants && parseInt(form.maxParticipants, 10) > 20 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('events.paymentNotice')}
        </Alert>
      )}

      <Box sx={{ mt: 3 }}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleSubmit}
          disabled={loading || !form.title.trim() || !form.sport || !form.date}
          sx={{ minHeight: 52 }}
        >
          {t('events.createEvent')}
        </Button>
      </Box>
    </Box>
  );
}
