# PIN del adulto para los textos propios del niño

Rama `expansion-v3-pin-textos` (desde `dcab7d5`). Decisión aprobada por la
usuaria (CONTINUIDAD-SESION §7.1, «Textos del niño»): el niño sigue pudiendo
agregar sus textos; el adulto los autoriza con un PIN verificado en el
servidor; un texto pendiente no paga; al aprobarse empieza a pagar, sin pagar
dos veces; lo que ya existe queda autorizado.

## 1. Antes (estado en `dcab7d5`, revisado antes de cambiar nada)

### 1.1 Cómo agrega un texto el niño

| Paso | Archivo:línea (`dcab7d5`) | Qué pasa |
|---|---|---|
| Botón «Agregar libro» en «Mis libros» | `src/biblioteca/PantallaBiblioteca.tsx:108` | Visible para el niño (y para el adulto en la sesión del alumno). |
| Vista `agregarLibro` | `src/App.tsx:252-255` → `src/biblioteca/PantallaAgregarLibro.tsx` | Reutiliza `AgregarLibro` del panel de adultos. |
| PDF o «Escribir o pegar» | `src/adultos/AgregarLibro.tsx` | Sin ninguna pregunta al adulto. |
| Guardar texto y asignarlo | `src/adultos/cargas.tsx:62-65` | `repos.textos.guardar` → `PUT /api/textos/:id`; `repos.asignaciones.asignar` → `POST /api/perfiles/:id/asignaciones`. |
| Servidor: texto | `server/src/app.ts:518` | Cualquier usuario con sesión (niño incluido) sube texto propio. |
| Servidor: asignación | `server/src/app.ts:578-586` | El niño puede agregarse cualquier texto que pueda ver. Lo único que distingue al adulto es el **nivel** (el niño queda en el sugerido). |
| Lectura y premio | `server/src/app.ts:670` (`POST /api/asignaciones/:id/premios`) → `server/src/premios.ts:140` (`otorgarPremio`) | El texto del niño **paga monedas igual que un cuento** desde el primer momento (con las reglas y el reloj del servidor, sin otra condición). Con una app anterior, `PUT /api/asignaciones/:id/progreso` (`app.ts:616`) también paga por su avance. |

### 1.2 Qué «PIN» existía y qué protegía

- `src/dominio/tipos.ts:107-108`: `PerfilNino.pinHash`, comentado como «Hash del
  PIN opcional. Es solo para elegir perfil, no es seguridad».
- `server/src/app.ts:81`: el servidor siempre lo entrega como `pinHash: null`.
- `src/datos/localStorage/repositoriosLocales.ts:376`: el modo local también lo
  crea en `null`.
- No hay columna de PIN en ninguna migración (`server/sql/001`–`012`), ni ruta
  que lo cree o lo verifique, ni pantalla que lo pida.

**Conclusión: hoy el PIN no protege nada**, ni en el cliente ni en el servidor.
Un niño (o un cliente modificado con el token del niño) puede escribir un texto
cualquiera, agregarlo y cobrar por él. El único freno es económico y general
(reloj del servidor `revisarRitmo`, huella para no cobrar dos veces el mismo
contenido), no una autorización del adulto. Lo que sí está protegido en el
servidor por la sesión del adulto (`conAdulto`/`exigirAdminDe`): cambiar el
nivel, cambiar la clave del niño, invitaciones, ajustes manuales de monedas
con motivo.

### 1.3 Checkpoint WIP `f1c9401` (otro agente, sin compilar ni probar)

Revisado con `git diff dcab7d5 f1c9401`. Base razonable; lo que se conservó y
lo que se corrigió está en §2 y §6.
