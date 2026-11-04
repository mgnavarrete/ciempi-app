# Revisión V4 · mochilas B09 y calzado B10 integrados al cuerpo

- **Rama / worktree:** `expansion-v4-accesorios` (desde `7ca0748`). Solo laboratorio.
- **IDs:** mochilas `b09-robot`, `b09-aventura`, `b09-draco`, `b09-mago`, `b09-raton`; calzado `b10-robot`, `b10-aventura`, `b10-lluvia`, `b10-mago`, `b10-deportiva` (los 5 + 5 del catálogo `public/ciempi-v2/catalogo.json`).
- **Objetivo y alcance autorizado:** corregir mochilas que parecen dibujadas encima del cuerpo y zapatos superpuestos a las patas, en el laboratorio, con interruptor `accesorios=v4`; sin cambiar el juego, el compositor por defecto, la economía, los ids ni los recursos existentes.
- **Referencias:** `CIEMPI_ART_DIRECTION.md` v1.7 (§4 puntos de unión, §6 sombras de contacto, §7 pies elevados/tobillo, §8 «Mochilas y bolsos» y «Calzado», §10–12, AD-012/AD-014 aprobación B09–B12, AD-017 cuerpos de Dragón y Cuncuna).
- **Estado:** revisión artística del agente + validación técnica. **No hay aprobación del usuario.** Nada se registró en la guía.

## Cómo reproducir

```bash
python3 -m http.server 8810 --bind 127.0.0.1          # raíz del worktree
# Laboratorio: http://127.0.0.1:8810/docs/rediseno-ciempi/laboratorio-transformaciones/?accesorios=v4
#   (botones «Accesorios v1 / Accesorios v4» en el panel Vista; conservan criatura, N y selección)
# Láminas:     …/laboratorio-transformaciones/laminas-accesorios.html?tipo=piezas|detalle|crecimiento|animacion|especies&familia=mochilas|zapatos&especie=ciempi|dragon|cuncuna&fondo=claro|oscuro&accesorios=v1|v4
NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules node scripts/transformaciones/capturar-accesorios-v4.cjs v1 antes     # no sobrescribe sin FORZAR=1
NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules node scripts/transformaciones/capturar-accesorios-v4.cjs v4 despues
python3 scripts/transformaciones/comparar-accesorios-v4.py      # comparaciones/*.jpg (antes | después)
python3 scripts/transformaciones/procesar-mochilas-v4.py        # maestros IA → recursos/accesorios-v4/*.webp + medidas.json
```

Mismo motor (Chromium 1248, Playwright), mismo fondo, selección, poses e instantes para antes y después; la única variable es `accesorios`. `antes/` se capturó (commit `a737f49`) antes de escribir cualquier código v4.

## Evidencia

| Lámina | Contenido | Antes / después / comparación |
|---|---|---|
| `piezas-mochilas-{claro,oscuro}` | cada mochila: N = 5 y 12 a 320 px, 84 px de alto, caminar A02 (2 instantes) | `antes/`, `despues/`, `comparaciones/*.jpg` |
| `piezas-zapatos-{claro,oscuro}` | ídem calzado | ídem |
| `detalle-mochilas[-dragon/-cuncuna]` | anclaje ampliado (recorte 330 200 360 280): reposo, caminar, tropezar ×2, celebrar | ídem |
| `detalle-zapatos[-dragon/-cuncuna]` | anclaje ampliado de los pies (recorte 220 430 250 160), mismos instantes | ídem |
| `especies-{mochilas,zapatos}` | Ciempi / Dragón / Cuncuna, 240 px y detalle | ídem |
| `crecimiento-{ciempi,dragon,cuncuna}` | parejas mochila+calzado con N = 0, 1, 5, 12, 40 | ídem |
| `animacion-{ciempi,dragon,cuncuna}` | N = 12, 240 px: A02 caminar, E04 tropezar, A03 celebrar, A10 victoria, E08 comer (6 instantes) | ídem |

Maestros IA y prompts: `ia/` (`mochila-<k>-sin-correas.png`, `-prompt.txt`, `-registro.json`; Codex CLI 0.166 + image_gen, referencia = la mochila B09 aprobada).

## Diagnóstico del estado previo (v1, juego)

