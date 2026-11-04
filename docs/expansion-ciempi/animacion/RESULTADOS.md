# Resultados · rendimiento del crecimiento y E08 Comer (2026-11-03)

Continúa [CHECKPOINT-ANIMACION.md](CHECKPOINT-ANIMACION.md). Rama `worktree-agent-a103c0ae8e6a43da3`.
Leyenda: **verificado** (medido o visto), **inferido** (deducido sin prueba directa), **pendiente**.

## 1. Rendimiento: antes / después

### Metodología

- Banco: [`medicion/banco.html`](medicion/banco.tsx), con el `<Ciempi>` real del carril. Se compila en producción y se recorre con Chromium 1248 sin interfaz, a 412×600 y DPR 2.
- Conjunto típico: gorro de mago raster, capa heroica y superficie b11-mago. Ciempi crece de N = 0 a 40 a 500 ms por unidad, caminando con A02.
- La CPU se frena con `Emulation.setCPUThrottlingRate` a 1×, 4× y 6×.
- **Medición intercalada** ([`medicion/intercalado.mjs`](medicion/intercalado.mjs)): un solo build y una sola sesión.
  - Se alternan los modos `recomponer` (camino anterior), `revelar` (escena creciente) y `revelar+comer` (revelar con E08 activo).
  - El orden de los modos rota en cada ronda.
  - Se registra `/proc/loadavg` antes y después de cada corrida.
- Corridas realizadas:
  - 3 rondas a 1×, 4× y 6×: `resultados/despues-intercalado.json`.
  - 3 rondas más a 6×, porque la ronda 0 de 6× corrió con carga 8,8→6,5: `despues-intercalado-6x-repeticion.json`, con carga estable de 2,5 a 3,5.
  - Después de corregir E08 (§3), 4 rondas válidas de `revelar` contra `revelar+comer` a 4× y 6×: `e08-v2-intercalado*.json`.
  - Se descartó la ronda 2 de `e08-v2-intercalado.json`: la carga subió de 3,4 a 13,6 durante esa ronda y hubo 45–49 % de cuadros perdidos en ambos modos. Queda en el JSON, pero fuera de las medianas.
- Valores: mediana entre corridas de la mediana y del p95 de cada corrida. El máximo es el peor valor de todas las corridas. Para "antes" se usa `antes.json`, del checkpoint, medido en otra sesión.

### Tabla (conjunto típico, N 0→40)

| CPU | Camino | Unidad mediana / p95 / máx (ms) | Cuadros perdidos (mediana) | Tareas largas (mediana) | FPS | Heap fin | Nodos DOM | Corridas · carga 1 min |
|---|---|---|---|---|---|---|---|---|
| 1× | antes (checkpoint) | 5,9 / 10,6 / 18,6 | 0 | 0 | 60 | 3,7 MB | 1085 | 3 · sin registro |
| 1× | recomponer | 7,0 / 9,8 / 12,0 | 0 | 0 | 60 | 3,8 | 1085 | 3 · 2,4–7,6 |
| 1× | **revelar** | **1,0 / 2,1 / 6,9** | 0 | 0 | 60 | 3,7 | 1092 | 3 · 2,4–6,3 |
| 1× | revelar+comer | 1,0 / 1,8 / 5,7 | 0 | 0 | 60 | 3,9 | 1121 | 3 · 2,5–8,8 |
| 4× | antes (checkpoint) | 27,1 / 43,7 / 64,6 | 46 (3,7 %) | 11 (628 ms) | 57,8 | 3,7 | 1085 | 3 |
| 4× | recomponer | 35,4 / 57,5 / 133 | 68 (5,5 %) | 20 (1260 ms) | 56,7 | 3,7 | 1085 | 3 · 2,7–5,3 |
| 4× | **revelar** | **4,7 / 6,4 / 11,0** | 0 (0 %) | 0 | 60 | 3,7 | 1092 | 3 · 3,3–4,7 |
| 4× | revelar+comer (E08 v2) | 3,7 / 7,0 / 10,0 | 1 (0,1 %) | 0 | 60 | 3,8 | 1121 | 4 · 1,1–3,1 |
| 6× | antes (checkpoint) | 53,9 / 106,2 / 133,1 | 219 (17,7 %) | 35 (3052 ms) | 49,4 | 3,7 | 1085 | 3 |
| 6× | recomponer | 43,0 / 75,0 / 140,7 | 110 (8,9 %) | 30 (2159 ms) | 54,6 | 3,7 | 1085 | 6 · 2,7–8,8 |
| 6× | **revelar** | **6,4 / 11,0 / 17,0** | 7 (0,6 %) | 0 | 59,6 | 3,6 | 1092 | 6 · 2,7–7,9 |
| 6× | revelar+comer (E08 v1) | 6,0 / 11,0 / 53,1 | 39 (3,2 %) | 1 (55 ms) | 58,1 | 3,8 | 1121 | 6 · 2,5–6,5 |
| 6× | revelar+comer (E08 v2) | 5,5 / 9,4 / 17,8 | 10 (0,8 %) | 0 | 59,5 | 3,8 | 1121 | 4 · 1,3–2,4 |
| 6× | revelar (misma sesión que v2) | 5,5 / 9,3 / 18,2 | 5 (0,4 %) | 0 | 59,7 | 3,6 | 1092 | 4 · 1,3–3,0 |

