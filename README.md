# Ciempi 🐛

App de lectura asistida para niños con dificultades lectoras (TDAH,
dislexia, autismo, bajo nivel cognitivo). **La app es del niño:** entra con
su usuario y clave en su teléfono, ve sus libros y elige cuál leer. Desliza el
dedo bajo la frase y la app la lee **a coro** a su ritmo: cuando el dedo
llega a una palabra, se ilumina entera (con sus sílabas en colores) y suena.
Ciempi, el ciempiés, se come una manzana por palabra y crece.

- **Niño:** usuario y clave (sin correo). Ve "Mis libros" con su avance,
  sube PDF (por ejemplo la guía del colegio), borra lo que él subió y cambia
  sus ajustes de lectura.
- **Adulto admin** (terapeuta o apoderado): correo y clave. Crea la cuenta del
  niño, le agrega libros, ve su avance y le cambia la clave si la olvida.
  Un niño puede tener varios admins (se suman con un código de invitación).
- Funciona en celular vertical u horizontal y en el computador (con mouse).

**Stack:** React 19 + Vite + TypeScript + Tailwind CSS 4 + Vitest + pdf.js.
Servidor propio en `server/`: Node + Fastify + PostgreSQL. Sin servidor
configurado, la app funciona sin conexión con `localStorage`.

**Publicada en:** https://ciempi.minttu.cl. Cómo instalarla en el servidor
(nginx, systemd, HTTPS): [`docs/despliegue.md`](docs/despliegue.md).

---

## Levantar en local

Requisitos: Node 20 o superior.

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # tests unitarios (silabeo, frases, motor, datos, voz)
npm run build        # build de producción en dist/
```

### Abrirla desde el celular (misma red Wi‑Fi)

```bash
npm run dev:red      # = vite --host
```

Vite muestra una o más direcciones `Network: http://…:5173`.

**En Mac o Linux nativo:** abre esa dirección en el celular y listo.

**En Windows con WSL2 (este equipo):** WSL está detrás de una red interna
(`172.28.x.x`) que el celular no ve. Hay dos formas de resolverlo:

**Opción A: networking "mirrored" (Windows 11 22H2 o superior, recomendada).**
WSL comparte la IP de Windows y no hay que hacer nada más cada vez.

1. Crea o edita `C:\Users\<tu-usuario>\.wslconfig`:
   ```ini
   [wsl2]
   networkingMode=mirrored
   ```
2. En PowerShell **como administrador**:
   ```powershell
   wsl --shutdown
   # Permitir conexiones entrantes a WSL en el puerto 5173
   New-NetFirewallHyperVRule -Name Ciempi5173 -DisplayName "Ciempi Vite" -Direction Inbound `
     -VMCreatorId '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}' -Protocol TCP -LocalPorts 5173
   New-NetFirewallRule -DisplayName "Ciempi Vite" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
   ```
3. Abre WSL de nuevo y ejecuta `npm run dev:red`.

**Opción B: redirigir el puerto (portproxy).**

1. En WSL, anota la IP: `hostname -I | cut -d' ' -f1` (por ejemplo `172.28.250.116`).
2. En PowerShell **como administrador**:
   ```powershell
   netsh interface portproxy add v4tov4 listenport=5173 listenaddress=0.0.0.0 connectport=5173 connectaddress=172.28.250.116
   New-NetFirewallRule -DisplayName "Ciempi Vite" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
   ```
   La IP de WSL cambia al reiniciar. Si deja de funcionar, borra la regla con
   `netsh interface portproxy delete v4tov4 listenport=5173 listenaddress=0.0.0.0`
   y créala con la IP nueva.

**En ambos casos**, en el celular abre `http://<IP de Windows>:5173`. La IP
aparece con `ipconfig` en PowerShell, en "Adaptador de LAN inalámbrica Wi‑Fi →
Dirección IPv4" (por ejemplo `192.168.1.34`).

Si no carga:
- La red Wi‑Fi de Windows debe estar como **Privada**, no Pública.
- Algunas redes de invitados o routers aíslan a los clientes entre sí.
- El primer toque en la pista "desbloquea" el audio. Si no suena, revisa
  que el celular no esté en silencio y que tenga una voz en español instalada
  (Android: Ajustes → Texto a voz; iPhone: Accesibilidad → Contenido leído → Voces).

---

