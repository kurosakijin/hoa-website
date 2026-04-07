import { useTheme } from '../context/ThemeContext';

function ThemeToggleButton({ compact = false }) {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={`theme-toggle ${compact ? 'theme-toggle--compact' : ''}`}
      onClick={toggleTheme}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="theme-toggle__swatch" />
      <span>{isDarkMode ? 'Dark mode' : 'Light mode'}</span>
    </button>
  );
}

export default ThemeToggleButton;
