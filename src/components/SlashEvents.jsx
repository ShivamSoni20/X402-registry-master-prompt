import { useState, useEffect } from 'react';
import {
  Zap, AlertTriangle, Shield, CheckCircle2, XCircle, Search,
  Loader2, Check, Clock, X,
} from 'lucide-react';
import { getSlashEvents, getServices, submitChallenge } from '../lib/api';
import { getWalletAddress, truncateAddress, formatUSDC, timeAgo } from '../lib/mockWallet';

const reasonLabels = {
  uptime_below_sla: 'Uptime Below SLA',
  consistency_failure: 'Consistency Failure',
  nonresponsive: 'Non-Responsive',
};

const reasonColors = {
  uptime_below_sla: 'text-danger',
  consistency_failure: 'text-warning',
  nonresponsive: 'text-danger',
};

export default function SlashEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [reason, setReason] = useState('uptime_below_sla');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    Promise.all([getSlashEvents(), getServices()])
      .then(([ev, svcs]) => {
        setEvents(ev);
        setServices(svcs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChallenge = async () => {
    if (!selectedService || !reason) return;
    setSubmitting(true);
    setSubmitResult(null);

    try {
      const result = await submitChallenge(selectedService, getWalletAddress(), reason);
      setSubmitResult({ success: true, data: result });

      // Refresh events
      const updated = await getSlashEvents();
      setEvents(updated);
    } catch (err) {
      setSubmitResult({ success: false, error: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="skeleton h-8 w-48" />
        <div className="glass-card-static p-6"><div className="skeleton h-64 w-full" /></div>
      </div>
    );
  }

  const modalStyle = isMobile ? {
    position: "fixed", inset: 0, borderRadius: 0, 
    overflowY: "auto", zIndex: 2000, 
    maxWidth: "100%", width: "100%", height: "100%", margin: 0,
    background: "#0a0a0b"
  } : {
    maxWidth: "28rem", width: "100%", margin: "0 16px"
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Slash Events</h1>
          <p className="text-text-secondary text-sm mt-1">SLA violations and challenge history</p>
        </div>
        <button onClick={() => { setModalOpen(true); setSubmitResult(null); }} className="btn-primary justify-center" id="submit-challenge-btn">
          <AlertTriangle className="w-4 h-4" />
          Submit Challenge
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))",
        gap: "12px",
        marginBottom: "24px"
      }}>
        <div className="glass-card-static p-4">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Total Slashes</p>
          <p className="text-xl font-bold">{events.length}</p>
        </div>
        <div className="glass-card-static p-4">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Total Slashed</p>
          <p className="text-xl font-bold text-danger">{formatUSDC(events.reduce((s, e) => s + e.amount_slashed, 0))}</p>
        </div>
        <div className="glass-card-static p-4">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Rewards Paid</p>
          <p className="text-xl font-bold text-success">{formatUSDC(events.reduce((s, e) => s + e.challenger_reward, 0))}</p>
        </div>
      </div>

      {/* Events List / Table */}
      {events.length === 0 ? (
        <div className="glass-card-static p-12 text-center">
          <Shield className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary font-medium">No slash events yet</p>
          <p className="text-text-muted text-xs mt-1">All services are meeting their SLAs</p>
        </div>
      ) : isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {events.map((ev) => (
            <div key={ev.id} style={{
              padding: "16px", borderRadius: "12px",
              background: "rgba(17,17,19,0.8)", border: "1px solid rgba(255,255,255,0.06)"
            }}>
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-sm truncate">{ev.service_name}</p>
                  <p className={`font-medium text-[11px] mt-1 ${reasonColors[ev.reason]}`}>
                    {reasonLabels[ev.reason]}
                  </p>
                </div>
                {ev.resolved ? (
                  <span className="uptime-good text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> Resolved
                  </span>
                ) : (
                  <span className="uptime-warn text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                )}
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px" }}>
                <div className="p-2 rounded bg-white/[0.02]">
                  <p className="text-[10px] text-text-muted mb-0.5">Slashed</p>
                  <p className="font-semibold text-danger">-${ev.amount_slashed.toFixed(2)}</p>
                </div>
                <div className="p-2 rounded bg-white/[0.02]">
                  <p className="text-[10px] text-text-muted mb-0.5">Reward</p>
                  <p className="font-semibold text-success">+${ev.challenger_reward.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-[11px] mt-3 pt-3 border-t border-border/50">
                <span className="text-text-muted font-mono">{truncateAddress(ev.challenger_address)}</span>
                <span className="text-text-muted">{timeAgo(ev.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card-static overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-elevated border-b border-border">
                  <th className="py-3 px-4 text-left text-text-muted font-medium">Service</th>
                  <th className="py-3 px-4 text-left text-text-muted font-medium">Reason</th>
                  <th className="py-3 px-4 text-left text-text-muted font-medium">Slashed</th>
                  <th className="py-3 px-4 text-left text-text-muted font-medium">Reward</th>
                  <th className="py-3 px-4 text-left text-text-muted font-medium">Challenger</th>
                  <th className="py-3 px-4 text-left text-text-muted font-medium">Time</th>
                  <th className="py-3 px-4 text-left text-text-muted font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id} className="border-b border-border/30 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <p className="font-medium max-w-[150px] truncate">{ev.service_name}</p>
                        <span className={`badge-${ev.category} text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0`}>
                          {ev.category}
                        </span>
                      </div>
                    </td>
                    <td className={`py-3 px-4 font-medium ${reasonColors[ev.reason]}`}>
                      {reasonLabels[ev.reason]}
                    </td>
                    <td className="py-3 px-4 text-danger font-semibold">
                      -${ev.amount_slashed.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-success font-semibold">
                      +${ev.challenger_reward.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-mono text-text-secondary">
                      {truncateAddress(ev.challenger_address)}
                    </td>
                    <td className="py-3 px-4 text-text-muted">
                      {timeAgo(ev.timestamp)}
                    </td>
                    <td className="py-3 px-4">
                      {ev.resolved ? (
                        <span className="uptime-good text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Resolved
                        </span>
                      ) : (
                        <span className="uptime-warn text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Challenge Modal ─────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setModalOpen(false);
        }}>
          <div className="glass-card-static flex flex-col animate-slide-up" style={modalStyle}>
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Submit SLA Challenge
              </h2>
              {isMobile && (
                <button className="text-text-muted p-2" onClick={() => setModalOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="px-4 sm:px-6 flex-1 overflow-y-auto pb-6 space-y-5">
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1.5 block">Target Service</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="input-field text-xs sm:text-sm py-3"
                  id="challenge-service-select"
                >
                  <option value="">Select a service...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({(s.current_uptime * 100).toFixed(1)}% uptime)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary mb-1.5 block">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input-field text-xs sm:text-sm py-3"
                  id="challenge-reason-select"
                >
                  <option value="uptime_below_sla">Uptime Below SLA Target</option>
                  <option value="consistency_failure">Consistency Failure</option>
                  <option value="nonresponsive">Service Non-Responsive</option>
                </select>
              </div>

              {selectedService && (
                <div className="glass-card-static p-4 bg-success/5 border border-success/20">
                  <p className="text-xs text-text-muted">If valid, you earn:</p>
                  <p className="text-lg sm:text-xl font-bold text-success mt-1">
                    +{formatUSDC((services.find(s => s.id === selectedService)?.stake_amount || 0) * 0.05)} USDC
                  </p>
                  <p className="text-[10px] sm:text-xs text-text-muted mt-1">50% of 10% slash amount</p>
                </div>
              )}

              {submitResult && (
                <div className={`p-4 rounded-lg text-xs sm:text-sm ${
                  submitResult.success
                    ? 'bg-success/5 border border-success/20 text-success'
                    : 'bg-danger/5 border border-danger/20 text-danger'
                }`}>
                  {submitResult.success ? (
                    <div className="space-y-1.5">
                      <p className="font-semibold text-sm mb-2">✅ Challenge Accepted!</p>
                      <p className="flex justify-between border-b border-success/10 pb-1"><span>Slashed:</span> <span className="font-mono">${submitResult.data.slashedAmount?.toFixed(2)}</span></p>
                      <p className="flex justify-between pt-1"><span>Your Reward:</span> <span className="font-bold">+${submitResult.data.challengerReward?.toFixed(2)}</span></p>
                    </div>
                  ) : (
                    <p className="break-words">❌ {submitResult.error}</p>
                  )}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center py-3">
                  Cancel
                </button>
                <button
                  onClick={handleChallenge}
                  disabled={!selectedService || submitting || (submitResult && submitResult.success)}
                  className="btn-primary flex-1 justify-center py-3 disabled:opacity-40 disabled:cursor-not-allowed"
                  id="challenge-submit-btn"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                  {submitting ? 'Submitting...' : 'Challenge'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
