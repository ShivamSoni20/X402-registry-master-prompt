import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("\n🚀 Deploying x402 Registry Staking Contract...\n");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log("  Deployer:", deployer.address);
  console.log("  Balance: ", ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    console.error("\n❌ Wallet has no ETH. Get free testnet ETH from:");
    console.error("   https://www.coinbase.com/faucets/base-ethereum-goerli-faucet");
    process.exit(1);
  }

  const RegistryStaking = await ethers.getContractFactory("RegistryStaking");
  
  console.log("\n  Deploying...");
  const contract = await RegistryStaking.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();
  const receipt = await deployTx.wait();

  console.log("\n✅ Contract deployed successfully!");
  console.log("  Address:    ", contractAddress);
  console.log("  Tx Hash:    ", receipt.hash);
  console.log("  Block:      ", receipt.blockNumber);
  console.log("  Gas Used:   ", receipt.gasUsed.toString());
  console.log("  Explorer:    https://sepolia.basescan.org/address/" + contractAddress);

  // Write to contractConfig.json (read by frontend)
  const configPath = path.join(__dirname, "../src/lib/contractConfig.json");
  const config = {
    contractAddress,
    network: "base-sepolia",
    chainId: 84532,
    rpcUrl: "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("\n  📄 Config saved to src/lib/contractConfig.json");

  // Write contract address to .env
  const envPath = path.join(__dirname, "../.env");
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  
  if (envContent.includes("VITE_CONTRACT_ADDRESS=")) {
    envContent = envContent.replace(
      /VITE_CONTRACT_ADDRESS=.*/,
      `VITE_CONTRACT_ADDRESS=${contractAddress}`
    );
  } else {
    envContent += `\nVITE_CONTRACT_ADDRESS=${contractAddress}`;
  }
  fs.writeFileSync(envPath, envContent);
  console.log("  📄 Contract address written to .env");

  // Write to server config too (must use module.exports for server, or use ESM)
  // Let's assume the server is ESM too if it's part of the same project.
  // BUT the instructions said module.exports for server.
  const serverConfigPath = path.join(__dirname, "../server/contractAddress.js");
  fs.writeFileSync(serverConfigPath, 
    `export const CONTRACT_ADDRESS = "${contractAddress}";\nexport const CHAIN_ID = 84532;\n`
  );
  console.log("  📄 Server config updated");

  console.log("\n🎉 Deployment complete! Restart your dev server.\n");
}

main().catch((err) => {
  console.error("\n❌ Deployment failed:", err.message);
  process.exit(1);
});
