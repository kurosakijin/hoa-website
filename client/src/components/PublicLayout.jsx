import { Outlet } from 'react-router-dom';
import PublicHeader from './PublicHeader';

function PublicLayout() {
  return (
    <div className="min-h-screen public-shell text-slate-100">
      <PublicHeader />
      <Outlet />
    </div>
  );
}

export default PublicLayout;
