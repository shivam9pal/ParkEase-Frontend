import { useEffect, useState } from "react";
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ParkingSquare, IndianRupee, CalendarCheck,
  TrendingUp, Activity, ChevronDown, Clock,
} from "lucide-react";
import { getAllLots } from "../api/lotApi";
import {
  getLotAnalyticsSummary,
  getLotRevenueTrend,
  getLotOccupancyTrend,
} from "../api/analyticsApi";
import { formatCurrency, formatDate, formatPercent } from "../utils/formatters";
import PageHeader from "../components/shared/PageHeader";
import StatCard from "../components/shared/StatCard";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import EmptyState from "../components/shared/EmptyState";
import { toast } from "../store/notificationStore";

const PERIODS = ["DAILY", "WEEKLY", "MONTHLY"];
const COLORS   = { primary: "#3D52A0", accent: "#7091E6", muted: "#ADBBDA" };

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

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl border border-muted/40 shadow-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-secondary mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function ChartTooltip({ active, payload, label, valuePrefix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-muted/40 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="text-secondary font-medium text-xs mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-semibold text-xs">
          {entry.name}: {valuePrefix}
          {typeof entry.value === "number"
            ? entry.value.toLocaleString("en-IN")
            : entry.value}
        </p>
      ))}
    </div>
  );
}

