import {chromium} from '/tmp/claude-1000/-mnt-d-Proyectos-ciempi-app/7a9ae8b8-45d5-4c38-b58d-58de299246ca/scratchpad/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const root='docs/integracion-ciempi/ejecucion-v1/';
const browser=await chromium.launch({headless:true,env:{...process.env,LD_LIBRARY_PATH:'/tmp/claude-1000/-mnt-d-Proyectos-ciempi-app/7a9ae8b8-45d5-4c38-b58d-58de299246ca/scratchpad/libs/usr/lib/x86_64-linux-gnu'}});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});

await page.goto('http://localhost:5176/docs/integracion-ciempi/ejecucion-v1/pruebas/render.html');
await page.waitForSelector('[data-ciempi="v2"]');
const matrix=await page.evaluate('('+fs.readFileSync(root+'pruebas/matriz.js','utf8')+')()');fs.writeFileSync(root+'pruebas/matriz.json',JSON.stringify(matrix,null,2));console.log('Matriz',matrix.count,matrix.fail);
await page.locator('summary').click();
const ids=await page.locator('[data-testid="conjunto-v2"] option').evaluateAll(xs=>xs.map(x=>x.value).filter(Boolean));
for(const id of ids){await page.selectOption('[data-testid="conjunto-v2"]',id);await page.locator('summary').click();await page.waitForTimeout(200);await page.screenshot({path:root+'comparaciones/'+id+'.png',fullPage:true});await page.locator('summary').click()}
await page.selectOption('[data-testid="conjunto-v2"]','b12-set-robot');await page.locator('summary').click();
const growth=[];for(let n=1;n<=12;n++){await page.locator('#crecer').click();const found=await page.locator('[data-ciempi="v2"]').last().getAttribute('data-segments');if(Number(found)!==n)throw Error('Motor '+found+' vs '+n);growth.push(n)}
await page.screenshot({path:root+'comparaciones/lectura-robot-12.png',fullPage:true});
await page.locator('summary').click();await page.getByRole('button',{name:'Volver a mi apariencia',exact:true}).click();await page.locator('summary').click();
await page.screenshot({path:root+'comparaciones/restaurado.png',fullPage:true});
await page.goto('http://localhost:5176/');await page.waitForTimeout(500);console.log('APP',await page.locator('body').innerText());
await page.screenshot({path:root+'comparaciones/app-inicio.png',fullPage:true});
fs.writeFileSync(root+'pruebas/browser-final.json',JSON.stringify({errors,growth,conjuntos:ids},null,2));await browser.close();
