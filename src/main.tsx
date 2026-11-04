import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { DatosProvider } from './datos/DatosProvider'
import './index.css'
import { usarGestoAtras } from './plataforma/telefono'
import { AvisoActualizacion } from './plataforma/actualizacion/AvisoActualizacion'
import { abrirPaquetePendiente } from './plataforma/actualizacion/ota'

usarGestoAtras()

// En la APK, si ya se descargó una versión web más nueva, se pasa a ella antes de dibujar nada.
void abrirPaquetePendiente().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <DatosProvider>
        <App />
      </DatosProvider>
      <AvisoActualizacion />
    </StrictMode>,
  )
})
