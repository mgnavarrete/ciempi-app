-- 2.5.1: los textos que agrega el niño ya no necesitan la aprobación del adulto.
-- Lo que quedó pendiente pasa a autorizado (se lee y paga como cualquier libro).
-- Lo rechazado explícitamente por un adulto NO se toca: queda para revisarlo.
-- No borra columnas ni tablas del PIN: quedan sin uso.
update asignaciones
   set autorizacion = 'autorizada', autorizada_en = coalesce(autorizada_en, now())
 where autorizacion = 'pendiente';
