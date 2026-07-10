# Doce Encanto V56 REAL — Pix Automático Mercado Pago

Base: V54 estável, preservando central, estoque, frete, faturamento e impressão.
Recebedor exibido: **Estevao Ribeiro**.

## O que foi adicionado

- Criação de Pix dinâmico por pedido via Mercado Pago.
- QR Code e Pix Copia e Cola.
- Expiração em 30 minutos.
- Regeração segura após expiração/rejeição.
- Confirmação automática via webhook.
- Consulta de status por endpoint seguro.
- Atualização automática da central via Supabase Realtime.
- Access Token somente no backend do Vercel.

## Instalação

1. Faça backup da V54 atual.
2. Execute apenas `update-v56.sql` no Supabase SQL Editor.
3. No Vercel, configure:
   - `MP_ACCESS_TOKEN`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SITE_URL` (opcional, recomendado: `https://doce-encantos.vercel.app`)
   - `MP_WEBHOOK_SECRET` (depois de criar o webhook)
4. Publique esta pasta no Git/Vercel.
5. No Mercado Pago, configure o webhook:
   - URL: `https://doce-encantos.vercel.app/api/mercadopago-webhook`
   - Evento: Pagamentos
6. Faça novo deploy após alterar variáveis.

## Segurança

- Nunca coloque `MP_ACCESS_TOKEN` ou `SUPABASE_SERVICE_ROLE_KEY` no HTML, JavaScript público ou GitHub.
- O token que foi compartilhado anteriormente deve ser renovado no Mercado Pago.
- O webhook consulta o pagamento diretamente no Mercado Pago antes de atualizar o pedido.

## Teste recomendado

Faça primeiro um pedido pequeno em produção e confirme:

1. Pedido criado.
2. QR Code exibido.
3. Pix Copia e Cola funciona.
4. Pagamento aprovado no Mercado Pago.
5. Central mostra `PIX pago`.
6. Pedido entra no faturamento apenas quando marcado como Entregue.