## App Android (APK)

La app Android es la misma web empaquetada con **Capacitor**, bloqueada en
**horizontal** y con la voz nativa del teléfono (en el WebView de Android la
voz del navegador no existe; se usa `@capacitor-community/text-to-speech`).

Requisitos (una vez): JDK 21 y Android SDK con `platforms;android-36` y
`build-tools;36.0.0`. En este equipo quedaron en `~/jdk` y `~/android-sdk`.

```bash
npm run apk                                  # → release/CIEMPI-<versión>.apk
npm version patch --no-git-tag-version       # antes de una APK nueva: 0.1.0 → 0.1.1
```

La versión sale de `package.json` y es la misma que muestra Android en la
información de la app (`versionCode` = 0.1.1 → 101, debe subir para que se
instale encima). Usa `minor` en vez de `patch` para cambios grandes (0.2.0).
La carpeta `release/` no va en git.

Para instalarla, pasa la APK al teléfono (cable, Drive, WhatsApp…) y
ábrela; Android pedirá permitir "instalar apps de origen desconocido".

- **Pantalla completa:** sin barra de estado ni de navegación (aparecen un
  momento deslizando desde el borde). La app deja espacio para la cámara.
- **Gesto "atrás":** hace lo mismo que el botón Volver de la pantalla; en la
  biblioteca deja la app en segundo plano y mientras se lee no hace nada.
  Además, Android no toma el gesto sobre la pista de lectura. Es código nativo
  propio: `android/app/src/main/java/cl/ciempi/app/TelefonoPlugin.java`
  (desde la web se usa con `src/plataforma/telefono.ts`).
- **Voz:** usa el motor de voz del teléfono. Si no tiene español, la app
  muestra un aviso con el botón **Instalar voz**, que abre la descarga en
  "Servicios de voz de Google" (gratis y funciona sin internet).
- La APK usa `.env.apk`: se conecta a `https://ciempi.minttu.cl`. Si cambia
  el dominio, cámbialo ahí y vuelve a correr `npm run apk`.
- Íconos y pantalla de inicio se generan desde `assets/` con
  `npx capacitor-assets generate --android`.
- **Firma:** desde la 1.0.0 las APK son de release, firmadas con la llave
  propia de `android/firma/` (se crea una vez con `bash scripts/crear-firma.sh`;
  no va a git). **Respáldala** (`ciempi.jks` y `firma.properties`): sin ella
  no se puede instalar una versión nueva encima de la anterior. La misma
  llave sirve para la Play Store.
- Al pasar de una APK 0.x (firmada con la llave de depuración) a la 1.0.0,
  Android no la instala encima: hay que desinstalar CIEMPI primero. Los
  libros, el avance y las monedas están en el servidor y no se pierden.

## Niveles de lectura

El nivel es **del libro asignado a cada niño** (el mismo libro puede estar en
otro nivel para otro niño). Lo elige un adulto del niño; el niño no lo cambia.

| Nivel | Se lee de una vez | En pantalla | Voz si el niño no eligió |
|---|---|---|---|
| 0 Sílabas | frase corta (≤ 8 palabras) | una línea, «ma-má», una manzana por sílaba | dice cada sílaba al llegar: «La – u – va» (sin tilde: «piés» suelta la voz la deletrea) |
| 1 Palabra | frase corta (≤ 8 palabras) | una línea, una manzana por palabra | dice cada palabra al llegar |
| 2 Oración | la oración completa (≤ 12 palabras) | una línea, solo la manzana del final; el dedo va a la velocidad que quiera | lee la oración al ritmo del dedo, sin saltarse palabras (`src/lectura/vozAlDedo.ts`); al llegar al final espera a la voz 1,5 s como máximo |
| 3 Párrafo | párrafo o estrofa | una frase por línea, rojo y azul alternados; una manzana por frase, repartidas parejo; la frase se enciende entera | dice la frase entera al llegar a su manzana |
| 4 Libre | una página (100–160 palabras) | toda a la vista; una manzana por oración; las palabras se encienden al pasar el dedo | sin voz (el niño puede elegir «Leer conmigo») |

- Todas las unidades se arman con las frases de los niveles 0 y 1
  (`src/lenguaje/unidades.ts`), así el avance se guarda en frases y se puede
  cambiar de nivel sin perder el lugar.
