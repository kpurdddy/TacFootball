# BUILD 5B: Playtesting Fixes + Practice Mode — ALPHA 12.5

**Make a backup first (auto-increment version number).**
**Copy final result to ALL of these. If a path doesn't exist, skip it and note which ones failed:**
- The same folder you found tacfoot4.html in
- Desktop TacFoot\index.html (check C:\Users\obrie\Desktop\TacFoot\ or C:\Users\domain\Desktop\TacFoot\ or C:\Users\Lash2\Desktop\TacFoot\ — whichever exists)
- D:\TacFootball\ (if D: drive exists)

**Update NOTES.md when done.**

**CRITICAL: Use line-level edits only. Do NOT rewrite entire functions or regenerate large blocks.**

**When finished, print a DONE summary in plain English: what you changed, where the files are saved, total tokens used, and anything the user still needs to do manually.**

---

## CONTEXT

Build 5A just landed. Receivers get open now, turnovers are reduced, QB buttons are contextual, on-field indicators work. But playtesting revealed new issues: preseason is now TOO easy (all 4 receivers get wide open), the Look mechanic doesn't create real tradeoffs, the gap-finder sends runners directly into defenders, and Hit the Hole is overused as a label. Also adding Practice Mode and a version number display.

The game is a single-file React app (tacfoot4.html) using inline JSX with Babel CDN. Do not use python or node commands if they are not installed — edit the HTML file directly.

---

## TASK 1: Version Number Display

Add a version label to the game screen. Display in the top-left area near the scoreboard, not overlapping:

**"ALPHA 12.5"** — small text, ~10px, muted color like #667788, always visible during gameplay.

Add near the top of the file: `const GAME_VERSION = "ALPHA 12.5";`

Future builds update this one constant. Major builds = whole numbers (Alpha 13, 14). Bug fixes = decimals (13.1, 13.2).

---

## TASK 2: Tighten Preseason DB Coverage Speed

### Problem
Build 5A set preseason DB tracking to 70% of WR speed. Result: ALL four receivers get wide open every play. No decisions matter.

### Fix
Change the difficulty-based DB tracking multipliers:
- Preseason: **0.82** (was 0.70)
- Regular: **0.90** (was 0.85)
- Playoffs: **1.0** (unchanged)

Find where the DB tracking speed modifier was added in Build 5A and adjust the values.

### Goal
After 1-2 Drop Backs in preseason, 1-2 receivers should be Open or Wide Open, 1-2 should be Contested or Covered. Player has a real choice about who to throw to.

---

## TASK 3: Look Mechanic Shifts Coverage

### Problem
Looking Left or Right doesn't meaningfully change the field. All receivers end up wide open anyway. In real football, looking one way pulls the safety that direction, opening up the OTHER side.

### Fix
When the player uses Look Left or Look Right, apply a coverage shift:

**Look Left:**
- Receivers on the LEFT side: defenders shift TOWARD them (tighter coverage, -1 yard separation)
- Receivers on the RIGHT side: defenders shift AWAY (looser coverage, +1.5 yards separation)

**Look Right:**
- Same logic, reversed sides

The shift must be visible — receiver openness labels on the field should update after a Look. Player sees "I looked left and now my right WR went from Contested to Open."

**Net effect:** Looking creates a real tradeoff. You sacrifice coverage on the side you looked at to gain an opening on the opposite side. Combined with the existing +15% completion bonus for throwing opposite your look, this makes Look a meaningful strategic action.

---

## TASK 4: Gap-Finder Never Runs Into Defenders

### Problem
The run arrow (green arrow on field) sometimes points directly at a defender. The RB runs straight into a CB or LB when there's clearly open space elsewhere.

### Fix
In the gap-finding function (the forward cone scoring system from Session 3):

1. For each candidate direction, check if any defender is within **3 yards** along that path
2. If a defender is directly in the path (within 15-degree cone of the direction), apply a **massive penalty** to that direction's score (multiply by 0.1)
3. If a defender is nearby but not directly in the path (15-30 degrees), apply a moderate penalty (multiply by 0.5)
4. Weight toward the direction with the **most open space** — defined as the greatest distance to the nearest defender along that path

