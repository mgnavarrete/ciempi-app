# Auditoría crítica del vestuario de Ciempi

28 de octubre de 2026. Alcance: prototipo ilustrado de `docs/rediseno-ciempi/armario`, sus 122 opciones y los conjuntos de demostración. No es una auditoría de la tienda de producción. No se han rediseñado piezas durante esta revisión.

## Dictamen

La base de Ciempi tiene una identidad clara y merece conservarse. El armario todavía tiene calidad de prototipo desigual: conviven piezas convincentes, variantes cosméticas y dibujos que parecen iconos superpuestos. Aumentamos la cantidad antes de consolidar el nivel de acabado. Agregar degradados automáticamente no convierte todos los accesorios en ilustraciones terminadas.

El objetivo no debe ser añadir detalle por todas partes ni buscar realismo fotográfico. Debe ser que cada objeto parezca construido para este personaje: redondeado, expresivo, con peso, material, perspectiva y una silueta reconocible a escala de juego. Cambiar ahora a 3D no resolvería por sí solo ninguno de esos problemas.

## Evidencia y límites

Se renderizaron las 122 opciones sobre una base neutra, agrupadas en nueve láminas; se revisaron también los conjuntos de demostración. La [revisión por pieza](REVISION-POR-PIEZA.md) cubre cada opción. La [galería](index.html) conserva el estado analizado. Los recortes de algunas láminas son deliberados para ampliar detalles y no demuestran recortes dentro de la app.

Hay comprobaciones de igualdad exacta de imágenes rasterizadas a 320 píxeles de ancho, registradas en [verificaciones.json](verificaciones.json). Con el conjunto Spider-Man, las 19 paletas producen solo 11 imágenes distintas. Gryffindor, Ravenclaw, Harry, Hermione, Voldemort, Mickey y Minnie producen una misma imagen en ese conjunto. En Iron Man, Harry y Hermione también coinciden. Esto no implica que esas paletas sean idénticas sin el traje: el dibujo del traje y la máscara ocultan sus diferencias.

No se revisaron visualmente todas las combinaciones posibles ni se hicieron pruebas con niños. Los juicios sobre belleza, expresividad o prioridad son criterios de dirección de arte; las duplicaciones de imágenes y los modelos de calzado compartidos son observaciones comprobables. Las verificaciones técnicas anteriores del generador no acreditaban calidad artística.

## Problemas principales

### 1. Bufandas demasiado pequeñas y escondidas

La ubicación entre cabeza y primer segmento es correcta como intención. Sin embargo, la cabeza tapa gran parte de la vuelta, y el extremo visible es estrecho y corto. A escala de juego parece una corbata o cinta, no una bufanda abrigada. Las franjas muy finas aumentan esa impresión.

Propuesta: mantener el anclaje en el cuello; ampliar primero la porción visible y probar un extremo principal entre 30 % y 50 % más largo como exploración, no como medida definitiva. Darle una curva hacia atrás, sobre el primer segmento, con un segundo extremo más corto. Usar menos franjas, más anchas; nudo con volumen, sombra bajo la cabeza y flecos legibles. No agrandar toda la pieza indiscriminadamente: podría invadir boca y pies. Validar con pelo de Harry, rizos de Hermione y cabeza sin gorro.

Las cuatro casas justifican variantes cromáticas de una misma bufanda bien resuelta. No requieren cuatro dibujos independientes ni pequeñas diferencias artificiales.

### 2. Harry, Hermione y Gryffindor: duplicación conceptual

Las tres paletas no son literalmente iguales. Gryffindor tiene cabeza burdeos; Harry y Hermione usan cabeza clara y cuerpo burdeos/dorado. Entre estos dos últimos, las diferencias de tono son muy pequeñas. Presentarlas como tres grandes novedades infla el catálogo.

Propuesta: una familia Gryffindor compartida por ambas colecciones, con una variante de cabeza natural si aporta valor. Harry se reconoce por pelo, lentes y cicatriz; Hermione, por rizos y bolso. Una pieza puede aparecer en dos colecciones sin duplicarse ni comprarse dos veces. El mismo criterio debe aplicarse a rosas Barbie/Minnie/Jardín y a lentes de corazón/Barbie: mantener diferencias útiles, agrupar recolores como variantes.

### 3. Capas: mejor anclaje, poca diferencia de construcción

