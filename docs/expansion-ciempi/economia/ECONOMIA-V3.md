# CIEMPI · Economía de monedas v3

Fecha: 2026-11-03 · Rama `worktree-agent-a925a3794da34fde2` · Base: producción 2.4.1 (`3e188ce`).
**Estado:** el usuario **aprobó E2 como referencia**, con precios provisionales en dos olas y la Cuncuna con 6 de 8 cuentos de N0 más alternativas. Antes de producción pidió verificar: eso está en **§18** (reproducibilidad, sensibilidad, niveles 3 y 4, saldos, relectura, abusos, contradicciones y cotejo con la implementación). Ni la economía ni los precios de producción cambiaron.
Página con gráficos: [`index.html`](index.html) · Tablas completas: [`simulador/datos/tablas.md`](simulador/datos/tablas.md) · Simulador: [`simulador/`](simulador/) · Contenido: [`CONTENIDO-PROPUESTA.md`](CONTENIDO-PROPUESTA.md).

> **Son estimaciones con supuestos, no datos de niños.** Lo que sale del código del juego está **verificado**, porque se calculó ejecutando ese mismo código: cómo se trocean los 40 cuentos, las monedas por unidad, los topes, los hitos, los precios y los textos de abuso. Las velocidades de lectura, las pausas, los tropiezos y el tiempo fuera de la lectura son **supuestos** (§15). Nada de este documento se aplicó al juego: no se modificó `src/`, `server/` ni ningún precio.

**Marcas:**
- **[V]** verificado con código o ejecución.
- **[I]** inferido del simulador o del razonamiento.
- **[P]** pendiente de datos, revisión o decisión.
- **[U]** preferencia explícita del usuario.
- **[F]** sugerencia de la revisión independiente (Fable).
- **[C]** propuesta propia de este documento.

---

## 0. Resumen

| 15 min, cuentos nuevos (mediana) | Actual 2.4.1 | E (checkpoint) | **E2 (recomendado v3)** |
|---|---|---|---|
| Monedas P0 / P1 / P2 / P3 / P4 | 8 / 25 / 43 / 67 / 120 | 23 / 28 / 27 / 31 / 29 | **21 / 28 / 26 / 24 / 27** |
| Brecha por minuto (mejor / peor perfil) | 15,1× | 1,35× | **1,34×** |
| Gini sobre 2 000 niños simulados | 0,45 | 0,10 | **0,08** |
| Caso «20 min por cuento» (sesión de 25 min) | 7 | 25 | **34** |
| P0 en 144 sesiones, solo cuentos de Ciempi | 59 | 1 568 | **1 953** |
| Peor abuso realista (app legítima) | 36,2/min | 2,3/min | **1,9/min** (2,1 con «rondar», §18.5) |
| App abierta 60 min sin completar frases | 0 | 12 | **0** |

**Recomendación** [C, sobre las preferencias del usuario U1–U8 y la revisión de Fable]:
- Adoptar **E2 · híbrido ajustado** (§6): paga actividades completadas, con el tiempo como factor pero sin pagar nunca el tiempo inactivo ni la app abierta.
- **Sin tope diario silencioso ni media tasa** [U].
- Seguridad con **reloj del servidor sobre los segundos pagados** (§8).
- Precios calculados por sesiones de un niño de N0 (§9): **10 / 16 / 24 / 30** por escalón, conjuntos **~60–85** y **Dragón a 80** (provisionales, aprobados como referencia).
- **Niveles 3 y 4** (§18.3): relectura a **1,5/min en todos los niveles** (E2R), en vez de 1,5 solo en N0–N1, y «nivel completo» retroactivo al migrar.
- La colección v3 en **dos olas**.
- **Cuncuna** al completar el nivel 0, con equivalencia para N1+ y una vía para el lector muy lento (§10).

---

## 1. Reproducibilidad

- Se ejecuta con `node docs/expansion-ciempi/economia/simulador/simular.mjs && node docs/expansion-ciempi/economia/simulador/generar-informe.mjs` (Node 22, sin dependencias, semilla `20261103`, 400 niños por celda, ~50 s).
- **[V] Reproducción del checkpoint:** la primera ejecución de esta sesión dio un `resultados.json` **idéntico byte a byte** al del checkpoint.
- **[V] Ampliaciones sin efecto en lo anterior:** las ampliaciones no consumen azar en las secuencias existentes. Las cifras de M0, PREV, A–E (sesiones, campañas, caso del usuario) quedan **idénticas**; se comprobó por diferencia. La única cifra anterior que cambia es una **corrección**: el abuso de N2 en el modelo A baja de 16 a 11 monedas, porque usaba un tope de 14 en vez de `A_TOPE[2] = 9`, como señaló Fable. El peor abuso de A sigue siendo 33/min (en N0).
- **Añadido en esta sesión** (`simular.mjs`):
  - modelo **E2**;
  - `abusoAmpliado`, con 6 escenarios;
  - `ESCENARIOS_PRECIO` y `GRILLA_PRECIOS` (sesiones de P0 por precio);
  - umbrales de la Cuncuna, incluida la vía «progreso + tiempo»;
  - campaña del **lector muy lento**, con y sin marcapáginas;
  - **Gini sobre 2 000 niños**;
  - monedas **por fuente** en campañas.
- No se volvieron a ejecutar los extractores con el código del juego (`extraer-*.mts`): sus salidas son las del checkpoint, sobre 2.4.1. `verificar-abusos.mts` sí se volvió a ejecutar en la verificación y da el mismo `abusos.json` (§18.1).
- **Verificación del WIP `e4e6d3b`:** ver §18.1. El simulador reproduce todas las cifras de `76c9367`; la única diferencia es un escenario de abuso añadido.

---

## 2. Diagnóstico de 2.4.1

### 2.1 Cómo paga cada nivel [V]

| Nivel | Unidades por cuento | Paga | Tope por libro | Hitos | Monedas por cuento | 8 cuentos | Relectura |
|---|---:|---|---:|---|---:|---:|---|
| 0 sílabas | 7–9 | 1 por frase | 10 | — | 7–9 | 65 | **nunca paga (bug)** |
| 1 palabras | 10–11 | 1 por frase | 10 | — | 10 | 80 | **nunca paga (bug)** |
| 2 oraciones | 9–12 | 1 por oración | **sin tope** | +5 al 100 % | 14–17 | 118 | 1/día |
| 3 párrafos | 4–5 | 4 por párrafo | 15 | — | 15 | 120 | **nunca paga (bug)** |
| 4 libre | 2–3 | 0 | — | 5/10/10/15 al 25/50/75/100 % | 40 | 320 | 3/día |

Los 40 cuentos dan **703** monedas en primera lectura. El catálogo completo actual cuesta **1 350**.

### 2.2 Cómo funcionan hoy los libros, los niveles y los textos propios [V, leído en el código de 2.4.1]

- **Los niveles son de los libros, no del niño.**
  - Al crear un perfil, `darCuentos` (`server/src/cuentos.ts`) le asigna **los 40 cuentos**, cada uno en su nivel.
  - La biblioteca los muestra todos, ordenados del nivel más fácil al más difícil y con filtro por nivel. El niño puede leer cualquiera.
  - Solo un adulto cambia el nivel de una asignación (`PUT /api/asignaciones/:id/nivel`, `conAdulto`).
- **«Terminado»:** la app manda `estado = 'completada'` al llegar al final (`PUT /api/asignaciones/:id/progreso`) y el servidor fija `completada_en`. **No se verifica.** En la rama de seguridad, el registro de premios sí guarda `pagado_hasta`, calculado y acotado por el servidor.
- **Siempre desde el principio:** `fraseDeInicio` devuelve 0 si el libro no tiene capítulos. Un cuento se termina solo si se lee de corrido en una sesión.
- **Textos propios:**
  - El niño, con su propia sesión (`entrar-nino`), puede crear textos (`PUT /api/textos/:id`, `conUsuario`) y agregárselos desde la biblioteca (`PantallaAgregarLibro`; `POST /api/perfiles/:id/asignaciones`).
  - Si quien agrega no es adulto del niño, el nivel lo fija `nivelSugerido`.
  - **No hay PIN del adulto en este flujo.** El PIN del perfil es «solo para elegir perfil, no es seguridad» (`tipos.ts`).
  - El niño puede borrar solo lo que subió.
  - [I] En el «modo niño» abierto con la sesión de un adulto, el servidor ve al adulto y acepta el nivel que mande la app.

### 2.3 Fugas verificadas y abusos medidos

| Abuso | Monedas en 2.4.1 | Por minuto | Estado |
|---|---:|---:|---|
| Texto propio de 300 «Mariposa amarilla.» en N2 (sin tope) | **305** [V] | 36,2 | Abierta |
| Texto de una frase asignado en N4 (pasa todos los hitos de golpe) | **40** [V] | — | Abierta |
| **Muchos textos propios distintos de una oración** (quedan en N2): 1 + 5 cada uno | 6 por texto [I] | 8,6 | Abierta. La huella solo impide repetir el mismo texto |
| Textos propios de 6 oraciones (~1 min) | 11 por texto [I] | 8,4 | Abierta |
| Borrar y volver a subir | tope del libro cada vez | 11 en N0 | Cerrada por la huella (rama de seguridad) |
| `POST /monedas` ±100 sin cotejar | sin límite | — | Cerrada (rama de seguridad) |

### 2.4 Bugs que afectan a la economía [V]

- Hay dos bugs: la relectura nunca paga en N0, N1 y N3, y la pantalla final muestra solo la última moneda. Los dos están corregidos en la rama de seguridad, no en producción.
- **Efecto combinado sobre P0** [I]: el tropiezo quita la moneda y la relectura no la devuelve, así que P0 junta **~59 de 65** en toda la vida del juego.
- **Lector muy lento** [I]: con ~20 min por cuento y sesiones de 15 min, **nunca termina un cuento**, porque cada sesión lo reinicia (§10.2).

