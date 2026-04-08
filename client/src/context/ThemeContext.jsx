import { createContext, useContext, useEffect, useState } from 'react';
import { isAdminHost } from '../utils/siteHost';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'hoa-theme-preference';
const COOKIE_KEY = 'hoa_theme_preference';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function getSavedThemeFromCookie() {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookieValue = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${COOKIE_KEY}=`))
    ?.split('=')
    ?.slice(1)
    ?.join('=');

  return cookieValue === 'light' || cookieValue === 'dark' ? cookieValue : null;
}

function getDefaultThemeForPath(pathname = '/') {
  return isAdminHost() || pathname.startsWith('/admin') || pathname.startsWith('/hiyas-admin-access') ? 'dark' : 'light';
}

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const savedCookieTheme = getSavedThemeFromCookie();

  if (savedCookieTheme) {
    return savedCookieTheme;
  }

  const savedTheme = window.localStorage.getItem(STORAGE_KEY);

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return getDefaultThemeForPath(window.location.pathname);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
    document.cookie = `${COOKIE_KEY}=${theme}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode: theme === 'dark',
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider.');
  }

  return context;
}
