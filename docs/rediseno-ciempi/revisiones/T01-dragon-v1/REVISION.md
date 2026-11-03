# Revisión: T01 · Ciempi Dragón · v1 (laboratorio)

Fecha: 2026-11-03 · Guía: `CIEMPI_ART_DIRECTION.md` v1.7 · Revisión **del agente**, no aprobación. **Pendiente de aprobación artística del usuario.** No integrado al juego.

- **Objetivo y alcance autorizado:** transformación «Dragón» solo para laboratorio (decisión del usuario registrada en `docs/expansion-ciempi/CONTINUIDAD-SESION.md` §1). Cabeza conservada (círculo 736,340 r130, ojos, boca y anclajes); se permiten cuernos, orejas, hocico, materiales y colores propios; crecimiento modular sin estirar imágenes; accesorios universales / adaptables / exclusivos; lo comprado nunca se pierde.
- **Necesidad nueva:** pieza nueva; no hay «antes». La comparación es contra la base v2 sin accesorios y la familia cercana (gorro B06 «dragón», máscara B07 «dragón», conjunto «Draco del bosque»).
- **Referencias:** base v2 aprobada (`ciempi-ilustracion-v2.svg` / presentación), `T00-referencias/ciempi-sin-gorro.png`, concepto IA seleccionado `ia/concepto-d2-bebe.png`.
- **Configuración reproducible:**
  - Piezas IA (Codex `image_gen`, 15 generaciones entre ambas criaturas): `ia/pieza-dragon-*.png` + prompt y registro; recortadas sin calco por `scripts/transformaciones/procesar-piezas.py` a `laboratorio-transformaciones/recursos/dragon/` (WebP 2×, ≈194 KB, `manifiesto.json`).
  - Compositor: `laboratorio-transformaciones/especies.js` (base de especie → `renderCiempi` sin modificar → `escena(svg, n, prefijo, forma)`), forma en `src/ciempi/v2/especie.ts` (`formaModular(402, 92, 400, 104, 175)`), compatibilidad en `src/ciempi/v2/compatibilidad.ts`.
  - Láminas: `node scripts/transformaciones/capturar-evidencia.cjs` (Chromium 1248 vía Playwright de npx, 1×, selección por defecto + `expresion: b03-alegre`).
- **Selección del concepto (provisional, del agente):** d2 «bebé con alitas». A 84 px es la silueta más distinta de Ciempi: fila de púas naranjas, cola en flecha, cuernos y orejas aleta (`conceptos/siluetas.png`). d1 «desfile» se lee como disfraz de año nuevo chino y alarga demasiado la cabeza; d3 «cresta de hojas» es un bloque a 84 px y su cresta choca con todos los gorros.
- **Protegido / flexible:** protegido = cabeza vectorial aprobada, ojos, boca, rubor, antenas eliminadas solo en esta especie, contorno #243e5b, paso con seis apoyos. Flexible usado = cuernos y orejas (raster IA, detrás de la cabeza), hocico crema (vector nuevo dibujado por el agente, **no IA**), cuerpo verde azulado con vientre crema y púas, cola con punta, patas con garras.

## Evidencia inspeccionada (Read sobre cada PNG)

| Lámina | Contenido |
|---|---|
| [crecimiento-claro.png](evidencia/crecimiento-claro.png) | N = 0, 1, 2, 5, 8, 12, 22, 40 a la misma escala |
| [accesorios-claro.png](evidencia/accesorios-claro.png) / [oscuro](evidencia/accesorios-oscuro.png) | 9 universales, 6 adaptables, 1 exclusivo, N = 5, 320 px |
| [detalle-claro.png](evidencia/detalle-claro.png) | Cuello/cabeza, patas, cola ampliados; sin accesorios, con calzado+bufanda+gorro, con superficie+alitas |
| [conjuntos-claro.png](evidencia/conjuntos-claro.png) | 10 conjuntos B12 |
| [animacion-claro.png](evidencia/animacion-claro.png) | A02, A03, A06, A10, E04 con el rig del juego, N = 8 |
| [comparación claro](../T00-comparacion-v1/evidencia/comparacion-claro.png) / [oscuro](../T00-comparacion-v1/evidencia/comparacion-oscuro.png) | Ciempi / Dragón / Cuncuna a 84 px de alto, 240 y 320 px de ancho, N = 5 y 12, siluetas |

**Combinaciones revisadas:** base; gorros mago y jockey; máscaras gatita (parcial) y robot (completa); lentes transparentes y visor opaco; peinado coletas; bufanda B01; gestos guiño, dormilón con ojos verdes; paletas Océano y Noche; calzado deportiva; superficie draco; capa heroica; mochila aventura; alitas; los 10 conjuntos; restaurar (laboratorio, botón «Restaurar» y prueba Playwright). **Pendientes:** las 14 expresiones B03 con cada máscara, las 5 paletas en todas las combinaciones, todos los calzados B10 (solo deportiva y los de conjuntos), N > 12 con capas/mochilas, tamaños reales en dispositivo Android, Firefox/Safari.

## Criterios obligatorios

