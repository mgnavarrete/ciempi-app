#!/usr/bin/env bash
# Genera con Codex (image_gen) los encargos de ia/encargos.tsv que aún no tienen PNG, N en paralelo.
# Uso (desde la raíz): bash docs/expansion-v10/heroes/generar.sh [paralelo=6] [filtro-regex]
cd "$(dirname "$0")/../../.." || exit 1
export IA_PARALELO=1
P=${1:-6}; F=${2:-.}
D=docs/expansion-v10/heroes/ia
grep -E "^($F)" $D/encargos.tsv | while IFS=$'\t' read -r id tipo prompt r1 r2; do
  [ -f "$D/$id.png" ] || printf '%s\0%s\0%s\0%s\0' "$id" "$prompt" "$r1" "$r2"
done | xargs -0 -n4 -P "$P" sh -c 'node scripts/transformaciones/generar-ia.mjs docs/expansion-v10/heroes/ia "$0" "$1" "$2" "$3" || echo "[$0] FALLÓ"'