Rangos de cuadros perdidos por corrida a 6×:
- `recomponer`: 8,2–15,5 %.
- `revelar`: 0–5,8 %.
- `revelar+comer` v1: 0,5–19,7 %. El 19,7 % ocurrió con carga 6,5.
- `revelar+comer` v2: 0,1–1,9 %.

El costo de mover el dedo (cuadro sin unidad nueva) es igual en todos los caminos: mediana 1,0 ms y p95 2,0 ms a 6×.

### Lectura de los datos

- **Verificado: mejora clara.** El costo de cada unidad baja entre 6 y 7 veces a 4× y 6×.
  - El p95 a 6× queda en 11 ms, por debajo de los 16 ms del objetivo del plan (§8). Antes era de 75 a 106 ms.
  - Las tareas largas pasan de 20–35 a 0.
  - Los cuadros perdidos a 6× bajan de 8,9 % a 0,6 % en la misma sesión.
  - No hay reparseo durante la frase: `escena()` ya no se llama por unidad.
- **Verificado: sin regresión observable** en FPS, cuadros perdidos, heap (3,6–3,7 MB en ambos) ni costo de mover el dedo. Hay 7 nodos DOM más.
- **Matiz verificado: el hilo principal trabaja casi lo mismo en total.** En la traza a 6× (`trazas` en `despues-intercalado.json`):
  - `RunTask` suma 15,5 s en `recomponer` y 15,6 s en `revelar`, sobre 20,6 s.
  - `revelar` elimina los picos: `FireAnimationFrame` baja de 5,0 a 3,8 s y desaparece `ParseHTML`.
  - Pero el trabajo constante por cuadro sube algo: `PrePaint` pasa de 1,3 a 2,1 s y `Layout` de 0,8 a 1,2 s.
  - El costo aislado de `rig.aplicar` con N = 40 (`costoCuadro`) es equivalente: 6,6–6,8 ms contra 7,5–8,0 ms a 6×, dentro del ruido.
  - **Inferido:** los segmentos ocultos con `display="none"` siguen en el árbol y encarecen un poco el prepintado. No se tradujo en cuadros perdidos.
- "Antes" y `recomponer` miden el mismo código en sesiones distintas. A 4× `recomponer` salió peor y a 6× mejor que "antes". Esa diferencia es la variación de la máquina, compartida con otros agentes: por eso la comparación válida es la intercalada.

### Teléfonos modestos (aproximación declarada)

- **Verificado (emulación):** con la CPU a 4× y 6×, `revelar` con E08 v2 activo se mantiene a unos 60 FPS.
  - p95 del intervalo entre cuadros: 16,8 ms.
  - 0,1–0,8 % de cuadros perdidos y ninguna tarea larga.
  - La unidad cuesta 5,5 ms de mediana y 18 ms como máximo a 6×. Cabe en el presupuesto de 16,7 ms por cuadro, salvo el peor caso aislado.
- **E08 v1** tenía una tarea larga de unos 55 ms y unidades de 31–53 ms a 6× en la primera fruta. Se debía a que preparaba la expresión de boca abierta (`renderCiempi` + `DOMParser`) justo al llegar la primera unidad. La v2 la prepara en `requestIdleCallback`, y el pico desapareció: máximo de 10–18 ms.
- **Pendiente:** no hay Android conectado. `adb devices` no mostró ningún dispositivo y no se instaló nada. Frenar la CPU no emula la GPU, la memoria, el rasterizado ni la WebView de Android.

