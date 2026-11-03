-- CIEMPI: textos propios del niño con autorización de un adulto (PIN).
-- El niño sigue pudiendo escribir o subir sus textos y leerlos para practicar,
-- pero un texto que agrega él mismo no da monedas hasta que un adulto suyo lo
-- autoriza con su PIN. El PIN se verifica en el servidor.
-- Ver docs/expansion-ciempi/seguridad/PIN-TEXTOS.md.
--
-- No borra nada. Todo lo que ya está en las bibliotecas queda autorizado
-- (default 'autorizada'): nadie pierde libros ni monedas.
-- (El 013 lo reserva otra rama.)

-- ── PIN del adulto ──────────────────────────────────────────────────────
-- "scrypt$<sal>$<hash>" (el mismo formato que las contraseñas; ver auth.ts).
-- Null: el adulto todavía no lo crea (familias anteriores): lo crea cuando quiera.
alter table cuentas add column pin_hash text check (pin_hash is null or pin_hash like 'scrypt$%');
alter table cuentas add column pin_cambiado_en timestamptz;

-- ── Autorización de cada libro en la biblioteca del niño ─────────────────
-- pendiente: lo agregó el propio niño; se puede leer, pero no paga.
-- autorizada: lo agregó un adulto, es un cuento de Ciempi o un adulto lo aprobó.
-- rechazada: un adulto dijo que no; se puede seguir leyendo, pero no paga.
alter table asignaciones add column autorizacion text not null default 'autorizada'
  check (autorizacion in ('pendiente', 'autorizada', 'rechazada'));
alter table asignaciones add column autorizada_por uuid references usuarios (id) on delete set null;
alter table asignaciones add column autorizada_en timestamptz;
create index on asignaciones (perfil_id) where autorizacion = 'pendiente';

-- ── Intentos de PIN ─────────────────────────────────────────────────────
-- Por niño y por quien prueba (la sesión del niño o la de cada adulto): quien
-- prueba PINs desde el dispositivo del niño se bloquea, pero eso no bloquea al
-- adulto en su propio panel. En la base: sobrevive a reinicios y sirve con
-- varios procesos. Espera creciente.
create table intentos_pin (
  perfil_id       uuid not null references perfiles_ninos (id) on delete cascade,
  usuario_id      uuid not null references usuarios (id) on delete cascade,
  fallos          integer not null default 0 check (fallos >= 0),
  ultimo_fallo    timestamptz,
  bloqueado_hasta timestamptz,
  primary key (perfil_id, usuario_id)
);
