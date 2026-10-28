#!/usr/bin/env bash
# Crea la llave con que se firman las APK de CIEMPI (una sola vez).
#
# La llave queda en android/firma/ (no va a git). GUÁRDALA EN UN LUGAR SEGURO:
# sin ella no se pueden publicar actualizaciones; los teléfonos rechazan una
# APK firmada con otra llave y habría que desinstalar la app para instalarla.
set -euo pipefail
cd "$(dirname "$0")/.."
DIR=android/firma
if [ -f "$DIR/ciempi.jks" ]; then
  echo "Ya existe $DIR/ciempi.jks: no se crea otra."
  exit 0
fi
mkdir -p "$DIR"
CLAVE=$(head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 28)
"${JAVA_HOME:-$HOME/jdk}/bin/keytool" -genkeypair -v \
  -keystore "$DIR/ciempi.jks" -alias ciempi -keyalg RSA -keysize 4096 -validity 36500 \
  -storepass "$CLAVE" -keypass "$CLAVE" \
  -dname "CN=CIEMPI, O=Ciempi, C=CL"
cat > "$DIR/firma.properties" <<FIN
# Llave de las APK de CIEMPI. No subir a git. Respaldar junto con ciempi.jks.
storeFile=../firma/ciempi.jks
storePassword=$CLAVE
keyAlias=ciempi
keyPassword=$CLAVE
FIN
chmod 600 "$DIR/firma.properties" "$DIR/ciempi.jks"
echo "→ Llave creada en $DIR/. Respáldala (ciempi.jks y firma.properties)."
