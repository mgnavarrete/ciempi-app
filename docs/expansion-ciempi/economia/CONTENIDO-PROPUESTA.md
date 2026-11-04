# CIEMPI · Propuesta de ampliación de contenido (fase posterior)

Fecha: 2026-11-03 · Estado: **propuesta**, no implementada · Va con [ECONOMIA-V3.md](ECONOMIA-V3.md).

> Lo pidió el usuario (preferencia 6). No se reescriben ahora los cuentos 21–40 (personajes con marca registrada): eso se decide aparte ([revisión de personajes protegidos](../personajes-protegidos/REVISION-PERSONAJES.md), rama `worktree-agent-a4c7575325914c12a`). Las cifras son **estimaciones**; no hay datos de niños.

## 1. Por qué hace falta (lo que mostró el simulador) [I]

- Cada nivel tiene **8 cuentos** (`server/src/cuentos.ts` entrega los 40 a cada niño, cada uno en su nivel) [V].
- Los lectores de N2–N4 terminan los 8 cuentos de su nivel en **2–3 sesiones de 15 min**; P0 tarda unas 8 [I].
- Después solo queda **releer**. Con el modelo E2, en una campaña larga releyendo, **93–96 %** de las monedas vienen de la relectura [I].
  - Releer es valioso para la fluidez, pero solo releer cansa, y casi no deja lugar a los premios de progreso: cuento terminado, sílabas nuevas, nivel completo.
- Si se retiran los cuentos 21–40, quedan **4 por nivel**: el problema se duplica.
- Hoy solo se lee **en voz alta, siguiendo con el dedo**. No hay comprensión ni vocabulario, y no hay actividades distintas de leer.

## 2. Objetivos

1. Que cada nivel tenga contenido nuevo para **al menos 10–12 sesiones de 15 min** de la mediana, frente a 2–8 hoy.
2. Más **variedad pedagógica**: comprensión, vocabulario, fluidez, relectura guiada y actividades breves.
3. Más **variedad temática**, alineada con las colecciones aprobadas: **Fantasía, Naturaleza y Espacio**. Una colección de la tienda puede tener «sus» cuentos, pero las piezas **nunca** se desbloquean por leer un cuento concreto: se compran con monedas, como todo.
4. Que la economía E2 premie **actividades completadas e hitos educativos**, no solo tiempo.

## 3. Tipos de contenido propuestos

| Tipo | Niveles | Qué hace el niño | Cómo se verifica sin audio | Premio en E2 (propuesta) |
|---|---|---|---|---|
| **Cuentos nuevos** (Fantasía, Naturaleza, Espacio) | 0–4 | Lee como hoy | Igual que hoy (reloj, unidades) | Como cualquier cuento |
| **Relectura guiada** (eco o coro) | 0–2 | Ciempi lee una frase y el niño la repite, o leen juntos; después, solo | Que complete la frase en modo eco/coro antes del modo solo | Relectura a 1,5/min (N0–N1) + «relectura con mejora» |
| **Comprensión literal** (1–3 preguntas al final) | 1–4 | Elige entre 2–3 imágenes o palabras: «¿Quién encontró la llave?» | Respuesta correcta en el servidor; las preguntas vienen con el cuento | +1 por pregunta correcta al primer intento, máximo 3 por cuento, una vez por cuento. Sin penalizar el error |
| **Vocabulario** (2–4 palabras por cuento) | 1–3 | Une la palabra con su imagen antes o después de leer | Correcta en el servidor | +2 por cada 25 palabras nuevas (ya está en E2 para N1); en N2–N3, +1 por ficha completada |
| **Sílabas y palabras** (actividades cortas) | 0–1 | Arma una palabra con 2–3 sílabas o encuentra la sílaba que suena | Correcta en el servidor; la voz da la pista | Cuenta como hito educativo (sílabas nuevas); **nunca se paga por toque de sílaba** |
| **Fluidez con frase modelo** | 2–4 | Escucha una frase leída con expresión y la lee | Unidad completada (como hoy) | Como unidad leída |
| **Mini-libros temáticos** (3–5 páginas) | 0–2 | Libros cortos para empezar y terminar en una sesión | Igual que los cuentos | Premio de terminar = min(3, minutos esperados) |

### Criterios de diseño
- **Sin tiempo límite** en ninguna actividad y **sin penalizar el error**: el error se corrige con una pista de la voz.
- **Ninguna actividad paga por estar en la app**, y el tiempo inactivo no cuenta (decisión del usuario).
- **Anuncio después**, sin barras de «te falta», sin rachas y sin cajas sorpresa (ICO estándar 13; Google Play Families).
- **Duración:** cuentos de N0 de 5–8 min a la referencia de 5 síl/min, para que un lector muy lento pueda **terminarlos en una sesión**. Hoy, con ~20 min por cuento, nunca termina uno en 15 min ([ECONOMIA-V3.md §10](ECONOMIA-V3.md)). Conviene ofrecer también **mini-libros de N0** de 3–4 frases.
- **Personajes originales** (Toto, Lolo, Mila, Pipo… de la revisión de personajes protegidos) y nombres que se puedan leer por sílabas.

## 4. Volumen sugerido por fases

| Fase | Contenido | Volumen | Efecto esperado [I] |
|---|---|---|---|
| C1 | Mini-libros de N0 y N1 + preguntas de comprensión en los cuentos 1–20 | 8 mini-libros por nivel; 2–3 preguntas × 20 cuentos | P0 y P1 duplican sus sesiones con contenido nuevo; aparece la comprensión |
| C2 | Cuentos temáticos Fantasía, Naturaleza y Espacio | 4 por nivel × 5 niveles = 20 | N2–N4 pasan de 2–3 a ~5–6 sesiones con contenido nuevo |
| C3 | Fichas de vocabulario y actividades de sílabas | 1 ficha por cuento de N1–N3; 20 actividades de sílabas | Más premios por hitos educativos, menos por tiempo |
| C4 | Sustitutos de los cuentos 21–40 (si el usuario lo aprueba) | 20 | Mantiene 8 por nivel; conserva ids y número de frases para no perder progreso |

## 5. Impacto en la economía y la tienda [I]

- Más contenido nuevo significa más «primera lectura» (2/min) y más premios de progreso. Con textos nuevos, P0 junta el Dragón (80) en 4 sesiones, igual que releyendo (§9 de ECONOMIA-V3). Lo que cambia es la **variedad**, no el precio.
- Comprensión y vocabulario suman como mucho ~3–5 monedas por cuento. Con eso, el componente «tiempo» baja del ~75 % a alrededor del 60 % del ingreso con textos nuevos [I, a simular cuando exista el diseño].
- Las piezas de colección no se ligan a cuentos concretos: así nadie queda sin acceso por no poder leer cierto nivel.

## 6. Qué se necesita y qué decide el usuario [P]

1. Aprobar los tipos de actividad (tabla §3) y su premio.
2. Decidir quién escribe los textos (equipo humano, IA con revisión humana, o ambos), con revisión pedagógica y de dirección artística para las ilustraciones (guía `CIEMPI_ART_DIRECTION.md`).
3. Decidir el orden de las fases C1–C4 y si C4 (cuentos 21–40) avanza.
4. Agregar al modelo de datos las preguntas y fichas por texto (JSON en `textos`, verificables en el servidor). No hay código en esta propuesta.
