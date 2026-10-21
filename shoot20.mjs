import { chromium } from 'playwright'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport:{width:430,height:900}, geolocation:{latitude:40.6866,longitude:-73.9906}, permissions:['geolocation'] })
const p = await ctx.newPage()
await p.route('**/overpass-api.de/**', (r) => r.abort())
const dock = async (t) => console.log(t, (await p.$eval('.door-part', e=>e.innerText)).replace(/\n/g,' | '))
await p.goto('http://127.0.0.1:8080'); await p.waitForTimeout(4000)
await p.fill('.dock input','Gabe'); await p.press('.dock input','Enter'); await p.waitForTimeout(300)
await p.click('.main'); await p.waitForTimeout(400); await p.click('.main'); await p.waitForTimeout(500)
await dock('day1 arrived:')
const D=86400000
const seed = (fn) => p.evaluate(fn)
// day 2, nothing left, alone
await seed(()=>{const s=JSON.parse(localStorage.vestra);for(const m of Object.values(s.state.doors)){m.lastDay='2000-01-01';m.lastAt-=86400000;m.firstAt-=86400000};s.state.targetId=null;localStorage.vestra=JSON.stringify(s)})
await p.reload(); await p.waitForTimeout(4000); await dock('day2 alone, nothing left:')
await p.screenshot({ path:'/workspace/vestra-shots/v20-day2.png' })
await seed(()=>{const s=JSON.parse(localStorage.vestra);for(const m of Object.values(s.state.doors)){m.visits=2;m.hours=[19,20]};localStorage.vestra=JSON.stringify(s)})
await p.reload(); await p.waitForTimeout(4000); await dock('visit2 two evenings:')
await seed(()=>{const s=JSON.parse(localStorage.vestra);for(const m of Object.values(s.state.doors)){m.visits=1;delete m.hours};localStorage.vestra=JSON.stringify(s)})
await p.reload(); await p.waitForTimeout(4000); await dock('old memory no hours:')
// visit 3 next day, a plant left yesterday
await seed(()=>{const s=JSON.parse(localStorage.vestra);for(const m of Object.values(s.state.doors)){m.visits=3;m.left=['plant'];m.leftLog=[{k:'plant',at:m.lastAt}]};localStorage.vestra=JSON.stringify(s)})
await p.reload(); await p.waitForTimeout(4000); await dock('visit3, plant left:')
await p.screenshot({ path:'/workspace/vestra-shots/v20-noticed.png' })
// visit 5, came with Noa on two days
await seed(()=>{const s=JSON.parse(localStorage.vestra);for(const m of Object.values(s.state.doors)){m.visits=5;m.heard=['Noa'];m.broughtAt={Noa:m.lastAt};const d1=new Date(m.lastAt-2*86400000).toISOString().slice(0,10),d2=new Date(m.lastAt).toISOString().slice(0,10);m.broughtDays={Noa:[d1,d2]}};localStorage.vestra=JSON.stringify(s)})
await p.reload(); await p.waitForTimeout(4000); await dock('visit5 alone, usual Noa:')
await p.screenshot({ path:'/workspace/vestra-shots/v20-usual.png' })
// same, but bringing Noa
await p.click('.ghost'); await p.fill('.dock input','Noa'); await p.press('.dock input','Enter'); await p.waitForTimeout(300)
await p.click('.main'); await p.waitForTimeout(500); await dock('visit5 bringing Noa:')
await b.close()
