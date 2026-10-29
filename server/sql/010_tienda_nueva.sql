-- CIEMPI 2.1: la tienda de Ciempi vende solo los diseños nuevos (ids «categoría:diseño»).
-- Lo comprado en la tienda anterior (formas, diseños, gorros, lentes, zapatos,
-- ojos y colores del Ciempi clásico) se devuelve en monedas, por lo que se pagó
-- de verdad, y sale del inventario. Fondos y comida siguen igual. La apariencia
-- guardada se normaliza al leerla (lo que ya no existe vuelve al Ciempi inicial).
create table devoluciones_tienda (
  perfil_id   uuid primary key references perfiles_ninos (id) on delete cascade,
  monedas     integer not null check (monedas >= 0),
  items       text[] not null,
  devuelta_en timestamptz not null default now()
);

insert into devoluciones_tienda (perfil_id, monedas, items)
select perfil_id, sum(precio_pagado), array_agg(item_id order by item_id)
from compras
where position(':' in item_id) = 0 and item_id not like 'fondo-%' and item_id not like 'comida-%'
group by perfil_id;

update perfiles_ninos p set monedas = p.monedas + d.monedas
from devoluciones_tienda d
where d.perfil_id = p.id;

update perfiles_ninos
set inventario = array(select i from unnest(inventario) as i where position(':' in i) > 0 or i like 'fondo-%' or i like 'comida-%');
