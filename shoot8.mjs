import { chromium } from 'playwright'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:430,height:900}, geolocation:{latitude:40.6866,longitude:-73.9906}, permissions:['geolocation'] })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:8080'); await p.waitForTimeout(6000)
await p.fill('.dock input','Gabe'); await p.press('.dock input','Enter')
await p.click('.main'); await p.waitForTimeout(300); await p.click('.main'); await p.waitForTimeout(300)
const first = await p.evaluate(()=>JSON.parse(localStorage.vestra).state.targetId)
// yesterday Gabe brought Noa to this first door
await p.evaluate((id)=>{const s=JSON.parse(localStorage.vestra);const m=s.state.doors[id];m.lastDay='2000-01-01';m.heard=['Noa'];m.broughtAt={Noa:Date.now()-86400000};s.state.targetId=null;localStorage.vestra=JSON.stringify(s)},first)
await p.reload(); await p.waitForTimeout(5000)
// pick the nearest other door as target
const others = await p.$$('.leaflet-marker-icon.door:not(.is-known)')
let ok=false
for (const el of others) { await el.click({force:true}); await p.waitForTimeout(200); const t=await p.textContent('.main'); if (t.startsWith('Arrive')) { ok=true; break } }
console.log('second in ring', ok, await p.textContent('.main'))
await p.click('.who .ghost'); await p.fill('.who input','Noa'); await p.press('.who input','Enter'); await p.waitForTimeout(500)
await p.screenshot({ path:'/workspace/vestra-shots/v8-expecting.png' })
console.log('dock', await p.textContent('.door-part'))
await p.click('.main'); await p.waitForTimeout(500)
await p.screenshot({ path:'/workspace/vestra-shots/v8-arrive.png' })
console.log('dock', await p.textContent('.door-part'))
await b.close()
