# Revisión v6 · comidas de la pista (rama `v26-frutas`)

**Objetivo:** reemplazar el dibujo SVG antiguo de las 10 comidas por ilustraciones nuevas en la línea de Ciempi, a pedido de la usuaria.
**IDs (sin cambios de id, precio ni inventario):** comida-manzana, comida-frutilla, comida-platano, comida-sandia, comida-galleta, comida-pelota, comida-dona, comida-cupcake, comida-pizza, comida-helado.

## Fuentes y reproducción

- Estado previo: `antes/lamina-antes.png` (render del `Comida` SVG de `1602a1e`, CIEMPI 2.5.3).
- IA: una hoja 5×2 con Codex `image_gen` (`ia/hoja-v1.png`, prompt `ia/prompt-hoja.txt`, registro `ia/generaciones.json`). Referencias: `public/ciempi.svg` rasterizado, la mochila Cartógrafo aprobada (V4) y la presentación de Ciempi v2. No hizo falta regenerar ninguna comida.
- Procesado: `scripts/frutas/procesar-comida.py`: alfa real de la IA, contorno casi negro llevado a `#243e5b`, contorno exterior de 2 px, lado mayor de 172 px más el contorno, centrado en un lienzo de 192×192 px con margen uniforme de 8 px. WebP con alfa entre 3,5 y 5,7 KB.
- Láminas: `scripts/frutas/lamina-comida.mjs` (con el mismo encuadre antes y después: grande, pista 1:1 con `tamano` 10 y 14, tienda de 36 px y pista ×3 en píxeles reales). Comparación: `comparacion-antes-despues.png` (`scripts/frutas/comparar-comida.py`).
- App: `scripts/frutas/capturar-pista.cjs`, sobre un build local servido con `vite preview` en el puerto 5197 y DPR 2. `despues/app-nivel1` corresponde a «Mi perro Pupo» (todas las comidas en la pista) y `despues/app-nivel2` a «Don Ciempiés va a la escuela» (solo la última comida, junto a la moneda).

## Integración

`Comida` (`src/ciempi/dibujos.tsx`) mantiene su API y dibuja `<image href="/ciempi-v2/comida/<id>.webp">` centrada en (x, y), con un lado de `2,7 × tamano`. Ese valor iguala el alto de la manzana anterior. Las comidas redondas quedan alrededor de un 10 % más grandes que antes. Si un id no tiene imagen, se usa el SVG anterior (`ComidaSvg`).

Comportamiento comprobado:
- La pista de lectura, la portada y la tienda se actualizan sin cambios en sus archivos.
- Al leer cada palabra, su comida desaparece y Ciempi crece.
- El comer animado E08 (`COMER_ANIMADO = false` en producción) usa `<use href>` sobre el `<g>` de la comida. Se verificó aparte que `<use>` con `<image>` se dibuja con giro y escala, pero no se capturó en la app porque la opción está apagada.
- No hay recortes ni máscaras de mordisco sobre el SVG que haya que adaptar.

## Observaciones y puntuaciones (orientativas)

| Criterio | Nota | Observación |
|---|---|---|
| Coherencia con Ciempi | 4 | Contorno azul oscuro, brillos arriba a la izquierda y colores alegres. El trazo es más fino y regular que el de Ciempi v2. |
| Calidad de ilustración | 4 | Formas limpias y volumen suave. La galleta es plana y simple, y la sandía es un gajo con la corteza hacia abajo. |
| Integración | 4 | Escala homogénea entre las 10 y sin halo sobre fondo claro u oscuro. En la pista de nivel 2, la hoja de la manzana roza la moneda, igual que antes. |
| Legibilidad a 24–40 px | 4 | A `tamano` 10 todas se reconocen. La dona y la pelota pierden detalle interior, pero conservan la silueta. |
| Originalidad | 3 | Iconografía de comida estándar, sin marcas ni logos (la pelota es de playa y no lleva nada impreso). |

**Decisión:** queda integrada en la rama. **Pendiente:** la aprobación de la usuaria antes de usarla como referencia visual y llevarla a `main`. Tampoco se revisaron Presentación (tutorial) ni la tienda dentro de la app: se cubrieron con la lámina a 36 px, sin capturas.
