// ─── Browser-side Wallet Simulation ─────────────────────────────────────────

function randomHex(len) {
  const chars = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * 16)];
  return s;
}

export function getWalletAddress() {
  let address = localStorage.getItem('x402_wallet_address');
  if (!address) {
    address = '0x' + randomHex(40);
    localStorage.setItem('x402_wallet_address', address);
  }
  return address;
}

export function getWalletBalance() {
  let balance = localStorage.getItem('x402_wallet_balance');
  if (!balance) {
    balance = (10000 + Math.random() * 5000).toFixed(2);
    localStorage.setItem('x402_wallet_balance', balance);
  }
  return parseFloat(balance);
}

export function deductBalance(amount) {
  const current = getWalletBalance();
  const newBal = Math.max(0, current - amount);
  localStorage.setItem('x402_wallet_balance', newBal.toFixed(2));
  return newBal;
}

export function truncateAddress(address) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatUSDC(amount) {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${parseFloat(amount).toFixed(amount < 1 ? 4 : 2)}`;
}

export function formatNumber(num) {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
