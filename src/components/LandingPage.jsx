import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import WalletButton from "./WalletButton";
import { useWallet } from "../hooks/useWallet";

// ─── Animated counter hook ───
function useCounter(target, duration = 1800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setValue(Math.floor(start));
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return value;
}

// ─── Flow animation: shows x402 call journey ───
function X402FlowDemo() {
  const [step, setStep] = useState(0);
  const steps = [
    { label: "Agent queries registry", color: "#6366f1", icon: "🤖" },
    { label: "Discovers matching service", color: "#8b5cf6", icon: "🔍" },
    { label: "x402 micropayment sent", color: "#f59e0b", icon: "⚡" },
    { label: "OWS wallet settles", color: "#10b981", icon: "✓" },
  ];

  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % steps.length), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0",
      flexWrap: "wrap", justifyContent: "center"
    }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center" }}>
          <div style={{
            padding: "8px 14px", borderRadius: "8px",
            background: i === step ? `${s.color}22` : "rgba(255,255,255,0.03)",
            border: `1px solid ${i === step ? s.color + "66" : "#2a2a35"}`,
            color: i === step ? s.color : "#4a4a5a",
            fontSize: "12px", fontFamily: "monospace",
            transition: "all 0.4s ease",
            display: "flex", alignItems: "center", gap: "6px"
          }}>
            <span style={{ fontSize: "14px" }}>{s.icon}</span>
            {s.label}
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width: "24px", height: "1px",
              background: i < step ? "#6366f1" : "#2a2a35",
              transition: "background 0.4s ease",
              flexShrink: 0
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Service category pill ───
function CategoryPill({ label, count, color }) {
  return (
    <div style={{
      padding: "6px 14px", borderRadius: "99px",
      border: `1px solid ${color}44`,
      background: `${color}11`,
      display: "flex", alignItems: "center", gap: "6px"
    }}>
      <span style={{ fontSize: "12px", color, fontFamily: "monospace" }}>{label}</span>
      <span style={{
        fontSize: "10px", fontFamily: "monospace",
        background: `${color}22`, color, padding: "1px 6px", borderRadius: "99px"
      }}>{count}</span>
    </div>
  );
}