- **Ritmo:** en los niveles 0 y 1, si el dedo va muy rápido Ciempi se tropieza
  («Más despacito 🐢»). Desde el 2 el dedo va libre: si una oración, párrafo o
  página se hizo más rápido de lo que se puede leer (más de 2 × el ritmo
  máximo en el 2, más del ritmo máximo en el 3 y el 4), sigue igual pero no
  suma para las monedas.
- La manzana va al centro de su palabra (o sílaba), salvo la primera, al
  comienzo, y la última, siempre al borde derecho: hay que llegar al final.

### Avance y monedas

Cada cuento se lee **siempre desde el comienzo** (si no, se pierde el hilo). Un
libro con capítulos parte desde el comienzo del capítulo donde iba.

| Nivel | Porcentaje al leer | Monedas (`src/lectura/monedas.ts`) |
|---|---|---|
| 0 | no | 5 al terminar |
| 1 | no | 10 al terminar |
| 2 | sí | 5 al 50 % y 10 al 100 % |
| 3 | sí | 5 al 25 %, 5 al 50 %, 5 al 75 % y 10 al 100 % |
| 4 | sí | 5 al 25 %, 10 al 50 %, 10 al 75 % y 15 al 100 % |

- Cada hito paga **una sola vez por libro** (`asignaciones.premio_hasta`). Lo
  que se guarda aparte del avance es hasta dónde lo leyó de verdad
  (`leido_hasta`): de corrido desde lo ya leído y con al menos el 80 % de las
  palabras a buen ritmo. Saltar adelante con el índice no da hitos.
- **Releer** un libro ya terminado da un quinto del premio de terminarlo
  (1 a 3 monedas), una vez al día por libro (`relectura_premiada_en`).
- En la biblioteca, los libros terminados llevan una ⭐, y arriba hay botones
  para ver **Todos** o **un nivel**.
- **Párrafos y versos:** al pegar un texto, una línea en blanco separa párrafos
  (en un poema: un verso por línea y una línea en blanco entre estrofas). En un
  PDF se detectan por la posición de las líneas (`cortesDePagina` en
  `src/lenguaje/libro.ts`). Los libros subidos antes arman sus párrafos por largo.
- **Nivel sugerido** (`src/lenguaje/dificultad.ts`): según palabras por oración,
  sílabas por palabra y largo. Al subir un texto queda en el sugerido, que
  aparece marcado al cambiar el nivel; si un niño agrega un libro, también.
- **Compartir:** en el panel del adulto, cada libro (también los que subieron
  sus niños) tiene un botón por niño para dárselo en un nivel, cambiarlo o
  quitarlo; en la biblioteca de un niño, «Cambiar nivel» y «Compartir con otro niño».
- **Voz:** el niño elige (botón de voz al leer, o Ajustes): «Leer conmigo»,
  «Escuchar primero» (eco) o «Sin voz». Tocar una palabra siempre la dice. En
  el nivel 4 no hay voz: se lee en silencio.

### Cuentos de Ciempi

La app trae 20 cuentos propios, cuatro por nivel (`src/contenido/cuentos.ts`),
cada uno con su portada (`public/portadas/`, generadas con `node scripts/portadas.mjs`):
cuentos con palabras de una o dos sílabas para el nivel 0, de una línea por oración para el nivel 1 y 2, dos poemas y dos
cuentos en párrafos para el 3 y cuatro cuentos largos para el 4. **Todo
lector nuevo los recibe en su biblioteca**, cada uno en su nivel. En el
servidor no tienen dueño: nadie los borra, pero un adulto puede cambiarles el
nivel o quitárselos a un niño (en el panel, «Cuentos de Ciempi»). Al arrancar,
el servidor los deja al día (`server/src/cuentos.ts`): si se corrige uno, se
corrige para todos; si se agrega uno nuevo, llega también a los niños que ya existían.

## Voz de Ciempi

La app lee con la **voz del teléfono o navegador** (Ajustes → Voz: «Automática»
elige la mejor en español, o se elige una a mano). Se puede **apagar la voz**
(botón 🔊 al leer, o Ajustes → «Leer con voz»), por niño, para leer sin que
Ciempi diga las palabras.

La voz generada en el servidor (Kokoro, Azure o xAI, descrita abajo) quedó
desactivada en la app; para volver a usarla, ver `src/datos/DatosProvider.tsx`.


