# CIEMPI · Tienda v3: colecciones, personajes y transformaciones

**Fecha:** 3 de noviembre de 2026 · **Estado:** propuesta de diseño de producto, pendiente de aprobación. **Actualizado el mismo día** con lo que el usuario aprobó de la economía v3 (modelo E2, precios provisionales en dos olas y Cuncuna con 6 de 8 cuentos de nivel 0): §2.4, §4.6, §4.8 y §6. Fuente: `ECONOMIA-V3.md` (rama de economía `worktree-agent-a925a3794da34fde2`), §9, §10 y §18.
**Alcance de este trabajo:** solo documentos y láminas de concepto. No se modificaron el catálogo (`src/ciempi/catalogo.ts`, `tienda.generada.ts`), los precios, el servidor ni los cuentos.
**Página para revisar:** [index.html](index.html) (autocontenida, sin CDN).
**Relación con otros documentos:** desarrolla las secciones 4, 5, 7 y 16 (Fase E) del [plan maestro de expansión](../PLAN-MAESTRO-EXPANSION.md) y respeta la economía y los paquetes del [plan maestro v1](../../integracion-ciempi/plan-maestro-v1/PLAN-MAESTRO.md). La guía de referencia es [CIEMPI_ART_DIRECTION.md](../../../CIEMPI_ART_DIRECTION.md) v1.7.

Marcas: **[V]** verificado en código o archivo · **[I]** inferencia o propuesta · **[P]** pendiente de evidencia o de aprobación.

---

## 1. Revisión del catálogo real (v2.4.1)

Fuente: `src/ciempi/tienda.generada.ts`, generado por `scripts/generar-tienda-ciempi.mjs` desde `public/ciempi-v2/catalogo.json`, más los fondos y comidas de `catalogo.ts` [V].

### 1.1 Tabla por categoría

| Categoría (parte) | Opciones | Gratis | Precios de pago | Observaciones y huecos |
|---|---:|---:|---|---|
| Colores (`paleta`) | 19 | 5 (Clásico, Mar, Rosa, Bosque, Noche) | 14 × 12 | **Las 14 paletas de pago llevan nombres de marcas** (Spider-Man, Iron Man, Superman, cuatro casas, Harry, Hermione, Voldemort, Kitty, Barbie, Mickey, Minnie). No hay ni una paleta original de pago. Dos familias que se compran una vez: Gryffindor/Harry/Hermione y Barbie/Minnie [V]. |
| Ojos (`ojos`) | 5 | 1 | 4 × 6 | Completo y sencillo. Con ojos cerrados o máscara, el color no se ve: hay que explicarlo (guía §9). |
| Gestos (`gesto`) | 14 | 14 | — | Todos gratis (decisión vigente). Bien así. |
| Gorros y máscaras (`cabeza`) | 14 | 2 (Sin gorro, Jockey) | 18–32 | 6 gorros + 7 máscaras de pago. Es la categoría más rica. |
| Peinados (`pelo`) | 12 | 1 | 12–18 | 11 peinados. Uno se llama «Harry» a la vista. |
| Detalles (`detalle`) | 2 | 1 | 6 | **Solo un producto** (Rayo, la cicatriz de Harry con nombre neutro). Hueco evidente. |
| Lentes (`cara`) | 13 | 1 | 10–22 | 12 monturas; Redondos y Corazones con variantes de color. |
| Bufandas (`cuello`) | 2 | 1 | 30 | **Un solo producto** (bufanda B01, 6 colores). Cuatro de sus colores se muestran como Gryffindor, Slytherin, Ravenclaw y Hufflepuff [V]. |
| Espalda (`espalda`) | 3 | 1 | 24, 28 | **Solo dos capas.** Las cinco mochilas B09 se retiraron en 2.2 y se devolvieron sus monedas (`server/sql/011_sin_mochilas.sql`) [V]. Hueco principal. |
| Calzado (`pies`) | 6 | 1 (Zapatillas) | 12–24 | 5 de pago. Faltan familias de silueta: pantufla, sandalia, patín, zueco. |
| Estampados (`textura`) | 6 | 1 (Liso) | 24–32 | 5 trajes completos. No hay estampados sencillos y baratos (lunares, rayas). |
| Fondos | 6 | 1 | 20–25 | Jardín gratis; Espacio 25. |
| Comida | 10 | 1 | 8–15 | Manzana gratis. |
| Conjuntos | 10 | — | 20 % menos sobre lo que falta | Robot, Dragón, Explorador, Pirata, Mago, Espíritu, AraLuz, Ratón, Realeza, Charcos. |

Total: 96 piezas de personaje + 6 fondos + 10 comidas + 10 conjuntos [V]. Comprar todo cuesta unas 1 360 monedas, alrededor del doble de lo que dan los 40 cuentos en su primera lectura (≈697) [V, hechos verificados]. *Nota de la economía v3:* ejecutando el código del juego, `ECONOMIA-V3.md` §2.1 obtiene **1 350** para el catálogo y **703** para los 40 cuentos (el nivel 2 da 118, no 112); el orden de magnitud no cambia.

**Huecos por anclaje:** cuello (1), espalda (2, y ninguna mochila), detalle (1), pies (5). En cambio, cabeza, pelo y lentes suman 36 opciones de pago. La tienda está cargada hacia la cabeza: ahí la pieza se ve más, pero el cuerpo largo de Ciempi, que es su rasgo más propio, tiene poca oferta. **Las colecciones nuevas deberían rellenar sobre todo espalda, pies, cuello y superficies** [I].

### 1.2 Duplicados, variantes poco distinguibles y choques de nombre

| Caso | Evidencia | Recomendación |
|---|---|---|
| Paletas Harry / Hermione / Gryffindor | Auditoría: tonos casi iguales; en el conjunto Spider-Man siete paletas dan la misma imagen a 320 px ([verificaciones](../../rediseno-ciempi/auditoria/verificaciones.json)). Ya forman una familia en el código [V]. | Mantener la familia; al renombrar (ver la revisión de personajes) dejar **una** paleta visible con dos variantes como máximo. |
| Paletas Barbie / Minnie / Rosa | La auditoría las califica de «familia rosa» poco distinguible; Rosa es gratis [V]. | Una sola paleta rosa de pago con nombre original, o ninguna (ya existe Rosa gratis). |
| Paletas tapadas por estampados | Al elegir un color se quita el estampado (`ponerItem`) [V]. Funciona, pero se ve el aviso amarillo cada vez. | Mantener el aviso; añadir una vista previa que muestre el estampado y el color en dos miniaturas. |
| «Estrellas» (lentes `b04-estrellas`) y «Estrellas» (estampado `b11-mago`) | Mismo nombre visible para dos productos [V]. | Renombrar el estampado como «Constelación» o «Noche estrellada». |
| Conjunto «Dragón» frente a la especie Dragón | El conjunto `b12-set-draco` se llama «Dragón» y existen «Gorro dragón» y «Antifaz dragón» [V]. Con la especie habrá tres cosas llamadas dragón. | Antes de la sección Personajes, renombrar el conjunto como «Draco» (su nombre de diseño) y aclarar en la ficha que es un **disfraz** sobre Ciempi. Mantener el id. |
| Conjunto «Robot» y máscara «Robot» | Mismo nombre visible [V]. El plan descarta una especie Robot por este choque. | Conjunto «Lumen» (su nombre de diseño). |
| Conjunto «Charcos» | Solo cobra una pieza (Botas de lluvia, 12): es un «conjunto» de una sola compra [V]. | Presentarlo como look gratuito sugerido, no como pack. |
| Capas | Solo dos capas, y la auditoría señaló que todas las capas compartían plantilla triangular (guía §8). B08 v2 está aprobada para laboratorio (AD-012). | Las capas nuevas deben diferenciarse por **construcción** (páginas, cometa), no por color. |

