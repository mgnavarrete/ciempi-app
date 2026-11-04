# Componentes faciales B03 · v1

14 opciones coordinadas (Alegre original + 13 adaptaciones), todas pendientes de revisión del usuario. `catalogo.json` conserva IDs estables `b03-*` y enlaza los SVG editables. Las cinco opciones históricas siguen en el selector.

Cada SVG usa el viewBox original `0 0 1000 650`; contiene `eyes`, `b03-brows` y `mouth`. No incluye la cabeza ni pretende ser una ilustración completa. Dentro de ojos se distinguen el blanco, el conjunto iris/pupila/reflejos y los párpados. `data-iris` es el único relleno que modifica el control de color. Los recortes delimitan ojos abiertos y párpados; la piel visible es la base real, no un parche recoloreado.

`../../../expresiones.js` carga y adapta los componentes antes del compositor histórico. Se pasan ojos/boca neutros al compositor para evitar que este sustituya el gesto nuevo; sus políticas de ocultación de ojos y boca se conservan. Las cejas sobreviven a lentes opacos y se retiran bajo máscaras. Los recursos y el compositor compartido de producción no se modifican.

Alegre oscuro conserva la apariencia del original (idéntico raster a 240 px; diferencias máximas de 1/255 por antialiasing a 320/1200). El cambio a iris de color incorpora una pupila oscura común a todos los colores; su geometría no cambia entre variantes.

La boca de un gesto B03 forma parte del conjunto: el selector histórico de bocas queda deshabilitado al elegirlo. Seleccionar una expresión anterior permite mezclar de nuevo las bocas históricas. Quitar máscaras recupera la expresión y el iris elegidos. Carcajada y Besito tienen ojos cerrados y no muestran iris.

[Exploración IA y selección](../../../../revisiones/B03-produccion-ia-v1/ia/PROMPT.md) · [Evaluación](../../../../revisiones/B03-produccion-ia-v1/REVISION.md).
