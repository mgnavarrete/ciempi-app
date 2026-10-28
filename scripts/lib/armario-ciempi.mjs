// Piezas de exploración, ajustadas al SVG aprobado. IDs iguales al catálogo real.
const ink = '#243e5b'
const wrap = (s) => `<g stroke="${ink}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">${s}</g>`
export const gorros = [
 {id:'cabeza-nada',nombre:'Sin gorro',svg:''},
 {id:'cabeza-jockey',nombre:'Jockey',svg:null},
 {id:'cabeza-gorro-lana',nombre:'Gorro de lana',svg:wrap(`<path d="M610 283 Q592 174 677 158 Q769 142 809 241Z" fill="#49b7b7"/><path d="M634 257 Q614 197 669 170 M670 247 Q649 194 684 167 M709 237 Q704 188 695 167 M749 226 Q748 189 706 168" fill="none" stroke="#278b97" stroke-width="5"/><path d="M606 271 Q702 230 807 229 L817 265 Q701 264 613 303Z" fill="#87d6cb"/>${Array.from({length:11},(_,i)=>`<path d="M${621+i*17} ${269-i*3} l4 23" stroke="#3299a2" stroke-width="3"/>`).join('')}<circle cx="673" cy="143" r="26" fill="#87d6cb"/><path d="M656 132 l13 13 M674 124 v18 M689 133 l-13 13 M687 151 l-15 -4 M665 162 l7 -15" stroke="#3299a2" stroke-width="4"/><rect x="757" y="249" width="24" height="24" rx="5" fill="#fff2ca" stroke-width="4"/><path d="M764 261 l5 -5 5 5 -5 5Z" fill="#efb936" stroke="none"/>`)},
 {id:'cabeza-corona',nombre:'Corona',svg:wrap(`<path d="M622 266 L604 177 L657 208 L685 140 L731 191 L789 151 L804 232Z" fill="#ffcf4c"/><path d="M622 266 L619 244 Q714 212 804 215 L804 241 Q704 242 622 278Z" fill="#efad36"/><path d="M630 218 l-7 -23 30 19 M674 193 l12 -29 18 22" fill="none" stroke="#fff0a2" stroke-width="6"/><path d="M705 216 l12 -19 15 13 -12 20Z" fill="#ef806f" stroke-width="4"/><circle cx="652" cy="239" r="8" fill="#4cb7b6" stroke-width="4"/><circle cx="771" cy="219" r="8" fill="#4cb7b6" stroke-width="4"/>`)},
 {id:'cabeza-mago',nombre:'Mago',svg:wrap(`<path d="M623 259 Q644 163 680 68 Q718 100 748 105 L724 133 L792 234Z" fill="#7863ad"/><path d="M633 250 Q657 147 680 68 L693 130 L670 247Z" fill="#a08bc9" stroke="none"/><path d="M604 281 Q702 221 820 225 Q847 231 815 247 Q695 263 614 298 Q584 301 604 281Z" fill="#62528f"/><path d="M643 239 Q715 212 782 218" fill="none" stroke="#d9ad51" stroke-width="15"/><path d="M690 153 l7 15 17 2 -13 12 3 17 -15 -8 -15 8 3 -17 -12 -12 17 -2Z" fill="#ffe394" stroke-width="3"/><circle cx="727" cy="204" r="5" fill="#ffe394" stroke="none"/>`)},
 {id:'cabeza-astronauta',nombre:'Astronauta',antenna:false,svg:wrap(`<ellipse cx="736" cy="340" rx="165" ry="172" fill="#b8e6e9" fill-opacity=".10" stroke="#f9f4df" stroke-width="19"/><ellipse cx="736" cy="340" rx="177" ry="184" fill="none" stroke-width="6"/><path d="M611 296 Q626 222 704 201" fill="none" stroke="white" stroke-opacity=".85" stroke-width="14"/><path d="M612 330 l-2 17" stroke="white" stroke-width="9"/><path d="M631 478 Q739 523 837 473 L842 496 Q733 545 627 502Z" fill="#4aa6af"/><rect x="564" y="328" width="33" height="63" rx="14" fill="#4aa6af"/><circle cx="581" cy="350" r="7" fill="#ffe394" stroke-width="3"/><path d="M724 154 v-34" fill="none"/><circle cx="724" cy="113" r="11" fill="#ef806f" stroke-width="4"/>`)},
 {id:'cabeza-flor',nombre:'Flor',svg:wrap(`<path d="M635 278 Q611 238 627 212 Q662 232 646 270" fill="#85bb63" stroke-width="5"/><g transform="translate(643 234)">${[0,60,120,180,240,300].map(a=>`<ellipse cx="0" cy="-26" rx="17" ry="25" transform="rotate(${a})" fill="#f49aab" stroke-width="4"/>`).join('')}<circle r="20" fill="#ffdb64" stroke-width="4"/><path d="M-8 -5 Q0 -12 8 -5" stroke="#fff3bd" stroke-width="5" fill="none"/></g>`)},
 {id:'cabeza-orejas-gato',nombre:'Orejas de gato',svg:wrap(`<path d="M614 293 Q679 217 799 246" fill="none" stroke="#74628d" stroke-width="18"/><path d="M618 277 Q592 224 613 178 L679 235Z M746 234 L786 172 Q817 206 802 252Z" fill="#ad9bcb"/><path d="M628 246 L619 205 L653 235Z M767 226 L785 198 L790 233Z" fill="#f3b8c0" stroke-width="4"/>`)},
]
export const caras = [
 {id:'cara-nada',nombre:'Sin lentes',svg:''},
 {id:'cara-lentes',nombre:'Lentes de lector',svg:wrap(`<path d="M671 332 L623 316 M747 330 Q756 317 775 320" fill="none"/><ellipse cx="709" cy="342" rx="42" ry="45" fill="#fff" fill-opacity=".04"/><ellipse cx="811" cy="321" rx="36" ry="42" fill="#fff" fill-opacity=".04"/><path d="M682 328 l10 -13 M787 309 l9 -10" stroke="white" stroke-width="4" opacity=".8"/>`)},
 {id:'cara-lentes-sol',nombre:'Lentes de sol',svg:wrap(`<path d="M662 318 L620 310 M751 319 L775 309" fill="none"/><path d="M666 312 Q707 297 751 312 L748 348 Q716 380 680 354Z M774 300 Q811 282 843 294 L846 326 Q823 358 784 342Z" fill="#315b70"/><path d="M685 324 l20 -8 M792 312 l17 -8" stroke="#9cddd7" stroke-width="7"/>`)},
]
const sole = `<path d="M-41 2 Q-5 17 46 5 L46 15 Q17 31 -40 15 Q-46 12 -41 2Z" fill="#fff9e9" stroke-width="5"/>`
export const zapatos = [
 {id:'pies-zapatillas',nombre:'Zapatillas',svg:null},
 {id:'pies-botas',nombre:'Botas de lluvia',svg:`<path d="M-29 -46 L5 -46 L4 -18 Q41 -23 46 2 L46 12 Q5 26 -40 10 L-38 -17Z" fill="#ffd34e" stroke-width="6"/><path d="M-30 -44 L5 -44 L5 -34 L-31 -34Z" fill="#e5a42e" stroke-width="3"/><path d="M-26 -28 l-2 20" stroke="#fff0a8" stroke-width="5"/>${sole}<path d="M14 -7 l6 -8 6 8 -6 7Z" fill="#f3a33b" stroke-width="2"/>`},
 {id:'pies-pantuflas',nombre:'Pantuflas de conejo',svg:`<ellipse cx="13" cy="-32" rx="8" ry="22" fill="#ffe4e2" stroke-width="4" transform="rotate(-15 13 -32)"/><ellipse cx="31" cy="-32" rx="8" ry="22" fill="#ffe4e2" stroke-width="4" transform="rotate(12 31 -32)"/><path d="M-36 -22 Q-15 -40 2 -25 Q26 -37 43 -11 L47 8 Q9 27 -41 10Z" fill="#efa9b6" stroke-width="6"/>${sole}<circle cx="17" cy="-13" r="2.8" fill="#243e5b" stroke="none"/><circle cx="33" cy="-13" r="2.8" fill="#243e5b" stroke="none"/><path d="M23 -7 l4 0 -2 3Z" fill="#e77787" stroke-width="1.5"/>`},
 {id:'pies-futbol',nombre:'Zapatillas de fútbol',svg:`<path d="M-26 -35 Q-14 -44 0 -35 L10 -20 Q34 -23 45 -4 L47 13 Q20 27 -41 10 Q-45 1 -37 -17Z" fill="#344e65" stroke-width="6"/>${sole}<path d="M-5 -20 l-8 17 M6 -16 l-8 16 M17 -12 l-7 15" stroke="#84d3b0" stroke-width="5"/><path d="M-15 -29 l15 4 M-20 -19 l15 4" stroke="#fff8dc" stroke-width="5"/><path d="M-26 20 v5 M-3 24 v5 M27 23 v5" stroke-width="5"/>`},
]
export const mochilas = [
 {id:'espalda-nada',nombre:'Sin mochila',svg:''},
 {id:'espalda-explorador',nombre:'Mochila exploradora',nuevo:true,svg:wrap(`<g transform="rotate(8 571 351)"><path d="M534 292 Q528 266 553 265 Q575 263 576 289" fill="none" stroke-width="9"/><rect x="504" y="287" width="103" height="133" rx="25" fill="#328e98"/><path d="M506 304 Q540 316 604 301 L601 287 Q553 269 512 289Z" fill="#e5bf80"/><path d="M517 332 Q553 321 592 332 L592 380 Q556 394 518 381Z" fill="#6cb9ac" stroke-width="5"/><path d="M531 299 v44 M577 297 v44" stroke="#d8a05d" stroke-width="12"/><rect x="525" y="322" width="13" height="16" rx="3" fill="#ffdf86" stroke-width="3"/><rect x="571" y="320" width="13" height="16" rx="3" fill="#ffdf86" stroke-width="3"/><path d="M515 396 Q552 408 591 396" fill="none" stroke="#216b80" stroke-width="5"/></g>`)},
]
// Reemplazo de un grupo por ID respetando los grupos SVG anidados.
export function replaceGroup(svg,id,replacement) {
 const start=svg.indexOf(`<g id="${id}"`)
 if(start<0) throw new Error(`Falta el grupo ${id}`)
 const tags=/<\/?g\b[^>]*>/g; tags.lastIndex=start
 let depth=0,m
 while((m=tags.exec(svg))) {
  depth+=m[0].startsWith('</')?-1:1
  if(depth===0)return svg.slice(0,start)+replacement+svg.slice(tags.lastIndex)
 }
 throw new Error(`Grupo sin cierre: ${id}`)
}
export function compose(base, selection) {
 const hat=gorros.find(i=>i.id===selection.cabeza)||gorros[1]
 const face=caras.find(i=>i.id===selection.cara)||caras[0]
 const shoes=zapatos.find(i=>i.id===selection.pies)||zapatos[0]
 const bag=mochilas.find(i=>i.id===selection.espalda)||mochilas[0]
 let svg=base
 if(hat.svg!==null)svg=replaceGroup(svg,'jockey',`<g id="jockey">${hat.svg}</g>`)
 // Antenas detrás del gorro: se conservan, excepto dentro del casco cerrado.
 const match=svg.match(/<g id="antennae"[\s\S]*?<\/g>/)
 if(match){svg=replaceGroup(svg,'antennae',''); if(hat.antenna!==false){const antenna=match[0].replace('M649 220','M649 275').replace('M780 208','M780 265');svg=svg.replace('<g id="head"',`${antenna}<g id="head"`)}}
 if(shoes.svg!==null)svg=svg.replace(/(<g transform="rotate\([^\"]* -10 -32\)">)[\s\S]*?<\/g>/g,`$1${shoes.svg}</g>`)
 svg=svg.replace('<g id="head"',`<g id="backpack">${bag.svg}</g><g id="head"`)
 svg=svg.replace('<g id="jockey"',`<g id="face-accessory">${face.svg}</g><g id="jockey"`)
 return svg.replace(/<title id="title">[\s\S]*?<\/title>/,'<title id="title">Ciempi · Probador de prendas</title>')
}
