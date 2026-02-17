# Tactical Football — Complete Project Status & Design Document
## Updated: February 15, 2026

---

## CURRENT STATE

**Working file:** tacfoot4.html (Claude Code edits this directly)
**Deploy folder:** C:\Users\Lash2\Desktop\TacFoot\ (contains index.html, drag to Netlify)
**Live URL:** tacfoot4.netlify.app
**Backups:** tacfoot4-v1 through v8+ in project folder (Claude Code auto-increments)
**Session notes:** NOTES.md in project folder (Claude Code updates after each session)
**Handoff doc:** HANDOFF-v11.md (original design spec, partially outdated — this document supersedes it)

---

## TOOLS AND WORKFLOW

**Design conversations:** claude.ai chat. Talk through mechanics, plan features, discuss problems. No code here.

**Code execution:** Claude Code in PowerShell terminal. Paste prompts designed in chat. Claude Code reads and edits the file on disk.

**Every Claude Code prompt should include:**
- "Make a backup first (auto-increment version number)"
- "Also copy the final result to the TacFoot\index.html folder" (PC1: C:\Users\Lash2\Desktop\TacFoot\index.html, PC2: C:\Users\domain\OneDrive\Documents\Software Licenses\OldDelete\TacFoot\index.html)
- "Update NOTES.md when done"

**Deploy:** Drag the TacFoot folder onto Netlify Deploys page (left sidebar → Deploys → drag zone at bottom).

**Token budget:** ~44,000 tokens per 5-hour window on Pro plan. Shared between claude.ai chat and Claude Code. Batch related fixes to save tokens.

**Google Drive sync:** If working from multiple computers, install Google Drive for Desktop so files sync automatically. Claude Code can read/write to the Drive folder directly.

---

## WHAT EXISTS — CURRENT PLAYS

### Run Staples (5):
1. Inside Run — basic up the middle
2. Outside Run — RB goes wide
3. Counter — fake one way, cut back
4. Power Run — RB follows lead blocker, guaranteed short yardage, low ceiling but hard to stop (ADDED FEB 14)
5. Stretch Run — RB moves lateral, reads blocks, high variance (ADDED FEB 14)

### Run Special (2):
6. HB Toss — quick pitch wide, 8% fumble
7. QB Sneak — short yardage push, no RPO read

### Pass Staples (5):
8. Quick Slants — short fast inside routes
9. Deep Post — WR sprints deep middle, needs pocket time
10. Out Routes — WRs cut to sideline, 8-12 yards, stops clock (ADDED FEB 14)
11. Curl/Comeback — WRs run up then turn back, works against cushion (ADDED FEB 14)
12. TE Seam — TE up the middle between LBs and safeties (ADDED FEB 14)

### Pass Situational (3):
13. Play Action — fake handoff then throw
14. Screen Pass — let rush come, dump to RB
15. Four Verticals — every receiver deep

### Trick (3):
16. Flea Flicker — fake handoff, pitch back, throw deep, 8% fumble
17. Statue of Liberty — fake pass, slip to RB
18. QB Draw — fake pass, QB runs through gaps

### Defenses (5):
- 4-3 Base, Nickel, Blitz, Cover 2, Goal Line

---

## WHAT WAS BUILT/FIXED ON FEB 14

1. **Run balance** — pursuit escalation (+15% defender speed per move after move 2), tackle probability ramp (80%+ by move 5), Hit the Hole success rate decay (-12-15% per use). Breakaway runs still possible, just rare.

2. **Sack requires proximity** — sack only triggers if a defender is within 2 yards of QB.

3. **Pressure escape system** — when defenders 1.5-3 yards from QB, shows PRESSURE state: Throw It Away (safe, lose the down), Tuck & Run (QB enters run/YAC), Scramble L/R (4 yards lateral, costs a phase, pocket drops 15%). Auto-sack at 1.5 yards.

