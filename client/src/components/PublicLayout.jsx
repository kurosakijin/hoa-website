import { Outlet, useLocation } from 'react-router-dom';
import PublicHeader from './PublicHeader';

function PublicLayout() {
  const location = useLocation();
  const shouldShowHeader = location.pathname !== '/';

  return (
    <div className="min-h-screen public-shell text-slate-100">
      {shouldShowHeader ? <PublicHeader /> : null}
      <Outlet />
    </div>
  );
}

export default PublicLayout;
