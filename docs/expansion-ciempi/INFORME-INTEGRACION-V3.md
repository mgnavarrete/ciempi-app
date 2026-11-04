# Informe de integración experimental V3 (sesión 4, 3-nov-2026)

Rama `expansion-v3-integracion` (worktree `.claude/worktrees/integracion`), desde `3e188ce` (producción 2.4.1).
**No se tocó `main`; no hubo push, despliegue ni APK; la economía y los precios reales no cambiaron.**
E2, el desbloqueo de la Cuncuna (efecto visible) y E08 están detrás de banderas, apagados por defecto,
salvo lo señalado en «Riesgos».

## 1. Qué contiene

| Línea | Commit de la rama | Merge en integración | Resumen |
|---|---|---|---|
| Seguridad + E2 + reloj + Cuncuna | `21910b1` | `aac98bf` | Bandera `ECONOMIA` (por defecto 2.4.1 idéntico), reloj del servidor (ráfaga 1 h), dificultad real, premio por terminar por huella, relectura con mejora, E2R apagada, migración 013 y desbloqueo de la Cuncuna, 23 pruebas de abuso |
| PIN de textos propios | `3401161` | `055eccc` | Migración 014, PIN scrypt en el servidor, intentos con espera creciente, aprobar/rechazar, texto pendiente no paga, pantallas de niño y adulto |
| Prueba combinada PIN + E2 | — | `37c1dd7` | Un texto pendiente con E2 no paga ni marca avance; al aprobarse paga desde 0 |
| Economía | `548ba79` | `36860d8` | Simulador reproducible, sensibilidad, mitigación N3/N4 (E2R), conservación de saldos, ECONOMIA-V3 §18 |
| Tienda | `ef867b3` | `f80aa87` | TIENDA-V3 coherente con lo aprobado |
| Animación E08 + crecimiento con especies | `e1945c5` | `c1ac6dc` | Bocas sorprendido/carcajada, máscaras sin segunda boca, interrupciones, `escenaCreciente(…, forma)` |
| Continuidad (PLAN-MAESTRO) | `e22ca61` | merge siguiente | §6, D3–D5 corregidos |
| Especies (Dragón/Cuncuna) | `bba72d3` | ya en `bfd83c4` | Cuerpos aprobados (AD-017) sin cambios |

Conflictos resueltos:
- `server/src/app.ts`, `premios.ts`, `repositoriosApi.ts`: imports de ambas ramas.
- `PantallaLectura.tsx`: la relectura de 2.4.1 respeta `sinMonedas` (PIN); E2 conserva su camino.
- `sinAutorizar` (PIN) ahora devuelve también `economia` y `desbloqueos: []` (exigido por E2): **un texto pendiente no desbloquea la Cuncuna**.
- `pose.ts`: un solo tipo `FormaCuerpo` importado de `especie.ts` (se borró la copia de la rama de animación).
- `e2.test.ts`: el texto subido por el niño ahora queda pendiente (correcto con el PIN); la prueba simula la aprobación del adulto.

## 2. Pruebas combinadas (verificadas en el árbol integrado)

| Prueba | Resultado |
|---|---|
| `npx tsc --noEmit -p .` | OK |
| `(cd server && npx tsc --noEmit)` | OK |
| `npx vitest run src` | **279/279** (29 archivos) |
| `vitest run server/test` contra `ciempi_test_integracion` | **79/79** (api 55 + E2 24) |
| Ciempi idéntico, crecimiento revelar vs recomponer (`capturas.mjs`) | **108/108** idénticos píxel a píxel |
| Especies: `escena(…, forma)` + rig vs `escenaCreciente(…, forma)` + `rig.crecer` (`comprobar-fusion.mjs`) | **234/234** idénticos (Dragón, Cuncuna, Ciempi; N = 0–6, 12, 40; con y sin animación; alas, mochila, máscara), 0 errores de consola |
| Ciempi idéntico a 2.4.1 en el laboratorio de especies (`probar-laboratorio.cjs`) | **35/35**, laboratorio sin errores ni avisos |
| Máscaras que tapan la boca (Robot Lumen, Espíritu, AraLuz) × 3 criaturas × 2 bocas | 0 bocas de Ciempi dibujadas |
| Demo E08 reconstruida (`construir.mjs` + `capturar.mjs`) | Hojas y videos generados, sin errores de consola; hoja inspeccionada visualmente |

