# Tactical Football — Full Project Status
## Updated: February 15, 2026

---

## CURRENT STATE

**Version:** ALPHA 12.5
**Working file:** `tacfoot4.html` (single-file React app with inline JSX + Babel CDN)
**Backups:** tacfoot4-v1.html through v11.html in project folder
**Session notes:** NOTES.md in project folder (Claude Code maintains this)
**Handoff doc:** HANDOFF-v11.md (original design spec, partially outdated — this document supersedes)
**Live URL:** tacfoot4.netlify.app (may be outdated — requires drag-deploy to update)

### File Locations (multiple PCs — drive letters and usernames vary)
- **Thumb drive:** D:\TacFootball\tacfoot4.html (sometimes E: depending on PC)
- **Desktop PC1 (Lash2):** C:\Users\Lash2\Desktop\TacFoot\index.html
- **Desktop PC2 (obrie):** C:\Users\obrie\Desktop\TacFoot\index.html
- **Desktop PC3 (domain):** C:\Users\domain\Desktop\TacFoot\index.html
- **OneDrive:** C:\Users\domain\OneDrive\Documents\Software Licenses\OldDelete\TacFootball\

---

## TOOLS AND WORKFLOW

**Design conversations:** claude.ai chat. Talk through mechanics, plan features, discuss problems. No code here.

**Code execution:** Claude Code in PowerShell. Paste prompts designed in chat. Claude Code reads and edits the file on disk.

**Every Claude Code session:**
1. `cd D:\TacFootball` (or wherever the game file is on this PC)
2. `claude --dangerously-skip-permissions` (skips all the "do you want to proceed" permission menus)
3. Paste prompt

**Every Claude Code prompt must include:**
- Estimated time and tokens at the top
- "Make a backup first (auto-increment version number)"
- Copy paths — check which PC you're on, skip paths that don't exist
- "Update NOTES.md when done"
- "Print DONE summary: what changed, where saved, tokens used, time taken, anything user needs to do"
- Exact steps to run (cd path, claude command, paste) at the bottom

**Deploy to Netlify:** Drag the TacFoot folder onto the deploy zone on the Project Overview page (NOT the Deploys page — that was a past mistake).

**Token budget:** ~44,000 tokens per 5-hour window on Pro plan. Shared between claude.ai chat and Claude Code. Check with `/usage` or `/status` in Claude Code. Small fixes = ~2-5k tokens each. Major new features = ~15-20k tokens. Opus is smarter but burns tokens faster; Sonnet is cheaper and fine for straightforward edits. Use Opus unless budget is tight.

**Node.js and Python:** Installed on PC2 (obrie). May not be installed on other PCs. If Claude Code throws "node not found" or "python not found," install via `winget install OpenJS.NodeJS` and `winget install Python.Python.3.12` in a separate PowerShell window, then restart Claude Code.

---

## VERSIONING

- Alpha [whole number] = major build (Alpha 13, 14, 15)
- Alpha [X.1, X.2] = bug fixes
- Beta 1.0 = when core mechanics all work and you're polishing
- Version displays in top-left of game screen via `GAME_VERSION` constant near top of file

---

## WHAT EXISTS — CURRENT PLAYS

### Run Staples (5):
1. Inside Run — basic up the middle
2. Outside Run — RB goes wide
3. Counter — fake one way, cut back
4. Power Run — RB follows lead blocker, guaranteed short yardage, low ceiling but hard to stop
5. Stretch Run — RB moves lateral, reads blocks, high variance

### Run Special (2):
6. HB Toss — quick pitch wide, 8% fumble (reduced by difficulty multiplier)
7. QB Sneak — short yardage push, no RPO read

### Pass Staples (5):
8. Quick Slants — short fast inside routes
9. Deep Post — WR sprints deep middle, needs pocket time
10. Out Routes — WRs cut to sideline, 8-12 yards, stops clock
11. Curl/Comeback — WRs run up then turn back, works against cushion
12. TE Seam — TE up the middle between LBs and safeties

