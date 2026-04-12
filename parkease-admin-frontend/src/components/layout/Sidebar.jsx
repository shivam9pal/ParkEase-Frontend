import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  LayoutDashboard,
  Users,
  ParkingSquare,
  CalendarCheck,
  CreditCard,
  BarChart2,
  TrendingUp,
  Bell,
  Megaphone,
  ShieldCheck,
  X,
  ParkingMeter,
} from "lucide-react";

const navItems = [
  { to: "/dashboard",          label: "Dashboard",          icon: LayoutDashboard },
  { to: "/users",              label: "User Management",    icon: Users },
  { to: "/lots",               label: "Lot Management",     icon: ParkingSquare },
  { to: "/bookings",           label: "All Bookings",       icon: CalendarCheck },
  { to: "/payments",           label: "All Payments",       icon: CreditCard },
  // { to: "/analytics/platform", label: "Platform Analytics", icon: BarChart2 }, // Disabled for now
  { to: "/analytics/lots",     label: "Lot Analytics",      icon: TrendingUp },
  { to: "/notifications",      label: "Notifications Log",  icon: Bell },
  { to: "/broadcast",          label: "Broadcast",          icon: Megaphone },
];

const linkBase =
  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 group relative";
const linkInactive =
  "text-sidebar-muted hover:bg-white/10 hover:text-sidebar-text";
const linkActive =
  "bg-accent text-white shadow-sm";

export default function Sidebar({ collapsed, mobileOpen, onClose }) {
  const { isSuperAdmin } = useAuthStore();

  const sidebarWidth = collapsed ? "w-[68px]" : "w-64";

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex flex-col h-full bg-primary shrink-0 transition-all duration-300
          ${sidebarWidth}
        `}
      >
        <SidebarContent
          collapsed={collapsed}
          isSuperAdmin={isSuperAdmin}
          showClose={false}
        />
      </aside>

      {/* Mobile Sidebar (slide-in drawer) */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 flex flex-col w-64 bg-primary
          transform transition-transform duration-300 lg:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <SidebarContent
          collapsed={false}
          isSuperAdmin={isSuperAdmin}
          showClose={true}
          onClose={onClose}
        />
      </aside>
    </>
  );
}

function SidebarContent({ collapsed, isSuperAdmin, showClose, onClose }) {
  return (
    <>
      {/* Logo */}
      <div
        className={`
          flex items-center h-16 px-4 border-b border-white/10 shrink-0
          ${collapsed ? "justify-center" : "justify-between"}
        `}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center">
              <ParkingMeter size={16} className="text-white" />
            </div>
            <span className="text-sidebar-text font-bold text-base tracking-tight">
              ParkEase
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center">
            <ParkingMeter size={16} className="text-white" />
          </div>
        )}
        {showClose && (
          <button
            onClick={onClose}
            className="text-sidebar-muted hover:text-white p-1 rounded"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={`shrink-0 ${isActive ? "text-white" : "text-sidebar-muted group-hover:text-sidebar-text"}`}
                />
                {!collapsed && (
                  <span className="truncate">{label}</span>
                )}
                {/* Tooltip on collapsed */}
                {collapsed && (
                  <div className="
                    absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs
                    rounded whitespace-nowrap opacity-0 group-hover:opacity-100
                    pointer-events-none transition-opacity duration-150 z-50
                  ">
                    {label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Super Admin Only */}
        {isSuperAdmin && (
          <>
            <div className={`pt-3 pb-1 ${collapsed ? "px-1" : "px-1"}`}>
              {!collapsed && (
                <p className="text-[10px] uppercase tracking-widest text-white/30 font-semibold px-2">
                  Super Admin
                </p>
              )}
              {collapsed && <div className="border-t border-white/10 my-1" />}
            </div>
            <NavLink
              to="/admin-management"
              className={({ isActive }) =>
                `${linkBase} ${isActive
                  ? "bg-purple-500 text-white shadow-sm"
                  : "text-purple-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <ShieldCheck
                    size={18}
                    className={`shrink-0 ${isActive ? "text-white" : "text-purple-300"}`}
                  />
                  {!collapsed && <span className="truncate">Admin Management</span>}
                  {collapsed && (
                    <div className="
                      absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs
                      rounded whitespace-nowrap opacity-0 group-hover:opacity-100
                      pointer-events-none transition-opacity duration-150 z-50
                    ">
                      Admin Management
                    </div>
                  )}
                </>
              )}
            </NavLink>
          </>
        )}
      </nav>

      {/* Bottom version tag */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-[11px] text-white/30">ParkEase Admin v1.0</p>
        </div>
      )}
    </>
  );
}