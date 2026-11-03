# Checkpoint · economía v3 (pausa ordenada, 2026-11-03)

Son estimaciones con supuestos, no datos de niños. No se modificó código del juego ni precios.

## Completado
- **Auditoría con el código real**: `simulador/extraer-cuentos.mts` (troceo real de los 40 cuentos con `dividirConParrafos` + `vistaPorNivel` + `monedasDeUnidad`), `extraer-catalogo.mts` (precios reales) y `verificar-abusos.mts` (pagos de textos de abuso con el código real). Se ejecutan con `node --experimental-strip-types …` desde la raíz.
- **Simulador** `simulador/simular.mjs` (Node, sin dependencias, semilla 20261103, 400 niños por celda): perfiles P0–P4, sesiones de 10/15/20/30 min, campañas de 160 sesiones (relee o textos subidos), modelos M0 (actual), PREV, A, B, C, D, E.
- **Página** `index.html`, generada por `simulador/generar-informe.mjs`. Se revisó con Playwright en claro y oscuro, a 1280 y a 390 px: sin errores de consola y sin desbordamiento horizontal. El tooltip funciona. Tablas Markdown en `simulador/datos/tablas.md`.

## Resultados clave (mediana, 15 min con cuentos nuevos)
- **Actual**: P0 8 · P1 25 · P2 43 · P3 67 · P4 120. Brecha por minuto 15×. En 144 sesiones, P0 junta solo ~59: los tropiezos le quitan monedas para siempre y la relectura no paga en N0, N1 ni N3.
- **Propuesta previa** (N0 = 2/frase, tope 10): P0 pasa a 11 y la brecha a 11×. No resuelve el problema por sesión, porque el tope sigue siendo por cuento.
- **E (recomendado)**: P0 23 · P1 28 · P2 27 · P3 31 · P4 29. Brecha 1,35×, Gini 0,05. Peor abuso 2,3/min, frente a 36/min hoy. Caso «20 min por cuento»: 25 monedas, frente a 7 hoy.
- **Fugas verificadas**: un texto que se sugiere en N2 (sin tope) paga 305. Un texto de 1 frase asignado en N4 paga 40.
- **Total de los cuentos**: 703 monedas (N2 da 118, no 112). Catálogo completo: 1 350.

## Falta
- Redactar `ECONOMIA-V3.md` (el contenido y las cifras ya están en `index.html` y `datos/tablas.md`).
- Informe final.

## Próximos pasos
1. `node docs/expansion-ciempi/economia/simulador/simular.mjs && node docs/expansion-ciempi/economia/simulador/generar-informe.mjs`
2. Escribir `ECONOMIA-V3.md` a partir de `index.html` y `tablas.md`.
3. Commit.
