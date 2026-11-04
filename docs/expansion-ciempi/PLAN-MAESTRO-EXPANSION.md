# CIEMPI · Plan maestro de expansión: transformaciones, colecciones, animaciones, tienda y herramientas

**Fecha:** 3 de noviembre de 2026.
**Estado:** propuesta pendiente de aprobación. Solo es análisis, investigación y planificación. **Actualización del 3-nov-2026 (economía):** §6, §16 (Fase 0) y §17 (D3, D4, D5) se alinearon con lo que el usuario aprobó: **modelo E2** como referencia, **sin tope diario silencioso ni media tasa**, precios provisionales en dos olas y Cuncuna con 6 de 8 cuentos de nivel 0. Fuente: `economia/ECONOMIA-V3.md` (rama `worktree-agent-a925a3794da34fde2`). No se modificaron código, recursos, compras, monedas ni inventarios. No se instaló nada, no se hizo commit ni push y no se generó APK.

**Cómo se hizo**
- **Lectura del repositorio**, del código y de los documentos: `AGENTS.md`, `CIEMPI_ART_DIRECTION.md` v1.7, la skill `ciempi-art-director`, los laboratorios y el plan maestro v1.
- **Dos investigaciones web**: una de skills, plugins y MCP; otra de imagen IA, SVG, animación y diseño infantil.
- **Super Planner (Fable 5.1)** para ordenar las alternativas, las fases y las decisiones.

**Cómo leer las marcas**
- **[V]**: verificado en el código o en una fuente oficial.
- **[D]**: solo se leyó la documentación. Nada de lo marcado así se probó en la práctica.
- **[I]**: inferencia o recomendación.

---

## 1. Estado actual del proyecto

| Aspecto | Estado verificado |
|---|---|
| Versión | `main` en `3e188ce`, `package.json` 2.4.1 [V]. El resumen anterior sigue vigente. |
| Cambios locales | Hay cambios sin commitear que no son de este trabajo: armario, auditoría, laboratorios, `AGENTS.md` y la guía. No se tocaron. |
| Stack | React 19, Vite 8, TS, Tailwind 4 y Capacitor 8 Android. Servidor Fastify con PostgreSQL. Vitest con unos 17 tests de app más los del servidor [V]. |
| Pruebas visuales | No hay Playwright ni regresión visual en el repo. Los laboratorios usaron Playwright y Edge desde el entorno de Codex [V]. |
| Personaje | Base SVG v2 (viewBox 1000×650) compuesta por `componer.js`, `pose.ts` y un rig propio [V]. Los accesorios ricos (gorros, máscaras, capas, calzado y superficies) son WebP raster. `public/ciempi-v2` ocupa 16 MB y la APK 23,4 MB [V]. |
| Crecimiento | Un segmento por sílaba o palabra leída [V]. `pose.ts` clona los roles cola, centro (1-2-3 en ciclo) y frente sobre posiciones fijas. Fuera de la lectura siempre hay 5 segmentos [V]. |
| Animación | 19 animaciones aprobadas (AD-016) en `src/ciempi/v2/animacion/`, con requestAnimationFrame y sin librerías [V]. Seis no se usan en el juego: A05 Sorpresa, A06 Dormir, A07 Tristeza, A11 Cariño, E06 Estirarse y E07 Recompensa [V]. |
| Tienda | 96 piezas, 6 fondos, 10 comidas y 10 conjuntos con 20 % de descuento. Precios entre 6 y 32; los gestos son gratis. Comprar todo cuesta unas 1 360 monedas [V]. |
| Lo que falta en la tienda | No hay favoritos ni pantalla de progreso del niño [V]. Las mochilas están retiradas a la espera de rediseño [V]. |
| Compras | Se validan en el servidor dentro de una transacción [V]. |
| Monedas | Ver la sección 6. Hay **un problema grave**: el servidor acepta las monedas que manda el cliente sin cotejarlas. Además hay dos bugs [V]. |
| Riesgo legal | Los cuentos 21–40 usan personajes con marca registrada (Spider-Man, Barbie, Harry Potter…). Varias variantes de la tienda llevan nombres de Hogwarts [V]. Hay que resolverlo antes de publicar en Play. |

## 2. Resumen de la dirección artística

**Lo obligatorio** (`CIEMPI_ART_DIRECTION.md` §2, AD-001):
- cabeza redonda (centro 736,340, r 130);
- cuerpo de segmentos redondeados y superpuestos;
- piernas gruesas y marcha curva;
- contorno azul oscuro `#243e5b`, de grosor 7 en la referencia;
- ilustración amable y expresiva;
- luz superior izquierda;
- los accesorios se adaptan al cuerpo y no al revés;
- al quitar los accesorios vuelve la base.

**Lo flexible:**
- temas, paletas, materiales y siluetas de accesorios;
- asimetrías;
- máscaras completas;
- no es obligatorio llevar el jockey ni el cuerpo naranja.

**Método:**
- **Orden de trabajo:** silueta y proporciones → integración, expresión y material → detalle.
- **Evidencia:** antes y después en `docs/rediseno-ciempi/revisiones/<revisión>/<pieza>/`, con vistas a 240 y 320 px y al tamaño real del juego.
- **Rúbrica 1–5** en coherencia, calidad, integración, legibilidad y originalidad. Cada nota exige una observación concreta y no se promedian.
- **Aprobación explícita** para cambios de identidad (§13), registrada como AD-0xx.

**Lecciones que condicionan este plan**
- B01 mostró que Image Trace y el calco automático producen juntas, saltos de color y cientos de parches: nota 2/5 frente a 4/5 del raster.
- Desde B06, los accesorios ricos se mantienen como **raster IA**, guardando el maestro PNG.
- Solo se vectoriza reconstruyendo por planos.
- **Un nuevo personaje no puede verse más "realista" o de otro sistema gráfico que Ciempi.**

