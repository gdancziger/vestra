import { chromium } from 'playwright'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:430,height:900}, geolocation:{latitude:40.6866,longitude:-73.9906}, permissions:['geolocation'] })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:8080'); await p.waitForTimeout(6000)
await p.fill('.dock input','Gabe'); await p.press('.dock input','Enter')
await p.click('.main'); await p.waitForTimeout(300); await p.click('.main'); await p.waitForTimeout(300)
const id = await p.evaluate(()=>JSON.parse(localStorage.vestra).state.targetId)
// it's now "tomorrow": the visit was yesterday
await p.evaluate((id)=>{const s=JSON.parse(localStorage.vestra);const m=s.state.doors[id];m.lastDay='2000-01-01';localStorage.vestra=JSON.stringify(s)},id)
await p.reload(); await p.waitForTimeout(5000)
await p.screenshot({ path:'/workspace/vestra-shots/v5-waiting.png' })
const t1 = await p.textContent('.door-part'); 
await p.click('.main'); await p.waitForTimeout(800)
await p.screenshot({ path:'/workspace/vestra-shots/v5-arrive.png' })
console.log('target', id, '|', t1, '|', await p.textContent('.door-part')); await b.close()
