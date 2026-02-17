# Tactical Football — Full Project Status
## February 14, 2026

---

## CURRENT STATE

**Working file:** `tacfoot4.html` in `C:\Users\Lash2\Desktop\TacFootball\` (Claude Code edits this)
**Deploy copy:** `C:\Users\Lash2\Desktop\TacFoot\index.html` (drag this folder to Netlify)
**Live URL:** calm-platypus-08c8a5.netlify.app (user may have renamed it)
**Backups:** tacfoot4-v1.html through v6+ in the TacFootball folder (Claude Code auto-increments)
**Handoff doc:** HANDOFF-v11.md (original design spec, partially outdated now)
**Session notes:** NOTES.md in project folder (Claude Code maintains this)

---

## TOOLS AND WORKFLOW

**Design conversations:** claude.ai chat (this interface). Talk through mechanics, plan features, discuss problems. No code generated here.

**Code execution:** Claude Code in PowerShell. Paste prompts designed in this chat. Claude Code reads and edits the actual file on disk.

**Every Claude Code prompt should:**
- Start with "Make a backup" (Claude Code auto-picks next version number)
- End with "Also copy the final result to C:\Users\Lash2\Desktop\TacFoot\index.html"
- End with "Update NOTES.md with what was changed"

**Deploy to Netlify:** Drag the TacFoot folder onto the deploy zone in Netlify (Deploys page, left sidebar).

**Token budget:** ~44,000 tokens per 5-hour window on Pro plan. Shared between this chat and Claude Code. Batch related fixes together to save tokens. One big prompt is cheaper than five small ones.

---

## WHAT EXISTS — CURRENT PLAYS (as of latest iteration)

### Run Staples (5):
1. Inside Run — basic up the middle
2. Outside Run — RB goes wide left
3. Counter — fake one way, cut back
4. Power Run — RB follows lead blocker, guaranteed short yardage (NEW)
5. Stretch Run — RB moves lateral, reads blocks, high variance (NEW)

### Run Special (2):
6. HB Toss — quick pitch wide, 8% fumble
7. QB Sneak — short yardage push, no post-snap read

### Pass Staples (5):
8. Quick Slants — short fast inside routes
9. Deep Post — WR sprints deep middle, needs pocket time
10. Out Routes — WRs cut to sideline, 8-12 yards, stops clock (NEW)
11. Curl/Comeback — WRs run up then turn back, works against cushion (NEW)
12. TE Seam — TE up the middle between LBs and safeties (NEW)

### Pass Situational (3):
13. Play Action — fake handoff then throw, needs established run game
14. Screen Pass — let rush come, dump to RB
15. Four Verticals — every receiver deep, exploits 2-safety coverage

### Trick (3):
16. Flea Flicker — fake handoff, pitch back, throw deep, 8% fumble
17. Statue of Liberty — fake pass, slip to RB
18. QB Draw — fake pass, QB runs through gaps

### Defenses (5):
- 4-3 Base, Nickel, Blitz, Cover 2, Goal Line

---

## WHAT WAS FIXED TODAY (Feb 14)

1. **Run balance** — pursuit escalation (+15% defender speed per move after move 2), tackle probability ramp (80%+ by move 5), Hit the Hole success rate decay (-12-15% per use). Breakaway runs still possible, just rare.

2. **Sack requires proximity** — sack only triggers if a defender is within 2 yards of QB. Pocket collapse degrades throw accuracy but doesn't auto-sack without physical contact.

3. **Pressure escape system** — when defenders are 1.5-3 yards from QB, shows PRESSURE state with options: Throw It Away (safe, lose the down), Tuck & Run (QB enters run/YAC system), Scramble L/R (move 4 yards, costs a phase, pocket drops 15%). Auto-sack if defender reaches 1.5 yards without a choice.

4. **Double-roll throw probability bug** — throwProbs() was called twice with different random rolls, so the displayed percentage didn't match the actual throw resolution. Fixed: doThrow now uses pre-computed probs. (Claude Code Sonnet found this — I got it wrong from a screenshot.)

5. **RPO post-snap read** — all run plays (except QB Sneak) now show a READ phase after snap. Three scenarios based on matchup quality: Gap Open (hand off / QB keep / quick pass), LB Filled Gap (hand off anyway / QB keep / quick pass), Edge Sealed (same options). Favorable matchup = gap open 70%, bad matchup = gap open 15%.

6. **Look Left/Right affects throws** — throwing opposite the look direction gets +15 completion and 0.6x INT. Throwing same side as look gets +5 INT.

7. **Five new plays added** — Power Run, Stretch Run, Out Routes, Curl/Comeback, TE Seam with full matchup matrix and route assignments.

---

## KNOWN BUGS — NOT YET FIXED (in priority order)

1. **Throw It Away disappears at low pocket** — at very low pocket integrity, the pressure options vanish and it skips to auto-sack. Throw It Away must ALWAYS be available until the sack actually triggers. This is the #1 priority.

2. **Tackle with no defender nearby** — on catches/YAC, the ball carrier gets tackled when no defender is visually close. Same bug as the old sack issue. Tackle must require a defender within 2 yards.

3. **OL visual — DL teleport through blockers** — DL positions should be clamped so they can never be closer to the QB than their assigned OL blocker. The DL pushes the OL back, but never passes through them.

4. **Inside Run hole always same spot** — the gap may always open in the same place. Should randomize between A gap, B gap, and wider holes depending on blocking matchups. (May have been partially fixed by RPO — needs checking.)

---

## NEXT PROMPT — Ready to paste into Claude Code:

Items 1-4 above, plus:
5. **Double-click play to snap** — double-clicking a play in the playbook goes straight to presnap/snap, skipping the Line Up step. Single click still previews.
6. **Clearer yard lines** — bolder numbers, brighter color, hash marks, large 10/20/30/40/50 on field like real football.
7. **Down and distance on field** — prominent display showing yard line, down, yards to go. Yellow first-down line on the field like TV broadcasts.

---

## FUTURE ROADMAP (in rough order)

### Polish pass:
- Play-by-play action log (show all actions during a play as a timeline)
- Percentages on pressure escape buttons
- Bold key phrases in play descriptions
- Pro/con tags stacked vertically
- Pro/con punchline text bold/caps

### Coach system:
- Coach B "Hometown Hero" full personality and dialogue
- Mechanical differences: Coach A collapses when behind, Coach B steady with Q4 boost
- Coach A = high ceiling/low floor, Coach B = consistent grinder
- Coach learning system (further out)

### Game systems:
- Game clock, timeouts, two-minute drill
- CPU offense (they score too — currently offense only)
- Hot routes (change receiver routes at the line)
- Defensive play calling (player calls defense)
- Fumble recovery scramble

### Advanced features:
- More trick plays: Hook and Lateral, Double Reverse, Philly Special, Hail Mary
- Better collision visuals
- Player fatigue
- Drive summary
- Playbook study / instant replay
- Season mode, player stats, difficulty scaling
- Two-player mode

---

## ARCHITECTURE NOTES

- Single HTML file with inline React, loaded via CDN (not Claude's JSX artifact renderer — that's broken for files this large)
- Babel CDN handles JSX transpilation in-browser
- ~1800+ lines now with new plays
- Key data structures: PLAYS array, MX matchup matrix, RUN_BLOCKS, DEF_FORM defenses
- Route library (RL) has all route functions: go, slant, post, out, curl, seam, flat, check, block, dive, sweep, counter, toss, screen, wheel, flee, statue
- All play names must match across PLAYS, MX, and RUN_BLOCKS

## WHAT NOT TO DO

- Don't rewrite working code without being asked
- Don't add features during bug fix passes
- Don't generate entire new files — make targeted edits
- Don't guess at code problems from screenshots — ask Claude Code to diagnose
- Always back up before editing
- Always copy result to TacFoot\index.html for deploy
- Always update NOTES.md after changes
