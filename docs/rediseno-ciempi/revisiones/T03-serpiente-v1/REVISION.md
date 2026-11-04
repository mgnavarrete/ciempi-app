# Revisión: T03 · Ciempi Serpiente · v1 (laboratorio)

Fecha: 2026-11-03 · Guía: `CIEMPI_ART_DIRECTION.md` v1.7 · Rama `expansion-v4-criaturas`. Revisión **del agente**, no aprobación. **Pendiente de aprobación artística del usuario.** No integrada al juego, sin banderas, sin cambios en `public/ciempi-v2/`.

- **Objetivo y alcance autorizado:** criatura nueva «Serpiente» completa para el laboratorio (encargo V4 del coordinador): IA real (AD-010), crecimiento modular N 0–40, expresiones B03, accesorios de cabeza y espalda, E08 «Comer», animaciones del rig. Sin tocar Ciempi, Dragón ni Cuncuna (AD-017 aprueba solo sus cuerpos).
- **Necesidad nueva:** no hay «antes». Se compara con la base v2 sin accesorios y con la familia (Ciempi, Dragón, Cuncuna, Camaleón) en [comparación](evidencia/comparacion-claro.png).
- **Referencias:** base v2 (`ciempi-ilustracion-v2-presentacion.png`), `T00-referencias/ciempi-sin-gorro.png`, concepto aprobado de cuerpo del Dragón `T01-dragon-v1/ia/concepto-d2-bebe.png` (lenguaje de transformación, AD-017).

## Proceso de IA (Codex CLI 0.166 `exec` + `image_gen`, `scripts/transformaciones/generar-ia.mjs`)

| Paso | Archivos |
|---|---|
| 4 conceptos (prompts en `scripts/transformaciones/prompts-v4/crear_conceptos.py`, lanzador `lanzar-conceptos.sh`) | `ia/concepto-s1-jardin`, `s2-caramelo`, `s3-noche`, `s4-hoja` (+ `-prompt.txt`, `-registro.json`). Láminas: [conceptos](conceptos/lamina-conceptos.png), [siluetas 84 px](conceptos/siluetas-84px.png) |
| Piezas sobre el concepto elegido (`crear_piezas.py`, `lanzar-piezas.sh`) | `ia/pieza-serpiente-segmentos`, `-cola`, `-cabeza`, `-lengua`. Primera tanda de segmentos (bolas de ~150 px, se habrían ampliado 2,3×) y lengua (forma de muela) descartadas y conservadas en `ia/descartes/` |
| Procesado sin calco (`scripts/transformaciones/v4/procesar-piezas-v4.py`, reutiliza `procesar-piezas.py` sin modificarlo) | `laboratorio-transformaciones/recursos/serpiente/` (WebP con alfa 2 px/u, calidad 90, 150 KB, `manifiesto.json`), [anclajes](piezas/anclajes-piezas.png) |

**Elección (provisional, del agente): s2 «caramelo».** Criterios explícitos:
1. *Paleta distinta de la familia:* s1 (verde) y s4 (turquesa) quedan junto al Dragón verde azulado; s3 (azul-violeta) junto a la Cuncuna lila. s2 (coral y amarillo) no la usa ninguna criatura.
2. *Fondo oscuro:* s3 se apaga sobre fondo oscuro (azul sobre azul); s2 es la de mayor contraste ([crecimiento oscuro](evidencia/crecimiento-oscuro.png)).
3. *Ritmo modular:* s2 alterna dos colores (A/C coral, B/D amarillo); evita la monotonía A = B = C = D anotada en T01.
4. *Compatibilidad:* s4 lleva un brote en la coronilla que choca con todos los gorros (mismo problema que d3 en T01).
5. *Silueta a 84 px:* sin patas y con la cola en corazón, es la más distinta de Ciempi ([siluetas](evidencia/comparacion-claro.png), última fila). Riesgo: coral y amarillo son cálidos como Ciempi; lo compensan la cabeza coral y la falta de patas.

## Decisiones de diseño

