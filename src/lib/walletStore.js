/**
 * Wallet Store — global singleton for wallet connection state
 * Used across all components. No prop drilling. No duplicate connection logic.
 */

const listeners = new Set();
let state = {
  address: null,
  chainId: null,
  isConnected: false,
  isConnecting: false,
  error: null,
  provider: null,
  signer: null,
};

function setState(updates) {
  state = { ...state, ...updates };
  listeners.forEach(fn => fn(state));
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getState() { return state; }

const TARGET_CHAIN_ID = 84532; // Base Sepolia
const TARGET_CHAIN_HEX = "0x14a34";

const BASE_SEPOLIA_PARAMS = {
  chainId: TARGET_CHAIN_HEX,
  chainName: "Base Sepolia Testnet",
  nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://sepolia.base.org"],
  blockExplorerUrls: ["https://sepolia.basescan.org"],
};

async function switchToBaseSepolia() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: TARGET_CHAIN_HEX }],
    });
    return true;
  } catch (err) {
    if (err.code === 4902) {
      // Chain not added yet — add it
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [BASE_SEPOLIA_PARAMS],
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

async function connect() {
  if (!window.ethereum) {
    setState({ error: "No wallet detected. Please install MetaMask or Coinbase Wallet." });
    return false;
  }

  setState({ isConnecting: true, error: null });

  try {
    // Request accounts
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts"
    });

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts returned from wallet.");
    }

    // Get chain
    const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
    const chainId = parseInt(chainIdHex, 16);

    // Switch to Base Sepolia if on wrong chain
    if (chainId !== TARGET_CHAIN_ID) {
      const switched = await switchToBaseSepolia();
      if (!switched) {
        throw new Error("Please switch to Base Sepolia in your wallet.");
      }
    }

    // Build ethers provider + signer
    const { ethers } = await import("ethers");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    // Persist address
    localStorage.setItem("connectedAddress", address);

    setState({
      address,
      chainId: TARGET_CHAIN_ID,
      isConnected: true,
      isConnecting: false,
      error: null,
      provider,
      signer,
    });

    return true;
  } catch (err) {
    let message = err.message || "Connection failed";
    if (err.code === 4001) message = "Connection rejected by user.";
    setState({ isConnecting: false, error: message, isConnected: false });
    return false;
  }
}

function disconnect() {
  localStorage.removeItem("connectedAddress");
  setState({
    address: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    provider: null,
    signer: null,
  });
}

// Auto-reconnect on page load if previously connected
async function tryAutoReconnect() {
  if (!window.ethereum) return;
  const saved = localStorage.getItem("connectedAddress");
  if (!saved) return;
  
  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts && accounts[0]?.toLowerCase() === saved.toLowerCase()) {
      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
      const chainId = parseInt(chainIdHex, 16);
      
      if (chainId === TARGET_CHAIN_ID) {
        const signer = await provider.getSigner();
        setState({
          address: accounts[0],
          chainId,
          isConnected: true,
          provider,
          signer,
        });
      }
    }
  } catch { /* silent */ }
}

// Listen for wallet events
if (typeof window !== "undefined" && window.ethereum) {
  window.ethereum.on("accountsChanged", (accounts) => {
    if (accounts.length === 0) {
      disconnect();
    } else {
      setState({ address: accounts[0] });
      localStorage.setItem("connectedAddress", accounts[0]);
    }
  });

  window.ethereum.on("chainChanged", (chainIdHex) => {
    const chainId = parseInt(chainIdHex, 16);
    if (chainId !== TARGET_CHAIN_ID) {
      setState({ 
        chainId,
        error: "Please switch to Base Sepolia to use live chain features."
      });
    } else {
      setState({ chainId, error: null });
    }
  });

  window.ethereum.on("disconnect", () => {
    disconnect();
  });
}

export const walletStore = { connect, disconnect, subscribe, getState, tryAutoReconnect };
export const TARGET_CHAIN = { id: TARGET_CHAIN_ID, name: "Base Sepolia" };
