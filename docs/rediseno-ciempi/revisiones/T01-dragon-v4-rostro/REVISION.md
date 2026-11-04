# Revisión: T01 · Ciempi Dragón · rostro v4 (laboratorio)

Fecha: 2026-11-03 · Guía: `CIEMPI_ART_DIRECTION.md` v1.7 (AD-010, AD-017, AD-018, §10–13) · Revisión **del agente**, no aprobación. **Pendiente de aprobación artística del usuario.** No integrado al juego. Rama `expansion-v4-rostros`.

- **Objetivo y alcance autorizado:** AD-017 aprueba el cuerpo del Dragón y deja pendiente el rostro («usa demasiado la cara de Ciempi»); pide un rostro propio con IA: hocico, nariz con narinas, boca propia, colmillitos y ojos propios, con libertad de geometría facial si se conservan expresiones, animaciones y accesorios. Solo laboratorio.
- **Problema auditado:** el rostro v1 es el de Ciempi (ojos, cejas, boca y rubor vectoriales de la base) con un parche crema vectorial y dos puntos ([antes](antes/), [expresiones v1](evidencia/expresiones-claro.png), fila superior).
- **Protegido (sin cambios, verificado):** cuerpo, segmentos A–D, cola, frente, patas, pies, alas, cuernos y orejas (`cabeza-rasgos.webp`), disco de la cabeza vectorial (contorno, degradado, brillo, tinte por paleta), crecimiento. **Cambiado:** solo el contenido de `#eyes`, `#mouth` y `#b03-brows` dentro de la cabeza, más la retirada del rubor vectorial y del hocico vectorial v1 cuando se elige v4.

## Generación con IA (real; sin sustituciones)

Codex CLI 0.166 `exec` + `image_gen` vía `scripts/transformaciones/generar-ia.mjs`. Registro: [generaciones.json](generaciones.json); prompts en [prompts/](prompts/) (fuente: `scripts/transformaciones/prompts/rostros-v4.py`); maestros en [ia/](ia/). 8 generaciones de esta especie, 0 fallos.

- **Ronda 1, 4 propuestas** (refs: cabeza v1 del Dragón, cuerpo aprobado, lámina de expresiones de Ciempi; disco naranja plano como clave): [lámina](piezas/propuestas-lamina.png).
  - d4a «hocico corto»: hocico crema dentro del disco, ojos ámbar, colmillos. Correcto pero es el parche v1 refinado: sigue leyéndose como Ciempi con hocico.
  - d4b «placa crema»: pupilas en rombo verde/amarillo, se ven extrañas; marcas de frente recargadas.
  - d4c «mejillas de escamas»: ojos almendrados con pestaña y nariz-botón: se lee como cerdito/lagartija maquillada.
  - **d4d «perfil hocico» (elegida):** hocico de perfil 3/4 hacia la derecha que llega al contorno, con dos narinas y la boca a lo largo del hocico, colmillitos, ojos ámbar con pupila vertical redondeada y cejas de escama menta. Criterios: (1) más distinto de Ciempi, el hocico cambia la lectura de la cabeza incluso a 84 px; (2) tierno, no aterrador; (3) los ojos quedan cerca de los centros del rig; (4) el hocico no compite con sombreros (está en la mitad inferior).
- **Ronda 2, refinado: 4 hojas 2×2** con la propuesta elegida como referencia 1 y la lámina de expresiones de Ciempi como referencia 2 → las 14 expresiones B03 + 2 repeticiones de control (alegre, sorprendido). La IA respetó el orden pedido; se usaron las primeras versiones.

## Recursos y cómo conviven con expresiones, accesorios y rig

`scripts/transformaciones/procesar-rostros-v4.py` → `laboratorio-transformaciones/recursos/dragon/v4/` (WebP con alfa, 2 px por unidad, calidad 90, ≈0,56 MB las 16 caras; `manifiesto.json` con encuadres en unidades de la base, origen y sha de cada hoja). Control de recortes: [piezas/control-recortes.png](piezas/control-recortes.png).