## 3. Evaluación crítica de la experiencia infantil

**Lo que funciona bien**
- Cinco niveles de lectura con mecánicas distintas.
- Voz natural pregrabada.
- Ciempi crece al leer, que es la mejor metáfora del juego.
- Una dirección artística seria, con proceso de aprobación.
- Tienda sin dinero real, sin cajas aleatorias y sin temporizadores.
- Tope de monedas por libro.
- Gestos gratis.
- Vista previa antes de comprar.

**Lo que hay que mejorar**
1. **En la lectura, Ciempi es diminuto.** La cabeza mide unos 35–47 px dentro de una pista de 84 px. Ahí está casi todo el tiempo de uso. No conviene agrandarlo, porque taparía el texto, pero sí darle más vida (ver §7 y §8).
2. **Comer no tiene animación.** La manzana desaparece y aparece un segmento. Ese es el momento con más dopamina del juego y hoy pasa desapercibido.
3. **No hay pantalla de progreso para el niño.** Lo que ha logrado no se ve fuera del panel del adulto.
4. **La pantalla final de los niveles 0, 1 y 3 subestima el premio**: muestra solo la moneda de la última frase.
5. **El catálogo está muy concentrado en cabeza y cara.** Faltan mochilas y no hay nada que cambie la silueta del personaje.
6. **Rendimiento:** en cada sílaba se recompone el SVG completo (DOMParser, `innerHTML` y un rig nuevo). No se ha medido en un Android de gama baja.

**Lo que no conviene hacer**
- No vender nada nuevo mientras las monedas sean manipulables.
- No pasar a 7 especies de golpe.
- No pagar moneda por sílaba.
- No usar rachas, ofertas limitadas ni mensajes del tipo "te faltan 3 monedas".
- No cambiar el motor de animación aprobado.

## 4. Nuevas transformaciones del personaje

### Arquitectura recomendada: especies compatibles con el esqueleto

Una **especie** es otra base SVG con los **mismos ids** que usa el compositor: `body`, `legs-and-sneakers`, `head`, `face-accessory`, `neck-front`, `back-accessory`, `antennae`, `eyes`, `mouth` y `jockey`. Comparte la misma topología, una cabeza más N segmentos más patas, y tiene su propia tabla de anclajes y pivotes.

**Principio central: la cabeza no cambia.**
- Todas las especies conservan el círculo de la cabeza, la geometría de los ojos y el ancla del cuello.
- Los hocicos, crestas, orejas y colas se *suman* en grupos propios y nunca desplazan el círculo.
- Así, gorros, máscaras, lentes, peinados, expresiones B03 y bufandas sirven para todas las especies **sin reencuadrar un solo raster**.
- Esto es una decisión de identidad del sistema (§13), así que necesita tu aprobación (decisión D2).

```ts
// propuesta: src/ciempi/v2/especie.ts (puro, importable por el servidor)
interface Especie {
  id: 'ciempi' | 'dragon' | 'cuncuna' | …;  item: 'especie:dragon'
  base: string                                   // SVG maestro con los mismos ids
  segmentos: { rolesCentrales: 1|2|3; xs: number[]; ys: number[]; paso: number[] }
  patas: { porSegmento: boolean; pieCabeza: boolean }
  pivotes: { suelo; centro; cabeza; cuello; cadera; tobillo }
  anclas: { pies: {x,y,giro}[]; espalda: {x,y}; superficieClip: string }
}
```

### Accesorios: universales, adaptables y exclusivos

Se añade un campo nuevo, generado por `scripts/generar-tienda-ciempi.mjs`.

| Tipo | Qué incluye | Regla |
|---|---|---|
| **Universal** (por defecto) | Cabeza, cara, pelo, detalle, gesto, ojos, cuello, paleta, fondo y comida | Se dibuja igual en todas las especies, porque cuelga de la cabeza o el cuello, que no cambian |
| **Adaptable** | Pies, textura y capas | La pieza declara un asset alternativo por especie, o se le aplica un ajuste `translate/scale` según el ancla de la especie. Si la especie no tiene patas, el calzado queda *oculto, sin desequiparlo* |
| **Exclusivo** | Alas, cresta, placas… | Solo aparece en la tienda y en el personaje de su especie. En las demás se oculta conservando la compra |

- Un resolvedor puro, `compatibilidad.ts`, decide qué se ve y qué se oculta. Se testea con Vitest y lo usan la vista previa, el guardado y el servidor.
- **Datos:** `perfiles_ninos.ciempi` (JSONB) recibe `especie`, que vale `especie:ciempi` por defecto. `inventario` sigue igual.
- **Sin cambios estructurales ni migraciones destructivas.** Las compras y el progreso son compartidos.

### Qué especies conviene hacer

| Especie | Ventajas | Inconvenientes | Recomendación |
|---|---|---|---|
| **Dragón** | La más atractiva. Pone a prueba todas las reglas: cresta y alas exclusivas, garras adaptables, escamas como textura y cola con punta | Silueta a media distancia de Ciempi | **Piloto 1** |
| **Cuncuna** | Muy cercana a Ciempi, coste bajo, palabra chilena | Puede quedar como un "Ciempi peludo" (originalidad 2) si la silueta no se decide bien | **Piloto 2** |
| Serpiente | Silueta muy distinta | Sin patas: necesita otra rama del rig y oculta todo el calzado comprado | Tercera ola |
| Robot | Atractivo | Choca con el conjunto Robot que ya existe | Fusionarlo o retirar el conjunto antes |
| Dinosaurio | Atractivo | Casi indistinguible del Dragón a 40 px | No, por ahora |
| Criatura mágica o monstruo simpático | Originales | Hay que definir bien la silueta | Ola 3, en formato concurso de siluetas |

