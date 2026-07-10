# Doce Encanto V50 REAL — Supabase online e tempo real

Esta versão usa um banco PostgreSQL online do Supabase. Pedidos, estoque e histórico ficam sincronizados entre Teteu e Ingrid em aparelhos diferentes.

## O que já está implementado no código

- Pedido salvo online por função transacional no banco.
- Validação e desconto do estoque feitos no servidor, evitando dois clientes comprarem a mesma última unidade.
- Cancelamento devolve o estoque automaticamente.
- Histórico de movimentação do estoque online.
- Pedidos pendentes, produção e histórico sincronizados em tempo real.
- Login real da central com Supabase Auth.
- RLS: clientes não conseguem ler pedidos, telefones ou histórico da empresa.
- Teteu e Ingrid têm o mesmo acesso administrativo.
- Carrinho, promoção 3 por R$14, frete por bairro, Pix e WhatsApp mantidos.

## Etapa obrigatória: criar o banco na SUA conta

Eu não consigo criar um projeto dentro da sua conta do Supabase sem acesso à conta. O pacote está completo, mas precisa ser conectado uma vez.

### 1. Criar projeto

Acesse o Supabase, crie um projeto e aguarde o banco ficar pronto.

### 2. Criar tabelas e funções

No projeto: **SQL Editor → New query**. Cole todo o conteúdo de `supabase-schema.sql` e clique em **Run**.

### 3. Criar os dois usuários

Em **Authentication → Users → Add user**, crie:

- Email: `teteu.trufa@doceencanto.local`
- Senha: `30707420`
- Marque o email como confirmado.

Depois crie:

- Email: `ingrid.trufa@doceencanto.local`
- Senha: `30707420`
- Marque o email como confirmado.

No site vocês continuam digitando apenas `teteu.trufa` ou `ingrid.trufa`.

### 4. Conectar o site

Em **Project Settings → API**, copie:

- Project URL
- Publishable key (ou anon key legada)

Abra `assets/supabase-config.js` e preencha:

```js
window.DoceEncantoSupabaseConfig = {
  url: 'https://SEU-PROJETO.supabase.co',
  publishableKey: 'SUA_CHAVE_PUBLICAVEL'
};
```

A publishable/anon key pode ficar no navegador porque a segurança está nas políticas RLS. **Nunca** coloque secret key ou service_role nesse arquivo.

### 5. Publicar

Envie todos os arquivos desta pasta para a raiz do GitHub. A Vercel publicará automaticamente.

## Teste obrigatório antes de divulgar

1. Abra o site em um celular e a central em outro.
2. Entre como Teteu em um aparelho e Ingrid no outro.
3. Cadastre estoque.
4. Finalize um pedido de teste.
5. Confirme que aparece nos dois aparelhos sem atualizar a página.
6. Marque como Produção, Pronto e Entregue.
7. Cancele outro pedido e confirme que o estoque voltou.

## Segurança

O cliente pode consultar estoque e criar pedido apenas pela função segura. Somente os dois usuários autenticados podem ler pedidos, alterar status, editar estoque e ver movimentações.

## Configuração deste pacote

Este pacote já está configurado com a Project URL e a Publishable Key informadas pelo responsável do projeto.
O arquivo preenchido é `assets/supabase-config.js`.

Antes de publicar, confirme no Supabase:
- o script `supabase-schema.sql` foi executado;
- os usuários administrativos foram criados e confirmados;
- o Realtime está habilitado conforme o script.
