import { useEffect, useState } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  IndianRupee, TrendingUp, BarChart2,
  RefreshCw, Calendar,
} from "lucide-react";
import {
  getPlatformSummary,
  getPlatformRevenueTrend,
  getPlatformOccupancy,
} from "../api/analyticsApi";
import { getPlatformRevenue } from "../api/paymentApi";
import { formatCurrency, formatDate, formatPercent } from "../utils/formatters";
import PageHeader from "../components/shared/PageHeader";
import StatCard from "../components/shared/StatCard";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { toast } from "../store/notificationStore";

const CHART_COLORS = {
  primary:   "#3D52A0",
  accent:    "#7091E6",
  secondary: "#8697C4",
  muted:     "#ADBBDA",
  green:     "#10b981",
  red:       "#ef4444",
  yellow:    "#f59e0b",
  purple:    "#8b5cf6",
  teal:      "#14b8a6",
};

const PIE_COLORS = [
  CHART_COLORS.green,
  CHART_COLORS.accent,
  CHART_COLORS.yellow,
  CHART_COLORS.red,
];

const PERIODS = ["DAILY", "WEEKLY", "MONTHLY"];

// Shared chart tooltip
function ChartTooltip({ active, payload, label, valuePrefix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-muted/40 rounded-lg shadow-lg px-3 py-2.5 text-sm min-w-[140px]">
      <p className="text-secondary font-medium text-xs mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-700 text-xs">
            {entry.name}:{" "}
            <span className="font-semibold">
              {valuePrefix}
              {typeof entry.value === "number"
                ? entry.value.toLocaleString("en-IN")
                : entry.value}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

// Period selector
function PeriodSelector({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-surface rounded-lg p-1 border border-muted/40">
      {PERIODS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`
            px-3 py-1.5 rounded-md text-xs font-semibold transition-all
            ${value === p
              ? "bg-primary text-white shadow-sm"
              : "text-secondary hover:text-primary"
            }
          `}
        >
          {p.charAt(0) + p.slice(1).toLowerCase()}
        </button>
      ))}
    </div>
  );
}

