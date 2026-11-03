# Seguridad de monedas: registro de premios en el servidor (CIEMPI 2.5, propuesta)

Estado: **implementado y probado en la rama `worktree-agent-a5e1c8d72e4a5aeb0`**. No se fusionó a `main` y no se desplegó. Esta tarea **no cambia la economía**: precios, monedas por unidad, topes, hitos y relecturas son los mismos de 2.4.1. Una prueba lo verifica (`src/lectura/premios.test.ts`, «son las de 2.4.1»).

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
