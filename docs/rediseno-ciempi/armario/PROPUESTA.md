# Armario de Ciempi · Primera colección

El personaje ilustrado y su postura curva fueron aprobados por el usuario. Esta entrega desarrolla prendas sobre ese dibujo; no sustituye todavía el renderizador ni el catálogo de compras de la app.

## Abrir y reproducir

- `index.html`: probador local autónomo, funciona al abrirlo sin servidor ni conexión.
- `coleccion-inicial.png`: seis conjuntos de referencia.
- `conjunto-1.svg` a `conjunto-6.svg`: ilustraciones editables de esos conjuntos.
- Regenerar desde la raíz: `node scripts/crear-armario-ciempi.mjs`.
- Las piezas se mantienen en `scripts/lib/armario-ciempi.mjs`. El script usa como base el SVG aprobado, sin alterar su anatomía.

## Selección ya dibujada

Ocho opciones de cabeza (incluye sin gorro), tres de cara (incluye sin lentes), cuatro de zapatos y dos de espalda (incluye sin mochila): 192 combinaciones posibles.

| Prenda | ID existente / propuesta | Trabajo |
|---|---|---|
| Jockey | cabeza-jockey | Conservar el aprobado |
| Gorro de lana | cabeza-gorro-lana | Nuevo tejido, pompón, borde doblado y etiqueta |
| Flor | cabeza-flor | Pétalos voluminosos y hoja, anclada al lateral |
| Orejas de gato | cabeza-orejas-gato | Diadema y orejas con interior rosado |
| Corona | cabeza-corona | Oro, banda y gemas; inclinada con la cabeza |
| Mago | cabeza-mago | Copa doblada, ala amplia y estrella |
| Astronauta | cabeza-astronauta | Visor transparente, reflejo, aro y módulo lateral |
| Lentes | cara-lentes | Montura ajustada a los nuevos ojos |
| Lentes de sol | cara-lentes-sol | Cristales oscuros con reflejos |
| Zapatillas | pies-zapatillas | Conservar el diseño aprobado |
| Botas de lluvia | pies-botas | Caña, borde superior y suela propia |
| Pantuflas | pies-pantuflas | Conejo con orejas y cara |
| Fútbol | pies-futbol | Paneles, franjas y pequeños tacos |
| Mochila exploradora | espalda-explorador (nuevo) | Bolsillo, correas, hebillas y asa |

Sin gorro, sin lentes y sin mochila son estados de retirada, no nuevos artículos para cobrar. La mochila aún no tiene precio y su categoría no existe en la API.

## Revisión del resto de la tienda

| Categoría actual | Decisión propuesta |
|---|---|
| Colores: clásico, océano, bosque, frutilla, sol, lavanda, noche y arcoíris | Conservar. Adaptar cada paleta a luz/sombra consistentes. El clásico nuevo toma naranja, menta y amarillo del dibujo aprobado; mantener una opción turquesa/naranja para quienes prefieran la paleta anterior. No aplicado todavía. |
| Formas: círculo, cuadrado, triángulo, rombo, hexágono, nube, corazón y estrella | Priorizar el cuerpo redondeado aprobado. Posponer la promoción de geometrías; explorar sus motivos como estampados. No convertir compras ni eliminar formas de perfiles existentes automáticamente. |
| Ojos normales y colores azul, verde, miel | Conservar ajustados al tamaño aprobado. |
| Dormilones, guiño, estrellas y corazones | Conservar la propiedad; redibujar sobre los nuevos ojos. Más adelante pueden asociarse a expresiones, sin cambiar silenciosamente un artículo comprado por una animación temporal. |
| Nada / antenas | Antenas como rasgo del personaje en este estudio. Antes de integración, respetar la elección guardada de “nada” y definir un control independiente; ahora las antenas ocupan la misma categoría que el gorro. |
| Lazo, cumpleaños, vaquero, audífonos, pirata, unicornio | Conservar para una segunda tanda. Redibujar cada silueta y comprobar anclajes; no escalar los dibujos anteriores. |
| Lentes de corazón y antifaz | Conservar para segunda tanda; necesitan nuevas posiciones de ojos y revisión de visibilidad. |
| Zapatos clásicos | Diseñar versión sencilla gratuita con volumen; distinguirla de las zapatillas de pago. |
| Payaso y patines | Conservar como calzado especial; comprobar anchura y contacto de ruedas con suelo durante el movimiento. |
| Brillantes | Convertir visualmente en un zapato reconocible con destellos, conservando el ID y la propiedad. La propuesta todavía no está dibujada. |
| Liso, puntos, rayas, estrellas, corazones, flores y huellitas | Conservar; usar motivos pequeños, recortados dentro del cuerpo y debajo de sus brillos. |
| Rayos, llamas y autos | Segunda tanda: simplificar como parches legibles para no saturar segmentos pequeños. |
| Jardín, mar, selva, dulces, nieve y espacio | Conservar y renovar en una sección de escenarios; contrastes moderados detrás del personaje. |
| Manzana, frutilla, plátano, sandía, galleta, pelota, dona, cupcake, pizza y helado | Conservar aparte del vestuario, como elementos de la pista. Redibujar después con la misma iluminación y contorno. |

No se retiraron artículos, se modificaron precios ni se alteró ningún inventario. “Posponer” significa orden de producción, no pérdida de una compra.

## Organización recomendada del producto

1. **Armario:** gorros, lentes, calzado y futuras mochilas; distinguir lo propio de lo disponible en tienda.
2. **Mi aspecto:** colores, ojos y estampados; conservar acceso a formas ya compradas.
3. **Mi rincón:** fondos y, más adelante, decoración.
4. **Mi lectura:** comida y elementos de la pista.

Los conjuntos son sugerencias combinables, no paquetes obligatorios. Ofrecer una opción gratuita atractiva en cada categoría disponible.

## Siguiente implementación

- Extraer el personaje aprobado a componentes que conserven exactamente las proporciones; mantener los SVG de esta entrega como referencia de comparación.
- Definir anclajes comunes: coronilla, centros de ojos, primer segmento para mochila y tobillo para zapatos. Cada zapato rota alrededor del tobillo, con las piernas detrás del cuerpo.
- Conservar IDs actuales para no invalidar inventarios. Agregar `espalda` requiere normalización, repositorios, API y servidor; valor inicial “sin mochila”.
- Resolver compatibilidad de todas las prendas antiguas antes de reemplazar el renderizador global. El probador cubre una primera selección, no todo el catálogo.
- Adaptar después el personaje a la pista de longitud variable y a las animaciones, incluyendo modo tranquilo.
- Integrar prueba de prendas, compra y equipamiento en el vestidor real. Equilibrar precios nuevos con las monedas obtenidas leyendo.

## Validación de esta entrega

Se generaron seis conjuntos SVG y una lámina PNG revisada visualmente. El generador comprobó las 192 combinaciones para IDs únicos y presencia de los grupos de cabeza y piernas; esto no equivale a una revisión visual exhaustiva de cada combinación. Se corrigieron las raíces de las antenas para que se unan a la cabeza también sin jockey.

Verificación adicional en Chromium: selección simultánea de las cuatro categorías, reinicio, clic en todas las opciones, ausencia de errores JavaScript y ausencia de desborde horizontal a 390 px. Esta prueba verifica el probador local, no la tienda ni el cobro de la aplicación.
