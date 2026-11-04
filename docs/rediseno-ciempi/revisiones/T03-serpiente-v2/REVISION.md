# Revisión: T03 · Ciempi Serpiente · iteración 2 (laboratorio)

Fecha: 2026-11-04 · Guía `CIEMPI_ART_DIRECTION.md` v1.7 · rama `expansion-v4-criaturas`. Revisión **del agente**, no aprobación. La iteración 1 (`../T03-serpiente-v1/`) se conserva sin cambios y se puede ver en el laboratorio con «Iteración v1» (`sel.iter = 'v1'`).

## Qué pedía la revisión (Fable / coordinador) y qué se hizo

| Hallazgo | Cambio en v2 |
|---|---|
| Ojos, cejas, boca y coloretes casi idénticos a Ciempi (lo que AD-017 rechazó en Dragón y Cuncuna). | Rostro propio con IA, con el mismo método que los rostros v4 de Dragón y Cuncuna (rama `expansion-v4-rostros`). Se generaron 3 propuestas y luego hojas 2×2 con las 14 expresiones B03 y 2 variantes sin lengua. Ojos ovalados con iris dorado, **más altos y separados** (centros medidos ≈ 686,322 y 796,302; Ciempi: 708,342 y 808,320), rombo amarillo en la frente que repite las rayas del cuerpo, escamitas amarillas en lugar de rubor y **boca ancha de serpiente sin dientes**. |
| La lengua colgaba por fuera de la barbilla y se veía pegada. | Ahora es parte de la cara IA. Es corta y sale **desde dentro** de la boca, solo en Alegre y Carcajada. Sigue siendo opcional: «Lengüita» apagada usa las variantes `-sinlengua` generadas por la IA. |
| Riesgo de parecido con Knuckles («Ugandan Knuckles»): cabeza roja redonda, hocico crema y ojos grandes. | Desapareció el hocico crema: la piel IA de la cabeza (`cabeza-piel-v2`) es lisa. Los rasgos distintivos ahora son el rombo, las escamas y la boca de lado a lado. No se cambió el tono coral, para no romper la paleta aprobada del cuerpo. |
| No tener patas es una decisión de identidad. | **Aprobado por la usuaria** (mensaje transmitido por el coordinador el 2026-11-04): «lo apruebo lo de la serpiente, pero podríamos ponerle una zapatilla en la cola y sería chistoso, pero solo en la cola y solo 1». No se registra en la guía (no autorizado en esta tarea): queda pendiente que la usuaria o el coordinador lo registren. |
| Zapatilla en la cola (pedido de la usuaria). | `especie.ts`: `calzado: 'cola'` y `adaptables.pies`. La serpiente ya no usa `partesOcultas`, aunque el mecanismo se conserva y tiene prueba. El calzado equipado se dibuja como **una sola** zapatilla del mismo diseño B10, dentro del grupo de la cola: punta dentro de la abertura, zapato boca abajo con la suela hacia arriba y la puntera hacia atrás, siguiendo la cola, y sombra de contacto sobre la cola. Sin calzado, la cola queda tal cual. |

## IA (Codex CLI 0.166 `exec` + `image_gen`, `generar-ia.mjs`)

- **Prompts:** `scripts/transformaciones/prompts-v4/rostros_v2.py`. **Lanzador:** `lanzar-rostros-v2.sh`. **Copias:** `prompts/` y `ia/*-prompt.txt`.
- **Propuestas:** s2a «diamante», s2b «barbilla», s2c «gota». Se ven en [propuestas-lamina](piezas/propuestas-lamina.png) y [control-propuestas](piezas/control-propuestas.png).
- **Elegida s2a:**
  - la boca ancha es de lado a lado y no hay hocico, así que ya no se lee como Knuckles;
  - los ojos dorados ovalados quedan arriba;
  - el rombo une la cara con las rayas del cuerpo;
  - s2b (ojos de anime con pestañas) se parecía a Ciempi;
  - s2c (ojos en gota inclinados) se veía «astuta», poco amable.
- **Hojas:** la primera pasada derivó a ojos redondos y metió lengua en el Guiño. Está conservada en `ia/descartes/hoja-*-pasada1*`. La segunda pasada repite los rasgos fijos en cada hoja (`RASGOS` en el script) y es la que se usa: [hojas](piezas/hojas-lamina.png).
- **Piel lisa:** `ia/pieza-serpiente-cabeza-lisa.png`, convertida en `recursos/serpiente/cabeza-piel-v2.webp`.
- **Recorte:**
  - `scripts/transformaciones/v4/procesar-rostros-criaturas.py`, que usa `rostros_base.py` (copia del script de la rama de rostros);
  - salida en `recursos/serpiente/rostro-v2/` (16 caras, WebP con alfa, 2 px/u, unos 0,48 MB);
  - control en [control-recortes](piezas/control-recortes.png).

