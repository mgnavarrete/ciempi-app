# Revisión: T02 · Ciempi Cuncuna · rostro v4 (laboratorio)

Fecha: 2026-11-03 · Guía: `CIEMPI_ART_DIRECTION.md` v1.7 (AD-010, AD-017, AD-018, §10–13) · Revisión **del agente**, no aprobación. **Pendiente de aprobación artística del usuario.** No integrada al juego. Rama `expansion-v4-rostros`.

- **Objetivo y alcance autorizado:** AD-017 aprueba el cuerpo de la Cuncuna y pide un rostro propio con IA, más tierno y característico (mejillas, ojos, boca, expresiones dulces), distinto de Ciempi. Solo laboratorio.
- **Problema auditado:** el rostro v1 es exactamente el de Ciempi ([antes](antes/), fila superior de [expresiones](evidencia/expresiones-claro.png)).
- **Protegido (verificado):** cuerpo, segmentos, cola, frente, patas, pies, penacho y antenas, disco de la cabeza vectorial y su tinte. **Cambiado:** solo `#eyes`, `#mouth`, `#b03-brows` y retirada del rubor vectorial, cuando se elige v4.

## Generación con IA (real; sin sustituciones)

Mismo flujo que T01 ([generaciones.json](generaciones.json), [prompts/](prompts/), [ia/](ia/)); 8 generaciones, 0 fallos.

- **Ronda 1, 4 propuestas** ([lámina](piezas/propuestas-lamina.png)):
  - **c4a «mejillas pompón» (elegida):** mejillas de pompón coral peludo, que repiten el material de los penachos; ojos grandes ciruela con brillos y dos pestañas cortas; cejitas amarillas esponjosas; boca pequeña con lengua rosada.
  - c4b «cejas plumosas»: muy buena segunda opción, pero el rubor plano con pecas es más genérico.
  - c4c «ocelos»: corazones en las mejillas y lunares laterales; los corazones son un recurso genérico y los ocelos se pierden a 84 px.
  - c4d «hocico peluche»: el parche de peluche se lee como oveja o perrito, no como oruga.
  - Criterios: dulzura, vínculo temático con la cuncuna (pelusa, penachos), diferencia con Ciempi a 84 px y compatibilidad con lentes y sombreros.
- **Ronda 2:** 4 hojas 2×2 con las 14 expresiones B03 y 2 repeticiones de control; orden respetado.

## Recursos y convivencia

Igual que T01: `recursos/cuncuna/v4/` (WebP 2 px/u, ≈0,61 MB, `manifiesto.json`), [control de recortes](piezas/control-recortes.png). Los pompones que tocan el ojo se excluyen de la capa del ojo (no parpadean); las pestañas y el párpado sí van con el ojo.

## Evidencia inspeccionada (Read sobre cada PNG)

[crecimiento](evidencia/crecimiento-claro.png) · [expresiones claro](evidencia/expresiones-claro.png) / [oscuro](evidencia/expresiones-oscuro.png) · [accesorios claro](evidencia/accesorios-claro.png) / [oscuro](evidencia/accesorios-oscuro.png) · [tamaños claro](evidencia/tamanos-claro.png) / [oscuro](evidencia/tamanos-oscuro.png) · [animación](evidencia/animacion-claro.png) · [comparación con Ciempi](../T01-dragon-v4-rostro/evidencia/comparacion-ciempi-claro.png) · [antes/](antes/).

## Criterios obligatorios

| Criterio | Estado | Observación y evidencia |
|---|---|---|
| Respeto de base | Cumple | Ver T01: sha256 de los 8 WebP del cuerpo idénticos; 75/75 renders con la cabeza oculta idénticos v1/v4; Ciempi 35/35. |
| Anclaje y capas | Cumple | 14 caras sin halos ni restos del contorno IA ([control](piezas/control-recortes.png)); pompones dentro del círculo. |
| Legibilidad | Cumple | A 84 px se leen los ojos ciruela y las mejillas coral, distintos de Ciempi ([tamaños](evidencia/tamanos-claro.png)). |
| Perspectiva, luz y material | Cumple | Pompones con textura de pelusa coherente con los penachos; ojos con brillos múltiples; planos como el resto de rasgos. |
| Compatibilidad | Cumple con observaciones | Robot y visor ocultan correctamente; gorros guardan el penacho (sin cambios). **Lentes redondos:** los ojos v4 son más grandes que la montura y asoman por fuera. **Gatita:** el ojo se ve parcialmente por los agujeros. |
| Diferenciación honesta | Cumple | Ojos, cejas, boca y mejillas propios. |
| Efecto de controles | Documentado | Paleta: tiñe el disco; los rasgos no se tiñen. Color de ojos, mirada y rubor animado: sin efecto en v4 (como T01). |
| Evidencia y autorización | Pendiente | Falta aprobación del usuario (§13). |

**Pendientes:** como T01.

## Rúbrica (orientativa; no se promedia)

