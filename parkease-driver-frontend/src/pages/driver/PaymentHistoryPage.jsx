import { useEffect, useState } from 'react';
import {
  CreditCard, Download, Search, Filter,
  CheckCircle2, RefreshCw, Wallet,
  ArrowUpRight, FileText, TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { getMyPayments, downloadReceipt } from '../../api/paymentApi';
import { getBookingById }  from '../../api/bookingApi';
import { getLotById }      from '../../api/lotApi';
import { formatDateTime, formatDate } from '../../utils/formatDateTime';
import { formatCurrency }  from '../../utils/formatCurrency';
import LoadingSpinner      from '../../components/common/LoadingSpinner';
import ErrorMessage        from '../../components/common/ErrorMessage';
import { useNavigate }     from 'react-router-dom';

// ── Payment mode icon + colors ────────────────────────────────────────────────
const MODE_CONFIG = {
  UPI:    { bg: 'bg-purple-100', text: 'text-purple-700', label: 'UPI'    },
  CARD:   { bg: 'bg-[#EDE8F5]',  text: 'text-[#3D52A0]',  label: 'Card'  },
  WALLET: { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Wallet' },
  CASH:   { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Cash'   },
};

// ── Custom Recharts tooltip ───────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-[#ADBBDA] rounded-xl 
                      shadow-card px-4 py-3">
        <p className="text-xs text-[#8697C4] font-medium mb-1">{label}</p>
        <p className="text-base font-black text-[#3D52A0]">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function PaymentHistoryPage() {
  const navigate = useNavigate();

  const [payments,     setPayments]     = useState([]);
  const [lotNames,     setLotNames]     = useState({});
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [modeFilter,   setModeFilter]   = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [downloading,  setDownloading]  = useState(null);

  // ── Fetch payments ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const res = await getMyPayments();
        const pays = res.data;
        setPayments(pays);

        // Resolve lot names via booking → lot chain
        pays.forEach(async (p) => {
          if (!p.bookingId) return;
          try {
            const bkRes  = await getBookingById(p.bookingId);
            const lotId  = bkRes.data.lotId;
            if (!lotId) return;
            const lotRes = await getLotById(lotId);
            setLotNames((prev) => ({
              ...prev,
              [p.paymentId]: lotRes.data.name,
            }));
          } catch { /* silent */ }
        });
      } catch {
        setError('Failed to load payment history. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Download receipt ──────────────────────────────────────────────────────
  const handleDownload = async (payment) => {
    setDownloading(payment.paymentId);
    try {
      const res  = await downloadReceipt(payment.paymentId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `parkease-receipt-${
        (payment.paymentId ?? 'UNKNOWN').slice(-8).toUpperCase()
      }.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Receipt downloaded! 📄');
    } catch {
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const totalSpent  = payments
    .filter((p) => p.status === 'PAID')
    .reduce((s, p) => s + p.amount, 0);

  const totalRefund = payments
    .filter((p) => p.status === 'REFUNDED')
    .reduce((s, p) => s + p.amount, 0);

  // Monthly spending chart data
  const chartData = (() => {
    const map = {};
    payments
      .filter((p) => p.status === 'PAID')
      .forEach((p) => {
        const key = new Date(p.paidAt)
          .toLocaleString('en-IN', { month: 'short', year: '2-digit' });
        map[key] = (map[key] ?? 0) + p.amount;
      });
    return Object.entries(map)
      .slice(-6)
      .map(([month, amount]) => ({ month, amount: +amount.toFixed(2) }));
  })();

  // ── Filtered payments ─────────────────────────────────────────────────────
  const filtered = payments.filter((p) => {
    const modeOk   = modeFilter   === 'ALL' || p.mode   === modeFilter;
    const statusOk = statusFilter === 'ALL' || p.status === statusFilter;
    const searchOk = !searchTerm.trim() ||
      (lotNames[p.paymentId] ?? '')
        .toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.transactionId ?? '')
        .toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.mode ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    return modeOk && statusOk && searchOk;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (loading) return <LoadingSpinner text="Loading payment history..." />;
  if (error)   return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="page-title">Payment History</h1>
        <p className="page-subtitle">
          All your parking payments and receipts
        </p>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            icon: CreditCard,
            label: 'Total Payments',
            value: payments.length,
            bg: 'bg-[#EDE8F5]',
            color: 'text-[#3D52A0]',
          },
          {
            icon: Wallet,
            label: 'Total Spent',
            value: formatCurrency(totalSpent),
            bg: 'bg-[#EDE8F5]',
            color: 'text-[#3D52A0]',
          },
          {
            icon: CheckCircle2,
            label: 'Paid',
            value: payments.filter((p) => p.status === 'PAID').length,
            bg: 'bg-green-50',
            color: 'text-green-600',
          },
          {
            icon: RefreshCw,
            label: 'Refunded',
            value: formatCurrency(totalRefund),
            bg: 'bg-amber-50',
            color: 'text-amber-600',
          },
        ].map(({ icon: Icon, label, value, bg, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`w-11 h-11 ${bg} rounded-xl flex items-center 
                            justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[#8697C4] text-xs font-medium truncate">
                {label}
              </p>
              <p className={`font-black text-lg leading-tight ${color}`}>
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Spending Chart ─────────────────────────────────────────────── */}
      {chartData.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-[#3D52A0] text-base">
                Monthly Spending Trend
              </h2>
              <p className="text-xs text-[#8697C4] mt-0.5">
                Last {chartData.length} months
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#EDE8F5] 
                            rounded-full px-3 py-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#3D52A0]" />
              <span className="text-xs font-bold text-[#3D52A0]">
                {formatCurrency(totalSpent)} total
              </span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3D52A0" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3D52A0" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#EDE8F5"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#8697C4', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#8697C4' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#3D52A0"
                strokeWidth={2.5}
                fill="url(#spendGrad)"
                dot={{ r: 4, fill: '#3D52A0', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#7091E6' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Filters Row ────────────────────────────────────────────────── */}
      <div className="card !p-4">
        <div className="flex flex-col sm:flex-row gap-3">

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 
                               w-4 h-4 text-[#8697C4]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by lot name or transaction ID..."
              className="form-input pl-10 py-2.5 text-sm"
            />
          </div>

          {/* Mode filter */}
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="form-input text-sm py-2.5 w-auto"
          >
            <option value="ALL">All Modes</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
            <option value="WALLET">Wallet</option>
            <option value="CASH">Cash</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input text-sm py-2.5 w-auto"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>

        {/* Results summary */}
        <div className="flex items-center justify-between mt-3 pt-3 
                        border-t border-[#EDE8F5]">
          <span className="text-xs text-[#8697C4] font-medium">
            Showing {filtered.length} of {payments.length} payments
          </span>
          {(searchTerm || modeFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setModeFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="text-xs text-[#7091E6] font-semibold 
                         hover:text-[#3D52A0] transition-colors"
            >
              Clear filters ×
            </button>
          )}
        </div>
      </div>

      {/* ── Payment List ───────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center 
                        py-16 text-center border-dashed border-2 
                        border-[#ADBBDA]">
          <div className="w-16 h-16 bg-[#EDE8F5] rounded-2xl 
                          flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-[#ADBBDA]" />
          </div>
          <h3 className="font-bold text-[#3D52A0] text-base mb-2">
            No payments found
          </h3>
          <p className="text-[#8697C4] text-sm max-w-xs">
            {payments.length === 0
              ? 'Complete a parking session to see your payment history.'
              : 'No payments match your current filters.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((payment) => (
            <PaymentCard
              key={payment.paymentId}
              payment={payment}
              lotName={lotNames[payment.paymentId]}
              downloading={downloading === payment.paymentId}
              onDownload={() => handleDownload(payment)}
              onViewBooking={() =>
                navigate(`/driver/bookings/${payment.bookingId}`)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Payment Card ──────────────────────────────────────────────────────────────
function PaymentCard({ payment, lotName, downloading, onDownload, onViewBooking }) {
  const mode   = MODE_CONFIG[payment.mode] ?? 
                 { bg: 'bg-gray-100', text: 'text-gray-600', label: payment.mode };
  const isPaid = payment.status === 'PAID';

  return (
    <div className="card hover:shadow-card-hover transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center 
                      sm:justify-between gap-4">

        {/* Left: Mode icon + main info */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className={`w-12 h-12 ${mode.bg} rounded-2xl flex items-center 
                          justify-center flex-shrink-0`}>
            <span className={`text-base font-black ${mode.text}`}>
              {(mode.label ?? 'P').slice(0, 1)}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            {/* Lot name + status */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-[#3D52A0] text-sm truncate">
                {lotName ?? `Payment #${
                  (payment.paymentId ?? 'UNKNOWN').slice(-8).toUpperCase()
                }`}
              </h3>
              <span className={`text-xs font-semibold px-2.5 py-0.5 
                               rounded-full border
                               ${isPaid
                                 ? 'bg-green-50 text-green-700 border-green-200'
                                 : 'bg-amber-50 text-amber-700 border-amber-200'
                               }`}>
                {isPaid ? '✓ Paid' : '↩ Refunded'}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 
                               rounded-full ${mode.bg} ${mode.text}`}>
                {mode.label}
              </span>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-[#8697C4]">
                {formatDateTime(payment.paidAt ?? payment.createdAt)}
              </span>
              {payment.transactionId && (
                <span className="text-xs text-[#ADBBDA] font-mono">
                  #{(payment.transactionId ?? '').slice(-10).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Amount + actions */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Amount */}
          <div className="text-right">
            <p className={`text-xl font-black
                          ${isPaid ? 'text-[#3D52A0]' : 'text-amber-600'}`}>
              {isPaid ? '' : '-'}{formatCurrency(payment.amount)}
            </p>
            {payment.refundedAt && (
              <p className="text-xs text-[#8697C4] mt-0.5">
                Refunded {formatDate(payment.refundedAt)}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {isPaid && (
              <button
                onClick={onDownload}
                disabled={downloading}
                className="flex items-center gap-1.5 text-xs font-semibold 
                           text-[#3D52A0] bg-[#EDE8F5] hover:bg-[#ADBBDA]/40 
                           px-3 py-2 rounded-xl transition-all duration-200
                           disabled:opacity-50"
              >
                {downloading ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full 
                                  border-2 border-[#3D52A0]/30 
                                  border-t-[#3D52A0]" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Receipt
              </button>
            )}
            <button
              onClick={onViewBooking}
              className="flex items-center gap-1.5 text-xs font-semibold 
                         text-[#7091E6] hover:text-[#3D52A0] 
                         px-3 py-2 rounded-xl hover:bg-[#EDE8F5] 
                         transition-all duration-200"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Booking
            </button>
          </div>
        </div>
      </div>

      {/* Description row */}
      {payment.description && (
        <div className="mt-3 pt-3 border-t border-[#EDE8F5]">
          <p className="text-xs text-[#8697C4]">
            <span className="font-semibold text-[#ADBBDA]">Note: </span>
            {payment.description}
          </p>
        </div>
      )}
    </div>
  );
}