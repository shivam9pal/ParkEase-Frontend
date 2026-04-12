import { Menu, PanelLeftClose, PanelLeftOpen, LogOut, ChevronDown } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

// Map route paths to human-readable page titles
const pageTitles = {
  "/dashboard":          "Dashboard",
  "/users":              "User Management",
  "/lots":               "Lot Management",
  "/bookings":           "All Bookings",
  "/payments":           "All Payments",
  // "/analytics/platform": "Platform Analytics", // Disabled for now
  "/analytics/lots":     "Lot Analytics",
  "/notifications":      "Notifications Log",
  "/broadcast":          "Broadcast",
  "/admin-management":   "Admin Management",
};

export default function Topbar({ collapsed, onToggleCollapse, onMobileMenuOpen }) {
  const { admin, isSuperAdmin, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle = pageTitles[location.pathname] || "ParkEase Admin";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Get initials for avatar
  const initials = admin?.fullName
    ? admin.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  return (
    <header className="h-16 bg-white border-b border-muted/40 flex items-center justify-between px-4 md:px-6 shrink-0 shadow-sm z-10">

      {/* Left: Collapse toggle + Page title */}
      <div className="flex items-center gap-3">
        {/* Desktop: collapse/expand button */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md text-secondary hover:text-primary hover:bg-surface transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed
            ? <PanelLeftOpen size={18} />
            : <PanelLeftClose size={18} />
          }
        </button>

        {/* Mobile: hamburger */}
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md text-secondary hover:text-primary hover:bg-surface transition-colors"
        >
          <Menu size={20} />
        </button>

        <h1 className="text-base md:text-lg font-semibold text-gray-800 truncate">
          {pageTitle}
        </h1>
      </div>

      {/* Right: Admin dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-surface transition-colors">
            {/* Avatar circle */}
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium text-gray-800 leading-tight max-w-[120px] truncate">
                {admin?.fullName ?? "Admin"}
              </span>
              <span className="text-[11px] text-secondary leading-tight">
                {isSuperAdmin ? "Super Admin" : "Admin"}
              </span>
            </div>
            <ChevronDown size={14} className="text-secondary hidden md:block" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>
            <p className="font-medium text-gray-800 truncate">{admin?.fullName}</p>
            <p className="text-xs text-secondary font-normal truncate">{admin?.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
          >
            <LogOut size={14} className="mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}