#!/bin/bash
# Iteración 2 (rostros propios) de T03/T04. Uso (desde la raíz):
#   bash scripts/transformaciones/prompts-v4/lanzar-rostros-v2.sh propuestas
#   bash scripts/transformaciones/prompts-v4/lanzar-rostros-v2.sh hojas <propuesta-serpiente> <propuesta-camaleon>
set -u
export TMPDIR=${TMPDIR_IA:-/tmp/claude-1000/-mnt-d-Proyectos-ciempi-app/f6786c66-70e9-4f5f-a1f5-44b6262e191b/scratchpad/codex-tmp}
mkdir -p "$TMPDIR"
R=docs/rediseno-ciempi/revisiones
S=$R/T03-serpiente-v2; C=$R/T04-camaleon-v2
SC=$R/T03-serpiente-v1/ia/concepto-s2-caramelo.png; KC=$R/T04-camaleon-v1/ia/concepto-k1-arcoiris.png
SIN=$R/T00-referencias/ciempi-sin-gorro.png; BASE=docs/rediseno-ciempi/ciempi-ilustracion-v2-presentacion.png
g() { node scripts/transformaciones/generar-ia.mjs "$1/ia" "$2" "$1/prompts/$2.txt" "${@:3}" & }
if [ "$1" = propuestas ]; then
  for p in propuesta-s2a-diamante propuesta-s2b-barbilla propuesta-s2c-gota; do g $S $p $SC $S/referencias/expresiones-ciempi.png; done
  for p in propuesta-k2a-anillos propuesta-k2b-crestas propuesta-k2c-mirada; do g $C $p $KC $C/referencias/expresiones-ciempi.png; done
  g $S pieza-serpiente-cabeza-lisa $SC $SIN
  g $C pieza-camaleon-pata $KC $BASE
else
  for i in 1 2 3 4; do g $S hoja-$i $S/ia/$2.png $S/referencias/expresiones-ciempi.png; g $C hoja-$i $C/ia/$3.png $C/referencias/expresiones-ciempi.png; done
fi
wait
echo TODOS
