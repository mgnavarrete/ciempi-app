# Primera integración real de Ciempi — 1.6.0

28 octubre 2026. Integración técnica experimental autorizada; no publicada. Arte B01–B12 aprobado por el usuario. Las nuevas longitudes y la integración quedan disponibles para su revisión.

## Qué está implementado

- Nuevo Ciempi en los componentes reales de biblioteca, personalización, presentación y lectura; composición SVG + imágenes transparentes. No hay generación de nuevas ilustraciones.
- Selector de prueba de todas las familias aprobadas y diez conjuntos dentro de **Personalizar → Nuevo Ciempi · probar vestuario**. La selección acompaña la lectura durante la sesión. Quitar piezas, colores de ojos, expresiones, variantes y retorno a apariencia guardada.
- Gorros y peinados respetan compatibilidades; máscara oculta lentes/pelo y, cuando corresponde, rostro. Espalda excluyente entre capa/mochila; cuello independiente. Se avisa de ojos/gestos fijos y materiales corporales con colores propios.
- **No es una migración comercial**: no añade productos ni cambia los 78 IDs/precios. Los nuevos conjuntos son pruebas temporales, no adquisiciones. Al recargar se recupera la apariencia guardada. Elegir un producto histórico abandona la prueba, para que la vista previa de compra siga correspondiendo al producto.
- Las apariencias históricas sin equivalencia segura conservan el renderizador clásico entero. Esto evita sustituir silenciosamente cuadrados, estrellas, zapatos o diseños comprados por otros distintos. El alcance no incluye actualizar todas las miniaturas de la tienda antigua.

## Crecimiento

La lectura conserva `palabrasLeidas`, pista, progreso, velocidad, tropiezos y recompensas originales. No existe otra fuente de crecimiento. Cada palabra/sílaba contada por el motor agrega un segmento real.

| Tipo | Regla |
|---|---|
| Cabeza, máscara, gorro, pelo, lentes, bufanda | Una sola pieza, anclada al maestro |
| Cola | Segmento 0 una vez |
| Centrales | Segmentos 1 → 2 → 3 → 1 → 2 → 3… |
| Delantero y emblema principal | Segmento 4 una vez, junto a la cabeza |
| Piernas/calzado | Grupo original correspondiente por segmento y pie delantero único |
| Texturas | Se repite el panel del segmento, con sus recortes y sombras |
| Mochila | Anclaje delantero existente; se oculta en cero segmentos |
| Capa | Conserva tamaño/caída y anclaje al cuello; no crece con el cuerpo |

En cinco segmentos se conserva la pose completa aprobada. En otras longitudes se trasladan grupos originales, sin reconstruir trazados. La cámara ajusta el encuadre; en lectura se reduce uniformemente el conjunto cuando no cabe detrás de la cabeza. Esto conserva proporciones, aunque las longitudes extremas tienen detalles pequeños. Se incluyen márgenes para las capas en cuerpos cortos.

## Evidencias visuales

- [Base: anterior/nuevo, 2/5/12 segmentos y 240/320 px](comparaciones/base.png).
- [Robot Lumen](comparaciones/b12-set-robot.png), [Draco](comparaciones/b12-set-draco.png).
- [Crecimiento de Robot en el motor real](comparaciones/lectura-robot-12.png).
- [Lectura en la aplicación real con arrastre](comparaciones/app-lectura-robot.png).
- [Armario móvil](comparaciones/app-armario-movil.png).
- [Diez conjuntos sobre fondos claro/oscuro](comparaciones/galeria-conjuntos.png).
- [19 paletas con bufanda](comparaciones/galeria-paletas.png).
- [Seis bufandas](comparaciones/galeria-bufandas.png).

Las galerías utilizan los componentes/compositor de producción, no imágenes conceptuales. La página de pruebas bajo esta carpeta es una evidencia técnica, no sustituye el laboratorio principal.

## Evaluación visual del agente

