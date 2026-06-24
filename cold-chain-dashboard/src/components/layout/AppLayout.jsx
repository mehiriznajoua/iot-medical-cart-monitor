import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopNavbar from './TopNavbar.jsx';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <div className="ml-64">
        <TopNavbar />
        <main className="px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
