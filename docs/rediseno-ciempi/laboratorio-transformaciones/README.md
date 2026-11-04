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
