-- ════════════════════════════════════════════════════════════════════════
-- Ciempi — esquema de Supabase (Postgres)
-- Refleja src/dominio/tipos.ts (camelCase en TypeScript ↔ snake_case aquí).
--
-- Usuarios:
--  • Niño: usuario + clave (sin correo). Lo crea un adulto admin. Entra a su
--    app, ve sus libros, sube PDF, borra lo que subió y cambia sus ajustes.
--  • Adulto admin (terapeuta o apoderado): correo + clave. Crea niños, les
--    asigna libros, ve su avance y les cambia la clave. Un niño puede tener
--    varios admins (miembros_nino), que se suman con un código de invitación.
--
-- Principios:
--  • RLS en todas las tablas. Las funciones auxiliares son SECURITY DEFINER
--    para que las políticas no se llamen entre sí (recursión).
--  • Datos mínimos de menores: apodo, ícono y usuario de acceso. Nada de
--    nombre completo, fecha de nacimiento, RUT, correo, diagnóstico ni foto.
--  • De un PDF se guarda solo el texto extraído y una miniatura.
-- ════════════════════════════════════════════════════════════════════════

-- ── Adultos ─────────────────────────────────────────────────────────────
create table public.cuentas (
  id             uuid primary key references auth.users (id) on delete cascade,
  rol            text not null default 'apoderado' check (rol in ('terapeuta', 'apoderado')),
  nombre_visible text not null default '',
  creada_en      timestamptz not null default now()
);

-- ── Niños ───────────────────────────────────────────────────────────────
create table public.perfiles_ninos (
  id            uuid primary key default gen_random_uuid(),
  creado_por    uuid not null default auth.uid() references public.cuentas (id) on delete cascade,
  apodo         text not null check (char_length(apodo) between 1 and 30),
  icono         text not null check (char_length(icono) <= 16),
  -- Usuario con el que el niño entra (minúsculas, sin correo).
  usuario       text unique check (usuario ~ '^[a-z0-9][a-z0-9._-]{2,19}$'),
  -- Su usuario de Auth, una vez creada la cuenta.
  usuario_id    uuid unique references auth.users (id) on delete set null,
  ajustes       jsonb not null default '{
    "tamanoLetra": 44, "modoTranquilo": false,
    "velocidadVoz": 1, "umbralSilabasPorSegundo": 3
  }' check (jsonb_typeof(ajustes) = 'object'),
  monedas       integer not null default 0 check (monedas >= 0),
  creado_en     timestamptz not null default now()
);

-- Secreto de un solo uso para crear la cuenta del niño (ver preparar_cuenta_nino).
-- Tiene RLS sin políticas: nadie lo lee desde la app, solo las funciones.
create table public.altas_nino (
  perfil_id  uuid primary key references public.perfiles_ninos (id) on delete cascade,
  secreto    uuid not null default gen_random_uuid(),
  creada_en  timestamptz not null default now()
);

create table public.miembros_nino (
  perfil_id  uuid not null references public.perfiles_ninos (id) on delete cascade,
  cuenta_id  uuid not null references public.cuentas (id) on delete cascade,
  rol        text not null check (rol in ('terapeuta', 'apoderado')),
  creado_en  timestamptz not null default now(),
  primary key (perfil_id, cuenta_id)
);
create index on public.miembros_nino (cuenta_id);

create table public.invitaciones_nino (
  codigo      text primary key check (codigo ~ '^[A-Z2-9]{6}$'),
  perfil_id   uuid not null references public.perfiles_ninos (id) on delete cascade,
  creada_por  uuid not null references public.cuentas (id) on delete cascade,
  expira_en   timestamptz not null default now() + interval '7 days',
  usada_por   uuid references public.cuentas (id) on delete set null,
  usada_en    timestamptz
);

