# TacFootball Development Notes

## Current State (as of 2026-02-17)

Single-file React app (`tacfoot4.html`) — tactical football game with play calling, QB decision-making, run/pass mechanics, RPO system, contact resolution, play-by-play logging, and commentary system.

---

## Changes Made 2026-02-17

### ALPHA 15.0.1 — Field Height Fix (1 fix)

Backup: `tacfoot4-v23.html` (pre-ALPHA 15.0.1 state)

#### FIX 1 — Responsive Field Height
- FH now computed dynamically: `Math.max(540, Math.floor(window.innerHeight * 0.74))`
- Field fills 74% of viewport height (minimum 540px floor)
- On 1080p: FH ≈ 799px. On 1440p: FH ≈ 1065px. On 900p: FH ≈ 666px.
- PY still FH/42 so 42 yards always visible regardless of screen size
- Play call buttons compacted: padding 14px→8px, font 15→14, description font 10→9
- Field now dominates the screen as intended — buttons are a compact strip at the bottom

---

### ALPHA 15.0 — The Field (8 fixes)

Backup: `tacfoot4-v22.html` (pre-ALPHA 15.0 state)

#### FIX 1 — Full Field With Goal Lines and End Zones
- End zones rendered as colored rectangles beyond both goal lines (opponent=dark red, own=dark blue)
- "END ZONE" text centered in each end zone when visible
- Bold white goal lines at both ends of the field (opponent's is 4px with glow, own is 3px)
- Line of scrimmage changed from gold to blue (TV broadcast style)
- First down marker stays yellow/gold with glow
- Yard line count increased from 28 to 50 (covers full 125-yard span centered on camera)
- Yard lines clipped to 0-100 range (no yard lines in end zones, matching real football)
- Yard numbers slightly more visible (opacity 0.18, up from 0.15)

#### FIX 2 — Camera Hard Clamp: Ball Carrier Never Leaves Screen
- NEW APPROACH: Render-time safety net via `effectiveCamY` useMemo
- If ball carrier's screen position is in top 15% of viewport, camera instantly snaps to put them at 40% from top
- This override happens at RENDER TIME, not in the lerp loop — no state update delay can cause off-screen
- The smooth lerp system still handles normal tracking (0.28 lerp for runners)
- Removed `camY` from camera target useEffect dependency array (prevents wasteful re-runs)
- Should finally fix deep catches with YAC where runner outpaces camera

#### FIX 3 — Field Size Taller
- FH increased from 460 to 540 pixels (17% taller field area)
- PY changed from FH/38 to FH/42 (42 yards visible instead of 38, each yard ~12.9px)
- Scoreboard margin reduced from 8px to 2px, padding from 6px to 4px
- Controls top margin reduced from 6px to 2px
- Field now dominates the screen as intended

#### FIX 4 — Bounce Outside Per-Click Gain Increased
- When edge IS clear (75-85% success): ydsLow raised from 0 to 4, ydsHigh capped at 8
- Clear edge now gives 4-8 yards per successful click (was 0-20, often 2-3)
- When edge is blocked (25-35% success): unchanged (0 to gambleYds)
- Reward now matches the risk/opportunity shown in the percentages

#### FIX 5 — DISMISS Button Styling
- Changed from full-width banner to normal-sized left-aligned button
- Padding: 3px 12px, borderRadius: 3, display: inline-block
- Sits below Dan & Kiki text as a discrete button, not a footer bar

#### FIX 6 — "Drop Back" → "Wait" at Phase 2+
- Phase 1: Still "Drop Back" (QB is actually dropping back)
- Phase 2+: Renamed to "Wait"
- Default subtitle at Phase 2+: "Let the routes develop"
- Pressure warnings still override: "Pocket collapsing — risky!" and "Pressure building"

#### FIX 7 — Pressure Alerts as On-Screen Text
- Broadcast-style alerts appear center-screen on the field when pressure changes
- "POCKET COLLAPSING" (red) when pocket integrity drops below 30%
- "PRESSURE BUILDING" (yellow) when pocket integrity drops below 50%
- "[RECEIVER] WIDE OPEN" (green) when any receiver hits WIDE OPEN status (once per play)
- Alerts scale in at 115%, hold for ~1.5s, then fade out over 2s total
- CSS animation: alertFade keyframe with scale and opacity transitions
- pointerEvents:none — never blocks gameplay buttons
- Detection via useEffect watching `pi` transitions with `prevPiRef` tracking

#### FIX 8 — Announcer Delay Increased
- Commentary delay increased from 1500ms to 2750ms
- Players now have nearly 3 seconds to see the field result before announcer booth appears

---

### ALPHA 14.9.1 — Announcer Timing & Camera Fix (3 fixes)

Backup: `tacfoot4-v21.html` (pre-ALPHA 14.9.1 state)

#### FIX 1 — Announcer Booth DISMISS Placement
- Removed auto-dismiss timer (was 4 seconds in 14.9 — players found it too abrupt)
- Moved DISMISS button from header row to below Dan & Kiki commentary text
- Full-width button with rounded bottom corners (0 0 4px 4px) for clean visual closure
- Players can now read commentary at their own pace

#### FIX 2 — Delayed Announcer Appearance
- After play resolves, field result is visible for 1.5 seconds with NO overlay blocking it
- Commentary is generated immediately but stored; displayed after 1500ms setTimeout
- Timer properly cleared on play reset, new snap, and DISMISS click
- No extra clicks or frozen states — purely visual delay on the commentary overlay

#### FIX 3 — Camera Aggressive for Runners After Catch
- Increased run/catch lookahead from 5 to 10 yards ahead of ball carrier
- Variable lerp speed: 0.28 for active runners (was 0.20 globally), 0.20 for other modes
- Snap behavior: if ball carrier is in top 20% of viewport, lerp jumps to 1.0 (instant catch-up)
- Prevents runners from outpacing the camera and disappearing off the top of the screen

---

### ALPHA 14.9 — Bug Fixes & Visual Improvements (6 fixes)

Backup: `tacfoot4-v20.html` (pre-ALPHA 14.9 state)

#### FIX 1 — Intended Receiver On-Field Highlighting
- Gold glowing ring (3px solid #fbbf24) around the intended receiver's circle on the field
- "INTENDED" label positioned below the receiver in gold
- Gold box-shadow glow (10px spread) for immediate visibility
- Only visible during decision/pressure modes (pass plays)
- The play's designed receiver is now visible at a glance without reading buttons

#### FIX 2 — Pocket Integrity Layout Redesign
- Added centered "POCKET INTEGRITY" header (7px, letter-spaced) above the bars
- Changed layout to "Left [bar] Right [bar]" format, centered as a column
- Replaced "L Pocket" / "R Pocket" inline labels with cleaner "Left" / "Right"
- Players now understand what the bars measure without guessing

#### FIX 3 — YAC Explanation in Result Text (Fixed from 14.8.1)
- Root cause: `endPlay()` calls `setNarr("")` which wiped the narration before players could read it
- Fix: moved the YAC explanation into the `desc` parameter (result card text) instead of just `narr`
- Tier 1 (<2yd): "catches for +17 but gets tackled immediately by the cornerback"
- Tier 3 (4+yd): "catches for +15 in space and picks up 6 more before the tackle"
- Uses real position names (cornerback/safety/linebacker) based on the nearest defender
- Tier 2 (2-4yd) unchanged — enters runner mode where the player makes a move

#### FIX 4 — Camera Scroll (Aggressive Rewrite)
- Increased lerp factor from 0.12 to 0.20 — camera now keeps up with fast-moving action
- Snap/animation: camera biases toward deepest receiver (was centering between QB and receiver)
- Decision/pressure: prioritizes showing deepest receivers when spread is wide (>80% of viewport)
- Normal spread: centers with upfield bias (30% offset) instead of centering exactly
- Run/catch: increased lookahead from 3 to 5 yards ahead of ball carrier
- Convergence threshold tightened from 0.1 to 0.05 yards for smoother stops
- Deep passes should no longer result in receivers going off-screen

#### FIX 5 — Announcer Booth Auto-Dismiss
- Commentary overlay now auto-dismisses after 4 seconds
- DISMISS button still available for immediate close
- Uses useEffect with setTimeout, properly cleaned up on unmount
- Players no longer need to manually dismiss every play

#### FIX 6 — LICENSE File
- Created `LICENSE` file: "Copyright (c) 2026 SL Flanagan, All Rights Reserved"
- Code may not be used, copied, modified, or distributed without explicit written permission

---

### ALPHA 14.8.1 — Text Clarity & Visual Feedback (9 fixes)

Backup: `tacfoot4-v19.html` (pre-ALPHA 14.8.1 state)

#### FIX 1 — Coach Advice Clarity
- Kept defensive formation names (4-3, Cover 2, Nickel, Blitz, Goal Line) but added plain English explanations
- Example: "4-3 Base — balanced defense, four linemen and three linebackers. The outside receivers have room to work."
- Players learn through context — terminology stays, meaning is taught alongside it

#### FIX 2 — Primary Receiver Message Clarity
- "look to your checkdown" → "look to your second choice"
- "primary" → "intended receiver" in the coach tip
- Removed jargon that new players wouldn't understand

#### FIX 3 — Pocket Bar Labels
- "L" / "R" → "L Pocket" / "R Pocket" above the integrity bars
- Players now understand what the bars represent without guessing

#### FIX 4 — Intended Receiver Highlighting
- "PRIMARY" badge → "INTENDED" badge with distinct blue background and border
- Intended receiver button gets subtle blue tint (#0e1828), brighter border (#4a8aaa), and soft glow
- More visually distinct from other throw buttons at a glance

#### FIX 5 — Drop Back Availability Logic
- Drop Back is now always labeled "Drop Back" (was "Hold On!" at phase 3+)
- Contextual subtitles show risk level: "⚠️ Pocket collapsing — risky!" when red, "⚠️ Pressure building" when yellow
- Players always know the button exists and what it does

#### FIX 6 — Coach Advice for Clean Pocket
- When pocket bars are green (>70%) and nobody is open yet: coach suggests using Look mechanic
- "Good protection — try looking away from your intended receiver to fool the safety, then throw the other way"
- Teaches the Look mechanic through game context instead of just saying "press Look"

#### FIX 7 — YAC Explanation in Commentary
- Catch narration now explains WHY the play ended based on the YAC tier:
  - Tier 1 (<2yd): "catches for +15 but the defender was right there — tackled on contact"
  - Tier 2 (2-4yd): "catches for +15 — defender closing fast, one chance to make a move!"
  - Tier 3 (4+yd): "catches for +15 in space — picks up 8 more before the tackle!"
- Players understand why "open field" catches get bonus yards and tight catches don't

#### FIX 8 — Announcer Booth DISMISS Button
- Added small "DISMISS" button in the announcer booth header bar
- Clicking clears the commentary overlay so players can see the field underneath
- Styled subtly (dark bg, muted text) so it doesn't distract but is clearly clickable

#### FIX 9 — Natural Position Terminology in Commentary
- Dan & Kiki now use real football position names naturally in their lines:
  - "Linebacker shot the gap", "safety came up to help", "cornerback had no chance"
  - "Running back found space in the flat — linebacker couldn't get there in time"
  - "Defensive end got around the tackle", "safety was cheating over"
- Updated categories: passCompBig, passCompShort, runBig, runShort, runLoss, sack, interception
- Players learn "linebacker", "safety", "cornerback", "defensive end" through repeated natural use

---

### ALPHA 14.8 — Splash Screen Polish (3 fixes)

Backup: `tacfoot4-v18.html` (pre-ALPHA 14.8 state)

#### FIX 1 — Splash Description Tightened
- Replaced three paragraphs of description with two clean, shorter paragraphs
- First paragraph: what the game is and why it exists (one sentence)
- Second paragraph: development road map (kept the cheerleaders joke)
- Warmer, less cluttered

#### FIX 2 — Coach Boxes Wider
- Coach selection boxes now have `minWidth:280px` with `flex: 1 1 280px`
- Container widened from `maxWidth:500` to `maxWidth:620`
- Side by side on wide screens, stacks vertically on narrow screens (flexWrap)
- Descriptions now read as full sentences instead of stacked one-word fragments
- Gap increased from 10 to 12px for breathing room

#### FIX 3 — Coach Names Updated
- Coach A: "Offensive Genius" → "The Gunslinger" — "Aggressive, unpredictable, and always scheming. His plays are designed to surprise — and when they work, they work brilliantly."
- Coach B: "Hometown Hero" → "The Old Fox" — "Forty years of football and he's seen it all. Develops his players, reads the game better than anyone, and makes the adjustments that win in the fourth quarter. His teams always play harder than they should."
- Internal coachType ("A"/"B") unchanged — only display names and descriptions updated

---

### ALPHA 14.7 — Camera Scroll + Gameplay Fixes (4 fixes)

Backup: `tacfoot4-v17.html` (pre-ALPHA 14.7 state)

#### FIX 1 — Smart Camera Auto-Scroll
- Replaced simple threshold-based camera with multi-mode smart camera system
- During passing (snapping/animating): tracks midpoint between deepest receiver and QB
- During decision/pressure: tracks midpoint of all receivers + QB, expands view for wide spreads
- During running/catch: follows ball carrier with 3-yard lookahead
- During result/touchdown: follows ball carrier with 5-yard lookahead
- Smooth lerp transitions via `camTarget` ref + requestAnimationFrame loop (0.12 lerp factor)
- Menu/playcall/presnap modes reset camera to 0

#### FIX 2 — Catch YAC Tiers (3-Tier System)
- Replaced old 4-tier catch resolution with clean 3-tier system based on VISUAL defender distance
- Uses `visualPos.current` for defender positions (matches what player sees on screen)
- Tier 1 (<2 yards): Immediate tackle, 0-1 bonus yards (~50% of catches)
- Tier 2 (2-4 yards): One move in runner mode, then tackled (maxContacts=1, ~30%)
- Tier 3 (4+ yards): Open field auto-gain of +3-8 bonus yards, no runner mode (~20%)
- Removed legacy fallback code (dead `if(false)` block cleaned up)

#### FIX 3 — Primary Receiver Highlighted
- Added `primary` field to all pass/trick plays identifying the play's intended target
- Primary receiver's throw button gets subtle blue border (#4a6a8a) and "PRIMARY" badge
- Practice/Preseason: yellow coach tip when primary is covered ("Your primary is covered — look to your checkdown")
- Helps beginners learn to go through reads — check primary first, then secondary options
- Primaries: Quick Slants→WR1, Deep Post→WR1, Play Action→WR1, Screen Pass→RB, Four Verticals→WR1, Out Routes→WR1, Curl/Comeback→WR1, TE Seam→TE, Flea Flicker→WR1

#### FIX 4 — QB Scramble Lane
- When ALL receivers are covered/tight (none OPEN or better) AND pocket >50%: ~1/8 chance a scramble lane opens
- Shows "QB Scramble — Lane is open! +3-8 yards" button below throw targets
- Auto-resolved: 3-8 yard gain, no runner mode, no contact decisions
- Practice coach explains: "When nobody's open and the pocket is still solid, sometimes the QB can just take off and run"
- Computed once per phase (ref tracks current phase to prevent re-rolling)
- Resets on snap

---

### ALPHA 14.6 — Gameplay Fixes (7 fixes)

Backup: `tacfoot4-v16.html` (pre-ALPHA 14.6 state)

#### FIX 1 — Coach Advice Timing
- Coach's Clipboard was showing stale decision-phase advice during result screen
- Added `setCoach("")` in `endPlay()` to clear old advice when play resolves
- Result mode now shows only `debrief` (post-play commentary), never leftover decision-time text
- Coach advice during decision mode unchanged — still updates per action

#### FIX 2 — Look Left/Right Explanation
- Changed Look button descriptions from "improves throw accuracy" to explain deception mechanics
- Look Left now says "pulls safety left, RIGHT side opens up"
- Look Right now says "draws safety right, LEFT side opens up"
- Practice mode coach tip explains: "Looking one way fools the safety — then throw the other way"
- Narration text updated: "safety moves that way. Receivers on the [other] side are more open now!"

#### FIX 3 — Auto-Dive With No Defender Nearby
- Receivers were catching in open space then auto-diving because distance checks used game-state positions
- Game-state positions (from `pursue()`) differ from visual positions due to animation lerp lag
- Fix: Distance checks at catch point now use `visualPos.current` (animation system positions)
- If no defender is VISUALLY within range, receiver runs free — no phantom dives

#### FIX 4 — Sack Message on Run Play
- `generateCommentary` was categorizing ALL negative-yard plays as "sack" (line: `res.yds<0 → cat="sack"`)
- Run plays stuffed for a loss got sack commentary ("pocket collapsed while you were deciding")
- Fix: Negative-yard run plays now correctly categorize as "runLoss" instead of "sack"
- Only actual pass-play sacks (not run/qbDraw) trigger sack commentary

#### FIX 5 — Receivers Still Off Screen
- Camera follow threshold reduced from 8 yards to 5 yards
- Camera now scrolls more aggressively to keep ball carrier and nearby action in view
- Deep catches that were previously off-screen are now visible within the field viewport

#### FIX 6 — Dan and Kiki Line Variety
- Doubled Dan lines: every category now has 8 Dan lines (was 4)
- Doubled Kiki lines: every category now has 8 Kiki lines (was 4)
- Added no-repeat picker to `generateCommentary` — same line won't appear twice in a row
- New Kiki lines include more personality: analytical, funny, impressed, critical
- Categories expanded: passCompBig, passCompShort, passIncWideOpen, passIncContested, passIncCovered, interception, sack, runBig, runShort, runLoss, touchdown, throwAway, fumble, turnovOnDowns

#### FIX 7 — Yardage Format Cleanup
- Added `fmtYds()` utility: positive → "+6", negative → "-2", no "+-" patterns
- All "Brought down at +X" messages → "Brought down for +X" (or "-X" for losses)
- Play log entries cleaned: "1st! +13" → "1st down, +13"
- Catches and dives use clean `fmtYds()` formatting throughout
- QB brought down messages also cleaned

---

### ALPHA 14.5 — Screen Layout + Splash Screen (4 fixes)

Backup: `tacfoot4-v15.html` (pre-ALPHA 14.5 state)

#### FIX 1 — Field Must Show All Players
- Compressed result panel to single-line flex layout with inline NEXT button
- Compressed Coach's Clipboard to compact one-liner (4px padding, no header)
- Compressed Practice overlay with tighter padding (8px 12px)
- Compressed coach headset and narrative bars to single-line with text-overflow ellipsis
- Tightened QB Decision panel header margin (6→3)
- Tightened throw target buttons (gap:5→3, padding:6px 8px→4px 6px, smaller fonts)
- Tightened QB action buttons (gap:4→3, padding:5px 8px→3px 6px, font:10→9)
- All panels below the field now compress to minimize vertical space

#### FIX 2 — Pocket Bars Move Off Field
- Removed vertical pocket integrity bars (12px×70px) and "POCKET" label from the field entirely
- Added horizontal L/R pocket bars in QB Decision panel header, next to "Phase {N}"
- Bars are 40px wide × 6px tall, labeled "L" and "R", drain left-to-right
- Color coded: green (>60%), yellow (30-60%), red (<30%)
- Smooth CSS transitions on width and color
- Pocket info now visible only when making throw decisions, not cluttering the field

#### FIX 3 — Splash Screen Description
- Added three paragraphs below version number, above coach selection:
  1. Purpose: teach football terminology to newcomers, be fun for experienced players
  2. Scaling: difficulty levels become more realistic approaching playoffs
  3. Roadmap: two-player games, more trick plays, and cheerleaders joke
- 15px font, warm tone (#c8b090), left-aligned, 560px max-width, 1.6 line height

#### FIX 4 — Google Form Feedback Link
- Added visible "Give Feedback Here" button below the bug fixes text on splash screen
- Links to https://forms.gle/xAmyf1rkkG71PtrS8, opens in new tab
- Styled as a warm gold button (14px bold, #fbbf24, gold border) — clearly clickable, not tiny text

---

### ALPHA 14.4 — Visual Clarity Overhaul (8 fixes)

Backup: `tacfoot4-v14.html` (pre-ALPHA 14.4 state)

#### FIX 1 — Pocket Bars Too Small
- Increased pocket integrity bars from 5px×40px to 12px×70px
- Added dark border outline (1px solid rgba white) for visibility against green field
- Enhanced glow effects with inset shadows for depth
- Added "POCKET" label centered above/between the two bars
- Bars are now one of the most visible on-field elements during passing plays

#### FIX 2 — Phase Number Off Down/Distance
- Removed "Phase {N}" from the on-field bottom info bar during passing plays
- Phase is already shown in the QB Decision panel header — no duplication
- Down/distance bar now shows ONLY down & yards + field position
- Run info bar still shows run count + nearest defender (only appears during run plays)

#### FIX 3 — Button Color Cleanup
- All throw target buttons now use same neutral dark background (#0e1520) and border (#2a3550)
- Openness communicated ONLY by the tag badge (COVERED/CONTESTED/OPEN/WIDE OPEN)
- In Practice/Preseason, coach's 1-2 recommended targets get a subtle green glow (box-shadow), not a border
- ALL QB action buttons (Drop Back, Step Up, Roll Left/Right, Look Left/Right, Hand Off, Tuck & Run, Throw Away) now use identical neutral styling
- Removed brown, blue, purple, and other random border colors from action buttons
- Only exception: TUCK THE BALL button retains its pulsing gold border (emergency action)

#### FIX 4 — Openness Labels Match Scheme Reality
- `opn()` function now accepts optional `scheme` parameter
- When a defensive scheme gives a receiver a significant completion bonus (e.g., Cover 2 for TE: cp+10), the openness label is bumped up by 1-2 tiers
- New "SOFT SPOT" label (light green) for receivers who are physically close to a defender but have a scheme advantage
- Cover 2 TE no longer shows "COVERED" when the numbers say 75% hit / 0% INT — now shows "SOFT SPOT" or "CONTESTED"
- Scheme penalties also adjust labels downward (e.g., WRs against Cover 2 show tighter labels)
- Labels, numbers, and coach highlights now tell the same story

#### FIX 5 — Announcer's Booth Broadcast Style
- Replaced floating debug text with TV broadcast-style graphics
- Dark navy translucent background bars (rgba(10,22,40,0.92)) with backdrop blur
- Dan's line: bright blue left-edge accent stripe (4px, #4a9eff)
- Kiki's line: gold/amber left-edge accent stripe (4px, #f5a623)
- Clean sans-serif font (Segoe UI/Helvetica Neue) instead of monospace
- "🎙️ ANNOUNCER'S BOOTH" styled as a small header badge with gold bottom border
- Looks like ESPN/Fox sports graphics, not a text overlay

#### FIX 6 — QB Actions Highlighted in Practice/Preseason
- Best 1-2 QB actions get subtle green glow in Practice and Preseason modes
- Coach tip line explains WHY the action is recommended:
  - Pocket solid + receivers running: "Drop back to give them time"
  - Receiver getting open on a side: "Look Left/Right — improves accuracy"
  - Pocket collapsing: "Throw it away or tuck and run"
  - Play Action: explains "fakes the handoff, freezes linebackers, buys time"
- Tip appears above the action buttons as a green-tinted info bar

#### FIX 7 — Contact Decisions Less Frequent
- Defender within 1.5 yards at catch point: immediate tackle, no options menu
- Defender 1.5-3 yards away: auto dive forward for 1-3 yards, no full menu
- Defender 3+ yards away: full contact decision menu (same as before)
- For running plays: defender within 1.5 yards triggers immediate tackle instead of contact menu
- Reduces contact decision frequency from ~90% to ~40% of catches
- Most catches near defenders are now: catch → tackled → next play

#### FIX 8 — Receivers Close Back Up Over Time
- Receiver separation seeds now peak at Phase 3-4, then decay
- Before Phase 4: seeds grow +0.08-0.15 per phase (receivers getting open)
- After Phase 4: seeds shrink -0.10-0.18 per phase (coverage recovers)
- CB cushion now peaks at Phase 4 (3.5 max), then closes back to 0.5 by Phase 8+
- Creates a throw window: receivers peak openness Phases 3-4, then close up
- By Phase 5-6, receivers are getting covered again while pocket is collapsing
- Waiting in the pocket is now a real risk — miss the window and you're in trouble

---

## Changes Made 2026-02-16

### ALPHA 14.3 — Pocket Bars + Fixes (3 changes)

Backup: `tacfoot4-v13.html` (pre-ALPHA 14.3 state)

#### CHANGE 1 — Pocket Bars on the Field
- Replaced "L92% R88%" pocket integrity numbers with visual bars flanking the OL
- Two vertical bars, one on each side of the pocket area, just outside the LT (x=38) and RT (x=62)
- Bars are 5px wide × 40px tall, with dark background and colored fill
- Fill drains from top as integrity drops: green (>60%), yellow (30-60%), red (<30%)
- CSS transitions for smooth visual changes (0.3s ease on height and color)
- Glow effect matching current integrity color
- Positioned at zIndex 14 (behind players, above field lines)
- **Removed L%/R% text** from: top-left matchup dots area, bottom on-field info bar, QB DECISION header, PRESSURE panel header
- Pocket information is now entirely visual via the on-field bars

#### CHANGE 2 — Down and Distance Unobstructed
- Bottom on-field info bar during passing now shows only "Phase {N}" — no pocket numbers
- Main down-and-distance overlay shows only: down & yards (18px bold gold) + field position (12px gray)
- QB DECISION header shows only "Phase {N}" on the right
- PRESSURE panel shows only "Phase {N}" — no pocket numbers cluttering it
- All pocket information is now on the field bars, not overlapping text

#### CHANGE 3 — Coach's Clipboard Label
- Replaced "COACH SAYS:" (10px blue) in Practice overlay with "📋 Coach's Clipboard" (11px gold serif)
- Now matches the result-mode Coach's Clipboard styling (same font, color, weight)
- Both instances (practice overlay + result panel) now use consistent "📋 Coach's Clipboard" header

---

### ALPHA 14.2 — Bugfix (5 fixes)

Backup: `tacfoot4-v12.html` (pre-ALPHA 14.2 state)

#### FIX 1 — Announcer's Booth Styling
- Removed dark background box (`rgba(0,0,0,0.82)`) from Dan & Kiki commentary overlay on the field
- Commentary now renders as text directly on the green field with no panel
- Added "🎙️ ANNOUNCER'S BOOTH" label above the Dan/Kiki lines (12px, gold, letter-spaced)
- Dan text: 17px bold, bright white (`#ffffff`)
- Kiki text: 17px bold italic, warm gold (`#ffd966`)
- Strong multi-layer text shadows (4 layers) for readability against the green field
- Most visible on-field element after a play ends

#### FIX 2 — Coach's Clipboard on Good Plays
- Added `SUCCESS_COACHING` constant with 4 coaching lines per defensive scheme (cover2, base43, nickel, blitz, goalline)
- Each line explains WHY the play worked against that specific defense (teaching moment)
- Examples: "That's exactly how you attack Cover 2 — both safeties dropped deep...", "Play Action froze the linebackers...", "Nickel puts an extra DB on the receivers but leaves the middle soft..."
- Replaces generic "Good decision" text on successful plays (3+ yards, no turnover, no incomplete)
- Only shown in Practice and Preseason (Coach's Clipboard section)

#### FIX 3 — Splash Screen Text Too Small
- Game title: 28px → 40px bold
- "Select Your Head Coach" / "Choose Your Difficulty": 12px → 22px bold
- Coach names (A/B): 16px → 18px
- Coach descriptions: 11px → 16px
- "This needs LOTS of bug fixes": 13px → 16px
- Difficulty level labels: 16px → 18px
- Difficulty descriptions: 11px → 16px
- All text now comfortable to read on tablet at arm's length

#### FIX 4 — Splash Screen Description
- Added game description under the title: "A turn-based football strategy game. Learn football from scratch in Practice mode, or test your play-calling in Playoffs."
- 17px, warm tone (`#c8b090`), 1.5 line height

#### FIX 5 — Ball Flight to Wrong Player
- **Root cause:** Ball flight target used route waypoint position (`curOff[action.target]`) which could differ from the receiver's visual position on screen due to animation lerp lag — making the ball appear to arc toward a nearby defender
- **Fix:** Ball flight now uses the receiver's current visual position (`visualPos.current[`off-${action.target}`]`) as the flight endpoint
- Game-state catch position (`tp`) unchanged — only the visual flight path is corrected
- Ball now always arcs toward where the receiver appears on screen, not toward a stale waypoint

---

## Changes Made 2026-02-15

### Build 5B — "ALPHA 12.5" (7 tasks)

Backup: `tacfoot4-v11.html` (pre-Build 5B state)

#### TASK 1 — Version Number Display
- Added `GAME_VERSION = "ALPHA 12.5"` constant near top of file
- Version label renders above scoreboard (10px, muted #667788, always visible during gameplay)
- Future builds: major builds = whole numbers (Alpha 13, 14), bug fixes = decimals (13.1, 13.2)

#### TASK 2 — Tighten Preseason DB Coverage Speed
- **CB tracking modifier:** Preseason 0.70→0.82, Regular 0.85→0.90, Playoffs unchanged
- **Safety tracking modifier:** Same changes (was 0.70→0.82, 0.85→0.90)
- Result: After 1-2 Drop Backs in preseason, 1-2 receivers Open, 1-2 Contested/Covered

#### TASK 3 — Look Mechanic Shifts Coverage
- **CB coverage shift added to `computeDefPass`:** When QB looks left/right, CBs on that side shift 1 yard TOWARD their WR (tighter), CBs on opposite side shift 1.5 yards AWAY (looser)
- Uses unit vector calculation with yard-to-coordinate conversion for accurate distances
- Net effect: Looking creates a real tradeoff — sacrifice coverage on the look side, gain openings on the opposite side
- Stacks with existing +15% completion bonus for throwing opposite your look

#### TASK 4 — Gap-Finder Never Runs Into Defenders
- Added defender-in-path penalty to the gap-finding scoring loop in `computeRunArrows`
- For each candidate direction, checks angle between path and each defender
- If defender within 3 yards and <15° of path: score ×0.1 (massive penalty)
- If defender within 3 yards and <30° of path: score ×0.5 (moderate penalty)
- Arrow now always points toward daylight, never at red defender dots

#### TASK 5 — Hit the Hole Context-Sensitive Rename
- `getRunActions()` now checks `bcP.y >= 3` (3+ yards past snap point) for RB
- **At/behind the line (0-2 yards):** Hit the Hole, Bounce Outside, Break It, Power Forward (unchanged)
- **Past the line (3+ yards):** Sprint, Cut Outside, Juke, Dive Forward
- Stacks with existing QB scramble labels (Sprint Upfield, Slide, Cut Outside, Truck It) and WR/TE after-catch labels (Sprint, Cut Outside, Juke, Dive Forward)

#### TASK 6 — Contact Percentages Driven by Defender Positions
- **Runner arrows now position-aware:**
  - Hit the Hole/Sprint: 85-95% with no defender ahead, 60-70% with defender 3-5yds, 30-40% with defender <3yds
  - Bounce Outside/Cut Outside: 75-85% when sideline clear, 25-35% when blocked
  - Break It/Juke: 20-25% when 1 defender nearby, 5-15% when swarmed
- **Contact mode now defender-count-aware:**
  - 1 defender: Spin 10-55%, Juke 10-50%, Stiff Arm 8-45% (high variance, skill matters)
  - 2 defenders: Spin 5-25%, Juke 5-22%, Stiff Arm 5-20% (much harder)
  - 3+ defenders: All evasion moves capped at 10-15% (can't juke a crowd)
  - Dive Forward: always safe, 1-3 yards (was 1-2), zero fumble risk
- Spin no longer always dominates — the right choice depends on the field situation

#### TASK 7 — Practice Mode
- **New difficulty level** below Preseason with its own button on difficulty select screen
- **Description:** "Learn every part of football step by step. The game pauses and explains each decision. No pressure, no score — just learning."
- **Engine settings:**
  - DB tracking: 0.78 (even easier than preseason 0.82)
  - Fumble multiplier: 0.05 (essentially zero)
  - INT multiplier: 0.05 (essentially zero)
  - Completion bonus: +30 (cap 98%)
  - Pressure penalty: ×0.25 (reduced by 75%)
  - Instant blitz: 2% (was 5% preseason)
- **Practice overlays:** Semi-transparent dark panels with white text and "GOT IT" button
  - Play selection: Explains playbook concept (shortened after first play)
  - Presnap: Explains current defense in plain English + matchup quality
  - QB decision: Explains drop back and receiver reading
  - RPO: Explains post-snap read system
  - Runner: Explains direction choices and percentages
  - Contact: Explains evasion options and fumble risk
- **Practice result assessment:** Replaces commentary with warm, encouraging feedback
  - Good play: "Nice! You read the defense and made a good decision."
  - Bad play: Explains what went wrong and suggests what to try next time
- **What practice suppresses:** Regular commentary system, matchup warnings (overlays are more detailed), coach text box (overlays replace it)
- **What practice keeps:** Play tooltips (same as preseason), debrief text, play-by-play log
- **`isPre(diff)` helper:** Utility function `const isPre = d => d === "practice" || d === "preseason"` — used throughout for checks where practice should inherit preseason behavior (plain English coaching, tooltips, pocket warnings, etc.)
- State: `practiceOverlay` (useState), `practiceShown` (useRef Set) for tracking dismissed overlays

---

### Build 5A — "Make the Game Fun Again" (8 tasks)

Backup: `tacfoot4-v10.html` (pre-Build 5A state)

#### TASK 0 — Fix Receiver Openness (WR1/WR2 can actually get open now)
- **Root cause:** CB tracking rate was 62-92%, vs LB tracking TE at only 6%. CBs shadowed WRs perfectly.
- **Fix 1:** Added difficulty modifier to DB coverage speed: Preseason 70%, Regular 85%, Playoffs 100%
- **Fix 2:** Added separation factor — each phase, WRs gain 6% more separation from CBs
- **Fix 3:** Reduced max CB tracking rate from 0.92 to 0.82
- **Fix 4:** Increased CB cushion from 2.5/1.0 to 3.5/2.0 yards
- **Fix 5:** Expanded CB y-range clamp from s.y-3 to s.y-5
- **Fix 6:** Same difficulty modifier applied to Safety tracking speed
- **Fix 7:** Loosened openness thresholds: Wide Open 5+ (was 8+), Open 3+ (was 5+), Contested 1.5+ (was 3+), Covered <1.5 (was <3)
- Result: After 1 Drop Back in preseason, at least 1 WR is Open. After 2, most receivers show Open.

#### TASK 1 — Slash Turnovers and Incompletions
- **Fumble on contact:** Preseason ×0.3, Regular ×0.7, Playoffs unchanged
- **Toss/Flea fumble:** Preseason ×0.3, Regular ×0.6, Playoffs unchanged
- **INT rates:** Preseason ×0.3, Regular ×0.7, Playoffs unchanged
- **Completion bonus:** Preseason +20%, Regular +5%, Playoffs unchanged (capped at 95%)
- **Pressure penalty:** Preseason halved, Regular ×0.75, Playoffs unchanged
- **Dive Forward:** Zero fumble risk always

#### TASK 2 — Degrading Contact Risk with Visible Odds
- Added `tacklesBroken` ref tracking contacts broken per play (resets on snap)
- Spin/Juke/Stiff success degrades: 1st contact=base, 2nd=-15%, 3rd=-30%, 4th+=-45%
- Fumble risk escalates: 1st=base, 2nd=×1.5, 3rd=×2.5, 4th+=×4
- Contact buttons now show "Break free: X% / Fumble: Y% (1 in Z)" format
- Fumble text colored: green <3%, yellow 3-8%, red >8%
- Dive Forward shows "No fumble risk" in green
- On-field flash overlay shows best option odds near ball carrier for ~1 second
- Preseason fumble coaching: "That Spin had a 1 in X chance. After N broken tackles, Dive Forward was the safe play."

#### TASK 3 — Contextual QB Action Buttons
- **Phase-based labels:** Phase 1="Drop Back", Phase 2="Buy Time" (shows best receiver depth), Phase 3+="Hold On!"
- **Roll replaces Scramble:** "Scramble L/R" → "Roll Left/Right" everywhere
- **Roll only appears phase 2+** when pressure is building; shows pressure side context
- **Look Left/Right** now shows receivers on that side with openness: "W1 (OPEN) and TE (contested)"
- **Preseason Look** adds "improves throw accuracy" hint
- **Sequential glow animation** on action buttons when QB decision begins (0.3s per button, one cycle)

#### TASK 4 — On-Field Game State Indicators
- **Receiver openness labels** on field during pass decision: "OPEN" (green), "TIGHT" (yellow), "COVERED" (red)
- **OL status dots** below each OL position: green (holding), yellow (weakening), red (beaten)
- **Pocket warning overlay:** <40% shows "POCKET COLLAPSING" (yellow), <25% shows "THROW OR TUCK!" (red, pulsing)
- Preseason adds plain-English explanation under pocket warnings

#### TASK 5 — Tuck the Ball
- **Tuck Ball button** appears when pocket <30% AND phase ≥3
- Prominent gold/amber pulsing button, distinct from other options
- Results in 1-3 yard loss, ZERO fumble risk
- Preseason coach: "Smart play — sometimes the best thing is to hold onto the ball and take a small loss."
- **Sack-fumble risk:** 20% fumble chance when sacked at <15% pocket integrity
- Preseason coaching after sack-fumble: "He held the ball too long. When the pocket is collapsing, tuck the ball to protect it."
- **Instant blitz:** Random chance on snap (Preseason 5%, Regular 12%, Playoffs 20%) — goes straight to pressure mode with "nothing you could do" message
- Tuck Ball also available in pressure panel when pocket <30%

#### TASK 6 — Coach Suggestions at All Difficulty Levels
- **Playoffs MX ≤ -1:** "Risky matchup." (no suggestions)
- **Regular MX ≤ -1:** "Bad matchup." + two clickable play suggestions
- **Regular MX ≤ -2:** "Tough call against [defense]." + clickable suggestions
- **Preseason:** Unchanged (full explanation + suggestions + reasons)

#### TASK 7 — Replace Jargon in Preseason
- **RPO reads:** "Gap Open"→"There's a hole!", "LB Filled Gap"→"Defender closed the lane", "Edge Sealed"→"No room outside"
- **Pass incomplete reasons:** "Ball sails high"→"Throw went too high", "CB bats it away"→"Defender knocked it away"
- **Sack commentary:** Preseason pool uses plain language ("blockers couldn't hold", "needed to throw sooner")
- **Coach QB dialogue:** All preseason coach lines rewritten without football jargon
- **Look Left/Right narration:** "Safeties bite"→"Deep defenders move that way" in preseason
- **Post-play debrief:** Preseason uses plain English ("look at the matchup colors — green means advantage")

---

### Session 4 — Commentary + Coach Suggestions + Tooltips + YAC Labels

Backup: `tacfoot4-v10.html` (pre-Session 4 was v9)

#### TASK 1 — YAC Move Labels for WR/TE
- `getRunActions()` now detects `bc === "wr1" || "wr2" || "te"` (receiver after catch)
- Labels swapped: "Hit the Hole"→"Sprint", "Bounce Outside"→"Cut Outside", "Break It"→"Juke", "Power Forward"→"Dive Forward"
- Mechanics unchanged — only labels differ
- RB keeps original labels, QB keeps v9 labels (Sprint Upfield, Slide, etc.)

#### TASK 4 — Play Tooltips in Preseason
- Added `tooltip` field to all 18 plays with plain-language one-liners
- Rendered below play name on play buttons (9px, muted color, `#5a7a90`)
- Only shows when `diff==="preseason"` and play is NOT the selected/expanded one
- Added to all 3 button groups (staple, situational, specialty)

#### TASK 3 — Coach Suggestions on Bad Matchups
- Upgraded `strongWhy` and `weakWhy` on all 18 plays — full sentence, bar-conversation language
- Added `findSuggestions(defKey)` helper: scans all plays for MX >= +1 vs current defense, prefers one run + one pass
- Presnap UI now shows coach assessment between defense description and SNAP button:
  - **Preseason MX >= +2:** "Great call! Perfect play against [defense]."
  - **Preseason MX >= +1:** "Good call. [Defense] is vulnerable to this."
  - **Preseason MX == 0:** "Decent look. Trust your reads."
  - **Preseason MX <= -1:** Warning + `weakWhy` + two clickable play suggestions (click selects & re-snaps)
  - **Preseason MX <= -2:** Stronger warning ("BAD call") + suggestions
  - **Regular season MX <= -1:** Warning only, no suggestions
  - **Playoffs:** No coach commentary

#### TASK 2 — Play-by-Play + Color Commentary
- Created `COMMENTARY` object with 12 template pools (5-6 templates each):
  - passIncWideOpen, passIncContested, passIncCovered, passCompBig, passCompShort
  - interception, sack, runBig, runShort, runLoss, touchdown, throwAway, fumble
- Created `generateCommentary(res, play, scheme, game, diff, openness, lastTarget)` function
- Added `lastThrowOpenness` and `lastThrowTarget` useRef hooks — set on throw click, cleared on snap
- Commentary stored in `commentary` state, generated in `endPlay()`
- **Result card rendering** (between desc and debrief):
  - PBP line: 11px, italic, `#8a9ab0` — always shows
  - Color line: 11px, warm `#c0b090` — hidden in Playoffs
  - Teaching line: 10px, `#6a9ab0`, only in Preseason when matchup was bad and play failed
- TD card also shows PBP + color lines
- **Context modifiers** (appended to color line):
  - 3rd down fail → "And that brings up the punt team."
  - 3rd down convert → "First down!"
  - Red zone incomplete → "Points left on the field."
  - Red zone TD → "Cashed it in!"
  - Close game big play → "This game just shifted."
  - Big lead negative play → "They can afford that."
  - 4th down convert/fail variants
- **Difficulty scaling:** Preseason = PBP + color + teaching. Regular = PBP + color. Playoffs = PBP only.
- Added `fmtTarget()` helper for nice receiver names (wr1→W1, te→TE, etc.)

---

## All Changes Made 2026-02-14

### Session 1 — 5 New Plays

Backup: `tacfoot4-v7.html`

**Run Staples (added after QB Sneak in `run` array):**

1. **Power Run** (`💪`, staple) — RB follows lead blocker into B gap
   - Weak: Blitz / Strong: Nickel
   - MX: base43:0, nickel:+2, blitz:-2, cover2:+1, goalline:-1
   - RUN_BLOCKS: hole = `right_b_gap` (new hole type added to `computeRunOL`)
   - Routes: WR1 go, WR2 go, TE block, RB dive. Formation: FI

2. **Stretch Run** (`↔️`, staple) — RB lateral handoff, reads blocks
   - Weak: Base 4-3 / Strong: Blitz
   - MX: base43:-1, nickel:+1, blitz:+2, cover2:0, goalline:-1
   - RUN_BLOCKS: hole = `right_edge`, all OL pushDir:1 (zone blocks)
   - Routes: WR1 go, WR2 block, TE block, RB sweep right. Formation: FI
   - Added to `isOut` check in RPO snap code → gets `edge_sealed` scenario

**Pass Staples (added after Four Verticals in `pass` array):**

3. **Out Routes** (`↪️`, staple) — Sideline cuts at 8-12 yards
   - Weak: Cover 2 / Strong: Blitz
   - MX: base43:0, nickel:-1, blitz:+2, cover2:-2, goalline:+1
   - Routes: WR1 out left, WR2 out right, TE curl, RB check. Formation: FSG

4. **Curl/Comeback** (`🔃`, staple) — Sprint upfield, turn back
   - Weak: Goal Line / Strong: Cover 2
   - MX: base43:+1, nickel:0, blitz:-1, cover2:+2, goalline:-2
   - Routes: WR1 curl, WR2 curl, TE flat left, RB check. Formation: FSG

5. **TE Seam** (`⬆️`, staple) — TE up the middle seam
   - Weak: Nickel / Strong: Base 4-3
   - MX: base43:+2, nickel:-2, blitz:0, cover2:-1, goalline:+1
   - Routes: WR1 go, WR2 slant left, TE seam left, RB check. Formation: FSG

**Supporting code:** New `right_b_gap` hole in `computeRunOL`. Stretch Run added to `isOut` in RPO snap. All routes from existing `RL`.

### Session 2 — 6 Fixes

Backup: `tacfoot4-v8.html`

#### FIX 1 — Throw It Away Always Available
- Added `{type:"throw_away",cat:"escape"}` to `getQBActions()` (always present)
- Added `case "throw_away"` in `doQB` switch → `endPlay(0,"Threw it away",false,true,...)`
- Added `throw_away` to `pbpLabels`
- Added "escape" category rendering in decision mode UI
- Now visible in BOTH decision and pressure modes

#### FIX 2 — Double-Click Play to Snap
- Added `quickSnap(p)` and `goPresnapFor(p)` functions
- Added `onDoubleClick={()=>quickSnap(p)}` to all 3 play button groups (replace_all)
- Single click = preview. Double click = select + presnap immediately.

#### FIX 3 — Clearer Yard Lines
- 28 lines (every 2.5 yards) instead of 14 (every 5)
- 10-yard lines: 2px, 35% opacity
- 5-yard hash marks: sideline (20px) + center (12px), 25% opacity
- Other lines: 1px, 8% opacity
- Large yard numbers (20px bold monospace, 15% opacity) at every 10 yards on BOTH sides of field

#### FIX 4 — Down/Distance Display + First Down Line
- First down line: bright yellow `rgba(255,220,0,0.7)`, 3px, yellow glow shadow (was faint blue)
- On-field overlay at bottom-center: "1st & 10" (18px bold gold monospace) + yard line, black bg, always visible during play

#### FIX 5 — Tackle Requires Defender Within 2 Yards
- Removed `nd.d < 2.5` probability tackle branch
- Tightened maxA forced tackle from `nd.d < 4` to `nd.d < 2`
- All tackle paths now require `nd.d < 2`:
  - Contact trigger → triggerContact
  - Probability tackle → 0.55 + moveBonus
  - YAC limit forced tackle → maxA gate

#### FIX 6 — DL Cannot Pass Through OL (Display Clamp)
- Added post-processing display clamp after `displayDefPos` is set
- Iterates `OL_BLK`, clamps each DL y >= matched OL y in `olPos`
- Final safety net — DL never visually crosses past their blocker

### Session 3 — 7 Fixes

Backup: `tacfoot4-v9.html`

#### FIX 1 — Throw It Away Always Available (Hardened)
- Rewrote `checkSack` with `fromPressure` parameter
- First encounter with close defender ALWAYS shows pressure options (never instant-sack)
- Sacks only happen when player scrambles OUT of pressure mode (`fromPressure=true`)
- Updated `doPressure` scramble_left/right calls to pass `fromPressure=true`
- Normal `doQB` calls (dropback, scramble, step_up) don't pass it → always get pressure first

#### FIX 2 — QB Scramble Gets Different Moves Than RB
- `getRunActions()` detects `bc === "qb"` and swaps labels:
  - "Hit the Hole" → "Sprint Upfield"
  - "Bounce Outside" → "Cut Outside"
  - "Break It" → "Truck It" (with 12% fumble risk in `doRun`)
  - "Power Forward" → "Slide" (ends play safely, 100% success, no tackle risk)
- QB Slide in `doRun`: `endPlay(Math.round(np.y),...)` immediately, no tackle check
- QB Truck fumble: checked before normal arrow resolution in `doRun`

#### FIX 3 — Run Direction Favors Upfield Not Lateral
- Rewrote gap-finding in `computeRunArrows`:
  - Scans only within ~45-degree forward cone (bcPos.x ± 20)
  - 4-unit step instead of 10-unit for finer resolution
  - Lateral penalty: gaps straight ahead score up to 60% higher than edge-of-cone gaps
  - Target clamped to within 15 units laterally of ball carrier
  - Only considers defenders AHEAD of ball carrier (`d.y > bcPos.y`)
- Bounce Outside target angles more upfield (0.7 multiplier vs 0.6)

#### FIX 4 — Tackle Requires Defender Within 2 Yards (Cleaned)
- Removed dead-code random tackle block (was unreachable after `nd.d<2` contact trigger return)
- All remaining tackle paths already gated by `nd.d < 2`

#### FIX 5 — DL Cannot Pass Through OL (Strengthened)
- In `computeDefPass`, changed DL y-clamp from `ol.y` to `ol.y + 0.5`
- DL stays at least 0.5 units on the defensive side of their assigned OL blocker
- Comment clarifies: OL is a physical body, DL pushes OL back but stays ahead

#### FIX 6 — Default Option Labeled in Preseason
- "Drop Back" → "Drop Back (run the play)" when `diff==="preseason"` in `getQBActions()`
- "Hand Off" → "Hand Off (run the play)" when gap is open in preseason in RPO UI
- Labels removed for regular season and playoffs (no condition match)

#### FIX 7 — Difficulty Screen Descriptions
- Preseason: "Learn the game. Coach explains every position, every play, and why matchups matter. Perfect if you're new to football."
- Regular Season: "You know the basics. Coach steps back, training wheels come off. You make the reads."
- Playoffs: "No help. Pure football IQ."

---

## Previous Sessions' Changes (Still in Place)

From v1–v5 (sessions before today):

- **Run balance:** Pursuit intensity multiplier, Hit the Hole pct decay per move, ramping tackle probability
- **Sack proximity:** checkSack returns "sack"/"pressure"/"safe" based on defender distance (<1.5 auto-sack, <2 probability sack, 2-3 pressure, >=3 safe)
- **Pressure escape system:** 4 options (throw away, tuck & run, scramble L/R) with percentage badges via `getPressureOdds()`
- **DL teleport fix:** DL y-clamp in `computeDefPass` changed from `ol.y - (1-pct)*6` to `ol.y`
- **Look Left/Right:** Passes lookDir to throwProbs with +15cp/-40%ip modifiers
- **Throw probability double-roll fix:** Pre-computed `preProbs` {cp, ip, op} passed from UI into `doThrow`
- **Inside Run hole randomization:** `pick(["center_left","center","center_right"])` instead of always "center"
- **Tackle proximity:** All tackle paths require defender within 2 yards
- **Play-by-play log:** `pbp` state array, arrow-joined string in result/TD cards
- **RPO system:** Post-snap read with scenarios (gap_open, lb_filled, edge_sealed); 3 options (Hand Off, QB Keep, Quick Pass) with percentage badges
- **Phantom tackle fix:** maxA forced tackle proximity-gated (`nd.d < 2`)
- **Bubble pass position fix:** `offP[wrId]` (current position) instead of `selPlay.formation[wrId]` (pre-snap)

---

## Planned Fixes for Next Session

### 1. Coach Suggestion System for Preseason
When the matchup is BAD (MX <= -1), coach suggests 2 better plays with explanations using `strongWhy` text from play data. Behavior changes by season phase:
- **Preseason:** Full suggestions — "Consider Quick Slants (vacated middle vs Blitz) or Screen Pass (RB open behind rush vs Blitz)"
- **Regular season:** Warnings only — "This is a RISKY matchup" (no suggestions)
- **Playoffs:** Nothing — you're on your own

Requires a season progression system (preseason → regular → playoffs) and logic to find plays where `play.strong === currentDefense`.

### 2. Future Ideas (No Timeline)
- **Philly Special** trick play — TE throws to QB
- **Expanded trick play roster** — more trick/gadget plays
- **Two-player mode** — split-screen tablet play, one player offense, one defense

---

## What Might Still Be Broken / Worth Monitoring

1. **YAC after catch balance:** MAX_YAC=3 hard cap proximity-gated at 2 yards. If Hit the Hole spam returns on catches, pursuit intensity may need tuning.

2. **Bubble pass gain range:** Quick pass always gives +3 to +5 yards regardless of WR position or defender proximity.

3. **RPO scenario balance:** openPct formula (mxR>=1→70%, mxR<=-1→15%, else 45%) may need tuning for certain play+defense combos.

4. **New plays balance:** Power Run, Stretch Run, Out Routes, Curl/Comeback, TE Seam haven't been play-tested extensively. MX ratings may need adjustment.

---

## Key Code Locations (tacfoot4.html)

| What | Function / Location |
|------|---------------------|
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

---

## Standing Instructions

- **Always backup** tacfoot4.html to `tacfoot4-v{N}.html` before making edits — auto-increment, check folder for existing versions first
- **Always copy** final result to ALL THREE: `F:\TacFootball\tacfoot4.html`, `C:\Users\Lash2\Desktop\TacFoot\index.html`, and `C:\Users\Lash2\Desktop\TacFootball\index.html`
- **Also copy** NOTES.md to all three locations
- **Use line-level edits only** — no rewriting entire functions, no regenerating blocks. Find the specific lines and change only those.
- **Ask before acting** — discuss issues before fixing; don't assume the user wants a fix applied immediately
- **Don't apply Claude Opus suggestions blindly** — verify independently (past bad diagnosis: pressure penalty theory vs actual double-roll bug)

---

## File Inventory

| File | Description |
|------|-------------|
| tacfoot4.html | Current working version (ALPHA 14.9 — bug fixes, visual improvements) |
| tacfoot4-v1.html | Before first 4-bug fix pass |
| tacfoot4-v2.html | Before sack proximity + pressure escape |
| tacfoot4-v3.html | Before pressure percentages + inside run hole randomization |
| tacfoot4-v4.html | Before tackle proximity + play-by-play log |
| tacfoot4-v5.html | Before RPO system |
| tacfoot4-v6.html | Before phantom tackle fix + bubble pass fix (overwritten — matches v7 start) |
| tacfoot4-v7.html | Before 5 new plays added |
| tacfoot4-v8.html | Before 6 fixes (throw away, dbl-click, yard lines, down/distance, tackle prox, DL clamp) |
| tacfoot4-v9.html | Before 7 fixes (throw away hardened, QB moves, upfield run, tackle prox cleanup, DL clamp strengthened, preseason labels, difficulty descriptions) |
| tacfoot4-v10.html | Before commentary + coach suggestions + tooltips + YAC labels |
| tacfoot4-v11.html | Before Build 5B (ALPHA 12.5) |
| tacfoot4-v12.html | Before ALPHA 14.2 bugfix (5 fixes) |
| tacfoot4-v13.html | Before ALPHA 14.3 (pocket bars + fixes) |
| tacfoot4-v14.html | Before ALPHA 14.4 (visual clarity overhaul) |
| tacfoot4-v15.html | Before ALPHA 14.5 (screen layout + splash screen) |
| tacfoot4-v16.html | Before ALPHA 14.6 (gameplay fixes) |
| tacfoot4-v20.html | Before ALPHA 14.9 (bug fixes, visual improvements) |
| tacfoot4-v19.html | Before ALPHA 14.8.1 (text clarity, visual feedback) |
| tacfoot4-v18.html | Before ALPHA 14.8 (splash screen polish) |
| tacfoot4-v17.html | Before ALPHA 14.7 (camera scroll + gameplay) |
| C:\Users\obrie\Desktop\TacFoot\index.html | Deployment copy (mirrors tacfoot4.html) |
| NOTES.md | This file |
