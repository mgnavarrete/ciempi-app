# Dirección artística de Ciempi

Versión 1.7 · 28 de octubre de 2026.
Estado: estructura y criterios autorizados por el usuario; documentación permanente del proyecto. Esta guía no declara aprobado todo el vestuario ni autoriza por sí sola cambios en el juego.

## 1. Alcance, referencias y autoridad

Consultar esta guía antes de crear o modificar a Ciempi, sus accesorios, paletas, expresiones, estampados o composición visual. También al modificar un generador que pueda alterar su apariencia. Para tareas sin impacto visual, no exige trabajo artístico adicional.

Referencias, con funciones distintas:

| Referencia | Función |
|---|---|
| [Logo original](logo/ciempi-app-logo.jpg), [SVG histórico](public/ciempi.svg) y [versión larga histórica](public/ciempi-long.svg) | Origen de la identidad: naranja, menta, amarillo, contorno oscuro, ojos expresivos y jockey. No copiar automáticamente su anatomía al nuevo vestuario. |
| [SVG ilustrado v2](docs/rediseno-ciempi/ciempi-ilustracion-v2.svg), [presentación](docs/rediseno-ciempi/ciempi-ilustracion-v2-presentacion.png) y [miniatura](docs/rediseno-ciempi/ciempi-ilustracion-v2-miniatura.png) | Referencia aprobada de anatomía, proporciones y acabado del nuevo Ciempi. |
| [Generador de la base](scripts/crear-ciempi-ilustracion-v2.mjs) | Fuente de medidas y construcción. Leerlo no exige ejecutarlo: su ejecución escribe recursos. |
| [Análisis crítico](docs/rediseno-ciempi/auditoria/ANALISIS-CRITICO.md) y [revisión por pieza](docs/rediseno-ciempi/auditoria/REVISION-POR-PIEZA.md) | Evidencia de defectos y recomendaciones; no son una aprobación global del catálogo. |
| [Galería comparativa](docs/rediseno-ciempi/auditoria/index.html), [inventario](docs/rediseno-ciempi/auditoria/inventario.json) y [verificaciones](docs/rediseno-ciempi/auditoria/verificaciones.json) | Estado auditado: 122 opciones, incluyendo controles y opciones vacías; no 122 diseños independientes. |
| [Script de auditoría](scripts/auditar-vestuario-ciempi.mjs) | Herramienta existente para láminas y comprobaciones limitadas de igualdad de imágenes. No certifica calidad artística. |

Las instrucciones explícitas actuales del usuario prevalecen sobre esta guía. Respetar las instrucciones aplicables de AGENTS.md. En documentos históricos, distinguir decisiones vigentes de propuestas superadas: la mención antigua de cabeza asimétrica en PLAN.md no sustituye la cabeza redonda aprobada posteriormente.

Las recomendaciones pendientes de la auditoría no son cambios ya aprobados o implementados. Por ejemplo, alargar una bufanda entre 30 % y 50 % es una hipótesis de exploración, no una proporción obligatoria.

## 2. Identidad protegida y libertad creativa

### Características obligatorias

- Conservar en el personaje base la cabeza redonda, el cuerpo alargado de segmentos redondeados y superpuestos, las piernas gruesas y la marcha curva aprobada.
- Mantener la identidad de ilustración amable y expresiva, el contorno azul oscuro y una construcción de volúmenes coherente con la base.
- Hacer que accesorios y estampados se adapten al personaje; no deformar su anatomía para resolver un accesorio mal encajado.
- Restaurar el personaje base al quitar accesorios. Una máscara completa elegida expresamente puede ocultar rostro y antenas según su diseño; no redefine la anatomía permanente.
- Respetar las decisiones vigentes de categorías: máscaras en Gorros y máscaras; capas y mochilas excluyentes dentro de Espalda. No reintroducir la ropa eliminada sin una nueva instrucción del usuario.

### Decisiones artísticas flexibles

Se pueden explorar temas, colores alternativos, materiales, siluetas de accesorios, peinados, gestos, asimetrías, pliegues y decoración dentro del alcance autorizado. No es obligatorio llevar jockey, mantener siempre el cuerpo naranja ni sonreír en toda expresión. La creatividad no se limita al catálogo actual.

Las paletas temáticas, máscaras, pies elevados durante el paso y objetos que ocultan parte del cuerpo son posibilidades válidas. Evaluar su intención y resultado; no penalizarlas automáticamente por apartarse de la apariencia sin accesorios.

El número de segmentos de la lámina de referencia no limita la longitud variable del personaje en el juego. Mantener las relaciones visuales y verificar las longitudes afectadas.

## 3. Jerarquía visual de trabajo

Resolver y revisar en este orden:

1. **Silueta y proporciones:** se reconoce el objeto y sigue leyéndose Ciempi.
2. **Integración, expresión y materiales:** el objeto está sujeto, comparte perspectiva y luz, y acompaña el gesto del personaje.
3. **Decoración y pequeños detalles:** emblemas, costuras, brillos secundarios, motivos y efectos.

