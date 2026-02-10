import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { isDark, toggleTheme } = useThemeMode();

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    try {
      localStorage.setItem('taggy-language', lang);
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    setLogoutDialogOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const kycStatus = user?.kycStatus || 'not_started';
  const kycLabel =
    kycStatus === 'verified'
      ? t('settings.kycVerified')
      : kycStatus === 'pending'
        ? t('settings.kycPending')
        : t('settings.kycNotStarted');
  const kycColor =
    kycStatus === 'verified' ? 'success' : kycStatus === 'pending' ? 'warning' : 'default';

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('settings.title')}
      </Typography>

      {/* Appearance */}
      <Typography variant="h6" sx={{ mb: 1 }}>
        {t('settings.appearance')}
      </Typography>
      <Card sx={{ mb: 3 }}>
        <List disablePadding>
          <ListItem sx={{ minHeight: 56 }}>
            <ListItemText primary={t('settings.darkMode')} />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={isDark}
                onChange={toggleTheme}
                inputProps={{ 'aria-label': t('settings.darkMode') }}
              />
            </ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem sx={{ minHeight: 56, flexDirection: 'column', alignItems: 'flex-start', gap: 1, py: 2 }}>
            <Typography variant="body1">{t('settings.language')}</Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={i18n.language?.split('-')[0] || 'en'}
              onChange={handleLanguageChange}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="fr">Fran\u00e7ais</MenuItem>
              <MenuItem value="es">Espa\u00f1ol</MenuItem>
            </TextField>
          </ListItem>
        </List>
      </Card>

      {/* Account */}
      <Typography variant="h6" sx={{ mb: 1 }}>
        {t('settings.account')}
      </Typography>
      <Card sx={{ mb: 3 }}>
        <List disablePadding>
          <ListItem sx={{ minHeight: 56 }}>
            <ListItemText
              primary={t('settings.kyc')}
              secondary={
                <Chip label={kycLabel} color={kycColor} size="small" sx={{ mt: 0.5 }} />
              }
            />
            {kycStatus !== 'verified' && (
              <ListItemSecondaryAction>
                <Button variant="text" size="small" sx={{ minHeight: 48 }}>
                  {t('settings.startKyc')}
                </Button>
              </ListItemSecondaryAction>
            )}
          </ListItem>
        </List>
      </Card>

      {/* Actions */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => setLogoutDialogOpen(true)}
          sx={{ minHeight: 48 }}
        >
          {t('auth.logout')}
        </Button>

        <Button
          variant="outlined"
          color="error"
          fullWidth
          onClick={() => setDeleteDialogOpen(true)}
          sx={{ minHeight: 48 }}
        >
          {t('settings.deleteAccount')}
        </Button>
      </Box>

      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ display: 'block', textAlign: 'center', mt: 4 }}
      >
        {t('settings.version')} 1.0.0
      </Typography>

      {/* Logout confirmation dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
      >
        <DialogTitle>{t('auth.logout')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('settings.logoutConfirm')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)} sx={{ minHeight: 48 }}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleLogout} color="error" sx={{ minHeight: 48 }}>
            {t('auth.logout')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete account confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>{t('settings.deleteAccount')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('settings.deleteAccountConfirm')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ minHeight: 48 }}>
            {t('common.cancel')}
          </Button>
          <Button color="error" sx={{ minHeight: 48 }}>
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