**Ideas originales para olas futuras [I]**
- **Ciempi Nube**: segmentos algodonosos que dejan gotitas al caminar.
- **Lagartija de Luz**: segmentos traslúcidos que se encienden al leer.
- **Ciempi Coral**: segmentos marinos y burbujas.
- **Ciempi Origami**: segmentos de papel plegado, que conecta con los libros.

Todas se proponen solo con la regla de la cabeza que no cambia.

## 5. Propuesta de nuevas colecciones

**Principios**
- Pocas colecciones y bien hechas.
- Una pieza puede estar en varias colecciones sin duplicarse.
- Nada se reserva por género.
- No se repite una pieza para inflar el catálogo.
- El catálogo total no debería superar 2,4 veces lo que se gana en la primera lectura de todos los cuentos; hoy es 2 veces.

**Primera ola: 3 colecciones de 4 a 6 piezas**

| Colección | Idea | Piezas posibles | Especies |
|---|---|---|---|
| **Fantasía** | Un reino de cuentos | Corona de hojas, capa de escamas (adaptable), alas de dragón (exclusivas), botas de caballero | Dragón y Ciempi |
| **Naturaleza** | El jardín donde vive Ciempi | Gorro de pétalos, pelaje de cuncuna (textura), bufanda de musgo, mochila de hoja (para estrenar el rediseño de mochilas) | Cuncuna y Ciempi |
| **Espacio** | Ya existe el fondo Espacio | Casco de burbuja, traje de constelaciones (superficie), botas lunares, mochila cohete | Todas |

**Olas siguientes:**
- Acción: armaduras suaves y antifaces.
- Deportes: casco de bici, zapatillas de fútbol y gorra de béisbol.
- Tecnología: visor, placas y mochila jetpack.
- Ternura: orejitas, pantuflas y bufanda de corazones.
- Magia: sombrero estrellado y varita en la cola.
- Aventura: casco de explorador, que ya existe, más una brújula.

Todas se pasan por la rúbrica y la sección 8 de la guía (familias con defectos ya documentados).

## 6. Revisión de las monedas del nivel 0

**Cómo funciona hoy [V]** (`src/lectura/monedas.ts` y `PantallaLectura.completar()`)

| Pregunta | Respuesta |
|---|---|
| ¿Cuándo se pagan? | Al terminar cada frase, de hasta 8 palabras con una manzana por sílaba. Solo si es la primera vez que se lee, en un tramo continuo y sin tropiezo. Las vistas previas del adulto no pagan. |
| ¿Cuántas? | 1 por frase, con tope de 10 por cuento. Los cuentos de nivel 0 tienen entre 7 y 9 frases, así que dan 7–9 monedas cada uno y unas 65 por nivel. El nivel 1 da 80. |
| ¿Cómo se muestran? | Una moneda al final de la pista, la píldora "+N 🪙" que sube, un sonido y el contador. Al final del libro, A10 Victoria. |
| ¿Cómo se guardan? | El cliente llama a `POST /api/perfiles/:id/monedas {cantidad}`. El progreso va en `asignaciones.leido_hasta/premio_hasta`. |
| ¿Qué pasa al repetir? | **Bug:** en los niveles 0, 1 y 3 la relectura nunca paga, porque `premio_hasta` no llega nunca a 100 al no haber hitos. |
| ¿Cómo se evitan duplicados? | **Solo en el cliente.** El servidor acepta ±100 por llamada, sin límite de llamadas y sin cotejar con el progreso (`server/src/app.ts:392`). Con el token del niño se pueden crear monedas sin límite. |
| ¿Otras fugas? | El nivel 2 no tiene tope. Borrar y volver a subir un texto propio reinicia el progreso y vuelve a pagar. Si falla la red, la moneda se pierde porque no hay cola. |
| Pantalla final | **Bug:** en los niveles 0, 1 y 3 muestra como "premio" solo la moneda de la última frase. |

**Propuesta: Fase 0, antes de ampliar la tienda**

> **Actualizado (3-nov-2026).** Los puntos 4, 5 y 6 quedaron reemplazados por el **modelo E2** de `economia/ECONOMIA-V3.md` §6, aprobado por el usuario como referencia (no aplicado en producción). El usuario **rechazó** el tope diario silencioso y la media tasa: prefiere antiabusos que no castiguen a los niños lentos. Se conservan los textos originales tachados para trazabilidad.