### Límites de la metodología

- Solo Chromium de escritorio con CPU frenada; no se probaron Firefox, Safari ni WebView de Android.
- La máquina es compartida y su carga varió entre 1,1 y 13,6. Se intercaló, se registró la carga, se repitió 6× y se descartó la ronda con pico, pero queda ruido: hay corridas de `revelar` con 5,6 % de cuadros perdidos sin cambio de código.
- "Unidad" mide el trabajo síncrono de `flushSync`. Los efectos pasivos y el pintado se ven en los cuadros perdidos y en las tareas largas, no en esa columna.
- Se probó un solo conjunto (típico), 3 a 6 corridas por celda y un ritmo de 500 ms por unidad.

### Decisión de flags

- `CRECIMIENTO_REVELAR = true` (se mantiene). La mejora es clara en el costo por unidad, las tareas largas y los cuadros perdidos, sin regresión observable. Además, `capturas.mjs` se volvió a ejecutar tras los cambios: **108/108 casos idénticos píxel a píxel**.
  - El matiz de prepintado anotado arriba queda como seguimiento.
  - Falta confirmarlo en un Android real antes de publicar.
- `COMER_ANIMADO = false` (sin cambios): E08 sigue siendo experimental y está pendiente de aprobación del usuario.

## 2. Demo de E08

- Archivos: [`demo-comer/`](demo-comer/). `index.html` y `demo.tsx` son la demo; `hoja.html` y `hoja.tsx` generan la hoja de cuadros.
- Build estático en `demo-comer/dist/`, de 0,9 MB, sin copiar `public/`.
- Abrir sin `npm run dev`:
  ```
  node docs/expansion-ciempi/animacion/demo-comer/construir.mjs   # solo si cambió el código
  node docs/expansion-ciempi/animacion/demo-comer/servir.mjs      # http://127.0.0.1:8773/
  ```
  `servir.mjs` usa solo `node:http` y toma `/ciempi-v2/` de `public/`.
- También funciona con `npm run dev` → `/docs/expansion-ciempi/animacion/demo-comer/`.
- **Verificado con Playwright:**
  - Carga y avanza sola: 6 unidades en 3 s a ritmo realista.
  - Con ritmo manual, "Siguiente unidad" da 3 de 3. `data-segments` es 3 y la fruta se dibuja con `<use>`.
  - Se recorrieron los cambios de vestuario robot, gatita y pirata, y el modo tranquilo.
  - **Cero errores de consola o de red.** El 404 de `favicon.ico` se corrigió con `<link rel="icon" href="data:,">`.
  - El medidor de la demo marca 16,7 ms por cuadro.
- Captura: `hoja-e08/demo-captura.png`.

## 3. Hoja de cuadros de E08 y corrección

- Generación: `demo-comer/capturar.mjs`, con `servir.mjs` corriendo. Produce `hoja-e08/`:
  - `hoja-{grande,pista}-{claro,oscuro}.png`.
  - Videos `carril-ampliado-mago.webm` y `carril-real-robot.webm` (7 s, carril real a 500 ms por unidad).
- Cada cuadro reproduce el juego: A02 con inercia, más la capa `comer`, más `reducir` en modo tranquilo. Usa el rig real y la comida equipada.
- Instantes: 0; 0,08; 0,16; 0,24; 0,32; 0,38 (justo después del mordisco, que ocurre a 0,36); 0,48; 0,66 s.
- Filas:
  - base;
  - base con la boca de la versión 1 (carcajada), para comparar;
  - dormilón;
  - mago con capa y plátano;
  - **máscara Robot** (tapa la boca);
  - **máscara Gatita** con frutilla (boca visible);
  - base en modo tranquilo.
- Tamaños:
  - Grande: 280 px por cuadro (PNG reducido a 1×).
  - Pista: la escala real del carril, R/130 con 12 manzanas en 412 px. Ciempi mide unos 84 px de alto más el desborde del gorro, capturado a DPR 2.
- Fondos:
  - Claro: el papel del juego, `#f6ecd8`.
  - Oscuro: `#1d2633`. Es una prueba de contraste; la app no tiene modo oscuro.
