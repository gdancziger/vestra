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
        }
        set({
          doors: { ...s.doors, [door.id]: next },
          doorNames: { ...s.doorNames, [door.id]: door.name },
          hereId: door.id,
          greeting: { doorId: door.id, text: greet(next, m, s.name, sameDay, heard !== (m?.heard ?? []) ? s.companion : '') },
          companion: s.companion && heard !== m?.heard ? '' : s.companion,
        })
      },
      leave: (i) => {
        const s = get()
        if (!s.hereId) return
        const k = s.carry[i]
        if (!k) return
        const m = s.doors[s.hereId]
        set({
          carry: s.carry.filter((_, j) => j !== i),
          doors: { ...s.doors, [s.hereId]: { ...m, left: [...m.left, k].slice(-6) } },
          greeting: { doorId: s.hereId, text: `your ${k} stays here, ${s.name || 'friend'}` },
        })
      },
    }),
    { name: 'vestra', partialize: (s) => ({ ...s, hereId: null, greeting: null }) },
  ),
)

/** What a door has become, from its memory. Each return adds one thing. */
export function doorSelf(m: DoorMemory | undefined, you: string) {
  const v = m?.visits ?? 0
  const lines: string[] = []
  if (v >= 1) lines.push(`knows you, ${you || 'friend'}`)
  if (m && m.left.length) lines.push(`keeps your ${m.left[m.left.length - 1]}`)
  if (v >= 4 && m) lines.push(`remembers you first came ${new Date(m.firstAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`)
  if (m && m.heard.length) lines.push(`already heard of ${m.heard.join(', ')}`)
  return {
    visits: v,
    regular: v >= 2,
    light: v >= 2 || !!m?.left.includes('light'),
    plant: v >= 3 || !!m?.left.includes('plant'),
    /** 0..1, how warm this door's light has grown from your returns. */
    warmth: Math.min(1, v / 6),
    /** The one fact the door keeps about you, once you are a regular of 4+ visits. */
    fact: v >= 4 && m ? `since ${new Date(m.firstAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : '',
    status: v === 0 ? 'stranger' : v === 1 ? 'known · 1 visit' : `regular · ${v} visits`,
    lines,
  }
}

const day = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

/** The door speaks on arrival: your name, and the one thing it gained because you came back. */
function greet(next: DoorMemory, prev: DoorMemory | undefined, you: string, sameDay: boolean, friend: string) {
  const n = you || 'friend'
  if (friend) return `${friend}, ${n} told us about you. come in`
  if (sameDay && prev) return `still here, ${n}`
  const v = next.visits
  if (v === 1) return `nice to meet you, ${n}. we'll remember`
  if (v === 2) return `welcome back, ${n}. a light is on for you`
  if (v === 3) return `welcome back, ${n}. there's a plant by the door now`
  if (v === 4) return `welcome back, ${n}. you first came ${day(next.firstAt)}`
  const kept = next.left[next.left.length - 1]
  return kept ? `welcome back, ${n}. your ${kept} is still here` : `welcome back, ${n}. your light is warmer`
}