| Dimensión | Nota orientativa | Observación comprobada |
|---|---:|---|
| Coherencia | 5/5 | Cabeza, antenas, contorno y proporciones se conservan; la pose de cinco segmentos coincide con la construcción del laboratorio. |
| Ilustración | 5/5 | Robot y Draco retienen luces, placas/escamas y transparencia; conversión raster sin pérdida visible comprobada. |
| Integración | 4/5 | Cuello, máscara, mochila y zapatos siguen sus anclajes. En cuerpos muy cortos la mochila ocupa gran parte del cuerpo; no se inventó otra escala artística. |
| Legibilidad | 4/5 | Rostros y siluetas reconocibles a 240/320 px; el detalle de calzado y patrones disminuye en la pista de lectura y en 40 segmentos. |
| Originalidad | 5/5 respecto del arte conservado | Se mantiene la variedad aprobada de materiales y conjuntos; no se atribuye originalidad nueva al código de integración. |

No se declara una nueva aprobación artística. Permanecen las microjuntas y solapes aceptados de B01 y las observaciones de los batches originales. Las antenas oscuras tienen menor contraste sobre azul oscuro, como en el maestro. Las animaciones de conjunto son sencillas: saludo/baile/respiración, sin un rig nuevo por extremidad.

## Pruebas realizadas

- 172 pruebas de `src/`, 18 archivos: motor de lectura, economía/repositorios existentes, poses y conservación de los 78 derechos en almacenamiento simulado.
- 678 composiciones: 113 selecciones × longitudes 0,1,2,5,12,40; cantidad de cuerpo/pies, XML, IDs únicos y referencias internas. [Matriz](pruebas/matriz.json).
- Decodificación de 33 imágenes WebP y comparación de todos los píxeles visibles/alfa con los maestros derivados. [Exportación](pruebas/exportacion.json). Total raster: 16.37 MB decimales. Catálogo: aproximadamente 268 KB.
- Navegador real, contexto aislado: diez conjuntos, restauración y motor 0→12; [resultado](pruebas/browser-final.json).
- App real: navegación, Robot equipado en lectura, arrastre 0→7, selección de prueba sin escribir perfil; compra de Sol por 8 monedas desde 100, retención de lentes previamente comprados, recarga con 92 monedas y ambos derechos. [Resultado](pruebas/real-app.json). Solo datos ficticios locales.
- Compilación web TypeScript/Vite y `npm run apk`; firma e identificador contrastados con APK 1.5.4.
- Capturas inspeccionadas visualmente, no solo comprobaciones de estructura.

No se ejecutaron migraciones, operaciones en cuentas reales, pruebas del servidor con datos de producción ni instalación en un teléfono físico. La prueba gráfica móvil usa navegador con viewport móvil. La APK requiere todavía revisión en dispositivo Android/WebView real. El servidor de desarrollo con vigilancia WSL resultó lento durante pruebas concurrentes: la validación final se ejecutó sobre la compilación estática, evitando confundir tiempos del servidor de desarrollo con rendimiento del juego.

## Cómo probar la web

La copia aislada sin API está en `release/verificacion-1.6.0/`. Ejecutar desde la raíz:

```bash
python3 -m http.server 5176 --bind 127.0.0.1 --directory release/verificacion-1.6.0
```

Abrir **http://localhost:5176/**. Elegir lector, completar presentación si es la primera visita, entrar a **Personalizar**, desplegar **Nuevo Ciempi · probar vestuario**, escoger Robot Lumen o Draco. Volver a biblioteca, abrir un libro y arrastrar el personaje bajo las palabras. Todo el perfil de esta copia vive en ese origen local; no comunica con cuentas reales.

Para desarrollo habitual: `npm run dev` (procedimiento existente). Web preparada para el servidor: `release/web-1.6.0/`, generada con `npm run build` y la configuración de API habitual. No abrir `index.html` mediante `file://`.

## APK

