// Dirección de arte: piezas construidas para la anatomía y la luz de Ciempi.
import { gorros, caras, espaldas, texturas, zapatos } from './armario-ciempi.mjs'
import { colecciones } from './colecciones-personajes.mjs'
const outline='#243e5b'
const drawing=s=>`<g stroke="${outline}" stroke-linejoin="round" stroke-linecap="round">${s}</g>`
const gradient=(id,colors)=>`<linearGradient id="${id}" x1=".1" y1="0" x2=".85" y2="1">${colors.map((c,i)=>`<stop offset="${i/(colors.length-1)}" stop-color="${c}"/>`).join('')}</linearGradient>`
const movingMasks=caras.filter(i=>i.fullFace||i.id==='cara-antifaz')
for(const piece of movingMasks){
 caras.splice(caras.indexOf(piece),1)
 const old=piece.id
 piece.id=old.replace('cara-','cabeza-mascara-');piece.mask=true;piece.antenna=false
 // La máscara Kitty incorpora orejas/lazo: no necesita equipar dos gorros.
 if(old==='cara-kitty')piece.svg+=gorros.find(i=>i.id==='cabeza-kitty').svg
 gorros.push(piece)
 for(const c of colecciones)if(c.look.cara===old){c.look.cabeza=piece.id;c.look.cara='cara-nada'}
}
const sp=gorros.find(i=>i.id==='cabeza-mascara-spider')
sp.svg=drawing(`<defs>${gradient('spider-fabric',['#f56b60','#d94648','#a9273b'])}${gradient('spider-lens',['#ffffff','#e7f3f2','#b7d5de'])}<clipPath id="spider-shell"><circle cx="736" cy="340" r="132"/></clipPath></defs>
<circle cx="736" cy="340" r="132" fill="url(#spider-fabric)" stroke-width="7"/>
<g clip-path="url(#spider-shell)">
<path d="M631 251 C597 375 661 461 788 452 Q825 446 853 416 L869 488 H593 V236Z" fill="#7c2436" opacity=".3" stroke="none"/>
<path d="M634 280 Q648 240 690 230" stroke="#ffc1a0" stroke-width="10" opacity=".5" fill="none"/>
<g fill="none" stroke="#692f43" stroke-width="2.8" opacity=".8">
<path d="M741 207 Q765 266 771 337 Q783 403 773 470 M690 214 Q719 271 751 337 Q746 402 722 472 M638 249 Q677 298 751 337 Q702 381 657 435 M609 307 Q678 324 751 337 Q688 354 606 378 M807 225 Q798 287 771 337 Q822 379 858 415 M855 282 Q818 315 771 337 L870 348"/>
<path d="M630 264 Q703 233 746 251 Q796 232 829 252 M615 293 Q690 269 757 281 Q810 264 850 280 M605 324 Q692 309 765 310 Q816 300 863 309 M609 373 Q690 362 771 361 Q819 354 862 370 M621 408 Q695 399 777 400 Q822 390 850 407 M650 443 Q719 433 780 437 Q804 429 827 440"/>
</g>
<path d="M741 213 Q760 271 771 337" stroke="#ff9b83" stroke-width="2" opacity=".6" fill="none"/>
</g>
<path d="M638 292 C670 305 709 315 746 332 C737 371 707 397 679 382 C653 368 643 332 638 292Z" fill="#142d43" stroke-width="5"/>
<path d="M650 310 Q700 325 732 339 C721 367 700 383 683 373 Q662 358 650 310Z" fill="url(#spider-lens)" stroke-width="2"/>
<path d="M789 325 Q818 291 851 273 Q852 328 831 350 Q811 369 789 347Z" fill="#142d43" stroke-width="5"/>
<path d="M800 329 Q824 303 841 293 Q837 329 824 341 Q812 354 800 341Z" fill="url(#spider-lens)" stroke-width="2"/>
<path d="M657 318 Q684 336 712 339 M811 329 l20 -21" stroke="#fff" stroke-width="4" opacity=".8" fill="none"/>
<path d="M688 432 Q732 451 778 439" stroke="#f18a80" stroke-width="3" fill="none" opacity=".55"/>`)
const iron=gorros.find(i=>i.id==='cabeza-mascara-iron')
iron.svg=drawing(`<defs>${gradient('iron-red',['#f37760','#ba343c','#702b3d'])}${gradient('iron-gold',['#fff0ae','#eac36d','#b67c38'])}${gradient('iron-glass',['#ffffff','#9ef3f5','#51accc'])}</defs>
<path d="M638 252 Q676 205 739 207 Q817 206 854 274 Q878 323 857 386 L822 441 Q782 478 723 470 Q654 460 624 400 Q591 315 638 252Z" fill="url(#iron-red)" stroke-width="7"/>
<path d="M641 264 Q622 321 637 376 L659 399 L655 420 Q625 390 619 346 Q612 298 641 264Z" fill="#652c3a" stroke-width="3"/>
<ellipse cx="632" cy="345" rx="14" ry="30" fill="#d79952" stroke-width="4"/><path d="M630 330 v29" stroke="#73463b" stroke-width="5"/>
<path d="M661 248 Q677 237 696 232 L710 269 Q746 258 782 259 L790 229 Q816 240 832 264 L842 331 L821 355 L821 394 L800 435 Q761 456 725 446 L688 420 L671 382 L652 358Z" fill="url(#iron-gold)" stroke-width="5"/>
<path d="M661 248 L680 270 L677 344 L691 367 L695 409 L725 446 L688 420 L671 382 L652 358Z" fill="#af743c" opacity=".7" stroke="none"/>
<path d="M702 277 Q740 265 780 268 L805 294 Q745 287 697 302Z" fill="#fff0b6" opacity=".45" stroke="none"/>
<path d="M777 272 L792 233 L807 241 L799 276Z" fill="#ffefac" stroke="none"/>
<path d="M674 316 Q707 321 740 335 L737 356 L688 346Z M782 328 L832 302 L833 325 L791 346Z" fill="#3d4952" stroke-width="5"/>
<path d="M681 323 L733 340 L731 347 L692 338Z M790 332 L826 313 L826 321 L795 337Z" fill="url(#iron-glass)" stroke="none"/>
<path d="M758 335 L747 374 L775 369 L782 342" fill="#c49753" stroke-width="3"/>
<path d="M692 365 L722 382 L726 404 M818 351 L792 377 L793 399" fill="none" stroke="#986635" stroke-width="3"/>
<path d="M724 408 Q759 402 795 392 L788 416 L737 429Z" fill="#94613b" stroke-width="3"/>
<path d="M733 412 L786 402" fill="none" stroke="#ffe7a0" stroke-width="3"/>
<path d="M674 243 Q681 237 692 235 M802 222 Q832 237 842 263" fill="none" stroke="#ffc194" stroke-width="5"/>
<path d="M695 439 Q748 482 806 442" fill="none" stroke="#ef9a79" stroke-width="3"/>
<path d="M642 287 l-4 15 M647 398 l8 10 M835 383 l-5 12" stroke="#e29d68" stroke-width="3" fill="none"/>`)

