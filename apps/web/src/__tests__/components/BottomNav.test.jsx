import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/renderWithProviders';
import BottomNav from '../../components/layout/BottomNav';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock MUI icons to avoid import issues in test environment
vi.mock('@mui/icons-material/Home', () => ({
  default: () => <span data-testid="icon-home">HomeIcon</span>,
}));
vi.mock('@mui/icons-material/Search', () => ({
  default: () => <span data-testid="icon-search">SearchIcon</span>,
}));
vi.mock('@mui/icons-material/Event', () => ({
  default: () => <span data-testid="icon-event">EventIcon</span>,
}));
vi.mock('@mui/icons-material/Chat', () => ({
  default: () => <span data-testid="icon-chat">ChatIcon</span>,
}));
vi.mock('@mui/icons-material/Person', () => ({
  default: () => <span data-testid="icon-person">PersonIcon</span>,
}));

describe('BottomNav', () => {
  it('renders 5 navigation items', () => {
    renderWithProviders(<BottomNav />, { route: '/' });

    // The BottomNavigation renders BottomNavigationAction elements as buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('renders correct labels for all nav items', () => {
    renderWithProviders(<BottomNav />, { route: '/' });

    // Labels are translated via t('nav.key'), so they appear as translation keys
    expect(screen.getByText('nav.home')).toBeInTheDocument();
    expect(screen.getByText('nav.queue')).toBeInTheDocument();
    expect(screen.getByText('nav.events')).toBeInTheDocument();
    expect(screen.getByText('nav.messages')).toBeInTheDocument();
    expect(screen.getByText('nav.profile')).toBeInTheDocument();
  });

  it('renders all navigation icons', () => {
    renderWithProviders(<BottomNav />, { route: '/' });

    expect(screen.getByTestId('icon-home')).toBeInTheDocument();
    expect(screen.getByTestId('icon-search')).toBeInTheDocument();
    expect(screen.getByTestId('icon-event')).toBeInTheDocument();
    expect(screen.getByTestId('icon-chat')).toBeInTheDocument();
    expect(screen.getByTestId('icon-person')).toBeInTheDocument();
  });

  it('highlights the home tab when on the home route', () => {
    renderWithProviders(<BottomNav />, { route: '/' });

    const buttons = screen.getAllByRole('button');
    // The first button (home) should have the selected/active class
    // MUI adds Mui-selected class to the active BottomNavigationAction
    expect(buttons[0].classList.toString()).toContain('Mui-selected');
  });

  it('highlights the queue tab when on the queue route', () => {
    renderWithProviders(<BottomNav />, { route: '/queue' });

    const buttons = screen.getAllByRole('button');
    // The second button (queue) should be selected
    expect(buttons[1].classList.toString()).toContain('Mui-selected');
  });
});
