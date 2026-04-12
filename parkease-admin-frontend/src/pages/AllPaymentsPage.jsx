import { useEffect, useState, useMemo } from "react";
import {
  CreditCard, RefreshCw, RotateCcw,
  FileDown, IndianRupee, Receipt,
  CheckCircle2, AlertCircle, Clock,
} from "lucide-react";
import {
  getAllPayments, refundPayment, downloadReceipt,
} from "../api/paymentApi";
import { formatCurrency, formatDateTime, truncateId } from "../utils/formatters";
import PageHeader from "../components/shared/PageHeader";
import DataTable from "../components/shared/DataTable";
import Badge from "../components/shared/Badge";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import { toast } from "../store/notificationStore";

const STATUS_OPTIONS = ["ALL", "PAID", "REFUNDED", "PENDING"];
const MODE_OPTIONS   = ["ALL", "CARD", "UPI", "WALLET", "CASH"];

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
        ${active
          ? "bg-primary text-white border-primary shadow-sm"
          : "bg-white text-secondary border-muted/60 hover:border-primary hover:text-primary"
        }
      `}
    >
      {label}
    </button>
  );
}

export default function AllPaymentsPage() {
  const [payments, setPayments]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modeFilter, setModeFilter]     = useState("ALL");
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const [confirm, setConfirm] = useState({
    open: false, paymentId: null, amount: null,
  });

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await getAllPayments();
      const data = res.data ?? [];
      setPayments(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  // Client-side filter
  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const statusOk = statusFilter === "ALL" || p.status === statusFilter;
      const modeOk   = modeFilter   === "ALL" || p.mode   === modeFilter;
      return statusOk && modeOk;
    });
  }, [payments, statusFilter, modeFilter]);

  // Revenue summary from PAID payments
  const summary = useMemo(() => {
    const paid     = payments.filter((p) => p.status === "PAID");
    const refunded = payments.filter((p) => p.status === "REFUNDED");
    return {
      total:     payments.length,
      totalPaid: paid.reduce((sum, p) => sum + (p.amount ?? 0), 0),
      paidCount: paid.length,
      refundCount: refunded.length,
      refundTotal: refunded.reduce((sum, p) => sum + (p.amount ?? 0), 0),
    };
  }, [payments]);

  // ─── Refund ───────────────────────────────────────────────────────────────
  const openRefundConfirm = (payment) => {
    setConfirm({ open: true, paymentId: payment.paymentId, amount: payment.amount });
  };

  const handleRefund = async () => {
    setActionLoading(true);
    try {
      const res = await refundPayment(confirm.paymentId);
      toast.success("Refund issued successfully");
      setPayments((prev) =>
        prev.map((p) => p.paymentId === confirm.paymentId ? res.data : p)
      );
    } catch (err) {
      const msg = err.response?.data?.message || "Refund failed";
      toast.error(msg);
    } finally {
      setActionLoading(false);
      setConfirm({ open: false, paymentId: null, amount: null });
    }
  };

  // ─── Receipt Download ─────────────────────────────────────────────────────
  const handleDownloadReceipt = async (paymentId) => {
    setDownloadingId(paymentId);
    try {
      const res = await downloadReceipt(paymentId);
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `receipt-${paymentId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Receipt downloaded");
    } catch {
      toast.error("Failed to download receipt");
    } finally {
      setDownloadingId(null);
    }
  };

  const columns = [
    {
      key: "paymentId",
      label: "Payment ID",
      render: (row) => (
        <span className="font-mono text-xs text-secondary">
          {truncateId(row.paymentId)}
        </span>
      ),
    },
    {
      key: "bookingId",
      label: "Booking ID",
      render: (row) => (
        <span className="font-mono text-xs text-secondary">
          {truncateId(row.bookingId)}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (row) => (
        <span className="font-bold text-gray-800">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: "mode",
      label: "Mode",
      render: (row) => (
        <Badge
          variant={row.mode?.toLowerCase()}
          label={row.mode}
        />
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge
          variant={
            row.status === "PAID"
              ? "paid"
              : row.status === "REFUNDED"
              ? "refunded"
              : "pending"
          }
          label={row.status}
          dot
        />
      ),
    },
    {
      key: "transactionId",
      label: "Transaction ID",
      render: (row) => (
        <span className="font-mono text-xs text-secondary max-w-[120px] truncate block">
          {row.transactionId ?? "—"}
        </span>
      ),
    },
    {
      key: "paidAt",
      label: "Paid At",
      render: (row) => (
        <span className="text-xs text-secondary">
          {formatDateTime(row.paidAt)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {/* Refund button — only for PAID */}
          {row.status === "PAID" && (
            <button
              onClick={() => openRefundConfirm(row)}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-md transition-colors"
            >
              <RotateCcw size={12} /> Refund
            </button>
          )}
          {/* Receipt download — all payments */}
          <button
            onClick={() => handleDownloadReceipt(row.paymentId)}
            disabled={downloadingId === row.paymentId}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-surface hover:bg-muted/30 border border-muted/60 px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadingId === row.paymentId ? (
              <>
                <span className="w-3 h-3 border border-secondary border-t-primary rounded-full animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <FileDown size={12} /> Receipt
              </>
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="All Payments"
        subtitle="View platform-wide payments, issue refunds and download receipts"
        actions={
          <button
            onClick={fetchPayments}
            className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary border border-muted/60 px-3 py-1.5 rounded-md transition-colors hover:border-primary"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        }
      />

      {/* Revenue summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Total Payments",
            value: summary.total,
            icon: Receipt,
            color: "text-primary",
            bg: "bg-primary/5",
            sub: "All statuses",
          },
          {
            label: "Total Collected",
            value: formatCurrency(summary.totalPaid),
            icon: IndianRupee,
            color: "text-green-600",
            bg: "bg-green-50",
            sub: `${summary.paidCount} transactions`,
          },
          {
            label: "Total Refunded",
            value: formatCurrency(summary.refundTotal),
            icon: RotateCcw,
            color: "text-blue-600",
            bg: "bg-blue-50",
            sub: `${summary.refundCount} refunds`,
          },
          {
            label: "Net Revenue",
            value: formatCurrency(summary.totalPaid - summary.refundTotal),
            icon: CreditCard,
            color: "text-accent",
            bg: "bg-accent/10",
            sub: "After refunds",
          },
        ].map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className="bg-white rounded-lg border border-muted/40 shadow-card px-4 py-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-secondary font-medium uppercase tracking-wide">
                  {label}
                </p>
                <p className="text-xl font-bold text-gray-800 mt-1">{value}</p>
                <p className="text-xs text-secondary mt-0.5">{sub}</p>
              </div>
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Status filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-secondary font-medium">Status:</span>
          {STATUS_OPTIONS.map((s) => (
            <FilterPill
              key={s}
              label={s === "ALL" ? "All" : s}
              active={statusFilter === s}
              onClick={() => setStatusFilter(s)}
            />
          ))}
        </div>

        <div className="h-4 w-px bg-muted/40 hidden sm:block" />

        {/* Mode filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-secondary font-medium">Mode:</span>
          {MODE_OPTIONS.map((m) => (
            <FilterPill
              key={m}
              label={m === "ALL" ? "All Modes" : m}
              active={modeFilter === m}
              onClick={() => setModeFilter(m)}
            />
          ))}
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        searchKeys={["paymentId", "bookingId", "transactionId"]}
        searchPlaceholder="Search by payment ID, booking ID or transaction ID..."
        rowKey="paymentId"
        defaultRowsPerPage={10}
        emptyMessage="No payments found"
      />

      {/* Refund Confirm Dialog */}
      <ConfirmDialog
        open={confirm.open}
        onClose={() =>
          setConfirm({ open: false, paymentId: null, amount: null })
        }
        onConfirm={handleRefund}
        loading={actionLoading}
        title="Issue Refund?"
        description={`Issue a refund of ${formatCurrency(confirm.amount)} for this payment? This action cannot be undone and the payment status will change to REFUNDED.`}
        confirmLabel="Yes, Issue Refund"
        confirmVariant="destructive"
      />
    </div>
  );
}