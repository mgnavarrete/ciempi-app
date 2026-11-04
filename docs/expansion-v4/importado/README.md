# Recursos artísticos importados desde `main` (sin versionar allí)

Copia hecha el 2026-11-03 al crear `expansion-v4-arte` desde `expansion-v3-integracion` (`b1c1d87`). `main` (`3e188ce`) **no se modificó**: allí siguen los originales sin commitear. Si difieren, la fuente de verdad es `main` hasta que la usuaria decida versionarlos.

Copiados tal cual:
- `CIEMPI_ART_DIRECTION.md` (AD-001…AD-018) y `AGENTS.md`;
- `.agents/skills/ciempi-art-director/`;
- `docs/rediseno-ciempi/laboratorio/` (laboratorio B01–B12, catálogo y aprobaciones) y `docs/rediseno-ciempi/auditoria/`;
- `docs/referencia-artiscita/`;
- `scripts/auditar-vestuario-ciempi.mjs` y `scripts/lib/acabados-armario.mjs`.

No copiados, por tamaño:
- `docs/rediseno-ciempi/revisiones/` de `main` (163 MB, evidencia B06–B12). Consultar en solo lectura en `/mnt/d/Proyectos/ciempi-app/docs/rediseno-ciempi/revisiones/`. T01 y T02 sí están versionados en esta rama.
- `laboratorio-animaciones/` (17 MB): solo lectura en `main`.

`main-scripts-sin-commitear.patch` es el diff sin commitear de `main` en `scripts/` (armario SVG). **No está aplicado** en esta rama; el script de auditoría lo necesita para reproducir exactamente el estado de `main`.
