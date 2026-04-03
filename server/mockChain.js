// ─── Mock Blockchain / OWS Wallet / x402 Simulation ────────────────────────

function randomHex(len) {
  const chars = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * 16)];
  return s;
}

export function generateAddress() {
  return '0x' + randomHex(40);
}

export function generateTxHash() {
  return '0x' + randomHex(64);
}

let blockNumber = 19_200_000 + Math.floor(Math.random() * 100_000);

function nextBlock() {
  blockNumber += Math.floor(Math.random() * 3) + 1;
  return blockNumber;
}

/**
 * Simulate staking deposit transaction
 */
export function stakeDeposit(address, amount) {
  return {
    txHash: generateTxHash(),
    blockNumber: nextBlock(),
    timestamp: new Date().toISOString(),
    status: 'confirmed',
    from: address,
    to: '0x' + 'f'.repeat(40), // Registry staking contract
    value: amount,
    gasUsed: 47_000 + Math.floor(Math.random() * 10_000),
    effectiveGasPrice: '0.000000025',
  };
}

/**
 * Simulate x402 micropayment
 */
export function executeX402Payment(callerAddress, serviceId, amount) {
  const success = Math.random() > 0.005; // 99.5% payment success
  return {
    txHash: generateTxHash(),
    blockNumber: nextBlock(),
    status: success ? 'confirmed' : 'failed',
    from: callerAddress,
    amount,
    serviceId,
    gasUsed: 21_000 + Math.floor(Math.random() * 5_000),
    effectiveGasPrice: '0.000000018',
    protocol: 'x402',
    paymentChannel: 'OWS-Micropayment-v1',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Simulate slash execution
 */
export function executeSlash(serviceId, amount, challengerAddress) {
  const slashedAmount = parseFloat((amount * 0.1).toFixed(6));
  const challengerReward = parseFloat((slashedAmount * 0.5).toFixed(6));

  return {
    txHash: generateTxHash(),
    blockNumber: nextBlock(),
    status: 'confirmed',
    serviceId,
    slashedAmount,
    challengerAddress,
    challengerReward,
    remainingStake: parseFloat((amount - slashedAmount).toFixed(6)),
    gasUsed: 65_000 + Math.floor(Math.random() * 15_000),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculate simulated uptime from call log
 */
export function calculateUptime(db, serviceId, windowHours = 24) {
  const since = new Date(Date.now() - windowHours * 3600000).toISOString();
  const row = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successes
    FROM call_log
    WHERE service_id = ? AND timestamp >= ?
  `).get(serviceId, since);

  if (!row || row.total === 0) return 1.0;
  return parseFloat((row.successes / row.total).toFixed(6));
}

/**
 * Generate mock API response based on service category
 */
export function generateMockResponse(service) {
  const responses = {
    data: {
      data: {
        zipCode: '94102',
        medianPrice: 1_245_000,
        pricePerSqft: 892,
        daysOnMarket: 18,
        trend: 'appreciating',
        confidence: 0.94,
        lastUpdated: new Date().toISOString(),
      },
    },
    compute: {
      result: {
        proofHash: generateTxHash(),
        verificationKey: '0x' + randomHex(128),
        proofSize: '1.2KB',
        computeTimeMs: 1247,
        circuitConstraints: 65536,
        status: 'verified',
      },
    },
    ai: {
      result: {
        query: 'decentralized identity verification',
        matches: [
          { id: 'doc_001', score: 0.967, title: 'Self-Sovereign Identity Framework', snippet: 'A comprehensive approach to...' },
          { id: 'doc_002', score: 0.934, title: 'DID Methods Comparison', snippet: 'Evaluating did:web, did:key...' },
          { id: 'doc_003', score: 0.912, title: 'Verifiable Credentials Spec', snippet: 'W3C standard for portable...' },
        ],
        totalResults: 2847,
        processingTimeMs: 42,
      },
    },
    storage: {
      result: {
        cid: 'bafybeig' + randomHex(50),
        size: 4_812_345,
        deals: [
          { miner: 'f0' + Math.floor(Math.random() * 99999), status: 'active', expiry: '2027-03-15' },
          { miner: 'f0' + Math.floor(Math.random() * 99999), status: 'active', expiry: '2027-06-22' },
        ],
        redundancy: 3,
        retrievalUrl: 'https://dweb.link/ipfs/bafy...',
      },
    },
    oracle: {
      result: {
        pair: 'ETH/USD',
        price: 3847.52 + (Math.random() * 100 - 50),
        volume24h: 18_432_000_000,
        change24h: (Math.random() * 10 - 5).toFixed(2) + '%',
        sources: 42,
        lastBlock: blockNumber,
        confidence: 0.998,
        timestamp: new Date().toISOString(),
      },
    },
    communication: {
      result: {
        messageId: 'msg_' + randomHex(16),
        status: 'delivered',
        recipient: generateAddress(),
        encryptionProtocol: 'x25519-xsalsa20-poly1305',
        deliveryTimeMs: 120,
        read: false,
        timestamp: new Date().toISOString(),
      },
    },
  };

  return responses[service.category] || responses.data;
}