---

## 3. Oportunidades de cada perfil (niveles 0 a 4)

Perfiles (supuestos, §15):

| Perfil | Lectura |
|---|---|
| P0 | 5 palabras por minuto (sin norma) |
| P1 | 15 palabras por minuto |
| P2 | 40 palabras por minuto |
| P3 | 70 palabras por minuto |
| P4 | 110 palabras por minuto |

### 3.1 Por sesión y por minuto (15 min, cuentos nuevos; mediana) [I]

| Perfil | Actual | Actual / min | E | **E2** | **E2 / min** | E2 a 10 / 20 / 30 min |
|---|---:|---:|---:|---:|---:|---|
| P0 | 8 | 0,53 | 23 | **21** | 1,40 | 13 / 29 / 44 |
| P1 | 25 | 1,67 | 28 | **28** | 1,87 | 18 / 39 / 59 |
| P2 | 43 | 2,87 | 27 | **26** | 1,73 | 17 / 35 / 55 |
| P3 | 67 | 4,47 | 31 | **24** | 1,60 | 15 / 34 / 57 |
| P4 | 120 | 8,00 | 29 | **27** | 1,80 | 17 / 37 / 58 |
| Brecha | | 15,1× | 1,35× | | **1,34×** | |

### 3.2 Campaña larga: acumulado en 144 sesiones de 15 min (mediana) [I]

| Perfil | Actual, releyendo | Actual, textos nuevos | E2, releyendo | E2, textos nuevos |
|---|---:|---:|---:|---:|
| P0 | 59 | 1 133 | 1 953 | 2 615 |
| P1 | 74 | 2 533 | 2 054 | 3 316 |
| P2 | 390 | 5 281 | 1 477 | 3 378 |
| P3 | 120 | 6 277 | 1 383 | 3 737 |
| P4 | 1 583 | 10 253 | 1 507 | 3 504 |

- Hoy el ingreso depende del número de cuentos y de la velocidad.
- Con E2 depende del esfuerzo, y releyendo los principiantes avanzan algo más rápido (relectura a 1,5 en N0–N1) [F].

---

## 4. Modelos comparados (15 min, cuentos nuevos) [I]

| Modelo | P0 | P1 | P2 | P3 | P4 | Brecha | Gini (niños) | «20 min por cuento» | Peor abuso legítimo |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Actual 2.4.1 | 8 | 25 | 43 | 67 | 120 | 15,09× | 0,45 | 7 | 36,2/min |
| PREV: N0 = 2 por frase, tope 10 | 11 | 25 | 43 | 67 | 120 | 10,96× | 0,44 | 9 | 11,0/min |
| A · Multiplicadores | 24 | 25 | 30 | 27 | 30 | 1,25× | 0,19 | 21 | 33,0/min |
| B · Hitos pedagógicos | 17 | 41 | 57 | 87 | 134 | 7,90× | 0,38 | 12 | 14,3/min |
| C · Rato de lectura | 11 | 28 | 48 | 72 | 126 | 11,51× | 0,42 | 13 | 11,6/min |
| D · Esfuerzo esperado | 20 | 19 | 21 | 18 | 21 | 1,17× | 0,17 | 14 | 45,0/min |
| E · Híbrido (checkpoint) | 23 | 28 | 27 | 31 | 29 | 1,35× | 0,10 | 25 | 2,3/min |
| **E2 · Híbrido ajustado** | **21** | **28** | **26** | **24** | **27** | **1,34×** | **0,08** | **34** | **1,9/min** |

- El Gini sobre los 2 000 niños simulados corrige la crítica de calcularlo con 5 medianas [F]. El orden de los modelos no cambia.
- A y D igualan las medianas, pero A conserva la fragilidad del pago por libro y D paga sin mirar el tiempo real.

---

## 5. Nivel 0: «2 por frase, tope 10» frente a las alternativas [I]

| Opción para N0 | P0, 15 min | Por minuto | «20 min por cuento» (25 min) | Muy lento, 20 sesiones de 15 min | P0, 144 sesiones (releyendo) |
|---|---:|---:|---:|---:|---:|
| Actual: 1 por frase, tope 10 | 8 | 0,53 | 7 | 42 | 59 |
| **2 por frase, tope 10** | 11 | 0,73 | 9 | 48 | 131 |
| A: 3 por frase, tope 30 | 24 | 1,60 | 21 | 126 | 351 |
| B: + sílabas nuevas | 17 | 1,13 | 12 | 55 | 173 |
| E | 23 | 1,53 | 25 | 194 | 1 568 |
| **E2** | **21** | **1,40** | **34** | **310** | **1 953** |
| Pagar por toque de sílaba | — | — | — | — | — |

- **Pagar por toque de sílaba está descartado** [U]: premia el gesto (40–62 toques por cuento) y no la lectura.
- **«2 por frase, tope 10» no resuelve el problema por sesión.** Solo empata N0 con N1 por cuento, y el tope sigue siendo por cuento. Sirve como mínimo solo si E2 no se aprueba.

---

## 6. Modelo E2: evaluación y parámetros exactos

### 6.1 Componentes (qué se premia) [U5 + F + C]

| Componente | Regla | Origen |
|---|---|---|
| **Frase (u oración, párrafo, página) completada** sin saltar | `2 × min(minutos activos, 2 × minutos esperados)`. Una unidad no terminada no paga. Cada pausa cuenta como máximo 10 s (`MAX_PAUSA_ACTIVA_MS`; redacción corregida en §18.5). La fracción se acumula por libro | C: tope 2× para que el lento no pierda. Tasa 2 (F) |
| Minutos esperados | `sílabas / ref[nivel] + 3 s`, con ref = `{0: 5, 1: 22, 2: 60, 3: 105, 4: 165}` síl/min | F: N0 = 5 |
| **Dificultad real** | En textos que **no** son de la biblioteca, ref = la del nivel más exigente entre el sugerido y el asignado | F; C: no se aplica a los cuentos de Ciempi, cuyo nivel está curado |
| **Cuento terminado** (1.ª vez) | `min(3, ⌊minutos esperados⌋)`, solo si el cuento tiene ≥ 1 min esperado y el tiempo activo fue ≥ 50 % de lo esperado. En textos propios, una vez por huella | F |
| **Relectura** de unidades ya leídas | 1,5 × min(...) en N0–N1; 1 × min(...) en N2–N4. Cada vez, sin premio diario fijo | F |
| **Relectura con mejora** | +2 al releer entero un cuento con **menos tropiezos que su mejor lectura completa anterior**, como máximo uno por cuento y día. Se compara con la mejor marca para que tropezar a propósito no permita volver a cobrarla | U5; C (diseño) |
| **Hitos educativos** | N0: +2 cada 15 sílabas distintas nuevas; N1: +2 cada 25 palabras nuevas. Solo en la biblioteca y en textos del adulto | E (checkpoint) |
| **Nivel completo** | +15 una vez al terminar los 8 cuentos de la biblioteca de un nivel (+ una pieza, si se aprueba) | F |
| Rato de lectura | **Eliminado** | U5: nunca pagar por tener la app abierta |
| Tropiezo | Ya no quita la moneda; sigue «Más despacito 🐢». La frase «muy rápida» (`conPremio = false`) no paga | C |

### 6.2 Reparto de monedas por componente (mediana de E2) [I]

| Perfil | Frase | Cuento terminado | Sílabas/palabras nuevas | Total (15 min, cuentos nuevos) |
|---|---:|---:|---:|---:|
| P0 | 16,2 | 1,8 | 2,8 | ~21 |
| P1 | 16,4 | 7,2 | 4,8 | ~28 |
| P2 | 18,0 | 7,7 | — | ~26 |
| P3 | 16,0 | **7,9** (en E era 13,1) | — | ~24 |
| P4 | 18,3 | 8,4 | — | ~27 |

**Campaña de 160 sesiones:**
- Con **textos nuevos**: frases 62–74 %, cuentos terminados 9–32 %, relectura 4–17 %.
- **Releyendo** (solo los 8 cuentos de su nivel): la relectura es el 93–96 %.

El tiempo **pondera** cada actividad completada, pero no la sustituye [U5]. La parte de «relectura con mejora» sale casi nula (0–1 %) porque el simulador **no modela aprendizaje**: los tropiezos no bajan al releer [P]. Con más actividades (comprensión, vocabulario: [CONTENIDO-PROPUESTA.md](CONTENIDO-PROPUESTA.md)), la parte de hitos crecería.

### 6.3 Parámetros para `REGLAS_MONEDAS` (propuesta, **no aplicada**) [C]

Se escribió contra la estructura de `src/lectura/monedas.ts` de la rama de seguridad (`worktree-agent-a5e1c8d72e4a5aeb0`). Esa rama no se modificó. La interfaz se **extiende**: la tabla 2.4.1 sigue siendo válida y se puede volver atrás cambiando una sola constante.

