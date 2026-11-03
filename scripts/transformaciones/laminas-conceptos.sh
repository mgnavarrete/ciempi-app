#!/bin/bash
# Láminas de conceptos y siluetas de T01/T02 (ejecutar desde la raíz del repositorio).
set -e
R=docs/rediseno-ciempi/revisiones
L="python3 scripts/transformaciones/laminas.py"
mkdir -p $R/T01-dragon-v1/conceptos $R/T02-cuncuna-v1/conceptos
$L alfa $R/T00-referencias/ciempi-base-alfa-para-siluetas.png $R/T00-referencias/ciempi-sin-gorro.png
B=$R/T00-referencias/ciempi-base-alfa-para-siluetas.png
D=$R/T01-dragon-v1/ia
C=$R/T02-cuncuna-v1/ia
$L conceptos $R/T01-dragon-v1/conceptos/lamina-conceptos.png $D/concepto-d1-desfile.png $D/concepto-d2-bebe.png $D/concepto-d3-hojas.png
$L conceptos $R/T02-cuncuna-v1/conceptos/lamina-conceptos.png $C/concepto-c1-esponjosa.png $C/concepto-c2-penachos.png $C/concepto-c3-chilena.png
$L siluetas $R/T01-dragon-v1/conceptos/siluetas.png $B $D/concepto-d1-desfile.png $D/concepto-d2-bebe.png $D/concepto-d3-hojas.png
$L siluetas $R/T02-cuncuna-v1/conceptos/siluetas.png $B $C/concepto-c1-esponjosa.png $C/concepto-c2-penachos.png $C/concepto-c3-chilena.png
