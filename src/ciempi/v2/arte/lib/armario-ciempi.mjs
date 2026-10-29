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
 {id:'cara-lentes',nombre:'Lentes de lector',svg:wrap(`<path d="M671 332 L623 316 M747 330 Q756 317 775 320" fill="none"/><ellipse cx="709" cy="342" rx="42" ry="45" fill="#344b66"/><ellipse cx="811" cy="321" rx="36" ry="42" fill="#344b66"/><path d="M682 328 l10 -13 M787 309 l9 -10" stroke="white" stroke-width="4" opacity=".8"/>`)},
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
 const face=hat.mask?caras[0]:(caras.find(i=>i.id===selection.cara)||caras[0])
 const shoes=zapatos.find(i=>i.id===selection.pies)||zapatos[0]
 const bag=espaldas.find(i=>i.id===selection.espalda)||espaldas[0]
 let svg=base
 const palette=paletas.find(i=>i.id===selection.paleta)||paletas[0]
 const colorMap=new Map(paletas[0].colors.map((color,i)=>[color,palette.colors[i]]))
 svg=svg.replace(/#[0-9a-fA-F]{6}/g,c=>colorMap.get(c)||c)
 if(palette.id!=='clasica')svg=svg.replaceAll('#e8752b',palette.colors[2])
 const segmentIds=['tail','mint-back','yellow-middle','orange-middle','mint-front']
 svg=svg.replace(/(<g clip-path="url\(#clip-([^)]*)\)">)/g,(_match,opening,id)=>opening+patternSvg(selection.textura,segmentIds.indexOf(id)))
 if(selection.expresion&&selection.expresion!=='alegre'||selection.ojos&&selection.ojos!=='oscuro')svg=replaceGroup(svg,'eyes',eyesSvg(selection.expresion||'alegre',(ojosColores.find(i=>i.id===selection.ojos)||ojosColores[0]).color,palette.colors[1]))
 if(selection.boca&&selection.boca!=='sonrisa')svg=replaceGroup(svg,'mouth',mouthSvg(selection.boca))
 if(hat.svg!==null)svg=replaceGroup(svg,'jockey',`<g id="jockey">${hat.svg}</g>`)
 // Antenas detrás del gorro: se conservan, excepto dentro del casco cerrado.
 const match=svg.match(/<g id="antennae"[\s\S]*?<\/g>/)
 if(match){svg=replaceGroup(svg,'antennae',''); if(hat.antenna!==false){const antenna=match[0].replace('M649 220','M649 275').replace('M780 208','M780 265');svg=svg.replace('<g id="head"',`${antenna}<g id="head"`)}}
 if(shoes.svg!==null||shoes.random){
  const choices=zapatos.filter(i=>!i.random)
  let seed=(Number(selection.seed)||1)>>>0
  for(let i=choices.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[choices[i],choices[j]]=[choices[j],choices[i]]}
  let foot=0
  svg=svg.replace(/(<g transform="rotate\([^"]* -10 -32\)">)[\s\S]*?<\/g>/g,(full,opening)=>{const index=foot++;const piece=shoes.random?choices[index%choices.length]:shoes;if(piece.svg===null)return full;const scoped=piece.svg.replace(/id="([^"]+)"/g,`id="foot${index}-$1"`).replace(/url\(#([^)]*)\)/g,`url(#foot${index}-$1)`);return opening+scoped+'</g>'})
 }
 // Un único accesorio de espalda, visible sobre el cuerpo y bajo la cabeza.
 svg=svg.replace('<g id="head"',`<g id="back-accessory" data-item="${bag.id}">${bag.svg}</g><g id="head"`)
 if(hat.mask || face.svg && face.hideEyes!==false)svg=replaceGroup(svg,'eyes','<g id="eyes" data-hidden="accessory"></g>')
 if(hat.fullFace || face.fullFace)svg=replaceGroup(svg,'mouth','<g id="mouth" data-hidden="mask"></g>')
 svg=svg.replace('<g id="jockey"',`<g id="neck-front">${bag.frontSvg||''}</g><g id="face-accessory">${face.svg}</g><g id="jockey"`)
 return svg.replace(/<title id="title">[\s\S]*?<\/title>/,'<title id="title">Ciempi · Probador de prendas</title>').replace(/<desc id="desc">[\s\S]*?<\/desc>/,`<desc id="desc">Ciempi de cabeza redonda: ${[hat.nombre,face.nombre,shoes.nombre,bag.nombre,palette.nombre].join(', ')}.</desc>`)
}

// Colecciones originales: jardín, magia celeste, fiesta rosa y guardianes del cielo.
const star = 'M0 -24 L7 -8 L24 -7 L12 6 L15 23 L0 15 L-15 23 L-12 6 L-24 -7 L-7 -8Z'
const heart = 'M0 25 C-52 -6 -29 -42 0 -19 C29 -42 52 -6 0 25Z'
const badge = (x,y,scale=1,color='#ffe394') => `<path transform="translate(${x} ${y}) scale(${scale})" d="${star}" fill="${color}" stroke-width="4"/>`
gorros.push(
 {id:'cabeza-lazo',nombre:'Lazo de fiesta',svg:wrap(`<path d="M626 265 Q695 215 798 243" fill="none" stroke="#ce5c93" stroke-width="15"/><g transform="translate(661 230) rotate(-14)"><path d="M0 0 Q-69 -67 -62 -4 Q-69 40 0 0 M0 0 Q62 -63 66 -7 Q72 41 0 0" fill="#ed83b7"/><path d="M-9 5 l-21 59 22 -6 15 11 6 -53 M11 5 l25 50 12 -18 19 0 -38 -35" fill="#d65b99"/><path d="M-45 -17 l29 11 M42 -16 l-25 10" stroke="#ffc9de" stroke-width="6"/><circle r="14" fill="#ffd96a" stroke-width="5"/></g>`)},
 {id:'cabeza-tiara',nombre:'Tiara aurora',svg:wrap(`<path d="M627 269 Q705 230 807 245" stroke="#c977a6" stroke-width="13" fill="none"/><path d="M638 258 Q623 215 665 226 Q662 172 710 210 Q752 163 763 216 Q804 195 799 242" fill="#f2c4dc" stroke="#865879" stroke-width="5"/><path d="M711 232 l-15 -25 16 -26 17 25Z" fill="#a2dedc" stroke-width="4"/>${badge(660,242,.35)}${badge(773,229,.35)}`)},
 {id:'cabeza-sol',nombre:'Sombrero de verano',svg:wrap(`<path d="M626 242 Q623 160 692 163 Q765 155 786 233Z" fill="#f1d49a"/><path d="M628 224 Q702 202 781 216 L786 236 Q699 223 630 245Z" fill="#ef95b0"/><path d="M592 267 Q667 227 800 224 Q884 237 834 268 Q771 286 707 277 Q614 312 590 294 Q564 282 592 267Z" fill="#ffe4ae"/><path d="M610 276 Q688 245 796 242" fill="none" stroke="#d9b87e" stroke-width="4"/><circle cx="775" cy="232" r="18" fill="#ef95b0" stroke-width="4"/><circle cx="775" cy="232" r="7" fill="#ffdc63" stroke-width="3"/>`)},
 {id:'cabeza-mariposa',nombre:'Mariposa del jardín',svg:wrap(`<path d="M625 270 Q707 221 800 245" fill="none" stroke="#87ad79" stroke-width="14"/><g transform="translate(664 215) rotate(-15)"><path d="M0 5 C-92 -72 -79 56 -8 28 C-66 78 10 75 0 5Z" fill="#a899de"/><path d="M0 5 C92 -72 79 56 8 28 C66 78 -10 75 0 5Z" fill="#f2a4c5"/><path d="M-34 -5 Q-52 12 -24 21 M34 -5 Q52 12 24 21" fill="none" stroke="#ffe8b6" stroke-width="7"/><path d="M0 -3 v41 M0 -3 l-12 -15 M0 -3 l12 -15" fill="none" stroke-width="6"/></g>`)},
 {id:'cabeza-audifonos',nombre:'Audífonos musicales',svg:wrap(`<path d="M607 337 C585 166 846 156 862 322" fill="none" stroke="#7963ad" stroke-width="25"/><path d="M609 289 C619 192 785 178 833 268" fill="none" stroke="#d4b8e9" stroke-width="7"/><rect x="591" y="301" width="40" height="82" rx="18" fill="#ab8ed0"/><rect x="843" y="286" width="32" height="71" rx="15" fill="#ab8ed0"/>${badge(611,340,.5)}<path d="M852 310 v24" stroke="#ffde8a" stroke-width="5"/>`)},
 {id:'cabeza-pirata',nombre:'Capitán de cuentos',svg:wrap(`<path d="M605 276 Q560 215 626 217 Q673 135 741 188 Q813 174 845 228 L800 265 Q717 235 605 276Z" fill="#3b596e"/><path d="M600 252 Q716 208 833 231" fill="none" stroke="#e5b664" stroke-width="10"/><path d="M690 213 l17 -32 18 28 -17 17Z" fill="#f5dfaa" stroke-width="4"/><path d="M620 274 l-37 55 30 -8 12 17 23 -63" fill="#df856e"/>`)},
 {id:'cabeza-guardian',nombre:'Casco guardián',svg:wrap(`<path d="M608 292 Q604 180 701 171 Q798 167 824 257 L791 269 Q751 218 714 250 L679 285Z" fill="#58adb1"/><path d="M686 178 L702 171 L727 249 L711 258Z" fill="#ffdc72"/><path d="M614 248 L579 185 L575 240 L599 282 M808 228 L840 181 L843 232 L824 256" fill="#d4eee1" stroke-width="5"/>${badge(701,211,.6)}`)},
 {id:'cabeza-unicornio',nombre:'Unicornio de nubes',svg:wrap(`<path d="M627 274 Q711 223 797 243" fill="none" stroke="#dba3cd" stroke-width="16"/><path d="M679 240 L686 119 L724 231Z" fill="#ffe49b"/><path d="M685 212 l26 -10 M685 183 l16 -7 M686 157 l7 -4" stroke="#d3a95d" stroke-width="4"/><path d="M635 255 L619 198 Q655 193 663 242 M750 232 Q759 185 790 191 L783 242" fill="#e7c9ee" stroke-width="5"/><circle cx="656" cy="248" r="15" fill="#eb9fc4" stroke-width="4"/><circle cx="745" cy="232" r="14" fill="#a5dcd0" stroke-width="4"/>`)},
)
const lensPair=(shape,color,scale=1)=>wrap(`<path d="M669 335 L625 315 M745 332 Q759 318 778 321" fill="none"/>${[[709,342,1],[811,321,.86]].map(([x,y,s])=>`<g transform="translate(${x} ${y}) scale(${s*scale})"><path d="${shape}" fill="#344b66" stroke="${color}" stroke-width="10"/><path d="${shape}" fill="none" stroke-width="3"/></g>`).join('')}`)
caras.push(
 {id:'cara-lentes-corazon',nombre:'Corazones',svg:lensPair(heart,'#db5d91',1.27)},
 {id:'cara-lentes-estrella',nombre:'Estrellas',svg:lensPair(star,'#e4ac2e',1.95)},
 {id:'cara-lentes-fuego',nombre:'Llamas',svg:lensPair('M0 38 C-48 39 -48 -12 -26 -34 L-20 -9 Q-8 -27 0 -49 Q12 -28 13 -14 L30 -32 C56 14 39 38 0 38Z','#e8763d',1.08)},
 {id:'cara-lentes-arcoiris',nombre:'Arcoíris',svg:wrap(`<path d="M665 337 L625 317 M752 329 L774 320" fill="none"/>${[[709,342,1],[811,321,.86]].map(([x,y,s])=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M-42 11 A42 42 0 0 1 42 11 L42 25 Q0 41 -42 25Z" fill="#344b66" stroke-width="4"/>${['#e8789c','#f4bb5c','#a0c777','#5bbac4','#a28ac9'].map((c,i)=>`<path d="M${-42+i*6} 11 A${42-i*6} ${42-i*6} 0 0 1 ${42-i*6} 11" fill="none" stroke="${c}" stroke-width="6"/>`).join('')}</g>`).join('')}`)},
 {id:'cara-visor',nombre:'Visor cósmico',svg:wrap(`<path d="M655 317 Q748 276 854 289 L856 334 Q757 366 659 361Z" fill="#504f8c"/><path d="M673 323 Q752 292 839 302 L840 322 Q759 347 675 347Z" fill="#77d5db" stroke-width="3"/><path d="M696 318 l-9 22 M716 310 l-9 25" stroke="#e4fcf3" stroke-width="6"/><path d="M655 334 L623 320" fill="none" stroke-width="10"/>`)},
 {id:'cara-antifaz',nombre:'Antifaz guardián',svg:wrap(`<path d="M657 308 L679 317 Q715 290 749 314 L767 308 Q805 274 843 290 L858 276 L852 344 Q813 362 775 342 L757 352 L740 360 Q696 382 662 354Z M682 331 Q704 312 732 329 L731 350 Q702 367 681 346Z M786 310 Q806 292 832 306 L833 327 Q809 347 788 329Z" fill="#7561a6" fill-rule="evenodd" stroke-width="5"/><path d="M745 313 l13 -13 11 8 -12 22Z" fill="#ffe394" stroke-width="3"/>`)},
)
zapatos.push(
 {id:'pies-patines',nombre:'Patines retro',svg:`<path d="M-29 -46 H5 V-20 Q40 -23 46 0 V12 Q0 23 -40 8Z" fill="#ab8ed0" stroke-width="6"/>${sole}<path d="M-20 -32 h18 M-20 -22 h18" stroke="#ffdf85" stroke-width="5"/><circle cx="-22" cy="25" r="8" fill="#f4a367" stroke-width="4"/><circle cx="28" cy="25" r="8" fill="#f4a367" stroke-width="4"/>`},
 {id:'pies-bailarina',nombre:'Ballerinas con lazo',svg:`<path d="M-35 -19 Q-19 -36 -3 -17 Q35 -30 46 -2 L46 14 Q1 28 -41 9Z" fill="#dd85ae" stroke-width="6"/>${sole}<path d="M-14 -16 Q-25 -25 -26 -9 Q-17 -2 -14 -16 Q-1 -30 2 -13 Q-4 -3 -14 -16Z" fill="#ffcedd" stroke-width="3"/><path d="M13 -10 Q26 -15 34 -7" fill="none" stroke="#ffc5d9" stroke-width="4"/>`},
 {id:'pies-espaciales',nombre:'Botas lunares',svg:`<path d="M-29 -43 H6 L8 -18 Q42 -17 46 1 V15 H-41Z" fill="#e2eee7" stroke-width="6"/><path d="M-29 -38 H6 V-26 H-29Z" fill="#5babb2" stroke-width="3"/>${sole}<path d="M-29 -13 h36 M-29 -4 h36" stroke="#9aafba" stroke-width="4"/><circle cx="24" cy="-7" r="6" fill="#e8b74e" stroke-width="3"/>`},
 {id:'pies-botines',nombre:'Botines de aventura',svg:`<path d="M-30 -43 H7 V-19 Q40 -22 45 0 V14 H-41Z" fill="#c79263" stroke-width="6"/>${sole}<path d="M-30 -41 H7 V-32 H-30Z" fill="#efd5ac" stroke-width="3"/><path d="M-19 -27 h16 M-20 -17 h16 M-21 -7 h16" stroke="#ffe5b2" stroke-width="4"/><path d="M13 -9 Q29 -17 39 -3" fill="none" stroke="#99633e" stroke-width="4"/>`},
 {id:'pies-aleatorios',nombre:'Un zapato en cada pie',random:true,svg:null},
)
mochilas.push(
 {id:'espalda-cohete',nombre:'Mochila cohete',svg:wrap(`<path d="M516 385 L487 410 L493 360 L516 332 M583 385 L611 410 L606 361 L583 332" fill="#e88c79"/><path d="M513 389 V315 Q528 265 548 252 Q575 271 589 317 V389Z" fill="#d6eee7"/><path d="M523 293 Q548 253 578 296Z" fill="#e88c79" stroke-width="5"/><circle cx="550" cy="331" r="22" fill="#6abdc7" stroke-width="5"/><path d="M540 323 l9 -7" stroke="#e7fff5" stroke-width="5"/><path d="M527 390 l3 27 19 -10 16 10 10 -27" fill="#ffdb72" stroke-width="5"/>`)},
 {id:'espalda-nube',nombre:'Mochila nube',svg:wrap(`<path d="M533 300 Q527 279 548 278 Q566 278 566 300" fill="none"/><path d="M509 330 Q487 306 516 297 Q527 274 549 294 Q575 276 587 301 Q618 306 596 333 L594 397 Q549 425 505 397Z" fill="#e1ecf1"/><path d="M519 355 Q552 370 581 352 V386 Q550 403 518 386Z" fill="#bdcde9" stroke-width="5"/><circle cx="535" cy="333" r="4" fill="#243e5b" stroke="none"/><circle cx="568" cy="333" r="4" fill="#243e5b" stroke="none"/><path d="M544 342 q9 8 16 -2" fill="none" stroke-width="3"/>`)},
 {id:'espalda-libro',nombre:'Libro de hechizos',svg:wrap(`<path d="M521 299 Q517 274 541 275 Q561 276 558 301" fill="none"/><path d="M505 303 L586 286 L603 398 L521 419 Q505 416 503 400Z" fill="#7763a6"/><path d="M505 303 L521 419 M524 410 L594 393" stroke="#e5cc94" stroke-width="8"/>${badge(551,351,.9)}<path d="M564 339 l36 -7 3 21 -36 7Z" fill="#d6a761" stroke-width="4"/><circle cx="587" cy="344" r="4" fill="#ffe394" stroke="none"/>`)},
 {id:'espalda-estrella',nombre:'Bolso estrella',svg:wrap(`<path d="M529 309 Q531 275 555 279 Q577 282 577 310" fill="none" stroke="#d481aa" stroke-width="10"/><path transform="translate(550 355) scale(2.5)" d="${star}" fill="#ef9fc5" stroke-width="3"/><path d="M523 356 Q549 368 577 348" fill="none" stroke="#a9588c" stroke-width="4"/>${badge(550,341,.55,'#ffe5a1')}`)},
)
export const capas=[
 {id:'capa-nada',nombre:'Sin capa',svg:''},
 ...[['capa-guardian','Capa guardiana','#468eb4','#90c6d6'],['capa-celeste','Capa de magia celeste','#7163a3','#b2a1d4'],['capa-aurora','Capa aurora','#ce7aaf','#f0bdd9']].map(([id,nombre,c,light])=>({id,nombre,svg:wrap(`<path d="M630 285 Q540 314 445 284 Q389 270 345 319 Q387 354 327 394 Q357 445 316 473 Q391 464 421 506 Q491 484 596 474 Q559 379 630 285Z" fill="${c}"/><path d="M598 312 Q509 354 566 472 M555 315 Q447 327 488 493 M490 307 Q394 333 424 505" stroke="${light}" stroke-width="5" fill="none"/>${id==='capa-aurora'?`<path transform="translate(429 324) scale(.6)" d="${heart}" fill="#ffe3c1" stroke-width="4"/>`:id==='capa-celeste'?'<path d="M448 307 Q421 312 434 334 Q406 330 416 311 Q428 296 448 307Z" fill="#ffe394" stroke-width="3"/>':'<path d="M429 298 L410 324 H424 L419 344 L447 315 H431Z" fill="#ffe394" stroke-width="3"/>'}${badge(487,316,.4)}<path d="M602 304 Q628 319 646 338" fill="none" stroke="#e9cd85" stroke-width="10"/>`)})),
]
export const espaldas=[...mochilas,...capas.filter(i=>i.id!=='capa-nada')]
espaldas[0]={...espaldas[0],nombre:'Sin accesorio'}
// Ojos propios, pequeños y contenidos en las aberturas del antifaz.
const mask=caras.find(i=>i.id==='cara-antifaz')
mask.svg+=wrap('<ellipse cx="706" cy="341" rx="20" ry="13" fill="#fff" stroke-width="2"/><ellipse cx="811" cy="321" rx="18" ry="12" fill="#fff" stroke-width="2"/><circle cx="710" cy="340" r="8" fill="#243e5b" stroke="none"/><circle cx="815" cy="320" r="7" fill="#243e5b" stroke="none"/>')

export const paletas=[
 {id:'clasica',nombre:'Clásico',colors:['#ffb449','#ff9e32','#f58b2d','#a1dfb2','#83cda4','#64b699','#ffdf57','#ffd137','#f0b32b']},
 {id:'oceano',nombre:'Océano',colors:['#99e5df','#66c7ce','#40a4bc','#a6d5f0','#83b9dc','#6494bf','#b8efdc','#8bd6c5','#60b6ae']},
 {id:'rosa',nombre:'Jardín rosa',colors:['#fac4dd','#eea2c7','#da81b2','#dec7f2','#c5a9e4','#a58cca','#fff0a3','#f4d780','#dfb966']},
 {id:'bosque',nombre:'Bosque',colors:['#c9df91','#a6c96c','#88af51','#b4dfbf','#8dc8a3','#6eae8a','#f8da91','#e8c471','#ccab58']},
 {id:'noche',nombre:'Noche mágica',colors:['#b5a4e2','#9480c9','#7765ad','#8bb8d8','#709cc3','#527caa','#f6dca1','#e1bc75','#c29b58']},
]
export const texturas=[{id:'liso',nombre:'Liso'},{id:'pecas',nombre:'Pecas'},{id:'estrellas',nombre:'Estrellas'},{id:'corazones',nombre:'Corazones'},{id:'escamas',nombre:'Escamas suaves'},{id:'rayas',nombre:'Rayas'}]
export const expresiones=[{id:'alegre',nombre:'Alegre'},{id:'guino',nombre:'Guiño'},{id:'feliz',nombre:'Ojos felices'},{id:'curioso',nombre:'Curioso'},{id:'dormilon',nombre:'Dormilón'}]
export const ojosColores=[{id:'oscuro',nombre:'Azul oscuro',color:'#243e5b'},{id:'azul',nombre:'Azules',color:'#4095bf'},{id:'verde',nombre:'Verdes',color:'#589d78'},{id:'miel',nombre:'Miel',color:'#bc883d'},{id:'violeta',nombre:'Violetas',color:'#9870b4'}]
export const bocas=[{id:'sonrisa',nombre:'Sonrisa'},{id:'risa',nombre:'Risa'},{id:'sorpresa',nombre:'Sorpresa'},{id:'beso',nombre:'Besito'}]
export function patternSvg(id,index=0){
 const item=texturas.find(i=>i.id===id);if(item?.segmentSvg)return item.segmentSvg(index);if(item?.svg)return item.svg
 if(id==='pecas')return '<g fill="#fff9dc" opacity=".65"><circle cx="-35" cy="-10" r="9"/><circle cx="5" cy="15" r="8"/><circle cx="38" cy="-15" r="10"/><circle cx="-28" cy="40" r="7"/></g>'
 if(id==='estrellas')return wrap(badge(0,10,1.1))
 if(id==='corazones')return `<path transform="translate(0 8) scale(.8)" d="${heart}" fill="#f2b4c1" stroke="#a05e78" stroke-width="3"/>`
 if(id==='rayas')return '<path d="M-40 -90 V90 M0 -90 V90 M40 -90 V90" stroke="#fff9dc" stroke-opacity=".25" stroke-width="16"/>'
 if(id==='escamas')return `<g stroke="#fff9dc" stroke-opacity=".5" stroke-width="4" fill="none">${[-30,0,30].map(y=>[-45,-15,15,45].map(x=>`<path d="M${x-14} ${y} q14 26 28 0"/>`).join('')).join('')}</g>`
 return ''
}
export function eyesSvg(expression,color,skin){
 const eye=(x,y,s,wink)=>`<g transform="translate(${x} ${y}) scale(${s})">${wink?'<path d="M-25 0 Q0 -25 25 0" fill="none" stroke="#243e5b" stroke-width="8" stroke-linecap="round"/>':`<ellipse rx="32" ry="39" fill="#fffdf6"/><ellipse cx="5" cy="3" rx="22" ry="27" fill="${color}"/><ellipse cx="7" cy="4" rx="12" ry="19" fill="#243e5b"/><circle cx="8" cy="-10" r="8" fill="white"/>${expression==='dormilon'?`<path d="M-32 0 A32 39 0 0 1 32 0Z" fill="${skin}" stroke="#243e5b" stroke-width="3"/>`:''}`}</g>`
 return `<g id="eyes">${eye(708,342,1,expression==='feliz')}${eye(808,320,.86,expression==='feliz'||expression==='guino')}<path d="M682 293 Q697 ${expression==='curioso'?270:280} 711 285 M791 270 Q806 265 818 276" fill="none" stroke="#243e5b" stroke-width="8" stroke-linecap="round"/></g>`
}
export function mouthSvg(id){
 const d=id==='risa'?'<path d="M723 385 Q771 402 809 374 Q809 446 767 437 Q734 432 723 385Z" fill="#243e5b"/><path d="M746 422 Q767 405 790 422 Q772 446 746 422Z" fill="#f58b78"/>':id==='sorpresa'?'<ellipse cx="768" cy="405" rx="19" ry="25" fill="#243e5b"/><ellipse cx="770" cy="418" rx="10" ry="5" fill="#f58b78"/>':'<path d="M749 390 Q777 378 786 392 L771 402 L786 409 Q764 424 751 410" fill="#e98c91" stroke="#243e5b" stroke-width="4" stroke-linejoin="round"/>'
 return `<g id="mouth">${d}</g>`
}
