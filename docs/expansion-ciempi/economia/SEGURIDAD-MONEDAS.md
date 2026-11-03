# Seguridad de monedas: registro de premios en el servidor (CIEMPI 2.5, propuesta)

Estado: **implementado y probado en la rama `worktree-agent-a5e1c8d72e4a5aeb0`**. No se fusionó a `main` y no se desplegó. **Por defecto no cambia la economía**: precios, monedas por unidad, topes, hitos y relecturas son los mismos de 2.4.1. Lo verifican `src/lectura/premios.test.ts` («son las de 2.4.1»), `src/lectura/premiosE2.test.ts` («por defecto … es 2.4.1») y `server/test/e2.test.ts` («por defecto paga exactamente como 2.4.1»).

El modelo **E2** (ECONOMIA-V3 §6) está implementado **solo detrás de la bandera `ECONOMIA=e2`** (§10), en modo experimental. El desbloqueo de la **Cuncuna** está en §11.

## 1. Amenaza

En 2.4.1, `POST /api/perfiles/:id/monedas {cantidad}` sumaba hasta ±100 por llamada, sin límite de llamadas y sin cotejar con lo leído (`server/src/app.ts:392` de 2.4.1). Cualquiera que pudiera ver al niño, incluido el propio niño con su sesión, podía llamarlo. El antiduplicado existía solo en la app. Consecuencias:

- **Saldo arbitrario:** un script, o un niño con las herramientas del navegador, sumaba 100 monedas por pedido.
- **Doble pago:** había premios dobles por reintentos, por dos dispositivos o al reinstalar.
- **Monedas perdidas:** si el `POST` fallaba sin conexión, la moneda se perdía.
- **Farmeo:** se podía borrar un texto y volver a subirlo (`leido_hasta` volvía a 0).

Quién ataca: el propio niño curioso, un hermano o un script sencillo. No hay dinero real en juego. El objetivo es que la tienda, y la motivación, no se rompan con un truco fácil, sin castigar a los niños lentos.

## 2. Qué verifica el servidor y qué no

| Verifica (servidor) | No verifica |
|---|---|
| Que el texto y la asignación existen y son del niño, y que quien pide puede ver a ese niño. | **Que el niño haya leído de verdad.** No hay audio ni reconocimiento de voz. |
| **Cuánto se paga.** Lo calcula el servidor con `src/lectura/premios.ts` y la tabla `REGLAS_MONEDAS`. Lo que la app dice esperar (`esperadas`) solo queda anotado. | Si el ritmo «a buen ritmo» que mide la app es real. La app decide `conPremio` (si la última unidad pagó), pero eso solo puede **quitar** una moneda, nunca agregarla. |
| Que el avance solo sube: se paga únicamente lo que queda más allá de `pagado_hasta`, y de eso solo la última unidad, más los hitos nuevos. | El tiempo activo que mide la app: el servidor no lo usa. |
| **Idempotencia.** Hay un `unique(perfil_id, operation_id)`: el mismo pedido responde siempre lo mismo y paga una sola vez, aunque llegue a la vez desde dos dispositivos. | La dificultad real de un texto propio, más allá del nivel sugerido al agregarlo. |
| Relectura: exige el libro terminado, una fecha entre hoy −3 y hoy +1, y un día posterior a la última relectura pagada. | |
| **Plausibilidad temporal** con el reloj del servidor (`revisarRitmo`). Cada premio adelanta un «reloj de lectura» por niño en lo mínimo que toma leer lo premiado: 0,1 s por palabra y al menos 0,5 s por unidad, con 1 h acumulable y 5 s de tolerancia. Si se pide más rápido, responde **429** con `reintentarEnSegundos`. Nada se pierde: queda en la cola y se paga después. | |
| Memoria por texto (`lecturas_premiadas`): por id en los cuentos de Ciempi y por huella sha256 del texto normalizado en los textos propios. Borrar y volver a subir, o quitar y volver a agregar, no vuelve a pagar. | |
| Atomicidad: transacción con `FOR UPDATE` sobre el niño y la asignación. Compras y premios simultáneos se atienden de a uno, y el saldo nunca queda negativo (también lo asegura un `check` en la base). | |

