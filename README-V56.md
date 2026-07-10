# Doce Encanto V56 — Pix automático Mercado Pago

Esta versão foi criada sobre a V54 estável e altera somente o fluxo de pagamento Pix.

## O que foi adicionado

- Pix exclusivo por pedido via API oficial do Mercado Pago.
- QR Code dinâmico e Pix Copia e Cola.
- Expiração em 30 minutos.
- Webhook com validação HMAC.
- Confirmação automática do pagamento na tabela `orders`.
- Nome do recebedor exibido: **Estevao Ribeiro**.
- Access Token nunca fica no HTML, JavaScript público ou GitHub.

## 1. Supabase

Execute somente `update-v56.sql` no SQL Editor. Não execute `supabase-schema.sql` em um banco existente.

## 2. Variáveis no Vercel

Em Project Settings → Environment Variables, crie:

- `MP_ACCESS_TOKEN` = novo Access Token de produção do Mercado Pago
- `MP_WEBHOOK_SECRET` = assinatura secreta gerada na configuração de Webhooks
- `SUPABASE_URL` = `https://lswmxluskdgnewqezkpc.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = chave `service_role` do Supabase (nunca a publishable key)
- `SITE_URL` = `https://doce-encantos.vercel.app`

Marque Production, Preview e Development conforme necessário. Depois faça novo deploy.

## 3. Webhook Mercado Pago

No Mercado Pago Developers → Doce Encanto Oficial → Webhooks:

- URL de produção: `https://doce-encantos.vercel.app/api/mercadopago-webhook`
- Evento: **Pagamentos / Payments**
- Salve e copie a assinatura secreta para `MP_WEBHOOK_SECRET` no Vercel.

## 4. Segurança

O Access Token anteriormente compartilhado deve ser renovado. Use somente o novo token nas variáveis do Vercel.

## 5. Teste antes da divulgação

1. Faça um pedido pequeno usando Pix.
2. Confirme que o QR Code aparece.
3. Pague o Pix.
4. Confira na central se aparece `PIX pago`.
5. Só depois libere para clientes reais.
