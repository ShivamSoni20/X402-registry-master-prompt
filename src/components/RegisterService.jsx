import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, Database, Cpu, Brain,
  HardDrive, Globe, MessageCircle, Zap, Shield, Tag, X,
  Loader2, CheckCircle2, Rocket, AlertTriangle
} from 'lucide-react';
import { registerService } from '../lib/api';
import { truncateAddress } from '../lib/mockWallet';
import { stakeOnChain } from '../lib/chainClient';
import { useWallet } from "../hooks/useWallet";
import WalletButton from "./WalletButton";

const categoryOptions = [
  { key: 'data', label: 'Data', icon: Database, color: '#3b82f6' },
  { key: 'compute', label: 'Compute', icon: Cpu, color: '#8b5cf6' },
  { key: 'ai', label: 'AI/ML', icon: Brain, color: '#6366f1' },
  { key: 'storage', label: 'Storage', icon: HardDrive, color: '#f97316' },
  { key: 'oracle', label: 'Oracle', icon: Globe, color: '#10b981' },
  { key: 'communication', label: 'Comms', icon: MessageCircle, color: '#f43f5e' },
];

export default function RegisterService() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [deployStep, setDeployStep] = useState(0);
  const [result, setResult] = useState(null);
  const [tagInput, setTagInput] = useState('');
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [chainMode, setChainMode] = useState(
    localStorage.getItem("chainMode") || "simulation"
  );
  const [error, setError] = useState('');

  const { isConnected, address, isWrongNetwork } = useWallet();

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    tags: [],
    endpoint_url: '',
    price_per_call: 0.005,
    sla_uptime_target: 0.99,
    stake_amount: 100,
  });

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setError('');
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      update('tags', [...form.tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag) => {
    update('tags', form.tags.filter(t => t !== tag));
  };

  const minStake = Math.max(100, form.price_per_call * 100_000);

  const canNext1 = form.name && form.description && form.category && form.endpoint_url;
  const canNext2 = form.price_per_call > 0 && form.sla_uptime_target >= 0.95;
  const canSubmit = form.stake_amount >= minStake && (chainMode === "simulation" || (isConnected && !isWrongNetwork));

  const handleSubmit = async () => {
    setSubmitting(true);
    setDeployStep(0);
    setError('');

    const generatedServiceId = crypto.randomUUID();
    let txResult = {};

    try {
      if (chainMode === "live") {
        setDeployStep(1); 
        txResult = await stakeOnChain(
          generatedServiceId, 
          form.sla_uptime_target, 
          form.stake_amount / 1000 // Convert to ETH-equivalent for demo
        );
        setDeployStep(2); 
        await new Promise(r => setTimeout(r, 800));
        setDeployStep(3); 
        txResult.isRealChain = true;
      } else {
        setDeployStep(1);
        await new Promise(r => setTimeout(r, 800));
        setDeployStep(2);
        await new Promise(r => setTimeout(r, 600));
        setDeployStep(3);
        const mockHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
        txResult = { txHash: mockHash, isRealChain: false };
      }

      const res = await registerService({ ...form, id: generatedServiceId, txHash: txResult.txHash });
      setResult({ ...res, txResult });
    } catch (err) {
      setError("Transaction failed: " + err.message);
      setDeployStep(0);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Register Service</h1>
        <p className="text-text-secondary text-sm mt-1">Deploy your API to the registry</p>
      </div>

      <div style={{ display: "flex", gap: isMobile ? "4px" : "8px", marginBottom: "24px", overflowX: "auto" }}>
        {[ { id: 1, label: 'Service Info' }, { id: 2, label: 'Pricing & SLA' }, { id: 3, label: 'Stake & Deploy' } ].map(({ id: s, label }) => (
          <div key={s} style={{ flex: 1, minWidth: isMobile ? "90px" : "120px", textAlign: "center" }}>
            <div className={`mx-auto w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-semibold mb-1 sm:mb-2 transition-all ${
              step > s ? 'bg-success/20 text-success' : step === s ? 'accent-gradient text-white' : 'bg-white/[0.04] text-text-muted'
            }`}>
              {step > s ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : s}
            </div>
            <div style={{ fontSize: isMobile ? "9px" : "11px", color: step >= s ? '#f0f0f5' : '#8b8b9e' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="glass-card-static p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div>
            <label className="text-[11px] sm:text-xs font-medium text-text-secondary mb-1.5 block">Service Name *</label>
            <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g., Weather Oracle Pro" className="input-field" />
          </div>

          <div>
            <label className="text-[11px] sm:text-xs font-medium text-text-secondary mb-1.5 block">Description *</label>
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Describe your service..." rows={isMobile ? 3 : 4} className="input-field resize-none text-[13px] sm:text-sm" />
          </div>

          <div>
            <label className="text-[11px] sm:text-xs font-medium text-text-secondary mb-1.5 block">Category *</label>
            <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
              {categoryOptions.map(({ key, label, icon: Icon, color }) => (
                <button
                  key={key} onClick={() => update('category', key)}
                  className={`flex items-center gap-2 p-2 sm:p-3 rounded-lg border transition-all text-[11px] sm:text-xs font-medium ${
                    form.category === key ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface-elevated text-text-secondary hover:border-text-muted'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: form.category === key ? undefined : color }} />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] sm:text-xs font-medium text-text-secondary mb-1.5 block">Tags</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Type and press Enter" className="input-field flex-1" />
              <button onClick={addTag} className="btn-secondary px-3"><Tag className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map((tag) => (
                <span key={tag} className="text-[10px] font-medium px-2 py-1 rounded-full bg-accent/10 text-accent flex items-center gap-1">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="p-0.5 hover:bg-accent/20 rounded"><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] sm:text-xs font-medium text-text-secondary mb-1.5 block">Endpoint URL *</label>
            <input type="url" value={form.endpoint_url} onChange={(e) => update('endpoint_url', e.target.value)} placeholder="https://api.yourservice.com/" className="input-field font-mono text-[11px] sm:text-xs" />
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={() => setStep(2)} disabled={!canNext1} className={`btn-primary w-full sm:w-auto justify-center ${!canNext1 ? 'opacity-40 cursor-not-allowed' : ''}`}>
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="glass-card-static p-4 sm:p-6 space-y-5">
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "20px" }}>
            <div>
              <label className="text-[11px] sm:text-xs font-medium text-text-secondary mb-2 block">
                Price per Call (USDC): <span className="text-accent font-semibold">${form.price_per_call.toFixed(4)}</span>
              </label>
              <input type="range" min="0.0001" max="1" step="0.0001" value={form.price_per_call} onChange={(e) => update('price_per_call', parseFloat(e.target.value))} className="w-full accent-accent" style={{ height: "24px", touchAction: "none" }} />
              <input type="number" min="0.0001" max="1" step="0.0001" value={form.price_per_call} onChange={(e) => update('price_per_call', parseFloat(e.target.value) || 0)} className="input-field mt-3 w-full sm:w-40 text-xs" />
            </div>

            <div>
              <label className="text-[11px] sm:text-xs font-medium text-text-secondary mb-2 block">
                SLA Uptime Target: <span className="text-accent font-semibold">{(form.sla_uptime_target * 100).toFixed(2)}%</span>
              </label>
              <input type="range" min="0.95" max="0.9999" step="0.0001" value={form.sla_uptime_target} onChange={(e) => update('sla_uptime_target', parseFloat(e.target.value))} className="w-full accent-accent" style={{ height: "24px", touchAction: "none" }} />
            </div>
          </div>

          <div className="glass-card-static p-4 border border-accent/20 bg-accent/5">
            <p className="text-xs font-medium text-accent mb-1 flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Minimum Stake Calculation</p>
            <p className="text-[10px] text-text-secondary">min(price × 100k, $100) = <span className="text-accent font-bold">${minStake.toFixed(2)} USDC</span></p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-2">
            <button onClick={() => setStep(1)} className="btn-secondary justify-center"><ArrowLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => { update('stake_amount', Math.max(form.stake_amount, minStake)); setStep(3); }} disabled={!canNext2} className={`btn-primary justify-center ${!canNext2 ? 'opacity-40 cursor-not-allowed' : ''}`}>
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && !submitting && (
        <div className="glass-card-static p-4 sm:p-6 space-y-5">
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: "12px", padding: "12px 16px", borderRadius: "8px", background: chainMode === "live" ? "rgba(16,185,129,0.08)" : "rgba(99,102,241,0.08)", border: `1px solid ${chainMode === "live" ? "rgba(16,185,129,0.3)" : "rgba(99,102,241,0.3)"}`, marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "#f0f0f5", display: "flex", alignItems: "center", gap: "6px" }}>
                {chainMode === "live" ? <Globe className="w-3.5 h-3.5 text-success" /> : <Database className="w-3.5 h-3.5 text-accent" />}
                {chainMode === "live" ? "Live Chain Mode" : "Simulation Mode"}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", width: isMobile ? "100%" : "auto" }}>
              <button onClick={() => setChainMode(chainMode === "live" ? "simulation" : "live")} style={{ padding: "8px 12px", fontSize: "11px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#8b8b9e", cursor: "pointer", flex: isMobile ? 1 : "auto" }}>
                Switch to {chainMode === "live" ? "Simulation" : "Live Chain"}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] sm:text-xs font-medium text-text-secondary mb-1.5 block">Stake Amount (USDC) — minimum ${minStake.toFixed(2)}</label>
            <input type="number" min={minStake} step="10" value={form.stake_amount} onChange={(e) => update('stake_amount', parseFloat(e.target.value) || 0)} className="input-field text-lg font-semibold w-full" />
          </div>

          {chainMode === "live" && !isConnected && (
            <div style={{ padding: "16px", borderRadius: "8px", background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)", marginBottom: "16px" }}>
              <p style={{ fontSize: "12px", color: "#8b8b9e", marginBottom: "8px" }}>
                Connect your wallet to stake on Base Sepolia
              </p>
              <WalletButton size="md" />
            </div>
          )}

          {chainMode === "live" && isWrongNetwork && (
            <div style={{ padding: "16px", borderRadius: "8px", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", marginBottom: "16px" }}>
              <p style={{ fontSize: "12px", color: "#f59e0b", marginBottom: "8px" }}>
                 ⚠ Wrong Network. Please switch to Base Sepolia.
              </p>
              <WalletButton size="md" />
            </div>
          )}

          {chainMode === "live" && isConnected && !isWrongNetwork && (
            <div style={{ fontSize: "12px", color: "#10b981", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px", padding: "12px", borderRadius: "8px", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}>
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-success/20 text-success"><Check className="w-2.5 h-2.5" /></span>
              <span>Wallet ready:</span>
              <span style={{ fontFamily: "monospace", fontWeight: "bold" }}>{address.slice(0,6)}...{address.slice(-4)}</span>
            </div>
          )}

          {error && <div className="p-3 rounded-lg border border-danger/30 bg-danger/5 text-danger text-xs">{error}</div>}

          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-2">
            <button onClick={() => setStep(2)} className="btn-secondary justify-center"><ArrowLeft className="w-4 h-4" /> Back</button>
            <button onClick={handleSubmit} disabled={!canSubmit} className={`btn-primary justify-center ${!canSubmit ? 'opacity-40 cursor-not-allowed' : ''}`}>
              <Rocket className="w-4 h-4" /> Deploy to Registry
            </button>
          </div>
        </div>
      )}

      {submitting && (
        <div className="glass-card-static p-4 sm:p-6 space-y-5">
          <div className="space-y-4">
            {[ { step: 1, label: 'Depositing Stake' }, { step: 2, label: 'Registering on Chain' }, { step: 3, label: 'Deployment Complete' } ].map(({ step: s, label }) => (
              <div key={s} className={`payment-step flex items-center gap-4 p-3 rounded-lg border border-border/50 ${deployStep >= s ? 'active' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${ deployStep > s ? 'bg-success/20' : 'bg-accent/20' }`}>
                  {deployStep > s ? <CheckCircle2 className="w-4 h-4 text-success" /> : deployStep === s && s < 3 ? <Loader2 className="w-4 h-4 text-accent animate-spin" /> : s}
                </div>
                <p className="text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
          {result && (
            <div className="p-4 rounded-lg border border-success/30 bg-success/5 space-y-3 success-flash animate-slide-up">
              <p className="text-sm font-bold text-success flex items-center gap-2"><Rocket className="w-4 h-4" /> Service Deployed!</p>
              <button onClick={() => navigate(`/services/${result.service?.id}`)} className="btn-primary w-full justify-center mt-3 py-3">View Service</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