```ts
/** Pago por esfuerzo (modelo E2). Si `esfuerzo` falta, rigen las reglas 2.4.1. */
export interface ReglasEsfuerzo {
  /** Monedas por minuto activo pagable. */
  tasaPorMinuto: { primeraLectura: number; relectura: Record<NivelLectura, number> }
  /** Ritmo tranquilo de referencia (sílabas por minuto). No es una exigencia de velocidad. */
  silabasPorMinutoReferencia: Record<NivelLectura, number>
  segundosFijosPorUnidad: number
  /** Una unidad paga como máximo este múltiplo de lo esperado: el que lee más lento no pierde. */
  topeSobreEsperado: number
  /** Pausas más largas no cuentan como tiempo activo (igual que MAX_PAUSA_ACTIVA_MS). */
  pausaActivaMaxSegundos: number
  /** Textos que no son de la biblioteca: lo esperado usa el nivel más exigente entre el sugerido y el asignado. */
  dificultadReal: boolean
  /** Terminar por primera vez: min(maximo, ⌊minutos esperados × porMinuto⌋). En textos propios, una vez por huella. */
  libroTerminado: { porMinuto: number; maximo: number; minutosEsperadosMinimos: number; fraccionActivaMinima: number }
  /** Releer entero un cuento con menos tropiezos que su mejor lectura completa. */
  relecturaConMejora: { monedas: number; maxPorCuentoYDia: number }
  nuevas: Partial<Record<NivelLectura, { cuenta: 'silabas' | 'palabras'; cada: number; monedas: number }>>
  nivelCompleto: { monedas: number }
}
export interface ReglasMonedas {
  version: string
  porUnidad: Record<NivelLectura, number>
  topePorLibro: Record<NivelLectura, number>
  hitos: Record<NivelLectura, Hito[]>
  relectura: Record<NivelLectura, number>
  minimoABuenRitmo: number
  esfuerzo?: ReglasEsfuerzo
}

const CERO = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 } as const

/** Modelo E2 (economía v3). Propuesta: requiere aprobación del usuario. */
export const REGLAS_MONEDAS_E2: ReglasMonedas = {
  version: '3.0.0-e2',
  // En modo esfuerzo no se usan: sin pago fijo por unidad, sin topes por libro,
  // sin hitos por porcentaje y sin premio fijo de relectura.
  porUnidad: { ...CERO },
  topePorLibro: { ...CERO },
  hitos: { 0: [], 1: [], 2: [], 3: [], 4: [] },
  relectura: { ...CERO },
  // Solo para «Más despacito»; ya no decide el pago.
  minimoABuenRitmo: 0.8,
  esfuerzo: {
    tasaPorMinuto: { primeraLectura: 2, relectura: { 0: 1.5, 1: 1.5, 2: 1, 3: 1, 4: 1 } },
    silabasPorMinutoReferencia: { 0: 5, 1: 22, 2: 60, 3: 105, 4: 165 },
    segundosFijosPorUnidad: 3,
    topeSobreEsperado: 2,
    pausaActivaMaxSegundos: 10,
    dificultadReal: true,
    libroTerminado: { porMinuto: 1, maximo: 3, minutosEsperadosMinimos: 1, fraccionActivaMinima: 0.5 },
    relecturaConMejora: { monedas: 2, maxPorCuentoYDia: 1 },
    nuevas: {
      0: { cuenta: 'silabas', cada: 15, monedas: 2 },
      1: { cuenta: 'palabras', cada: 25, monedas: 2 },
    },
    nivelCompleto: { monedas: 15 },
  },
}

export const minutosEsperados = (nivelRef: NivelLectura, silabas: number, e: ReglasEsfuerzo) =>
  silabas / e.silabasPorMinutoReferencia[nivelRef] + e.segundosFijosPorUnidad / 60

/** Minutos pagables de una unidad: los activos reales, hasta `topeSobreEsperado` veces lo esperado. */
export const minutosPagables = (nivelRef: NivelLectura, silabas: number, segundosActivos: number, e: ReglasEsfuerzo) =>
  Math.min(e.topeSobreEsperado * minutosEsperados(nivelRef, silabas, e), Math.max(0, segundosActivos) / 60)
```

### 6.4 Cambios en el registro de premios para aplicar E2 [C, esbozo]

No está implementado.

- **`SolicitudPremio.avance`** añade `segundosActivos` de la unidad. Hay un nuevo tipo `releida` para las unidades ya pagadas, que reemplaza la relectura diaria fija.
- **`EstadoPremios`** añade `fraccion`, `libroPremiado` y `mejorTropiezos`.
- **Por niño:** sílabas y palabras vistas, y niveles completados.
- **Reloj:** se adelanta con los **segundos pagados** (§8).

### 6.5 Evaluación de E2 [I]

**A favor:**
- Equidad entre ritmos: brecha 1,34×, Gini 0,08.
- El lector muy lento gana por minuto casi lo mismo que la mediana: 34 monedas en 25 min (1,36/min) frente a 1,40/min de P0.
- El peor abuso legítimo queda en 1,9/min.
- No paga por tener la app abierta.

**En contra:**
- (a) La referencia por nivel sigue siendo un supuesto: hay que calibrarla con telemetría.
- (b) Más estado en el servidor.
- (c) P3 y P4 ganan menos por sesión que hoy: de 67 a 24 y de 120 a 27. Es el costo de la equidad; la mitigación de §18.3 corrige la desventaja de largo plazo, no la cifra por sesión.
- (d) El componente «tiempo» sigue pesando ~60–75 % del ingreso con contenido nuevo. Para bajar ese peso hacen falta actividades nuevas (CONTENIDO-PROPUESTA).

---

## 7. Relectura y nivel 2

- **Relectura con E2:**
  - paga por unidad, cada vez: 1,5/min en N0–N1 y 1/min en N2–N4, más «relectura con mejora»;
  - corrige el castigo del cuento que se reinicia, porque el comienzo releído paga;
  - se anuncia: «Releer también suma».
- **Si se mantiene 2.4.1:** corrección de la rama de seguridad (relectura en todos los niveles, 1/1/1/2/3 una vez al día).
- **Nivel 2 con E2:** no necesita regla propia. Paga por el tiempo de la oración, con un tope de 2× lo esperado. Las fugas bajan así:
  - texto de 300 oraciones: de 305 a 15;
  - una oración propia: de 6 a 0;
  - nivel 4 con una frase: de 40 a ~0.
- **Interino si E2 no se aprueba** [C]:
  - `topePorLibro[2] = 14`;
  - en N2, el hito del 100 % (+5) solo si el texto tiene ≥ 6 oraciones;
  - en N4, hitos completos solo con ≥ 200 palabras.

---

## 8. Antiabusos sin topes silenciosos y su efecto sobre el lector lento

### 8.1 Abusos ampliados [I; escenarios sugeridos por F]

El que abusa no tropieza. Subir un texto toma ~40 s.

| Escenario | Actual | E | **E2** |
|---|---:|---:|---:|
| 300 «Mariposa amarilla.» (N2), arrastrado | 36,2/min (305) | 2,0 | **1,8** |
| Muchos textos propios distintos de 1 oración | 8,6/min (6 por texto) | 0 | **0** |
| Textos propios de ~1 min, leídos a medio ritmo | 8,4/min (11 por texto) | 0,8 | **1,5** |
| Texto difícil (sugerido N2) asignado en N0, arrastrado | 0,6 | 2,3 | **1,9** |
| Ídem, con **tiempo activo falsificado** (cola offline). **Reloj actual** (0,1 s/palabra) | n/a | **230/min** | **70/min** |
| Ídem, con **reloj sobre segundos pagados** | n/a | 2,0 | **2,0** (ráfaga máx. ~120 en 1 h) |
| Rondar: tocar cada < 10 s y completar cada frase de N0 solo al llegar al máximo pagable (añadido en §18.5) | 0,7 | 2,5 | **2,1** |
| App abierta 60 min tocando sin completar frases | 0 | 0,2 (rato) | **0** |

La dificultad real reduce el botín falsificado de 730 a 223, pero **solo el reloj sobre segundos pagados** lo lleva a la tasa de lectura. Hay que implementarlo en la rama de seguridad, como ya anota su `SEGURIDAD-MONEDAS.md` §9.

### 8.2 Controles propuestos y efecto [C]

| Control | Qué frena | Efecto sobre el lector muy lento | Limitación |
|---|---|---|---|
| **Reloj del servidor sobre segundos pagados** (extiende `revisarRitmo`) | Cobrar más rápido que el tiempo real; dos dispositivos a la vez | **Ninguno**: en la simulación, lo pagado nunca supera el **75 %** del tiempo real de su sesión (`maxPagadoSobreReloj` = 0,74) → 0 rechazos | **No demuestra lectura**: un script paciente cobra como un lector (~2/min). Permite una ráfaga de 1 h sin conexión |
| **Dificultad real** (nivel más exigente) en textos que no son de la biblioteca | Inflar lo esperado con un texto difícil en N0 | Ninguno en los cuentos de Ciempi | Depende de `nivelSugerido`, que es heurístico |
| **Huella y duplicados** (ya en la rama de seguridad) | Volver a cobrar el mismo texto | Ninguno | Textos «casi iguales» pasan |
| **Premio de terminar proporcional** y ≥ 1 min | Muchos textos cortos | Ninguno: los cuentos de N0 tienen 6–9 min | — |
| **Plausibilidad mínima** (0,1 s/palabra, 0,5 s/unidad) | Ráfagas imposibles | Ninguno | Generosa a propósito |
| **Avisos visibles al adulto**: textos propios agregados (largo, nivel sugerido y asignado, duplicados), minutos y monedas por día | Que el abuso pase inadvertido | Ninguno; el niño no ve alarmas | Depende de que el adulto mire |
| **Revisión adulta de textos propios** (§8.3) | Contenido inadecuado; textos fabricados | Ninguno | Agrega fricción al adulto |

**Rechazados** [U]: tope diario silencioso, media tasa después de 45 min [F rechazado] y cualquier límite que castigue el tiempo de quien necesita más.

### 8.3 Textos propios: diseño propuesto (sin código) [U3 + C]

