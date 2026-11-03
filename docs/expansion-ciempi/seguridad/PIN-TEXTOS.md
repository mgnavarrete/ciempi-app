# PIN del adulto para los textos propios del niño

Rama `expansion-v3-pin-textos` (desde `dcab7d5`). Decisión aprobada por la
usuaria (CONTINUIDAD-SESION §7.1, «Textos del niño»): el niño sigue pudiendo
agregar sus textos; el adulto los autoriza con un PIN verificado en el
servidor; un texto pendiente no paga; al aprobarse empieza a pagar, sin pagar
dos veces; lo que ya existe queda autorizado.

## 1. Antes (estado en `dcab7d5`, revisado antes de cambiar nada)

### 1.1 Cómo agrega un texto el niño

| Paso | Archivo:línea (`dcab7d5`) | Qué pasa |
|---|---|---|
| Botón «Agregar libro» en «Mis libros» | `src/biblioteca/PantallaBiblioteca.tsx:108` | Visible para el niño (y para el adulto en la sesión del alumno). |
| Vista `agregarLibro` | `src/App.tsx:252-255` → `src/biblioteca/PantallaAgregarLibro.tsx` | Reutiliza `AgregarLibro` del panel de adultos. |
| PDF o «Escribir o pegar» | `src/adultos/AgregarLibro.tsx` | Sin ninguna pregunta al adulto. |
| Guardar texto y asignarlo | `src/adultos/cargas.tsx:62-65` | `repos.textos.guardar` → `PUT /api/textos/:id`; `repos.asignaciones.asignar` → `POST /api/perfiles/:id/asignaciones`. |
| Servidor: texto | `server/src/app.ts:518` | Cualquier usuario con sesión (niño incluido) sube texto propio. |
| Servidor: asignación | `server/src/app.ts:578-586` | El niño puede agregarse cualquier texto que pueda ver. Lo único que distingue al adulto es el **nivel** (el niño queda en el sugerido). |
| Lectura y premio | `server/src/app.ts:670` (`POST /api/asignaciones/:id/premios`) → `server/src/premios.ts:140` (`otorgarPremio`) | El texto del niño **paga monedas igual que un cuento** desde el primer momento (con las reglas y el reloj del servidor, sin otra condición). Con una app anterior, `PUT /api/asignaciones/:id/progreso` (`app.ts:616`) también paga por su avance. |

### 1.2 Qué «PIN» existía y qué protegía

- `src/dominio/tipos.ts:107-108`: `PerfilNino.pinHash`, comentado como «Hash del
  PIN opcional. Es solo para elegir perfil, no es seguridad».
- `server/src/app.ts:81`: el servidor siempre lo entrega como `pinHash: null`.
- `src/datos/localStorage/repositoriosLocales.ts:376`: el modo local también lo
  crea en `null`.
- No hay columna de PIN en ninguna migración (`server/sql/001`–`012`), ni ruta
  que lo cree o lo verifique, ni pantalla que lo pida.

**Conclusión: hoy el PIN no protege nada**, ni en el cliente ni en el servidor.
Un niño (o un cliente modificado con el token del niño) puede escribir un texto
cualquiera, agregarlo y cobrar por él. El único freno es económico y general
(reloj del servidor `revisarRitmo`, huella para no cobrar dos veces el mismo
contenido), no una autorización del adulto. Lo que sí está protegido en el
servidor por la sesión del adulto (`conAdulto`/`exigirAdminDe`): cambiar el
nivel, cambiar la clave del niño, invitaciones, ajustes manuales de monedas
con motivo.

### 1.3 Checkpoint WIP `f1c9401` (otro agente, sin compilar ni probar)

Revisado con `git diff dcab7d5 f1c9401`. Compilaba y 46 de 47 pruebas del
servidor pasaban. Se conservó: la migración (ajustada), `revisarPin` con fila
bloqueada `FOR UPDATE`, `sinAutorizar` en `otorgarPremio`, volver a pendiente
si el niño cambia el contenido. Se corrigió o completó:

