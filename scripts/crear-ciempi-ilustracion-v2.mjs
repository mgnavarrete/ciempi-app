/** Prototipo vectorial estático. Ejecutar: node scripts/crear-ciempi-ilustracion-v2.mjs */
import { mkdirSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'
const dir = 'docs/rediseno-ciempi'
mkdirSync(dir, { recursive: true })
const navy = '#243e5b'
const shoe = (x,y,s=1) => `<g transform="translate(${x} ${y}) scale(${s})" stroke="${navy}" stroke-linejoin="round" stroke-linecap="round">
 <path d="M-19 -64 L9 -61 L7 -30 L-22 -29Z" fill="#f4ba38" stroke-width="6"/><path d="M-14 -59 L-7 -57 L-10 -37" fill="none" stroke="#ffe18a" stroke-width="5"/>
 <path d="M-26 -35 Q-14 -44 0 -35 L10 -20 Q34 -23 45 -4 L47 13 Q20 27 -41 10 Q-45 1 -37 -17Z" fill="url(#shoe)" stroke-width="6"/>
 <path d="M-35 -15 Q-28 -28 -22 -29 L-23 1 L-38 -1Z" fill="#247887" stroke="none"/>
 <path d="M5 -14 Q27 -24 40 -9 L44 2 Q23 10 0 2 Q-2 -8 5 -14Z" fill="#fff9e9" stroke-width="4"/>
 <path d="M-41 2 Q-5 17 46 5 L46 15 Q17 31 -40 15 Q-46 12 -41 2Z" fill="#fff9e9" stroke-width="5"/>
 <path d="M-32 13 Q3 26 34 17" fill="none" stroke="#d8e4da" stroke-width="3"/>
 <path d="M-15 -29 l18 4 M-20 -19 l18 4" stroke="#fff8dc" stroke-width="7"/><path d="M-28 -10 l-3 6" stroke="#c5efdf" stroke-width="4"/>
 </g>`
const segment=(id,x,y,rx,ry,color)=>`<g id="${id}" transform="translate(${x} ${y})">
 <defs><clipPath id="clip-${id}"><ellipse rx="${rx}" ry="${ry}"/></clipPath></defs>
 <ellipse rx="${rx}" ry="${ry}" fill="url(#${color})"/>
 <g clip-path="url(#clip-${id})">
 <path d="M${-rx*.9} ${-ry*.6} C${-rx*1.05} ${ry*.8} ${rx*.3} ${ry*.9} ${rx*.95} ${ry*.15} L${rx*1.4} ${ry*1.3} H${-rx*1.4}Z" fill="${navy}" opacity=".13"/>
 <path d="M${-rx*.65} ${-ry*.38} Q${-rx*.35} ${-ry*.88} ${rx*.18} ${-ry*.76}" fill="none" stroke="#fffbe3" stroke-opacity=".48" stroke-width="12" stroke-linecap="round"/>
 </g><ellipse rx="${rx}" ry="${ry}" fill="none" stroke="${navy}" stroke-width="7"/></g>`
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="780" viewBox="0 0 1000 650" role="img" aria-labelledby="title desc">
<title id="title">Ciempi ilustrado con jockey y zapatillas</title><desc id="desc">Rediseño estático vectorial con cabeza grande naranja, segmentos menta, amarillo y naranja, jockey verde y turquesa, y seis zapatillas grandes.</desc>
<defs>
 <linearGradient id="orange" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#ffb449"/><stop offset=".55" stop-color="#ff9e32"/><stop offset="1" stop-color="#f58b2d"/></linearGradient>
 <linearGradient id="mint" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#a1dfb2"/><stop offset=".55" stop-color="#83cda4"/><stop offset="1" stop-color="#64b699"/></linearGradient>
 <linearGradient id="yellow" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#ffdf57"/><stop offset=".6" stop-color="#ffd137"/><stop offset="1" stop-color="#f0b32b"/></linearGradient>
 <linearGradient id="shoe" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#4fbab8"/><stop offset="1" stop-color="#26949d"/></linearGradient>
 <linearGradient id="cap" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b4dc60"/><stop offset="1" stop-color="#85bb43"/></linearGradient>
 <clipPath id="face"><path d="M616 285 C633 238 716 216 779 239 C846 260 879 323 861 386 C847 446 789 475 725 467 C655 460 608 419 607 358 C606 329 610 304 616 285Z"/></clipPath>
</defs>
<ellipse cx="493" cy="548" rx="393" ry="23" fill="#243e5b" opacity=".10"/>
<g id="legs-and-sneakers">${shoe(172,499,.9)}${shoe(276,520,.94)}${shoe(375,525,.97)}${shoe(500,524,1)}${shoe(644,525,1.04)}${shoe(793,518,1.04)}</g>
<g id="body">
${segment('tail',187,386,88,85,'orange')}
${segment('mint-back',289,410,88,85,'mint')}
${segment('yellow-middle',390,414,81,84,'yellow')}
${segment('orange-middle',477,402,76,89,'orange')}
${segment('mint-front',558,402,95,97,'mint')}
</g>
<g id="head" stroke-linecap="round" stroke-linejoin="round">
 <path d="M616 285 C633 238 716 216 779 239 C846 260 879 323 861 386 C847 446 789 475 725 467 C655 460 608 419 607 358 C606 329 610 304 616 285Z" fill="url(#orange)"/>
 <g clip-path="url(#face)"><path d="M638 259 C599 382 686 463 797 440 C836 431 862 408 877 382 L889 496 L588 499 L580 240Z" fill="#e8752b" opacity=".48"/><path d="M638 313 Q634 291 657 276" fill="none" stroke="#ffe09a" stroke-width="12" opacity=".6"/></g>
 <path d="M616 285 C633 238 716 216 779 239 C846 260 879 323 861 386 C847 446 789 475 725 467 C655 460 608 419 607 358 C606 329 610 304 616 285Z" fill="none" stroke="${navy}" stroke-width="7"/>
 <g id="eyes">
 <ellipse cx="708" cy="342" rx="33" ry="39" fill="#fffdf6" transform="rotate(-10 708 342)"/>
 <ellipse cx="808" cy="320" rx="27" ry="35" fill="#fffdf6" transform="rotate(-12 808 320)"/>
 <ellipse cx="715" cy="345" rx="22" ry="27" fill="${navy}"/><ellipse cx="812" cy="322" rx="18" ry="25" fill="${navy}"/>
 <circle cx="718" cy="332" r="9" fill="white"/><circle cx="813" cy="311" r="7" fill="white"/>
 <circle cx="706" cy="355" r="3" fill="#6b94b1"/><circle cx="805" cy="332" r="2.5" fill="#6b94b1"/>
 <path d="M682 293 Q697 280 711 285 M791 270 Q806 265 818 276" fill="none" stroke="${navy}" stroke-width="8"/>
 </g>
 <ellipse cx="681" cy="389" rx="23" ry="13" fill="#ee724b" transform="rotate(8 681 389)"/><ellipse cx="837" cy="362" rx="18" ry="12" fill="#ee724b" transform="rotate(-13 837 362)"/>
 <path d="M725 387 Q768 406 807 373 C806 413 783 433 759 425 C742 420 731 404 725 387Z" fill="${navy}" stroke="${navy}" stroke-width="5"/>
 <path d="M745 414 Q759 402 776 415 Q781 409 788 413 Q769 432 745 414Z" fill="#f58b78"/>
</g>
<g id="jockey" stroke="${navy}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">
 <path d="M614 302 C593 250 617 179 681 159 C745 141 792 172 810 219 L716 268Z" fill="url(#shoe)"/>
 <path d="M614 290 Q594 233 638 192 Q620 246 648 275Z" fill="#218898" stroke="none"/>
 <path d="M650 269 C628 216 647 172 688 161 C732 150 779 170 802 213 L729 251Z" fill="url(#cap)"/>
 <path d="M658 222 Q650 187 682 170" fill="none" stroke="#dded9e" stroke-width="8" opacity=".65"/>
 <path d="M693 161 Q740 166 765 221" fill="none" stroke="#6b9e3a" stroke-width="4"/>
 <path d="M677 158 Q672 145 689 143 Q702 141 706 153" fill="#349fac" stroke-width="5"/>
 <path d="M650 273 C713 231 799 177 846 190 C881 201 845 238 802 255 Q778 230 752 241 C709 271 675 282 650 273Z" fill="#237b8c"/>
 <path d="M650 273 C708 228 798 182 846 190 C803 187 745 226 709 254 Q672 281 650 273Z" fill="#49b7b7" stroke-width="5"/>
</g>
<g id="antennae" stroke="${navy}" stroke-width="7" stroke-linecap="round">
 <path d="M649 220 Q638 172 608 161 M780 208 Q790 150 823 134" fill="none"/>
 <circle cx="601" cy="151" r="17" fill="#40b9b7" stroke-width="5"/><circle cx="832" cy="128" r="18" fill="#40b9b7" stroke-width="5"/>
 <path d="M593 147 Q597 140 604 142 M824 123 Q829 116 836 120" fill="none" stroke="#a3e7d5" stroke-width="5"/>
</g>
</svg>`
writeFileSync(`${dir}/ciempi-ilustracion-v2.svg`,svg)
await sharp(Buffer.from(svg)).png().toFile(`${dir}/ciempi-ilustracion-v2.png`)
// Fondo de presentación; el recurso anterior conserva transparencia.
const presentation = svg.replace('<defs>', '<rect width="1000" height="650" fill="#fdf8ee"/><defs>')
await sharp(Buffer.from(presentation)).png().toFile(`${dir}/ciempi-ilustracion-v2-presentacion.png`)
await sharp(Buffer.from(svg)).resize(240).png().toFile(`${dir}/ciempi-ilustracion-v2-miniatura.png`)
