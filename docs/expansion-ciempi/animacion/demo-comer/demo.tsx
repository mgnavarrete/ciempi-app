// Demo de E08 Comer sobre el carril de lectura real (src/lectura/Ciempi.tsx con
// `comerAnimado`). Independiente del juego: no usa datos, tienda ni servidor.
// Abrir con `npm run dev` → http://localhost:5173/docs/expansion-ciempi/animacion/demo-comer/
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../../../../src/index.css'
import { APARIENCIA_INICIAL, type AparienciaCiempi } from '../../../../src/ciempi/catalogo'
import { Comida } from '../../../../src/ciempi/dibujos'
import { VestuarioProvider, useEntornoCiempi } from '../../../../src/ciempi/v2/Vestuario'
import { renderCiempi } from '../../../../src/ciempi/v2/arte/componer.js'
import { aSeleccion } from '../../../../src/ciempi/v2/seleccion'
import { escena } from '../../../../src/ciempi/v2/pose'
import { crearRig } from '../../../../src/ciempi/v2/animacion/rig.js'
import { COMER, comer, poseNeutra, type BocaComer } from '../../../../src/ciempi/v2/animacion/animaciones.js'
import { tapaBoca } from '../../../../src/ciempi/v2/animacion/boca'
import { Ciempi } from '../../../../src/lectura/Ciempi'
import type { Fase, Pista } from '../../../../src/lectura/motor'

const CONJUNTOS: Record<string, [string, Partial<AparienciaCiempi>]> = {
  base: ['Base (jockey)', {}],
  mago: ['Gorro de mago + capa + superficie', { cabeza: 'cabeza:b06-ia-mago', espalda: 'espalda:b08-ia-heroica', textura: 'textura:b11-mago' }],
  robot: ['Máscara completa Robot (tapa la boca)', { cabeza: 'cabeza:b07-ia-robot', espalda: 'espalda:b09-robot', textura: 'textura:b11-robot' }],
  espiritu: ['Máscara Espíritu (tapa la boca)', { cabeza: 'cabeza:b07-ia-espiritu' }],
  araluz: ['Máscara AraLuz (tapa la boca)', { cabeza: 'cabeza:b12-araluz' }],
  gatita: ['Máscara Gatita (boca visible)', { cabeza: 'cabeza:b07-ia-gatita' }],
  pirata: ['Sombrero pirata + capa bosque', { cabeza: 'cabeza:b06-ia-pirata', espalda: 'espalda:b08-ia-bosque', textura: 'textura:b11-pirata' }],
}
const GESTOS = ['b03-alegre', 'b03-dormilon', 'b03-enojadito', 'b03-triste', 'b03-guino', 'b03-curioso', 'b03-sorprendido', 'b03-carcajada']
const COMIDAS = ['comida-manzana', 'comida-frutilla', 'comida-platano', 'comida-sandia', 'comida-galleta', 'comida-dona', 'comida-cupcake']
const RITMOS: [string, number][] = [['Manual', 0], ['Lento (900 ms)', 900], ['Realista (500 ms)', 500], ['Rápido (250 ms)', 250], ['Muy rápido (100 ms)', 100]]

const pistas = new Map<number, Pista>()
const pistaDe = (n: number): Pista => pistas.get(n) ?? pistas.set(n, { manzanas: Array.from({ length: n }, (_, i) => 0.08 + (0.84 * (i + 0.5)) / n), fin: 1 }).get(n)!

interface Ajustes { conjunto: string; gesto: string; comida: string; nMax: number; ritmo: number; tranquilo: boolean; comer: boolean; ampliado: boolean; boca: BocaComer }

function apariencia(a: Ajustes): AparienciaCiempi {
  return { ...APARIENCIA_INICIAL, ...CONJUNTOS[a.conjunto][1], gesto: 'gesto:' + a.gesto, comida: a.comida }
}

/** Contador de ms por cuadro (intervalo entre cuadros, promedio y peor del último medio segundo). */
function Medidor() {
  const [txt, setTxt] = useState('…')
  useEffect(() => {
    let previo = performance.now(), id = 0, desde = previo
    const d: number[] = []
    const paso = (t: number) => {
      d.push(t - previo)
      previo = t
      if (t - desde > 500) {
        const prom = d.reduce((s, x) => s + x, 0) / d.length
        setTxt(`${prom.toFixed(1)} ms/cuadro · peor ${Math.max(...d).toFixed(0)} ms · ${(1000 / prom).toFixed(0)} cuadros/s`)
        d.length = 0
        desde = t
      }
      id = requestAnimationFrame(paso)
    }
    id = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(id)
  }, [])
  return <output data-medidor style={{ fontVariantNumeric: 'tabular-nums' }}>{txt}</output>
}

