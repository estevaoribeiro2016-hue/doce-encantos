# Doce Encanto V57 — Base organizada

## Correções principais
- Login usa diretamente o Supabase Auth existente.
- Aceita `teteu.trufa`, `ingrid.trufa` ou o e-mail completo.
- Mostra o motivo real da falha de autenticação.
- Não recria nem apaga usuários do Supabase.
- Banco consolidado em um único arquivo SQL.
- Função de salvar bairros compatível com a tabela antiga (`neighborhood`) e nova (`name`).
- Cache do aplicativo atualizado para impedir carregamento de versões antigas.

## Instalação
1. No Supabase, abra SQL Editor > New query.
2. Execute todo o arquivo `DOCE-ENCANTO-BANCO-ORGANIZADO-V57.sql`.
3. Envie os arquivos do projeto para o GitHub/Vercel.
4. Abra o site e pressione Ctrl+F5.

## Acesso
Usuários preservados:
- `teteu.trufa`
- `ingrid.trufa`

As senhas permanecem as que estão cadastradas no Supabase Auth. Se aparecer “Senha incorreta”, abra Authentication > Users, clique no usuário e use a opção de redefinir senha. Não crie outro usuário duplicado.
