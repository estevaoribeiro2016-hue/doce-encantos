const crypto = require('crypto');

function env(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) throw new Error(`Variável de ambiente ausente: ${name}`);
  return String(value).trim();
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  return JSON.parse(raw);
}

async function supabaseRequest(path, options = {}) {
  const url = env('SUPABASE_URL').replace(/\/$/, '') + '/rest/v1/' + path.replace(/^\//, '');
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(url, {
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
    const message = data?.message || data?.error_description || data?.error || `Supabase HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

async function mercadoPagoRequest(path, options = {}) {
  const response = await fetch('https://api.mercadopago.com' + path, {
    ...options,
    headers: {
      Authorization: `Bearer ${env('MP_ACCESS_TOKEN')}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const causes = Array.isArray(data?.cause) ? data.cause.map(x => x.description || x.code).filter(Boolean).join('; ') : '';
    throw new Error(causes || data?.message || data?.error || `Mercado Pago HTTP ${response.status}`);
  }
  return data;
}

function siteUrl(req) {
  const configured = process.env.SITE_URL && String(process.env.SITE_URL).trim();
  if (configured) return configured.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

function firstName(name) {
  return String(name || 'Cliente').trim().split(/\s+/)[0].slice(0, 60) || 'Cliente';
}

function uuid() { return crypto.randomUUID(); }

function extractPaymentId(req, body) {
  const query = req.query || {};
  return String(body?.data?.id || body?.id || query['data.id'] || query.id || '').trim();
}

function verifyWebhook(req, paymentId) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true;
  const signature = String(req.headers['x-signature'] || '');
  const requestId = String(req.headers['x-request-id'] || '');
  const parts = Object.fromEntries(signature.split(',').map(p => p.trim().split('=').map(x => x.trim())).filter(x => x.length === 2));
  if (!parts.ts || !parts.v1 || !paymentId || !requestId) return false;
  const manifest = `id:${String(paymentId).toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1)); } catch { return false; }
}

module.exports = { env, json, readJson, supabaseRequest, mercadoPagoRequest, siteUrl, firstName, uuid, extractPaymentId, verifyWebhook };