// Chart wrapper card
function ChartCard({ title, subtitle, children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl border border-muted/40 shadow-card p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {subtitle && (
          <p className="text-xs text-secondary mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export default function PlatformAnalyticsPage() {
  const [period, setPeriod]           = useState("WEEKLY");
  const [summary, setSummary]         = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [occupancy, setOccupancy]     = useState([]);
  const [revenueDetails, setRevenueDetails] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  // Initial load
  useEffect(() => {
    fetchAll(period);
  }, []);

  // Re-fetch charts when period changes
  useEffect(() => {
    fetchCharts(period);
  }, [period]);

  const fetchAll = async (p) => {
    setLoading(true);
    try {
      const [summaryRes, revenueRes, occupancyRes, revenueDetailRes] =
        await Promise.all([
          getPlatformSummary(),
          getPlatformRevenueTrend(p),
          getPlatformOccupancy(p),
          getPlatformRevenue(p),
        ]);
      setSummary(summaryRes.data);
      const revenueData = revenueRes.data ?? [];
      const occupancyData = occupancyRes.data ?? [];
      setRevenueTrend(Array.isArray(revenueData) ? revenueData : []);
      setOccupancy(Array.isArray(occupancyData) ? occupancyData : []);
      setRevenueDetails(revenueDetailRes.data);
    } catch {
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCharts = async (p) => {
    setChartLoading(true);
    try {
      const [revenueRes, occupancyRes, revenueDetailRes] = await Promise.all([
        getPlatformRevenueTrend(p),
        getPlatformOccupancy(p),
        getPlatformRevenue(p),
      ]);
      const revenueData = revenueRes.data ?? [];
      const occupancyData = occupancyRes.data ?? [];
      setRevenueTrend(Array.isArray(revenueData) ? revenueData : []);
      setOccupancy(Array.isArray(occupancyData) ? occupancyData : []);
      setRevenueDetails(revenueDetailRes.data);
    } catch {
      toast.error("Failed to refresh chart data");
    } finally {
      setChartLoading(false);
    }
  };

  // Pie chart data from summary
  const bookingPieData = summary
    ? [
        { name: "Completed", value: summary.completedBookings ?? 0 },
        { name: "Active",    value: summary.activeBookings    ?? 0 },
        { name: "Cancelled", value: summary.cancelledBookings ?? 0 },
        {
          name: "Reserved",
          value: Math.max(
            0,
            (summary.totalBookings ?? 0) -
              (summary.completedBookings ?? 0) -
              (summary.activeBookings ?? 0) -
              (summary.cancelledBookings ?? 0)
          ),
        },
      ].filter((d) => d.value > 0)
    : [];

  // Revenue by lot bar chart
  const revByLot = (revenueDetails?.revenueByLot ?? []).slice(0, 8);

  if (loading) return <LoadingSpinner fullPage text="Loading analytics..." />;

  return (
    <div className="page-container">
      <PageHeader
        title="Platform Analytics"
        subtitle="Revenue, occupancy and booking metrics across the platform"
        actions={
          <div className="flex items-center gap-2">
            <PeriodSelector value={period} onChange={setPeriod} />
            <button
              onClick={() => fetchAll(period)}
              className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary border border-muted/60 px-3 py-1.5 rounded-md transition-colors hover:border-primary"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        }
      />

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(revenueDetails?.totalRevenue)}
          icon={IndianRupee}
          iconColor="bg-primary/10"
          iconTextColor="text-primary"
        />
        <StatCard
          title="Net Revenue"
          value={formatCurrency(revenueDetails?.netRevenue)}
          icon={TrendingUp}
          iconColor="bg-green-50"
          iconTextColor="text-green-600"
        />
        <StatCard
          title="Total Transactions"
          value={revenueDetails?.totalTransactions?.toLocaleString("en-IN") ?? "—"}
          icon={BarChart2}
          iconColor="bg-accent/10"
          iconTextColor="text-accent"
        />
        <StatCard
          title="Total Refunds"
          value={formatCurrency(revenueDetails?.totalRefunds)}
          icon={IndianRupee}
          iconColor="bg-red-50"
          iconTextColor="text-red-500"
        />
      </div>

      {/* Charts Row 1 — Revenue + Occupancy */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard
          title="Revenue Trend"
          subtitle={`${period.charAt(0) + period.slice(1).toLowerCase()} revenue in INR`}
        >
          {chartLoading ? (
            <div className="h-[220px] flex items-center justify-center">
              <LoadingSpinner size="sm" text="" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueTrend}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor={CHART_COLORS.primary} />
                    <stop offset="100%" stopColor={CHART_COLORS.accent} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ADBBDA30" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#8697C4" }}
                  tickFormatter={(d) => formatDate(d).slice(0, 6)}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#8697C4" }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ChartTooltip valuePrefix="₹" />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="url(#revGrad)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: CHART_COLORS.accent, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: CHART_COLORS.primary }}
                />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  name="Bookings"
                  stroke={CHART_COLORS.muted}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Occupancy Rate Trend"
          subtitle="Average occupancy % across all active lots"
        >
          {chartLoading ? (
            <div className="h-[220px] flex items-center justify-center">
              <LoadingSpinner size="sm" text="" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={occupancy}>
                <defs>
                  <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={CHART_COLORS.primary} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ADBBDA30" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#8697C4" }}
                  tickFormatter={(d) => formatDate(d).slice(0, 6)}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#8697C4" }}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 100]}
                />
                <Tooltip content={<ChartTooltip valuePrefix="" />} />
                <Area
                  type="monotone"
                  dataKey="occupancyRate"
                  name="Occupancy %"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2.5}
                  fill="url(#occGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="totalBookings"
                  name="Bookings"
                  stroke={CHART_COLORS.secondary}
                  strokeWidth={1.5}
                  fill="none"
                  strokeDasharray="4 4"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Charts Row 2 — Revenue by Lot + Booking Pie */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Revenue by lot — 2/3 width */}
        <ChartCard
          title="Revenue by Lot"
          subtitle="Top 8 lots by total revenue"
          className="xl:col-span-2"
        >
          {chartLoading ? (
            <div className="h-[240px] flex items-center justify-center">
              <LoadingSpinner size="sm" text="" />
            </div>
          ) : revByLot.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center">
              <p className="text-sm text-secondary">No lot revenue data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revByLot} barSize={32} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ADBBDA30" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "#8697C4" }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="lotName"
                  width={90}
                  tick={{ fontSize: 10, fill: "#8697C4" }}
                  tickFormatter={(v) =>
                    v?.length > 12 ? v.slice(0, 12) + "…" : v
                  }
                />
                <Tooltip content={<ChartTooltip valuePrefix="₹" />} />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill={CHART_COLORS.accent}
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Booking status pie — 1/3 width */}
        <ChartCard
          title="Booking Status"
          subtitle="Distribution by status"
        >
          {bookingPieData.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center">
              <p className="text-sm text-secondary">No booking data</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={bookingPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {bookingPieData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val} bookings`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {bookingPieData.map((entry, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-[11px] text-secondary truncate">
                      {entry.name}
                      <span className="font-semibold text-gray-700 ml-1">
                        {entry.value}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>
      </div>
    </div>
  );
}