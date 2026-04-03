import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Server, Activity, Shield, TrendingUp, ExternalLink, Settings,
  CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { getServices } from '../lib/api';
import { getWalletAddress, formatNumber, formatUSDC, truncateAddress } from '../lib/mockWallet';

export default function MyServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const walletAddress = getWalletAddress();

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    getServices()
      .then((all) => {
        // Simulate: assign first 3 services as "mine" based on wallet
        const mine = all.slice(0, 3);
        setServices(mine);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="skeleton h-8 w-48" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card-static p-5"><div className="skeleton h-20 w-full" /></div>
          ))}
        </div>
      </div>
    );
  }

  const totalCalls = services.reduce((sum, s) => sum + s.total_calls, 0);
  const totalRevenue = services.reduce((sum, s) => sum + s.total_calls * s.price_per_call, 0);
  const totalStaked = services.reduce((sum, s) => sum + s.stake_amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Services</h1>
          <p className="text-text-secondary text-sm mt-1">
            Provider dashboard · <span className="font-mono">{truncateAddress(walletAddress)}</span>
          </p>
        </div>
        <Link to="/register" className="btn-primary justify-center">
          <Server className="w-4 h-4" />
          Register New
        </Link>
      </div>

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))",
        gap: "12px",
        marginBottom: "24px"
      }}>
        {[
          { label: 'My Services', value: services.length, icon: Server, color: '#6366f1' },
          { label: 'Total Calls', value: formatNumber(totalCalls), icon: Activity, color: '#10b981' },
          { label: 'Revenue Earned', value: formatUSDC(totalRevenue), icon: TrendingUp, color: '#f59e0b' },
          { label: 'Total Staked', value: formatUSDC(totalStaked), icon: Shield, color: '#8b5cf6' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card-static p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-text-muted uppercase tracking-wider">{label}</span>
              <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Service List */}
      <div className="space-y-3">
        {services.map((svc) => {
          const slaMet = svc.current_uptime >= svc.sla_uptime_target;
          const uptimePercent = (svc.current_uptime * 100).toFixed(2);
          const revenue = (svc.total_calls * svc.price_per_call).toFixed(2);

          return (
            <div key={svc.id} className="glass-card p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold truncate-mobile block">{svc.name}</h3>
                    <span className={`badge-${svc.category} flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full`}>
                      {svc.category}
                    </span>
                    {slaMet ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-2 sm:truncate">{svc.description}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 sm:flex items-center gap-2 sm:gap-6 text-xs flex-shrink-0">
                  <div className="text-center sm:text-left">
                    <p className="text-text-muted text-[9px] sm:text-[10px]">Calls</p>
                    <p className="font-semibold">{formatNumber(svc.total_calls)}</p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-text-muted text-[9px] sm:text-[10px]">Revenue</p>
                    <p className="font-semibold text-success">${revenue}</p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-text-muted text-[9px] sm:text-[10px]">Uptime</p>
                    <p className={`font-semibold ${slaMet ? 'text-success' : 'text-danger'}`}>{uptimePercent}%</p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-text-muted text-[9px] sm:text-[10px]">Staked</p>
                    <p className="font-semibold">{formatUSDC(svc.stake_amount)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0 mt-2 sm:mt-0">
                  <Link to={`/services/${svc.id}`} className="btn-secondary text-xs w-full justify-center px-4 py-2 flex-1">
                    <ExternalLink className="w-3.5 h-3.5" /> <span className="sm:hidden ml-1">View Details</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {services.length === 0 && (
        <div className="glass-card-static p-12 text-center">
          <Server className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary font-medium">No services registered yet</p>
          <Link to="/register" className="btn-primary mt-4 inline-flex px-6 py-3">
            Register Your First Service
          </Link>
        </div>
      )}
    </div>
  );
}
