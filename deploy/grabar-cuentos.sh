#!/usr/bin/env bash
# Graba con las voces de Microsoft todo lo que se dice en los cuentos de Ciempi
# (lo ya grabado se salta), corriendo aparte para no tener que esperar:
#   bash deploy/grabar-cuentos.sh            (las cuatro voces)
#   bash deploy/grabar-cuentos.sh lorenzo    (solo esa)
# Para ver cómo va:  tail -f /tmp/ciempi-grabar-cuentos.log
set -euo pipefail
cd "$(dirname "$0")/../server"
[ -x voz-microsoft/.venv/bin/python ] || { echo "Primero: bash deploy/instalar-voz-microsoft.sh"; exit 1; }
nohup node --env-file=.env src/cli.ts grabar-cuentos "$@" > /tmp/ciempi-grabar-cuentos.log 2>&1 &
echo "Grabando los cuentos aparte (la primera vez, unos 30 minutos). Para ver cómo va:"
echo "  tail -f /tmp/ciempi-grabar-cuentos.log"
