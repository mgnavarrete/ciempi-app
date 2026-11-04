# Checkpoint: seguridad de monedas (pausa ordenada, 2026-11-03)

> **Actualización (2026-11-03, retomado):** completado. `App.tsx` adaptado, pruebas del cliente escritas, los cuatro comandos en verde (tsc cliente y servidor limpios; `vitest src` 229/229; servidor 36/36 ×3). Ver `SEGURIDAD-MONEDAS.md`. Lo que sigue es el registro histórico de la pausa.

Trabajo **incompleto** (en el momento de la pausa). El commit de pausa contiene código que **no compila del todo en el cliente**: falta adaptar `src/App.tsx`.

## Completado

- `src/lectura/monedas.ts`: la economía queda en una sola tabla reemplazable, `REGLAS_MONEDAS`, con los mismos valores de 2.4.1. Se mantienen los alias `MONEDAS_POR_UNIDAD`, `TOPE_POR_LIBRO`, `HITOS` y `MINIMO_A_BUEN_RITMO`. Se agregó `RITMO_PLAUSIBLE` (seguridad, no economía): 0,1 s por palabra, 0,5 s mínimo por unidad, 1 h de margen acumulable y 5 s de tolerancia.
- `src/lectura/premios.ts` (nuevo y puro, lo usan el servidor y el modo local):
  - `calcularPremio` paga solo la última unidad del avance más los hitos nuevos.
  - La relectura exige el libro terminado (`pagadoHasta >= total`), una fecha válida entre hoy −3 y hoy +1, y un día posterior a la última relectura pagada.
  - También incluye `revisarRitmo` (reloj por niño), `combinarEstados` y `normalizarParaHuella`.
- `server/sql/012_registro_de_premios.sql` (no destructiva):
  - Tablas `premios` (ledger, con `unique(perfil_id, operation_id)`) y `lecturas_premiadas` (por cuento o por huella del texto).
  - Columnas nuevas: `textos.huella`, `asignaciones.pagado_hasta` (rellenada con `leido_hasta`) y `perfiles_ninos.premios_reloj`.
  - Una fila `saldo_inicial` por niño.
- `server/src/premios.ts` (nuevo): `otorgarPremio` (transacción con `FOR UPDATE` sobre el niño y la asignación; idempotente), `ajustarMonedas` (adulto con motivo; el saldo nunca baja de 0), `anotarLegado` y `recordarLecturas`.
- `server/src/app.ts`:
  - Endpoint nuevo `POST /api/asignaciones/:id/premios`; responde 429 con `reintentarEnSegundos` si se pide más rápido de lo que se puede leer.
  - `POST /monedas` legado: solo suma si lo pide un adulto con `motivo`; en cualquier otro caso devuelve el saldo y lo anota.
  - `PUT progreso`: ya no acepta `premioHasta` ni la relectura que manda la app. Si no llega `premiosPorRegistro: true` (APK antigua), deduce el premio del avance.
  - Borrar un texto o una asignación, o cambiar el contenido de un texto, deja recordado lo ya pagado.
  - `crearApp({ ahora })` permite mover la hora en las pruebas.
- `server/test/api.test.ts`:
  - Se ajustaron 4 pruebas antiguas al contrato nuevo.
  - Se agregó el bloque «registro de premios» con 11 pruebas: cantidad calculada por el servidor, `operationId` repetido y simultáneo, dos dispositivos, reinstalación, avance sin premio y relectura (niveles 1 y 3), plausibilidad (429 y reintento), borrar y volver a subir, APK antigua, compras simultáneas y premio junto con compra, saldo nunca negativo con el registro cuadrando, y extraño.
