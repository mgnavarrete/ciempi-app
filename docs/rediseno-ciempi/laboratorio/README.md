# Laboratorio artístico principal de Ciempi

Fase A: diseño, revisión y aprobación del vestuario completo. Fase B: integración en producción solo con autorización expresa. No hay conexión con inventarios, monedas, compras, precios, servidor ni persistencia del juego.

## Abrir

Desde la raíz del repositorio, con Python existente:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Abrir http://localhost:8765/docs/rediseno-ciempi/laboratorio/ . Es necesario HTTP por los módulos y fetch; no abrir index.html mediante file://. Si el puerto ya está servido, basta abrir la URL. La sesión de desarrollo puede terminar: el comando permite reiniciarla. No requiere npm install ni cambiar package.json.

## Reutilización y aislamiento

El laboratorio importa sin modificar scripts/lib/armario-ciempi.mjs, colecciones-personajes.mjs y acabados-armario.mjs. Conserva su base y catálogo real. Reutiliza el patrón de selección, filtros por colección, miniaturas, composición y restauración del probador previo, con una interfaz propia en esta carpeta. No se regeneró armario/index.html ni la auditoría histórica. No hay una copia de las geometrías del catálogo en este laboratorio: se referencian sus fuentes.

catalogo.json es el índice central: apunta al catálogo histórico, la base aprobada y recursos experimentales. Las piezas históricas no cuentan como nuevos diseños aprobados. Los hashes de las fuentes utilizadas están en pruebas/baseline.json. Si estas fuentes cambian posteriormente, hay que repetir las pruebas.

## Cambio mínimo cuello / espalda

cargar-catalogo.js agrega selection.cuello y mantiene selection.espalda. Las cuatro bufandas históricas se filtran fuera de Espalda. compose sigue recibiendo una sola mochila o capa, manteniendo exclusión mutua. Después se analiza su SVG mediante DOMParser y se insertan los dos planos de la bufanda, sin modificar el compositor original ni el SVG base:

1. Cuerpo y plano posterior de espalda (compositor existente).
2. Plano posterior de bufanda, antes de head.
3. Cabeza.
4. Plano delantero de espalda (neck-front existente).
5. Plano delantero de bufanda, antes de face-accessory.
6. Lentes y gorros, conforme al compositor.

Se procesan conjuntamente ambos fragmentos para conservar referencias compartidas; se aplica namespace a IDs y referencias de la bufanda. Cada vista/miniatura es una imagen SVG independiente, evitando colisiones entre documentos. No se admite equipar dos accesorios de espalda. Gorros/peinados/máscaras siguen compartiendo cabeza. Una máscara bloquea controles de lentes; expresiones y colores siguen disponibles aunque una pieza pueda ocultarlos.

El orden es explícito, provisional para revisión artística. Permitir selección simultánea no garantiza que todos los diseños históricos combinen bien. Si un futuro diseño requiere intercalados adicionales, se evaluará antes de ampliar el compositor; no se cambiará la anatomía para encajarlo.

## Funciones operativas

Categorías, accesorios reales, colección como filtro sin impedir mezclas; cuerpo/ojos/expresiones/bocas; cuello independiente; comparación anterior/nuevo donde existe compararCon; ampliación de cuello; tamaños SVG nominales 240/320; fondo claro/oscuro; restauración exacta de selección inicial y controles; estados históricos/en revisión y concepto elegido; seguimiento de 12 batches.

El recurso bufanda-b-tecnica es el ensayo vectorial anterior del adaptador, NO la nueva B acolchada. Solo tiene su color original disponible. B acolchada aparece como concepto raster no equipable con dirección elegida, pendiente de ajustes, vectorización y validación. No se publican seis recolores ficticios.

Las vistas 240/320 son referencias de tamaño para diseño, no una certificación de todas las pantallas/animaciones del juego.

## Variantes y recursos nuevos

Una construcción tiene ID y versión estables, geometría compartida y variantes declarativas. El cargador soporta colores por data-color-role en formas/stop; valida la función y cambia fill o stop-color, nunca coordenadas. La prueba de este mecanismo usa un recurso real con una función temporal en memoria y no crea una variante de catálogo aprobada. La nueva B aún necesita una geometría etiquetada y sus seis variantes revisadas.

