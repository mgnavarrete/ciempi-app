# Revisión: T04 · Ciempi Camaleón · v1 (exploración → prototipo de laboratorio)

Fecha: 2026-11-03 · Guía: `CIEMPI_ART_DIRECTION.md` v1.7 · Rama `expansion-v4-criaturas`. Revisión **del agente**, no aprobación. **Pendiente de aprobación artística del usuario.** No integrado al juego.

- **Objetivo y alcance:** explorar el Camaleón con IA (3–4 propuestas: colores atractivos, ojos en torreta, cola enroscada, patas prensiles), elegir una y llevarla al menos a un prototipo modular (`especie=camaleon`), con el gancho de cambiar la paleta según el conjunto.
- **Estado real:** se alcanzó un **prototipo completo**: todas las piezas son IA (segmentos A–D, frente, cola, pierna, pie, piel de cabeza, casco y torretas), con N de 0 a 40, B03, accesorios, E08 y animaciones. Es menos maduro que la Serpiente: ver «Problemas».
- **Necesidad nueva:** no hay «antes». La comparación es con la base y la familia en [comparación](evidencia/comparacion-claro.png).

## Proceso de IA (Codex CLI 0.166 `exec` + `image_gen`, `generar-ia.mjs`)

| Paso | Archivos |
|---|---|
| 4 propuestas (`prompts-v4/crear_conceptos.py`) | `ia/concepto-k1-arcoiris`, `k2-tropical`, `k3-atardecer`, `k4-pastel`. [Lámina](conceptos/lamina-conceptos.png), [siluetas 84 px](conceptos/siluetas-84px.png) |
| Piezas sobre k1 (`prompts-v4/crear_piezas.py`) | `ia/pieza-camaleon-segmentos`, `-cola`, `-pata`, `-cabeza`, `-torretas` |
| Procesado (`v4/procesar-piezas-v4.py`) | `recursos/camaleon/` (12 piezas WebP, 224 KB, `manifiesto.json`), [anclajes](piezas/anclajes-piezas.png) |

**Elección (provisional, del agente): k1 «arcoíris».**
1. *Gancho de color:* es la única propuesta que ya es multicolor (degradado turquesa→lima con lunares rosa y amarillo); el camuflaje se entiende como «cambia de colores» y no como un simple recolor.
2. *Torretas legibles:* los anillos rosa sobre lima se leen a 240 px. En k2 la torreta derecha sale del círculo de la cabeza (rompe el círculo protegido), y en k4 las torretas pastel se pierden.
3. *Silueta a 84 px:* cola en espiral alta y casco: inconfundible frente a Ciempi, Dragón y Cuncuna ([siluetas](evidencia/comparacion-claro.png)).
4. *Distancia con la familia:* k3 (coral-magenta) choca con la Serpiente s2 elegida; k2 (verde) se acerca al Dragón.

## Decisiones de diseño

- **`FORMA_CAMALEON`:** misma disposición que Dragón y Cuncuna (y = 402, separación 92, cola 104), `margenCola` 215 para la espiral, `pieDeRol` propio por rol (D usa la pata de A).
- **Torretas:** dos párpados IA con un hueco. Cada uno se centra en su ojo B03 (708,342 / 808,320) **detrás** de `#eyes`. Se escala por el radio exterior (54 y 46 u), así el ojo tapa el hueco y los anillos interiores. Funcionan con las 14 expresiones porque el rig solo cambia `#eyes`, cejas y boca.
- **Casco:** la parte de la imagen IA que sale del disco va detrás de la cabeza (`data-rasgo="casco"`) y se guarda bajo cualquier gorro, máscara o peinado. Las torretas se guardan solo bajo las máscaras completas.
- **Patas prensiles:** pie IA con dos bultos de dedos. El calzado B10 lo reemplaza como en Ciempi (adaptable).
- **Camuflaje (gancho):** si la paleta es Clásico, el cuerpo, la cabeza, la cola y las patas toman colores según lo puesto. El orden es: conjunto B12 reconocido (Robot Lumen, Draco del bosque, Ratón Atlas, AraLuz) y después la superficie B11 (robot, draco, pirata, mago, araluz). Una paleta elegida a mano siempre manda. Implementado en `clavePaleta` y `CAMUFLAJE` de `criaturas-v4.js`. Lo que cambia es el color de la base de la especie; no cambia el inventario ni la economía.

## Evidencia inspeccionada (Read de cada PNG por el agente)

