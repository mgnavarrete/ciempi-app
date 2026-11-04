// Hoja de 8 cuadros de E08 Comer para revisión visual (la usa hoja.mjs).
// Cada cuadro reproduce lo que hace el juego al leer una unidad: caminar (A02)
// con inercia + la capa `comer` + (opcional) movimiento reducido, sobre el rig
// real y la comida equipada. Dos escalas:
//  - 'grande': 280 px de ancho por cuadro, encuadre de cabeza y frente.
//  - 'pista': la escala real del carril de lectura (R/130 con 12 manzanas en
//    412 px de ancho, como src/lectura/Ciempi.tsx), 84 px de alto.
import { useLayoutEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import '../../../../src/index.css'
import { APARIENCIA_INICIAL, type AparienciaCiempi } from '../../../../src/ciempi/catalogo'
import { Comida } from '../../../../src/ciempi/dibujos'
import { VestuarioProvider, useEntornoCiempi } from '../../../../src/ciempi/v2/Vestuario'
import { renderCiempi } from '../../../../src/ciempi/v2/arte/componer.js'
import { aSeleccion } from '../../../../src/ciempi/v2/seleccion'
import { escena, posiciones } from '../../../../src/ciempi/v2/pose'
import { crearRig } from '../../../../src/ciempi/v2/animacion/rig.js'
import { ANIMACIONES, COMER, comer, type BocaComer } from '../../../../src/ciempi/v2/animacion/animaciones.js'
import { tapaBoca } from '../../../../src/ciempi/v2/animacion/boca'
import { poseConInercia, reducir } from '../../../../src/ciempi/v2/animacion/motor.js'

export const CONJUNTOS: Record<string, [string, Partial<AparienciaCiempi>]> = {
  base: ['Base', {}],
  mago: ['Mago + capa', { cabeza: 'cabeza:b06-ia-mago', espalda: 'espalda:b08-ia-heroica', textura: 'textura:b11-mago' }],
  robot: ['Máscara Robot', { cabeza: 'cabeza:b07-ia-robot', espalda: 'espalda:b09-robot', textura: 'textura:b11-robot' }],
  gatita: ['Máscara Gatita', { cabeza: 'cabeza:b07-ia-gatita' }],
}
const INSTANTES = [0, 0.08, 0.16, 0.24, 0.32, 0.38, 0.48, 0.66]

/** Escala del carril con 12 manzanas en 412 px (misma fórmula que Ciempi.tsx). */
function escalaPista(total = 12, ancho = 412) {
  const r = Math.max(9, Math.min(18, ancho / (total * 1.6 + 4)))
  const R = Math.max(17, r * 1.3)
  return { escala: R / 130, tamanoManzana: Math.min(14, Math.max(10, r * 0.85)) }
}

/**
 * Una fila de la hoja. `boca`: variante de E08 de esa fila (si no, la del selector).
 * `cabeza`: otra pieza de cabeza sobre el conjunto (filas generadas desde el catálogo).
 */
interface Fila { conjunto: string; gesto?: string; comida?: string; tranquilo?: boolean; boca?: BocaComer; cabeza?: string }
/**
 * `boca`: variante por omisión (selector de la hoja; AD-018: sorprendido).
 * `mascarasDelCatalogo`: agrega una fila por cada pieza de cabeza con `ocultaRostro` en el catálogo cargado.
 */
interface Ajustes { modo: 'grande' | 'pista'; fondo: string; tinta: string; filas: Fila[]; instantes?: number[]; boca?: BocaComer; mascarasDelCatalogo?: boolean }
const BOCAS: BocaComer[] = ['sorprendido', 'carcajada']

function Cuadro({ fila, t, modo, i, boca }: { fila: Fila; t: number; modo: Ajustes['modo']; i: string; boca: BocaComer }) {
  const { env } = useEntornoCiempi()
  const g = useRef<SVGGElement>(null)
  const pista = escalaPista()
  const n = modo === 'pista' ? 8 : 5
  const a: AparienciaCiempi = { ...APARIENCIA_INICIAL, ...CONJUNTOS[fila.conjunto][1], ...(fila.cabeza ? { cabeza: 'cabeza:' + fila.cabeza } : {}), ...(fila.gesto ? { gesto: 'gesto:' + fila.gesto } : {}), comida: fila.comida ?? 'comida-manzana' }
  const sel = aSeleccion(a)
  // Origen de la fruta como en Ciempi.tsx: delante de la boca, a la altura de la pista (la fruta está bajo la cabeza).
  const origen: [number, number] = [COMER.origen[0], 340 + 6 / pista.escala]
  // Pista: 8 segmentos completos y el desborde del gorro (el carril de 84 px deja ver lo que sobresale).
  const vb = modo === 'pista' ? [-200, -40, 1240, 660] : [440, 40, 560, 520]
  useLayoutEffect(() => {
    if (!env || !g.current) return
    const svg = renderCiempi(env, sel)
    const e = escena(svg, n, 'h' + i)
    g.current.innerHTML = e.html
    const rig = crearRig(g.current, { cabeza: String(sel.cabeza), expresion: String(sel.expresion) }, (x) => renderCiempi(env, { ...sel, expresion: x }), { prefijo: `h${i}-`, dibujos: { comida: `<use href="#c${i}"/>` } })
    const A02 = ANIMACIONES.find((x) => x.id === 'A02')!
    const p = poseConInercia(A02, 0.3 + t, n)
    const k = Math.max(0, n - 2)
    const q = posiciones(n)[k]
    // Como CiempiVivo: la variante de boca y, si la pieza de cabeza tapa la boca (catálogo), la reacción sin boca.
    comer(p, t, n, { origen, segmento: [q.x, q.y], boca: fila.boca ?? boca, bocaTapada: tapaBoca(env, sel.cabeza) })
    const final = fila.tranquilo ? reducir(p, 0.35) : p
    rig.cambiarRostro(final.expresion ?? String(sel.expresion))
    rig.aplicar(final)
  })
  const w = modo === 'pista' ? vb[2] * pista.escala : 280
  const h = (w * vb[3]) / vb[2]
  return (
    <svg data-cuadro width={w} height={h} viewBox={vb.join(' ')} overflow="hidden" style={{ display: 'block' }}>
      <defs>
        <g id={`c${i}`}><Comida comida={a.comida} x={0} y={0} tamano={pista.tamanoManzana / pista.escala} /></g>
      </defs>
      <g ref={g} />
    </svg>
  )
}

let fijar: (a: Ajustes) => void = () => {}
const BOCA_INICIAL: BocaComer = new URLSearchParams(location.search).get('boca') === 'carcajada' ? 'carcajada' : 'sorprendido'
function Hoja() {
  const { env } = useEntornoCiempi()
  const [a, setA] = useState<Ajustes | null>(null)
  const [bocaElegida, setBoca] = useState<BocaComer>(BOCA_INICIAL)
  fijar = (x) => { setA(x); if (x.boca) setBoca(x.boca) }
  if (!a) return null
  const instantes = a.instantes ?? INSTANTES
  const chico = a.modo === 'pista'
  const boca = bocaElegida
  // Filas de máscaras que tapan la boca, desde los metadatos del catálogo (no una lista a mano).
  const tapan = a.mascarasDelCatalogo && env ? [...env.hats, ...env.masks].filter((x) => x.ocultaRostro === true && !(x as { historico?: boolean }).historico) : []
  const filas: Fila[] = [...a.filas, ...tapan.map((x) => ({ conjunto: 'base', cabeza: x.id }))]
  const nombre = (f: Fila) => (f.cabeza ? (tapan.find((x) => x.id === f.cabeza)?.nombre ?? f.cabeza) : CONJUNTOS[f.conjunto][0])
  // ¿La fila lleva una pieza que tapa la boca? (catálogo; la etiqueta no promete una boca que no se dibuja)
  const sinBoca = (f: Fila) => tapaBoca(env, f.cabeza ?? String(CONJUNTOS[f.conjunto][1].cabeza ?? '').replace(/^cabeza:/, ''))
  return (
    <div data-hoja style={{ background: a.fondo, color: a.tinta, padding: 12, display: 'inline-block', fontFamily: 'system-ui, sans-serif' }}>
      <label style={{ display: 'block', marginBottom: 8, fontSize: chico ? 12 : 15 }}>
        Boca de E08 (AD-018):{' '}
        <select data-selector-boca value={boca} onChange={(e) => setBoca(e.target.value as BocaComer)}>
          {BOCAS.map((b) => <option key={b} value={b}>{b === 'sorprendido' ? 'sorprendido (inicial)' : 'carcajada (versión 1, comparar)'}</option>)}
        </select>
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: `${chico ? 92 : 110}px repeat(${instantes.length}, auto)`, gap: chico ? 6 : 8, alignItems: 'center' }}>
        <span />
        {instantes.map((t) => <b key={t} style={{ fontSize: chico ? 11 : 14, textAlign: 'center' }}>t = {t.toFixed(2)} s{t === COMER.mordisco ? ' (mordisco)' : ''}</b>)}
        {filas.map((f, fi) => [
          <span key={'n' + fi} style={{ fontSize: chico ? 11 : 14, lineHeight: 1.2 }}>{nombre(f)}{f.gesto ? ` · ${f.gesto.replace('b03-', '')}` : ''}{f.tranquilo ? ' · tranquilo' : ''}{sinBoca(f) ? ' · tapa la boca: sin boca' : ` · boca ${f.boca ?? boca}`}{f.comida && f.comida !== 'comida-manzana' ? ` · ${f.comida.replace('comida-', '')}` : ''}</span>,
          ...instantes.map((t, ti) => <Cuadro key={`${fi}-${ti}-${JSON.stringify(f)}-${boca}`} fila={f} t={t} modo={a.modo} i={`${fi}x${ti}`} boca={boca} />),
        ])}
      </div>
    </div>
  )
}

function Listo() {
  const { env } = useEntornoCiempi()
  Object.assign(window, { hoja: { listo: () => !!env, dibujar: (x: Ajustes) => flushSync(() => fijar(x)) } })
  return null
}

createRoot(document.getElementById('root')!).render(
  <VestuarioProvider>
    <Listo />
    <Hoja />
  </VestuarioProvider>,
)
