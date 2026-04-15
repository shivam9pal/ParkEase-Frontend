import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  BarChart3, TrendingUp, Calendar, RefreshCw,
  Download, IndianRupee, Receipt, Clock,
} from 'lucide-react';
import { subDays, startOfMonth, endOfMonth,
         startOfWeek, endOfWeek, format } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Cell, PieChart, Pie,
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import { getLotById }       from '../../api/lotApi';
import { getPaymentsByLot } from '../../api/paymentApi';
import {
  getLotRevenue, getDailyRevenue,
  getSpotTypeUtilisation, getAvgDuration, getPeakHours,
} from '../../api/analyticsApi';
import LoadingSpinner    from '../../components/common/LoadingSpinner';
import ErrorMessage      from '../../components/common/ErrorMessage';
import PageHeader        from '../../components/common/PageHeader';
import StatCard          from '../../components/common/StatCard';
import StatusBadge       from '../../components/common/StatusBadge';
import EmptyState        from '../../components/common/EmptyState';
import { formatDate, formatDateOnly } from '../../utils/formatDateTime';
import { formatCurrency, formatCurrencyCompact } from '../../utils/formatCurrency';
import { formatDuration }  from '../../utils/formatDuration';

// ── Date Range Presets ────────────────────────────────────────────────
const buildPresets = () => {
  const now   = new Date();
  const toISO = (d) => format(d, "yyyy-MM-dd'T'HH:mm:ss");
  return [
    {
      key  : 'today',
      label: 'Today',
      from : toISO(new Date(now.setHours(0,0,0,0))),
      to   : toISO(new Date(new Date().setHours(23,59,59,999))),
    },
    {
      key  : 'week',
      label: 'This Week',
      from : toISO(startOfWeek(now, { weekStartsOn: 1 })),
      to   : toISO(endOfWeek(now,   { weekStartsOn: 1 })),
    },
    {
      key  : 'month',
      label: 'This Month',
      from : toISO(startOfMonth(now)),
      to   : toISO(endOfMonth(now)),
    },
    {
      key  : 'last7',
      label: 'Last 7 Days',
      from : toISO(subDays(now, 6)),
      to   : toISO(new Date()),
    },
    {
      key  : 'last30',
      label: 'Last 30 Days',
      from : toISO(subDays(now, 29)),
      to   : toISO(new Date()),
    },
  ];
};

// ── Spot-type colors for pie ──────────────────────────────────────────
const SPOT_TYPE_COLORS = {
  STANDARD : '#3D52A0',
  COMPACT  : '#7091E6',
  LARGE    : '#8697C4',
  MOTORBIKE: '#ADBBDA',
  EV       : '#f59e0b',
};

// ── Payment mode colors ───────────────────────────────────────────────
const MODE_COLORS = {
  UPI   : '#22c55e',
  CARD  : '#3D52A0',
  WALLET: '#f59e0b',
  CASH  : '#8697C4',
};

// ── Custom Tooltips ───────────────────────────────────────────────────
const RevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-accent/40 rounded-xl px-4 py-3
                    shadow-card text-xs">
      <p className="font-semibold text-primary mb-1">{label}</p>
      <p className="text-gray-700">
        Revenue:{' '}
        <span className="font-bold text-green-600">
          {formatCurrency(payload[0]?.value ?? 0)}
        </span>
      </p>
      {payload[1] && (
        <p className="text-gray-600 mt-0.5">
          Transactions:{' '}
          <span className="font-bold text-secondary">
            {payload[1]?.value}
          </span>
        </p>
      )}
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-accent/40 rounded-xl px-3 py-2
                    shadow-card text-xs">
      <p className="font-semibold text-primary">{payload[0].name}</p>
      <p className="text-gray-700 mt-0.5">
        {payload[0].value?.toFixed(1)}%
      </p>
    </div>
  );
};

