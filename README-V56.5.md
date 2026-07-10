# Doce Encanto V56.5 — PIX sem e-mail do cliente

## Alteração principal
- O checkout solicita somente nome e telefone/WhatsApp.
- Não existe validação de e-mail no navegador.
- O backend gera um e-mail técnico exclusivo por pedido apenas para atender ao formato exigido pela API do Mercado Pago.
- O e-mail técnico não é exibido ao cliente e não é usado para contato.
- Cache de HTML, app.js e service-worker foi desativado para evitar que uma versão antiga continue sendo carregada.

## Publicação
1. Substitua os arquivos da versão anterior pelos desta V56.5.
2. Não execute SQL novamente.
3. Faça redeploy no Vercel com o cache de build desmarcado.
4. Abra o site com Ctrl+F5 ou em janela anônima.
5. Teste um pedido PIX.
