import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, MapPin, CalendarCheck,
  Car, CreditCard, User, LogOut,
  Menu, X, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from './NotificationBell';

// ── Nav links definition ──────────────────────────────────────────────────────
const NAV_LINKS = [
  { to: '/driver',              label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/driver/find-parking', label: 'Find Parking', icon: MapPin          },
  { to: '/driver/bookings',     label: 'My Bookings',  icon: CalendarCheck   },
  { to: '/driver/vehicles',     label: 'My Vehicles',  icon: Car             },
  { to: '/driver/payments',     label: 'Payments',     icon: CreditCard      },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();

  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);

  // ── Avatar initials ───────────────────────────────────────────────────────
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-[#3D52A0] shadow-nav">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ─────────────────────────────────────────────────────── */}
            <button
              onClick={() => navigate('/driver')}
              className="flex items-center gap-2.5 flex-shrink-0"
            >
              {/* P icon */}
              <div className="w-9 h-9 bg-white rounded-xl flex items-center 
                              justify-center shadow-sm">
                <span className="text-[#3D52A0] font-black text-lg leading-none">
                  P
                </span>
              </div>
              <div className="hidden sm:block">
                <span className="text-white font-bold text-lg tracking-tight">
                  ParkEase
                </span>
                <span className="block text-[#ADBBDA] text-[10px] 
                                 font-medium -mt-0.5 tracking-widest uppercase">
                  Driver Portal
                </span>
              </div>
            </button>

            {/* ── Desktop Nav Links ─────────────────────────────────────────── */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/driver'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm 
                     font-medium transition-all duration-200
                     ${isActive
                       ? 'bg-white text-[#3D52A0] shadow-sm'
                       : 'text-white/80 hover:text-white hover:bg-white/10'
                     }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </div>

            {/* ── Right: Bell + Profile ─────────────────────────────────────── */}
            <div className="flex items-center gap-2">

              {/* Notification Bell */}
              <NotificationBell />

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((p) => !p)}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 
                             rounded-xl text-white/90 hover:text-white 
                             hover:bg-white/10 transition-all duration-200"
                >
                  {/* Avatar */}
                  {user?.profilePicUrl ? (
                    <img
                      src={user.profilePicUrl}
                      alt={user.fullName}
                      className="w-8 h-8 rounded-lg object-cover 
                                 border-2 border-white/30"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-[#7091E6] rounded-lg 
                                    flex items-center justify-center 
                                    text-white text-sm font-bold 
                                    border-2 border-white/20">
                      {getInitials(user?.fullName)}
                    </div>
                  )}

                  {/* Name (hidden on small screens) */}
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-white leading-tight">
                      {user?.fullName?.split(' ')[0] ?? 'Driver'}
                    </p>
                    <p className="text-[10px] text-[#ADBBDA] leading-tight">
                      Driver
                    </p>
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-white/60 transition-transform 
                                duration-200 ${profileOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Profile Dropdown Menu */}
                {profileOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-52 bg-white 
                                rounded-2xl shadow-[0_8px_32px_rgba(61,82,160,0.15)]
                                border border-[#ADBBDA] z-50 overflow-hidden
                                animate-in slide-in-from-top-2 duration-200"
                    onMouseLeave={() => setProfileOpen(false)}
                  >
                    {/* User info header */}
                    <div className="px-4 py-3.5 bg-[#EDE8F5]/60 
                                    border-b border-[#EDE8F5]">
                      <p className="text-sm font-semibold text-[#3D52A0] 
                                    truncate">
                        {user?.fullName ?? 'Driver'}
                      </p>
                      <p className="text-xs text-[#8697C4] truncate mt-0.5">
                        {user?.email}
                      </p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1.5">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate('/driver/profile');
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 
                                   text-sm text-gray-700 hover:bg-[#EDE8F5] 
                                   hover:text-[#3D52A0] transition-all duration-150"
                      >
                        <User className="w-4 h-4 text-[#8697C4]" />
                        My Profile
                      </button>
                    </div>

                    <div className="border-t border-[#EDE8F5] py-1.5">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 
                                   text-sm text-red-500 hover:bg-red-50 
                                   transition-all duration-150"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Hamburger */}
              <button
                onClick={() => setMobileOpen((p) => !p)}
                className="lg:hidden p-2 rounded-xl text-white/80 
                           hover:text-white hover:bg-white/10 
                           transition-all duration-200"
              >
                {mobileOpen
                  ? <X className="w-5 h-5" />
                  : <Menu className="w-5 h-5" />
                }
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer ──────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 flex">

          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer panel */}
          <div className="relative w-72 bg-[#3D52A0] h-full flex flex-col 
                          shadow-2xl animate-in slide-in-from-left duration-300">

            {/* Drawer header */}
            <div className="flex items-center gap-3 px-5 py-5 
                            border-b border-white/10">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center 
                              justify-center">
                <span className="text-[#3D52A0] font-black text-xl">P</span>
              </div>
              <div>
                <p className="text-white font-bold text-base">ParkEase</p>
                <p className="text-[#ADBBDA] text-xs">Driver Portal</p>
              </div>
            </div>

            {/* User info in drawer */}
            <div className="flex items-center gap-3 px-5 py-4 
                            border-b border-white/10 bg-white/5">
              <div className="w-10 h-10 bg-[#7091E6] rounded-xl 
                              flex items-center justify-center 
                              text-white font-bold text-base">
                {getInitials(user?.fullName)}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">
                  {user?.fullName ?? 'Driver'}
                </p>
                <p className="text-[#ADBBDA] text-xs truncate max-w-[160px]">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Drawer Nav Links */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto">
              {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/driver'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm 
                     font-medium mb-1 transition-all duration-200
                     ${isActive
                       ? 'bg-white text-[#3D52A0]'
                       : 'text-white/80 hover:text-white hover:bg-white/10'
                     }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Drawer footer — Profile + Logout */}
            <div className="px-3 pb-6 border-t border-white/10 pt-3 space-y-1">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  navigate('/driver/profile');
                }}
                className="flex items-center gap-3 w-full px-4 py-3 
                           rounded-xl text-sm font-medium text-white/80 
                           hover:text-white hover:bg-white/10 
                           transition-all duration-200"
              >
                <User className="w-5 h-5" />
                My Profile
              </button>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 w-full px-4 py-3 
                           rounded-xl text-sm font-medium 
                           text-red-300 hover:text-white hover:bg-red-500/20 
                           transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}