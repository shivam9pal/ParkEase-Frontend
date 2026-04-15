import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Topbar from '../components/common/Topbar';

export default function ManagerLayout() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ── Sidebar ── */}
      <Sidebar />

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Topbar ── */}
        <Topbar />

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}