The arrow should always point toward daylight. If there is NO open direction (completely surrounded), pick the direction with the most distant defender.

### Test
After this fix, the green arrow should never visually point at a red defender dot. If the RB is near the right sideline and a CB is directly ahead, the arrow should angle left toward open field.

---

## TASK 5: Hit the Hole Context-Sensitive Rename

### Problem
"Hit the Hole" is used everywhere — at the line, in the open field, after a catch. It only makes sense when an RB is near the line of scrimmage running behind blockers.

### Fix
Track the ball carrier's distance from the original line of scrimmage.

**At or behind the line (0-2 yards past snap point):**
RB gets: Hit the Hole, Bounce Outside, Break It, Power Forward — current labels, these make sense here.

**Past the line (3+ yards past snap point):**
RB gets: **Sprint** (was Hit the Hole), **Cut Outside** (was Bounce Outside), **Juke** (was Break It), **Dive Forward** (was Power Forward)

Same mechanics, same success rates, just different labels that match what's actually happening.

This stacks with the existing fixes:
- QB scramble: Sprint Upfield, Slide, Cut Outside, Truck It (Session 3)
- WR/TE after catch: Sprint, Cut Outside, Juke, Dive Forward (Session 4)
- RB near the line: Hit the Hole, Bounce Outside, Break It, Power Forward (original)
- RB in open field: Sprint, Cut Outside, Juke, Dive Forward (this fix)

---

## TASK 6: Contact Percentages Driven by Defender Positions

### Problem
Spin always shows the highest success %. The percentages are flat rates that don't change based on the actual field situation. This means there's always one obviously correct choice.

### Fix
Modify the contact action success rates based on where defenders actually are relative to the ball carrier:

