# Doce Encanto V56.7 — PIX Mercado Pago

Base: V54 funcional enviada pelo usuário.

## Instalação
1. Execute `update-v56-7.sql` uma única vez no SQL Editor do Supabase.
2. Confirme no Vercel as variáveis: `MP_ACCESS_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MP_WEBHOOK_SECRET` e opcionalmente `SITE_URL`.
3. Publique todos os arquivos, incluindo a pasta `api`.
4. Faça Redeploy sem usar Build Cache.
5. Teste `https://doce-encantos.vercel.app/api/health`.
6. No Mercado Pago, use o webhook `https://doce-encantos.vercel.app/api/mercadopago-webhook`.

O cliente informa nome, telefone e e-mail. O e-mail é enviado ao Mercado Pago para a criação do Pix.
