-- El umbral de ritmo por defecto pasó de 2,5 al máximo (4 palabras por segundo).
-- Los niños que lo tenían en el valor anterior toman el nuevo.
update perfiles_ninos
set ajustes = jsonb_set(ajustes, '{umbralPalabrasPorSegundo}', '4')
where (ajustes ->> 'umbralPalabrasPorSegundo')::numeric = 2.5;
