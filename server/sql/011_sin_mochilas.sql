-- CIEMPI 2.2: las mochilas salen de la tienda hasta tener un diseño que se vea
-- puesto (se veían pegadas encima del cuerpo). Quien tenga una recibe sus
-- monedas al precio de 2.1 (también si vino en un conjunto) y sale del inventario.
-- La apariencia que la llevaba vuelve a «sin capa» al leerla (ya no existe en la tienda).
with mochilas(item_id, precio) as (
  values ('espalda:b09-robot', 25), ('espalda:b09-aventura', 20), ('espalda:b09-draco', 20), ('espalda:b09-mago', 20), ('espalda:b09-raton', 20)
), devolucion as (
  select p.id, sum(m.precio) as monedas
  from perfiles_ninos p join mochilas m on m.item_id = any (p.inventario)
  group by p.id
)
update perfiles_ninos p set monedas = p.monedas + d.monedas
from devolucion d
where d.id = p.id;

update perfiles_ninos
set inventario = array(select i from unnest(inventario) as i where i not like 'espalda:b09-%')
where exists (select 1 from unnest(inventario) as i where i like 'espalda:b09-%');
