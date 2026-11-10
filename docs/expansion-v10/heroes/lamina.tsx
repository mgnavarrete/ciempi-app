// Lámina de los 10 conjuntos de héroes en el juego: el camino real de composición
// (Vestuario → useEscena → rig), igual que docs/expansion-v9/capitan-cometa/lamina.tsx.
// Por conjunto: conjunto, conjunto + pieza de espalda, zooms de cabeza y espalda, Dragón,
// caminar, tamaño pequeño (120 px) y tarjetas de la tienda. ?solo=coloso,solar filtra.
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

// slug → [cabeza, espalda]
const HEROES: [string, string, string][] = [
  ['coloso', 'cabeza:b06-ia-coloso', 'espalda:b09-coloso'],
  ['aracnido', 'cabeza:b07-ia-aracnido', 'espalda:b09-aracnido'],
  ['ilusionista', 'cabeza:b06-ia-ilusionista', 'espalda:b08-ia-ilusionista'],
  ['solar', 'cabeza:b07-ia-solar', 'espalda:b08-ia-solar'],
  ['nocturno', 'cabeza:b07-ia-nocturno', 'espalda:b08-ia-nocturno'],
  ['bromista', 'cabeza:b06-ia-bromista', 'espalda:b09-bromista'],
  ['esmeralda', 'cabeza:b07-ia-esmeralda', 'espalda:b09-esmeralda'],
  ['sombra', 'cabeza:b07-ia-sombra', 'espalda:b09-sombra'],
  ['travieso', 'cabeza:b07-ia-travieso', 'espalda:b09-travieso'],
  ['garra', 'cabeza:b07-ia-garra', 'espalda:b09-garra'],
  ['trueno', 'cabeza:b07-ia-trueno', 'espalda:b08-ia-trueno'],
  ['relampago', 'cabeza:b07-ia-relampago', 'espalda:b09-relampago'],
  ['pantera', 'cabeza:b07-ia-pantera', 'espalda:b08-ia-pantera'],
  ['mistico', 'cabeza:b06-ia-mistico', 'espalda:b08-ia-mistico'],
  ['marino', 'cabeza:b06-ia-marino', 'espalda:b09-marino'],
  ['kpopvioleta', 'cabeza:b06-ia-kpopvioleta', 'espalda:b09-kpopvioleta'],
  ['kpoprosa', 'cabeza:b06-ia-kpoprosa', 'espalda:b09-kpoprosa'],
  ['kpopazul', 'cabeza:b06-ia-kpopazul', 'espalda:b09-kpopazul'],
  ['unicornio', 'cabeza:b07-ia-unicornio', 'espalda:b08-ia-unicornio'],
  ['hada', 'cabeza:b06-ia-hada', 'espalda:b08-ia-hada'],
  ['sombrio', 'cabeza:b07-ia-sombrio', 'espalda:b09-sombrio'],
  ['hielo', 'cabeza:b06-ia-hielo', 'espalda:b08-ia-hielo'],
]

interface CeldaProps { a: AparienciaCiempi; n?: number; anim?: string; t?: number; zoom?: 'cabeza' | 'espalda'; ancho?: number; oscuro?: boolean }
function Celda({ a, n = 5, anim, t = 0, zoom, ancho = 300, oscuro }: CeldaProps) {
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
  const vb = zoom === 'cabeza' ? `${x + w - 420} 60 400 380` : zoom === 'espalda' ? `${x + w - 820} 170 560 380` : e?.viewBox ?? '0 0 1000 650'
  const alto = zoom ? (ancho * 380) / (zoom === 'cabeza' ? 400 : 560) : (ancho * 650) / w
  return (
    <svg data-celda="" data-listo={listo ? '' : undefined} viewBox={vb} width={ancho} height={alto} style={{ display: 'block', background: oscuro ? '#243347' : '#fdf8ee', borderRadius: 6 }} overflow="hidden">
      <g ref={g} />
    </svg>
  )
}

