# Instalar Ciempi en el servidor

Igual que Kuentu: Nginx, PostgreSQL y Node instalados directo en el sistema, la app en
`/var/www/ciempi-app` y publicada en **https://ciempi.minttu.cl**. Ciempi no toca lo existente:
usa su propia base de datos, el puerto interno **3200** y un sitio de Nginx aparte.

```
celular / navegador ──HTTPS──> nginx ─┬─ /        → /var/www/ciempi-app/dist   (la web)
       (APK incluida)                 └─ /api/    → 127.0.0.1:3200             (server/, systemd)
                                                         └─ PostgreSQL (base ciempi)
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
which node                            # si no es /usr/bin/node, corregir ExecStart
sudo cp deploy/ciempi-api.service /etc/systemd/system/
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
```

`nginx -t` revisa la configuración **antes** de recargar, así un error no bota las otras apps.
Prueba: abre https://ciempi.minttu.cl, crea una cuenta de adulto y un lector.

## 7. APK

La APK se conecta a `https://ciempi.minttu.cl` (lo dice `.env.apk`). Se genera en el computador de
desarrollo, no en el servidor:

```bash
npm run apk                           # → ciempi.apk
```

Instálala en el teléfono **después** de que el paso 6 funcione (la APK solo habla HTTPS).

## 8. Actualizar a una versión nueva

Después de subir cambios a GitHub, en el servidor:

```bash
cd /var/www/ciempi-app && bash deploy/actualizar.sh
```

(pull, compila la web, instala lo del servidor y reinicia `ciempi-api`; las migraciones nuevas de
`server/sql/` se aplican solas al arrancar).

## 9. Tareas de administración

```bash
cd /var/www/ciempi-app/server
node --env-file=.env src/cli.ts lista                          # cuentas de adultos
node --env-file=.env src/cli.ts clave <correo> <clave-nueva>   # cambiar la clave de un adulto
```

La clave de un niño la cambia su adulto desde el panel de la app.

## 10. Respaldos

```bash
# crontab -e (root): respaldo diario a las 3:10, guardando 14 días
10 3 * * * sudo -u postgres pg_dump -Fc ciempi > /var/backups/ciempi-$(date +\%F).dump && find /var/backups -name 'ciempi-*.dump' -mtime +14 -delete
```

Restaurar: `sudo -u postgres pg_restore -d ciempi --clean /var/backups/ciempi-AAAA-MM-DD.dump`.