**Límite explícito:** el reloj del servidor acota **cuánto y qué tan rápido** se paga, pero **no demuestra que hubo lectura**. Un script paciente que imita el ritmo de un lector cobra como un lector. Los parámetros de plausibilidad son deliberadamente generosos (10 palabras/s, más rápido que cualquier lectura en voz alta), así que **nunca frenan a un niño lento**. Tampoco pagan tiempo: el reloj solo pone un límite superior, y el tiempo inactivo no genera monedas.

## 3. Diseño

- **Contrato nuevo:** `POST /api/asignaciones/:id/premios`, con `{ operationId, tipo: 'avance', hasta, conPremio, esperadas }` o con `{ operationId, tipo: 'relectura', dia, esperadas }`.
  - Responde `{ estado: 'otorgado'|'repetido', otorgadas, monedas (saldo), motivo, leidoHasta, premioHasta, relecturaPremiadaEn, pagadoHasta }`.
  - También puede responder 429 («espera»), 404 (el libro ya no está) o 400/403.
- **Cálculo puro compartido:** `src/lectura/premios.ts`. Lo usan el servidor y el modo sin cuenta (`repositoriosLocales`), así que los dos pagan lo mismo. La economía vive en una sola tabla reemplazable, `REGLAS_MONEDAS`, en `src/lectura/monedas.ts`, y cada premio guarda en el registro la versión de las reglas.
- **Registro (*ledger*):** la tabla `premios` tiene una fila por pedido atendido (pague o no), con lo pedido, lo pagado y el saldo resultante. Tipos: `avance`, `relectura`, `ajuste`, `legado` y `saldo_inicial`. Las filas permiten auditar y cuadrar el saldo.
- **Ajuste manual de un adulto:** `POST /monedas` con `motivo`, solo si quien lo pide es adulto del niño. Queda registrado y el saldo nunca baja de 0.
- **Cliente:**
  - **Cola persistente** (`src/datos/colaPremios.ts`, en `localStorage`): FIFO, idempotente, con espera creciente (5 s → 5 min) o la que indique el 429. Se reintenta al iniciar sesión, al volver la conexión o la app, antes de comprar y antes de cerrar sesión.
  - **Saldo mostrado** = saldo del servidor + monedas esperadas en la cola. Se suma al instante y se corrige con cada respuesta (`App.tsx`: `pedirPremio`, `alResolver`, `recargarPerfiles`).
  - **Respuestas del servidor:** un `descartado` resta lo esperado. 401, 408 y 5xx se reintentan; 400, 403 y 404 se descartan.
- **Errores corregidos en `PantallaLectura`:**
  - La relectura se reconoce con `libroTerminado()`. Antes, en los niveles 0, 1 y 3 nunca pagaba.
  - La pantalla final muestra todo lo ganado en la lectura (`crearCuentaDeLectura`), no solo la última frase.

## 4. Migración `server/sql/012_registro_de_premios.sql`

No es destructiva: solo agrega tablas y columnas, y no borra ni cambia saldos.

- Crea las tablas `premios` y `lecturas_premiadas`.
- Agrega `textos.huella`, que se rellena de forma perezosa la primera vez que se necesita.
- Agrega `perfiles_ninos.premios_reloj`.
- Agrega `asignaciones.pagado_hasta = leido_hasta`: con las reglas de 2.4.x, lo leído ya estaba pagado.
- Inserta una fila `saldo_inicial` por niño.

El migrador (`server/src/db.ts`) la aplica una sola vez.

## 5. Compatibilidad

