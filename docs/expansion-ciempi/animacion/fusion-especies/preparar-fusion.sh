#!/usr/bin/env bash
# Arma en DESTINO (fuera del repo) el árbol de la fusión animación + especies, sin
# tocar ninguna rama ni worktree, y aplica la receta de RESULTADOS.md §6
# ("Fusión con especies"). Luego compila, prueba y deja listo el laboratorio de
# especies con `comprobar-crecer.html`.
#   bash preparar-fusion.sh /ruta/destino [rama-animacion] [rama-especies]
set -euo pipefail
DESTINO=${1:?destino}; A=${2:-worktree-agent-a103c0ae8e6a43da3}; E=${3:-worktree-agent-ab5e3926402cffc21}
REPO=/mnt/d/Proyectos/ciempi-app; AQUI=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$DESTINO"
ARBOL=$(git -C "$REPO" merge-tree --write-tree "$A" "$E" | head -1 || true)
git -C "$REPO" archive "$ARBOL" | tar -x -C "$DESTINO"
ln -sfn "$REPO/node_modules" "$DESTINO/node_modules"
python3 - "$DESTINO/src/ciempi/v2/pose.ts" <<'PY'
import re,sys
p=sys.argv[1];s=open(p).read()
# 1. Conflicto de la línea 1: quedarse con el import de especies.
s=re.sub(r"<<<<<<< [^\n]*\n=======\n(import type \{FormaCuerpo\} from './especie'\n)>>>>>>> [^\n]*\n",r"\1",s)
# 2. Borrar la copia local de FormaCuerpo (la de especie.ts la sustituye).
s=re.sub(r"\n/\*\*\n \* Forma del cuerpo de una especie: copia.*?\nexport interface FormaCuerpo \{[^\n]*\}\n","\n",s,flags=re.S)
assert '<<<<<<<' not in s and 'interface FormaCuerpo' not in s
open(p,'w').write(s)
PY
sed -i "s#execFileSync('git', \['show'#execFileSync('git', ['-C','$REPO','show'#" "$DESTINO/scripts/transformaciones/construir-laboratorio.mjs"
cp "$AQUI/comprobar-crecer.html" "$AQUI/comprobar-crecer.js" "$DESTINO/docs/rediseno-ciempi/laboratorio-transformaciones/"
cp "$AQUI/comprobar-fusion.mjs" "$DESTINO/"
cd "$DESTINO" && npx tsc --noEmit -p . && npx vitest run src && node scripts/transformaciones/construir-laboratorio.mjs
echo "Listo. (cd $DESTINO && python3 -m http.server 8779 --bind 127.0.0.1) y NODE_PATH=… node comprobar-fusion.mjs"
