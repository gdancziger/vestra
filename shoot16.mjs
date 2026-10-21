import { chromium } from 'playwright'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:430,height:900}, geolocation:{latitude:40.6866,longitude:-73.9906}, permissions:['geolocation'] })
const p = await ctx.newPage()
let live = null // null: street list unavailable (fallback doors)
await p.route('**/overpass-api.de/**', (r) => live ? r.fulfill({ contentType:'application/json', body: JSON.stringify({ elements: live }) }) : r.abort())
const osm = (id, name, lat, lon, amenity='cafe') => ({ id, lat, lon, tags:{ name, amenity } })
await p.goto('http://127.0.0.1:8080'); await p.waitForTimeout(4000)
await p.fill('.dock input','Gabe'); await p.press('.dock input','Enter'); await p.waitForTimeout(300)
for (const el of await p.$$('.catch')) { await el.click({force:true}).catch(()=>{}) }
await p.click('.main'); await p.waitForTimeout(400); await p.click('.main'); await p.waitForTimeout(500)
await p.click('.icons .c >> nth=0').catch(()=>{}); await p.waitForTimeout(400)
console.log('day1 id:', await p.evaluate(()=>Object.keys(JSON.parse(localStorage.vestra).state.doors)))
// next day; the live street list now loads, with new ids and a nearer stranger door
await p.evaluate(()=>{const s=JSON.parse(localStorage.vestra);for(const m of Object.values(s.state.doors)){m.lastDay='2000-01-01';m.lastAt-=86400000;m.firstAt-=86400000};s.state.targetId=null;localStorage.vestra=JSON.stringify(s)})
live = [osm(111,"Dunkin' Donuts/Baskin Robbins",40.68668,-73.99055,'fast_food'), osm(222,'Bar Tabac',40.68714,-73.99050,'bar'), osm(333,'Bien Cuit',40.68773,-73.99012,'bakery')]
await p.reload(); await p.waitForTimeout(5000)
console.log('day2 pins:', await p.$$eval('.door-label', e=>e.map(x=>x.innerText.replace(/\n/g,' | '))))
console.log('day2 dock:', (await p.$eval('.door-part', e=>e.innerText)).replace(/\n/g,' | '))
await p.screenshot({ path:'/workspace/vestra-shots/v16-return.png' })
await p.$$eval('.door', (els)=>{ const t=els.find(e=>e.textContent.includes('Bar Tabac')); t && t.dispatchEvent(new MouseEvent('click',{bubbles:true})) })
await p.waitForTimeout(400); console.log('main:', await p.$eval('.main', e=>e.textContent))
await p.click('.main'); await p.waitForTimeout(500)
console.log('day2 arrive dock:', (await p.$eval('.door-part', e=>e.innerText)).replace(/\n/g,' | '))
await p.screenshot({ path:'/workspace/vestra-shots/v16-arrive.png' })
// a live list that leaves Bar Tabac out entirely: it still stands where you met it
live = [osm(111,"Dunkin' Donuts/Baskin Robbins",40.68668,-73.99055,'fast_food')]
await p.evaluate(()=>{const s=JSON.parse(localStorage.vestra);for(const m of Object.values(s.state.doors)){m.lastDay='2000-01-01'};localStorage.vestra=JSON.stringify(s)})
await p.reload(); await p.waitForTimeout(5000)
console.log('missing-from-live pins:', await p.$$eval('.door-label', e=>e.map(x=>x.innerText.replace(/\n/g,' | '))))
await b.close()