Nota: la auditoría de octubre se hizo sobre el armario prototipo (122 opciones). Varias piezas fueron sustituidas después por los batches B04–B12, así que solo cito los hallazgos que siguen siendo válidos para el catálogo actual [V].

### 1.3 Piezas actuales que encajan en las colecciones nuevas

Una pieza puede estar en varias colecciones sin duplicarse ni comprarse dos veces (guía §5). Las colecciones funcionan como **filtro**: no cambian ids, precios ni derechos.

| Pieza actual (id) | Fantasía | Naturaleza | Espacio |
|---|:-:|:-:|:-:|
| Gorro de mago `cabeza:b06-ia-mago` | ● | | |
| Corona `cabeza:b06-ia-corona` | ● | | |
| Gorro dragón `cabeza:b06-ia-dragon` | ● | | |
| Antifaz dragón `cabeza:b07-ia-dragon` | ● | | |
| Espíritu `cabeza:b07-ia-espiritu` | ● | | ● |
| Búho `cabeza:b07-ia-buho` | ● | ● | |
| Ratón `cabeza:b12-raton` | | ● | |
| Explorador `cabeza:b06-ia-aventura` | | ● | |
| Robot `cabeza:b07-ia-robot` | | | ● |
| Lentes Visor `cara:b04-visor` | | | ● |
| Lentes Científico `cara:b04-cientifico` | | | ● |
| Lentes Mariposa `cara:b04-mariposa` | ● | ● | |
| Lentes Estrellas `cara:b04-estrellas` | ● | | ● |
| Bufanda `cuello:bufanda-calco32` (color Lavanda / Coral) | ● | ● | |
| Capa de héroe `espalda:b08-ia-heroica` (Azul, Morada) | ● | | ● |
| Capa de hojas `espalda:b08-ia-bosque` | ● | ● | |
| Zapatos de mago `pies:b10-mago` | ● | | |
| Botas de lluvia `pies:b10-lluvia` | | ● | |
| Botas explorador `pies:b10-aventura` | | ● | |
| Botas robot `pies:b10-robot` | | | ● |
| Escamas `textura:b11-draco` | ● | ● | |
| Estrellas (constelaciones) `textura:b11-mago` | ● | | ● |
| Armadura `textura:b11-robot` | | | ● |
| Paletas Bosque, Mar (gratis) | | ● | |
| Paleta Noche (gratis) | ● | | ● |
| Fondos Jardín, Selva, Mar, Nieve | | ● | |
| Fondo Espacio | | | ● |
| Conjuntos Mago, Draco, Espíritu, Realeza | ● | | |
| Conjuntos Explorador, Charcos, Ratón | | ● | |
| Conjunto Lumen (Robot) | | | ● |

Con lo que ya existe, Fantasía tiene ~17 piezas, Naturaleza ~15 y Espacio ~11. **Ninguna colección necesita muchas piezas nuevas para existir**; las nuevas sirven para cubrir los huecos de espalda, pies, cuello y superficie y para dar exclusivos a Dragón y Cuncuna.

---

## 2. Colecciones aprobadas: Fantasía, Naturaleza y Espacio

**Principios** (plan maestro §5 y guía §2–§3): pocas piezas y bien hechas; nada reservado por género; sin duplicar para inflar; silueta primero; un protagonista por conjunto.

**Cómo leer las fichas**
- **Anclaje:** según la guía §4 (gorro sobre cabeza; capa desde cuello/hombro; mochila sobre el segmento delantero; calzado alrededor del tobillo).
- **Compatibilidad:** *universal* (cabeza, cara, cuello, detalle: la cabeza no cambia entre especies, decisión ya tomada), *adaptable* (pies, superficies, espalda: un recurso o ajuste por especie), *exclusivo* (solo una especie).
- **Construcción:** *vector* (SVG recoloreable, como lentes, peinados y bufanda) o *raster* (WebP con maestro PNG 1024, como gorros, máscaras, capas, calzado y superficies), según la decisión técnica de B06–B08 v2.
- **Escalón de trabajo** (plan v1): Básico 6–12 · Común 14–18 · Especial 20–26 · Obra 28–32. Indica el trabajo de construcción, **no el precio final** (ver §4.8).
- **Riesgo de familia:** el problema documentado en la guía §8 que hay que vigilar.
- **Prompt IA:** brief en inglés con el patrón de B09–B12 (`edit first reference / isolated asset / navy #243e5b outlines / genuine transparent background`). Primera referencia: la base sin gorro (`docs/rediseno-ciempi/revisiones/B01-ia-bufandas-v1/referencias/ciempi-sin-gorro.png`); segunda, la lámina de concepto de la colección cuando se busque coherencia de paleta.

### 2.1 Fantasía · «El reino de los cuentos»

**Concepto.** Ciempi como caballero de un libro de cuentos: armadura blanda, telas acolchadas y papel. La fantasía se conecta con la lectura a través de las páginas, el libro y el broche, no con espadas ni con violencia.
**Paleta.** Lavanda `#9c86c9` · oro suave `#e7b84a` · menta `#83cda4` (la de Ciempi) · crema de papel `#fff4dc` · contorno `#243e5b`.

| # | Nombre (niño) | Categoría · anclaje | Compatibilidad | Constr. | Escalón | Riesgo de familia (§8) |
|---|---|---|---|---|---|---|
| F1 | **Casco suave** | Gorros · sobre la cabeza; antenas por dos aros | Universal | Raster | Especial | Gorros: piezas flotantes, cono rígido; un casco grande puede dominar la cabeza (como el antiguo Astronauta). |
| F2 | **Acolchado** | Estampados (traje) · superficie por segmento | Adaptable (atlas por especie) | Raster atlas 3×2 | Obra | Trajes: cuadrícula plana. El concepto v1 fundió los segmentos en un tubo: no aceptable. |
| F3 | **Capa de páginas** | Espalda (capa) · broche en el cuello | Adaptable; excluyente con alas | Raster | Obra | Capas: plantilla triangular. Debe leerse como hojas de libro, no como falda. |
| F4 | **Botas caballero** | Calzado · tobillo, seis pies | Adaptable (pies por especie) | Raster | Común | Calzado: bloque rígido o sin caña. |
| F5 | **Antifaz grifo** | Gorros y máscaras · medio antifaz | Universal | Raster | Especial | Máscaras: ojos sustitutos, gesto severo. Ojos vacíos y asimétricos. |
| F6 | **Mochila cofre** | Espalda (mochila) · segmento delantero | Adaptable | Raster | Especial | Mochilas: objeto plano pegado. **Solo si se aprueba el rediseño de mochilas** (§4.9). |
| F7 | **Alas de cuento** | Espalda · entre cuello y primer segmento | **Exclusivo Dragón** | Raster | Obra | Capas/mochilas: rigidez; el rig las mueve como bloque (pendiente de animación). |
| F8 | **Cresta gema** | Parte nueva `extra` · línea superior de segmentos | **Exclusivo Dragón** | Vector (recoloreable con la paleta) | Común | Gorros y pelo: picos uniformes. Variar tamaño por segmento. |

