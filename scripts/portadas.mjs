// Genera las portadas de los cuentos de Ciempi (public/portadas/cuento-NN.svg):
// un fondo de colores con los dibujos (emoji) del cuento. Uso: node scripts/portadas.mjs
import { writeFileSync } from 'node:fs'

// [número del cuento, colores del fondo (arriba, abajo), dibujo principal, otros dibujos]
const PORTADAS = [
  [17, ['#ffd6e0', '#ff9fb8'], '👩‍👧', ['❤️', '🌷']],
  [18, ['#cdeefd', '#8fd3f4'], '🏠', ['🐈', '🌳']],
  [19, ['#fff3b0', '#ffd34d'], '☀️', ['☁️', '👧']],
  [20, ['#dff5c8', '#a8dd7c'], '🐛', ['🍇', '🍐']],
  [1, ['#e3f7d0', '#9ad66b'], '🐛', ['🍎', '🌼']],
  [2, ['#ffe9a8', '#4b5fa8'], '🌙', ['☀️', '⭐']],
  [3, ['#ffe7c7', '#f7b267'], '🐶', ['🎾', '💧']],
  [4, ['#d6e4f0', '#8aa9c9'], '☔', ['🌧️', '🐸']],
  [5, ['#fff0c9', '#f6c453'], '🏫', ['🐛', '🎒']],
  [6, ['#d4f1ff', '#7cc6f2'], '🪁', ['☁️', '👦']],
  [7, ['#fff6cc', '#9ccc65'], '🌻', ['🌱', '💧']],
  [8, ['#e8f6ff', '#a9d6f5'], '🐧', ['🧣', '❄️']],
  [9, ['#fde2f3', '#c9a7eb'], '🐛', ['👟', '🎵']],
  [10, ['#c9f0ff', '#3fa7d6'], '🌊', ['🐚', '🐟']],
  [11, ['#f3e3c3', '#c69c6d'], '📚', ['🦉', '🚪']],
  [12, ['#d9f0d3', '#6da36d'], '🦌', ['🌲', '🐦']],
  [13, ['#ffe0b5', '#e8794a'], '🦅', ['🌺', '💧']],
  [14, ['#e0f4ff', '#9bd17a'], '🐛', ['⛰️', '🐸']],
  [15, ['#ffe8d6', '#f4a6a6'], '📒', ['✏️', '🌅']],
  [16, ['#1f3b73', '#3d6fb4'], '🏝️', ['⛵', '🐈']],
  // Cuentos con personajes conocidos
  [21, ['#d8f5c8', '#5cb85c'], '💪', ['🔴', '💚']],
  [22, ['#d6e4f0', '#5b7db8'], '⚡', ['🔨', '🌧️']],
  [23, ['#ffe0f0', '#ff8cc6'], '🐱', ['🥛', '💖']],
  [24, ['#e8e0ff', '#7a6bc4'], '🦉', ['✉️', '⚡']],
  [25, ['#ffd9d9', '#d64545'], '🕷️', ['🕸️', '🐱']],
  [26, ['#cfe8ff', '#2f6fd6'], '🦸', ['🚢', '🌊']],
  [27, ['#ffe4f2', '#7fd3f7'], '🏖️', ['👒', '🏰']],
  [28, ['#ffe0c2', '#c0392b'], '🤖', ['🧹', '⭐']],
  [29, ['#fff3c4', '#e04848'], '🧺', ['🍉', '🛡️']],
  [30, ['#e3ecff', '#d64545'], '🕷️', ['📚', '☕']],
  [31, ['#efe2c8', '#8b5a2b'], '📖', ['🐈', '🕯️']],
  [32, ['#ffe4f2', '#f78fb3'], '🐰', ['🥕', '🩺']],
  [33, ['#ffd9d9', '#3155a8'], '🕸️', ['🕷️', '🎵']],
  [34, ['#ffe9b0', '#a83232'], '🧹', ['✨', '🏰']],
  [35, ['#d6ecff', '#2f6fd6'], '🎈', ['🦸', '🎡']],
  [36, ['#e8f7d4', '#f78fb3'], '🌳', ['🦋', '🎭']],
  [37, ['#dfe8f5', '#4a6fa5'], '🤖', ['🌲', '🛡️']],
  [38, ['#ffe0c2', '#b8312f'], '🚀', ['🔧', '⚡']],
  [39, ['#ffe2c2', '#7a3e1d'], '🐉', ['🥚', '🧙']],
  [40, ['#1d1f4a', '#5a4fcf'], '👩‍🚀', ['🪐', '🥬']],
]

const svg = ([n, [arriba, abajo], principal, otros]) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="300" height="400">
  <defs>
    <linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${arriba}"/><stop offset="1" stop-color="${abajo}"/></linearGradient>
  </defs>
  <rect width="300" height="400" fill="url(#f)"/>
  <circle cx="250" cy="60" r="70" fill="#fff" opacity="0.25"/>
  <circle cx="40" cy="330" r="90" fill="#fff" opacity="0.18"/>
  <ellipse cx="150" cy="330" rx="140" ry="34" fill="#000" opacity="0.08"/>
  <g font-family="'Noto Color Emoji','Apple Color Emoji','Segoe UI Emoji',sans-serif" text-anchor="middle">
    <text x="150" y="260" font-size="150">${principal}</text>
    <text x="70" y="110" font-size="72">${otros[0]}</text>
    <text x="235" y="370" font-size="72">${otros[1]}</text>
  </g>
</svg>
`

for (const p of PORTADAS) writeFileSync(new URL(`../public/portadas/cuento-${String(p[0]).padStart(2, '0')}.svg`, import.meta.url), svg(p))
console.log(`${PORTADAS.length} portadas en public/portadas/`)
