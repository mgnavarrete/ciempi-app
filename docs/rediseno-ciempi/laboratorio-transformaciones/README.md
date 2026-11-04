# Laboratorio de transformaciones (T01 Dragón · T02 Cuncuna)

Estado: **laboratorio, pendiente de aprobación artística del usuario**. No está conectado al juego, la tienda, el catálogo ni el servidor.

## Abrir

Desde la raíz del repositorio (o del worktree):

```bash
node scripts/transformaciones/construir-laboratorio.mjs   # traduce pose.ts, especie.ts y compatibilidad.ts a gen/
python3 -m http.server 8772 --bind 127.0.0.1
```

- Laboratorio: http://127.0.0.1:8772/docs/rediseno-ciempi/laboratorio-transformaciones/
- Galería de evidencia: http://127.0.0.1:8772/docs/rediseno-ciempi/laboratorio-transformaciones/galeria.html
- Láminas sueltas: `laminas.html?tipo=crecimiento|accesorios|comparacion|detalle|conjuntos|animacion&especie=dragon|cuncuna&fondo=claro|oscuro`
- Parámetros del laboratorio: `?especie=cuncuna&n=12&comparar=ciempi&fondo=oscuro&sel={"cabeza":"b06-ia-mago"}&quieto`

## Qué permite

Criatura (Ciempi / Dragón / Cuncuna), longitud N 0–40, conjuntos B12, restaurar, todas las categorías del vestuario con su etiqueta (universal, adaptable, exclusivo u oculto en esta especie) y el motivo, paletas, expresiones B03, las 19 animaciones del rig del juego (velocidad, movimiento reducido, coste por cuadro), comparación A/B con otra criatura con la misma selección, tamaños 84 px de alto (pista) y 96/240/320 px de ancho, fondo claro u oscuro.

## Cómo está hecho

- `especies.js`: arma la base de cada especie desde la base aprobada (mismos ids: `body`, `legs-and-sneakers`, `head`, `eyes`, `mouth`, `antennae`, `jockey`…), con segmentos, cola, frente, patas y rasgos de cabeza raster IA de `recursos/<especie>/`, y la compone con `renderCiempi` (sin modificarlo) y `escena(svg, n, prefijo, forma)`. Ciempi usa la ruta del juego sin `forma`.
- `nucleo.js`: carga el vestuario del juego desde `public/ciempi-v2/` y dibuja escenas y rigs. `laboratorio.js`: interfaz. `laminas.js`: láminas de evidencia.
- `gen/`: generado por `scripts/transformaciones/construir-laboratorio.mjs` (oxc de Vite; TypeScript 7 no expone API JS). `gen/pose-original.js` es `pose.ts@3e188ce`, para comprobar que Ciempi no cambia.

## Pruebas

```bash
npx vitest run src/ciempi/v2                       # especie.ts, compatibilidad.ts, roles/posiciones con y sin forma
NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules node scripts/transformaciones/probar-laboratorio.cjs
NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules node scripts/transformaciones/capturar-evidencia.cjs
```

`probar-laboratorio.cjs` compara `escena()` original y actual (sin `forma` y con `FORMA_CIEMPI`) para N = 0, 1, 5, 12, 40 y recorre el laboratorio exigiendo consola sin errores ni avisos. `capturar-evidencia.cjs` escribe las láminas en `docs/rediseno-ciempi/revisiones/T0x-*/evidencia/` (no toca `auditoria/`).

Fichas: [T01](../revisiones/T01-dragon-v1/REVISION.md) · [T02](../revisiones/T02-cuncuna-v1/REVISION.md).

## V4: T03 Serpiente y T04 Camaleón (rama `expansion-v4-criaturas`)

Estado: **laboratorio, pendiente de aprobación del usuario**.