1. **Registro de premios en el servidor.** Un `POST /premios {textoId, nivel, hasta, total, operationId}` donde el servidor calcula el pago con el mismo `monedas.ts`, que es puro. Una tabla `premios` con `operation_id` único. `/monedas` queda solo para adultos, con motivo.
2. **Cola offline e idempotente** para que no se pierdan monedas.
3. **Corregir la pantalla final y la relectura.**
4. ~~**Tope en el nivel 2**: 14 por libro.~~ Con E2 el nivel 2 no necesita tope propio: cada oración paga por su tiempo activo, hasta 2× lo esperado (el texto de 300 oraciones baja de 305 a ~15 monedas). `topePorLibro[2] = 14` queda solo como interino si E2 no llegara a producción (ECONOMIA-V3 §7).
5. ~~**Tope diario silencioso** en el servidor, por ejemplo 60 monedas.~~ **Rechazado por el usuario**, igual que la media tasa después de 45 min. En su lugar (ECONOMIA-V3 §8 y §11): **reloj del servidor que se adelanta con los segundos pagados** (nadie cobra más rápido que el tiempo real; ráfaga máxima ~1 h), **dificultad real** en los textos que no son de la biblioteca, huella contra duplicados, premio de terminar proporcional, plausibilidad mínima y **avisos visibles al adulto**. Ninguno frena al lector lento. Límite reconocido: el reloj no demuestra lectura real.
6. ~~**Nivel 0: 2 monedas por frase, con tope de 10 por cuento.**~~ Reemplazado por **E2**: cada frase completada paga 2 monedas por minuto activo (hasta 2× lo esperado; referencia N0 = 5 síl/min), más terminar cuento (min(3, minutos esperados)), sílabas o palabras nuevas, relectura por minuto, relectura con mejora y nivel completo. Nunca paga por tener la app abierta. P0 pasa de ~8 a ~21 monedas en 15 min y la brecha por minuto entre perfiles baja de 15× a 1,34× [I, simulado]. **La sílaba se sigue celebrando con la animación de comer, no con moneda** (Marinak y Gambrell, 2008).
7. **Recompensas especiales**, anunciadas después y no antes. Por ejemplo, terminar los 8 cuentos de un nivel regala una pieza exclusiva (en E2, además, +15 monedas por nivel completo; la pieza sigue pendiente de decisión).
8. **Precios provisionales E2, en dos olas** (aprobados como referencia, no aplicados): básico **10**, común **16**, especial **24**, obra **30**, conjuntos **~60–85**, **Dragón 80**; catálogo actual sin cambios. Se calcularon con las sesiones de un niño de nivel 0 (ECONOMIA-V3 §9).
9. **Cuncuna gratis** con **6 de los 8 cuentos de nivel 0** (registro de premios del servidor), o 6 cuentos de Ciempi de cualquier nivel para quien empieza en N1+, o 60 min activos + 30 frases distintas de N0 para lectores lentos, o regalo del adulto (ECONOMIA-V3 §10; TIENDA-V3 §4.6).

## 7. Ideas para que Ciempi sea más protagonista

| Pantalla | Hoy [V] | Propuesta [I] |
|---|---|---|
| **Portada** | 380 px como máximo; saluda al tocarlo | Usar A05, A06 y A11, que están sin uso: duerme si nadie toca la pantalla en 30 s, se sorprende al volver y hace cariño al tocarle la cabeza. Un globo de diálogo que sugiera el siguiente libro. |
| **Lectura** | Cabeza de 35–47 px en una pista de 84 px | **No agrandarlo.** Darle vida: animación de comer (§8), mirar hacia la siguiente manzana y una ola corporal al crecer. Composición alternativa (A/B): Ciempi parte desde la izquierda y no desde detrás del texto. |
| **Tienda** | `h-72`, sin interacción | Activar los toques (A04), girarlo en la vista previa para ver la espalda y la capa, y comparar "antes/después" al probar. |
| **Fin de libro** | `w-64` | `w-80`, comiendo la "fruta final" del libro y con E07 Recompensa (moneda sobre la cabeza) si hay premio. |
| **Progreso del niño** | No existe | Pantalla nueva: Ciempi a 320 px con su especie y su ropa, los libros leídos como frutas de un árbol, y el récord de su cuerpo más largo. |
| **Celebración de hito** | Texto | Ciempi da una vuelta (A03) y la cámara se aleja un poco para mostrar todo su largo. |

**Tres composiciones para comparar en el laboratorio**

| Composición | Cómo es | Ventaja | Riesgo |
|---|---|---|---|
| **(a) Héroe central** | Portada con Ciempi al 60 % del alto | Máximo protagonismo | Empuja los libros fuera del primer vistazo |
| **(b) Compañero lateral** | Ciempi a la izquierda; libros y botones a la derecha | Equilibrio en horizontal | Ciempi más pequeño |
| **(c) Escenario** | Ciempi sobre su fondo comprado, con los libros como frutas en una rama | Muy temático | Requiere más arte y es menos claro para el adulto |

**Recomendación:** (b) en el juego y (c) solo en la pantalla de progreso.

## 8. Propuesta de animación de frutas

**E08 "Comer"**, añadida en `animaciones.js` con el mismo lenguaje que E07: dura 0,8 s y se puede interrumpir.

| Tiempo | Qué pasa |
|---|---|
| 0–0,25 s | La fruta salta un poco (*squash*) y Ciempi gira la cabeza −6° y la mira |
| 0,25–0,55 s | La fruta vuela en curva hacia la boca, que se abre (expresión B03 *sorprendido*) y muerde (*carcajada*) |
| 0,55–0,8 s | La fruta se encoge con 4 brillos, Ciempi vuelve a *alegre* y el nuevo segmento aparece con un "pop" de escala |

**Reglas de uso**
- Si llega otra sílaba durante la animación, se salta directo al mordisco. Nunca retrasa la lectura.
- La micro-recompensa es un sonido corto y un brillo. **No da moneda**; la moneda sigue al final de la frase.
- Con `prefers-reduced-motion` o el modo tranquilo, solo cambia la expresión.
- La fruta que se come es la comida que el niño eligió en la tienda (manzana, frutilla…), lo que conecta la tienda con la lectura.
- Se reutiliza A03 al terminar la frase y E07 en los desbloqueos.

**Requisito previo de rendimiento**
- Componer una sola vez con `nMax` igual al número de manzanas y pasar `visibles` al rig, que oculta y muestra segmentos sin reparsear el SVG.
- Medir con `performance.mark` en un Android de gama baja. Objetivo: menos de 16 ms por unidad y ningún reparseo durante la frase.

## 9. Generación de imágenes con IA

**Qué hay disponible hoy**

