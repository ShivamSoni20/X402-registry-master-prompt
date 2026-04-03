import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search as SearchIcon, Database, Cpu, Brain, HardDrive, Globe,
  MessageCircle, ExternalLink, ArrowDownToLine, Zap
} from 'lucide-react';
import { getServices } from '../lib/api';

const categories = [
  { key: 'all', label: 'All', icon: Zap },
  { key: 'data', label: 'Data', icon: Database },
  { key: 'compute', label: 'Compute', icon: Cpu },
  { key: 'ai', label: 'AI', icon: Brain },
  { key: 'storage', label: 'Storage', icon: HardDrive },
  { key: 'oracle', label: 'Oracle', icon: Globe },
  { key: 'communication', label: 'Communication', icon: MessageCircle },
];

export default function ServiceRegistry() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('calls');

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = services
    .filter((s) => category === 'all' || s.category === category)
    .filter((s) => {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        (s.tags && s.tags.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'calls') return b.total_calls - a.total_calls;
      if (sortBy === 'uptime') return b.current_uptime - a.current_uptime;
      if (sortBy === 'price') return a.price_per_call - b.price_per_call;
      return 0;
    });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Discover Services</h1>
        <p className="text-text-secondary text-sm mt-1">Browse and query x402-gated API services</p>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search services by name, description, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 h-12 text-sm"
          />
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Category filter pills — scrollable on mobile */}
          <div style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "4px",
            WebkitOverflowScrolling: "touch",
            marginBottom: "16px",
            scrollbarWidth: "none"
          }} className="sm:mb-0">
            {categories.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  category === key
                    ? 'bg-accent text-white'
                    : 'bg-surface border border-border text-text-secondary hover:border-text-muted'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ArrowDownToLine className="w-4 h-4 text-text-muted hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text-secondary outline-none focus:border-accent w-full sm:w-auto"
            >
              <option value="calls">Most Called</option>
              <option value="uptime">Best Uptime</option>
              <option value="price">Lowest Price</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: "12px" }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card-static p-5 space-y-3">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-5/6" />
              <div className="skeleton h-10 w-full mt-4" />
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))",
          gap: "12px"
        }}>
          {filtered.map((service) => {
            const uptimePercent = (service.current_uptime * 100).toFixed(1);
            const isGoodUptime = service.current_uptime >= 0.99;
            const consistency = (service.consistency_score * 100).toFixed(0);

            return (
              <div key={service.id} className="glass-card p-4 sm:p-5 flex flex-col h-full group">
                <div className="flex justify-between items-start mb-3">
                  <span className={`badge-${service.category} text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full`}>
                    {service.category}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isGoodUptime ? 'uptime-good' : 'uptime-warn'}`}>
                    {uptimePercent}% uptime
                  </span>
                </div>

                <h3 className="text-lg font-bold mb-1.5 group-hover:text-accent transition-colors truncate-mobile">{service.name}</h3>
                <p className="text-xs text-text-secondary line-clamp-2 mb-4 flex-1">
                  {service.description}
                </p>

                <div className="space-y-4">
                  {/* Price + uptime row */}
                  <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    alignItems: "center"
                  }}>
                    <span className="text-xl font-bold text-accent">
                      ${service.price_per_call} <span className="text-xs text-text-muted font-normal">/ call</span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-text-muted mb-1">
                      <span>Consistency</span>
                      <span>{consistency}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill accent-gradient"
                        style={{ width: `${consistency}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-text-muted pt-2 border-t border-border/50">
                    <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {(service.total_calls / 1000).toFixed(1)}K calls</span>
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> ${(service.stake_amount).toLocaleString()} staked</span>
                  </div>

                  <Link to={`/services/${service.id}`} className="btn-primary w-full justify-center text-xs py-2.5 mt-2">
                    View & Call <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <SearchIcon className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary font-medium">No services found</p>
          <p className="text-xs text-text-muted mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
