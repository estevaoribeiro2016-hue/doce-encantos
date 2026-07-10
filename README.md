# Doce Encanto V44 — Verificação de Estabilidade

Esta versão foi gerada como uma versão de verificação/estabilidade após a limpeza do repositório.

## Objetivo

Confirmar que o projeto está pronto para testes fechados, sem arquivos misturados de Next.js/Prisma que causavam erro na Vercel.

## Estrutura esperada

- index.html
- assets/
- manifest.webmanifest
- service-worker.js
- vercel.json
- README.md

## Removidos / não devem existir no repositório

- prisma/
- src/
- package.json
- package-lock.json
- next.config.ts
- tsconfig.json
- postcss.config.mjs
- node_modules/

## Checklist para testar antes de divulgar

1. Abrir o site no celular e computador.
2. Adicionar trufa unitária ao carrinho.
3. Adicionar promoção 3 por R$14 com sabores repetidos.
4. Testar botões + e - no resumo do pedido.
5. Testar retirada.
6. Testar entrega com CEP e frete por bairro.
7. Confirmar se total = produtos + frete.
8. Confirmar se frete grátis acima de R$30 aparece corretamente.
9. Finalizar pedido e verificar se entra em Pedidos Pendentes.
10. Verificar se o estoque baixa somente após finalizar pedido.
11. Cancelar pedido e confirmar se o estoque volta.
12. Marcar pedido como pronto e testar mensagem pronta do WhatsApp.
13. Marcar saiu para entrega e testar mensagem pronta do WhatsApp.
14. Marcar entregue e confirmar se vai para Histórico.
15. Conferir Pix com QR Code e copia e cola.

## Status

Base estática limpa para publicação/teste fechado na Vercel.


## V45 - Correção do checkout e CEP
- CEP agora possui base local de segurança para região 30865/Pindorama quando o ViaCEP falhar.
- Finalizar pedido aplica o frete por bairro automaticamente se o endereço estiver preenchido.
- Pedido entra em Pendentes, desconta estoque e abre WhatsApp com mensagem completa.