- Abrir: `?especie=serpiente` o `?especie=camaleon` (botones «Ciempi Serpiente» y «Ciempi Camaleón»). Por ejemplo: `?especie=serpiente&n=12&comparar=camaleon` y `?especie=camaleon&sel={"textura":"b11-draco"}`.
- Código propio: `criaturas-v4.js`, que contiene la base de especie, la piel de cabeza, la lengüita, las torretas, el casco y el camuflaje. Se engancha a `especies.js` mediante `baseCriaturaV4`, `clavePaleta` y `posprocesarV4`. Además, `laboratorio-v4.js` añade la casilla «Lengüita» y avisos, y `laminas-v4.html/js` genera las láminas. Los cambios en archivos compartidos son mínimos: `especies.js` (+ 8 líneas), `nucleo.js` (pasa `sel` a `prepararCriatura`) e `index.html` (un `<script>`).
- Forma y compatibilidad: `FORMA_SERPIENTE` y `FORMA_CAMALEON` en `src/ciempi/v2/especie.ts`, y el campo opcional `partesOcultas` (serpiente: `pies`) leído por `compatibilidad.ts`.
- Piezas: `node scripts/transformaciones/generar-ia.mjs` con los prompts de `scripts/transformaciones/prompts-v4/` y `python3 scripts/transformaciones/v4/procesar-piezas-v4.py`. Solo escribe `recursos/serpiente` y `recursos/camaleon`.
- Pruebas:
  - `node scripts/transformaciones/v4/probar-laboratorio-v4.cjs` (20 comprobaciones);
  - `node scripts/transformaciones/v4/comprobar-fusion-v4.mjs` (`escenaCreciente` + `rig.crecer` frente a `escena`, con `comprobar-crecer-v4.html`);
  - `node scripts/transformaciones/v4/capturar-evidencia-v4.cjs` (láminas T03/T04).

  Usan `LAB_URL`/`LAB_PUERTO` y el puerto 8803 por omisión.
- Fichas: [T03](../revisiones/T03-serpiente-v1/REVISION.md) · [T04](../revisiones/T04-camaleon-v1/REVISION.md).

## Rostros v4 (Dragón y Cuncuna)

Rostros propios generados con IA (AD-017), **pendientes de aprobación**. El v1 se conserva; v4b es la iteración 2 tras la revisión independiente (v4 se conserva). Selector «Rostro v1 / v4 / v4b» (`?rostro=v4b`); láminas con `&it=2`, capturadas con `ITER=2`. Selector «Rostro v1 / v4» en el panel, o `?rostro=v4` en la URL (p. ej. `index.html?rostro=v4&especie=cuncuna`). Código: `rostros-v4.js` (más un gancho mínimo en `especies.js` y `laboratorio.js`); recursos en `recursos/<especie>/v4/` (`scripts/transformaciones/procesar-rostros-v4.py`); láminas antes/después en `laminas-rostros.html?tipo=crecimiento|expresiones|accesorios|tamanos|animacion|ciempi&especie=…&fondo=…`, capturadas con `scripts/transformaciones/capturar-rostros-v4.cjs`. Fichas: [T01 v4](../revisiones/T01-dragon-v4-rostro/REVISION.md) · [T02 v4](../revisiones/T02-cuncuna-v4-rostro/REVISION.md).

### Iteración 2 de T03 y T04 (rostros propios y zapatilla en la cola)

- Por omisión el laboratorio muestra la v2: rostros IA propios en `recursos/<especie>/rostro-v2/`, aplicados por `aplicarRostro` en `criaturas-v4.js`, y en el Camaleón la pata v2. Para comparar, se puede elegir «Iteración v1» en el panel o usar `?iter=v1`.
- Serpiente: con calzado equipado lleva **una** zapatilla en la punta de la cola (`calzado: 'cola'` en `especie.ts`, `calzarCola` en `criaturas-v4.js`). Es decisión de la usuaria.
- Láminas: `ITER=v1|v2 node scripts/transformaciones/v4/capturar-evidencia-v4.cjs` → `revisiones/T0x-*-v1|v2/evidencia/`. Incluye los tipos `iteracion` y `cola`.
- Fichas: [T03 v2](../revisiones/T03-serpiente-v2/REVISION.md) · [T04 v2](../revisiones/T04-camaleon-v2/REVISION.md).
