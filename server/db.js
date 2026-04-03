import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'registry.db');
const isVercel = process.env.VERCEL === '1';
const db = isVercel ? new Database(':memory:') : new Database(dbPath);

if (!isVercel) {
  db.pragma('journal_mode = WAL');
}
db.pragma('foreign_keys = ON');

// ─── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('data','compute','ai','storage','oracle','communication')),
    provider_address TEXT NOT NULL,
    endpoint_url TEXT NOT NULL,
    price_per_call REAL NOT NULL,
    stake_amount REAL NOT NULL,
    sla_uptime_target REAL NOT NULL,
    current_uptime REAL NOT NULL DEFAULT 1.0,
    total_calls INTEGER NOT NULL DEFAULT 0,
    successful_calls INTEGER NOT NULL DEFAULT 0,
    consistency_score REAL NOT NULL DEFAULT 1.0,
    tags TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_active BOOLEAN NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS call_log (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL,
    caller_address TEXT NOT NULL,
    amount_paid REAL NOT NULL,
    success BOOLEAN NOT NULL,
    latency_ms INTEGER NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    tx_hash TEXT NOT NULL,
    FOREIGN KEY (service_id) REFERENCES services(id)
  );

  CREATE TABLE IF NOT EXISTS slash_events (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL,
    reason TEXT NOT NULL CHECK(reason IN ('uptime_below_sla','consistency_failure','nonresponsive')),
    amount_slashed REAL NOT NULL,
    challenger_address TEXT NOT NULL,
    challenger_reward REAL NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    resolved BOOLEAN NOT NULL DEFAULT 0,
    FOREIGN KEY (service_id) REFERENCES services(id)
  );

  CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
  CREATE INDEX IF NOT EXISTS idx_call_log_service ON call_log(service_id);
  CREATE INDEX IF NOT EXISTS idx_call_log_timestamp ON call_log(timestamp);
  CREATE INDEX IF NOT EXISTS idx_slash_service ON slash_events(service_id);
