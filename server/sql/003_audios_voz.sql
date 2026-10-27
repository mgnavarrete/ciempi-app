-- Audio ya generado por la voz de Ciempi (server/voz): cada palabra se genera una sola vez.
-- La clave es voz|velocidad|texto. Solo se guardan textos cortos (palabras), no frases.
create table audios_voz (
  clave     text primary key,
  audio     bytea not null,
  creado_en timestamptz not null default now()
);
