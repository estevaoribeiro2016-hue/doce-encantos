-- DOCE ENCANTO V56.1 — CORREÇÃO DE COMPATIBILIDADE DOS BAIRROS
-- Execute este arquivo primeiro caso o Supabase mostre erro na coluna neighborhood.

create or replace function public.normalize_bairro(v text) returns text language sql immutable as $$
 select regexp_replace(lower(translate(trim(coalesce(v,'')),'áàâãäéèêëíìîïóòôõöúùûüç','aaaaaeeeeiiiiooooouuuuc')),'\s+',' ','g');
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
    execute 'update public.delivery_zones set name=coalesce(nullif(name,'''') , neighborhood) where name is null or trim(name)=''''';
    execute 'alter table public.delivery_zones alter column neighborhood drop not null';
  end if;
end $$;

update public.delivery_zones
set name=coalesce(nullif(trim(name),''),'Bairro sem nome'),
    normalized_name=public.normalize_bairro(coalesce(nullif(trim(name),''),'Bairro sem nome')),
    fee=coalesce(fee,0), active=coalesce(active,true), updated_at=coalesce(updated_at,now());

alter table public.delivery_zones alter column name set not null;
alter table public.delivery_zones alter column normalized_name set not null;
create unique index if not exists delivery_zones_normalized_name_uidx
  on public.delivery_zones(normalized_name);

notify pgrst, 'reload schema';