-- ── Textos y libros ─────────────────────────────────────────────────────
create table public.textos (
  id              uuid primary key default gen_random_uuid(),
  -- Quien lo subió: un adulto o el propio niño.
  subido_por      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo          text not null check (char_length(titulo) between 1 and 200),
  autor           text check (char_length(autor) <= 200),
  texto_original  text not null,
  frases          text[] not null default '{}',
  -- [{ "titulo": "Enero 4", "desdeFrase": 129 }, …]
  capitulos       jsonb not null default '[]' check (jsonb_typeof(capitulos) = 'array'),
  -- Miniatura de la portada (data URL JPEG, ~20 KB).
  portada         text check (char_length(portada) <= 200000),
  origen          text not null default 'pegado' check (origen in ('pegado', 'pdf', 'ejemplo')),
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);
create index on public.textos (subido_por, actualizado_en desc);

-- ── Biblioteca del niño + progreso ──────────────────────────────────────
create table public.asignaciones (
  id             uuid primary key default gen_random_uuid(),
  asignada_por   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  perfil_id      uuid not null references public.perfiles_ninos (id) on delete cascade,
  texto_id       uuid not null references public.textos (id) on delete cascade,
  modo           text not null default 'coro' check (modo in ('coro', 'eco', 'solo')),
  estado         text not null default 'pendiente'
                 check (estado in ('pendiente', 'en_curso', 'completada', 'archivada')),
  frase_actual   integer not null default 0 check (frase_actual >= 0),
  asignada_en    timestamptz not null default now(),
  actualizada_en timestamptz not null default now(),
  completada_en  timestamptz,
  unique (perfil_id, texto_id)
);
create index on public.asignaciones (texto_id);

-- ── Sesiones de lectura ─────────────────────────────────────────────────
create table public.sesiones_lectura (
  id                 uuid primary key default gen_random_uuid(),
  -- Usuario con sesión iniciada al leer (normalmente el propio niño).
  usuario_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  perfil_id          uuid not null references public.perfiles_ninos (id) on delete cascade,
  texto_id           uuid references public.textos (id) on delete set null,
  asignacion_id      uuid references public.asignaciones (id) on delete set null,
  modo               text not null check (modo in ('coro', 'eco', 'solo')),
  iniciada_en        timestamptz not null default now(),
  duracion_segundos  integer not null default 0 check (duracion_segundos >= 0),
  frases_completadas integer not null default 0 check (frases_completadas >= 0),
  frases_muy_rapido  integer not null default 0 check (frases_muy_rapido >= 0),
  silabas_leidas     integer not null default 0 check (silabas_leidas >= 0),
  monedas_ganadas    integer not null default 0 check (monedas_ganadas >= 0)
);
create index on public.sesiones_lectura (perfil_id, iniciada_en desc);

-- ── Tienda (fase futura) ────────────────────────────────────────────────
create table public.items_tienda (
  id        uuid primary key default gen_random_uuid(),
  nombre    text not null,
  categoria text not null check (categoria in ('color', 'accesorio', 'fondo', 'voz')),
  precio    integer not null check (precio >= 0),
  datos     jsonb not null default '{}',
  activo    boolean not null default true
);

create table public.compras (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  perfil_id     uuid not null references public.perfiles_ninos (id) on delete cascade,
  item_id       uuid not null references public.items_tienda (id),
  precio_pagado integer not null check (precio_pagado >= 0),
  comprada_en   timestamptz not null default now(),
  unique (perfil_id, item_id)
);

-- ════════════════════════════════════════════════════════════════════════
-- Funciones auxiliares (para RLS)
-- ════════════════════════════════════════════════════════════════════════

-- Adulto vinculado al niño.
create function public.es_admin_de(p_perfil uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.miembros_nino
     where perfil_id = p_perfil and cuenta_id = (select auth.uid())
  );
$$;

-- El propio niño o uno de sus adultos.
create function public.puede_ver_nino(p_perfil uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.es_admin_de(p_perfil)
      or exists (select 1 from public.perfiles_ninos where id = p_perfil and usuario_id = (select auth.uid()));
$$;

-- Un texto es visible si es propio o está en la biblioteca de un niño visible.
create function public.puede_ver_texto(p_texto uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.textos where id = p_texto and subido_por = (select auth.uid()))
      or exists (
        select 1 from public.asignaciones a
         where a.texto_id = p_texto and public.puede_ver_nino(a.perfil_id)
      );
$$;

create function public.es_dueno_texto(p_texto uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.textos where id = p_texto and subido_por = (select auth.uid()));
$$;

create function public.es_adulto()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.cuentas where id = (select auth.uid()));
$$;

