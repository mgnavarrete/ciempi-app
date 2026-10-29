import {chromium} from '/tmp/claude-1000/-mnt-d-Proyectos-ciempi-app/7a9ae8b8-45d5-4c38-b58d-58de299246ca/scratchpad/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const root='docs/integracion-ciempi/ejecucion-v1/';
const browser=await chromium.launch({headless:true,env:{...process.env,LD_LIBRARY_PATH:'/tmp/claude-1000/-mnt-d-Proyectos-ciempi-app/7a9ae8b8-45d5-4c38-b58d-58de299246ca/scratchpad/libs/usr/lib/x86_64-linux-gnu'}});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});


await page.goto('http://localhost:5176/docs/integracion-ciempi/ejecucion-v1/pruebas/render.html');await page.waitForSelector('[data-ciempi="v2"]');
for(const kind of ['conjuntos','paletas','bufandas']){
 await page.evaluate(async kind=>{const {load,renderCiempi,escena,BASE}=window.tools,e=await load();const cases=kind==='conjuntos'?e.sets.map(x=>[x.nombre,{...BASE,...x.seleccion}]):kind==='paletas'?e.groups[0][2].map(x=>[x.nombre,{...BASE,paleta:x.id,cuello:'bufanda-calco32'}]):e.scarf.variantes.map(x=>[x.nombre,{...BASE,cuello:'bufanda-calco32',variante:x.id}]);
 for(const el of [document.documentElement,document.body,document.getElementById('root')]){el.style.height='auto';el.style.overflow='visible';}
 document.getElementById('root').innerHTML='<h1 style="padding:15px">'+kind+' · composición de producción</h1><div id="gallery" style="display:grid;grid-template-columns:repeat(4,320px);gap:12px;padding:15px"></div>';
 let i=0;for(const [label,s]of cases)for(const dark of [false,true]){const scene=escena(renderCiempi(e,s),5,'g'+i++);document.getElementById('gallery').insertAdjacentHTML('beforeend',`<section style="background:${dark?'#263348':'#fff9ef'};color:${dark?'white':'#243e5b'};padding:8px"><h2>${label}</h2><svg width="304" viewBox="${scene.viewBox}">${scene.html}</svg></section>`)}
 await Promise.all([...document.querySelectorAll('image')].map(async el=>{const h=el.getAttribute('href');if(h&&!h.startsWith('#')){const im=new Image();im.src=h;await im.decode()}}));
 },kind);await page.screenshot({path:root+'comparaciones/galeria-'+kind+'.png',fullPage:true});
}
await browser.close();
