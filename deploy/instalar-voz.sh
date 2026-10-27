#!/usr/bin/env bash
# Instala la voz de Ciempi (Piper + dos voces de México) y su servicio:
#   bash deploy/instalar-voz.sh
# Se puede volver a correr sin problema (no descarga de nuevo lo que ya está).
set -euo pipefail
cd "$(dirname "$0")/../server/voz"

if ! python3 -c 'import sys; sys.exit(sys.version_info < (3, 9))'; then
  echo "Se necesita Python 3.9 o más nuevo (hay $(python3 --version 2>&1))."; exit 1
fi
if [ ! -x .venv/bin/python ]; then
  python3 -m venv .venv || { echo "Falta venv: sudo apt install python3-venv  y vuelve a correr este script."; exit 1; }
fi
.venv/bin/pip install --quiet --upgrade pip
.venv/bin/pip install --quiet -r requirements.txt

# Voz de hombre (Ciempi niño) y de mujer (Ciempi niña). ~130 MB en total.
mkdir -p modelos
BASE=https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_MX
for m in ald/medium/es_MX-ald-medium claude/high/es_MX-claude-high; do
  n=$(basename "$m")
  [ -s "modelos/$n.onnx" ] || curl -fL --retry 5 --retry-delay 10 --retry-all-errors --progress-bar -o "modelos/$n.onnx" "$BASE/$m.onnx"
  curl -fsL --retry 5 --retry-delay 10 --retry-all-errors -o "modelos/$n.onnx.json" "$BASE/$m.onnx.json"
done

sudo cp ../../deploy/ciempi-voz.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ciempi-voz
sudo systemctl restart ciempi-voz
for i in $(seq 1 30); do curl -fs http://127.0.0.1:3201/salud >/dev/null && break; sleep 1; done
curl -fs -o /tmp/ciempi-prueba.wav "http://127.0.0.1:3201/voz?texto=hola&voz=nino" \
  && echo "Voz de Ciempi lista ($(stat -c %s /tmp/ciempi-prueba.wav) bytes de prueba)." \
  || { echo "La voz no responde. Revisa: journalctl -u ciempi-voz -n 30"; exit 1; }
