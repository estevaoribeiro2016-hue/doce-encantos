# Doce Encanto V56 Completa

Base: V55.2 funcional, sem Mercado Pago automático.

## Novidades
- Um único SQL completo: `DOCE-ENCANTO-BANCO-COMPLETO-V56.sql`.
- Pesquisa de bairro informa quando o cadastro já existe.
- Duplicidade de bairro é bloqueada no site e consolidada no Supabase.
- Mapa público e mapa da Central apontam para Rua Aletes, 78, Pindorama, Belo Horizonte/MG.
- Ponto de referência exibido: portão marrom.
- Morango e Uva Verde aparecem como **Em breve** quando o estoque está zerado.
- A Central permite definir quantidade de Morango e Uva Verde; ao colocar estoque maior que zero, passam a ficar disponíveis automaticamente.
- Tudo da V55.2 foi preservado: favoritos, histórico, repetir pedido, estoque inteligente, teste fora do faturamento, cancelados e restaurar pedido.

## Instalação
1. No Supabase, abra SQL Editor.
2. Cole todo o conteúdo de `DOCE-ENCANTO-BANCO-COMPLETO-V56.sql`.
3. Clique em Run.
4. Publique os arquivos do ZIP na Vercel/GitHub.