1. **Se conserva** que el niño pueda agregar textos desde su biblioteca.
2. **Ajuste del adulto**, «Textos que agrega {niño}», con tres opciones:
   - (a) libres, que es lo de hoy;
   - (b) **con PIN del adulto** para agregarlos;
   - (c) **revisión posterior**: el niño lo lee al tiro, pero el texto queda «por revisar».

   Por defecto: (c).
3. **PIN del adulto** nuevo, de la cuenta adulta y distinto del PIN del perfil. Se verifica en el servidor, que emite una aprobación de un solo uso para esa asignación. Con varios intentos fallidos se espera, y el niño no queda bloqueado para leer.
4. **Pago de textos propios:**
   - siempre paga las **frases** (E2, con dificultad real);
   - **cuento terminado** una vez por huella;
   - **ni hitos educativos ni nivel completo**;
   - si el ajuste es (c), el premio de terminar se paga **al aprobarlo**, sin que nada se pierda: queda «guardado» y visible para el niño como «espera a que lo vea un adulto».
5. **El adulto ve** en su panel: título, largo, nivel sugerido y asignado, si es duplicado o casi duplicado, y monedas ganadas. Puede cambiar el nivel o archivarlo.
6. Con E2, aunque el ajuste quede en (a), los textos propios **no rinden más que leer** (§8.1). El PIN y la revisión son sobre todo para el **contenido** y para que el adulto **esté al tanto**, no para frenar la economía.

---

## 9. Precios justos desde el esfuerzo de un niño de nivel 0

### 9.1 Sesiones de 15 min de P0 para juntar cada precio (E2, desde cero, sin gastar en otra cosa) [I]

«Muy lento» es el caso de ~20 min por cuento con sesiones de 15 min. Columnas de P0: releyendo, que es el escenario conservador; con textos nuevos es igual o más rápido.

| Artículo · precio propuesto | P0 mediana | P0 p90 | Muy lento mediana | Muy lento p90 | Actual (2.4.1), P0 mediana |
|---|---:|---:|---:|---:|---|
| Básico · **10** | 1 | 1 | 1 | 1 | 2 (p90 3) |
| Común · **16** | 1 | 1 | 1 | 2 | 3 |
| Especial · **24** | 2 | 2 | 2 | 2 | 4 |
| Obra · **30** | 2 | 2 | 2 | 3 | 5 |
| Conjunto barato · 53 (real) | 3 | 4 | 4 | 5 | 8 (p90 37) |
| Conjunto caro · 84 (real) | 5 | 5 | 5–6 | 6–7 | **nunca** releyendo |
| **Dragón · 80** | **4** | **5** | **5** | **6** | **nunca** releyendo (11 con textos nuevos) |
| Dragón · 100 | 5 | 6 | 7 | 7 | nunca |
| Dragón · 120 (borrador) | 6 | 7 | 8 | 9 | nunca |
| Colección v3, ola 1 (16 piezas) · **360** | 23 | 25 | 24 | 25 | nunca |
| Ola 2 (7 piezas) + Dragón · **224** | 13 | 15 | ≈14 | ≈15 | nunca |
| Catálogo actual + todo v3 · **1 934** | 143 | 151 | > 60 (no simulado) | — | nunca |

Tablas P1–P4 y p10–p90 en `tablas.md`: P1–P4 necesitan las mismas sesiones o menos.

### 9.2 Precios recomendados y su justificación [C, desde §9.1]

**Criterios** (propios, a aprobar):
- una pieza básica o común ≤ **1 sesión** incluso para el muy lento;
- especial u obra ≤ **2–3**;
- un conjunto ≤ **1 semana** (4–6 sesiones) en p90;
- el Dragón, **una semana para la mediana** y como mucho **1,5 semanas** (6 sesiones) para el p90 y el muy lento;
- cada ola, ≤ ~25 sesiones.

| Qué | Precio | Por qué |
|---|---|---|
| **Catálogo actual** | Sin cambios | Ya cumple los criterios con E2. Cambiar precios reales requiere aprobación y no hace falta |
| Básico (Antenas luz, Cola cometa) | **10** | 1 sesión para todos |
| Común (Botas caballero, Gorro pétalo, Zuecos hongo, Botas lunares, Lentes planeta, Cresta gema, Mechones rocío) | **16** | 1 sesión; el muy lento, 1–2 |
| Especial (Casco suave, Antifaz grifo, Antifaz zorro, Casco burbuja, Bufanda musgo; mochilas) | **24** | 2 sesiones para todos |
| Obra (Acolchado, Jardín, Traje astral, Capa de páginas, Capa cometa, Alas de cuento) | **30** | 2; el muy lento, 2–3. Coherente con las obras actuales (28–32) |
| Conjuntos de colección | −20 % sobre lo que falta (regla actual): ~**60–85** | 3–5 sesiones; p90 ≤ 7 |
| **Dragón** | **80** | P0 4 (p90 5); muy lento 5 (p90 6). Con 100 el muy lento pasa a 7; con 120, a 8–9 |
| «Dragón real» (Dragón + Alas + Cresta + Cola) | 134 → **107** | Siempre se vende también la especie suelta |
| **Colección v3** | **Dos olas**: ola 1 = 360 (16 piezas universales o adaptables); ola 2 = Dragón + 4 exclusivos + 3 mochilas (estas, solo tras su rediseño) = 224 | 23–25 y 13–15 sesiones de P0 |
| **Cuncuna** | **Gratis** | §10 |

**Regla de salud** [C]: catálogo completo ≤ ~150 sesiones de P0 releyendo. Con todo v3 da 143. Fable proponía 120–150: hay acuerdo.

---

## 10. Cuncuna al completar el nivel 0 [U2]

### 10.1 Condición (verificable en el servidor) [C]

Se otorga `especie:cuncuna` de forma idempotente y retroactiva, y se anuncia después de ganarla, cuando se cumple **cualquiera** de estas condiciones:

1. **Completar el nivel 0:** 6 de los 8 cuentos de Ciempi de nivel 0 terminados. Si un adulto quitó cuentos, todos los que tenga, con un mínimo de 4.
2. **Equivalencia para quien empieza en N1+:** 6 cuentos de Ciempi **distintos, de cualquier nivel**, terminados. Todos los niños tienen los 40 cuentos, así que la regla es una sola y quien parte en N0 la cumple completando su nivel.
3. **Vía del lector muy lento** (progreso + tiempo, nunca solo tiempo): **60 min de lectura activa en cuentos de N0 y 30 frases distintas de N0 leídas.**
4. **Regalo del adulto** desde su panel, con motivo.

**«Terminado» verificable:** usar el registro de premios del servidor (`pagado_hasta` = total de unidades, acotado por el reloj), **no** `completada_en`, que hoy fija la app sin verificar. Solo cuentan los cuentos `origen = 'ciempi'`: nunca los textos propios ni los del adulto.

### 10.2 Sesiones de 15 min hasta la Cuncuna [I]

| Perfil | Condición 1/2: 6 cuentos (mediana, p10–p90) | Condición 3 (mediana, p10–p90) |
|---|---|---|
| P0 | **6 (4–10)**; 2,3 % no llega en 160 sesiones | 7 (7–7) |
| P1 | 3 (2–4) | 7 |
| P2 | 2 (2–3) | 6 |
| P3 | 2 (1–2) | 7 |
| P4 | 2 (2–3) | — (N0 no es su nivel) |

**Lector muy lento** (factor 0,42; P0 con ~20 min por cuento):

| Escenario | 6 cuentos | Condición 3 |
|---|---|---|
| Sesiones de 15 min | **nunca** | **11 (9–11)** |
| Sesiones de 25 min | 7 (6–8) | 4 |
| Sesiones de 15 min **con marcapáginas en N0** (retomar donde iba) | 13 (11–14) | 7 |

- P0 mediano: 6 sesiones, unas 1,5 semanas. El p90 del muy lento: unas 3 semanas por la condición 3. **No es excesivamente difícil y nadie queda fuera.**
- Los que parten en N1+ la reciben antes (2–3 sesiones), con una regla simple. Es un regalo de bienvenida, no un ingreso.

### 10.3 Contradicción con TIENDA-V3 — **corregida** [V]

> **Resuelto (3-nov-2026):** el usuario aprobó la versión de este documento y TIENDA-V3 se actualizó en la rama de la tienda (commit `ef867b3`, §4.6 y §4.8). Lo que sigue es el registro de la contradicción original.

`TIENDA-V3.md` (§4.6, línea ~346, rama `worktree-agent-a4c7575325914c12a`) propone:
- 6 cuentos de N0 con `completada_en`;
- para quien empieza en N1+, **4 cuentos de cualquier nivel**.

Este documento propone en cambio:
- **6 de cualquier nivel**, porque 4 se logran en 1–2 sesiones;
- usar el **registro de premios** en vez de `completada_en`;
- añadir la **condición 3**, porque con la de TIENDA-V3 el lector muy lento **nunca** recibiría la Cuncuna.

El usuario decide; si aprueba esta versión, hay que actualizar TIENDA-V3.

---

## 11. Seguridad: qué valida el reloj y qué no [U7, coherente con `SEGURIDAD-MONEDAS.md` §2 y §9 de la rama de seguridad]

- **Valida:**
  - que lo pagado no supere el tiempo real transcurrido (ventana de 1 h);
  - la idempotencia;
  - que el avance solo suba;
  - la huella del texto;
  - la plausibilidad mínima.
- **No valida:**
  - que hubo **lectura real** (no hay audio);
  - que el tiempo activo declarado corresponde a una persona mirando el texto.

  Un script paciente cobra ~2/min, lo mismo que un niño leyendo.
- **Controles razonables** (§8.2): reloj sobre segundos pagados, dificultad real, huella, premio proporcional, avisos al adulto y revisión de textos propios. **Ninguno castiga al niño lento**, porque todos actúan sobre los textos no curados o sobre la velocidad máxima.
- **Pendiente en la rama de seguridad:** extender `revisarRitmo` para que el costo sea `minutosPagables × 60` (con E2) y añadir `segundosActivos` a la solicitud.