| Herramienta | Estado |
|---|---|
| **Codex CLI `image_gen`** | **Disponible y real** [V]: Codex 0.165, con sesión de ChatGPT y la función `image_generation` estable y activa. Es lo que se usó en B03 y B06–B12, con el patrón *"edit first reference, preserve Ciempi exactly, navy #243e5b outlines"* y salida en PNG RGBA. Sin API key ni coste extra. |
| `antigravity_image` (MCP agent-intern) | **No funciona en WSL** [V]: el CLI `agy` no está en el PATH. Además, el puente está desactualizado (v0.29.1; existe la v0.34.0). |
| Claude Code | No genera imágenes por sí mismo. **Dibujar SVG con código no es generación de imágenes.** |

**Alternativas externas** [D] (no se contrató ni se probó nada)

| Opción | Referencias | Fondo transparente | SVG | Coste | Nota |
|---|---|---|---|---|---|
| GPT Image por API | Varias | **Sí**, con `background: transparent` | No | Pago por token | La misma familia que Codex, pero con control de máscara |
| Gemini Nano Banana Pro / NB2 | **Hasta 14** (5 de personaje) | No documentado | No | $0,034–0,134 por imagen; la API no tiene capa gratis | Bueno para explorar especies; lleva marca SynthID |
| Recraft | Estilos propios a partir de referencias | Quita fondos ($0,01) | **Sí, nativo** ($0,08) | El plan gratis no permite uso comercial | El único con SVG nativo y estilo de marca |
| FLUX, Midjourney, Scenario y Leonardo | — | — | — | — | Licencia no comercial, sin API, o modelos entrenados de pago: no prioritarios |
| Local (ComfyUI + LoRA de Ciempi) | Máxima consistencia | Hay que quitar el fondo después | No | GPU de 12–24 GB | Futuro, solo si el catálogo crece mucho |

**Para quitar fondos:** BiRefNet (MIT, local) o Recraft.

**Flujo recomendado**
1. Hoja de modelo de la especie, empezando por la silueta.
2. Codex `image_gen` editando siempre sobre la referencia v2 aprobada.
3. Revisar halos y contorno.
4. Decidir vector o raster según la regla de §10.
5. Probar en el laboratorio.
6. Ficha de revisión.

Los prompts, el modelo y la fecha se guardan en `revisiones/<T0x>/ia/`. Nano Banana o Recraft solo se usarían con tu autorización y tus credenciales.

## 10. Herramientas SVG y vectorización

**Regla fija por tipo de pieza [I, basada en B01]**

| Tipo de pieza | Formato | Cómo se hace |
|---|---|---|
| Lo que `pose.ts` clona o el rig mueve: segmentos, pies, cabeza con hocico o cresta, cola | **Vector** | Reconstruido por planos: base, sombra, luz y contorno, con `linearGradient` reales y `data-color-role` para recolorear |
| Piezas ricas que no se deforman: alas, placas, accesorios de colección | **Raster** | WebP 2× (unos 512 px por lado mayor), guardando el maestro PNG 1024 fuera de `public/` |

**Herramientas [D]**
- **vtracer** (MIT): el mejor trazador a color, pero imita los degradados con capas planas. Sirve solo para siluetas y referencias.
- **potrace**: solo monocromo.
- **Recraft vectorize** ($0,01): vale la pena probarlo con 2 o 3 piezas.
- **SVGO**: siempre, con un preset que no elimine `<defs>` ni los ids que usa el rig.
- **sharp**: ya está en `node_modules`, aunque falta declararlo.
- **StarVector y OmniSVG** todavía no están listos.

**Illustrator desde WSL**
- **Lo que ya funcionó [V, B01]:** `powershell.exe -Command` → COM `Illustrator.Application` → `DoJavaScript`.
- **Exportación:** `ExportOptionsSVG` en SVG 1.1, nunca en *Tiny*, porque ese formato abrió un diálogo modal que bloqueó la automatización.
- **Convención:** una capa por pieza del rig, con el pivote en una capa auxiliar.
- **UXP para Illustrator** no es público en 2026 [D].
- **MCP comunitario** `ie3jp/illustrator-mcp-server` [D]: en Windows dice "no probado", y desde WSL no llega a Illustrator directamente.

**Presupuestos de peso por especie**
- Maestro SVG: 120 KB o menos.
- Raster exclusivos: 300 KB o menos.
- `public/ciempi-v2`: 20 MB o menos con dos especies.
- APK: 28 MB o menos.
- Carga perezosa: solo se descarga la especie equipada.

## 11. Herramientas de animación

| Opción | Cuándo usarla | Coste | Encaje |
|---|---|---|---|
| **Rig propio (actual)** | **E08 y el piloto de especies** | 0 | Total: AD-016 aprobó estas animaciones |
| **GSAP** | Si hace falta una cadena "follow-the-leader" con retardo (ondulación de serpiente o dragón largo) o líneas de tiempo interrumpibles que obliguen a reescribir más de unas 200 líneas de `motor.js` | Gratis, todos los plugins incluidos [D] | Como capa de línea de tiempo sobre `rig.aplicar`, sin tocar los trazados |
| **dotLottie** | Ráfagas o confeti cerrados | Gratis | Solo efectos, no el personaje |
| Rive | Solo si se piden alas o capas con deformación de malla | Cadet a $9 al mes por puesto [D]. Tiene MCP oficial en *early access* | Obliga a rehacer los assets e invalida la evidencia de AD-016 |
| Spine | Deformación de malla profesional | $379 [D] | Obliga a migrar a PixiJS: no recomendado |

**Recomendación:** seguir sin librería y adoptar GSAP solo si se cumple el criterio de la tabla.

## 12. Comparación de skills, plugins y MCP

Todo se verificó en su fuente [D]; **ninguno se instaló ni se probó**.