**Conjuntos**
- **Caballero de cuentos** (universal): Casco suave + Acolchado + Capa de páginas + Botas caballero.
- **Dragón real** (exclusivo Dragón): Alas de cuento + Cresta gema + Botas caballero + Corona (ya existe).

**Briefs de prompt**
- **F1 Casco suave:** `Create ONE isolated small rounded knight helmet for round-headed cartoon caterpillar Ciempi in reference 1. Padded lavender cloth dome sitting ON TOP of the round head, gold curved brow band, two short rounded cheek guards that end above the eyes, ONE single curved mint-green feather plume from a small gold holder, two gold rings where antennae pass. Open face: no visor, nothing over eyes or mouth. Soft fabric folds, thickness at the rim, contact shadow line where it meets the head. Navy #243e5b rounded outlines, 2D cartoon shading with light from upper left matching reference. No head, no face, no character, no ground shadow. Genuine transparent background, full object with margins.`
- **F2 Acolchado:** `Create a MATERIAL ATLAS arranged in EXACTLY 3 columns by 2 rows of equally sized square FULL-BLEED panels. Landscape 3:2. No gutters, no margins, no text. Every panel fills its square with material that wraps a convex rounded caterpillar body segment, shaded from upper left to lower right. Material: soft quilted storybook knight tunic, lavender and cream large diamond quilting that curves with the sphere, gold piping only on one edge. Upper row: lavender quilt with cream curved hem; cream quilt with lavender curved band; transition lavender/cream. Lower row: lavender quilt with gold curved seam; front cream panel with ONE small rounded gold shield clasp offset left; spare lavender. Puffy volume, few large stitches, navy illustrated seams, no photographic noise, no faces.`
- **F3 Capa de páginas:** `Create ONE isolated cape for cartoon caterpillar Ciempi, side view, made of three or four big overlapping cream storybook pages with rounded page corners and a few faint lavender lines suggesting text (no readable letters), joined at the top by a small gold open-book brooch at LEFT where it attaches at the neck. Pages fall diagonally backward with curved folds radiating from the brooch, slight paper thickness at edges and a weighted lower hem. Navy #243e5b outlines, warm upper-left light, 2D cartoon finish matching reference. No body, no character, no ground shadow. Genuine transparent background.`
- **F4 Botas caballero:** `ONE isolated children's short knight boot for Ciempi, toe pointing RIGHT, side view with slight top visibility matching reference sneakers. Soft violet felt shaft with a folded cuff and a dark oval opening at LEFT to receive a vertical leg, rounded gold toe cap, thin cream sole. Clearly a boot, distinct from a sneaker, rounded not rectangular. Navy outlines, upper-left light. No leg, no pair, no character, no ground shadow. Genuine transparent background with margins.`
- **F5 Antifaz grifo:** `Create ONE ORIGINAL children's griffin carnival half-mask for round-headed caterpillar Ciempi in reference 1. Soft golden-ochre felt with small cream feather tufts at the temples, a gentle rounded beak-shaped brow ridge over the nose bridge, two completely EMPTY transparent eye openings: viewer LEFT opening larger and LOWER, viewer RIGHT smaller and HIGHER, matching the reference asymmetry. Friendly, curious expression, not fierce. Mask ends above the mouth. Navy rounded outlines, upper-left light, 2D cartoon. No eyes painted, no body, no background. Genuine transparent background with transparent eye holes.`
- **F6 Mochila cofre:** `ONE isolated small rounded treasure-chest backpack for children, three-quarter side view, warm wood with lavender padded lid, gold rounded corners, a gold book-shaped clasp, clear side depth and lid thickness, thick curved padded strap on its RIGHT to wrap a round caterpillar segment, contact shading where it would touch. Navy outlines, upper-left light, 2D cartoon finish matching reference. No coins spilling, no character, no ground shadow. Genuine transparent background.`
- **F7 Alas de cuento:** `ONE isolated pair of small friendly dragon wings for a cartoon dragon-caterpillar, side view: near wing in front, far wing slightly behind and smaller. Rounded scalloped membrane in mint with lavender inner panels, soft gold finger ridges, a padded rounded root at LEFT where it attaches between neck and first body segment. Gentle folded rest pose, not spread for flight. Navy #243e5b outlines, upper-left light, 2D cartoon. No body, no character, no ground shadow. Genuine transparent background.`
- **F8 Cresta gema** (vector): dibujar en SVG sobre la base Dragón, sin IA: 5–7 placas redondeadas de altura variable por segmento, con faceta clara en el lado de la luz; color = acento de la paleta. Prompt de exploración, si hiciera falta: `Edit the first reference (dragon species base): add a row of rounded gem-like dorsal plates of varying size along the top of each body segment, mint with one gold facet each, navy outlines; preserve everything else exactly.`

### 2.2 Naturaleza · «El jardín de Ciempi»

**Concepto.** El lugar donde vive Ciempi: pétalos, hojas, hongos y lluvia. Es la colección de la Cuncuna y la que estrena el rediseño de mochilas.
**Paleta.** Musgo `#6f9a4a` · hoja `#8cc56a` · pétalo coral `#f08a7e` · ocre tierra `#d9a55a` · cielo `#8fd0e8`.

| # | Nombre (niño) | Categoría · anclaje | Compatibilidad | Constr. | Escalón | Riesgo de familia (§8) |
|---|---|---|---|---|---|---|
| N1 | **Gorro pétalo** | Gorros · sobre la cabeza; antenas entre pétalos | Universal | Raster | Común | Gorros: pétalos como casquete; solape y sombra de contacto claros. |
| N2 | **Jardín** | Estampados (traje) · superficie por segmento | Adaptable | Raster atlas | Obra | Trajes: el concepto muestra mucho ruido; a 84 px puede verse como manchas rojas y verdes. Bajar densidad y contraste. |
| N3 | **Mochila hoja** | Espalda (mochila) · segmento delantero | Adaptable | Raster | Especial | Mochilas: debe tener fuelle, asa-tallo y correa que rodee el segmento. |
| N4 | **Zuecos hongo** | Calzado · tobillo | Adaptable | Raster | Común | Calzado: revisar seis pies. **Evitar el hongo rojo con puntos blancos** (amanita, venenoso): usar sombrero café con motas crema. |
| N5 | **Bufanda musgo** | Bufandas · entre cabeza y primer segmento | Universal | Vector (nueva geometría; B01 queda congelada) | Especial | Bufandas: extremo corto que parece corbata. Caída visible a 240 px. |
| N6 | **Antifaz zorro** | Gorros y máscaras · medio antifaz con orejas | Universal | Raster | Especial | Máscaras: ojos sustitutos; mantener la boca libre. |
| N7 | **Mechones rocío** | Parte nueva `extra` · penachos sobre segmentos | **Exclusivo Cuncuna** | Vector | Común | Pelo: mechones como casquete; agrupar en masas, con gotitas grandes y pocas. |

