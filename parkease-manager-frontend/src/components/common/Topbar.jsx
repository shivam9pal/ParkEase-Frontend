import { useNavigate } from 'react-router-dom';
import { LogOut, User, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import NotificationBell from './NotificationBell';
import { useAuth } from '../../hooks/useAuth';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-white border-b border-accent/40 px-6
                       flex items-center justify-between shrink-0 shadow-sm z-10">

      {/* ── Left: Welcome Message ── */}
      <div>
        <span className="text-sm text-muted font-medium">
          Welcome back,{' '}
          <span className="text-primary font-semibold">
            {user?.fullName?.split(' ')[0] ?? 'Manager'}
          </span>{' '}
          👋
        </span>
      </div>

      {/* ── Right: Notification + User Menu ── */}
      <div className="flex items-center gap-3">

        {/* Notification Bell */}
        <NotificationBell />

        {/* Divider */}
        <div className="w-px h-6 bg-accent/60" />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg
                         hover:bg-background transition-colors duration-150 outline-none"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">
                  {user?.fullName?.charAt(0)?.toUpperCase() ?? 'M'}
                </span>
              </div>

              {/* User Info */}
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-tight">
                  {user?.fullName ?? 'Manager'}
                </p>
                <p className="text-xs text-muted leading-tight">MANAGER</p>
              </div>

              <ChevronDown size={14} className="text-muted ml-1" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48 mt-1">
            
            {/* Profile */}
            <DropdownMenuItem
              onClick={() => navigate('/manager/profile')}
              className="gap-2 cursor-pointer"
            >
              <User size={15} className="text-primary" />
              <span>My Profile</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Logout */}
            <DropdownMenuItem
              onClick={logout}
              className="gap-2 cursor-pointer text-red-600 focus:text-red-600
                         focus:bg-red-50"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}