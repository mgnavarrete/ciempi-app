-- Nivel Inicial (-1, antes del 0): palabras sueltas de sílabas directas, una manzana por
-- sílaba (como el nivel 0) y un dibujo al terminar cada palabra. Paga como el nivel 0.
alter table asignaciones drop constraint if exists asignaciones_nivel_check;
alter table asignaciones add constraint asignaciones_nivel_check check (nivel between -1 and 4);
alter table sesiones_lectura drop constraint if exists sesiones_lectura_nivel_check;
alter table sesiones_lectura add constraint sesiones_lectura_nivel_check check (nivel between -1 and 4);
alter table premios drop constraint if exists premios_nivel_check;
alter table premios add constraint premios_nivel_check check (nivel between -1 and 4);
