const B = 'http://127.0.0.1:3297'
const pedir = async (m, ruta, token, cuerpo) => {
  const r = await fetch(B + ruta, { method: m, headers: { ...(cuerpo ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: cuerpo ? JSON.stringify(cuerpo) : undefined })
  const d = await r.json().catch(() => null)
  if (!r.ok) throw new Error(`${m} ${ruta} ${r.status} ${JSON.stringify(d)}`)
  return d
}
const M = (await pedir('POST', '/api/registro', null, { correo: 'mama@test.cl', clave: 'clave-mama-1', nombreVisible: 'Carolina', rol: 'apoderado' })).token
const p = await pedir('POST', '/api/perfiles', M, { apodo: 'Tomás', icono: '🦊', usuario: 'tomas', clave: 'tomas123' })
const N = (await pedir('POST', '/api/entrar-nino', null, { usuario: 'tomas', clave: 'tomas123' })).token
await pedir('PUT', `/api/perfiles/${p.id}/ciempi`, N, { apariencia: { ...p.ciempi, presentado: true } })
const textos = [
  ['Mi perro Bobi', ['Mi perro se llama Bobi.', 'Bobi corre en el parque.', 'Bobi salta muy alto.', 'Bobi es mi amigo.']],
  ['El volcán', ['El volcán es una montaña.', 'Adentro tiene fuego.', 'A veces sale humo.']],
]
for (const [titulo, frases] of textos) {
  const id = crypto.randomUUID()
  await pedir('PUT', `/api/textos/${id}`, N, { titulo, textoOriginal: frases.join(' '), frases, capitulos: [], origen: 'pegado' })
  const a = await pedir('POST', `/api/perfiles/${p.id}/asignaciones`, N, { textoId: id })
  console.log(titulo, a.autorizacion)
}
console.log(JSON.stringify({ M, N, perfil: p.id }))
