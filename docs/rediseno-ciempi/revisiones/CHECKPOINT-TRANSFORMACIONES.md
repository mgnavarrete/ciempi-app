# Checkpoint · Transformaciones Dragón (T01) y Cuncuna (T02)

Fecha: 2026-11-03. Estado: **pasos 1–6 completados (ver «Retomado»); pendiente la aprobación artística del usuario (paso 7)**. Todo es laboratorio; no se tocó catálogo, tienda, PantallaCiempi ni servidor. No hay aprobación artística del usuario.

## Hecho

### Etapa 1 · Conceptos con IA real (Codex CLI 0.166 + image_gen) — 6 generaciones
Referencias: presentación v2 aprobada (1.ª) + `T00-referencias/ciempi-sin-gorro.png` (2.ª). Prompts, PNG originales y registro (ruta original en `~/.codex/generated_images`) en `T01-dragon-v1/ia/` y `T02-cuncuna-v1/ia/` (`concepto-*.png`, `*-prompt.txt`, `*-registro.json`).
- Dragón: d1 desfile, **d2 bebé con alitas (seleccionada)**, d3 cresta de hojas.
- Cuncuna: c1 esponjosa, **c2 penachos (seleccionada)**, c3 colores chilenos.
- Láminas: `T0x/conceptos/lamina-conceptos.png` (claro/oscuro) y `T0x/conceptos/siluetas.png` (negro a 84 px alto y 320 px ancho, con Ciempi base).
- Justificación provisional (pendiente de redactar en REVISION.md): d2 y c2 tienen la silueta más distinta de Ciempi a 84 px (alas+cola en flecha+cuernos; fila de penachos). d3 es un bloque a 84 px y su cresta choca con gorros; c1 se lee como “Ciempi peludo”; c3 evoca la bandera. Las tres conservan cabeza naranja redonda; en la implementación la cabeza/ojos/boca son los vectores aprobados (no los de la IA).

### Etapa 2 · Piezas modulares — 9 generaciones (edición sobre el concepto elegido)
`pieza-{dragon,cuncuna}-{segmentos,cola,pata,cabeza}.png` y `pieza-dragon-alas.png`. Total IA usado: 15 imágenes.
- `scripts/transformaciones/procesar-piezas.py` (PIL+numpy+scipy, sin calco ni Image Trace): limpia alfa/halo, separa piezas, normaliza ancho de bola (A–D iguales), registra la cabeza contra el disco naranja (736,340 r126,5) y escribe WebP 2× + `manifiesto.json` en `docs/rediseno-ciempi/laboratorio-transformaciones/recursos/{dragon,cuncuna}/`. Pesos: Dragón ≈194 KB, Cuncuna ≈286 KB (≤600 KB).
- Láminas de control: `T0x/piezas/anclajes-piezas.png` (inspeccionadas: segmentos, cola, pierna, pie, alas y rasgos de cabeza correctos; antenas IA de la Cuncuna descartadas a propósito para usar las vectoriales del rig).

### Etapa 3 · Código (sin pruebas todavía)
- `src/ciempi/v2/especie.ts`: tipos, `FORMA_CIEMPI` (constantes actuales de pose.ts), formas modulares con ciclo A→B→C→D (rol 5 = D, reutiliza la pata de A), adaptables, exclusivo `espalda:dragon-alas`. Valores y/separación de Dragón/Cuncuna aún provisionales.
- `src/ciempi/v2/compatibilidad.ts`: `tipoDe`, `etiquetar`, `resolver` (no muta la apariencia; ocultos con motivo; `rasgosOcultos`).
- `src/ciempi/v2/pose.ts`: parámetro opcional final `forma` en `roles`, `posiciones`, `escena`; sin `forma` el código sigue la ruta original. **No verificado aún** (falta test).

### Scripts
`scripts/transformaciones/`: `generar-ia.mjs` (prompt por stdin; `-i` es variádico), `laminas.py`, `laminas-conceptos.sh`, `procesar-piezas.py`, `construir-laboratorio.mjs` (**falla**: `ts.ModuleKind` undefined con el import por defecto de `typescript`; probar `import * as ts` o `ts.default`), `prompts/` (generadores de prompts y lanzadores).