| # | Nombre | Fuente | Función | Tipo | Requisitos y coste | Beneficio para Ciempi | Riesgos | Instalación | Recomendación |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Recraft MCP remoto (oficial) | https://www.recraft.ai/docs/mcp-reference/remote-server.md | SVG nativo, vectorizar, quitar fondo, inpainting y estilos propios | MCP HTTP | Cuenta con OAuth; créditos de pago (el plan gratis no permite uso comercial) | La única opción con SVG y estilo de marca | Los assets se suben a un tercero y la retención de datos no está documentada | Baja | **Probar** con 2 o 3 piezas |
| 2 | typescript-lsp | https://github.com/anthropics/claude-plugins-official | Diagnósticos de TS en el agente | Plugin oficial | Gratis | Precisión al tocar `pose.ts`, la tienda y el servidor | Mínimos | Baja | **Instalar** |
| 3 | Adobe for creativity | https://www.adobe.com/adobe-connectors/adobe-for-claude.html | Firefly, Photoshop e Illustrator por conector | Plugin con conector remoto | Cuenta Adobe; algunas funciones son de pago | Aprovecha la licencia de Adobe que ya tienes | Alcance poco documentado (su `plugin.json` dio 404) | Baja | **Probar** tras revisar sus herramientas |
| 4 | ie3jp/illustrator-mcp-server | https://github.com/ie3jp/illustrator-mcp-server | Unas 63 herramientas para Illustrator vía JSX | MCP o plugin | Node 20; MIT; 194★ | Exportar capas y revisar nombres | Windows no probado, no llega desde WSL, tiene herramientas destructivas | Media-alta | **Probar con cautela** sobre copias |
| 5 | LottieFiles/motion-design-skill | https://github.com/LottieFiles/motion-design-skill | Principios de motion design | Skill (solo Markdown) | Gratis, MIT | Criterio de *timing* para E08 y las recompensas | Se solapa con las skills de animación instaladas | Baja | **Probar** |
| 6 | greensock/gsap-skills (oficial) | https://github.com/greensock/gsap-skills | Uso correcto de GSAP | Skill o plugin (Markdown) | Gratis, MIT, 17,8k★ | Solo si se adopta GSAP | Mínimos | Baja | Condicional |
| 7 | zhongweili/nanobanana-mcp-server | https://github.com/zhongweili/nanobanana-mcp-server | Gemini Image con referencias y edición | MCP | `GEMINI_API_KEY` de pago; MIT; 403★ | Más referencias por imagen | Credencial y coste | Baja | Solo si Codex no da consistencia |
| 8 | Rive Editor MCP (oficial) | https://rive.app/docs/editor/ai/mcp | Rigging, huesos y *state machines* | MCP local | App Rive *early access* | Exploración futura | Cambio de motor; WSL ↔ 127.0.0.1 | Media | Posponer |
| 9 | Comfy-Org/comfy-mcp | https://github.com/Comfy-Org/comfy-mcp | Flujos ComfyUI con LoRA, IP-Adapter y ControlNet | MCP | GPU; AGPL | La mayor consistencia posible | Complejidad y licencia | Alta | Posponer |
| 10 | diffusionstudio/lottie | https://github.com/diffusionstudio/lottie | Escribe JSON Lottie y lo previsualiza | Skill | Gratis, MIT | Ráfagas de recompensa | Escribe en su propio proyecto Vite | Media | Probar fuera del repo |
| 11 | chrome-devtools-mcp / frontend-design | https://github.com/anthropics/claude-plugins-official | Trazas de rendimiento y diseño de UI | Plugins oficiales | Gratis | Medir E08 y rediseñar la tienda | Se solapa con `impeccable` | Baja | Probar `chrome-devtools-mcp` en la fase C |
| 12 | anthropics/skills `webapp-testing` | https://github.com/anthropics/skills | Playwright en Python | Skill | — | — | Ya existen Playwright MCP y `toHaveScreenshot` | — | Descartar |
| 13 | ConechoAI/Nano-Banana-MCP | https://github.com/ConechoAI/Nano-Banana-MCP | Gemini Image | MCP | API key | — | **Lee rutas arbitrarias y las envía a Google; guarda la clave en texto plano** (código revisado) | — | **Descartar** |
| 14 | vtracer / SVGO / sharp | https://github.com/visioncortex/vtracer · https://github.com/svg/svgo · https://github.com/lovell/sharp | Trazado, optimización y conversión | CLI o librerías (no hace falta MCP) | Gratis | Pipeline de assets | — | Baja | Usar SVGO y sharp por script |

**Ya instaladas y útiles sin hacer nada:**
- `ciempi-art-director` (del proyecto);
- `impeccable`, para la tienda y la pantalla de progreso;
- `animation-performance`, `improve-animations` y `find-animation-opportunities`;
- `web-design-guidelines`;
- Playwright MCP.

**Para la regresión visual no hace falta ninguna skill:** basta `@playwright/test` con `toHaveScreenshot()` y una carpeta de *baselines*. Eso resuelve la limitación del script de auditoría, que sobrescribe sus láminas. **Para Android:** Maestro, que soporta WebView y Capacitor [D].

## 13. Las mejores skills para instalar (pendiente de tu aprobación)

1. **typescript-lsp**: oficial, sin riesgo, y ayuda en todo el trabajo de código.
2. **Recraft MCP remoto**: solo para una prueba acotada de vectorización y estilo. Requiere tu cuenta; los créditos son de pago si los assets son para uso comercial.
3. **LottieFiles/motion-design-skill**: solo Markdown, aporta criterio para E08.
4. **Adobe for creativity**: después de revisar qué herramientas expone.
5. **Actualizar el puente agent-intern** (`uvx agent-intern@latest`) y conectar `agy` en WSL. Así habría un segundo generador, Gemini, incluido en tu plan AI Pro, sin pagar API.