Con cuenta en línea, la voz la genera el servidor, así suena igual en
cualquier teléfono y en la web:

- **Kokoro** en el propio servidor (gratis, sin internet ni cuentas):
  **Alex** para Ciempi niño y **Dora** para Ciempi niña, elegidas escuchando
  muestras de 15 voces. `server/voz/servidor_voz.py` (127.0.0.1:3201) genera el
  WAV de una palabra en ~120 ms y le quita el silencio del inicio.
- Opcional, de pago: si hay `AZURE_SPEECH_KEY` (Lorenzo y Paloma) o
  `XAI_API_KEY` (Leo y Ara), se usan antes que Kokoro (`server/src/voz.ts`).
- `GET /api/voz?texto=…&voz=nino|nina&velocidad=…` (con sesión) guarda cada
  palabra en la tabla `audios_voz`: se genera una sola vez.
- `src/audio/vozServidor.ts` la reproduce con Web Audio; la pantalla de
  lectura precarga las palabras de la frase actual y la siguiente.
- Si la voz del servidor no responde, la app usa la del teléfono.
- **Ajustes → Voz:** se puede elegir a mano la voz de Ciempi (niño o niña) o
  cualquier voz del teléfono. Se guarda en el dispositivo, y debajo se ve si la
  voz de Ciempi funciona o qué falla.

En local: `bash deploy/instalar-voz.sh` (necesita `espeak-ng` del sistema).

## Servidor (cuentas y sincronización)

Sin configurar nada, la app funciona **sin conexión** (un solo dispositivo,
sin login, con "¿Quién va a leer?"). Con el servidor aparecen las cuentas de
niño y de adulto, y todo se sincroniza entre dispositivos.

La app elige según `VITE_API_URL` (`src/datos/DatosProvider.tsx`):

| Archivo | Valor | Uso |
|---|---|---|
| `.env.local` | `/` | Desarrollo: Vite manda `/api` al servidor local (puerto 3200) |
| `.env.production` | `/` | Web publicada: nginx manda `/api` al servidor |
| `.env.apk` | `https://ciempi.minttu.cl` | APK |
| (sin variable) | | Sin conexión, todo en `localStorage` |

### En local (para desarrollar)

Requisitos: Docker (para PostgreSQL) y Node 22.18 o superior (el servidor
corre TypeScript directo con Node, sin compilar).

```bash
npm run db:start             # PostgreSQL en Docker (puerto 5434)
npm run servidor:instalar    # una vez
cp server/.env.example server/.env
npm run servidor             # http://127.0.0.1:3200 (crea las tablas al arrancar)
cp .env.example .env.local   # VITE_API_URL=/
npm run dev                  # en otra terminal
npm run test:servidor        # tests de la API contra PostgreSQL (base ciempi_test)
```

Para los tests, crea una vez la base: `docker compose exec db psql -U ciempi -c "create database ciempi_test"`.
`npm run db:stop` apaga la base.

### Publicada

Ver [`docs/despliegue.md`](docs/despliegue.md).

### Contraseñas olvidadas

- **Adulto:** "Soy adulto" → **¿Olvidaste tu contraseña?** → llega un correo
  con un enlace (funciona aunque se abra en otro dispositivo) → crea una
  contraseña nueva. Con sesión iniciada también puede cambiarla en su panel
  → Cuenta.
- **Niño:** no tiene correo; un adulto le cambia la clave desde su panel.
- **Sin SMTP configurado** (en local, o en el servidor si no se configuró),
  el enlace no se envía: queda en el registro del servidor y se puede abrir a mano.

### Cómo se usa

1. El adulto entra en "Soy adulto" → crea su cuenta.
2. **+ Crear lector:** apodo, ícono, **usuario** y **clave** del niño.
3. **Agregar libro:** sube un PDF para ese niño (con revisión de páginas y frases).
4. En el teléfono del niño: "Soy lector" → usuario y clave → **Mis libros**.
5. El niño puede **Agregar libro** él mismo (flujo simple: elegir PDF,
   confirmar el nombre y listo).
6. El adulto ve el avance en su panel, abre los libros del niño en **vista
   previa** (no le mueve el marcador ni le da monedas) y puede **cambiar su
   clave**.
7. **Invitar a otro adulto:** genera un código de 6 letras (7 días, un uso)
   que el otro adulto ingresa en "Vincular con código".