4. **Double-roll throw probability bug** — throwProbs() was called twice with different random rolls. Displayed % didn't match actual throw. Fixed: doThrow uses pre-computed probs. (Claude Code Sonnet diagnosed this correctly when I guessed wrong from a screenshot.)

5. **RPO post-snap read** — all run plays (except QB Sneak) show READ phase after snap. Three scenarios based on matchup: Gap Open / LB Filled Gap / Edge Sealed. Each offers Hand Off, QB Keep, Quick Pass. Favorable matchup = gap open 70%, bad = 15%.

6. **Look Left/Right affects throws** — throwing opposite look direction gets +15 completion, 0.6x INT. Throwing same side as look gets +5 INT.

7. **Five new plays** — Power Run, Stretch Run, Out Routes, Curl/Comeback, TE Seam with full matchup matrix entries.

8. **Double-click to snap** — double-clicking a play goes straight to presnap, skipping Line Up button.

9. **Yard lines and down/distance** — bolder yard markings, numbers on field, yellow first-down line, down and distance display.

### Also fixed in Session 2 (v8):

10. **Throw It Away always available** — added as permanent escape option in both decision and pressure modes, right up until sack triggers.

11. **Double-click play to snap** — double-clicking a play goes straight to presnap, skipping Line Up button.

12. **Tackle requires defender within 2 yards** — all tackle paths hardened to require defender proximity. No more phantom tackles.

13. **DL display clamp** — post-processing clamp ensures DL can never visually pass their assigned OL blocker.

---

## KNOWN BUGS — NOT YET FIXED

~~1. Throw It Away disappears at low pocket~~ — **FIXED v8**

2. **QB scramble uses RB move names** — when QB tucks and runs, should show: Sprint Upfield (not Hit the Hole), Slide (not Power Forward, ends play safely), Cut Outside (not Bounce Outside), Truck It (not Break It).

3. **Run direction favors lateral over upfield** — gap-finding treats all directions equally. Sends runner sideways through traffic when open field is straight ahead. Fix: heavily weight forward movement. Only look for gaps in a forward cone (45 degrees left to 45 right of straight upfield). A small gap forward is always better than a huge gap sideways. Hit the Hole should ALWAYS move primarily upfield. This is the biggest visual problem in the game right now — it looks terrible when the runner goes sideways through defenders.

~~4. Tackle with no defender nearby~~ — **FIXED v8**

~~5. DL teleport through OL~~ — **FIXED v8**

6. **"(run the play)" label in preseason** — default post-snap option labeled to guide new players. "Drop Back (run the play)", "Hand Off (run the play)". Label disappears in regular season.

7. **Difficulty screen descriptions** — under each difficulty option:
   - Preseason: "Learn the game. Coach explains every position, every play, and why matchups matter. Perfect if you're new to football."
   - Regular Season: "You know the basics. Coach steps back, training wheels come off. You make the reads."
   - Playoffs: "No help. Pure football IQ. You either learned it or you didn't."

8. **Intentional grounding risk on Throw It Away** — if QB is still in the pocket, 30-40% chance of penalty (loss of down + 10 yards). If QB has scrambled outside the pocket, safe throwaway, no penalty. Makes Throw It Away a real decision, not a free escape.

---

## ROADMAP — IN ORDER

### Phase 1: Remaining Bug Fixes (NEXT)
Items 2, 3, 6, 7, 8 from bugs list above. Three fixes landed (Throw It Away, tackle proximity, DL clamp). Five remain.

### Phase 2: Game Feel
- Game clock and quarters on screen (even if basic/non-functional at first — it looks like football)
- Penalty splash screens (like TD splash but for flags)
- Field goal kicking system (including THE MELEFICENT — see dedicated section below)

### Phase 3: Two-Player V1
- Defense selection screen for Player 2
- Split screen simultaneous pick on tablet (cardboard divider between players for play selection)
- Both pick, snap, play resolves
- Offense plays exactly as current single player, defense just replaces CPU random pick with human choice
- Cardboard only needed for play selection. During the play, players can cover their side with hands for any simultaneous choices