No compensar una silueta confusa o un anclaje incorrecto agregando detalle. Una pieza más simple puede ser mejor. No medir calidad por cantidad de elementos, degradados, líneas o accesorios nuevos.

## 4. Proporciones y puntos de unión

Medidas de la referencia v2, expresadas en unidades del SVG, no en píxeles de pantalla:

| Elemento | Referencia comprobable |
|---|---|
| Espacio de dibujo | viewBox 0 0 1000 650. |
| Cabeza | Centro (736, 340), radio 130; diámetro 260. |
| Segmento delantero | Centro (558, 402), radios 95 y 97. Cabeza/altura de este segmento ≈ 1,34. |
| Otros segmentos, de cola hacia delante | Centros (187,386), (289,410), (390,414), (477,402); radios (88,85), (88,85), (81,84), (76,89). |
| Piernas | Anchura de origen de 32 unidades y tobillo de 28 en la construcción de referencia. Nacen dentro del cuerpo y terminan dentro del calzado. |
| Seis pies en esta pose | Posiciones (172,524), (276,541), (375,550), (500,544), (625,537), (780,527); giros −12°, −6°, 0°, 7°, −5°, −12°. |

Son referencias para verificar escala y relaciones, no una exigencia de usar coordenadas absolutas en todas las poses. Un escalado uniforme no cambia la identidad. No alterar inadvertidamente la base durante un trabajo de accesorio.

Definir el punto de unión de cada pieza: gorro sobre cabeza; lentes sobre puente y laterales del rostro; bufanda entre cabeza y primer segmento; capa desde cuello/hombro; mochila sobre segmento delantero; calzado alrededor del tobillo. Registrar ese punto en la ficha de revisión y mostrarlo ampliado. No existe un único orden de capas válido para todos los objetos: documentar qué parte pasa delante y detrás.

## 5. Color, variantes y contraste

| Función en la base | Color |
|---|---|
| Contorno y rasgos oscuros | #243e5b |
| Naranja central | #ff9e32 |
| Menta central | #83cda4 |
| Amarillo central | #ffd137 |
| Turquesa del calzado, luces y sombras | #4fbab8 / #26949d |
| Crema de punteras y suelas | #fff9e9 |

Los degradados completos están en el SVG y su generador. Mantenerlos como referencia, sin convertir cada accesorio en una copia del mismo material. Los colores alternativos son flexibles; debe conservarse la separación entre silueta, ojos y decoraciones importantes.

Comparar las variantes juntas a escala de juego. Harry y Hermione tienen tonos distintos pero casi indistinguibles en uso; compartir una familia de colores puede ser mejor que multiplicar productos. Un recolor válido se presenta como variante, no como una construcción nueva. Una misma pieza puede pertenecer a varias colecciones sin duplicarse conceptualmente.

Verificar qué colores controla realmente cada opción. En la auditoría, siete paletas dieron la misma imagen con el conjunto Spider-Man a 320 px de ancho. Eso demuestra selección oculta por traje/máscara, no igualdad universal de esas paletas. Documentar y explicar los colores fijos o implementar zonas recoloreables cuando la tarea lo autorice.

## 6. Contornos, iluminación y materiales

- Contorno principal de referencia: 7 unidades; calzado principalmente entre 5 y 6; detalles interiores subordinados. No convertir estos valores en grosores fijos para cualquier escala.
- Uniones y extremos redondeados. Admitir puntas cuando definen el objeto, evitando que todo parezca cartón recortado.
- Luz principal superior izquierda en la base v2; sombra inferior/lateral y brillos dibujados. La simplificación ilustrada no exige simulación física exacta, pero sí coherencia entre piezas.
- Sombras de contacto donde una pieza toca otra; no usar una sombra genérica para disimular un anclaje incorrecto.
- Tela: pliegues desde sujeciones, grosor del borde y brillo suave. Metal: placas, juntas, cambios de plano y reflejos más concentrados. Pelo: masas de mechones, solapes y sombra en nacimiento. Goma: suela y puntera redondeadas. Vidrio: marco con espesor y reflejos que no impidan leer la mirada cuando es transparente.
- No aplicar automáticamente el mismo degradado a materiales distintos ni añadir microdetalle que desaparece en móvil.

## 7. Perspectiva y composición

El cuerpo se presenta lateralmente y el rostro se orienta hacia el espectador. Los ojos no son copias simétricas: en la base tienen tamaños, posiciones e inclinaciones diferentes. Monturas, orejas, sombreros, correas y emblemas deben acompañar esa perspectiva.

Conservar la curva del paso. Algunos pies pueden elevarse; un pie separado del suelo no es lo mismo que una pierna desconectada del zapato. Revisar la unión al tobillo y las sombras de apoyo.