- Registro: el disco IA se ajusta por mínimos cuadrados y se lleva a la cabeza aprobada (736,340; borde interior r 126,5). El naranja plano se quita con desmezcla de alfa, así que el rostro va **sobre** la cabeza vectorial y la paleta la sigue tiñendo. El contorno lo dibuja la cabeza vectorial: el hocico, que en la IA apenas pasaba el borde, queda cerrado por ese contorno.
- **Tres capas por expresión** (`rostros-v4.js`): ojo izquierdo y ojo derecho en `#eyes`, como `data-component="eye-i"` si la B03 deja ese ojo abierto (el rig los hace parpadear) o `eyelids` si lo cierra (carcajada, besito, guiño), y capa fija (hocico, narinas, cejas, boca, pecas) en `#mouth`. El rig cambia de expresión reemplazando esos grupos, por lo que A/E y E08 usan la cara v4 correspondiente.
- Máscaras: si el compositor vacía `#eyes` o `#mouth` (`data-hidden`), v4 lo respeta; nunca aparece una boca sobre una máscara (AD-018).
- Selector **Rostro v1 / v4** en el laboratorio (`?rostro=v4`); v1 no cambia.

## Evidencia inspeccionada (Read sobre cada PNG)

| Lámina | Contenido |
|---|---|
| [crecimiento-claro](evidencia/crecimiento-claro.png) | N = 0, 1, 5, 12, 40, v1 y v4 a la misma escala |
| [expresiones claro](evidencia/expresiones-claro.png) / [oscuro](evidencia/expresiones-oscuro.png) | 14 B03 v1 y v4 ampliadas; 6 gestos v4 a 84 px |
| [accesorios claro](evidencia/accesorios-claro.png) / [oscuro](evidencia/accesorios-oscuro.png) | mago, jockey, gatita, robot, lentes, visor, coletas, bufanda+mago, lentes+guiño, Océano; cabeza y 320 px |
| [tamanos claro](evidencia/tamanos-claro.png) / [oscuro](evidencia/tamanos-oscuro.png) | 84 px de alto y 320 px de ancho, N = 5 y 12, con Ciempi |
| [animacion-claro](evidencia/animacion-claro.png) | A01 parpadeo, E08 Comer (v4 y v1), A10, A04 guiño, A06 |
| [comparacion-ciempi claro](evidencia/comparacion-ciempi-claro.png) / [oscuro](evidencia/comparacion-ciempi-oscuro.png) | Ciempi / Dragón v1 / v4 / Cuncuna v1 / v4 |
| [laboratorio-rostro-v4](evidencia/laboratorio-rostro-v4.png) | interfaz con el selector, A10 en curso |
| [antes/](antes/) | renders v1 previos al cambio (N 5 y 12, mago, robot, Océano) |

## Criterios obligatorios

| Criterio | Estado | Observación y evidencia |
|---|---|---|
| Respeto de base | Cumple | Cuerpos: sha256 idénticos (9 WebP del Dragón y 8 de la Cuncuna + `cabeza-rasgos`), y 75/75 renders con la cabeza oculta idénticos píxel a píxel entre v1 y v4 (Ciempi, Dragón y Cuncuna × 5 selecciones × N 0/1/5/12/40). v1 idéntico píxel a píxel antes/después del código (75/75). Ciempi 35/35 (`probar-laboratorio.cjs`). |
| Anclaje y capas | Cumple con observaciones | Rostro dentro del círculo, sin halos ni ojos duplicados en las 14 caras ([control](piezas/control-recortes.png)). Restos del contorno IA eliminados. Hocico cortado por el contorno a la derecha: la segunda narina queda pegada al borde. |
| Legibilidad | Cumple | A 84 px se lee el hocico crema y los ojos ámbar ([tamanos](evidencia/tamanos-claro.png)); los 6 gestos se distinguen a 84 px salvo triste/confundido (boca pequeña). |
| Perspectiva, luz y material | Cumple con observaciones | Hocico 3/4 coherente con el rostro girado a la derecha. Los rasgos son planos (sin sombreado propio), como los ojos/boca vectoriales; la luz la pone el disco de la cabeza. |
| Compatibilidad | Cumple en lo revisado | Robot oculta todo el rostro; visor opaco oculta ojos y deja cejas (como Ciempi); gorros y coletas encima; bufanda sin choque. **Gatita**: los agujeros de la máscara están pensados para los ojos de Ciempi y el ojo ámbar se asoma solo en parte. **Lentes redondos**: la montura queda algo baja respecto de los ojos v4. |
| Diferenciación honesta | Cumple | [comparacion-ciempi](evidencia/comparacion-ciempi-claro.png): ojos, boca, hocico y cejas propios; ya no es la cara de Ciempi. |
| Efecto de controles | Documentado | Paleta: tiñe el disco de la cabeza; el rostro IA **no se tiñe** (hocico crema, cejas menta y pecas fijos). **Color de ojos: sin efecto en v4** (iris ámbar fijo). Mirada (`mirarX/Y` del rig): sin efecto en v4 (el iris no es una capa aparte). Rubor animado del rig: sin efecto (no hay rubor vectorial). |
| Evidencia y autorización | Pendiente | Evidencia inspeccionada; falta aprobación del usuario (§13: rediseño de rostro). |

