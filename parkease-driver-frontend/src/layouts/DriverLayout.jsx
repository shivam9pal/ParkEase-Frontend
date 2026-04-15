import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';

export default function DriverLayout() {
  return (
    <div className="min-h-screen bg-parkease-bg">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
}