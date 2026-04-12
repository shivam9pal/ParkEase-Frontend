import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ShieldCheck, UserPlus, Trash2, RefreshCw,
  Eye, EyeOff, Shield, Crown, X,
} from "lucide-react";
import { getAllAdmins, createAdmin, deleteAdmin, reactivateAdmin } from "../api/authApi";
import { formatDateTime, truncateId } from "../utils/formatters";
import logger from "../utils/logger";
import PageHeader from "../components/shared/PageHeader";
import DataTable from "../components/shared/DataTable";
import Badge from "../components/shared/Badge";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import { toast } from "../store/notificationStore";
import { useAuthStore } from "../store/authStore";

const createAdminSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long"),
});

// Create Admin slide-in panel
function CreateAdminPanel({ onClose, onCreated }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [serverError, setServerError]   = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ resolver: zodResolver(createAdminSchema) });

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError("");
    try {
      const res = await createAdmin(data);
      toast.success(`Admin "${res.data.fullName}" created successfully`);
      onCreated(res.data);
      reset();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "";
      if (msg.toLowerCase().includes("already exists")) {
        setServerError("An admin with this email already exists.");
      } else {
        setServerError("Failed to create admin. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // Overlay
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-muted/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <UserPlus size={16} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Create New Admin</h3>
              <p className="text-xs text-secondary">New admin will not be a Super Admin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md hover:bg-surface flex items-center justify-center text-secondary hover:text-gray-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-700">{serverError}</p>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Name
            </label>
            <input
              {...register("fullName")}
              type="text"
              placeholder="e.g. Arjun Sharma"
              className={`
                w-full px-4 py-2.5 text-sm border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400
                transition-colors
                ${errors.fullName ? "border-red-400 bg-red-50" : "border-muted hover:border-secondary"}
              `}
            />
            {errors.fullName && (
              <p className="text-xs text-red-600 mt-1">{errors.fullName.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="admin@parkease.com"
              className={`
                w-full px-4 py-2.5 text-sm border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400
                transition-colors
                ${errors.email ? "border-red-400 bg-red-50" : "border-muted hover:border-secondary"}
              `}
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                className={`
                  w-full px-4 py-2.5 pr-10 text-sm border rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400
                  transition-colors
                  ${errors.password ? "border-red-400 bg-red-50" : "border-muted hover:border-secondary"}
                `}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Info note */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-xs text-purple-700">
              <span className="font-semibold">Note:</span> Created admins will have
              standard admin access only. Super Admin privileges cannot be assigned
              manually.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-muted/40 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-secondary border border-muted/60 rounded-lg hover:bg-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="
              flex-1 py-2.5 text-sm font-semibold text-white
              bg-purple-600 hover:bg-purple-700
              rounded-lg transition-colors shadow-sm
              disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
            "
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <UserPlus size={14} />
                Create Admin
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminManagementPage() {
  const { admin: currentAdmin } = useAuthStore();
  const [admins, setAdmins]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showPanel, setShowPanel]   = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [confirm, setConfirm] = useState({
    open: false, adminId: null, adminName: "", action: "deactivate",
  });

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await getAllAdmins();
      const data = res.data ?? [];
      setAdmins(Array.isArray(data) ? data : []);
      if ((!data || data.length === 0) && !loading) {
        logger.warn("⚠️ No admins returned from API");
      }
    } catch (err) {
      logger.error("❌ Admin fetch error:", err.message);
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminCreated = (newAdmin) => {
    setAdmins((prev) => [newAdmin, ...prev]);
  };

  const openDeleteConfirm = (admin) => {
    setConfirm({ open: true, adminId: admin.adminId, adminName: admin.fullName, action: "deactivate" });
  };

  const openReactivateConfirm = (admin) => {
    setConfirm({ open: true, adminId: admin.adminId, adminName: admin.fullName, action: "reactivate" });
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteAdmin(confirm.adminId);
      toast.success(`"${confirm.adminName}" has been deactivated`);
      // Mark as inactive in local state (soft delete)
      setAdmins((prev) =>
        prev.map((a) =>
          a.adminId === confirm.adminId ? { ...a, isActive: false } : a
        )
      );
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete admin";
      toast.error(msg);
    } finally {
      setActionLoading(false);
      setConfirm({ open: false, adminId: null, adminName: "", action: "deactivate" });
    }
  };

  const handleReactivate = async () => {
    setActionLoading(true);
    try {
      await reactivateAdmin(confirm.adminId);
      toast.success(`"${confirm.adminName}" has been reactivated`);
      // Mark as active in local state
      setAdmins((prev) =>
        prev.map((a) =>
          a.adminId === confirm.adminId ? { ...a, isActive: true } : a
        )
      );
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to reactivate admin";
      toast.error(msg);
    } finally {
      setActionLoading(false);
      setConfirm({ open: false, adminId: null, adminName: "", action: "deactivate" });
    }
  };

  const columns = [
    {
      key: "fullName",
      label: "Admin",
      render: (row) => (
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0
              ${row.isSuperAdmin ? "bg-purple-600" : "bg-primary"}
            `}
          >
            {row.fullName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-gray-800 text-sm">
                {row.fullName}
              </p>
              {row.adminId === currentAdmin?.adminId && (
                <span className="text-[10px] bg-accent/10 text-accent font-semibold px-1.5 py-0.5 rounded-full">
                  You
                </span>
              )}
            </div>
            <p className="text-xs text-secondary font-mono">
              {truncateId(row.adminId)}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (row) => (
        <span className="text-sm text-gray-700">{row.email}</span>
      ),
    },
    {
      key: "isSuperAdmin",
      label: "Role",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {row.isSuperAdmin
            ? <Crown size={13} className="text-purple-600" />
            : <Shield size={13} className="text-secondary" />
          }
          <Badge
            variant={row.isSuperAdmin ? "superadmin" : "admin"}
            label={row.isSuperAdmin ? "Super Admin" : "Admin"}
          />
        </div>
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
      key: "createdAt",
      label: "Created At",
      render: (row) => (
        <span className="text-xs text-secondary">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (row) => {
        // Cannot modify Super Admin or yourself
        const isProtected =
          row.isSuperAdmin || row.adminId === currentAdmin?.adminId;

        return (
          <div className="flex items-center justify-end">
            {isProtected ? (
              <span
                className="text-xs text-muted-foreground italic cursor-default"
                title={
                  row.isSuperAdmin
                    ? "Super Admin cannot be modified"
                    : "You cannot modify your own account"
                }
              >
                Protected
              </span>
            ) : row.isActive ? (
              <button
                onClick={() => openDeleteConfirm(row)}
                className="
                  flex items-center gap-1.5 text-xs font-medium
                  text-red-600 hover:text-red-700
                  bg-red-50 hover:bg-red-100
                  border border-red-200
                  px-2.5 py-1.5 rounded-md
                  transition-colors
                "
                title="Deactivate admin"
              >
                <Trash2 size={12} />
                Deactivate
              </button>
            ) : (
              <button
                onClick={() => openReactivateConfirm(row)}
                className="
                  flex items-center gap-1.5 text-xs font-medium
                  text-green-600 hover:text-green-700
                  bg-green-50 hover:bg-green-100
                  border border-green-200
                  px-2.5 py-1.5 rounded-md
                  transition-colors
                "
                title="Reactivate admin"
              >
                <Shield size={12} />
                Reactivate
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // Summary counts
  const activeCount = admins.filter((a) => a.isActive).length;
  const superCount  = admins.filter((a) => a.isSuperAdmin).length;

  return (
    <div className="page-container">
      <PageHeader
        title="Admin Management"
        subtitle="Manage administrator accounts — Super Admin access only"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdmins}
              className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary border border-muted/60 px-3 py-1.5 rounded-md transition-colors hover:border-primary"
            >
              <RefreshCw size={13} /> Refresh
            </button>
            <button
              onClick={() => setShowPanel(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 px-4 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              <UserPlus size={13} />
              Create Admin
            </button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Total Admins",
            value: admins.length,
            icon: ShieldCheck,
            color: "text-primary",
            bg: "bg-primary/5",
          },
          {
            label: "Active Admins",
            value: activeCount,
            icon: Shield,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Super Admins",
            value: superCount,
            icon: Crown,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-lg border border-muted/40 shadow-card px-4 py-3 flex items-center gap-3"
          >
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

      {/* Super Admin badge */}
      <div className="flex items-center gap-2.5 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
        <Crown size={15} className="text-purple-600 shrink-0" />
        <p className="text-xs text-purple-800">
          <span className="font-semibold">Super Admin protection:</span>{" "}
          Super Admin accounts and your own account are protected from deletion.
          Only inactive (soft-deleted) admins cannot log in.
        </p>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={admins}
        loading={loading}
        searchKeys={["fullName", "email"]}
        searchPlaceholder="Search by name or email..."
        rowKey="adminId"
        defaultRowsPerPage={10}
        emptyMessage="No admin accounts found"
      />

      {/* Create Admin Panel */}
      {showPanel && (
        <CreateAdminPanel
          onClose={() => setShowPanel(false)}
          onCreated={handleAdminCreated}
        />
      )}

      {/* Delete/Reactivate Confirm Dialog */}
      <ConfirmDialog
        open={confirm.open}
        onClose={() =>
          setConfirm({ open: false, adminId: null, adminName: "", action: "deactivate" })
        }
        onConfirm={confirm.action === "reactivate" ? handleReactivate : handleDelete}
        loading={actionLoading}
        title={confirm.action === "reactivate" ? "Reactivate Admin Account?" : "Deactivate Admin Account?"}
        description={
          confirm.action === "reactivate"
            ? `Reactivate "${confirm.adminName}"? They will regain access to the admin panel.`
            : `Deactivate "${confirm.adminName}"? They will lose access immediately. This is a soft delete — their account record will be kept for audit purposes.`
        }
        confirmLabel={confirm.action === "reactivate" ? "Yes, Reactivate" : "Yes, Deactivate"}
        confirmVariant={confirm.action === "reactivate" ? "default" : "destructive"}
      />
    </div>
  );
}