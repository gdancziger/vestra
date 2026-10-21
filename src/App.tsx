import { StreetMap } from './components/street-map'
import { Chrome } from './components/overlay/chrome'
import { useDoors, usePlayer } from './lib/world'

export default function App() {
  const pos = usePlayer()
  const doors = useDoors(pos)
  return (
    <div className="app">
      <StreetMap pos={pos} doors={doors} />
      <Chrome pos={pos} doors={doors} />
    </div>
  )
}