**Conjuntos**
- **Jardinero** (universal): Gorro pétalo + Jardín + Mochila hoja + Zuecos hongo.
- **Cuncuna del bosque** (exclusivo Cuncuna): Mechones rocío + Bufanda musgo + Gorro pétalo + Capa de hojas (ya existe).

**Briefs de prompt**
- **N1 Gorro pétalo:** `Create ONE isolated petal hat for round-headed cartoon caterpillar Ciempi in reference 1: a soft cap of five or six large overlapping coral-pink flower petals that sits ON TOP of the round head and follows its curve, a small green stem and one leaf on top, gaps between petals where two antennae pass. Petals have thickness and curl at the tips, contact shadow at the rim. Navy #243e5b outlines, upper-left light, 2D cartoon. No head, no character, no ground shadow. Genuine transparent background.`
- **N2 Jardín:** `MATERIAL ATLAS, EXACTLY 3 columns by 2 rows of square FULL-BLEED panels, landscape 3:2, no gutters, no text. Material that wraps a convex rounded caterpillar segment, lit from upper left. Theme: a living garden suit of FEW LARGE overlapping leaves in moss and leaf green with a coral petal edge here and there. Upper row: large moss leaves with curved veins; leaf green overlapping leaves with one coral petal; transition. Lower row: sparse leaves on soft green; front panel with ONE larger coral flower offset left; spare leaf panel. Low density, big shapes readable at small size, navy seams, no noise, no faces.`
- **N3 Mochila hoja:** `ONE isolated children's leaf backpack, three-quarter side view: a plump pouch made of one big folded green leaf with visible central vein, the leaf stem curled into a top handle, a clear side gusset, one wide curved green strap on its RIGHT to wrap a round caterpillar segment. Soft volume, contact shading. Navy outlines, upper-left light, 2D cartoon finish matching reference. No character, no ground shadow. Genuine transparent background.`
- **N4 Zuecos hongo:** `ONE isolated children's mushroom clog for Ciempi, toe pointing RIGHT, side view with slight top visibility like reference sneakers. Cream-ochre rounded clog body like a mushroom stem, the toe covered by a small warm BROWN mushroom cap with a few large cream spots (not red, not a toxic-looking mushroom), clear dark oval ankle opening at LEFT for a vertical leg, thick soft sole. Navy outlines, upper-left light. No leg, no pair, no character, no ground shadow. Genuine transparent background.`
- **N5 Bufanda musgo:** construir en vector siguiendo la ficha de B01 (anclaje, dos extremos desiguales, nudo con volumen). Prompt de exploración: `Edit the first reference: add ONE chunky knitted moss-green scarf wrapped between head and first body segment, a visible knot with volume, a LONG main end falling over the first segment and a shorter second end, two wide leaf-green stripes, small rounded fringe. Preserve Ciempi exactly.`
- **N6 Antifaz zorro:** `Create ONE ORIGINAL children's fox carnival half-mask for round-headed caterpillar Ciempi in reference 1. Warm ochre-orange felt with cream cheek edges, two soft rounded pointed ears with cream inner ears rising from a moss-green headband, small dark rounded nose at the bridge. Two completely EMPTY transparent eye openings: viewer LEFT larger and LOWER, viewer RIGHT smaller and HIGHER. Mask ends above the mouth. Friendly expression. Navy outlines, upper-left light, 2D cartoon. No body, no background, genuine transparent background and transparent eye holes.`
- **N7 Mechones rocío** (vector): dibujar sobre la base Cuncuna aprobada en laboratorio; 2–3 penachos por segmento, agrupados, con una gota de rocío turquesa grande y brillante por penacho. Sin IA salvo exploración inicial.

### 2.3 Espacio · «Viaje a las estrellas»

**Concepto.** Ciempi astronauta, cálido y acolchado, nada militar. Reaprovecha el fondo Espacio (25), que hoy no tiene piezas propias.
**Paleta.** Medianoche `#1f3557` · plata cálida `#d9dde3` · naranja cohete `#ff8a3d` · turquesa luz `#45d3d0`.

| # | Nombre (niño) | Categoría · anclaje | Compatibilidad | Constr. | Escalón | Riesgo de familia (§8) |
|---|---|---|---|---|---|---|
| E1 | **Casco burbuja** | Gorros · domo sobre la cabeza; antenas por dos aros | Universal | Raster con transparencia parcial | Especial | Gorros + lentes: el antiguo casco Astronauta dominaba la cabeza; el vidrio no debe impedir leer la mirada (guía §6). |
| E2 | **Traje astral** | Estampados (traje) · superficie por segmento | Adaptable | Raster atlas | Obra | Trajes: emblemas pegados. Costuras luminosas que siguen el volumen. |
| E3 | **Mochila cohete** | Espalda (mochila) · segmento delantero | Adaptable | Raster | Especial | Mochilas: el propulsor B09 se veía pegado; correas visibles y volumen lateral. |
| E4 | **Botas lunares** | Calzado · tobillo | Adaptable | Raster | Común | Calzado: las botas lunares del prototipo eran bloques; puntera redonda y caña articulada. |
| E5 | **Capa cometa** | Espalda (capa) · broche en el cuello | Adaptable; excluyente con alas/mochila | Raster | Obra | Capas: plantilla triangular. La silueta de cola de cometa la distingue de la capa de héroe. |
| E6 | **Antenas luz** | Detalles · puntas de las antenas | Universal | Vector | Básico | Sin familia en §8; riesgo de animación: efectos de posición fija (pendiente en AD-016). |
| E7 | **Lentes planeta** | Lentes · puente y laterales del rostro | Universal | Vector (como B04) | Común | Lentes: cristal opaco que borra la mirada. Deben ser transparentes. |
| E8 | **Cola cometa** | Parte nueva `extra` · punta de la cola | **Exclusivo Dragón** | Vector | Básico | Sin familia; probar con el segmento cola único de la especie. |

**Conjuntos**
- **Astronauta** (universal): Casco burbuja + Traje astral + Mochila cohete + Botas lunares.
- **Cometa** (universal): Capa cometa + Antenas luz + Lentes planeta + paleta Noche (gratis, sin cobrar).

No propongo un exclusivo de Cuncuna en Espacio: forzarlo inflaría el catálogo sin una idea clara [I].

