# Representación integrada 1.6.0

`VestuarioProvider` carga un manifiesto local y mantiene únicamente una selección de prueba en memoria, aislada por perfil. No concede productos, no escribe almacenamiento y no llama a la API. Al seleccionar un artículo de la tienda histórica se cancela la prueba. La apariencia persistida sigue pasando por el catálogo y los repositorios existentes.

`seleccion.ts` relaciona solo equivalencias visuales comprobadas. Si un campo no tiene equivalencia, se conserva el renderizador clásico completo; nunca se elimina el ID ni el derecho adquirido. Las categorías nuevas se prueban durante la sesión, también al leer. Su comercialización/persistencia necesita otra tarea aprobada.

`arte/` contiene una copia derivada del compositor del laboratorio y sus bibliotecas. No importa recursos desde `docs/` en ejecución. `public/ciempi-v2/` contiene el maestro SVG, fragmentos aprobados, variantes y raster WebP lossless con nombres por contenido. Regeneración opcional: `node scripts/exportar-ciempi-produccion.mjs` (requiere los originales del laboratorio y Sharp ya disponible en este entorno; no se ejecuta en build/deploy).

`pose.ts` recibe la cantidad existente de segmentos. En cinco segmentos conserva el maestro. En otras longitudes clona sus grupos, piernas y zapatos: cola 0 una vez, centrales 1/2/3 cíclicos, delantero 4 una vez y pie de cabeza una vez. Las superficies forman parte del grupo clonado; un reactor delantero no se repite. Cabeza, cuello, mochila y capa permanecen anclados en las coordenadas aprobadas. N=0 muestra cabeza y accesorios de cabeza/cuello; oculta mochila por falta de cuerpo. Las capas siguen el cuello y conservan su longitud propia. La lectura usa `palabrasLeidas` del motor existente, sin un estado de crecimiento nuevo. El ajuste de pantalla es uniforme, nunca estira el personaje.

Las referencias SVG se aíslan por componente y segmento. Se analiza XML solo cuando cambian selección/longitud, no en cada movimiento del dedo. Las animaciones de saludo/baile son de conjunto; no constituyen un nuevo rig articulado.

Validación y límites: `docs/integracion-ciempi/ejecucion-v1/RESULTADO.md`.