Ahora hay broche y pliegues, pero las cinco capas usan prácticamente la misma silueta. El resultado se parece a una pieza triangular rígida con distintos colores y emblemas. El punto de sujeción no basta para transmitir cómo cae la tela sobre un cuerpo horizontal.

Propuesta: construir primero una capa maestra vista de lado, con una pequeña vuelta detrás del cuello y la mayor parte visible por delante del cuerpo, respetando la preferencia del usuario. Los pliegues deben salir del broche; el borde inferior debe tener peso y separación del cuerpo. Diseñar después una capa heroica más firme, una mágica más blanda y otra oscura más pesada. Los emblemas deben deformarse con la tela. Es aceptable que tapen parte del traje; el conjunto debe tener un foco visible, no dos emblemas compitiendo.

### 4. Lentes: ocultar ojos resolvió la superposición, pero quitó expresión

Los lentes de lectura parecen de sol porque son opacos. Además, ojos y cejas están agrupados y se ocultan juntos en varios accesorios. La cara pierde buena parte de su carácter. Estrellas, llamas y arcoíris tienen ideas divertidas, pero todavía parecen formas gráficas más que monturas con puente, patillas y espesor.

Propuesta: mantener lentes oscuros como opción válida y resolver una familia transparente con ojos ajustados y recortados dentro del cristal. Separar cejas de ojos. Conservar mirada, guiño y sonrisa cuando sean visibles. Separar la cicatriz del accesorio óptico para combinarla sin duplicar lentes. Unificar corazones y Barbie como familia con variantes.

### 5. Calzado: la referencia original supera a varias novedades

Las zapatillas turquesa tienen la construcción más coherente. Varios zapatos temáticos reutilizan casi la misma forma y solo cambian color o emblema. Las «Ballerinas Barbie» tienen cordones y forma de zapatilla; las «Botas Superman» no tienen una caña que las haga leer como botas. Las botas Iron Man y lunares resultan demasiado rectangulares.

Propuesta: crear familias reales de silueta —zapatilla, bota, ballerina, pantufla, patín— y tratar los cambios de color como variantes. Revisar cada familia sobre los seis pies, no solo un recorte: abertura, tobillo, giro, altura, suela y sombras. Conservar la curva de marcha aprobada; no obligar a todos los pies a tocar el suelo. Los patines requieren su propio ajuste por el diámetro de las ruedas. La mezcla aleatoria debería usar combinaciones compatibles y colores intencionales.

### 6. Texturas: mejor distribución, integración aún incompleta

Iron Man avanza en la dirección correcta con placas diferentes y un reactor principal; faltan juntas, solapes y una respuesta metálica consistente. Spider-Man distribuye rojo y azul, pero su red aún parece una cuadrícula plana: debería curvarse sobre cada volumen y mantener continuidad visual entre segmentos.

La serpiente dejó de repetirse en cada círculo, pero ahora parece un cordón colocado por encima. Necesita ocultarse parcialmente en solapes y envolver la superficie. Los rayos mágicos son principalmente un rayo frontal y chispas dispersas: falta una composición deliberada. Estrellas, corazones y lazos continúan pareciendo pequeñas pegatinas.

La repetición no es un defecto por sí sola: lunares, escamas y rayas necesitan repetirse. Lo importante es variar escala, densidad y curvatura según el volumen. Pecas y Lunares Minnie deberían ser variantes de una familia si no logran diferenciarse de forma útil. Separar conceptualmente «estampado» de «traje completo»: hoy conviven controles con comportamientos diferentes bajo Texturas.

### 7. Gorros, pelo y máscaras: consistencia desigual

Jockey, flor y orejas con lazo ofrecen buenas bases. Corona, casco guardián, unicornio y pirata necesitan una construcción menos geométrica. La mariposa se confunde con otro lazo; la tiara pierde detalles en pequeño. El casco de astronauta domina excesivamente la cabeza.

Los peinados son una debilidad visible: Harry parece una hilera de picos, Hermione un casquete ondulado y Barbie una masa poco definida. Necesitan mechones agrupados, asimetría, volumen lateral y sombra de nacimiento, sin cubrir la forma redonda de la cabeza.

Spider-Man e Iron Man están más trabajados, pero sus miradas severas cambian el tono del personaje. La mejora debería conservar su temática y adaptar proporciones y gesto a Ciempi. La máscara de Voldemort es la menos coherente con la línea base: plana, poco expresiva y con rasgos demasiado pequeños. La de Kitty es reconocible, pero prácticamente sustituye al personaje; la versión de orejas y lazo conserva mejor su identidad. Esto es una elección artística, no una prohibición de disfrazarlo.