## Cómo funciona

`criaturas-v4.js` (`aplicarRostro`) sustituye el contenido de los grupos que usa el rig:
- `#eyes`: un grupo por ojo; parpadea si la B03 lo deja abierto y queda como `eyelids` si lo cierra;
- `#mouth`: la capa fija;
- `#b03-brows`: queda vacío;
- el rubor vectorial se elimina.

Con eso, el rig y E08 (boca sorprendida) usan la cara propia. Si una máscara o unos lentes opacos vacían `#eyes` o `#mouth` (`data-hidden`), se respeta ese vacío. La cara de la serpiente no se tiñe con la paleta: solo se tiñen la piel y el cuerpo.

## Evidencia (Read de cada PNG por el agente)

| Lámina | Contenido |
|---|---|
| [iteración: antes/después](evidencia/iteracion-claro.png) | 7 expresiones v1 frente a v2; cuerpo a 320 y 84 px |
| [zapatilla en la cola](evidencia/cola-claro.png) / [oscuro](evidencia/cola-oscuro.png) | sin calzado y los 5 B10 ampliados, a 320 y 84 px, N = 0, 1, 2, 5, 12, 40, y A02 caminar, E04 tropezar, A03 celebrar |
| [expresiones](evidencia/expresiones-claro.png) / [oscuro](evidencia/expresiones-oscuro.png) | 14 B03 y lengüita con y sin |
| [accesorios](evidencia/accesorios-claro.png) / [oscuro](evidencia/accesorios-oscuro.png) · [detalle](evidencia/detalle-claro.png) · [conjuntos](evidencia/conjuntos-claro.png) | combinaciones de vestuario |
| [comer](evidencia/comer-claro.png) · [animación](evidencia/animacion-claro.png) · [crecimiento](evidencia/crecimiento-claro.png) / [oscuro](evidencia/crecimiento-oscuro.png) · [comparación](evidencia/comparacion-claro.png) / [oscuro](evidencia/comparacion-oscuro.png) | E08, rig, crecimiento y comparación con la familia |
| [fusión](fusion/) | `escenaCreciente` + `rig.crecer` frente a `escena`: 306/306 casos idénticos (incluye la zapatilla en la cola y la iteración v1) |

## Rúbrica (orientativa; no se promedia)

| Dimensión | v1 | v2 | Observación concreta |
|---|---|---|---|
| Coherencia con Ciempi | 4 | 4 | Mismo contorno, volumen y expresiones B03 con su significado ([iteración](evidencia/iteracion-claro.png)). La cara ya no es la de Ciempi pero sigue en el mismo lenguaje. |
| Calidad de ilustración | 3 | 3 | Las caras son limpias y consistentes en las 14 expresiones. Pendientes: las pupilas salieron redondas, no verticales como en la propuesta; los rasgos son planos sobre la piel con brillo; la alternancia de color con N impar y la falta de ondulación al caminar siguen igual que en v1. |
| Integración con el cuerpo | 4 | 4 | La zapatilla en la cola acompaña el crecimiento y el rig ([cola](evidencia/cola-claro.png)) y tapa el corazón con la punta dentro. Pendientes: los lentes redondos B04 quedan algo bajos respecto de los ojos, que ahora están más arriba ([accesorios](evidencia/accesorios-claro.png)); con N = 0 o 1 no hay cola, así que tampoco zapatilla; al parpadear, el rig dibuja la línea del párpado en la posición de los ojos de Ciempi, unos 20 u más abajo, durante unos cuadros. |
| Legibilidad | 4 | 4 | A 84 px se leen el rombo y la sonrisa ancha. La zapatilla se reconoce desde 240 px; a 84 px es solo una mancha de color. |
| Originalidad | 3 | 4 | El rostro es propio (rombo, escamas, boca de serpiente) y ya no se parece a Knuckles. La zapatilla en la cola es un gag propio pedido por la usuaria. |

- **Decisión:** funcional; artísticamente **requiere ajustes menores** y está **pendiente de aprobación** del rostro v2 y de la zapatilla.
- **Pendientes:**
  - el «tap» de la zapatilla al caminar no se hizo: requiere un gancho en el rig compartido (`rig.js`), fuera del alcance de los archivos propios;
  - pupilas verticales;
  - lentes B04 adaptados a los ojos altos;
  - apuntar la fruta de E08 a la boca ancha;
  - registrar en la guía la aprobación de «sin patas + 1 zapatilla en la cola».
