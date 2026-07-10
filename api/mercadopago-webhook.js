const { json, readJson, supabaseRequest, mercadoPagoRequest, extractPaymentId, verifyWebhook } = require('./_shared');
module.exports = async function handler(req, res) {
  if (req.method === 'GET') return json(res, 200, { ok: true, webhook: 'mercadopago', version: '56.7' });
  if (req.method !== 'POST') return json(res, 405, { ok: false });
  try {
    const body = await readJson(req);
    const paymentId = extractPaymentId(req, body);
    if (!paymentId) return json(res, 200, { ok: true, ignored: true });
    if (!verifyWebhook(req, paymentId)) return json(res, 401, { ok: false, error: 'Assinatura inválida.' });
    const payment = await mercadoPagoRequest(`/v1/payments/${encodeURIComponent(paymentId)}`);
    const orderId = String(payment.external_reference || '').trim();
    if (!orderId) return json(res, 200, { ok: true, ignored: true });
    const patch = { mp_payment_id: String(payment.id), mp_status: payment.status || 'pending', mp_status_detail: payment.status_detail || null, payment_updated_at: new Date().toISOString() };
    if (payment.status === 'approved') patch.payment_paid_at = payment.date_approved || new Date().toISOString();
    await supabaseRequest(`orders?id=eq.${encodeURIComponent(orderId)}`, { method:'PATCH', headers:{Prefer:'return=minimal'}, body:JSON.stringify(patch) });
    return json(res, 200, { ok: true });
  } catch (error) {
    console.error('mercadopago-webhook', error);
    return json(res, 500, { ok: false, error: error.message || 'Erro no webhook.' });
  }
};
