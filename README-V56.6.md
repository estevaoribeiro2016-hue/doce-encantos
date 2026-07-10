# Doce Encanto V56.6

Base: V54 estável.

## Alterações
- Mantém a Central, estoque, faturamento, bairros e impressão da V54.
- Adiciona PIX Mercado Pago com QR Code e Copia e Cola.
- Exige nome, telefone e e-mail válido do cliente para o PIX.
- Usa o e-mail real informado pelo cliente na API do Mercado Pago.
- Mantém credenciais apenas nas variáveis do Vercel.
- Webhook atualiza o pagamento automaticamente.
- Cache do app atualizado para v56-6.

## Publicação
1. Faça backup da versão publicada.
2. Execute update-v56.sql somente se ainda não tiver executado.
3. Publique todos os arquivos no Git/Vercel.
4. Faça Redeploy sem usar Build Cache.
5. Abra /api/health e confirme ok=true.
6. Teste login, retirada, entrega e um PIX de baixo valor.