export default function LotAnalyticsPage() {
  const [lots, setLots]               = useState([]);
  const [selectedLotId, setSelectedLotId] = useState(null);
  const [period, setPeriod]           = useState("WEEKLY");
  const [lotSummary, setLotSummary]   = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [occupancy, setOccupancy]     = useState([]);
  const [lotsLoading, setLotsLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  // Load all lots on mount
  useEffect(() => {
    const fetchLots = async () => {
      setLotsLoading(true);
      try {
        const res = await getAllLots();
        console.log("🔍 getAllLots response:", res.data); // DEBUG LOG
        
        // Filter for approved lots only
        const allLots = res.data ?? [];
        console.log("📋 Total lots:", allLots.length);
        console.log("First lot structure:", allLots[0]); // See actual structure
        
        const approvedLots = allLots.filter((l) => l.isApproved === true);
        console.log("✅ Approved lots:", approvedLots.length);
        
        setLots(approvedLots);
        if (approvedLots.length > 0) {
          setSelectedLotId(approvedLots[0].lotId);
        }
      } catch (err) {
        console.error("❌ getAllLots error:", err);
        toast.error("Failed to load parking lots");
      } finally {
        setLotsLoading(false);
      }
    };
    fetchLots();
  }, []);

  // Transform revenue object into chart format - NO dummy data
  const transformRevenueData = (revenueData) => {
    if (Array.isArray(revenueData)) return revenueData;
    
    // If single object returned, show as single data point
    if (revenueData && typeof revenueData.totalRevenue === 'number') {
      const periodStart = revenueData.periodStart || new Date().toISOString().split('T')[0];
      const periodEnd = revenueData.periodEnd || new Date().toISOString().split('T')[0];
      
      console.log(`💰 Lot Revenue: ₹${revenueData.totalRevenue} (Period: ${periodStart} to ${periodEnd})`);
      
      // Return single data point
      return [{
        date: periodStart.split('T')[0],
        revenue: revenueData.totalRevenue,
      }];
    }
    
    console.warn("⚠️ Revenue data format unrecognized:", revenueData);
    return [];
  };

  // Transform occupancy object - extract hourly breakdown
  const transformOccupancyData = (occupancyData) => {
    if (Array.isArray(occupancyData)) return occupancyData;
    
    if (occupancyData && Array.isArray(occupancyData.hourlyBreakdown)) {
      console.log(`📊 Lot Occupancy (Hourly): ${occupancyData.hourlyBreakdown.length} hours available`);
      
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

  // Fetch lot analytics whenever lot or period changes
  useEffect(() => {
    if (!selectedLotId) return;
    fetchLotData(selectedLotId, period);
  }, [selectedLotId, period]);

  const fetchLotData = async (lotId, p) => {
    setDataLoading(true);
    try {
      const [summaryRes, revenueRes, occupancyRes] = await Promise.all([
        getLotAnalyticsSummary(lotId),
        getLotRevenueTrend(lotId, p),
        getLotOccupancyTrend(lotId, p),
      ]);
      setLotSummary(summaryRes.data);
      const transformedRevenue = transformRevenueData(revenueRes.data);
      const transformedOccupancy = transformOccupancyData(occupancyRes.data);
      setRevenueTrend(transformedRevenue);
      setOccupancy(transformedOccupancy);
      
      console.log("✅ Lot analytics loaded successfully");
      console.log("📊 Summary:", summaryRes.data);
      console.log("📈 Revenue Trend:", transformedRevenue);
      console.log("📉 Occupancy:", transformedOccupancy);
    } catch (err) {
      console.error("❌ Lot analytics error:", err);
      toast.error("Failed to load lot analytics");
    } finally {
      setDataLoading(false);
    }
  };

  if (lotsLoading) return <LoadingSpinner fullPage text="Loading lots..." />;

  if (lots.length === 0) {
    return (
      <div className="page-container">
        <PageHeader title="Lot Analytics" subtitle="Per-lot revenue and occupancy insights" />
        <EmptyState
          icon={ParkingSquare}
          message="No active parking lots found"
          subtext="Approve parking lots first to view their analytics"
        />
      </div>
    );
  }

  const selectedLot = lots.find((l) => l.lotId === selectedLotId);

  // Current occupancy percent based on API data
  const currentOccupancyRate = lotSummary?.currentOccupancyRate ?? 0;

  return (
    <div className="page-container">
      <PageHeader
        title="Lot Analytics"
        subtitle="Per-lot revenue and occupancy insights"
        actions={
          <PeriodSelector value={period} onChange={setPeriod} />
        }
      />

      {/* Lot Selector */}
      <div className="bg-white rounded-xl border border-muted/40 shadow-card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <ParkingSquare size={18} className="text-primary" />
            <span className="text-sm font-semibold text-gray-700">
              Select Parking Lot
            </span>
          </div>
          <div className="relative w-full sm:w-80">
            <select
              value={selectedLotId ?? ""}
              onChange={(e) => setSelectedLotId(e.target.value)}
              className="
                w-full appearance-none bg-surface border border-muted/60 rounded-lg
                px-4 py-2.5 pr-9 text-sm text-gray-700
                focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
              "
            >
            {lots.map((lot) => (
                <option key={lot.lotId} value={lot.lotId}>
                  {lot.lotName || lot.name} — {lot.address}
                </option>
              ))}
            </select>
            <ChevronDown
              size={15}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none"
            />
          </div>
          {selectedLot && (
            <div className="flex items-center gap-2 text-xs text-secondary">
              <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full font-semibold">
                {lotSummary?.availableSpots ?? selectedLot.availableSpots ?? 0} / {lotSummary?.totalSpots ?? selectedLot.totalSpots ?? 0} available
              </span>
              <span className="font-medium text-gray-600">
                {formatCurrency(selectedLot.pricePerHour)}/hr
              </span>
            </div>
          )}
        </div>
      </div>

      {dataLoading ? (
        <LoadingSpinner fullPage text="Loading lot analytics..." />
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Today's Revenue"
              value={formatCurrency(lotSummary?.todayRevenue)}
              icon={IndianRupee}
              iconColor="bg-primary/10"
              iconTextColor="text-primary"
            />
            <StatCard
              title="Avg Occupancy"
              value={formatPercent(lotSummary?.averageOccupancyRate)}
              icon={TrendingUp}
              iconColor="bg-secondary/10"
              iconTextColor="text-secondary"
            />
            <StatCard
              title="Available Spots"
              value={lotSummary?.availableSpots?.toLocaleString("en-IN") ?? "—"}
              icon={ParkingSquare}
              iconColor="bg-green-50"
              iconTextColor="text-green-600"
            />
            <StatCard
              title="Peak Occupancy"
              value={formatPercent(lotSummary?.peakOccupancyRate)}
              icon={Activity}
              iconColor="bg-red-50"
              iconTextColor="text-red-600"
            />
            <StatCard
              title="Today's Transactions"
              value={lotSummary?.todayTransactionCount?.toLocaleString("en-IN") ?? "—"}
              icon={CalendarCheck}
              iconColor="bg-accent/10"
              iconTextColor="text-accent"
            />
            <StatCard
              title="Total Spots"
              value={lotSummary?.totalSpots?.toLocaleString("en-IN") ?? "—"}
              icon={ParkingSquare}
              iconColor="bg-purple-50"
              iconTextColor="text-purple-600"
            />
            <StatCard
              title="Current Occupancy"
              value={formatPercent(lotSummary?.currentOccupancyRate)}
              icon={Activity}
              iconColor="bg-blue-50"
              iconTextColor="text-blue-600"
            />
            <StatCard
              title="Avg Parking Duration"
              value={lotSummary?.averageParkingDurationMinutes ? `${lotSummary.averageParkingDurationMinutes} mins` : "—"}
              icon={Clock}
              iconColor="bg-indigo-50"
              iconTextColor="text-indigo-600"
            />
          </div>

          {/* Occupancy visual bar */}
          <div className="bg-white rounded-xl border border-muted/40 shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Live Occupancy
                </p>
                <p className="text-xs text-secondary mt-0.5">
                  {Math.round(lotSummary?.availableSpots ?? 0)} spots available out of{" "}
                  {lotSummary?.totalSpots ?? 0} total
                </p>
              </div>
              <span
                className={`text-2xl font-bold ${
                  currentOccupancyRate >= 90
                    ? "text-red-600"
                    : currentOccupancyRate >= 70
                    ? "text-yellow-600"
                    : "text-green-600"
                }`}
              >
                {formatPercent(currentOccupancyRate)}
              </span>
            </div>
            <div className="w-full h-4 bg-surface rounded-full overflow-hidden border border-muted/30">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  currentOccupancyRate >= 90
                    ? "bg-red-500"
                    : currentOccupancyRate >= 70
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${currentOccupancyRate}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-secondary mt-1">
              <span>0%</span>
              <span className="text-yellow-600 font-medium">70% — High</span>
              <span className="text-red-600 font-medium">90% — Critical</span>
              <span>100%</span>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <ChartCard
              title="Revenue Trend"
              subtitle={`${period.charAt(0) + period.slice(1).toLowerCase()} revenue for this lot`}
            >
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={revenueTrend}>
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
                    stroke={COLORS.accent}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: COLORS.accent, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: COLORS.primary }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Occupancy Rate Trend"
              subtitle="Occupancy % trend for this lot"
            >
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={occupancy}>
                  <defs>
                    <linearGradient id="lotOccGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLORS.primary} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
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
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="occupancyRate"
                    name="Occupancy %"
                    stroke={COLORS.primary}
                    strokeWidth={2.5}
                    fill="url(#lotOccGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}