const { json, supabaseRequest } = require('./_helpers');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Método não permitido.' });
  try {
    const orderId = String(req.query?.orderId || '').trim();
    if (!orderId || !/^[A-Z0-9-]{6,40}$/i.test(orderId)) {
      return json(res, 400, { error: 'Pedido inválido.' });
    }
    const rows = await supabaseRequest(
      `orders?id=eq.${encodeURIComponent(orderId)}&select=id,payment_status,payment_status_detail,payment_approved_at,pix_expiration,mp_payment_id`
    );
    const order = rows?.[0];
    if (!order) return json(res, 404, { error: 'Pedido não encontrado.' });
    return json(res, 200, {
      status: order.payment_status || 'pending',
      detail: order.payment_status_detail || null,
      approvedAt: order.payment_approved_at || null,
      expiration: order.pix_expiration || null,
      paymentId: order.mp_payment_id || null
    });
  } catch (error) {
    console.error('payment-status', error);
    return json(res, 500, { error: error.message || 'Erro ao consultar pagamento.' });
  }
};