- Las rutas estaban en `app.ts` (~90 líneas, choque seguro con la rama de
  seguridad/E2): se movieron a `server/src/rutasPin.ts`.
- Intentos contados solo por niño: un niño que probaba PINs bloqueaba también
  al adulto en su propio panel (hasta 1 h). Ahora es por (niño, quien prueba).
- No había forma de **rechazar** ni de desbloquear.
- Aprobar algo ya aprobado respondía sin pedir el PIN (inofensivo, pero
  incoherente): ahora siempre se pide.
- Espera máxima de 1 h por intento → 24 h (≈ 40 intentos al mes en vez de
  ≈ 30 al día); los fallos se olvidan tras 7 días sin fallar.
- Una prueba fallaba (pedía el avance de una frase en un cuento de nivel 2).
- No había cliente.

## 2. Después

### 2.1 Servidor

| Archivo | Qué |
|---|---|
| `server/sql/014_pin_textos_propios.sql` | `cuentas.pin_hash`, `pin_cambiado_en`; `asignaciones.autorizacion` (`pendiente`/`autorizada`/`rechazada`, por defecto `autorizada`), `autorizada_por`, `autorizada_en`; tabla `intentos_pin (perfil_id, usuario_id)`. |
| `server/src/autorizacion.ts` | Lógica: `pinDebil`, `cifrarPin` (scrypt N=2^15, sal aleatoria de 16 bytes, mismo formato que las contraseñas), `revisarPin`, `columnasAlAgregar`, `pendienteSiCambiaContenido`, `sinAutorizar`. |
| `server/src/rutasPin.ts` | Rutas (abajo). |
| `server/src/app.ts` | Solo: registrar las rutas, 2 campos en `aAsignacion`, 1 llamada en `PUT /api/textos/:id`, columnas de autorización en `POST /api/perfiles/:id/asignaciones`. |
| `server/src/premios.ts` | 1 línea: si la asignación está pendiente o rechazada, `sinAutorizar` (0 monedas). |

Rutas:

| Ruta | Quién | Qué |
|---|---|---|
| `GET /api/mi-pin` | adulto | `{ tienePin, cambiadoEn }` |
| `PUT /api/mi-pin { pin, clave }` | adulto | Crear o cambiar. Pide la **contraseña** de la cuenta (con límite de intentos en memoria). 4–8 dígitos; rechaza 1111, 1234, 4321… Cambiarlo borra los intentos fallidos de sus niños (desbloqueo). |
| `GET /api/autorizaciones` | adulto o niño | Pendientes de sus niños / del propio niño, con 3 frases de muestra y `hayPin`. |
| `POST /api/asignaciones/:id/autorizar { pin, nivel? }` | quien puede ver al niño | Aprueba. `leido_hasta = pagado_hasta`: lo leído mientras estaba pendiente se vuelve a leer y ahí paga. |
| `POST /api/asignaciones/:id/rechazar { pin }` | ídem | Rechaza: se sigue pudiendo leer, no paga, no aparece en pendientes; se puede aprobar después. |

Errores: 409 `{ sinPin: true }` si ningún adulto del niño tiene PIN (no cuenta
como intento); 403 `{ intentosRestantes }` PIN incorrecto; 429 +
`Retry-After` `{ reintentarEnSegundos }` en espera (bloqueado, ni el PIN
correcto se revisa); 403 si no es su niño; 401 sin sesión.

Reglas de cuándo queda pendiente (lo decide el servidor, la app no opina):
agregado por un adulto del niño → autorizado; cuento de Ciempi o texto subido
por un adulto del niño → autorizado; todo lo demás que agrega el niño →
pendiente. Si el niño cambia el contenido (huella) de un texto autorizado, sus
asignaciones vuelven a pendiente; cambiar solo el título, no.

Límite de intentos: 5 libres; luego 1 min, 2, 4, … hasta 24 h por intento. Por
(niño, quien prueba), en la base (sobrevive a reinicios y a varios procesos),
con la fila bloqueada: 20 intentos en paralelo → solo 5 se revisan.

