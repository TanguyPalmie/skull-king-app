import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { ThemeContextProvider, useThemeMode } from '../../contexts/ThemeContext';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, val) => { store[key] = val; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// A test component that uses the theme context and renders a toggle
function ThemeSwitchTestHarness() {
  const { mode, toggleTheme, isDark } = useThemeMode();
  return (
    <div>
      <span data-testid="current-mode">{mode}</span>
      <label htmlFor="theme-toggle">settings.darkMode</label>
      <button
        id="theme-toggle"
        role="switch"
        aria-checked={isDark}
        onClick={toggleTheme}
      >
        {isDark ? 'Dark' : 'Light'}
      </button>
    </div>
  );
}

function renderWithThemeContext(ui) {
  const theme = createTheme({ palette: { mode: 'light' } });
  return render(
    <MemoryRouter>
      <ThemeContextProvider>
        <ThemeProvider theme={theme}>
          {ui}
        </ThemeProvider>
      </ThemeContextProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});

describe('ThemeSwitch', () => {
  it('renders the theme toggle', () => {
    renderWithThemeContext(<ThemeSwitchTestHarness />);

    expect(screen.getByRole('switch')).toBeInTheDocument();
    expect(screen.getByText('settings.darkMode')).toBeInTheDocument();
  });

  it('displays the current theme mode', () => {
    renderWithThemeContext(<ThemeSwitchTestHarness />);

    const modeText = screen.getByTestId('current-mode');
    expect(modeText).toBeInTheDocument();
    // Default mode should be light (no localStorage set, matchMedia not matching)
    expect(modeText.textContent).toBe('light');
  });

  it('clicking toggle triggers theme change from light to dark', async () => {
    const user = userEvent.setup();

    renderWithThemeContext(<ThemeSwitchTestHarness />);

    const toggle = screen.getByRole('switch');
    expect(screen.getByTestId('current-mode').textContent).toBe('light');

    await user.click(toggle);

    await waitFor(() => {
      expect(screen.getByTestId('current-mode').textContent).toBe('dark');
    });
  });

  it('clicking toggle twice returns to original mode', async () => {
    const user = userEvent.setup();

    renderWithThemeContext(<ThemeSwitchTestHarness />);

    const toggle = screen.getByRole('switch');

    // First click: light -> dark
    await user.click(toggle);
    await waitFor(() => {
      expect(screen.getByTestId('current-mode').textContent).toBe('dark');
    });

    // Second click: dark -> light
    await user.click(toggle);
    await waitFor(() => {
      expect(screen.getByTestId('current-mode').textContent).toBe('light');
    });
  });

  it('persists theme preference to localStorage', async () => {
    const user = userEvent.setup();

    renderWithThemeContext(<ThemeSwitchTestHarness />);

    const toggle = screen.getByRole('switch');
    await user.click(toggle);

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('taggy-theme-mode', 'dark');
    });
  });
});