[crecimiento](evidencia/crecimiento-claro.png) / [oscuro](evidencia/crecimiento-oscuro.png) (N = 0, 1, 2, 5, 12, 40; 84 y 320 px) · [expresiones](evidencia/expresiones-claro.png) / [oscuro](evidencia/expresiones-oscuro.png) · [accesorios](evidencia/accesorios-claro.png) / [oscuro](evidencia/accesorios-oscuro.png) · [detalle](evidencia/detalle-claro.png) · [conjuntos](evidencia/conjuntos-claro.png) · [camuflaje](evidencia/camuflaje-claro.png) / [oscuro](evidencia/camuflaje-oscuro.png) · [E08](evidencia/comer-claro.png) · [animación](evidencia/animacion-claro.png) · [comparación](evidencia/comparacion-claro.png) / [oscuro](evidencia/comparacion-oscuro.png) · fusión `escenaCreciente`/`crecer`: [`../T03-serpiente-v1/fusion/fusion.json`](../T03-serpiente-v1/fusion/fusion.json).

**Pendientes:** expresiones con cada lente (las torretas más los lentes redondos se ven recargados), los 5 colores de camuflaje en todos los conjuntos, Android real, Firefox y Safari.

## Criterios obligatorios

| Criterio | Estado | Observación |
|---|---|---|
| Respeto de base | Cumple | Ciempi 35/35 idéntico. Dragón y Cuncuna sin tocar (md5). Círculo de la cabeza y B03 vectoriales intactos. |
| Anclaje y capas | Cumple con observaciones | Piernas dentro de la bola y del pie, casco detrás y torretas centradas ([detalle](evidencia/detalle-claro.png)). El pie IA es un muñón con dos bultos, y en ampliación se lee menos «prensil» que en el concepto. |
| Legibilidad | Cumple | A 84 px se reconocen la espiral y el casco; en oscuro, los colores vivos destacan. Las torretas solo se leen desde unos 240 px. |
| Perspectiva, luz y material | Cumple con observaciones | Brillo coherente. En las expresiones de ojos cerrados (carcajada, dormilón, besito) el hueco de la torreta deja un anillo vacío que parece una espiral ([expresiones](evidencia/expresiones-claro.png)). |
| Compatibilidad | Cumple en lo revisado | El casco se guarda bajo los 4 gorros o peinados revisados. Con la máscara robot no se dibuja boca en E08 (0 en `fusion.json`). Restaurar devuelve el casco y las torretas (prueba V4). |
| Diferenciación honesta | Cumple | Silueta propia (espiral, casco, torretas). Camuflaje documentado como tinte por bandas, no como recoloreado por zonas. |
| Efecto de controles | Cumple, documentado | Paleta a mano > conjunto > superficie > colores IA. El calzado reemplaza el pie. Sin antenas. |
| Evidencia y autorización | Pendiente | **Falta la aprobación del usuario.** |

## Rúbrica (orientativa; no se promedia)

| Dimensión | Antes | Después | Observación concreta y evidencia |
|---|---|---|---|
| Coherencia con Ciempi | n/a | 4 | El contorno, las bolas superpuestas, las piernas gruesas y el rostro B03 se mantienen ([comparación 320 px](evidencia/comparacion-claro.png)). Las torretas y el casco son los rasgos propios. |
| Calidad de ilustración | n/a | 3 | Segmentos, cola en espiral y casco limpios. El pie es tosco y los anillos vacíos con ojos cerrados se ven raros ([expresiones](evidencia/expresiones-claro.png), carcajada y dormilón). |
| Integración con el cuerpo | n/a | 3 | Gorros, bufanda y mochila asientan bien ([accesorios](evidencia/accesorios-claro.png)). Los lentes redondos sobre las torretas se ven recargados y el calzado B10 queda chico frente a la pata. |
| Legibilidad | n/a | 4 | La espiral y el casco destacan a 84 px, incluso en silueta. El camuflaje se nota a 240 px ([camuflaje](evidencia/camuflaje-claro.png)). |
| Originalidad | n/a | 4 | El gancho de camuflaje por conjunto es propio y aprovecha el sistema de vestuario. El tema camaleón es conocido, pero la versión segmentada con torretas sobre el rostro B03 es propia. |

- **Decisión:** prototipo funcional; artísticamente **requiere ajustes** (pie prensil, torreta con párpado cerrado, combinación con lentes) y está **pendiente de aprobación**.
- **Siguiente acción:** generar con IA una torreta «cerrada» para las expresiones de ojos cerrados (se podría elegir según `irisVisible` del catálogo), un pie con dedos en pinza más claros y una regla para atenuar las torretas con lentes.
