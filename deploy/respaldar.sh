#!/usr/bin/env bash
# Respaldo de la base de Ciempi: bash deploy/respaldar.sh
# Guarda en /var/backups/ciempi los últimos 14 días y revisa que el archivo se pueda leer.
# Diario, con el cron de root (sudo crontab -e):
#   10 3 * * * bash /var/www/ciempi-app/deploy/respaldar.sh >> /var/log/ciempi-respaldo.log 2>&1
set -euo pipefail
DESTINO=${DESTINO:-/var/backups/ciempi}
sudo mkdir -p "$DESTINO"
ARCHIVO="$DESTINO/ciempi-$(date +%F-%H%M).dump"
sudo -u postgres pg_dump -Fc ciempi | sudo tee "$ARCHIVO" > /dev/null
# Un respaldo que no se puede leer no sirve.
sudo pg_restore --list "$ARCHIVO" > /dev/null
sudo find "$DESTINO" -name 'ciempi-*.dump' -mtime +14 -delete
echo "$(date '+%F %T') respaldo: $ARCHIVO ($(sudo du -h "$ARCHIVO" | cut -f1))"
