# Colección ampliada · Cabeza redonda y nuevas categorías

## Entrega

- Abrir `index.html` localmente: probador autónomo, sin servidor ni conexión.
- `coleccion-ampliada.png`: nueve combinaciones para revisar la dirección visual.
- `conjunto-1.svg` a `conjunto-9.svg`: versiones vectoriales de esa lámina. Sustituyen las seis combinaciones de la primera entrega; `coleccion-inicial.png` conserva la lámina histórica.
- Regenerar: `node scripts/crear-ciempi-ilustracion-v2.mjs` y luego `node scripts/crear-armario-ciempi.mjs`.

## Cambios solicitados

La cabeza usa ahora un círculo de radio 130, centrado en (736, 340), tanto para el relleno/contorno como para el recorte de sus sombras. Se revisa descubierta en el primer conjunto. El cuerpo, las piernas más anchas y el paso curvo se conservan.

| Categoría | Opciones, incluidos estados sin prenda |
|---|---|
| Gorros · 16 | Sin gorro, jockey, lana, corona, mago, astronauta, flor, orejas de gato, lazo, tiara, verano, mariposa, audífonos, capitán, casco guardián y unicornio |
| Lentes · 9 | Sin lentes, lector, sol, corazones, estrellas, llamas, arcoíris, visor cósmico y antifaz guardián |
| Calzado · 9 | Zapatillas, botas de lluvia, pantuflas, fútbol, patines, ballerinas, botas lunares, botines de aventura y mezcla por pie |
| Mochilas · 6 | Sin mochila, exploradora, cohete, nube, libro de hechizos y bolso estrella |
| Ropa · 5 | Sin ropa, camisa de explorador, polerón de estrellas, falda de fiesta y camiseta guardiana |
| Capas · 4 | Sin capa, guardiana con rayo, magia celeste con luna/estrella y aurora con corazón |
| Colores · 5 | Clásico, océano, jardín rosa, bosque y noche mágica |
| Texturas · 6 | Liso, pecas, estrellas, corazones, escamas suaves y rayas |
| Gestos · 5 | Alegre, guiño, ojos felices, curioso y dormilón |
| Ojos · 5 | Azul oscuro, azules, verdes, miel y violetas |
| Bocas · 4 | Sonrisa, risa, sorpresa y besito |

Total: 74 opciones distribuidas en 11 categorías. No son 74 productos cobrables: incluyen retirar prendas, aspectos y estados.

Todas las prendas son combinables por cualquier niño. Los temas son diseños propios de magia celeste, fiesta aurora, jardín y guardianes: no se han utilizado nombres, logos ni atuendos de franquicias.

## Comportamiento del probador

- Categorías con miniaturas que muestran cómo se ve cada elección en el personaje actual.
- Selector de nueve conjuntos; pueden modificarse libremente después de aplicarlos.
- Mezcla de zapatos mediante semilla: seis modelos distintos elegidos de los ocho disponibles. La combinación no cambia al seleccionar ropa, gorros u otros rasgos; “Volver a mezclar zapatos” genera otra distribución.
- Colores y texturas actúan sobre el personaje, no recolorean indiscriminadamente los accesorios. La ropa tiene sus propios colores y diseños.
- Ropa sobre el segmento delantero; capas detrás del cuerpo y mochilas delante de la ropa, detrás de la cabeza. Algunos accesorios pueden ocultarse parcialmente por estas superposiciones.
- Las expresiones son poses estáticas en esta entrega; el guiño no es aún una animación temporizada.
- Sin persistencia de elecciones al recargar y sin conexión al inventario o compras reales.

## Implementación

`scripts/lib/armario-ciempi.mjs` comparte piezas y composición entre la lámina y el probador. `scripts/lib/armario-probador.js` contiene la interacción del HTML autónomo. Los nuevos IDs son propuestas del estudio y no se añadieron al catálogo del servidor.

Antes de integrar en la app: definir campos de ropa/capas/gestos y semilla de mezcla, migrar datos con valores iniciales, conservar los IDs comprados y limitar la mezcla de calzado a lo que pertenezca al niño. Adaptar la anatomía a la longitud variable de la lectura y respetar el modo tranquilo. No presentar este estudio como una tienda desplegada.

## Verificación

- Generación y revisión visual de la lámina y las capturas en escritorio/móvil.
- 242 casos de composición: cada opción, pares de gorro/lentes y semillas de mezcla; presencia de anatomía e IDs SVG únicos. No equivale a revisar todas las combinaciones posibles.
- Prueba de navegador: las 74 opciones, las 11 categorías y los nueve conjuntos; selección activa y reinicio; mezcla estable al cambiar el gorro y diferente al solicitar otra; cabeza circular; sin errores de JavaScript ni desborde horizontal a 390 px.
- No se alteró el código productivo de la aplicación en esta entrega, por lo que estos resultados validan el probador local.