- **Forma (`FORMA_SERPIENTE`, `src/ciempi/v2/especie.ts`):** ciclo A→B→C→D (1, 2, 3, 5), segmentos apoyados en el suelo (y = 486; Ciempi 402–414), frente a modo de cuello (y = 446), separación 94, cola 104, `margenCola` 190, `xFrente` 558 (como todas).
- **Sin patas, con `pieDeRol` y `siempreClonar`:** las seis patas del maestro existen pero son grupos vacíos (`data-sin-pata`). Todos los roles usan la pata 1 (`pieDeRol` = 1). Así `escena`, `escenaCreciente` y `rig.crecer` siguen contando un apoyo por segmento. `siempreClonar` evita mostrar el maestro con N = 5.
- **Calzado:** se añade el campo opcional `partesOcultas` a `Especie` y una comprobación en `compatibilidad.ts`. En la serpiente, `pies` se oculta y queda etiquetado como «oculto en esta especie»: el calzado sigue equipado y vuelve a verse al cambiar a una criatura con patas, lo que comprueba la prueba del laboratorio V4. No se usaron zapatos adaptados porque una serpiente con zapatos contradice la anatomía elegida. Queda abierto si en el futuro se quiere un sustituto (p. ej., patines bajo el vientre).
- **Cabeza:** conserva el círculo (736, 340) r130, el contorno vectorial, los ojos, cejas, rubor y boca B03. Por debajo lleva una **piel IA propia** (coral, con hocico crema y narinas) que reemplaza el disco naranja y su sombreado. Con eso el rostro deja de ser el de Ciempi sin perder ninguna expresión.
- **Lengüita bífida (IA, opcional):** se dibuja dentro de `#mouth` (detrás del labio) solo en Alegre, Carcajada, Guiño, Curioso y Orgulloso. Las coordenadas están en `LENGUA_EN` de `criaturas-v4.js`. No aparece con Sorprendido (la boca de E08), con caras cerradas ni bajo máscaras que tapan la boca (`rasgosOcultosCon` + boca vacía). Se apaga con `sel.lengua = 'no'` o con la casilla «Lengüita» del laboratorio.
- **Espalda:** capa en el cuello, como Ciempi. La mochila baja 44 u con el segmento delantero.
- **Paletas:** tiñen el cuerpo y la cabeza raster por bandas de tono (coral → naranja, amarillo → amarillo de la paleta, resto → menta). Es una aproximación, igual que en T01/T02.

## Evidencia inspeccionada (Read de cada PNG por el agente)

| Lámina | Contenido |
|---|---|
| [crecimiento claro](evidencia/crecimiento-claro.png) / [oscuro](evidencia/crecimiento-oscuro.png) | N = 0, 1, 2, 5, 12, 40 a la misma escala; N = 5 y 12 a 84 px de alto y 320 px de ancho |
| [expresiones claro](evidencia/expresiones-claro.png) / [oscuro](evidencia/expresiones-oscuro.png) | 14 B03 a 240 px + cabeza ampliada + lengüita con/sin |
| [accesorios claro](evidencia/accesorios-claro.png) / [oscuro](evidencia/accesorios-oscuro.png) | 16 muestras: gorros, máscaras parcial/completa, lentes, peinado, bufanda, capa, 2 mochilas, 2 calzados (ocultos), superficie, 2 paletas; mochila/capa con N = 1, 12, 40 |
| [conjuntos](evidencia/conjuntos-claro.png) | 10 conjuntos B12 |
| [E08 comer](evidencia/comer-claro.png) | boca sorprendida, carcajada, gorro y máscara robot (`bocaTapada`), escena creciente + `rig.crecer` |
| [animación](evidencia/animacion-claro.png) | A02, A03, A06, A10, E04 con el rig del juego, N = 8 |
| [comparación claro](evidencia/comparacion-claro.png) / [oscuro](evidencia/comparacion-oscuro.png) | 5 criaturas a 84 px de alto y 320 px de ancho, N = 5 y 12, siluetas, mismo conjunto |
| [fusión](fusion/) | `fusion.json`: `escenaCreciente` + `rig.crecer` frente a `escena` + rig, PNG por par |

**Combinaciones revisadas:** las de las láminas. **Pendientes:** las 14 expresiones con cada máscara y cada lente; todos los calzados (se ocultan por regla, verificado con dos); N > 12 con todas las capas; dispositivo Android real; Firefox y Safari.

## Criterios obligatorios

