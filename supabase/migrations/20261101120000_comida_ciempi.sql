-- Lo que Ciempi se come en la pista de lectura: manzanas (gratis) y más.

alter table public.items_tienda drop constraint items_tienda_categoria_check;
alter table public.items_tienda add constraint items_tienda_categoria_check
  check (categoria in ('paleta', 'forma', 'ojos', 'cabeza', 'cara', 'pies', 'diseno', 'fondo', 'comida'));

insert into public.items_tienda (id, nombre, categoria, precio) values
  ('comida-manzana', 'Manzanas', 'comida', 0),
  ('comida-frutilla', 'Frutillas', 'comida', 8),
  ('comida-platano', 'Plátanos', 'comida', 8),
  ('comida-sandia', 'Sandía', 'comida', 10),
  ('comida-galleta', 'Galletas', 'comida', 10),
  ('comida-pelota', 'Pelotas', 'comida', 12),
  ('comida-dona', 'Donas', 'comida', 12),
  ('comida-cupcake', 'Cupcakes', 'comida', 15),
  ('comida-pizza', 'Pizza', 'comida', 15),
  ('comida-helado', 'Helados', 'comida', 15);

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
  foreach v_parte in array array['paleta', 'forma', 'ojos', 'cabeza', 'cara', 'pies', 'diseno', 'fondo', 'comida'] loop
    v_item := new.ciempi ->> v_parte;
    if v_item is not null
       and not (v_item = any (new.inventario))
       and coalesce((select precio from public.items_tienda where id = v_item and categoria = v_parte and activo), 1) > 0 then
      raise exception 'Primero hay que comprarlo';
    end if;
  end loop;
  return new;
end $$;
