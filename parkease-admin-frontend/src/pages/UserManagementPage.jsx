import { useEffect, useState, useMemo } from "react";
import { Users, UserCheck, UserX, RefreshCw } from "lucide-react";
import { getAllUsers, deactivateUser, reactivateUser } from "../api/userApi";
import { formatDateTime, truncateId } from "../utils/formatters";
import logger from "../utils/logger";
import PageHeader from "../components/shared/PageHeader";
import DataTable from "../components/shared/DataTable";
import Badge from "../components/shared/Badge";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import { toast } from "../store/notificationStore";

// Filter button component
function FilterButton({ label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
        ${active
          ? "bg-primary text-white border-primary shadow-sm"
          : "bg-white text-secondary border-muted/60 hover:border-primary hover:text-primary"
        }
      `}
    >
      {label}
      {count !== undefined && (
        <span
          className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold
            ${active ? "bg-white/20 text-white" : "bg-surface text-secondary"}`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default function UserManagementPage() {
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [roleFilter, setRoleFilter]     = useState("ALL");
  const [actionLoading, setActionLoading] = useState(false);

  // Confirm dialog state
  const [confirm, setConfirm] = useState({
    open: false,
    userId: null,
    action: null,  // "deactivate" | "reactivate"
    userName: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      const data = res.data ?? [];
      setUsers(Array.isArray(data) ? data : []);
      if ((!data || data.length === 0) && !loading) {
        logger.warn("⚠️ No users returned from API");
      }
    } catch (err) {
      logger.error("❌ User fetch error:", err.message);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Client-side role filter
  const filteredUsers = useMemo(() => {
    if (roleFilter === "ALL") return users;
    return users.filter((u) => u.role === roleFilter);
  }, [users, roleFilter]);

  // Count per role for filter badges
  const counts = useMemo(() => ({
    ALL:     users.length,
    DRIVER:  users.filter((u) => u.role === "DRIVER").length,
    MANAGER: users.filter((u) => u.role === "MANAGER").length,
  }), [users]);

  // Open confirm dialog
  const handleActionClick = (user, action) => {
    setConfirm({
      open: true,
      userId: user.userId,
      action,
      userName: user.fullName,
    });
  };

  // Execute deactivate or reactivate
  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      if (confirm.action === "deactivate") {
        await deactivateUser(confirm.userId);
        toast.success(`${confirm.userName} has been deactivated`);
      } else {
        await reactivateUser(confirm.userId);
        toast.success(`${confirm.userName} has been reactivated`);
      }
      // Update local state without full re-fetch
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === confirm.userId
            ? { ...u, isActive: confirm.action === "reactivate" }
            : u
        )
      );
    } catch {
      toast.error(`Failed to ${confirm.action} user`);
    } finally {
      setActionLoading(false);
      setConfirm({ open: false, userId: null, action: null, userName: "" });
    }
  };

  // Table column definitions
  const columns = [
    {
      key: "fullName",
      label: "Full Name",
      render: (row) => (
        <div>
          <p className="font-medium text-gray-800">{row.fullName}</p>
          <p className="text-xs text-secondary">{truncateId(row.userId)}</p>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (row) => (
        <span className="text-gray-700">{row.email}</span>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (row) => (
        <span className="text-gray-600">{row.phone ?? "—"}</span>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (row) => (
        <Badge
          variant={row.role?.toLowerCase()}
          label={row.role}
          dot
        />
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (row) => (
        <Badge
          variant={row.isActive ? "active" : "inactive"}
          label={row.isActive ? "Active" : "Inactive"}
          dot
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.isActive ? (
            <button
              onClick={() => handleActionClick(row, "deactivate")}
              className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-md transition-colors"
            >
              <UserX size={13} />
              Deactivate
            </button>
          ) : (
            <button
              onClick={() => handleActionClick(row, "reactivate")}
              className="flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 px-2.5 py-1.5 rounded-md transition-colors"
            >
              <UserCheck size={13} />
              Reactivate
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="User Management"
        subtitle="Manage all drivers and managers on the platform"
        actions={
          <button
            onClick={fetchUsers}
            className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary border border-muted/60 px-3 py-1.5 rounded-md transition-colors hover:border-primary"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        }
      />

      {/* Summary mini stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Users",  value: counts.ALL,     icon: Users,     color: "text-primary",  bg: "bg-primary/5" },
          { label: "Drivers",      value: counts.DRIVER,  icon: UserCheck, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Managers",     value: counts.MANAGER, icon: Users,     color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-lg border border-muted/40 shadow-card px-4 py-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">{value}</p>
              <p className="text-xs text-secondary">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Role filter buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-secondary font-medium">Filter by:</span>
        {["ALL", "DRIVER", "MANAGER"].map((role) => (
          <FilterButton
            key={role}
            label={role === "ALL" ? "All Users" : role}
            active={roleFilter === role}
            onClick={() => setRoleFilter(role)}
            count={counts[role]}
          />
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        searchKeys={["fullName", "email", "phone"]}
        searchPlaceholder="Search by name, email or phone..."
        rowKey="userId"
        defaultRowsPerPage={10}
        emptyMessage="No users found"
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirm.open}
        onClose={() =>
          setConfirm({ open: false, userId: null, action: null, userName: "" })
        }
        onConfirm={handleConfirm}
        loading={actionLoading}
        title={
          confirm.action === "deactivate"
            ? "Deactivate User?"
            : "Reactivate User?"
        }
        description={
          confirm.action === "deactivate"
            ? `Are you sure you want to deactivate "${confirm.userName}"? They will immediately lose access to the platform.`
            : `Reactivate "${confirm.userName}"? They will regain full access to the platform.`
        }
        confirmLabel={
          confirm.action === "deactivate" ? "Yes, Deactivate" : "Yes, Reactivate"
        }
        confirmVariant={
          confirm.action === "deactivate" ? "destructive" : "default"
        }
      />
    </div>
  );
}