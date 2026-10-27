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

**Stack:** React 19 + Vite + TypeScript + Tailwind CSS 4 + Vitest + pdf.js +
Supabase. Sin Supabase configurado, funciona sin conexión con `localStorage`.

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
npm run apk          # → ciempi.apk en la raíz del proyecto
```

Para instalarla, pasa `ciempi.apk` al teléfono (cable, Drive, WhatsApp…) y
ábrela; Android pedirá permitir "instalar apps de origen desconocido".

- La APK usa `.env.apk`. Hoy va **sin conexión** (vacío). Cuando exista el
  proyecto de Supabase en la nube, pon ahí su URL y anon key y vuelve a
  correr `npm run apk`.
- Íconos y pantalla de inicio se generan desde `assets/` con
  `npx capacitor-assets generate --android`.
- Es una APK de prueba (firmada con la llave de depuración). Para la Play
  Store hay que generar una firmada con llave propia (`assembleRelease`).

## Conectar Supabase (cuentas y sincronización)

Sin configurar nada, la app funciona **sin conexión** (un solo dispositivo,
sin login, con "¿Quién va a leer?"). Con Supabase aparecen las cuentas de
niño y de adulto, y todo se sincroniza.

El esquema está en `supabase/migrations/` (tablas, RLS y funciones).

### En local (para desarrollar, con Docker)

```bash
npm run db:start     # levanta Postgres + Auth + API en Docker y aplica las migraciones
npm run db:env       # muestra API_URL y ANON_KEY
```

Crea `.env.local` con esos dos valores (ver `.env.example`) y reinicia
`npm run dev`. `npm run db:reset` borra todo y vuelve a aplicar las
migraciones; `npm run db:stop` lo apaga. Ojo: el celular no alcanza
`127.0.0.1:54321`; para probar en el teléfono usa el proyecto en la nube.

### En la nube (para usar de verdad)

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. **SQL Editor** → pega `supabase/migrations/20261027120000_ciempi.sql` → **Run**
   (o `npx supabase link` + `npx supabase db push`).
3. **Authentication → Sign In / Providers → Email:** desactiva **"Confirm email"**.
   Es necesario: los niños no tienen correo (Auth usa uno interno,
   `usuario@ninos.ciempi.app`, al que nunca se envía nada).
4. **Project Settings → API:** copia la *Project URL* y la *anon/publishable key*
   a `.env.local`.
5. **Authentication → URL Configuration:** en *Site URL* y *Redirect URLs* pon
   la dirección donde publiques la app (por ejemplo `https://ciempi.vercel.app/**`).
   Es adonde vuelve el enlace de "recuperar contraseña".
6. **Authentication → Emails → Reset password:** opcional, pega el contenido de
   `supabase/templates/recuperar.html` para que el correo llegue en español.

La anon key es pública por diseño (va en el navegador); lo que protege los
datos es la RLS. **Nunca uses la `service_role` key en la app.**

### Contraseñas olvidadas

- **Adulto:** "Soy adulto" → **¿Olvidaste tu contraseña?** → llega un correo
  con un enlace (funciona aunque se abra en otro dispositivo) → crea una
  contraseña nueva. Con sesión iniciada también puede cambiarla en su panel
  → Cuenta.
- **Niño:** no tiene correo; un adulto le cambia la clave desde su panel.
- **En local** los correos no salen a internet: se ven en **Mailpit**,
  http://127.0.0.1:54324.

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
| Barra de avance del capítulo y **medidor de monedas** («🪙 Te faltan 7 palabras») | `PantallaLectura.tsx`, `src/lectura/monedas.ts` |
| Monedas: 1 cada 20 palabras leídas a buen ritmo, +2 por capítulo, +3 por libro; lo acumulado hacia la próxima moneda no se pierde al salir | `src/lectura/monedas.ts` + repositorio de perfiles |
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
| **Panel del adulto**: crear lectores con usuario y clave, ver sus libros (vista previa), agregarles libros, avance y resumen de 7 días (minutos, frases, 🐢, sílabas/s), cambiar clave, invitar a otro adulto | `src/adultos/PantallaAdultos.tsx` |
| Datos en Supabase (o sin conexión en `localStorage`) | `src/datos/` |
| Esquema de Supabase con RLS (probado con Supabase local: Auth real, 40 verificaciones de permisos y un recorrido de punta a punta en dos navegadores) | `supabase/migrations/` |

### Cómo probar cada parte

1. **Silabeo, frases y libros:** `npm test`.
2. **Entrar:** elige al niño en "¿Quién va a leer?" (o crea uno con apodo e ícono).
3. **Biblioteca:** cada libro muestra portada, capítulo actual y avance.
   Toca "Empezar" o "Continuar".
