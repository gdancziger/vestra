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
}

const today = () => new Date().toISOString().slice(0, 10)

type State = {
  name: string
  companion: string
  carry: CatchKind[]
  picked: Record<string, string[]> // day -> catch ids picked
  doors: Record<string, DoorMemory>
  doorNames: Record<string, string>
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
        const heard = s.companion && !(m?.heard ?? []).includes(s.companion) ? [...(m?.heard ?? []), s.companion] : m?.heard ?? []
        const sameDay = m?.lastDay === d
        const next: DoorMemory = {
          visits: (m?.visits ?? 0) + (sameDay ? 0 : 1),
          firstAt: m?.firstAt ?? Date.now(),
          lastAt: Date.now(),
          lastDay: d,
          left: m?.left ?? [],
          heard,
          broughtAt: s.companion ? { ...(m?.broughtAt ?? {}), [s.companion]: Date.now() } : m?.broughtAt,
          leftLog: m?.leftLog,
        }
        set({
          doors: { ...s.doors, [door.id]: next },
          doorNames: { ...s.doorNames, [door.id]: door.name },
          hereId: door.id,
          greeting: { doorId: door.id, text: greet(next, m, s.name, sameDay, heard !== (m?.heard ?? []) ? s.companion : '', toldBy(s.doors, s.doorNames, s.companion, door.id)) },
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
          greeting: { doorId: s.hereId, text: `your ${k} stays here, ${s.name || 'friend'}` },
        })
      },
    }),
    { name: 'vestra', partialize: (s) => ({ ...s, hereId: null, greeting: null }) },
  ),
)

/** What a door has become, from its memory. Each return adds one thing. */
export function doorSelf(m: DoorMemory | undefined, you: string, bringing = '', told = '') {
  const v = m?.visits ?? 0
  const lines: string[] = []
  if (v >= 1) lines.push(`knows you, ${you || 'friend'}`)
  if (m && m.left.length) lines.push(`keeps your ${m.left[m.left.length - 1]}`)
  if (v >= 4 && m) lines.push(`remembers you first came ${new Date(m.firstAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`)
  const w = withYou(m)
  if (w) lines.push(w)
  else if (m && m.heard.length) lines.push(`already heard of ${m.heard.join(', ')}`)
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
    waiting: m && m.visits >= 1 && m.lastDay !== today() ? waitingFor(m) : '',
    /** You're bringing someone here: the door has already heard of them before you arrive. */
    expecting: bringing && !(m?.heard ?? []).includes(bringing) ? `expecting ${bringing}. ${told || you || 'a friend'} told us` : '',
    /** The last person you brought here, and the day. Kept when you come back alone. */
    withYou: w,
    status: v === 0 ? 'stranger' : v === 1 ? 'known · 1 visit' : `regular · ${v} visits`,
    lines,
  }
}

const day = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

/** The door speaks on arrival: your name, and the one thing it gained because you came back. */
function greet(next: DoorMemory, prev: DoorMemory | undefined, you: string, sameDay: boolean, friend: string, told = '') {
  const n = you || 'friend'
  if (friend) return `${friend}, ${told || n} told us about you. come in`
  if (sameDay && prev) return `still here, ${n}`
  const v = next.visits
  if (v === 1) return `nice to meet you, ${n}. we'll remember`
  if (v === 2) return `welcome back, ${n}. a light is on for you`
  if (v === 3) return `welcome back, ${n}. there's a plant by the door now`
  if (v === 4) return `welcome back, ${n}. you first came ${day(next.firstAt)}`
  const f = lastBrought(prev)
  if (f) return `welcome back, ${n}. how is ${f}?`
  const kept = next.left[next.left.length - 1]
  return kept ? `welcome back, ${n}. your ${kept} is still here` : `welcome back, ${n}. your light is warmer`
}

/** The one thing a door will gain if you come back on another day. Honest: it is exactly what greet() will say. */
function promiseFor(m: DoorMemory) {
  const v = m.visits
  if (v === 1) return 'come back tomorrow, a light will be on for you'
  if (v === 2) return 'come back tomorrow, there will be a plant by the door'
  if (v === 3) return "next time, it'll tell you the day you first came"
  if (!m.heard.length) return "bring someone next time, they'll already be expected"
  const f = lastBrought(m)
  if (f) return `next time, it'll ask after ${f}`
  if (v < 6) return 'each return, your light here grows warmer'
  return ''
}

/** The next day, the door shows what it kept ready for you, so returning has a visible reason before you arrive. */
function waitingFor(m: DoorMemory) {
  const v = m.visits
  if (v === 1) return 'a light is on for you here'
  if (v === 2) return 'a plant is waiting by the door'
  if (v === 3) return 'it remembers the day you first came'
  const f = lastBrought(m)
  if (f) return `it still asks after ${f}`
  const kept = m.left[m.left.length - 1]
  return kept ? `your ${kept} is still here` : 'your light here kept warm'
}

/** The last person you brought to this door (only from your 4th visit on, so the early returns keep their own gifts). */
function lastBrought(m: DoorMemory | undefined) {
  if (!m?.broughtAt || m.visits < 4) return ''
  const e = Object.entries(m.broughtAt).sort((a, b) => b[1] - a[1])[0]
  return e ? e[0] : ''
}

/** "Noa came with you Oct 21": the door keeps who you brought, and when. */
function withYou(m: DoorMemory | undefined) {
  if (!m?.broughtAt) return ''
  const e = Object.entries(m.broughtAt).sort((a, b) => b[1] - a[1])[0]
  return e ? `${e[0]} came with you ${day(e[1])}` : ''
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
    const noticed = mine ? `left a ${CATCH_GLYPH[mine.k]} ${day(mine.at)}` : lastKind ? `left a ${CATCH_GLYPH[lastKind]}` : ''
    out.push({ who: n, how: `${m.visits >= 2 ? 'a regular since' : 'met'} ${day(m.firstAt)} · ${here ? 'here now' : `last came ${day(m.lastAt)}`}`, noticed, now: here })
  }
  for (const f of m?.heard ?? []) {
    const t = m?.broughtAt?.[f]
    const theirs = [...log].reverse().find((e) => e.with === f)
    out.push({ who: f, how: t ? `came with ${n} ${day(t)}` : `heard of from ${n}`, noticed: theirs ? `was here when the ${CATCH_GLYPH[theirs.k]} was left` : '' })
  }
  if (expecting && !(m?.heard ?? []).includes(expecting)) out.push({ who: expecting, how: `expected. ${told || n} told us`, now: true })
  return out
}