- Evidencia previa conservada en `hoja-e08/v1-antes/`.

**Defectos vistos en v1 (inspección con Read) y corregidos en v2:**
1. A tamaño de pista, la fruta tapaba medio rostro entre 0,16 y 0,32 s: ojos y boca abierta. Venía grande (escala 1 de la comida de la pista), con un arco de 85 unidades que la subía hasta los ojos.
   - Ahora se queda en su lugar hasta 0,14 s, salta en un arco bajo (35) y se achica a 0,6 y luego a 0,42 hasta la boca.
   - Además parte de escala 1, igual que la comida de la pista, en lugar de aparecer a 0,7.
2. La boca abierta usaba `b03-carcajada`, que cierra los ojos: no se veía que mirara la fruta, y a 84 px parecía un guiño.
   - Ahora usa `b03-sorprendido`: ojos abiertos y boca en "o", como proponía el plan maestro (§8).
   - La fila de comparación conserva la carcajada.
3. La primera fruta producía una tarea larga (§1). Ahora la expresión se precarga en un momento libre.

Pruebas: `comer.test.ts` se actualizó para el arco bajo y la escala. Todas pasan.

### Rúbrica de E08 v2 (orientativa; revisión del agente, **no aprobación**)

| Dimensión | Nota | Observación concreta (vista) |
|---|---|---|
| Coherencia con Ciempi | 4/5 | No se redibuja nada: usa el rig aprobado, la expresión B03 sorprendido y la comida que eligió el niño. En la hoja de pista (84 px), Ciempi sigue caminando mientras come y el gesto es suyo. El vuelo de la fruta es un efecto superpuesto, no parte del personaje. |
| Calidad de ilustración | 3/5 | El aplastamiento de la fruta a 0,08 s se lee bien. Las migas a 0,38–0,48 s son puntos casi invisibles en grande y desaparecen en pista. El brillo del segmento es crema pálido sobre crema (0,48–0,66 s) e invisible en oscuro. La fruta no entra detrás del labio: a 0,32–0,38 s queda pintada encima de la boca. |
| Integración con el cuerpo | 3/5 | La apertura de la boca coincide con la llegada de la fruta y la cabeza gira apenas hacia ella. Con Gatita, la boca "o" se ve bajo la máscara (correcto). Con Robot, la fruta se encoge sobre la placa sin boca: se lee como pegada (decisión provisional). El pop del segmento nuevo (índice n−2) no se percibe en ningún cuadro, ni grande ni en pista. |
| Legibilidad | 4/5 | En pista (recorte ampliado de 0,16–0,38 s) se leen el salto, la boca abierta y la fruta que desaparece en la boca. Tras la corrección, los ojos quedan visibles casi todo el tiempo; solo a 0,32 s la fruta roza el ojo derecho. Sobre fondo oscuro se pierden el contorno azul (en Ciempi y en la fruta) y el brillo. |
| Originalidad | 3/5 | Es el gag clásico de comer. Su aporte propio es conectar la tienda con la lectura: come la comida que compró el niño. No hay un rasgo distintivo de Ciempi más allá de eso. |

Criterios obligatorios (§12 de la guía):
- Respeto de la base: cumple. No se tocaron dibujos, y `capturas.mjs` dio 108/108 casos idénticos con E08 apagado.
- Legibilidad a tamaño real: cumple con observaciones (hoja de pista).
- Compatibilidad: revisados base, dormilón, mago, Robot, Gatita, plátano, frutilla y modo tranquilo. Quedan pendientes las otras máscaras, lentes opacos, el resto de las comidas y N = 1 y 2.
- Evidencia: antes/después en `hoja-e08/v1-antes/` y `hoja-e08/`.
- Aprobación del usuario: **pendiente**. E08 no está aprobado artísticamente.

## 4. Sesión 4: AD-018, crecimiento con especies e interrupciones (2026-11-03)

Parte del WIP `da13860` (otro agente, cortado a mitad). Se revisó con `git diff 1bf79c6 da13860`: compilaba y pasaba 198/198 sin cambios. Commits de esta sesión: ver `git log da13860..HEAD`.

### 4.1 `escenaCreciente` con forma de especie — **verificado**

