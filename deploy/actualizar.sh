#!/usr/bin/env bash
# Actualiza Ciempi en el servidor con lo último de GitHub: bash deploy/actualizar.sh
set -euo pipefail
cd "$(dirname "$0")/.."

git pull --ff-only
npm ci --no-audit --no-fund
npm run build
npm --prefix server ci --omit=dev --no-audit --no-fund
sudo systemctl restart ciempi-api
echo "Ciempi actualizado."