-- ════════════════════════════════════════════════════════════════════════
-- Triggers
-- ════════════════════════════════════════════════════════════════════════

-- Al registrarse en Auth:
--  • niño: vincula el usuario al perfil, solo si trae el secreto de alta correcto;
--  • adulto: crea su fila en cuentas.
create function public.al_registrar_usuario()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}');
begin
  if v_meta ->> 'tipo' = 'nino' then
    delete from public.altas_nino
     where perfil_id = (v_meta ->> 'perfil_id')::uuid
       and secreto = (v_meta ->> 'secreto')::uuid
       and creada_en > now() - interval '1 hour';
    if not found then
      raise exception 'Alta de niño no autorizada';
    end if;
    update public.perfiles_ninos set usuario_id = new.id
     where id = (v_meta ->> 'perfil_id')::uuid and usuario_id is null;
    if not found then
      raise exception 'Este niño ya tiene cuenta';
    end if;
  else
    insert into public.cuentas (id, rol, nombre_visible)
    values (
      new.id,
      case when v_meta ->> 'rol' = 'terapeuta' then 'terapeuta' else 'apoderado' end,
      coalesce(v_meta ->> 'nombre_visible', '')
    );
  end if;
  return new;
end $$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.al_registrar_usuario();

-- Quien crea al niño queda como su admin.
create function public.vincular_creador()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.miembros_nino (perfil_id, cuenta_id, rol)
  select new.id, new.creado_por, c.rol from public.cuentas c where c.id = new.creado_por;
  return new;
end $$;

create trigger al_crear_nino
  after insert on public.perfiles_ninos
  for each row execute function public.vincular_creador();

-- ════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════════════════
alter table public.cuentas           enable row level security;
alter table public.perfiles_ninos    enable row level security;
alter table public.altas_nino        enable row level security;
alter table public.miembros_nino     enable row level security;
alter table public.invitaciones_nino enable row level security;
alter table public.textos            enable row level security;
alter table public.asignaciones      enable row level security;
alter table public.sesiones_lectura  enable row level security;
alter table public.items_tienda      enable row level security;
alter table public.compras           enable row level security;

create policy "ver la propia" on public.cuentas for select to authenticated using (id = (select auth.uid()));
create policy "editar la propia" on public.cuentas for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Niños: los ven el niño y sus admins; solo los adultos crean; borra quien creó.
create policy "ver niño" on public.perfiles_ninos for select to authenticated
  using (public.puede_ver_nino(id) or creado_por = (select auth.uid()));
create policy "crear niño" on public.perfiles_ninos for insert to authenticated
  with check (creado_por = (select auth.uid()) and public.es_adulto());
create policy "editar niño" on public.perfiles_ninos for update to authenticated
  using (public.puede_ver_nino(id)) with check (public.puede_ver_nino(id));
create policy "borrar niño creado" on public.perfiles_ninos for delete to authenticated
  using (creado_por = (select auth.uid()));
-- Por columnas: se editan apodo, ícono y ajustes. Monedas, usuario y cuenta solo por RPC/trigger.
revoke update on public.perfiles_ninos from authenticated, anon;
grant update (apodo, icono, ajustes) on public.perfiles_ninos to authenticated;

create policy "ver admins del niño" on public.miembros_nino for select to authenticated
  using (public.puede_ver_nino(perfil_id));
create policy "desvincularme" on public.miembros_nino for delete to authenticated
  using (cuenta_id = (select auth.uid()));

create policy "ver mis invitaciones" on public.invitaciones_nino for select to authenticated
  using (creada_por = (select auth.uid()));

create policy "ver textos" on public.textos for select to authenticated
  using (subido_por = (select auth.uid()) or public.puede_ver_texto(id));
