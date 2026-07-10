const { json, readJson, supabaseRequest, mercadoPagoRequest, siteUrl, firstName, uuid } = require('./_shared');
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Método não permitido.' });
  try {
    const body = await readJson(req);
    const orderId = String(body.orderId || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    if (!orderId) return json(res, 400, { ok: false, error: 'Pedido não informado.' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return json(res, 400, { ok: false, error: 'Informe um e-mail válido para gerar o Pix.' });

    const rows = await supabaseRequest(`orders?id=eq.${encodeURIComponent(orderId)}&select=id,customer_name,customer_phone,total,payment,mp_payment_id,mp_status,pix_qr_code,pix_qr_code_base64,pix_expires_at`);
    const order = Array.isArray(rows) ? rows[0] : null;
    if (!order) return json(res, 404, { ok: false, error: 'Pedido não encontrado.' });
    if (order.payment !== 'pix') return json(res, 400, { ok: false, error: 'Este pedido não utiliza Pix.' });

    if (order.mp_payment_id && order.pix_qr_code && !['cancelled','rejected'].includes(String(order.mp_status || '').toLowerCase())) {
      return json(res, 200, { ok: true, reused: true, paymentId: order.mp_payment_id, status: order.mp_status, qrCode: order.pix_qr_code, qrCodeBase64: order.pix_qr_code_base64, expiresAt: order.pix_expires_at });
    }

    const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const payment = await mercadoPagoRequest('/v1/payments', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': uuid() },
      body: JSON.stringify({
        transaction_amount: Number(order.total),
        description: `Pedido Doce Encanto #${order.id}`.slice(0, 120),
        payment_method_id: 'pix',
        external_reference: order.id,
        notification_url: `${siteUrl(req)}/api/mercadopago-webhook`,
        date_of_expiration: expires,
        payer: { email, first_name: firstName(order.customer_name) }
      })
    });
    const tx = payment?.point_of_interaction?.transaction_data || {};
    if (!tx.qr_code || !tx.qr_code_base64) throw new Error('O Mercado Pago não retornou o QR Code do Pix.');

    await supabaseRequest(`orders?id=eq.${encodeURIComponent(order.id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ customer_email: email, mp_payment_id: String(payment.id), mp_status: payment.status || 'pending', mp_status_detail: payment.status_detail || null, pix_qr_code: tx.qr_code, pix_qr_code_base64: tx.qr_code_base64, pix_ticket_url: tx.ticket_url || null, pix_expires_at: payment.date_of_expiration || expires, payment_updated_at: new Date().toISOString() })
    });

    return json(res, 200, { ok: true, paymentId: String(payment.id), status: payment.status || 'pending', qrCode: tx.qr_code, qrCodeBase64: tx.qr_code_base64, ticketUrl: tx.ticket_url || null, expiresAt: payment.date_of_expiration || expires });
  } catch (error) {
    console.error('create-pix', error);
    return json(res, 500, { ok: false, error: error.message || 'Não foi possível gerar o Pix.' });
  }
};
