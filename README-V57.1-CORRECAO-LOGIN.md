# Doce Encanto V57.1 — correção do acesso à Central

Correção aplicada:

- variável `delivered` definida corretamente antes da renderização da Área da Empresa;
- o erro `delivered is not defined` não interrompe mais o login;
- pedidos de teste continuam fora do faturamento;
- faturamento entregue considera apenas pedidos reais e ajustes autorizados;
- não é necessário alterar usuários, senhas ou executar novo SQL no Supabase.