---

## Qué hace la app

| Funcionalidad | Dónde |
|---|---|
| **Lectura con el dedo bajo las palabras**: la frase en una línea (la letra se ajusta para que quepa) y justo debajo el carril de Ciempi con una comida bajo cada palabra; el niño arrastra a Ciempi por debajo de lo que lee. Arriba se ven las frases ya leídas (no la que viene). Pensada para horizontal (en vertical sugiere girar el teléfono) | `src/lectura/PantallaLectura.tsx`, `FraseSilabeada.tsx` |
| Pista para el dedo (pointer events: touch, mouse y lápiz; sin scroll mientras se arrastra) | `src/lectura/PistaDeslizador.tsx` |
| Voz por palabra completa (Web Speech: es‑CL → es‑419/US/MX… → cualquier español) | `src/audio/voz.ts` |
| Ritmo en **palabras por segundo**: si va muy rápido, se pausa, Ciempi se tropieza, aparece "Más despacito 🐢" y la frase no da monedas | `src/lectura/motor.ts` |
| **Volver atrás y repetir**: botón «frase anterior» e índice (capítulos leídos ✓, el actual, los que faltan 🔒; repetir capítulo; empezar de nuevo). Las monedas nunca se pierden y lo ya leído no vuelve a dar monedas | `PantallaLectura.tsx` |
| Levantar el dedo conserva el avance; hay que retomar cerca de donde quedó | `src/lectura/motor.ts` |
| Ciempi: la cabeza va donde está el dedo; al llegar a la comida de una palabra, la palabra se enciende y suena, Ciempi se la come y le crece un segmento. La comida se elige en la tienda: manzanas, frutillas, plátanos, sandía, galletas, pelotas, donas, cupcakes, pizza o helados | `src/lectura/Ciempi.tsx` |
| **Lectura continua**: al terminar una frase pasa a la siguiente sin pausa (sube suave como karaoke); la frase anterior y la siguiente se ven chicas y tenues como contexto | `src/lectura/PantallaLectura.tsx` |
| **Mi Ciempi**: Ciempi animado arriba de «Mis libros» (ondula, pestañea, y cada tanto salta, saluda con una patita o baila; si lo tocas, te saluda por tu nombre) y armario/tienda para personalizarlo con monedas: colores, **forma del cuerpo**, **ojos**, gorros, cara, zapatos, diseños y fondos (75 cosas); nombre y si es niño o niña; probar antes de comprar. Todo el catálogo es para todos | `src/ciempi/` |
| **Voz de Ciempi** según su género: de hombre si es niño, de mujer si es niña (se reconoce la voz por su nombre; si el teléfono no tiene una, se ajusta el tono) | `src/audio/voz.ts` |
| Barra de avance del cuento con los hitos que dan monedas (niveles 2 a 4) | `PantallaLectura.tsx`, `src/lectura/monedas.ts` |
| Monedas por hitos de avance, una vez por libro; releer da un premio menor una vez al día (ver «Avance y monedas») | `src/lectura/monedas.ts` + repositorio de asignaciones |
| Registro de sesiones: duración activa, frases, frases "muy rápido", sílabas, monedas | `PantallaLectura.tsx` + repositorio de sesiones |
| Separador de sílabas por reglas (diptongos, hiatos con tilde, grupos inseparables, ch/ll/rr, h intermedia, qu/gu, y vocálica) | `src/lenguaje/silabas.ts` |
| Pegar texto, dividirlo en frases de ≤6 palabras (cortes naturales: comas, incisos de diálogo, sin dejar "y", "me", "porque"… al final) | `src/textos/PantallaNuevoTexto.tsx`, `src/lenguaje/frases.ts` |
| Ajustes por niño: tamaño de letra, modo tranquilo, velocidad de voz, umbral de ritmo, y últimas sesiones | `src/ajustes/PantallaAjustes.tsx` |
| Diseño adaptable: celular vertical, horizontal (variante `apaisado:`) y computador | `src/index.css`, `App.tsx` |
| **Acceso** «Soy lector» (usuario + clave) / «Soy adulto» (correo + clave, registro) | `src/inicio/PantallaAcceso.tsx` |
| **El niño agrega libros** (PDF, flujo simple) y borra los que subió | `src/biblioteca/PantallaAgregarLibro.tsx`, `PantallaBiblioteca.tsx` |
| Sin conexión: «¿Quién va a leer?» con perfiles de apodo e ícono | `src/inicio/PantallaPerfiles.tsx` |
| **Presentación de Ciempi** la primera vez que entra el niño: elige si es niño o niña, su nombre, colores y gorro (gratis), y Ciempi explica (en voz alta) cómo se lee y para qué son las monedas | `src/ciempi/Presentacion.tsx` |
| Ajustes ordenados por secciones; **Salir** está al final de Ajustes (no a mano en la biblioteca) | `src/ajustes/PantallaAjustes.tsx` |
| Recuperar contraseña (adultos) y cambiarla desde el panel | `src/inicio/CambiarClave.tsx`, `PantallaAcceso.tsx` |
| **Biblioteca** del niño con portada, capítulo actual, % de avance y botón Continuar | `src/biblioteca/` |
| **Libros en PDF**: extracción con pdf.js en el navegador, limpieza, capítulos, rango de páginas y revisión del silabeo antes de guardar | `src/fuentes/pdf.ts`, `src/lenguaje/libro.ts`, `src/textos/PantallaNuevoTexto.tsx` |
| Progreso guardado después de cada frase; premio al terminar capítulo (+2) y libro (+3) | `PantallaLectura.tsx` |
| **Leer con el niño** desde la cuenta del adulto (terapeuta o apoderado): en la biblioteca del niño, «Leer con Tomi» guarda el avance, las monedas y la sesión en la cuenta del niño, sin cerrar sesión; «Solo mirar» es la vista previa | `src/biblioteca/PantallaBiblioteca.tsx`, `PantallaLectura.tsx` |
| **Panel del adulto**: crear lectores con usuario y clave, ver sus libros (vista previa), agregarles libros, avance y resumen de 7 días (minutos, frases, 🐢, sílabas/s), cambiar clave, invitar a otro adulto | `src/adultos/PantallaAdultos.tsx` |
| Datos en el servidor (o sin conexión en `localStorage`) | `src/datos/` |
| **Servidor**: login, cuentas de niño, permisos, libros, progreso y tienda en PostgreSQL, con tests de permisos | `server/` |

