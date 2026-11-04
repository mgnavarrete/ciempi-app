#!/bin/bash
# Lanza la producción de piezas V4 sobre los conceptos elegidos (s2-caramelo, k1-arcoiris).
# Uso (desde la raíz): bash scripts/transformaciones/prompts-v4/lanzar-piezas.sh [ids...]
set -u
P=scripts/transformaciones/prompts-v4/textos
export TMPDIR=${TMPDIR_IA:-/tmp/claude-1000/-mnt-d-Proyectos-ciempi-app/f6786c66-70e9-4f5f-a1f5-44b6262e191b/scratchpad/codex-tmp}
mkdir -p "$TMPDIR"
R=docs/rediseno-ciempi/revisiones
BASE=docs/rediseno-ciempi/ciempi-ilustracion-v2-presentacion.png
SIN=$R/T00-referencias/ciempi-sin-gorro.png
SC=$R/T03-serpiente-v1/ia/concepto-s2-caramelo.png
KC=$R/T04-camaleon-v1/ia/concepto-k1-arcoiris.png
ids=${*:-serpiente-segmentos serpiente-cola serpiente-cabeza serpiente-lengua camaleon-segmentos camaleon-cola camaleon-pata camaleon-cabeza camaleon-torretas}
for id in $ids; do
  case $id in
    serpiente-cabeza) refs="$SC $BASE $SIN"; dest=$R/T03-serpiente-v1/ia ;;
    serpiente-*) refs="$SC $BASE"; dest=$R/T03-serpiente-v1/ia ;;
    camaleon-cabeza) refs="$KC $BASE $SIN"; dest=$R/T04-camaleon-v1/ia ;;
    camaleon-*) refs="$KC $BASE"; dest=$R/T04-camaleon-v1/ia ;;
  esac
  node scripts/transformaciones/generar-ia.mjs $dest "pieza-$id" "$P/pieza-$id.txt" $refs &
done
wait
echo TODOS