export default function RevenuePage() {
  const { lotId }  = useParams();
  const PRESETS    = buildPresets();

  // ── State ─────────────────────────────────────────────────────────
  const [lot, setLot]               = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [dailyData, setDailyData]   = useState([]);
  const [payments, setPayments]     = useState([]);
  const [spotUtil, setSpotUtil]     = useState([]);
  const [avgDuration, setAvgDuration] = useState(null);
  const [peakHours, setPeakHours]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [activePreset, setActivePreset] = useState('last7');
  const [dateRange, setDateRange]   = useState({
    from: PRESETS.find((p) => p.key === 'last7').from,
    to  : PRESETS.find((p) => p.key === 'last7').to,
  });
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo]     = useState('');
  const [showCustom, setShowCustom] = useState(false);

  // ── Fetch All Revenue Data ─────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        lotRes,
        revenueRes,
        dailyRes,
        paymentsRes,
        spotUtilRes,
        avgDurRes,
        peakRes,
      ] = await Promise.all([
        getLotById(lotId),
        getLotRevenue(lotId, dateRange.from, dateRange.to),
        getDailyRevenue(lotId, dateRange.from, dateRange.to),
        getPaymentsByLot(lotId),
        getSpotTypeUtilisation(lotId),
        getAvgDuration(lotId),
        getPeakHours(lotId, 5),
      ]);

      setLot(lotRes.data);
      setRevenueData(revenueRes.data);

      // Shape daily data for chart
      const shaped = (dailyRes.data ?? []).map((d) => ({
        date    : formatDateOnly(d.date + 'T00:00:00'),
        revenue : parseFloat((d.revenue ?? 0).toFixed(2)),
        txns    : d.transactionCount ?? 0,
      }));
      setDailyData(shaped);

      // Sort payments newest first, take last 20 for table
      const sorted = (paymentsRes.data ?? [])
        .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
      setPayments(sorted);

      // Spot utilisation for pie
      setSpotUtil(spotUtilRes.data ?? []);
      setAvgDuration(avgDurRes.data);
      setPeakHours(peakRes.data ?? []);

    } catch {
      setError('Failed to load revenue data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [lotId, dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Preset click handler ───────────────────────────────────────────
  const handlePreset = (preset) => {
    setActivePreset(preset.key);
    setShowCustom(false);
    setDateRange({ from: preset.from, to: preset.to });
  };

  // ── Custom date apply ──────────────────────────────────────────────
  const handleCustomApply = () => {
    if (!customFrom || !customTo) {
      toast.error('Please select both start and end dates.');
      return;
    }
    setActivePreset('custom');
    setDateRange({
      from: `${customFrom}T00:00:00`,
      to  : `${customTo}T23:59:59`,
    });
    setShowCustom(false);
  };

  // ── Compute payment mode breakdown ────────────────────────────────
  const modeBreakdown = payments.reduce((acc, p) => {
    acc[p.mode] = (acc[p.mode] ?? 0) + p.amount;
    return acc;
  }, {});

  const modeData = Object.entries(modeBreakdown).map(([mode, amount]) => ({
    name  : mode,
    value : parseFloat(amount.toFixed(2)),
    color : MODE_COLORS[mode] ?? '#ADBBDA',
  }));

  if (loading) return <LoadingSpinner fullPage text="Loading revenue data..." />;
  if (error)   return <ErrorMessage message={error} onRetry={fetchData} fullPage />;

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <PageHeader
        title="Revenue Analytics"
        subtitle={`${lot?.name ?? ''} — Financial overview`}
        showBack
        backTo={`/manager/lots/${lotId}`}
        actions={
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted
                       border border-accent rounded-lg hover:text-primary
                       hover:border-primary transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        }
      />

      {/* ── Date Range Selector ── */}
      <div className="card py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted mr-1">
            <Calendar size={13} className="inline mr-1" />
            Date Range:
          </span>

          {/* Preset buttons */}
          {PRESETS.map((preset) => (
            <button
              key={preset.key}
              onClick={() => handlePreset(preset)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg
                          border transition-colors whitespace-nowrap
                          ${activePreset === preset.key
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'text-muted border-accent/50 hover:border-primary hover:text-primary'}`}
            >
              {preset.label}
            </button>
          ))}

          {/* Custom Range */}
          <button
            onClick={() => setShowCustom((p) => !p)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border
                        transition-colors
                        ${activePreset === 'custom'
                          ? 'bg-primary text-white border-primary'
                          : 'text-muted border-accent/50 hover:border-primary hover:text-primary'}`}
          >
            📅 Custom
          </button>
        </div>

        {/* Custom date picker */}
        {showCustom && (
          <div className="flex flex-wrap items-end gap-3 mt-4 pt-4
                          border-t border-accent/30">
            <div>
              <label className="label text-xs">From</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="input-field py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="label text-xs">To</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="input-field py-1.5 text-sm"
              />
            </div>
            <button
              onClick={handleCustomApply}
              className="btn-primary px-4 py-2 text-sm"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* ── Summary Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrencyCompact(revenueData?.totalRevenue ?? 0)}
          color="green"
          icon={<IndianRupee size={20} />}
          subtitle={formatCurrency(revenueData?.totalRevenue ?? 0)}
        />
        <StatCard
          title="Transactions"
          value={revenueData?.transactionCount ?? 0}
          color="primary"
          icon={<Receipt size={20} />}
          subtitle="Completed payments"
        />
        <StatCard
          title="Avg per Transaction"
          value={
            revenueData?.transactionCount
              ? formatCurrency(
                  (revenueData.totalRevenue ?? 0) /
                  revenueData.transactionCount
                )
              : '—'
          }
          color="blue"
          icon={<TrendingUp size={20} />}
          subtitle="Revenue per booking"
        />
        <StatCard
          title="Avg Parking Duration"
          value={avgDuration?.averageDurationFormatted ?? '—'}
          color="purple"
          icon={<Clock size={20} />}
          subtitle="Per session average"
        />
      </div>

      {/* ── Daily Revenue Chart ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title mb-0">Daily Revenue</h2>
          <span className="text-xs text-muted">
            {revenueData?.currency ?? 'INR'} •{' '}
            {dailyData.length} days shown
          </span>
        </div>

        {dailyData.length === 0 ? (
          <EmptyState
            title="No revenue data"
            description="No completed payments found for this date range."
            icon={<BarChart3 size={28} className="text-accent" />}
          />
        ) : (
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dailyData}
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3D52A0" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3D52A0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ADBBDA"
                  opacity={0.4}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#8697C4' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#8697C4' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3D52A0"
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                  dot={{ fill: '#3D52A0', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#7091E6' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Charts Row: Spot Utilisation + Payment Mode ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Spot Type Utilisation — Pie */}
        <div className="card">
          <h2 className="section-title">Spot Type Utilisation</h2>
          {spotUtil.length === 0 ? (
            <EmptyState
              title="No utilisation data yet"
              description="Data will appear once bookings are made."
            />
          ) : (
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spotUtil.map((s) => ({
                      name : s.spotType,
                      value: parseFloat((s.percentage ?? 0).toFixed(1)),
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {spotUtil.map((s) => (
                      <Cell
                        key={s.spotType}
                        fill={SPOT_TYPE_COLORS[s.spotType] ?? '#ADBBDA'}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => (
                      <span className="text-xs text-gray-600">{v}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Spot type table */}
          {spotUtil.length > 0 && (
            <div className="mt-3 divide-y divide-accent/10">
              {spotUtil.map((s) => (
                <div key={s.spotType}
                     className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: SPOT_TYPE_COLORS[s.spotType] ?? '#ADBBDA' }}
                    />
                    <span className="text-sm text-gray-700">{s.spotType}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-primary">
                      {s.percentage?.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted ml-1.5">
                      ({s.bookingCount} bookings)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Mode Breakdown — Pie */}
        <div className="card">
          <h2 className="section-title">Payment Mode Breakdown</h2>
          {modeData.length === 0 ? (
            <EmptyState
              title="No payment data yet"
              description="Payment modes will appear after transactions."
            />
          ) : (
            <>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={modeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {modeData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => formatCurrency(v)}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(v) => (
                        <span className="text-xs text-gray-600">{v}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Mode table */}
              <div className="mt-2 divide-y divide-accent/10">
                {modeData.map((m) => (
                  <div key={m.name}
                       className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: m.color }}
                      />
                      <span className="text-sm text-gray-700">{m.name}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {formatCurrency(m.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Peak Hours Chart ── */}
      {peakHours.length > 0 && (
        <div className="card">
          <h2 className="section-title">Top Peak Hours</h2>
          <p className="text-xs text-muted mb-4">
            Busiest hours based on average occupancy (last 30 days)
          </p>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={peakHours.map((p) => ({
                  label: p.label ?? `${p.hour}:00`,
                  rate : parseFloat((p.averageOccupancyRate ?? 0).toFixed(1)),
                }))}
                margin={{ top: 5, right: 10, left: -15, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ADBBDA"
                  opacity={0.4}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#8697C4' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#3D52A0', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  width={65}
                />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Avg Occupancy']}
                  contentStyle={{
                    fontSize      : '12px',
                    borderRadius  : '0.75rem',
                    border        : '1px solid #ADBBDA',
                    boxShadow     : '0 2px 12px rgba(61,82,160,0.1)',
                  }}
                />
                <Bar dataKey="rate" radius={[0, 6, 6, 0]}>
                  {peakHours.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={i === 0 ? '#3D52A0' : i === 1 ? '#7091E6' : '#8697C4'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Recent Payments Table ── */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-accent/30 flex items-center
                        justify-between">
          <h2 className="section-title mb-0">
            Recent Payments
            <span className="ml-2 text-xs text-muted font-normal">
              (latest {Math.min(payments.length, 20)})
            </span>
          </h2>
        </div>

        {payments.length === 0 ? (
          <EmptyState
            title="No payments yet"
            description="Completed transactions will appear here."
            icon={<Receipt size={28} className="text-accent" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background/60 border-b border-accent/20">
                  {[
                    'Transaction ID', 'Amount', 'Mode',
                    'Status', 'Paid At', 'Booking ID',
                  ].map((h) => (
                    <th key={h}
                        className="text-left px-5 py-3 text-xs font-semibold
                                   text-muted uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-accent/10">
                {payments.slice(0, 20).map((payment) => (
                  <tr key={payment.paymentId}
                      className="hover:bg-background/40 transition-colors">

                    {/* Transaction ID */}
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-gray-700
                                       bg-background px-2 py-0.5 rounded">
                        {payment.transactionId ?? '—'}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3">
                      <span className={`font-bold text-base
                                        ${payment.status === 'REFUNDED'
                                          ? 'text-orange-600 line-through'
                                          : 'text-green-700'}`}>
                        {formatCurrency(payment.amount)}
                      </span>
                    </td>

                    {/* Mode */}
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5
                                   rounded-full text-xs font-semibold border"
                        style={{
                          background: `${MODE_COLORS[payment.mode] ?? '#ADBBDA'}18`,
                          color      : MODE_COLORS[payment.mode] ?? '#8697C4',
                          borderColor: `${MODE_COLORS[payment.mode] ?? '#ADBBDA'}40`,
                        }}
                      >
                        {payment.mode}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3">
                      <StatusBadge status={payment.status} />
                    </td>

                    {/* Paid At */}
                    <td className="px-5 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {payment.paidAt ? formatDate(payment.paidAt) : '—'}
                    </td>

                    {/* Booking ID */}
                    <td className="px-5 py-3">
                      <span className="font-mono text-[11px] text-muted">
                        {payment.bookingId?.slice(0, 8)}...
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {payments.length > 0 && (
          <div className="px-5 py-3 border-t border-accent/20 bg-background/40">
            <p className="text-xs text-muted">
              Showing latest {Math.min(payments.length, 20)} of{' '}
              {payments.length} payments
            </p>
          </div>
        )}
      </div>
    </div>
  );
}