---

## 12. Telemetría mínima (agregada, sin audio ni texto) [C + F]

1. Por unidad: **razón activo/esperado**, tropiezos y pausas (p50/p90 por nivel). Sirve para calibrar `silabasPorMinutoReferencia` y `topeSobreEsperado` [F].
2. Cuentos abandonados a mitad y sesiones sin ningún cuento terminado, para detectar lectores muy lentos y validar la condición 3.
3. Monedas por fuente (§6.2) y por semana; saldo sin gastar [F].
4. **Textos propios:** largo, nivel sugerido y asignado, duplicados o casi duplicados, monedas [F].
5. Sesiones hasta la primera compra y hasta cada compra por escalón, para contrastar con §9.1.
6. Rechazos del reloj (429) por niño, para detectar apps manipuladas o relojes desfasados.
7. Distribución de la duración de las sesiones (solo para entender el uso; **no** para limitar).
8. **Piloto observado** con adultos (pocos niños, consentimiento) antes de fijar constantes [F].

---

## 13. Revisión independiente (Fable)

Veredicto de Fable: «E es la dirección correcta, pero hay que ajustarlo». Las preferencias del usuario tienen prioridad sobre Fable.

| # | Punto de Fable | Postura | Qué se cambió |
|---|---|---|---|
| 1 | El +3 fijo por terminar favorece los textos cortos (P3: 13,1 de 31) | **De acuerdo** | E2: `min(3, ⌊minutos esperados⌋)`. P3 pasa a 7,9 de 24; el abuso de textos de ~1 min queda en 1,5/min |
| 2 | El abuso se mide con un solo escenario | **De acuerdo** | 4 escenarios nuevos (textos cortos, texto difícil en N0, activo falsificado, app abierta), en todos los modelos (§8.1) |
| 3 | El activo lo calcula el cliente: el servidor debe acotarlo | **De acuerdo** | Reloj sobre segundos pagados. Simulado: 70–230/min con el reloj actual frente a 2/min con el nuevo |
| 4 | Referencias ~1,3× bajo la mediana; el lento pierde (1,0/min frente a 1,53) | **De acuerdo en el diagnóstico; solución en parte distinta** | N0 = 5 [F] y, además, tope de **2× lo esperado** en vez de min(esperado, activo) [C]. El caso de 20 min pasa a 1,36/min (34 en 25 min), frente a 1,40 de la mediana de P0 |
| 5a | No hay cambio de conducta | **De acuerdo** (límite) | Documentado. «Relectura con mejora» sale subestimada |
| 5b | P0 sin norma | **De acuerdo** (límite) | Telemetría 1 y piloto |
| 5c | Gini con 5 medianas | **De acuerdo** | Gini sobre 2 000 niños: E2 0,08; E 0,10; actual 0,45 |
| 5d | El abuso de A usa tope 14, pero `A_TOPE[2] = 9` | **Verificado: era un error** | Corregido (16 → 11 monedas); no cambia el peor abuso de A (33/min, N0) |
| 6a | PLAN-MAESTRO §6.5 y D4 proponen un tope diario silencioso, que está prohibido | **De acuerdo** | **Corregido** en la rama `expansion-v3-continuidad` (commit `e22ca61`: §6, Fase 0, D3–D5). La copia sin commitear de `main` no se tocó |
| 6b | TIENDA-V3 da la Cuncuna con 4 cuentos de cualquier nivel | **De acuerdo** | §10.3 |
| P1 | Tasa 2/min; relectura 1, y 1,5 en N0–N1 | **De acuerdo** | Aplicado en E2 |
| P2 | N0 = 5 síl/min | **De acuerdo** | Aplicado |
| P3 | Dificultad real (la más exigente) | **De acuerdo, con matiz** | Solo en textos que no son de la biblioteca; los cuentos de Ciempi tienen su nivel curado |
| P4 | Premio por terminar min(3, 1/min); una vez por huella | **De acuerdo** | Aplicado |
| P5 | Nivel completo +15 y una pieza | **De acuerdo** | +15 aplicado; la pieza, pendiente de decisión |
| P6 | Media tasa después de 45 min | **Rechazado por el usuario** | No se aplica |
| Precios | Básico 10–15, Común 18–25, Especial 30–40, Obra 45–60; conjuntos 70–110; Dragón 80–90; bundle 150–180; catálogo en 120–150 sesiones | **En parte** | **Acuerdo:** Dragón 80, dos olas y catálogo en ~143 sesiones de P0. **Desacuerdo** en los escalones: no hay piezas actuales de 45–60, y una Obra a 50 pide 4 sesiones al muy lento (frente a 2–3 con 30). Se mantienen 10/16/24/30, justificados en §9 |
| Telemetría | Activo/esperado, tropiezos, pausas, fuentes, textos propios, saldo, piloto | **De acuerdo** | §12 |

---

## 14. Preferencias del usuario y cómo se atienden

| Preferencia [U] | Dónde | Estado |
|---|---|---|
| 1. E, priorizando la equidad entre ritmos, sin favorecer la velocidad | §4, §6 | E2: brecha 1,34×, Gini 0,08, el lento ≈ la mediana |
| 2. Cuncuna al completar N0, condición verificable, equivalencia N1+, sesiones de P0 y percentil lento, contradicción con TIENDA-V3 | §10 | Propuesta; simulada |
| 3. Conservar los textos del alumno con PIN cuando corresponda: revisar el código y diseñar sin código | §2.2, §8.3 | Revisado [V]; diseño [C] |
| 4. Sin media tasa ni topes silenciosos; antiabusos que no castiguen | §8 | Simulado; efecto nulo sobre el lento |
| 5. Participación, progreso, actividades e hitos; nunca la app abierta | §6.1, §6.2 | Rato eliminado; reparto por componente |
| 6. Propuesta de contenido | [CONTENIDO-PROPUESTA.md](CONTENIDO-PROPUESTA.md) | Hecha |
| 7. El reloj no demuestra lectura: controles y límites, coherentes con SEGURIDAD-MONEDAS §9 | §11 | Hecho |
| 8. Precios desde las sesiones de P0 (mediana y percentil lento) | §9 | Hecho |

---

## 15. Supuestos, límites y fuentes

- **Perfiles:**
  - P0–P4 leen 5, 15, 40, 70 y 110 palabras por minuto. P0 es un supuesto sin norma; P1–P4 se anclan en Hasbrouck y Tindal (2017, inglés) y en una tabla chilena de origen oficial no verificado.
  - Tropiezos de 2–10 % por frase y tiempo fuera de la lectura de 13–22 %.
  - Dispersión lognormal entre niños, σ = 0,35.
- **El lector muy lento** tiene factor 0,42.
- **Límites:**
  - Una sesión por día.
  - Sin gastar.
  - El niño no cambia de nivel.
  - **Sin aprendizaje ni cambio de conducta.**
  - El modo «textos nuevos» usa frases de los cuentos del nivel.
  - El ruido de Monte Carlo es de ±1 en las medianas.
  - Los abusos se calculan de forma determinista con tiempos mínimos supuestos.
- **Fuentes:**
  - Hasbrouck y Tindal (2017), informe técnico 1702.
  - ICO Children's Code, estándar 13.
  - Google Play Families.
  - Marinak y Gambrell (2008).
  - Deci, Koestner y Ryan (1999).

---

## 16. Riesgos

1. **P3 y P4 ganan menos por sesión** mientras hay cuentos nuevos: de 67 a 24 y de 120 a 27. Hay que anunciarlo sin tocar saldos. Con textos nuevos cada sesión, P3 pasa de ~430 a ~272 en 10 sesiones y P4 de ~695 a ~256 (§18.4). La mitigación de §18.3 no lo cambia: devolverlo rompería la equidad.
2. **Calibración** de la referencia y del tope de 2×. Si están mal, el lento vuelve a perder o el tope deja de proteger. Se corrige con telemetría y piloto.
3. **El reloj sobre segundos pagados** no está implementado. Sin él, una app manipulada cobra 70–230/min.
4. **Releyendo, la relectura es el 93–96 % del ingreso a largo plazo.** Se necesita contenido nuevo (CONTENIDO-PROPUESTA).
5. **Cuentos 21–40 con marcas:** si se retiran, quedan 4 por nivel y la condición de la Cuncuna pasa a «todos, mínimo 4».
6. **Monedas con fracción:** la moneda de la pista debe anunciar el entero.
7. **«Relectura con mejora»** depende de cómo se cuente el tropiezo, que hoy es una señal motora y no de lectura.

---

## 17. Decisiones pendientes del usuario

> **Estado al 3-nov-2026:** aprobados como referencia el punto 1 (E2), el 5 (Cuncuna, con TIENDA-V3 ya actualizada) y el 7 (precios provisionales en dos olas). El 9 (PLAN-MAESTRO) está corregido. Siguen abiertos los demás y los nuevos de §18.9.

