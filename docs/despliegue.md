# Instalar Ciempi en el servidor

Igual que Kuentu: Nginx, PostgreSQL y Node instalados directo en el sistema, la app en
`/var/www/ciempi-app` y publicada en **https://ciempi.minttu.cl**. Ciempi no toca lo existente:
usa su propia base de datos, el puerto interno **3200** y un sitio de Nginx aparte.

```
celular / navegador ──HTTPS──> nginx ─┬─ /        → /var/www/ciempi-app/dist   (la web)
       (APK incluida)                 └─ /api/    → 127.0.0.1:3200             (server/, ciempi-api)
                                                         ├─ PostgreSQL (base ciempi)
                                                         └─ 127.0.0.1:3201  voz de Ciempi (server/voz, ciempi-voz)
```

## 0. Antes de empezar

- **DNS:** registro **A** `ciempi` → `200.28.165.145` en la zona de `minttu.cl`. Revisa que ya
  responda con `dig +short ciempi.minttu.cl` antes del paso 6 (HTTPS).
- En el servidor:

```bash
node -v                               # 22.18 o más nuevo
sudo ss -ltnp | grep ':3200'          # no debe mostrar nada (puerto libre)
```

## 1. Código

```bash
cd /var/www
sudo git clone https://github.com/mgnavarrete/ciempi-app.git
sudo chown -R mint:mint /var/www/ciempi-app
```

Si el repositorio es privado, clona con `git@github.com:mgnavarrete/ciempi-app.git` usando una
*deploy key* de solo lectura (GitHub → Settings → Deploy keys).

## 2. Base de datos

```bash
DBPASS=$(openssl rand -hex 24)
sudo -u postgres psql -c "CREATE ROLE ciempi LOGIN PASSWORD '$DBPASS';" -c "CREATE DATABASE ciempi OWNER ciempi;"
```

Las tablas se crean solas la primera vez que arranca el servidor (`server/sql/`).

## 3. Configuración

En la **misma terminal** del paso 2 (usa `$DBPASS`):

```bash
cat > /var/www/ciempi-app/server/.env <<EOF
DATABASE_URL=postgres://ciempi:$DBPASS@127.0.0.1:5432/ciempi
PORT=3200
HOST=127.0.0.1
APP_URL=https://ciempi.minttu.cl
EOF
chmod 600 /var/www/ciempi-app/server/.env
```

**Correo para recuperar contraseñas (opcional).** Sin SMTP, cuando un adulto pide recuperar su
contraseña el enlace queda en el registro (`journalctl -u ciempi-api | grep recuperación`) y se lo
puedes mandar a mano. Para que llegue solo, agrega a `server/.env` (ver `server/.env.example`):

```ini
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-correo@gmail.com
SMTP_PASS=clave-de-aplicacion
SMTP_FROM=Ciempi <tu-correo@gmail.com>
```

## 4. Compilar

```bash
cd /var/www/ciempi-app
npm ci --no-audit --no-fund
npm run build                         # usa .env.production: la web llama a /api del mismo sitio
npm --prefix server ci --omit=dev --no-audit --no-fund
```

## 5. Servicio (que el servidor arranque solo)

```bash
# Copia el servicio con la ruta real de node (aquí viene de nvm)
sed "s|^ExecStart=[^ ]*|ExecStart=$(which node)|" deploy/ciempi-api.service | sudo tee /etc/systemd/system/ciempi-api.service > /dev/null
sudo systemctl daemon-reload
sudo systemctl enable --now ciempi-api
curl http://127.0.0.1:3200/api/salud  # → {"ok":true}
```

Si no responde: `journalctl -u ciempi-api -n 30`.

## 6. Nginx + HTTPS

```bash
sudo cp deploy/nginx-ciempi.conf /etc/nginx/sites-available/ciempi.minttu.cl
sudo ln -s /etc/nginx/sites-available/ciempi.minttu.cl /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d ciempi.minttu.cl    # cuando pregunte, elige redirigir HTTP → HTTPS
# Si dice "Another instance of Certbot is already running": espera un minuto y repite.
```

