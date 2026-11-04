---
name: ciempi-art-director
description: Diseña, revisa y mejora accesorios SVG de Ciempi con comparaciones visuales y validación según la dirección artística del proyecto. Úsala para propuestas, auditorías o rediseños de su vestuario y composición visual.
---

# Ciempi Art Director

Trabaja sobre la identidad aprobada de Ciempi y el alcance pedido. Esta skill organiza el trabajo; las reglas artísticas, la rúbrica y las decisiones aprobadas viven en [CIEMPI_ART_DIRECTION.md](../../../CIEMPI_ART_DIRECTION.md). No copies ni sustituyas esa guía.

## Referencias y alcance

La raíz de este proyecto está tres niveles por encima del directorio de esta skill. Comprueba que contiene la guía y [AGENTS.md](../../../AGENTS.md), y respeta las instrucciones adicionales aplicables a los archivos afectados. Resuelve las rutas desde esa raíz, no desde una ruta absoluta de la máquina. Si faltan referencias necesarias, informa qué falta y detén únicamente el trabajo que dependa de ellas.

Lee la guía vigente, sus referencias visuales aprobadas y los hallazgos pertinentes del [análisis crítico](../../../docs/rediseno-ciempi/auditoria/ANALISIS-CRITICO.md) y la [revisión por pieza](../../../docs/rediseno-ciempi/auditoria/REVISION-POR-PIEZA.md). Utiliza la [galería](../../../docs/rediseno-ciempi/auditoria/index.html) como evidencia del estado auditado, no como aprobación de todas las piezas. Inspecciona las imágenes pertinentes, además del código SVG.

Distingue análisis, propuesta e implementación. Una revisión no autoriza editar diseños, ejecutar generadores que escriben archivos, instalar dependencias ni integrar cambios en el juego. La autorización de una pieza no se extiende automáticamente a todo el catálogo. Conserva cambios ajenos y no modifiques referencias base para facilitar el encaje de un accesorio.

## Flujo de trabajo

1. **Consultar:** identifica referencias aprobadas y reglas aplicables de la guía, incluidas características obligatorias y decisiones flexibles.
2. **Diagnosticar:** precisa pieza/ID, defecto visual observable y resultado buscado. Distingue problemas verificados de hipótesis y preferencias. Usa la jerarquía de la guía: silueta y proporciones; integración, expresión y materiales; decoración al final.
3. **Revisar el estado actual:** inspecciona la pieza renderizada, su fuente y combinaciones relevantes según la sección 10 de la guía. Identifica qué archivo genera realmente el recurso; no edites solo una salida que se sobrescribirá. En revisiones de solo lectura, usa imágenes existentes y declara si no corresponden al código actual o no cubren una vista necesaria.
4. **Proponer:** explica cómo el cambio resuelve el defecto y qué se conserva. Si la tarea pide solo propuesta, entrega esa propuesta y detente. Para cambios significativos de identidad, aplica la aprobación explícita de la sección 13 antes de modificar la base; no solicites nuevamente autorizaciones ya concedidas dentro de su alcance.
5. **Implementar solo lo autorizado:** antes de editar, conserva fuentes y evidencia del estado previo conforme a la sección 11. Mantén estables las piezas ajenas al objetivo; amplía la revisión si cambias una construcción compartida.
6. **Comparar e inspeccionar:** genera antes/después equivalentes, vista completa, detalle de anclaje y combinaciones pertinentes en los tamaños de la guía. Para una pieza nueva, compara con la base y la familia más cercana. No inventes un “después” en una tarea sin modificaciones. Inspecciona las imágenes con las herramientas visuales disponibles; si no puedes verlas, declara la evaluación pendiente.
7. **Evaluar:** usa la ficha de la sección 12 de la guía. Informa los criterios obligatorios y las cinco dimensiones, puntuadas de 1 a 5: coherencia con Ciempi, calidad de ilustración, integración con el cuerpo, legibilidad y originalidad. Cada nota requiere una observación concreta y evidencia/tamaño; no uses una media como aprobación. En una revisión sin rediseño evalúa solo el estado actual. No puntúes imágenes que no pudiste inspeccionar.
8. **Entregar y registrar:** informa problema abordado, propuesta o cambios realizados, evidencia inspeccionada, evaluación y problemas restantes. Distingue revisión artística del agente, validación técnica y aprobación del usuario. Registra futuras decisiones aprobadas según la sección 13 dentro del alcance de escritura autorizado; si la tarea es estrictamente de solo lectura, indica el registro pendiente en la respuesta.

## Uso del script de auditoría sin perder evidencia

Lee [scripts/auditar-vestuario-ciempi.mjs](../../../scripts/auditar-vestuario-ciempi.mjs) antes de ejecutarlo: sus rutas de salida son relativas al directorio de trabajo y sobrescribe `docs/rediseno-ciempi/auditoria/`. No admite actualmente una opción de directorio de salida ni genera historial antes/después. Sus hashes a 320 px comprueban igualdad exacta, no calidad artística. Las láminas recortadas no acreditan cómo se ve la pieza completa ni todas sus combinaciones.

En análisis de solo lectura, consulta las láminas y resultados existentes sin ejecutar el generador. Si se autoriza nueva evidencia, prefiere una copia de trabajo temporal aislada para renderizar:

- Copia el script, sus módulos locales necesarios y la base SVG, preservando sus rutas relativas. Usa el estado actual de los archivos, incluidos cambios locales relevantes; un checkout de HEAD puede no representar el “antes”.
- Resuelve las dependencias ya disponibles sin instalar paquetes automáticamente. Si usas un enlace al `node_modules` existente para resolver módulos, recuerda que el enlace no lo protege contra escritura: no modifiques esa dependencia compartida ni ejecutes instalaciones allí.
- Ejecuta el script desde la raíz de esa copia, para que sus salidas no apunten al directorio histórico del proyecto. Verifica las rutas antes de ejecutar; no basta cambiar el nombre de la lámina después de haberla sobrescrito.
- Conserva fuentes/configuración y resultados de antes y después en carpetas distintas. Guarda la evidencia final bajo la ruta de revisiones de la sección 11, sin reemplazar revisiones previas.
- Complementa las vistas faltantes solo mediante herramientas y escrituras autorizadas. No modifiques el script original para añadir capacidades como efecto secundario de usar esta skill.

Si no se puede aislar una ejecución o preservar la evidencia, no ejecutes el generador sobre el histórico: explica la limitación y presenta la revisión posible. No declares terminada una validación visual que quedó incompleta.

## Entrega breve

Usa la ficha de la guía cuando corresponda y enlaza la evidencia. En la respuesta final resume alcance real, diagnóstico, propuesta/cambios, cinco evaluaciones respaldadas, comprobaciones realizadas y pendientes. Solicita aprobación solo cuando el alcance o la sección 13 la requieran, explicando el motivo; no conviertas mejoras ordinarias ya autorizadas en un proceso de confirmaciones repetidas.
