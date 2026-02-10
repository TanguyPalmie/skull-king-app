import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import EventIcon from '@mui/icons-material/Event';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';

const navItems = [
  { key: 'home', path: '/', icon: <HomeIcon /> },
  { key: 'queue', path: '/queue', icon: <SearchIcon /> },
  { key: 'events', path: '/events', icon: <EventIcon /> },
  { key: 'messages', path: '/messages', icon: <ChatIcon /> },
  { key: 'profile', path: '/profile', icon: <PersonIcon /> },
];

export default function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const currentIndex = navItems.findIndex((item) => {
    if (item.path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(item.path);
  });

  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      elevation={3}
    >
      <BottomNavigation
        value={activeIndex}
        onChange={(event, newValue) => {
          navigate(navItems[newValue].path);
        }}
        showLabels
      >
        {navItems.map((item) => (
          <BottomNavigationAction
            key={item.key}
            label={t(`nav.${item.key}`)}
            icon={item.icon}
            sx={{ minWidth: 0, minHeight: 48 }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
