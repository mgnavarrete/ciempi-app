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

## Rostros v4 (Dragón y Cuncuna)

Rostros propios generados con IA (AD-017), **pendientes de aprobación**. El v1 se conserva. Selector «Rostro v1 / v4» en el panel, o `?rostro=v4` en la URL (p. ej. `index.html?rostro=v4&especie=cuncuna`). Código: `rostros-v4.js` (más un gancho mínimo en `especies.js` y `laboratorio.js`); recursos en `recursos/<especie>/v4/` (`scripts/transformaciones/procesar-rostros-v4.py`); láminas antes/después en `laminas-rostros.html?tipo=crecimiento|expresiones|accesorios|tamanos|animacion|ciempi&especie=…&fondo=…`, capturadas con `scripts/transformaciones/capturar-rostros-v4.cjs`. Fichas: [T01 v4](../revisiones/T01-dragon-v4-rostro/REVISION.md) · [T02 v4](../revisiones/T02-cuncuna-v4-rostro/REVISION.md).
