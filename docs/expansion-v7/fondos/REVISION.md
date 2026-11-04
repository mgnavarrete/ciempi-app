# Revisión: fondos ilustrados de «Su mundo» · v2.7

- **Antes:** `antes/` (6 fondos SVG en la portada a 390 px, inicio 390 y apaisado, tienda).
- **Después:** `despues/` (lámina de portadas, lámina de WebP, inicio 390 y 844×390, tienda: grilla y vista previa).
- **IA:** `ia/` (prompts, PNG originales, `generaciones.json`, descarte `fondo-castillo-v1`).
- **Procesado:** `scripts/fondos/procesar-fondos.py` (16:10, 1280×800, WebP q82; 32–60 KB).
- **Capturas:** `capturar-fondos.mjs` + `lamina.py` (sobrescriben su carpeta de salida).

| Fondo | Precio | Observación visual |
|---|---|---|
| fondo-bosque | 28 | Hongos y árboles enmarcan; centro claro. El suelo verde llega a ~35 % del alto. |
| fondo-playa | 25 | Sol bajo detrás de Ciempi; palmera y quitasol se recortan en el teléfono. |
| fondo-ciudad | 28 | Ventanas cálidas y luna; en apaisado la vereda domina y los edificios se cortan arriba. |
| fondo-castillo | 30 | v2: castillo al ~70 % del ancho, visible en la miniatura y en la portada. |
| fondo-arrecife | 25 | Corales a los lados y rayos de luz; el más saturado de los seis. |
| fondo-nubes | 30 | Arcoíris y nubes rosadas; en apaisado solo se ve el suelo de nubes. |

Puntuaciones orientativas (1–5), con base en las capturas: coherencia con Ciempi 4 (forma redonda, contorno azul
suave, paleta alegre; más detallados que los SVG), calidad 4, integración con el personaje 4 (Ciempi y la portada se leen;
en apaisado el recorte muestra sobre todo el suelo), legibilidad 4 (bocadillo y botones sobre fondos claros) y originalidad 4.

Pendiente: no hay aprobación artística de la usuaria. La diferencia de estilo con los 6 SVG planos es visible en la grilla.
En apaisado (h-56) la imagen anclada abajo muestra ~45 % inferior: se pierde la luna, el arcoíris y la copa de los árboles.
