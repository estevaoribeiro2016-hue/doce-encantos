# Doce Encanto V58 completa reconstruída

Esta versão foi reconstruída sobre a V55.2, que contém a Central completa, e recebeu as melhorias estáveis da V56 sem usar os remendos quebrados da V57.

## Central
- Pendentes, Produção, Entregues e Cancelados
- Restaurar pedido cancelado
- Confirmação antes de cancelar
- Marcar/desmarcar pedido de teste
- Pedido de teste fora do faturamento
- Correção de faturamento exclusiva do Teteu
- Estoque inteligente e movimentações
- Financeiro mensal
- Taxas: pesquisar, adicionar, editar, ativar/desativar, excluir e salvar
- Aviso quando o bairro já existe e bloqueio de duplicidade
- Mapa da loja na Rua Aletes, 78
- Alarme, impressão e configurações

## Cliente
- Favoritos
- Histórico por telefone
- Repetir pedido
- CEP, frete por bairro, Pix e WhatsApp
- Morango e Uva Verde aparecem como Em breve; ao colocar estoque maior que zero ficam disponíveis

## Banco
Execute `DOCE-ENCANTO-BANCO-COMPLETO-V58.sql`. Se aparecer conflito com coluna antiga de bairros, execute antes `CORRECAO-BAIRROS-COMPATIBILIDADE.sql`.