### Phase 4: Teaching/UX Pass
- Brief explanations under every button in preseason (not just labels — actual teaching: "Send Extra Rusher — pull a defensive back off his receiver and send him at the QB. More pressure, but someone's now wide open.")
- Pocket collapse rate indicator (Slow / Steady / Fast / Critical, or arrows like 68% ↓↓↓)
- Position glossary / Learn button on main menu — plain language explanations of every position, what they do, where they line up. Written like a friend explaining at a bar, not a textbook.
- Coach suggests better plays on bad matchups in preseason — names two specific alternatives with explanations using strongWhy text from those plays

### Phase 5: Two-Player V2 (The Real Game)
- During YAC/contact, both players choose simultaneously
- Offense picks: Juke, Truck, Sprint, Spin, Dive Forward
- Defense picks: Wrap Tackle, Strip Attempt, Contain, Hit Stick
- Rock-paper-scissors with asymmetric risks:
  - Sprint vs Strip = fumble danger
  - Truck vs Strip = strip fails, offense gains extra
  - Juke vs Hit Stick = defender whiffs, big play
  - Dive vs anything = play over, 1-2 yards, safe
- Ball security degrades with repeated aggressive offensive moves (3% → 8% → 15% fumble). Truck or Dive resets counter.
- 3-second timer, both pick, reveal, resolve
- On tablet: offense picks left side, defense picks right side, buttons far enough apart that no cardboard needed for this phase

### Phase 6: Gameplay Depth
- Contextual YAC moves based on field situation:
  - 1 defender in open field: Head Fake, Sprint Past, Stiff Arm, Cut Inside/Outside
  - 2 defenders closing: Spin Move, Split Them, Cut Back
  - 3+ swarming: Power Forward, Dive, Lateral (desperate)
  - Open field nobody near: no choice needed, runner just gains yards automatically until someone closes
- Post-snap defensive choice (commit to run or hold coverage)
- "Great pocket but no open receivers" scenario — QB has time but nowhere to throw. Wait (small chance receiver breaks free, pocket slowly degrades), throw it away, tuck and run
- Look Left/Right costs a phase to turn back — real commitment, not free
- Crowd noise mechanic — home team defense can wave arms to raise crowd noise, disrupts offensive audibles

### Phase 7: Coach System
- Coach suggestions scaling by season:
  - PRESEASON: Two specific play suggestions with full explanations when matchup is bad. "They're in Cover 2 — your Out Routes will get eaten alive on the sideline. Try Quick Slants up the middle or TE Seam through the gap in their zones."
  - REGULAR SEASON: Just warns "Bad look. Consider an audible." No specific plays.
  - PLAYOFFS: Nothing. Matchup tag colors are your only hint.
- Coach A vs Coach B mechanical differences:
  - Coach B (teacher): keeps giving suggestions longer, calm, instructional, takes responsibility for failures
  - Coach A (genius): stops helping earlier, attitude when you ignore advice, critical on bad calls, takes credit for good calls
- Full coach personality dialogue
- Coach B preseason suggestion with attitude for Coach A: "You're not seriously running that against Nickel, are you? Call Screen Pass and stop wasting my time."

### Phase 8: Trick Plays (Ongoing, Add Anytime)
- Philly Special — QB becomes receiver, TE throws. Two phases. TE accuracy is terrible (55-65% base). Strong vs Goal Line/Blitz, weak vs Cover 2/Nickel. 5% fumble on snap-RB-TE exchange.
- Hook and Lateral — catch, then post-catch decision to lateral to trailing runner. Huge fumble risk on lateral, huge gain if it works.
- Double Reverse — two handoffs, three fumble points. Slow to develop. Devastating if defense overcommits to first fake.
- Halfback Pass — RB takes handoff, pulls up, throws. Even worse accuracy than TE.
- Fumblerooski — QB puts ball on ground, lineman picks it up. Illegal in real NFL, hilarious in game.
- Hail Mary — goes under PASS SITUATIONAL, not tricks. Every receiver deep, QB heaves, contested catch point, tipped ball possibilities. Clearly labeled as desperation.
- Player-submitted trick plays from testers/friends
- Crazy/fun plays for later (mascot distraction, etc.)

