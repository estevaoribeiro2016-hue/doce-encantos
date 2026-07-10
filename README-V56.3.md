# V56.3 — Correção Pix e retirada do e-mail

- Remove o campo de e-mail do checkout.
- Gera internamente um e-mail técnico por pedido, pois a API Pix do Mercado Pago exige `payer.email`.
- Aceita aliases seguros para a variável de serviço do Supabase.
- Atualiza o cache do service worker.

## Importante
No Vercel, a variável `SUPABASE_SERVICE_ROLE_KEY` deve existir em Production e ter o valor da chave service_role do mesmo projeto Supabase. Depois de salvar/editar, faça Redeploy sem usar o cache de build.

Não é necessário executar novamente o SQL se o update-v56.sql já foi executado.
