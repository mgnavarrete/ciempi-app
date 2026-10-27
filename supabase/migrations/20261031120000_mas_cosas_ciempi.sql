-- ════════════════════════════════════════════════════════════════════════
-- Más cosas para Ciempi: forma del cuerpo, ojos, gorros, zapatos y diseños.
--  • Ciempi parte sin nada en la cabeza (cabeza-nada).
--  • Salen las pestañas y el bigote (quedan inactivos: no se venden más).
-- ════════════════════════════════════════════════════════════════════════

alter table public.items_tienda drop constraint items_tienda_categoria_check;
alter table public.items_tienda add constraint items_tienda_categoria_check
  check (categoria in ('paleta', 'forma', 'ojos', 'cabeza', 'cara', 'pies', 'diseno', 'fondo'));

insert into public.items_tienda (id, nombre, categoria, precio) values
  ('forma-circulo', 'Círculos', 'forma', 0),
  ('forma-cuadrado', 'Cuadrados', 'forma', 10),
  ('forma-triangulo', 'Triángulos', 'forma', 10),
  ('forma-rombo', 'Rombos', 'forma', 12),
  ('forma-hexagono', 'Hexágonos', 'forma', 12),
  ('forma-nube', 'Nubes', 'forma', 15),
  ('forma-corazon', 'Corazones', 'forma', 18),
  ('forma-estrella', 'Estrellas', 'forma', 20),
  ('ojos-normales', 'Normales', 'ojos', 0),
  ('ojos-azules', 'Azules', 'ojos', 6),
  ('ojos-verdes', 'Verdes', 'ojos', 6),
  ('ojos-miel', 'Color miel', 'ojos', 6),
  ('ojos-dormilones', 'Dormilones', 'ojos', 8),
  ('ojos-guino', 'Guiño', 'ojos', 10),
  ('ojos-estrellas', 'Estrellas', 'ojos', 15),
  ('ojos-corazones', 'Enamorados', 'ojos', 15),
  ('cabeza-nada', 'Nada', 'cabeza', 0),
  ('cabeza-audifonos', 'Audífonos', 'cabeza', 15),
  ('cabeza-pirata', 'Pirata', 'cabeza', 18),
  ('cabeza-unicornio', 'Unicornio', 'cabeza', 25),
  ('cara-lentes-corazon', 'Lentes de corazón', 'cara', 15),
  ('cara-antifaz', 'Antifaz de héroe', 'cara', 15),
  ('pies-futbol', 'De fútbol', 'pies', 12),
  ('pies-pantuflas', 'Pantuflas de conejo', 'pies', 15),
  ('pies-payaso', 'De payaso', 'pies', 15),
  ('pies-patines', 'Patines', 'pies', 20),
  ('diseno-flores', 'Flores', 'diseno', 12),
  ('diseno-huellitas', 'Huellitas', 'diseno', 12),
  ('diseno-rayos', 'Rayos', 'diseno', 15),
  ('diseno-llamas', 'Llamas', 'diseno', 18),
  ('diseno-autos', 'Autos', 'diseno', 20);

update public.items_tienda set activo = false where id in ('cara-pestanas', 'cara-bigote');

-- Quien tenía puestas pestañas o bigote queda con la cara despejada.
update public.perfiles_ninos set ciempi = jsonb_set(ciempi, '{cara}', '"cara-nada"')
 where ciempi ->> 'cara' in ('cara-pestanas', 'cara-bigote');

-- La validación revisa también la forma y los ojos.
create or replace function public.validar_ciempi()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_parte text;
  v_item text;
begin
  if new.ciempi is not distinct from old.ciempi then return new; end if;
  if char_length(coalesce(new.ciempi ->> 'nombre', '')) > 20 then
    raise exception 'El nombre de Ciempi puede tener hasta 20 letras';
  end if;
  foreach v_parte in array array['paleta', 'forma', 'ojos', 'cabeza', 'cara', 'pies', 'diseno', 'fondo'] loop
    v_item := new.ciempi ->> v_parte;
    if v_item is not null
       and not (v_item = any (new.inventario))
       and coalesce((select precio from public.items_tienda where id = v_item and categoria = v_parte and activo), 1) > 0 then
      raise exception 'Primero hay que comprarlo';
    end if;
  end loop;
  return new;
end $$;
