import { createTheme } from '@mui/material/styles';

export function createAppTheme(mode) {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#6C63FF',
        light: '#9B95FF',
        dark: '#4A42CB',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#FF6B6B',
        light: '#FF9E9E',
        dark: '#CC4545',
        contrastText: '#FFFFFF',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#F5F5F7',
        paper: mode === 'dark' ? '#1E1E1E' : '#FFFFFF',
      },
      text: {
        primary: mode === 'dark' ? '#FFFFFF' : '#1A1A2E',
        secondary: mode === 'dark' ? '#B0B0B0' : '#6B6B80',
      },
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h4: {
        fontWeight: 700,
        fontSize: '1.75rem',
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.4rem',
      },
      h6: {
        fontWeight: 600,
        fontSize: '1.15rem',
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.9rem',
        lineHeight: 1.5,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '1rem',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          },
          '#root': {
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            minHeight: 48,
            borderRadius: 12,
            paddingLeft: 24,
            paddingRight: 24,
            fontSize: '1rem',
          },
          containedPrimary: {
            boxShadow: '0 4px 12px rgba(108, 99, 255, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(108, 99, 255, 0.4)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiInputBase-root': {
              minHeight: 52,
              fontSize: '1rem',
              borderRadius: 12,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: mode === 'dark'
              ? '0 2px 8px rgba(0,0,0,0.3)'
              : '0 2px 12px rgba(0,0,0,0.08)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            minHeight: 36,
            fontSize: '0.875rem',
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            height: 64,
            paddingBottom: 'env(safe-area-inset-bottom)',
            borderTop: mode === 'dark'
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid rgba(0,0,0,0.08)',
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            minWidth: 56,
            minHeight: 56,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 20,
            margin: 16,
          },
        },
      },
    },
  });
}
