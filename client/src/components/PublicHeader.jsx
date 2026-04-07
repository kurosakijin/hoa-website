import { NavLink } from 'react-router-dom';
import ThemeToggleButton from './ThemeToggleButton';

function PublicHeader() {
  return (
    <header className="public-header">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 lg:px-6">
        <NavLink to="/" className="brand-mark">
          <span className="brand-mark__icon" />
          <span>
            <strong>Sitio Hiyas</strong>
            <small>Homeowners Association</small>
          </span>
        </NavLink>

        <div className="flex items-center gap-3">
          <ThemeToggleButton compact />
        </div>
      </div>
    </header>
  );
}

export default PublicHeader;
