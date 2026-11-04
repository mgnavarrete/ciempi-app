# Revisión: T02 · Ciempi Cuncuna · v1 (laboratorio)

Fecha: 2026-11-03 · Guía: `CIEMPI_ART_DIRECTION.md` v1.7 · Revisión **del agente**, no aprobación. **Pendiente de aprobación artística del usuario.** No integrada al juego (la idea de recompensa gratis al completar el nivel 0 sigue siendo solo concepto).

- **Objetivo y alcance autorizado:** transformación «Cuncuna» solo para laboratorio, con las mismas reglas que T01 (cabeza conservada, crecimiento modular, compatibilidad universal/adaptable/exclusiva). Ver `docs/expansion-ciempi/CONTINUIDAD-SESION.md` §1.
- **Necesidad nueva:** pieza nueva; «antes» no aplica. Comparación con la base v2 y con el riesgo señalado en el plan maestro §4 («Ciempi peludo»).
- **Referencias:** base v2 aprobada, `T00-referencias/ciempi-sin-gorro.png`, concepto IA seleccionado `ia/concepto-c2-penachos.png`.
- **Configuración reproducible:** piezas IA `ia/pieza-cuncuna-*.png` (prompt + registro) → `laboratorio-transformaciones/recursos/cuncuna/` (WebP 2×, ≈286 KB); forma `formaModular(404, 88, 402, 100, 180, [2, 3, 5, 1])`; láminas con `scripts/transformaciones/capturar-evidencia.cjs`.
- **Selección del concepto (provisional, del agente):** c2 «penachos». La fila de penachos amarillo/salmón da una silueta propia a 84 px ([siluetas](conceptos/siluetas.png)). c1 «esponjosa» se lee como Ciempi con pelusa (riesgo de originalidad 2); c3 «colores chilenos» evoca la bandera y fija una paleta nacional difícil de recolorear.
- **Protegido / flexible:** protegido = cabeza vectorial aprobada, rostro, antenas (con puntas menta que siguen la paleta), contorno, seis apoyos. Flexible usado = penacho de coronilla (raster IA, delante de la cabeza), bolas lila/menta con penachos dorsales y laterales, patas naranjas sin calzado.
- **Decisión del agente:** ciclo B→C→D→A (mismo ciclo, otro inicio) porque cola y frente son lila; así los centrales alternan menta/lila (con A→B→C→D salían dos lilas seguidos en N = 5). Pies centrales con desfase uniforme (−8) para que el paso sea regular con cualquier orden del ciclo (antes dos pies quedaban casi pegados).

## Evidencia inspeccionada (Read sobre cada PNG)

| Lámina | Contenido |
|---|---|
| [crecimiento-claro.png](evidencia/crecimiento-claro.png) | N = 0, 1, 2, 5, 8, 12, 22, 40 |
| [accesorios-claro.png](evidencia/accesorios-claro.png) / [oscuro](evidencia/accesorios-oscuro.png) | 9 universales, 6 adaptables, alitas (oculto) |
| [detalle-claro.png](evidencia/detalle-claro.png) | Anclajes ampliados |
| [conjuntos-claro.png](evidencia/conjuntos-claro.png) | 10 conjuntos B12 |
| [animacion-claro.png](evidencia/animacion-claro.png) | A02, A03, A06, A10, E04, N = 8 |
| [comparación claro](../T00-comparacion-v1/evidencia/comparacion-claro.png) / [oscuro](../T00-comparacion-v1/evidencia/comparacion-oscuro.png) | 84 / 240 / 320 px |

**Combinaciones revisadas:** las mismas que T01 (ver su ficha), más alitas del Dragón como pieza oculta. **Pendientes:** expresiones B03 con máscaras, todas las paletas y calzados, Android real, Firefox/Safari.

## Criterios obligatorios

| Criterio | Estado | Observación y evidencia |
|---|---|---|
| Respeto de base | Cumple | Ciempi idéntico (35/35, ver T01). Cabeza vectorial aprobada. |
| Anclaje y capas | Cumple con observaciones | [detalle](evidencia/detalle-claro.png): penacho apoyado en la coronilla y antenas por detrás; piernas dentro de bola y pie. Los penachos laterales de cada bola quedan parcialmente tapados por la bola siguiente (solape intencional, pero corta algunos mechones). Calzado B10 pequeño frente a la pierna naranja. |
| Legibilidad | Cumple con observaciones | A 84 px la cresta de penachos es inconfundible; a N = 40 / 84 px los penachos se funden en una banda continua y el cuerpo se ve recargado ([comparación](../T00-comparacion-v1/evidencia/comparacion-claro.png), N = 12). |
| Perspectiva, luz y material | Cumple | Mechones agrupados en masas con dos tonos y contorno; bolas con brillo superior izquierdo. |
| Compatibilidad | Cumple en lo revisado | El penacho se guarda bajo cualquier gorro, máscara o peinado y vuelve al quitarlo (Vitest + [accesorios](evidencia/accesorios-claro.png)); alitas ocultas sin desequipar. Con superficies B11 los penachos quedan sobre el traje (incongruente en «Robot Lumen», [conjuntos](evidencia/conjuntos-claro.png)). |
| Diferenciación honesta | Cumple | Silueta y paleta propias; no es recolor de Ciempi. |
| Efecto de controles | Cumple, documentado | Paletas por bandas de tono: lila y salmón → naranja de la paleta, menta → menta, amarillo → amarillo; contornos y brillos intactos. B11 cubre el núcleo; penachos visibles. |
| Evidencia y autorización | Pendiente | Falta aprobación del usuario. |

## Rúbrica (orientativa; no se promedia)

| Dimensión | Antes | Después | Observación concreta y evidencia |
|---|---|---|---|
| Coherencia con Ciempi | n/a | 3 | Cabeza, rostro, antenas y bolas superpuestas conservan a Ciempi; pero la paleta lila/menta y la cantidad de mechones se alejan del naranja/menta/amarillo de marca ([comparación 320 px](../T00-comparacion-v1/evidencia/comparacion-claro.png)). |
| Calidad de ilustración | n/a | 3 | Mechones con masas y dos tonos bien resueltos en [detalle](evidencia/detalle-claro.png); los laterales recortados por la bola siguiente y la densidad a N alto restan claridad. |
| Integración con el cuerpo | n/a | 3 | Penacho y patas bien anclados; regla de ocultar el penacho bajo gorros evita choques. Calzado B10 pequeño y penachos encima de superficies rígidas (robot) sin adaptar. |
| Legibilidad | n/a | 4 | A 84 px se reconoce por la cresta de penachos, distinta de Ciempi y del Dragón incluso en silueta; a N ≥ 22 se vuelve una franja recargada. |
| Originalidad | n/a | 4 | Toma la cuncuna chilena con penachos (oruga tipo polilla) y la adapta a Ciempi sin caer en «Ciempi peludo»; propuesta propia del catálogo. |

- **Decisión técnica y artística:** funcional en laboratorio; **requiere ajustes menores** (densidad de penachos a N alto, penachos laterales, calzado) y **pendiente de aprobación del usuario**.
- **Cambio significativo de identidad:** no altera la base de Ciempi. Integrarla al juego requiere aprobación (§13).
- **Aprobación del usuario:** no existe.
- **Limitaciones y siguiente acción:** si se aprueba c2, considerar una variante IA de segmento con penacho lateral más corto para N alto, y decidir si las superficies B11 deben ocultar los penachos dorsales.
