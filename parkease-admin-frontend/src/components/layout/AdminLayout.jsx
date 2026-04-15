import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ToastContainer from "../shared/ToastContainer";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onMobileMenuOpen={() => setMobileOpen(true)}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-surface">
          <Outlet />
        </main>
      </div>

      {/* Global toast notifications */}
      <ToastContainer />
    </div>
  );
}