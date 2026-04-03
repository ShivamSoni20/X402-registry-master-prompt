import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  PlusCircle,
  BarChart3,
  Zap,
  Wallet,
  Menu,
  X,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import WalletButton from "./WalletButton";
import { getWalletAddress, truncateAddress, getWalletBalance, formatUSDC } from '../lib/mockWallet';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/discover', label: 'Discover Services', icon: Search },
  { path: '/register', label: 'Register Service', icon: PlusCircle },
  { path: '/my-services', label: 'My Services', icon: BarChart3 },
  { path: '/slash-events', label: 'Slash Events', icon: Zap },
];

export default function Layout({ children }) {
  const [walletAddress] = useState(getWalletAddress());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [copied, setCopied] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const balance = getWalletBalance();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0b" }}>
      
      {/* Overlay (mobile only) */}
      {isMobile && sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar flex flex-col bg-surface border-r border-border ${sidebarOpen ? "open" : ""}`} style={{
        width: "220px",
        minHeight: "100vh",
        background: "#111113",
        borderRight: "1px solid #2a2a35",
        padding: "20px 0",
        flexShrink: 0,
        position: isMobile ? "fixed" : "sticky",
        top: 0,
        zIndex: isMobile ? 1000 : 10,
      }}>
        {/* Close button (mobile) */}
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} style={{
            position: "absolute", top: "16px", right: "16px",
            background: "none", border: "none", color: "#8b8b9e", cursor: "pointer"
          }}>
            <X size={18} />
          </button>
        )}
        
        {/* Logo */}
        <div className="px-6 pb-6 border-b border-border hover:opacity-80 transition-opacity">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg accent-gradient flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-text-primary">Vortex402</h1>
              <p className="text-[10px] text-text-muted font-mono">OWS Hackathon 2026</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                }`
              }
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Wallet */}
        <div className="p-4 border-t border-border">
          <div className="glass-card-static p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium text-text-secondary">OWS Wallet</span>
              <div className="ml-auto pulse-dot" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-text-primary truncate-mobile">{truncateAddress(walletAddress)}</span>
              <button onClick={copyAddress} className="text-text-muted hover:text-text-primary transition-colors">
                {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <div className="text-xs text-text-muted">
              Balance: <span className="text-success font-semibold">{formatUSDC(balance)} USDC</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content flex-1 flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
        
        {/* Header */}
        <header style={{
          height: "56px",
          background: "#111113",
          borderBottom: "1px solid #2a2a35",
          display: "flex",
          alignItems: "center",
          justifyContent: isMobile ? "flex-start" : "flex-end",
          padding: "0 16px",
          gap: "12px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}>
          {isMobile && (
            <button onClick={() => setSidebarOpen(true)} style={{
              background: "none", border: "none", color: "#8b8b9e",
              cursor: "pointer", padding: "4px", display: "flex"
            }}>
              <Menu size={20} />
            </button>
          )}
          {/* Logo on mobile */}
          {isMobile && (
            <Link to="/" style={{ fontSize: "14px", fontWeight: 500, color: "#f0f0f5", flex: 1, textDecoration: "none" }}>
              Vortex402
            </Link>
          )}
          
          <div className="flex items-center gap-3 ml-auto">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-text-muted hover:text-text-primary transition-colors desktop-only">
              <ExternalLink className="w-4 h-4" />
            </a>
            <WalletButton size="sm" />
          </div>
        </header>

        {/* Page content */}
        <main className="page-padding flex-1 overflow-y-auto" style={{ padding: "24px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
