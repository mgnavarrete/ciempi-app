-- ════════════════════════════════════════════════════════════════════════
-- Tienda de Ciempi: cada niño personaliza a su Ciempi con sus monedas.
--  • perfiles_ninos.ciempi: cómo se ve (nombre, colores, gorro, zapatos…).
--    Lo puede editar el niño, pero un trigger impide ponerse algo no comprado.
--  • perfiles_ninos.inventario: lo comprado. Solo cambia con comprar_para_ciempi.
--  • items_tienda: catálogo con precios (debe coincidir con
--    src/ciempi/catalogo.ts; hay un test que lo revisa).
-- ════════════════════════════════════════════════════════════════════════

-- La tienda genérica de la primera versión nunca se usó: se reemplaza.
drop function if exists public.comprar(uuid, uuid);
drop table if exists public.compras;
drop table if exists public.items_tienda;

create table public.items_tienda (
  id        text primary key,
  nombre    text not null,
  categoria text not null check (categoria in ('paleta', 'cabeza', 'cara', 'pies', 'diseno', 'fondo')),
  precio    integer not null check (precio >= 0),
  activo    boolean not null default true
);

insert into public.items_tienda (id, nombre, categoria, precio) values
  ('paleta-clasica', 'Clásico', 'paleta', 0),
  ('paleta-oceano', 'Océano', 'paleta', 8),
  ('paleta-bosque', 'Bosque', 'paleta', 8),
  ('paleta-frutilla', 'Frutilla', 'paleta', 8),
  ('paleta-sol', 'Sol', 'paleta', 8),
  ('paleta-lavanda', 'Lavanda', 'paleta', 10),
  ('paleta-noche', 'Noche', 'paleta', 10),
  ('paleta-arcoiris', 'Arcoíris', 'paleta', 20),
  ('cabeza-antenas', 'Antenas', 'cabeza', 0),
  ('cabeza-jockey', 'Jockey', 'cabeza', 0),
  ('cabeza-flor', 'Flor', 'cabeza', 10),
  ('cabeza-lazo', 'Lazo', 'cabeza', 12),
  ('cabeza-cumpleanos', 'Cumpleaños', 'cabeza', 12),
  ('cabeza-gorro-lana', 'Gorro de lana', 'cabeza', 12),
  ('cabeza-orejas-gato', 'Orejas de gato', 'cabeza', 15),
  ('cabeza-vaquero', 'Vaquero', 'cabeza', 15),
  ('cabeza-mago', 'Mago', 'cabeza', 20),
  ('cabeza-corona', 'Corona', 'cabeza', 25),
  ('cabeza-astronauta', 'Astronauta', 'cabeza', 30),
  ('cara-nada', 'Nada', 'cara', 0),
  ('cara-pestanas', 'Pestañas', 'cara', 6),
  ('cara-bigote', 'Bigote', 'cara', 8),
  ('cara-lentes', 'Lentes', 'cara', 10),
  ('cara-lentes-sol', 'Lentes de sol', 'cara', 12),
  ('pies-clasicos', 'Clásicos', 'pies', 0),
  ('pies-zapatillas', 'Zapatillas', 'pies', 10),
  ('pies-botas', 'Botas de lluvia', 'pies', 12),
  ('pies-brillantes', 'Brillantes', 'pies', 18),
  ('diseno-liso', 'Liso', 'diseno', 0),
  ('diseno-puntos', 'Puntos', 'diseno', 10),
  ('diseno-rayas', 'Rayas', 'diseno', 10),
  ('diseno-estrellas', 'Estrellas', 'diseno', 15),
  ('diseno-corazones', 'Corazones', 'diseno', 15),
  ('fondo-jardin', 'Jardín', 'fondo', 0),
  ('fondo-mar', 'Mar', 'fondo', 20),
  ('fondo-selva', 'Selva', 'fondo', 20),
  ('fondo-dulces', 'Dulces', 'fondo', 20),
  ('fondo-nieve', 'Nieve', 'fondo', 20),
  ('fondo-espacio', 'Espacio', 'fondo', 25);

create table public.compras (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  perfil_id     uuid not null references public.perfiles_ninos (id) on delete cascade,
  item_id       text not null references public.items_tienda (id),
  precio_pagado integer not null check (precio_pagado >= 0),
  comprada_en   timestamptz not null default now(),
  unique (perfil_id, item_id)
);

alter table public.items_tienda enable row level security;
alter table public.compras      enable row level security;
create policy "catálogo visible" on public.items_tienda for select to authenticated using (activo);
create policy "ver compras" on public.compras for select to authenticated using (public.puede_ver_nino(perfil_id));

alter table public.perfiles_ninos
  add column ciempi jsonb not null default '{}' check (jsonb_typeof(ciempi) = 'object'),
  add column inventario text[] not null default '{}';

-- El niño (y sus adultos) pueden cambiar cómo se ve su Ciempi; el inventario, no.
grant update (ciempi) on public.perfiles_ninos to authenticated;

-- Solo se puede poner lo gratis o lo comprado.
create function public.validar_ciempi()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_parte text;
  v_item text;
begin
  if new.ciempi is not distinct from old.ciempi then return new; end if;
  if char_length(coalesce(new.ciempi ->> 'nombre', '')) > 20 then
    raise exception 'El nombre de Ciempi puede tener hasta 20 letras';
  end if;
  foreach v_parte in array array['paleta', 'cabeza', 'cara', 'pies', 'diseno', 'fondo'] loop
    v_item := new.ciempi ->> v_parte;
    if v_item is not null
       and not (v_item = any (new.inventario))
       and coalesce((select precio from public.items_tienda where id = v_item and categoria = v_parte), 1) > 0 then
      raise exception 'Primero hay que comprarlo';
    end if;
  end loop;
  return new;
end $$;

create trigger validar_apariencia_ciempi
  before update on public.perfiles_ninos
  for each row execute function public.validar_ciempi();

-- Compra atómica: descuenta monedas, agrega al inventario y lo registra.
create function public.comprar_para_ciempi(p_perfil uuid, p_item text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_precio integer;
  v_perfil public.perfiles_ninos;
begin
  if not public.puede_ver_nino(p_perfil) then raise exception 'No tienes acceso a este niño'; end if;
  select precio into v_precio from public.items_tienda where id = p_item and activo;
  if v_precio is null then raise exception 'Eso no está en la tienda'; end if;

  select * into v_perfil from public.perfiles_ninos where id = p_perfil for update;
  if v_precio = 0 or p_item = any (v_perfil.inventario) then
    return jsonb_build_object('monedas', v_perfil.monedas, 'inventario', to_jsonb(v_perfil.inventario));
  end if;
  if v_perfil.monedas < v_precio then
    raise exception 'Te faltan % monedas', v_precio - v_perfil.monedas;
  end if;

  update public.perfiles_ninos
     set monedas = monedas - v_precio, inventario = array_append(inventario, p_item)
   where id = p_perfil
  returning * into v_perfil;
  insert into public.compras (usuario_id, perfil_id, item_id, precio_pagado)
  values (auth.uid(), p_perfil, p_item, v_precio);
  return jsonb_build_object('monedas', v_perfil.monedas, 'inventario', to_jsonb(v_perfil.inventario));
end $$;

revoke execute on function public.comprar_para_ciempi(uuid, text) from anon, public;
grant execute on function public.comprar_para_ciempi(uuid, text) to authenticated;