- `pose.ts`: `roles`, `posiciones` y `escena` aceptan `forma?` y son **textualmente idénticos** a los de la rama de especies (`worktree-agent-ab5e3926402cffc21`); `escenaCreciente(svg, nMax, prefix, forma?)` usa la misma regla.
  - Patas: `pieDeRol` y `xMaestro` (anotado en `data-x-pie` para que `rig.crecer` traslade la pata desde el maestro correcto).
  - Encuadre: `siempreClonar` (sin sombras del maestro y sin el encuadre fijo de N = 5) y `margenCola`.
  - `EscenaCreciente.posiciones(n)` devuelve las posiciones con la forma; `CiempiVivo` las usa en `rig.crecer` y para el brillo del segmento nuevo.
- El tipo se llama `FormaCuerpo` y es copia **campo por campo** del de `especie.ts` (`ciclo, cola, frente, xFrente, y, separacion, xMaestro, pieDeRol, siempreClonar, margenCola?`). Desaparece `FormaEscena`.
- **Sin forma, idéntico:** `medicion/capturas.mjs` → **108/108 casos idénticos píxel a píxel** (rig aislado y carril real; base, típico y máscara; N 0–40).
- **Con forma (Dragón y Cuncuna):** en el árbol fusionado (ver 4.2), [`fusion-especies/comprobar-fusion.mjs`](fusion-especies/comprobar-fusion.mjs) compara `escena(svg, n, p, forma)` + rig contra `escenaCreciente(svg, 40, p, forma)` + `rig.crecer(n, e.posiciones)`:
  - Dragón, Cuncuna y Ciempi; conjuntos base, mago+capa+superficie, mochila+botas, máscara Robot y (Dragón) alas; N = 0, 1, 2, 3, 4, 5, 6, 12, 40; sin animar y con A02 a 0,37 s.
  - **234/234 idénticos píxel a píxel**, mismo `viewBox`, consola sin errores. Evidencia: [`fusion-especies/evidencia/`](fusion-especies/evidencia/) y `fusion.json`.
  - Una primera pasada con los dos SVG apilados en la página dio diferencias de antialiasing también en Ciempi (posición subpíxel); se repitió como `capturas.mjs`, uno por vez en el mismo lugar.
- No se tocó ningún archivo de arte de la rama de especies (AD-017): la comprobación se hizo en una copia fuera del repositorio.
- **Pendiente (integración):** `useEscenaCreciente` sigue componiendo con `renderCiempi` y sin forma. Para que Dragón y Cuncuna usen `revelar` en el juego hay que pasarle el SVG de la especie (`componerCriatura` del laboratorio, hoy solo en docs/) y `ESPECIES[id].forma`. El laboratorio de especies puede pasar ya a `escenaCreciente`.

### 4.2 Fusión con la rama de especies: receta — **verificada en copia**

`git merge-tree --write-tree` (sin tocar ramas) da **un solo conflicto**, en la línea 1 de `src/ciempi/v2/pose.ts` (vacío de este lado, `import type {FormaCuerpo} from './especie'` del otro). El resto (incluido `Ciempi.tsx`) se fusiona solo.

1. Resolver el conflicto quedándose con `import type {FormaCuerpo} from './especie'`.
2. Borrar de `pose.ts` el bloque `/** Forma del cuerpo de una especie: copia… */ export interface FormaCuerpo {…}` (si no, tsc da "Import declaration conflicts with local declaration").
3. Nada más: `escenaCreciente` ya usa `FormaCuerpo` y `posiciones(n, forma)`.

Comprobado con [`fusion-especies/preparar-fusion.sh`](fusion-especies/preparar-fusion.sh), que arma el árbol fusionado en una carpeta temporal y aplica la receta: **tsc OK y `vitest run src` 221/221** (23 archivos: las 208 de esta rama + 13 de especies). La primera comprobación, antes de las pruebas nuevas, dio 211/211.

### 4.3 AD-018: bocas y máscaras — **verificado**

