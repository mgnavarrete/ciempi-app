-- ════════════════════════════════════════════════════════════════════════
-- Ciempi — base de datos (PostgreSQL 14+)
-- Refleja src/dominio/tipos.ts (camelCase en TypeScript ↔ snake_case aquí).
-- Los permisos (quién ve a qué niño, etc.) los aplica el servidor en cada
-- consulta (server/src/permisos.ts). La base asegura la integridad.
--
-- Datos mínimos de menores: apodo, ícono y usuario de acceso. Sin nombre
-- completo, fecha de nacimiento, correo, RUT, diagnóstico ni fotos.
-- ════════════════════════════════════════════════════════════════════════

-- ── Usuarios que inician sesión: adultos (correo) y niños (usuario) ─────
create table usuarios (
  id             uuid primary key default gen_random_uuid(),
  tipo           text not null check (tipo in ('adulto', 'nino')),
  correo         text unique check (correo is null or correo = lower(correo)),
  usuario        text unique check (usuario is null or usuario ~ '^[a-z0-9][a-z0-9._-]{2,19}$'),
  clave_hash     text not null,
  creado_en      timestamptz not null default now(),
  ultimo_ingreso timestamptz,
  -- Un adulto entra con correo; un niño, con usuario.
  check ((tipo = 'adulto' and correo is not null and usuario is null) or (tipo = 'nino' and usuario is not null and correo is null))
);

create table sesiones (
  token_hash  text primary key,
  usuario_id  uuid not null references usuarios (id) on delete cascade,
  expira_en   timestamptz not null,
  user_agent  text not null default '',
  creada_en   timestamptz not null default now()
);
create index on sesiones (usuario_id);

-- Enlaces de "recuperar contraseña" (de un solo uso, vencen en 1 hora).
create table recuperaciones (
  token_hash  text primary key,
  usuario_id  uuid not null references usuarios (id) on delete cascade,
  expira_en   timestamptz not null,
  usada       boolean not null default false
);

-- ── Adultos ─────────────────────────────────────────────────────────────
create table cuentas (
  id             uuid primary key references usuarios (id) on delete cascade,
  rol            text not null default 'apoderado' check (rol in ('terapeuta', 'apoderado')),
  nombre_visible text not null default ''
);

-- ── Niños ───────────────────────────────────────────────────────────────
create table perfiles_ninos (
  id          uuid primary key default gen_random_uuid(),
  creado_por  uuid not null references cuentas (id) on delete cascade,
  -- Su acceso propio (usuario + clave), si tiene.
  usuario_id  uuid unique references usuarios (id) on delete set null,
  apodo       text not null check (char_length(apodo) between 1 and 30),
  icono       text not null check (char_length(icono) <= 16),
  ajustes     jsonb not null default '{}' check (jsonb_typeof(ajustes) = 'object'),
  monedas     integer not null default 0 check (monedas >= 0),
  ciempi      jsonb not null default '{}' check (jsonb_typeof(ciempi) = 'object'),
  inventario  text[] not null default '{}',
  creado_en   timestamptz not null default now()
);

-- Adultos vinculados a cada niño (terapeuta, apoderado…).
create table miembros_nino (
  perfil_id  uuid not null references perfiles_ninos (id) on delete cascade,
  cuenta_id  uuid not null references cuentas (id) on delete cascade,
  rol        text not null check (rol in ('terapeuta', 'apoderado')),
  creado_en  timestamptz not null default now(),
  primary key (perfil_id, cuenta_id)
);
create index on miembros_nino (cuenta_id);

create table invitaciones_nino (
  codigo      text primary key check (codigo ~ '^[A-Z2-9]{6}$'),
  perfil_id   uuid not null references perfiles_ninos (id) on delete cascade,
  creada_por  uuid not null references cuentas (id) on delete cascade,
  expira_en   timestamptz not null default now() + interval '7 days',
  usada_por   uuid references cuentas (id) on delete set null,
  usada_en    timestamptz
);

-- ── Textos y libros ─────────────────────────────────────────────────────
create table textos (
  id              uuid primary key,
  -- Quien lo subió: un adulto o el propio niño. Solo él lo edita o borra.
  subido_por      uuid not null references usuarios (id) on delete cascade,
  titulo          text not null check (char_length(titulo) between 1 and 200),
  autor           text check (char_length(autor) <= 200),
  texto_original  text not null,
  frases          text[] not null default '{}',
  capitulos       jsonb not null default '[]' check (jsonb_typeof(capitulos) = 'array'),
  portada         text check (char_length(portada) <= 200000),
  origen          text not null default 'pegado' check (origen in ('pegado', 'pdf', 'ejemplo')),
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);
create index on textos (subido_por, actualizado_en desc);

-- ── Biblioteca del niño + progreso ──────────────────────────────────────
create table asignaciones (
  id             uuid primary key default gen_random_uuid(),
  asignada_por   uuid not null references usuarios (id) on delete cascade,
  perfil_id      uuid not null references perfiles_ninos (id) on delete cascade,
  texto_id       uuid not null references textos (id) on delete cascade,
  modo           text not null default 'coro' check (modo in ('coro', 'eco', 'solo')),
  estado         text not null default 'pendiente' check (estado in ('pendiente', 'en_curso', 'completada', 'archivada')),
  frase_actual   integer not null default 0 check (frase_actual >= 0),
  -- Hasta dónde llegó alguna vez: nunca baja (ver trigger).
  frase_maxima   integer not null default 0 check (frase_maxima >= 0),
  asignada_en    timestamptz not null default now(),
  actualizada_en timestamptz not null default now(),
  completada_en  timestamptz,
  unique (perfil_id, texto_id)
);
create index on asignaciones (texto_id);

create function mantener_frase_maxima() returns trigger language plpgsql as $$
begin
  new.frase_maxima := greatest(new.frase_maxima, old.frase_maxima, new.frase_actual);
  return new;
end $$;

create trigger no_bajar_frase_maxima before update on asignaciones
  for each row execute function mantener_frase_maxima();

-- ── Sesiones de lectura ─────────────────────────────────────────────────
create table sesiones_lectura (
  id                 uuid primary key,
  usuario_id         uuid not null references usuarios (id) on delete cascade,
  perfil_id          uuid not null references perfiles_ninos (id) on delete cascade,
  texto_id           uuid references textos (id) on delete set null,
  asignacion_id      uuid references asignaciones (id) on delete set null,
  modo               text not null check (modo in ('coro', 'eco', 'solo')),
  iniciada_en        timestamptz not null default now(),
  duracion_segundos  integer not null default 0 check (duracion_segundos >= 0),
  frases_completadas integer not null default 0 check (frases_completadas >= 0),
  frases_muy_rapido  integer not null default 0 check (frases_muy_rapido >= 0),
  silabas_leidas     integer not null default 0 check (silabas_leidas >= 0),
  monedas_ganadas    integer not null default 0 check (monedas_ganadas >= 0)
);
create index on sesiones_lectura (perfil_id, iniciada_en desc);

-- ── Tienda de Ciempi ────────────────────────────────────────────────────
-- El catálogo y los precios están en src/ciempi/catalogo.ts (lo usa el
-- servidor directamente). Aquí queda el historial de compras.
create table compras (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid not null references usuarios (id) on delete cascade,
  perfil_id     uuid not null references perfiles_ninos (id) on delete cascade,
  item_id       text not null,
  precio_pagado integer not null check (precio_pagado >= 0),
  comprada_en   timestamptz not null default now(),
  unique (perfil_id, item_id)
);
