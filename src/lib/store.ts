import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CatchKind = 'plant' | 'light' | 'stone' | 'nudge'
export const CATCH_GLYPH: Record<CatchKind, string> = { plant: '🌿', light: '✦', stone: '◆', nudge: '➶' }

export type Door = { id: string; name: string; kind: string; lat: number; lng: number }

export type DoorMemory = {
  visits: number
  firstAt: number
  lastAt: number
  lastDay: string
  left: CatchKind[]
  heard: string[]
  /** When you brought each person here. The door remembers the day, not a count. */
  broughtAt?: Record<string, number>
  /** What was left here, the day, and who you'd brought that day. What the door noticed, not a tally. */
  leftLog?: { k: CatchKind; at: number; with?: string }[]
  /** The days each person came with you. Days, not a tally: the door says "Oct 19 and Oct 20", never "2". */
  broughtDays?: Record<string, string[]>
  /** The hour of each day you came (one per day, last 6). The door notices when you come, not how often. */
  hours?: number[]
  /** How you first came through this door: brought with a friend, on another door's word. The door keeps its own start. */
  metThrough?: { by: string; with: string; at: number }
}

const today = () => new Date().toISOString().slice(0, 10)

type State = {
  name: string
  companion: string
  carry: CatchKind[]
  picked: Record<string, string[]> // day -> catch ids picked
  doors: Record<string, DoorMemory>
  doorNames: Record<string, string>
  /** Where each door you've met stands, so it stays the same door when the live map reloads. */
  doorPlaces?: Record<string, { lat: number; lng: number }>
  targetId: string | null
  hereId: string | null
  /** What the door just said when you arrived: your name + the one thing it gained. */
  greeting: { doorId: string; text: string } | null
  setName: (n: string) => void
  bring: (n: string) => void
  setTarget: (id: string | null) => void
  pick: (id: string, k: CatchKind) => void
  arrive: (d: Door) => void
  leave: (i: number) => void
  /** Doors you met before places were kept: write down where they stand the first time they're seen again. */
  placeDoors: (ds: Door[]) => void
}

export const useVestra = create<State>()(
  persist(
    (set, get) => ({
      name: '',
      companion: '',
      carry: [],
      picked: {},
      doors: {},
      doorNames: {},
      doorPlaces: {},
      targetId: null,
      hereId: null,
      greeting: null,
      setName: (name) => set({ name: name.trim() }),
      bring: (companion) => set({ companion: companion.trim() }),
      setTarget: (targetId) => set({ targetId }),
      pick: (id, k) => {
        const d = today()
        const p = get().picked[d] ?? []
        if (p.includes(id)) return
        set({ picked: { [d]: [...p, id] }, carry: [...get().carry, k].slice(-8) })
      },
      arrive: (door) => {
        const s = get()
        const m = s.doors[door.id]
        const d = today()
        const told = toldBy(s.doors, s.doorNames, s.companion, door.id)
        const heard = s.companion && !(m?.heard ?? []).includes(s.companion) ? [...(m?.heard ?? []), s.companion] : m?.heard ?? []
        const sameDay = m?.lastDay === d
        const prevDays = s.companion ? m?.broughtDays?.[s.companion] ?? (m?.broughtAt?.[s.companion] ? [new Date(m.broughtAt[s.companion]).toISOString().slice(0, 10)] : []) : []
        // A friend this door already met, back on a new day: the door recognizes them too.
        const again = s.companion && (m?.heard ?? []).includes(s.companion) && prevDays.length && !prevDays.includes(d) ? s.companion : ''
        const next: DoorMemory = {
          visits: (m?.visits ?? 0) + (sameDay ? 0 : 1),
          firstAt: m?.firstAt ?? Date.now(),
          lastAt: Date.now(),
          lastDay: d,
          left: m?.left ?? [],
          heard,
          broughtAt: s.companion ? { ...(m?.broughtAt ?? {}), [s.companion]: Date.now() } : m?.broughtAt,
          leftLog: m?.leftLog,
          broughtDays: s.companion ? { ...(m?.broughtDays ?? {}), [s.companion]: [...prevDays.filter((x) => x !== d), d].slice(-6) } : m?.broughtDays,
          hours: sameDay && m?.hours?.length ? m.hours : [...(m?.hours ?? []), new Date().getHours()].slice(-6),
          metThrough: m?.metThrough ?? (!m?.visits && s.companion && told ? { by: told, with: s.companion, at: Date.now() } : undefined),
        }
        set({
          doors: { ...s.doors, [door.id]: next },
          doorNames: { ...s.doorNames, [door.id]: door.name },
          doorPlaces: { ...(s.doorPlaces ?? {}), [door.id]: { lat: door.lat, lng: door.lng } },
          hereId: door.id,
          greeting: { doorId: door.id, text: greet(next, m, s.name, sameDay, heard !== (m?.heard ?? []) ? s.companion : '', told, again) },
          companion: s.companion && heard !== m?.heard ? '' : s.companion,
        })
      },
      leave: (i) => {
        const s = get()
        if (!s.hereId) return
        const k = s.carry[i]
        if (!k) return
        const m = s.doors[s.hereId]
        const withF = Object.entries(m.broughtAt ?? {}).find(([, t]) => new Date(t).toISOString().slice(0, 10) === today())?.[0]
        const log = [...(m.leftLog ?? []), { k, at: Date.now(), ...(withF ? { with: withF } : {}) }].slice(-6)
        set({
          carry: s.carry.filter((_, j) => j !== i),
          doors: { ...s.doors, [s.hereId]: { ...m, left: [...m.left, k].slice(-6), leftLog: log } },
          greeting: { doorId: s.hereId, text: `your ${CATCH_GLYPH[k]} stays here, ${s.name || 'friend'}` },
        })
      },
      placeDoors: (ds) => {
        const s = get()
        const pl = s.doorPlaces ?? {}
        const add = ds.filter((d) => s.doors[d.id] && !pl[d.id])
        if (!add.length) return
        set({ doorPlaces: { ...pl, ...Object.fromEntries(add.map((d) => [d.id, { lat: d.lat, lng: d.lng }])) } })
      },
    }),
    { name: 'vestra', partialize: (s) => ({ ...s, hereId: null, greeting: null }) },
  ),
)

