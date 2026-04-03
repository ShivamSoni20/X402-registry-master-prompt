import { useWallet } from "../hooks/useWallet";
import { walletStore } from "../lib/walletStore";

export default function WalletButton({ size = "md", showBalance = false }) {
  const { address, isConnected, isConnecting, error, shortAddress, isWrongNetwork, connect, disconnect } = useWallet();

  const sizes = {
    sm: { padding: "5px 10px", fontSize: "11px", height: "30px" },
    md: { padding: "8px 14px", fontSize: "12px", height: "36px" },
    lg: { padding: "12px 20px", fontSize: "14px", height: "44px" },
  };

  const s = sizes[size];

  if (isConnecting) {
    return (
      <button disabled style={{
        ...s, borderRadius: "8px", border: "1px solid #2a2a35",
        background: "#1a1a1f", color: "#8b8b9e",
        fontFamily: "monospace", cursor: "wait", display: "flex",
        alignItems: "center", gap: "6px"
      }}>
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6366f1",
          animation: "pulse 1s infinite" }} />
        Connecting...
      </button>
    );
  }

  if (isWrongNetwork) {
    return (
      <button onClick={() => walletStore.connect()} style={{
        ...s, borderRadius: "8px",
        border: "1px solid rgba(245,158,11,0.4)",
        background: "rgba(245,158,11,0.08)", color: "#f59e0b",
        fontFamily: "monospace", cursor: "pointer"
      }}>
        ⚠ Wrong Network
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div style={{
          ...s, borderRadius: "8px",
          border: "1px solid rgba(16,185,129,0.3)",
          background: "rgba(16,185,129,0.08)",
          color: "#10b981", fontFamily: "monospace",
          display: "flex", alignItems: "center", gap: "6px"
        }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%",
            background: "#10b981", flexShrink: 0 }} />
          {shortAddress}
        </div>
        <button onClick={disconnect} title="Disconnect" style={{
          padding: "6px", borderRadius: "6px", border: "1px solid #2a2a35",
          background: "none", color: "#8b8b9e", cursor: "pointer", fontSize: "12px"
        }}>✕</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={connect} style={{
        ...s, borderRadius: "8px",
        border: "1px solid rgba(99,102,241,0.4)",
        background: "rgba(99,102,241,0.1)", color: "#6366f1",
        fontFamily: "monospace", cursor: "pointer",
        display: "flex", alignItems: "center", gap: "6px",
        transition: "all 0.15s"
      }}
        onMouseOver={e => e.currentTarget.style.background = "rgba(99,102,241,0.2)"}
        onMouseOut={e => e.currentTarget.style.background = "rgba(99,102,241,0.1)"}
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M2 9h16" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="15" cy="13" r="1.5" fill="currentColor"/>
        </svg>
        Connect Wallet
      </button>
      {error && (
        <div style={{
          fontSize: "11px", color: "#ef4444", marginTop: "4px",
          maxWidth: "200px", lineHeight: 1.4
        }}>{error}</div>
      )}
    </div>
  );
}
