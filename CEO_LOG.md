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

## 2026-10-20 22:20 ET (entry 3): the door speaks when you arrive
- **Decision:** Entry 2 was verified. Shipped the planned arrival moment: a return has to feel like something happened.
- **Shipped:** `arrive` now sets a `greeting` (not persisted). It's your name plus the one thing the door gained this visit. Visit 1: "nice to meet you, Gabe. we'll remember". Visit 2: "a light is on for you". Visit 3: "there's a plant by the door now". Visit 4: "you first came Oct 8". Visit 5+: "your 🌿 is still here" or "your light is warmer". A friend you brought: "Noa, Gabe told us about you". Same day: "still here". Leaving a catch updates it: "your plant stays here". It shows as a quoted line on the door's map label and in the dock's door section.
- **Refused:** toast/modal card, confetti, "+1 visit" counters, sound/badges.
- **Verified:** tsc clean; /workspace/vestra-shots/v3-arrive.png (simulated 2nd-visit arrival at Bar Tabac).
- **Next hour:** merchant side, a regular vs stranger view of the same door.

## 2026-10-20 22:25 ET (entry 4): the door tells you why to come back tomorrow
- **Decision:** Entry 3 was verified. Before building the merchant view, the loop needed something more basic: nothing gave you a reason to return *tomorrow*. Now the door says what it is saving for your next visit.
- **Shipped:** `doorSelf().promise` shows only after you've been at the door today. It names exactly what the next return will add, and it matches what the greeting will say then. Visit 1: "come back tomorrow, a light will be on for you". Visit 2: "…there will be a plant by the door". Visit 3: "next time, it'll tell you the day you first came". Visit 4+ with nobody brought yet: "bring someone next time, they'll already be expected". After that: "each return, your light here grows warmer". It appears in soft blue italics (not gold) on the door's map label and in the dock under the greeting.
- **Refused:** streak counters, "don't break your streak" pressure, push notifications, countdown timers, and a visit-progress bar.
- **Verified:** tsc clean; /workspace/vestra-shots/v4-arrive.png (2nd visit at Bar Tabac: greeting plus the plant promise).
- **Next hour:** the merchant side, a regular-vs-stranger view of the same door.

## 2026-10-20 23:15 ET (entry 5): the door is waiting for you the next day
- **Decision:** Entry 4 was verified (tsc clean, v4-arrive.png). I moved the merchant view back one more hour. Entry 4's promise only showed on the same day, so when you opened the app tomorrow the door looked like nothing was waiting. The return is the weakest step of the loop, so it comes first.
- **Shipped:** `doorSelf().waiting` shows on any later day for a door you've visited. It names what the door kept ready for you, and it's exactly what the greeting will say when you arrive. After visit 1: "a light is on for you here". After visit 2: "a plant is waiting by the door". After visit 3: "it remembers the day you first came". After visit 4 and on: "your 🌿 is still here" or "your light here kept warm". It shows as soft blue italics with a slow pulsing dot on the pin label, a pale blue halo on the door dot, and a line in the dock before you arrive. Once you arrive it's replaced by the greeting.
- **Refused:** a "doors waiting: 3" counter, push or "you haven't visited in X days" nudges, and gold on waiting doors (gold stays for the target and the main action).
- **Verified:** tsc clean. /workspace/vestra-shots/v5-waiting.png shows the next day at Bar Tabac before arriving: "a light is on for you here". v5-arrive.png shows the greeting matching it: "welcome back, Gabe. a light is on for you".
- **Next hour:** the merchant side, a regular-vs-stranger view of the same door.

## 2026-10-21 00:25 ET (entry 6): the door has already heard of the person you bring
- **Decision:** Entry 5 was verified, so nothing was left to finish. I deferred the merchant view a third time on purpose. Right now there's only one local user, so a merchant screen would show one person, and it needs shared state first. The weakest step of the loop was "bring someone": typing a friend's name changed nothing until you had already arrived.
- **Shipped:** `doorSelf(m, you, bringing)` now returns `expecting`. While you're with someone and a door is your target, and that door hasn't heard of them yet, it shows "expecting Noa. Gabe told us" before you arrive. That appears on the pin label (soft lilac italics with a pulsing dot, no gold) and in the dock. On arrival it gives way to the existing greeting, "Noa, Gabe told us about you. come in".
- **Refused:** a referral counter, "invite 3 friends" goals, share links or contacts import, and any reward for bringing someone.
- **Verified:** tsc clean. /workspace/vestra-shots/v6-expecting.png shows Bar Tabac, a stranger door, expecting Noa. v6-arrive.png shows the greeting plus the promise of a light tomorrow.
- **Next hour:** a door Noa has heard of should keep showing them when you come back alone ("Noa came with you Oct 21"), and the friend's name should carry to the next door you bring them to.

## 2026-10-21 01:15 ET (entry 7): the door remembers who you brought, and asks after them
- **Decision:** Entry 6 was verified (tsc clean, v6 shots, committed), so nothing needed finishing. I shipped the planned follow-through for bringing someone. Before this, a friend you brought turned into a dead "heard of Noa" tag. Now when you come back alone, the door keeps them alive.
- **Shipped:** `DoorMemory.broughtAt` stores the day you brought each person, so it records the date and no count. The pin now reads "Noa came with you Oct 20" in place of "heard of Noa". From visit 4 on, after you've brought someone, the waiting line the next day says "it still asks after Noa". On arrival the greeting is "welcome back, Gabe. how is Noa?", and after that the promise says "next time, it'll ask after Noa". The promise, waiting, and greeting lines all say the same thing. Visits 1 through 4 still keep their own gifts.
- **Refused:** a "friends brought: 2" counter, a friend leaderboard, rewards for each person brought, and nudging you to message Noa.
- **Verified:** tsc clean. /workspace/vestra-shots/v7-waiting.png shows the next day at Bar Tabac before arriving. v7-arrive.png shows the greeting asking after Noa.
- **Next hour:** carry the friend across doors. When you bring Noa to a second door, it should already know which door Noa first came to with you ("Noa, Bar Tabac told us about you").
