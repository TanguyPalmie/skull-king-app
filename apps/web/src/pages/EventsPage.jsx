import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Fab from '@mui/material/Fab';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import apiClient from '../api/client';

export default function EventsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0); // 0 = upcoming, 1 = past

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const data = await apiClient.get('/events', {
          query: { type: tab === 0 ? 'upcoming' : 'past' },
        });
        setEvents(data.events || data || []);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [tab]);

  return (
    <Box sx={{ pb: 10 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        {t('events.title')}
      </Typography>

      <Tabs
        value={tab}
        onChange={(e, v) => setTab(v)}
        variant="fullWidth"
        sx={{ mb: 3 }}
      >
        <Tab label={t('events.upcoming')} sx={{ minHeight: 48 }} />
        <Tab label={t('events.past')} sx={{ minHeight: 48 }} />
      </Tabs>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">{t('common.loading')}</Typography>
        </Box>
      ) : events.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <EventIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {t('events.noEvents')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('events.noEventsDescription')}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {events.map((event) => (
            <Card key={event.id}>
              <CardActionArea onClick={() => navigate(`/events/${event.id}`)}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" sx={{ flex: 1 }}>
                      {event.title}
                    </Typography>
                    {event.sport && (
                      <Chip
                        label={t(`sports.${event.sport}`, event.sport)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  {event.date && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      <EventIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                      {new Date(event.date).toLocaleString()}
                    </Typography>
                  )}
                  {event.location && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {event.location}
                    </Typography>
                  )}
                  {(event.participantCount !== undefined || event.maxParticipants) && (
                    <Typography variant="body2" color="text.secondary">
                      <PeopleIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                      {t('events.participantCount', {
                        count: event.participantCount || 0,
                        max: event.maxParticipants || '?',
                      })}
                    </Typography>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}

      <Fab
        color="primary"
        aria-label={t('events.create')}
        onClick={() => navigate('/events/create')}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          zIndex: 1050,
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}
