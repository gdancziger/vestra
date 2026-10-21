import { useEffect, useState } from 'react'
import type { CatchKind, Door } from './store'

export const FALLBACK = { lat: 40.6866, lng: -73.9906 } // Smith St & Bergen St, Brooklyn
export const RING_M = 150

export const FALLBACK_DOORS: Door[] = [
  { id: 'fb-bartabac', name: 'Bar Tabac', kind: 'bar', lat: 40.68712, lng: -73.99054 },
  { id: 'fb-biencuit', name: 'Bien Cuit', kind: 'bakery', lat: 40.68773, lng: -73.99012 },
  { id: 'fb-mileend', name: 'Mile End Deli', kind: 'restaurant', lat: 40.68672, lng: -73.98893 },
  { id: 'fb-luluc', name: 'Café Luluc', kind: 'cafe', lat: 40.684, lng: -73.99225 },
  { id: 'fb-smithcanteen', name: 'Smith Canteen', kind: 'cafe', lat: 40.68014, lng: -73.99557 },
]

export function distM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000, r = Math.PI / 180
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

export function usePlayer() {
  const [pos, setPos] = useState(FALLBACK)
  useEffect(() => {
    if (!navigator.geolocation) return
    const id = navigator.geolocation.watchPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])
  return pos
}

export function useDoors(pos: { lat: number; lng: number }) {
  const [doors, setDoors] = useState<Door[]>(FALLBACK_DOORS)
  const key = `${pos.lat.toFixed(3)},${pos.lng.toFixed(3)}`
  useEffect(() => {
    const ctl = new AbortController()
    const q = `[out:json][timeout:15];(node(around:450,${pos.lat},${pos.lng})["name"]["shop"];node(around:450,${pos.lat},${pos.lng})["name"]["amenity"~"cafe|restaurant|bar|pub|bakery|library|ice_cream|fast_food"];);out 60;`
    fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q), signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j: { elements: { id: number; lat: number; lon: number; tags: Record<string, string> }[] }) => {
        const list = j.elements.map((e) => ({ id: 'osm-' + e.id, name: e.tags.name, kind: e.tags.amenity || e.tags.shop || 'shop', lat: e.lat, lng: e.lon }))
        if (list.length) setDoors(list)
      })
      .catch(() => {})
    return () => ctl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return doors
}

const KINDS: CatchKind[] = ['plant', 'light', 'stone', 'nudge']
function rand(seed: number) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32) }

/** Today's catches: a few separate icons scattered inside the ring. Same all day. */
export function catchesFor(pos: { lat: number; lng: number }, day: string) {
  const r = rand([...day].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0)
  return Array.from({ length: 6 }, (_, i) => {
    const ang = r() * Math.PI * 2, d = (0.3 + r() * 0.6) * RING_M
    return {
      id: `${day}-${i}`,
      kind: KINDS[i % 4],
      lat: pos.lat + (d * Math.cos(ang)) / 111320,
      lng: pos.lng + (d * Math.sin(ang)) / (111320 * Math.cos((pos.lat * Math.PI) / 180)),
    }
  })
}