- Boca inicial `b03-sorprendido` (`BOCA_COMER` en `Ciempi.tsx`); `b03-carcajada` se conserva y se elige con la prop `bocaComer`, el **selector "Boca"** de la demo (`?boca=carcajada` también) y el **selector de la hoja**.
- Máscaras que tapan la boca: `tapaBoca(env, cabeza)` (`animacion/boca.ts`) lee `ocultaRostro` del catálogo, con el mismo orden de búsqueda que el compositor (`[...hats, ...masks]`; antes estaba al revés). Con boca tapada, `comer()` usa `comerSinBoca`: no toca la expresión; la fruta salta hasta delante del hocico, la cabeza se inclina y avanza a "morderla", golpe y dos masticadas, la fruta desaparece con destello y migas y el cuerpo da un saltito. La apariencia equipada no cambia.
- Revisión desde metadatos (sin lista a mano):
  - `boca.test.ts`: `tapaBoca` = `ocultaRostro` para las 13 piezas de cabeza de `public/ciempi-v2/catalogo.json`. Hoy tapan: **Robot Lumen (`b07-ia-robot`), Espíritu de los cuentos (`b07-ia-espiritu`) y Máscara AraLuz (`b12-araluz`)**. Gatita, Draco, Búho, Ratón y los seis gorros dejan la boca a la vista.
  - Navegador (`comprobar-crecer.js`, función `bocas`): para Ciempi, Dragón y Cuncuna × sin gorro + las 13 piezas × sorprendido/carcajada, E08 recorrido cada 0,02 s con `rig.cambiarRostro` como en el juego. Con las 3 que tapan: **0 elementos en `#…-mouth` en todos los cuadros** y nunca más de un grupo de boca. Incluso forzando el camino con boca (`bocaTapada: false`), la composición del rostro con máscara también trae la boca vacía: no aparece una segunda boca (doble seguro). Sin máscara: siempre 1 grupo con 2 hijos.
  - Demo real (Playwright): robot, espíritu y AraLuz con 0 hijos de boca en todos los cuadros; base y gatita cambian de forma de boca; 0 errores de consola.
- Las máscaras Espíritu y AraLuz traen dibujada su propia boca en el arte de la máscara: es parte de la pieza aprobada, no una segunda boca de Ciempi.

### 4.4 Interrupciones de E08 — **verificado (pruebas) / inferido (juego)**

Pruebas nuevas en `comer.test.ts` (todas pasan):
- **Varias frutas seguidas:** cola con una fruta cada 0,25 s, a lo más una pendiente, termina sola (además de las pruebas previas de 100 ms durante 4 s).
- **Tropezar (E04), celebrar (A03) y victoria (A10)** cargados a mitad del mordisco con la capa activa, para N inicial 0, 1 y 2 y creciendo: poses finitas; con boca tapada la expresión es siempre la de la animación de fondo (E08 no pisa la de victoria con una boca).
- **Cambio de vestuario a mitad:** `ColaComer.comunes` se lee en cada cuadro; ponerse una máscara a mitad elimina la boca abierta en el cuadro siguiente, quitársela la recupera; las opciones comunes mandan sobre las de la fruta. En la demo: cambiar a Robot a mitad de E08 deja 0 hijos de boca en el cuadro siguiente.
- **N de 0 a 2:** cubierto en las pruebas anteriores y en la hoja/rig (n = 0 sin segmento que hacer pop, n = 1 el frente).
- **Modo tranquilo:** sin fruta ni partículas, movimientos ≤ los completos, valores finitos (con y sin máscara). Con `prefers-reduced-motion` del sistema no hay E08 (la demo con `reducedMotion: 'reduce'` no cambia la boca en ningún cuadro).
- **Inferido:** en el juego (`COMER_ANIMADO = false`) no se ejercitó nada de esto; solo laboratorio y demo.
- **Observación:** en modo tranquilo la fruta no se dibuja (se quitan todos los efectos) pero la boca sí se abre: abre la boca "sin nada". Ver pendientes.

### 4.5 Rendimiento antes / después (intercalado) — **verificado, con ruido**

[`medicion/versiones.mjs`](medicion/versiones.mjs): compila el banco de `1bf79c6` ("antes", copia `git archive`) y de este árbol ("después"), los sirve en dos puertos y alterna versión y caso en la misma sesión de Chromium, rotando el orden; N 0→40, 500 ms/unidad. Resultados: `medicion/resultados/e08-v3-versiones*.json`.

