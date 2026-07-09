# Doce Encanto V37 — Frete próximo corrigido

Correção focada no problema real do frete:

- Endereços claramente próximos da loja, como **Rua Arauto, 120 - Pindorama**, não podem virar 3,8 km.
- A função `/api/distance` agora reconhece área local Pindorama/CEP 30865 e aplica distância operacional corrigida.
- Frete mantido:
  - até 2 km: **R$ 5,00**
  - acima de 2 km: **R$ 10,00**
- O checkout mostra quando o endereço foi reconhecido como área próxima da loja.
- Mantém CEP automático, WhatsApp completo, Pix e central.

## Importante
A variável `OPENROUTESERVICE_API_KEY` deve continuar configurada na Vercel.

## Atualização
Extraia o ZIP, entre na pasta e envie todos os arquivos de dentro para a raiz do repositório no GitHub.