1. ~~**Modelo:** E2 con los parámetros de §6.3, incluidos el tope de 2× y la referencia N0 = 5. O 2.4.1 con los interinos de §7.~~ **Aprobado E2 como referencia.**
2. **Relectura:** 1,5/1 por minuto y «relectura con mejora» (+2, contra la mejor marca). **Nueva recomendación (§18.3): 1,5 en todos los niveles.**
3. **Antiabusos** (§8.2): reloj sobre segundos pagados (va a la rama de seguridad), dificultad real y avisos al adulto.
4. **Textos propios** (§8.3): ajuste a/b/c (por defecto c) y premio de terminar al aprobar. El PIN del adulto ya está aprobado y se implementa en `expansion-v3-pin-textos`.
5. ~~**Cuncuna** (§10): condiciones 1–4, «terminado» según el registro de premios y actualizar TIENDA-V3.~~ **Aprobado; TIENDA-V3 actualizada** (`ef867b3`).
6. **Marcapáginas en N0** para cuentos interrumpidos: es un cambio de flujo de lectura.
7. ~~**Precios:** 10/16/24/30, Dragón 80, «Dragón real» 107, catálogo actual sin cambios y dos olas (ola 1 = 360; ola 2 + Dragón = 224).~~ **Aprobados como provisionales.** Pasarlos a producción requiere otra aprobación.
8. **Nivel completo:** ¿+15 y además una pieza?
9. ~~**Actualizar PLAN-MAESTRO §6.5 y D4**~~ **Hecho** (`e22ca61`, rama `expansion-v3-continuidad`).
10. **Telemetría y piloto** (§12).
11. **Contenido** ([CONTENIDO-PROPUESTA.md](CONTENIDO-PROPUESTA.md)): tipos de actividad, autoría y fases.

---

## 18. Verificación antes de producción (3-nov-2026)