### Pass Situational (3):
13. Play Action — fake handoff then throw, freezes linebackers
14. Screen Pass — let rush come, dump to RB with blockers ahead
15. Four Verticals — every receiver deep, exploits 2-safety coverage

### Trick (3):
16. Flea Flicker — fake handoff, pitch back, throw deep, 8% fumble
17. Statue of Liberty — fake pass, slip to RB
18. QB Draw — fake pass, QB runs through gaps

### Defenses (5):
- 4-3 Base, Nickel, Blitz, Cover 2, Goal Line

---

## DIFFICULTY LEVELS (4)

### Practice (NEW — Alpha 12.5)
- Pauses at every decision with coach overlays and "GOT IT" button
- DB tracking: 0.78
- Fumble/INT multiplier: 0.05 (essentially zero)
- Completion bonus: +30 (cap 98%)
- Pressure penalty: reduced by 75%
- Instant blitz: 2%
- For people who've never seen football
- Replaces commentary/coach with detailed step-by-step explanations
- Play tooltips still show

### Preseason
- Hero mode. Most things work. Learning strategy, not struggling.
- DB tracking: 0.82
- Fumble/INT multiplier: 0.3
- Completion bonus: +20 (cap 95%)
- Pressure penalty: halved
- Instant blitz: 5%
- Coach suggests plays with full explanations, clickable alternatives
- Play tooltips under every button
- All narrative text in plain English (no jargon)

### Regular Season
- Competitive, tilted toward offense. Punting happens.
- DB tracking: 0.90
- Fumble multiplier: 0.7, INT multiplier: 0.7
- Completion bonus: +5 (cap 95%)
- Pressure penalty: reduced 25%
- Instant blitz: 12%
- Coach gives shorter suggestions, clickable but no detailed reasons

### Playoffs
- Realistic. The AI plays you straight.
- DB tracking: 1.0
- All rates unchanged (base values)
- Instant blitz: 20%
- No coach help. Matchup tag colors only hint.
- "Risky matchup" warning on bad calls, no suggestions

---

## WHAT'S BEEN BUILT — ALL SESSIONS

### Core Mechanics:
- **RPO post-snap read** — all run plays (except QB Sneak) show READ phase after snap. Three scenarios: Gap Open / LB Filled Gap / Edge Sealed. Each offers Hand Off, QB Keep, Quick Pass with percentage badges. Favorable matchup = gap open 70%, bad = 15%.
- **Pressure escape system** — when defenders 1.5-3 yards from QB: Throw It Away, Tuck & Run, Roll L/R. Auto-sack at 1.5 yards.
- **Tuck the Ball** — gold pulsing button when pocket <30% and 3+ actions used. 1-3 yard loss, zero fumble risk. Sack-fumble (20%) only if player ignores tuck warning and pocket hits <15%.
- **Contact resolution** — degrading spin success (base, -15%, -30%, -45% per contact), escalating fumble risk (x1, x1.5, x2.5, x4). Dive Forward always zero fumble risk. Visible odds on buttons with color coding.
- **Look Left/Right** — shifts coverage: defenders on look side tighten (-1 yard separation), opposite side loosen (+1.5 yards). +15% completion / 0.6x INT for throwing opposite look. +5 INT for throwing same side. Visible field update after Look.
- **Sack requires defender proximity** — no phantom sacks. checkSack returns sack/pressure/safe based on distance (<1.5 auto-sack, <2 probability sack, 2-3 pressure, >=3 safe).
- **DL can't pass through OL** — clamped with 0.5 buffer on defensive side of assigned blocker
- **Run balance** — pursuit escalation (+15% speed per move after move 2), tackle ramp (80%+ by move 5)
- **Forward cone gap-finding** — ±45 degrees, lateral penalty, target clamped within 15 units of ball carrier
- **Gap-finder avoids defenders** — massive score penalty (x0.1) for paths within 15° of a defender within 3 yards, moderate penalty (x0.5) for 15-30°
- **Double-roll throw probability fix** — pre-computed probs passed to doThrow so displayed % matches actual resolution