Dar protagonismo a una pieza o motivo y subordinar los complementos. Las capas pueden tapar parte del cuerpo y del traje; no es necesario exponer todos los emblemas simultáneamente. Una vista ampliada no sustituye la revisión del conjunto completo.

## 8. Criterios por familia, derivados de la auditoría

| Familia | Problema documentado | Criterio de revisión |
|---|---|---|
| Gorros y pelo | Conos rígidos, picos uniformes, rizos como casquete y piezas flotantes. | Mostrar apoyo sobre cabeza, plano cercano/lejano y volumen; agrupar mechones y conservar cabeza redonda al retirar. |
| Máscaras | Ojos sustitutos cambian identidad; algunas caras son planas o severas. | Ajustar máscara al volumen, ocultar solo lo necesario, evitar ojos duplicados y revisar tono expresivo. Un disfraz completo no cambia la referencia base. |
| Lentes | Lectores opacos; cejas desaparecen junto con ojos; formas decorativas sin montura convincente. | Transparentes: mirada y guiño legibles dentro del cristal. Opacos: sin ojos filtrándose. En ambos, puente, patillas y cejas resueltos intencionalmente. |
| Bufandas | Extremo corto, estrecho y escondido; apariencia de corbata. | Anclaje entre cabeza y primer segmento, caída visible a 240 px, volumen de vuelta/nudo y extremos legibles; probar sin gorro, con Harry y con Hermione. Longitud, flecos y curvas son flexibles. |
| Capas | Una plantilla triangular repetida con colores diferentes. | Pliegues desde broche, borde con peso y caída lateral; porción principal visible por delante del cuerpo. Diferenciar construcción cuando se promete un diseño nuevo. |
| Mochilas y bolsos | Objetos planos, asas y correas genéricas. | Volumen lateral o fuelle, grosor del asa y recorrido de sujeción adaptado a la pieza. |
| Calzado | Bloques rígidos; ballerinas con forma de zapatilla y botas sin caña. | Silueta acorde al nombre, abertura, tobillo y suela claros; revisar los seis pies. Patines requieren ajuste propio por sus ruedas. |
| Trajes y estampados | Cuadrículas planas, emblemas pegados y serpiente como cordón flotante. | Motivos curvados por superficie, solapes coherentes y composición entre segmentos; distinguir estampado de traje completo. Repetir lunares o escamas es válido. |
| Paletas y variantes | Diferencias mínimas o completamente ocultas. | Mostrar diferencia útil o declarar variante compartida; documentar efecto real de los controles. |

Estas reglas describen resultados a conseguir, no obligan a una única solución gráfica. Consultar además la entrada concreta de la revisión por pieza.

## 9. Expresiones e identidad del rostro

Mantener la geometría del ojo al cambiar solo su color. Coordinar cejas, párpados y boca según el gesto; no imponer la sonrisa abierta a Dormilón. Curioso debe distinguirse por mirada o cejas; Besito debe leerse como gesto y no como una figura pegada.

Comprobar Alegre, Guiño y Ojos felices con accesorios faciales; incluir Dormilón cuando cambien párpados o recortes. Los ojos cerrados ocultan naturalmente el color del iris: no es un fallo de dibujo. La interfaz o la ficha debe explicar ese efecto cuando corresponda. No confundir un control oculto por diseño con una opción funcionalmente rota.

## 10. Compatibilidad visual y alcance de pruebas

Cada revisión debe declarar combinaciones revisadas y las pendientes. Como mínimo:

- Base sin accesorio, pieza sola sobre base neutra y conjunto temático previsto.
- Pieza compatible próxima que pueda provocar una colisión: gorro/lentes, pelo/bufanda, máscara/cuello, etc. No exigir combinaciones excluidas, como capa y mochila simultáneas.
- Paleta clásica y alternativas clara/oscura pertinentes si se promete recoloreado; todas las variantes de la familia cuando el cambio afecta una geometría compartida.
- Todos los apoyos de calzado y combinaciones mixtas pertinentes, con semilla fija si hay aleatoriedad.
- Equipar y retirar: recuperar ojos, boca, antenas y colores sin restos.
- Al integrar en el juego, revisar tamaños de uso y longitudes del cuerpo afectadas. Una vista del prototipo no acredita compatibilidad con producción ni con animaciones aún no implementadas.

Si cambia un compositor compartido, ampliar la revisión a las familias afectadas. No afirmar que todas las combinaciones funcionan por haber revisado solo unas muestras.

## 11. Comparaciones visuales obligatorias antes y después

Antes de cada rediseño, conservar el estado previo; después, generar e inspeccionar visualmente el resultado. Para una pieza nueva, comparar contra la base sin esa pieza y la familia más cercana. No inventar un estado anterior inexistente.

Guardar evidencia por revisión en `docs/rediseno-ciempi/revisiones/<revision>/<pieza>/`, sin sustituir evidencia histórica:

