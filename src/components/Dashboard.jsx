import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import {
  Server, PhoneCall, DollarSign, Shield, TrendingUp,
  CheckCircle2, XCircle, ArrowUpRight, Crown,
} from 'lucide-react';
import { getStats } from '../lib/api';
import { truncateAddress, formatNumber, formatUSDC, timeAgo } from '../lib/mockWallet';

// ─── Animated Counter ───────────────────────────────────────────────────────────

function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const target = typeof value === 'number' ? value : parseFloat(value) || 0;
    const start = 0;
    const startTime = performance.now();

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (target - start) * eased);
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    }

    ref.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);

  const formatted = decimals > 0 ? display.toFixed(decimals) : Math.floor(display).toLocaleString();
  return <span>{prefix}{formatted}{suffix}</span>;
}

// ─── Skeleton ───────────────────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <div className="glass-card-static p-5 space-y-3">
      <div className="skeleton h-4 w-24" />
      <div className="skeleton h-8 w-32" />
      <div className="skeleton h-3 w-16" />
    </div>
  );
}

// ─── Custom Tooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card-static p-3 text-xs">
      <p className="text-text-secondary mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-semibold">
          {entry.name}: {entry.name === 'volume' ? `$${entry.value}` : entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

// ─── Category Colors ────────────────────────────────────────────────────────────

const catColors = {
  data: '#3b82f6',
  compute: '#8b5cf6',
  ai: '#6366f1',
  storage: '#f97316',
  oracle: '#10b981',
  communication: '#f43f5e',
};

// ─── Dashboard ──────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">x402 Registry Overview</p>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))",
          gap: "12px",
          marginBottom: "24px"
        }}>
          {[...Array(4)].map((_, i) => <StatSkeleton key={i} />)}
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
          gap: "16px",
          marginBottom: "24px"
        }}>
          <div className="glass-card-static p-6"><div className="skeleton h-[250px] w-full" /></div>
          <div className="glass-card-static p-6"><div className="skeleton h-[250px] w-full" /></div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Services',
      value: stats.totalServices,
      icon: Server,
      color: '#6366f1',
      badge: '+3 this week',
    },
    {
      label: 'Total API Calls',
      value: stats.totalCalls,
      icon: PhoneCall,
      color: '#10b981',
      format: true,
    },
    {
      label: 'Total Volume',
      value: stats.totalVolume,
      icon: DollarSign,
      color: '#f59e0b',
      prefix: '$',
      decimals: 2,
    },
    {
      label: 'Total Staked',
      value: stats.totalStaked,
      icon: Shield,
      color: '#8b5cf6',
      prefix: '$',
      decimals: 2,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">Real-time x402 Registry Overview</p>
      </div>

      {/* Stat Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))",
        gap: "12px",
        marginBottom: "24px"
      }}>
        {statCards.map(({ label, value, icon: Icon, color, badge, prefix, decimals, format }) => (
          <div key={label} className="glass-card stat-card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] sm:text-xs font-medium text-text-secondary uppercase tracking-wider">{label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-text-primary truncate text-ellipsis overflow-hidden">
              {format ? (
                <span>{formatNumber(value)}</span>
              ) : (
                <AnimatedNumber value={value} prefix={prefix || ''} decimals={decimals || 0} />
              )}
            </div>
            {badge && (
              <span className="inline-block mt-2 text-[9px] sm:text-[10px] font-medium px-2 py-0.5 rounded-full bg-success/10 text-success">
                {badge}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
        gap: "16px",
        marginBottom: "24px"
      }}>
        {/* Calls Over Time */}
        <div className="glass-card-static p-4 sm:p-6 w-full max-w-full overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">API Calls (24h)</h3>
              <p className="text-xs text-text-muted mt-0.5">Calls per hour</p>
            </div>
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.hourlyData}>
                <defs>
                  <linearGradient id="callGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1f" />
                <XAxis dataKey="hour" tick={{ fill: '#4a4a5a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#4a4a5a', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="calls" stroke="#6366f1" strokeWidth={2} fill="url(#callGrad)" name="calls" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Calls by Category */}
        <div className="glass-card-static p-4 sm:p-6 w-full max-w-full overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">Calls by Category</h3>
              <p className="text-xs text-text-muted mt-0.5">Total distribution</p>
            </div>
          </div>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.categoryCallData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1f" />
                <XAxis dataKey="category" tick={{ fill: '#4a4a5a', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#4a4a5a', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="calls" name="calls" radius={[6, 6, 0, 0]}>
                  {stats.categoryCallData?.map((entry, i) => (
                    <rect key={i} fill={catColors[entry.category] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
        gap: "16px"
      }}>
        {/* Recent Activity */}
        <div className="glass-card-static p-4 sm:p-6 w-full" style={{ gridColumn: "span 1", minWidth: 0 }}>
          <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {stats.recentActivity?.map((log) => (
              <div key={log.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  log.success ? 'bg-success/10' : 'bg-danger/10'
                }`}>
                  {log.success ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-danger" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate-mobile">{log.service_name}</p>
                  <p className="text-[10px] text-text-muted font-mono truncate-mobile">{truncateAddress(log.caller_address)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-accent">${log.amount_paid}</p>
                  <p className="text-[10px] text-text-muted">{timeAgo(log.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Services */}
        <div className="glass-card-static p-4 sm:p-6 w-full" style={{ gridColumn: "span 1", minWidth: 0 }}>
          <h3 className="text-sm font-semibold mb-4">Top Services</h3>
          <div className="space-y-4">
            {stats.topServices?.map((svc, i) => (
              <Link
                key={svc.id}
                to={`/services/${svc.id}`}
                className="flex items-center gap-3 p-2 sm:p-3 rounded-lg hover:bg-white/[0.03] transition-colors group"
              >
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg accent-gradient flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
                  {i === 0 ? <Crown className="w-3 h-3 sm:w-4 sm:h-4" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate group-hover:text-accent transition-colors">{svc.name}</p>
                  <p className="text-[9px] sm:text-[10px] text-text-muted">{formatNumber(svc.total_calls)} calls</p>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className={`text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1 ${
                    svc.current_uptime >= 0.99 ? 'uptime-good' : svc.current_uptime >= 0.97 ? 'uptime-warn' : 'uptime-bad'
                  }`}>
                    {(svc.current_uptime * 100).toFixed(1)}%
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent transition-colors desktop-only" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
