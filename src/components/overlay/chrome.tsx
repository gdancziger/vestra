import { useState } from 'react'
import { CATCH_GLYPH, doorKnows, doorSelf, firstDoor, toldBy, useVestra, type Door } from '../../lib/store'
import { RING_M, distM } from '../../lib/world'

type P = { lat: number; lng: number }

export function Chrome({ pos, doors }: { pos: P; doors: Door[] }) {
  const s = useVestra()
  const [draft, setDraft] = useState('')
  const [bringing, setBringing] = useState(false)
  const [doorView, setDoorView] = useState(false)
  const target = doors.find((d) => d.id === s.targetId) ?? null
  const near = [...doors].sort((a, b) => distM(pos, a) - distM(pos, b))
  const here = s.hereId ? doors.find((d) => d.id === s.hereId) ?? null : null
  // On a return day, the door that kept something for you comes first, not whichever stranger is closest.
  const door = target ?? firstDoor(doors, pos, s.doors, RING_M) ?? near[0] ?? null
  const mem = door ? s.doors[door.id] : undefined
  const isHereFor = (d: Door | null) => !!d && s.hereId === d.id
  const self = doorSelf(mem, s.name, target && !isHereFor(door) ? s.companion : '', door ? toldBy(s.doors, s.doorNames, s.companion, door.id) : '')
  const dist = door ? Math.round(distM(pos, door)) : 0
  const inRing = dist <= RING_M
  const isHere = !!door && here?.id === door.id
  const told = door ? toldBy(s.doors, s.doorNames, s.companion, door.id) : ''
  const knows = doorKnows(mem, s.name, target && !isHere ? s.companion : '', told)

  const main = () => {
    if (!door) return
    if (!target) return s.setTarget(door.id)
    if (inRing && !isHere) s.arrive(door)
  }
  const label = !door ? 'Looking for doors…' : !target ? `Go to ${door.name}` : isHere ? `You're at ${door.name}` : inRing ? `Arrive at ${door.name}` : `Walk to ${door.name} · ${dist} m`

  return (
    <div className="dock">
      <section className="who">
        {s.name ? (
          <>
            <div className="k">you</div>
            <div className="v">{s.name}</div>
            {bringing ? (
              <form onSubmit={(e) => { e.preventDefault(); s.bring(draft); setDraft(''); setBringing(false) }}>
                <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="their name" />
              </form>
            ) : s.companion ? (
              <div className="sub">with {s.companion}</div>
            ) : (
              <button className="ghost" onClick={() => setBringing(true)}>+ bring someone</button>
            )}
          </>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { s.setName(draft); setDraft('') } }}>
            <div className="k">who are you?</div>
            <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="your name" />
          </form>
        )}
      </section>

      <section className="door-part">
        <div className="k">the door</div>
        <div className="v">{door?.name ?? '—'}</div>
        <div className={'sub ' + (self.regular ? 'reg' : '')}>{self.status}</div>
        {knows.length > 0 && <button className="ghost door-view-t" onClick={() => setDoorView(!doorView)}>{doorView ? '← your view' : 'how the door sees it'}</button>}
        {doorView && knows.length > 0 ? (
          <div className="knows">
            <div className="k">{door?.name} knows</div>
            {knows.map((p) => <div key={p.who} className={'person' + (p.now ? ' now' : '')}><b>{p.who}</b> <span>{p.how}</span>{p.noticed && <div className="noticed">{p.noticed}</div>}</div>)}
          </div>
        ) : <>
        {isHere && s.greeting?.doorId === door?.id && <div className="line says">“{s.greeting.text}”</div>}
        {!isHere && self.expecting && <div className="line expecting">{self.expecting}</div>}
        {!isHere && self.waiting && <div className="line waiting">{self.waiting}</div>}
        {isHere && self.promise && <div className="line promise">{self.promise}</div>}
        {self.lines.slice(0, isHere && s.greeting ? (self.promise ? 0 : 1) : 2).map((l) => <div key={l} className="line">{l}</div>)}
        </>}
      </section>

      <section className="carry">
        <div className="k">you carry</div>
        <div className="icons">
          {s.carry.length === 0 && <span className="sub">pick up what's on the street</span>}
          {s.carry.map((k, i) => (
            <button key={i} className={'c c-' + k} disabled={!isHere} title={isHere ? `Leave ${k} at ${door?.name}` : k} onClick={() => s.leave(i)}>{CATCH_GLYPH[k]}</button>
          ))}
        </div>
        {isHere && s.carry.length > 0 && <div className="sub">tap one to leave it here</div>}
      </section>

      <button className="main" disabled={!door || isHere || (!!target && !inRing)} onClick={main}>{label}</button>
    </div>
  )
}