`nginx -t` revisa la configuración **antes** de recargar, así un error no bota las otras apps.
Prueba: abre https://ciempi.minttu.cl, crea una cuenta de adulto y un lector.

## 6b. Voz de Ciempi

La voz con que Ciempi lee la genera el servidor con las **voces neuronales de Microsoft**
(gratis, sin cuenta ni clave, con [edge-tts](https://github.com/rany2/edge-tts)): **Lorenzo**
(Chile) si Ciempi es niño y **Catalina** (Chile) si es niña; en Ajustes → Voz también se puede
elegir **Paloma** o **Alonso**. Suenan igual en todos los teléfonos y en la web.

```bash
cd /var/www/ciempi-app && bash deploy/instalar-voz-microsoft.sh
```

Crea `server/voz-microsoft/.venv` con edge-tts (unos MB), prueba una voz, reinicia la API, apaga
Kokoro si estaba encendido y deja **grabando los cuentos** aparte: todo lo que se dice en los
cuentos de Ciempi (palabras, sílabas y oraciones), en las cuatro voces. La primera vez toma unos
25 minutos y ocupa unos 90 MB en la base; para ver cómo va: `tail -f /tmp/ciempi-grabar-cuentos.log`.
Mientras tanto la app igual funciona: lo que falta se pide en el momento (tarda un poco la primera vez).

- Casi no usa memoria: cada audio es una consulta por internet y queda guardado en `audios_voz`
  (las oraciones de los textos que suben los adultos también, la primera vez que se leen).
- `deploy/actualizar.sh` actualiza edge-tts y graba lo que falte (cuentos nuevos o corregidos).
  Para grabar a mano: `bash deploy/grabar-cuentos.sh` (o `bash deploy/grabar-cuentos.sh lorenzo`).
- Es el servicio de lectura en voz alta del navegador Edge, no uno oficial para apps: si un día
  Microsoft lo cierra, lo ya grabado sigue sonando y lo nuevo se lee con la voz del teléfono.
  Para no usarlo: `VOZ_MICROSOFT=no` en `server/.env`.

### Kokoro (ya no se usa)

Antes la voz era **Kokoro** en el propio servidor (`bash deploy/instalar-voz.sh`, ~1 GB de RAM,
servicio `ciempi-voz`). Queda como respaldo si se enciende (`sudo systemctl enable --now
ciempi-voz`), pero las voces de Microsoft suenan más naturales y casi no usan memoria. Para
liberar el disco: `sudo systemctl disable --now ciempi-voz && rm -rf server/voz/.venv server/voz/modelos`.

Opcionales, de pago (se usan si las voces de Microsoft gratis no están instaladas o fallan):

### Voces de Microsoft (Lorenzo y Paloma)

Lorenzo (Chile) para Ciempi niño y Paloma para Ciempi niña. Kokoro queda de respaldo si Azure falla.

1. En https://portal.azure.com → **Crear un recurso** → buscar **Speech** (Servicios de voz) → Crear.
   Plan de tarifa **Free F0** (500.000 caracteres al mes; cada palabra se pide una sola vez porque
   queda guardada). Región: **Brazil South**.
2. En el recurso → **Claves y punto de conexión**: copiar **CLAVE 1** y la **Ubicación/Región**.
3. En el servidor, agregar a `server/.env` y reiniciar:

```bash
nano /var/www/ciempi-app/server/.env
#   AZURE_SPEECH_KEY=la-clave-1
#   AZURE_SPEECH_REGION=brazilsouth
sudo systemctl restart ciempi-api
```

En la app, Ajustes → Voz debe decir «La voz de Ciempi funciona ✓». La clave es secreta: va solo
en `server/.env` (que no se sube a GitHub).

### Voces de xAI (alternativa a Azure)

Con una clave de API de xAI (https://console.x.ai → API Keys; se paga por uso, aparte de la
suscripción a Grok): Leo para Ciempi niño y Ara para Ciempi niña, en español de México.

```bash
nano /var/www/ciempi-app/server/.env
#   XAI_API_KEY=xai-...
sudo systemctl restart ciempi-api
```

Si hay clave de Azure y de xAI, se usa Azure. Para probar otras voces de xAI (eve, ara, leo,
rex, sal): `XAI_VOZ_NINO=` y `XAI_VOZ_NINA=` en el mismo archivo.

## 7. APK

La APK se conecta a `https://ciempi.minttu.cl` (lo dice `.env.apk`). Se genera en el computador de
desarrollo, no en el servidor:

```bash
npm run apk                           # → release/CIEMPI-<versión>.apk
```

Instálala en el teléfono **después** de que el paso 6 funcione (la APK solo habla HTTPS).

## 7b. Actualizaciones automáticas de la APK

Desde la APK **2.7.0**, la parte web (todo lo que no es nativo: pantallas, cuentos, dibujos) se
actualiza sola desde este servidor, sin reinstalar la APK. Usa el plugin `@capgo/capacitor-updater`
en modo manual y autoalojado: no habla con la nube de Capgo (sin `updateUrl` automático, sin
estadísticas ni canales; ver `capacitor.config.ts`). Las APK anteriores a 2.7.0 no lo traen: hay que
instalar la 2.7.0 una vez a mano.

**Cómo funciona** (`src/plataforma/actualizacion/`):

1. Al abrir la app, lee `https://ciempi.minttu.cl/ota/ultima.json`.
2. Si la web publicada es más nueva que la que corre (versión de `package.json` y, con la misma
   versión, el sello de compilación: la fecha del último commit) y es compatible con la APK
   instalada, descarga el zip en segundo plano y comprueba su SHA-256.
3. La usa **la próxima vez que se abra la app**, antes de mostrar nada. Nunca recarga con la app
   abierta: no se corta una lectura. (Si Android deja la app en segundo plano días enteros, se
   aplica cuando la vuelva a abrir desde cero.)
4. Sin internet sigue con la última versión descargada (o con la de la APK).
5. En la web normal (navegador) nada de esto hace algo.

### Publicar una actualización

```bash
cd /var/www/ciempi-app && bash deploy/actualizar.sh
```

Basta con eso. Después de `npm run build`, `node scripts/empaquetar-ota.mjs` compila otra vez la web
en **modo APK** (`vite build --mode apk`, con `VITE_API_URL=https://ciempi.minttu.cl` de `.env.apk`; la
web de `dist/` usa `VITE_API_URL=/` y no serviría dentro de la APK) y deja:

- `dist/ota/ciempi-web-<versión>-<sello>.zip`: la web en modo APK (unos 27 MB).
- `dist/ota/ultima.json`: `version`, `compilacion`, `paquete`, `url` (relativa al manifiesto),
  `sha256` (y `checksum`, el mismo valor, como lo llama el plugin), `nativaMinima`, `apk`, `tamano`
  y `publicado`.

Para probarlo en el computador: `npm run build && npm run ota`.

### Cuándo hace falta una APK nueva (`nativaMinima`)

`package.json` tiene `"ciempi": { "nativaMinima": "2.7.0" }`: la versión de APK más antigua que puede
usar la web actual. **Súbela** a la versión que se está publicando cuando cambie algo nativo: un
plugin de Capacitor nuevo o actualizado, Capacitor mismo, `android/` (permisos, `TelefonoPlugin`,
etc.). Las tabletas con una APK más vieja no descargan ese paquete (podría pedir algo que no tienen)
y siguen con lo que tenían.

### Publicar una APK nueva

1. En el computador: `npm run apk` → `release/CIEMPI-<versión>.apk`.
2. Subirla al servidor, a la carpeta `descargas/` (no va en git):

   ```bash
   ssh mint@servidor mkdir -p /var/www/ciempi-app/descargas
   scp release/CIEMPI-2.8.0.apk mint@servidor:/var/www/ciempi-app/descargas/
   ```

3. `bash deploy/actualizar.sh` (o, sin cambios de código, `node scripts/empaquetar-ota.mjs`). El
   script copia las APK a `dist/descargas/` (dist se borra en cada compilación) y anota la más nueva
   en `ultima.json` (`apk`).

Si `nativaMinima` es mayor que la APK instalada, la app muestra «Hay una versión nueva de CIEMPI →
Descargar», que abre `https://ciempi.minttu.cl/descargas/CIEMPI-x.y.z.apk` en el navegador del
teléfono; la instalación la confirma la persona como siempre (la app **no** usa el permiso
`REQUEST_INSTALL_PACKAGES`). El aviso solo existe en la APK compartida a mano: `VITE_CANAL=directo` en
`.env.apk`.

### Vuelta atrás

- Si un paquete nuevo no llega a dibujar la app en 15 s (no llama a `notifyAppReady`), el plugin
  vuelve solo a la versión anterior (la descargada antes o la de la APK) y marca el paquete como
  fallido: no se vuelve a descargar ese mismo paquete.
- Para retirar a mano una publicación mala: corregir (o revertir el commit) y publicar de nuevo;
  el arreglo lleva un sello más nuevo y llega igual que cualquier actualización. No se puede
  «bajar» a un paquete más viejo publicándolo: la app solo acepta paquetes más nuevos que el suyo.
- Al instalar una APK nueva se descartan los paquetes descargados y vuelve la web de la APK (que
  luego se pone al día sola si hay algo más nuevo).

### nginx

No hace falta nada nuevo para que funcione: `location /` ya sirve `dist/ota/` y `dist/descargas/`
(las `.apk` salen con su tipo, `application/vnd.android.package-archive`, del `mime.types` de nginx).
La app pide el manifiesto con `?t=<hora>` y por la vía nativa, así que no la frena ninguna caché ni
el CORS. Aun así, `deploy/nginx-ciempi.conf` agrega una línea para que `ultima.json` nunca se guarde
en caché; para aplicarla en el servidor, junto a las otras `location =`:

```nginx
location = /ota/ultima.json { add_header Cache-Control "no-cache"; }
```

y luego `sudo nginx -t && sudo systemctl reload nginx`.

### Al llegar a Google Play / App Store

- Compilar con `VITE_CANAL=tienda` (en `.env.apk`, o en un `.env.tienda` con
  `vite build --mode tienda`): desaparece el aviso de descargar la APK; las tiendas la actualizan.
- No publicar ni enlazar las APK de `descargas/` para esas instalaciones.
- La actualización de la web puede seguir: las políticas de Google Play y de App Store permiten
  cambiar JS/HTML/CSS que corre en el WebView mientras no cambie el propósito de la app ni se
  agreguen funciones nativas sin revisión. Lo nativo nuevo siempre va en una versión de tienda
  (y se sube `nativaMinima`).
- Para iOS: `npx cap add ios` y `cap sync` incluyen el mismo plugin; revisar su sección de
  privacidad (`PrivacyInfo.xcprivacy`) al publicar.

## 8. Actualizar a una versión nueva

Después de subir cambios a GitHub, en el servidor:

```bash
cd /var/www/ciempi-app && bash deploy/actualizar.sh
```

(pull, compila la web y el paquete de actualización de la APK (7b), instala lo del servidor y
reinicia `ciempi-api`; las migraciones nuevas de `server/sql/` se aplican solas al arrancar).

## 9. Tareas de administración

```bash
cd /var/www/ciempi-app/server
node --env-file=.env src/cli.ts lista                          # cuentas de adultos
node --env-file=.env src/cli.ts clave <correo> <clave-nueva>   # cambiar la clave de un adulto
```

La clave de un niño la cambia su adulto desde el panel de la app.

## 10. Respaldos

`deploy/respaldar.sh` guarda la base en `/var/backups/ciempi` (14 días) y revisa que el archivo se
pueda leer. `deploy/actualizar.sh` lo corre solo antes de cada actualización. Para uno diario:

```bash
# sudo crontab -e (cron de root): respaldo diario a las 3:10
10 3 * * * bash /var/www/ciempi-app/deploy/respaldar.sh >> /var/log/ciempi-respaldo.log 2>&1
```

Restaurar: `sudo -u postgres pg_restore -d ciempi --clean /var/backups/ciempi/ciempi-AAAA-MM-DD-HHMM.dump`.
Conviene copiar de vez en cuando un respaldo fuera del servidor (por ejemplo con `scp` al computador).
