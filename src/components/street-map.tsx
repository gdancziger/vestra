import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { Circle, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import { CATCH_GLYPH, doorSelf, toldBy, useVestra, type Door } from '../lib/store'
import { RING_M, catchesFor, distM } from '../lib/world'

type P = { lat: number; lng: number }

function Follow({ pos }: { pos: P }) {
  const map = useMap()
  useEffect(() => { map.setView([pos.lat, pos.lng], map.getZoom(), { animate: true }) }, [pos.lat, pos.lng, map])
  return null
}

/** When the target door is off screen, its name sits on the ring edge in its direction. */
function EdgeName({ pos, door }: { pos: P; door: Door }) {
  const map = useMap()
  const [, tick] = useState(0)
  useEffect(() => {
    const f = () => tick((n) => n + 1)
    map.on('move zoom resize', f)
    return () => { map.off('move zoom resize', f) }
  }, [map])
  const size = map.getSize()
  const t = map.latLngToContainerPoint([door.lat, door.lng])
  const inView = t.x > 20 && t.y > 60 && t.x < size.x - 20 && t.y < size.y - 230
  if (inView) return null
  const c = map.latLngToContainerPoint([pos.lat, pos.lng])
  const edge = map.latLngToContainerPoint(L.latLng(pos.lat + RING_M / 111320, pos.lng))
  const rpx = Math.abs(c.y - edge.y)
  const a = Math.atan2(t.y - c.y, t.x - c.x)
  const x = c.x + Math.cos(a) * rpx, y = c.y + Math.sin(a) * rpx
  return (
    <div className="edge-name" style={{ left: x, top: y }}>
      <span className="edge-arrow" style={{ transform: `rotate(${a}rad)` }}>➤</span>
      {door.name}
    </div>
  )
}

function doorIcon(door: Door, target: boolean, name: string, mem: ReturnType<typeof useVestra.getState>['doors'][string] | undefined, says = '', bringing = '', told = '', nearest = '') {
  const s = doorSelf(mem, name, target && !says ? bringing : '', told)
  const cls = ['door', target ? 'is-target' : '', s.waiting ? 'is-waiting' : '', s.visits ? 'is-known' : '', s.regular ? 'is-regular' : '', nearest ? 'is-nearest' : ''].join(' ')
  const left = (mem?.left ?? []).slice(-3).map((k) => `<i>${CATCH_GLYPH[k]}</i>`).join('')
  const esc = (t: string) => t.replace(/</g, '&lt;')
  // The pin says only the one line that matters right now; the dock keeps the rest.
  const heard = s.withYou || (s.visits && mem?.heard.length ? `heard of ${mem.heard.join(', ')}` : '')
  const now = says ? `<q class="says">${esc(says)}</q>`
    : s.expecting ? `<small class="expecting">${esc(s.expecting)}</small>`
    : s.waiting ? `<small class="waiting">${esc(s.waiting)}</small>`
    : s.promise ? `<small class="promise">${esc(s.promise)}</small>`
    : heard ? `<small class="heard">${esc(heard)}</small>`
    : s.fact ? `<small class="fact">${s.fact}</small>`
    : target && !s.visits ? `<small>${s.status}</small>`
    : nearest ? `<small class="nearest">${esc(nearest)}</small>` : ''
  const html = `
    ${target ? '<div class="beam"></div>' : ''}
    ${s.light ? `<div class="door-light" style="--w:${s.warmth.toFixed(2)}"></div>` : ''}
    <div class="door-dot"></div>
    ${s.plant ? '<div class="door-plant">🌿</div>' : ''}
    ${(target || s.visits || nearest) ? `<div class="door-label"><b>${door.name}</b>${now}${left ? `<span class="door-left">${left}</span>` : ''}</div>` : ''}`
  return L.divIcon({ className: cls, html, iconSize: [14, 14], iconAnchor: [7, 7] })
}

export function StreetMap({ pos, doors }: { pos: P; doors: Door[] }) {
  const { targetId, setTarget, doors: mem, doorNames, name, picked, pick, greeting, companion } = useVestra()
  const day = new Date().toISOString().slice(0, 10)
  const catches = useMemo(() => catchesFor(pos, day), [pos, day])
  const taken = picked[day] ?? []
  const target = doors.find((d) => d.id === targetId)
  // Before you pick a door, the nearest one quietly names itself so a first sight is a real place.
  const nearest = target ? null : [...doors].sort((a, b) => distM(pos, a) - distM(pos, b))[0] ?? null
  const nearLine = nearest ? (mem[nearest.id] ? '' : `a door ${Math.round(distM(pos, nearest))} m from you`) : ''
  const player = useMemo(() => L.divIcon({ className: 'player', html: '<div class="player-dot"></div>', iconSize: [20, 20], iconAnchor: [10, 10] }), [])

  return (
    <MapContainer center={[pos.lat, pos.lng]} zoom={17} zoomControl={false} attributionControl={true} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} keyboard={false} className="map">
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
      <Follow pos={pos} />
      <Circle center={[pos.lat, pos.lng]} radius={RING_M} pathOptions={{ color: '#7fa6ff', weight: 1.5, opacity: 0.55, fillColor: '#3a5cff', fillOpacity: 0.06, dashArray: '2 6' }} interactive={false} />
      {doors.map((d) => (
        <Marker key={d.id} position={[d.lat, d.lng]} icon={doorIcon(d, d.id === targetId, name, mem[d.id], greeting?.doorId === d.id ? greeting.text : '', companion, d.id === targetId ? toldBy(mem, doorNames, companion, d.id) : '', nearest?.id === d.id ? nearLine || ' ' : '')} zIndexOffset={d.id === targetId ? 1000 : nearest?.id === d.id ? 800 : mem[d.id] ? 500 : 0} eventHandlers={{ click: () => setTarget(d.id) }} />
      ))}
      {catches.filter((c) => !taken.includes(c.id)).map((c) => (
        <Marker key={c.id} position={[c.lat, c.lng]} icon={L.divIcon({ className: `catch catch-${c.kind}`, html: `<span>${CATCH_GLYPH[c.kind]}</span>`, iconSize: [26, 26], iconAnchor: [13, 13] })} eventHandlers={{ click: () => pick(c.id, c.kind) }} />
      ))}
      <Marker position={[pos.lat, pos.lng]} icon={player} interactive={false} zIndexOffset={2000} />
      {target && <EdgeName pos={pos} door={target} />}
    </MapContainer>
  )
}