Los futuros archivos canónicos irán en recursos/<construccion>/<version>/ (maestro.ai, exportado.svg, manifiesto.json, accesorio.json y variantes.json). Crear esas carpetas cuando existan recursos reales. Generaciones IA, evidencia, descartes y propuestas anteriores se conservan en revisiones/ y se enlazan, sin duplicar geometría. El esquema actual carga los dos planos de una bufanda; añadir nuevos recursos de otras familias se hará en su batch con su contrato específico, no por una supuesta compatibilidad universal.

## Pruebas ejecutadas

Microsoft Edge instalado, modo headless, sin instalar dependencias y usando perfiles temporales separados. Prueba real de HTML, módulos y acciones de interfaz en pruebas/navegador.html. Ver pruebas/resultado-navegador.json: 31 comprobaciones afirmativas, incluyendo render XML de 124 opciones reales, IDs únicos y referencias resueltas con todas las opciones actuales de espalda, restauración exacta y mecanismo de recolor. Inspección visual de pruebas/laboratorio.png.

No se hicieron pruebas de inventario/persistencia porque no forman parte de esta aplicación. No se certifica compatibilidad visual exhaustiva ni producción React. No se evaluó aquí una nueva pieza artística; no corresponde asignar nuevas puntuaciones de belleza. El visor comparativo informa cuando un recurso no tiene versión anterior asociada.

## Siguiente paso B01

Ajustar collar y flecos de B acolchada sobre la base exacta; preparar vector editable con planos de cuello; revisar maestro; producir Gryffindor, Slytherin, Ravenclaw, Hufflepuff, Océano Coral y Lavanda Mágica con la misma geometría; probar combinaciones y registrar aprobaciones explícitas. No se inició ese rediseño durante la construcción del laboratorio.

## B01 — seis variantes de B-calco-32

Desde la raíz del repositorio, si no hay servidor activo:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Abrir `http://localhost:8765/docs/rediseno-ciempi/laboratorio/`. Usar HTTP, no `file://`, porque los módulos y catálogos se cargan mediante fetch.

En **Bufandas**, seleccionar **Bufanda acolchada · seis colores**. El selector de variantes ofrece Gryffindor, Slytherin, Ravenclaw, Hufflepuff, Océano Coral y Lavanda Mágica. Cambiar cabeza/espalda/colores independientemente, activar comparación, detalle o fondo oscuro. **Sin bufanda** retira solo el cuello; **Restaurar** devuelve la selección inicial.

Una geometría en `recursos/bufanda-calco32/v1/maestro.svg`, seis mapas de relleno en `paletas.json`. Se conserva `viewBox="0 0 1200 780"`. La colocación común vive en `catalogo.json`: escala uniforme 0.7, traslación (103,75), separación de planos en y=340 del maestro. El maestro se referencia dos veces con `use` y recortes complementarios; no se duplica la lista de trazados.

Estado: producción experimental disponible para revisión artística. Los flecos cortos se superponen parcialmente al zapato delantero. Ver [informe y láminas](../revisiones/B01-calco32-produccion-v1/REVISION.md). Las opciones históricas siguen disponibles. Esta integración no modifica React, inventarios ni compras.

### Estado vigente de B01

B01 está **aprobado artísticamente para el laboratorio — pendiente de integración futura al juego**, según [aprobación definitiva](aprobaciones/B01-v1.md). Este estado sustituye el texto histórico «disponible para revisión» anterior. Las microjuntas y el solape con zapato están aceptados y registrados; no seguir perfeccionando B01. B02 comienza en auditoría/propuesta, sin cambios cromáticos activos.

## B03 — probar expresiones

Abre Expresiones: las primeras 14 opciones son gestos coordinados en revisión; las cinco anteriores se conservan al final. Cambia el iris en Ojos, activa Anterior / nuevo y Ampliar detalle para comparar el rostro. Las bocas históricas solo se mezclan con las expresiones anteriores. Máscaras, lentes opacos y ojos cerrados indican cuándo ocultan la mirada. Restaurar Ciempi recupera la selección original. [Galería](../revisiones/B03-produccion-ia-v1/comparaciones/galeria.png) · [Informe](../revisiones/B03-produccion-ia-v1/REVISION.md).