Por separado, cada línea pasó sus propias pruebas (ver los informes de cada rama).

## 3. Cómo revisar (demostración integrada)

Desde la raíz del worktree de integración: `python3 -m http.server 8779 --bind 127.0.0.1` y abrir:

- **Índice de la demo:** `http://127.0.0.1:8779/docs/expansion-ciempi/demo-integrada.html`
- **Laboratorio de Dragón y Cuncuna** (con el código integrado): `docs/rediseno-ciempi/laboratorio-transformaciones/`
- **Demo E08** con selector de boca y vestuarios: `node docs/expansion-ciempi/animacion/demo-comer/servir.mjs` → `http://127.0.0.1:8773/`
- **Hoja de cuadros E08:** `http://127.0.0.1:8773/hoja.html` (mismo `servir.mjs`) (`?boca=carcajada` para comparar); imágenes en `animacion/hoja-e08/`
- **Flujo de PIN:** capturas a 390 px en `docs/expansion-ciempi/seguridad/pin/` (11 pasos)
- **Informe E2:** `docs/expansion-ciempi/economia/index.html` y `ECONOMIA-V3.md` §18
- **Seguridad:** `docs/expansion-ciempi/economia/SEGURIDAD-MONEDAS.md` §10–13 y `PIN-TEXTOS.md`

## 4. Verificado, inferido y pendiente

**Verificado:** las pruebas de §2; que la economía por defecto paga exactamente como 2.4.1; que los saldos no disminuyen con la migración (código y simulación); que las máscaras no muestran segunda boca; que el crecimiento con especies es idéntico a recomponer.

**Inferido (sin prueba directa):**
- El flujo E2 en la interfaz real (la app manda `segundosActivos`, `tropiezos`, `releida`), sin E2E ni capturas.
- Rendimiento de E08: sin regresión en Chromium de escritorio a 4× y 6×; no en Android.
- Riesgo del PIN de 4 dígitos (~0,4 % de acierto al mes por niño).

**Pendiente:**
- **Pantalla de celebración de la Cuncuna** (el servidor ya deja el estado `por_celebrar`; falta la pantalla).
- `useEscenaCreciente` en el juego todavía no recibe la especie (el núcleo ya lo soporta; falta conectar `componerCriatura` y `ESPECIES[id].forma`, que hoy viven en el laboratorio).
- Hitos de sílabas/palabras nuevas y premio de nivel completo de E2.
- Avisos al adulto (intentos de PIN fallidos, patrón «rondar»).
- Android real, Firefox, Safari y una APK antigua contra el servidor nuevo.
- E08: fruta delante del labio entre 0,24 y 0,38 s; en modo tranquilo abre la boca sin fruta; pop del segmento poco visible a 84 px.

## 5. Decisiones que necesita la usuaria

1. **E2R** (relectura a 1,5/min en todos los niveles) + **+15 por nivel completo retroactivo** para mitigar N3/N4.
2. **Vía lenta de la Cuncuna:** 60 min activos + 30 frases (implementado) o 45 min + 30 frases, o un marcapáginas en N0.
3. **E08:** boca definitiva y la reacción con máscara (rúbrica 4/3/3/4/3 en `animacion/RESULTADOS.md`).
4. **Máscara «Gatita»:** riesgo de parecido con Hello Kitty (sigue abierto).

## 6. Riesgos antes de desplegar

- **Cuncuna con la economía por defecto:** la migración 013 y el desbloqueo funcionan también con 2.4.1 y agregan la Cuncuna al inventario. No cambia monedas, pero **es un cambio visible** si se despliega sin decidirlo.
- **Apps antiguas contra un servidor con E2:** casi no ganan monedas por tiempo (no envían `segundosActivos`), y no muestran textos pendientes ni pueden aprobarlos.
- **Textos subidos por el niño** quedan pendientes: hasta que el adulto define un PIN, no pagan.
- **Retroactividad:** lo «pagado» antes de 2.5 sale de `leido_hasta`, que fijaba la app.
- **Abuso «rondar»** (tocar sin leer): ~2,1 monedas/min, igual que leer; solo se mitiga mostrándolo al adulto.