## Falta (próximos pasos concretos)
1. Arreglar `construir-laboratorio.mjs` y generar `laboratorio-transformaciones/gen/` (pose.js, especie.js, compatibilidad.js, pose-original.js).
2. `laboratorio-transformaciones/especies.js`: construir la base de especie desde `env.base` (ids `tail, mint-back, yellow-middle, orange-middle, mint-front, segmento-d`; `clip-<id>` + `<g clip-path>` no vacío; 6 patas `translate(pie)` + `rotate(g -10 -32)` con pierna/pie raster; rasgos de cabeza con `data-accessory` detrás (Dragón) o delante (Cuncuna); hocico vectorial del Dragón; Dragón sin antenas; Cuncuna con puntas menta); componer con `renderCiempi({...env, base})` + `resolver`; alas como `<g data-bag>` antes de `body`; tinte por paleta en canvas protegiendo el contorno azul; contorno visible del núcleo si hay textura y textura copiada a D.
3. Laboratorio HTML (criatura, N 0–40, paletas, B03, accesorios con etiqueta, conjuntos, animaciones con `crearRig`/`Reproductor`, A/B con Ciempi, 84/96/240/320, claro/oscuro). Fetch `/ciempi-v2/` → `/public/ciempi-v2/`. Servir: `python3 -m http.server 8772 --bind 127.0.0.1` desde la raíz del worktree.
4. Pruebas: Vitest de `compatibilidad`/`especie`/`roles`+`posiciones` (con y sin `FORMA_CIEMPI`); Playwright (NODE_PATH del brief) comparando `escena` original vs nueva para N ∈ {0,1,5,12,40}; consola sin errores; capturas.
5. Evidencia: crecimiento N=0,1,2,5,8,12,22,40; ≥8 universales + 2 adaptables + exclusivos; comparaciones 84/240/320 claro/oscuro; `REVISION.md` por especie con ficha §12 y cinco puntuaciones tras inspección.
6. `npx tsc --noEmit -p .` y `npx vitest run src` (no ejecutados). `node_modules` del worktree es un enlace simbólico al del repo principal (ignorado por git).

## Retomado (2026-11-03, segunda sesión)
1. `construir-laboratorio.mjs` usa `transformWithOxc` de Vite (TypeScript 7.0.2 es nativo y no expone `ModuleKind`). `gen/` generado.
2. `laboratorio-transformaciones/especies.js` + `nucleo.js`: compositor de especies sobre `renderCiempi` y `escena(…, forma)`; rasgos ocultables (`cuernos`, `hocico`, `penacho`), alitas exclusivas delante del cuerpo y detrás de la cabeza, tinte por paleta en canvas por bandas de tono, superficies B11 copiadas a D con contorno del núcleo.
3. Laboratorio (`index.html`, `laboratorio.js`), láminas (`laminas.html`) y galería (`galeria.html`). README en la carpeta.
4. Pruebas: `src/ciempi/v2/especie.test.ts`, `compatibilidad.test.ts`; `scripts/transformaciones/probar-laboratorio.cjs` (Ciempi idéntico 35/35; consola limpia).
5. Evidencia en `revisiones/T01-dragon-v1/evidencia/`, `T02-cuncuna-v1/evidencia/`, `T00-comparacion-v1/evidencia/`; fichas `REVISION.md`.
6. `npx tsc --noEmit -p .` sin errores; `npx vitest run src`: 21 archivos, 199 pruebas, todas pasan.

Cambios de código compartido: `pose.ts` solo añade `forma?.margenCola` (con `forma` ausente, 110 como siempre). `especie.ts`: `margenCola`, ciclo configurable (Cuncuna B→C→D→A), `MASCARAS_COMPLETAS` y `rasgosOcultosCon`. `componer.js`, rig y catálogo sin cambios.
