# Doce Encanto v43

Versão completa com:
- Finalizar pedido criando pedido pendente.
- Botões + e - no resumo funcionando.
- Promoção 3 trufas por R$ 14,00.
- Trufas Brigadeiro, Oreo, Maracujá e Coco disponíveis.
- Morango e Uva aparecem, mas ficam indisponíveis se status/estoque bloquear.
- Estoque inteligente por sabor.
- Desconto automático de estoque ao finalizar pedido.
- Bloqueio de pedido quando não há estoque suficiente.
- Devolução do estoque quando o pedido é cancelado.
- Histórico de pedidos entregues/cancelados.
- Histórico de movimentação de estoque.
- Link automático para WhatsApp com mensagem pronta.

## Rodar
1. Copie `.env.example` para `.env` e ajuste o DATABASE_URL.
2. npm install
3. npx prisma migrate dev --name init
4. npm run seed
5. npm run dev

Abra:
- http://localhost:3000/cardapio
- http://localhost:3000/admin
