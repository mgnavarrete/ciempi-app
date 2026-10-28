-- Nivel 0 (sílabas): palabras cortas separadas en sílabas, una manzana por sílaba.
alter table asignaciones drop constraint if exists asignaciones_nivel_check;
alter table asignaciones add constraint asignaciones_nivel_check check (nivel between 0 and 4);
alter table sesiones_lectura drop constraint if exists sesiones_lectura_nivel_check;
alter table sesiones_lectura add constraint sesiones_lectura_nivel_check check (nivel between 0 and 4);