// Anclaje compartido de las capas: hombro, caída lateral, dobladillo y cuello.
function tailoredCape(id,color,dark,light,emblem){
 const path='M618 340 C571 351 552 384 496 391 C443 401 418 439 362 472 Q392 468 421 493 Q448 514 481 495 Q515 482 548 492 Q583 496 607 473 C576 430 593 379 630 355Z'
 const svg=drawing(`<defs>${gradient(id+'-cloth',[light,color,dark])}<clipPath id="${id}-cut"><path d="${path}"/></clipPath></defs>
 <path d="M621 351 C557 373 521 409 466 419 Q422 444 386 486 Q460 528 557 501 L612 481Z" fill="#263e53" opacity=".17" stroke="none"/>
 <path d="${path}" fill="url(#${id}-cloth)" stroke-width="6"/>
 <g clip-path="url(#${id}-cut)">
 <path d="M615 350 Q537 404 484 498 Q507 420 578 368Z" fill="${dark}" stroke="none" opacity=".55"/>
 <path d="M601 355 Q569 407 548 493 Q579 454 572 411Z" fill="${dark}" stroke="none" opacity=".6"/>
 <path d="M596 354 Q493 400 422 491 Q453 424 553 376Z" fill="${light}" stroke="none" opacity=".38"/>
 <path d="M613 350 Q578 408 597 465" stroke="${light}" stroke-width="4" fill="none" opacity=".65"/>
 <g transform="translate(494 435) rotate(-17) skewX(-9)">${emblem}</g>
 </g>
 <path d="M377 471 Q401 477 424 492 Q451 508 482 490 Q516 475 548 486 Q578 490 595 477" fill="none" stroke="${light}" stroke-width="3" opacity=".7"/>
 <path d="M615 342 l-17 17 M621 348 l-16 18" stroke="${light}" stroke-width="3" fill="none"/>`)
 const frontSvg=drawing(`<path d="M616 342 Q596 370 606 396 Q613 414 634 422" fill="none" stroke="${dark}" stroke-width="15"/><path d="M615 344 Q602 371 611 394 Q618 408 632 414" fill="none" stroke="${light}" stroke-width="5"/><ellipse cx="614" cy="395" rx="11" ry="13" transform="rotate(-25 614 395)" fill="#eacb78" stroke-width="3"/><path d="M610 390 l4 -3" stroke="#fff0b7" stroke-width="3"/>`)
 return {svg,frontSvg}
}
const capeSpecs=[
 ['capa-guardian','#468eb4','#28587e','#8cc9dc','<path d="M8 -34 L-25 4 H-3 L-10 31 L27 -11 H6Z" fill="#ffe193" stroke-width="3"/>'],
 ['capa-celeste','#7863a8','#453e75','#b8a6d8','<path d="M8 -30 Q-29 -17 -5 16 Q-41 10 -32 -19 Q-18 -42 8 -30Z" fill="#ffe4a1" stroke-width="2"/><path d="M20 -4 l4 9 10 1 -7 7 1 10 -9 -5 -9 5 2 -10 -7 -7 10 -1Z" fill="#ffe4a1" stroke-width="2"/>'],
 ['capa-aurora','#d181b0','#904b80','#f2bcda','<path d="M0 25 C-48 -4 -25 -41 0 -18 C25 -41 48 -4 0 25Z" fill="#ffe7ba" stroke-width="3"/>'],
 ['espalda-super','#c93647','#812c42','#f98276','<path d="M-36 -19 H36 L46 -5 L0 36 L-46 -5Z" fill="#ffdb68" stroke="#972837" stroke-width="4"/><text x="0" y="18" text-anchor="middle" font-family="serif" font-weight="bold" font-size="46" fill="#b82d3b" stroke="none">S</text>'],
 ['espalda-voldemort','#3e5c50','#243b36','#83a38b','<path d="M-15 -29 C34 -19 -29 18 13 30" fill="none" stroke="#ccdab9" stroke-width="7"/><ellipse cx="-14" cy="-29" rx="8" ry="5" fill="#ccdab9" stroke-width="2"/>'],
]
for(const [id,...args] of capeSpecs)Object.assign(espaldas.find(i=>i.id===id),tailoredCape(id,...args))

