const { json, requiredEnv, supabaseRequest, parseBody, requestBaseUrl } = require('./_helpers');

const REUSABLE_STATUSES = new Set(['pending', 'in_process']);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });

  try {
    const { orderId } = parseBody(req);
    if (!orderId || !/^[A-Z0-9-]{6,40}$/i.test(orderId)) {
      return json(res, 400, { error: 'Pedido inválido.' });
    }

    const select = [
      'id', 'total', 'payment', 'payment_status', 'customer_name', 'customer_email',
      'customer_phone', 'mp_payment_id', 'pix_qr_code', 'pix_qr_code_base64',
      'pix_expiration', 'pix_generation', 'status'
    ].join(',');
    const rows = await supabaseRequest(`orders?id=eq.${encodeURIComponent(orderId)}&select=${select}`);
    const order = rows?.[0];

    if (!order) return json(res, 404, { error: 'Pedido não encontrado.' });
    if (order.payment !== 'pix') return json(res, 400, { error: 'Este pedido não utiliza Pix.' });
    if (String(order.status || '').toLowerCase() === 'cancelado') {
      return json(res, 409, { error: 'Pedido cancelado.' });
    }

    const expirationDate = order.pix_expiration ? new Date(order.pix_expiration) : null;
    const stillValid = expirationDate && expirationDate.getTime() > Date.now();
    if (
      order.mp_payment_id && order.pix_qr_code && order.pix_qr_code_base64 &&
      REUSABLE_STATUSES.has(order.payment_status) && stillValid
    ) {
      return json(res, 200, {
        paymentId: order.mp_payment_id,
        status: order.payment_status,
        qrCode: order.pix_qr_code,
        qrCodeBase64: order.pix_qr_code_base64,
        expiration: order.pix_expiration,
        reused: true
      });
    }

    const accessToken = requiredEnv('MP_ACCESS_TOKEN');
    const siteUrl = requestBaseUrl(req);
    const nextGeneration = Number(order.pix_generation || 0) + 1;
    const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const customerName = String(order.customer_name || 'Cliente').trim();
    const nameParts = customerName.split(/\s+/).filter(Boolean);
    const firstName = nameParts.shift() || 'Cliente';
    const lastName = nameParts.join(' ') || 'Doce Encanto';

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `doce-encanto-${order.id}-pix-${nextGeneration}`
      },
      body: JSON.stringify({
        transaction_amount: Number(order.total),
        description: `Doce Encanto - Pedido ${order.id}`,
        payment_method_id: 'pix',
        external_reference: order.id,
        notification_url: `${siteUrl}/api/mercadopago-webhook?source_news=webhooks`,
        date_of_expiration: expires,
        payer: {
          email: order.customer_email,
          first_name: firstName,
          last_name: lastName
        },
        metadata: {
          order_id: order.id,
          recipient_name: 'Estevao Ribeiro',
          pix_generation: nextGeneration
        }
      })
    });

    const mp = await mpResponse.json().catch(() => ({}));
    if (!mpResponse.ok) {
      const cause = Array.isArray(mp?.cause) ? mp.cause.map(c => c.description || c.code).filter(Boolean).join(' • ') : '';
      throw new Error(cause || mp?.message || 'Mercado Pago recusou a criação do Pix.');
    }

    const tx = mp.point_of_interaction?.transaction_data || {};
    if (!tx.qr_code || !tx.qr_code_base64) {
      throw new Error('Mercado Pago não retornou o QR Code Pix.');
    }

    await supabaseRequest(`orders?id=eq.${encodeURIComponent(order.id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        mp_payment_id: String(mp.id),
        payment_status: mp.status || 'pending',
        payment_status_detail: mp.status_detail || null,
        pix_qr_code: tx.qr_code,
        pix_qr_code_base64: tx.qr_code_base64,
        pix_expiration: mp.date_of_expiration || expires,
        pix_generation: nextGeneration,
        payment_updated_at: new Date().toISOString()
      })
    });

    return json(res, 200, {
      paymentId: String(mp.id),
      status: mp.status || 'pending',
      qrCode: tx.qr_code,
      qrCodeBase64: tx.qr_code_base64,
      expiration: mp.date_of_expiration || expires,
      reused: false
    });
  } catch (error) {
    console.error('create-pix', error);
    return json(res, 500, { error: error.message || 'Erro ao gerar Pix.' });
  }
};