### 8. Mochilas y bolsos: falta explicar cómo se llevan

La exploradora es la mejor base. Varias otras parecen objetos planos pegados al primer segmento: estrella, bolsos de Hermione y Barbie, y propulsores. Las correas añadidas de forma genérica no resuelven cada silueta.

Cada objeto necesita frente, lateral o fuelle, grosor de asa, correa adaptada y sombra de contacto. Cohete y nube merecen volumen propio; el libro tiene especial potencial por conectar con leer, pero debe mostrar lomo, páginas y un soporte creíble. No hace falta llenar todos de costuras pequeñas.

### 9. Rostro y controles: cambios discretos o invisibles

Alegre, guiño y ojos felices funcionan. Curioso apenas se distingue. Dormilón tiene párpados rígidos y, con la sonrisa abierta por defecto, un gesto poco coordinado. Besito parece una figura recortada y merece redibujo. Cambiar el color de ojos reconstruye la geometría mediante otra función: conviene unificarla para que cambiar color no cambie accidentalmente el dibujo.

Los cinco colores de ojos producen la misma imagen con ojos felices cerrados: es natural, pero el probador debe explicarlo. Lo mismo ocurre con controles faciales bajo una máscara completa. Si un traje fija sus propios colores, se debe indicar que su paleta está definida o implementar zonas realmente recoloreables; no presentar elecciones que parecen no funcionar.

## Qué conservar

Cabeza redonda, silueta alargada, marcha curva, piernas gruesas aprobadas, sonrisa, contorno azul oscuro y zapatilla original. Paletas Clásica, Océano, Jardín, Bosque y Noche como punto de partida. Variedad temática, mezcla entre colecciones, exclusividad capa/mochila y máscaras en Gorros y máscaras. El trabajo pendiente no justifica volver a empezar el personaje.

## Orden recomendado de mejora

1. Consolidar catálogo: familias y variantes; paleta de casa compartida; nombres acordes al dibujo; controles que explican cuándo su efecto está oculto.
2. Preparar una muestra de calidad: bufanda larga Gryffindor, capa heroica lateral, lentes transparentes y zapatilla/bota claramente diferenciadas. Comparar cada una con el Ciempi base.
3. Terminar Harry y Hermione como dos conjuntos distinguibles que comparten colores; después Spider-Man e Iron Man con materiales y encajes completos.
4. Extender esas soluciones al resto de familias; rehacer pelo, bolsos planos y piezas menos coherentes. Posponer novedades hasta cerrar este acabado.
5. Revisar combinaciones reales y escala de juego, y después validar preferencia y reconocimiento con usuarios infantiles. No inferir gustos de niños solo del criterio adulto.

## Criterios de aceptación artística

- La pieza se reconoce por silueta o un rasgo principal sin leer el nombre.
- El anclaje explica dónde se apoya: cuello, cabeza, espalda o tobillo.
- Luz principal superior izquierda y sombras compatibles con la base; sombra de contacto donde toca al cuerpo.
- Tela, metal, pelo, goma y vidrio tienen tratamientos distintos. No aplicar el mismo brillo a todo.
- El detalle sobrevive al tamaño real de la app. Comparar también a 240 y 320 px de ancho; evaluar accesorios de cara en miniaturas del selector.
- No hay huecos involuntarios, piezas que flotan, ojos duplicados ni emblemas cortados sin intención.
- El conjunto mantiene jerarquía: una pieza protagonista y complementos que acompañan.
- Un cambio comprado se percibe; un recolor se presenta como variante, no como un diseño totalmente nuevo.
- Se conserva la identidad de Ciempi salvo cuando se elige expresamente una máscara completa.

## Herramientas y mantenimiento

No hace falta comprar herramientas para esta fase. El sistema SVG actual permite corregir geometría, capas, máscaras de recorte y materiales. El generador de auditoría `scripts/auditar-vestuario-ciempi.mjs` crea láminas reproducibles y comprobaciones visuales con Sharp. La ilustración exige decisiones por pieza, no solo más efectos automáticos. El generador se ejecuta desde la raíz con `node scripts/auditar-vestuario-ciempi.mjs`.

Los dictámenes son manuales y corresponden a esta versión. Si cambia el catálogo, regenerar las láminas no actualiza automáticamente la revisión escrita: deberá revisarse de nuevo.
