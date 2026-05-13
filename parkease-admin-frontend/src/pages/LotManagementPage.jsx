import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ParkingSquare, CheckCircle2, Clock, RefreshCw,
  MapPin, DollarSign, CheckCheck, Ban, AlertCircle, X,
} from "lucide-react";
import {
  getAllLots, getPendingLots, approveLot, rejectLot, deactivateLot,
} from "../api/lotApi";
import { formatCurrency, formatDateTime, truncateId } from "../utils/formatters";
import PageHeader from "../components/shared/PageHeader";
import DataTable from "../components/shared/DataTable";
import Badge from "../components/shared/Badge";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import EmptyState from "../components/shared/EmptyState";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { toast } from "../store/notificationStore";

// Tab button
function Tab({ label, active, onClick, count, dotColor }) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-2 px-5 py-3 text-sm font-semibold
        border-b-2 transition-colors
        ${active
          ? "border-primary text-primary"
          : "border-transparent text-secondary hover:text-gray-700 hover:border-muted"
        }
      `}
    >
      {label}
      {count !== undefined && (
        <span
          className={`
            px-1.5 py-0.5 rounded-full text-[10px] font-bold
            ${active ? "bg-primary/10 text-primary" : "bg-surface text-secondary"}
          `}
        >
          {count}
        </span>
      )}
      {dotColor && count > 0 && (
        <span className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`} />
      )}
    </button>
  );
}