create policy "subir textos" on public.textos for insert to authenticated
  with check (subido_por = (select auth.uid()));
create policy "editar textos propios" on public.textos for update to authenticated
  using (subido_por = (select auth.uid())) with check (subido_por = (select auth.uid()));
create policy "borrar textos propios" on public.textos for delete to authenticated
  using (subido_por = (select auth.uid()));

-- Biblioteca: niño y admins la ven y guardan progreso; agregar libros, ambos;
-- quitar: un admin, o el niño si el libro lo subió él.
create policy "ver biblioteca" on public.asignaciones for select to authenticated
  using (public.puede_ver_nino(perfil_id));
create policy "agregar a biblioteca" on public.asignaciones for insert to authenticated
  with check (public.puede_ver_nino(perfil_id) and asignada_por = (select auth.uid()) and public.puede_ver_texto(texto_id));
create policy "guardar progreso" on public.asignaciones for update to authenticated
  using (public.puede_ver_nino(perfil_id)) with check (public.puede_ver_nino(perfil_id));
create policy "quitar de biblioteca" on public.asignaciones for delete to authenticated
  using (public.es_admin_de(perfil_id) or (public.puede_ver_nino(perfil_id) and public.es_dueno_texto(texto_id)));

create policy "ver sesiones" on public.sesiones_lectura for select to authenticated
  using (public.puede_ver_nino(perfil_id));
create policy "registrar sesión" on public.sesiones_lectura for insert to authenticated
  with check (public.puede_ver_nino(perfil_id) and usuario_id = (select auth.uid()));
create policy "actualizar sesión" on public.sesiones_lectura for update to authenticated
  using (public.puede_ver_nino(perfil_id) and usuario_id = (select auth.uid()))
  with check (public.puede_ver_nino(perfil_id) and usuario_id = (select auth.uid()));

create policy "catálogo visible" on public.items_tienda for select to authenticated using (activo);
create policy "ver compras" on public.compras for select to authenticated using (public.puede_ver_nino(perfil_id));

-- ════════════════════════════════════════════════════════════════════════
-- Funciones (RPC)
-- ════════════════════════════════════════════════════════════════════════

