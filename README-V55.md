# Doce Encanto V55 — WhatsApp Business

Base: V54 estável.

## O que mudou
- Número do WhatsApp Business configurável pela Central.
- Botão flutuante de atendimento no site.
- Saudação e menu editáveis.
- Modelos editáveis por status: recebido, produção, pronto, entrega e entregue.
- Mensagens com nome do cliente e número do pedido.
- Botão de teste do WhatsApp.
- Mantidos pedidos, frete, estoque, financeiro, impressão e autenticação da V54.

## Importante
Esta versão usa links oficiais `wa.me` e abre a mensagem pronta para confirmação. Isso evita guardar tokens secretos no navegador e não exige mudança no Supabase.

Respostas enviadas sem qualquer confirmação exigem WhatsApp Cloud API, conta Meta Business verificada, token e função de servidor. Não coloque token da Meta em `assets/app.js`.

## Publicação segura
1. Faça backup da V54.
2. Publique os arquivos da V55 no Git/Vercel.
3. Não execute SQL: esta atualização não altera o banco.
4. Entre na Central > WhatsApp e cadastre o novo número.
5. Teste o botão flutuante e uma mudança de status de pedido.