export default function LotManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "pending" ? "pending" : "all";

  const [allLots, setAllLots]         = useState([]);
  const [pendingLots, setPendingLots] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [confirm, setConfirm] = useState({
    open: false, lotId: null, action: null, lotName: "",
  });

  const [rejectModal, setRejectModal] = useState({
    open: false, lotId: null, lotName: "", reason: "",
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [allRes, pendingRes] = await Promise.all([
        getAllLots(),
        getPendingLots(),
      ]);
      const allData = allRes.data ?? [];
      const pendingData = pendingRes.data ?? [];
      
      setAllLots(Array.isArray(allData) ? allData : []);
      setPendingLots(Array.isArray(pendingData) ? pendingData : []);
    } catch (err) {
      console.error("❌ Error fetching lots:", err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || "Failed to load parking lots");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setSearchParams(tab === "pending" ? { tab: "pending" } : {});
  };

  const openConfirm = (lot, action) => {
    if (action === "reject") {
      setRejectModal({ open: true, lotId: lot.lotId, lotName: lot.name, reason: "" });
    } else {
      setConfirm({ open: true, lotId: lot.lotId, action, lotName: lot.name });
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal.reason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setActionLoading(true);
    try {
      await rejectLot(rejectModal.lotId, rejectModal.reason);
      toast.success(`"${rejectModal.lotName}" has been rejected`);
      // Remove from pending lots
      setPendingLots((prev) =>
        prev.filter((l) => l.lotId !== rejectModal.lotId)
      );
      setRejectModal({ open: false, lotId: null, lotName: "", reason: "" });
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message ?? '';
      
      if (status === 404) {
        toast.error('Parking lot not found.');
      } else if (status === 403) {
        toast.error('You do not have permission for this action.');
      } else if (status === 409) {
        toast.error(msg || 'Action cannot be completed at this time.');
      } else if (status === 400) {
        toast.error(msg || 'Invalid request.');
      } else {
        toast.error(msg || 'Action failed');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      if (confirm.action === "approve") {
        await approveLot(confirm.lotId);
        toast.success(`"${confirm.lotName}" approved and is now active`);
        // Move from pending to allLots as APPROVED
        const approved = pendingLots.find((l) => l.lotId === confirm.lotId);
        if (approved) {
          const updated = { ...approved, isApproved: true };
          setPendingLots((prev) => prev.filter((l) => l.lotId !== confirm.lotId));
          setAllLots((prev) =>
            prev.map((l) => l.lotId === confirm.lotId ? updated : l)
          );
        }
      } else if (confirm.action === "deactivate") {
        await deactivateLot(confirm.lotId);
        toast.success(`"${confirm.lotName}" has been deactivated`);
        setAllLots((prev) =>
          prev.filter((l) => l.lotId !== confirm.lotId)
        );
      }
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message ?? '';
      
      if (status === 404) {
        toast.error('Parking lot not found.');
      } else if (status === 403) {
        toast.error('You do not have permission for this action.');
      } else if (status === 409) {
        toast.error(msg || 'Action cannot be completed at this time.');
      } else if (status === 400) {
        toast.error(msg || 'Invalid request.');
      } else {
        toast.error(msg || 'Action failed');
      }
    } finally {
      setActionLoading(false);
      setConfirm({ open: false, lotId: null, action: null, lotName: "" });
    }
  };

  // ─── Column definitions ────────────────────────────────────────────────────

  const allLotsColumns = [
    {
      key: "name",
      label: "Lot Name",
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-800">{row.name}</p>
          <p className="text-xs text-secondary flex items-center gap-1 mt-0.5">
            <MapPin size={11} /> {row.address}
          </p>
        </div>
      ),
    },
    {
      key: "managerId",
      label: "Manager ID",
      render: (row) => (
        <span className="font-mono text-xs text-secondary">
          {truncateId(row.managerId)}
        </span>
      ),
    },
    {
      key: "spots",
      label: "Spots",
      render: (row) => (
        <div className="text-sm">
          <span className="font-semibold text-gray-800">{row.availableSpots}</span>
          <span className="text-secondary"> / {row.totalSpots}</span>
          <p className="text-[10px] text-secondary">Available</p>
        </div>
      ),
    },
    {
      key: "isApproved",
      label: "Status",
      render: (row) => (
        <Badge
          variant={row.isApproved ? "active" : "pending"}
          label={row.isApproved ? "Approved" : "Pending"}
          dot
        />
      ),
    },
    {
      key: "createdAt",
      label: "Created",
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
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.isApproved ? (
            <button
              onClick={() => openConfirm(row, "deactivate")}
              className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-md transition-colors"
            >
              <Ban size={12} /> Deactivate
            </button>
          ) : (
            <button
              onClick={() => openConfirm(row, "approve")}
              className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-2.5 py-1.5 rounded-md transition-colors"
            >
              <CheckCheck size={12} /> Approve
            </button>
          )}
        </div>
      ),
    },
  ];

  const pendingColumns = [
    {
      key: "name",
      label: "Lot Name",
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-800">{row.name}</p>
          <p className="text-xs text-secondary flex items-center gap-1 mt-0.5">
            <MapPin size={11} /> {row.address}
          </p>
        </div>
      ),
    },
    {
      key: "managerId",
      label: "Manager ID",
      render: (row) => (
        <span className="font-mono text-xs text-secondary">
          {truncateId(row.managerId)}
        </span>
      ),
    },
    {
      key: "totalSpots",
      label: "Total Spots",
      render: (row) => (
        <span className="font-semibold text-gray-800">{row.totalSpots}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Submitted",
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
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => openConfirm(row, "approve")}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary-hover px-3 py-1.5 rounded-md transition-colors shadow-sm"
          >
            <CheckCheck size={13} /> Approve
          </button>
          <button
            onClick={() => openConfirm(row, "reject")}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-md transition-colors"
          >
            <AlertCircle size={13} /> Reject
          </button>
        </div>
      ),
    },
  ];

  // Summary counts
  const approvedLots   = allLots.filter((l) => l.isApproved === true).length;
  const pendingCount = pendingLots.length;

  return (
    <div className="page-container">
      <PageHeader
        title="Lot Management"
        subtitle="Approve, manage, and monitor all parking lots"
        actions={
          <button
            onClick={fetchAll}
            className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary border border-muted/60 px-3 py-1.5 rounded-md transition-colors hover:border-primary"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Lots",    value: allLots.length,  icon: ParkingSquare, color: "text-primary",      bg: "bg-primary/5" },
          { label: "Approved",      value: approvedLots,    icon: CheckCircle2,  color: "text-green-600",    bg: "bg-green-50" },
          { label: "Pending",       value: pendingCount,    icon: Clock,         color: "text-yellow-600",   bg: "bg-yellow-50" },
          { label: "Total Spots",   value: allLots.reduce((sum, lot) => sum + lot.totalSpots, 0), icon: ParkingSquare, color: "text-blue-600", bg: "bg-blue-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-lg border border-muted/40 shadow-card px-4 py-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">{value}</p>
              <p className="text-xs text-secondary">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-muted/40 shadow-card overflow-hidden">
        <div className="flex border-b border-muted/40 px-4">
          <Tab
            label="All Lots"
            active={activeTab === "all"}
            onClick={() => handleTabChange("all")}
            count={allLots.length}
          />
          <Tab
            label="Pending Approval"
            active={activeTab === "pending"}
            onClick={() => handleTabChange("pending")}
            count={pendingLots.length}
            dotColor="bg-yellow-400"
          />
        </div>

        <div className="p-4">
          {loading ? (
            <LoadingSpinner fullPage text="Loading lots..." />
          ) : activeTab === "all" ? (
            <DataTable
              columns={allLotsColumns}
              data={allLots}
              loading={false}
              searchKeys={["name", "address"]}
              searchPlaceholder="Search by name or address..."
              rowKey="lotId"
              defaultRowsPerPage={10}
              emptyMessage="No parking lots found"
            />
          ) : pendingLots.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              message="No lots awaiting approval"
              subtext="All submitted parking lots have been reviewed"
            />
          ) : (
            <DataTable
              columns={pendingColumns}
              data={pendingLots}
              loading={false}
              searchKeys={["name", "address"]}
              searchPlaceholder="Search pending lots..."
              rowKey="lotId"
              defaultRowsPerPage={10}
              emptyMessage="No pending lots"
            />
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirm.open}
        onClose={() =>
          setConfirm({ open: false, lotId: null, action: null, lotName: "" })
        }
        onConfirm={handleConfirm}
        loading={actionLoading}
        title={
          confirm.action === "approve"
            ? "Approve Parking Lot?"
            : "Deactivate Parking Lot?"
        }
        description={
          confirm.action === "approve"
            ? `Approve "${confirm.lotName}"? It will immediately go live and be visible to drivers.`
            : `Deactivate "${confirm.lotName}"? Active bookings will not be affected but no new bookings can be made.`
        }
        confirmLabel={
          confirm.action === "approve" ? "Yes, Approve" : "Yes, Deactivate"
        }
        confirmVariant={
          confirm.action === "approve" ? "default" : "destructive"
        }
      />

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-muted/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle size={20} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Reject Lot</h3>
                  <p className="text-xs text-secondary">"{rejectModal.lotName}"</p>
                </div>
              </div>
              <button
                onClick={() => setRejectModal({ open: false, lotId: null, lotName: "", reason: "" })}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} className="text-secondary" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for Rejection *
                </label>
                <textarea
                  value={rejectModal.reason}
                  onChange={(e) =>
                    setRejectModal({ ...rejectModal, reason: e.target.value })
                  }
                  placeholder="Explain why this lot is being rejected... (e.g., invalid location, insufficient documentation, etc.)"
                  className="w-full px-3 py-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows={4}
                />
                <p className="text-xs text-secondary mt-1">
                  {rejectModal.reason.length}/500 characters
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
                <AlertCircle size={16} className="text-yellow-700 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700">
                  The manager will receive an email with this rejection reason and can resubmit after addressing the issues.
                </p>
              </div>
            </div>

            <div className="flex gap-2 p-6 border-t border-muted/40 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setRejectModal({ open: false, lotId: null, lotName: "", reason: "" })}
                className="flex-1 px-4 py-2 border border-muted text-secondary rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50"
                disabled={actionLoading || !rejectModal.reason.trim()}
              >
                {actionLoading ? "Rejecting..." : "Reject Lot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}