**Mochilas: 5 de 5 graves.** Construcción común: una imagen de ≈205 unidades de ancho (más que el segmento delantero, de 190) en coordenadas absolutas (370, 250), sobre la unión del segmento naranja y el delantero, en la parte del rig «espalda».
- Las correas están pintadas en la imagen como lazos a la derecha de la mochila y quedan delante del costado del segmento sin rodearlo: no pasan por detrás ni por debajo (`antes/detalle-mochilas-claro.png`). Bolso Luna: la correa sube en diagonal hacia el aire.
- No hay sombra de contacto; la mochila se lee como pegatina sobre el costado, no apoyada en el lomo.
- Con N = 1 sobresale por detrás del único segmento, sobre el vacío (`antes/crecimiento-ciempi-claro.png`).
- En Dragón y Cuncuna, el mismo efecto de calcomanía (`antes/especies-mochilas-claro.png`).
- En las animaciones revisadas no vi un deslizamiento notable respecto del segmento. El rig la mueve con `frente + 0,3·cabeza` y una inercia de giro propia, no con el segmento.

**Calzado: 3 graves y 2 menores.** Construcción común: la imagen del zapato reemplaza a la zapatilla con ancho fijo 88 y el talón en x = −43, sin relación con su abertura. La pierna se dibuja antes y queda detrás del zapato completo.
- Graves: `b10-robot` (el interior rojo de la caña queda vacío y la pierna pasa detrás del borde trasero), `b10-lluvia` (la pierna termina detrás del borde turquesa y la boca oscura queda vacía a su lado) y `b10-aventura` (la boca oscura asoma junto a la pierna, que va detrás del cuello acolchado).
- Menores: `b10-mago` (la pierna entra por detrás del puño y la boca casi no se ve) y `b10-deportiva` (la pierna queda detrás del cuello coral, con la boca apenas visible).
- Sin sombra de suelo con N ≠ 5 ni en Dragón y Cuncuna: `escena()` quita las elipses del maestro al clonar.

## Corrección (v4, solo laboratorio)

Los archivos están en `docs/rediseno-ciempi/laboratorio-transformaciones/`: `accesorios-v4.js`, `accesorios-v4-datos.js`, `interruptor-accesorios.js` y `recursos/accesorios-v4/`. El cambio en `nucleo.js` (un envoltorio de `componerCriatura`) es mínimo, y en `index.html` solo se añadió una línea de script. **No se tocó `src/` ni `public/`** (`git diff 7ca0748 -- src public` está vacío). La v4 es un posproceso del SVG que devuelve `renderCiempi`.

**Mochilas**
1. **IA:** se regeneraron las cinco con Codex image_gen a partir de su PNG B09 aprobado, con «el mismo objeto, sin correas ni asas», y luego se hizo un recorte con alfa limpio. Se conservan diseño, colores y emblemas (comparar `ia/` con `laboratorio/recursos/mochilas/v1/`).
2. **Anclaje:** la mochila vive dentro del grupo del segmento delantero (`mint-front`, que existe en las tres criaturas). Hereda posición, giro y escala del segmento al crecer (`escena`/`escenaCreciente`) y al animar (rig), sin cambiar pose.ts ni rig.js. Apoya el fondo sobre la esfera, a 0,84 R, inclinada −24° hacia la cola. El ancho es de 168 a 184 unidades.
3. **Correas:** dos anillos paralelos a lo largo del cuerpo (uno en el Bolso Luna), proyectados como elipses sobre la esfera.
   - La mitad lejana se dibuja antes del segmento, que la tapa salvo en el borde de la silueta.
   - La mitad cercana se dibuja sobre el segmento, recortada a su disco, con contorno, luz y hebilla en el ecuador visible.
4. **Sombra de contacto:** una elipse oscura al 20 % bajo el fondo, recortada a la esfera.
5. **Encuadre:** el grupo no contiene `<image>`, para que `pose.ts` no lo confunda con la mochila absoluta. Con N = 0 desaparece con el segmento.

**Calzado**
1. Cada zapato se coloca por su **boca**, medida en `accesorios-v4-datos.js` (extremos del labio delantero, punto más bajo y borde superior). El centro de la boca queda bajo el eje de la pierna (x = −10) y la suela en y = +24. El ancho se ajusta por pieza: 74 para lluvia, 80 robot, 84 aventura, 92 deportiva y 100 mago.
2. Encima del zapato va una **copia de la propia pierna** (trazados en Ciempi, imagen `pierna` en las especies), contrarrotada y recortada a la boca: desde encima del borde trasero hasta el labio delantero.
   - Resultado: la pierna tapa el interior y el borde trasero, y el labio delantero tapa la pierna.
   - En zapatos bajos (mago, deportiva), una franja de 2 unidades justo encima del final de la pierna se estira hasta pasar el labio. Así no se ve el contorno inferior de la pierna ni aparece un escalón.