/** Lectura simulada: el dedo avanza de manzana en manzana al ritmo elegido (o con el botón). */
function Carril({ a, reinicio }: { a: Ajustes; reinicio: number }) {
  const pista = pistaDe(a.nMax)
  const [estado, setEstado] = useState({ n: 0, progreso: 0.04, fase: 'esperando' as Fase })
  const ref = useRef(estado)
  ref.current = estado
  useEffect(() => setEstado({ n: 0, progreso: 0.04, fase: 'esperando' }), [reinicio, a.nMax])
  // Automático: el dedo recorre una manzana cada `ritmo` ms.
  useEffect(() => {
    if (!a.ritmo) return
    let id = 0, previo = performance.now()
    const paso = (t: number) => {
      const dt = t - previo
      previo = t
      const e = ref.current
      if (e.fase !== 'completada') {
        const separacion = pista.manzanas.length > 1 ? pista.manzanas[1] - pista.manzanas[0] : 0.5
        const progreso = Math.min(0.97, e.progreso + (separacion * dt) / a.ritmo)
        const n = pista.manzanas.filter((x) => x <= progreso).length
        setEstado({ n, progreso, fase: n >= pista.manzanas.length && progreso >= 0.95 ? 'completada' : 'arrastrando' })
      }
      id = requestAnimationFrame(paso)
    }
    id = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(id)
  }, [a.ritmo, pista])
  Object.assign(window, {
    demo: {
      ...(window as unknown as { demo?: object }).demo,
      siguiente: () => {
        const e = ref.current
        const x = pista.manzanas[e.n]
        if (x === undefined) return setEstado({ ...e, fase: 'completada' })
        setEstado({ n: e.n + 1, progreso: x + 0.002, fase: 'arrastrando' })
      },
    },
  })
  const ciempi = (
    <Ciempi key={a.nMax} pista={pista} palabrasLeidas={estado.n} progreso={estado.progreso} fase={estado.fase} tranquilo={a.tranquilo} apariencia={apariencia(a)} comerAnimado={a.comer} bocaComer={a.boca} />
  )
  return (
    <div>
      <p style={{ margin: '0 0 6px', fontSize: 14 }}>
        Unidades: <b data-unidades>{estado.n}</b> / {a.nMax} · fase {estado.fase}
      </p>
      {/* Tamaño real: el carril del juego mide 84 px de alto. */}
      <div data-carril style={{ width: a.ampliado ? 412 : '100%', maxWidth: 412, zoom: a.ampliado ? 2.6 : 1, padding: '36px 0 4px', background: '#f6ecd8', borderRadius: 18, overflow: 'visible' }}>
        {ciempi}
      </div>
    </div>
  )
}

/** Hoja de cuadros de E08 (rig aislado, 5 segmentos, en tamaño grande). */
function Hoja({ a, instantes }: { a: Ajustes; instantes: number[] }) {
  const { env } = useEntornoCiempi()
  const contenedor = useRef<HTMLDivElement>(null)
  const sel = useMemo(() => aSeleccion(apariencia(a)), [a])
  useLayoutEffect(() => {
    const raiz = contenedor.current
    if (!env || !raiz) return
    const svg = renderCiempi(env, sel)
    const rostro = (e: string) => renderCiempi(env, { ...sel, expresion: e })
    const tapa = tapaBoca(env, sel.cabeza)
    raiz.querySelectorAll('svg[data-cuadro]').forEach((lienzo, i) => {
      const g = lienzo.querySelector('g')!
      const e = escena(svg, 5, 'hoja' + i)
      g.innerHTML = e.html
      const rig = crearRig(g, { cabeza: String(sel.cabeza), expresion: String(sel.expresion) }, rostro, { prefijo: `hoja${i}-`, dibujos: { comida: '<use href="#hoja-comida"/>' } })
      // E08 suelto (sin caminar), con la boca elegida y la reacción sin boca si la máscara la tapa.
      const p = comer(poseNeutra(5), instantes[i], 5, { boca: a.boca, bocaTapada: tapa })
      rig.cambiarRostro(p.expresion ?? String(sel.expresion))
      rig.aplicar(p)
    })
  }, [env, sel, instantes, a.boca])
  return (
    <div ref={contenedor} data-hoja style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <g id="hoja-comida"><Comida comida={a.comida} x={0} y={0} tamano={75} /></g>
        </defs>
      </svg>
      {instantes.map((t, i) => (
        <figure key={i} style={{ margin: 0, background: '#fdf8ee', border: '1px solid #e2d6bf', borderRadius: 12 }}>
          <svg data-cuadro={i} viewBox="400 -40 600 520" style={{ width: '100%', display: 'block' }} overflow="hidden"><g /></svg>
          <figcaption style={{ textAlign: 'center', fontSize: 13, paddingBottom: 4 }}>t = {t.toFixed(2)} s</figcaption>
        </figure>
      ))}
    </div>
  )
}