function neckScarf(id,a,b){
 const tail='M591 405 Q582 435 555 463 L582 486 Q614 457 615 419Z'
 const knot='M593 383 Q612 376 625 391 L617 416 Q601 424 588 407Z'
 const band='M616 323 C585 348 577 382 592 409 L614 419 C597 386 603 357 631 337Z'
 const svg=drawing(`<defs>${gradient(id+'-weave',[b,a,a])}<clipPath id="${id}-tail"><path d="${tail}"/></clipPath><clipPath id="${id}-band"><path d="${band}"/></clipPath></defs>
 <path d="M588 407 Q587 449 561 469 L588 494 Q628 448 620 417Z" fill="#243e5b" opacity=".16" stroke="none"/>
 <path d="${tail}" fill="${a}" stroke-width="5"/>
 <g clip-path="url(#${id}-tail)"><path d="M570 421 l43 18 M562 441 l40 18 M550 461 l38 18" stroke="${b}" stroke-width="11"/><path d="M608 414 Q598 453 575 479" stroke="#243e5b" stroke-width="6" opacity=".2" fill="none"/></g>
 <path d="M557 465 l-6 8 M565 472 l-6 8 M574 479 l-6 8 M582 485 l-6 8" stroke="${a}" stroke-width="4" fill="none"/>
 <path d="${band}" fill="${a}" stroke-width="5"/>
 <g clip-path="url(#${id}-band)"><path d="M587 346 l39 19 M578 368 l37 17 M580 392 l37 17" stroke="${b}" stroke-width="10"/><path d="M623 329 Q591 366 603 411" fill="none" stroke="#fff3d4" stroke-width="3" opacity=".4"/></g>`)
 const frontSvg=drawing(`<path d="${knot}" fill="url(#${id}-weave)" stroke-width="4"/><path d="M594 393 Q606 401 619 393 M592 403 Q606 409 615 404" fill="none" stroke="${b}" stroke-width="4"/><path d="M620 393 l-8 20" stroke="#243e5b" stroke-width="3" opacity=".25"/>`)
 return {svg,frontSvg}
}
for(const [house,a,b]of [['gryffindor','#943a43','#e5b958'],['slytherin','#326d5b','#c4d2cb'],['ravenclaw','#3b5d87','#bf9867'],['hufflepuff','#d6af48','#35444e']]){
 const id='espalda-'+house;Object.assign(espaldas.find(i=>i.id===id),neckScarf(id,a,b))
}

