# Capitán Ciempi (2.8.3; antes Capitán Cometa, 2.8.2)

Conjunto de superhéroe propio con la misma estructura que el Robot. En 2.8.3, a pedido de la usuaria,
se rediseñó en azul oscuro, blanco y rojo con estrella blanca y nombre «Capitán Ciempi»; los ids
`cometa` de 2.8.2 se conservan para no perder compras. El estado anterior (cometa, petróleo y
dorado) queda como evidencia en `ia/v1-cometa/` y `lamina-v1-cometa.png`.

| Pieza | Id | Precio |
|---|---|---|
| Antifaz Capitán Ciempi: visera con estrella blanca, ribete rojo (B07, deja ver ojos y boca) | `cabeza:b07-ia-cometa` | 32 |
| Traje Capitán Ciempi: azul oscuro con franjas diagonales rojas y blancas y estrella pequeña (B11, atlas 3×2) | `textura:b11-cometa` | 32 |
| Botas Capitán Ciempi: rojas con ribete blanco y suela azul (B10, construcción v4.2) | `pies:b10-cometa` | 24 |
| Escudo Capitán Ciempi: hexagonal, azul oscuro, estrella blanca y borde de segmentos rojos y blancos (B09, v4.2), se vende aparte | `espalda:b09-cometa` | 25 |
| Conjunto (antifaz + traje + botas, sin escudo) | `conjunto:b12-set-cometa` | 71 |

## Cómo se hizo (pipeline existente, sin edición manual del catálogo de producción)

1. `ia/`: maestros IA reales con `scripts/transformaciones/generar-ia.mjs` (Codex image_gen). Prompts
   en `ia/prompts/`, registro en `ia/generaciones.json`, referencias de formato y estilo (piezas
   Robot y antifaz Draco aprobados, Ciempi sin gorro) en `ia/referencias/`. En 2.8.3 el escudo se
   generó directamente sin correas (referencia: propulsor Robot v4.2 sin correas).
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

Límites de diseño propio en 2.8.3: escudo hexagonal (no redondo) con borde de seis segmentos
alternos, sin anillos concéntricos; sin letra «A» ni alas en la cabeza; traje liso sin malla ni
escamas; contorno #243e5b y volumen 2D.
Pendiente: aprobación artística de la usuaria (estado «En revisión artística» en el laboratorio).
