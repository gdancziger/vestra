import { chromium } from 'playwright'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:430,height:900}, geolocation:{latitude:40.6866,longitude:-73.9906}, permissions:['geolocation'] })
const p = await ctx.newPage()
let live = null
await p.route('**/overpass-api.de/**', (r) => live ? r.fulfill({ contentType:'application/json', body: JSON.stringify({ elements: live }) }) : r.abort())
const osm = (id, name, lat, lon, amenity='cafe') => ({ id, lat, lon, tags:{ name, amenity } })
await p.goto('http://127.0.0.1:8080'); await p.waitForTimeout(4000)
await p.fill('.dock input','Gabe'); await p.press('.dock input','Enter'); await p.waitForTimeout(300)
await p.click('.main'); await p.waitForTimeout(400); await p.click('.main'); await p.waitForTimeout(500)
// make it an OLD memory: next day, and no places recorded (saved before doorPlaces existed)
await p.evaluate(()=>{const s=JSON.parse(localStorage.vestra);for(const m of Object.values(s.state.doors)){m.lastDay='2000-01-01';m.lastAt-=86400000;m.firstAt-=86400000};delete s.state.doorPlaces;s.state.targetId=null;localStorage.vestra=JSON.stringify(s)})
const name = await p.evaluate(()=>Object.values(JSON.parse(localStorage.vestra).state.doorNames)[0])
console.log('met:', name)
// live list: a same-named branch 300 m away listed FIRST, then the real one next to you
live = [osm(900,name,40.6893,-73.9906,'bar'), osm(222,name,40.68714,-73.99050,'bar'), osm(111,"Dunkin' Donuts/Baskin Robbins",40.68668,-73.99055,'fast_food')]
await p.reload(); await p.waitForTimeout(5000)
console.log('places after sighting:', await p.evaluate(()=>JSON.stringify(JSON.parse(localStorage.vestra).state.doorPlaces)))
console.log('pins:', await p.$$eval('.door-label', e=>e.map(x=>x.innerText.replace(/\n/g,' | '))))
console.log('dock:', (await p.$eval('.door-part', e=>e.innerText)).replace(/\n/g,' | '))
await p.screenshot({ path:'/workspace/vestra-shots/v17-backfill.png' })
// next reload, list order flipped: memory now stays with the door by place
live = [osm(222,name,40.68714,-73.99050,'bar'), osm(900,name,40.6893,-73.9906,'bar')]
await p.reload(); await p.waitForTimeout(5000)
console.log('pins after flip:', await p.$$eval('.door-label', e=>e.map(x=>x.innerText.replace(/\n/g,' | '))))
await b.close()
