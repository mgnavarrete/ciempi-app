// Lámina de las 10 comidas tal como las dibuja `Comida` (un solo render: ids únicos).
import { renderToStaticMarkup } from 'react-dom/server'
import { Comida } from '/src/ciempi/dibujos'

const IDS = ['comida-manzana', 'comida-frutilla', 'comida-platano', 'comida-sandia', 'comida-galleta', 'comida-pelota', 'comida-dona', 'comida-cupcake', 'comida-pizza', 'comida-helado']
const PASO = 44
const ANCHO = IDS.length * PASO + 20

function Pista({ t }: { t: number }) {
  return (
    <div className="p">
      <svg width={ANCHO} height={44} viewBox={`0 0 ${ANCHO} 44`}>
        {IDS.map((id, i) => <Comida key={id} comida={id} x={32 + i * PASO} y={22} tamano={t} />)}
      </svg>
    </div>
  )
}

function Lamina({ titulo }: { titulo: string }) {
  return (
    <>
      <h1>{titulo}</h1>
      <div className="g">
        {IDS.map((id) => (
          <div className="c" key={id}>
            <svg viewBox="-16 -16 32 32" width={150} height={150}><Comida comida={id} x={0} y={0} tamano={12} /></svg>
            <span>{id.replace('comida-', '')}</span>
          </div>
        ))}
      </div>
      <h2>Tamaño de pista 1:1 (tamano 10 y 14, rango real de la pista) y tienda (36 px)</h2>
      <Pista t={10} />
      <Pista t={14} />
      <div className="p">
        <svg width={ANCHO} height={44}>
          {IDS.map((id, i) => (
            <svg key={id} x={10 + i * PASO} y={4} width={36} height={36} viewBox="-16 -16 32 32"><Comida comida={id} x={0} y={0} tamano={12} /></svg>
          ))}
        </svg>
      </div>
      <h2>Pista tamano 10, captura ampliada x3 (píxeles reales)</h2>
      <div className="z"><Pista t={10} /></div>
    </>
  )
}

export function lamina(titulo: string) {
  return `<!doctype html><meta charset=utf-8><style>body{margin:0;padding:20px;background:#fff;font:14px sans-serif;color:#243e5b;width:1780px}h1{font-size:20px}.g{display:flex;gap:12px}.c{display:flex;flex-direction:column;align-items:center;background:#f6efe0;border-radius:12px;padding:6px}.p{background:#f3e9d2;border:2px solid #e2d6bf;border-radius:30px;padding:6px 10px;width:fit-content;margin:6px 0}.z{transform:scale(3);transform-origin:0 0;height:auto}</style>${renderToStaticMarkup(<Lamina titulo={titulo} />)}`
}
