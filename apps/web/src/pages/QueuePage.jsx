import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Slider from '@mui/material/Slider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';

const SPORTS_LIST = [
  'football', 'basketball', 'tennis', 'volleyball', 'badminton', 'tableTennis',
  'running', 'cycling', 'swimming', 'boxing', 'mma', 'judo', 'padel',
  'pickleball', 'squash', 'rugby', 'handball', 'futsal', 'beachVolleyball',
];

const LEVELS = [1, 2, 3, 4, 5];

const LANGUAGE_CODES = [
  'en', 'fr', 'es', 'de', 'it', 'pt', 'nl', 'ru', 'zh', 'ja', 'ko', 'ar',
];

export default function QueuePage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [sport, setSport] = useState('');
  const [level, setLevel] = useState(3);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [city, setCity] = useState('');
  const [radius, setRadius] = useState(10);
  const [languages, setLanguages] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const toggleLanguage = (code) => {
    setLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleTag = async () => {
    if (!sport) return;
    setSearching(true);
    setError('');
    try {
      await apiClient.post('/queue/join', {
        sport,
        level,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        city: city.trim() || undefined,
        radius,
        languages: languages.length > 0 ? languages : undefined,
      });
    } catch (err) {
      setError(err.message || t('common.error'));
      setSearching(false);
    }
  };

  const handleLeaveQueue = async () => {
    try {
      await apiClient.post('/queue/leave');
    } catch {
      // ignore
    }
    setSearching(false);
  };

  if (searching) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          gap: 3,
        }}
      >
        <CircularProgress size={64} color="primary" />
        <Typography variant="h5">{t('queue.searching')}</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 280 }}>
          {t('queue.searchingDescription')}
        </Typography>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleLeaveQueue}
          sx={{ minHeight: 48, mt: 2 }}
        >
          {t('queue.leaveQueue')}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('queue.title')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Sport selector */}
      <TextField
        select
        fullWidth
        label={t('queue.sport')}
        value={sport}
        onChange={(e) => setSport(e.target.value)}
        sx={{ mb: 2 }}
      >
        <MenuItem value="" disabled>
          {t('queue.selectSport')}
        </MenuItem>
        {SPORTS_LIST.map((s) => (
          <MenuItem key={s} value={s}>
            {t(`sports.${s}`)}
          </MenuItem>
        ))}
      </TextField>

      {/* Level */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {t('queue.level')}: {t(`onboarding.level${level}`)}
      </Typography>
      <Slider
        value={level}
        onChange={(e, val) => setLevel(val)}
        min={1}
        max={5}
        step={1}
        marks
        sx={{ mb: 3 }}
      />

      {/* Date range */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {t('queue.dateRange')}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          fullWidth
          label={t('queue.startDate')}
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          fullWidth
          label={t('queue.endDate')}
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      {/* Location */}
      <TextField
        fullWidth
        label={t('queue.city')}
        value={city}
        onChange={(e) => setCity(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {t('queue.radius')}: {t('queue.radiusKm', { km: radius })}
      </Typography>
      <Slider
        value={radius}
        onChange={(e, val) => setRadius(val)}
        min={1}
        max={50}
        step={1}
        sx={{ mb: 3 }}
      />

      {/* Language preferences */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {t('queue.languages')}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
        {LANGUAGE_CODES.map((code) => (
          <Chip
            key={code}
            label={t(`languages.${code}`)}
            color={languages.includes(code) ? 'primary' : 'default'}
            variant={languages.includes(code) ? 'filled' : 'outlined'}
            onClick={() => toggleLanguage(code)}
            sx={{ minHeight: 40, cursor: 'pointer' }}
          />
        ))}
      </Box>

      {/* Tag button */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleTag}
        disabled={!sport}
        sx={{
          minHeight: 56,
          fontSize: '1.2rem',
          fontWeight: 700,
          borderRadius: 3,
        }}
      >
        {t('queue.tag')}
      </Button>
    </Box>
  );
}