/** What a door has become, from its memory. Each return adds one thing. */
/** `withNow`: who is walking with you right now. No door asks after someone standing beside you, even a door you aren't headed to. */
export function doorSelf(m: DoorMemory | undefined, you: string, bringing = '', told = '', withNow = bringing) {
  const v = m?.visits ?? 0
  const lines: string[] = []
  const keptG = m && m.left.length ? CATCH_GLYPH[m.left[m.left.length - 1]] : ''
  const waitingNow = m && m.visits >= 1 && m.lastDay !== today() ? waitingFor(m, withNow) : ''
  const expecting = !bringing ? '' : !(m?.heard ?? []).includes(bringing) ? `expecting ${bringing}${told && !m?.visits ? ` and you, ${you || 'friend'}` : ''}. ${told || you || 'a friend'} told us`
    : m?.broughtAt?.[bringing] && m.lastDay !== today() ? `${bringing} again. last here ${day(m.broughtAt[bringing])}` : ''
  const w = withYou(m)
  const n = you || 'friend'
  // The door's one noticed thing about you, with your name: not "knows you" (the status already says it met you).
  // Say each thing once: skip whatever the waiting or expecting line already names.
  const said = waitingNow + ' ' + expecting
  const log = m?.leftLog ?? []
  const mine = log[log.length - 1]
  const usual = usualWith(m)
  const lastF = m?.broughtAt ? Object.entries(m.broughtAt).sort((a, b) => b[1] - a[1])[0]?.[0] : ''
  const noticed = !m || v < 1 ? null
    : usual && !said.includes(usual) ? { line: `${n}, who usually comes with ${usual}`, f: usual }
    : keptG && !said.includes(keptG) ? { line: `${n}, who left the ${keptG}${mine ? ' ' + when(mine.at) : ''}`, g: keptG }
    : lastF && w && !said.includes(lastF) ? { line: `${n}, who came with ${lastF} ${w.endsWith('today') ? 'today' : w.split(' ').slice(-2).join(' ')}`, f: lastF }
    : comesWhen(m) ? { line: `${n}, ${comesWhen(m)}` }
    : { line: `knows you by name, ${n}` }
  if (noticed) lines.push(noticed.line)
  // Who you came with, if the noticed line didn't already say it.
  if (w && !(noticed && 'f' in noticed && noticed.f === lastF) && !said.includes(lastF ?? '')) lines.push(w)
  else if (!w && m && m.heard.length) lines.push(`already heard of ${m.heard.join(', ')}`)
  return {
    visits: v,
    regular: v >= 2,
    light: v >= 2 || !!m?.left.includes('light'),
    plant: v >= 3 || !!m?.left.includes('plant'),
    /** 0..1, how warm this door's light has grown from your returns. */
    warmth: Math.min(1, v / 6),
    /** The one fact the door keeps about you, once you are a regular of 4+ visits. */
    fact: v >= 4 && m ? `since ${new Date(m.firstAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : '',
    /** What this door is saving for your next return, said only after you've been here today. */
    promise: m && m.lastDay === today() ? promiseFor(m) : '',
    /** On a later day, what this door has been keeping ready for you. Exactly what greet() will say when you arrive. */
    waiting: waitingNow,
    /** You're bringing someone here: the door has already heard of them before you arrive. */
    expecting,
    /** The day after the door asked you to bring someone: it asks again, right where you'd answer. Gone once you name them. */
    asks: m && v >= 4 && !m.heard.length && m.lastDay !== today() && !bringing ? "bringing someone? they'll already be expected" : '',
    /** The last person you brought here, and the day. Kept when you come back alone. */
    withYou: w,
    /** The door's own words for how it knows you. Days, never a count; the first day stays visit 4's gift. */
    status: (!m || v === 0) && told && bringing ? 'heard of you' : !m || v === 0 ? 'stranger' : v === 1 ? `met you ${when(m.firstAt)}` : v < 4 ? `a regular · ${m.lastDay === today() ? 'here today' : `last here ${day(m.lastAt)}`}` : `a regular since ${day(m.firstAt)}`,
    lines,
  }
}

const isoDay = (d: string) => day(new Date(d + 'T12:00').getTime())
const day = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
const when = (t: number) => (new Date(t).toISOString().slice(0, 10) === today() ? 'today' : day(t))

/** The door speaks on arrival: your name, and the one thing it gained because you came back. */
function greet(next: DoorMemory, prev: DoorMemory | undefined, you: string, sameDay: boolean, friend: string, told = '', again = '') {
  const n = you || 'friend'
  // A door told about your friend by another door was told about you too: at a door new to you both, it greets you both.
  if (friend) return `${friend}, ${told || n} told us about you.${told && !prev?.visits ? ` you too, ${n}.` : ''} come in`
  if (again) return `${again}, good to see you again. you too, ${n}`
  if (sameDay && prev) return `still here, ${n}`
  const v = next.visits
  if (v === 1) return `nice to meet you, ${n}. we'll remember`
  // Back in the part of the day the door already knows you by: it says so instead of a plain "welcome back".
  const nowPart = partOf(new Date().getHours())
  const hi = usualPart(prev?.hours) === nowPart[2] ? `${HELLO[nowPart[2]]}, ${n}. right on time.` : `welcome back, ${n}.`
  if (v === 2) return `${hi} ${firstLight(prev).replace(/ here$/, "")}`
  if (v === 3) return `${hi} there's a plant by the door now`
  if (v === 4) return `${hi} you first came ${day(next.firstAt)}`
  const f = lastBrought(prev)
  if (f) return `${hi} how is ${f}?`
  const kept = next.left[next.left.length - 1]
  return kept ? `${hi} your ${CATCH_GLYPH[kept]} is still here` : `${hi} your light is warmer`
}

/** The one thing a door will gain if you come back on another day. Honest: it is exactly what greet() will say. */
function promiseFor(m: DoorMemory) {
  const v = m.visits
  if (v === 1) return 'come back tomorrow, a light will be on for you'
  if (v === 2) return 'come back tomorrow, there will be a plant by the door'
  if (v === 3) return "next time, it'll tell you the day you first came"
  if (!m.heard.length) return "bring someone next time, they'll already be expected"
  const f = lastBrought(m)
  // The friend is standing here today: don't promise to ask after them. Next time it knows you both, together or not.
  if (f && m.broughtDays?.[f]?.includes(today())) return `next time, with ${f} or without, it'll know you both`
  if (f) return `next time, it'll ask after ${f}`
  if (v < 6) return 'each return, your light here grows warmer'
  return ''
}

/** The next day, the door shows what it kept ready for you, so returning has a visible reason before you arrive. */
function waitingFor(m: DoorMemory, bringing = '') {
  const v = m.visits
  if (v === 1) return firstLight(m)
  if (v === 2) return 'a plant is waiting by the door'
  if (v === 3) return 'it remembers the day you first came'
  const f = lastBrought(m)
  // You're bringing that very friend: the door doesn't ask after someone walking in with you ("Noa again" says it).
  if (f && f === bringing) return ''
  if (f) return `it still asks after ${f}`
  const kept = m.left[m.left.length - 1]
  return kept ? `your ${CATCH_GLYPH[kept]} is still here` : 'your light here kept warm'
}

/** Day two's light. At a door you first walked into on another door's word, the light remembers that shared start. */
function firstLight(m: DoorMemory | undefined) {
  const t = m?.metThrough
  return t ? `a light is on for you, since ${t.by} sent you with ${t.with}` : 'a light is on for you here'
}

/** The last person you brought to this door (only from your 4th visit on, so the early returns keep their own gifts). */
function lastBrought(m: DoorMemory | undefined) {
  if (!m?.broughtAt || m.visits < 4) return ''
  const e = Object.entries(m.broughtAt).sort((a, b) => b[1] - a[1])[0]
  return e ? e[0] : ''
}

const PART: [number, string, string][] = [[5, 'late one night', 'late at night'], [11, 'one morning', 'in the morning'], [14, 'one lunchtime', 'at lunchtime'], [17, 'one afternoon', 'in the afternoon'], [22, 'one evening', 'in the evening'], [24, 'late one night', 'late at night']]
const partOf = (h: number) => PART.find(([end]) => h < end)!
const HELLO: Record<string, string> = { 'in the morning': 'morning', 'at lunchtime': 'lunchtime', 'in the afternoon': 'afternoon', 'in the evening': 'evening', 'late at night': 'late again' }
/** The part of the day two or more of your days here share, or ''. */
function usualPart(hours: number[] | undefined) {
  const parts = (hours ?? []).map((h) => partOf(h)[2])
  return [...new Set(parts)].reverse().find((x) => parts.filter((y) => y === x).length >= 2) ?? ''
}
/** When you come, as the door noticed it: "who came by one evening", or once two days share it, "who usually comes in the evening". */
export function comesWhen(m: DoorMemory | undefined) {
  if (!m || m.visits < 1) return ''
  const hs = m.hours?.length ? m.hours : [new Date(m.firstAt).getHours()]
  const usual = usualPart(hs)
  if (usual) return `who usually comes ${usual}`
  const [, once, usualWord] = partOf(hs[hs.length - 1])
  // Still the same day: "this evening", not "one evening".
  if (m.lastDay === today()) return `who came by ${usualWord.startsWith('late') ? 'tonight' : 'this ' + usualWord.split(' ').pop()}`
  return `who came by ${once}`
}

/** Once someone has come with you on two different days, the door knows them as your usual company. */
function usualWith(m: DoorMemory | undefined) {
  return Object.entries(m?.broughtDays ?? {}).filter(([, ds]) => ds.length >= 2).sort((a, b) => b[1][b[1].length - 1].localeCompare(a[1][a[1].length - 1]))[0]?.[0] ?? ''
}

/** "Noa came with you Oct 21": the door keeps who you brought, and when. */
function withYou(m: DoorMemory | undefined) {
  if (!m?.broughtAt) return ''
  const e = Object.entries(m.broughtAt).sort((a, b) => b[1] - a[1])[0]
  if (!e) return ''
  return new Date(e[1]).toISOString().slice(0, 10) === today() ? `${e[0]} came with you today` : `${e[0]} came with you ${day(e[1])}`
}

/** The first other door you brought this person to. That door "tells" the next one, so a friend carries across doors. */
export function toldBy(doors: Record<string, DoorMemory>, names: Record<string, string>, friend: string, exceptId: string) {
  if (!friend) return ''
  const e = Object.entries(doors)
    .filter(([id, m]) => id !== exceptId && m.broughtAt?.[friend])
    .sort((a, b) => a[1].broughtAt![friend] - b[1].broughtAt![friend])[0]
  return e ? names[e[0]] ?? '' : ''
}

/** The door's own view: the people it knows, by name and day. No counts, no ranks. This is what a merchant would see. */
export function doorKnows(m: DoorMemory | undefined, you: string, expecting = '', told = '') {
  const out: { who: string; how: string; noticed?: string; now?: boolean }[] = []
  const n = you || 'you'
  const log = m?.leftLog ?? []
  if (m && m.visits >= 1) {
    const here = m.lastDay === today()
    const mine = log[log.length - 1]
    const lastKind = m.left[m.left.length - 1]
    const left = mine ? `left a ${CATCH_GLYPH[mine.k]} ${day(mine.at)}` : lastKind ? `left a ${CATCH_GLYPH[lastKind]}` : ''
    // Once someone has come with you on two different days, the door knows them as your usual company.
    const usual = usualWith(m)
    const noticed = [left, usual ? `usually comes with ${usual}` : ''].filter(Boolean).join(' · ') || comesWhen(m).replace(/^who /, '')
    out.push({ who: n, how: `${m.visits >= 2 ? 'a regular since' : 'met'} ${day(m.firstAt)} · ${here ? 'here now' : `last came ${day(m.lastAt)}`}`, noticed, now: here })
  }
  for (const f of m?.heard ?? []) {
    const t = m?.broughtAt?.[f]
    const theirs = [...log].reverse().find((e) => e.with === f)
    const ds = m?.broughtDays?.[f] ?? []
    const when = ds.length >= 2 ? ds.slice(-2).map(isoDay).join(' and ') : t ? day(t) : ''
    const coming = expecting === f && m?.lastDay !== today()
    out.push({ who: f, how: coming ? `coming again with ${n} · last here ${when}` : t ? `came with ${n} ${when}` : `heard of from ${n}`, noticed: theirs ? `was here when the ${CATCH_GLYPH[theirs.k]} was left` : '', now: coming || undefined })
  }
  if (expecting && told && !m?.visits) out.push({ who: n, how: `expected with ${expecting}. ${told} told us`, now: true })
  if (expecting && !(m?.heard ?? []).includes(expecting)) out.push({ who: expecting, how: `expected. ${told || n} told us`, now: true })
  return out
}

const norm = (t: string) => t.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '')
const near = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const dy = (a.lat - b.lat) * 111320, dx = (a.lng - b.lng) * 111320 * Math.cos((a.lat * Math.PI) / 180)
  return Math.hypot(dx, dy)
}

