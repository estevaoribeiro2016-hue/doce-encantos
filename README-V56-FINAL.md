# Doce Encanto V56.2 Final — PIX Mercado Pago

Base: V54/V56.1 estável.

## Correções desta entrega
- Corrige o travamento da Central causado por elemento inexistente.
- Login diferencia erro de senha de erro ao carregar dados da Central.
- Inicialização possui tratamento de falha para facilitar diagnóstico.
- Webhook aceita notificações modernas e `Pagamentos (legacy)` do Checkout Pro.
- Mantém PIX dinâmico, QR Code, Copia e Cola, expiração e consulta de status.

## Instalação
1. O `update-v56.sql` já foi executado; não execute novamente se apareceu `Success. No rows returned`.
2. Publique todos os arquivos no Git/Vercel.
3. Confirme as variáveis: `MP_ACCESS_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
4. Recomenda-se adicionar `SITE_URL=https://doce-encantos.vercel.app`.
5. No Mercado Pago, configure Webhook de produção e teste para:
   `https://doce-encantos.vercel.app/api/mercadopago-webhook`
6. Marque `Pagamentos (legacy)` para esta aplicação Checkout Pro.
7. Após salvar, adicione a assinatura secreta como `MP_WEBHOOK_SECRET` no Vercel e faça novo deploy.

## Segurança
Nenhum Access Token, Service Role Key ou segredo de webhook está incluído neste pacote.