**Lo que no recomiendo instalar ahora:** el MCP de Illustrator, Rive, ComfyUI y cualquier MCP de Nano Banana con API key de pago.

## 14. Investigación del Super Planner de Fable

| Pregunta | Respuesta [V] |
|---|---|
| ¿Qué es? | Un **subagente de Claude Code**, no una skill, un plugin ni un MCP. Está definido en `~/.claude-oddness/agents/super-planner.md` y corre sobre el modelo `claude-fable-5-1` con *effort* alto. |
| ¿Cómo se invoca? | Con la herramienta Agent y `subagent_type: super-planner`. Exige incluir en el prompt una cita textual de la confirmación del usuario. Sin ella responde "BLOQUEADO". |
| ¿Qué necesita? | El problema, las restricciones y, sobre todo, los hechos verificados. Le pasé un dossier con todo lo verificado en el código y en las fuentes. |
| ¿Qué produce? | Un plan: enfoque elegido y descartado, pasos con archivos concretos, dependencias, riesgos, fases y decisiones pendientes. No ejecuta cambios. |
| ¿Se usó? | **Sí, y funcionó.** Las secciones 4, 6, 8, 16 y 17 se basan en su plan, contrastado con el análisis del repositorio. |
| Límites | No todas las cuentas tienen acceso a Fable. Cada invocación necesita una confirmación explícita. Planifica, pero no reemplaza la revisión visual ni tu aprobación. |

## 15. Laboratorio creativo de transformaciones

**Ubicación:** `docs/rediseno-ciempi/laboratorio-transformaciones/`, como HTML estático igual que los dos laboratorios actuales. Reutiliza `src/ciempi/v2/arte` mediante un script de exportación.

**Funciones**
- Selector de **especie** y control de segmentos N: 0, 1, 2, 5, 8, 12, 22 y 40.
- **Accesorios por categoría** con una etiqueta en cada uno: *universal*, *adaptable*, *exclusivo* u *oculto en esta especie*.
- Paletas y texturas.
- Las 20 animaciones (19 más E08), cuadro a cuadro, con velocidad ajustable y movimiento reducido.
- **Comparación A/B lado a lado** con la misma semilla, por ejemplo especie contra especie o versión contra versión.
- Tamaños de 84 px (pista real), 96, 240 y 320, con fondo claro, oscuro o comprado.
- **Restaurar a Ciempi** para comprobar que no quedan restos.
- Exportar láminas a `revisiones/<T0x>/` sin pisar `auditoria/`.
- Regresión visual con `toHaveScreenshot` y una carpeta de *baselines* versionada.
- Contador de ms por cuadro.

## 16. Plan maestro de implementación

**Orden de las fases:** 0 → (A ∥ B) → C → D → E → F. La Fase 0 se adelanta porque no conviene ampliar la tienda sobre monedas manipulables.

| Fase | Objetivo | Funcionalidades y recursos | Herramientas y skills | Depende de | Riesgos | Complejidad | Pruebas | Criterio de aprobación | La desbloquea |
|---|---|---|---|---|---|---|---|---|---|
| **0 · Saneamiento económico y legal** | Que la expansión no se monte sobre monedas manipulables ni sobre marcas registradas | Registro de premios en el servidor, cola offline, bugs de relectura y pantalla final, modelo E2 detrás de una bandera (sin tope diario; reloj sobre segundos pagados), Cuncuna en el servidor, documentos de economía al día. Reescribir los cuentos 21–40 y renombrar las variantes de Hogwarts (si lo apruebas) | Vitest, Fastify, SQL `012`; `code-review`, `security-review` | — | Una APK vieja contra el servidor nuevo: mantener `/monedas` acotado durante una versión | M | Idempotencia, relectura en los niveles 0, 1 y 3, pantalla final, modo avión | El saldo nunca es negativo, un reenvío no duplica, la cola se reproduce | D3, D4, D7, D8 |
| **A · Investigación y herramientas** | Contrato de especie y medición | `especie.ts` (Ciempi como primera especie, sin cambio visual), `compatibilidad.ts` con tests, marcas de rendimiento, Playwright `toHaveScreenshot` solo en desarrollo, kit de prompts para Codex, instalación de las skills que apruebes | Codex `image_gen`, `typescript-lsp`, `animation-performance` | — | Sobrediseñar el contrato: limitarlo a lo que piden Dragón y Cuncuna | S | `pose.test` parametrizado | **Ciempi idéntico píxel a píxel** con la nueva firma | D2, D13 |
| **B · Exploración artística** | Dragón y Cuncuna aprobados en silueta y lámina | 3 siluetas por especie a 84 y 320 px, lámina completa, despiece por roles; pies adaptables, cresta y alas del Dragón, pelaje de Cuncuna; maestros vectoriales | Codex `image_gen`, Illustrator COM (SVG 1.1), SVGO, sharp, `ciempi-art-director` | A (en paralelo) | La IA se aleja del estilo: siempre editar sobre la v2. Dragón genérico: pedir 3 direcciones | M | Láminas a 84, 240 y 320; ficha con la rúbrica | Criterios de §10 y §12 de la guía, más **tu aprobación** (AD-017 y siguientes) | D1, D2 |
| **C · Prototipos y laboratorio** | Todo funcionando fuera del juego | `pose`, `rig` y `componer` parametrizados; `nMax` con segmentos visibles; E08 Comer; variante de marcha por especie; laboratorio de transformaciones | Vite, sharp, `chrome-devtools-mcp` (opcional) | A, B | El rig confunde partes de la especie (alas tratadas como cabeza) | L | `pose`, `compatibilidad` y `animaciones` con test, *snapshots* | Ciempi base idéntico; Dragón con 8 universales, 2 adaptables y 1 exclusivo sin piezas flotando; E08 por debajo de 16 ms | D9, D12 |
| **D · Validación** | Evidencia formal | Matriz de la §10 de la guía por especie; N de 0 a 40; paletas; rendimiento en 2 Android reales (uno de gama baja); prueba opcional con 3 a 5 niños | Playwright, Maestro, `web-design-guidelines` | C | Validar solo en escritorio | M | Fichas completas, sin notas inventadas | Firmas AD de cada especie | — |
| **E · Integración** | Usar y vender especies sin presión | Sección "Personajes", bundle de especie, colecciones como filtro, sección "Gratis", favoritos en JSONB, recompensas especiales, pantalla de progreso, fin de libro más grande, toques en la tienda, mochilas de la colección Naturaleza | `impeccable`, tests de catálogo y servidor | 0, C, D | Romper apariencias antiguas: normalizar `especie` | L | Compra atómica, apariencia antigua intacta | Inventario previo visible y sin dark patterns (§3) | D5, D6, D10, D11 |
| **F · Compilación y despliegue** | Publicar | Servidor → web → APK; `GET /api/version`; presupuestos de peso; *rollback* | `run`, `deploy/actualizar.sh`, `npm run apk` | E | APK nueva contra servidor viejo | S–M | APK vieja y nueva contra servidor nuevo; modo avión | APK de 28 MB o menos; primera carga sin especies que no estén equipadas | Tu orden de publicar |