/**
 * A door you've met stays that door. When the live street list loads, its ids differ from the ones the door
 * was remembered under; match by name and place so a known door never turns back into a stranger, and keep a
 * remembered door on the map even if the live list leaves it out.
 */
export function keepKnownDoors(live: Door[], pos: { lat: number; lng: number }, mem: Record<string, DoorMemory>, names: Record<string, string>, places: Record<string, { lat: number; lng: number }> = {}, extra: string[] = []): Door[] {
  const known = [...new Set([...Object.keys(mem), ...extra])].filter((id) => names[id] || live.some((d) => d.id === id))
  const liveIds = new Set(live.map((d) => d.id))
  const used = new Set<string>()
  // Match nearest live doors first: a door remembered by name only (no place yet) goes to the same-named door
  // closest to you, not to whichever branch of a chain the list happened to put first.
  const swap = new Map<string, string>()
  for (const d of [...live].sort((a, b) => near(pos, a) - near(pos, b))) {
    if (mem[d.id]) continue
    const id = known.find((k) => !liveIds.has(k) && !used.has(k) && names[k] && norm(names[k]) === norm(d.name) && (places[k] ? near(places[k], d) < 120 : near(pos, d) < 450))
    if (!id) continue
    used.add(id)
    swap.set(d.id, id)
  }
  const out = live.map((d) => (swap.has(d.id) ? { ...d, id: swap.get(d.id)! } : d))
  const have = new Set(out.map((d) => d.id))
  for (const id of known) {
    const pl = places[id]
    if (have.has(id) || !pl || !names[id] || near(pl, pos) > 450) continue
    out.push({ id, name: names[id], kind: 'door', lat: pl.lat, lng: pl.lng })
  }
  return out
}

/** Before you choose: the door that's waiting for you, if one is within reach, else simply the nearest door. */
export function firstDoor(doors: Door[], pos: { lat: number; lng: number }, mem: Record<string, DoorMemory>, reach: number): Door | null {
  const byDist = [...doors].sort((a, b) => near(pos, a) - near(pos, b))
  const d = today()
  return byDist.find((x) => mem[x.id] && mem[x.id].visits >= 1 && mem[x.id].lastDay !== d && near(pos, x) <= reach) ?? byDist[0] ?? null
}
