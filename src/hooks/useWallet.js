import { useState, useEffect } from "react";
import { walletStore } from "../lib/walletStore";

export function useWallet() {
  const [wallet, setWallet] = useState(walletStore.getState());

  useEffect(() => {
    // Sync with store
    const unsub = walletStore.subscribe(setWallet);
    // Try to auto-reconnect
    walletStore.tryAutoReconnect();
    return unsub;
  }, []);

  return {
    ...wallet,
    connect: walletStore.connect,
    disconnect: walletStore.disconnect,
    shortAddress: wallet.address
      ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
      : null,
    isWrongNetwork: wallet.isConnected && wallet.chainId !== 84532,
  };
}
