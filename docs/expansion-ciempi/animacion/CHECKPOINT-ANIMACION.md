# Checkpoint · animación de comer y rendimiento (pausa ordenada, 2026-11-03)

> **Actualización:** la medición "después", la demo, la hoja de E08 y la decisión de flags están en [RESULTADOS.md](RESULTADOS.md).

Trabajo **incompleto**: se pausó a pedido del coordinador. Nada se integró al juego por defecto salvo lo indicado en "Riesgo".

## Mediciones obtenidas (antes, sin optimizar)

Banco: `medicion/banco.html` + `banco.tsx` (el `<Ciempi>` real del carril), `medicion/medir.mjs` (build de producción, Chromium 1248 headless, 412×600, DPR 2, conjunto típico: gorro mago raster + capa heroica + superficie b11-mago, N 0→40 a 500 ms/unidad caminando A02, 3 repeticiones). La CPU frenada (`Emulation.setCPUThrottlingRate`) es una aproximación, **no un Android real**. Datos completos en `medicion/resultados/antes.json`.

| CPU | Unidad mediana / p95 / máx (ms) | Mov. dedo mediana / p95 (ms) | FPS | Cuadros perdidos | Tareas largas | Heap fin (MB) | Nodos DOM |
|---|---|---|---|---|---|---|---|
| 1× | 5,9 / 10,6 / 18,6 | 0,3 / 0,7 | 60 | 0 | 0 | 3,7 | 1085 |
| 4× | 27,1 / 43,7 / 64,6 | 1,2 / 2,6 | 57,8 | 46 (3,7 %) | 11 (628 ms) | 3,7 | 1085 |
| 6× | 53,9 / 106,2 / 133,1 | 2,4 / 5,5 | 49,4 | 219 (17,7 %) | 35 (3052 ms) | 3,7 | 1085 |

Desglose aislado por unidad (N 26–40, mediana): `escena()` (DOMParser + serializar) 4,9 / 27,5 / 55,4 ms (1×/4×/6×); innerHTML 1,3 / 7,1 / 14,1; crearRig 0,4 / 2,1 / 4,9; estilo y geometría forzados 2,3 / 12,7 / 26,8. Traza 6× (20,6 s): hilo principal ocupado 16,1 s; FireAnimationFrame 6,0 s; UpdateLayoutTree 2,3; Paint 2,3; Layerize 1,6; PrePaint 1,2; Layout 0,76.
**Cuellos de botella:** (1) recomponer la escena con cada unidad (`escena()` domina); (2) a 6×, el costo fijo por cuadro (rig + estilo/pintado de todo el SVG) queda cerca del presupuesto.

Después (parcial): solo se alcanzó `recomponer` + memo de comidas a 1×: unidad 6,3–7,5 ms (sin diferencia relevante). **Falta medir `revelar` (1×/4×/6×).**

## Optimizaciones hechas (código listo, medición pendiente)

- `pose.ts`: nueva `escenaCreciente(svg, nMax, prefijo)` (solo se añadió; `escena` intacta).
- `rig.js`: `rig.crecer(n, posiciones)` muestra n segmentos sin re-parsear ni recrear el rig; `opciones.dibujos`; efectos con `sx/sy`; dibujos `comida` y `miga`.
- `Vestuario.tsx`: `useEscenaCreciente(a, n, nMax|null)` (null = camino anterior).
- `CiempiVivo.tsx`: modo creciente + capa E08 (`comer`, `dibujos`).
- `src/lectura/Ciempi.tsx`: `CRECIMIENTO_REVELAR = true` (por defecto), prop `crecimiento`, comidas memorizadas, `COMER_ANIMADO = false` + prop `comerAnimado`.
- **Identidad visual verificada:** `medicion/capturas.mjs` → 108/108 casos idénticos píxel a píxel (rig aislado con A02 en 3 instantes y carril real con movimiento reducido; conjuntos típico/base/máscara; N 0,1,2,3,4,5,6,12,40). `resultados/pixeles.json`, láminas en `medicion/capturas/`.

**Riesgo:** `CRECIMIENTO_REVELAR = true` cambia el camino de producción (idéntico en píxeles, pero sin la medición "después"). Si no se completa la medición, poner `false` antes de fusionar.

## E08 Comer

`animaciones.js`: E08 (0,8 s; mordisco 0,36; reanuda 0,56) como **capa** `comer(p, t, n, opciones)` sobre caminar/reposo; boca abierta `b03-carcajada` solo entre 0,16 y el mordisco, luego vuelve la expresión vigente; pop del segmento nuevo (índice n−2) y brillo. `motor.js`: `ColaComer` (1 en curso + 1 pendiente, adelanta al mordisco, funde el resto) y `Reproductor.capa`. Modo tranquilo: amplitud 35 % y sin vuelo de fruta (regla existente: sin efectos). Máscaras que tapan la boca: la fruta se encoge en la zona de la boca sobre la máscara (decisión provisional, sin revisión visual).
Pruebas: `comer.test.ts` (12) + `animaciones.test.ts` actualizado (20 animaciones). `npx vitest run src/ciempi`: 35/35. `npx tsc --noEmit -p .`: sin errores (antes de la demo). Suite completa no re-ejecutada tras los últimos cambios.

## Demo

`demo-comer/index.html` + `demo.tsx` escritos, **sin compilar ni probar**. Abrir con `npm run dev` → `/docs/expansion-ciempi/animacion/demo-comer/`.

## Pendiente (próximos pasos)

1. `medir.mjs --etiqueta despues-revelar --extra '{"crecimiento":"revelar"}'` (y `despues-recomponer`), comparar con `antes.json`.
2. Probar la demo; generar hoja de 8 cuadros, inspeccionarla (expresión de boca abierta: confirmar carcajada vs sorprendido; tamaño/arco de la fruta; máscaras) y video .webm.
3. Rúbrica de 5 dimensiones para E08 (no evaluada visualmente aún).
4. RESULTADOS.md, `npx tsc` y `npx vitest run src` completos.
5. PantallaLectura.tsx: no se necesitó ningún cambio (Ciempi.tsx ya recibe pista y palabrasLeidas).