3. **Sombra de contacto** bajo la suela, dentro del grupo que gira con el pie.

## Compatibilidad revisada

- **Criaturas:** Ciempi, Dragón y Cuncuna sin cambiar sus cuerpos ni patas (AD-017). El calzado se adapta a la pierna raster de cada especie, y la mochila al radio de su segmento delantero (`data-nucleo`).
- **Longitudes:** N = 0 (sin mochila ni pies), 1, 5, 12 y 40 en las tres criaturas (`despues/crecimiento-*.png`).
- **Animaciones:** A02, E04, A03, A10 y E08 en las tres criaturas, con N = 12. En el detalle con N = 5: reposo, A02, E04 ×2 y A03.
- **Tamaños y fondos:** 84 px de alto, 96, 240 y 320 px de ancho; fondo claro y oscuro (oscuro solo en `piezas-*`).
- **Pendiente:** combinaciones con capas (excluyentes con la mochila), superficies B11 junto con mochila v4, bufanda B01 junto con mochila, máscaras, Firefox y Safari, y el componente real del juego (la v4 no está en el juego).

## Criterios obligatorios (§12)

| Criterio | Estado | Observación / evidencia |
|---|---|---|
| Respeto de base | Cumple | Anatomía, segmentos y patas sin cambios. Sin accesorios es idéntico (probar-laboratorio 35/35 y capturas 108/108). Excepción visual: con mago y deportiva la pierna se ve unas 10–14 unidades más larga dentro del zapato bajo (`despues/detalle-zapatos-claro.png`). |
| Anclaje y capas | Cumple con observaciones | La pierna entra en la boca y las correas rodean el segmento, con la mitad lejana detrás y la cercana delante (`comparaciones/detalle-*.jpg`). Quedan costuras de antialias de 1 px donde termina el recorte de la copia de la pierna, visibles solo al ampliar ×2. |
| Legibilidad | Cumple con observaciones | A 320 y 240 px se leen la mochila, las correas y la entrada al zapato. A 84 px la mochila es más pequeña que en v1, que era desproporcionada, y las correas se leen como dos franjas oscuras en el segmento. |
| Perspectiva, luz y material | Cumple con observaciones | Mochila apoyada e inclinada con la curva del lomo, con sombra de contacto. La IA conserva la luz superior izquierda. Las correas son planas, con un filete de luz. Sobre fondo oscuro, las sombras de contacto (#243e5b) casi no se ven. |
| Compatibilidad | Cumple en lo revisado | Ver arriba. Faltan las combinaciones pendientes. |
| Diferenciación honesta | No aplica | Mismos diseños B09/B10. Solo cambian la construcción y, en las mochilas, la eliminación de las correas pintadas. |
| Efecto de controles | Cumple | `accesorios=v4` solo afecta a las 5 mochilas y 5 calzados B09/B10. Capas, alitas y zapatillas originales siguen igual. |
| Evidencia y autorización | Pendiente | Antes y después inspeccionados por el agente. Las piezas IA nuevas y la nueva construcción requieren revisión y aprobación del usuario. |

## Rúbrica (1–5, orientativa; antes → después)

### Mochilas (familia; diferencias por pieza en la nota)

| Dimensión | Antes | Después | Observación concreta |
|---|---|---|---|
| Coherencia con Ciempi | 3 | 4 | El objeto IA ya tenía el contorno y el acabado de Ciempi, pero su tamaño (205 u) competía con la cabeza. En v4 (168–184 u) queda subordinada al personaje y apoyada en el lomo (`comparaciones/piezas-mochilas-claro.jpg`, 320 px). |
| Calidad de ilustración | 3 | 4 | Antes, las correas pintadas eran lazos planos sin recorrido. Ahora tienen volumen esférico (elipse cercana/lejana), contorno, luz y hebilla. La IA sin correas mantiene la tela, el metal y las costuras. Las correas SVG son más simples que la mochila raster: se nota el cambio de material a ×2. |
| Integración con el cuerpo | 1 | 4 | Antes era una calcomanía sobre el costado, con correas en el aire y desbordando en N = 1. Ahora rodea el segmento, tiene sombra de contacto y acompaña giro y escala del segmento en E04 y A03 (`comparaciones/detalle-mochilas-claro.jpg`). No llega a 5 porque la mitad lejana apenas se percibe y el Bolso Luna (bandolera) usa el mismo recurso de anillo. |
| Legibilidad | 4 | 3 | A 84 px, v1 era más grande y por eso más evidente. En v4 se reconoce como mochila a 240 y 320 px. A 84 px la silueta es pequeña, Draco y Ratón se confunden un poco con el segmento y las correas a rayas compiten (`despues/piezas-mochilas-claro.png`). |
| Originalidad | 4 | 4 | Diseños B09 sin cambios. La construcción con correas es común a las cinco, sin aporte específico por pieza. |

Por pieza:
- **Propulsor Lumen:** las toberas quedan apuntando hacia abajo y atrás, más creíbles.
- **Cartógrafo:** la más legible.
- **Draco:** las alas laterales ayudan a la silueta, pero el cuerpo menta se funde con el segmento menta de Ciempi a 84 px.
- **Bolso Luna:** un único anillo, que se lee como bandolera.
- **Ratón Atlas:** las orejas mantienen la lectura.

### Calzado (familia)

| Dimensión | Antes | Después | Observación concreta |
|---|---|---|---|
| Coherencia con Ciempi | 4 | 4 | Mismos zapatos B10. Los anchos por pieza (74–100) quedan dentro del rango de la zapatilla original (≈92). |
| Calidad de ilustración | 4 | 4 | Raster sin cambios. La sombra de contacto suma apoyo. Aparecen costuras de 1 px, solo al ampliar. |
| Integración con el cuerpo | 2 | 4 | Antes, la pierna pasaba por detrás de la caña con la boca vacía al lado (robot, lluvia, aventura). Ahora la pierna ocupa la boca y el labio delantero la tapa, también en Dragón y Cuncuna y al tropezar (`comparaciones/detalle-zapatos-claro.jpg`, `despues/detalle-zapatos-dragon-claro.png`). No llega a 5 por la pierna estirada en mago y deportiva y por las costuras de 1 px. |
| Legibilidad | 4 | 4 | Sin cambios de silueta. A 84 px se sigue distinguiendo cada calzado. Lluvia es algo más pequeña (74). |
| Originalidad | 4 | 4 | Diseños B10 sin cambios. |

Por pieza:
- **Robot** (antes grave): 4 en integración. La pierna llena la caña roja.
- **Lluvia** (antes grave): 4. La pierna está dentro del borde turquesa, con aire alrededor dentro de la boca.
- **Aventura** (antes grave): 4. La boca es más estrecha que la pierna, así que los lados de la pierna quedan bajo el cuello acolchado, que se lee como un puño ajustado.
- **Mago** (antes menor): 3. Entra bien, pero se ve más pierna y una costura tenue.
- **Deportiva** (antes menor): 3. La «boca» es una lectura del sombreado del cuello coral (medida incierta).

## Decisión

- **Técnica:** lista para revisión en el laboratorio. Las pruebas, que se repiten abajo, pasan.
- **Artística (agente):** requiere ajustes menores y está **pendiente de la revisión del usuario**. Las mochilas regeneradas con IA son piezas nuevas derivadas de B09 y no están aprobadas.
- **Cambio de identidad:** no. Se conservan la base, las patas aprobadas y los diseños B09/B10.

## Pruebas (resultado de esta sesión)

- `npx tsc --noEmit -p .`: sin errores (código de salida 0).
- `npx vitest run src`: 29 archivos, 279/279 pruebas.
- `capturas.mjs` sobre una copia `git archive` de `e308fec` (puerto de la copia 8811): **idénticos en los 108 casos**.
- `probar-laboratorio.cjs` (8810): **35/35** idénticos, sin errores ni avisos de consola. Repetido con `?accesorios=v4`: 35/35, sin errores.
- `capturar-accesorios-v4.cjs`: 18 láminas v1 y 18 v4, sin errores ni avisos de consola. Interruptor v1 ⇄ v4 probado con Playwright, sin errores.

## Limitaciones y siguiente acción

1. Solo laboratorio. Para llevarlo al juego habría que mover la construcción a `equipWardrobe`, detrás de una opción, y volver a medir.
2. La mochila ya no tiene la inercia propia del rig (`p.espalda.rot`): sigue rígida al segmento.
3. La copia de la pierna se contrarrota con el giro base del pie. Durante `q.pie` (tropezar), la diferencia se limita a la franja de la boca. En los cuadros inspeccionados no se ve, pero no se revisó cuadro a cuadro.
4. Sombras de suelo proyectadas: solo existen las del maestro con N = 5. La v4 añade sombras de contacto, que en fondo oscuro casi no se ven.
5. Costuras de antialias de 1 px en el borde del recorte de la pierna, visibles al ampliar ×2.
6. Deportiva: la boca es una interpretación del dibujo. Si el usuario la rechaza, se puede regenerar la pieza con la boca visible.
7. Las combinaciones pendientes listadas arriba.