| Dimensión | Antes (v1) | Después (v4) | Observación concreta y evidencia |
|---|---|---|---|
| Coherencia con Ciempi | 3 | 4 | Contorno azul, cabeza redonda y ojos grandes con brillo en la misma familia ([comparación](../T01-dragon-v4-rostro/evidencia/comparacion-ciempi-claro.png)); las pestañas y los ojos más grandes la alejan algo del trazo de Ciempi. |
| Calidad de ilustración | 3 | 4 | Pompones con pelusa, ojos ciruela con brillos y 14 gestos consistentes ([expresiones](evidencia/expresiones-claro.png)). Resta: rasgos planos, sin sombreado propio. |
| Integración con el cuerpo | 3 | 4 | Rostro sobre la cabeza aprobada; parpadeo y expresiones con el rig. Ojo izquierdo ~13 u del pivote del rig; en enojadito la ceja parpadea con el ojo; lentes redondos chicos para estos ojos. |
| Legibilidad | 3 | 4 | A 84 px las mejillas coral y los ojos ciruela identifican a la Cuncuna incluso con penachos densos (N = 12, [tamaños](evidencia/tamanos-claro.png)). |
| Originalidad | 2 | 4 | v1 duplicaba a Ciempi; los pompones conectan el rostro con los penachos de la cuncuna. Ojos grandes con pestañas son un recurso «kawaii» habitual, por eso no 5. |

- **Decisión:** funcional en laboratorio; ajustes menores (lentes) y **aprobación del usuario pendiente**.
- **Cambio significativo de identidad:** sí para la especie (§13); no toca la base de Ciempi.
- **Aprobación del usuario:** no existe.

---

## Iteración 2 · v4b (revisión independiente)

Pedido (revisión independiente; su nota de v4: coherencia 3, calidad 3, legibilidad 3; dirección «más tierna» correcta): (1) cejas amarillas invisibles sobre naranja: contorno azul o marrón claro; (2) ojos 15 % más chicos y con un solo brillo (quitar el aire kawaii genérico); (3) pompones 20 % más chicos o menos saturados (a 84 px tapan el gesto; Triste y Alegre se confundían); (4) Asustado: boca deformada. **v4 se conserva**; v4b en `recursos/cuncuna/v4b/`, `?rostro=v4b`.

- **IA (6 generaciones, 0 fallos; [generaciones-it2.json](generaciones-it2.json), [prompts/it2](prompts/it2/), [ia/it2](ia/it2/)):** 2 propuestas con c4a como referencia 1. **c5a «sobria» elegida**: cejas amarillas con contorno azul, que mantienen el vínculo con los penachos amarillos. c5b «cejas marrón» descartada: el marrón pierde ese vínculo. Luego 4 hojas con Asustado «boca ovalada simple». [control-recortes-it2](piezas/control-recortes-it2.png).
- **Medido (4 expresiones, área de píxeles opacos):**
  - Ojos: −15 % de **área** (≈ −8 % de diámetro), por debajo del −15 % pedido.
  - Pompones: −27 % de área (≈ −15 % de diámetro), y además más pálidos.
  - Un solo brillo por ojo: cumple.
- **Evidencia (sufijo -it2):** [expresiones](evidencia/expresiones-claro-it2.png) / [oscuro](evidencia/expresiones-oscuro-it2.png), [accesorios](evidencia/accesorios-claro-it2.png) / [oscuro](evidencia/accesorios-oscuro-it2.png), [crecimiento](evidencia/crecimiento-claro-it2.png), [tamaños](evidencia/tamanos-claro-it2.png) / [oscuro](evidencia/tamanos-oscuro-it2.png), [animación](evidencia/animacion-claro-it2.png), [comparación con Ciempi](../T01-dragon-v4-rostro/evidencia/comparacion-ciempi-claro-it2.png).
- **Pruebas:** como T01 (sha256 19/19, cabeza oculta 75/75, 35/35, tsc, vitest 279/279).

| Dimensión | v4 | v4b | Observación (evidencia -it2) |
|---|---|---|---|
| Coherencia con Ciempi | 3 (rev.) / 4 (agente) | 4 | Un brillo y contorno azul en las cejas, como el trazo de Ciempi; ojos aún más grandes que los de Ciempi. |
| Calidad de ilustración | 3 (rev.) / 4 | 4 | Cejas legibles con contorno; Asustado con boca ovalada limpia; pompones menos estridentes. |
| Integración con el cuerpo | 4 | 4 | Igual que v4; gatita y búho con los ojos ajustados a los agujeros. |
| Legibilidad | 3 (rev.) / 4 | 4 | A 84 px las cejas contorneadas marcan el gesto y Triste se separa de Alegre por cejas y boca ([expresiones](evidencia/expresiones-claro-it2.png), fila inferior). Dormilón (cejas planas, ojos cerrados) muy claro. |
| Originalidad | 4 | 4 | Los pompones y las cejas de penacho siguen siendo su rasgo propio; menos «anime genérico». |

**Pendiente:** aprobación del usuario; si se quiere el −15 % lineal exacto en los ojos, otra iteración IA o un escalado controlado de la capa de ojos.