**Briefs de prompt**
- **E1 Casco burbuja:** `Create ONE isolated light bubble helmet for round-headed cartoon caterpillar Ciempi in reference 1: a thin clear glass dome that fits over the round head, with a soft padded warm-silver rim around the BACK and BOTTOM of the head only, two small sealed silver rings on top where antennae pass through. The glass is mostly transparent with ONE curved highlight at upper left and a faint turquoise edge; nothing on the glass covers the eyes. Navy #243e5b outline on the rim, thin outline on the glass. No head, no face, no character. Genuine transparent background, glass rendered semi-transparent.`
- **E2 Traje astral:** `MATERIAL ATLAS, EXACTLY 3 columns by 2 rows of square FULL-BLEED panels, landscape 3:2, no gutters, no text. Material wrapping a convex rounded caterpillar segment, lit from upper left. Soft astronaut suit: white and warm silver padded fabric on top, midnight-blue lower panel, ONE thin glowing turquoise seam curving along the boundary. Upper row: white padded fabric with silver curved seam; midnight panel with turquoise glow line; transition. Lower row: white with two soft vent marks; front panel with ONE small round turquoise light offset left; spare midnight. Large shapes, no logos, no letters, no faces.`
- **E3 Mochila cohete:** `ONE isolated children's rocket backpack, three-quarter side view: rounded orange and warm-silver rocket body lying horizontally, two small rounded fins, a round turquoise window, a soft turquoise glow at the nozzle (no flames), clear side volume, two padded curved straps on its RIGHT to wrap a round caterpillar segment. Navy outlines, upper-left light, 2D cartoon finish matching reference. No character, no ground shadow. Genuine transparent background.`
- **E4 Botas lunares:** `ONE isolated children's moon boot for Ciempi, toe pointing RIGHT, side view with slight top visibility like reference sneakers. White puffy padded upper with one midnight-blue rounded toe cap, a soft padded cuff with a dark oval ankle opening at LEFT, thick soft treaded sole, one small turquoise light strip. Rounded and plump, NOT a rectangular block. Navy outlines, upper-left light. No leg, no pair, no character, no ground shadow. Genuine transparent background.`
- **E5 Capa cometa:** `ONE isolated cape for cartoon caterpillar Ciempi, side view: midnight-blue soft fabric attached at LEFT with a small round orange star brooch at the neck, falling backward and widening into a flowing comet tail shape with three rounded tail lobes, a warm orange-to-cream inner lining visible at the edge, a few large soft stars. Folds radiate from the brooch, the lower edge has weight. Navy outlines, upper-left light, 2D cartoon. No body, no character, no ground shadow. Genuine transparent background.`
- **E6 Antenas luz** (vector): sustituir el relleno de las bolitas de antena por un degradado turquesa y un halo suave; sin tocar la geometría de las antenas.
- **E7 Lentes planeta** (vector, B04): montura redonda transparente con un aro inclinado tipo planeta en cada cristal; mirada visible dentro del cristal (guía §8, lentes transparentes).
- **E8 Cola cometa** (vector): una estrella redondeada y tres cintas cortas en la punta del segmento cola de la especie Dragón.

### 2.4 Resumen y control de inflación

- **23 productos nuevos** (8 + 7 + 8), de los cuales 5 son exclusivos de especie y 3 son mochilas condicionadas al rediseño.
- Ninguno es un recolor presentado como pieza nueva. Si más adelante se quiere otro color de una pieza, se añade como **variante** dentro del mismo derecho (como la capa de héroe).
- Huecos que se cubren: espalda +6 (2 capas, 3 mochilas, alas), pies +3, cuello +1, detalle +1, superficies +3.
- **Coste total (cálculo original, con el escalón medio):** las 23 suman ≈ 480 monedas y el catálogo pasaría de ≈ 1 360 a ≈ 1 840, unas 2,6 veces lo que dan los 40 cuentos con las reglas 2.4.1. Superaba el techo de 2,4× del plan (§5).
- **Resuelto por la economía v3 (aprobado como referencia, precios provisionales):** con el modelo E2 se lanza en **dos olas** y la regla de salud pasa a medirse en **sesiones de un niño de nivel 0**, no en «veces lo que dan los cuentos» (§4.8). Ola 1: 16 piezas universales o adaptables, **360** monedas, ~23–25 sesiones de 15 min de P0. Ola 2: Dragón + 4 exclusivos + 3 mochilas (estas, solo tras su rediseño), **224** monedas, ~13–15 sesiones. Catálogo actual + todo v3 ≈ **1 934** monedas ≈ 143 sesiones de P0 releyendo, dentro de la regla de salud de ≤ ~150 sesiones [I, simulado en ECONOMIA-V3 §9].

---

## 3. Láminas de concepto (IA)

**Son conceptos de dirección, no recursos del juego.** Muestran paleta, ambiente y cómo podrían verse 4 productos sobre Ciempi. No son piezas recortables, no tienen anclajes medidos y no sustituyen el proceso por pieza de la guía §11–§12.

- Herramienta: Codex CLI 0.166 con `image_gen`, con la referencia aprobada `ciempi-ilustracion-v2-presentacion.png` como primera imagen. **5 imágenes generadas** de 6 posibles: 3 colecciones y 1 repetición de Fantasía, en la que Codex generó dos imágenes internamente y guardó la segunda.
- Archivos: [conceptos/](conceptos/): PNG 1536×1024 originales, vistas JPG de 1024 px para la página, los `*-prompt.txt` y [generaciones.json](conceptos/generaciones.json) con la ruta de cada original en `~/.codex/generated_images`. Copia de la referencia en `conceptos/referencias/`.

### Revisión honesta de cada lámina

**Fantasía v1** ([PNG](conceptos/fantasia-concepto.png)). *Problemas importantes:* los segmentos se fundieron en un tubo acolchado con anillos dorados y asoman casquetes naranjas, así que se pierde la silueta de esferas superpuestas (rasgo obligatorio, guía §2). La capa de páginas se convirtió en una falda ondulada bajo el cuerpo, sin leerse como papel. El penacho parece un remolino de crema. *Funciona:* rostro conservado, casco que no tapa los ojos y antenas por aros; las botas violetas con puntera dorada se leen muy bien y se ven unidas al tobillo. **Descartada como dirección; útil para botas y casco.**

**Fantasía v2** ([PNG](conceptos/fantasia-v2-concepto.png)), repetida con el pedido explícito de mantener las esferas separadas. *Mejora:* el casco tiene carrilleras que se detienen sobre los ojos y una pluma menta que se lee como penacho; es el mejor casco de las dos versiones. Las botas siguen siendo muy buenas. *Problemas que persisten:* **Codex volvió a fundir los segmentos en un tubo** con aros dorados, a pesar de la instrucción. El rombo lavanda y crema recuerda a un arlequín o bufón más que a un caballero. La «capa de páginas» quedó como dos hojas sueltas pegadas al costado: no es una capa. **Conclusión:** pedir un traje y una capa sobre el personaje completo no funciona con esta herramienta. Esas dos piezas hay que producirlas como en B09–B12: un atlas de superficie 3×2 aplicado por el compositor y una capa aislada con anclaje medido. No gasté más generaciones: otra repetición no iba a cambiar el problema de fondo.

**Naturaleza** ([PNG](conceptos/naturaleza-concepto.png)). *Funciona:* el gorro de pétalos es la mejor pieza de las tres láminas: se apoya en la cabeza, las antenas salen entre pétalos y no tapa la cara. Los zuecos hongo se reconocen al instante. La mochila hoja tiene asa-tallo y una correa que rodea el segmento. *Problemas:* el traje de hojas y pétalos es muy denso; a tamaño de pista (84 px) será ruido rojo y verde. La mochila queda pequeña y casi tapada por la cabeza. Los hongos son rojos con puntos (amanita): cambiar a café. **Buena dirección con ajustes.**

