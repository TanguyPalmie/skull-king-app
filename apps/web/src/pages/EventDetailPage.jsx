import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';

export default function EventDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEvent = async () => {
    try {
      const data = await apiClient.get(`/events/${id}`);
      setEvent(data.event || data);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const isParticipant = event?.participants?.some((p) => p.id === user?.id);
  const isCreator = event?.createdBy?.id === user?.id || event?.creatorId === user?.id;
  const isFull =
    event?.maxParticipants && (event?.participants?.length || 0) >= event.maxParticipants;

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      await apiClient.post(`/events/${id}/join`);
      await fetchEvent();
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    try {
      await apiClient.post(`/events/${id}/leave`);
      await fetchEvent();
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await apiClient.delete(`/events/${id}`);
      navigate('/events', { replace: true });
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!event) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">{error || t('common.error')}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="h4" sx={{ mb: 1 }}>
        {event.title}
      </Typography>

      {event.sport && (
        <Chip
          label={t(`sports.${event.sport}`, event.sport)}
          color="primary"
          sx={{ mb: 2 }}
        />
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          {event.date && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <EventIcon color="action" />
              <Typography variant="body1">
                {new Date(event.date).toLocaleString()}
              </Typography>
            </Box>
          )}

          {event.location && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <LocationOnIcon color="action" />
              <Typography variant="body1">{event.location}</Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <PeopleIcon color="action" />
            <Typography variant="body1">
              {t('events.participantCount', {
                count: event.participants?.length || 0,
                max: event.maxParticipants || '?',
              })}
            </Typography>
          </Box>

          {(event.createdBy?.displayName || event.creatorName) && (
            <Typography variant="body2" color="text.secondary">
              {t('events.createdBy', {
                name: event.createdBy?.displayName || event.creatorName,
              })}
            </Typography>
          )}
        </CardContent>
      </Card>

      {event.description && (
        <Typography variant="body1" sx={{ mb: 3 }}>
          {event.description}
        </Typography>
      )}

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {!isCreator && !isParticipant && !isFull && (
          <Button
            variant="contained"
            fullWidth
            onClick={handleJoin}
            disabled={actionLoading}
            sx={{ minHeight: 52 }}
          >
            {t('events.join')}
          </Button>
        )}

        {!isCreator && isParticipant && (
          <Button
            variant="outlined"
            color="secondary"
            fullWidth
            onClick={handleLeave}
            disabled={actionLoading}
            sx={{ minHeight: 52 }}
          >
            {t('events.leave')}
          </Button>
        )}

        {isFull && !isParticipant && !isCreator && (
          <Button variant="contained" fullWidth disabled sx={{ minHeight: 52 }}>
            {t('events.eventFull')}
          </Button>
        )}

        {isCreator && (
          <Button
            variant="outlined"
            color="error"
            fullWidth
            onClick={handleDelete}
            disabled={actionLoading}
            sx={{ minHeight: 52 }}
          >
            {t('events.deleteEvent')}
          </Button>
        )}
      </Box>

      {/* Participants */}
      {event.participants && event.participants.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {t('events.participants')}
          </Typography>
          <Card>
            <List disablePadding>
              {event.participants.map((participant, idx) => (
                <React.Fragment key={participant.id || idx}>
                  {idx > 0 && <Divider />}
                  <ListItem
                    component="div"
                    onClick={() => navigate(`/profile/${participant.id}`)}
                    sx={{ cursor: 'pointer', minHeight: 56 }}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={participant.displayName || participant.name} />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Card>
        </>
      )}
    </Box>
  );
}
