/**
 * Fondos ilustrados (v2.7): WebP apaisados ~16:10 en public/ciempi-v2/fondos/<id>.webp,
 * con el suelo en el 25 % inferior. Los 6 fondos originales siguen dibujados en SVG.
 */
export const FONDOS_IMAGEN: ReadonlySet<string> = new Set([
  'fondo-bosque', 'fondo-playa', 'fondo-ciudad', 'fondo-castillo', 'fondo-arrecife', 'fondo-nubes',
])

/** Ruta pública del WebP de un fondo ilustrado. */
export const rutaFondo = (id: string) => `/ciempi-v2/fondos/${id}.webp`