// ─── Feature card ───
function FeatureCard({ icon, title, description, accent }) {
  return (
    <div style={{
      padding: "20px", borderRadius: "12px",
      border: "1px solid #2a2a35",
      background: "linear-gradient(135deg, #111113 0%, #0f0f12 100%)",
      transition: "border-color 0.2s, transform 0.2s",
      cursor: "default"
    }}
      onMouseOver={e => {
        e.currentTarget.style.borderColor = accent + "55";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseOut={e => {
        e.currentTarget.style.borderColor = "#2a2a35";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{
        width: "36px", height: "36px", borderRadius: "8px",
        background: `${accent}18`, border: `1px solid ${accent}33`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "18px", marginBottom: "12px"
      }}>{icon}</div>
      <div style={{ fontSize: "14px", fontWeight: 600, color: "#f0f0f5", marginBottom: "6px" }}>
        {title}
      </div>
      <div style={{ fontSize: "12.5px", color: "#6b6b7e", lineHeight: 1.65 }}>
        {description}
      </div>
    </div>
  );
}

// ─── Code block ───
function CodeBlock({ code, label }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{
      borderRadius: "10px", border: "1px solid #2a2a35",
      overflow: "hidden", fontFamily: "monospace"
    }}>
      <div style={{
        padding: "8px 14px", background: "#1a1a1f",
        borderBottom: "1px solid #2a2a35",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <span style={{ fontSize: "11px", color: "#6b6b7e" }}>{label}</span>
        <button onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }} style={{
          fontSize: "10px", fontFamily: "monospace", padding: "2px 8px",
          borderRadius: "4px", border: "1px solid #3a3a45",
          background: "none", color: copied ? "#10b981" : "#6b6b7e", cursor: "pointer"
        }}>
          {copied ? "copied!" : "copy"}
        </button>
      </div>
      <pre style={{
        margin: 0, padding: "14px 16px", background: "#0d0d10",
        fontSize: "12px", color: "#c9d1d9", overflowX: "auto",
        lineHeight: 1.7
      }}>{code}</pre>
    </div>
  );
}

// ─── Main Landing Page ───
export default function LandingPage() {
  const navigate = useNavigate();
  const { isConnected } = useWallet();
  
  useEffect(() => {
    if (isConnected) {
      navigate("/dashboard");
    }
  }, [isConnected, navigate]);

  const servicesCount = useCounter(12);
  const callsCount = useCounter(1247893);
  const volumeValue = useCounter(14382);
  const stakedValue = useCounter(13400);

  const categories = [
    { label: "AI / LLM", count: 2, color: "#6366f1" },
    { label: "Data", count: 2, color: "#3b82f6" },
    { label: "Compute", count: 2, color: "#8b5cf6" },
    { label: "Oracle", count: 2, color: "#10b981" },
    { label: "Storage", count: 2, color: "#f97316" },
    { label: "Comms", count: 2, color: "#f43f5e" },
  ];

  const features = [
    {
      icon: "🔍",
      title: "Instant discovery",
      description: "Any agent queries the registry by category, price, or uptime score. REST + x402 compatible out of the box.",
      accent: "#6366f1"
    },
    {
      icon: "🔒",
      title: "Staked quality bonds",
      description: "Providers stake ETH as a quality guarantee. Violate your SLA and your stake gets slashed — no governance vote needed.",
      accent: "#f59e0b"
    },
    {
      icon: "⚡",
      title: "x402 micropayments",
      description: "Pay per call in USDC via OWS wallets. Sub-second settlement. No API keys, no subscriptions, no accounts.",
      accent: "#10b981"
    },
    {
      icon: "⚖️",
      title: "Trustless challenges",
      description: "Any agent can challenge a provider's SLA claim. Valid challenges earn 5% of the slashed stake automatically.",
      accent: "#ef4444"
    },
    {
      icon: "🌐",
      title: "Multi-chain ready",
      description: "Registry indexes services across 9 chains. Agents on Solana discover Ethereum services. One registry, every chain.",
      accent: "#8b5cf6"
    },
    {
      icon: "📊",
      title: "Live analytics",
      description: "Real-time call volume, uptime history, consistency scores, and slash events. Full transparency for every service.",
      accent: "#3b82f6"
    },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0b",
      color: "#f0f0f5",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        borderBottom: "1px solid #1a1a22",
        background: "rgba(10,10,11,0.92)",
        backdropFilter: "blur(12px)",
        padding: "0 24px",
        display: "flex", alignItems: "center", height: "56px", gap: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "7px",
            background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px"
          }}>⬡</div>
          <span style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "-0.01em" }}>
            Vortex402
          </span>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: { xs: "5px", sm: "10px" }, alignItems: "center" }}>
          <a href="https://github.com/ShivamSoni20/X402-registry-master-prompt" target="_blank" rel="noopener"
            className="desktop-only"
            style={{ fontSize: "12px", color: "#6b6b7e", textDecoration: "none",
              padding: "6px 10px", borderRadius: "6px", border: "1px solid #2a2a35",
              fontFamily: "monospace" }}>
            GitHub
          </a>
          <WalletButton size="sm" />
          <button onClick={() => navigate("/dashboard")} style={{
            padding: "7px 14px", borderRadius: "7px",
            background: "#6366f1", border: "none",
            color: "#fff", fontSize: "12px", fontWeight: 500,
            cursor: "pointer", transition: "opacity 0.15s"
          }}
            onMouseOver={e => e.currentTarget.style.opacity = "0.85"}
            onMouseOut={e => e.currentTarget.style.opacity = "1"}
          >
            Open App →
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        maxWidth: "800px", margin: "0 auto",
        padding: "80px 24px 60px",
        textAlign: "center"
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "5px 14px", borderRadius: "99px",
          border: "1px solid rgba(99,102,241,0.35)",
          background: "rgba(99,102,241,0.08)",
          fontSize: "11px", fontFamily: "monospace",
          color: "#818cf8", marginBottom: "28px"
        }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%",
            background: "#10b981", animation: "pulse 2s infinite" }} />
          Live on Base Sepolia · OWS Hackathon 2026
        </div>

        <h1 style={{
          fontSize: "clamp(32px, 8vw, 64px)",
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          marginBottom: "24px",
          background: "linear-gradient(135deg, #f0f0f5 0%, #8b8b9e 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          The coordination layer<br />for autonomous agents
        </h1>

        <p style={{
          fontSize: "clamp(14px, 2.5vw, 18px)",
          color: "#6b6b7e", lineHeight: 1.6,
          maxWidth: "580px", margin: "0 auto 36px"
        }}>
          A staked, slashable registry where AI agents discover, evaluate,
          and pay for x402-gated API services via OWS micropayments.
          No API keys. No subscriptions. Just code.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/dashboard")} style={{
            padding: "14px 32px", borderRadius: "10px",
            background: "#6366f1", border: "none", width: "190px",
            color: "#fff", fontSize: "15px", fontWeight: 600,
            cursor: "pointer", transition: "all 0.15s",
            boxShadow: "0 4px 20px rgba(99,102,241,0.25)"
          }}
            onMouseOver={e => { e.currentTarget.style.background = "#4f46e5"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseOut={e => { e.currentTarget.style.background = "#6366f1"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Launch App →
          </button>
          <button onClick={() => navigate("/register")} style={{
            padding: "14px 32px", borderRadius: "10px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid #2a2a35", width: "190px",
            color: "#8b8b9e", fontSize: "15px", fontWeight: 500,
            cursor: "pointer", transition: "all 0.15s"
          }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#f0f0f5"; }}
            onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#8b8b9e"; }}
          >
            Register Service
          </button>
        </div>

        {/* Live flow animation */}
        <div style={{ marginTop: "56px" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3a3a45", marginBottom: "16px" }}>
            Real-time x402 Micropayment flow
          </div>
          <X402FlowDemo />
        </div>
      </section>

      {/* ── Live stats ── */}
      <section style={{
        borderTop: "1px solid #1a1a22", borderBottom: "1px solid #1a1a22",
        background: "#0d0d10"
      }}>
        <div style={{
          maxWidth: "1000px", margin: "0 auto",
          padding: "12px 24px",
          display: "flex",
          justifyContent: "space-around",
          flexWrap: "wrap"
        }}>
          {[
            { label: "Active Services", value: servicesCount.toLocaleString() },
            { label: "Queries Settled", value: callsCount.toLocaleString() },
            { label: "USDC Volume", value: `$${volumeValue.toLocaleString()}` },
            { label: "Total ETH Staked", value: `$${stakedValue.toLocaleString()}` },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: "16px 20px", textAlign: "center", minWidth: "160px"
            }}>
              <div style={{
                fontSize: "clamp(20px, 4vw, 32px)",
                fontWeight: 800, fontFamily: "monospace",
                color: "#f0f0f5", lineHeight: 1.1,
                letterSpacing: "-0.03em"
              }}>{stat.value}</div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "#4a4a5a", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Category pills ── */}
      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 24px 0" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", fontFamily: "monospace", color: "#4a4a5a", marginBottom: "8px" }}>
            Supporting every coordinate in the agent stack
          </div>
        </div>
        <div style={{
          display: "flex", gap: "8px",
          justifyContent: "center", flexWrap: "wrap"
        }}>
          {categories.map(c => <CategoryPill key={c.label} {...c} />)}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ maxWidth: "1000px", margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{
            fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 700,
            letterSpacing: "-0.03em", marginBottom: "12px"
          }}>
            Infrastructure for the Agentic Era
          </h2>
          <p style={{ fontSize: "16px", color: "#6b6b7e", maxWidth: "520px", margin: "0 auto" }}>
            Built on x402 and OWS standards to ensure sub-second reliability
            and trustless coordination between machines.
          </p>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
          gap: "16px"
        }}>
          {features.map(f => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* ── Code example ── */}
      <section style={{
        maxWidth: "900px", margin: "0 auto",
        padding: "0 24px 80px"
      }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{
            fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 700,
            letterSpacing: "-0.03em", marginBottom: "10px"
          }}>
            Standardized Discovery Protocol
          </h2>
          <p style={{ fontSize: "15px", color: "#6b6b7e" }}>
            Agents interact with the registry via simple REST calls or on-chain events.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <CodeBlock
            label="Service Discovery Logic"
            code={`// Filter by performance benchmarks
const services = await fetch(
  "https://registry.x402.dev/api/services?category=ai&minUptime=0.99&maxPrice=0.005"
).then(r => r.json());

const provider = services[0];
console.log(\`Discovering \${provider.name} with \${provider.stake} USDC backing.\`);`}
          />
          <CodeBlock
            label="Atomic Micro-Payment Call"
            code={`// Execute x402-gated call through OWS wallet
const { result, payment } = await agentWallet.call({
  recipient: provider.address,
  action: "generate_embeddings",
  value: provider.price_per_call,
  currency: "USDC"
});

// Settlement happens in <500ms via OWS Micropayment Channels`}
          />
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{
        borderTop: "1px solid #1a1a22",
        background: "radial-gradient(circle at center, #111116 0%, #0a0a0b 100%)",
        padding: "100px 24px",
        textAlign: "center"
      }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "12px",
          background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "24px", margin: "0 auto 24px"
        }}>⬡</div>
        <h2 style={{
          fontSize: "clamp(28px, 6vw, 44px)", fontWeight: 700,
          letterSpacing: "-0.04em", marginBottom: "16px", lineHeight: 1.1
        }}>
          Join the permissionless<br />agent service layer
        </h2>
        <p style={{
          fontSize: "16px", color: "#6b6b7e", maxWidth: "480px",
          margin: "0 auto 40px", lineHeight: 1.7
        }}>
          The Vortex402 Registry is completely open source and permissionless.
          Deploy your agentic service and start earning USDC today.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/register")} style={{
            padding: "16px 40px", borderRadius: "12px", width: "230px",
            background: "#6366f1", border: "none",
            color: "#fff", fontSize: "16px", fontWeight: 600,
            cursor: "pointer", boxShadow: "0 8px 30px rgba(99,102,241,0.3)"
          }}>
            Become a Provider
          </button>
          <button onClick={() => navigate("/discover")} style={{
            padding: "16px 40px", borderRadius: "12px", width: "230px",
            background: "none", border: "1px solid #2a2a35",
            color: "#8b8b9e", fontSize: "16px", fontWeight: 500,
            cursor: "pointer"
          }}>
            Browse Registry
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid #1a1a22",
        padding: "40px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
        background: "#0a0a0b"
      }}>
        <div style={{ display: "flex", gap: "24px" }}>
          <a href="https://sepolia.basescan.org" target="_blank" rel="noopener"
            style={{ fontSize: "12px", color: "#4a4a5a", textDecoration: "none", fontWeight: 500 }}>
            BaseScan ↗
          </a>
          <a href="https://hackathon.openwallet.sh" target="_blank" rel="noopener"
            style={{ fontSize: "12px", color: "#4a4a5a", textDecoration: "none", fontWeight: 500 }}>
             OWS Hackathon ↗
          </a>
          <a href="https://developer.base.org" target="_blank" rel="noopener"
            style={{ fontSize: "12px", color: "#4a4a5a", textDecoration: "none", fontWeight: 500 }}>
             Base Devs ↗
          </a>
        </div>
        <div style={{ fontSize: "12px", fontFamily: "monospace", color: "#2a2a35", textAlign: "center" }}>
          © 2026 VORTEX402 UNIVERSAL REGISTRY · BUILT FOR THE OWS GRAND PRIZE
        </div>
      </footer>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .desktop-only { display: none; }
        @media (min-width: 768px) {
          .desktop-only { display: block; }
        }
      `}</style>
    </div>
  );
}
