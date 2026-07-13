-- DOCE ENCANTO V56.3 — CORREÇÃO DEFINITIVA PARA SALVAR BAIRROS
-- Execute TODO este arquivo no Supabase > SQL Editor > Run.
-- Não apaga pedidos, estoque ou bairros existentes.

create extension if not exists pgcrypto;

create or replace function public.normalize_bairro(v text)
returns text language sql immutable as $$
 select regexp_replace(
   lower(translate(trim(coalesce(v,'')),
   'áàâãäéèêëíìîïóòôõöúùûüç',
   'aaaaaeeeeiiiiooooouuuuc')),
   '\s+',' ','g'
 );
$$;

alter table public.delivery_zones add column if not exists name text;
alter table public.delivery_zones add column if not exists normalized_name text;
alter table public.delivery_zones add column if not exists fee numeric(10,2) default 0;
alter table public.delivery_zones add column if not exists active boolean default true;
alter table public.delivery_zones add column if not exists latitude numeric(10,7);
alter table public.delivery_zones add column if not exists longitude numeric(10,7);
alter table public.delivery_zones add column if not exists updated_at timestamptz default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='delivery_zones' and column_name='neighborhood'
  ) then
    execute 'update public.delivery_zones set name=coalesce(nullif(trim(name),''''), neighborhood) where name is null or trim(name)=''''';
    execute 'alter table public.delivery_zones alter column neighborhood drop not null';
  end if;
end $$;

update public.delivery_zones
set name=coalesce(nullif(trim(name),''),'Bairro sem nome'),
    normalized_name=public.normalize_bairro(coalesce(nullif(trim(name),''),'Bairro sem nome')),
    fee=coalesce(fee,0),
    active=coalesce(active,true),
    updated_at=coalesce(updated_at,now());

alter table public.delivery_zones alter column name set not null;
alter table public.delivery_zones alter column normalized_name set not null;
create unique index if not exists delivery_zones_normalized_name_uidx
on public.delivery_zones(normalized_name);

-- Remove qualquer versão incompleta da função antes de recriá-la.
drop function if exists public.admin_save_delivery_zones(jsonb);

create function public.admin_save_delivery_zones(p_zones jsonb)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  z jsonb;
  ids uuid[] := '{}';
  newid uuid;
  v_name text;
  v_normalized text;
begin
  if not public.is_doce_encanto_admin() then
    raise exception 'Acesso negado.';
  end if;

  if p_zones is null or jsonb_typeof(p_zones) <> 'array' then
    raise exception 'Lista de bairros inválida.';
  end if;

  for z in select value from jsonb_array_elements(p_zones) loop
    v_name := nullif(trim(z->>'name'),'');
    if v_name is null then continue; end if;
    v_normalized := public.normalize_bairro(v_name);

    insert into public.delivery_zones(
      id,name,normalized_name,fee,active,latitude,longitude,updated_at
    ) values (
      coalesce(nullif(z->>'id','')::uuid,gen_random_uuid()),
      v_name,
      v_normalized,
      greatest(0,coalesce(nullif(replace(z->>'fee',',','.'),'')::numeric,0)),
      coalesce(nullif(z->>'active','')::boolean,true),
      nullif(z->>'latitude','')::numeric,
      nullif(z->>'longitude','')::numeric,
      now()
    )
    on conflict(normalized_name) do update set
      name=excluded.name,
      fee=excluded.fee,
      active=excluded.active,
      latitude=excluded.latitude,
      longitude=excluded.longitude,
      updated_at=now()
    returning id into newid;

    if not newid=any(ids) then ids:=array_append(ids,newid); end if;
  end loop;

  if cardinality(ids)>0 then
    delete from public.delivery_zones where not(id=any(ids));
  end if;
end;
$$;

revoke all on function public.admin_save_delivery_zones(jsonb) from public;
grant execute on function public.admin_save_delivery_zones(jsonb) to authenticated;

notify pgrst, 'reload schema';

-- Verificação: deve retornar uma linha com o nome da função.
select p.proname as funcao_criada,
       pg_get_function_identity_arguments(p.oid) as parametros
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='admin_save_delivery_zones';