- `antes/` y `despues/`: imágenes y, cuando corresponda, fuentes necesarias para reproducirlas.
- Lámina comparativa con base, antes y después; vista completa y detalle de anclaje.
- Vistas de personaje a 240 y 320 px de ancho, y al tamaño real del juego/selector cuando esté disponible. Registrar tamaño y encuadre: no comparar un recorte ampliado con un personaje completo como si tuvieran la misma escala.
- Combinaciones de la sección 10. Usar el mismo fondo, pose, selección, semilla, resolución y motor para antes/después, salvo la variable deliberadamente modificada.
- `REVISION.md`: objetivo, IDs, referencias, configuración, versión o copia de fuentes, observaciones, criterios, cinco puntuaciones y decisión. Un commit no basta para reproducir cambios locales sin guardar.

El script existente se ejecuta desde la raíz con `node scripts/auditar-vestuario-ciempi.mjs`, pero **sobrescribe** las láminas e inventario en `docs/rediseno-ciempi/auditoria/`. Antes de ejecutarlo en una tarea visual autorizada, preservar esa evidencia y los estados previos. El script actual no guarda automáticamente revisiones antes/después ni evalúa las cinco dimensiones. No afirmar que estas capacidades existen. Su ampliación requerirá una tarea con alcance adecuado.

La auditoría usa recortes para ampliar detalles; un corte en una lámina no demuestra por sí solo un corte en el juego. Sus hashes a 320 px detectan igualdad exacta, no belleza, originalidad ni diferencias perceptualmente suficientes.

## 12. Aprobación de piezas y evaluación en cinco dimensiones

### Comprobaciones obligatorias

Registrar cada criterio como **cumple / no cumple / no aplica con justificación**, con enlace a evidencia:

| Criterio | Evidencia verificable |
|---|---|
| Respeto de base | Comparación sin accesorios; no se alteraron anatomía, postura o rostro fuera del alcance. |
| Anclaje y capas | Detalle de unión: sin huecos involuntarios, extremidades desconectadas, recortes accidentales ni ojos duplicados. |
| Legibilidad | Vistas a 240/320 px y tamaño real disponible; forma y rasgo principal reconocibles sin depender del nombre. |
| Perspectiva, luz y material | Observaciones localizadas de grosor, planos, reflejos, sombras y expresión. |
| Compatibilidad | Matriz de combinaciones pertinentes y restauración tras retirar. |
| Diferenciación honesta | Comparación con pieza próxima; recolor identificado como variante; nombre acorde a forma. |
| Efecto de controles | Zonas que cambian y zonas fijas/ocultas documentadas, sin prometer efectos inexistentes. |
| Evidencia y autorización | Antes/después inspeccionados; decisión de identidad aprobada cuando aplique. |

Si un criterio obligatorio aplicable falla, no presentar la pieza como terminada. Si falta evidencia, indicar pendiente de evaluación, no asignar cumplimiento por suposición. Distinguir validación técnica, revisión artística del agente y aprobación explícita del usuario; no son equivalentes.

### Rúbrica orientativa de 1 a 5

Evaluar las cinco dimensiones por separado. La escala común es: **1**, deficiencia grave; **2**, problemas importantes; **3**, resultado funcional con mejoras visibles pendientes; **4**, resultado sólido con ajustes menores; **5**, resultado especialmente resuelto en las vistas y combinaciones inspeccionadas. Un 5 no significa perfección universal.

| Dimensión | Qué observar | Ejemplos de extremos 1 / 5 |
|---|---|---|
| Coherencia con Ciempi | Proporciones, lenguaje de formas, contorno, carácter e identidad. | Parece de otro sistema gráfico / conserva identidad incluso con una propuesta temática distinta. |
| Calidad de ilustración | Construcción, volumen, perspectiva, iluminación y material. | Icono plano con efectos añadidos / material y volumen deliberados, sin detalle innecesario. |
| Integración con el cuerpo | Apoyo, anclajes, solapes, profundidad y continuidad entre piezas. | Flota o corta anatomía / parece vestido y funciona en combinaciones revisadas. |
| Legibilidad | Silueta, gesto y rasgo principal en los tamaños comprobados. | Solo se entiende ampliado o por el nombre / se reconoce en pequeño con jerarquía clara. |
| Originalidad | Aporte frente a la familia existente, adaptación a Ciempi y diferenciación intencional. | Duplica una propuesta sin aportar diferencia / aporta una solución propia clara y pertinente. |

Cada nota debe incluir observación concreta, vista/tamaño y comparación relevante. No escribir solo “más bonito” o “más profesional”. Ejemplo de formato, no evaluación real: “Integración: 2/5; en el detalle del cuello queda un hueco entre broche y tela; a 240 px el extremo parece separado”.