// La superficie de cada segmento tiene una función, no una pegatina repetida.
const segmentCenters=[[187,386],[289,410],[390,414],[477,402],[558,402]]
const spiderMark=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})" fill="#1e3048" stroke="#1e3048" stroke-width="3.5" stroke-linecap="round"><ellipse rx="7" ry="15"/><circle cy="-18" r="5"/><path d="M-5 -9 L-18 -20 L-19 -33 M5 -9 L18 -20 L19 -33 M-6 -3 L-26 -8 L-30 -21 M6 -3 L26 -8 L30 -21 M-5 5 L-24 13 L-28 30 M5 5 L24 13 L28 30 M-3 12 L-13 28 L-14 39 M3 12 L13 28 L14 39" fill="none"/></g>`
const stitches=(y=42)=>`<path d="M-85 ${y} Q0 ${y+20} 85 ${y-5}" fill="none" stroke="#fff3dc" stroke-width="2" stroke-dasharray="4 7" opacity=".45"/>`
function spiderSuit(i){
 const red=i===0||i>=3, id='suit-spider-'+i
 const fill=red?['#ee6a5e','#cb3c48','#943246']:['#5284b6','#2e5d96','#294570']
 const side=red?'<path d="M-90 -90 Q-45 -20 -53 90 H-100Z" fill="#2d5d95"/>':'<path d="M42 -95 Q28 -10 66 94 H110 V-95Z" fill="#c43e4b"/>'
 return `<defs>${gradient(id,fill)}</defs><rect x="-110" y="-110" width="220" height="220" fill="url(#${id})"/>${side}<g stroke="#30384e" stroke-width="2" opacity=".7" fill="none">${red?`<path d="M-50 -100 Q-70 0 -40 100 M-10 -100 Q-26 0 0 100 M35 -100 Q27 0 48 100 M78 -100 Q70 0 94 100"/><path d="M-100 -50 Q-25 -75 110 -37 M-100 -13 Q-20 -40 110 -4 M-100 23 Q-10 0 110 33 M-100 63 Q0 41 110 76"/>`:'<path d="M39 -100 Q25 0 68 100" stroke-width="4"/>'}</g>${i===4?spiderMark(12,0,1.25):''}${stitches(60)}`
}
function armorSuit(i){
 const id='armor-'+i,gold=i===2
 const colors=gold?['#ffe9a0','#d6ac58','#9b6736']:['#f17b65','#ba3b41','#7c2d3c']
 let detail=''
 if(i===0)detail='<path d="M-70 -20 Q-40 -60 24 -52 L58 -26 L51 38 Q-15 58 -65 24Z" fill="#ac3940" stroke="#752f39" stroke-width="4"/><path d="M-54 -17 Q-16 -38 32 -22 M-48 -3 Q-12 -22 30 -7 M-40 11 Q-6 -8 26 8" stroke="#3a3d49" stroke-width="6" fill="none"/>'
 if(i===1)detail='<path d="M-68 -55 Q-34 -74 18 -64 L39 -23 L28 52 Q-28 70 -67 34Z" fill="#dfb568" stroke="#754539" stroke-width="4"/><path d="M-56 -43 Q-20 -57 12 -46 M-53 -28 Q-16 -43 18 -31" stroke="#ffdfa0" stroke-width="4" fill="none"/><circle cx="32" cy="8" r="22" fill="#73343b" stroke="#3f3943" stroke-width="4"/><circle cx="32" cy="8" r="12" fill="#a4b2b1" stroke="#e9d9ad" stroke-width="3"/>'
 if(i===2)detail='<path d="M-93 -18 Q-15 -50 94 -8 L95 13 Q0 -15 -95 13Z M-95 28 Q-5 2 95 36 L95 55 Q0 27 -95 52Z" fill="#bf8747" stroke="#895437" stroke-width="3"/><path d="M-83 -20 Q-9 -42 73 -13 M-83 27 Q-9 11 73 38" stroke="#ffe5a0" stroke-width="3" fill="none"/>'
 if(i===3)detail='<path d="M-80 -65 Q-30 -78 20 -55 L49 -4 L34 53 Q-18 69 -73 37Z" fill="#c94346" stroke="#77323c" stroke-width="4"/><path d="M-58 -47 L-34 -54 L-20 22 L-41 43Z" fill="#e8b860" stroke="#8b4e3b" stroke-width="3"/><path d="M23 -48 L48 -20 L42 26" stroke="#f7ac82" stroke-width="4" fill="none"/>'
 if(i===4)detail='<path d="M-85 -60 Q-3 -102 80 -59 L68 -19 L37 4 L24 68 Q-2 88 -35 64 L-45 5 L-75 -18Z" fill="#c64545" stroke="#79333d" stroke-width="4"/><path d="M-76 -54 Q-3 -90 72 -55 L53 -39 Q-9 -68 -62 -34Z" fill="#f7cc76" stroke="#b1783e" stroke-width="3"/><circle cx="5" cy="2" r="34" fill="#526675" stroke="#edbf6e" stroke-width="6"/><circle cx="5" cy="2" r="25" fill="#a8edf0" stroke="#e2ffff" stroke-width="4"/><circle cx="5" cy="2" r="14" fill="#eafff9" stroke="none"/><path d="M-26 42 L-18 62 M37 36 L31 58" stroke="#f2a07e" stroke-width="4" fill="none"/>'
 return `<defs>${gradient(id,colors)}</defs><rect x="-110" y="-110" width="220" height="220" fill="url(#${id})"/><g stroke-linecap="round" stroke-linejoin="round">${detail}<path d="M-76 -26 Q-77 15 -56 39" fill="none" stroke="#fff1c8" stroke-width="3" opacity=".6"/></g>`
}
texturas.find(i=>i.id==='telarana').segmentSvg=spiderSuit
texturas.find(i=>i.id==='telarana').nombre='Traje Spider-Man'
texturas.find(i=>i.id==='arana').segmentSvg=i=>i===4?spiderMark(4,4,1.2):stitches(25+i*4)
texturas.find(i=>i.id==='armadura').segmentSvg=armorSuit
texturas.find(i=>i.id==='armadura').nombre='Armadura Iron Man'
texturas.find(i=>i.id==='escudo-super').segmentSvg=i=>`<rect x="-110" y="-110" width="220" height="220" fill="${i===0?'#285384':'#3479af'}"/>${i===4?'<path d="M-47 -26 H39 L53 -6 L1 42 L-59 -5Z" fill="#ffdb69" stroke="#b93643" stroke-width="5"/><text x="-2" y="20" text-anchor="middle" font-family="serif" font-size="55" font-weight="bold" fill="#c43843">S</text>':`<path d="M-100 ${42-i*6} Q0 ${64-i*6} 100 ${33-i*6}" stroke="${i===2?'#e6bb54':'#27547f'}" stroke-width="${i===2?14:4}" fill="none"/>`}`
texturas.find(i=>i.id==='reliquias').segmentSvg=i=>{
 const [x,y]=segmentCenters[i]
 return `<g transform="translate(${-x} ${-y})" stroke="#f5df97" fill="none"><path d="M118 404 C244 313 267 491 400 393 S536 337 620 410" stroke-width="2" stroke-dasharray="2 8" opacity=".7"/></g>${i===4?'<path d="M7 -39 L-22 4 H0 L-8 40 L29 -11 H7Z" fill="#efd38a" stroke="#8f6d3e" stroke-width="3"/>':`<g transform="translate(${[-22,14,-12,20][i]} ${[4,-16,18,-6][i]})" fill="#f6e2aa"><path d="M0 -10 Q2 -2 10 0 Q2 2 0 10 Q-2 2 -10 0 Q-2 -2 0 -10Z"/><circle cx="25" cy="-17" r="3"/></g>`}`
}
texturas.find(i=>i.id==='serpiente').segmentSvg=i=>{
 const [x,y]=segmentCenters[i]
 return `<g transform="translate(${-x} ${-y})" fill="none" stroke-linecap="round"><path d="M109 390 C177 336 213 464 297 414 S377 357 429 397 S501 448 584 376" stroke="#314c42" stroke-width="19"/><path d="M109 390 C177 336 213 464 297 414 S377 357 429 397 S501 448 584 376" stroke="#bacb97" stroke-width="12"/><path d="M109 387 C177 333 213 461 297 411 S377 354 429 394 S501 445 584 373" stroke="#e4e8bf" stroke-width="3"/>${i===4?'<ellipse cx="583" cy="376" rx="19" ry="12" transform="rotate(-25 583 376)" fill="#bacb97" stroke="#314c42" stroke-width="3"/><circle cx="587" cy="370" r="3" fill="#263e39"/>':''}</g>`
}
texturas.find(i=>i.id==='textura-mickey').segmentSvg=i=>`<rect x="-110" y="-110" width="220" height="220" fill="${i===0||i===3?'#344252':'#ca4849'}"/>${i===4?'<g fill="#ffe9b8" stroke="#8d5146" stroke-width="3"><ellipse cx="-30" cy="10" rx="12" ry="20"/><ellipse cx="27" cy="3" rx="12" ry="20"/></g>':i===2?'<path d="M-88 -8 Q0 21 87 -5" stroke="#eaa07d" stroke-width="4" fill="none"/>':stitches(42)}`
texturas.find(i=>i.id==='textura-minnie').segmentSvg=i=>`<g fill="#fff3da" opacity=".9">${[[-43,-24,8],[0,-6,12],[34,26,9],[-23,48,7]].slice(0,2+i%3).map(([x,y,r])=>`<ellipse cx="${x+((i*13)%27)-10}" cy="${y+((i*11)%19)-8}" rx="${r*(.8+i*.07)}" ry="${r}" transform="rotate(${-18+i*5} ${x} ${y})"/>`).join('')}</g>`
texturas.find(i=>i.id==='lazos-kitty').segmentSvg=i=>i===4?'<g transform="rotate(-15)"><path d="M0 0 Q-45 -40 -40 5 Q-40 30 0 0 Q40 -40 40 0 Q44 29 0 0Z" fill="#e47797" stroke="#a94e71" stroke-width="3"/><circle r="10" fill="#f2bbcf" stroke="#a94e71" stroke-width="3"/></g>':`<g fill="#fff2e4" opacity=".75"><circle cx="${-20+i*9}" cy="-12" r="6"/><circle cx="24" cy="${15+i*4}" r="4"/></g>${stitches(45)}`
// Variación determinista también en los estampados básicos: tamaño, posición y ritmo.
for(const id of ['pecas','estrellas','corazones','escamas','rayas']){
 const item=texturas.find(i=>i.id===id)
 item.segmentSvg=i=>{
  if(id==='pecas')return `<g fill="#fff5db" opacity=".65">${Array.from({length:2+i%3},(_,j)=>`<circle cx="${-43+j*27+(i*11)%16}" cy="${-24+(j*29+i*17)%64}" r="${5+(i+j)%6}"/>`).join('')}</g>`
  if(id==='estrellas')return `<g transform="translate(${(i%2)*28-12} ${i*7-17}) rotate(${i*23-10}) scale(${.6+i*.1})"><path d="M0 -25 L7 -8 L25 -7 L12 6 L16 25 L0 15 L-16 25 L-12 6 L-25 -7 L-7 -8Z" fill="#fff0bb" stroke="#be9d5b" stroke-width="3"/></g>`
  if(id==='corazones')return `<path transform="translate(${(i%2)*24-10} ${i*7-15}) rotate(${-18+i*8}) scale(${.6+i*.09})" d="M0 24 C-48 -4 -25 -41 0 -18 C25 -41 48 -4 0 24Z" fill="#edb2bf" stroke="#b97890" stroke-width="3"/>`
  if(id==='rayas')return `<path d="M-100 ${-32+i*7} Q0 ${-62+i*7} 100 ${-26+i*7} M-100 ${8+i*7} Q0 ${-22+i*7} 100 ${14+i*7}" stroke="#fff4db" stroke-width="12" stroke-opacity=".3" fill="none"/>`
  return `<g stroke="#fff2d7" stroke-width="3" opacity=".45" fill="none">${[-38,-8,22,52].map(y=>[-50,-15,20,55].map(x=>`<path d="M${x+((i*7)%20)} ${y} q14 ${17+i} 28 0"/>`).join('')).join('')}</g>`
 }
}
// Muestra primero el traje; la mochila permanece disponible como pieza opcional.
for(const id of ['spider-man','iron-man'])colecciones.find(c=>c.id===id).look.espalda='espalda-nada'