| Criterio | Estado | Observación y evidencia |
|---|---|---|
| Respeto de base | Cumple | Ciempi idéntico: `probar-laboratorio.cjs` 35/35. Dragón y Cuncuna: `recursos/dragon` y `recursos/cuncuna` con md5 sin cambios. Cabeza vectorial y B03 conservados. |
| Anclaje y capas | Cumple con observaciones | [detalle](evidencia/detalle-claro.png), capturado con `laminas.html?tipo=detalle`: segmentos superpuestos sin huecos; la cola nace de su bola; la mochila se apoya en el cuello. Observaciones: con N = 0 la cabeza queda sin apoyo, flotando a la altura de Ciempi ([crecimiento](evidencia/crecimiento-claro.png)); la capa queda un poco alta sobre el lomo bajo. |
| Legibilidad | Cumple | A 84 px de alto se lee como serpiente: sin patas, cola en corazón y cabeza levantada ([comparación](evidencia/comparacion-claro.png)). Buen contraste en oscuro. La lengüita no se distingue a 84 ni a 240 px (es un detalle, no un rasgo principal). |
| Perspectiva, luz y material | Cumple | Brillo superior izquierdo y sombra inferior coherentes con la base en bolas, cola y piel de la cabeza; vientre con escamas en arco. Sin sombra de contacto al recomponer (igual que el resto de especies). |
| Compatibilidad | Cumple en lo revisado | Etiquetas en [accesorios](evidencia/accesorios-claro.png). Máscaras completas tapan la cara sin lengüita; E08 con máscara robot sin boca ([comer](evidencia/comer-claro.png); `fusion.json`: 0 bocas sobre máscaras en 102 recorridos). Restaurar recupera todo (prueba V4). |
| Diferenciación honesta | Cumple | No es un recolor: cambia la silueta (sin patas, cuello, cola con corazón) y la cabeza. Se parece a la «serpiente como cordón flotante» de B11 solo en el tema. |
| Efecto de controles | Cumple, documentado | Calzado: oculto. Paletas: tinte por bandas. Superficies B11: cubren el núcleo; el frente muestra el panel claro del material, como en las demás especies. Sin antenas: los controles que las mueven no tienen efecto. |
| Evidencia y autorización | Pendiente | Evidencia inspeccionada. **Falta la aprobación artística del usuario.** La cabeza con piel propia es un cambio de rostro respecto a Ciempi: es una criatura nueva y no altera la base (§13). |

## Rúbrica (orientativa; no se promedia)

| Dimensión | Antes | Después | Observación concreta y evidencia |
|---|---|---|---|
| Coherencia con Ciempi | n/a | 4 | Mismo contorno azul, bolas superpuestas con brillo arriba a la izquierda y la cabeza redonda con el rostro B03 ([comparación a 320 px](evidencia/comparacion-claro.png)). La piel coral con hocico la separa de Ciempi sin salir del sistema. Resta: sin patas, el «paso curvo» de Ciempi no existe. |
| Calidad de ilustración | n/a | 3 | Bolas y vientre bien construidos y limpios a 320 px. Pero la alternancia rompe con N impar (la última central y el frente son coral juntos, N = 5 en [crecimiento](evidencia/crecimiento-claro.png)), caminar es solo un balanceo del rig (sin ondulación, [animación](evidencia/animacion-claro.png)) y la lengüita queda fina. |
| Integración con el cuerpo | n/a | 4 | Gorros, lentes, bufanda y mochila asientan bien ([accesorios](evidencia/accesorios-claro.png)); la máscara robot oculta lengua y boca. Fallan la cabeza sin apoyo con N = 0 y la capa algo alta. |
| Legibilidad | n/a | 4 | A 84 px (pista) la silueta sin patas y el corazón se reconocen incluso en negro. En oscuro, el coral y el amarillo destacan más que el resto de la familia. La lengüita solo se ve ampliada. |
| Originalidad | n/a | 4 | Silueta nueva en la familia (la primera criatura sin patas) y cola en corazón. El tema «serpiente simpática» es conocido; la propuesta no copia personajes protegidos (revisión visual, no legal). |

- **Decisión técnica y artística:** técnicamente funcional en el laboratorio. Artísticamente **requiere ajustes menores** (apoyo con N = 0, alternancia con N impar, ondulación propia al caminar, lengüita más gruesa) y está **pendiente de la aprobación del usuario**.
- **Cambio significativo de identidad:** no altera la base de Ciempi. La integración en el juego requiere aprobación (§13).
- **Aprobación del usuario:** no existe para este diseño.
- **Limitaciones y siguiente acción:** decidir si se aprueba s2. Si se aprueba, pedir a la IA un frente de tercer color (o un anillo crema) para la alternancia, un apoyo para N = 0 (cuello enroscado) y una variante de caminar que ondule los segmentos (requiere animación propia; el rig es compartido).