`);

// ─── Helpers ────────────────────────────────────────────────────────────────────

function randomHex(len) {
  const chars = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * 16)];
  return s;
}

function genAddress() {
  return '0x' + randomHex(40);
}

function genTxHash() {
  return '0x' + randomHex(64);
}

// ─── Seed Data ──────────────────────────────────────────────────────────────────

function seedDatabase() {
  const count = db.prepare('SELECT COUNT(*) as c FROM services').get();
  if (count.c > 0) return;

  const services = [
    {
      name: 'Real Estate Pulse',
      description: 'Live property valuation feeds aggregating MLS, Zillow, and county records. Returns median price, price-per-sqft, days-on-market, and trend vectors for any US zip code. Updated every 15 minutes with 99.2% historical accuracy.',
      category: 'data',
      price_per_call: 0.005,
      sla_uptime_target: 0.992,
      current_uptime: 0.994,
      stake_amount: 500,
      total_calls: 87432,
      tags: ['real-estate', 'valuation', 'mls', 'zillow'],
      endpoint_url: 'https://api.realestatepulse.io/v2/valuation',
    },
    {
      name: 'Patent Intelligence Feed',
      description: 'Full-text patent search across USPTO, EPO, and WIPO databases. Returns patent abstracts, claims, citation graphs, and prior-art similarity scores. Covers 140M+ patent documents with semantic vector search.',
      category: 'data',
      price_per_call: 0.01,
      sla_uptime_target: 0.988,
      current_uptime: 0.991,
      stake_amount: 300,
      total_calls: 34218,
      tags: ['patents', 'ip', 'search', 'legal'],
      endpoint_url: 'https://api.patentiq.dev/v1/search',
    },
    {
      name: 'ZK Proof Generator',
      description: 'On-demand zero-knowledge proof generation for Groth16 and PLONK circuits. Supports custom R1CS inputs up to 2^20 constraints. Average proof time: 1.2s for standard circuits, 4.8s for complex ones.',
      category: 'compute',
      price_per_call: 0.50,
      sla_uptime_target: 0.995,
      current_uptime: 0.997,
      stake_amount: 2000,
      total_calls: 12876,
      tags: ['zk-proofs', 'groth16', 'plonk', 'cryptography'],
      endpoint_url: 'https://zk.computelab.xyz/v1/prove',
    },
    {
      name: 'Video Transcoder',
      description: 'Hardware-accelerated video transcoding supporting H.264, H.265, VP9, and AV1 codecs. Handles resolutions up to 8K with adaptive bitrate ladder generation. Includes thumbnail extraction and scene detection.',
      category: 'compute',
      price_per_call: 0.10,
      sla_uptime_target: 0.97,
      current_uptime: 0.973,
      stake_amount: 800,
      total_calls: 45623,
      tags: ['video', 'transcoding', 'media', 'av1'],
      endpoint_url: 'https://transcode.mediapipe.cloud/v2/jobs',
    },
    {
      name: 'Semantic Search Engine',
      description: 'Enterprise-grade semantic search powered by fine-tuned embedding models. Indexes and queries unstructured text with 99.8% recall@10. Supports 95 languages with automatic language detection and cross-lingual retrieval.',
      category: 'ai',
      price_per_call: 0.003,
      sla_uptime_target: 0.998,
      current_uptime: 0.999,
      stake_amount: 1500,
      total_calls: 148293,
      tags: ['nlp', 'embeddings', 'search', 'multilingual'],
      endpoint_url: 'https://api.semantiq.ai/v3/search',
    },
    {
      name: 'Sentiment Analyzer',
      description: 'Real-time sentiment analysis for social media, reviews, and financial news. Returns polarity (-1 to 1), emotion labels, aspect-based sentiment, and confidence intervals. Processes up to 10K tokens per request.',
      category: 'ai',
      price_per_call: 0.001,
      sla_uptime_target: 0.999,
      current_uptime: 0.9995,
      stake_amount: 1000,
      total_calls: 132456,
      tags: ['sentiment', 'nlp', 'social-media', 'finance'],
      endpoint_url: 'https://sentiment.neuralhub.io/v2/analyze',
    },
    {
      name: 'Filecoin Pinning Service',
      description: 'Pin files permanently to Filecoin with verified storage deals. Supports CARv2 archives up to 32GB. Includes retrieval guarantees with 3x redundancy across geographically distributed storage providers.',
      category: 'storage',
      price_per_call: 0.002,
      sla_uptime_target: 0.991,
      current_uptime: 0.993,
      stake_amount: 600,
      total_calls: 67841,
      tags: ['filecoin', 'ipfs', 'pinning', 'storage-deals'],
      endpoint_url: 'https://pin.filvault.storage/v1/pin',
    },
    {
      name: 'IPFS Gateway Pro',
      description: 'High-performance IPFS gateway with global CDN edge caching. Sub-100ms TTFB for hot content, automatic CID resolution, and ENS/DNSLink support. Includes bandwidth analytics and rate-limiting per API key.',
      category: 'storage',
      price_per_call: 0.0005,
      sla_uptime_target: 0.985,
      current_uptime: 0.988,
      stake_amount: 200,
      total_calls: 98234,
      tags: ['ipfs', 'gateway', 'cdn', 'web3'],
      endpoint_url: 'https://gw.ipfspro.io/v1/cat',
    },
    {
      name: 'Cross-Chain Price Feed',
      description: 'Aggregated price oracles across 12 chains (ETH, BTC, SOL, AVAX, etc.) with volume-weighted averages from 40+ DEX and CEX sources. Includes historical OHLCV data, volatility indices, and anomaly detection alerts.',
      category: 'oracle',
      price_per_call: 0.008,
      sla_uptime_target: 0.997,
      current_uptime: 0.998,
      stake_amount: 5000,
      total_calls: 112876,
      tags: ['price-feed', 'cross-chain', 'defi', 'oracle'],
      endpoint_url: 'https://oracle.chainlink.plus/v2/prices',
    },
    {
      name: 'Sports Results Oracle',
      description: 'Real-time and historical sports data covering 200+ leagues worldwide. Returns live scores, player stats, odds movements, and settlement data for prediction markets. Official data partnerships with major leagues.',
      category: 'oracle',
      price_per_call: 0.004,
      sla_uptime_target: 0.982,
      current_uptime: 0.985,
      stake_amount: 400,
      total_calls: 56432,
      tags: ['sports', 'live-scores', 'prediction-markets', 'odds'],
      endpoint_url: 'https://oracle.sportsdata.xyz/v1/results',
    },
    {
      name: 'XMTP Message Relay',
      description: 'Decentralized messaging relay built on XMTP protocol. Enables agent-to-agent and agent-to-human encrypted communication. Supports group messaging, read receipts, attachments up to 25MB, and webhook notifications.',
      category: 'communication',
      price_per_call: 0.0002,
      sla_uptime_target: 0.9995,
      current_uptime: 0.9997,
      stake_amount: 800,
      total_calls: 143218,
      tags: ['xmtp', 'messaging', 'encrypted', 'web3'],
      endpoint_url: 'https://relay.xmtp.chat/v2/send',
    },
    {
      name: 'Email Delivery API',
      description: 'Transactional email delivery with 99.3% inbox placement rate. Supports DKIM, SPF, DMARC authentication. Includes template rendering, A/B testing, and real-time delivery webhooks. Handles 100K emails/hour per account.',
      category: 'communication',
      price_per_call: 0.005,
      sla_uptime_target: 0.993,
      current_uptime: 0.995,
      stake_amount: 300,
      total_calls: 78432,
      tags: ['email', 'transactional', 'smtp', 'delivery'],
      endpoint_url: 'https://api.mailpulse.io/v1/send',
    },
  ];

  const insertService = db.prepare(`
    INSERT INTO services (id, name, description, category, provider_address, endpoint_url, price_per_call,
      stake_amount, sla_uptime_target, current_uptime, total_calls, successful_calls, consistency_score, tags, created_at, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const insertCall = db.prepare(`
    INSERT INTO call_log (id, service_id, caller_address, amount_paid, success, latency_ms, timestamp, tx_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSlash = db.prepare(`
    INSERT INTO slash_events (id, service_id, reason, amount_slashed, challenger_address, challenger_reward, timestamp, resolved)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seedTx = db.transaction(() => {
    const now = Date.now();

    for (const svc of services) {
      const id = uuidv4();
      const successfulCalls = Math.floor(svc.total_calls * svc.current_uptime);
      const consistency = (0.85 + Math.random() * 0.14).toFixed(4);
      const daysAgo = Math.floor(Math.random() * 30) + 5;
      const createdAt = new Date(now - daysAgo * 86400000).toISOString();

      insertService.run(
        id, svc.name, svc.description, svc.category, genAddress(), svc.endpoint_url,
        svc.price_per_call, svc.stake_amount, svc.sla_uptime_target, svc.current_uptime,
        svc.total_calls, successfulCalls, parseFloat(consistency), JSON.stringify(svc.tags),
        createdAt
      );

      // Seed recent call logs (last 20 calls per service)
      for (let i = 0; i < 20; i++) {
        const callTime = new Date(now - Math.random() * 86400000 * 3).toISOString();
        const success = Math.random() < svc.current_uptime;
        const latency = Math.floor(50 + Math.random() * 450);
        insertCall.run(
          uuidv4(), id, genAddress(), svc.price_per_call, success ? 1 : 0,
          latency, callTime, genTxHash()
        );
      }
    }

    // Seed a few slash events
    const allServices = db.prepare('SELECT id, name, stake_amount FROM services').all();
    const reasons = ['uptime_below_sla', 'consistency_failure', 'nonresponsive'];

    for (let i = 0; i < 5; i++) {
      const svc = allServices[Math.floor(Math.random() * allServices.length)];
      const reason = reasons[Math.floor(Math.random() * reasons.length)];
      const slashAmount = parseFloat((svc.stake_amount * 0.1).toFixed(2));
      const reward = parseFloat((slashAmount * 0.5).toFixed(2));
      const slashTime = new Date(now - Math.random() * 86400000 * 7).toISOString();

      insertSlash.run(
        uuidv4(), svc.id, reason, slashAmount, genAddress(), reward,
        slashTime, Math.random() > 0.3 ? 1 : 0
      );
    }
  });

  seedTx();
  console.log('✅ Database seeded with 12 services, call logs, and slash events.');
}

seedDatabase();

export default db;