| Combinación | Comportamiento | Prueba |
|---|---|---|
| **APK antigua (≤ 2.4.1) + servidor 2.5** | Su `POST /monedas` ya no suma: devuelve el saldo y queda anotado como `legado`. Su `PUT progreso`, que no trae `premiosPorRegistro`, paga lo que corresponde al avance (`legado-avance:<asig>:<hasta>`) y a la relectura (`legado-relectura:<asig>:<día>`) con las mismas reglas, una sola vez. | Servidor: «APK antigua» (verificado). |
| ↳ efecto visible en la APK antigua | El contador de la APK no sube en el momento: la respuesta de `/monedas` trae el saldo sin la moneda, que llega con el progreso de esa frase. Se ve bien al volver a la biblioteca. | Inferido del código; no probado en un dispositivo. |
| ↳ pago de la última unidad | La APK antigua no informa si la última unidad fue rápida, así que se paga con `conPremio: true`. El pago extra máximo es 1 unidad por tramo, y sigue acotado por el reloj. | Inferido. |
| **Web/APK 2.5 + servidor 2.4.1** (vuelta atrás del servidor) | `/premios` responde 404 de ruta inexistente (`message: 'Route …'`). La app vuelve al endpoint viejo con `cantidad = esperadas`, como en 2.4.1 (con la vulnerabilidad de 2.4.1). El servidor viejo ignora `premiosPorRegistro`. | Cliente: `repositoriosApi.test.ts` (verificado con `fetch` simulado). |
| Web/APK 2.5 + servidor 2.5 | Contrato nuevo. | Servidor (11 pruebas) y cliente. |
| Sin cuenta (`localStorage`) | El mismo cálculo, local, con idempotencia por `operationId` y relectura. No revisa el ritmo, porque los datos son del dispositivo. | `repositoriosLocales.test.ts`. |

## 6. Despliegue (requiere aprobación del usuario) y vuelta atrás

Orden: **servidor → web → APK**.

1. **Respaldo.** `pg_dump` de la base de producción antes de migrar.
2. **Servidor 2.5.** Se despliega `server/` junto con `src/lectura/{monedas,premios}.ts` y `src/lenguaje/*` (el servidor los importa). Al arrancar, la migración 012 se aplica sola. Las APK antiguas siguen funcionando (§5).
   - Comprobar: `select tipo, count(*) from premios group by 1;` y que no haya 5xx en `/premios`.
3. **Web 2.5.** Sube con el servidor ya en 2.5. Si se publicara antes, usaría el endpoint viejo (§5), sin romperse.
4. **APK 2.5.** Va al final.

**Vuelta atrás:**

- **Servidor a 2.4.1.** Se vuelve al código anterior **sin revertir la migración**: las tablas y columnas nuevas no molestan al código viejo. Mientras tanto, las apps 2.5 usan el endpoint viejo, de modo que reaparece la vulnerabilidad de 2.4.1, pero no se pierden monedas.
- **Al volver a 2.5:** ejecutar `update asignaciones set pagado_hasta = greatest(pagado_hasta, leido_hasta);`. Así no se vuelve a pagar lo que se leyó y pagó con 2.4.1 en el intermedio.
- **Web a 2.4.1.** Es compatible con el servidor 2.5, como una APK antigua.
- **Pedidos en cola.** Los pedidos que una app 2.5 tenga en cola se envían cuando vuelva el servidor 2.5. Si el servidor es 2.4.1, se envían por el endpoint viejo.

## 7. Resultados de pruebas (corridas reales, 2026-11-03)

**Con E2, Cuncuna y migración 013 (commit final de la rama):**

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit -p .` | Sin errores (exit 0). |
| `(cd server && npx tsc --noEmit)` | Sin errores (exit 0). |
| `npx vitest run src` | **25 archivos, 242/242** (229 anteriores + 10 de `premiosE2.test.ts` + 3 de `tiempoActivo.test.ts`). |
| `DATABASE_URL=postgres://ciempi:ciempi@localhost:5434/ciempi_test_seguridad npx vitest run server/test` | **2 archivos, 59/59, tres corridas seguidas** (36 de `api.test.ts` + 23 de `e2.test.ts`), ~16 s. `e2.test.ts` usa su propio esquema (`prueba_e2`) para poder correr a la vez que `api.test.ts`, que borra `public`. |