**Espacio** ([PNG](conceptos/espacio-concepto.png)). *Funciona:* casco burbuja fino que deja ver la cara, antenas por aros sellados; traje blanco y medianoche con costura turquesa que sigue el volumen; botas lunares redondeadas, nada rectangulares. Es la lámina más coherente con Ciempi. *Problemas:* la mochila cohete descansa **encima** del segmento delantero, como un juguete apoyado, y no colgada al costado; el brillo de la tobera parece un efecto suelto. El reflejo del vidrio tiñe un poco la cabeza. Codex advirtió pequeñas variaciones de rostro y sombreado. **Buena dirección.**

En las tres láminas, el rostro y las antenas se mantienen cerca de la referencia, pero **no son idénticos**: el contorno es más fino y los ojos son algo más simétricos. Por eso estas láminas no pueden servir de base.

### 3.1 Rúbrica orientativa (guía §12), sobre las láminas completas a 1536 px

Son notas de **concepto**, no de pieza terminada. No se revisaron a 240/320 px ni en el juego.

| Dimensión | Fantasía v1 | Fantasía v2 | Naturaleza | Espacio |
|---|---|---|---|---|
| Coherencia con Ciempi | 2: los segmentos se fundieron en un tubo | 2: otra vez un tubo con aros, pese a la instrucción | 4: cara y silueta conservadas; contorno algo más fino | 4: igual; el reflejo del casco tiñe la cabeza |
| Calidad de ilustración | 3: acolchado bien hecho; la capa no se entiende | 3: casco y pluma bien construidos; el rombo es plano | 3: pétalos con volumen; el traje es plano y repetitivo | 4: materiales diferenciados (vidrio, tela, goma) |
| Integración con el cuerpo | 2: la capa como falda; el penacho flota | 2: las hojas pegadas al costado no cuelgan del broche | 3: la mochila con correa convence; queda tapada | 3: las botas bien; la mochila cohete apoyada encima |
| Legibilidad | 3: botas y casco sí; la capa no | 3: casco y botas sí; la capa no; se lee como arlequín | 3: gorro y zuecos sí; el traje es ruido | 4: las cuatro piezas se reconocen |
| Originalidad | 3 | 3: el broche-libro es una buena idea poco visible | 4: zuecos hongo y mochila hoja propios | 3: tema habitual, bien adaptado |

**Lo que se puede tomar como dirección** [P, requiere tu visto bueno]: el casco v2, las botas caballero, el gorro pétalo, los zuecos hongo (en café), el casco burbuja, el traje astral y las botas lunares. **Lo que no:** los trajes de Fantasía y Naturaleza tal como salieron, ambas capas de páginas y la posición de la mochila cohete.

---

## 4. Sistema de transformaciones en la tienda

### 4.1 Estructura de la tienda

Hoy hay cuatro secciones: Cabeza · Cuerpo · Su mundo · Conjuntos [V]. Propuesta:

| Sección | Contenido | Cambio |
|---|---|---|
| **Personajes** (nueva, primera) | Ciempi, Cuncuna, Dragón; bundles de especie; exclusivos de la especie elegida | Nueva |
| Cabeza · Cuerpo · Su mundo | Igual que hoy, filtradas por la especie que se está probando | Filtro de compatibilidad |
| Conjuntos | Conjuntos y looks; los de especie aparecen solo con esa especie | Renombrar Dragón→Draco y Robot→Lumen |
| **Colecciones** (filtro, no sección) | Chips «Fantasía · Naturaleza · Espacio» sobre la grilla | Nuevo filtro |
| **Gratis** (nueva) | Todo lo de precio 0: gestos, colores base, jockey, zapatillas, Cuncuna (si ya la ganó), fondos y comida gratis | Nueva |
| **Favoritos** (nueva) | Lo que el niño marcó con ♥; sin contadores ni avisos | Nueva |

### 4.2 Vista previa: probar nunca escribe

- Tocar una especie o una pieza solo cambia el estado local `probando` (como hoy) [V].
- **Probar una especie no guarda nada**, aunque ya sea suya. Para cambiar de personaje, hay que pulsar «Ser Cuncuna». Esto evita que un toque accidental cambie el personaje que el niño ve en la lectura.
- La regla actual «si ya es suyo, se pone de inmediato» (`elegir()`) se mantiene para las piezas, **pero no para las especies**.
- «↺ Volver a lo mío» deshace también la especie.
- El servidor no recibe nada hasta que se compra o se elige expresamente.

### 4.3 Reglas de compatibilidad

| Tipo | Qué pasa al probar o vestir otra especie | Qué ve el niño |
|---|---|---|
| **Universal** | Se dibuja igual (la cabeza y el cuello no cambian entre especies) | Nada especial |
| **Adaptable** | Se usa el recurso de esa especie (`recurso[especie]`) o el ajuste de anclas | Nada especial; si una especie aún no tiene el recurso, se trata como «no aplica» |
| **Exclusivo** | Solo aparece en la tienda y en el personaje de su especie | Insignia «Solo Dragón» con el icono de la especie |
| **No aplica** | La pieza queda **en el inventario y equipada en la apariencia guardada**, pero no se dibuja | Aviso visible (ver §4.5); la tarjeta muestra «Guardado para Ciempi» |

**Reglas firmes**
1. **Nunca se quita nada del inventario** por cambiar de especie.
2. La apariencia guarda la selección **por especie**: `ciempi.especies[especie] = {...partes}`. Al volver a Ciempi, vuelve con su ropa. Esto evita que un niño pierda su look armado.
3. Si el niño prueba una pieza que no aplica a la especie actual, la tarjeta sigue visible con el aviso; **no se vende algo que no puede ver puesto**. El botón de comprar dice «Comprar para Ciempi» y explica para quién es.
4. El resolvedor `compatibilidad.ts` es puro y lo comparten la vista previa, el guardado y el servidor (propiedad del equipo de transformaciones). La tienda solo consume su resultado: `{visible, oculto: [{id, motivo}]}`.

### 4.4 Wireframe: sección Personajes (vertical)

```
┌─────────────────────────────────────────────┐
│ ←  Mi Ciempi                       🪙 124   │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │      [ personaje grande probando ]      │ │
│ │  ↺ Volver a lo mío                      │ │
│ └─────────────────────────────────────────┘ │
│ [👤 Personajes][🎩 Cabeza][🐛 Cuerpo][🏞️][🦸] │
│ [♥ Favoritos] [🎁 Gratis]                   │
│                                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│ │ (Ciempi) │ │(Cuncuna) │ │ (Dragón) │      │
│ │  Ciempi  │ │ Cuncuna  │ │  Dragón  │      │
│ │ ✓ Eres tú│ │ 🎁 Regalo│ │ 🪙 ??    │      │
│ │          │ │ de lectura│ │          │      │
│ └──────────┘ └──────────┘ └──────────┘      │
│                                             │
│ Cuncuna: «Llega cuando termines tus         │
│ primeros cuentos.» (sin cuenta regresiva)   │
│                                             │
│ ── Solo para Dragón ─────────────────────── │
│ [Alas de cuento 🪙?] [Cresta gema 🪙?]       │
│ [Conjunto Dragón real · ahorras ?]          │
├─────────────────────────────────────────────┤
│ Te estás probando: Dragón                   │
│ [ Comprar Dragón · 🪙 ? ]   [↺ Volver]      │
└─────────────────────────────────────────────┘
```

