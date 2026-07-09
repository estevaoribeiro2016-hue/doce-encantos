# Doce Encanto V35 — Correção do Frete

Correção focada no problema de distância absurda, como 188 km para endereço próximo.

## O que mudou

- Mantém a loja em coordenada fixa aproximada da Rua Aletes, 78, Pindorama/BH.
- A busca do endereço do cliente agora é limitada a uma área próxima da loja.
- Se a API devolver endereço em outra cidade/estado ou distância acima de 30 km, o sistema rejeita o resultado.
- O checkout mostra o endereço localizado pela API para conferência.
- Frete continua:
  - até 2 km: R$ 5,00
  - acima de 2 km: R$ 10,00

## Importante

Para cálculo 100% preciso, o ideal é usar geocodificação profissional com endereço completo validado e coordenada exata da loja. Esta V35 corrige o erro mais grave: aceitar resultado absurdo da API.
