const { json, supabaseRequest, mercadoPagoRequest } = require('./_shared');
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Método não permitido.' });
  try {
    const orderId = String(req.query?.orderId || '').trim();
    if (!orderId) return json(res, 400, { ok: false, error: 'Pedido não informado.' });
    const rows = await supabaseRequest(`orders?id=eq.${encodeURIComponent(orderId)}&select=id,mp_payment_id,mp_status,mp_status_detail,payment_paid_at,pix_expires_at`);
    const order = Array.isArray(rows) ? rows[0] : null;
    if (!order) return json(res, 404, { ok: false, error: 'Pedido não encontrado.' });
    let status = order.mp_status || 'pending', detail = order.mp_status_detail || null;
    if (order.mp_payment_id && !['approved','cancelled','rejected','refunded','charged_back'].includes(status)) {
      const payment = await mercadoPagoRequest(`/v1/payments/${encodeURIComponent(order.mp_payment_id)}`);
      status = payment.status || status; detail = payment.status_detail || detail;
      const patch = { mp_status: status, mp_status_detail: detail, payment_updated_at: new Date().toISOString() };
      if (status === 'approved') patch.payment_paid_at = payment.date_approved || new Date().toISOString();
      await supabaseRequest(`orders?id=eq.${encodeURIComponent(orderId)}`, { method:'PATCH', headers:{Prefer:'return=minimal'}, body:JSON.stringify(patch) });
    }
    return json(res, 200, { ok: true, orderId, status, detail, paid: status === 'approved', paidAt: order.payment_paid_at || null, expiresAt: order.pix_expires_at || null });
  } catch (error) {
    console.error('payment-status', error);
    return json(res, 500, { ok: false, error: error.message || 'Não foi possível consultar o pagamento.' });
  }
};