| Criterio | Estado | Observación y evidencia |
|---|---|---|
| Respeto de base | Cumple | La base de Ciempi no cambia: `escena()` actual = `pose.ts@3e188ce` en 35/35 casos (N = 0,1,5,12,40 × 7 selecciones, sin `forma` y con `FORMA_CIEMPI`), `probar-laboratorio.cjs`. La cabeza del Dragón es el vector aprobado. |
| Anclaje y capas | Cumple con observaciones | [detalle](evidencia/detalle-claro.png): piernas nacen dentro de las bolas y terminan dentro del pie; cuernos/orejas detrás de la cabeza sin huecos; alitas con el tallo sobre el lomo del frente (como el concepto). Observaciones: el calzado B10 es más estrecho que la pierna del Dragón y el borde de la pierna asoma sobre el cuello del zapato (fila 2); con superficie B11 el contorno del núcleo cruza la base de las púas (fila 3). |
| Legibilidad | Cumple | [comparación](../T00-comparacion-v1/evidencia/comparacion-claro.png): a 84 px se reconoce dragón por púas, cola en flecha y cuernos; silueta distinta de Ciempi. En fondo oscuro el contorno se pierde igual que en Ciempi. |
| Perspectiva, luz y material | Cumple con observaciones | Brillo superior izquierdo coherente con la base en bolas, cola y patas. El hocico vectorial es plano (un relleno y un brillo) frente al sombreado de la cabeza. Ampliado, el contorno raster es algo más suave que el vectorial. |
| Compatibilidad | Cumple en lo revisado | Etiquetas de `compatibilidad.ts` en [accesorios](evidencia/accesorios-claro.png); máscaras completas (robot, espíritu, AraLuz) guardan cuernos y hocico; alitas exclusivas, ocultas sin desequipar en Ciempi/Cuncuna (Vitest). Matriz parcial: ver pendientes. |
| Diferenciación honesta | Cumple | No es un recolor de Ciempi: cambia silueta (púas, cola, cuernos, garras). Coincide temáticamente con el gorro/máscara «dragón» y el conjunto «Draco»: se distingue por ser la criatura y no un disfraz. |
| Efecto de controles | Cumple, documentado | Paletas: tiñen la cabeza (vector) y el cuerpo raster por bandas de tono (verde→menta, naranja→naranja, crema→amarillo de la paleta), conservando contornos y brillos; aproximación, no recoloreado por zonas. Superficies B11: cubren el núcleo de cada bola (el vientre crema queda tapado; púas a la vista). Calzado B10: reemplaza el pie con garras. Sin antenas: los controles que las afectan no tienen efecto. |
| Evidencia y autorización | Pendiente | Evidencia inspeccionada; **falta la aprobación artística del usuario**. |

## Rúbrica (orientativa; no se promedia)

| Dimensión | Antes | Después | Observación concreta y evidencia |
|---|---|---|---|
| Coherencia con Ciempi | n/a | 4 | Cabeza, rostro y contorno azul idénticos a la base; bolas superpuestas con brillo superior izquierdo y piernas gruesas siguen el lenguaje de Ciempi ([comparación 320 px](../T00-comparacion-v1/evidencia/comparacion-claro.png)). Resta: mezcla raster/vector visible solo ampliada. |
| Calidad de ilustración | n/a | 3 | Volumen y vientre con pliegues bien construidos en [detalle](evidencia/detalle-claro.png); pero A–D son casi idénticos (monótono desde N = 22 en [crecimiento](evidencia/crecimiento-claro.png)) y el hocico vectorial es más plano que la cabeza. |
| Integración con el cuerpo | n/a | 3 | Sin piezas flotando en las vistas revisadas; cuernos, alitas y patas anclados. Fallan en ajuste fino: pierna más ancha que el zapato B10 y contorno del núcleo sobre las púas con B11 ([detalle](evidencia/detalle-claro.png), filas 2–3). Sin sombras de contacto al recomponer (igual que Ciempi con N ≠ 5). |
| Legibilidad | n/a | 4 | A 84 px de alto la fila de púas y la cola en flecha separan al Dragón de Ciempi incluso en silueta negra; el hocico se lee como mancha clara. En oscuro el contorno desaparece (heredado). |
| Originalidad | n/a | 3 | Propuesta clara y adaptada (dragón bebé con alitas pequeñas), pero tema muy transitado y cercano a piezas existentes del catálogo (gorro/máscara dragón, conjunto Draco). |

- **Decisión técnica y artística:** técnicamente funcional en el laboratorio; artísticamente **requiere ajustes menores** (calzado ancho para garras o pierna adaptable, contorno del núcleo con B11, variación entre A–D) y **pendiente de aprobación del usuario**.
- **Cambio significativo de identidad:** no altera la base de Ciempi. Es una criatura nueva bajo la regla de cabeza aprobada; integrarla al juego requiere aprobación (§13).
- **Aprobación del usuario:** no existe para estos diseños.
- **Limitaciones y siguiente acción:** decidir si se aprueba d2; si se aprueba, generar con IA una variante de pierna más estrecha o un calzado adaptado, y un segmento con variación (p. ej. púa distinta en C/D); revisar paletas restantes y expresiones con máscaras; medir en Android.