Notas:
- Los «?» se reemplazan por los precios provisionales E2 de §4.8 (Dragón 80; Alas de cuento 30; Cresta gema 16; «Dragón real» 107).
- La tarjeta de Cuncuna sin ganar se puede **probar** (vista previa) y explica cómo se consigue con una frase fija. No muestra porcentaje ni cuenta regresiva [I].
- **Se quita «Te faltan X 🪙: ¡sigue leyendo!»**, que hoy aparece en la barra de compra (`PantallaCiempi.tsx`) [V]. Si no alcanza, el botón queda desactivado y dice «Guárdalo en ♥ favoritos». Sin cifras de lo que falta.
- **Se quita el sonido al comprar** (`sonarCelebracion()` tras comprar [V]). La celebración es la animación A09 «Estrenar ropa», que ya existe y respeta el modo tranquilo.

### 4.5 Wireframe: aviso de compatibilidad

```
┌─────────────────────────────────────────────┐
│ ℹ️  El Dragón no usa:                        │
│     • Capa de héroe  (usa sus alas)         │
│     • Mochila cohete                        │
│   Siguen siendo tuyas. Vuelven a aparecer   │
│   cuando seas Ciempi.        [Entendido]    │
└─────────────────────────────────────────────┘
```

- Aparece **una vez por combinación** al probar la especie, encima de la grilla. No es modal, no bloquea y no tiene temporizador.
- Lenguaje en positivo («siguen siendo tuyas»); los nombres son los de las tarjetas; texto de 2.º–3.º básico.
- En la grilla, la tarjeta de una pieza que no aplica se ve atenuada con el texto «Para Ciempi» y el icono de la especie. **Nunca** desaparece del inventario.

