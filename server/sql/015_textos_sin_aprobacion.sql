-- 2.5.1: los textos que agrega el niño ya no necesitan la aprobación del adulto.
-- Lo que hubiera quedado pendiente o rechazado pasa a autorizado (se lee y paga
-- como cualquier libro). No borra columnas ni tablas del PIN: quedan sin uso.
update asignaciones
   set autorizacion = 'autorizada', autorizada_en = coalesce(autorizada_en, now())
 where autorizacion in ('pendiente', 'rechazada');
