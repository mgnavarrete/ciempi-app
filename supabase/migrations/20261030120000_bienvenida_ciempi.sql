-- Presentación de Ciempi: en la primera entrada el niño elige colores y gorro
-- sin gastar monedas, así que algunos básicos pasan a ser gratis.
update public.items_tienda set precio = 0
 where id in ('paleta-oceano', 'paleta-bosque', 'paleta-frutilla', 'cabeza-flor', 'cabeza-lazo');