### Phase 9: Advanced Systems
- Zone vs Man coverage toggle for defense
- Full defensive playbook with tricks (fake blitz, delayed blitz, spy, bracket coverage)
- Audible/adjust reactions in two-player (offense audibles, defense gets chance to adjust)
- Timeouts (3 per half, freeze play, change completely, no defensive reaction — makes them precious)
- Two-minute drill mode

### Phase 10: Season/Meta
- Season mode
- Player stats tracking
- Difficulty scaling
- Player fatigue
- Drive summary
- Playbook study / instant replay
- Better graphics (way down the road)

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

**Progress updates (the ball travels, each line appears one at a time with drama):**
"The ball is in the air..."
"15 yards... still going!"
"25 yards... it has legs!"
"35 yards... no way..."
"45 yards... the crowd is on their feet!"
"50 yards... this is uncharted territory!"
"56 yards... it's losing altitude..."

**Then the failure (RANDOMIZED — 15-20 different messages so she gets a new one every time):**

Pool of failure messages:
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
When she attempts multiple 92-yard field goals in the same game, the opposing team "feels bad" and gives the down back. This lets her keep trying without burning all her downs. Message: "The opposing team, moved by her determination, has declined the change of possession. The crowd applauds."

### The Secret Cheat / Easter Egg:
There is a SECRET WAY to make the Meleficent succeed. This is so that someone who knows the secret (like Kip) can make it happen when Melissa is playing in a group, to surprise her. The trigger could be:
- A specific sequence of actions before the kick (like: call three specific plays in a row, then kick)
- A hidden button or tap zone on the screen
- A konami-code style input during the kick animation
- Something typed into a hidden text field

When triggered, the success sequence plays:

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

Massive splash screen. Fireworks. Confetti. The most over-the-top celebration in the game. Way bigger than a normal touchdown.

Without the cheat, there is a natural 0.01% chance it goes in. So the possibility always technically exists.

---

## ARCHITECTURE NOTES

- Single HTML file with inline React loaded via CDN (not Claude's JSX artifact renderer — that's broken for large files)
- Babel CDN handles JSX transpilation in-browser
- ~2000+ lines with new plays and features
- Key data structures: PLAYS array, MX matchup matrix, RUN_BLOCKS, DEF_FORM defenses
- Route library (RL): go, slant, post, out, curl, seam, flat, check, block, dive, sweep, counter, toss, screen, wheel, flee, statue
- All play names must match across PLAYS, MX, and RUN_BLOCKS
- Claude Code can work on any computer — all thinking happens on Anthropic's servers, local machine just needs a terminal and browser

## CRITICAL WORKFLOW RULES

- Don't rewrite working code without being asked
- Don't add features during bug fix passes
- Don't generate entire new files — make targeted edits
- Don't guess at code problems from screenshots — tell user to ask Claude Code to diagnose
- Always back up before editing (auto-increment version)
- Always copy result to TacFoot\index.html
- Always update NOTES.md
- When user reports a bug, say "I don't know from a screenshot, ask Claude Code to look at the code" instead of inventing a confident wrong explanation

## USER PREFERENCES (for Claude)

- Never end replies with follow-up questions asking "want me to do X or keep going" — Kip finds them annoying and derailing. Just keep going unless he says stop.
- Never use the phrase "scratches the itch"
- Be direct and honest when you don't know something
- This game is being tested by real people at bars and social settings — the "bar test" is the design filter
- Girlfriends of football fans are a key audience — they want to learn football through the game
- Trick plays are a personal priority — Kip loves them and wants them to be a major feature
- The game should feel close to real football but with room for fun/crazy stuff in later iterations
- "Good enough for now" is the philosophy — don't over-engineer, ship and iterate
