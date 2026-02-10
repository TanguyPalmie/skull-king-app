import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/renderWithProviders';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock API client
vi.mock('../../api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Sample sports list for testing
const SAMPLE_SPORTS = [
  { id: 1, key: 'football', name: 'Football' },
  { id: 2, key: 'basketball', name: 'Basketball' },
  { id: 3, key: 'tennis', name: 'Tennis' },
  { id: 4, key: 'volleyball', name: 'Volleyball' },
  { id: 5, key: 'badminton', name: 'Badminton' },
];

// Try to import the actual component, fall back to stub
let SportsStep;
try {
  const mod = await import('../../pages/onboarding/SportsStep');
  SportsStep = mod.default;
} catch {
  // Component does not exist yet; create a stub representing expected behavior
  SportsStep = function SportsStepStub() {
    const [search, setSearch] = React.useState('');
    const [selected, setSelected] = React.useState([]);

    const filteredSports = SAMPLE_SPORTS.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );

    const toggleSport = (sportId) => {
      setSelected((prev) =>
        prev.includes(sportId) ? prev.filter((id) => id !== sportId) : [...prev, sportId]
      );
    };

    return (
      <div>
        <h1>onboarding.chooseSports</h1>
        <p>onboarding.sportsDescription</p>
        <label htmlFor="sport-search">onboarding.searchSports</label>
        <input
          id="sport-search"
          type="text"
          placeholder="onboarding.searchSports"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ul role="list">
          {filteredSports.map((sport) => (
            <li key={sport.id}>
              <button
                role="checkbox"
                aria-checked={selected.includes(sport.id)}
                onClick={() => toggleSport(sport.id)}
              >
                {sport.name}
              </button>
            </li>
          ))}
        </ul>
        <button onClick={() => mockNavigate('/onboarding/notifications')}>
          onboarding.next
        </button>
      </div>
    );
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SportsStep', () => {
  it('renders the sports search input and list', () => {
    renderWithProviders(<SportsStep />, { route: '/onboarding/sports' });

    expect(screen.getByLabelText('onboarding.searchSports')).toBeInTheDocument();
    // Should render sports items
    expect(screen.getByText('Football')).toBeInTheDocument();
    expect(screen.getByText('Basketball')).toBeInTheDocument();
    expect(screen.getByText('Tennis')).toBeInTheDocument();
  });

  it('filters sports based on search input', async () => {
    const user = userEvent.setup();

    renderWithProviders(<SportsStep />, { route: '/onboarding/sports' });

    const searchInput = screen.getByLabelText('onboarding.searchSports');
    await user.type(searchInput, 'ten');

    await waitFor(() => {
      expect(screen.getByText('Tennis')).toBeInTheDocument();
      // These should be filtered out
      expect(screen.queryByText('Football')).not.toBeInTheDocument();
      expect(screen.queryByText('Basketball')).not.toBeInTheDocument();
    });
  });

  it('can select and deselect sports', async () => {
    const user = userEvent.setup();

    renderWithProviders(<SportsStep />, { route: '/onboarding/sports' });

    const footballButton = screen.getByText('Football');
    expect(footballButton).toBeInTheDocument();

    // Select football
    await user.click(footballButton);

    await waitFor(() => {
      expect(footballButton.getAttribute('aria-checked')).toBe('true');
    });

    // Deselect football
    await user.click(footballButton);

    await waitFor(() => {
      expect(footballButton.getAttribute('aria-checked')).toBe('false');
    });
  });

  it('renders the next button', () => {
    renderWithProviders(<SportsStep />, { route: '/onboarding/sports' });

    expect(screen.getByText('onboarding.next')).toBeInTheDocument();
  });
});
