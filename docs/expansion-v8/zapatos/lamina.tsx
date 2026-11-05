// Lámina de los zapatos B10 en el juego: el camino real de composición
// (Vestuario → useEscena → rig), con Ciempi y criaturas, en reposo, al crecer y
// en poses de caminar y tropezar. La misma página se compila sobre el árbol de
// antes y el de después (ver lamina.mjs) para comparar.
import { useLayoutEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../../../src/index.css'
import { APARIENCIA_INICIAL, type AparienciaCiempi } from '../../../src/ciempi/catalogo'
import { VestuarioProvider, useEscena } from '../../../src/ciempi/v2/Vestuario'
import { criaturaLista } from '../../../src/ciempi/v2/criaturas/base'
import { ANIMACIONES } from '../../../src/ciempi/v2/animacion/animaciones.js'
import { poseConInercia } from '../../../src/ciempi/v2/animacion/motor.js'
import { crearRig } from '../../../src/ciempi/v2/animacion/rig.js'

export const ZAPATOS = ['pies-zapatillas', 'b10-robot', 'b10-aventura', 'b10-lluvia', 'b10-mago', 'b10-deportiva']
export const CRIATURAS: [string, string | null][] = [
  ['Ciempi', null],
  ['Dragón', 'variante:dragon-clasico'],
  ['Cuncuna', 'variante:cuncuna-clasica'],
  ['Camaleón', 'variante:camaleon-lima'],
  ['Serpiente (cola, sin cambios)', 'variante:serpiente-caramelo'],
]
const apariencia = (pies: string, criatura: string | null): AparienciaCiempi => ({ ...APARIENCIA_INICIAL, pies: `pies:${pies}`, criatura })

interface CeldaProps { pies: string; criatura: string | null; n?: number; anim?: string; t?: number; zoom?: boolean; ancho?: number }
function Celda({ pies, criatura, n = 5, anim, t = 0, zoom = false, ancho = 300 }: CeldaProps) {
  const e = useEscena(apariencia(pies, criatura), n)
  const g = useRef<SVGGElement>(null)
  const [listo, setListo] = useState(false)
  useLayoutEffect(() => {
    if (!e || !g.current) return
    g.current.innerHTML = e.html
    const rig = crearRig(g.current, { cabeza: e.cabeza, expresion: e.expresion }, e.rostro, { prefijo: e.prefijo })
    if (anim) rig.aplicar(poseConInercia(ANIMACIONES.find((a) => a.id === anim)!, t, n))
    // Mientras la criatura carga, useEscena dibuja a Ciempi: lista solo con la criatura preparada.
    setListo(!criatura || criaturaLista(criatura))
  }, [e])
  // Zoom: la franja de las patas (suelo en y ≈ 574).
  const [x, , w] = (e?.viewBox ?? '0 0 1000 650').split(' ').map(Number)
  const vb = zoom ? `${x + w * 0.2} 440 ${w * 0.8} 170` : e?.viewBox ?? '0 0 1000 650'
  const alto = zoom ? (ancho * 170) / (w * 0.8) : (ancho * 650) / w
  return (
    <svg data-celda="" data-listo={listo ? '' : undefined} viewBox={vb} width={ancho} height={alto} style={{ display: 'block', background: '#fdf8ee', borderRadius: 6 }} overflow="hidden">
      <g ref={g} />
    </svg>
  )
}

const th: React.CSSProperties = { font: '600 13px system-ui', padding: 4, textAlign: 'center', color: '#243e5b' }
function Lamina({ titulo }: { titulo: string }) {
  return (
    <div id="lamina" style={{ padding: 12, width: 'max-content' }}>
      <h1 style={{ font: '700 20px system-ui', margin: '0 0 8px', color: '#243e5b' }}>{titulo}</h1>
      <table style={{ borderCollapse: 'separate', borderSpacing: 6 }}>
        <thead><tr><th />{ZAPATOS.map((z) => <th key={z} style={th}>{z === 'pies-zapatillas' ? 'Zapatillas (gratis)' : z}</th>)}</tr></thead>
        <tbody>
          {CRIATURAS.map(([nombre, c]) => [
            <tr key={nombre}><td style={th}>{nombre}</td>{ZAPATOS.map((z) => <td key={z}><Celda pies={z} criatura={c} ancho={230} /></td>)}</tr>,
            <tr key={nombre + 'z'}><td style={th}>patas (zoom)</td>{ZAPATOS.map((z) => <td key={z}><Celda pies={z} criatura={c} ancho={230} zoom /></td>)}</tr>,
          ])}
        </tbody>
      </table>
      <h2 style={{ font: '700 16px system-ui', margin: '12px 0 4px', color: '#243e5b' }}>Crecimiento y animaciones (Botas Lumen y zapatos de luna)</h2>
      <table style={{ borderCollapse: 'separate', borderSpacing: 6 }}>
        <thead><tr><th />{['N=1', 'N=12', 'N=40', 'Caminar t=0.5', 'Caminar t=1.6', 'Tropezar t=0.9', 'Tropezar t=1.5'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>
          {[['Ciempi', null, 'b10-robot'], ['Ciempi', null, 'b10-mago'], ['Dragón', 'variante:dragon-clasico', 'b10-robot'], ['Camaleón', 'variante:camaleon-lima', 'b10-mago'], ['Cuncuna', 'variante:cuncuna-clasica', 'b10-deportiva']].map(([nombre, c, z]) => (
            <tr key={nombre! + z}>
              <td style={th}>{nombre}<br />{z}</td>
              <td><Celda pies={z!} criatura={c} n={1} ancho={190} /></td>
              <td><Celda pies={z!} criatura={c} n={12} ancho={190} /></td>
              <td><Celda pies={z!} criatura={c} n={40} ancho={190} /></td>
              <td><Celda pies={z!} criatura={c} n={5} anim="A02" t={0.5} ancho={190} /></td>
              <td><Celda pies={z!} criatura={c} n={5} anim="A02" t={1.6} ancho={190} /></td>
              <td><Celda pies={z!} criatura={c} n={5} anim="E04" t={0.9} ancho={190} /></td>
              <td><Celda pies={z!} criatura={c} n={5} anim="E04" t={1.5} ancho={190} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const titulo = new URLSearchParams(location.search).get('titulo') ?? 'Zapatos B10'
Object.assign(window, {
  lamina: {
    listo: () => document.querySelectorAll('[data-celda]').length > 0 && !document.querySelector('[data-celda]:not([data-listo])'),
    decodificar: () => Promise.all([...document.querySelectorAll('image')].map((im) => (im as SVGImageElement).decode?.().catch(() => {}))),
  },
})
createRoot(document.getElementById('root')!).render(
  <VestuarioProvider>
    <Lamina titulo={titulo} />
  </VestuarioProvider>,
)
