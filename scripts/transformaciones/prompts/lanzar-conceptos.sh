#!/bin/bash
# Lanza las 6 direcciones de concepto en paralelo.
W=/mnt/d/Proyectos/ciempi-app/.claude/worktrees/agent-ab5e3926402cffc21
P=/tmp/claude-1000/-mnt-d-Proyectos-ciempi-app/3f295d6c-d52a-472b-b48b-4201d78b8e74/scratchpad/prompts
export TMPDIR=/tmp/claude-1000/-mnt-d-Proyectos-ciempi-app/3f295d6c-d52a-472b-b48b-4201d78b8e74/scratchpad/codex-tmp
mkdir -p "$TMPDIR"
cd "$W"
R1=docs/rediseno-ciempi/ciempi-ilustracion-v2-presentacion.png
R2=docs/rediseno-ciempi/revisiones/T00-referencias/ciempi-sin-gorro.png
for id in d1-desfile d2-bebe d3-hojas; do
  node scripts/transformaciones/generar-ia.mjs docs/rediseno-ciempi/revisiones/T01-dragon-v1/ia "concepto-$id" "$P/$id.txt" $R1 $R2 &
done
for id in c1-esponjosa c2-penachos c3-chilena; do
  node scripts/transformaciones/generar-ia.mjs docs/rediseno-ciempi/revisiones/T02-cuncuna-v1/ia "concepto-$id" "$P/$id.txt" $R1 $R2 &
done
wait
echo TODOS