## 17. Decisiones pendientes de tu aprobación

Las decisiones D3, D4 y D5 ya se resolvieron (3-nov-2026). Los precios reales y la economía de producción siguen sin cambiarse hasta una aprobación aparte.

| # | Decisión | Opciones | Recomendación |
|---|---|---|---|
| D1 | Especies del piloto | (a) Dragón + Cuncuna · (b) Dragón + Serpiente · (c) solo Dragón | **(a)** |
| D2 | **La cabeza no cambia entre especies** (decisión de identidad, §13) | Sí: los accesorios de cabeza sirven para todas · No: accesorios por especie | **Sí**, registrada como AD-017 |
| D3 | Monedas del nivel 0 | 2 por frase con tope 10 · mantener 1 con tope 10 · pagar por sílaba · modelo E2 | **Resuelta: E2** aprobado por el usuario como referencia (ECONOMIA-V3 §6); 2 por frase con tope 10 solo como mínimo si E2 no llega a producción. Pagar por sílaba, descartado. La sílaba se celebra con E08 |
| D4 | Tope diario silencioso en el servidor | Sí (60) · No | **Resuelta: No.** El usuario rechazó el tope diario silencioso y la media tasa. Antiabusos que no castigan al lento: reloj del servidor sobre los segundos pagados, dificultad real, huella, premio proporcional y avisos al adulto (ECONOMIA-V3 §8) |
| D5 | Cómo se consiguen las especies | Comprables (Dragón 80, Cuncuna 50, bundle −20 %) · gratis por lectura · mixto | **Resuelta: mixto.** Cuncuna gratis con 6 de 8 cuentos de N0, con alternativas para N1+ y lectores lentos; Dragón comprable a **80** (provisional E2); precios provisionales 10/16/24/30, conjuntos ~60–85, dos olas |
| D6 | Colecciones de la primera ola | Elegir 3 de 9 | **Fantasía, Naturaleza y Espacio** |
| D7 | Marcas registradas (cuentos 21–40 y nombres de Hogwarts) | Reescribir antes de la Fase E · posponer | **Reescribir** si se va a publicar |
| D8 | Registro de premios en el servidor, con cambio de endpoint (obliga a actualizar la APK) | Sí · No | **Sí** |
| D9 | Motor de animación | Seguir sin librería · GSAP ya · explorar Rive | **Sin librería**; GSAP solo con el criterio de §11 |
| D10 | Favoritos | JSONB del perfil · tabla propia | **JSONB** |
| D11 | Recompensas especiales por lectura (anunciadas después) | Sí · No | **Sí** |
| D12 | Formato del laboratorio de transformaciones | HTML estático en `docs/` · ruta oculta en la app | **HTML estático** |
| D13 | Skills e integraciones que se instalan | Ver §13 | `typescript-lsp` + prueba acotada de Recraft + `motion-design-skill` + actualizar agent-intern |
| D14 | Composición de la portada | (a) héroe central · (b) compañero lateral · (c) escenario | **(b)** en el juego y **(c)** en la pantalla de progreso |

## Límites y evidencia pendiente

- **No se probó nada en la práctica**: ni la calidad de imagen de las alternativas, ni Recraft, ni los MCP, ni los FPS en Android, ni el rendimiento actual del recompositado por sílaba. Esto último es una inferencia a partir del código.
- **Las cifras de monedas por cuento** se calcularon con un script que imita el troceo de frases (±1).
- **Los precios y los nombres de modelos de IA** cambian rápido; hay que confirmarlos antes de pagar.
- **Lo que no se encontró o no se pudo verificar:**
  - MCP o skills oficiales de fal.ai, Replicate, Spine, Motion, SVGO o vtracer;
  - el texto oficial del estándar 13 del ICO (la página dio 403);
  - las licencias comerciales de las imágenes de OpenAI y Gemini;
  - las prácticas concretas de Khan Academy Kids, Duolingo ABC y Toca Boca.
- **Las puntuaciones artísticas** de las especies se darán sobre láminas reales en la Fase B. Este plan no asigna ninguna.
