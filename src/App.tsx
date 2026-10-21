import { StreetMap } from './components/street-map'
import { Chrome } from './components/overlay/chrome'
import { useEffect, useMemo } from 'react'
import { useDoors, usePlayer } from './lib/world'
import { keepKnownDoors, useVestra } from './lib/store'

export default function App() {
  const pos = usePlayer()
  const live = useDoors(pos)
  const { doors: mem, doorNames, doorPlaces, targetId, placeDoors } = useVestra()
  // The door you met yesterday is the same door today, even after the live street list replaces the first one.
  const doors = useMemo(() => keepKnownDoors(live, pos, mem, doorNames, doorPlaces, targetId ? [targetId] : []), [live, pos, mem, doorNames, doorPlaces, targetId])
  // An older memory known only by name learns where its door stands on its next sighting, so it can't drift to a namesake later.
  useEffect(() => placeDoors(doors), [doors, placeDoors])
  return (
    <div className="app">
      <StreetMap pos={pos} doors={doors} />
      <Chrome pos={pos} doors={doors} />
    </div>
  )
}
