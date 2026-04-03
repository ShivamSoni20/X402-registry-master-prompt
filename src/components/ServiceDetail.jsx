import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import {
  ArrowLeft, Copy, Check, Zap, Shield, Activity, Clock, Globe,
  CheckCircle2, XCircle, AlertTriangle, ExternalLink, Loader2,
} from 'lucide-react';
import { getService, callService } from '../lib/api';
import { getWalletAddress, truncateAddress, formatNumber, formatUSDC, timeAgo } from '../lib/mockWallet';
import { getOnChainStake } from '../lib/chainClient';

const catColors = {
  data: '#3b82f6', compute: '#8b5cf6', ai: '#6366f1',
  storage: '#f97316', oracle: '#10b981', communication: '#f43f5e',
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card-static p-2 text-xs">
      <p className="text-text-muted">{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color }} className="font-semibold">{e.name}: {e.value}</p>
      ))}
    </div>
  );
}

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);
  const [callModal, setCallModal] = useState(false);
  const [callStep, setCallStep] = useState(0); 
  const [callResult, setCallResult] = useState(null);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [onChainData, setOnChainData] = useState(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    setLoading(true);
    getService(id)
      .then(setService)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const verifyOnChain = async () => {
    setVerifying(true);
    const data = await getOnChainStake(service.id);
    setOnChainData(data);
    setVerifying(false);
  };

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCall = async () => {
    setCallModal(true);
    setCallStep(1);
    setCallResult(null);

    await new Promise(r => setTimeout(r, 800));
    setCallStep(2);

    await new Promise(r => setTimeout(r, 800));

    try {
      const result = await callService(id, getWalletAddress());
      setCallStep(3);
      setCallResult(result);

      const updated = await getService(id);
      setService(updated);
    } catch (err) {
      setCallStep(0);
      setCallResult({ error: err.message });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="skeleton h-8 w-48" />
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
          gap: "20px",
          alignItems: "start"
        }}>
          <div className="space-y-4">
            <div className="glass-card-static p-6"><div className="skeleton h-48 w-full" /></div>
          </div>
          <div className="space-y-4">
            <div className="glass-card-static p-6"><div className="skeleton h-[250px] w-full" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="glass-card-static p-12 text-center">
        <AlertTriangle className="w-10 h-10 text-warning mx-auto mb-3" />
        <p className="text-text-secondary font-medium">Service not found</p>
        <button onClick={() => navigate('/discover')} className="btn-secondary mt-4">Back to Discover</button>
      </div>
    );
  }

  const uptimePercent = (service.current_uptime * 100).toFixed(2);
  const slaTarget = (service.sla_uptime_target * 100).toFixed(1);
  const slaMet = service.current_uptime >= service.sla_uptime_target;
  const tags = JSON.parse(service.tags || '[]');
  const color = catColors[service.category] || '#6366f1';

  const uptimeData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000);
    const base = service.current_uptime * 100;
    const jitter = (Math.random() - 0.5) * 2;
    return {
      day: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      uptime: Math.min(100, Math.max(95, base + jitter)),
    };
  });

  const volumeData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return {
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      calls: Math.floor(service.total_calls / 30 * (0.7 + Math.random() * 0.6)),
    };
  });

  const modalStyle = isMobile ? {
    position: "fixed", inset: 0, borderRadius: 0, 
    overflowY: "auto", zIndex: 2000, 
    maxWidth: "100%", width: "100%", height: "100%", margin: 0,
    background: "#0a0a0b"
  } : {
    maxWidth: "32rem", width: "100%", margin: "0 16px"
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-secondary p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div style={{ minWidth: 0 }}>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold truncate-mobile block">{service.name}</h1>
            <span className={`badge-${service.category} flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full`}>
              {service.category}
            </span>
          </div>
          <p className="text-text-muted text-xs mt-0.5">Service Detail</p>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
        gap: "20px",
        alignItems: "start"
      }}>
        {/* Left Column */}
        <div className="space-y-4">
          <div className="glass-card-static p-4 sm:p-6 space-y-4" style={{ overflow: "hidden" }}>
            <p className="text-sm text-text-secondary leading-relaxed break-words">{service.description}</p>

            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-text-secondary">
                  {tag}
                </span>
              ))}
            </div>

            <div className="border border-border rounded-lg overflow-x-auto">
              <table className="w-full text-xs" style={{ minWidth: "280px" }}>
                <tbody>
                  {[
                    ['Provider', (
                      <div className="flex items-center gap-2">
                        <span className="font-mono truncate-mobile">{truncateAddress(service.provider_address)}</span>
                        <button onClick={() => copyText(service.provider_address, 'addr')} className="text-text-muted hover:text-text-primary flex-shrink-0">
                          {copied === 'addr' ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    )],
                    ['Endpoint', (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-accent truncate-mobile max-w-[200px]" title={service.endpoint_url}>{service.endpoint_url}</span>
                        <button onClick={() => copyText(service.endpoint_url, 'url')} className="text-text-muted hover:text-text-primary flex-shrink-0">
                          {copied === 'url' ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    )],
                    ['Price/Call', <span className="font-semibold text-accent">${service.price_per_call}</span>],
                    ['Staked Bond', (
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-semibold">{formatUSDC(service.stake_amount)}</span>
                        
                        <button onClick={verifyOnChain} disabled={verifying} style={{
                          fontSize: "10px", padding: "4px 8px", borderRadius: "4px",
                          background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)",
                          color: "#6366f1", cursor: "pointer", display: "inline-block"
                        }}>
                          {verifying ? "Verifying..." : "Verify on Chain"}
                        </button>
                        
                        {onChainData && (
                          <div style={{ marginTop: "4px", padding: "6px", background: "rgba(16,185,129,0.06)", borderRadius: "4px", border: "1px solid rgba(16,185,129,0.2)", width: "100%" }}>
                            <div style={{ fontSize: "10px", color: "#10b981" }}>On-chain verified</div>
                            <div style={{ fontSize: "10px", fontFamily: "monospace", color: "#8b8b9e" }}>
                              {onChainData.stakedAmount} ETH · {onChainData.slashCount} Slashes
                            </div>
                            <a href={`https://sepolia.basescan.org/address/${import.meta.env.VITE_CONTRACT_ADDRESS || ''}`}
                              target="_blank" rel="noopener" style={{ fontSize: "10px", color: "#6366f1" }}>
                              Contract ↗
                            </a>
                          </div>
                        )}
                      </div>
                    )],
                    ['SLA Target', `${slaTarget}%`],
                    ['Uptime', (
                      <span className={slaMet ? 'text-success' : 'text-danger'}>{uptimePercent}%</span>
                    )],
                    ['Calls', formatNumber(service.total_calls)],
                    ['Consistency', `${(service.consistency_score * 100).toFixed(1)}%`],
                  ].map(([label, value]) => (
                    <tr key={label} className="border-b border-border/50 last:border-0">
                      <td className="py-2.5 px-3 sm:px-4 text-text-muted font-medium w-1/3 sm:w-1/4">{label}</td>
                      <td className="py-2.5 px-3 sm:px-4 text-text-primary break-all">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={handleCall} className="btn-primary w-full justify-center py-3 text-sm" id="call-service-btn">
              <Zap className="w-4 h-4" />
              Call This Service
            </button>
          </div>

          <div className="glass-card-static p-4 sm:p-6 overflow-hidden">
            <h3 className="text-sm font-semibold mb-3">Recent Calls</h3>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-xs text-left" style={{ minWidth: "400px" }}>
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 px-2 text-text-muted font-medium">Caller</th>
                    <th className="py-2 px-2 text-text-muted font-medium">Amount</th>
                    <th className="py-2 px-2 text-text-muted font-medium">Status</th>
                    <th className="py-2 px-2 text-text-muted font-medium">Latency</th>
                    <th className="py-2 px-2 text-text-muted font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {service.recentCalls?.slice(0, 5).map((call) => (
                    <tr key={call.id} className="border-b border-border/30 last:border-0">
                      <td className="py-2 px-2 font-mono text-text-secondary truncate-mobile">{truncateAddress(call.caller_address)}</td>
                      <td className="py-2 px-2 text-accent">${call.amount_paid}</td>
                      <td className="py-2 px-2">
                        {call.success ? (
                          <span className="uptime-good text-[10px] font-semibold px-1.5 py-0.5 rounded-full">OK</span>
                        ) : (
                          <span className="uptime-bad text-[10px] font-semibold px-1.5 py-0.5 rounded-full">Fail</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-text-muted">{call.latency_ms}ms</td>
                      <td className="py-2 px-2 text-text-muted">{timeAgo(call.timestamp)}</td>
                    </tr>
                  ))}
                  {(!service.recentCalls || service.recentCalls.length === 0) && (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-text-muted">No recent calls</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4 min-w-0">
          <div className={`glass-card-static p-4 sm:p-5 border-l-2 ${slaMet ? 'border-l-success' : 'border-l-danger'}`}>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              SLA Status
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Target</span>
                <span className="font-semibold">{slaTarget}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Actual</span>
                <span className={`font-semibold ${slaMet ? 'text-success' : 'text-danger'}`}>{uptimePercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Status</span>
                <span className={`font-semibold ${slaMet ? 'text-success' : 'text-danger'}`}>
                  {slaMet ? '✅ Meeting SLA' : '⚠️ Below SLA'}
                </span>
              </div>
            </div>
            {!slaMet && (
              <button
                onClick={() => navigate('/slash-events')}
                className="mt-3 w-full text-xs py-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors font-medium"
              >
                ⚠️ Challenge SLA
              </button>
            )}
          </div>

          <div className="glass-card-static p-4 sm:p-5 w-full">
            <h3 className="text-sm font-semibold mb-3">Uptime (30 days)</h3>
            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={uptimeData}>
                  <defs>
                    <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1f" />
                  <XAxis dataKey="day" tick={{ fill: '#4a4a5a', fontSize: 9 }} axisLine={false} tickLine={false} interval={10} />
                  <YAxis domain={[95, 100]} tick={{ fill: '#4a4a5a', fontSize: 9 }} axisLine={false} tickLine={false} width={25} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="uptime" stroke={color} strokeWidth={2} fill={`url(#grad-${id})`} name="uptime %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card-static p-4 sm:p-5 w-full">
            <h3 className="text-sm font-semibold mb-3">Call Volume (7 days)</h3>
            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1f" />
                  <XAxis dataKey="day" tick={{ fill: '#4a4a5a', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#4a4a5a', fontSize: 9 }} axisLine={false} tickLine={false} width={25} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="calls" fill={color} radius={[4, 4, 0, 0]} name="calls" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {callModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget && callStep === 3) {
            setCallModal(false);
            setCallStep(0);
          }
        }}>
          <div className="glass-card-static animate-slide-up flex flex-col" style={modalStyle}>
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                x402 Payment Flow
              </h2>
              {isMobile && callStep === 3 && (
                <button className="text-text-muted" onClick={() => { setCallModal(false); setCallStep(0); }}>
                  <AlertTriangle className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="px-4 sm:px-6 flex-1 overflow-y-auto pb-6">
              <div className="space-y-4 mb-6">
                {/* Step 1 */}
                <div className={`payment-step flex items-center gap-4 p-3 rounded-lg border border-border/50 ${callStep >= 1 ? 'active' : ''} ${callStep > 1 ? 'completed' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    callStep > 1 ? 'bg-success/20' : callStep === 1 ? 'bg-accent/20' : 'bg-white/[0.04]'
                  }`}>
                    {callStep > 1 ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : callStep === 1 ? (
                      <Loader2 className="w-4 h-4 text-accent animate-spin" />
                    ) : (
                      <span className="text-xs text-text-muted">1</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Signing Transaction</p>
                    <p className="text-xs text-text-muted">Authorizing x402 payment of ${service.price_per_call} USDC</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={`payment-step flex items-center gap-4 p-3 rounded-lg border border-border/50 ${callStep >= 2 ? 'active' : ''} ${callStep > 2 ? 'completed' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    callStep > 2 ? 'bg-success/20' : callStep === 2 ? 'bg-accent/20' : 'bg-white/[0.04]'
                  }`}>
                    {callStep > 2 ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : callStep === 2 ? (
                      <Loader2 className="w-4 h-4 text-accent animate-spin" />
                    ) : (
                      <span className="text-xs text-text-muted">2</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Broadcasting to Network</p>
                    <p className="text-xs text-text-muted">Submitting via OWS Micropayment Channel</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={`payment-step flex items-center gap-4 p-3 rounded-lg border border-border/50 ${callStep >= 3 ? 'active' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    callStep === 3 ? 'bg-success/20' : 'bg-white/[0.04]'
                  }`}>
                    {callStep === 3 ? (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="checkmark-svg draw" />
                      </svg>
                    ) : (
                      <span className="text-xs text-text-muted">3</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {callStep === 3 ? (callResult?.success ? '✅ Payment Confirmed' : '❌ Call Failed') : 'Awaiting Confirmation'}
                    </p>
                    <p className="text-xs text-text-muted">
                      {callStep === 3 ? 'Service response received' : 'Waiting for block confirmation'}
                    </p>
                  </div>
                </div>
              </div>

              {callStep === 3 && callResult && (
                <div style={{ wordBreak: "break-all" }} className={`p-4 rounded-lg border ${callResult.success ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5'} space-y-3 ${callResult.success ? 'success-flash' : ''}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                    <span className="text-text-muted">Tx Hash</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[10px] break-all">{truncateAddress(callResult.txHash)}</span>
                      <button onClick={() => copyText(callResult.txHash, 'tx')} className="text-text-muted hover:text-text-primary ml-1">
                        {copied === 'tx' ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Amount Paid</span>
                    <span className="text-accent font-semibold">${callResult.amountPaid} USDC</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Latency</span>
                    <span className="text-text-primary">{callResult.latencyMs}ms</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Gas Used</span>
                    <span className="text-text-primary">{callResult.payment?.gasUsed?.toLocaleString()}</span>
                  </div>

                  {callResult.result && (
                    <div>
                      <p className="text-[10px] text-text-muted mb-1 uppercase tracking-wider font-semibold mt-2">API Response</p>
                      <pre className="text-[10px] font-mono p-3 rounded-lg bg-surface-base text-text-secondary overflow-x-auto max-h-48 overflow-y-auto w-full whitespace-pre-wrap">
                        {JSON.stringify(callResult.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {(callStep === 3 || callResult?.error) && (
                <button
                  onClick={() => { setCallModal(false); setCallStep(0); }}
                  className="btn-secondary w-full mt-6 justify-center py-3"
                >
                  Close window
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
