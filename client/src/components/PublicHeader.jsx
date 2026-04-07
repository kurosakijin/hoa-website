import { NavLink } from 'react-router-dom';
import ThemeToggleButton from './ThemeToggleButton';

const publicNavItems = [
  { to: '/', label: 'Home', end: true },
];

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

        <nav className="hidden items-center gap-2 lg:flex">
          {publicNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `nav-chip ${isActive ? 'nav-chip--active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggleButton compact />
        </div>
      </div>
    </header>
  );
}

export default PublicHeader;
