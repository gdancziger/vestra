# CEO LOG

## 2026-10-20 20:50 ET (entry 1): built from scratch
- **Decision:** There was no code anywhere, so the first move was to build the loop itself (arrive, be known, leave something, return, bring someone) on real streets. Decoration comes later.
- **Shipped:** Vite + React + TS + react-leaflet. OSM tiles filtered to night blue, a 150 m ring, the camera locked on the player, and doors that are real businesses (Overpass, with a Smith St fallback). Catches are separate icons inside the ring. A door gains one thing per visit: it knows your name, then a light, then a plant, then the day you first came. You can see what you left there, the stranger/regular label, and "heard of <friend>". The night-glass dock shows you, the door, and what you carry. Gold is used only for the target beam and name and the main action.
- **Refused:** points, stamp cards, creatures, a joystick, a 3D city, and a separate onboarding screen.
- **Verified:** tsc --noEmit is clean. Shots are at /workspace/vestra-shots/v1.png and v1-return.png.
- **Next hour:** make a return visibly richer on the map pin (show the fourth thing, the remembered fact, on the door, and give the light some warmth that builds with visits).

## 2026-10-20 21:25 ET (entry 2): the door shows how well it knows you
- **Decision:** Entry 1 was verified (tsc clean, shots taken), so nothing needed finishing. Last hour's planned move ships now: a return should show on the door itself, not only in the dock.
- **Shipped:** The door's light now grows warmer and wider with each return (warmth goes from 0 to 1 over 6 visits). From visit 4 on, the pin carries the one fact it keeps about you ("since Oct 8") under its status line. Before this, that fact only lived in the dock and was cut off there.
- **Refused:** a visit counter badge, streak flames, and a progress bar on the door. All of those are points in disguise.
- **Verified:** tsc --noEmit is clean. Shots are at /workspace/vestra-shots/v2.png and v2-return.png. A side-by-side crop against v1 shows the wider, warmer glow.
- **Next hour:** the arrival moment. When you arrive on a return, the door greets you by name and names the one thing it gained this visit ("welcome back, Gabe, a light is on for you"), so the return feels like something happened.
