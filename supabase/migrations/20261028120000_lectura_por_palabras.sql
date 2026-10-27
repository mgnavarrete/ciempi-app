-- ════════════════════════════════════════════════════════════════════════
-- Lectura por palabras y "máximo leído"
--  • El umbral de ritmo pasa de sílabas/s a palabras/s (≈ la mitad).
--  • asignaciones.frase_maxima: hasta dónde llegó alguna vez el niño. Puede
--    volver atrás o repetir un capítulo sin perder monedas y sin volver a
--    ganarlas por lo ya leído.
-- ════════════════════════════════════════════════════════════════════════

alter table public.perfiles_ninos alter column ajustes set default '{
  "tamanoLetra": 44, "modoTranquilo": false,
  "velocidadVoz": 1, "umbralPalabrasPorSegundo": 1.5
}';

update public.perfiles_ninos
   set ajustes = (ajustes - 'umbralSilabasPorSegundo')
       || jsonb_build_object(
            'umbralPalabrasPorSegundo',
            least(4, greatest(0.5, round(coalesce((ajustes ->> 'umbralSilabasPorSegundo')::numeric, 3) / 2 * 4) / 4))
          )
 where ajustes ? 'umbralSilabasPorSegundo';

alter table public.asignaciones
  add column frase_maxima integer not null default 0 check (frase_maxima >= 0);

update public.asignaciones a
   set frase_maxima = case
     when a.estado = 'completada' then coalesce((select cardinality(t.frases) from public.textos t where t.id = a.texto_id), a.frase_actual)
     else a.frase_actual
   end;

-- frase_maxima nunca baja, aunque un dispositivo con datos viejos mande un valor menor.
create function public.mantener_frase_maxima()
returns trigger language plpgsql as $$
begin
  new.frase_maxima := greatest(new.frase_maxima, old.frase_maxima, new.frase_actual);
  return new;
end $$;

create trigger no_bajar_frase_maxima
  before update on public.asignaciones
  for each row execute function public.mantener_frase_maxima();
