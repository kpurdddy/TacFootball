# Tactical Football v11 — Handoff Document

## CRITICAL BUG TO FIX FIRST

**Error: "Returnreact is not defined"**

The `.jsx` artifact has `React.Fragment` throughout (8 instances). The artifact renderer doesn't expose `React` as a global. Fix: replace all `<React.Fragment>` with `<>` and `</React.Fragment>` with `</>`. Fragment shorthand works fine in the artifact renderer — the previous developer incorrectly "fixed" them.

```
Find: <React.Fragment>
Replace: <>

Find: </React.Fragment>
Replace: </>
```

The `.html` standalone file works because it loads React via CDN and exposes `React` globally. The `.jsx` artifact does not.

Also remove the now-unused `@keyframes fw` CSS animation if it's still present — Fireworks were rewritten to use CSS transitions instead.

---

## PENDING UI TWEAKS (discussed but NOT yet coded)

### 1. Bold key phrases in play descriptions

Descriptions are now arrays of strings (one bullet per line). Within each string, **bold the key phrase** that tells you what the line is about at a glance. Use `<strong>` or `<b>` tags rendered via dangerouslySetInnerHTML, or split each line into segments with bold spans.

Example for Inside Run:
- Handoff at snap, RB hits the gap between your guards.
- This is your **default run play** — call it when you just want to run the ball and gain some yards.
- **No tricks**, no special situation needed. Consistent **3-5 yard gains** that keep drives alive.
- Once the defense starts **respecting your run game**, Play Action becomes deadly.

The idea: after reading once, on second look your eye catches the bold words and you instantly remember what the play does.

Apply this pattern to ALL play descriptions (run, pass, trick). Bold 1-3 key phrases per bullet line.

### 2. Pro/con tags stacked, not side-by-side

Currently the green (strong) and red (weak) tags sit in a flex row. Change to flex-column so they stack:
- Green tag on top
- Red tag below

### 3. Pro/con text needs bold/caps emphasis

The key info in pro/con needs to POP. Examples:
- ✓ vs Nickel: One fewer linebacker means **SOFTER MIDDLE**
- ✗ vs Goal Line: Everyone packed tight — **NO GAPS**

Bold + caps on the punchline phrase in each tag.

### 4. Five staple plays per category (NOT yet added — needs new plays)

Currently:
- RUN staples: Inside Run, Outside Run, Counter (3) — needs 2 more
- PASS staples: Quick Slants, Deep Post (2) — needs 3 more

Proposed additions discussed:
- **Power Run** — slower, more physical, RB follows a lead blocker into the gap. Almost guaranteed 2-3 yards. Lower upside than Inside Run but harder to stop for zero.
- **Stretch Run** — RB takes handoff moving laterally, reads blocks, finds the first gap. Patient run with higher variance — sometimes nothing, sometimes breaks big.
- **Out Routes** — receivers cut toward sideline, 8-12 yards. "Move the chains" pass, stops clock if out of bounds.
- **Curl/Comeback** — receivers run upfield then turn back toward QB. Works when defense gives cushion.
- **TE Seam** — tight end runs straight up the gap between linebackers and safeties. Middle-of-field option.

Each new play needs: name, icon, brief, desc (array), weak/weakWhy, strong/strongWhy, cat, formation, routes, AND a matchup matrix entry AND run blocking entry (if run play).

### 5. "Ceiling" jargon eliminated

Already done in current code. Just noting: never use "ceiling" or "floor" in player-facing text. Say "bigger potential gain" or "lower upside" instead.

---

## FUTURE FEATURES (discussed, not designed in detail)

### Coach System Expansion

**Coach B ("Hometown Hero")** — backstory refined:
- Legendary college coach, 30+ years, beloved
- Took this NFL job to save his hometown's franchise
- Brilliant but doesn't need credit. Already has his legacy.
- Speaks in teaching terms (decades coaching 19-year-olds)
- Takes responsibility for failures, credits players for success
- Calm because he's seen everything, not because he's passive
- Occasionally shows fire underneath in tight moments

**Coach A ("The Genius")** — existing cocky personality

**Mechanical differences between coaches (future implementation):**

| Situation | Coach B | Coach A |
|---|---|---|
| Ahead | Steady | Dominant — stat bonuses |
| Behind | Steady | Frustrated — undisciplined penalties, forces big plays |
| Late game | Gets stronger (Q4 boost) | Depends on score |
| After bad play | Shakes it off (no penalty) | Forces home run plays |
| Road games | Normal | Feeds off hostility — bonus when crowd hates them |

Coach A = higher ceiling, lower floor. Coach B = consistent.
Coach A blows teams out 42-10 but can collapse when behind.
Coach B grinds out 24-17 wins where you never felt in danger.

This is a REAL coaching choice with gameplay consequences, not cosmetic.

### Other tracked future features:
- Downfield blockers, defender stumble/trip, defender acceleration
- Timeouts, Hook and Lateral, Double Reverse, Philly Special, Hail Mary
- Hot routes, defensive play calling, fumble recovery scramble, two-player mode
- More coach personalities, coach learning system
- Better collision visuals, player fatigue, drive summary, playbook study, instant replay
- Game clock, two-minute drill, season mode, player stats, difficulty scaling, CPU offense

---

## ARCHITECTURE NOTES

### File structure
- `/mnt/user-data/outputs/tactical-football.jsx` — React component (artifact) — **THIS IS THE SOURCE OF TRUTH**
- `/mnt/user-data/outputs/tactical-football.html` — standalone HTML, **generated from the .jsx**

**Always fix the .jsx first, then rebuild the .html from it.** The .html is created by stripping the import, renaming the export, and wrapping in an HTML template with React loaded via CDN. Never edit the .html directly.

### Key data structures

**Play object:**
```js
{ 
  name: "Inside Run",     // display name (also key for matchup matrix and run blocking)
  icon: "🏈",
  type: "run"|"pass"|"trick",
  cat: "staple"|"situational"|"special",  // determines UI section
  brief: "One-line summary",
  desc: ["Array", "of", "bullet", "lines"],  // rendered with • prefix
  weak: "Goal Line",      // defense name where this play is bad
  weakWhy: "Why it's bad",
  strong: "Nickel",        // defense name where this play is good  
  strongWhy: "Why it's good",
  formation: FI|FSG|FSP,
  routes: { wr1: fn, wr2: fn, te: fn, rb: fn },
  // Optional flags: tossFumble, qbSneak, playAction, flea, fleaFumble, statue, qbDraw
}
```

**Matchup matrix** (`MX` object): play name → defense key → rating (-2 to +2)
- Must add entry for every new play

**Run blocking** (`RUN_BLOCKS` object): play name → OL assignments + hole location
- Must add entry for every new run play
- Keys must exactly match play name strings

### Play name references throughout code

When renaming plays (as was done HB Dive→Inside Run, HB Sweep→Outside Run), these ALL must match:
1. Play object `name` field
2. `MX` matchup matrix key
3. `RUN_BLOCKS` key (run plays only)
4. Any string comparisons in coach functions or debrief

### Game flow
1. Difficulty select → menu (RUN/PASS/TRICK) → playcall (pick play) → presnap (see defense, SNAP or AUDIBLE) → action phases → result → debrief → next down

### Current code size
~1660 lines, single React component with helper functions above it.

---

## WHAT NOT TO DO

- Don't rewrite working code without being asked
- Don't add features during bug fix passes
- Fix the crash FIRST, deploy, confirm it works, THEN discuss changes
- Play descriptions and UI layout changes should be discussed before coding
- The user wants collaborative development — propose, discuss, then implement