4. **Lectura:** pon el dedo en el círculo amarillo y desliza despacio. Al
   tocar el inicio de una palabra ("des…") se ilumina y suena entera
   ("despacio"). La frase termina al recorrer la mitad de la última palabra.
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
│  ├─ supabase/              Con login y sincronización
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
supabase/migrations/  Esquema con RLS y funciones
```

### Cómo se procesa un PDF

1. `fuentes/pdf.ts` lee el texto de cada página con pdf.js **en el
   navegador** (el archivo no se sube) y dibuja una miniatura de la portada.
2. `lenguaje/libro.ts`:
   - Quita números de página, URLs y encabezados repetidos.
   - Une las líneas cortadas y repara las palabras partidas con guion ("es-/perando").
   - Convierte los guiones de diálogo en raya ("-Hola -dijo-." → "—Hola —dijo—.").
   - Detecta capítulos: "Capítulo N", "Parte II", números romanos y fechas de diario como "Enero 4".
3. Cada capítulo se divide en frases de máximo 6 palabras. El título del
   capítulo se lee como primera frase.
4. El adulto revisa el resultado y elige el rango de páginas antes de guardar.

Con Papelucho (48 páginas) salen 71 capítulos y unas 4.500 frases, que pesan
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

- **Adultos:** usuarios de Supabase Auth con fila en `cuentas` (rol
  terapeuta o apoderado).
- **Niños:** `perfiles_ninos` con su propio usuario de Auth (`usuario_id`).
  Su "correo" es interno (`usuario@ninos.ciempi.app`). Sus admins están en
  `miembros_nino`.
- **Alta del niño sin `service_role`:** el admin llama
  `preparar_cuenta_nino`, que reserva el usuario y entrega un secreto de un
  solo uso (tabla `altas_nino`, que nadie puede leer). La app crea el usuario
  con un cliente aparte para no cerrar la sesión del adulto, y el trigger
  `al_registrar_usuario` solo lo vincula al perfil si el secreto es correcto
  y tiene menos de una hora.
- `cambiar_clave_nino`: solo un admin del niño puede usarla.
- `textos.subido_por` es quien lo subió (adulto o niño): solo esa persona lo
  edita o borra. `asignaciones` es la biblioteca del niño con su progreso.
- **RLS:**
  - `puede_ver_nino`: el niño mismo o sus admins. `es_admin_de`: solo los adultos.
  - El niño ve y edita lo suyo (ajustes, progreso, sus PDF), pero no puede
    darse monedas a mano, crear niños, invitar adultos ni quitar lo que le
    asignó un adulto.
  - Las monedas cambian solo con `sumar_monedas`; las columnas `monedas`,
    `usuario` y `usuario_id` no se pueden editar directamente.
- **Probado:** con Supabase local y su Auth real (40 verificaciones de
  permisos) y con un recorrido de punta a punta en dos navegadores:
  1. El adulto se registra, crea a "Tomi" con usuario y clave, y le sube Papelucho.
  2. Tomi entra en su teléfono, ve el libro, sube su guía y lee.
  3. El adulto ve el avance y abre la guía en vista previa.
  4. Tomi borra su guía, el adulto le cambia la clave y Tomi entra con la
     nueva y retoma donde iba.
- **Privacidad de menores:** del niño se guardan apodo, ícono, usuario,
  ajustes y monedas. Sin nombre completo, fecha de nacimiento, correo real,
  diagnóstico ni fotos. De los PDF solo se guarda el texto y una miniatura.
- **Derechos de autor:** cada usuario carga sus propios libros; no van
  incluidos en la app (la carpeta `libro/` está en `.gitignore`).

### Decisiones tomadas (se pueden cambiar)

- Umbral de ritmo por defecto: **1,5 palabras/s** (configurable entre 0,5 y 4).
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
- Premios: 1 moneda cada **20 palabras** leídas a buen ritmo (las frases con
  "más despacito" no suman), +2 por capítulo, +3 por libro. Solo dan monedas
  las frases nuevas (`fraseMaxima`): al volver atrás o repetir se "repasa" sin
  ganar ni perder monedas, y el premio del libro se da una sola vez. Sin celebración
  entre frases para no cortar la lectura; la grande queda para el fin de
  capítulo.
- Sin conexión, la zona de adultos no tiene protección (es para probar en un
  solo equipo); con Supabase cada uno entra con su cuenta.

---

### Tienda de Ciempi

- El catálogo vive en `src/ciempi/catalogo.ts`; los precios también están en
  la tabla `items_tienda` (un test revisa que coincidan). Para agregar algo:
  dibujarlo en `src/ciempi/dibujos.tsx`, sumarlo al catálogo y a una migración.
- Lo gratis (precio 0) siempre está disponible; lo comprado queda en
  `perfiles_ninos.inventario`, que solo cambia con la RPC atómica
  `comprar_para_ciempi`. Un trigger impide ponerse algo no comprado.
- Precios pensados para el ritmo de monedas (1 cada 20 palabras): un capítulo
  de Papelucho da ~15–20 monedas, y las cosas cuestan entre 6 y 30.
- Límite conocido: como el niño gana monedas desde su propio dispositivo,
  alguien con conocimientos técnicos podría sumarse monedas llamando a la API.
  Para esta app no se consideró un riesgo real.

## Próximos pasos

1. **Subir a la nube:** proyecto de Supabase real + publicar la app (por
   ejemplo en Vercel o Netlify) para usarla desde cualquier teléfono.
2. **Editar frases en la revisión del libro:** unir o separar frases a mano y
   renombrar capítulos.
3. **Modos eco y solo:** las banderas ya están en `src/lectura/modos.ts`.
4. **Tienda:** catálogo y compras (los tipos y el SQL ya existen); colores y
   accesorios para Ciempi, fondos y voces.
5. **PWA y modo offline con Supabase:** guardar los libros asignados en el
   dispositivo y sincronizar el progreso al volver la conexión; después, APK
   con Capacitor. El service worker exige HTTPS fuera de localhost.
6. **Recuperar clave del adulto** por correo (hoy el niño la recupera vía su
   admin; el adulto aún no tiene "olvidé mi contraseña").
7. **OCR** para PDF escaneados.
8. **Validar con la psicopedagoga:** umbral de ritmo, colores, tamaño de
   letra y casos de silabeo dudosos: con prefijos, las reglas dan
   *su‑bra‑yar* y no *sub‑ra‑yar*.