**Antes (commit `dcab7d5`, solo el registro de premios):**

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit -p .` | Sin errores (exit 0). |
| `(cd server && npx tsc --noEmit)` | Sin errores (exit 0). |
| `npx vitest run src` | **23 archivos, 229/229.** La línea base era 186; se agregaron 43 pruebas. |
| `DATABASE_URL=…/ciempi_test_economia npx vitest run server/test` | **36/36, tres corridas seguidas**, sin intermitencias. Base `ciempi_test_economia` en el contenedor local `ciempi-db-1`. |

Pruebas nuevas del cliente:

- `src/datos/colaPremios.test.ts` (8): sin conexión → pendiente persistido; una instancia nueva reintenta con el mismo `operationId`; duplicado; FIFO que se detiene; respuesta directa; descartar; espera del 429 y espera creciente con tope; almacenamiento bloqueado.
- `src/lectura/premios.test.ts` (18): valores de 2.4.1; avance; ya pagado; salto de frases; frase rápida; recorte; tope; hito del nivel 2; hitos del nivel 4; relectura (terminado, una por día, fecha válida, costo); `revisarRitmo`; `combinarEstados`; huella.
- `src/lectura/cuentaDeLectura.test.ts` (4): `libroTerminado` y `crearCuentaDeLectura`.
- `src/datos/localStorage/repositoriosLocales.test.ts` (+4): cálculo e idempotencia, persistencia, relectura en el nivel 1, libro anterior a 2.5 ya pagado, libro quitado.
- `src/datos/api/repositoriosApi.test.ts` (9, con `fetch` simulado): contrato, relectura, cola sin conexión y reapertura, 429/503/401 pendientes, 404/403 descartados, **vuelta al endpoint legado**, `premiosPorRegistro`, enviar la cola antes de comprar, motivo del ajuste.

Escenarios del servidor (bloque «registro de premios»): cantidad calculada por el servidor; `operationId` repetido y simultáneo; dos dispositivos; reinstalación; frase rápida y relectura (niveles 1 y 3); 429 y reintento; borrar y volver a subir, o quitar y volver a agregar; APK antigua; compras simultáneas y premio junto con compra; saldo nunca negativo con el registro cuadrando; extraño (403).

**No probado:** un dispositivo Android real, una APK antigua real contra este servidor, la interfaz en el navegador (no hay pruebas E2E) y la carga con muchos niños.

## 8. Riesgos residuales

1. **Nivel 2 sin tope por libro.** Es un valor de la economía 2.4.1 y no se cambia aquí. Con textos propios, un script solo queda limitado por el reloj de plausibilidad: del orden de **~4 500 monedas por hora** con oraciones de unas 8 palabras, más con oraciones muy cortas (techo teórico de 2 unidades/s). Se resuelve en la economía, con un tope finito o pago por tiempo/huella.
2. **Libros cortos y hito de terminar** (inferido del código, no medido).
   - Un niño puede agregar textos, y el nivel lo fija `nivelSugerido`. Un texto de una sola oración «difícil» queda en el nivel 2 y, al terminarlo, paga 1 + 5 (hito del 100 %) con un costo de plausibilidad de ~0,5 a 1 s.
   - La huella impide repetir el mismo texto, pero no generar textos distintos.
   - Mitigaciones propuestas, a decidir junto con la economía: costo mínimo de plausibilidad por libro terminado o por hito; límite de textos nuevos por día para el niño, o PIN del adulto para agregarlos; y aviso visible al adulto de los textos propios.
3. **No hay prueba de lectura real** (§2). Un script lento cobra como un lector.
4. **Monedas que se pierden en casos borde:**
   - libro quitado con pedidos aún en la cola (se descartan);
   - cola en `localStorage` que se pierde al borrar datos o reinstalar sin conexión;
   - cola de más de 1 000 pedidos (se descartan los más viejos).
5. **La cola se comparte entre cuentas en el mismo dispositivo.**
   - Si otra cuenta inicia sesión, los pedidos del niño anterior dan 403 y se descartan.
   - Mientras no hay sesión, se reintentan cada 5 min como máximo (401).
6. **Saldo mostrado en la tienda.** Si una compra ocurre con pedidos todavía en espera por un 429, el saldo mostrado los incluye, pero el servidor aún no. La compra puede fallar con «no alcanza» hasta que se paguen.

## 9. Nota sobre preferencias del usuario recibidas durante la tarea

El coordinador reenvió las preferencias del usuario sobre la economía. Pertenecen a la línea de economía, no a esta rama. Coinciden con este diseño en lo siguiente:

- Sin topes diarios silenciosos y sin castigar a los lentos: aquí no hay ninguno, y la plausibilidad es generosa.
- El tiempo inactivo nunca paga: el reloj solo acota, no premia.
- El reloj del servidor no demuestra lectura real: queda documentado en §2.

Si la economía v3 pasa a pagar por tiempo activo, el servidor **no debe creer el tiempo que manda la app**. Debe acotarlo con su reloj entre premios, extendiendo `revisarRitmo`. Hay que implementarlo en esta rama cuando se apruebe ese modelo.

## 10. Economía E2 detrás de la bandera `ECONOMIA` (experimental)

Parámetros: ECONOMIA-V3 §6.3, con las correcciones de §18.5 (revisión de la línea de economía sobre el WIP `da87153`). **No está aprobada para producción** y no se desplegó.

### 10.1 La bandera

| Valor de `ECONOMIA` (servidor) | Economía |
|---|---|
| sin definir, vacío, `actual` o `2.4.1` | **2.4.1, idéntica** (por defecto). |
| `e2` | Modelo E2 (`REGLAS_MONEDAS_E2`, versión `3.0.0-e2`). |
| `e2r` | E2R (§18.3 de ECONOMIA-V3): igual que E2, pero la relectura paga 1,5/min en **todos** los niveles. Recomendada por la línea de economía, **no aprobada**: apagada salvo que se pida. |
| cualquier otro | **El servidor no arranca** (`leerModeloEconomia` lanza un error): mejor eso que pagar con reglas que nadie eligió. |

- **Servidor:** `crearApp({ economia })` o la variable de entorno. Cada respuesta de `/premios` dice `economia` y cada fila del registro guarda `reglas` (versión).
- **Cliente con cuenta:** aprende la economía de la respuesta del servidor (`repos.premios.economia()`, guardada en `localStorage`). Con E2 manda además las relecturas por unidad (`releida`) y la «relectura con mejora» con sus tropiezos. **Siempre** manda `segundosActivos` (y `tropiezos` al terminar): un servidor 2.4.1 los ignora.
- **Cliente sin cuenta:** la bandera de compilación `VITE_ECONOMIA` (por defecto, 2.4.1; un valor desconocido también es 2.4.1).
- Vuelta atrás: quitar la bandera. El estado E2 (`fraccion`, etc.) queda guardado sin usarse.

### 10.2 Qué paga E2 (implementado)

| Componente | Implementación | Prueba |
|---|---|---|
| Unidad terminada | `2/min × min(segundos activos, 2 × lo esperado)`; la fracción se acumula por libro (`lecturas_premiadas.fraccion`). La frase «muy rápida» (`conPremio: false`) no paga tiempo. | `e2.test.ts`: «paga 2 por minuto…», «segundos inflados…» |
| Sin `segundosActivos` | **Cuenta solo el mínimo plausible** (0,1 s por palabra, 0,5 s por unidad), **no lo esperado** (§18.5: pagar lo esperado sin medirlo es el modelo D, hasta 45/min). Una APK 2.4.1 contra un servidor E2 gana casi nada por tiempo. | «cliente viejo 2.4.1…»; `premiosE2.test.ts` |
| Pausas | La app cuenta **como máximo 10 s de cada pausa** (`src/lectura/tiempoActivo.ts`, `MAX_PAUSA_ACTIVA_MS`); dejar la app abierta suma como mucho 10 s. El servidor no lo puede comprobar, pero el tope de 2× y el reloj lo acotan igual. | `tiempoActivo.test.ts` |
| **Reloj del servidor** | `revisarRelojE2`: los segundos **pagados** (no solo el mínimo para pasar el dedo) adelantan el reloj del niño. Lo acumulado vale como mucho 1 h (ráfaga al volver la conexión); después, al ritmo real. Un pedido normal que no cabe → **429** y se paga entero después. Un pedido único mayor que toda la ventana espera la ventana entera y paga solo 1 h. | «reloj del servidor…», «cola sin conexión antigua…», «un pedido gigante…»; `premiosE2.test.ts` |
| **Dificultad real** | En textos que no son de Ciempi, lo esperado usa el nivel más exigente entre el asignado y `nivelSugerido` (`server/src/premios.ts`, `nivelDeReferencia`). Los cuentos de Ciempi usan su nivel curado. | «dificultad real…» |
| **Premio por terminar** | `min(3, ⌊minutos esperados⌋)`, solo con ≥ 1 min esperado y ≥ 50 % de lo esperado pagado como activo. **Una sola vez por huella** (`libro_premiado` en `lecturas_premiadas`, clave `huella:` o `texto:`): borrar y volver a subir no lo repite. | «premio por terminar…» |
| Relectura por unidad (`releida`) | Unidad ya pagada: 1,5/min en N0–N1 y 1/min en N2–N4 (E2R: 1,5 en todos), cada vez, acotada por el reloj. | «relectura…», «E2R…» |
| **Relectura con mejora** | +2 si se relee entero con menos tropiezos que la **mejor** lectura completa; una por cuento y día; exige unidades releídas pagadas en las últimas 6 h por ≥ 50 % de lo esperado y un libro de ≥ 1 min esperado. **Tropiezos acotados al número de unidades** (antes se aceptaban 10 000: reserva sin fin de mejoras con una app manipulada). | «relectura…», «tropiezos inflados…» |
| Sin media tasa ni tope diario | No existen. Tres horas seguidas al ritmo real pagan lo mismo cada hora (±3). | «reloj del servidor…»; `premiosE2.test.ts` (8 h) |
| Tener la app abierta | No paga: solo pagan unidades terminadas, con tope de 2× lo esperado. | «segundos inflados…» |

**No implementado de E2 (pendiente):** hitos de sílabas y palabras nuevas (`nuevas`), premio por **nivel completo** (+15), avisos al adulto de minutos y monedas por día, y la pantalla de la app que muestra la moneda E2 en el momento (con E2 la app pide con `esperadas: 0` y la moneda aparece cuando responde el servidor).

### 10.3 Lo que el reloj del servidor **no** prueba

El reloj acota **cuánto tiempo se paga** (nunca más que el tiempo real, con una ráfaga de 1 h), pero **no demuestra que haya habido lectura**: no hay audio. Un script paciente que manda una unidad cada tanto, con segundos plausibles, cobra como un niño leyendo (~2/min). Tampoco puede saber si los tropiezos que informa la app son reales. Los controles (tope de 2×, reloj, huella, dificultad real, premio proporcional, tropiezos acotados) limitan el ritmo y el total; no detectan a un tramposo paciente.

### 10.4 Migración `server/sql/013_e2_y_cuncuna.sql`

No destructiva e **idempotente** (`if not exists`, `on conflict do nothing`, `create or replace`): una prueba la vuelve a correr tres veces sobre datos ya migrados sin cambiar saldos, progreso, premios ni compras.

- `lecturas_premiadas`: `fraccion`, `libro_premiado`, `activo_libro_segundos`, `mejor_tropiezos`, `segundos_actividad`.
- `perfiles_ninos.actividad_reloj` (reloj de la lectura activa, §11).
- `premios.tipo` admite `releida` (se reemplaza la restricción por una más amplia).
- Tabla `desbloqueos`, función `cuncuna_motivo` y desbloqueo retroactivo (§11).

## 11. Desbloqueo de la Cuncuna (servidor)

Id de especie: `especie:cuncuna` (de `src/ciempi/v2/especie.ts` en la rama de especies; no se tocó ningún archivo de arte). **No depende de la economía**: funciona igual con 2.4.1 y con E2, y no da monedas.

**Condición** (cualquiera; la regla vive en la función SQL `cuncuna_motivo`, que usan la migración y `server/src/desbloqueos.ts`):

1. `nivel0`: 6 de los 8 cuentos **originales** de nivel 0 terminados. Si un adulto quitó algunos: todos los que tenga, con un mínimo de 4.
2. `cuentos` (quien empieza en otro nivel): 6 cuentos de Ciempi distintos, de cualquier nivel.
3. `lector_lento`: **60 min de lectura activa en cuentos de N0 y además 30 frases distintas de N0** (progreso educativo, no solo tiempo; releer una frase durante horas no basta).
4. `regalo`: un adulto del niño, con un motivo (`POST /api/perfiles/:id/desbloqueos`).

- **«Terminado»** = lo **pagado por el servidor** (asignación o `lecturas_premiadas`, que sobrevive a quitar el libro) llega al total de frases. **No** `completada_en` ni `leido_hasta`, que los fija la app. Solo cuentan cuentos `origen = 'ciempi'`.
- **Lectura activa:** los segundos que manda la app, acotados a 2× lo esperado (o, sin ellos, el mínimo plausible) y acreditados con un reloj del servidor (`acreditarActividad`, ventana de 1 h): no se acredita más tiempo del que pasó.
- **Cuándo:** después de cada premio de un cuento de Ciempi, en la misma transacción, y al consultar `GET /api/perfiles/:id/desbloqueos`. La respuesta de `/premios` trae `desbloqueos: ['especie:cuncuna']` la vez que se gana.
- **Celebración:** la fila nace `por_celebrar`; la app la marca con `POST /api/perfiles/:id/desbloqueos/especie%3Acuncuna/celebrado`.
- **Retroactivo y conserva el progreso:** la migración 013 la da a quien ya cumple las condiciones 1 o 2 con lo pagado hasta hoy (`detalle.retroactivo`), y la agrega al inventario sin duplicar. La vía 3 empieza a contar desde la migración (antes no había segundos acreditados). Nota: lo «pagado» de antes de 2.5 sale de `leido_hasta` (migración 012), que en 2.4.x fijaba la app.
- **Pendiente:** la pantalla de la celebración especial y el uso de la especie en la app (ramas de especies e integración); el número de la vía 3 (45 o 60 min) según la telemetría (§18.2 de ECONOMIA-V3).

## 12. Pruebas de abuso con clientes modificados (`server/test/e2.test.ts`)

| Abuso | Resultado verificado |
|---|---|
| Segundos inflados (86 400, negativos, texto) | Paga como mucho 2× lo esperado; los inválidos se ignoran (cuentan como no medidos). |
| Sin `segundosActivos` | Solo el mínimo plausible. |
| Pedir todo junto sin dejar pasar el tiempo | 429 desde el primer pedido; nada pagado. |
| `operationId` repetido, 8 a la vez, y el mismo id con otro contenido | Paga una vez; todas las respuestas dicen lo mismo. |
| Compras simultáneas mientras llegan premios | Atómico; saldo ≥ 0; el registro cuadra con el saldo. |
| Cola sin conexión de 2 h enviada 3 días después | Se paga entera (1 h de golpe, el resto tras los 429); reenviarla no paga dos veces; una relectura de hace un mes no paga. |
| Pedido gigante (todo un libro de ~4 h) | Paga como mucho 1 h. |
| Progreso falso (más allá del libro, a mitad de unidad, `completada` desde la app, los 8 cuentos de N0 «completados») | No paga, no cambia `pagado_hasta` y no desbloquea la Cuncuna. |
| Niño que se ajusta monedas con un «motivo» | No suma (no es su adulto). |
| Tropiezos inflados para crear reservas de mejoras | Acotados al número de unidades: como mucho tantas mejoras como unidades. |
| Decir «lo releí entero» sin releer | `sin_relectura`, 0 monedas. |
| Cliente viejo 2.4.1 contra servidor E2 | Su progreso paga una vez (mínimo plausible), `POST /monedas` no suma, su relectura no da «mejora». |
| Texto difícil asignado en N0 | Lo esperado sale del nivel sugerido. |
| Borrar y volver a subir un texto terminado | Ni las unidades ni el premio de terminar se repiten. |

## 13. Limitaciones y pendientes

- **Inferido, no probado:** el flujo E2 en la interfaz real (no hay pruebas E2E ni capturas); un dispositivo Android; carga con muchos niños; la calibración de las referencias de ritmo (supuesto de ECONOMIA-V3).
- **Riesgo de fusión:** la rama del PIN (`expansion-v3-pin-textos`, migración 014) toca `server/src/app.ts` y `server/src/premios.ts`. Aquí los cambios quedaron en funciones separadas (`leerSolicitud`, bloque «Desbloqueos», `detalleE2`, `segundosReleidos`, `nivelDeReferencia`) y en archivos nuevos (`desbloqueos.ts`, `e2.test.ts`).
- **Pendiente antes de activar E2 en producción:** aprobación del usuario; sílabas/palabras nuevas y nivel completo; la moneda E2 al instante en la app; avisos al adulto; decidir E2R; revisar el impacto en los saldos de quienes tienen libros a medias (la fracción empieza en 0).
- El texto pendiente de autorización con PIN (rama del PIN) debería no pagar tampoco con E2: verificar al fusionar.