Hay una versión HTML de ambos bocetos en [index.html](index.html#wireframes).

### 4.6 Cuncuna: recompensa gratuita de lectura

**Aprobado por el usuario (3-nov-2026):** la Cuncuna se desbloquea con **6 de los 8 cuentos originales de nivel 0**, con una condición equivalente para quien empieza en otros niveles y una alternativa para lectores lentos que reconozca progreso educativo y no solo tiempo. Se conserva el progreso y hay una celebración especial. Detalle y simulación: `ECONOMIA-V3.md` §10 [U; cifras I].

Se otorga `especie:cuncuna` de forma **idempotente y retroactiva** en cuanto se cumple **cualquiera** de estas condiciones:

1. **Completar el nivel 0:** 6 de los 8 cuentos de nivel 0 de la biblioteca de Ciempi terminados. Si un adulto quitó cuentos de la biblioteca (`server/src/cuentos.ts`) [V] o se retiran los cuentos 21–24 (ver la revisión de personajes), basta con terminar **todos los que tenga, con un mínimo de 4**.
2. **Quien empieza en nivel 1 o superior:** **6 cuentos distintos de la biblioteca de Ciempi, de cualquier nivel**, terminados. Todos los perfiles tienen los 40 cuentos, así que la regla es una sola: quien parte en N0 la cumple completando su nivel, y quien parte en N1+ no tiene que leer cuentos de sílabas, que le resultarían infantilizantes. *(Sustituye a los «4 cuentos de cualquier nivel» de la versión anterior: 4 se logran en 1–2 sesiones.)*
3. **Lector lento (progreso + tiempo, nunca solo tiempo):** **60 min de lectura activa en cuentos de nivel 0 y 30 frases distintas de nivel 0 leídas.** Existe porque un lector muy lento (~20 min por cuento) con sesiones de 15 min nunca termina un cuento mientras el cuento se reinicie en cada sesión, y con la condición 1 no recibiría nunca la Cuncuna.
4. **Regalo del adulto** desde su panel (terapia, dificultades de lectura u otros casos), registrado con motivo.

**«Terminado» verificable:**
- Se usa el **registro de premios del servidor** (`pagado_hasta` = total de unidades, acotado por el reloj del servidor), **no** `completada_en`, que hoy fija la app sin verificar [V, ECONOMIA-V3 §2.2].
- Solo cuentan los cuentos con `textos.origen = 'ciempi'`; nunca los textos propios del niño ni los que sube el adulto, para que no se pueda «fabricar» el logro.
- Cuentan cuentos distintos; las relecturas no suman cuentos nuevos. No cuentan las monedas ni la velocidad.
- **Se calcula en el servidor**; el cliente no puede otorgarla.

**Esfuerzo estimado** (sesiones de 15 min; mediana y p10–p90) [I, ECONOMIA-V3 §10.2]: P0, 6 sesiones (4–10) por la condición 1; P1–P4, 2–3 sesiones por la condición 2; lector muy lento, 11 sesiones (9–11) por la condición 3, 4 con sesiones de 25 min y 7 con un marcapáginas en N0 (pendiente de decisión). La sensibilidad de ECONOMIA-V3 §18 muestra que con lectores un 30 % más lentos la condición 3 sube a 15 sesiones (p90 18) y con sesiones de 10 min a 21 (p90 37) [I].

**Niños que ya cumplían la condición antes del despliegue:** se otorga en la migración, calculada con el registro de premios (en las asignaciones migradas, `pagado_hasta` parte de `leido_hasta`). Se anuncia la primera vez que abran la tienda.

**Anuncio después, no antes** (plan §6.7, Marinak y Gambrell): no hay barra de progreso hacia la Cuncuna. La tarjeta dice solo «Llega cuando termines tus primeros cuentos». Al ganarla hay una **celebración especial**: la pantalla de fin de libro muestra a Ciempi con la Cuncuna al lado y el texto «¡Tienes una amiga nueva: la Cuncuna!».

### 4.7 Dragón comprable, bundles, favoritos y recompensas especiales

- **Dragón:** se compra como un ítem `especie:dragon` con la transacción actual (unique perfil+item, `for update`) [V]. Probarlo es gratis e ilimitado.
- **Bundle de especie:** «Dragón real» = especie + exclusivos (+ piezas universales de la colección), con la misma regla de 20 % sobre lo que falta (`precioDe`) [V]. **Nunca** se pone la especie solo dentro de un bundle: siempre se puede comprar suelta.
- **Favoritos:** un ♥ en cada tarjeta. Se guarda en `perfiles_ninos.ciempi.favoritos: string[]` (JSONB, máximo 50 ids, decisión D10). No hay notificaciones, no aparece «¡ya te alcanza!» y no tiene contador en la cabecera.
- **Recompensas especiales por lectura (anunciadas después):** por ejemplo, al terminar los 8 cuentos de un nivel se regala una pieza de colección (Antenas luz, Gorro pétalo). Se entregan con un mensaje en la pantalla final. No se anuncian en la tienda, no tienen calendario y no caducan (decisión D11).
- **Sin patrones oscuros** (Google Play Familias, ICO estándar 13): sin temporizadores, ofertas por tiempo, rarezas, cajas sorpresa, «te faltan X», sonidos de caja registradora, rachas ni avisos para volver.

### 4.8 Precios provisionales E2 (aprobados como referencia, no aplicados)

El usuario aprobó el modelo E2 como referencia **con precios provisionales en dos olas**. Se calcularon con las sesiones de 15 min que necesita un niño de nivel 0 (mediana y p90, y el lector muy lento) [U; cifras I, `ECONOMIA-V3.md` §9]. **No se aplicaron**: el catálogo y los precios reales del juego no cambian hasta que se apruebe llevarlos a producción.

| Producto | Escalón | Precio provisional E2 | Sesiones de P0 (mediana / p90) · muy lento |
|---|---|---:|---|
| Cuncuna | Recompensa | **0** (no se vende; §4.6) | — |
| Dragón (especie) | Especie | **80** | 4 / 5 · 5 (p90 6) |
| Bundle «Dragón real» (Dragón + Alas + Cresta + Cola) | Pack | 134 − 20 % = **107** | — |
| Básico (Antenas luz, Cola cometa) | Básico | **10** | 1 / 1 · 1 |
| Común (Botas caballero, Gorro pétalo, Zuecos hongo, Botas lunares, Lentes planeta, Cresta gema, Mechones rocío) | Común | **16** | 1 / 1 · 1–2 |
| Especial (Casco suave, Antifaz grifo, Antifaz zorro, Casco burbuja, Bufanda musgo; mochilas) | Especial | **24** | 2 / 2 · 2 |
| Obra (Acolchado, Jardín, Traje astral, Capa de páginas, Capa cometa, Alas de cuento) | Obra | **30** | 2 / 2 · 2–3 |
| Conjuntos de colección | Pack | 20 % menos sobre lo que falta (`precioDe`): **~60–85** | 3–5 / ≤ 7 |
| Catálogo actual | — | **Sin cambios** | Ya cumple los criterios con E2 |

- **Dos olas:** ola 1 = 16 piezas universales o adaptables, **360**; ola 2 = Dragón + 4 exclusivos + 3 mochilas (estas, solo tras su rediseño, §4.9), **224** (§2.4).
- **Regla de salud (sustituye a la anterior):** el catálogo completo ≤ ~150 sesiones de P0 releyendo (con todo v3 da ~143) [I]. La regla «≤ 2,4× los ingresos de la primera lectura» medía las reglas 2.4.1 y deja de aplicarse con E2.
- Estos precios suponen E2. Si E2 no llegara a producción, habría que recalcularlos: con 2.4.1, P0 releyendo **nunca** junta 80 monedas para el Dragón [I].

### 4.9 Mochilas: condición para reintroducirlas

Las mochilas se retiraron porque «se ven pegadas encima del cuerpo (sin correas ni volumen)» (`generar-tienda-ciempi.mjs`) [V]. Las tres mochilas nuevas (Cofre, Hoja, Cohete) solo entran si:
1. Pasan la ficha de la guía §8 (fuelle, asa con grosor, correa adaptada y sombra de contacto) a 84, 240 y 320 px.
2. Pasan la revisión de animación de capas y mochilas rígidas (pendiente de AD-016).
3. El usuario aprueba el rediseño (AD nuevo).

Quien recibió la devolución en 2.2 no tiene derecho automático a las mochilas nuevas: son productos distintos con ids nuevos.

---

## 5. Plan de integración por pasos (resumen)

Corresponde a la **Fase E** del [plan maestro §16](../PLAN-MAESTRO-EXPANSION.md). Depende de la Fase 0 (economía), de la C (especies en laboratorio) y de la D (validación).

| Paso | Qué | Detalle | Pruebas |
|---|---|---|---|
| 1. Datos | Apariencia con especie | `perfiles_ninos.ciempi` (JSONB) recibe `especie` (por defecto `especie:ciempi`), `especies: {id: partes}` y `favoritos: []`. `normalizarApariencia` rellena los valores por defecto: **sin migración destructiva**; una apariencia antigua sigue siendo válida. | Vitest de `normalizarApariencia` con apariencias de 2.0–2.4 |
| 2. Catálogo | Campos nuevos en el generador | `compat: 'universal'\|'adaptable'\|'exclusivo'`, `especie?`, `colecciones: string[]` en `generar-tienda-ciempi.mjs`; categoría `especie`; parte `extra`. Renombres visibles (Draco, Lumen, Constelación) **sin cambiar ids**. | Test: ningún id existente cambia; precios antiguos iguales |
| 3. Servidor | Compra y regalo | `especie:*` se compra con la transacción actual. Regalo de Cuncuna idempotente al completar (SQL `0xx_especies.sql`, solo `alter ... add` y un `update` de otorgamiento retroactivo). Guardar apariencia valida la posesión de la especie. | `npm run test:servidor` en `ciempi_test`: compra doble, regalo doble, niño nivel 1+, adulto que regala |
| 4. Compatibilidad | Consumir `compatibilidad.ts` | Vista previa, miniaturas y guardado usan el resolvedor. | Matriz especie × categoría; «lo comprado nunca se pierde» |
| 5. UI | Personajes, Gratis, Favoritos, filtros | Según §4.1–§4.5; quitar «Te faltan X» y el sonido de compra. | Pruebas de componente; Playwright solo en desarrollo; revisión `web-design-guidelines` |
| 6. Arte | Colecciones | Pieza por pieza con la guía §11–§12 y aprobación AD. Las láminas de concepto **no** se usan como recursos. | Fichas REVISION.md por pieza |
| 7. Despliegue | Servidor → web → APK | Servidor primero: la APK vieja ignora `especie` (cae en Ciempi por `normalizarApariencia`). | APK vieja y nueva contra el servidor nuevo |

**Orden de despliegue:** primero las migraciones (aditivas) y el servidor; después la web; al final la APK. Las especies y las colecciones se pueden activar con un indicador del catálogo, sin publicar una APK nueva para cada pieza [I].

---

## 6. Pendiente de aprobación del usuario

1. Estructura de tienda con «Personajes», «Gratis» y «Favoritos» (§4.1).
2. ~~Definición de «completar el nivel 0» y la alternativa para niveles 1+~~ **Aprobado** (6 de 8 cuentos de N0 con alternativas, §4.6). Falta implementarlo en el servidor (migración 013 de la rama de seguridad).
3. Lista de 23 productos y 6 conjuntos **en dos olas** (aprobadas como referencia con la economía v3, §2.4); falta aprobar el contenido de cada ola.
4. Partes nuevas `extra` (cresta, mechones, cola) y alas en Espalda (§2).
5. Quitar «Te faltan X» y el sonido de compra de la tienda actual (§4.4). Es un cambio de UX pequeño, pero toca la pantalla actual.
6. Renombres visibles: Dragón→Draco, Robot→Lumen y Estrellas (estampado)→Constelación (§1.2).
7. Rediseño de mochilas como condición previa (§4.9).
8. Precios: **provisionales E2 aprobados como referencia** (§4.8). Pasarlos a producción requiere aprobación aparte, junto con E2.
9. Dirección visual de cada colección según las láminas (§3). Ninguna está aprobada.

## Límites

- Las láminas son **conceptos IA** inspeccionados a tamaño completo; no se probaron en el juego ni a 84/240/320 px.
- Las notas de rúbrica son orientativas, de un revisor adulto, y no reflejan la preferencia infantil.
- Las cifras de esfuerzo por precio son simulaciones con supuestos (ECONOMIA-V3 §15), no datos de niños.
- No se ejecutó código, no se tocaron el catálogo, los precios ni el servidor, y no se hicieron pruebas con niños.