Las puntuaciones son orientativas: no hay promedio, suma ni umbral que apruebe automáticamente una pieza. Una puntuación alta no compensa un anclaje roto. Una variante cromática puede ser excelente sin alcanzar 5 en originalidad; no añadir decoración para elevar su nota. Originalidad aquí no certifica novedad legal. Si no se pudo inspeccionar, registrar “no evaluado” y completar la revisión antes de cerrar; no inventar una nota.

### Plantilla de ficha

```md
# Revisión: <pieza / IDs / versión>
- Objetivo y alcance autorizado:
- Problema auditado o necesidad nueva:
- Referencias y versión de la guía:
- Antes/después, tamaños y configuración reproducible:
- Características protegidas y decisiones flexibles utilizadas:
- Combinaciones revisadas y pendientes:
- Criterios obligatorios: estado, observación y enlace por criterio.

| Dimensión | Antes (1–5) | Después (1–5) | Observación concreta y evidencia |
|---|---|---|---|
| Coherencia con Ciempi | | | |
| Calidad de ilustración | | | |
| Integración con el cuerpo | | | |
| Legibilidad | | | |
| Originalidad | | | |

- Decisión técnica y artística: listo / requiere ajustes / pendiente de evidencia.
- Cambio significativo de identidad: sí/no, motivos y aprobación si aplica.
- Aprobación del usuario: solo registrar si existe; indicar fuente y alcance.
- Limitaciones y siguiente acción:
```

Para piezas nuevas, “Antes” puede ser no aplicable; puntuar Después sobre evidencia real. No extrapolar preferencia infantil desde una revisión adulta: las pruebas con niños son una validación distinta.

## 13. Cambios de identidad, aprobaciones y registro permanente

**Toda modificación que altere significativamente la identidad visual requiere aprobación explícita del usuario antes de aplicarse a la base o convertirse en nueva referencia.** No interpretar silencio, puntuación alta o aprobación de esta guía como autorización de un rediseño de identidad.

Ejemplos: cambiar permanentemente la forma o proporción de la cabeza, rediseñar sustancialmente el rostro, eliminar el lenguaje de contornos, sustituir la ilustración por 3D/fotorrealismo, cambiar la anatomía o la paleta principal de marca. La diferencia se evalúa respecto a la base, no por el número de líneas modificadas.

No requieren una nueva aprobación especial de identidad los ajustes ordinarios dentro de una tarea autorizada: corregir anclajes, alargar una bufanda, mejorar una suela, proponer una variante cromática o refinar sombras conservando la base. Las máscaras completas y variantes ya solicitadas no deben provocar aprobaciones repetidas por el solo hecho de ocultar la cara. Una autorización explícita existente sigue siendo válida dentro de su alcance.

Para un cambio de identidad, preparar una propuesta concreta y comparaciones separadas de la base vigente, si la tarea autoriza esa exploración. Explicar qué rasgo cambia y por qué; pedir aprobación citando esta sección. Hasta recibirla, mantener la base vigente. Si solo está autorizada documentación, presentar la propuesta documental sin generar cambios artísticos.

Registrar futuras decisiones artísticas aprobadas en la tabla siguiente, añadiendo filas sin borrar historia. Incluir fecha, decisión, alcance, evidencia de aprobación y referencia visual/versionada. Una decisión nueva debe indicar cuál sustituye. Si no hay enlace persistente al mensaje, guardar una cita fiel y contexto identificable; no inventar enlaces ni atribuir aprobación al usuario por una recomendación del agente. Las fichas detalladas viven junto a las comparaciones; enlazarlas desde el registro.

