-- CIEMPI 2.5: las monedas por leer las calcula y registra el servidor.
-- Antes la app decía «súmale N» (POST /api/perfiles/:id/monedas) y el servidor
-- lo creía. Ahora la app dice «leí hasta la frase N» y el servidor calcula con
-- src/lectura/monedas.ts lo que corresponde, una sola vez, y lo anota aquí.
-- Ver docs/expansion-ciempi/economia/SEGURIDAD-MONEDAS.md.
--
-- No borra nada: el saldo de cada niño se conserva tal cual, y lo ya leído
-- (leido_hasta, premio_hasta, relectura_premiada_en) queda como ya pagado.

-- ── Registro de premios (ledger) ────────────────────────────────────────
-- Una fila por cada pedido de premio atendido (pague o no). `operation_id` lo
-- genera la app: si el mismo pedido llega dos veces (reintento, cola sin
-- conexión), la segunda vez se responde lo mismo y no se paga de nuevo.
create table premios (
  id            bigserial primary key,
  perfil_id     uuid not null references perfiles_ninos (id) on delete cascade,
  operation_id  text not null check (char_length(operation_id) between 8 and 100),
  asignacion_id uuid references asignaciones (id) on delete set null,
  usuario_id    uuid references usuarios (id) on delete set null,
  -- avance / relectura: por leer. ajuste: un adulto suma o resta a mano.
  -- legado: una app anterior pidió monedas con el endpoint viejo (no se pagan; queda para medir).
  -- saldo_inicial: el saldo que tenía cada niño al llegar este registro.
  tipo          text not null check (tipo in ('avance', 'relectura', 'ajuste', 'legado', 'saldo_inicial')),
  nivel         smallint check (nivel between 0 and 4),
  hasta         integer check (hasta >= 0),
  -- Lo que la app creía que ganaba (solo para revisar; no se usa para pagar).
  solicitadas   integer,
  -- Lo que se pagó de verdad (negativo solo en un ajuste de un adulto).
  monedas       integer not null,
  saldo         integer not null check (saldo >= 0),
  detalle       jsonb not null default '{}' check (jsonb_typeof(detalle) = 'object'),
  creado_en     timestamptz not null default now(),
  unique (perfil_id, operation_id)
);
create index on premios (perfil_id, creado_en desc);
create index on premios (asignacion_id);

-- ── Lo ya pagado de cada texto, por niño ────────────────────────────────
-- Además de la asignación (que se borra si se quita el libro), se guarda por
-- texto: los cuentos de Ciempi por su id ('texto:<id>') y lo que sube un
-- adulto o un niño por la huella de su contenido ('huella:<sha256>'). Así,
-- borrar un texto y volver a subirlo (o quitar y volver a agregar un libro)
-- no vuelve a pagar lo mismo.
create table lecturas_premiadas (
  perfil_id      uuid not null references perfiles_ninos (id) on delete cascade,
  clave          text not null check (char_length(clave) <= 100),
  pagado_hasta   integer not null default 0 check (pagado_hasta >= 0),
  hitos_hasta    smallint not null default 0 check (hitos_hasta between 0 and 100),
  relectura_dia  date,
  actualizado_en timestamptz not null default now(),
  primary key (perfil_id, clave)
);

-- Huella del contenido de un texto (la calcula el servidor al guardarlo o al
-- necesitarla; los textos anteriores la reciben la primera vez que se usan).
alter table textos add column huella text check (huella is null or huella ~ '^[0-9a-f]{64}$');

-- Hasta qué frase ya se pagó cada libro. Solo lo escribe el servidor al pagar
-- (leido_hasta lo sigue mandando la app, para retomar). premio_hasta y
-- relectura_premiada_en también pasan a ser solo del servidor.
alter table asignaciones add column pagado_hasta integer not null default 0 check (pagado_hasta >= 0);
-- Con las reglas de 2.4.x la app pagaba exactamente al avanzar leido_hasta: lo leído ya está pagado.
update asignaciones set pagado_hasta = leido_hasta;

-- Reloj de lectura de cada niño (ver revisarRitmo en src/lectura/premios.ts):
-- no se paga más rápido de lo que se puede pasar el dedo por el texto.
alter table perfiles_ninos add column premios_reloj timestamptz;

-- El saldo de hoy queda como punto de partida del registro.
insert into premios (perfil_id, operation_id, tipo, monedas, saldo, detalle)
select id, 'saldo-inicial-012', 'saldo_inicial', monedas, monedas, jsonb_build_object('migracion', '012')
from perfiles_ninos;