### Cómo probar cada parte

1. **Silabeo, frases y libros:** `npm test`.
2. **Entrar:** elige al niño en "¿Quién va a leer?" (o crea uno con apodo e ícono).
3. **Biblioteca:** cada libro muestra portada, capítulo actual y avance.
   Toca "Empezar" o "Continuar".
4. **Lectura:** pon el dedo en el círculo amarillo y desliza despacio. Al
   tocar el inicio de una palabra ("des…") se ilumina y suena entera
   ("despacio"). La frase termina al comer la última manzana.
5. **Progreso:** lee una frase, vuelve atrás o recarga la página y entra de
   nuevo al libro: retoma en la frase siguiente. Al terminar un capítulo
   aparece "¡Terminaste un capítulo!" con la opción de descansar.
6. **Subir un libro:** Zona de adultos (ícono de personas) → Subir PDF.
   Revisa título, autor, rango de páginas (deja fuera biografías o índices)
   y abre un capítulo para ver cómo quedan las frases y sílabas.
7. **Ritmo:** desliza de un zarpazo. Aparece "Más despacito 🐢", Ciempi se
   tropieza y la frase termina sin moneda. El umbral se cambia en Ajustes.
8. **Formatos:** gira el celular, o ábrela en el computador y arrastra con el
   mouse.
9. **Modo tranquilo:** en Ajustes. Sin confeti, rebotes ni efectos de sonido;
   la voz se mantiene. También se respeta `prefers-reduced-motion`.

---

## Arquitectura