| ID | Fecha | Decisión y alcance | Fuente de aprobación / referencia | Sustituye |
|---|---|---|---|---|
| AD-001 | Registrada 2026-10-28 | Base ilustrada v2: anatomía con piernas más anchas, paso curvo y cabeza redonda. No aprueba todo el vestuario posterior. | Historial del usuario: “asi esta perfecto me gusta mucho”, seguido del ajuste explícito de cabeza redonda; [base vigente](docs/rediseno-ciempi/ciempi-ilustracion-v2.svg) y contexto en [PLAN](docs/rediseno-ciempi/PLAN.md). | Descripciones anteriores incompatibles de anatomía. |
| AD-002 | Registrada 2026-10-28 | Sin ropa; máscaras en Gorros y máscaras; capa/mochila como alternativas de Espalda; capas visibles delante del cuerpo. | Solicitudes explícitas del usuario en el historial de vestuario; contexto en [confección y acabados](docs/rediseno-ciempi/armario/CONFECCION-Y-ACABADOS.md). No implica aprobación artística de cada pieza. | Categorías históricas de ropa y capas/mochilas simultáneas. |
| AD-003 | 2026-10-28 | Autorizar esta documentación, jerarquía visual, reglas obligatorias/flexibles, rúbrica de cinco dimensiones y aprobación explícita de cambios significativos de identidad. | Mensaje del usuario: “Apruebo la estructura propuesta…” y “Alcance autorizado: únicamente documentación”. | Propuesta documental anterior sin estos cuatro ajustes. |
| AD-004 | 2026-10-28 | B01 aprobado artísticamente para el laboratorio, pendiente de integración futura al juego. Bufanda acolchada de 16 colores B-calco-32, maestro transparente v1, seis variantes y geometría compartida; conservar exactamente, sin nuevas versiones. | Usuario: “APRUEBO la bufanda acolchada de 16 colores, basada en `B-calco-32.svg`, como nuestro diseño maestro final de B01”, y aprobación explícita de las seis variantes. [Registro de cierre](docs/rediseno-ciempi/laboratorio/aprobaciones/B01-v1.md). | Estado pendiente de aprobación de B01. Las microjuntas y el solape de flecos con zapato quedan aceptados, no eliminados; no bloquean el cierre artístico y se conservan para compatibilidad final. |
| AD-005 | 2026-10-28 | Plan de B02 aprobado: conservar 19 opciones, organizar familias/variantes/colecciones y explorar ajustes localizados. Las nuevas paletas requieren revisión del usuario; B01 permanece congelado. | Usuario: “apruebo tu propuesta”, en respuesta a la [propuesta de B02](docs/rediseno-ciempi/revisiones/B02-auditoria-paletas-v1/PROPUESTA.md). | Estado pendiente del plan; no aprueba colores futuros ni producción. |
| AD-006 | 2026-10-28 | B02: aprobadas Bosque M1, Ravenclaw M1 y Voldemort M1; conservar IDs y las otras 16 paletas. Cierre artístico para laboratorio tras validación, pendiente de integración futura al juego. B03 solo auditoría/propuesta. | Usuario: “Apruebo artísticamente las tres propuestas cromáticas”; [cierre y pruebas](docs/rediseno-ciempi/laboratorio/aprobaciones/B02-v1.md). | Sustituye la elección anterior de conservar Bosque actual; ahora se adopta Bosque M1. No autoriza implementación de B03. |
| AD-007 | 2026-10-28 | B03: autorizada producción experimental completa mediante exploración IA, selección provisional autónoma, componentes faciales editables y pruebas en el laboratorio. Mantener base, B01 y B02; no avanzar B04. Los diseños siguen pendientes de aprobación artística. | Usuario: “Te autorizo a desarrollar el batch completo dentro del laboratorio experimental” y “Al finalizar, yo revisaré las expresiones”. [Recursos y revisión](docs/rediseno-ciempi/revisiones/B03-produccion-ia-v1/REVISION.md). | Sustituye únicamente la restricción de AD-006 que limitaba B03 a auditoría/propuesta. No sustituye aprobaciones de B01/B02 ni aprueba los nuevos gestos. |

La fecha de registro de decisiones históricas no pretende establecer una fecha de aprobación no comprobada. No marcar como aprobados los futuros rediseños de bufandas, lentes, capas o paletas por estar recomendados en la auditoría. Actualizar la versión de esta guía cuando cambien reglas o referencias aprobadas y conservar la trazabilidad.

## Decisiones añadidas · B04–B08

| ID | Fecha | Decisión y alcance | Fuente / evidencia | Sustituye |
|---|---|---|---|---|
| AD-008 | 2026-10-28 | B04 y B05 aprobados artísticamente para laboratorio; conservar 12 lentes, acabados, cicatriz y 11 peinados. Pendiente integración futura al juego. Arcoíris y Llamas conservan observaciones menores aceptadas. | Usuario: “apruebo artísticamente todos los diseños de B04 y B05”. [Cierre](docs/rediseno-ciempi/laboratorio/aprobaciones/B04-B05-v1.md). | Estado de revisión provisional B04–B05. |
| AD-009 | 2026-10-28 | Autoriza producción experimental conjunta B06/B07/B08 y selección autónoma provisional; conservar base y B01–B05. Nuevos diseños pendientes de aprobación final, sin iniciar B09 ni producción. | Usuario: “Te autorizo a completar B06, B07 y B08 de principio a fin para el laboratorio”. | Restricción de no iniciar otros batches en el trabajo anterior. |

| AD-010 | 2026-10-28 | El usuario rechaza B06/B07/B08 v1. Conservar esa evidencia; rehacer los tres batches con generación real IA y revisión autónoma provisional. Usar la referencia de capa localizada en `docs/referencia-artiscita/capa.jpg`, examinada visualmente; no era una carpeta. No sustituir resultados de IA por SVG simples ni cambiar base/B01–B05. | Usuario: “No apruebo las versiones actuales de B06, B07 y B08”; “Quiero que utilices realmente herramientas de generación de imágenes con IA”. [Nueva revisión v2](docs/rediseno-ciempi/revisiones/B06-B07-B08-ia-v2/REVISION.md). | Versiones v1 quedan rechazadas, no aprobadas. AD-009 mantiene su límite experimental; v2 sigue pendiente de aprobación del usuario. |
| AD-011 | 2026-10-28 | Confirmación de aprobación artística B01–B05 para el laboratorio. Actualizar el seguimiento de B03, que aún figuraba pendiente, sin alterar sus recursos. Ninguna aprobación autoriza producción. | Usuario, contexto de la petición actual: “Los batches B01, B02, B03, B04 y B05 ya están aprobados artísticamente para el laboratorio”. | Estado provisional B03 de AD-007; no cambia geometría ni archivos aprobados. |

