import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';

const LANGUAGES = [
  { code: 'fr', flag: '\uD83C\uDDEB\uD83C\uDDF7', name: 'Fran\u00e7ais' },
  { code: 'en', flag: '\uD83C\uDDEC\uD83C\uDDE7', name: 'English' },
  { code: 'es', flag: '\uD83C\uDDEA\uD83C\uDDF8', name: 'Espa\u00f1ol' },
];

export default function LanguageSelect() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleSelect = (code) => {
    i18n.changeLanguage(code);
    try {
      localStorage.setItem('taggy-language', code);
    } catch {
      // ignore
    }
    navigate('/onboarding/phone');
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
      }}
    >
      <Typography variant="h4" sx={{ mb: 1, textAlign: 'center' }}>
        {t('onboarding.welcome')}
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 5, textAlign: 'center' }}
      >
        {t('onboarding.chooseLanguage')}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 360 }}>
        {LANGUAGES.map((lang) => (
          <Card key={lang.code} variant="outlined">
            <CardActionArea
              onClick={() => handleSelect(lang.code)}
              sx={{ minHeight: 80 }}
            >
              <CardContent
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  py: 2.5,
                }}
              >
                <Typography sx={{ fontSize: '2rem' }}>{lang.flag}</Typography>
                <Typography variant="h6">{lang.name}</Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
