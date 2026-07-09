# Doce Encanto V36 — Frete ajustado

Correção da V35:
- A API às vezes retorna uma rota errada/longa para endereços muito próximos.
- Agora o sistema compara rota e linha reta.
- Se a rota vier incompatível com a região, ele usa uma distância operacional ajustada para evitar cobrar frete errado.
- Frete mantido: até 2 km = R$5, acima de 2 km = R$10.
- Checkout mostra quando a distância foi ajustada.

Observação: para precisão perfeita, o ideal futuro é usar GPS do cliente ou coordenada exata pelo mapa.