**Combinaciones revisadas:** 14 expresiones; mago, jockey, gatita, robot, lentes redondos, visor, coletas, bufanda+mago, lentes+guiño, Océano; claro y oscuro; N 0/1/5/12/40; rig A01, A04, A06, A10, E08. **Pendientes:** resto de máscaras y lentes B04/B07, peinados B05 restantes, 14 expresiones × máscaras, paletas restantes, Android real, Firefox/Safari.

## Rúbrica (orientativa; no se promedia)

| Dimensión | Antes (v1) | Después (v4) | Observación concreta y evidencia |
|---|---|---|---|
| Coherencia con Ciempi | 3 | 4 | Mismo contorno azul, ojos grandes con brillo y lenguaje redondeado ([comparacion](evidencia/comparacion-ciempi-claro.png)); la cabeza sigue siendo la redonda aprobada. Resta: el trazo IA es algo más fino y plano que el vectorial ampliado. |
| Calidad de ilustración | 2 | 4 | v1: parche crema plano sobre la cara de Ciempi. v4: hocico 3/4 con narinas y boca integrada, pupila vertical redondeada y cejas de escama; 14 gestos coherentes ([expresiones](evidencia/expresiones-claro.png)). Resta: segunda narina cortada en el borde, sin sombreado propio. |
| Integración con el cuerpo | 3 | 4 | Rostro sobre la cabeza aprobada, sin halos; parpadeo y cambios de expresión funcionan ([animacion](evidencia/animacion-claro.png)). Resta: centros de ojo hasta ~13 u del pivote del rig (deriva leve al parpadear); en triste/confundido/asustado la ceja toca el ojo y parpadea con él; E08 apunta la fruta a la boca de Ciempi (765,405), algo arriba a la izquierda de la boca del hocico. |
| Legibilidad | 3 | 4 | A 84 px el hocico y los ojos ámbar separan al Dragón de Ciempi ([tamanos](evidencia/tamanos-claro.png)). Gestos sutiles (boca pequeña) se pierden a 84 px, igual que en Ciempi. |
| Originalidad | 2 | 4 | v1 duplicaba la cara de Ciempi. v4 es un dragón bebé propio (hocico de perfil, pupila de reptil tierna, colmillitos); el tema es transitado, por eso no 5. No certifica novedad legal. |

- **Decisión técnica y artística:** funcional en el laboratorio; requiere ajustes menores (narina en el borde, lentes/gatita, apuntado de E08) y **aprobación del usuario**.
- **Cambio significativo de identidad:** sí para la especie (rediseño del rostro del Dragón, §13); no toca la base de Ciempi. No se registra en la guía: lo hará la usuaria si lo aprueba.
- **Aprobación del usuario:** no existe.
- **Limitaciones y siguiente acción:** decidir v4; si se aprueba, valorar una capa de iris aparte (mirada y color de ojos), ajustar los lentes B04 a la posición de ojos v4 y el punto de boca de E08 por especie, y revisar las combinaciones pendientes.