### 2.2 Cliente (reutiliza pantallas y estilos existentes)

| Archivo | Qué |
|---|---|
| `src/dominio/tipos.ts` | `Asignacion.autorizacion`, `autorizadaEn`; `sinAutorizar()`. |
| `src/datos/repositorios.ts`, `src/datos/api/repositoriosApi.ts` | `repos.autorizaciones` (opcional: el modo local no lo tiene y todo está autorizado). |
| `src/biblioteca/PantallaBiblioteca.tsx` | Etiqueta «⏳ Pendiente de aprobación» / «Sin monedas» y enlace «Aprobar con PIN (adulto)». |
| `src/adultos/DialogoPin.tsx` | Diálogo con el estilo de `DialogoNivel`: muestra del texto, PIN, «Aprobar» / «No aprobar». |
| `src/adultos/AprobarTextos.tsx` | Panel de adultos: «Textos por aprobar» (pestaña Alumnos) y «PIN de adulto» (pestaña Cuenta). |
| `src/adultos/PantallaAdultos.tsx` | Solo los monta. |
| `src/lectura/PantallaLectura.tsx` | Pendiente/rechazado: se lee y guarda avance, pero no muestra ni pide monedas; aviso arriba. |
| `src/App.tsx` | El avance guardado en la sesión de un libro pendiente no cuenta como leído-pagado; al aprobarse se olvida. |

Capturas a 390 px (Playwright, Chromium headless): `seguridad/pin/01…11-*.png`.
Recorrido: el niño ve su texto pendiente (01), lo lee con aviso y 0 monedas
(02), abre el diálogo (03), sin PIN creado recibe el aviso (04); el adulto ve
«Textos por aprobar» con aviso de crear PIN (05), lo crea con su contraseña
(06, 07), aprueba uno desde el panel (08, 09); en el teléfono del niño un PIN
incorrecto avisa los intentos que quedan (10) y el correcto lo aprueba (11).
Scripts: `seguridad/pin/sembrar.mjs`, `seguridad/pin/capturas.mjs`.
Nota: en esas capturas la fuente Andika no cargó (Vite del worktree niega
`/@fs` al `node_modules` enlazado del repo principal, 403); se ve la fuente
de respaldo. No afecta la web compilada.

## 3. Modelo de amenazas

| Actor / ataque | Defensa | Prueba |
|---|---|---|
| Niño (o app modificada con su token) agrega un texto y pide premios | Pendiente decidido en el servidor; `otorgarPremio` paga 0 (`sin_autorizar`) por `POST /premios`, relectura, `PUT progreso` de APK antigua y `POST /monedas` | «pendiente: lo puede leer… no paga» |
| Manda `autorizacion: 'autorizada'` o `nivel` al agregar | Ignorados | «el niño agrega su texto sin PIN…» |
| Llama a `/autorizar` sin PIN, con basura (`{ $ne: '' }`) o PIN incorrecto | 403, cuenta intento | «sin el PIN, o con uno equivocado» |
| Fuerza bruta secuencial | 5 libres, luego espera exponencial hasta 24 h; bloqueado no revisa ni el correcto; en la base | «fuerza bruta: a los 5 fallos…», «la espera crece hasta 24 horas» |
| Fuerza bruta en paralelo | `FOR UPDATE` en la fila de intentos | «fuerza bruta en paralelo» |
| Reiniciar el servidor para limpiar intentos | Intentos en PostgreSQL | idem (segunda app) |
| Aprobar un texto de otra familia (con PIN propio correcto, con sesión de su niño o sin sesión) | `exigirVerNino` + PIN solo de adultos de ese niño | «aprobar un texto de otra familia» |
| Aprobar un texto corto y reemplazar su contenido | Vuelve a pendiente | «si el niño cambia el contenido…» |
| Doble pago al aprobar (dos aprobaciones a la vez, mismo `operationId` dos veces, otro `operationId`, borrar y re-subir el mismo contenido) | `update … where autorizacion <> 'autorizada'`; registro con `operationId` único; `pagado_hasta` + `lecturas_premiadas` por huella | «doble pago al aprobar», «autorizado en el dispositivo del niño» |
| Cobrar después lo leído estando pendiente | Al aprobar `leido_hasta = pagado_hasta`; los `operationId` de antes quedan registrados con 0 | ídem, «cola sin conexión» |
| Niño con el teléfono del adulto abierto cambia el PIN | Cambiar el PIN pide la contraseña | «crear el PIN pide la contraseña» |
| Niño bloqueándole el panel al adulto | Intentos por (niño, quien prueba); cambiar el PIN desbloquea | «un niño bloqueado… no bloquea al adulto» |
| Robo de la base | Solo hash scrypt con sal; el PIN no aparece en `premios` ni logs | «se guarda con scrypt», «el PIN no queda en el registro» |