// Acabados por material: luz superior izquierda, sin alterar siluetas aprobadas.
function shadeHex(color,amount){const rgb=color.slice(1).match(/../g).map(x=>parseInt(x,16));return '#'+rgb.map(c=>Math.round(amount>0?c+(255-c)*amount:c*(1+amount)).toString(16).padStart(2,'0')).join('')}
function finishMaterial(piece,material='fabric'){
 if(!piece.svg||piece.mask)return
 const defs=new Map()
 piece.svg=piece.svg.replace(/fill="(#[0-9a-fA-F]{6})"/g,(attribute,color)=>{
  const rgb=color.slice(1).match(/../g).map(x=>parseInt(x,16))
  if(Math.max(...rgb)-Math.min(...rgb)<24||Math.max(...rgb)<115||Math.min(...rgb)>215||['#243e5b','#263b4f','#20334b'].includes(color))return attribute
  const key=piece.id+'-material-'+color.slice(1)
  const colors=material==='metal'?[shadeHex(color,.35),color,shadeHex(color,.12),shadeHex(color,-.19)]:[shadeHex(color,.16),color,shadeHex(color,-.13)]
  defs.set(key,gradient(key,colors));return `fill="url(#${key})"`
 })
 if(defs.size)piece.svg='<defs>'+[...defs.values()].join('')+'</defs>'+piece.svg
}
for(const hat of gorros)finishMaterial(hat,['cabeza-corona','cabeza-tiara','cabeza-astronauta','cabeza-guardian'].includes(hat.id)?'metal':'fabric')
for(const bag of espaldas){
 if(bag.frontSvg||!bag.svg)continue // Capas y bufandas ya tienen iluminación propia.
 finishMaterial(bag,['espalda-iron','espalda-cohete'].includes(bag.id)?'metal':'fabric')
 bag.svg=drawing('<path d="M531 310 Q494 350 510 407 Q530 431 576 422" fill="none" stroke="#243e5b" stroke-width="12" opacity=".16"/><path d="M532 305 Q493 350 511 402 Q534 422 572 415" fill="none" stroke="#98714e" stroke-width="9"/><path d="M529 309 Q500 350 515 399" fill="none" stroke="#e4c694" stroke-width="3"/>')+bag.svg
}
for(const shoe of zapatos)finishMaterial(shoe,['pies-iron','pies-espaciales'].includes(shoe.id)?'metal':'fabric')
// Costuras/relieves legibles al acercar sin recargar las miniaturas.
const wool=gorros.find(i=>i.id==='cabeza-gorro-lana')
wool.svg+=drawing('<path d="M628 267 l3 16 M646 261 l3 17 M664 256 l3 17 M682 252 l3 17 M700 248 l3 17 M718 246 l3 16 M736 244 l3 16" stroke="#dcf1db" stroke-width="2" opacity=".65" fill="none"/>')
const crown=gorros.find(i=>i.id==='cabeza-corona')
crown.svg+=drawing('<path d="M628 256 Q705 228 794 228" stroke="#fff3ba" stroke-width="2" fill="none"/><path d="M713 211 l5 -8 6 5 -5 4Z" fill="#ffc8b0" stroke="none"/>')
// Las otras máscaras conservan sus rasgos pero reciben volumen coherente.
for(const [id,color,light,dark]of [['cabeza-mascara-voldemort','#d4ddcb','#edf0db','#a5b9a5'],['cabeza-mascara-kitty','#fff9ef','#ffffff','#e4ddcf']]){
 const item=gorros.find(i=>i.id===id),gid=id+'-skin'
 item.svg='<defs>'+gradient(gid,[light,color,dark])+'</defs>'+item.svg.replace(`fill="${color}"`,`fill="url(#${gid})"`)
}
