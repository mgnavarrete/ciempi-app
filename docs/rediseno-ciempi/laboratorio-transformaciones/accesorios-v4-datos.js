// Medidas de la construcción v4 (laboratorio). Coordenadas de imagen en px del recurso.
//
// Calzado (recurso B10 sin cambios, public/ciempi-v2/): `px` tamaño; `suela` y de la
// suela; `boca` = abertura del zapato: extremos izquierdo/derecho del borde delantero,
// punto más bajo del labio delantero y borde superior de la boca (borde trasero).
// `ancho` en unidades de la base (B10 v1 usaba 88 para todos).
//
// Mochilas (maestros IA V4 sin correas, recursos/accesorios-v4/): `base` = centro
// del fondo de la mochila, que se apoya sobre la esfera del segmento delantero;
// `apoyo` = distancia del centro en radios; `giro` = inclinación hacia la cola;
// `correas` = posición de cada anillo a lo largo del cuerpo (en radios, − cola).
import medidas from './recursos/accesorios-v4/medidas.json' with { type: 'json' }

const bolsa = (k, extra) => ({ archivo: medidas[k].archivo, px: medidas[k].px, base: medidas[k].baseInferior, ...extra })

export const V4_MOCHILAS = {
  'b09-aventura': bolsa('aventura', { ancho: 176, giro: -24, apoyo: 0.84, correas: [-0.34, 0.26], correa: { color: '#b9772f', luz: '#e9b46c' }, hebilla: '#d9a441' }),
  'b09-draco': bolsa('draco', { ancho: 176, giro: -24, apoyo: 0.84, correas: [-0.34, 0.26], correa: { color: '#2a9d8f', luz: '#86dccb' }, hebilla: '#f2c23a' }),
  'b09-mago': bolsa('mago', { ancho: 184, giro: -20, apoyo: 0.86, correas: [-0.08], correa: { color: '#2b2a72', luz: '#6a6ad0', ancho: 13 }, hebilla: '#f2c23a' }),
  'b09-raton': bolsa('raton', { ancho: 168, giro: -24, apoyo: 0.84, correas: [-0.34, 0.26], correa: { color: '#4fae9e', luz: '#a6e3d4' }, hebilla: '#e9a35a' }),
  'b09-robot': bolsa('robot', { ancho: 176, giro: -24, apoyo: 0.84, correas: [-0.34, 0.26], correa: { color: '#3b4270', luz: '#7480b8' }, hebilla: '#f2c23a' }),
}

export const V4_CALZADO = {
  'b10-robot': { px: [512, 423], suela: 419, ancho: 80, boca: { izq: [62, 36], der: [268, 40], labio: [170, 63], arriba: 5 } },
  'b10-aventura': { px: [512, 413], suela: 410, ancho: 84, boca: { izq: [88, 45], der: [210, 34], labio: [148, 68], arriba: 13 } },
  'b10-lluvia': { px: [512, 456], suela: 450, ancho: 74, boca: { izq: [48, 33], der: [300, 30], labio: [165, 52], arriba: 4 } },
  'b10-mago': { px: [512, 275], suela: 270, ancho: 100, boca: { izq: [42, 28], der: [205, 40], labio: [120, 56], arriba: 4 } },
  'b10-deportiva': { px: [512, 325], suela: 318, ancho: 92, boca: { izq: [100, 55], der: [222, 52], labio: [160, 76], arriba: 28 } },
}
for (const z of Object.values(V4_CALZADO)) { z.boca.x0 = z.boca.izq[0]; z.boca.x1 = z.boca.der[0] }