```
src/
├─ dominio/        Tipos (Cuenta, PerfilNino, MiembroNino, InvitacionNino,
│                  Texto + Capitulo, Asignacion, SesionLectura, tienda) e ids
├─ datos/
│  ├─ repositorios.ts        Interfaces asíncronas: la UI solo conoce esto
│  ├─ localStorage/          Sin conexión (con migraciones de datos guardados)
│  ├─ api/                   Con login y sincronización (habla con server/)
│  ├─ DatosProvider.tsx      Elige la implementación según .env.local
│  └─ inicio.ts              Niño y cuento de ejemplo para la primera vez
├─ lenguaje/       Silabeo, frases y procesamiento de libros (puro, con tests)
├─ fuentes/        Entradas de texto: pegar y PDF (pdf.js, carga diferida)
├─ lectura/
│  ├─ motor.ts     Lógica pura dedo → palabras, voz, ritmo (con tests)
│  ├─ modos.ts     Banderas de cada modo: coro (listo), eco, solo
│  └─ *.tsx        Pantalla, frase, pista, Ciempi, celebración
├─ inicio/         Acceso (Soy lector / Soy adulto) y "¿Quién va a leer?"
├─ biblioteca/     Mis libros, agregar libro (niño) y cálculo del progreso
├─ adultos/        Panel del adulto
├─ textos/         Agregar texto o libro (PDF) con revisión
├─ ajustes/        Ajustes de lectura por niño
├─ audio/          Voz (Web Speech) y sonidos (Web Audio, sin archivos)
└─ ui/             Componentes comunes (encabezado, botones, portada…)
server/
├─ src/app.ts      Rutas de la API (/api/…)
├─ src/auth.ts     Contraseñas (scrypt) y sesiones
├─ src/permisos.ts Quién puede ver o cambiar a cada niño y cada texto
├─ src/correo.ts   Correo de recuperar contraseña
├─ src/cli.ts      Tareas de administración por terminal
├─ sql/            Migraciones (se aplican solas al arrancar)
└─ test/           Tests de la API contra PostgreSQL
deploy/            nginx, systemd y actualizar.sh
```

### Cómo se procesa un PDF

1. `fuentes/pdf.ts` lee el texto de cada página con pdf.js **en el
   navegador** (el archivo no se sube) y dibuja una miniatura de la portada.
2. `lenguaje/libro.ts`:
   - Quita números de página, URLs y encabezados repetidos.
   - Une las líneas cortadas y repara las palabras partidas con guion ("es-/perando").
   - Convierte los guiones de diálogo en raya ("-Hola -dijo-." → "—Hola —dijo—.").
   - Detecta capítulos: "Capítulo N", "Parte II", números romanos y fechas de diario como "Enero 4".
   - Separa párrafos y conserva los versos según dónde quedó cada línea en la página.
3. Cada capítulo se divide en frases de máximo 8 palabras. El título del
   capítulo se lee como primera frase.
4. El adulto revisa el resultado y elige el rango de páginas antes de guardar.

Con un libro de 48 páginas salen unos 70 capítulos y 4.500 frases, que pesan
unos 230 KB guardados. Un PDF escaneado (solo imágenes) no tiene texto y la
app avisa. Para esos casos haría falta OCR más adelante.

### Sincronía entre dedo, palabras y voz

1. La frase se muestra en una línea y se mide dónde quedó cada palabra en
   pantalla; la comida de cada palabra va justo debajo de su comienzo. La
   zona del dedo (frase + carril) usa ese mismo ancho, así que dedo, comida y
   palabra calzan. La cabeza de Ciempi va justo donde está el dedo.
2. Cuando el dedo llega a una manzana, la palabra se enciende entera, se dice
   en voz alta y Ciempi se la come. La frase termina al llegar a la última.
3. El avance solo aumenta. Si la cola de la voz se atrasa respecto del dedo,
   se descarta lo pendiente para que el sonido coincida con lo que se ve.
4. **Ritmo:** la velocidad se mide en **palabras por segundo** (ir de una
   manzana a la siguiente en un segundo = 1 palabra/s), sobre los últimos
   700 ms (mínimo 300 ms, para atrapar los zarpazos). Si supera el umbral, el
   avance vuelve a donde empezó el arrebato, se corta la voz y la frase queda
   marcada.
5. **Duración de la sesión:** se cuenta el tiempo activo. Las pausas de más de
   10 s no suman.

El motor es lógica pura y no toca el DOM: `paso(estado, entrada) → { estado, efectos }`.
Por eso se puede probar sin navegador y reutilizar en los modos eco y solo.

### Modelo de datos y permisos

- **Usuarios** (`usuarios`): adultos con correo y niños con usuario (sin
  correo). Contraseñas con scrypt. Al entrar se crea una sesión de 90 días; el
  token va en `Authorization: Bearer`, así funciona igual en la web y en la APK.
  Tras varios intentos fallidos se bloquea el acceso por 5 minutos.