**Sprint / Hit the Hole (straight ahead):**
- If no defender within 5 yards ahead: **85%+** (open field, go!)
- If defender 3-5 yards ahead: **60-70%**
- If defender within 3 yards ahead: **30-40%** (someone's right there)

**Cut Outside / Bounce Outside (lateral):**
- If sideline route is clear (no defender within 4 yards to the outside): **75%+**
- If defender is between ball carrier and sideline: **25-35%**

**Juke / Break It / Spin (evasion):**
- Base rate stays similar to current
- BUT: if only 1 defender nearby, higher success (1-on-1 juke)
- If 2+ defenders nearby, much lower success (can't juke a crowd)
- Fumble risk increases as previously implemented in Build 5A

**Dive Forward / Power Forward (safe):**
- Always **80-85%** for 1-3 yards
- Always **zero fumble risk**
- The "I'll take what I've got" option

### Goal
There should always be at least two roughly equal good choices depending on the situation. If the sideline is clear, Cut Outside and Sprint should both be good. If surrounded, Dive Forward is clearly best. The player reads the field and makes a real decision.

---

## TASK 7: Practice Mode

### What It Is
A new difficulty level below Preseason. The game pauses at every single decision point and explains what's happening, what the options are, and why. A guided tutorial disguised as a game.

### Difficulty Select Screen
Add a fourth option ABOVE Preseason:

**Practice (Team Practice)**
"Learn every part of football step by step. The game pauses and explains each decision. No pressure, no score — just learning."

**Preseason** (existing)
**Regular Season** (existing)
**Playoffs** (existing)

### How Practice Mode Works

The game plays normally but **pauses before every decision point** with an explanation overlay. The overlay appears as a coach text box on the field or above the control panel. It has a "GOT IT" button to continue.

**No real scoring pressure.** The score still exists for context but the game never punishes you. No turnovers in practice mode (fumble and INT chances set to essentially zero — multiply by 0.05). Incompletes can happen but are rare (completion bonus +30%, cap 98%).

### Decision Points and Explanations

**1. Play Selection (before choosing a play):**
"This is your playbook. Each play is a different plan for how to move the ball. Run plays hand the ball to your running back. Pass plays have the quarterback throw to a receiver. Tap any play to see what it does."

First time only. After the first play, this shortens to: "Pick your next play. Remember, green tags mean this play is strong against their defense."

**2. After Defense is Revealed (presnap):**
"The defense just lined up in [DEFENSE NAME]. [One sentence about what that defense does — e.g., 'Blitz means they're sending extra rushers at your quarterback — you'll have less time to throw, but fewer defenders covering receivers.']"

If matchup is bad: "Your play isn't great against this defense. See those red tags? You can tap a different play to switch, or go ahead and try it — it's practice!"

If matchup is good: "Great pick! Your play is strong against this defense. The green tag means you have an advantage."

**3. After Snap — Pass Play (QB Decision Phase):**
First time: "Your quarterback has the ball. Now you decide what to do with it. **Drop Back** moves him away from the defense and gives your receivers time to get open. Try it!"

After first Drop Back: "Good! See how the receivers moved further down the field? The labels on the field show you who's open (green) and who's covered (red). When you see a receiver marked OPEN, tap their name to throw to them."

**4. After Snap — Run Play (RPO Read):**
"The line just moved. See that message? [Gap Open / Defender closed the lane / etc.] This tells you what happened at the line of scrimmage. If there's a hole, hand it off! If the defense read it, you might want the QB to keep it or throw a quick pass instead."

**5. During Run (Contact Buttons):**
"Your runner hit traffic! These buttons are his options. Look at the percentages — higher means more likely to work. **Dive Forward** is always safe but short. **Sprint** is great if the field ahead is clear. **Juke** is risky but might break a big play. The fumble chance tells you how likely he is to drop the ball."

**6. During Pass (Throw Buttons):**
"Time to throw! Each receiver shows three things: how many yards they'll gain, whether they're OPEN or COVERED, and your chances of completing the pass (HIT %) vs getting intercepted (INT %). Throw to the open receiver with the best HIT %."

**7. After Play Result:**
Always show a brief assessment:
- Good play: "Nice! You read the defense and made a good decision. [Brief explanation of what worked.]"
- Bad play: "That didn't work because [brief explanation]. Next time, try [specific suggestion]."

### Coach Text Style in Practice Mode
- Warm, encouraging, never critical
- Uses "you" and "your" — talking directly to the player
- Short sentences, simple words
- Never uses football jargon without immediately explaining it
- Each explanation has a "GOT IT" button that dismisses it and continues the game

### Technical Implementation
- Add `"practice"` as a new difficulty option alongside "preseason", "regular", "playoffs"
- Practice mode uses the same game engine as preseason but with:
  - DB tracking at **0.78** (even easier than preseason for learning)
  - Fumble multiplier: **0.05** (essentially zero)
  - INT multiplier: **0.05** (essentially zero)
  - Completion bonus: **+30** (cap 98%)
  - Pressure penalty: **reduced by 75%**
- Add a `practiceOverlay` state that holds the current explanation text
- Add a `practiceStep` tracker so explanations shorten after the first time
- The overlay is a semi-transparent dark panel with white text and a "GOT IT" button
- "GOT IT" sets practiceOverlay to null, resuming normal game flow
- Each decision point checks `if (diff === "practice" && shouldShowExplanation)` before rendering the overlay

### What Practice Mode Does NOT Have
- No commentary system (the coach explanations replace it)
- No matchup warnings (replaced by the explanation overlays which are more detailed)
- No time pressure of any kind
- The play tooltips from preseason STILL show (they help reinforce learning)

---

## ORDER OF OPERATIONS

1. **Task 1** — Version number (tiny, do first)
2. **Task 2** — Tighten DB speed (small value change)
3. **Task 3** — Look mechanic coverage shift
4. **Task 4** — Gap-finder avoids defenders
5. **Task 5** — Hit the Hole context rename
6. **Task 6** — Contact percentages from defender positions
7. **Task 7** — Practice Mode (largest task, do last)

## WHAT NOT TO CHANGE

- No changes to MX matchup matrix values
- No changes to the commentary system from Sessions 4/5A
- No changes to the coach suggestion system from Sessions 4/5A (except Practice Mode replaces it with overlays)
- No changes to the Tuck the Ball mechanic from Build 5A
- No changes to the OL indicator system from Build 5A
- No changes to pocket warning system from Build 5A
- Don't rewrite functions — targeted edits only
