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
alter table cuentas add column pin_hash text check (pin_hash is null or pin_hash like 'scrypt$%');
alter table cuentas add column pin_cambiado_en timestamptz;

-- ── Autorización de cada libro en la biblioteca del niño ─────────────────
-- pendiente: lo agregó el propio niño; se puede leer, pero no paga.
-- autorizada: lo agregó un adulto, es un cuento de Ciempi o un adulto lo aprobó.
alter table asignaciones add column autorizacion text not null default 'autorizada'
  check (autorizacion in ('pendiente', 'autorizada'));
alter table asignaciones add column autorizada_por uuid references usuarios (id) on delete set null;
alter table asignaciones add column autorizada_en timestamptz;
create index on asignaciones (perfil_id) where autorizacion = 'pendiente';

-- ── Intentos de PIN por niño ────────────────────────────────────────────
-- Quien prueba PINs desde el dispositivo del niño lo hace con la sesión del
-- niño: el límite es por niño, en la base (sobrevive a reinicios y sirve
-- con varios procesos). Se bloquea con espera creciente.
create table intentos_pin (
  perfil_id       uuid primary key references perfiles_ninos (id) on delete cascade,
  fallos          integer not null default 0 check (fallos >= 0),
  ultimo_fallo    timestamptz,
  bloqueado_hasta timestamptz
);