Responde a lo que pidió el usuario al aprobar E2: verificar las simulaciones, evaluar los niveles 3 y 4, conservar los saldos, revisar la relectura y los abusos, y corregir las contradicciones. Las tablas completas están en la página ([`index.html`](index.html#verificacion)) y en [`simulador/datos/tablas.md`](simulador/datos/tablas.md) (secciones «Verificación»). Los datos salen de [`simulador/sensibilidad.mjs`](simulador/sensibilidad.mjs), que escribe `datos/sensibilidad.json`.

Para reproducir (Node 22, sin dependencias, semilla `20261103`):

```
node docs/expansion-ciempi/economia/simulador/simular.mjs        # ~75 s
node docs/expansion-ciempi/economia/simulador/sensibilidad.mjs   # ~40 s
node docs/expansion-ciempi/economia/simulador/generar-informe.mjs
node --experimental-strip-types docs/expansion-ciempi/economia/simulador/verificar-abusos.mts
```

### 18.1 Reproducibilidad del simulador [V]

- **Cambios del WIP `e4e6d3b` en `simular.mjs`:**
  - exporta funciones para que `sensibilidad.mjs` las importe, y solo escribe `resultados.json` si se ejecuta directamente;
  - dos contadores de verificación que no consumen azar (`sobreTopeMin`, `repeticionMin`);
  - corrige `abuso()` para que use la referencia y el tope del modelo (antes, `REF_SPM` y tope 1× también en E2);
  - añade el escenario de abuso **«rondar»**.
- **Ejecución con la semilla 20261103:** el `resultados.json` nuevo es **idéntico byte a byte** al del WIP (`md5 ad022e4f…`).
- **Comparación con `76c9367`** (diferencia campo a campo): **48 diferencias, todas en `abusoAmpliado`**. Son la fila «rondar», insertada en cada modelo, y el desplazamiento de la fila «app abierta», cuyos valores no cambian. **Ninguna otra cifra cambia**: medianas, Gini, campañas, precios, Cuncuna, lector lento y caso del usuario son idénticos (P0–P4 de E2 = 21 / 28 / 26 / 24 / 27; brecha 1,34×).
- **Corrección de `abuso()`:** se verificó que **no tiene efecto numérico**. El arrastre (3,05 s por frase) queda por debajo de lo esperado con cualquier referencia.
- **`sensibilidad.mjs`:** dos ejecuciones dan el mismo JSON (`md5` idéntico), antes y después de ampliarlo.
- **`verificar-abusos.mts`** (código real 2.4.1): vuelve a dar 305 / 10 / 40 / 15, igual que el `abusos.json` del checkpoint.

### 18.2 Sensibilidad de E2 [I]

Cada escenario cambia un supuesto y lo restaura. Medianas en sesiones de 15 min con cuentos nuevos, salvo que se indique otra cosa.

| Escenario | P0 | P1 | P2 | P3 | P4 | Brecha | Gini | Caso 20 min | Muy lento: Dragón 80 / Cuncuna vía 3 (sesiones, p50) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **Base** | 21 | 28 | 26 | 24 | 27 | 1,34 | 0,08 | 34 | 5 / 11 |
| Todos −30 % de ritmo | 21 | 27 | 25 | 23 | 26 | 1,29 | 0,09 | 30 | 6 / **15** (p90 18) |
| Todos +30 % de ritmo | 21 | 30 | 26 | 24 | 27 | 1,43 | 0,10 | 34 | 5 / 7 |
| P0–P1 −30 % y P3–P4 +30 % | 21 | 27 | 26 | 24 | 27 | 1,29 | 0,09 | 30 | 6 / 15 |
| P0–P1 +30 % y P3–P4 −30 % | 21 | 30 | 26 | 23 | 26 | 1,43 | 0,09 | 34 | 5 / 7 |
| σ entre niños 0,50 | 21 | 27 | 26 | 24 | 26 | 1,29 | 0,10 | 34 | 5 / 11 |
| Tropiezos ×0,5 / ×2 / ×3 | 21 | 28 | 26 | 24 | 27 | 1,34 | 0,08 | 34 | 5 / 11 |
| Tiempo fuera −30 % | 23 | 31,5 | 28 | 26 | 29 | 1,37 | 0,08 | 37 | 5 / 9 |
| Tiempo fuera +30 % | 19 | 26 | 24 | 23 | 26 | 1,36 | 0,09 | 32 | 6 / 11 |
| Sesiones de 10 min | 13 | 18 | 17 | 15 | 17 | 1,38 | 0,10 | — | 9 / **21** (p90 37) |
| Sesiones de 20 min | 29 | 39 | 35 | 34 | 37 | 1,34 | 0,08 | — | 4 / 6 |
| Sesiones de 30 min | 44 | 59 | 55 | 57 | 58 | 1,34 | 0,09 | — | 2 / 4 |
| Referencias E2 −30 % | 20 | 27 | 25 | 23 | 24 | 1,35 | 0,10 | 34 | 5 / 11 |
| Referencias E2 +30 % | 22 | 27 | 24 | 22 | 24 | 1,22 | 0,07 | 33 | 6 / 11 |
| N0 = 7 síl/min (valor de E) | 22 | 28 | 26 | 24 | 27 | 1,27 | 0,08 | 32 | 6 / 11 |
| Tope por unidad 1,5× / 3× | 21 | 28 | 26 | 24 | 27 | 1,34 | 0,08–0,09 | 32 / 34 | 6 / 11 · 5 / 11 |

**Conclusiones:**
- **La equidad aguanta todos los escenarios:** brecha 1,22–1,43× y Gini 0,07–0,10. Con 2.4.1 la brecha es de 15×.
- **Los tropiezos no mueven E2**, porque ya no quitan la moneda y su tiempo extra se paga. En 2.4.1 eran la causa principal de que P0 juntara ~59 monedas en toda su vida.
- **Lo más sensible es la duración de la sesión**, que es lineal, como se busca. También lo es la **vía 3 de la Cuncuna para el lector muy lento**: con sesiones de 10 min sube a 21 sesiones (p90 37), unas 4–7 semanas. Si la telemetría muestra lectores así, conviene el **marcapáginas en N0** (§10.2) o bajar la vía 3 a 45 min + 30 frases. Hay que decidirlo; no se simuló.
- **Referencias ±30 %:** el ingreso por sesión cambia menos de 3 monedas, porque el tope de 2× casi nunca corta (§18.2.1). Una referencia mal calibrada afecta sobre todo al **tope**, no a la paga.

#### 18.2.1 ¿A quién le corta el tope por unidad? [I]

Tiempo activo que queda sin pagar por el tope (10 sesiones releyendo; promedio y p90 por niño):

| Tope | P0 | P1 | P2 | P3 | P4 | Muy lento |
|---|---:|---:|---:|---:|---:|---:|
| 1,25× | 0,7 % | 3,7 % | 3,8 % | 3,7 % | 3,7 % | **14,1 %** (p90 17,2) |
| 1,5× | 0,2 % | 1,6 % | 1,6 % | 1,5 % | 1,6 % | 6,3 % (p90 8,8) |
| **2× (E2)** | 0,0 % | 0,3 % | 0,3 % | 0,2 % | 0,3 % | **1,0 %** (p90 2,2) |

- **Se confirma 2×:** el lector muy lento pierde como máximo ~1 %. Con 1,5× perdería ~6 %.
- **Endurecer el tope no frena el abuso «rondar»**, que sigue en 2,1/min (§18.5). Solo acorta el tiempo que tarda.
- **Repetición de frases:** el simulador **no paga** volver atrás en una frase, pero la implementación en curso sí la pagaría como `releida` (a tasa de relectura). Es el 8,4 % del tiempo activo de P0, el 7,6 % del muy lento y el 1,7 % de P4. Por eso las cifras de §3–§9 **subestiman en ~5–6 % el ingreso de los más lentos** y casi nada el de P4. El sesgo favorece la equidad.

### 18.3 Niveles 3 y 4: impacto y mitigación [I salvo que se indique]

**Diagnóstico.** La caída por sesión (P3 de 67 a 24, P4 de 120 a 27) es **el costo de la equidad por minuto**. Cualquier regla que devuelva a P3 ~67 monedas en 15 min mientras P0 gana ~21 vuelve a una brecha ≥ 3×. El problema real que encontró la verificación está en el **largo plazo releyendo**:

| E2 base, releyendo los 8 cuentos de su nivel | P0 | P1 | P2 | P3 | P4 |
|---|---:|---:|---:|---:|---:|
| Acumulado en 144 sesiones | 1 953 | 2 054 | 1 477 | **1 383** | 1 507 |
| Sesiones para la ola 1 (360) | 23 | 22 | 31 | **34** | 30 |

Releyendo, P2–P4 ganan un 25–30 % menos que P0. La causa es la relectura a 1/min en N2–N4, frente a 1,5 en N0–N1. Con textos nuevos no pasa: P3 gana 3 737 frente a 2 615 de P0.

**Mitigaciones simuladas** (ninguna paga por tener la app abierta):

| Modelo | P0–P4 en 15 min | Brecha | Gini | Peor abuso | P3 / P4 en 144 ses. releyendo | P2 / P3 / P4: sesiones para la ola 1 |
|---|---|---:|---:|---:|---|---|
| E2 | 21 / 28 / 26 / 24 / 27 | 1,34 | 0,08 | 2,1 | 1 383 / 1 507 | 31 / 34 / 30 |
| **E2H**: + palabras nuevas en N2–N4 (+2 cada 40) | 21 / 28 / 34 / 38 / 48 | **2,29** | **0,16** | 2,1 | 1 403 / 1 547 | 29 / 32 / 26 |
| **E2R**: relectura 1,5/min en **todos** los niveles | 21 / 28 / 26 / 24 / 27 | **1,34** | **0,08** | 2,1 | **2 042 / 2 220** | **21 / 24 / 21** |

- **E2H (hito educativo por palabras nuevas): descartada.** Un lector rápido ve más palabras nuevas por minuto, así que **favorece la velocidad**: la brecha sube de 1,34 a 2,29× y el Gini se duplica. Además solo ayuda en las primeras sesiones: cuando se acaban los cuentos de la biblioteca, ya no queda nada nuevo que contar.
- **E2R: recomendada** [C].
  - Paga **por minuto de actividad completada**, igual para todos los ritmos, así que no favorece la velocidad.
  - No cambia la primera sesión ni la equidad, y no abre abusos nuevos: los 8 escenarios dan las mismas cifras que E2, porque el abuso se hace en primera lectura, a 2/min.
  - **Iguala el largo plazo:** P3 pasa de 1 383 a 2 042 en 144 sesiones (P0: 1 953) y la ola 1 de 34 a 24 sesiones (P0: 23).
  - Cambio en §6.3: `tasaPorMinuto.relectura = { 0: 1.5, 1: 1.5, 2: 1.5, 3: 1.5, 4: 1.5 }`.
  - Costo: releer en N2–N4 rinde lo mismo que en N0–N1. Fable había pedido que los principiantes avanzaran algo más rápido releyendo. Con E2R esa ventaja desaparece, pero los principiantes siguen recibiendo los hitos de sílabas y palabras.
- **Complemento para la transición** (simulado en §18.4): el **«nivel completo» (+15) retroactivo** al migrar, para quien ya terminó los 8 cuentos de su nivel con 2.4.1. Es verificable con `pagado_hasta` y no depende de la velocidad.
- **Lo que no se mitiga:** el niño de N3–N4 que recibe **textos nuevos en cada sesión** ganará menos que hoy por sesión (§18.4). Hay que anunciarlo («ahora todo leer suma, también releer») y conservar lo comprado y el saldo. La compensación de fondo es el contenido nuevo con actividades (CONTENIDO-PROPUESTA), no subir la tasa.

### 18.4 Conservación de saldos en la migración 2.4.1 → E2

**En el código [V, leído en `worktree-agent-a5e1c8d72e4a5aeb0`, `da87153`]:**
- La migración `012_registro_de_premios.sql` **no toca `perfiles_ninos.monedas`**. Registra el saldo de cada niño como fila `saldo_inicial` y marca lo ya leído como pagado (`pagado_hasta = leido_hasta`).
- `otorgarPremio` solo suma (`saldo = monedas + calculo.monedas`). En E2, `calcularPremioE2` nunca devuelve monedas negativas (`floor` de un acarreo ≥ 0), y la columna tiene `check (monedas >= 0)`.
- Las unidades ya pagadas con 2.4.1 **no se vuelven a pagar como primera lectura**. Con E2 pagan como `releida`, a tasa de relectura.
- Un cuento terminado con 2.4.1 (`pagadoHasta = total`) **no recibe** el premio de terminar con E2, porque `terminoLibro` exige `previo.pagadoHasta < total`.
- **Pérdida menor detectada [V, en código]:** un cuento **a medias** al migrar que se termina con E2 evalúa `fraccionActivaMinima` solo con el tiempo de la parte leída con E2 (`activoLibroSegundos` parte de 0). Si esa parte es menos del 50 % de lo esperado de todo el cuento, no paga el premio de terminar (≤ 3 monedas). No es saldo perdido, sino un premio que no se gana. **Arreglo propuesto:** en las asignaciones migradas, contar como activo lo esperado de las unidades ya pagadas.

**Simulación [I]:** 20 sesiones con 2.4.1, migración y 40 sesiones con el modelo nuevo; 400 niños por perfil; nadie gasta.

| Releyendo | P0 | P1 | P2 | P3 | P4 |
|---|---:|---:|---:|---:|---:|
| Saldo al migrar (p50) | 57 | 74 | 147 | 120 | 470 |
| Últimas 10 sesiones en 2.4.1 | 2 | 0 | 19 | 0 | 87 |
| Primeras 10 con E2 / **E2R + retro** | 143 / **145** | 151 / **154** | 98 / **162** | 90 / **152** | 97 / **162** |
| Sesiones para ganar 360 nuevas (E2 / E2R + retro) | 27 / 27 | 26 / 25 | 37 / 24 | 40 / 25 | 37 / 24 |

| Con textos nuevos | P0 | P1 | P2 | P3 | P4 |
|---|---:|---:|---:|---:|---:|
| Saldo al migrar (p50) | 152 | 355 | 729 | 913 | 1 553 |
| Últimas 10 sesiones en 2.4.1 | 78 | 175 | 358 | **430** | **695** |
| Primeras 10 con E2R + retro | 186 | 243 | 258 | **278** | **264** |

- **Nadie pierde monedas:** 0 de 2 000 niños por modelo y modo tienen, en algún momento, un saldo menor que al migrar. Es una comprobación explícita (`ninosQuePierden`).
- **Retroactivo:** +15 de «nivel completo» a quien ya había terminado su nivel. En la simulación lo recibe el 100 % de P1–P4 y el 82 % de P0 releyendo (media de 12,3).
- **Las sílabas y palabras de los cuentos ya terminados:** el simulador las cuenta como «vistas» al migrar (`retro`), así que no se pagan otra vez. Sin esa regla, P0 cobraría ~12 monedas más al releer. **Recomendación** [C]: no reconstruirlas en el servidor. Es más simple y cuesta ≤ ~12 monedas por niño de N0–N1.
- **Releyendo, nadie gana menos con E2 que con 2.4.1.** P3 pasa de 0 a 90–152 en 10 sesiones (en 2.4.1 la relectura de N3 no pagaba).
- **Con textos nuevos, P2–P4 ganan menos por sesión:** P4 pasa de ~695 a ~264 en 10 sesiones. Sus saldos ya cubren el Dragón (100 %) y la ola 1 (98–100 % de P2–P4).

### 18.5 Abusos (revisión) [I salvo que se indique]

| Escenario (E2) | Monedas/min | Comentario |
|---|---:|---|
| 300 «Mariposa amarilla.» (N2), arrastrado | 1,8 | — |
| Muchos textos propios de 1 oración | 0 | — |
| Textos propios de ~1 min | 1,5 | — |
| Texto difícil en N0, arrastrado | 1,9 | Dificultad real |
| Activo falsificado, **reloj actual** (0,1 s/palabra) | **70,4** | Sigue abierto hasta que exista el reloj sobre los segundos pagados |
| Activo falsificado, reloj sobre segundos pagados | 2,0 | Ráfaga máxima de ~120 en 1 h |
| **Rondar** (nuevo): tocar cada < 10 s sin leer y completar cada frase de un cuento de N0 justo al llegar al máximo pagable | **2,1** | Es el **peor abuso legítimo**; antes se informaba 1,9 |
| App abierta 60 min sin completar frases | 0 | — |

- **«Rondar» es un límite de diseño, no un error.** E2 no distingue a un niño que lee muy despacio de uno que toca la pantalla sin leer: los dos completan la frase dentro del tope de 2×. Rinde **lo mismo que leer** (~2/min) y nunca más. Cambiar el tope no lo frena (2,1/min con 1,25×, 1,5× y 2×), solo acorta cuánto dura. Pagar menos castigaría al lector lento [U4]. El control que corresponde es **mostrárselo al adulto** (minutos y monedas por día, razón activo/esperado) y medirlo con la telemetría de §12.1.
- **Relectura con mejora** (cota determinista, peor caso por nivel con el cuento más corto, releyendo justo al 50 % de lo esperado, que es el mínimo que acepta la implementación):

  | Nivel | Cuento más corto (min esperados) | Relectura sola | Con mejora | Reserva si se cuenta 1 tropiezo por unidad |
  |---|---:|---:|---:|---:|
  | N0 | 8,4 | 1,5/min | 1,98/min | 16 monedas |
  | N1 | 3,2 | 1,5 | 2,74 | 20 |
  | N2 | 3,1 | 1 (1,5 con E2R) | 2,28 (2,78) | 18 |
  | N3 | 1,3 | 1 (1,5) | **4,0 (4,5)** | 8 |
  | N4 | 3,1 | 1 (1,5) | 2,27 (2,77) | 4 |

  - Tropezar a propósito en la primera lectura crea una **reserva** de mejoras: después se cobran +2 al día por cuento, bajando un tropiezo cada vez.
  - Con un tropiezo por unidad como máximo, la reserva total de los 40 cuentos es **≤ 558 monedas en toda la vida** (279 unidades × 2), y nunca más de 2 por cuento y día. El peor caso por minuto es el de N3 (4–4,5/min), pero se agota en 4 días.
  - **Hallazgo en la implementación [V, `premios.ts` de `da87153`]:** `medida(solicitud.tropiezos, 10_000)` acepta **hasta 10 000 tropiezos**. Con una app manipulada, la reserva queda prácticamente ilimitada (+2 por cuento y día, sin fin). **Corrección propuesta:** acotar los tropiezos de una lectura completa al número de unidades del cuento y exigir que la relectura registrada sea ≥ 1 minuto esperado, como el premio de terminar.
  - El simulador no modela aprendizaje, así que la parte legítima de «mejora» sale casi nula (0–1 %) [P].
- **`segundosActivos` ausente [V, en código]:** si la app no los manda, `segundosQueCuentan` paga **lo esperado** (`activos ?? esperado`). Es compatible con apps anteriores, pero es exactamente el modelo D, que con arrastre llega a **45/min** sin el reloj sobre segundos pagados. **Corrección propuesta:** con `ECONOMIA=e2`, una solicitud sin `segundosActivos` no paga por tiempo, o paga con el tiempo plausible mínimo. En cualquier caso, el reloj sobre segundos pagados tiene que estar antes de activar E2.
- **Pausas [V, en código]:** `PantallaLectura` cuenta **hasta 10 s de cada pausa** (`Math.min(gap, MAX_PAUSA_ACTIVA_MS)`). §6.1 decía «las pausas de más de 10 s no cuentan». El efecto es pequeño, porque el tope de 2× acota igual, y la versión del código es más generosa con el lento. **Se adopta la del código** y se corrige la redacción: «cada pausa cuenta como máximo 10 s».

### 18.6 Contradicciones entre documentos corregidas [V]

| Documento | Decía | Ahora dice | Commit |
|---|---|---|---|
| TIENDA-V3 §4.6 | Cuncuna: 6 de N0 con `completada_en`; 4 de cualquier nivel para N1+; sin vía para el lector lento | 6 de 8 de N0 (mínimo 4 si faltan), 6 de cualquier nivel para N1+, 60 min + 30 frases de N0 para el lento, regalo del adulto; registro de premios; celebración especial | `ef867b3` (rama de la tienda) |
| TIENDA-V3 §4.8 e index.html | Rangos 6–12 / 14–18 / 20–26 / 28–32 y Dragón 60–100 por definir | Provisionales E2: 10 / 16 / 24 / 30, conjuntos ~60–85, Dragón 80, «Dragón real» 107, dos olas (360 + 224) | `ef867b3` |
| TIENDA-V3 §2.4 | El catálogo superaba 2,4× los ingresos; lo decide la economía | Dos olas; regla de salud en sesiones de P0 (≤ ~150) | `ef867b3` |
| TIENDA-V3 §1.1 | Cuentos ≈ 697 | Nota: 703 y catálogo 1 350 según el código | `ef867b3` |
| PLAN-MAESTRO §6 (puntos 4–6), Fase 0, D3, D4 y D5 | Tope diario silencioso (60), N0 = 2 por frase, tope N2 = 14, Cuncuna 50 como opción | E2 aprobado; tope diario y media tasa rechazados; antiabusos sin castigo; precios provisionales; Cuncuna 6/8 | `e22ca61` (rama `expansion-v3-continuidad`) |
| ECONOMIA-V3 §0, §1, §8.1, §10.3, §13, §16 y §17 | Peor abuso 1,9; contradicciones abiertas | Rondar 2,1; contradicciones marcadas como corregidas | este commit |

No se tocó `CONTINUIDAD-SESION.md`, que mantiene el coordinador.

### 18.7 Cotejo de §6.3 con la implementación en curso

Rama `worktree-agent-a5e1c8d72e4a5aeb0`, commit **`da87153`**, «checkpoint WIP: E2 experimental (pausa por límite, **SIN PROBAR**)». El worktree no tenía cambios sin commitear al leerlo. **No está terminado:** la tabla refleja lo que había y hay que repetirla cuando el trabajo esté listo [P].

| Parámetro de §6.3 | Propuesta | Implementación (`da87153`) | Estado |
|---|---|---|---|
| Bandera | — | `ECONOMIA=e2`; 2.4.1 por defecto; `leerModeloEconomia` | Lógica escrita en `monedas.ts`; **el servidor no la lee** (`server/src/premios.ts` sigue usando `REGLAS_MONEDAS`) |
| `version` | `3.0.0-e2` | `3.0.0-e2` | Coincide |
| `tasaPorMinuto.primeraLectura` | 2 | 2 | Coincide |
| `tasaPorMinuto.relectura` | 1,5 / 1,5 / 1 / 1 / 1 | 1,5 / 1,5 / 1 / 1 / 1 | Coincide (si se aprueba E2R, cambiar a 1,5 en todos) |
| `silabasPorMinutoReferencia` | 5 / 22 / 60 / 105 / 165 | Igual | Coincide |
| `segundosFijosPorUnidad` | 3 | 3 | Coincide |
| `topeSobreEsperado` | 2 | 2 (`segundosQueCuentan`) | Coincide; **sin `segundosActivos` paga lo esperado** (§18.5) |
| `pausaActivaMaxSegundos` | 10 | 10 (solo declarativo); la app recorta cada pausa a 10 s | Coincide en el valor; redacción corregida (§18.5) |
| `dificultadReal` | true; solo fuera de la biblioteca | `nivelDeReferencia` = máx(asignado, del texto); `opciones.nivelReferencia` | Función escrita; **el servidor no pasa `nivelReferencia`**; falta excluir los cuentos de Ciempi |
| `libroTerminado` | porMinuto 1, máximo 3, mínimo 1 min, 50 % activo | Igual; una sola evaluación (`libroPremiado`) | Coincide; **falta «una vez por huella» en textos propios** (servidor). Pérdida menor en cuentos a medias al migrar (§18.4) |
| `relecturaConMejora` | +2, una por cuento y día, contra la mejor marca | +2; `relecturaDia`; `mejorTropiezos = min`; exige relectura registrada ≥ 50 % de lo esperado | Coincide; **tropiezos aceptados hasta 10 000** (§18.5) |
| Relectura por unidad (`releida`) | Paga por tiempo a tasa de relectura | Tipo `releida`, `acumular(..., relectura[nivel])` | Coincide |
| Frase «muy rápida» no paga; el tropiezo no quita | Sí | `conPremio` falso → 0; el tropiezo no resta | Coincide |
| `nuevas` (N0: 15 sílabas → +2; N1: 25 palabras → +2) | Sí, solo biblioteca y textos del adulto | Valores en `REGLAS_MONEDAS_E2`; `piezasDe` normaliza | **El servidor no lo suma** («lo agrega el servidor»): no implementado |
| `nivelCompleto` | +15 una vez | Valor declarado | **No implementado en el servidor** |
| Fracción por libro | Sí | `fraccion` en `EstadoPremios`, `combinarEstados` usa el máximo | Coincide. Revisar que `max` no duplique fracciones entre asignación y `lecturas_premiadas` [P] |
| Reloj sobre segundos pagados | `costo = minutosPagables × 60` | `costoSegundos = max(plausible, pagados)` calculado | **El servidor no lo usa para E2** (reloj «no empezado» según el commit) |
| Cuncuna en el servidor (`013_*.sql`) | §10 | — | **No empezado** |
| Pruebas | — | `premios.test.ts` existe en la rama; el WIP **no se compiló ni se probó** | Pendiente |

### 18.8 Qué está verificado y qué no

- **Verificado [V]:**
  - el simulador reproduce `76c9367` y la sensibilidad es determinista;
  - `verificar-abusos.mts` reproduce las fugas de 2.4.1;
  - la migración 012 conserva el saldo, y el servidor solo suma (lectura de código);
  - los hallazgos de la implementación: 10 000 tropiezos, `segundosActivos` ausente que paga lo esperado, pausas recortadas a 10 s, lo que falta en el servidor;
  - la corrección de TIENDA-V3 y PLAN-MAESTRO.
- **Inferido [I]:** todas las cifras de monedas, sesiones, abusos y migración, que salen del simulador con supuestos (§15).
- **No verificado [P]:**
  - la implementación de E2, que no compila ni tiene pruebas en `da87153`;
  - la celebración de la Cuncuna;
  - el efecto de la «relectura con mejora» con aprendizaje real;
  - el comportamiento de niños reales (piloto, §12).

### 18.9 Pendiente

1. **Decidir E2R** (relectura 1,5 en todos los niveles) y el **retroactivo** de «nivel completo» al migrar.
2. En la rama de seguridad, antes de activar `ECONOMIA=e2`:
   - **reloj sobre los segundos pagados**;
   - **acotar `tropiezos`** al número de unidades;
   - **no pagar lo esperado sin `segundosActivos`**;
   - premio de terminar en cuentos migrados a medias;
   - **sílabas y palabras nuevas** y **nivel completo** en el servidor;
   - **dificultad real** solo fuera de la biblioteca;
   - **Cuncuna (013)**;
   - pruebas con clientes modificados.
3. **Repetir el cotejo de §18.7** cuando la rama de seguridad esté compilada y probada.
4. Si se aprueba E2R, ajustar §6.3 y volver a calcular la tabla de precios de §9.1. Con E2R, P2–P4 releyendo necesitan **menos** sesiones, así que los precios de P0 no cambian.
5. Vía 3 de la Cuncuna con sesiones cortas (10 min → 21 sesiones): decidir el marcapáginas en N0 o 45 min + 30 frases.
