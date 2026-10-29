import {chromium} from '/tmp/claude-1000/-mnt-d-Proyectos-ciempi-app/7a9ae8b8-45d5-4c38-b58d-58de299246ca/scratchpad/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const root='docs/integracion-ciempi/ejecucion-v1/';
const browser=await chromium.launch({headless:true,env:{...process.env,LD_LIBRARY_PATH:'/tmp/claude-1000/-mnt-d-Proyectos-ciempi-app/7a9ae8b8-45d5-4c38-b58d-58de299246ca/scratchpad/libs/usr/lib/x86_64-linux-gnu'}});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});



await page.goto('http://localhost:5176/');await page.getByRole('button',{name:/Lector/}).waitFor();
await page.evaluate(()=>{const k='ciempi:v1:perfiles',p=JSON.parse(localStorage.getItem(k));p[0].ciempi.presentado=true;p[0].monedas=100;p[0].inventario=['cara-lentes'];localStorage.setItem(k,JSON.stringify(p))});await page.reload();
await page.getByRole('button',{name:/Lector/}).click();
await page.getByRole('button',{name:/Personalizar/}).click();await page.locator('[data-testid="vestuario-v2"] summary').click();
const before=await page.evaluate(()=>localStorage.getItem('ciempi:v1:perfiles'));
await page.selectOption('[data-testid="conjunto-v2"]','b12-set-robot');await page.locator('[data-testid="vestuario-v2"] summary').click();
if(await page.evaluate(()=>localStorage.getItem('ciempi:v1:perfiles'))!==before)throw Error('Prueba modificó inventario');
await page.screenshot({path:root+'comparaciones/app-armario-robot.png',fullPage:true});
await page.getByRole('button',{name:'Volver',exact:true}).click();await page.getByRole('button',{name:/Don Ciempiés va a la escuela/}).click();await page.waitForTimeout(300);

const slider=page.getByRole('slider'),box=await slider.boundingBox();
await page.mouse.move(box.x+3,box.y+box.height-40);await page.mouse.down();const growth=[];
for(let i=0;i<=25;i++){await page.mouse.move(box.x+3+(box.width-6)*i/25,box.y+box.height-40);await page.waitForTimeout(120);growth.push(await page.locator('[data-ciempi="v2"]').last().getAttribute('data-segments'));}
await page.mouse.up();await page.screenshot({path:root+'comparaciones/app-lectura-robot.png',fullPage:true});
const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('ciempi:v1:perfiles'))[0]);
await page.getByRole('button',{name:'Volver',exact:true}).click();await page.getByRole('button',{name:/Personalizar/}).click();await page.locator('[data-testid="vestuario-v2"] summary').click();
await page.getByRole('button',{name:'Volver a mi apariencia',exact:true}).click();await page.locator('[data-testid="vestuario-v2"] summary').click();
await page.setViewportSize({width:390,height:844});await page.screenshot({path:root+'comparaciones/app-armario-movil.png',fullPage:true});
await page.getByRole('button',{name:/^Sol/}).click();await page.getByRole('button',{name:/Comprar/}).click();await page.waitForTimeout(150);
const bought=await page.evaluate(()=>JSON.parse(localStorage.getItem('ciempi:v1:perfiles'))[0]);if(bought.monedas!==92||!bought.inventario.includes('paleta-sol')||!bought.inventario.includes('cara-lentes'))throw Error('Compra histórica');
await page.reload();await page.getByRole('button',{name:/Lector/}).click();const reloaded=await page.evaluate(()=>JSON.parse(localStorage.getItem('ciempi:v1:perfiles'))[0]);if(JSON.stringify(reloaded)!==JSON.stringify(bought))throw Error('Persistencia');
console.log('Compra y recarga: OK');
fs.writeFileSync(root+'pruebas/real-app.json',JSON.stringify({errors,growth,after,bought,reloaded},null,2));await browser.close();
