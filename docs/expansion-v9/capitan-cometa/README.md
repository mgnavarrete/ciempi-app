# Capitán Cometa (2.8.2)

Conjunto de superhéroe original con la misma estructura que el Robot:

| Pieza | Id | Precio |
|---|---|---|
| Antifaz con visera y cometa (B07, deja ver ojos y boca) | `cabeza:b07-ia-cometa` | 32 |
| Traje petróleo y dorado, franjas diagonales y cometa (B11, atlas 3×2) | `textura:b11-cometa` | 32 |
| Botas doradas con ribete petróleo (B10, construcción v4.2) | `pies:b10-cometa` | 24 |
| Escudo hexagonal con cometa en la espalda (B09, construcción v4.2), se vende aparte | `espalda:b09-cometa` | 25 |
| Conjunto (antifaz + traje + botas, sin escudo) | `conjunto:b12-set-cometa` | 71 |

## Cómo se hizo (pipeline existente, sin edición manual del catálogo de producción)

1. `ia/`: maestros IA reales con `scripts/transformaciones/generar-ia.mjs` (Codex image_gen). Prompts
   en `ia/prompts/`, registro en `ia/generaciones.json`, referencias de formato y estilo (piezas
   Robot y antifaz Draco aprobados, Ciempi sin gorro) en `ia/referencias/`. El escudo sin correas
   se generó a partir del escudo, como las mochilas V4.
2. `python3 docs/expansion-v9/capitan-cometa/procesar.py`: recorta y escala cada pieza como sus
   procesadores originales (preparar.mjs de B06-B08 y B09-B12, procesar-mochilas-v4.py), calcula
   el encuadre del antifaz alineando sus aberturas con los ojos de la base, y agrega las entradas
   a los `catalogo.json` del laboratorio y a `accesorios-v4/medidas.json`.
3. `node scripts/exportar-ciempi-produccion.mjs` regenera `public/ciempi-v2/catalogo.json` (las
   entradas anteriores quedan idénticas). Ojo: este script también copia `scripts/lib/*.mjs` sobre
   `src/ciempi/v2/arte/lib/`, que divergieron después de 1.6.0; esas dos copias se restauraron con
   `git checkout` y no forman parte del cambio.
4. A mano, con las medidas del paso 2: `V4_CALZADO` (zapatos-v4.js) y `V4_MOCHILAS`/`medidas`
   (mochilas-v4.js), también en `laboratorio-transformaciones/accesorios-v4-datos.js`;
   `MOCHILA_V4` en MiniaturaAccesorio.tsx y `TAPAN_LA_CARA` en pruebaTienda.ts.
5. `node scripts/generar-tienda-ciempi.mjs` (nombres y precios agregados; ninguno existente cambia).

## Verificación

`lamina.png` (Ciempi, Dragón, Cuncuna, Serpiente y Camaleón, crecimiento, animaciones y tarjetas
de la tienda, junto al Robot de referencia):

    NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules \
      node docs/expansion-v9/capitan-cometa/lamina.mjs . docs/expansion-v9/capitan-cometa/lamina.png <tmp>

Revisión de originalidad: escudo hexagonal (no redondo), sin estrella, sin anillos concéntricos,
sin rojo ni blanco, sin letras ni alas; el emblema es un cometa (esfera redonda con estelas).
Pendiente: aprobación artística de la usuaria (estado «En revisión artística» en el laboratorio).
