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

// v4.2: `alto` = alto de la bolsa en v1 (encuadre B09); `centro` = centro de la bolsa en coordenadas
// del segmento delantero (radio 96); `correas`: punto de salida en la bolsa (fracciones de su caja
// desde el centro) y ángulo de la silueta por donde la correa pasa al lado lejano.
const CORREAS = [{ desde: [0.36, 0.02], silueta: -81 }, { desde: [0.36, 0.3], silueta: -61 }]
export const V4_MOCHILAS = {
  'b09-aventura': bolsa('aventura', { alto: 168, centro: [-78, -62], giro: -10, correas: CORREAS, correa: { color: '#a8662b' } }),
  'b09-draco': bolsa('draco', { alto: 180, centro: [-78, -64], giro: -10, correas: CORREAS, correa: { color: '#2a9d8f' } }),
  'b09-mago': bolsa('mago', { alto: 144, centro: [-82, -56], giro: -8, correas: [{ desde: [0.4, 0.1], silueta: -81 }, { desde: [0.4, 0.32], silueta: -61 }], correa: { color: '#e2b23a' }, borde: { color: '#f2c23a', interior: 9, exterior: 18 } }),
  'b09-raton': bolsa('raton', { alto: 178, centro: [-78, -66], giro: -10, correas: CORREAS, correa: { color: '#c97a33' } }),
  'b09-robot': bolsa('robot', { alto: 163, centro: [-80, -62], giro: -10, correas: CORREAS, correa: { color: '#e2a52f' } }),
  'b09-cometa': bolsa('cometa', { alto: 160, centro: [-80, -62], giro: -10, correas: CORREAS, correa: { color: '#1f6f7a' } }),
}

export const V4_CALZADO = {
  'b10-robot': { px: [512, 423], suela: 419, ancho: 80, boca: { izq: [62, 36], der: [268, 40], labio: [170, 63], arriba: 5 } },
  'b10-aventura': { px: [512, 413], suela: 410, ancho: 84, boca: { izq: [88, 45], der: [210, 34], labio: [148, 68], arriba: 13 } },
  'b10-lluvia': { px: [512, 456], suela: 450, ancho: 74, boca: { izq: [48, 33], der: [300, 30], labio: [165, 52], arriba: 4 } },
  'b10-mago': { px: [512, 275], suela: 270, ancho: 86, boca: { izq: [42, 28], der: [205, 40], labio: [120, 56], arriba: 4 } },
  'b10-deportiva': { px: [512, 325], suela: 318, ancho: 92, boca: { izq: [100, 55], der: [222, 52], labio: [160, 76], arriba: 28 } },
  'b10-cometa': { px: [512, 451], suela: 446, ancho: 80, boca: { izq: [52, 50], der: [288, 50], labio: [170, 80], arriba: 5 } },
}
for (const z of Object.values(V4_CALZADO)) { z.boca.x0 = z.boca.izq[0]; z.boca.x1 = z.boca.der[0] }
