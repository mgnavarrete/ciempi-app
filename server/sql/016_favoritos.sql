-- 2.8: libros favoritos del niño (la estrella en la tarjeta de su biblioteca).
-- Es de cada niño y de cada libro de su biblioteca: vive en la asignación y se
-- sincroniza entre sus dispositivos. No borra nada: todo parte en "no favorito".
-- (016: si otra rama de 2.8 usa el mismo número, renumerar al fusionar.)
alter table asignaciones add column if not exists favorito boolean not null default false;
