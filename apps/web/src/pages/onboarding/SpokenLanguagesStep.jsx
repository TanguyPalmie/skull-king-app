import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import LanguageChip from '../../components/common/LanguageChip';

const ALL_LANGUAGES = [
  'en', 'fr', 'es', 'de', 'it', 'pt', 'nl', 'ru', 'zh', 'ja',
  'ko', 'ar', 'hi', 'tr', 'pl', 'sv', 'da', 'no', 'fi', 'el',
  'cs', 'ro', 'hu', 'th', 'vi', 'id', 'ms', 'tl', 'sw', 'he',
];

export default function SpokenLanguagesStep() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const prevState = location.state || {};

  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return ALL_LANGUAGES;
    const term = search.toLowerCase();
    return ALL_LANGUAGES.filter((code) =>
      t(`languages.${code}`).toLowerCase().includes(term)
    );
  }, [search, t]);

  const toggleLanguage = (code) => {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleNext = () => {
    navigate('/onboarding/sports', {
      state: { ...prevState, spokenLanguages: selected },
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
      }}
    >
      <Typography variant="h4" sx={{ mb: 1 }}>
        {t('onboarding.chooseSpokenLanguages')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
        {t('onboarding.spokenLanguagesDescription')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('onboarding.step', { current: 4, total: 7 })}
      </Typography>

      <TextField
        fullWidth
        size="small"
        placeholder={t('onboarding.searchLanguages')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3 }}
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4, flex: 1 }}>
        {filtered.map((code) => (
          <LanguageChip
            key={code}
            langCode={code}
            selected={selected.includes(code)}
            onClick={() => toggleLanguage(code)}
          />
        ))}
      </Box>

      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleNext}
        disabled={selected.length === 0}
        sx={{ minHeight: 52 }}
      >
        {t('onboarding.next')}
      </Button>

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Button
          variant="text"
          onClick={() => navigate('/onboarding/details', { state: prevState })}
          sx={{ minHeight: 48 }}
        >
          {t('onboarding.back')}
        </Button>
      </Box>
    </Box>
  );
}