-- Suma (o resta) monedas, nunca bajo cero. Lo pueden hacer el niño y sus admins.
create function public.sumar_monedas(p_perfil uuid, p_cantidad integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare v integer;
begin
  if not public.puede_ver_nino(p_perfil) then raise exception 'No tienes acceso a este niño'; end if;
  update public.perfiles_ninos set monedas = greatest(0, monedas + p_cantidad)
   where id = p_perfil returning monedas into v;
  return v;
end $$;

-- Paso 1 para crear la cuenta del niño: reserva el usuario y entrega un
-- secreto de un solo uso. Paso 2 (en la app): signUp con tipo = 'nino',
-- perfil_id y ese secreto; el trigger al_registrar_usuario lo valida.
create function public.preparar_cuenta_nino(p_perfil uuid, p_usuario text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_usuario text := lower(trim(p_usuario));
  v_secreto uuid;
begin
  if not public.es_admin_de(p_perfil) then raise exception 'No tienes acceso a este niño'; end if;
  if v_usuario !~ '^[a-z0-9][a-z0-9._-]{2,19}$' then
    raise exception 'El usuario debe tener entre 3 y 20 letras o números, sin espacios';
  end if;
  if exists (select 1 from public.perfiles_ninos where usuario = v_usuario and id <> p_perfil) then
    raise exception 'Ese usuario ya existe, prueba con otro';
  end if;
  update public.perfiles_ninos set usuario = v_usuario where id = p_perfil and usuario_id is null;
  if not found then raise exception 'Este niño ya tiene cuenta: usa «cambiar clave»'; end if;
  insert into public.altas_nino (perfil_id) values (p_perfil)
  on conflict (perfil_id) do update set secreto = gen_random_uuid(), creada_en = now()
  returning secreto into v_secreto;
  return v_secreto;
end $$;

-- Un admin cambia la clave del niño (por si la olvida).
create function public.cambiar_clave_nino(p_perfil uuid, p_clave text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_usuario uuid;
begin
  if not public.es_admin_de(p_perfil) then raise exception 'No tienes acceso a este niño'; end if;
  if char_length(p_clave) < 6 then raise exception 'La clave debe tener al menos 6 caracteres'; end if;
  select usuario_id into v_usuario from public.perfiles_ninos where id = p_perfil;
  if v_usuario is null then raise exception 'Este niño todavía no tiene cuenta'; end if;
  update auth.users
     set encrypted_password = extensions.crypt(p_clave, extensions.gen_salt('bf')), updated_at = now()
   where id = v_usuario;
end $$;

-- Código para que otro adulto se sume como admin del niño.
create function public.crear_invitacion(p_perfil uuid)
returns public.invitaciones_nino language plpgsql security definer set search_path = '' as $$
declare
  v_alfabeto constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_codigo text;
  v_inv public.invitaciones_nino;
begin
  if not public.es_admin_de(p_perfil) then raise exception 'No tienes acceso a este niño'; end if;
  loop
    select string_agg(substr(v_alfabeto, 1 + floor(random() * length(v_alfabeto))::int, 1), '')
      into v_codigo from generate_series(1, 6);
    begin
      insert into public.invitaciones_nino (codigo, perfil_id, creada_por)
      values (v_codigo, p_perfil, auth.uid()) returning * into v_inv;
      return v_inv;
    exception when unique_violation then
      -- Código repetido: se intenta otro.
    end;
  end loop;
end $$;

create function public.canjear_invitacion(p_codigo text)
returns public.perfiles_ninos language plpgsql security definer set search_path = '' as $$
declare
  v_inv public.invitaciones_nino;
  v_perfil public.perfiles_ninos;
begin
  if not public.es_adulto() then raise exception 'Solo una cuenta de adulto puede canjear códigos'; end if;
  select * into v_inv from public.invitaciones_nino where codigo = upper(trim(p_codigo)) for update;
  if v_inv is null or v_inv.usada_por is not null or v_inv.expira_en < now() then
    raise exception 'Código inválido o vencido';
  end if;
  insert into public.miembros_nino (perfil_id, cuenta_id, rol)
  select v_inv.perfil_id, c.id, c.rol from public.cuentas c where c.id = auth.uid()
  on conflict do nothing;
  update public.invitaciones_nino set usada_por = auth.uid(), usada_en = now() where codigo = v_inv.codigo;
  select * into v_perfil from public.perfiles_ninos where id = v_inv.perfil_id;
  return v_perfil;
end $$;

create function public.comprar(p_perfil uuid, p_item uuid)
returns public.compras language plpgsql security definer set search_path = '' as $$
declare
  v_precio integer;
  v_compra public.compras;
begin
  if not public.puede_ver_nino(p_perfil) then raise exception 'No tienes acceso a este niño'; end if;
  select precio into v_precio from public.items_tienda where id = p_item and activo;
  if v_precio is null then raise exception 'Ítem no disponible'; end if;
  update public.perfiles_ninos set monedas = monedas - v_precio where id = p_perfil and monedas >= v_precio;
  if not found then raise exception 'Monedas insuficientes'; end if;
  insert into public.compras (usuario_id, perfil_id, item_id, precio_pagado)
  values (auth.uid(), p_perfil, p_item, v_precio) returning * into v_compra;
  return v_compra;
end $$;

-- Las funciones no se exponen a usuarios anónimos.
revoke execute on all functions in schema public from anon, public;
grant execute on function
  public.es_admin_de(uuid), public.puede_ver_nino(uuid), public.puede_ver_texto(uuid),
  public.es_dueno_texto(uuid), public.es_adulto(),
  public.sumar_monedas(uuid, integer), public.preparar_cuenta_nino(uuid, text),
  public.cambiar_clave_nino(uuid, text), public.crear_invitacion(uuid),
  public.canjear_invitacion(text), public.comprar(uuid, uuid)
to authenticated;
-- El trigger de Auth corre como supabase_auth_admin.
grant execute on function public.al_registrar_usuario() to supabase_auth_admin;
