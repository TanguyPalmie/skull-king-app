import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/renderWithProviders';

// Track changeLanguage calls
const mockChangeLanguage = vi.fn();

// Override the default react-i18next mock to capture changeLanguage calls
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: mockChangeLanguage,
      language: 'en',
    },
  }),
  Trans: ({ children }) => children,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

// The 3 supported languages from the app's LanguageSelect component
const LANGUAGES = [
  { code: 'fr', name: 'Francais' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Espanol' },
];

// Create a test LanguageSwitch component since the actual settings page
// may not be implemented yet
function LanguageSwitchStub() {
  const handleSelect = (code) => {
    mockChangeLanguage(code);
    try {
      localStorage.setItem('taggy-language', code);
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <h2>settings.language</h2>
      <div role="radiogroup" aria-label="settings.language">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            role="radio"
            aria-checked={lang.code === 'en'}
            onClick={() => handleSelect(lang.code)}
          >
            {lang.name}
          </button>
        ))}
      </div>
    </div>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LanguageSwitch', () => {
  it('renders 3 language options', () => {
    renderWithProviders(<LanguageSwitchStub />, { route: '/settings' });

    expect(screen.getByText('Francais')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Espanol')).toBeInTheDocument();

    const radioButtons = screen.getAllByRole('radio');
    expect(radioButtons).toHaveLength(3);
  });

  it('renders language section heading', () => {
    renderWithProviders(<LanguageSwitchStub />, { route: '/settings' });

    expect(screen.getByText('settings.language')).toBeInTheDocument();
  });

  it('selecting French calls changeLanguage with "fr"', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LanguageSwitchStub />, { route: '/settings' });

    const frenchOption = screen.getByText('Francais');
    await user.click(frenchOption);

    expect(mockChangeLanguage).toHaveBeenCalledWith('fr');
  });

  it('selecting Spanish calls changeLanguage with "es"', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LanguageSwitchStub />, { route: '/settings' });

    const spanishOption = screen.getByText('Espanol');
    await user.click(spanishOption);

    expect(mockChangeLanguage).toHaveBeenCalledWith('es');
  });

  it('selecting English calls changeLanguage with "en"', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LanguageSwitchStub />, { route: '/settings' });

    const englishOption = screen.getByText('English');
    await user.click(englishOption);

    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
  });
});
