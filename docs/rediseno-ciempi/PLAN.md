# Rediseño de Ciempi

Inicio: 2026-10-28. Alcance inicial: Ciempi; otros personajes después.

## Estado

Última entrega: [colección ampliada](armario/COLECCION-AMPLIADA.md), con cabeza circular, 11 categorías, ropa, capas, mezcla de zapatos, paletas, texturas y expresiones estáticas. [Probador actualizado](armario/index.html) y [nueve conjuntos](armario/coleccion-ampliada.png). Continúa siendo un estudio local, pendiente de integración en la aplicación y sus compras.

Actualización: el usuario aprobó la anatomía ilustrada v2 con piernas más anchas y zapatos en arco. Se creó una [primera colección y probador del armario](armario/index.html), con [revisión completa del catálogo y propuesta de continuidad](armario/PROPUESTA.md). Se conserva la distinción entre exploración visual e integración real: la nueva tienda y sus compras todavía no están implementadas.

- [x] Revisar personaje SVG, catálogo y vestidor actuales.
- [x] Generar comparación de tres direcciones visuales usando el logo como referencia.
- [x] Elegir dirección visual con el usuario: opción 01, ilustración.
- [ ] Construir personaje modular y primera colección.
- [ ] Integrar animaciones y vestidor.
- [ ] Equilibrar recompensas y ampliar catálogo.
- [ ] Validar en dispositivos y con usuarios.

El usuario eligió la opción 01, ilustración. Primera pasada implementada en los SVG compartidos: sombras y brillos del cuerpo y cabeza, mejillas, sonrisa, antenas, jockey, gorro de lana y zapatillas. Se conservan IDs del catálogo, precios y estructura de apariencia. Esta pasada no completa la colección ni las nuevas expresiones.

[Vista de la implementación](ilustracion-implementada-v1.png). Renderizada desde los componentes reales mediante React y Sharp, sin IA. Falta validación interactiva en dispositivo. Dirección visual: contorno azul oscuro, colores de las paletas existentes, iluminación superior izquierda, sombras dibujadas y detalle limitado para lectura móvil.

## Primera entrega: exploración visual

### Corrección de dirección tras la primera implementación

El usuario rechazó la implementación v1 por parecerse demasiado al personaje anterior. Se acordó redibujar primero una ilustración estática fiel al Ciempi con jockey de la primera columna, antes de adaptarla al sistema interactivo.

Entrega v2: [comparación visual](comparacion-v2.html), [SVG editable](ciempi-ilustracion-v2.svg), [presentación PNG](ciempi-ilustracion-v2-presentacion.png). Generación determinista desde `scripts/crear-ciempi-ilustracion-v2.mjs` con SVG y Sharp; no se utilizó generación de imágenes para esta entrega.

Cambios: anatomía nueva, cabeza grande y asimétrica, ojos separados, segmentos superpuestos, paleta menta/amarillo/naranja, jockey inclinado y seis zapatillas de silueta definida. Grupos identificados para cuerpo, cabeza, ojos, jockey, antenas y piernas/calzado.

Corrección de postura: después de verificar las uniones con todas las suelas alineadas, el usuario pidió piernas algo más anchas y una disposición curva como en la referencia. Las piernas pasan de 24 a 32 unidades de ancho en su origen y de 24 a 28 en el tobillo. Las zapatillas siguen un arco suave con alturas y giros distintos, pivotando sobre el tobillo; algunas se levantan como durante un paso. Cada pierna empieza dentro del cuerpo y termina dentro del calzado. Las sombras se atenúan bajo los pies elevados. Se revisó visualmente el PNG regenerado.

Estado: propuesta estática para revisión, no integrada en la app. Todavía no es un sistema de piezas animables: las piernas se agrupan por debajo del cuerpo y deberán vincularse a los segmentos; los anclajes de lentes y otros accesorios deben recalcularse. La primera implementación en la app no representa el objetivo final. Falta revisión del usuario antes de extender esta nueva anatomía al catálogo.

[Comparación de estilos](exploracion-visual-v1.png): ilustración, juguete suave y plastilina. Generada con la herramienta integrada de imágenes a partir de `logo/ciempi-app-logo.jpg`. Ver el prompt completo en `PROMPT.md`.

Esta lámina es arte conceptual, no un modelo 3D ni un recurso listo para animación. Permite comparar materiales, contornos, volumen y personalidad. No supone que un SVG vaya a reproducir exactamente un render.

Observaciones de revisión:

