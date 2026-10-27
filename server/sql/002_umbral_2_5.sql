-- El umbral de ritmo por defecto pasó de 1,5 a 2,5 palabras por segundo.
-- Los niños que lo tenían guardado en el valor anterior toman el nuevo.
update perfiles_ninos
set ajustes = jsonb_set(ajustes, '{umbralPalabrasPorSegundo}', '2.5')
where (ajustes ->> 'umbralPalabrasPorSegundo')::numeric = 1.5;