| CPU | Caso | Antes: unidad med/p95/máx (ms) · perdidos med (rango) | Después | Corridas |
|---|---|---|---|---|
| 4× | revelar / típico | 3,4 / 5,9 / 9,3 · 0 % (0–0) | 3,4 / 4,9 / 6,9 · 0 % (0–0) | 3 + 3 |
| 4× | revelar+comer / típico | 3,5 / 5,0 / 7,3 · 0 % (0–0) | 3,4 / 5,3 / 23,7 · 0 % (0–0,1) | 3 + 3 |
| 4× | revelar+comer / máscara Robot | 3,6 / 5,0 / 7,8 · 0 % | 3,8 / 6,1 / 14,0 · 0 % (0–0,2) | 3 + 3 |
| 6× | revelar / típico | 5,7 / 8,6 / 28,2 · 0,8 % (0–10,9) | 4,7 / 8,7 / 16,7 · 0,1 % (0–0,8) | 3 + 3 |
| 6× | revelar+comer / típico | 4,6–5,4 / 7,5–8,4 · 0,3–0,6 % (0–31,2) | 5,0–5,2 / 8,3–8,6 · 0,4–4,7 % (0,1–34,4) | 11 + 11 (3 tandas) |
| 6× | revelar+comer / máscara Robot | 5,0 / 8,9 / 18,4 · 0,1 % | 4,8 / 8,4 / 11,6 · 0,2 % | 3 + 3 |

- **Lectura:** sin regresión observable. Con carga estable las parejas antes/después coinciden (p. ej. 6× comer típico, rondas con carga < 5: antes 0–0,6 %, después 0,2–0,4 %). Las corridas malas (31–34 % perdidos, 6–9 tareas largas) coinciden con picos de carga de la máquina compartida (2,5→7,6) y le tocaron **a ambas versiones** (antes 31,2 % en la tanda 3). Ninguna tarea larga en las corridas con carga estable. La reacción con máscara cuesta lo mismo que la boca.
- El 404 que aparece en la primera página de cada sesión es el `favicon.ico` del banco, en ambas versiones.
- **Límites:** CPU frenada en Chromium de escritorio; no Android, GPU ni WebView. 3–11 corridas por celda.

### 4.6 Hoja de cuadros v3 y rúbrica

- `demo-comer/capturar.mjs` (con `servir.mjs`): `hoja-e08/hoja-{grande,pista}-{claro,oscuro}.png` y dos videos. Estado previo conservado en `hoja-e08/v2-antes/` (idéntico byte a byte a la hoja de `1bf79c6`) y `demo-comer/v2-antes/`.
- Filas: base sorprendido, base carcajada, dormilón, mago+capa+plátano, gatita+frutilla, set Robot, base tranquilo, Robot tranquilo y **una fila por cada pieza con `ocultaRostro` del catálogo** (Robot Lumen, Espíritu, AraLuz). Grande a 1× (2438×3024) y pista a la escala real (84 px de alto, DPR 2). Las etiquetas de las filas con máscara dicen "tapa la boca: sin boca".
- Inspección del agente (Read de las PNG, recortes ampliados de 0,16–0,48 s):
  - Base sorprendido: a 0,16 s la boca "o" y los ojos siguen la fruta; a 0,24–0,32 s la manzana tapa la boca abierta (va **encima** del labio, no detrás); a 0,38 s queda pequeña sobre la boca; a 0,48 s vuelve la sonrisa con un destello pequeño junto al segmento.
  - Carcajada: ojos cerrados de 0,16 a 0,32 s; en pista parece un guiño y no mira la fruta (se confirma la preferencia por sorprendido).
  - Máscaras (grande): la fruta llega a la mejilla derecha de la máscara y a 0,32–0,38 s se superpone a su borde inferior mientras la cabeza baja; a 0,48 s destello y migas delante del hocico. Ninguna boca de Ciempi aparece. En pista (84 px) se lee "la acerca y desaparece con brillo"; el salto del cuerpo (−10 u.) casi no se percibe.
  - Fondo oscuro: el contorno azul de Ciempi y de la fruta se pierde, igual que en v2.

