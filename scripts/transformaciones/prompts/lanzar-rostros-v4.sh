#!/bin/bash
# Lanza generaciones IA de los rostros v4. Uso (desde la raíz del worktree):
#   bash scripts/transformaciones/prompts/lanzar-rostros-v4.sh <carpeta-revision> <id> [<id>...]
# Cada id usa prompts/<id>.txt de esa revisión; referencias según el prefijo del id.
R=docs/rediseno-ciempi/revisiones
C=$1; shift
export TMPDIR=${TMPDIR_IA:-/tmp/claude-1000/ia-rostros-v4}
mkdir -p "$TMPDIR"
for id in "$@"; do
  case $C in
    T01-*) refs="$R/$C/referencias/dragon-cabeza-v1.png $R/$C/referencias/dragon-cuerpo-v1.png $R/$C/referencias/expresiones-ciempi.png" ;;
    T02-*) refs="$R/$C/referencias/cuncuna-cabeza-v1.png $R/$C/referencias/cuncuna-cuerpo-v1.png $R/$C/referencias/expresiones-ciempi.png" ;;
  esac
  [ -n "$EXTRA_REFS" ] && refs="$EXTRA_REFS"
  node scripts/transformaciones/generar-ia.mjs $R/$C/ia "$id" "$R/$C/prompts/$id.txt" $refs &
done
wait
echo TODOS