### Aplicación experimental B06–B08 v2

Se admite PNG transparente cuando conserva mejor el acabado seleccionado. Debe declararse como raster, mantener el maestro IA original, documentar escala/anclajes/planos y verificarlo sobre la base exacta; no presentarlo como SVG editable. Los envoltorios SVG de composición no convierten los píxeles en trazados. Las variantes de una capa reutilizan el mismo PNG y una transformación cromática controlada, sin regeneración de geometría. Esta decisión técnica está dentro de la representación alternativa autorizada; no concede aprobación artística.


## Decisiones B09–B12

| ID | Fecha | Decisión | Fuente y alcance |
|---|---|---|---|
| AD-012 | 2026-10-28 | B06–B08 v2 aprobados para laboratorio; conservar imágenes, geometrías y observaciones. Versiones v1 siguen rechazadas. Personajes exactos pendientes no se consideran aprobados por semejanza temática. | Usuario: «Quiero conservar los diseños entregados y registrar mi aprobación artística para el laboratorio». [Registro](docs/rediseno-ciempi/laboratorio/aprobaciones/B06-B08-v2.md). Sustituye estado pendiente de v2 en AD-010, no autoriza producción. |
| AD-013 | 2026-10-28 | Autoriza producción completa experimental B09–B12 con IA y selección autónoma provisional; incluye superficies de ropa adaptadas a segmentos, nuevos personajes y alternativas originales para temáticas pendientes. Conservar anatomía y B01–B08. | Usuario: «Quiero que completes los cuatro batches de principio a fin». Nuevas piezas pendientes de aprobación final. La autorización de superficies de ropa prevalece sobre la exclusión histórica de ropa de AD-002 solo dentro de este batch y sin alterar la base. |

## Primera integración del personaje · 1.6.0

