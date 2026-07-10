const crypto = require('crypto');

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function requiredEnv(name, aliases = []) {
  const names = [name, ...aliases];
  for (const key of names) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  throw new Error(`Variável de ambiente ausente: ${name}`);
}

function optionalEnv(name) {
  return process.env[name] || '';
}

async function supabaseRequest(path, options = {}) {
  const base = requiredEnv('SUPABASE_URL').replace(/\/$/, '');
  const key = requiredEnv('SUPABASE_SERVICE_ROLE_KEY', ['SUPABASE_SERVICE_KEY', 'SUPABASE_SECRET_KEY']);
  const response = await fetch(`${base}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const message = data?.message || data?.hint || data?.details || `Erro Supabase ${response.status}`;
    throw new Error(message);
  }
  return data;
}

function parseBody(req) {
  if (typeof req.body === 'object' && req.body !== null) return req.body;
  try { return JSON.parse(req.body || '{}'); } catch { return {}; }
}

function requestBaseUrl(req) {
  const configured = optionalEnv('SITE_URL').replace(/\/$/, '');
  if (configured) return configured;
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  if (!host) throw new Error('Não foi possível identificar a URL pública do site. Configure SITE_URL no Vercel.');
  return `${proto}://${host}`;
}

function validateWebhookSignature(req, dataId) {
  const secret = optionalEnv('MP_WEBHOOK_SECRET');
  if (!secret) return { valid: true, configured: false };
  const signature = String(req.headers['x-signature'] || '');
  const requestId = String(req.headers['x-request-id'] || '');
  const parts = {};
  for (const part of signature.split(',')) {
    const [key, ...rest] = part.trim().split('=');
    if (key && rest.length) parts[key] = rest.join('=');
  }
  if (!parts.ts || !parts.v1 || !requestId || !dataId) return { valid: false, configured: true };
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(parts.v1, 'utf8');
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
  return { valid, configured: true };
}

module.exports = {
  json,
  requiredEnv,
  optionalEnv,
  supabaseRequest,
  parseBody,
  requestBaseUrl,
  validateWebhookSignature
};
