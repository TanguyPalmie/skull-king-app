import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import SearchIcon from '@mui/icons-material/Search';
import EventIcon from '@mui/icons-material/Event';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, activityData] = await Promise.allSettled([
          apiClient.get('/events', { query: { limit: 3, upcoming: true } }),
          apiClient.get('/activity', { query: { limit: 5 } }),
        ]);
        if (eventsData.status === 'fulfilled') {
          setUpcomingEvents(eventsData.value.events || eventsData.value || []);
        }
        if (activityData.status === 'fulfilled') {
          setActivity(activityData.value.items || activityData.value || []);
        }
      } catch {
        // silent - page still renders
      }
    };
    fetchData();
  }, []);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('home.welcome', { name: user?.displayName || '' })}
      </Typography>

      {/* Quick action cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <Card sx={{ flex: 1 }}>
          <CardActionArea onClick={() => navigate('/queue')} sx={{ minHeight: 120 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <SearchIcon sx={{ fontSize: 36, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                {t('home.findMatch')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('home.findMatchDescription')}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardActionArea onClick={() => navigate('/events/create')} sx={{ minHeight: 120 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <EventIcon sx={{ fontSize: 36, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                {t('home.createEvent')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('home.createEventDescription')}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Box>

      {/* Upcoming events */}
      <Typography variant="h6" sx={{ mb: 1 }}>
        {t('home.upcomingEvents')}
      </Typography>
      {upcomingEvents.length > 0 ? (
        <Card sx={{ mb: 3 }}>
          <List disablePadding>
            {upcomingEvents.map((event, idx) => (
              <React.Fragment key={event.id || idx}>
                {idx > 0 && <Divider />}
                <ListItem
                  component="div"
                  onClick={() => navigate(`/events/${event.id}`)}
                  sx={{ cursor: 'pointer', minHeight: 48 }}
                >
                  <ListItemText
                    primary={event.title}
                    secondary={event.date ? new Date(event.date).toLocaleDateString() : ''}
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Card>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('home.noUpcoming')}
        </Typography>
      )}

      {/* Recent activity */}
      <Typography variant="h6" sx={{ mb: 1 }}>
        {t('home.recentActivity')}
      </Typography>
      {activity.length > 0 ? (
        <Card>
          <List disablePadding>
            {activity.map((item, idx) => (
              <React.Fragment key={item.id || idx}>
                {idx > 0 && <Divider />}
                <ListItem sx={{ minHeight: 48 }}>
                  <ListItemText
                    primary={item.message || item.title}
                    secondary={item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Card>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t('home.noActivity')}
        </Typography>
      )}
    </Box>
  );
}
