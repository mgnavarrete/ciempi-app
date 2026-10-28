-- Cuentos de Ciempi (src/contenido/cuentos.ts): vienen con la app, no tienen
-- dueño (nadie los puede borrar) y todo lector nuevo los recibe. Ver server/src/cuentos.ts.
alter table textos alter column subido_por drop not null;
alter table textos drop constraint if exists textos_origen_check;
alter table textos add constraint textos_origen_check check (origen in ('pegado', 'pdf', 'ejemplo', 'ciempi'));
alter table textos add constraint textos_cuentos_sin_dueno check ((origen = 'ciempi') = (subido_por is null));
create index on textos (origen) where origen = 'ciempi';

-- Frase donde empieza cada párrafo o estrofa (para el nivel 3). Null: el libro
-- se subió antes y los párrafos se arman por largo.
alter table textos add column parrafos integer[];