- Archivo: `release/CIEMPI-1.6.0.apk`.
- Application ID: **cl.ciempi.app**; versionName **1.6.0**, versionCode **10600**.
- Procedimiento existente: `npm run apk`, Capacitor + Gradle `assembleRelease`.
- Firma release existente; no se cambió clave, certificado, contraseña ni configuración Android.
- APK 1.5.4 conservada. Certificado SHA-256 nuevo/anterior iguales (ver verificación).
- Puede actualizar una instalación firmada con ese mismo certificado y versión inferior; se comprobó contra el APK local 1.5.4. No se puede verificar desde aquí la firma/version exacta del APK instalado en tu teléfono.
- Instalar **encima**, sin desinstalar ni borrar datos. Si Android rechaza la actualización, detenerse y comprobar firma/version; no recomendar desinstalación como solución. Los datos de la app y las cuentas del servidor no se migraron.
- La APK usa `https://ciempi.minttu.cl`, como antes. Los recursos visuales van dentro de la APK; no requiere publicar la nueva web para mostrarlos, pero login/sincronización siguen necesitando el servidor existente.

## Git, recuperación y publicación

Rama: `feat/ciempi-crecimiento-v2`, base `096f60a`. Se conservaron cambios artísticos previos y el trabajo concurrente de `laboratorio-animaciones/`. Solo se preparan commits de esta integración; no push, merge ni despliegue.

Cambios: cinco componentes/estilos de producción, `src/ciempi/v2/`, exportador, `public/ciempi-v2/`, versión package/lock y esta evidencia. La guía artística recibió AD-014/AD-015, pero era un archivo completo previamente no versionado: se deja fuera del commit para no incorporar como propios sus cambios históricos. Su registro permanece en el espacio de trabajo.

El renderizador anterior permanece disponible y seleccionable en la prueba. Recuperación de código: revertir el commit de integración en una rama limpia y reconstruir; no usar reset destructivo ni restaurar una base de datos antigua. Para Android, una vuelta al renderizador anterior debe compilarse con un versionCode mayor que 10600 y la misma firma, evitando desinstalar para bajar versión.

## Servidor: procedimiento localizado, no ejecutado

No había `.claude/`, `CLAUDE.md` ni workflows dentro del repositorio. Las instrucciones efectivas estaban en `package.json`, Gradle, `docs/despliegue.md` y `deploy/actualizar.sh`; se reutilizaron.

Después de revisar/aprobar el commit, autorizar push/merge a la rama usada por el servidor y autorizar expresamente despliegue:

```bash
cd /var/www/ciempi-app
git status --short
git branch --show-current
bash deploy/actualizar.sh
```

El script ejecuta pull fast-forward, respaldo, compilación, dependencias y reinicio API; puede actualizar herramientas de voz y grabaciones. Revisar ese alcance antes de ejecutarlo. Esta tarea no añade SQL ni cambia backend. Verificar después versión 1.6.0, carga de `/ciempi-v2/catalogo.json`, lectura con cuenta de prueba, derechos/monedas, errores del navegador y logs del servicio. La publicación sigue pendiente de autorización; no hay automatización GitHub que la active en este repositorio.

Verificación de conservación: [hashes y APK](pruebas/conservacion.json). Los recursos aprobados y el catálogo/repositorios permanecen sin cambios. El comparador detectó cambios concurrentes en tres archivos de `laboratorio-animaciones/`; no pertenecen a esta tarea y se conservaron. El APK final contiene los 34 archivos del catálogo visual exactamente iguales a los del directorio de producción. Tamaño: 23.42 MB decimales.

Commit de implementación: **adf8043**, rama `feat/ciempi-crecimiento-v2`. No incluye archivos artísticos históricos no versionados ni cambios concurrentes. La evidencia se conserva en un segundo commit documental. El repositorio no queda globalmente limpio porque los trabajos previos permanecen sin incorporar.

Para regenerar la copia de pruebas sin API, con las dependencias ya instaladas:

```bash
VITE_API_URL='' node --input-type=module -e "import{build}from'vite';await build({build:{outDir:'release/verificacion-1.6.0',rolldownOptions:{input:{main:'index.html',pruebas:'docs/integracion-ciempi/ejecucion-v1/pruebas/render.html'}}}})"
```

Los scripts `browser.mjs`, `real-app.mjs` y `galerias.mjs` reutilizan Playwright y bibliotecas de navegador que ya estaban disponibles en el directorio de trabajo de Claude. No son una dependencia nueva del juego; sus rutas locales deben ajustarse si cambia ese entorno. Se probaron sobre el servidor estático 5176. Los intentos preliminares por CDP/servidor Vite no se presentan como pruebas superadas.
