-- DOCE ENCANTO V56 - PIX AUTOMATICO MERCADO PAGO
-- Seguro para executar sobre a V54 já existente.

alter table public.orders add column if not exists customer_email text;
alter table public.orders add column if not exists payment_status text not null default 'pending';
alter table public.orders add column if not exists payment_status_detail text;
alter table public.orders add column if not exists mp_payment_id text;
alter table public.orders add column if not exists pix_qr_code text;
alter table public.orders add column if not exists pix_qr_code_base64 text;
alter table public.orders add column if not exists pix_expiration timestamptz;
alter table public.orders add column if not exists payment_updated_at timestamptz;
alter table public.orders add column if not exists payment_approved_at timestamptz;
alter table public.orders add column if not exists pix_generation integer not null default 0;
create unique index if not exists orders_mp_payment_id_unique on public.orders(mp_payment_id) where mp_payment_id is not null;

-- Atualiza somente a função de criação de pedido, preservando estoque, bairros e demais funções.
create or replace function public.create_order(p_payload jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_item jsonb;v_flavor jsonb;v_need jsonb:='{}'::jsonb;v_rec record;v_qty int;v_available int;v_subtotal numeric(10,2):=0;v_freight numeric(10,2):=0;v_total numeric(10,2);v_fulfillment text:=coalesce(p_payload->>'fulfillment','retirada');v_bairro text:=p_payload#>>'{address,bairro}';v_id text;v_order public.orders;v_zone numeric(10,2);v_email text:=lower(trim(coalesce(p_payload->>'customerEmail','')));
begin
 if nullif(trim(p_payload->>'customerName'),'') is null then raise exception 'Informe o nome do cliente.';end if;
 if nullif(trim(p_payload->>'customerPhone'),'') is null then raise exception 'Informe o telefone do cliente.';end if;
 if jsonb_typeof(p_payload->'items')<>'array' or jsonb_array_length(p_payload->'items')=0 then raise exception 'Carrinho vazio.';end if;
 if v_fulfillment not in('retirada','entrega') then raise exception 'Forma de recebimento inválida.';end if;
 -- O e-mail não é solicitado ao cliente. O backend gera um identificador técnico para o Mercado Pago quando necessário.
 if v_fulfillment='entrega' and coalesce(p_payload->>'payment','')<>'pix' then raise exception 'Para entrega, somente Pix.';end if;
 if v_fulfillment='entrega' and nullif(trim(v_bairro),'') is null then raise exception 'Informe o bairro.';end if;
 for v_item in select value from jsonb_array_elements(p_payload->'items') loop
  v_qty:=greatest(1,coalesce((v_item->>'qty')::int,1));
  if v_item?'flavors' then
   if jsonb_array_length(v_item->'flavors')<>3 then raise exception 'Cada promoção precisa ter 3 trufas.';end if;v_subtotal:=v_subtotal+14*v_qty;
   for v_flavor in select value from jsonb_array_elements(v_item->'flavors') loop
    if (v_flavor->>'id') not in('brigadeiro','oreo','maracuja','coco') then raise exception 'Sabor indisponível.';end if;
    v_need:=jsonb_set(v_need,array[v_flavor->>'id'],to_jsonb(coalesce((v_need->>(v_flavor->>'id'))::int,0)+v_qty),true);
   end loop;
  else
   if (v_item->>'id') not in('brigadeiro','oreo','maracuja','coco') then raise exception 'Produto indisponível.';end if;
   v_subtotal:=v_subtotal+5*v_qty;v_need:=jsonb_set(v_need,array[v_item->>'id'],to_jsonb(coalesce((v_need->>(v_item->>'id'))::int,0)+v_qty),true);
  end if;
 end loop;
 for v_rec in select key,value::int qty from jsonb_each_text(v_need) loop select stock into v_available from public.inventory where flavor_id=v_rec.key for update;if coalesce(v_available,0)<v_rec.qty then raise exception 'Estoque insuficiente de %.',v_rec.key;end if;end loop;
 if v_fulfillment='entrega' then if v_subtotal>=30 then v_freight:=0;else select fee into v_zone from public.delivery_zones where active and normalized_name=public.normalize_bairro(v_bairro) limit 1;v_freight:=coalesce(v_zone,10);end if;end if;
 v_total:=v_subtotal+v_freight;v_id:='DE'||to_char(clock_timestamp(),'YYMMDDHH24MISS')||upper(substr(md5(random()::text),1,3));
 insert into public.orders(id,created_label,customer_name,customer_phone,customer_email,items,subtotal,freight,total,fulfillment,delivery_method,delivery_region,address,payment,payment_label,payment_status,status)
 values(v_id,to_char(now() at time zone 'America/Sao_Paulo','DD/MM/YYYY HH24:MI'),trim(p_payload->>'customerName'),trim(p_payload->>'customerPhone'),nullif(v_email,''),p_payload->'items',v_subtotal,v_freight,v_total,v_fulfillment,case when v_fulfillment='entrega' then 'Uber Moto' else 'Retirada' end,coalesce(v_bairro,''),p_payload->'address',p_payload->>'payment',p_payload->>'paymentLabel',case when p_payload->>'payment'='pix' then 'pending' else 'not_applicable' end,'Recebido') returning * into v_order;
 for v_rec in select key,value::int qty from jsonb_each_text(v_need) loop update public.inventory set stock=stock-v_rec.qty,updated_at=now() where flavor_id=v_rec.key;insert into public.stock_movements(type,flavor_id,flavor_name,emoji,qty,reason,order_id) select 'Saída',flavor_id,flavor_name,emoji,-v_rec.qty,'Pedido finalizado',v_id from public.inventory where flavor_id=v_rec.key;end loop;
 return to_jsonb(v_order);
end$$;

grant execute on function public.create_order(jsonb) to anon,authenticated;
