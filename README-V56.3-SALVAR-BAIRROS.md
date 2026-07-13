# V56.3 — Correção para salvar bairros

O alerta “Could not find the function public.admin_save_delivery_zones(p_zones)” significa que a função não foi criada no Supabase porque uma execução SQL anterior parou com erro.

1. Abra o Supabase > SQL Editor > New query.
2. Abra `CORRECAO-SALVAR-BAIRROS-V56.3.sql`.
3. Copie todo o conteúdo, cole e clique em Run.
4. Ao final deve aparecer `admin_save_delivery_zones` em Results.
5. Volte ao site, use Ctrl+F5, entre na Central e salve os bairros novamente.

A correção não apaga pedidos, estoque ou bairros existentes.