- Cliente:
  - `src/datos/repositorios.ts`: tipos nuevos `RepositorioPremios`, `PedidoPremio` y `ResolucionPremio`.
  - `src/datos/colaPremios.ts` (nuevo): cola persistente, FIFO, idempotente y con espera creciente entre reintentos.
  - `repositoriosApi.ts`:
    - Agrega `premios`, que clasifica los errores y, si el servidor es anterior a 2.5, vuelve al endpoint viejo.
    - Reintenta los envíos pendientes al volver la conexión o la app, antes de comprar y antes de cerrar sesión.
    - Agrega `premiosPorRegistro: true` en el progreso.
  - `repositoriosLocales.ts`: agrega `premios` usando el mismo cálculo.
  - `PantallaLectura.tsx` (bugs corregidos):
    - Relectura: se reconoce con `libroTerminado()`, que mira lo leído en todos los niveles.
    - Pantalla final: muestra la suma de lo ganado en toda la lectura (`crearCuentaDeLectura`) y se corrige con la respuesta del servidor.
    - Ahora usa `alPedirPremio` en vez de `alGanarMonedas`.

## Pruebas ejecutadas (resultado real)

- Línea base, antes del cambio: tsc limpio; `vitest src`: 186/186; servidor: 25/25.
- Servidor, después del cambio: **36/36 aprobadas**, contra la base `ciempi_test_economia`, que creé en el contenedor `ciempi-db-1`.
- `npx tsc --noEmit -p .` del cliente: **FALLA** en `src/App.tsx:195`, que todavía pasa `alGanarMonedas`.
- `cd server && npx tsc --noEmit`: limpio en la última corrida, antes de los cambios del cliente; hay que volver a correrlo.
- `vitest src`: no se volvió a correr después de los cambios del cliente.

## Falta (próximos pasos concretos)

1. `src/App.tsx`:
   - Reemplazar `alGanarMonedas` por `alPedirPremio={(p) => { /* +p.esperadas al instante en setPerfiles */ void repos.premios.reclamar(p) }}`.
   - Borrar `ganarMonedas`.
   - Suscribirse con `useEffect(() => repos.premios.alResolver(...))`:
     - si el resultado es `otorgado`, poner como saldo `r.monedas + repos.premios.pendientes(perfilId)`;
     - si es `descartado`, restar `esperadas`.
   - Llamar `repos.premios.reintentar()` cuando haya sesión.
   - En `recargarPerfiles`, sumar `pendientes`.
2. Revisar los usos que quedan de `premioHasta`/`premiado` en `PantallaLectura` (`BarraLibro` no cambia) y correr tsc.
3. Escribir las pruebas del cliente:
   - `src/datos/colaPremios.test.ts`: sin internet → pendiente persistido; nueva instancia → reintento con el mismo `operationId`; FIFO que se detiene al reintentar; descartar; espera de 429.
   - Pruebas de `premios.ts`.
   - Pruebas de `premios` en `repositoriosLocales.test.ts`: idempotencia y relectura.
   - Pruebas de `libroTerminado` y `crearCuentaDeLectura`.
   - Prueba de `repositoriosApi` con `fetch` simulado y vuelta al endpoint viejo.
4. Correr los 4 comandos que pide la tarea (`tsc` cliente, `tsc` servidor, `vitest run src`, `test:servidor`) y repetir el servidor 2 o 3 veces para descartar pruebas de concurrencia intermitentes.
5. Escribir `docs/expansion-ciempi/economia/SEGURIDAD-MONEDAS.md`: amenaza; qué verifica el servidor (texto, unidades, avance que solo sube, idempotencia, ritmo) y qué no (si el niño leyó de verdad: no hay audio); diseño; migración; compatibilidad con APK antiguas; despliegue servidor → web → APK con vuelta atrás (al volver a desplegar: `update asignaciones set pagado_hasta = greatest(pagado_hasta, leido_hasta)`); resultados.
6. Riesgo residual que debe ir en el informe: en el nivel 2 el tope por libro es infinito, así que con textos propios un script solo queda limitado por la velocidad de lectura (unas 4 500 monedas por hora como máximo). La solución es económica: un tope finito. También se pierden monedas en casos borde: libro quitado con pedidos en cola, o cola que se pierde al reinstalar.

Notas: el worktree tiene enlaces `node_modules` y `server/node_modules` al repositorio principal; están ignorados por git.
