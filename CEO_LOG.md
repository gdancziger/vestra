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

## 2026-10-21 02:20 ET (entry 8): the friend you bring carries from door to door
- **Decision:** Entry 7 was verified (tsc clean, v7 shots, committed), so nothing needed finishing. I shipped the planned move: a friend you brought to one door should arrive at the next door already introduced by the first.
- **Shipped:** `toldBy()` finds the first other door you brought that person to. While you're with Noa and target a new door, it reads "expecting Noa. Bar Tabac told us" on the pin and in the dock. On arrival the greeting is "Noa, Bar Tabac told us about you. come in". When there's no earlier door, it still falls back to "Gabe told us". Doors now vouch for each other instead of only you vouching.
- **Refused:** a "Noa has visited 2 doors" counter, a friend trail line drawn across the map, and any reward for chaining doors.
- **Verified:** tsc clean. /workspace/vestra-shots/v8-expecting.png shows Bien Cuit expecting Noa, told by Bar Tabac. v8-arrive.png shows the greeting.
- **Next hour:** the map label stacks are getting crowded (Bien Cuit's arrival label runs to five lines). Trim each pin to the one line that matters right now, and leave the rest to the dock.

## 2026-10-21 03:20 ET (entry 9): each pin says one thing
- **Decision:** Entry 8 was verified (tsc clean, v8 shots, committed), so nothing needed finishing. I shipped the planned cleanup. Bien Cuit's arrival label had grown to five lines (greeting, visit count, promise, friend, fact), and it was covering the street. A door that says everything at once ends up saying nothing.
- **Shipped:** Each door pin now shows its name plus the single line that matters right now, picked in this order: what it just said to you, who it's expecting, what it kept waiting for you, what it promises next time, who you brought, and the fact it keeps about you. Icons for what you left there still show. Visit counts and the other lines moved off the map and stay in the dock. The target's label now sits right at the top of its gold beam whatever its height, and it no longer wraps into a narrow column.
- **Refused:** a hover or expand card on the pin (it would repeat the dock), and a carousel that rotates through the lines.
- **Verified:** tsc clean. /workspace/vestra-shots/v9-expecting.png shows Bien Cuit with one line, "expecting Noa. Bar Tabac told us", and Bar Tabac with "a light is on for you here". v9-arrive.png shows the greeting alone on the pin while the dock keeps the promise.
- **Next hour:** the merchant side, now that a door knows people across visits. Add a "door's view" for the same door that shows who's a regular and who's expected, with names and days and no counts.

## 2026-10-21 04:20 ET (entry 10): how the door sees it
- **Decision:** Entry 9 was verified (tsc clean, v9 shots, committed), so nothing needed finishing. Shipped the merchant side I'd deferred three times. Now that doors remember people across visits and carry friends between doors, there's real memory to show from the door's side.
- **Shipped:** `doorKnows()` gives the door's own list of the people it knows, by name and day: "Gabe, a regular since Oct 8, last came Oct 20" (or "here now"), "Noa came with Gabe Oct 19", and "Ari expected. Gabe told us" for someone you're bringing. The dock's door section has a quiet "how the door sees it" toggle that swaps your lines for that list, and "← your view" switches back. It shows only when the door knows somebody. It's not gold and not on the pin, so the pin still says one line.
- **Refused:** visit counts or ranks in the door's list, a "top regulars" leaderboard, a separate merchant app or login, and a card on the map that repeats the pin.
- **Verified:** tsc clean. /workspace/vestra-shots/v10-doorview.png shows the door's view before arriving, with Ari expected. v10-arrive.png shows it after arriving: Gabe here now, Noa came Oct 19, Ari came Oct 21.
- **Next hour:** let the door's view hold one thing the door noticed about each person (what they left, e.g. "left a 🌿"), so a merchant recognizes a regular by more than a date.

## 2026-10-21 05:20 ET (entry 11): the door remembers what each person left
- **Decision:** Entry 10 was verified (tsc clean, v10 shots, committed), so nothing needed finishing. I shipped the planned move: a merchant should recognize a regular by what they left, not only by a date.
- **Shipped:** `DoorMemory.leftLog` records each catch left at a door, the day, and the friend you'd brought that day. In "how the door sees it", each person now gets one noticed line: "Gabe ... left a 🌿 Oct 20", and "Noa came with Gabe Oct 20 ... was here when the 🌿 was left". Older memories without a log fall back to "left a 🌿". There are no counts, it's not gold, and the pin is unchanged.
- **Refused:** a "catches left: 5" tally, a merchant "favorite customer" badge, and a gift list per person.
- **Verified:** tsc clean. /workspace/vestra-shots/v11-doorview.png shows the same day, after leaving a 🌿 with Noa. v11-nextday.png shows the next day before arriving, with the door's view and what each person left.
- **Next hour:** let what a person left come back to them at the next door they visit with that friend. Or, if that turns out to be too much, the door's view should note "usually comes with Noa" once a friend has come twice.

## 2026-10-21 06:25 ET (entry 12): the door knows your friend when you bring them back
- **Decision:** Entry 11 was verified (tsc clean, v11 shots, committed), so nothing needed finishing. The real gap was bringing the same person back: a door that had already met Noa said nothing when Noa returned. Being known has to work for the friend too, not just for you.
- **Shipped:** `DoorMemory.broughtDays` keeps the days each person came with you (days, not a count). Before you arrive with a friend the door already knows, the pin reads "Noa again. last here Oct 20". On arrival it says "Noa, good to see you again. you too, Gabe". In "how the door sees it", Noa reads "came with Gabe Oct 20 and Oct 21", and once a friend has come on two different days, you get "usually comes with Noa" next to what you left.
- **Refused:** a "visits together: 2" count, a "best friends" badge, and a reward for bringing the same person back.
- **Verified:** tsc clean. /workspace/vestra-shots/v12-expecting.png (the next day, with Noa, before arriving), v12-arrive.png (greeting), and v12-doorview.png (usual company and both days).
- **Next hour:** before you arrive, the dock shows two lines (expecting Noa, plus "it still asks after Noa"), and after arrival the promise still says "it'll ask after Noa" while Noa is standing there. Make the door's lines agree with each other when the friend is present.

## 2026-10-21 07:20 ET (entry 13): the door's lines agree when your friend is standing there
- **Decision:** Entry 12 was verified (tsc clean, v12 shots, committed), so nothing needed finishing. I shipped the planned fix. A door that says "Noa again" and also "it still asks after Noa" while Noa is walking in with you sounds like it isn't paying attention. Being known means the door's lines agree with each other.
- **Shipped:** `waitingFor(m, bringing)` drops "it still asks after Noa" when you're bringing Noa, because "Noa again. last here Oct 20" already says it. After you arrive with Noa, the promise no longer says "it'll ask after Noa". It now reads "next time, with Noa or without, it'll know you both", and that's honest either way: alone, the greeting asks how Noa is, and with Noa, it says good to see them again. `withYou` says "Noa came with you today" on the same day instead of a date.
- **Refused:** a new "together" badge, and any extra line on the pin. The pin still says one thing.
- **Verified:** tsc clean. /workspace/vestra-shots/v13-expecting.png shows the next day with Noa: the dock has one friend line, "Noa again. last here Oct 20". v13-arrive.png shows the greeting plus the new promise. v13-doorview.png shows the door's view.
- **Next hour:** the dock lists what you left by its kind ("keeps your plant") while the pin shows the 🌿. Make the door's own lines use the glyph you actually left, so words and map match, then look at what a first-time visitor sees in the first ten seconds.

## 2026-10-21 08:20 ET (entry 14): the door's words show what you actually left
- **Decision:** Entry 13 was verified (tsc clean, v13 shots, committed), so nothing needed finishing. I shipped the planned fix. The pin showed a 🌿 while the dock said "keeps your plant" and "your plant is still here". The door should name the exact thing you left, the same way the map shows it.
- **Shipped:** Every line the door says about what you left now uses the icon you left. Leaving a catch shows "your 🌿 stays here, Gabe". The waiting line and the greeting say "your 🌿 is still here", and the dock says "keeps your 🌿 by the door". The dock no longer repeats the kept item when the waiting line already names it. The freed line now holds "remembers you first came Oct 9".
- **Refused:** a "things left here" inventory list in the dock, and labelling the icons with words (the icon on the map is the name).
- **Verified:** tsc clean. /workspace/vestra-shots/v14-leave.png shows a catch being left. v14-waiting.png shows the next day before arriving: the pin and dock both read "your 🌿 is still here", with no repeated line. v14-arrive.png shows the greeting. v14-first.png shows the first ten seconds for a new visitor.
- **First ten seconds (seen in v14-first.png):** the dock says "Bar Tabac, stranger", but on the map nothing marks Bar Tabac until you tap Go. A new person sees catches and a ring but no door.
- **Next hour:** before you set a target, give the nearest door a quiet name on the map (no gold, no beam), so a first-timer's first sight is a real place to walk to.

## 2026-10-21 09:20 ET (entry 15): the nearest door names itself before you choose
- **Decision:** Entry 14 was verified (tsc clean, v14 shots, committed), so nothing needed finishing. I shipped the planned first-ten-seconds fix. A newcomer saw a ring and catches but no door on the map until they tapped Go, so the first thing they met was a game layer instead of a real place.
- **Shipped:** Before any target is set, the nearest door shows its name and one quiet line, "a door 58 m from you", centered just above its dot. The dot gets a soft pale halo with no gold and no beam. The label sits above the catches but ignores taps, so the catches stay tappable. If the nearest door already knows you, its own line shows instead of the distance. Once you tap Go, the quiet label goes away and the gold beam takes over.
- **Refused:** labelling every door at once (it would crowd the map), gold or a beam before you've chosen, and a "start here" tooltip or onboarding card.
- **Verified:** tsc clean. /workspace/vestra-shots/v15-first.png shows a first visit with Bar Tabac named on the map before anything is tapped. v15-target.png shows that after Go, the quiet label hands off to the gold beam.
- **Next hour:** a first visit still ends at "stranger". The first arrival should leave one thing the door will say tomorrow, so day two opens on a reason to return. Check what the dock and pin promise after visit 1 and tighten it.

## 2026-10-21 10:20 ET (entry 16): the door you met yesterday is still that door today
- **Decision:** Entry 15 was verified (tsc clean, v15 shots, committed), so nothing needed finishing. While I was checking what visit 1 leaves behind for day two, I found a bug that breaks the return step. Doors are remembered under the id of whichever street list was loaded at the time. When the live street list loads, Bar Tabac comes back under a new id, so on day two it showed up as a stranger. The dock also pointed at whatever door happened to be closest (Dunkin', 10 m away) instead of the door that had a light on for you. That fix outranked tightening the visit-1 promise, which already reads "come back tomorrow, a light will be on for you".
- **Shipped:** `keepKnownDoors()` matches the live list against the doors you've met, by name and by place (within 120 m), and keeps the remembered id, so the door's memory, its 🌿, and its waiting line survive a reload. If the live list leaves a known door out, the door still stands where you met it. `doorPlaces` now records where each door is when you arrive. Before you choose a target, `firstDoor()` puts a door that's waiting for you within the ring ahead of the nearest stranger, in both the dock and the quiet label on the map.
- **Refused:** a "your doors" list or a favorites screen (the map is the list), and an "X is waiting for you" banner or push notification. The pin still says one thing, and there's still no gold before you choose.
- **Verified:** tsc clean. shoot16.mjs fakes the live street list returning new ids and a nearer stranger door. /workspace/vestra-shots/v16-return.png shows day two: the dock and the pin both say Bar Tabac, "a light is on for you here". v16-arrive.png shows "welcome back, Gabe. a light is on for you". With Bar Tabac missing from the live list, it still appears with "a plant is waiting by the door".
- **Next hour:** older memories saved before `doorPlaces` existed only match by name. Backfill each door's place on its next sighting, then go back to what a first visit leaves for day two.

## 2026-10-21 11:15 ET (entry 17): an old memory learns where its door stands
- **Decision:** Entry 16 was verified (tsc clean, v16 shots, committed), so nothing needed finishing. I shipped the planned follow-up. Memories saved before `doorPlaces` existed matched by name alone, so a chain or a namesake listed first in the live street list could take over your door, and a door 300 m away would greet you while the one you actually met stayed a stranger.
- **Shipped:** A new `placeDoors()` store action writes down where a remembered door stands the first time it's seen again. App calls it on every door list, so old memories get a place on their next sighting and from then on match by place (within 120 m). Until a place is known, `keepKnownDoors()` hands the memory to the same-named door nearest you (within 450 m) instead of whichever one the list put first, and a namesake farther away stays a stranger.
- **Refused:** asking the person "is this your Bar Tabac?" (a door that knows you doesn't quiz you), and a merge or "fix my doors" screen.
- **Verified:** tsc clean. shoot17.mjs strips `doorPlaces` to simulate an old memory, then loads a live list with a same-named Bar Tabac 300 m away listed first. After that sighting the place is recorded, the pin and dock say "a light is on for you here", and with the list order flipped the memory stays put. A node check of `keepKnownDoors` with no places gives the memory to the near branch, and a 600 m namesake doesn't take it. Screenshot: /workspace/vestra-shots/v17-backfill.png.
- **Next hour:** back to what a first visit leaves for day two. After visit 1, the dock still reads "known · 1 visit", a count. Replace it with the door's own words (e.g. "met you Oct 20"), so day two opens on being known, not on a tally.
