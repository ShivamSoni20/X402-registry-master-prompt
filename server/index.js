import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import db from './db.js';
import {
  generateAddress,
  generateTxHash,
  stakeDeposit,
  executeX402Payment,
  executeSlash,
  calculateUptime,
  generateMockResponse,
} from './mockChain.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ─── GET /api/services ──────────────────────────────────────────────────────────

app.get('/api/services', (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let sql = 'SELECT * FROM services WHERE is_active = 1';
    const params = [];

    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ? OR tags LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    switch (sort) {
      case 'price_asc':
        sql += ' ORDER BY price_per_call ASC';
        break;
      case 'price_desc':
        sql += ' ORDER BY price_per_call DESC';
        break;
      case 'uptime':
        sql += ' ORDER BY current_uptime DESC';
        break;
      case 'calls':
        sql += ' ORDER BY total_calls DESC';
        break;
      case 'newest':
        sql += ' ORDER BY created_at DESC';
        break;
      case 'stake':
        sql += ' ORDER BY stake_amount DESC';
        break;
      default:
        sql += ' ORDER BY total_calls DESC';
    }

    const services = db.prepare(sql).all(...params);
    res.json(services);
  } catch (err) {
    console.error('GET /api/services error:', err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// ─── GET /api/services/:id ──────────────────────────────────────────────────────

app.get('/api/services/:id', (req, res) => {
  try {
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    const recentCalls = db.prepare(
      'SELECT * FROM call_log WHERE service_id = ? ORDER BY timestamp DESC LIMIT 20'
    ).all(req.params.id);

    const slashEvents = db.prepare(
      'SELECT * FROM slash_events WHERE service_id = ? ORDER BY timestamp DESC'
    ).all(req.params.id);

    res.json({ ...service, recentCalls, slashEvents });
  } catch (err) {
    console.error('GET /api/services/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// ─── POST /api/services ─────────────────────────────────────────────────────────

app.post('/api/services', (req, res) => {
  try {
    const { name, description, category, endpoint_url, price_per_call, sla_uptime_target, tags, stake_amount } = req.body;

    if (!name || !description || !category || !endpoint_url || !price_per_call || !sla_uptime_target || stake_amount == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (stake_amount < 100) {
      return res.status(400).json({ error: 'Minimum stake is 100 USDC' });
    }

    const validCategories = ['data', 'compute', 'ai', 'storage', 'oracle', 'communication'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const id = uuidv4();
    const providerAddress = generateAddress();
    const stakingTx = stakeDeposit(providerAddress, stake_amount);

    db.prepare(`
      INSERT INTO services (id, name, description, category, provider_address, endpoint_url,
        price_per_call, stake_amount, sla_uptime_target, current_uptime, total_calls,
        successful_calls, consistency_score, tags, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1.0, 0, 0, 1.0, ?, 1)
    `).run(
      id, name, description, category, providerAddress, endpoint_url,
      price_per_call, stake_amount, sla_uptime_target, JSON.stringify(tags || [])
    );

    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
    res.status(201).json({ service, stakingTx });
  } catch (err) {
    console.error('POST /api/services error:', err);
    res.status(500).json({ error: 'Failed to register service' });
  }
});

// ─── POST /api/services/:id/call ────────────────────────────────────────────────

app.post('/api/services/:id/call', (req, res) => {
  try {
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    const callerAddress = req.body.caller_address || generateAddress();
    const paymentTx = executeX402Payment(callerAddress, service.id, service.price_per_call);

    // Determine call success based on service uptime probability
    const success = Math.random() < service.current_uptime;
    const latency = Math.floor(30 + Math.random() * 470);

    const callId = uuidv4();
    db.prepare(`
      INSERT INTO call_log (id, service_id, caller_address, amount_paid, success, latency_ms, tx_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(callId, service.id, callerAddress, service.price_per_call, success ? 1 : 0, latency, paymentTx.txHash);

    // Update service stats
    db.prepare(`
      UPDATE services SET
        total_calls = total_calls + 1,
        successful_calls = successful_calls + CASE WHEN ? THEN 1 ELSE 0 END,
        current_uptime = CAST(successful_calls + CASE WHEN ? THEN 1 ELSE 0 END AS REAL) / (total_calls + 1)
      WHERE id = ?
    `).run(success ? 1 : 0, success ? 1 : 0, service.id);

    // Check for SLA breach
    let slashEvent = null;
    if (!success) {
      const updatedService = db.prepare('SELECT * FROM services WHERE id = ?').get(service.id);
      if (updatedService.current_uptime < updatedService.sla_uptime_target) {
        // Auto-slash for SLA breach
        const slash = executeSlash(service.id, updatedService.stake_amount, '0x' + '0'.repeat(40));
        const slashId = uuidv4();
        db.prepare(`
          INSERT INTO slash_events (id, service_id, reason, amount_slashed, challenger_address, challenger_reward, resolved)
          VALUES (?, ?, 'uptime_below_sla', ?, ?, ?, 0)
        `).run(slashId, service.id, slash.slashedAmount, slash.challengerAddress, slash.challengerReward);

        db.prepare('UPDATE services SET stake_amount = ? WHERE id = ?')
          .run(slash.remainingStake, service.id);

        slashEvent = { id: slashId, ...slash };
      }
    }

    // Generate mock response data
    const mockResult = success ? generateMockResponse(service) : null;

    res.json({
      success,
      callId,
      result: mockResult,
      txHash: paymentTx.txHash,
      latencyMs: latency,
      amountPaid: service.price_per_call,
      payment: paymentTx,
      slashEvent,
    });
  } catch (err) {
    console.error('POST /api/services/:id/call error:', err);
    res.status(500).json({ error: 'Failed to execute service call' });
  }
});

// ─── GET /api/stats ─────────────────────────────────────────────────────────────

app.get('/api/stats', (req, res) => {
  try {
    const totalServices = db.prepare('SELECT COUNT(*) as count FROM services WHERE is_active = 1').get().count;
    const totalCalls = db.prepare('SELECT SUM(total_calls) as total FROM services').get().total || 0;
    const totalVolume = db.prepare('SELECT SUM(total_calls * price_per_call) as volume FROM services').get().volume || 0;
    const totalStaked = db.prepare('SELECT SUM(stake_amount) as staked FROM services WHERE is_active = 1').get().staked || 0;

    const categoryCounts = db.prepare(
      'SELECT category, COUNT(*) as count FROM services WHERE is_active = 1 GROUP BY category'
    ).all();

    const topServices = db.prepare(
      'SELECT id, name, category, total_calls, current_uptime, price_per_call FROM services WHERE is_active = 1 ORDER BY total_calls DESC LIMIT 3'
    ).all();

    const recentActivity = db.prepare(`
      SELECT cl.*, s.name as service_name, s.category
      FROM call_log cl
      JOIN services s ON cl.service_id = s.id
      ORDER BY cl.timestamp DESC
      LIMIT 10
    `).all();

    // Generate mock hourly call data for charts
    const hourlyData = [];
    const now = Date.now();
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now - i * 3600000);
      const calls = Math.floor(200 + Math.random() * 800 + (24 - i) * 30);
      hourlyData.push({
        hour: hour.toISOString().slice(11, 16),
        calls,
        volume: parseFloat((calls * 0.008).toFixed(2)),
      });
    }

    // Category call distribution
    const categoryCallData = db.prepare(`
      SELECT category, SUM(total_calls) as calls, SUM(total_calls * price_per_call) as volume
      FROM services WHERE is_active = 1 GROUP BY category
    `).all();

    res.json({
      totalServices,
      totalCalls,
      totalVolume: parseFloat(totalVolume.toFixed(2)),
      totalStaked: parseFloat(totalStaked.toFixed(2)),
      categoryCounts,
      topServices,
      recentActivity,
      hourlyData,
      categoryCallData,
    });
  } catch (err) {
    console.error('GET /api/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─── GET /api/slash-events ──────────────────────────────────────────────────────

app.get('/api/slash-events', (req, res) => {
  try {
    const events = db.prepare(`
      SELECT se.*, s.name as service_name, s.category
      FROM slash_events se
      JOIN services s ON se.service_id = s.id
      ORDER BY se.timestamp DESC
    `).all();
    res.json(events);
  } catch (err) {
    console.error('GET /api/slash-events error:', err);
    res.status(500).json({ error: 'Failed to fetch slash events' });
  }
});

// ─── POST /api/slash/:id ────────────────────────────────────────────────────────

app.post('/api/slash/:id', (req, res) => {
  try {
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    const { challenger_address, reason } = req.body;
    if (!challenger_address || !reason) {
      return res.status(400).json({ error: 'Missing challenger_address or reason' });
    }

    const validReasons = ['uptime_below_sla', 'consistency_failure', 'nonresponsive'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Invalid reason' });
    }

    // Check if uptime is actually below SLA
    if (reason === 'uptime_below_sla' && service.current_uptime >= service.sla_uptime_target) {
      return res.status(400).json({ error: 'Service uptime meets SLA target — challenge rejected' });
    }

    const slash = executeSlash(service.id, service.stake_amount, challenger_address);
    const slashId = uuidv4();

    db.prepare(`
      INSERT INTO slash_events (id, service_id, reason, amount_slashed, challenger_address, challenger_reward, resolved)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(slashId, service.id, reason, slash.slashedAmount, challenger_address, slash.challengerReward);

    db.prepare('UPDATE services SET stake_amount = ? WHERE id = ?')
      .run(slash.remainingStake, service.id);

    res.json({ id: slashId, ...slash, reason, service_name: service.name });
  } catch (err) {
    console.error('POST /api/slash/:id error:', err);
    res.status(500).json({ error: 'Failed to execute slash' });
  }
});

// ─── GET /api/categories ────────────────────────────────────────────────────────

app.get('/api/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT category, COUNT(*) as count, SUM(total_calls) as total_calls, AVG(current_uptime) as avg_uptime
      FROM services WHERE is_active = 1 GROUP BY category ORDER BY count DESC
    `).all();
    res.json(categories);
  } catch (err) {
    console.error('GET /api/categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ─── Start Server ───────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 x402 Registry API running at http://localhost:${PORT}`);
  console.log(`📊 Dashboard stats: http://localhost:${PORT}/api/stats`);
  console.log(`🔍 Services list:   http://localhost:${PORT}/api/services\n`);
});
