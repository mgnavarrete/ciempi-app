# Revisión: T04 · Ciempi Camaleón · iteración 2 (laboratorio)

Fecha: 2026-11-04 · Guía v1.7 · rama `expansion-v4-criaturas`. Revisión **del agente**, no aprobación. La iteración 1 (`../T04-camaleon-v1/`) se conserva y se puede ver con «Iteración v1» en el laboratorio.

## Qué pedía la revisión y qué se hizo

| Hallazgo | Cambio en v2 |
|---|---|
| Las torretas eran anillos rosas planos dentro de la cabeza y se leían como «ojos hipnóticos». | Rostro IA nuevo: 3 propuestas y luego 4 hojas 2×2 con las 14 B03. La propuesta elegida, **k2a**, tiene **conos con volumen** (luz y sombra), anillos en relieve y el ojo con la pupila **en la punta**. **Sobresalen del contorno**: la izquierda hacia arriba a la izquierda y la derecha por el borde derecho. El recorte conserva lo que sale del disco (`procesar-rostros-criaturas.py`, `torretas()`). |
| Patas finas como palitos frente a las «piernas gruesas» de la guía. | Pata y pie nuevos con IA (`ia/pieza-camaleon-pata.png`), más rechonchos, con el pie prensil de dos bultos. Se dibujan a 50 u de ancho (v1: 40; la pierna de Ciempi mide unas 38 u con contorno) y el pie a 104 u ([iteración, fila de patas](evidencia/iteracion-claro.png)). |
| Boca y coloretes de Ciempi. | Boca de reptil propia y **mejillas de escamas** lima y rosa, sin rubor (el rubor vectorial se elimina). |
| Anillo vacío con los ojos cerrados. | Cada expresión trae su propia torreta. En Carcajada, Besito y Guiño la IA dibuja el párpado cerrado en la punta del cono; el cono no cambia. |

## Decisiones técnicas
- **Torretas en `#b03-brows`, no en `#eyes`:** el parpadeo del rig aplasta verticalmente los grupos `eye-i`, y un cono aplastado se ve roto. Por eso las torretas van en la capa de cejas, que el rig reemplaza con cada expresión y solo desplaza levemente. Consecuencias:
  - **el camaleón no parpadea con el rig**; parpadea con sus expresiones de ojos cerrados;
  - los controles de mirada y de color de ojos no tienen efecto.
- **Máscaras y lentes opacos:** si vacían `#eyes`, también se quitan las torretas, así nunca asoman sobre una máscara (comprobado en la prueba V4 con el robot).
- **Camuflaje:** la cara (torretas y escamas) se tiñe junto con el cuerpo, porque es piel.

## IA
- **Propuestas:** k2a «anillos», k2b «crestas» y k2c «mirada»; se ven en [propuestas-lamina](piezas/propuestas-lamina.png) y [control](piezas/control-propuestas.png).
- **Elegí k2a:**
  - es la de volumen más claro y la que más se parece a k1;
  - tiene mejillas de escamas;
  - en k2b los anillos siguen planos;
  - en k2c las torretas miran hacia afuera y pierden expresión.
- **Hojas:** [hojas-lamina](piezas/hojas-lamina.png).
- **Recortes:** [control-recortes](piezas/control-recortes.png), en `recursos/camaleon/rostro-v2/` (16 caras, unos 0,89 MB).
- **Problema de la IA:** dibujó cabezas algo ovaladas, así que su contorno no coincide con el círculo de la cabeza. `limpiar_contorno_ia` quita ese contorno y el fondo, pero quedan restos finos del contorno IA cerca de las torretas.

## Evidencia (Read de cada PNG por el agente)
- [Iteración antes/después](evidencia/iteracion-claro.png) (7 expresiones, cuerpo a 320 y 84 px, patas).
- [Expresiones](evidencia/expresiones-claro.png) / [oscuro](evidencia/expresiones-oscuro.png).
- [Accesorios](evidencia/accesorios-claro.png) / [oscuro](evidencia/accesorios-oscuro.png) · [detalle](evidencia/detalle-claro.png) · [conjuntos](evidencia/conjuntos-claro.png).
- [Camuflaje](evidencia/camuflaje-claro.png) / [oscuro](evidencia/camuflaje-oscuro.png) · [comer](evidencia/comer-claro.png) · [animación](evidencia/animacion-claro.png).
- [Crecimiento](evidencia/crecimiento-claro.png) / [oscuro](evidencia/crecimiento-oscuro.png) · [comparación](evidencia/comparacion-claro.png).
- Fusión: [`../T03-serpiente-v2/fusion/fusion.json`](../T03-serpiente-v2/fusion/fusion.json), 108/108 casos idénticos del Camaleón (incluido v1).

## Rúbrica (orientativa)

| Dimensión | v1 | v2 | Observación concreta |
|---|---|---|---|
| Coherencia con Ciempi | 4 | 4 | Mismo contorno, segmentos y lenguaje. El rostro es propio y sigue amable. |
| Calidad de ilustración | 3 | 4 | Los conos tienen volumen y la pupila en la punta; los párpados cerrados están resueltos y las patas son rechonchas con pie prensil ([iteración](evidencia/iteracion-claro.png)). Resta: a 240 px las torretas todavía se leen como anillos apilados, y queda algún resto del contorno IA junto a ellas. |
| Integración con el cuerpo | 3 | 3 | El casco se guarda bajo gorros y la máscara oculta todo ([accesorios](evidencia/accesorios-claro.png)). Pendientes: el calzado B10 queda chico frente a la pata gruesa, las torretas con lentes redondos se ven recargadas y el camaleón no parpadea con el rig. |
| Legibilidad | 4 | 4 | Espiral, casco y torretas salientes se leen a 84 px. Las bocas de algunas expresiones son pequeñas a 240 px. |
| Originalidad | 4 | 4 | Torretas en volumen y camuflaje por conjunto. |

- **Decisión:** prototipo funcional; **requiere ajustes menores** y está **pendiente de aprobación**.
- **Siguiente paso:**
  - escalar el calzado a la pata v2;
  - generar una capa de ojo separada en la punta del cono, para que parpadee sin aplastar el cono;
  - limpiar los restos del contorno IA;
  - pedir bocas más anchas en las expresiones neutras.