function Tarjeta({ id }: { id: string }) {
  const item = buscarItem(id)
  if (!item) return <div style={{ width: 130, color: 'red', font: '12px monospace' }}>falta {id}</div>
  return (
    <div style={{ width: 130, background: '#fff', borderRadius: 14, border: '2px solid #e6dcc8', padding: 6, textAlign: 'center', font: '600 12px system-ui', color: '#243e5b' }}>
      {item.categoria === 'conjunto' || item.categoria === 'textura' ? (
        <Celda a={item.categoria === 'conjunto' ? vestir(id) : ponerItem(APARIENCIA_INICIAL, item)} ancho={116} />
      ) : (
        <div style={{ width: 116, height: 96, display: 'flex' }}><MiniaturaAccesorio item={item} apariencia={APARIENCIA_INICIAL} className="h-full w-full" /></div>
      )}
      <div style={{ marginTop: 3 }}>{item.nombre}</div>
      <div style={{ color: '#b07b14' }}>🪙 {precioDe(item, [])}</div>
    </div>
  )
}

const th: React.CSSProperties = { font: '600 13px system-ui', padding: 4, textAlign: 'center', color: '#243e5b' }

function Fila({ slug, cabeza, espalda }: { slug: string; cabeza: string; espalda: string }) {
  const set = `conjunto:b12-set-${slug}`
  const conj = buscarItem(set)
  const esCapa = espalda.startsWith('espalda:b08')
  const ESP = { espalda }
  return (
    <>
      <tr><td colSpan={8} style={{ font: '700 17px system-ui', color: '#243e5b', paddingTop: 10 }}>{conj?.nombre ?? set} <span style={{ font: '400 12px monospace', color: '#6b7c8f' }}>{set}</span></td></tr>
      <tr>
        <td><Celda a={vestir(set, esCapa ? {} : { espalda: 'espalda:espalda-nada' })} ancho={300} /></td>
        <td><Celda a={vestir(set, ESP)} ancho={300} /></td>
        <td><Celda a={vestir(set, ESP)} zoom="cabeza" ancho={240} /></td>
        <td><Celda a={vestir(null, { cabeza })} zoom="cabeza" ancho={240} /></td>
        <td><Celda a={vestir(set, ESP)} zoom="espalda" ancho={300} /></td>
        <td><Celda a={vestir(set, ESP, 'variante:dragon-clasico')} ancho={300} /></td>
        <td><Celda a={vestir(set, ESP)} anim="A02" t={0.5} ancho={260} /></td>
        <td><Celda a={vestir(set, ESP)} ancho={120} oscuro /></td>
      </tr>
      <tr><td colSpan={8}><div style={{ display: 'flex', gap: 6 }}>{[cabeza, `textura:b11-${slug}`, `pies:b10-${slug}`, espalda, set].map((id) => <Tarjeta key={id} id={id} />)}</div></td></tr>
    </>
  )
}

function Lamina({ titulo, solo }: { titulo: string; solo: string[] }) {
  const lista = HEROES.filter(([s]) => (!solo.length || solo.includes(s)) && buscarItem(`conjunto:b12-set-${s}`))
  return (
    <div id="lamina" style={{ padding: 12, width: 'max-content' }}>
      <h1 style={{ font: '700 20px system-ui', margin: '0 0 8px', color: '#243e5b' }}>{titulo}</h1>
      <table style={{ borderCollapse: 'separate', borderSpacing: 6 }}>
        <thead><tr>{['Conjunto', 'Conjunto + espalda', 'Cabeza (zoom)', 'Solo la cabeza', 'Espalda (zoom)', 'Dragón', 'Caminar t=0.5', '120 px oscuro'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>{lista.map(([s, c, e]) => <Fila key={s} slug={s} cabeza={c} espalda={e} />)}</tbody>
      </table>
    </div>
  )
}

const q = new URLSearchParams(location.search)
const titulo = q.get('titulo') ?? 'Héroes de Ciempi'
const solo = (q.get('solo') ?? '').split(',').filter(Boolean)
Object.assign(window, {
  lamina: {
    listo: () => document.querySelectorAll('[data-celda]').length > 0 && !document.querySelector('[data-celda]:not([data-listo])'),
    decodificar: () => Promise.all([...document.querySelectorAll('image, img')].map((im) => (im as SVGImageElement).decode?.().catch(() => {}))),
  },
})
createRoot(document.getElementById('root')!).render(
  <VestuarioProvider>
    <Lamina titulo={titulo} solo={solo} />
  </VestuarioProvider>,
)