| ID | Fecha | Decisión | Fuente y alcance |
|---|---|---|---|
| AD-014 | 2026-10-28 | B09–B12 aprobados artísticamente para laboratorio; los doce batches cuentan con aprobación del usuario. | Usuario: «Apruebo artísticamente todos los resultados de B09, B10, B11 y B12 para el laboratorio». No convierte las versiones históricas rechazadas en aprobadas. |
| AD-015 | 2026-10-28 | Autoriza primera integración real, web y APK; crecimiento por reutilización de segmentos y patrones, sin nuevas ilustraciones, sin cambios comerciales ni migraciones de datos. | Usuario: «Te autorizo a modificar el código del juego para integrar el nuevo personaje con crecimiento dinámico». [Implementación y evidencias](docs/integracion-ciempi/ejecucion-v1/RESULTADO.md). No autoriza publicar en producción ni concede aprobación visual automática a nuevas longitudes. |
| AD-016 | 2026-10-28 | Animaciones A01–A12 y E01–E07 aprobadas e integradas en el juego (CIEMPI 2.0.0): rig por partes sobre la composición aprobada, sin redibujar trazados; expresiones B03; efectos gráficos propios. En el juego: reposo y acciones en la portada, Estrenar ropa al cambiar vestuario, caminar/tropezar/celebrar en lectura y Victoria al terminar un libro. | Usuario: «me gustan muchos las animaciones y quiero que los agregues». [Revisión](docs/rediseno-ciempi/laboratorio-animaciones/revision/REVISION.md). Los pendientes registrados (efectos de posición fija, pata delantera tras la cabeza, capas rígidas, Firefox/Safari) siguen abiertos. |
| AD-017 | 2026-11-03 | Cuerpos de Ciempi Dragón (d2) y Ciempi Cuncuna (c2) aprobados: segmentos, siluetas corporales, patas, texturas, colores corporales, patrones, sombras y crecimiento modular A→B→C→D. Los rostros **no** están aprobados: usan demasiado la cara de Ciempi. Fase posterior: rostros propios con IA (Dragón: hocico, nariz, boca, colmillos pequeños, ojos propios; Cuncuna: mejillas, ojos, boca, expresiones más tiernas), con libertad de geometría facial si se conservan expresiones, animaciones y accesorios. | Usuario: «Apruebo completamente los cuerpos actuales de Dragón y Cuncuna… Lo que todavía no apruebo son sus rostros». [Revisión T01](docs/rediseno-ciempi/revisiones/T01-dragon-v1/REVISION.md) y [T02](docs/rediseno-ciempi/revisiones/T02-cuncuna-v1/REVISION.md) en la rama `expansion-v3-integracion`. Solo laboratorio; no autoriza integrarlos al juego ni rediseñar los cuerpos. |
| AD-018 | 2026-11-03 | E08 «Comer» aprobada para integración experimental, desactivada en producción. Boca inicial `b03-sorprendido`; se conserva la variante con carcajada para comparar. Con máscaras que tapan la boca: no dibujar una segunda boca; usar una reacción alternativa (cabeza, cuerpo o efecto) sin alterar la apariencia equipada. | Usuario: «Apruebo la animación de comer para la integración experimental. Prefiero inicialmente la boca sorprendida». [Resultados](docs/expansion-ciempi/animacion/RESULTADOS.md) en la rama `expansion-v3-integracion`. La elección definitiva de la boca queda pendiente de la comparación en el laboratorio. |
| AD-019 | 2026-11-04 | Ciempi Serpiente sin patas: aprobado. Calzado en la Serpiente: con un calzado equipado se muestra **una sola zapatilla, solo en la punta de la cola**, como gag; sin calzado, la cola queda tal cual. Las demás categorías siguen su compatibilidad normal. | Usuario: «lo apruebo lo de la serpiente pero podríamos ponerle una zapatilla en la cola y sería chistoso pero solo en la cola y solo 1». Rama `expansion-v4-arte` (T03). Solo laboratorio; el diseño de la Serpiente (rostro, cuerpo) sigue pendiente de aprobación. Registrado en la copia de la guía de la rama V4; falta sincronizar con la guía de `main`. |
| AD-020 | 2026-11-04 | **Dragón V4 y Cuncuna V4 aprobados completos** (cuerpo + rostro v4b, el que mostraba el laboratorio entregado): cabeza, hocico/boca, ojos, 14 expresiones, antenas/penachos, cuerpo, patas, texturas, sombras, proporciones y crecimiento modular. Son el **diseño base** de sus familias; no se vuelven a corregir ni reemplazar. **Serpiente:** conservar todos los diseños (conceptos s1–s4 y propuestas de rostro) como variantes seleccionables con nombre propio; la zapatilla única en la cola forma parte del diseño aprobado (confirma AD-019). **Camaleón:** conservar todas las variantes, pero todas usan la construcción de ojos de **k3 «Atardecer»** (forma, volumen, elevación, relieve, perspectiva, proporción y posición); entre variantes cambian color, acabado y patrón. **Variantes nuevas** de Dragón (Fuego, Hielo, Nocturno, Tierra, Blanco, Esmeralda) y Cuncuna (Primavera, Frutilla, Arcoíris, Lavanda, Bosque, Dorada) sobre la geometría aprobada: color, patrón y material, nunca anatomía. Modelo: especie → diseño base → variante → producto futuro. | Usuario: «Apruebo el diseño V4 actual del Dragón… No quiero que vuelvas a corregirlos ni reemplazarlos»; «Apruebo el diseño V4 actual de la Cuncuna»; «La zapatilla de la cola me gusta y quiero conservarla»; «Los ojos del diseño K3 Atardecer son mis favoritos». Solo laboratorio y catálogo experimental: sin productos, precios, inventarios ni compras reales. Registrado en la copia de la guía de la rama V4. |
| AD-021 | 2026-11-04 | Corrección de AD-020: el rostro aprobado del **Dragón** es el **v4 (iteración 1, hocico de perfil)**, no el v4b. El Dragón V4 aprobado = cuerpo d2 + rostro v4; todas sus variantes lo usan. La Cuncuna sigue con el v4b. El v4b del Dragón queda conservado como alternativa no elegida. | Usuario: «para el dragón dejaste la variante v4b y la que me gustó del dragón fue la variante v4, la iteración 1; todo lo demás está perfecto». Catálogo experimental `variantes.js` y `V5-variantes/lamina-dragones.png` (la versión con v4b queda como `lamina-dragones-r1-v4b.png`). |
| AD-022 | 2026-11-04 | **Las 23 variantes actuales aprobadas artísticamente para integrarse al juego**: Dragón (clásico con rostro v4, fuego, hielo, nocturno, tierra, blanco, esmeralda), Cuncuna (clásica con rostro v4b, primavera, frutilla, arcoíris, lavanda, bosque, dorada), Serpiente (caramelo, jardín, noche, hoja; zapatilla única en la cola) y Camaleón (lima, arcoíris, tropical, atardecer, pastel; ojos k3). Sin generar ilustraciones nuevas; cuerpos aprobados intactos. | Usuario: «Apruebo artísticamente las 23 variantes actuales para comenzar su integración». Autoriza integración, commits, pull/push y versiones de prueba; migraciones de datos reales y cambios económicos en el servidor requieren autorización específica. |