const INSTANTES = [0, 0.06, 0.16, 0.26, 0.34, 0.4, 0.5, 0.66]

function Demo() {
  const [a, setA] = useState<Ajustes>({ conjunto: 'mago', gesto: 'b03-alegre', comida: 'comida-manzana', nMax: 12, ritmo: 500, tranquilo: false, comer: true, ampliado: true, boca: new URLSearchParams(location.search).get('boca') === 'carcajada' ? 'carcajada' : 'sorprendido' })
  const [reinicio, setReinicio] = useState(0)
  const fijar = (p: Partial<Ajustes>) => setA((x) => ({ ...x, ...p }))
  Object.assign(window, { demo: { ...(window as unknown as { demo?: object }).demo, fijar, reiniciar: () => setReinicio((r) => r + 1) } })
  const sel = { padding: '4px 6px', borderRadius: 8, border: '1px solid #c9b994', background: '#fff' }
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 16, color: '#243e5b' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '4px 0' }}>E08 Comer · demo experimental</h1>
      <p style={{ margin: '0 0 12px', maxWidth: 760 }}>
        Carril de lectura real (<code>src/lectura/Ciempi.tsx</code>) con <code>comerAnimado</code>. En el juego está apagado
        (<code>COMER_ANIMADO = false</code>). Tiempos: mordisco a {COMER.mordisco} s, reanuda a {COMER.reanudar} s, total {COMER.duracion} s.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 12, fontSize: 14 }}>
        <label>Vestuario <select style={sel} value={a.conjunto} onChange={(e) => fijar({ conjunto: e.target.value })}>{Object.entries(CONJUNTOS).map(([k, [n]]) => <option key={k} value={k}>{n}</option>)}</select></label>
        <label>Expresión <select style={sel} value={a.gesto} onChange={(e) => fijar({ gesto: e.target.value })}>{GESTOS.map((g) => <option key={g}>{g}</option>)}</select></label>
        <label>Boca <select data-selector-boca style={sel} value={a.boca} onChange={(e) => fijar({ boca: e.target.value as BocaComer })}><option value="sorprendido">sorprendido (inicial, AD-018)</option><option value="carcajada">carcajada (versión 1)</option></select></label>
        <label>Comida <select style={sel} value={a.comida} onChange={(e) => fijar({ comida: e.target.value })}>{COMIDAS.map((g) => <option key={g}>{g}</option>)}</select></label>
        <label>Unidades <select style={sel} value={a.nMax} onChange={(e) => fijar({ nMax: +e.target.value })}>{[6, 12, 24, 40].map((g) => <option key={g}>{g}</option>)}</select></label>
        <label>Ritmo <select style={sel} value={a.ritmo} onChange={(e) => fijar({ ritmo: +e.target.value })}>{RITMOS.map(([n, v]) => <option key={v} value={v}>{n}</option>)}</select></label>
        <button style={sel} onClick={() => (window as unknown as { demo: { siguiente(): void } }).demo.siguiente()}>Siguiente unidad →</button>
        <button style={sel} onClick={() => setReinicio((r) => r + 1)}>Reiniciar</button>
        <label><input type="checkbox" checked={a.comer} onChange={(e) => fijar({ comer: e.target.checked })} /> Comer animado</label>
        <label><input type="checkbox" checked={a.tranquilo} onChange={(e) => fijar({ tranquilo: e.target.checked })} /> Modo tranquilo (reducido)</label>
        <label><input type="checkbox" checked={a.ampliado} onChange={(e) => fijar({ ampliado: e.target.checked })} /> Ampliado ×2,6</label>
        <Medidor />
      </div>
      <Carril a={a} reinicio={reinicio} />
      <p style={{ fontSize: 13, margin: '8px 0 18px' }}>
        Con <code>prefers-reduced-motion</code> del sistema Ciempi no se anima (como en el juego) y la fruta desaparece sin vuelo.
        En modo tranquilo, amplitud 35 % y sin partículas: tampoco hay vuelo de la fruta.
      </p>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '8px 0' }}>Hoja de cuadros (5 segmentos)</h2>
      <Hoja a={a} instantes={INSTANTES} />
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <VestuarioProvider>
    <Demo />
  </VestuarioProvider>,
)
