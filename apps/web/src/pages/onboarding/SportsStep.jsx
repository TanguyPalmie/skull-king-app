import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Slider from '@mui/material/Slider';
import SportChip from '../../components/common/SportChip';

const ALL_SPORTS = [
  'football', 'basketball', 'tennis', 'volleyball', 'badminton', 'tableTennis',
  'running', 'cycling', 'swimming', 'boxing', 'mma', 'judo', 'karate',
  'taekwondo', 'wrestling', 'fencing', 'archery', 'golf', 'rugby', 'cricket',
  'baseball', 'softball', 'hockey', 'iceHockey', 'handball', 'waterPolo',
  'surfing', 'sailing', 'rowing', 'skiing', 'snowboarding', 'skateboarding',
  'climbing', 'bouldering', 'hiking', 'trailRunning', 'crossfit', 'yoga',
  'pilates', 'dance', 'gymnastics', 'weightlifting', 'powerlifting',
  'calisthenics', 'kickboxing', 'muayThai', 'bjj', 'squash', 'padel',
  'pickleball', 'triathlon', 'parkour', 'lacrosse', 'ultimateFrisbee',
  'bowling', 'chess', 'esports', 'futsal', 'beachVolleyball',
];

export default function SportsStep() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const prevState = location.state || {};

  // Map of sportKey -> level (1-5)
  const [selected, setSelected] = useState({});
  const [search, setSearch] = useState('');
  const [levelDialog, setLevelDialog] = useState({ open: false, sport: null });
  const [tempLevel, setTempLevel] = useState(3);

  const filtered = useMemo(() => {
    if (!search.trim()) return ALL_SPORTS;
    const term = search.toLowerCase();
    return ALL_SPORTS.filter((key) =>
      t(`sports.${key}`).toLowerCase().includes(term)
    );
  }, [search, t]);

  const handleSportClick = (sportKey) => {
    if (selected[sportKey]) {
      // Remove sport
      setSelected((prev) => {
        const copy = { ...prev };
        delete copy[sportKey];
        return copy;
      });
    } else {
      // Open level dialog
      setTempLevel(3);
      setLevelDialog({ open: true, sport: sportKey });
    }
  };

  const handleLevelConfirm = () => {
    if (levelDialog.sport) {
      setSelected((prev) => ({ ...prev, [levelDialog.sport]: tempLevel }));
    }
    setLevelDialog({ open: false, sport: null });
  };

  const handleLevelCancel = () => {
    setLevelDialog({ open: false, sport: null });
  };

  const handleNext = () => {
    const sports = Object.entries(selected).map(([key, level]) => ({
      key,
      level,
    }));
    navigate('/onboarding/notifications', {
      state: { ...prevState, sports },
    });
  };

  const levelMarks = [
    { value: 1, label: t('onboarding.level1') },
    { value: 2, label: '' },
    { value: 3, label: '' },
    { value: 4, label: '' },
    { value: 5, label: t('onboarding.level5') },
  ];

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
        {t('onboarding.chooseSports')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
        {t('onboarding.sportsDescription')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('onboarding.step', { current: 5, total: 7 })}
      </Typography>

      <TextField
        fullWidth
        size="small"
        placeholder={t('onboarding.searchSports')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3 }}
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4, flex: 1 }}>
        {filtered.map((key) => (
          <SportChip
            key={key}
            sportKey={key}
            level={selected[key]}
            selected={!!selected[key]}
            onClick={() => handleSportClick(key)}
          />
        ))}
      </Box>

      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleNext}
        disabled={Object.keys(selected).length === 0}
        sx={{ minHeight: 52 }}
      >
        {t('onboarding.next')}
      </Button>

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Button
          variant="text"
          onClick={() =>
            navigate('/onboarding/spoken-languages', { state: prevState })
          }
          sx={{ minHeight: 48 }}
        >
          {t('onboarding.back')}
        </Button>
      </Box>

      {/* Level selection dialog */}
      <Dialog
        open={levelDialog.open}
        onClose={handleLevelCancel}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {levelDialog.sport && t(`sports.${levelDialog.sport}`)}
          {' \u2014 '}
          {t('onboarding.skillLevel')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t(`onboarding.level${tempLevel}`)}
          </Typography>
          <Box sx={{ px: 2 }}>
            <Slider
              value={tempLevel}
              onChange={(e, val) => setTempLevel(val)}
              min={1}
              max={5}
              step={1}
              marks={levelMarks}
              valueLabelDisplay="auto"
              valueLabelFormat={(val) => t(`onboarding.level${val}`)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleLevelCancel} sx={{ minHeight: 48 }}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleLevelConfirm}
            sx={{ minHeight: 48 }}
          >
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
