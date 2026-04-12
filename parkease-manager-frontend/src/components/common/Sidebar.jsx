import { NavLink, useParams, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  User,
  MapPin,
  CalendarDays,
  Activity,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

// ── Top-level nav links ──────────────────────────────────────────────
const mainNavLinks = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/manager' },
  { label: 'My Lots',   icon: Building2,        path: '/manager/lots' },
  { label: 'Profile',   icon: User,             path: '/manager/profile' },
];

// ── Per-lot sub-links (shown when inside /manager/lots/:lotId) ────────
const lotSubLinks = (lotId) => [
  { label: 'Lot Overview',   icon: MapPin,        path: `/manager/lots/${lotId}` },
  { label: 'Manage Spots',   icon: Building2,     path: `/manager/lots/${lotId}/spots` },
  { label: 'All Bookings',   icon: CalendarDays,  path: `/manager/lots/${lotId}/bookings` },
  { label: 'Live Occupancy', icon: Activity,      path: `/manager/lots/${lotId}/occupancy` },
  { label: 'Revenue',        icon: BarChart3,     path: `/manager/lots/${lotId}/revenue` },
];

export default function Sidebar() {
  const user     = useAuthStore((s) => s.user);
  const location = useLocation();
  const { lotId } = useParams();

  // Detect if we're inside a specific lot's sub-pages
  const insideLot = location.pathname.includes('/manager/lots/') && lotId;

  return (
    <aside className="w-64 bg-parkease-dark flex flex-col shadow-xl shrink-0">

      {/* ── Brand ── */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🅿️</span>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">ParkEase</h1>
            <p className="text-parkease-light text-xs font-medium">Manager Portal</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">

        {/* Main nav links */}
        {mainNavLinks.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/manager'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
               transition-all duration-150 group
               ${isActive
                 ? 'bg-white/15 text-white shadow-sm'
                 : 'text-parkease-light hover:bg-white/10 hover:text-white'
               }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={isActive ? 'text-parkease-mid' : 'text-parkease-muted group-hover:text-parkease-mid'}
                />
                <span>{label}</span>
                {isActive && (
                  <ChevronRight size={14} className="ml-auto text-parkease-mid" />
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* ── Lot Sub-links (only when inside a specific lot) ── */}
        {insideLot && (
          <>
            <div className="pt-4 pb-2 px-3">
              <p className="text-parkease-muted text-xs font-semibold uppercase tracking-wider">
                Current Lot
              </p>
            </div>

            {lotSubLinks(lotId).map(({ label, icon: Icon, path }) => (
              <NavLink
                key={path}
                to={path}
                end={path === `/manager/lots/${lotId}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                   transition-all duration-150 group
                   ${isActive
                     ? 'bg-parkease-mid/30 text-white shadow-sm border border-parkease-mid/40'
                     : 'text-parkease-light hover:bg-white/10 hover:text-white'
                   }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={16}
                      className={isActive ? 'text-parkease-mid' : 'text-parkease-muted group-hover:text-parkease-mid'}
                    />
                    <span>{label}</span>
                    {isActive && (
                      <ChevronRight size={14} className="ml-auto text-parkease-mid" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* ── User Footer ── */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-parkease-mid/40 border border-parkease-mid/60
                          flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.fullName?.charAt(0)?.toUpperCase() ?? 'M'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">
              {user?.fullName ?? 'Manager'}
            </p>
            <p className="text-parkease-muted text-xs truncate">
              {user?.email ?? ''}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}