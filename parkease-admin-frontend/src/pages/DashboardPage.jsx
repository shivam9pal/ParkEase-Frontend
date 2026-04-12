import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  IndianRupee, Users, ParkingSquare, CalendarCheck,
  TrendingUp, AlertTriangle, Activity, XCircle,
  CheckCircle2, Clock, ArrowRight,
} from "lucide-react";
import { getPlatformSummary, getPlatformRevenueTrend, getPlatformOccupancy } from "../api/analyticsApi";
import { formatCurrency, formatDate, formatPercent } from "../utils/formatters";
import StatCard from "../components/shared/StatCard";
import PageHeader from "../components/shared/PageHeader";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { toast } from "../store/notificationStore";

// Chart color palette — uses our theme + complementary
const COLORS = {
  primary:   "#3D52A0",
  accent:    "#7091E6",
  secondary: "#8697C4",
  green:     "#10b981",
  red:       "#ef4444",
  yellow:    "#f59e0b",
  purple:    "#8b5cf6",
};

// Custom tooltip for Recharts
function ChartTooltip({ active, payload, label, prefix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-muted/40 rounded-lg shadow-card px-3 py-2 text-sm">
      <p className="text-secondary font-medium mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-semibold">
          {entry.name}: {prefix}{typeof entry.value === "number"
            ? entry.value.toLocaleString("en-IN")
            : entry.value}
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary]         = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [occupancy, setOccupancy]     = useState([]);
  const [loading, setLoading]         = useState(true);
  
  // Revenue date range (default to last 7 days)
  const getDefaultFromDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  };
  const getDefaultToDate = () => new Date().toISOString().split('T')[0];
  
  const [revenueFromDate, setRevenueFromDate] = useState(getDefaultFromDate());
  const [revenueToDate, setRevenueToDate] = useState(getDefaultToDate());
  
  // Occupancy period
  const [occupancyPeriod, setOccupancyPeriod] = useState("WEEKLY");

  useEffect(() => {
    fetchAll();
  }, [occupancyPeriod]);

  // Transform backend revenue response (single object with totalRevenue) - NO dummy data
  const transformRevenueData = (revenueData) => {
    if (Array.isArray(revenueData)) return revenueData;
    
    // If it's a single object with totalRevenue from the API
    if (revenueData && typeof revenueData.totalRevenue === 'number') {
      const revAmount = revenueData.totalRevenue || 0;
      
      console.log(`💰 Revenue total: ₹${revAmount}`);
      console.log(`📊 API Response:`, { totalRevenue: revenueData.totalRevenue, currency: revenueData.currency, transactionCount: revenueData.transactionCount, from: revenueFromDate, to: revenueToDate });
      
      // Return single data point with total revenue for the date range
      return [{
        date: revenueFromDate,
        revenue: revAmount,
      }];
    }
    
    console.warn("⚠️ Revenue data format unrecognized:", revenueData);
    return [];
  };

  // Transform hourly occupancy breakdown from API into chart format
  const transformOccupancyData = (occupancyData) => {
    if (!occupancyData) return [];
    
    // Use hourly breakdown from API response
    if (occupancyData && Array.isArray(occupancyData.hourlyBreakdown)) {
      console.log(`📊 Occupancy data (Hourly): ${occupancyData.hourlyBreakdown.length} hours available`);
      
      return occupancyData.hourlyBreakdown.map((item) => {
        const hour = String(item.hour).padStart(2, '0');
        return {
          hour: `${hour}:00`,
          occupancyRate: Math.round(item.averageOccupancyRate * 10) / 10,
        };
      });
    }
    
    console.warn("⚠️ Occupancy data format unrecognized:", occupancyData);
    return [];
  };

  // Enrich summary with occupancy data from occupancy API
  const enrichSummary = (summaryData, occupancyData) => {
    if (!summaryData) return null;
    
    return {
      ...summaryData,
      // Map backend fields to frontend expectations
      totalRevenue: summaryData.todayRevenue ?? 0,
      activeLots: summaryData.totalLots ?? 0,
      // Spots from summary (primary source)
      totalSpots: summaryData.totalSpots ?? occupancyData?.totalSpots ?? 0,
      totalAvailableSpots: summaryData.totalAvailableSpots ?? occupancyData?.averageAvailableSpots ?? 0,
      // Occupancy metrics - prioritize occupancy API, fallback to summary
      averageOccupancyRate: occupancyData?.averageOccupancyRate ?? summaryData.platformOccupancyRate ?? 0,
      peakOccupancyRate: occupancyData?.peakOccupancyRate ?? 0,
      minOccupancyRate: occupancyData?.minOccupancyRate ?? 0,
      // Duration and timing from summary
      platformAvgDurationMinutes: summaryData.platformAvgDurationMinutes ?? 60,
      generatedAt: summaryData.generatedAt ?? null,
      // Real booking data from API (no more calculations)
      totalBookings: summaryData.todayTransactionCount ?? 0,
      activeBookings: summaryData.activeBookings ?? 0,
      completedBookings: summaryData.completedBookings ?? 0,
      cancelledBookings: summaryData.cancelledBookings ?? 0,
      // User and lot data from API
      totalUsers: summaryData.totalUsers ?? 0,
      pendingLots: summaryData.pendingLots ?? 0,
    };
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [summaryRes, revenueRes, occupancyRes] = await Promise.all([
        getPlatformSummary(),
        getPlatformRevenueTrend(revenueFromDate, revenueToDate),
        getPlatformOccupancy(occupancyPeriod),
      ]);
      
      // 🔍 DEBUG: Log raw API responses
      console.log("🔴 RAW Summary Response:", summaryRes.data);
      console.log("🔴 RAW Revenue Response:", revenueRes.data);
      console.log("🔴 RAW Occupancy Response:", occupancyRes.data);
      
      // Transform and enrich data
      const enrichedSummary = enrichSummary(summaryRes.data, occupancyRes.data);
      const transformedRevenue = transformRevenueData(revenueRes.data);
      const transformedOccupancy = transformOccupancyData(occupancyRes.data);
      
      setSummary(enrichedSummary);
      setRevenueTrend(transformedRevenue);
      setOccupancy(transformedOccupancy);
      
      console.log("✅ Dashboard data loaded successfully");
      console.log("📊 Enriched Summary:", enrichedSummary);
      console.log("📊 Transformed Revenue:", transformedRevenue);
      console.log("📊 Transformed Occupancy:", transformedOccupancy);
    } catch (err) {
      console.error("❌ Dashboard fetch error:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage text="Loading dashboard..." />;

  // Booking breakdown for bar chart
  const bookingBreakdown = summary
    ? [
        { name: "Completed", value: summary.completedBookings, fill: COLORS.green },
        { name: "Active",    value: summary.activeBookings,    fill: COLORS.accent },
        { name: "Reserved",  value: summary.totalBookings - summary.completedBookings - summary.activeBookings - summary.cancelledBookings, fill: COLORS.yellow },
        { name: "Cancelled", value: summary.cancelledBookings, fill: COLORS.red },
      ]
    : [];

  return (
    <div className="page-container">
      <PageHeader
        title="Dashboard"
        subtitle="Platform overview at a glance"
        actions={
          <button
            onClick={fetchAll}
            className="text-xs text-secondary hover:text-primary border border-muted/60 px-3 py-1.5 rounded-md transition-colors hover:border-primary"
          >
            Refresh
          </button>
        }
      />

      {/* Pending Lots Alert Banner */}
      {summary?.pendingLots > 0 && (
        <div className="flex items-center justify-between gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3.5">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-yellow-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">
                {summary.pendingLots} parking lot
                {summary.pendingLots > 1 ? "s" : ""} awaiting approval
              </p>
              <p className="text-xs text-yellow-600 mt-0.5">
                Review and approve submitted parking lots
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/lots?tab=pending")}
            className="flex items-center gap-1.5 text-xs font-semibold text-yellow-700 bg-yellow-100 hover:bg-yellow-200 border border-yellow-300 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            Review Now <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(summary?.totalRevenue)}
          icon={IndianRupee}
          iconColor="bg-primary/10"
          iconTextColor="text-primary"
        />
        <StatCard
          title="Total Bookings"
          value={summary?.totalBookings?.toLocaleString("en-IN") ?? "—"}
          icon={CalendarCheck}
          iconColor="bg-accent/10"
          iconTextColor="text-accent"
        />
        <StatCard
          title="Active Bookings"
          value={summary?.activeBookings ?? "—"}
          icon={Activity}
          iconColor="bg-blue-50"
          iconTextColor="text-blue-600"
          badge={{ label: "Live", color: "blue" }}
        />
        <StatCard
          title="Cancelled Bookings"
          value={summary?.cancelledBookings ?? "—"}
          icon={XCircle}
          iconColor="bg-red-50"
          iconTextColor="text-red-500"
        />
        <StatCard
          title="Completed Bookings"
          value={summary?.completedBookings ?? "—"}
          icon={CheckCircle2}
          iconColor="bg-green-50"
          iconTextColor="text-green-600"
        />
        <StatCard
          title="Total Users"
          value={summary?.totalUsers?.toLocaleString("en-IN") ?? "—"}
          icon={Users}
          iconColor="bg-secondary/10"
          iconTextColor="text-secondary"
        />
        <StatCard
          title="Active Lots"
          value={summary?.activeLots ?? "—"}
          icon={ParkingSquare}
          iconColor="bg-emerald-50"
          iconTextColor="text-emerald-600"
        />
        <StatCard
          title="Pending Lots"
          value={summary?.pendingLots ?? "—"}
          icon={Clock}
          iconColor="bg-yellow-50"
          iconTextColor="text-yellow-600"
          badge={
            summary?.pendingLots > 0
              ? { label: "Needs Review", color: "yellow" }
              : undefined
          }
          onClick={
            summary?.pendingLots > 0
              ? () => navigate("/lots?tab=pending")
              : undefined
          }
        />
        <StatCard
          title="Total Spots"
          value={summary?.totalSpots?.toLocaleString("en-IN") ?? "—"}
          icon={ParkingSquare}
          iconColor="bg-purple/10"
          iconTextColor="text-purple-600"
        />
        <StatCard
          title="Available Spots"
          value={summary?.totalAvailableSpots?.toLocaleString("en-IN") ?? "—"}
          icon={ParkingSquare}
          iconColor="bg-green-100"
          iconTextColor="text-green-600"
          badge={summary?.totalAvailableSpots > 0 ? { label: "Free", color: "green" } : undefined}
        />
        <StatCard
          title="Avg Parking Duration"
          value={summary?.platformAvgDurationMinutes ? `${summary.platformAvgDurationMinutes} mins` : "—"}
          icon={Clock}
          iconColor="bg-indigo-50"
          iconTextColor="text-indigo-600"
        />
      </div>

      {/* Occupancy Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Avg Occupancy full-width stat */}
        <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-5 text-white flex flex-col justify-between">
          <p className="text-white/70 text-xs font-medium uppercase tracking-wider">
            Average Occupancy Rate
          </p>
          <p className="text-4xl font-bold mt-2">
            {formatPercent(summary?.averageOccupancyRate)}
          </p>
          <p className="text-white/60 text-xs mt-1">
            Across all active parking lots
          </p>
        </div>

        {/* Peak Occupancy */}
        <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl p-5 text-white flex flex-col justify-between">
          <p className="text-white/70 text-xs font-medium uppercase tracking-wider">
            Peak Occupancy Rate
          </p>
          <p className="text-4xl font-bold mt-2">
            {formatPercent(summary?.peakOccupancyRate)}
          </p>
          <p className="text-white/60 text-xs mt-1">
            Highest occupancy today
          </p>
        </div>

        {/* Min Occupancy */}
        <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl p-5 text-white flex flex-col justify-between">
          <p className="text-white/70 text-xs font-medium uppercase tracking-wider">
            Minimum Occupancy Rate
          </p>
          <p className="text-4xl font-bold mt-2">
            {formatPercent(summary?.minOccupancyRate)}
          </p>
          <p className="text-white/60 text-xs mt-1">
            Lowest occupancy today
          </p>
        </div>
      </div>

      {/* Charts Row 1 — Revenue + Occupancy */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Revenue Line Chart */}
        <div className="bg-white rounded-xl border border-muted/40 shadow-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-800">
              Revenue Trend
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              Daily revenue in INR
            </p>
          </div>
          
          {/* Date Range Selector */}
          <div className="mb-5 flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-1">
                From Date
              </label>
              <input
                type="date"
                value={revenueFromDate}
                onChange={(e) => setRevenueFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-muted/40 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-1">
                To Date
              </label>
              <input
                type="date"
                value={revenueToDate}
                onChange={(e) => setRevenueToDate(e.target.value)}
                className="w-full px-3 py-2 border border-muted/40 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <button
              onClick={fetchAll}
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Fetching..." : "Fetch"}
            </button>
          </div>
          
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ADBBDA40" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#8697C4" }}
                tickFormatter={(d) => formatDate(d).slice(0, 6)}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#8697C4" }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<ChartTooltip prefix="₹" />} />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke={COLORS.accent}
                strokeWidth={2.5}
                dot={{ r: 4, fill: COLORS.accent, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: COLORS.primary }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Occupancy Area Chart */}
        <div className="bg-white rounded-xl border border-muted/40 shadow-card p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                Occupancy Rate Trend
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                Hourly average occupancy % across all lots
              </p>
            </div>
            {/* Period Selection Buttons */}
            <div className="flex gap-2">
              {["DAILY", "WEEKLY", "MONTHLY"].map((period) => (
                <button
                  key={period}
                  onClick={() => setOccupancyPeriod(period)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    occupancyPeriod === period
                      ? "bg-primary text-white"
                      : "bg-muted/20 text-secondary hover:bg-muted/40"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={occupancy}>
              <defs>
                <linearGradient id="occupancyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={COLORS.primary} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ADBBDA40" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11, fill: "#8697C4" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#8697C4" }}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
              />
              <Tooltip content={<ChartTooltip prefix="" />} />
              <Area
                type="monotone"
                dataKey="occupancyRate"
                name="Occupancy %"
                stroke={COLORS.primary}
                strokeWidth={2.5}
                fill="url(#occupancyGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart Row 2 — Bookings Breakdown */}
      <div className="bg-white rounded-xl border border-muted/40 shadow-card p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-800">
            Booking Status Breakdown
          </h3>
          <p className="text-xs text-secondary mt-0.5">
            Distribution of all bookings by status
          </p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={bookingBreakdown} barSize={48}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ADBBDA40" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#8697C4" }} />
            <YAxis tick={{ fontSize: 11, fill: "#8697C4" }} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="value" name="Bookings" radius={[6, 6, 0, 0]}>
              {bookingBreakdown.map((entry, i) => (
                <rect key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}