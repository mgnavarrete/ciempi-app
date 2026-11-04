#!/bin/bash
# Lanza las 8 direcciones de concepto V4 (4 Serpiente, 4 Camaleón) en paralelo con generar-ia.mjs.
# Uso (desde la raíz del worktree): bash scripts/transformaciones/prompts-v4/lanzar-conceptos.sh
set -u
P=scripts/transformaciones/prompts-v4/textos
export TMPDIR=${TMPDIR_IA:-/tmp/claude-1000/-mnt-d-Proyectos-ciempi-app/f6786c66-70e9-4f5f-a1f5-44b6262e191b/scratchpad/codex-tmp}
mkdir -p "$TMPDIR"
R1=docs/rediseno-ciempi/ciempi-ilustracion-v2-presentacion.png
R2=docs/rediseno-ciempi/revisiones/T00-referencias/ciempi-sin-gorro.png
R3=docs/rediseno-ciempi/revisiones/T01-dragon-v1/ia/concepto-d2-bebe.png
for id in s1-jardin s2-caramelo s3-noche s4-hoja; do
  node scripts/transformaciones/generar-ia.mjs docs/rediseno-ciempi/revisiones/T03-serpiente-v1/ia "concepto-$id" "$P/serpiente-$id.txt" $R1 $R2 $R3 &
done
for id in k1-arcoiris k2-tropical k3-atardecer k4-pastel; do
  node scripts/transformaciones/generar-ia.mjs docs/rediseno-ciempi/revisiones/T04-camaleon-v1/ia "concepto-$id" "$P/camaleon-$id.txt" $R1 $R2 $R3 &
done
wait
echo TODOS
