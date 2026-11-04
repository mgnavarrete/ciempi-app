# Tienda 2.5: criaturas (rama `v5-tienda`)

Precios calculados con la economía 2.4.1; revisar cuando cambie el modelo económico (E2).

## Qué hay

- `src/ciempi/criaturas.ts`: datos puros (4 especies, 23 variantes con los ids del laboratorio, 4 paquetes).
- `src/ciempi/catalogo.ts`: categorías `especie`, `variante`, `paquete` (fuera de `PARTES`); `loTiene`, `precioDe`,
  `ahorroDe`, `comprarItem`, `soloDesbloqueo`, `ponerItem`, `lleva`, `sinCriatura`, `puedePonerse`;
  `apariencia.criatura` en `normalizarApariencia`. `aSeleccion` (v2/seleccion.ts) agrega
  `criatura`/`varianteEspecie`/`especie` solo si hay criatura.
- Servidor: `PUT /ciempi` valida `criatura` (400 si no existe, 403 si no es suya) y, sin la clave
  (APK anterior), conserva la guardada. `POST /comprar` usa `comprarItem` (sin cambios).
- Interfaz: sección «Criaturas» (`src/ciempi/TiendaCriaturas.tsx`), celebración de la Cuncuna en `PantallaCiempi`.

## Reglas

| Compra | Cobra | Líneas en `compras` |
|---|---|---|
| Variante sin la especie | especie + variante (Dragón 80 + Fuego 24 = 104) | especie, variante |
| Variante con la especie | variante | variante |
| Variante base | la especie (o nada si ya la tiene) | especie |
| Paquete | ⌈80 % de las variantes que faltan⌉ + especie si falta | paquete (0), especie, una por variante |
| Cuncuna (especie, variante o paquete) sin `especie:cuncuna` | error «Gana la Cuncuna leyendo» | — |

Antes de cobrar, la app muestra el desglose y pide confirmación; manda como `precioVisto` el
total mostrado y el servidor rechaza si el total real es mayor (nunca cobra más de lo mostrado).
Los paquetes muestran total y ahorro (Serpiente 58, Camaleón 77, Cuncuna 96, Dragón 116 con la especie).

## Modo local: desbloqueo de la Cuncuna

`src/datos/desbloqueoCuncuna.ts`, con los mismos números del servidor (una prueba los compara):
6 de los 8 cuentos originales de nivel 0 pagados enteros (si quitaron algunos, todos los que queden,
mínimo 4) o 6 cuentos de Ciempi de cualquier nivel. Se revisa después de cada premio y al abrir la tienda.

Diferencias con el servidor:
- No existe la vía del lector lento (60 min y 30 frases de N0): en local no hay un reloj confiable.
- Lo pagado se cuenta por asignación: si se quita un cuento, deja de contar (el servidor lo recuerda).
- No hay regalo de un adulto (necesita cuenta en línea).

## Capturas (390 px, modo local)

`capturar.mjs` (ver cabecera). Las miniaturas `public/criaturas/miniaturas/*.webp` todavía no existen
en esta rama: las tarjetas muestran el emoji de la especie como respaldo, y la vista previa sigue
dibujando a Ciempi hasta que RENDER conecte `apariencia.criatura`.
