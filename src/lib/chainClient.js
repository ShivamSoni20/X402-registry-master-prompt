import { ethers } from 'ethers';
import { walletStore } from "./walletStore";
import contractConfigJson from "./contractConfig.json";

// ABI — only what the frontend needs
const ABI = [
  'function stakeAndRegister(bytes32 serviceId, uint256 slaTarget) payable',
  'function challengeService(bytes32 serviceId, uint256 reportedUptime)',
  'function unstake(bytes32 serviceId)',
  'function getStake(bytes32 serviceId) view returns (tuple(address provider, uint256 stakedAmount, uint256 stakedAt, uint256 slaUptimeTarget, bool active, uint256 slashCount))',
  'event ServiceStaked(bytes32 indexed serviceId, address indexed provider, uint256 amount)',
  'event ServiceSlashed(bytes32 indexed serviceId, address indexed challenger, uint256 slashedAmount, uint256 reward)',
];

// Convert UUID string to bytes32
export function uuidToBytes32(uuid) {
  const hex = uuid.replace(/-/g, '');
  return '0x' + hex.padEnd(64, '0');
}

// Get contract instance
async function getContract(withSigner = false) {
  const { ethers: ethersLib } = await import("ethers");
  
  if (withSigner) {
    const { signer } = walletStore.getState();
    if (!signer) throw new Error("Wallet not connected. Please connect your wallet first.");
    return new ethersLib.Contract(contractConfigJson.contractAddress, ABI, signer);
  }
  
  const provider = new ethersLib.JsonRpcProvider("https://sepolia.base.org");
  return new ethersLib.Contract(contractConfigJson.contractAddress, ABI, provider);
}

// Stake and register a service on-chain
export async function stakeOnChain(serviceId, slaUptimePercent, stakeEthAmount) {
  const contract = await getContract(true);
  const serviceIdBytes32 = uuidToBytes32(serviceId);
  const slaBasisPoints = Math.round(slaUptimePercent * 100);
  const stakeWei = ethers.parseEther(stakeEthAmount.toString());

  const tx = await contract.stakeAndRegister(serviceIdBytes32, slaBasisPoints, {
    value: stakeWei,
  });

  const receipt = await tx.wait();
  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    explorerUrl: `https://sepolia.basescan.org/tx/${receipt.hash}`,
    gasUsed: receipt.gasUsed.toString(),
  };
}

// Challenge a service on-chain
export async function challengeOnChain(serviceId, currentUptimePercent) {
  const contract = await getContract(true);
  const serviceIdBytes32 = uuidToBytes32(serviceId);
  const uptimeBasisPoints = Math.round(currentUptimePercent * 100);

  const tx = await contract.challengeService(serviceIdBytes32, uptimeBasisPoints);
  const receipt = await tx.wait();
  return {
    txHash: receipt.hash,
    explorerUrl: `https://sepolia.basescan.org/tx/${receipt.hash}`,
  };
}

// Read stake info from chain
export async function getOnChainStake(serviceId) {
  try {
    const contract = await getContract(false);
    const serviceIdBytes32 = uuidToBytes32(serviceId);
    const stake = await contract.getStake(serviceIdBytes32);
    return {
      provider: stake.provider,
      stakedAmount: ethers.formatEther(stake.stakedAmount),
      stakedAt: new Date(Number(stake.stakedAt) * 1000).toISOString(),
      slaTarget: Number(stake.slaUptimeTarget) / 100,
      active: stake.active,
      slashCount: Number(stake.slashCount),
    };
  } catch {
    return null;
  }
}

export { contractConfigJson as contractConfig };
