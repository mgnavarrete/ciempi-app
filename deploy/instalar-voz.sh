#!/usr/bin/env bash
# Instala la voz de Ciempi (Kokoro: Alex para niño, Dora para niña) y su servicio:
#   bash deploy/instalar-voz.sh
# Se puede volver a correr sin problema (no descarga de nuevo lo que ya está).
set -euo pipefail
cd "$(dirname "$0")/../server/voz"

if ! python3 -c 'import sys; sys.exit(not ((3, 10) <= sys.version_info[:2] < (3, 14)))'; then
  echo "Se necesita Python entre 3.10 y 3.13 (hay $(python3 --version 2>&1))."; exit 1
fi
# Kokoro pronuncia con espeak-ng del sistema (el que trae el paquete de Python viene roto).
if ! dpkg -s espeak-ng >/dev/null 2>&1; then
  sudo apt-get install -y espeak-ng
fi
if [ ! -x .venv/bin/python ]; then
  python3 -m venv .venv || { echo "Falta venv: sudo apt install python3-venv  y vuelve a correr este script."; exit 1; }
fi
.venv/bin/pip install --quiet --upgrade pip
.venv/bin/pip uninstall --quiet -y piper-tts 2>/dev/null || true   # la voz anterior
.venv/bin/pip install --quiet -r requirements.txt

# Modelo de Kokoro y sus voces (~350 MB en total).
mkdir -p modelos
BASE=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -s "modelos/$f" ] || curl -fL --retry 5 --retry-delay 10 --retry-all-errors --progress-bar -o "modelos/$f" "$BASE/$f"
done
# Las voces de Piper que se usaban antes ya no hacen falta.
rm -f modelos/es_MX-*.onnx modelos/es_MX-*.onnx.json

sudo cp ../../deploy/ciempi-voz.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ciempi-voz
sudo systemctl restart ciempi-voz
for i in $(seq 1 60); do curl -fs http://127.0.0.1:3201/salud >/dev/null && break; sleep 1; done
curl -fs -o /tmp/ciempi-prueba.wav "http://127.0.0.1:3201/voz?texto=hola&voz=nino" \
  && echo "Voz de Ciempi lista ($(stat -c %s /tmp/ciempi-prueba.wav) bytes de prueba)." \
  || { echo "La voz no responde. Revisa: journalctl -u ciempi-voz -n 30"; exit 1; }