### Visibility & UI:
- **On-field receiver labels:** OPEN (green), TIGHT (yellow), COVERED (red) during pass decision
- **OL blocking health dots:** green/yellow/red under each lineman position
- **Pocket warning on field:** "POCKET COLLAPSING" at <40% (yellow), "THROW OR TUCK!" at <25% (red, pulsing)
- **Contact buttons show odds:** "55% break free / 3% fumble (1 in 33)" — fumble text green <3%, yellow 3-8%, red >8%
- **On-field odds flash:** semi-transparent overlay near ball carrier showing best option odds for ~1 second on contact
- **Contextual QB buttons:** Drop Back → Buy Time → Hold On! across phases. Subtitles show receiver status and route depth.
- **Roll L/R** only appears phase 2+ when pressure builds, with context ("Roll Left — move away from pressure. W1 is on this side."). Renamed from Scramble.
- **Look L/R** shows receivers on that side with openness: "W1 (OPEN) and TE (contested)". Preseason adds "improves throw accuracy" hint.
- **Sequential glow animation** on QB action buttons when decision phase begins (~0.3s per button, one cycle)
- **Play tooltips** in preseason/practice — one-line plain English under each play button
- **Coach suggestions** with clickable alternative plays (preseason: full explanation + reasons, regular: short + clickable, playoffs: "Risky matchup" only)
- **Two-voice commentary** — play-by-play + color commentary, scales by difficulty (preseason: both + teaching, regular: both, playoffs: PBP only)
- **Version number** display top-left (muted #667788, ~10px)
- **Down & distance** display, yard line numbers with hash marks, yellow first-down line on field
- **Double-click to snap** — double-clicking a play skips Line Up step
- **Preseason default action labels** — "Drop Back (run the play)", "Hand Off (run the play)"

### Context-Sensitive Move Names:
- **RB at the line (0-2 yards past snap):** Hit the Hole, Bounce Outside, Break It, Power Forward
- **RB in open field (3+ yards past snap):** Sprint, Cut Outside, Juke, Dive Forward
- **QB scramble:** Sprint Upfield, Slide, Cut Outside, Truck It
- **WR/TE after catch:** Sprint, Cut Outside, Juke, Dive Forward

### Contact Percentages Driven by Defender Positions:
- **Sprint/Hit the Hole (straight ahead):** 85-95% open field → 60-70% defender 3-5yds → 30-40% defender <3yds
- **Cut Outside/Bounce Outside:** 75-85% sideline clear → 25-35% defender blocking
- **Juke/Spin/Break It:** higher vs 1 defender, much lower vs 2+, capped 10-15% vs 3+
- **Dive Forward/Power Forward:** always 80-85%, always zero fumble risk, 1-3 yards

### Plain English in Preseason/Practice:
- "LB Filled Gap" → "A defender closed the running lane"
- "Edge Sealed" → "Defense shut down the outside"
- "Pocket collapsed" → "Blockers couldn't hold — defenders broke through"
- "Pressure forced a bad throw" → "Defenders closing in made it hard to throw accurately"
- "Ball sails high" → "The throw went over the receiver's head"
- "Coverage tight" → "The defender was right on the receiver"
- "Safety over top" → "A deep defender was waiting for that throw"
- "Forced into coverage" → "Threw to a receiver who had a defender on him"
- "Safeties bit left/right" → "Deep defenders move that way"
- All narrative text audited for jargon

---

## KNOWN BUGS (Alpha 12.5.1 fix list)

1. **Coach Practice Mode text says "Hit the Hole" / "Bounce Outside"** — should match the renamed buttons (Sprint, Cut Outside, etc.). The buttons are correct, the coach overlay text is stale.
2. **Phantom tackle returned** — "CB at 0.0yds" when CB is visually far away on field. Distance calculation or coordinate mismatch between visual positions and game-state positions. Was supposedly fixed in Session 2 (tackle requires defender within 2 yards) but resurfaced.

---

## DESIGN DECISIONS CONFIRMED BUT NOT YET BUILT

### Two-Player Mode:
- Regular Season = offense-weighted (benefits both players equally since it switches sides)
- Playoffs = harder to score, more punts/turnovers, tense low-scoring games
- Same defensive AI strength in both modes — only offensive multipliers change (one dial, not two — no risk of accidentally favoring one player)
- No preseason/practice in two-player
- Maps to real football: regular season games average 40-50 combined points, playoff games often end 17-13

### Note to Players Screen:
- Goes on coach selection or difficulty screen
- Text: "This is in very early stages and is just a hobby program. Please [Google Form link] with ANYTHING you find that doesn't work, that you like, dislike, suggestions, etc. I like trick plays and intend to make those a fun part of the game. This is mainly to try out a turn-based tactical system in a gridiron football setting, and to give people who've never played football an understanding of the game (Practice and Preseason), while still being fun for people who have played it and/or know it well. Development roadmap includes two player version, player strengths and fatigue, and, yes, cheerleaders."
- Google Form preferred over email (easier for players, no inbox management)
- Form needs to be created

### Look Mechanic Cost in Regular Season:
- Looking should have a more obvious visible cost in regular season — pocket degrades 5-10% per look
- Makes it a real strategic decision: spend a phase for accuracy boost vs. lose protection time
- Player sees OL indicators tick from green toward yellow when they look

---

## THE MELEFICENT — DEDICATED DESIGN SECTION

Named for Melissa, a friend/tester who insists on attempting 92-yard field goals on first down every single time she plays.

### How It Works:
Field goal is a normal menu option. When picked from far back (80+ yards), the game doesn't stop her — it lets her try. The Meleficent is what happens when someone attempts this.

### The Sequence:

**Pre-kick weather/atmosphere text (randomized, sets the scene):**
- "The wind is particularly strong today. Strange eddies of air currents swirl through the stadium."
- "The blimp overhead is getting knocked around by gusts. Unusual atmospheric conditions."
- "A calm day at the stadium. Almost too calm. The flags aren't moving at all."
- "Meteorologists in the press box are noting some very peculiar barometric readings."

**The kick announcement:**
"THE MELEFICENT IS IN PLAY!"

**Progress updates (one at a time with drama):**
"The ball is in the air..."
"15 yards... still going!"
"25 yards... it has legs!"
"35 yards... no way..."
"45 yards... the crowd is on their feet!"
"50 yards... this is uncharted territory!"
"56 yards... it's losing altitude..."

**Then the failure (RANDOMIZED — 15+ different messages so she gets a new one every time):**

1. "The ball hits the turf at the 34 and rolls to a gentle stop. Amazingly, the 92-yard field goal attempt has failed once again. Experts remain baffled."
2. "The ball crashes into the turf at the 41. Against all odds, the greatest strategic mind in football has been denied yet again. The 92-yard field goal remains unconquered."
3. "The ball bounces sadly into a cameraman at the 29. Somehow — and analysts will debate this for decades — kicking a field goal on first down from 92 yards away has still not borne fruit."
4. "The ball thuds into the grass at the 37. Let the record show: the Meleficent was attempted. The Meleficent has failed. The Meleficent will be attempted again."
5. "The ball dies at the 44. That's actually her longest attempt yet. The dream is alive. Barely."
6. "The ball skips off the turf at the 31 and hits a Gatorade cooler. She will never stop trying. We will never stop believing."
7. "The ball makes it to the 46. Wait — 46?! No, sorry, the 36. Wind gust. Still, we admire the commitment."
8. "The ball plummets at the 33. Scientists at MIT have confirmed this should not be possible. She remains undeterred by science."
9. "The ball nosedives at the 28. Yet this brilliant strategic maneuver — kicking a field goal on first down from 92 yards — has somehow still not borne fruit. Let's hope she never loses faith."
10. "The ball thuds down at the 39. The stadium falls silent. Not out of disappointment — out of respect. That took courage."
11. "The ball reaches the 42 before gravity remembers its job. So close. So impossibly, beautifully far."
12. "The ball lands at the 35. Attempt number [N] and counting. History will remember her persistence."
13. "The ball dies at the 31. Even the opposing team feels bad. They're not even celebrating. They're just... watching. Wondering. Believing."
14. "The ball bounces at the 37. Somewhere, a sports analyst is writing a column about this. It will go viral. Nobody will believe it."
15. "The ball crashes at the 40. The kicker looks at her hands. The hands are fine. The leg is fine. Physics is the problem."

### The "Pity" Mechanic:
Multiple attempts in the same game: opposing team "feels bad" and gives the down back. "The opposing team, moved by her determination, has declined the change of possession. The crowd applauds."

### The Secret Cheat / Easter Egg:
A SECRET WAY to make the Meleficent succeed (so Kip can trigger it when Melissa is playing). Trigger options (pick one during implementation):
- Specific sequence of plays before the kick
- Hidden button or tap zone
- Konami-code style input during kick animation
- Hidden text field

**Success sequence:**
"THE BALL IS AT THE 50..."
"THE 40..."
"THE 30... IT'S STILL GOING..."
"THE 20... THIS CAN'T BE HAPPENING..."
"THE 10..."
"IT'S..."
"IT'S..."
"THE MELEFICENT IS GOOD!!!"
"92 YARDS!!!"
"THIS IS THE GREATEST MOMENT IN THE HISTORY OF SPORT!!!"
"MELISSA HAS DONE IT!!!"
"THE DOUBTERS ARE IN SHAMBLES!!!"

Massive splash screen. Fireworks. Confetti. Way bigger than a normal touchdown.

Without the cheat: natural 0.01% chance it goes in.

---

## ROADMAP

### Phase 1: Bug Fix Pass — COMPLETE (Session 2-3, Feb 14)
- Run balance (pursuit escalation, tackle ramp, Hit the Hole decay)
- Sack requires proximity
- Pressure escape system (Throw Away, Tuck & Run, Scramble L/R)
- Double-roll throw probability fix
- RPO post-snap read system
- Look Left/Right affects throws
- Five new plays (Power Run, Stretch Run, Out Routes, Curl/Comeback, TE Seam)
- Phantom tackle fix
- DL teleport through OL fix
- Inside Run hole randomization
- Bubble pass position fix

### Phase 2: Game Feel — COMPLETE (Session 4-5, Feb 14-15)
**Session 4 (Feb 14):**
- Two-voice commentary system (play-by-play + color)
- Coach suggestions with clickable alternatives
- Play tooltips in preseason
- YAC/after-catch label system
- Throw Away hardened
- QB movement and upfield run
- Tackle proximity cleanup
- DL clamp strengthened
- Preseason default action labels
- Difficulty screen descriptions

**Session 5 — Build 5A (Feb 15):**
- Receiver openness fix (WR1/WR2 can actually get open now — CB tracking was too tight)
- Turnover/incompletion rate reduction by difficulty
- Degrading contact risk with visible odds on buttons
- Contextual QB buttons (Drop Back → Buy Time → Hold On!)
- On-field indicators (OL health dots, receiver openness labels, pocket warnings)
- Tuck the Ball mechanic
- Coach suggestions at all difficulty levels
- Jargon replacement in preseason/practice

**Session 5 — Build 5B (Feb 15):**
- Practice Mode (full tutorial difficulty with coach overlays)
- Tighten preseason DB speed (0.70→0.82 — was too easy, all receivers wide open)
- Look mechanic shifts coverage (look side tightens, opposite loosens)
- Gap-finder avoids defenders (never runs arrow into a defender)
- Hit the Hole context-sensitive rename (Sprint/Cut Outside/Juke/Dive Forward past the line)
- Contact percentages driven by actual defender positions
- Version number display (ALPHA 12.5)

### Phase 3: Bug Fixes — Alpha 12.5.1 (NEXT)
- Coach Practice Mode text still says "Hit the Hole" / "Bounce Outside" — update to match renamed buttons
- Phantom tackle returned — "CB at 0.0yds" when CB is visually far away
- Any other bugs found during playtesting

### Phase 4: Coach Personality System
- Coach A vs Coach B mechanical differences:
  - Coach B (Hometown Hero / teacher): keeps giving suggestions longer, calm, instructional, takes responsibility for failures ("My fault, I should have called something else")
  - Coach A (genius): stops helping earlier, attitude when you ignore advice, critical on bad calls, takes credit for good calls ("You're not seriously running that against Nickel, are you? Call Screen Pass and stop wasting my time.")
- Full coach personality dialogue trees
- Mechanical gameplay differences (Coach A high ceiling/low floor, Coach B consistent grinder)
- Coach learning system (further out)

### Phase 5: Note to Players + Feedback System
- Note to Players screen with Google Form link
- Player-facing text about the project, roadmap, feedback request
- Create Google Form for structured feedback

### Phase 6: Two-Player Mode
- Regular Season (offense-weighted, fair for both) and Playoffs (realistic, low-scoring)
- Same defensive AI strength in both modes — only offensive multipliers change
- No practice/preseason in two-player

### Phase 7: More Trick Plays
- **Philly Special** — QB becomes receiver, TE throws. TE accuracy terrible (55-65%). 5% fumble on exchange. "The most audacious play in football."
- **Hook and Lateral** — WR catches, laterals to trailing runner. Huge fumble risk (12-15%), huge gain if it works. Two contact phases.
- **Double Reverse** — two handoffs, three fumble points. Devastating if defense overcommits one way.
- **Halfback Pass** — RB takes handoff, pulls up, throws. Worse accuracy than TE. Defense bites on run.
- **Fumblerooski** — QB puts ball on ground, OL picks up and runs. Illegal in real NFL, hilarious in game.
- **Hail Mary** — goes under PASS SITUATIONAL. Every receiver deep, contested catch mechanics, tipped ball.
- Player-submitted trick plays from testers
- Crazy/fun plays for later (mascot distraction, etc.)

### Phase 8: Game Systems
- Game clock, timeouts, two-minute drill
- CPU offense (they score too — currently offense only)
- Hot routes (change receiver routes at the line)
- Defensive play calling (player calls defense)
- Fumble recovery scramble
- Audible/adjust reactions in two-player

### Phase 9: Advanced Features
- Zone vs Man coverage toggle
- Full defensive playbook with tricks (fake blitz, delayed blitz, spy, bracket coverage)
- Intentional grounding risk on Throw It Away (30-40% penalty if still in pocket)

### Phase 10: Season/Meta
- Season mode with progression
- Player stats tracking
- Player fatigue system
- Drive summary screen
- Playbook study / instant replay
- Better graphics (way down the road)

### Phase 11: The Meleficent
- Full implementation of the 92-yard field goal Easter egg
- All 15+ failure messages, pity mechanic, secret cheat code, success celebration sequence

---

## ARCHITECTURE NOTES

- Single HTML file with inline React loaded via CDN (not Claude's JSX artifact renderer — broken for large files)
- Babel CDN handles JSX transpilation in-browser
- ~2000+ lines now with all plays and features
- Key data structures: PLAYS array, MX matchup matrix, RUN_BLOCKS, DEF_FORM defenses
- Route library (RL): go, slant, post, out, curl, seam, flat, check, block, dive, sweep, counter, toss, screen, wheel, flee, statue
- All play names must match across PLAYS, MX, and RUN_BLOCKS
- `isPre(diff)` helper: returns true for both "practice" and "preseason" — used throughout for shared behavior
- `GAME_VERSION` constant near top of file — update with each build

---

## CRITICAL WORKFLOW RULES (for Claude Code prompts)

- Don't rewrite working code without being asked
- Don't add features during bug fix passes
- Don't generate entire new files — make targeted line-level edits
- Don't guess at code problems from screenshots — tell user to ask Claude Code to diagnose
- Always back up before editing (auto-increment version)
- Always copy result to Desktop\TacFoot\index.html
- Always update NOTES.md with what changed
- When finished, print DONE summary with: what changed, where saved, tokens used, time taken, anything user needs to do

## CRITICAL RULES FOR CLAUDE (claude.ai chat)

- **NEVER start writing prompts or creating files until explicitly told "write the prompt" or "let's build" or "go"**
- Never end replies with follow-up questions — Kip finds them derailing and annoying
- Never say "scratches the itch"
- Don't give orders — suggest, don't command ("you don't need to" not "don't")
- Estimate time and tokens at top of every build prompt
- Include exact steps to run (cd path, claude command, paste) at bottom of every prompt

## USER / DESIGN PHILOSOPHY

- The "bar test" is the design filter — this game is tested by real people at bars and social settings
- Girlfriends of football fans are a key audience — they want to learn football through the game
- Trick plays are a personal priority — Kip loves them and wants them to be a major feature
- The game should feel close to real football but with room for fun/crazy stuff
- "Good enough for now" is the philosophy — don't over-engineer, ship and iterate
- In real football most plays don't work and punting is normal — but in preseason mode the player should feel heroic, not punished. Playoffs is where realism lives.

---

## KEY CODE LOCATIONS (tacfoot4.html)

| What | Function / Location |
|------|---------------------|
| GAME_VERSION constant | Near top of file |
| Constants (MAX_YAC, FW, FH) | Line 15-16, top-level |
| Route library (RL) | Line 44-62 |
| Formations (FI, FSG, FSP) | Line 64-66 |
| Matchup matrix (MX) | Line 69-89 |
| Run blocking (RUN_BLOCKS) | Line 88-100 |
| PLAYS array | Line 97-129 |
| computePassOL | Line 190 |
| computeRunOL + hole resolution | Line 202-253 |
| computeDefPass (DL/LB/DB positioning) | Line 256+ |
| selectPlay / quickSnap / goPresnapFor | ~Line 584-600 |
| getQBActions | ~Line 1020-1041 |
| getRunActions | ~Line 1043-1050 |
| doQB (all QB action handling) | ~Line 730-808 |
| checkSack | ~Line 810-821 |
| getPressureOdds / doPressure | ~Line 823-844 |
| triggerContact / resolveContact | ~Line 861-903 |
| doRun (runner movement + tackle) | ~Line 905-955 |
| doRPO | ~Line 664-712 |
| snap() + RPO scenario | ~Line 620-660 |
| throwProbs / doThrow | ~Line 620-650 |
| Display DL clamp (post-processing) | ~Line 1171-1178 |
| Yard lines / field rendering | ~Line 1247-1260 |
| Down/distance overlay | ~Line 1258 |
| Decision mode UI | ~Line 1431-1462 |
| Pressure mode UI | ~Line 1463-1475 |
| Runner mode UI | ~Line 1477-1500 |
| RPO UI | ~Line 1395-1416 |

*Note: Line numbers are approximate and shift with each build. Use function names to search.*

---

## FILE INVENTORY

| File | Description |
|------|-------------|
| tacfoot4.html | Current working version — ALPHA 12.5 |
| tacfoot4-v1.html | Before first 4-bug fix pass |
| tacfoot4-v2.html | Before sack proximity + pressure escape |
| tacfoot4-v3.html | Before pressure percentages + inside run hole randomization |
| tacfoot4-v4.html | Before tackle proximity + play-by-play log |
| tacfoot4-v5.html | Before RPO system |
| tacfoot4-v6.html | Before phantom tackle fix + bubble pass fix |
| tacfoot4-v7.html | Before 5 new plays added |
| tacfoot4-v8.html | Before 6 fixes (throw away, dbl-click, yard lines, down/distance, etc.) |
| tacfoot4-v9.html | Before 7 fixes (throw away hardened, QB moves, upfield run, etc.) |
| tacfoot4-v10.html | Before Build 5A (receiver fix, turnovers, visibility, tuck, jargon) |
| tacfoot4-v11.html | Before Build 5B (ALPHA 12.5 — practice mode, look mechanic, gap-finder, contact %) |
| NOTES.md | Full technical changelog (Claude Code maintains) |
| HANDOFF-v11.md | Original design spec (partially outdated — this status doc supersedes) |
| PROJECT-STATUS-2026-02-15.md | This file |
