import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from '../contexts/AuthContext';
import SportChip from '../components/common/SportChip';
import LanguageChip from '../components/common/LanguageChip';
import RatingDialog from '../components/common/RatingDialog';
import apiClient from '../api/client';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const isOwnProfile = !id || id === currentUser?.id;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(!isOwnProfile);
  const [ratingOpen, setRatingOpen] = useState(false);

  useEffect(() => {
    if (isOwnProfile) {
      setProfile(currentUser);
      return;
    }
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await apiClient.get(`/users/${id}`);
        setProfile(data.user || data);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, isOwnProfile, currentUser]);

  const handleRate = async ({ rating, comment }) => {
    try {
      await apiClient.post(`/users/${id}/rate`, { rating, comment });
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="text.secondary">{t('common.loading')}</Typography>
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="text.secondary">{t('common.error')}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 3,
          position: 'relative',
        }}
      >
        {isOwnProfile && (
          <IconButton
            onClick={() => navigate('/settings')}
            sx={{ position: 'absolute', top: 0, right: 0, minWidth: 48, minHeight: 48 }}
          >
            <SettingsIcon />
          </IconButton>
        )}

        <Avatar
          src={profile.avatar}
          sx={{ width: 96, height: 96, mb: 2, fontSize: '2.5rem' }}
        >
          <PersonIcon sx={{ fontSize: 48 }} />
        </Avatar>

        <Typography variant="h5" sx={{ mb: 0.5 }}>
          {profile.displayName || profile.name}
        </Typography>

        {profile.createdAt && (
          <Typography variant="body2" color="text.secondary">
            {t('profile.memberSince', {
              date: new Date(profile.createdAt).toLocaleDateString(),
            })}
          </Typography>
        )}
      </Box>

      {/* Bio */}
      {profile.bio && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {t('profile.bio')}
            </Typography>
            <Typography variant="body1">{profile.bio}</Typography>
          </CardContent>
        </Card>
      )}

      {/* Sports */}
      <Typography variant="h6" sx={{ mb: 1 }}>
        {t('profile.sports')}
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {profile.sports && profile.sports.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {profile.sports.map((sport) => (
                <SportChip
                  key={sport.key || sport}
                  sportKey={sport.key || sport}
                  level={sport.level}
                />
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('profile.noSports')}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Languages */}
      <Typography variant="h6" sx={{ mb: 1 }}>
        {t('profile.languages')}
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {profile.spokenLanguages && profile.spokenLanguages.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {profile.spokenLanguages.map((lang) => (
                <LanguageChip key={lang} langCode={lang} />
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('profile.noLanguages')}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Actions for other users */}
      {!isOwnProfile && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => setRatingOpen(true)}
            sx={{ minHeight: 48 }}
          >
            {t('profile.ratePlayer')}
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={async () => {
              try {
                await apiClient.post(`/users/${id}/shadow-block`);
              } catch {
                // ignore
              }
            }}
            sx={{ minHeight: 48 }}
          >
            {t('profile.shadowBlock')}
          </Button>
        </Box>
      )}

      {/* Own profile settings link */}
      {isOwnProfile && (
        <Button
          variant="outlined"
          fullWidth
          onClick={() => navigate('/settings')}
          sx={{ minHeight: 48 }}
        >
          {t('profile.settings')}
        </Button>
      )}

      <RatingDialog
        open={ratingOpen}
        onClose={() => setRatingOpen(false)}
        onSubmit={handleRate}
        playerName={profile.displayName || profile.name}
      />
    </Box>
  );
}
