import { chromium } from 'playwright'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:430,height:900}, geolocation:{latitude:40.6866,longitude:-73.9906}, permissions:['geolocation'] })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:8080'); await p.waitForTimeout(6000)
await p.screenshot({ path:'/workspace/vestra-shots/v2.png' })
// play the loop through the UI
await p.fill('.dock input','Gabe'); await p.press('.dock input','Enter')
for (const el of await p.$$('.catch')) { await el.click({force:true}).catch(()=>{}) }
await p.click('.main'); await p.waitForTimeout(300)          // set target (nearest)
await p.click('.main'); await p.waitForTimeout(300)          // arrive
await p.click('.icons .c >> nth=0').catch(()=>{})          // leave a catch
const id = await p.evaluate(()=>JSON.parse(localStorage.vestra).state.targetId)
// seed past returns: 4 prior visits on earlier days
await p.evaluate((id)=>{const s=JSON.parse(localStorage.vestra);const m=s.state.doors[id];m.visits=5;m.firstAt=Date.now()-1000*86400*12;m.lastDay='2000-01-01';m.heard=['Noa'];localStorage.vestra=JSON.stringify(s)},id)
await p.reload(); await p.waitForTimeout(5000)
await p.screenshot({ path:'/workspace/vestra-shots/v2-return.png' })
console.log('target', id); await b.close()