## 4. Limitaciones (honestas)

- Un PIN de 4 dígitos sigue siendo corto: con las esperas, ≈ 40 intentos al
  mes por niño (≈ 0,4 % de acertar uno de 10 000). Se recomienda 6 dígitos;
  no se exige.
- Una familia con varios niños da a cada niño su propio cupo de intentos
  contra el mismo PIN (cupo × niños).
- Si el niño **mira** cuando el adulto escribe el PIN en su teléfono, lo
  sabe: el PIN no protege contra eso. El adulto puede cambiarlo (con su
  contraseña) y aprobar desde su panel.
- El adulto no ve aún un aviso de «intentos fallidos» en su panel.
- Aprobar desde el panel del adulto también pide PIN (decisión: «el adulto lo
  aprueba con su PIN»); el adulto ya autenticado no tiene atajo.
- Lo leído mientras estaba pendiente hay que volver a leerlo para cobrar (no
  se paga de golpe al aprobar). Si en otro dispositivo quedó abierta la
  lectura durante la aprobación, su avance puede volver a subir `leido_hasta`
  y ese tramo quedaría sin pagar (nunca pagado dos veces).
- APK antiguas: no muestran «pendiente» ni el diálogo; ven sus monedas
  optimistas corregidas por el servidor (0) al sincronizar. No pueden aprobar.
- Modo sin conexión (localStorage, sin servidor): no hay PIN; todo autorizado.
- No se probó en Android real, Firefox ni Safari; capturas solo en Chromium.
- El límite de intentos de la **contraseña** al crear el PIN es en memoria
  (como el login existente): se reinicia con el proceso.

## 5. Cómo probarlo

```bash
cd .claude/worktrees/pin-textos
npx tsc --noEmit -p .
(cd server && npx tsc --noEmit)
npx vitest run src
# base de prueba (nombre con _test), contenedor ciempi-db-1:
docker exec ciempi-db-1 psql -U ciempi -d postgres -c "create database ciempi_test_pin"
DATABASE_URL=postgres://ciempi:ciempi@localhost:5434/ciempi_test_pin npx vitest run server/test
```

Capturas (servidor y Vite en puertos propios; base `ciempi_test_pin_capturas`):

```bash
(cd server && DATABASE_URL=postgres://ciempi:ciempi@localhost:5434/ciempi_test_pin_capturas PORT=3297 node src/index.ts) &
VITE_API_URL=http://127.0.0.1:3297 npx vite --port 5197 --strictPort &
node docs/expansion-ciempi/seguridad/pin/sembrar.mjs > /tmp/x/sembrado.txt
NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules node docs/expansion-ciempi/seguridad/pin/capturas.mjs /tmp/x docs/expansion-ciempi/seguridad/pin
```

## 6. Resultados (3-nov-2026, commit final de esta rama)

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit -p .` | sin errores (exit 0) |
| `(cd server && npx tsc --noEmit)` | sin errores (exit 0) |
| `npx vitest run src` | 23 archivos, **231/231** |
| `DATABASE_URL=…/ciempi_test_pin npx vitest run server/test` | 1 archivo, **55/55** (18 del PIN + migración 014 sobre datos previos) |
