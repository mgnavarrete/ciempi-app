// Lámina del conjunto Capitán Cometa (2.8.2) en el juego: el camino real de
// composición (Vestuario → useEscena → rig), en Ciempi y en las criaturas, con
// el escudo en la espalda, al crecer y al caminar, y las tarjetas de la tienda.
// Al lado, el conjunto Robot aprobado como referencia de formato.
import { useLayoutEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../../../src/index.css'
import { APARIENCIA_INICIAL, buscarItem, ponerItem, precioDe, type AparienciaCiempi } from '../../../src/ciempi/catalogo'
import { VestuarioProvider, useEscena } from '../../../src/ciempi/v2/Vestuario'
import { MiniaturaAccesorio } from '../../../src/ciempi/v2/MiniaturaAccesorio'
import { criaturaLista } from '../../../src/ciempi/v2/criaturas/base'
import { ANIMACIONES } from '../../../src/ciempi/v2/animacion/animaciones.js'
import { poseConInercia } from '../../../src/ciempi/v2/animacion/motor.js'
import { crearRig } from '../../../src/ciempi/v2/animacion/rig.js'

const vestir = (conjunto: string | null, extra: Partial<AparienciaCiempi> = {}, criatura: string | null = null): AparienciaCiempi => {
  const base = conjunto ? ponerItem(APARIENCIA_INICIAL, buscarItem(conjunto)!) : APARIENCIA_INICIAL
  return { ...base, ...extra, criatura } as AparienciaCiempi
}
const COMETA = 'conjunto:b12-set-cometa'
const ROBOT = 'conjunto:b12-set-robot'
const ESCUDO = { espalda: 'espalda:b09-cometa' }

interface CeldaProps { a: AparienciaCiempi; n?: number; anim?: string; t?: number; zoom?: 'cabeza' | 'espalda'; ancho?: number }
function Celda({ a, n = 5, anim, t = 0, zoom, ancho = 300 }: CeldaProps) {
  const criatura = (a as AparienciaCiempi & { criatura?: string | null }).criatura ?? null
  const e = useEscena(a, n)
  const g = useRef<SVGGElement>(null)
  const [listo, setListo] = useState(false)
  useLayoutEffect(() => {
    if (!e || !g.current) return
    g.current.innerHTML = e.html
    const rig = crearRig(g.current, { cabeza: e.cabeza, expresion: e.expresion }, e.rostro, { prefijo: e.prefijo })
    if (anim) rig.aplicar(poseConInercia(ANIMACIONES.find((x) => x.id === anim)!, t, n))
    setListo(!criatura || criaturaLista(criatura))
  }, [e])
  const [x, , w] = (e?.viewBox ?? '0 0 1000 650').split(' ').map(Number)
  const vb = zoom === 'cabeza' ? `${x + w - 420} 120 400 320` : zoom === 'espalda' ? `${x + w - 640} 170 400 320` : e?.viewBox ?? '0 0 1000 650'
  const alto = zoom ? (ancho * 320) / 400 : (ancho * 650) / w
  return (
    <svg data-celda="" data-listo={listo ? '' : undefined} viewBox={vb} width={ancho} height={alto} style={{ display: 'block', background: '#fdf8ee', borderRadius: 6 }} overflow="hidden">
      <g ref={g} />
    </svg>
  )
}

function Tarjeta({ id }: { id: string }) {
  const item = buscarItem(id)!
  return (
    <div style={{ width: 150, background: '#fff', borderRadius: 16, border: '2px solid #e6dcc8', padding: 8, textAlign: 'center', font: '600 13px system-ui', color: '#243e5b' }}>
      {item.categoria === 'conjunto' || item.categoria === 'textura' ? (
        <Celda a={item.categoria === 'conjunto' ? vestir(id) : ponerItem(APARIENCIA_INICIAL, item)} ancho={134} />
      ) : (
        <div style={{ width: 134, height: 110, display: 'flex' }}><MiniaturaAccesorio item={item} apariencia={APARIENCIA_INICIAL} className="h-full w-full" /></div>
      )}
      <div style={{ marginTop: 4 }}>{item.nombre}</div>
      <div style={{ color: '#b07b14' }}>🪙 {precioDe(item, [])}</div>
      <div style={{ font: '400 10px monospace', color: '#6b7c8f' }}>{id}</div>
    </div>
  )
}

const th: React.CSSProperties = { font: '600 13px system-ui', padding: 4, textAlign: 'center', color: '#243e5b' }
const h2: React.CSSProperties = { font: '700 16px system-ui', margin: '14px 0 4px', color: '#243e5b' }
const CRIATURAS: [string, string][] = [
  ['Dragón', 'variante:dragon-clasico'],
  ['Cuncuna', 'variante:cuncuna-clasica'],
  ['Serpiente', 'variante:serpiente-caramelo'],
  ['Camaleón', 'variante:camaleon-lima'],
]

function Lamina({ titulo }: { titulo: string }) {
  return (
    <div id="lamina" style={{ padding: 12, width: 'max-content' }}>
      <h1 style={{ font: '700 20px system-ui', margin: '0 0 8px', color: '#243e5b' }}>{titulo}</h1>
      <table style={{ borderCollapse: 'separate', borderSpacing: 6 }}>
        <thead><tr>{['Robot + propulsor (referencia)', 'Capitán Cometa (conjunto)', 'Conjunto + escudo', 'Casco (zoom)', 'Escudo (zoom)'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>
          <tr>
            <td><Celda a={vestir(ROBOT, { espalda: 'espalda:b09-robot' })} ancho={300} /></td>
            <td><Celda a={vestir(COMETA)} ancho={300} /></td>
            <td><Celda a={vestir(COMETA, ESCUDO)} ancho={300} /></td>
            <td><Celda a={vestir(COMETA, ESCUDO)} zoom="cabeza" ancho={300} /></td>
            <td><Celda a={vestir(COMETA, ESCUDO)} zoom="espalda" ancho={300} /></td>
          </tr>
        </tbody>
      </table>
      <h2 style={h2}>Criaturas con el conjunto y el escudo</h2>
      <table style={{ borderCollapse: 'separate', borderSpacing: 6 }}>
        <thead><tr>{CRIATURAS.map(([n]) => <th key={n} style={th}>{n}</th>)}</tr></thead>
        <tbody>
          <tr>{CRIATURAS.map(([n, c]) => <td key={n}><Celda a={vestir(COMETA, ESCUDO, c)} ancho={360} /></td>)}</tr>
          <tr>{CRIATURAS.map(([n, c]) => <td key={n}><Celda a={vestir(COMETA, ESCUDO, c)} zoom="cabeza" ancho={360} /></td>)}</tr>
        </tbody>
      </table>
      <h2 style={h2}>Crecimiento y animaciones (Ciempi con conjunto + escudo)</h2>
      <table style={{ borderCollapse: 'separate', borderSpacing: 6 }}>
        <thead><tr>{['N=1', 'N=12', 'Caminar t=0.5', 'Caminar t=1.6', 'Tropezar t=0.9'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>
          <tr>
            <td><Celda a={vestir(COMETA, ESCUDO)} n={1} ancho={260} /></td>
            <td><Celda a={vestir(COMETA, ESCUDO)} n={12} ancho={260} /></td>
            <td><Celda a={vestir(COMETA, ESCUDO)} anim="A02" t={0.5} ancho={260} /></td>
            <td><Celda a={vestir(COMETA, ESCUDO)} anim="A02" t={1.6} ancho={260} /></td>
            <td><Celda a={vestir(COMETA, ESCUDO)} anim="E04" t={0.9} ancho={260} /></td>
          </tr>
        </tbody>
      </table>
      <h2 style={h2}>Tarjetas de la tienda (miniatura del juego, nombre y precio)</h2>
      <div style={{ display: 'flex', gap: 8 }}>
        {['cabeza:b07-ia-cometa', 'textura:b11-cometa', 'pies:b10-cometa', 'espalda:b09-cometa', COMETA].map((id) => <Tarjeta key={id} id={id} />)}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {['cabeza:b07-ia-robot', 'textura:b11-robot', 'pies:b10-robot', 'espalda:b09-robot', ROBOT].map((id) => <Tarjeta key={id} id={id} />)}
      </div>
    </div>
  )
}

const titulo = new URLSearchParams(location.search).get('titulo') ?? 'Capitán Cometa'
Object.assign(window, {
  lamina: {
    listo: () => document.querySelectorAll('[data-celda]').length > 0 && !document.querySelector('[data-celda]:not([data-listo])'),
    decodificar: () => Promise.all([...document.querySelectorAll('image, img')].map((im) => (im as SVGImageElement).decode?.().catch(() => {}))),
  },
})
createRoot(document.getElementById('root')!).render(
  <VestuarioProvider>
    <Lamina titulo={titulo} />
  </VestuarioProvider>,
)
