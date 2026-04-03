const API_BASE = '/api';

async function fetchJSON(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Services ───────────────────────────────────────────────────────────────────

export function getServices(params = {}) {
  const query = new URLSearchParams();
  if (params.category) query.set('category', params.category);
  if (params.search) query.set('search', params.search);
  if (params.sort) query.set('sort', params.sort);
  const qs = query.toString();
  return fetchJSON(`/services${qs ? `?${qs}` : ''}`);
}

export function getService(id) {
  return fetchJSON(`/services/${id}`);
}

export function registerService(data) {
  return fetchJSON('/services', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function callService(id, callerAddress) {
  return fetchJSON(`/services/${id}/call`, {
    method: 'POST',
    body: JSON.stringify({ caller_address: callerAddress }),
  });
}

// ─── Stats ──────────────────────────────────────────────────────────────────────

export function getStats() {
  return fetchJSON('/stats');
}

// ─── Slash Events ───────────────────────────────────────────────────────────────

export function getSlashEvents() {
  return fetchJSON('/slash-events');
}

export function submitChallenge(serviceId, challengerAddress, reason) {
  return fetchJSON(`/slash/${serviceId}`, {
    method: 'POST',
    body: JSON.stringify({ challenger_address: challengerAddress, reason }),
  });
}

// ─── Categories ─────────────────────────────────────────────────────────────────

export function getCategories() {
  return fetchJSON('/categories');
}
