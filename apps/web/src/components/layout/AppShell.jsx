import React from 'react';
import { useTranslation } from 'react-i18next';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import BottomNav from './BottomNav';

export default function AppShell({ children }) {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          backdropFilter: 'blur(8px)',
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(30, 30, 30, 0.88)'
              : 'rgba(255, 255, 255, 0.88)',
          borderBottom: (theme) =>
            `1px solid ${
              theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.08)'
            }`,
        }}
      >
        <Toolbar
          sx={{
            paddingTop: 'env(safe-area-inset-top)',
            minHeight: { xs: 56 },
          }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              color: 'primary.main',
            }}
          >
            Taggy
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Spacer for fixed AppBar */}
      <Toolbar
        sx={{
          paddingTop: 'env(safe-area-inset-top)',
          minHeight: { xs: 56 },
        }}
      />

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flex: 1,
          px: 2,
          py: 2,
          pb: '80px', // space for bottom nav
          overflowY: 'auto',
        }}
      >
        {children}
      </Box>

      <BottomNav />
    </Box>
  );
}