- **Adultos** (`cuentas`, rol terapeuta o apoderado). **Niños**
  (`perfiles_ninos`); sus admins están en `miembros_nino` y se suman con un
  código de invitación (`invitaciones_nino`).
- `textos.subido_por` es quien lo subió (adulto o niño): solo esa persona lo
  edita o borra. `asignaciones` es la biblioteca del niño con su progreso.
- **Permisos** (`server/src/permisos.ts`, revisados en cada ruta):
  - Un niño se ve a sí mismo; un adulto ve a los niños que administra.
  - El niño edita lo suyo (ajustes, progreso, sus PDF), pero no puede crear
    niños, invitar adultos ni quitar lo que le asignó un adulto.
  - Las compras de la tienda se cobran en una transacción en el servidor, con
    los precios de `src/ciempi/catalogo.ts`.
- **Probado** en `server/test/api.test.ts`: terapeuta, apoderado, niño y
  extraño; tienda, progreso, recuperación de contraseña y bloqueo por intentos.
- **Privacidad de menores:** del niño se guardan apodo, ícono, usuario,
  ajustes y monedas. Sin nombre completo, fecha de nacimiento, correo real,
  diagnóstico ni fotos. De los PDF solo se guarda el texto y una miniatura.
- **Derechos de autor:** cada usuario carga sus propios libros; no van
  incluidos en la app (la carpeta `libro/` está en `.gitignore`).

### Decisiones tomadas (se pueden cambiar)

- Umbral de ritmo por defecto: **4 palabras/s**, el máximo (configurable entre 0,5 y 4).
  Los perfiles que tenían un valor por defecto anterior (1,5 o 2,5) se actualizan solos una vez.
  Los perfiles que tenían el umbral en sílabas/s se convierten solos (÷ 2).
- Velocidad de voz por defecto: **1,0×** (entre 0,5 y 1,5). Los perfiles
  que tenían el valor anterior (0,85) se actualizan solos una vez.
- Después de un tropiezo se **sigue desde donde quedó** tras 1,5 s, sin monedas.
- Para retomar hay que apoyar el dedo cerca de Ciempi (a menos de media distancia entre manzanas).
- Tipografía **Andika** (diseñada para aprender a leer), incluida en el bundle
  para que funcione offline.
- "tl" se separa al uso chileno: *at‑las*.
- Frases de hasta **8 palabras**; las más largas se reparten parejo (10 → 5 + 5), cortando de
  preferencia en comas o antes de un inciso de diálogo, y sin dejar "de",
  "y", "me", "porque"… al final de un trozo.
- Premios por hitos de avance (ver «Avance y monedas»): un aviso corto al
  pasar un hito y la celebración grande al terminar el libro.
- Sin conexión, la zona de adultos no tiene protección (es para probar en un
  solo equipo); con el servidor cada uno entra con su cuenta.

---

### Tienda de Ciempi

- El catálogo y los precios viven solo en `src/ciempi/catalogo.ts` (el
  servidor importa ese mismo archivo). Para agregar algo: dibujarlo en
  `src/ciempi/dibujos.tsx` y sumarlo al catálogo.
- Lo gratis (precio 0) siempre está disponible; lo comprado queda en
  `perfiles_ninos.inventario` y en el historial `compras`. El servidor impide
  ponerse algo no comprado.
- Las cosas cuestan entre 6 y 30 monedas; un cuento da entre 5 (nivel 0) y
  40 (nivel 4) la primera vez que se termina.
- Límite conocido: como el niño gana monedas desde su propio dispositivo,
  alguien con conocimientos técnicos podría sumarse monedas llamando a la API.
  Para esta app no se consideró un riesgo real.

## Próximos pasos

1. **Editar frases en la revisión del libro:** unir o separar frases a mano y
   renombrar capítulos.
2. **Modo sin conexión con cuenta (PWA):** guardar los libros asignados en el
   dispositivo y sincronizar el progreso al volver la conexión. El service
   worker exige HTTPS fuera de localhost.
3. **Voces en la tienda.**
4. **OCR** para PDF escaneados.
5. **Validar con la psicopedagoga:** umbral de ritmo, colores, tamaño de
   letra y casos de silabeo dudosos: con prefijos, las reglas dan
   *su‑bra‑yar* y no *sub‑ra‑yar*.