## B04 + B05 — lentes y peinados

Selecciona Lentes, Peinados y Detalles faciales. Los recursos nuevos aparecen primero; los lentes y peinados históricos se conservan. Acabado de lentes ofrece Rosa Barbie en Corazones y Bronce mágico en Redondos. Elegir pelo quita el gorro; volver a un gorro oculta el pelo y lo explica. Anterior / nuevo compara la categoría activa, manteniendo la expresión y los demás accesorios cuando se compara B04/B05. Ampliar detalle encuadra el rostro o todo el peinado según la categoría. [Galerías, límites y pruebas](../revisiones/B04-B05-produccion-v1/REVISION.md).

## B06–B08 · revisión conjunta

B04 y B05 están aprobados para laboratorio: [registro](aprobaciones/B04-B05-v1.md). Los SVG aprobados no se modificaron.

En **Gorros y máscaras** aparecen 21 gorros y ocho máscaras nuevos/rediseñados; en **Mochilas y capas**, ocho capas. Los antiguos siguen disponibles después de los nuevos. En Colección, usar **Todas** para ver el catálogo completo. Combinar con Lentes y Expresiones; las máscaras excluyen lentes y pelo. Las capas admiten Bufandas y excluyen mochilas.

[Galerías y evaluación](../revisiones/B06-B07-B08-produccion-v1/REVISION.md). B06, B07 y B08 están En revisión artística; B09 no iniciado. El laboratorio sigue requiriendo HTTP (por ejemplo `python3 -m http.server 8765 --bind 127.0.0.1` desde raíz).

## Estado vigente B06–B08 v2 · generación real IA

Las versiones v1 fueron rechazadas por el usuario y permanecen accesibles con **Mostrar diseños históricos**. La selección v2 reúne 6 gorros, 5 máscaras y 2 construcciones de capa (5 acabados en total), todos pendientes de aprobación artística. Son PNG transparentes de IA, no vectores editables. Catálogos: `recursos/gorros/v2`, `recursos/mascaras/v2`, `recursos/capas/v2`.

Usar **Gorros y máscaras**, **Mochilas y capas**, **Color de capa**, el filtro **Novedades** y las siete tarjetas de conjuntos. Cuello permanece independiente. Las máscaras completas ocultan expresión/iris; los antifaces permiten verlos. Pelo y gorros siguen excluyéndose. La restauración recupera la base original.

[Galerías, decisiones y resultados reales](../revisiones/B06-B07-B08-ia-v2/REVISION.md). B01–B05 están aprobados solo para laboratorio y sus recursos no se alteraron. B06–B08 v2: **En revisión artística — Pendiente de aprobación del usuario**. No se autoriza integración al juego por superar pruebas.

## B09–B12 · entrega experimental v1 (2026-10-28)

Disponibles 5 mochilas/bolsos, 5 construcciones de calzado, 5 superficies corporales y 10 conjuntos. AraLuz y Ratón Atlas añaden dos accesorios de cabeza originales. Todos pendientes de aprobación artística. B06–B08 v2 quedan aprobados para laboratorio según el nuevo registro; no se altera su arte.

Selecciona Espalda, Calzado o Superficies y estampados; el filtro Novedades muestra los recursos recientes. Los botones de los diez conjuntos equipan combinaciones completas. Comparar muestra la referencia histórica asociada, no necesariamente un antecesor idéntico. Quitar y Restaurar recuperan la base. Las mochilas excluyen las capas; bufandas independientes. Los materiales nuevos tienen colores propios. Con cabeza descubierta la paleta cambia la cabeza; si una máscara y el material la ocultan, el control queda desactivado. Las máscaras completas también desactivan los gestos e iris invisibles.

[Informe y galerías](../revisiones/B09-B12-ia-v1/REVISION.md). Los PNG son los maestros raster funcionales; su composición SVG no los convierte en trazados. `accesorios-cuerpo.js` contiene el adaptador localizado. Los catálogos versionados están en `recursos/{mochilas,calzado,superficies,personajes,conjuntos}/v1/`. Ningún conjunto duplica los archivos de las piezas que selecciona.

Los recursos nuevos suman aproximadamente 22 MB: adecuados para revisión local, pendientes de optimización de entrega y evaluación móvil antes de la futura Fase B.
