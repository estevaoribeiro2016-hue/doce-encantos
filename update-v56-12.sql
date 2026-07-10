-- Doce Encanto V56.12: comprovante, tempo estimado e horário de funcionamento
create table if not exists public.app_settings (
  id integer primary key default 1 check (id = 1),
  open_time time not null default '09:00',
  close_time time not null default '20:00',
  open_days integer[] not null default array[1,2,3,4,5,6],
  default_eta integer not null default 30,
  orders_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.app_settings(id) values (1) on conflict (id) do nothing;

alter table public.orders add column if not exists receipt_status text not null default 'Aguardando comprovante';
alter table public.orders add column if not exists receipt_received_at timestamptz;
alter table public.orders add column if not exists estimated_minutes integer not null default 30;

create or replace function public.admin_mark_receipt_received(p_order_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_order public.orders;
begin
  if not public.is_doce_encanto_admin() then raise exception 'Acesso negado.'; end if;
  update public.orders
     set receipt_status='Comprovante enviado', receipt_received_at=now(), updated_at=now()
   where id=p_order_id returning * into v_order;
  if v_order.id is null then raise exception 'Pedido não encontrado.'; end if;
  return to_jsonb(v_order);
end$$;

create or replace function public.admin_set_order_eta(p_order_id text,p_minutes integer)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.is_doce_encanto_admin() then raise exception 'Acesso negado.'; end if;
  update public.orders set estimated_minutes=greatest(5,least(240,p_minutes)),updated_at=now() where id=p_order_id;
  if not found then raise exception 'Pedido não encontrado.'; end if;
end$$;

create or replace function public.admin_save_app_settings(p_settings jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.is_doce_encanto_admin() then raise exception 'Acesso negado.'; end if;
  insert into public.app_settings(id,open_time,close_time,open_days,default_eta,orders_enabled,updated_at)
  values(1,coalesce((p_settings->>'open_time')::time,'09:00'),coalesce((p_settings->>'close_time')::time,'20:00'),coalesce(array(select jsonb_array_elements_text(p_settings->'open_days')::integer),array[1,2,3,4,5,6]),greatest(5,least(240,coalesce((p_settings->>'default_eta')::integer,30))),coalesce((p_settings->>'orders_enabled')::boolean,true),now())
  on conflict(id) do update set open_time=excluded.open_time,close_time=excluded.close_time,open_days=excluded.open_days,default_eta=excluded.default_eta,orders_enabled=excluded.orders_enabled,updated_at=now();
end$$;

alter table public.app_settings enable row level security;
drop policy if exists app_settings_public_read on public.app_settings;
create policy app_settings_public_read on public.app_settings for select to anon,authenticated using(true);

grant select on public.app_settings to anon,authenticated;
grant execute on function public.admin_mark_receipt_received(text) to authenticated;
grant execute on function public.admin_set_order_eta(text,integer) to authenticated;
grant execute on function public.admin_save_app_settings(jsonb) to authenticated;


create or replace function public.apply_default_order_eta()
returns trigger language plpgsql set search_path=public as $$
begin
  if new.estimated_minutes is null or new.estimated_minutes = 30 then
    select default_eta into new.estimated_minutes from public.app_settings where id=1;
    new.estimated_minutes := coalesce(new.estimated_minutes,30);
  end if;
  return new;
end$$;

drop trigger if exists trg_orders_default_eta on public.orders;
create trigger trg_orders_default_eta before insert on public.orders
for each row execute function public.apply_default_order_eta();
