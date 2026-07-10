const { json, requiredEnv, supabaseRequest, parseBody, validateWebhookSignature } = require('./_helpers');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });

  try {
    const body = parseBody(req);
    const dataId = req.query?.['data.id'] || req.query?.id || body?.data?.id || body?.id;
    const type = req.query?.type || body?.type || body?.action?.split('.')?.[0];
    if (!dataId || (type && type !== 'payment')) {
      return json(res, 200, { received: true, ignored: true });
    }

    const signature = validateWebhookSignature(req, dataId);
    if (!signature.valid) return json(res, 401, { error: 'Assinatura inválida.' });
    if (!signature.configured) console.warn('MP_WEBHOOK_SECRET ainda não configurado; validação feita consultando a API do Mercado Pago.');

    const accessToken = requiredEnv('MP_ACCESS_TOKEN');
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const payment = await mpResponse.json().catch(() => ({}));
    if (!mpResponse.ok) throw new Error(payment?.message || 'Falha ao consultar pagamento.');

    const orderId = payment.external_reference || payment.metadata?.order_id;
    if (!orderId) return json(res, 200, { received: true, ignored: 'sem pedido' });

    const orders = await supabaseRequest(`orders?id=eq.${encodeURIComponent(orderId)}&select=id,total,payment_status,mp_payment_id`);
    const order = orders?.[0];
    if (!order) return json(res, 200, { received: true, ignored: 'pedido não encontrado' });

    if (Math.abs(Number(order.total) - Number(payment.transaction_amount)) > 0.009) {
      throw new Error('Valor do pagamento não confere com o pedido.');
    }

    const patch = {
      mp_payment_id: String(payment.id),
      payment_status: payment.status || 'unknown',
      payment_status_detail: payment.status_detail || null,
      payment_updated_at: new Date().toISOString(),
      payment_approved_at: payment.status === 'approved'
        ? (payment.date_approved || new Date().toISOString())
        : null
    };

    await supabaseRequest(`orders?id=eq.${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(patch)
    });

    return json(res, 200, { received: true, orderId, status: patch.payment_status });
  } catch (error) {
    console.error('mercadopago-webhook', error);
    return json(res, 500, { error: error.message || 'Erro no webhook.' });
  }
};
