-- Monedas por hitos de avance (25, 50, 75 y 100 % del libro). Cada libro se
-- lee siempre desde el comienzo; lo que se guarda es hasta dónde lo leyó de
-- verdad alguna vez y qué hitos ya se pagaron (no se pagan dos veces).
alter table asignaciones add column leido_hasta integer not null default 0 check (leido_hasta >= 0);
alter table asignaciones add column premio_hasta smallint not null default 0 check (premio_hasta between 0 and 100);
-- Releer un libro terminado da un premio menor, una vez por día.
alter table asignaciones add column relectura_premiada_en date;
-- Los libros ya terminados con el sistema anterior ya dieron su premio.
update asignaciones set premio_hasta = 100, leido_hasta = frase_maxima where completada_en is not null;