| Dimensión | Nota (agente, orientativa) | Observación concreta |
|---|---|---|
| Coherencia con Ciempi | 4/5 | Sin redibujar: rig aprobado, B03 sorprendido y la comida equipada. Con máscara no se altera la pieza ni aparece un rostro ajeno; la reacción (inclinar y avanzar la cabeza) es un gesto que Ciempi ya hace en otras animaciones. |
| Calidad de ilustración | 3/5 | La fruta sigue pintada encima de la boca a 0,24–0,38 s (no "entra"); migas casi invisibles en pista; brillo del segmento crema sobre crema. Con máscara la fruta se apoya sobre la placa a 0,32–0,38 s y se lee algo pegada. |
| Integración con el cuerpo | 3/5 | Apertura y mordisco sincronizados con la llegada; con máscaras el golpe de cabeza coincide con la desaparición de la fruta. El saltito del cuerpo y el pop del segmento no se perciben a 84 px. |
| Legibilidad | 4/5 | En pista se leen salto, boca "o" y desaparición; con máscara se lee "acerca y come" por la cabeza y el destello, menos claro que con boca. Sobre oscuro baja el contraste. |
| Originalidad | 3/5 | Gag clásico; su aporte es comer la comida comprada y la variante sin boca para máscaras, que evita el recurso fácil de pintar una boca encima. |

Criterios §12: respeto de base — cumple (108/108 y 234/234; no se tocó arte). Anclaje y capas — cumple respecto a bocas duplicadas (0 en máscaras); la fruta delante del labio es una limitación conocida. Compatibilidad — revisadas las 13 piezas de cabeza × 3 criaturas por DOM, y en imagen base, dormilón, mago, gatita y las 3 máscaras; pendientes lentes opacos, resto de comidas y especies en imagen. Evidencia — antes/después en `hoja-e08/v2-antes/` y `hoja-e08/`. **Aprobación artística del usuario de la variante con máscara: pendiente** (AD-018 aprobó la regla, no esta ejecución).

## 5. Pruebas (sesión 4)

- `npx tsc --noEmit -p .`: sin errores.
- `npx vitest run src`: **21 archivos, 208/208** (198 previas + `boca.test.ts` 3 + 7 nuevas en `comer.test.ts`).
- `medicion/capturas.mjs`: **108/108** idénticos (sin forma).
- Fusión con especies (copia, `preparar-fusion.sh` desde HEAD): tsc OK, **221/221**, `comprobar-fusion.mjs` **234/234** idénticos y revisión de bocas sin fallos; 0 errores de consola.
- Demo: `demo-comer/dist` reconstruido (0,9 MB); Playwright con selector de boca, 6 vestuarios, cambio a Robot a mitad y `reducedMotion`: 0 errores de consola.

### Pruebas de la sesión anterior

- `npx tsc --noEmit -p .`: sin errores (código de salida 0).
- `npx vitest run src`: **20 archivos, 198/198 pruebas pasan**. `src/ciempi`: 35/35.
- `medicion/capturas.mjs`: 108/108 casos idénticos píxel a píxel entre `revelar` y `recomponer`.

## 6. Pendientes

1. **Android real**, Firefox y Safari: no probados (sin dispositivo).
2. **Usuario:** elegir definitivamente sorprendido o carcajada (comparar en la demo/hoja con el selector); aprobar o ajustar la reacción con máscara; decidir si se activa `COMER_ANIMADO` (sigue en `false`).
3. Modo tranquilo: hoy abre la boca sin fruta visible (se quitan todos los efectos). Propuesta, no aplicada: conservar la fruta (no es una partícula) o no abrir la boca.
4. Fruta delante del labio a 0,24–0,38 s; pop del segmento y brillo poco visibles; contraste sobre oscuro.
5. **Integración de especies con `revelar`:** pasar SVG de especie y `forma` a `useEscenaCreciente`; probar E08 sobre Dragón/Cuncuna en imagen (la revisión de bocas por DOM ya pasó).
6. Seguimiento del costo de prepintado de los segmentos ocultos con `revelar`.
7. `PantallaLectura.tsx` no necesita cambios.

<details><summary>Pendientes de la sesión anterior (texto original)</summary>


1. **Android real** (WebView de la APK, gama baja): repetir `intercalado.mjs` o medir con `performance.mark`. No había dispositivo conectado.
2. **Firefox y Safari/WebKit**: no se probaron.
3. Decisión del usuario sobre E08:
   - si se activa `COMER_ANIMADO`;
   - si usar sorprendido o carcajada;
   - qué hacer con las máscaras sin boca;
   - mejorar el pop del segmento y el brillo, que hoy casi no se ven;
   - el sonido corto del plan (§8), que no está implementado.
4. Seguimiento del costo de prepintado de los segmentos ocultos con `revelar`. Se podría probar `visibility` o quitar los nodos del árbol, siempre midiendo antes.
5. `PantallaLectura.tsx` no necesita cambios.

</details>
