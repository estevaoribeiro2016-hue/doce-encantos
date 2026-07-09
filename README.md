# Doce Encanto V34 — Frete real + WhatsApp completo

Esta versão mantém o projeto em HTML estático, mas inclui função Vercel em `/api/distance` para calcular distância real com OpenRouteService sem expor a API Key no navegador.

## Inclui

- CEP automático via ViaCEP.
- Cálculo real de distância pela OpenRouteService usando `OPENROUTESERVICE_API_KEY`.
- Frete automático:
  - até 2 km: R$ 5,00;
  - acima de 2 km: R$ 10,00.
- Checkout com retirada ou entrega.
- Entrega somente com Pix.
- Retirada com Pix, dinheiro ou cartão.
- WhatsApp completo com cliente, telefone, itens, subtotal, frete, total, endereço, distância, pagamento e status.
- QR Code Pix mantido.
- Central da empresa, estoque, carrinho e Trufita mantidos.

## Antes de subir

Na Vercel, configure:

`Settings → Environment Variables`

Key:
`OPENROUTESERVICE_API_KEY`

Value:
Sua chave nova da OpenRouteService.

Marque Production e Preview.

## Como atualizar

Extraia o ZIP, entre na pasta e envie todos os arquivos para o GitHub na raiz do repositório.
