#!/usr/bin/env bash
# Instala las voces de Microsoft para Ciempi (Lorenzo, Catalina, Paloma y
# Alonso; gratis, sin cuenta, con edge-tts) y graba de antemano los cuentos:
#   bash deploy/instalar-voz-microsoft.sh
# Usa muy poca memoria: cada audio es una consulta por internet y queda
# guardado en la base. Se puede volver a correr sin problema.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -x server/voz-microsoft/.venv/bin/python ]; then
  python3 -m venv server/voz-microsoft/.venv || { echo "Falta venv: sudo apt install python3-venv  y vuelve a correr este script."; exit 1; }
fi
server/voz-microsoft/.venv/bin/pip install --quiet --upgrade pip
server/voz-microsoft/.venv/bin/pip install --quiet --upgrade -r server/voz-microsoft/requirements.txt

# Prueba: si Microsoft responde, sale un MP3.
echo "Hola, soy Ciempi." | server/voz-microsoft/.venv/bin/python server/voz-microsoft/decir.py es-CL-LorenzoNeural +0% > /tmp/ciempi-prueba.mp3 \
  && echo "Voces de Microsoft listas ($(stat -c %s /tmp/ciempi-prueba.mp3) bytes de prueba)." \
  || { echo "No se pudo generar la voz de prueba (¿hay internet en el servidor?)."; exit 1; }

# La API las usa apenas existen; Kokoro ya no hace falta (si estaba encendido, se apaga para liberar memoria).
sudo systemctl restart ciempi-api
if systemctl is-enabled --quiet ciempi-voz 2>/dev/null; then
  sudo systemctl disable --now ciempi-voz
  echo "Kokoro (ciempi-voz) apagado: ya no se usa."
fi

# Grabar los cuentos toma unos 30 minutos la primera vez: queda corriendo aparte.
bash deploy/grabar-cuentos.sh
