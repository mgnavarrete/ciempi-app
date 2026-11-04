// Prueba con los COMPONENTES REALES del juego: CiempiPersonaje (useEscena + CiempiVivo)
// y lectura/Ciempi (useEscenaCreciente + rig.crecer + E08), con `?v=<varianteId>` o sin
// él (Ciempi). Crece de 0 a 40 unidades y come (E08). La usa scripts/criaturas/componentes.mjs.
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { APARIENCIA_INICIAL, type AparienciaCiempi } from '../../../src/ciempi/catalogo'
import { CiempiPersonaje } from '../../../src/ciempi/CiempiPersonaje'
import { MiniaturaCiempi } from '../../../src/ciempi/v2/Miniatura'
import { VestuarioProvider } from '../../../src/ciempi/v2/Vestuario'
import { Ciempi } from '../../../src/lectura/Ciempi'

const q = new URLSearchParams(location.search)
const v = q.get('v')
const base: AparienciaCiempi = { ...APARIENCIA_INICIAL, variantes: {}, ...(v ? { criatura: 'variante:' + v } : {}) } as AparienciaCiempi
const vestida: AparienciaCiempi = { ...base, cabeza: 'cabeza:b06-ia-mago', pies: 'pies:b10-deportiva', espalda: 'espalda:b09-aventura', gesto: 'gesto:b03-curioso' }
const mascara: AparienciaCiempi = { ...base, cabeza: 'cabeza:b07-ia-gatita', textura: 'textura:b11-draco', pies: 'pies:b10-deportiva' }
const MAX = 40
const pista = { manzanas: Array.from({ length: MAX }, (_, i) => (i + 1) / (MAX + 2)), fin: 1 }

function Carril() {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (n >= MAX) { document.body.dataset.crecio = String(n); return }
    const t = setTimeout(() => setN(n + 1), 40)
    return () => clearTimeout(t)
  }, [n])
  return <Ciempi pista={pista} palabrasLeidas={n} progreso={(n + 0.5) / (MAX + 2)} fase={n >= MAX ? 'completada' : 'arrastrando'} tranquilo={false} apariencia={vestida} comerAnimado />
}

createRoot(document.querySelector('#raiz')!).render(
  <StrictMode>
    <VestuarioProvider>
      <div className="fila">
        {[1, 5, 12].map((n) => <div className="caja" key={n} data-caso={'n' + n}><CiempiPersonaje apariencia={base} segmentos={n} ancho="100%" accion={{ id: 'A03', n: 1 }} /></div>)}
        <div className="caja" data-caso="vestida"><CiempiPersonaje apariencia={vestida} segmentos={5} ancho="100%" accion={{ id: 'A04', n: 1 }} /></div>
        <div className="caja" data-caso="mascara"><CiempiPersonaje apariencia={mascara} segmentos={5} ancho="100%" /></div>
        <MiniaturaCiempi apariencia={base} categoria="conjunto" className="caja" />
      </div>
      <div className="carril" data-caso="carril"><Carril /></div>
    </VestuarioProvider>
  </StrictMode>,
)
