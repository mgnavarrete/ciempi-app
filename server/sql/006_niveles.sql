-- Niveles de lectura (1 palabra, 2 oración, 3 párrafo, 4 libre). El nivel es
-- del libro asignado a un niño: el mismo libro puede estar en otro nivel para otro.
alter table asignaciones add column nivel smallint not null default 1 check (nivel between 1 and 4);
alter table sesiones_lectura add column nivel smallint not null default 1 check (nivel between 1 and 4);