- Se conserva la identidad de cara naranja, ojos grandes, segmentos y zapatillas.
- La opción 02 ofrece la dirección recomendada de volumen suave.
- El generador mantuvo el jockey en la fila superior, aunque se pidió una versión sin equipamiento; falta dibujar la cabeza base descubierta.
- En la fila inferior se mezclan viseras y gorros de lana. Cada accesorio definitivo debe tener una silueta independiente.
- El número y la distribución de segmentos y patas deberán normalizarse en el modelo modular.
- La expresión de concentración parece enfadada. Debe sustituirse por atención curiosa, sin transmitir juicio al lector.
- Los pequeños apoyos bajo la cara no definen una nueva anatomía: evitar manos sueltas en las expresiones definitivas.

## Hito A: identidad y guía de producción

Elegir estilo; refinar cabeza sin accesorios, cuerpo horizontal y expresiones de alegría, curiosidad, atención, sorpresa y descanso. Definir paleta, iluminación superior izquierda, sombras, contornos y detalle mínimo a tamaño móvil.

Revisar a 64, 160 y 320 píxeles de ancho. La variante pequeña puede omitir textura, pero debe conservar silueta y expresión. Las posiciones de los accesorios deben coincidir entre poses.

Salida: guía visual y personaje base aprobado visualmente.

## Hito B: primera experiencia completa

1. Construir piezas SVG con identificadores únicos para degradados y máscaras. Mantener compatibilidad con las paletas y apariencias guardadas.
2. Definir anclajes para cabeza, cara, espalda y pies; orden de dibujo: piezas traseras, patas traseras, cuerpo, patas delanteras, cabeza, cara y accesorios frontales. Ajustar por pieza cuando corresponda.
3. Probar longitud variable: el personaje de portada y los segmentos de la pista de lectura comparten recursos; no fijar la anatomía a cinco segmentos.
4. Crear gorro de lana, jockey, casco espacial, lentes, zapatillas, botas, pantuflas, mochila exploradora, mochila cohete y diseño de estrellas. Renovar jardín y espacio.
5. Añadir reposo, saludo, reacción a equipar y celebración breve. El modo tranquilo debe reducir movimiento y efectos.
6. Integrar la colección en un vestidor con personaje grande, prueba inmediata, precio, saldo y estados claros.

Salida: lectura → monedas → prueba → compra → equipamiento, funcionando con la nueva dirección visual.

## Hito C: catálogo, progresión y persistencia

- Renovar el catálogo existente por colecciones coherentes.
- Añadir conjuntos guardados y lista de deseos.
- Revisar precios con los ingresos reales por sesión; reconocer esfuerzo y progreso, sin exigir velocidad.
- Nuevas categorías, como espalda, necesitan cambios coordinados en tipos, normalización, repositorios locales, API y servidor.
- Mantener los IDs existentes y las compras previas. Los datos antiguos sin nuevos campos deben recibir valores iniciales válidos.
- Mantener validación de propiedad y cobro en servidor. Las animaciones o previews no conceden artículos.
- Verificar estados de compra pendientes y errores de red; evitar cobros duplicados según el contrato existente.

Salida: catálogo renovado, datos compatibles y progresión comprensible.

## Hito D: mundo y validación final

Crear rincón de lectura, decoración, acompañantes y animaciones desbloqueables. Ampliar por colecciones terminadas: espacio, bosque, lluvia, magia y descanso.

Validación:

- Tamaños móvil/tablet, orientación vertical/horizontal y longitud variable del personaje.
- Combinaciones de accesorios: clipping, anclajes, superposición y legibilidad.
- Rendimiento en un Android representativo, carga y funcionamiento offline donde ya esté soportado.
- Modo tranquilo y preferencia de movimiento reducido.
- Conservación de monedas, inventario y apariencia de perfiles anteriores.
- Pruebas de compra y persistencia en los repositorios afectados.
- Sesiones observadas con niños y acompañamiento adulto; edades y dispositivos objetivo por concretar antes de esta evaluación.

No marcar esta validación como completada únicamente por pasar pruebas automáticas.

## Herramientas y decisiones

- IA integrada: exploración de estilo y referencias de colecciones.
- SVG/React/CSS: implementación inicial, reutilizando el sistema actual.
- Rive: evaluar solo si una prueba demuestra ventajas de animación sobre la implementación existente.
- Blender: alternativa si se elige producción tridimensional. No instalado ni requerido para esta primera entrega.
- Evitar incorporar varias tecnologías de animación antes de validar una necesidad.

## Después: otros personajes

Cuncuna y serpiente reutilizarán inventario, tienda, colecciones y eventos. Cada especie tendrá anatomía, anclajes y animaciones propios. Definir compatibilidad explícita por categoría: una serpiente no recibe automáticamente zapatos. No implementar especies adicionales antes de cerrar la experiencia de Ciempi.
