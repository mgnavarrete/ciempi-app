#!/bin/bash
# Lanza la producción de piezas modulares (edición sobre el concepto elegido).
W=/mnt/d/Proyectos/ciempi-app/.claude/worktrees/agent-ab5e3926402cffc21
P=/tmp/claude-1000/-mnt-d-Proyectos-ciempi-app/3f295d6c-d52a-472b-b48b-4201d78b8e74/scratchpad/prompts
export TMPDIR=/tmp/claude-1000/-mnt-d-Proyectos-ciempi-app/3f295d6c-d52a-472b-b48b-4201d78b8e74/scratchpad/codex-tmp
mkdir -p "$TMPDIR"
cd "$W"
R=docs/rediseno-ciempi/revisiones
BASE=docs/rediseno-ciempi/ciempi-ilustracion-v2-presentacion.png
SIN=$R/T00-referencias/ciempi-sin-gorro.png
DC=$R/T01-dragon-v1/ia/concepto-d2-bebe.png
CC=$R/T02-cuncuna-v1/ia/concepto-c2-penachos.png
for id in "$@"; do
  case $id in
    dragon-cabeza) refs="$DC $BASE $SIN"; dest=$R/T01-dragon-v1/ia ;;
    dragon-*) refs="$DC $BASE"; dest=$R/T01-dragon-v1/ia ;;
    cuncuna-cabeza) refs="$CC $BASE $SIN"; dest=$R/T02-cuncuna-v1/ia ;;
    cuncuna-*) refs="$CC $BASE"; dest=$R/T02-cuncuna-v1/ia ;;
  esac
  node scripts/transformaciones/generar-ia.mjs $dest "pieza-$id" "$P/$id.txt" $refs &
done
wait
echo TODOS
