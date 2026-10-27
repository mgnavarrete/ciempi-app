#!/usr/bin/env bash
# Actualiza Ciempi en el servidor con lo último de GitHub: bash deploy/actualizar.sh
set -euo pipefail
cd "$(dirname "$0")/.."

git pull --ff-only
npm ci --no-audit --no-fund
npm run build
npm --prefix server ci --omit=dev --no-audit --no-fund
# La voz de Ciempi, si está instalada y activada (deploy/instalar-voz.sh). Si se pausó, sigue pausada.
if [ -x server/voz/.venv/bin/python ] && systemctl is-enabled --quiet ciempi-voz 2>/dev/null; then
  server/voz/.venv/bin/pip install --quiet -r server/voz/requirements.txt
  sudo systemctl restart ciempi-voz
fi
sudo systemctl restart ciempi-api
echo "Ciempi actualizado."
