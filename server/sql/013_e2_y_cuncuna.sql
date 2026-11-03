-- CIEMPI 2.5 (experimental): estado de la economía E2 y desbloqueo de la Cuncuna.
-- Ver docs/expansion-ciempi/economia/SEGURIDAD-MONEDAS.md §10 y §11.
--
-- No destructiva: solo agrega columnas, una tabla, una función y filas nuevas;
-- no borra ni cambia saldos, progreso ni compras. Idempotente: se puede volver
-- a correr entera (if not exists, on conflict do nothing, create or replace),
-- aunque el migrador (server/src/db.ts) la aplica una sola vez.
--
-- Con la economía por defecto (2.4.1) las columnas E2 quedan sin usar.

-- ── Estado E2 por texto y niño (junto a lo ya pagado) ────────────────────
-- fraccion: parte de moneda acumulada en ese libro (se paga al juntar una entera).
-- libro_premiado: ya se decidió el premio por terminarlo (una vez; en textos propios, por huella).
-- activo_libro_segundos: segundos pagados en la primera lectura (para exigir ≥ 50 % de lo esperado).
-- mejor_tropiezos: la mejor lectura completa (para la «relectura con mejora»).
-- segundos_actividad: lectura activa acreditada con el reloj del servidor (vía del lector lento a la Cuncuna).
alter table lecturas_premiadas add column if not exists fraccion real not null default 0 check (fraccion >= 0 and fraccion < 1);
alter table lecturas_premiadas add column if not exists libro_premiado boolean not null default false;
alter table lecturas_premiadas add column if not exists activo_libro_segundos real not null default 0 check (activo_libro_segundos >= 0);
alter table lecturas_premiadas add column if not exists mejor_tropiezos integer check (mejor_tropiezos is null or mejor_tropiezos >= 0);
alter table lecturas_premiadas add column if not exists segundos_actividad real not null default 0 check (segundos_actividad >= 0);

-- Reloj de actividad de cada niño (ver acreditarActividad en src/lectura/premios.ts).
alter table perfiles_ninos add column if not exists actividad_reloj timestamptz;

-- Un tipo más en el registro: «releída» (E2: releer una unidad ya pagada paga por tiempo).
alter table premios drop constraint if exists premios_tipo_check;
alter table premios add constraint premios_tipo_check
  check (tipo in ('avance', 'relectura', 'releida', 'ajuste', 'legado', 'saldo_inicial'));

-- ── Desbloqueos (la Cuncuna) ────────────────────────────────────────────
-- Una fila por cosa desbloqueada por niño. estado 'por_celebrar': la app la
-- muestra con una celebración especial y luego la marca 'celebrado'.
create table if not exists desbloqueos (
  perfil_id    uuid not null references perfiles_ninos (id) on delete cascade,
  item         text not null check (char_length(item) <= 60),
  -- nivel0: 6 de los 8 cuentos originales de nivel 0 (o todos los que tenga, mínimo 4);
  -- cuentos: 6 cuentos de Ciempi distintos de cualquier nivel (quien parte en N1+);
  -- lector_lento: 60 min de lectura activa en cuentos de N0 y 30 frases distintas de N0;
  -- regalo: un adulto del niño, con un motivo.
  motivo       text not null check (motivo in ('nivel0', 'cuentos', 'lector_lento', 'regalo')),
  estado       text not null default 'por_celebrar' check (estado in ('por_celebrar', 'celebrado')),
  detalle      jsonb not null default '{}' check (jsonb_typeof(detalle) = 'object'),
  otorgado_por uuid references usuarios (id) on delete set null,
  otorgado_en  timestamptz not null default now(),
  celebrado_en timestamptz,
  primary key (perfil_id, item)
);

-- ¿Por qué se ganó la Cuncuna? (null: todavía no). La usan esta migración y el
-- servidor (server/src/desbloqueos.ts), así que la regla vive en un solo lugar.
-- «Terminado» = lo pagado por el servidor (asignación o lecturas_premiadas,
-- que sobrevive a quitar el libro) llega al total de frases; NO completada_en,
-- que lo fija la app. Solo cuentan los cuentos de Ciempi (origen 'ciempi').
create or replace function cuncuna_motivo(
  p uuid,
  originales_n0 uuid[],
  cuentos_minimos integer,
  minimo_si_quitaron integer,
  segundos_lento real,
  frases_lento integer
) returns text language sql stable as $$
  with cuentos as (
    select t.id = any (originales_n0) as es_n0,
           coalesce(array_length(t.frases, 1), 0) as total,
           greatest(coalesce(a.pagado_hasta, 0), coalesce(l.pagado_hasta, 0)) as pagado,
           coalesce(l.segundos_actividad, 0) as segundos,
           a.id is not null as asignado
      from textos t
      left join asignaciones a on a.texto_id = t.id and a.perfil_id = p
      left join lecturas_premiadas l on l.perfil_id = p and l.clave = 'texto:' || t.id::text
     where t.origen = 'ciempi'
  ), r as (
    select count(*) filter (where es_n0 and total > 0 and pagado >= total) as n0_terminados,
           count(*) filter (where es_n0 and asignado) as n0_asignados,
           count(*) filter (where total > 0 and pagado >= total) as terminados,
           coalesce(sum(segundos) filter (where es_n0), 0) as n0_segundos,
           coalesce(sum(least(pagado, total)) filter (where es_n0), 0) as n0_frases
      from cuentos
  )
  select case
    when n0_terminados >= least(cuentos_minimos, greatest(minimo_si_quitaron, n0_asignados)) then 'nivel0'
    when terminados >= cuentos_minimos then 'cuentos'
    when n0_segundos >= segundos_lento and n0_frases >= frases_lento then 'lector_lento'
  end
  from r
$$;

-- ── Retroactivo: quien ya cumple con lo leído hasta hoy recibe la Cuncuna ──
-- (con lo pagado; la vía del lector lento empieza a contar desde ahora porque
-- antes no había segundos acreditados por el servidor).
-- Los 8 cuentos originales de nivel 0 (src/contenido/cuentos.ts; una prueba lo coteja).
insert into desbloqueos (perfil_id, item, motivo, detalle)
select id, 'especie:cuncuna', m, jsonb_build_object('retroactivo', true, 'migracion', '013')
  from (
    select p.id, cuncuna_motivo(p.id, array[
      'c1e0a000-0000-4000-8000-000000000017', 'c1e0a000-0000-4000-8000-000000000018',
      'c1e0a000-0000-4000-8000-000000000019', 'c1e0a000-0000-4000-8000-000000000020',
      'c1e0a000-0000-4000-8000-000000000021', 'c1e0a000-0000-4000-8000-000000000022',
      'c1e0a000-0000-4000-8000-000000000023', 'c1e0a000-0000-4000-8000-000000000024'
    ]::uuid[], 6, 4, 3600, 30) as m
      from perfiles_ninos p
  ) x
 where m is not null
on conflict (perfil_id, item) do nothing;

-- Lo desbloqueado queda en el inventario (sin duplicar).
update perfiles_ninos p set inventario = array_append(p.inventario, d.item)
  from desbloqueos d
 where d.perfil_id = p.id and not (d.item = any (p.inventario));
