import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';
import apiClient from '../api/client';

export default function MessagesPage() {
  const { t } = useTranslation();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const data = await apiClient.get('/messages/threads');
        setThreads(data.threads || data || []);
      } catch {
        setThreads([]);
      } finally {
        setLoading(false);
      }
    };
    fetchThreads();
  }, []);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('messages.title')}
      </Typography>

      {loading ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          {t('common.loading')}
        </Typography>
      ) : threads.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <ChatIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {t('messages.noMessages')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('messages.noMessagesDescription')}
          </Typography>
        </Box>
      ) : (
        <Card>
          <List disablePadding>
            {threads.map((thread, idx) => (
              <React.Fragment key={thread.id || idx}>
                {idx > 0 && <Divider />}
                <ListItem
                  component="div"
                  sx={{ cursor: 'pointer', minHeight: 64 }}
                >
                  <ListItemAvatar>
                    <Avatar src={thread.avatar}>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={thread.displayName || thread.name || t('messages.title')}
                    secondary={thread.lastMessage || ''}
                    secondaryTypographyProps={{
                      noWrap: true,
                      sx: { maxWidth: '70vw' },
                    }}
                  />
                  {thread.updatedAt && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1, flexShrink: 0 }}>
                      {new Date(thread.updatedAt).toLocaleDateString()}
                    </Typography>
                  )}
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Card>
      )}
    </Box>
  );
}
