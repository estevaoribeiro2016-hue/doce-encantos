# Doce Encanto V56.4 — PIX automático

Baseada na V54 estável e consolidando as correções da V56.

## Correções principais

- Central não trava quando um elemento opcional não existe.
- Checkout não solicita Gmail/e-mail do cliente.
- PIX dinâmico com QR Code e Copia e Cola pelo Mercado Pago.
- Endpoint `/api/health` mostra apenas se cada variável existe, sem revelar valores.
- Leitura tolerante a espaços acidentais no nome/valor das variáveis do Vercel.
- Webhook aceita o formato moderno assinado e a notificação legada; em ambos os casos consulta a API do Mercado Pago antes de atualizar o pedido.
- Cache atualizado para `v56.4`.

## Variáveis obrigatórias no Vercel

- `MP_ACCESS_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MP_WEBHOOK_SECRET`
- `SITE_URL` (recomendado: `https://doce-encantos.vercel.app`)

Depois de salvar ou editar qualquer variável, faça **Redeploy sem Build Cache**.

## Teste de configuração

Abra:

`https://doce-encantos.vercel.app/api/health`

O resultado deve mostrar `ok: true` e as três variáveis obrigatórias como `true`. O endpoint não mostra chaves.

## Banco

Se o `update-v56.sql` já retornou `Success. No rows returned`, não execute novamente.
