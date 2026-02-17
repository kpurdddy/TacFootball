import { useState, useEffect, useCallback } from "react";

const FW = 680, FH = 460, PY = FH / 38;
const ANIM = 550, PANIM = 440, MAX_YAC = 3;
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const cl = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const R = (x, y) => ({ x, y });
const dst = (a, b) => { const dx = (a.x - b.x) * 0.533, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); };
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// ==================== PLAYERS ====================
const P = (id, pos, lab, spd, str, skl) => ({ id, pos, lab, spd, str, skl });
const OFF = [
  P("qb","QB","QB",6,5,9), P("rb","RB","RB",8,7,7),
  P("wr1","WR","W1",9,4,8), P("wr2","WR","W2",8,5,7), P("te","TE","TE",6,8,6),
  P("ol1","OL","LT",3,9,5), P("ol2","OL","LG",3,9,5), P("c","OL","C",3,10,5),
  P("ol4","OL","RG",3,9,5), P("ol5","OL","RT",3,9,5),
];
const DEF = [
  P("de1","DL","DE",6,9,6), P("dt1","DL","DT",4,10,5),
  P("dt2","DL","DT",4,10,5), P("de2","DL","DE",6,9,6),
  P("olb1","LB","OLB",7,7,7), P("mlb","LB","MLB",7,8,8), P("olb2","LB","OLB",7,7,7),
  P("cb1","CB","CB",9,4,8), P("cb2","CB","CB",9,4,7),
  P("ss","S","SS",8,6,7), P("fs","S","FS",9,5,8),
];
const gP = (r, id) => r.find(p => p.id === id);
const OL_IDS = ["ol1","ol2","c","ol4","ol5"];
const OL_BLK = { de1:"ol1", dt1:"ol2", dt2:"ol4", de2:"ol5" };
const CB_WR = { cb1:"wr1", cb2:"wr2" };

// ==================== ROUTES ====================
const RL = {
  go:(x,y,d)=>[R(x+d,y+5),R(x+d,y+12),R(x+d,y+21),R(x+d,y+30)],
  slant:(x,y,d)=>[R(x+d*4,y+3),R(x+d*10,y+6),R(x+d*16,y+9),R(x+d*20,y+12)],
  post:(x,y,d)=>[R(x,y+5),R(x,y+12),R(x+d*10,y+18),R(x+d*16,y+24)],
  out:(x,y,d)=>[R(x,y+5),R(x,y+10),R(x-d*10,y+10),R(x-d*16,y+10)],
  curl:(x,y)=>[R(x,y+5),R(x,y+11),R(x,y+10),R(x,y+9)],
  flat:(x,y,d)=>[R(x+d*6,y+1),R(x+d*14,y+2),R(x+d*20,y+3),R(x+d*24,y+4)],
  screen:(x,y,d)=>[R(x+d*4,y-2),R(x+d*10,y-3),R(x+d*14,y-2),R(x+d*16,y+2)],
  block:(x,y)=>[R(x,y+0.5),R(x,y+1),R(x,y+1),R(x,y+1)],
  dive:(x,y)=>[R(x,y+2),R(x,y+5),R(x,y+8),R(x,y+11)],
  sweep:(x,y,d)=>[R(x+d*8,y-2),R(x+d*18,y+1),R(x+d*24,y+5),R(x+d*26,y+10)],
  counter:(x,y,d)=>[R(x+d*4,y),R(x+d*6,y+1),R(x-d*10,y+3),R(x-d*14,y+8)],
  toss:(x,y,d)=>[R(x+d*10,y-1),R(x+d*20,y+2),R(x+d*26,y+6),R(x+d*28,y+12)],
  seam:(x,y,d)=>[R(x+d*2,y+1),R(x+d*2,y+6),R(x+d*2,y+14),R(x+d*2,y+22)],
  wheel:(x,y,d)=>[R(x+d*6,y+1),R(x+d*12,y+5),R(x+d*10,y+12),R(x+d*8,y+20)],
  check:(x,y,d)=>[R(x+d*3,y-1),R(x+d*6,y+1),R(x+d*8,y+3),R(x+d*10,y+5)],
  flee:(x,y)=>[R(x,y+2),R(x,y+4),R(x,y-2),R(x,y-3)],
  statue:(x,y,d)=>[R(x,y-1),R(x+d*8,y-2),R(x+d*20,y+1),R(x+d*28,y+6)],
};

const FI={qb:R(50,-3),rb:R(50,-7),wr1:R(8,0),wr2:R(92,0),te:R(66,0),ol1:R(38,0),ol2:R(43,0),c:R(50,0),ol4:R(57,0),ol5:R(62,0)};
const FSG={qb:R(50,-5),rb:R(42,-5),wr1:R(6,0),wr2:R(94,0),te:R(68,0),ol1:R(38,0),ol2:R(43,0),c:R(50,0),ol4:R(57,0),ol5:R(62,0)};
const FSP={qb:R(50,-5),rb:R(43,-5),wr1:R(5,0),wr2:R(95,0),te:R(78,0),ol1:R(38,0),ol2:R(43,0),c:R(50,0),ol4:R(57,0),ol5:R(62,0)};

// ==================== MATCHUP MATRIX ====================
// Ratings: 2=GREAT, 1=GOOD, 0=NEUTRAL, -1=RISKY, -2=BAD
const MX = {
  // Run plays
  "Inside Run":   { base43:0, nickel:1, blitz:1, cover2:0, goalline:-2 },
  "Outside Run":  { base43:0, nickel:-1, blitz:1, cover2:-1, goalline:1 },
  "Counter":      { base43:1, nickel:0, blitz:2, cover2:0, goalline:-2 },
  "HB Toss":      { base43:0, nickel:-1, blitz:1, cover2:-1, goalline:1 },
  "QB Sneak":     { base43:1, nickel:1, blitz:0, cover2:1, goalline:-1 },
  // Pass plays
  "Quick Slants":  { base43:0, nickel:-1, blitz:2, cover2:1, goalline:2 },
  "Deep Post":     { base43:1, nickel:0, blitz:-2, cover2:0, goalline:2 },
  "Play Action":   { base43:1, nickel:0, blitz:-1, cover2:1, goalline:1 },
  "Screen Pass":   { base43:0, nickel:0, blitz:2, cover2:0, goalline:-1 },
  "Four Verticals":{ base43:1, nickel:-1, blitz:-2, cover2:-1, goalline:2 },
  // Trick plays
  "Flea Flicker":  { base43:1, nickel:0, blitz:-1, cover2:-1, goalline:1 },
  "Statue of Liberty":{base43:1, nickel:1, blitz:0, cover2:0, goalline:0 },
  "QB Draw":       { base43:0, nickel:1, blitz:2, cover2:0, goalline:-2 },
};
const mxLabel = v => v >= 2 ? "GREAT" : v >= 1 ? "GOOD" : v >= 0 ? "OK" : v >= -1 ? "RISKY" : "BAD";
const mxColor = v => v >= 2 ? "#22c55e" : v >= 1 ? "#4ade80" : v >= 0 ? "#8a9ab0" : v >= -1 ? "#fbbf24" : "#ef4444";
const mxBorder = v => v >= 1 ? "#22c55e55" : v >= 0 ? "#1a2540" : "#ef444455";

// ==================== RUN BLOCKING ASSIGNMENTS ====================
// Each run play: which OL blocks which defender, and push direction (L=-1, R=1)
const RUN_BLOCKS = {
  "Inside Run": {
    ol1: { target: "de1", pushDir: -1 },   // LT pushes DE wide left
    ol2: { target: "dt1", pushDir: -1 },   // LG pushes DT left — creates left gap
    c:   { target: "mlb", pushDir: 0 },    // C blocks MLB straight
    ol4: { target: "dt2", pushDir: 1 },    // RG pushes DT right — creates right gap
    ol5: { target: "de2", pushDir: 1 },    // RT pushes DE wide right
    hole: "center",                         // designed hole: between guards
  },
  "Outside Run": {
    ol1: { target: "de1", pushDir: 1 },    // LT seals DE inside
    ol2: { target: "dt1", pushDir: 1 },    // LG pushes DT right
    c:   { target: "mlb", pushDir: 1 },    // C pushes MLB right
    ol4: { target: "dt2", pushDir: 1 },    // RG pushes DT right
    ol5: { target: "de2", pushDir: 1 },    // RT kicks DE out
    hole: "left_edge",                      // designed hole: outside left
  },
  "Counter": {
    ol1: { target: "de1", pushDir: 1 },    // LT seals left
    ol2: { target: "dt1", pushDir: 1 },    // LG pulls right, blocks DT
    c:   { target: "mlb", pushDir: 1 },    // C blocks MLB right (sells fake)
    ol4: { target: "dt2", pushDir: -1 },   // RG opens left cutback lane
    ol5: { target: "de2", pushDir: -1 },   // RT seals right side
    hole: "left_cutback",                   // designed hole: cutback left after fake right
  },
  "HB Toss": {
    ol1: { target: "de1", pushDir: -1 },
    ol2: { target: "dt1", pushDir: -1 },
    c:   { target: "mlb", pushDir: -1 },
    ol4: { target: "dt2", pushDir: -1 },
    ol5: { target: "de2", pushDir: -1 },   // Everyone pushes left — RB goes right
    hole: "right_edge",
  },
  "QB Sneak": {
    ol1: { target: "de1", pushDir: -1 },
    ol2: { target: "dt1", pushDir: -1 },
    c:   { target: "dt1", pushDir: 0 },    // C drives straight ahead
    ol4: { target: "dt2", pushDir: 1 },
    ol5: { target: "de2", pushDir: 1 },
    hole: "center",
  },
};

// ==================== PLAYS ====================
const PLAYS = {
  run: [
    { name:"Inside Run", icon:"🏈", type:"run", cat:"staple",
      brief:"Your basic run. RB goes straight up the middle between the guards.",
      desc:[
        "Handoff at snap, RB hits the gap between your guards.",
        "This is your default run play — call it when you just want to run the ball and gain some yards.",
        "No tricks, no special situation needed. Consistent 3-5 yard gains that keep drives alive.",
        "Once the defense starts respecting your run game, Play Action becomes deadly.",
      ],
      weak:"Goal Line", weakWhy:"Everyone packed in tight — no gaps to hit.",
      strong:"Nickel", strongWhy:"One fewer linebacker means a softer middle.",
      formation:FI, routes:{wr1:f=>RL.go(f.wr1.x,0,0),wr2:f=>RL.go(f.wr2.x,0,0),te:f=>RL.block(f.te.x,0),rb:f=>RL.dive(f.rb.x,f.rb.y)} },
    { name:"Outside Run", icon:"↗️", type:"run", cat:"staple",
      brief:"RB takes it wide around the left edge. Your other basic run.",
      desc:[
        "Handoff at snap, RB heads for the outside with the TE blocking the edge defender.",
        "Call this instead of Inside Run when you want to go wide — or just to mix it up.",
        "If it breaks free, the potential gain is bigger than an inside run — more open field once you turn the corner.",
      ],
      weak:"Nickel", weakWhy:"Extra defensive back is often on the outside edge, right where you're headed.",
      strong:"Blitz", strongWhy:"Everyone's rushing inside — nobody left on the edge.",
      formation:FI, routes:{wr1:f=>RL.block(f.wr1.x,0),wr2:f=>RL.go(f.wr2.x,0,0),te:f=>RL.block(f.te.x,0),rb:f=>RL.sweep(f.rb.x,f.rb.y,-1)} },
    { name:"Counter", icon:"🔄", type:"run", cat:"staple",
      brief:"Fake one direction, cut back the other. Punishes aggressive defenses.",
      desc:[
        "Handoff at snap, RB fakes right then cuts back left.",
        "The fake makes linebackers commit the wrong direction, and you run past them.",
        "Works best after you've run in one direction a couple times — they start cheating that way, and the counter makes them pay.",
      ],
      weak:"Goal Line", weakWhy:"Too many bodies packed in — nowhere to cut back to.",
      strong:"Blitz", strongWhy:"Linebackers are charging forward and committed — they can't change direction once faked.",
      formation:FI, routes:{wr1:f=>RL.go(f.wr1.x,0,0),wr2:f=>RL.block(f.wr2.x,0),te:f=>RL.block(f.te.x,0),rb:f=>RL.counter(f.rb.x,f.rb.y,1)} },
    { name:"HB Toss", icon:"⚡", type:"run", cat:"special", tossFumble:0.08,
      brief:"Quick pitch to RB going wide. Fast, but 8% fumble risk on the toss.",
      desc:[
        "Quick pitch to RB already moving wide right.",
        "Gets the ball to the edge faster than an Outside Run, but the toss itself can be fumbled (8%).",
        "A faster, riskier version of going outside — your calculated gamble.",
      ],
      weak:"Cover 2", weakWhy:"Safety is already spread wide near the sideline — right where your RB is headed.",
      strong:"Goal Line", strongWhy:"Everyone bunched in the middle — the edge is wide open.",
      formation:FI, routes:{wr1:f=>RL.block(f.wr1.x,0),wr2:f=>RL.go(f.wr2.x,0,0),te:f=>RL.flat(f.te.x,0,1),rb:f=>RL.toss(f.rb.x,f.rb.y,1)} },
    { name:"QB Sneak", icon:"💪", type:"run", cat:"special", qbSneak:true,
      brief:"QB pushes forward behind the center. Gets 1-2 yards. Short yardage only.",
      desc:[
        "QB lunges forward right behind the center.",
        "Almost always gains 1 yard, sometimes 2, almost never loses ground.",
        "Call this on 3rd-and-1 or 4th-and-1 when you just need a yard and can't afford to be fancy.",
      ],
      weak:"Goal Line", weakWhy:"They're specifically expecting a push at the line — extra bodies at the point of attack.",
      strong:"Nickel", strongWhy:"Lighter personnel — fewer big bodies to stop the push.",
      formation:FI, routes:{wr1:f=>RL.go(f.wr1.x,0,0),wr2:f=>RL.go(f.wr2.x,0,0),te:f=>RL.block(f.te.x,0),rb:f=>RL.block(f.rb.x,f.rb.y)} },
  ],
  pass: [
    { name:"Quick Slants", icon:"⚡", type:"pass", cat:"staple",
      brief:"Short quick passes inside. Your safety blanket — call this when unsure.",
      desc:[
        "Both receivers cut inside on short fast routes.",
        "Ball comes out fast before the rush arrives.",
        "Low risk, 5-8 yard gain.",
        "Also your best answer to a blitz — defenders rush in and vacate the middle, leaving receivers open in the space they just left.",
      ],
      weak:"Nickel", weakWhy:"Extra defensive back sits in the short middle, right in your passing lanes.",
      strong:"Blitz", strongWhy:"Ball is out before pressure arrives, and the middle is empty.",
      formation:FSG, routes:{wr1:f=>RL.slant(f.wr1.x,0,1),wr2:f=>RL.slant(f.wr2.x,0,-1),te:f=>RL.seam(f.te.x,0,-1),rb:f=>RL.check(f.rb.x,f.rb.y,-1)} },
    { name:"Deep Post", icon:"🎯", type:"pass", cat:"staple",
      brief:"WR sprints deep then cuts to the middle. Your big-play pass.",
      desc:[
        "WR1 runs deep then angles toward the center of the field.",
        "Call this when you want a chunk play — needs 2-3 actions of pocket time for the route to develop, so make sure your line is holding.",
        "The payoff is 15-25 yards when it connects.",
      ],
      weak:"Blitz", weakWhy:"You'll be on your back before the route develops.",
      strong:"Goal Line", strongWhy:"Nobody covering deep — they're all packed near the line.",
      formation:FSG, routes:{wr1:f=>RL.post(f.wr1.x,0,1),wr2:f=>RL.out(f.wr2.x,0,1),te:f=>RL.curl(f.te.x,0),rb:f=>RL.check(f.rb.x,f.rb.y,-1)} },
    { name:"Play Action", icon:"🎭", type:"pass", cat:"situational",
      brief:"Fake a handoff, then throw. Devastating after successful run plays.",
      desc:[
        "QB fakes a handoff.",
        "Linebackers step forward to stop the 'run' — then the QB throws over their heads.",
        "This is a setup play: it works because of what you did on previous downs.",
        "If you've been running well, they'll bite hard.",
        "If you haven't run at all, they won't fall for it.",
      ],
      weak:"Blitz", weakWhy:"They're rushing regardless — the fake doesn't fool them.",
      strong:"Base 4-3", strongWhy:"Linebackers play honest and will bite on the run fake.",
      formation:FI, routes:{wr1:f=>RL.post(f.wr1.x,0,1),wr2:f=>RL.out(f.wr2.x,0,1),te:f=>RL.seam(f.te.x,0,-1),rb:f=>RL.dive(f.rb.x,f.rb.y)} },
    { name:"Screen Pass", icon:"🪤", type:"pass", cat:"situational",
      brief:"Let the rush come, then dump it to the RB behind them. Turns pressure against them.",
      desc:[
        "QB lets the defense rush in, then dumps a short pass to the RB standing in the open field they just vacated.",
        "Call this when the defense keeps getting to your QB — turn their aggression against them.",
      ],
      weak:"Base 4-3", weakWhy:"Linebackers stay in coverage instead of rushing — they can read the screen.",
      strong:"Blitz", strongWhy:"They all rush in and the RB is wide open behind them.",
      formation:FSG, routes:{wr1:f=>RL.go(f.wr1.x,0,0),wr2:f=>RL.go(f.wr2.x,0,0),te:f=>RL.flat(f.te.x,0,-1),rb:f=>RL.screen(f.rb.x,f.rb.y,-1)} },
    { name:"Four Verticals", icon:"🚀", type:"pass", cat:"situational",
      brief:"Every receiver goes deep. 4 targets vs 2 safeties — someone's open.",
      desc:[
        "All receivers sprint straight downfield.",
        "Simple math: 4 deep targets against 2 deep safeties means someone has to be open.",
        "But you need a clean pocket and time.",
        "Call this when you NEED 20+ yards.",
      ],
      weak:"Blitz", weakWhy:"You'll be sacked before anyone gets open.",
      strong:"Base 4-3", strongWhy:"Only 2 deep defenders for 4 deep receivers. The math works.",
      formation:FSP, routes:{wr1:f=>RL.go(f.wr1.x,0,0),wr2:f=>RL.go(f.wr2.x,0,0),te:f=>RL.seam(f.te.x,0,-1),rb:f=>RL.wheel(f.rb.x,f.rb.y,-1)} },
  ],
  trick: [
    { name:"Flea Flicker", icon:"🪰", type:"trick", flea:true, fleaFumble:0.08,
      brief:"Fake handoff, RB pitches back to QB, throw deep. 8% fumble risk.",
      desc:[
        "QB hands off to RB, who runs two steps then pitches it BACK.",
        "Defense crashes forward on the fake, leaving deep receivers alone.",
        "The pitch-back can be fumbled (8%).",
      ],
      weak:"Cover 2", weakWhy:"Safeties are already deep — they don't bite on the run fake.",
      strong:"Base 4-3", strongWhy:"Safeties play close and will bite hard on the run fake.",
      formation:FI, routes:{wr1:f=>RL.post(f.wr1.x,0,1),wr2:f=>RL.go(f.wr2.x,0,0),te:f=>RL.seam(f.te.x,0,-1),rb:f=>RL.flee(f.rb.x,f.rb.y)} },
    { name:"Statue of Liberty", icon:"🗽", type:"trick", statue:true,
      brief:"QB fakes pass, slips ball to RB behind his back. Pure surprise.",
      desc:[
        "QB drops back, holds ball behind his back while RB sneaks up and takes it.",
        "The entire defense watches the QB and receivers while the RB runs wide.",
        "Maximum surprise — don't call it twice.",
      ],
      weak:"Blitz", weakWhy:"If they read it, RB has zero blockers.",
      strong:"Nickel", strongWhy:"Defense focused on pass coverage, ignoring the backfield.",
      formation:FI, routes:{wr1:f=>RL.go(f.wr1.x,0,1),wr2:f=>RL.go(f.wr2.x,0,0),te:f=>RL.flat(f.te.x,0,-1),rb:f=>RL.statue(f.rb.x,f.rb.y,1)} },
    { name:"QB Draw", icon:"🎭", type:"trick", qbDraw:true,
      brief:"Fake a pass, then QB runs through the gaps the rush created.",
      desc:[
        "QB fakes a pass, sells the throw.",
        "Defense rushes in to sack him — then QB takes off running through the gaps they just created.",
        "The rushing defenders are now behind you.",
      ],
      weak:"Goal Line", weakWhy:"Too many bodies packed in — no gaps to exploit.",
      strong:"Blitz", strongWhy:"They all rush in and leave the middle wide open behind them.",
      formation:FSG, routes:{wr1:f=>RL.go(f.wr1.x,0,0),wr2:f=>RL.go(f.wr2.x,0,0),te:f=>RL.block(f.te.x,0),rb:f=>RL.block(f.rb.x,f.rb.y)} },
  ],
};

const getRoutes = play => {
  const r = {};
  for (const id of ["wr1","wr2","te","rb"]) { if (play.routes[id]) r[id] = play.routes[id](play.formation); }
  return r;
};

// ==================== DEFENSE ====================
const DEFS = {
  base43:{ name:"4-3 Base", desc:[
        "Standard defense — 4 linemen, 3 linebackers.",
        "Balanced against both run and pass.",
        "No glaring weakness but no great strength either.",
        "The 'we don't know what you're going to do so we'll play it straight' defense.",
      ],
    pos:{de1:R(34,1.5),dt1:R(46,1),dt2:R(54,1),de2:R(66,1.5),olb1:R(28,5),mlb:R(50,5),olb2:R(72,5),cb1:R(10,7),cb2:R(90,7),ss:R(55,14),fs:R(45,18)} },
  nickel:{ name:"Nickel", desc:[
        "They pulled a linebacker off the field and replaced him with an extra defensive back — a faster, smaller player who's better in coverage.",
        "This means better pass defense downfield, but one fewer big body to stop the run up the middle.",
      ],
    pos:{de1:R(36,1.5),dt1:R(46,1),dt2:R(54,1),de2:R(64,1.5),olb1:R(30,5),mlb:R(50,5),olb2:R(78,5),cb1:R(8,6),cb2:R(92,6),ss:R(60,12),fs:R(40,18)} },
  blitz:{ name:"Blitz", desc:[
        "They're sending the linebackers after your QB along with the defensive line — 6 or 7 guys rushing at once.",
        "You'll have very little time to throw.",
        "But with so many guys rushing, there are fewer defenders in coverage — receivers can get wide open if you survive the pressure.",
      ],
    pos:{de1:R(34,1.5),dt1:R(46,1),dt2:R(54,1),de2:R(66,1.5),olb1:R(38,2.5),mlb:R(50,3),olb2:R(62,2.5),cb1:R(10,7),cb2:R(90,7),ss:R(55,8),fs:R(45,15)} },
  cover2:{ name:"Cover 2", desc:[
        "Two safeties split deep, each guarding half the field.",
        "Almost impossible to throw over the top for a big play — there's always a safety back there.",
        "But the short middle of the field, between the linebackers and those deep safeties, is wide open.",
        "Also, the safeties are spread toward the sidelines, so runs to the edge will meet them quickly.",
      ],
    pos:{de1:R(34,1.5),dt1:R(46,1),dt2:R(54,1),de2:R(66,1.5),olb1:R(30,5),mlb:R(50,5.5),olb2:R(70,5),cb1:R(10,4),cb2:R(90,4),ss:R(30,18),fs:R(70,18)} },
  goalline:{ name:"Goal Line", desc:[
        "Everybody packed near the line of scrimmage — maximum bodies to stop a short run.",
        "But with everyone up front, there is NOBODY covering deep.",
        "Any completed pass is a huge gain.",
        "They're betting you'll try to run it in.",
      ],
    pos:{de1:R(32,1),dt1:R(44,0.8),dt2:R(56,0.8),de2:R(68,1),olb1:R(36,2.5),mlb:R(50,2.5),olb2:R(64,2.5),cb1:R(14,4),cb2:R(86,4),ss:R(50,8),fs:R(50,13)} },
};

const pickDef = (dn, dst, bo, diff) => {
  const w = { base43:30, nickel:22, blitz:15, cover2:22, goalline:0 };
  if (bo >= 95 && dst <= 3) w.goalline = 50;
  else if (bo >= 90) w.goalline = 20;
  if (dst <= 2 && bo < 90) { w.base43 += 15; w.blitz += 10; }
  if (dst >= 8) { w.nickel += 15; w.cover2 += 15; }
  if (dn >= 3 && dst >= 5) { w.nickel += 10; w.cover2 += 10; w.blitz += 8; }
  const e = Object.entries(w), t = e.reduce((s,[,v])=>s+v,0);
  let r = Math.random() * t;
  for (const [k,v] of e) { r -= v; if (r <= 0) return { key:k, ...DEFS[k] }; }
  return { key:"base43", ...DEFS.base43 };
};

// ==================== OL SYSTEM ====================
function initMatchups(scheme) {
  const m = {};
  for (const [dl, ol] of Object.entries(OL_BLK)) {
    const d = gP(DEF,dl), o = gP(OFF,ol);
    m[dl] = { olId:ol, integrity: cl(90 + (o.str - d.str) * 3 + rnd(-5,5), 60, 100) };
  }
  if (scheme.key === "blitz") m.mlb = { olId:"c", integrity: 85 + rnd(-5,5) };
  return m;
}

function degradeMatchups(mu, scheme) {
  const n = {};
  for (const [id, m] of Object.entries(mu)) {
    const dl = gP(DEF,id);
    const deg = (dl?.str || 7) * 1.2 + rnd(2,8) + (scheme.key === "blitz" ? 4 : 0);
    n[id] = { ...m, integrity: Math.max(0, m.integrity - deg) };
  }
  return n;
}

const getPocket = mu => {
  const v = Object.values(mu).map(m=>m.integrity);
  return v.length ? Math.round(v.reduce((a,b)=>a+b,0)/v.length) : 100;
};
const getWeak = mu => {
  let w=999,s=null;
  for (const [id,m] of Object.entries(mu)) { if (m.integrity < w) { w=m.integrity; s=id; } }
  return {id:s,int:w};
};

// Pass blocking: OL wall, DL clamped to assigned blocker
function computePassOL(qbP, mu) {
  const pos = {}, wallY = qbP.y + 3.5;
  const slots = [{id:"ol1",xOff:-14,cv:0},{id:"ol2",xOff:-7,cv:0.7},{id:"c",xOff:0,cv:1},{id:"ol4",xOff:7,cv:0.7},{id:"ol5",xOff:14,cv:0}];
  slots.forEach(s => {
    let pct = 1;
    for (const m of Object.values(mu)) { if (m.olId === s.id) pct = Math.min(pct, m.integrity/100); }
    const pushBack = (1-pct) * 2;
    pos[s.id] = R(cl(qbP.x + s.xOff, 5, 95), wallY + s.cv * 1.5 - pushBack);
  });
  return pos;
}

// Run blocking: OL pushes defenders in assigned directions to create lanes
function computeRunOL(playName, defPos, scheme, mxRating) {
  const blocks = RUN_BLOCKS[playName];
  if (!blocks) return { olPos: {}, defAdj: {}, holeInfo: null };
  
  const olPos = {}, defAdj = {};
  const bonusPush = mxRating >= 1 ? 3 : mxRating <= -1 ? -2 : 0; // matchup advantage
  
  for (const [olId, assignment] of Object.entries(blocks)) {
    if (olId === "hole") continue;
    const ol = gP(OFF, olId), target = assignment.target;
    const defP = defPos[target];
    if (!defP || !ol) continue;
    
    const olStr = ol.str, dlStr = gP(DEF, target)?.str || 7;
    const pushSuccess = (olStr - dlStr + 2 + bonusPush) * 0.12 + 0.5 + Math.random() * 0.2;
    const pushDist = cl(pushSuccess * 6, 0, 10); // how far the defender gets moved
    const dir = assignment.pushDir;
    
    // OL positions at the block point
    const startPos = defP;
    olPos[olId] = R(startPos.x + dir * -2, startPos.y + 0.5);
    
    // Defender gets pushed
    defAdj[target] = R(
      defP.x + dir * pushDist,
      defP.y + (dir === 0 ? pushDist * 0.3 : 0) // straight blocks push defender back slightly
    );
  }
  
  // Calculate actual hole position based on where defenders ended up
  const holeName = blocks.hole;
  let holeInfo = null;
  if (holeName === "center") {
    const leftDT = defAdj.dt1 || defPos.dt1;
    const rightDT = defAdj.dt2 || defPos.dt2;
    if (leftDT && rightDT) {
      const gap = Math.abs(rightDT.x - leftDT.x);
      holeInfo = { x: (leftDT.x + rightDT.x) / 2, y: 3, width: gap, name: "between the guards" };
    }
  } else if (holeName === "left_edge") {
    const de = defAdj.de1 || defPos.de1;
    if (de) holeInfo = { x: de.x - 8, y: 2, width: 12, name: "outside left" };
  } else if (holeName === "right_edge") {
    const de = defAdj.de2 || defPos.de2;
    if (de) holeInfo = { x: de.x + 8, y: 2, width: 12, name: "outside right" };
  } else if (holeName === "left_cutback") {
    const dt = defAdj.dt2 || defPos.dt2;
    if (dt) holeInfo = { x: dt.x - 10, y: 3, width: 10, name: "cutback left" };
  }
  
  return { olPos, defAdj, holeInfo };
}

function computeDefPass(scheme, ph, qbP, offP, olP, mu, lookDir) {
  const pos = {}, ms = Math.min(ph, 5);
  for (const p of DEF) {
    const s = scheme.pos[p.id]; if (!s) continue;
    if (p.pos === "DL") {
      let rx = s.x + (qbP.x - s.x) * 0.18 * ms, ry = s.y - (s.y - qbP.y) * 0.35 * ms;
      const m = mu[p.id];
      if (m) {
        const ol = olP[m.olId], pct = m.integrity / 100;
        if (ol && pct > 0.05) {
          if (ry < ol.y - (1-pct)*6) ry = ol.y - (1-pct)*6;
          rx += (ol.x - rx) * pct * 0.65;
          if (p.id === "de1") rx = Math.min(rx, ol.x - 2);
          if (p.id === "de2") rx = Math.max(rx, ol.x + 2);
        }
      }
      pos[p.id] = R(rx, ry);
    } else if (p.pos === "LB") {
      if (scheme.key === "blitz") {
        let rx = s.x + (qbP.x - s.x) * 0.22 * ms, ry = s.y - (s.y - qbP.y) * 0.38 * ms;
        const m = mu[p.id];
        if (m) { const ol = olP[m.olId]; if (ol && m.integrity/100 > 0.1) { const minY = ol.y-(1-m.integrity/100)*4; if (ry < minY) ry = minY; rx += (ol.x-rx)*m.integrity/100*0.4; } }
        pos[p.id] = R(rx, ry);
      } else {
        if (ms >= 2) {
          const threats = ["te","rb"].map(id=>offP[id]).filter(Boolean);
          const near = threats.reduce((a,b)=>(!a||dst(s,b)<dst(s,a)?b:a),null);
          if (near) pos[p.id] = R(s.x+(near.x-s.x)*0.06*ms, s.y+(near.y-s.y)*0.06*ms);
          else pos[p.id] = R(s.x, s.y+ms*0.5);
        } else pos[p.id] = R(s.x, s.y+ms*0.5);
      }
    } else if (p.pos === "CB") {
      const wr = offP[CB_WR[p.id]];
      if (wr) {
        const sd = p.spd - (gP(OFF,CB_WR[p.id])?.spd||7);
        const rate = cl(0.5+ms*0.12+sd*0.05,0.3,0.92), cush = ms<=1?2.5:1;
        pos[p.id] = R(s.x+(wr.x-s.x)*rate, cl(s.y+(wr.y-s.y)*rate-cush,s.y-3,40));
      } else pos[p.id] = s;
    } else if (p.pos === "S") {
      const threats = ["wr1","wr2","te"].map(id=>({id,p:offP[id]})).filter(t=>t.p);
      let targ = threats.reduce((a,b)=>(b.p.y>(a?.p?.y||0)?b:a),null);
      if (lookDir && ms>=1) {
        const lt = threats.filter(t=>lookDir==="left"?t.p.x<40:t.p.x>60);
        if (lt.length) targ = lt[0];
      }
      if (targ?.p) { const rd=ms<=1?0.04:0.08; pos[p.id]=R(s.x+(targ.p.x-s.x)*rd*ms,s.y+Math.max(0,(targ.p.y-s.y)*rd*ms)); }
      else pos[p.id] = s;
    }
  }
  return pos;
}

// Run defense: positions based on scheme, LBs react to runner
function computeDefRun(scheme, defAdj, ph) {
  const pos = {};
  for (const p of DEF) {
    const s = scheme.pos[p.id];
    // DL/LB positions from run blocking adjustments
    if (defAdj[p.id]) pos[p.id] = defAdj[p.id];
    else pos[p.id] = s;
  }
  return pos;
}

function pursue(prev, rP, step) {
  const np = {};
  for (const p of DEF) {
    const pr = prev[p.id]; if (!pr) continue;
    const cy = p.spd*0.45+0.5+step*0.12, d = dst(pr,rP);
    if (d < 0.5) { np[p.id]={...rP}; continue; }
    np[p.id] = R(pr.x+(rP.x-pr.x)*Math.min(cy/d,1), pr.y+(rP.y-pr.y)*Math.min(cy/d,1));
  }
  return np;
}

function nearD(pos, dP) {
  let n=999,nid=null;
  for (const [id,dp] of Object.entries(dP)) { const d=dst(pos,dp); if(d<n){n=d;nid=id;} }
  return {d:n,id:nid,p:gP(DEF,nid)};
}

function opn(recId, offP, defP) {
  const rec = offP[recId]; if (!rec) return {o:0,lab:"N/A",col:"#666"};
  let n=999; for (const dp of Object.values(defP)) { const d=dst(rec,dp); if(d<n)n=d; }
  if(n>8) return {o:3,lab:"WIDE OPEN",col:"#22c55e"};
  if(n>5) return {o:2,lab:"OPEN",col:"#86efac"};
  if(n>3) return {o:1,lab:"CONTESTED",col:"#fbbf24"};
  return {o:0,lab:"COVERED",col:"#ef4444"};
}

function throwProbs(recId,ph,offP,defP,scheme,pi) {
  const rec=gP(OFF,recId),op=opn(recId,offP,defP);
  const pres=(100-pi)*0.6+ph*8+(scheme.key==="blitz"?15:0)+rnd(-5,5);
  let cp=0.40+op.o*0.15+rec.skl*0.02-cl(pres,0,100)/250;
  const ip=op.o<=0?0.10+ph*0.02:op.o===1?0.04:0.01;
  return {cp:Math.round(cl(cp,0.1,0.95)*100),ip:Math.round(cl(ip,0,1)*100),op};
}

function doThrow(recId,ph,offP,defP,scheme,pi) {
  const pr=throwProbs(recId,ph,offP,defP,scheme,pi),rP=offP[recId];
  if(Math.random()*100<pr.ip) return {ok:false,int:true,yds:0,msg:`INTERCEPTED targeting ${recId.toUpperCase()}!`,tP:rP,reason:"Defender read the throw and jumped the route."};
  if(Math.random()*100>pr.cp) {
    const reasons = [
      {msg:"ball sails high",why:"Pressure forced a bad throw — the ball went over the receiver's head."},
      {msg:"pass hits turf",why:"QB couldn't set his feet under pressure — the ball bounced short."},
      {msg:"CB bats it away",why:`The cornerback was in tight coverage (${pr.op.lab.toLowerCase()}) and got a hand on it.`},
      {msg:"can't haul it in",why:"The receiver couldn't secure the catch — ball was slightly off target."},
    ];
    const r=pick(reasons);
    return {ok:false,int:false,yds:0,msg:`Incomplete — ${r.msg}`,tP:rP,reason:r.why};
  }
  return {ok:true,int:false,yds:Math.round(rP.y),cId:recId,msg:`${recId.toUpperCase()} makes the catch!`,tP:rP,reason:`${recId.toUpperCase()} was ${pr.op.lab.toLowerCase()} — good read.`};
}

// ==================== GHOST ARROWS FOR RUNNER ====================
function computeRunArrows(bcPos, defP, gameState) {
  if (!bcPos) return [];
  const arrows = [];
  
  // Analyze field for gaps
  const defenders = Object.entries(defP).map(([id,p])=>({id,...p,d:dst(bcPos,p)})).sort((a,b)=>a.d-b.d);
  
  // Arrow 1: Best open gap (green — "Sure Thing")
  // Find biggest gap in front of runner
  const forward = defenders.filter(d => d.y > bcPos.y - 2 && d.d < 15);
  let bestGapX = bcPos.x, bestGapSize = 0;
  for (let x = 10; x <= 90; x += 10) {
    const nearestInLane = forward.filter(d => Math.abs(d.x - x) < 12);
    const closest = nearestInLane.length ? Math.min(...nearestInLane.map(d=>d.d)) : 20;
    if (closest > bestGapSize) { bestGapSize = closest; bestGapX = x; }
  }
  const sureYds = cl(Math.round(bestGapSize * 0.6), 2, 6);
  arrows.push({
    type: "sure", label: "Hit the Hole", sub: `~${sureYds} yards, low risk`,
    targetX: bestGapX, targetY: bcPos.y + sureYds,
    color: "#22c55e", pct: cl(70 + bestGapSize * 2, 50, 95),
    ydsLow: sureYds - 1, ydsHigh: sureYds + 2
  });
  
  // Arrow 2: Gamble route (yellow — tighter gap but open field behind)
  const secondLine = defenders.filter(d => d.y > bcPos.y + 5 && d.d < 25);
  let gambleX = bcPos.x < 50 ? bcPos.x - 15 : bcPos.x + 15;
  gambleX = cl(gambleX, 8, 92);
  const nearGamble = defenders.filter(d => Math.abs(d.x - gambleX) < 10 && d.y > bcPos.y - 2 && d.y < bcPos.y + 8);
  const gambleBlocked = nearGamble.length > 0;
  const gambleYds = gambleBlocked ? rnd(8, 15) : rnd(10, 20);
  const gamblePct = gambleBlocked ? cl(30 - nearGamble.length * 8, 10, 45) : 60;
  arrows.push({
    type: "gamble", label: "Bounce Outside", sub: `${gambleYds} yards if clear, risky`,
    targetX: gambleX, targetY: bcPos.y + gambleYds * 0.6,
    color: "#fbbf24", pct: gamblePct,
    ydsLow: 0, ydsHigh: gambleYds
  });
  
  // Arrow 3: Home run (red — through traffic, TD potential)
  const deepDef = defenders.filter(d => d.y > bcPos.y + 10);
  const hrX = bcPos.x < 50 ? cl(bcPos.x + 20, 10, 90) : cl(bcPos.x - 20, 10, 90);
  const hrPct = cl(15 - deepDef.length * 3, 5, 25);
  arrows.push({
    type: "homerun", label: "Break It", sub: `Low odds, huge gain`,
    targetX: hrX, targetY: bcPos.y + 20,
    color: "#ef4444", pct: hrPct,
    ydsLow: -2, ydsHigh: 40
  });
  
  return arrows;
}

// ==================== COACH B ====================
function coachPresnap(scheme, play, mxRating, gameState) {
  const defK = scheme.key;
  const playName = play.name;
  
  // Build context-aware advice with two options
  const lines = [];
  
  // Describe the defense in plain terms first
  if (defK === "blitz") lines.push("They're sending extra rushers after you — expect fast pressure.");
  else if (defK === "nickel") lines.push("Extra defensive back out there — they're expecting pass but that leaves the middle lighter.");
  else if (defK === "cover2") lines.push("Two safeties deep, each covering half the field. Hard to go over the top.");
  else if (defK === "goalline") lines.push("Everybody's packed near the line. They think you're running it in short.");
  else lines.push("Standard look. Nothing exotic.");
  
  // Recommend based on matchup
  if (mxRating >= 2) lines.push(`Good call — ${playName} is perfect here. This defense is exactly what it exploits.`);
  else if (mxRating >= 1) lines.push(`${playName} should work well against this look. The matchup favors us.`);
  else if (mxRating === 0) lines.push(`${playName} is a fair matchup here — no big advantage either way. Execution will decide it.`);
  else if (mxRating === -1) lines.push(`I'd be careful with ${playName} here — this defense is set up to handle it. Could still work, but consider an audible.`);
  else lines.push(`${playName} is a tough call against this look — they're built to stop exactly this. Think about changing the play.`);
  
  // Suggest alternatives
  const allPlays = [...PLAYS.run, ...PLAYS.pass, ...PLAYS.trick];
  const better = allPlays.filter(p => (MX[p.name]?.[defK] || 0) > mxRating && p.name !== playName).sort((a,b) => (MX[b.name]?.[defK]||0) - (MX[a.name]?.[defK]||0));
  if (better.length > 0 && mxRating < 1) {
    const alt = better[0];
    const altRating = MX[alt.name]?.[defK] || 0;
    lines.push(`If you want to audible: ${alt.name} has a ${mxLabel(altRating).toLowerCase()} matchup against this defense.`);
  }
  
  // Emotional overlay based on game state
  const diff = gameState.sc.you - gameState.sc.cpu;
  if (diff < -14 && gameState.q >= 3) {
    lines.unshift("Long way to go. But we've got time. One play at a time.");
  } else if (diff < -7 && gameState.q >= 4) {
    lines.unshift("We need points. Let's make something happen here.");
  } else if (diff > 14) {
    lines.unshift("We're in control. Keep it simple, don't force anything.");
  }
  
  return lines.join(" ");
}

function coachQB(ph, offP, defP, mu, scheme, lookDir) {
  const pi = getPocket(mu), weak = getWeak(mu);
  if (pi < 20) return "🚨 Pocket's gone — throw it NOW or scramble!";
  if (pi < 40 && weak.int < 10) {
    const side = weak.id === "de1" || weak.id === "dt1" ? "left" : "right";
    return `⚠️ ${side.charAt(0).toUpperCase()+side.slice(1)} side is giving way — move the other direction or get rid of it.`;
  }
  // Check for open receiver
  for (const id of ["wr1","wr2","te","rb"]) {
    const o = opn(id, offP, defP);
    if (o.o >= 3 && offP[id]?.y > 8) return `👁️ ${id.toUpperCase()} is breaking open downfield — if you trust it, throw it now.`;
    if (o.o >= 2 && offP[id]?.y > 4) return `${id.toUpperCase()} is getting open — could be your best window.`;
  }
  if (lookDir) {
    const other = lookDir === "left" ? "right" : "left";
    return `Safeties shifted ${lookDir}. The ${other} side should be opening up — look for it.`;
  }
  if (ph <= 1) return "Pocket is fresh. Let the routes develop — you've got time.";
  if (pi > 70) return "Line is holding — you've got time. Let the deep routes get open.";
  return "Read the coverage and make your throw.";
}

function coachRunner(bcPos, defP, arrows, gameState) {
  if (!bcPos) return "";
  const nd = nearD(bcPos, defP);
  if (!arrows.length) return "";
  
  const sure = arrows.find(a => a.type === "sure");
  const gamble = arrows.find(a => a.type === "gamble");
  
  if (nd.d < 3) return `⚠️ ${nd.p?.lab||"Defender"} closing fast! Make a move!`;
  
  // Use arrows to give specific advice
  const parts = [];
  if (sure) parts.push(`Clean gap ${sure.targetX < bcPos.x ? "left" : sure.targetX > bcPos.x + 5 ? "right" : "up the middle"} — easy ${sure.ydsLow}-${sure.ydsHigh} yards.`);
  if (gamble && gamble.pct > 25) {
    const dir = gamble.targetX < bcPos.x ? "outside left" : "outside right";
    parts.push(`But the ${dir} could break big if you get past the first man — nothing but daylight behind him.`);
  }
  if (nd.d > 10) parts.push("You've got room — hit it!");
  
  return parts.join(" ");
}

function coachContact(bcPos, defP, defenders3) {
  if (defenders3 >= 3) return "Multiple guys. Fall forward, live for the next play.";
  if (defenders3 === 1) return "One-on-one — a good move could break this.";
  return "Two on you — make it count.";
}

function postPlayDebrief(result, play, scheme, mu) {
  if (!result || !play || !scheme) return "";
  const defName = scheme.name;
  const playName = play.name;
  const mxR = MX[playName]?.[scheme.key] || 0;
  
  if (result.reason) return result.reason;
  
  if (result.turnover) return `Turnover on ${playName} vs ${defName}. ${mxR < 0 ? "The matchup was against us — consider a different play next time against this defense." : "Bad luck — the play call was fine."}`;
  
  if (result.yds <= 1 && !result.incomplete) {
    if (mxR <= -1) return `${playName} was a tough call against ${defName} — they were set up to stop exactly this. Look for plays with a better matchup rating.`;
    const weak = getWeak(mu);
    if (weak.int < 20) return `Your ${gP(OFF,weak.id)?.lab||"lineman"} lost his matchup and the defense got through. The play design was fine, the blocking broke down.`;
    return "Defense made a good play — sometimes they just win the rep.";
  }
  
  if (result.yds >= 15) return `Big play! ${mxR >= 1 ? "Good read — the matchup was in your favor and you exploited it." : "Great execution — that worked despite a tough matchup."}`;
  
  return "";
}

// ==================== FIREWORKS ====================
function Fireworks({show}) {
  const [ps,setPs]=useState([]);
  const [go,setGo]=useState(false);
  useEffect(()=>{
    if(!show){setPs([]);setGo(false);return;}
    const a=[];
    for(let b=0;b<5;b++){const cx=80+Math.random()*(FW-160),cy=60+Math.random()*150;
    const c=["#fbbf24","#22c55e","#ef4444","#4a9eff","#f97316","#a855f7"][~~(Math.random()*6)];
    for(let i=0;i<18;i++){const an=(i/18)*Math.PI*2+Math.random()*0.3,sp=2+Math.random()*3;
    const dx=Math.cos(an)*sp*30,dy=Math.sin(an)*sp*30;
    a.push({k:`${b}-${i}`,cx,cy,dx,dy,c,dl:b*300,lf:800+Math.random()*400});}}
    setPs(a);
    setTimeout(()=>setGo(true),50);
  },[show]);
  if(!show||!ps.length)return null;
  return(<div style={{position:"absolute",inset:0,zIndex:50,pointerEvents:"none",overflow:"hidden"}}>
    {ps.map(p=>(<div key={p.k} style={{position:"absolute",left:p.cx,top:p.cy,width:6,height:6,borderRadius:"50%",
      background:p.c,boxShadow:`0 0 6px ${p.c}`,
      transform:go?`translate(${p.dx}px, ${p.dy}px) scale(0)`:"translate(0,0) scale(1)",
      opacity:go?0:1,
      transition:`transform ${p.lf}ms ease-out ${p.dl}ms, opacity ${p.lf}ms ease-out ${p.dl}ms`}}/>))}
  </div>);
}

// ==================== MAIN COMPONENT ====================
export default function TacticalFootball() {
  const [diff, setDiff] = useState(null); // null = choose, "preseason"|"regular"|"playoffs"
  const [game, setGame] = useState({bo:25,dn:1,dst:10,sc:{you:0,cpu:0},q:1,pr:0,lastPlays:[]});
  const [mode, setMode] = useState("diff_select");
  const [pCat, setPCat] = useState(null);
  const [selPlay, setSelPlay] = useState(null);
  const [defSch, setDefSch] = useState(null);
  const [phase, setPhase] = useState(0);
  const [qbP, setQbP] = useState(R(50,-3));
  const [bc, setBc] = useState("qb");
  const [bcP, setBcP] = useState(null);
  const [isRun, setIsRun] = useState(false);
  const [isCatch, setIsCatch] = useState(false);
  const [result, setResult] = useState(null);
  const [log, setLog] = useState([]);
  const [handed, setHanded] = useState(false);
  const [ballP, setBallP] = useState(R(50,-3));
  const [ballSt, setBallSt] = useState("held");
  const [ballAn, setBallAn] = useState(false);
  const [camY, setCamY] = useState(0);
  const [runAct, setRunAct] = useState(0);
  const [narr, setNarr] = useState("");
  const [coach, setCoach] = useState("");
  const [defPos, setDefPos] = useState({});
  const [olPos, setOlPos] = useState({});
  const [showTD, setShowTD] = useState(false);
  const [matchups, setMatchups] = useState({});
  const [lookDir, setLookDir] = useState(null);
  const [routes, setRoutes] = useState({});
  const [showGhost, setShowGhost] = useState(false);
  const [contactData, setContactData] = useState(null);
  const [runArrows, setRunArrows] = useState([]);
  const [holeInfo, setHoleInfo] = useState(null);
  const [debrief, setDebrief] = useState("");

  useEffect(() => {
    let t=0;
    if(!["diff_select","menu","playcall","fourth","presnap"].includes(mode)){
      const c=bcP||(bc==="qb"?qbP:null);
      if(c&&c.y>8)t=c.y-8; else if(c&&c.y<-8)t=c.y+8;
    }
    setCamY(t);
  },[mode,bcP,qbP,bc,phase,runAct]);

  const yS=useCallback(y=>FH/2-(y-camY)*PY,[camY]);
  const xS=p=>(p/100)*FW;

  const getOffP=useCallback(ph=>{
    if(!selPlay)return{};
    const pos={},f=selPlay.formation;
    for(const id of ["wr1","wr2","te","rb"]){
      const rt=routes[id];
      pos[id]=ph===0?f[id]:rt?rt[cl(ph-1,0,rt.length-1)]:f[id];
    }
    pos.qb=qbP;
    for(const olId of OL_IDS){if(olPos[olId])pos[olId]=olPos[olId];}
    return pos;
  },[selPlay,qbP,olPos,routes]);

  const offP=getOffP(phase);
  const pi=getPocket(matchups);

  useEffect(()=>{
    if(ballSt!=="held")return;
    if(bc==="qb")setBallP({...qbP});
    else if(bcP)setBallP({...bcP});
    else{const p=offP[bc];if(p)setBallP({...p});}
  },[ballSt,bc,qbP,bcP,offP,phase]);

  const recomputePass=useCallback((ph,qP,mu,ld)=>{
    if(!defSch||!selPlay)return;
    const ol=computePassOL(qP,mu); setOlPos(ol);
    const oP={};
    for(const id of ["wr1","wr2","te","rb"]){
      const rt=routes[id];
      oP[id]=ph===0?selPlay.formation[id]:rt?rt[cl(ph-1,0,rt.length-1)]:selPlay.formation[id];
    }
    oP.qb=qP; Object.assign(oP,ol);
    setDefPos(computeDefPass(defSch,ph,qP,oP,ol,mu,ld));
  },[defSch,selPlay,routes]);

  useEffect(()=>{
    if(phase>0&&defSch&&selPlay&&!isRun) recomputePass(phase,qbP,matchups,lookDir);
  },[phase,defSch,selPlay,isRun,qbP,matchups,lookDir,recomputePass]);

  const selectPlay=p=>{setSelPlay(p);setRoutes(getRoutes(p));setShowGhost(true);};

  const goPresnap=()=>{
    const def=pickDef(game.dn,game.dst,game.bo,diff);
    setDefSch(def);
    const sq=selPlay.formation.qb; setQbP(sq);
    const mu=initMatchups(def); setMatchups(mu);
    const ol=computePassOL(sq,mu); setOlPos(ol);
    const oP={...selPlay.formation,qb:sq,...ol};
    setDefPos(computeDefPass(def,0,sq,oP,ol,mu,null));
    setLookDir(null);
    const mxR = MX[selPlay.name]?.[def.key] || 0;
    setCoach(coachPresnap(def, selPlay, mxR, game));
    setMode("presnap");
  };

  const snap=()=>{
    setPhase(0);setBc("qb");setBcP(null);setIsRun(false);setIsCatch(false);
    setResult(null);setHanded(false);setBallSt("held");setBallAn(false);
    setRunAct(0);setNarr("");setCamY(0);setShowTD(false);setShowGhost(false);
    setRunArrows([]);setHoleInfo(null);setDebrief("");
    const sq=selPlay.formation.qb; setQbP(sq);setBallP({...sq});
    const mu=initMatchups(defSch); setMatchups(mu); setLookDir(null);
    setBallP({...selPlay.formation.c});setBallSt("air");setBallAn(true);
    setTimeout(()=>{
      setBallP({...sq});
      setTimeout(()=>{
        setBallSt("held");setBallAn(false);setPhase(1);
        if(selPlay.qbSneak){
          const sneakGain = rnd(1,3) - (defSch.key === "goalline" ? 1 : 0);
          const nP = R(sq.x, sq.y + sneakGain);
          setIsRun(true);setBc("qb");setBcP(nP);setBallP({...nP});
          setNarr(`QB pushes forward for ${sneakGain}!`);
          setMode("animating");
          setTimeout(()=>endPlay(sneakGain, `QB Sneak — pushes for +${sneakGain}`),ANIM);
        } else if(selPlay.type==="run"&&!selPlay.qbDraw){
          setTimeout(()=>{
            setMode("rpo");
            setCoach("🏈 Handoff ready — give it to the RB as planned, or pull it back and throw if you see something.");
          },ANIM);
        } else if(selPlay.flea){
          setHanded(true);setIsRun(true);setBc("rb");
          const rbPos=routes.rb?routes.rb[0]:selPlay.formation.rb;
          setBcP(rbPos);setBallP({...rbPos});setBallSt("held");
          setNarr("Handoff to RB... running forward...");
          setCoach("🪰 RB has it — wait for the pitch back!");
          setMode("animating");
          setTimeout(()=>{
            if(Math.random()<selPlay.fleaFumble){
              setBallSt("loose");
              endPlay(0,"FUMBLE on the pitch back! Flea flicker disaster!",true);
            } else {
              setIsRun(false);setBc("qb");setBcP(null);setHanded(false);
              setBallSt("held"); setBallP({...sq});
              setPhase(2);setNarr("RB pitches back to QB! Defense bought the fake!");
              setCoach("🎯 Defense bit hard on the run — receivers should be open deep. Let it fly!");
              setTimeout(()=>setMode("decision"),ANIM);
            }
          },ANIM*2);
        } else if(selPlay.statue){
          setNarr("QB drops back like a normal pass...");
          setCoach("🗽 Sell the fake. Drop back, then use 'Statue' to slip it to the RB when you're ready.");
          setTimeout(()=>setMode("decision"),ANIM);
        } else if(selPlay.qbDraw){
          setNarr("QB drops back in passing stance...");
          setCoach("🎭 Defense sees pass — they're rushing. When you're ready, tuck it and run through the gaps they're leaving behind them.");
          setTimeout(()=>setMode("decision"),ANIM);
        } else {
          setTimeout(()=>{
            setMode("decision");
            setCoach(coachQB(1,offP,defPos,mu,defSch,null));
          },ANIM);
        }
      },250);
    },120);
    setMode("snapping");
  };

  const endPlay=(yds,desc,turnover=false,incomplete=false,reason="")=>{
    if(incomplete)setBallSt("ground");if(turnover)setBallSt("loose");
    const nb=game.bo+yds;
    const res={yds,desc,turnover,incomplete,td:false,reason};
    if(nb>=100&&!turnover&&!incomplete){
      res.td=true;setShowTD(true);setMode("touchdown");
    } else setMode("result");
    setResult(res);setNarr("");setRunArrows([]);
    setDebrief(postPlayDebrief(res,selPlay,defSch,matchups));
  };

  const animThen=(fn,delay)=>{setMode("animating");setTimeout(fn,delay||ANIM);};

  // ==================== RPO (RUN ONLY) ====================
  const doRPO=ch=>{
    if(ch==="handoff"){
      const mxR = MX[selPlay.name]?.[defSch.key] || 0;
      const {olPos:rOL,defAdj,holeInfo:hi}=computeRunOL(selPlay.name,defSch.pos,defSch,mxR);
      
      setIsRun(true);setBc("rb");setHanded(true);
      const rbR=routes.rb;
      const rbPos=rbR?rbR[0]:selPlay.formation.rb;
      
      // Toss fumble check
      if(selPlay.tossFumble&&Math.random()<selPlay.tossFumble){
        setBcP(rbPos);setBallP({...rbPos});setBallSt("loose");
        setNarr("FUMBLE on the pitch!");
        animThen(()=>endPlay(0,"FUMBLE! Ball on the ground!",true),ANIM);
        return;
      }
      
      setBcP(rbPos);setBallP({...rbPos});setBallSt("held");
      
      // Apply run blocking — move defenders based on OL assignments
      const newDef = { ...defSch.pos };
      for (const [did, adj] of Object.entries(defAdj)) { newDef[did] = adj; }
      // LBs react to run
      for (const p of DEF) {
        if (p.pos === "LB" && !defAdj[p.id]) {
          const s = defSch.pos[p.id];
          newDef[p.id] = R(s.x + (rbPos.x - s.x) * 0.12, s.y + (rbPos.y - s.y) * 0.08);
        }
      }
      // CBs and Safeties stay in coverage initially on runs
      for (const p of DEF) {
        if ((p.pos === "CB" || p.pos === "S") && !defAdj[p.id]) {
          newDef[p.id] = defSch.pos[p.id];
        }
      }
      setDefPos(newDef);
      setOlPos(rOL);
      setHoleInfo(hi);
      
      // Compute run arrows
      const arrows = computeRunArrows(rbPos, newDef, game);
      setRunArrows(arrows);
      
      setNarr("Handoff to RB!");
      setCoach(coachRunner(rbPos, newDef, arrows, game));
      animThen(()=>{setPhase(p=>p+1);setMode("runner");},ANIM);
    } else {
      setNarr("QB pulls the ball back! Looking to pass!");
      setCoach("👀 Defense reacted to the run fake — check your receivers.");
      animThen(()=>setMode("decision"),ANIM);
    }
  };

  // ==================== QB ACTIONS ====================
  const doQB=action=>{
    const np=phase+1;setNarr("");
    let mu=matchups;
    if(!action.type.startsWith("look")){mu=degradeMatchups(matchups,defSch);setMatchups(mu);}
    const newPI=getPocket(mu);

    switch(action.type){
      case "dropback":{const nq=R(qbP.x,qbP.y-2.5);setQbP(nq);setPhase(np);setCoach(coachQB(np,offP,defPos,mu,defSch,lookDir));animThen(()=>{if(!checkSack(np,mu))setMode("decision");},ANIM);break;}
      case "scramble_left":{const nq=R(cl(qbP.x-14,5,95),qbP.y-1);setQbP(nq);setPhase(np);setCoach("Moving left — look for a target or keep scrambling.");animThen(()=>{if(!checkSack(np,mu))setMode("decision");},ANIM);break;}
      case "scramble_right":{const nq=R(cl(qbP.x+14,5,95),qbP.y+1);setQbP(nq);setPhase(np);setCoach("Moving right — check the field.");animThen(()=>{if(!checkSack(np,mu))setMode("decision");},ANIM);break;}
      case "step_up":{const nq=R(qbP.x,qbP.y+rnd(2,4));setQbP(nq);setPhase(np);setNarr("QB steps up through the gap!");setCoach("Stepped up — still in throwing mode. Make your read.");animThen(()=>{if(!checkSack(np,mu))setMode("decision");},ANIM);break;}
      case "look_left":{setLookDir("left");setPhase(np);setNarr("QB eyes left — safeties bite");setCoach("Safeties shifted left. The right side should be opening up.");animThen(()=>setMode("decision"),ANIM);break;}
      case "look_right":{setLookDir("right");setPhase(np);setNarr("QB eyes right — safeties shift");setCoach("Safeties shifted right. Look left for your opening.");animThen(()=>setMode("decision"),ANIM);break;}
      case "throw":{
        const curOff=getOffP(phase);
        const res=doThrow(action.target,phase,curOff,defPos,defSch,newPI);
        const tp=curOff[action.target];
        setBallSt("air");setBallAn(true);
        setTimeout(()=>setBallP({...tp}),40);
        setTimeout(()=>{
          setBallAn(false);
          if(res.int){setBallSt("loose");endPlay(0,res.msg,true,false,res.reason);}
          else if(!res.ok){setBallSt("ground");endPlay(0,res.msg,false,true,res.reason);}
          else{
            setBallSt("held");setBc(res.cId);setBcP({...tp});setBallP({...tp});
            setIsRun(true);setIsCatch(true);setRunAct(0);
            setNarr(`${res.cId.toUpperCase()} catches at +${res.yds}!`);
            let dp=pursue(defPos,tp,1);dp=pursue(dp,tp,2);
            setDefPos(dp);
            const arrows=computeRunArrows(tp,dp,game);
            setRunArrows(arrows);
            setCoach(coachRunner(tp,dp,arrows,game));
            const nd=nearD(tp,dp);
            if(nd.d<2){animThen(()=>triggerContact(tp,dp),ANIM);}
            else{animThen(()=>{setPhase(np);setMode("runner");},ANIM);}
          }
        },PANIM);
        break;
      }
      case "handoff":{
        setIsRun(true);setBc("rb");setHanded(true);
        const rbR=routes.rb;
        const rbPos=rbR?rbR[cl(phase-1,0,rbR.length-1)]:selPlay.formation.rb;
        setBcP(rbPos);setBallP({...rbPos});setBallSt("held");
        setRunAct(0);setNarr("Handoff to RB!");
        const dp=pursue(defPos,rbPos,1);setDefPos(dp);
        const arrows=computeRunArrows(rbPos,dp,game);setRunArrows(arrows);
        setCoach(coachRunner(rbPos,dp,arrows,game));
        animThen(()=>{setPhase(np);setMode("runner");},ANIM);
        break;
      }
      case "statue_handoff":{
        setIsRun(true);setBc("rb");setHanded(true);
        const rbR=routes.rb;
        const rbPos=rbR?rbR[cl(phase-1,0,rbR.length-1)]:selPlay.formation.rb;
        setBcP(rbPos);setBallP({...rbPos});setBallSt("held");
        setRunAct(0);setNarr("STATUE OF LIBERTY! RB takes it!");
        setCoach("🗽 They didn't see it! RB has the ball — find daylight!");
        const dp=pursue(defPos,rbPos,1);setDefPos(dp);
        const arrows=computeRunArrows(rbPos,dp,game);setRunArrows(arrows);
        animThen(()=>{setPhase(np);setMode("runner");},ANIM);
        break;
      }
      case "tuck_run":{
        setIsRun(true);setBc("qb");setBcP({...qbP});setIsCatch(false);
        setRunAct(0);setNarr("QB tucks and runs!");
        setCoach("🏃 QB on the move — find a gap!");
        const dp=pursue(defPos,qbP,1);setDefPos(dp);
        const arrows=computeRunArrows(qbP,dp,game);setRunArrows(arrows);
        animThen(()=>{setPhase(np);setMode("runner");},ANIM);
        break;
      }
      default:break;
    }
  };

  const checkSack=(ph,mu)=>{
    const pi=getPocket(mu);
    const pres=(100-pi)*0.6+ph*8+(defSch.key==="blitz"?15:0)+rnd(-5,5);
    const ch=pi<15?(pres-30)/100:(pres-55)/150;
    if(Math.random()<ch){const l=rnd(3,8);endPlay(-l,`SACKED! Loss of ${l}`,false,false,"The pocket collapsed — couldn't get the throw off.");return true;}
    return false;
  };

  // ==================== CONTACT! ====================
  const triggerContact=(pos,dp)=>{
    const nd=nearD(pos,dp);
    const d3=Object.values(dp).filter(d=>dst(pos,d)<4).length;
    const runner=gP(OFF,bc);
    const bf=0.03+d3*0.04;
    const options=[
      {type:"spin",label:"🌀 Spin Move",brk:cl(Math.round((runner.skl/13+0.08-(d3-1)*0.08)*100),3,40),fum:Math.round(cl(bf+0.08,0.02,0.35)*100),tck:0},
      {type:"juke",label:"↙️ Juke",brk:cl(Math.round((runner.skl/12+0.10-(d3-1)*0.05)*100),5,35),fum:Math.round(cl(bf+0.04,0.02,0.25)*100),tck:0},
      {type:"stiff",label:"💪 Stiff Arm",brk:cl(Math.round((runner.str/12+0.08-(d3-1)*0.06)*100),3,30),fum:Math.round(cl(bf+0.03,0.02,0.20)*100),tck:0},
      {type:"dive",label:"⬇️ Dive Forward",brk:0,yds:rnd(1,2),fum:Math.round(cl(bf-0.02,0.01,0.08)*100),tck:0},
    ];
    options.forEach(o=>{o.tck=100-o.brk-o.fum;});
    setContactData({pos,dp,nd,d3,options});
    setCoach(coachContact(pos,dp,d3));
    setMode("contact");
  };

  const resolveContact=opt=>{
    const pos=contactData.pos;
    let yds=Math.round(pos.y);
    const roll=Math.random()*100;
    if(opt.type==="dive"){
      yds+=opt.yds;
      if(roll<opt.fum){setNarr("FUMBLE on the dive!");endPlay(0,"FUMBLE! Ball stripped!",true);}
      else{setBcP(R(pos.x,pos.y+opt.yds));setBallP(R(pos.x,pos.y+opt.yds));endPlay(yds,`Dives for +${yds}`);}
    } else if(roll<opt.fum){
      setNarr(`FUMBLE on the ${opt.type}!`);endPlay(0,`FUMBLE on the ${opt.type}!`,true);
    } else if(roll<opt.fum+opt.brk){
      const gain=rnd(4,8);
      const nP=R(pos.x+rnd(-8,8),pos.y+gain);
      setBcP(nP);setBallP({...nP});
      setNarr(`BREAKS FREE! ${opt.type==="spin"?"Spin move!":opt.type==="juke"?"Juke!":"Stiff arm!"}`);
      setCoach("💥 He's loose! Keep running!");
      const ndp=pursue(contactData.dp,nP,runAct+1);
      setDefPos(ndp);setRunAct(r=>r+1);
      const arrows=computeRunArrows(nP,ndp,game);setRunArrows(arrows);
      if(game.bo+Math.round(nP.y)>=100) endPlay(Math.round(nP.y),"Breaks free into the ENDZONE!");
      else animThen(()=>setMode("runner"),ANIM);
    } else {
      endPlay(yds,`Brought down at +${yds} after failed ${opt.type}`);
    }
    setContactData(null);
  };

  // ==================== RUNNER ACTIONS ====================
  const doRun=action=>{
    const ra=runAct+1;
    let np=bcP?{...bcP}:{...qbP};
    const runner=gP(OFF,bc);
    
    // Arrow-based actions
    if(action.arrow){
      const arrow=action.arrow;
      const roll=Math.random()*100;
      if(roll<arrow.pct){
        // Success
        const gain=rnd(arrow.ydsLow,arrow.ydsHigh);
        np=R(cl(arrow.targetX+rnd(-3,3),3,97), np.y+Math.max(1,gain));
        setNarr(`${action.label} — +${Math.max(1,gain)}!`);
      } else {
        // Failed — got stuffed or caught
        const gain=rnd(0,2);
        np=R(np.x+rnd(-3,3), np.y+gain);
        setNarr(`${action.label} — ${gain > 0 ? `+${gain}, fought for it.` : "stuffed."}`);
      }
    } else {
      switch(action.type){
        case "power":{np=R(np.x,np.y+rnd(1,3));setNarr("Powers forward.");break;}
        default:break;
      }
    }

    if(game.bo+Math.round(np.y)>=100){
      setBcP(np);setBallP({...np});setRunAct(ra);
      endPlay(Math.round(np.y),`${bc.toUpperCase()} into the ENDZONE!`);return;
    }

    setBcP(np);setBallP({...np});
    if(bc==="qb")setQbP(np);
    setRunAct(ra);

    const ndp=pursue(defPos,np,ra);setDefPos(ndp);
    const nd=nearD(np,ndp);
    const arrows=computeRunArrows(np,ndp,game);setRunArrows(arrows);
    setCoach(coachRunner(np,ndp,arrows,game));

    if(nd.d<2){animThen(()=>triggerContact(np,ndp),ANIM);return;}

    let tp=0;
    if(nd.d<2.5)tp=0.55; else if(nd.d<3.5)tp=0.25; else if(nd.d<4)tp=0.10;
    if(Math.random()<tp){
      animThen(()=>endPlay(Math.round(np.y),`${nd.p?.lab||"Defender"} tackles at +${Math.round(np.y)}`),ANIM);
    } else {
      const maxA=isCatch?MAX_YAC:999;
      if(ra>=maxA) animThen(()=>endPlay(Math.round(np.y),`Brought down at +${Math.round(np.y)}`),ANIM);
      else animThen(()=>setMode("runner"),ANIM);
    }
  };

  // ==================== GAME FLOW ====================
  const doFourth=ch=>{
    if(ch==="punt"){setLog(l=>[`📢 Punt`,...l].slice(0,25));setGame(g=>({...g,bo:25,dn:1,dst:10}));}
    else if(ch==="fg"){
      const fgd=100-game.bo+17;
      const mp=fgd<=30?0.95:fgd<=40?0.82:fgd<=50?0.60:fgd<=55?0.35:0.15;
      if(Math.random()<mp){setLog(l=>[`🥅 FG GOOD! ${fgd}yds`,...l].slice(0,25));setGame(g=>({...g,bo:25,dn:1,dst:10,sc:{...g.sc,you:g.sc.you+3}}));}
      else{setLog(l=>[`❌ FG MISSED ${fgd}yds`,...l].slice(0,25));setGame(g=>({...g,bo:25,dn:1,dst:10}));}
    } else {setMode("menu");setPCat(null);return;}
    resetForNew();
  };

  const resetForNew=()=>{
    setMode("menu");setSelPlay(null);setDefSch(null);setResult(null);
    setPhase(0);setHanded(false);setBallSt("held");setBallAn(false);
    setCamY(0);setRunAct(0);setNarr("");setCoach("");setDefPos({});
    setOlPos({});setRoutes({});setIsCatch(false);setPCat(null);setShowGhost(false);
    setContactData(null);setRunArrows([]);setHoleInfo(null);setDebrief("");
  };

  const advance=()=>{
    if(!result)return;const r=result;setShowTD(false);
    setGame(g=>{
      let{bo,dn,dst:d,sc,q,pr,lastPlays:lp}={...g};pr++;
      lp=[r.yds,...lp].slice(0,5);
      if(r.turnover){setLog(l=>[`💥 ${r.desc}`,...l].slice(0,25));return{bo:25,dn:1,dst:10,sc,q,pr,lastPlays:lp};}
      const nb=cl(bo+r.yds,0,100);
      if(r.td||nb>=100){const ns={...sc,you:sc.you+7};setLog(l=>[`🏈 TD!`,...l].slice(0,25));return{bo:25,dn:1,dst:10,sc:ns,q:Math.min(4,~~(pr/12)+1),pr,lastPlays:lp};}
      if(nb<=0){const ns={...sc,cpu:sc.cpu+2};setLog(l=>[`⚠️ Safety!`,...l].slice(0,25));return{bo:25,dn:1,dst:10,sc:ns,q,pr,lastPlays:lp};}
      const gained=nb-bo,nd=d-gained;
      if(nd<=0){setLog(l=>[`✅ 1st! +${gained}`,...l].slice(0,25));return{bo:nb,dn:1,dst:Math.min(10,100-nb),sc,q:Math.min(4,~~(pr/12)+1),pr,lastPlays:lp};}
      if(dn>=4){setLog(l=>[`${gained>=0?"+":""}${gained}`,...l].slice(0,25));return{bo:nb,dn:4,dst:nd,sc,q:Math.min(4,~~(pr/12)+1),pr,lastPlays:lp};}
      setLog(l=>[`${gained>=0?"+":""}${gained} — ${r.desc}`,...l].slice(0,25));
      return{bo:nb,dn:dn+1,dst:nd,sc,q:Math.min(4,~~(pr/12)+1),pr,lastPlays:lp};
    });
    setTimeout(()=>{setGame(g=>{if(g.dn===4)setMode("fourth");else setMode("menu");return g;});},50);
    resetForNew();
  };

  // ==================== ACTION LISTS ====================
  const getQBActions=()=>{
    const a=[];
    for(const id of ["wr1","wr2","te","rb"]){
      if(id==="rb"&&handed)continue;
      const pos=offP[id];if(!pos)continue;
      const pr=throwProbs(id,phase,offP,defPos,defSch,pi);
      a.push({type:"throw",target:id,cat:"throw",label:id.toUpperCase(),sub:`${Math.round(pos.y)>0?"+":""}${Math.round(pos.y)}yds`,op:pr.op,cp:pr.cp,ip:pr.ip});
    }
    a.push({type:"dropback",cat:"move",label:"Drop Back",sub:"Retreat, buy time"});
    a.push({type:"scramble_left",cat:"move",label:"Scramble L",sub:"Roll left"});
    a.push({type:"scramble_right",cat:"move",label:"Scramble R",sub:"Roll right"});
    const cMu=Object.values(matchups).find(m=>m.olId==="c");
    if(!cMu||cMu.integrity>30) a.push({type:"step_up",cat:"move",label:"Step Up",sub:"Forward through gap"});
    if(!lookDir){
      a.push({type:"look_left",cat:"look",label:"👀 Look Left",sub:"Pull safeties left"});
      a.push({type:"look_right",cat:"look",label:"👀 Look Right",sub:"Pull safeties right"});
    }
    if(!handed&&phase<=2)a.push({type:"handoff",cat:"other",label:"Hand Off",sub:"Give to RB"});
    if(selPlay?.statue&&!handed)a.push({type:"statue_handoff",cat:"trick",label:"🗽 Statue!",sub:"Slip to RB"});
    a.push({type:"tuck_run",cat:"other",label:"Tuck & Run",sub:"QB keeps it"});
    return a;
  };

  const getRunActions=()=>{
    const a=[];
    // Arrow-based actions
    for(const arrow of runArrows){
      a.push({type:"arrow",arrow,label:arrow.label,sub:arrow.sub,pct:arrow.pct,color:arrow.color});
    }
    // Always available
    a.push({type:"power",label:"⬇️ Power Forward",sub:"+1-3 yards, safe",pct:85,color:"#8a9ab0"});
    return a;
  };

  // ==================== RENDER ====================
  const renderPlayer=(id,pos,team)=>{
    if(!pos)return null;
    const isOff=team==="off",rost=isOff?OFF:DEF;
    const p=gP(rost,id);if(!p)return null;
    const isOL=p.pos==="OL";
    const hasBall=isOff&&ballSt==="held"&&id===bc&&!["diff_select","menu","playcall","presnap"].includes(mode);
    const px=xS(pos.x),py=yS(pos.y);
    if(py<-40||py>FH+40)return null;
    const sz=isOL?24:30;
    let olC="#2a5a90";
    if(isOL&&!["diff_select","menu","playcall","fourth"].includes(mode)){
      const mu=Object.values(matchups).find(m=>m.olId===id);
      if(mu)olC=mu.integrity>60?"#2a7a40":mu.integrity>30?"#8a6a20":"#8a2020";
    }
    let bdr=isOff?(isOL?"#5588bb":"#4a8ad4"):(p.pos==="DL"?"#b33":"#e05555");
    if(hasBall)bdr="#fbbf24";
    return(<div key={`${team}-${id}`} style={{
      position:"absolute",left:px-sz/2,top:py-sz/2,width:sz,height:sz,borderRadius:"50%",
      background:isOff?(isOL?olC:"#1e56a0"):(p.pos==="DL"?"#7a1a1a":"#b82020"),
      border:`${hasBall?3:2}px solid ${bdr}`,display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:isOL?7:9,fontWeight:700,color:"#fff",zIndex:isOL?9:10,transition:`all ${ANIM}ms ease`,
      fontFamily:"monospace",boxShadow:"0 1px 3px rgba(0,0,0,0.5)"
    }}>{p.lab}</div>);
  };

  const renderBcOverlay=()=>{
    if(!bcP||!isRun||bc==="qb"||mode==="menu"||mode==="playcall"||ballSt!=="held")return null;
    const sz=32,px=xS(bcP.x),py=yS(bcP.y);
    if(py<-40||py>FH+40)return null;
    return(<div style={{position:"absolute",left:px-sz/2,top:py-sz/2,width:sz,height:sz,borderRadius:"50%",
      background:"#1e56a0",border:"3px solid #fbbf24",display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:9,fontWeight:700,color:"#fff",zIndex:12,transition:`all ${ANIM}ms ease`,fontFamily:"monospace"
    }}>{gP(OFF,bc)?.lab}</div>);
  };

  const renderBall=()=>{
    if(["diff_select","menu","playcall","fourth"].includes(mode))return null;
    const bx=xS(ballP.x),by=yS(ballP.y);
    if(by<-40||by>FH+40)return null;
    const isAir=ballSt==="air",isHeld=ballSt==="held";
    return(<React.Fragment>
      <div style={{position:"absolute",left:bx-10,top:by-10+(isHeld?-18:0),width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:isAir?18:15,zIndex:isAir?25:isHeld?20:16,
        transform:`${ballSt==="ground"?"rotate(45deg)":ballSt==="loose"?"rotate(120deg)":isAir?"rotate(-30deg)":"rotate(-15deg)"} scale(${isAir?1.3:1})`,
        transition:isAir&&ballAn?`all ${PANIM}ms ease-out`:`all ${ANIM}ms ease`,
        filter:isAir?"drop-shadow(0 4px 8px rgba(0,0,0,0.6))":isHeld?"drop-shadow(0 1px 2px rgba(0,0,0,0.4))":"none",
        opacity:ballSt==="ground"||ballSt==="loose"?0.7:1,pointerEvents:"none"}}>🏈</div>
      {isHeld&&<div style={{position:"absolute",left:bx-18,top:by-18,width:36,height:36,borderRadius:"50%",
        border:"2px solid rgba(251,191,36,0.5)",zIndex:13,animation:"pulse 1.5s ease-in-out infinite",pointerEvents:"none"}}/>}
    </React.Fragment>);
  };

  const renderGhosts=()=>{
    if(!showGhost||!selPlay||!routes||!["presnap","playcall"].includes(mode))return null;
    const f=selPlay.formation;
    return Object.entries(routes).map(([id,route])=>{
      if(!route||!f[id])return null;
      const color=id==="rb"?"#f97316":"#4a9eff";
      const points=[f[id],...route];
      return points.slice(0,-1).map((pt,i)=>{
        const next=points[i+1];
        const x1=xS(pt.x),y1=yS(pt.y),x2=xS(next.x),y2=yS(next.y);
        if(y1<-40||y1>FH+40||y2<-40||y2>FH+40)return null;
        const angle=Math.atan2(y2-y1,x2-x1)*180/Math.PI;
        const len=Math.sqrt((x2-x1)**2+(y2-y1)**2);
        return(<div key={`g-${id}-${i}`} style={{
          position:"absolute",left:x1,top:y1,width:len,height:2,
          background:color,opacity:0.5,transformOrigin:"0 50%",
          transform:`rotate(${angle}deg)`,zIndex:6,pointerEvents:"none",
        }}>{i===points.length-2&&<div style={{position:"absolute",right:-4,top:-3,width:0,height:0,
          borderLeft:`8px solid ${color}`,borderTop:"4px solid transparent",borderBottom:"4px solid transparent",opacity:0.7}}/>}</div>);
      });
    });
  };

  // Runner arrow overlays on field
  const renderRunArrows=()=>{
    if(!runArrows.length||!bcP||!["runner"].includes(mode))return null;
    const bx=xS(bcP.x),by=yS(bcP.y);
    return runArrows.map((arrow,i)=>{
      const tx=xS(arrow.targetX),ty=yS(arrow.targetY);
      if(ty<-40||ty>FH+40)return null;
      const angle=Math.atan2(ty-by,tx-bx)*180/Math.PI;
      const len=Math.sqrt((tx-bx)**2+(ty-by)**2);
      return(<div key={`ra-${i}`} style={{
        position:"absolute",left:bx,top:by,width:len,height:3,
        background:arrow.color,opacity:0.6,transformOrigin:"0 50%",
        transform:`rotate(${angle}deg)`,zIndex:7,pointerEvents:"none",
      }}><div style={{position:"absolute",right:-5,top:-4,width:0,height:0,
        borderLeft:`10px solid ${arrow.color}`,borderTop:"5px solid transparent",borderBottom:"5px solid transparent",opacity:0.8}}/></div>);
    });
  };

  const dlS=["","1st","2nd","3rd","4th"][game.dn]||"4th";
  const pcPlays = pCat ? (PLAYS[pCat]||[]) : [];
  const pcStaples = pcPlays.filter(p=>!p.cat||p.cat==="staple");
  const pcSituational = pcPlays.filter(p=>p.cat==="situational");
  const pcSpecial = pcPlays.filter(p=>p.cat==="special");
  const blS=game.bo>50?`OPP ${100-game.bo}`:`OWN ${game.bo}`;
  const btn={border:"none",borderRadius:6,cursor:"pointer",fontFamily:"inherit",transition:"all 0.1s"};
  const nd=(bcP||(isRun&&bc==="qb"))?nearD(bcP||qbP,defPos):null;
  const fgD=100-game.bo+17;
  const pCol=pi>60?"#22c55e":pi>30?"#fbbf24":"#ef4444";

  return(
    <div style={{fontFamily:"'SF Mono','Cascadia Code','Courier New',monospace",background:"#080c14",color:"#d0dce8",minHeight:"100vh",padding:"10px 10px 40px"}}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:0.8;transform:scale(1.08)}}
        @keyframes tdBounce{0%{transform:scale(0) rotate(-10deg);opacity:0}50%{transform:scale(1.15) rotate(3deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}
        @keyframes tdGlow{0%,100%{text-shadow:0 0 20px #fbbf24,0 0 40px #f97316}50%{text-shadow:0 0 40px #fbbf24,0 0 80px #f97316,0 0 120px #ef4444}}
        @keyframes contactPulse{0%,100%{box-shadow:0 0 20px rgba(239,68,68,0.3)}50%{box-shadow:0 0 40px rgba(239,68,68,0.6)}}
      `}</style>

      {/* DIFFICULTY SELECT */}
      {mode==="diff_select"&&(
        <div style={{maxWidth:FW,margin:"40px auto",textAlign:"center"}}>
          <div style={{fontSize:28,fontWeight:900,color:"#fbbf24",marginBottom:4}}>🏈 TACTICAL FOOTBALL</div>
          <div style={{fontSize:12,color:"#5a7090",marginBottom:24}}>Choose your difficulty</div>
          <div style={{display:"flex",gap:10,flexDirection:"column",maxWidth:400,margin:"0 auto"}}>
            {[
              {key:"preseason",label:"Preseason",desc:[
        "Defense plays honest — what you see is what you get.",
        "Coach reads are almost always right.",
        "Learn the game here.",
      ],col:"#22c55e"},
              {key:"regular",label:"Regular Season",desc:[
        "Defense disguises sometimes — formations don't always match what they actually do.",
        "Coach is right most of the time, but not always.",
      ],col:"#fbbf24"},
              {key:"playoffs",label:"Playoffs",desc:[
        "Defense is scheming — they'll show one thing and do another.",
        "Coach gives his best read, but the other side is trying to fool him too.",
        "Trust your own eyes.",
      ],col:"#ef4444"},
            ].map(d=>(<button key={d.key} onClick={()=>{setDiff(d.key);setMode("menu");}} style={{...btn,padding:"16px 20px",background:"#0e1520",border:`2px solid ${d.col}44`,color:d.col,textAlign:"left"}}>
              <div style={{fontSize:16,fontWeight:800}}>{d.label}</div>
              <div style={{fontSize:11,color:"#8a9ab0",marginTop:4,lineHeight:1.4}}>{Array.isArray(d.desc)?d.desc.join(" "):d.desc}</div>
            </button>))}
          </div>
        </div>
      )}

      {mode!=="diff_select"&&<React.Fragment>
      {/* SCOREBOARD */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 14px",background:"#10151f",borderRadius:8,border:"1px solid #1a2540",maxWidth:FW,margin:"0 auto 8px"}}>
        <div style={{display:"flex",gap:20,alignItems:"center"}}>
          <div style={{textAlign:"center"}}><div style={{fontSize:10,color:"#4a9eff",fontWeight:700}}>YOU</div><div style={{fontSize:24,fontWeight:800,color:"#4a9eff"}}>{game.sc.you}</div></div>
          <div style={{color:"#2a3550"}}>vs</div>
          <div style={{textAlign:"center"}}><div style={{fontSize:10,color:"#ef4444",fontWeight:700}}>CPU</div><div style={{fontSize:24,fontWeight:800,color:"#ef4444"}}>{game.sc.cpu}</div></div>
        </div>
        <div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:700}}>{dlS} & {game.dst}</div><div style={{fontSize:11,color:"#5a7090"}}>{blS} · Q{game.q}</div></div>
      </div>

      {/* FIELD */}
      <div style={{position:"relative",width:FW,height:FH,margin:"0 auto",background:"linear-gradient(180deg,#165c28 0%,#1a6830 50%,#165c28 100%)",borderRadius:6,overflow:"hidden",border:"2px solid #2a8040"}}>
        {Array.from({length:14},(_,i)=>{
          const yo=(i-6.5)*5+camY;const y=yS(yo);if(y<-10||y>FH+10)return null;
          const num=game.bo+yo;const d=num>50?100-num:num;
          return(<div key={`yl${i}`}><div style={{position:"absolute",left:0,right:0,top:y,height:1,background:"rgba(255,255,255,0.12)"}}/>{d>=0&&d<=50&&<div style={{position:"absolute",left:6,top:y-7,fontSize:9,color:"rgba(255,255,255,0.2)",fontWeight:600}}>{Math.round(d)}</div>}</div>);
        })}
        <div style={{position:"absolute",left:0,right:0,top:yS(0)-1.5,height:3,background:"rgba(255,215,0,0.55)",zIndex:5}}/>
        {game.dst<=30&&<div style={{position:"absolute",left:0,right:0,top:yS(game.dst)-1,height:2,background:"rgba(74,158,255,0.45)",zIndex:5}}/>}
        {renderGhosts()}
        {renderRunArrows()}
        {Object.entries(offP).map(([id,pos])=>renderPlayer(id,pos,"off"))}
        {Object.entries(defPos).map(([id,pos])=>renderPlayer(id,pos,"def"))}
        {renderBcOverlay()}
        {renderBall()}
        <Fireworks show={showTD}/>
        {defSch&&!["diff_select","menu","playcall","fourth"].includes(mode)&&(
          <div style={{position:"absolute",top:5,left:"50%",transform:"translateX(-50%)",background:"rgba(200,40,40,0.75)",padding:"2px 10px",borderRadius:4,fontSize:10,fontWeight:700,color:"#fff",zIndex:30}}>
            {defSch.name}{lookDir&&<span style={{marginLeft:6,color:"#fbbf24"}}>👀{lookDir==="left"?"←":"→"}</span>}
          </div>
        )}
        {!["diff_select","menu","playcall","fourth"].includes(mode)&&Object.entries(matchups).length>0&&(
          <div style={{position:"absolute",top:5,left:8,display:"flex",gap:3,zIndex:30}}>
            {Object.entries(OL_BLK).map(([dl,ol])=>{
              const mu=matchups[dl];if(!mu)return null;
              const c=mu.integrity>60?"#22c55e":mu.integrity>30?"#fbbf24":"#ef4444";
              return<div key={dl} title={`${ol.toUpperCase()} vs ${dl.toUpperCase()}: ${Math.round(mu.integrity)}%`} style={{width:8,height:8,borderRadius:"50%",background:c,border:"1px solid rgba(0,0,0,0.3)"}}/>;
            })}
            <span style={{fontSize:9,color:pCol,fontWeight:700,marginLeft:4}}>{pi}%</span>
          </div>
        )}
        {!["diff_select","menu","playcall","result","touchdown","fourth","presnap","contact"].includes(mode)&&(
          <div style={{position:"absolute",bottom:5,left:"50%",transform:"translateX(-50%)",display:"flex",gap:8,alignItems:"center",background:"rgba(0,0,0,0.6)",padding:"3px 12px",borderRadius:4,fontSize:10,color:"#aaa",zIndex:30}}>
            {isRun?(<React.Fragment><span>{isCatch?`YAC ${runAct}/${MAX_YAC}`:`Run #${runAct}`}</span><span style={{color:"#333"}}>|</span><span>Nearest: {nd?`${nd.p?.lab||"?"} ${nd.d.toFixed(1)}yds`:"—"}</span></React.Fragment>):(<React.Fragment><span>Phase {phase}</span><span style={{color:"#333"}}>|</span><span style={{color:pCol,fontWeight:700}}>Pocket {pi}%</span></React.Fragment>)}
          </div>
        )}
        {ballSt==="air"&&ballAn&&<div style={{position:"absolute",top:FH-28,left:"50%",transform:"translateX(-50%)",background:"rgba(251,191,36,0.85)",padding:"2px 12px",borderRadius:4,fontSize:11,fontWeight:800,color:"#000",zIndex:30}}>IN THE AIR!</div>}
        {mode==="touchdown"&&(
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:40}}>
            <div style={{fontSize:64,animation:"tdBounce 0.6s ease-out forwards",marginBottom:8}}>🏈</div>
            <div style={{fontSize:42,fontWeight:900,color:"#fbbf24",animation:"tdGlow 1.5s ease-in-out infinite",letterSpacing:4}}>TOUCHDOWN!</div>
            <div style={{fontSize:16,color:"#fff",marginTop:8,fontWeight:600}}>+7 points</div>
          </div>
        )}
      </div>

      {/* COACH + NARRATIVE */}
      {coach&&<div style={{maxWidth:FW,margin:"4px auto 0",padding:"5px 12px",background:"#101520",borderRadius:6,borderLeft:"3px solid #4a9eff",fontSize:11,color:"#8ab4e0",lineHeight:1.4}}>🎧 {coach}</div>}
      {narr&&<div style={{maxWidth:FW,margin:"4px auto 0",padding:"5px 12px",background:"#12181f",borderRadius:6,borderLeft:"3px solid #fbbf24",fontSize:12,color:"#e0d8c0",fontStyle:"italic"}}>{narr}</div>}

      {/* CONTROLS */}
      <div style={{maxWidth:FW,margin:"6px auto 0"}}>

        {mode==="menu"&&!pCat&&(
          <div>
            <div style={{fontSize:11,color:"#5a7090",marginBottom:6,fontWeight:700,letterSpacing:1}}>CALL YOUR PLAY</div>
            <div style={{display:"flex",gap:8}}>
              {[{cat:"run",icon:"🏃",label:"RUN",desc:[
        "Hand off and run",
      ],col:"#f97316"},
                {cat:"pass",icon:"🎯",label:"PASS",desc:[
        "Throw to a receiver",
      ],col:"#4a9eff"},
                {cat:"trick",icon:"🎪",label:"TRICK",desc:[
        "Deception plays",
      ],col:"#a855f7"},
              ].map(c=>(<button key={c.cat} onClick={()=>{setPCat(c.cat);setMode("playcall");}} style={{...btn,flex:1,padding:"14px 8px",background:"#0e1520",border:`2px solid ${c.col}44`,color:c.col,fontSize:15,fontWeight:800}}>
                <div>{c.icon} {c.label}</div><div style={{fontSize:10,color:"#5a7090",fontWeight:400,marginTop:4}}>{Array.isArray(c.desc)?c.desc.join(" "):c.desc}</div>
              </button>))}
            </div>
            {game.dn===4&&<button onClick={()=>setMode("fourth")} style={{...btn,marginTop:8,width:"100%",padding:10,background:"#1a1510",border:"1px solid #4a3010",color:"#f97316",fontSize:13,fontWeight:700}}>🦵 KICK OPTIONS</button>}
          </div>
        )}

        {mode==="playcall"&&pCat&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{fontSize:11,color:"#5a7090",fontWeight:700}}>{pCat.toUpperCase()} PLAYS</div>
              <button onClick={()=>{setPCat(null);setMode("menu");setSelPlay(null);setShowGhost(false);}} style={{...btn,padding:"3px 10px",background:"#1a1520",border:"1px solid #2a2540",color:"#8a8ab0",fontSize:10}}>← Back</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {pcStaples.length>0&&<React.Fragment>
                {pCat==="run"&&<div style={{fontSize:9,color:"#4a6a90",fontWeight:700,letterSpacing:1,marginTop:2}}>YOUR PLAYBOOK</div>}
                {pcStaples.map(p=><button key={p.name} onClick={()=>selectPlay(p)} style={{...btn,background:selPlay?.name===p.name?"#162a4a":"#0e1520",border:selPlay?.name===p.name?"2px solid #3a7acc":"1px solid #1a2540",padding:selPlay?.name===p.name?"8px 12px":"6px 12px",textAlign:"left",color:"#d0dce8",width:"100%"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:14}}>{p.icon}</span>
                    <span style={{fontSize:13,fontWeight:700}}>{p.name}</span>
                    {selPlay?.name!==p.name&&<span style={{fontSize:10,color:"#6a7a90",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}> — {p.brief}</span>}
                  </div>
                  {selPlay?.name===p.name&&<div style={{marginTop:4}}>
                    <div style={{fontSize:10,color:"#8a9ab0",lineHeight:1.4,marginBottom:6}}>{p.brief}</div>
                    <div style={{fontSize:10,color:"#6a7a90",marginBottom:6}}>{Array.isArray(p.desc)?p.desc.map((line,i)=><div key={i} style={{display:"flex",gap:6,marginBottom:3,lineHeight:1.4}}><span style={{color:"#3a5570",flexShrink:0}}>•</span><span>{line}</span></div>):<div style={{lineHeight:1.4}}>{p.desc}</div>}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {p.strong&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:3,background:"#22c55e22",color:"#22c55e",border:"1px solid #22c55e44"}}>✓ vs {p.strong}: {p.strongWhy}</span>}
                      {p.weak&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:3,background:"#ef444422",color:"#ef4444",border:"1px solid #ef444444"}}>✗ vs {p.weak}: {p.weakWhy}</span>}
                    </div>
                  </div>}
                </button>)}
              </React.Fragment>}
              {pcSituational.length>0&&<React.Fragment>
                <div style={{fontSize:9,color:"#4a6a90",fontWeight:700,letterSpacing:1,marginTop:6,borderTop:"1px solid #1a2540",paddingTop:6}}>SITUATIONAL</div>
                {pcSituational.map(p=><button key={p.name} onClick={()=>selectPlay(p)} style={{...btn,background:selPlay?.name===p.name?"#162a4a":"#0e1520",border:selPlay?.name===p.name?"2px solid #3a7acc":"1px solid #1a2540",padding:selPlay?.name===p.name?"8px 12px":"6px 12px",textAlign:"left",color:"#d0dce8",width:"100%"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:14}}>{p.icon}</span>
                    <span style={{fontSize:13,fontWeight:700}}>{p.name}</span>
                    {selPlay?.name!==p.name&&<span style={{fontSize:10,color:"#6a7a90",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}> — {p.brief}</span>}
                  </div>
                  {selPlay?.name===p.name&&<div style={{marginTop:4}}>
                    <div style={{fontSize:10,color:"#8a9ab0",lineHeight:1.4,marginBottom:6}}>{p.brief}</div>
                    <div style={{fontSize:10,color:"#6a7a90",marginBottom:6}}>{Array.isArray(p.desc)?p.desc.map((line,i)=><div key={i} style={{display:"flex",gap:6,marginBottom:3,lineHeight:1.4}}><span style={{color:"#3a5570",flexShrink:0}}>•</span><span>{line}</span></div>):<div style={{lineHeight:1.4}}>{p.desc}</div>}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {p.strong&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:3,background:"#22c55e22",color:"#22c55e",border:"1px solid #22c55e44"}}>✓ vs {p.strong}: {p.strongWhy}</span>}
                      {p.weak&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:3,background:"#ef444422",color:"#ef4444",border:"1px solid #ef444444"}}>✗ vs {p.weak}: {p.weakWhy}</span>}
                    </div>
                  </div>}
                </button>)}
              </React.Fragment>}
              {pcSpecial.length>0&&<React.Fragment>
                <div style={{fontSize:9,color:"#4a6a90",fontWeight:700,letterSpacing:1,marginTop:6,borderTop:"1px solid #1a2540",paddingTop:6}}>SPECIALTY</div>
                {pcSpecial.map(p=><button key={p.name} onClick={()=>selectPlay(p)} style={{...btn,background:selPlay?.name===p.name?"#162a4a":"#0e1520",border:selPlay?.name===p.name?"2px solid #3a7acc":"1px solid #1a2540",padding:selPlay?.name===p.name?"8px 12px":"6px 12px",textAlign:"left",color:"#d0dce8",width:"100%"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:14}}>{p.icon}</span>
                    <span style={{fontSize:13,fontWeight:700}}>{p.name}</span>
                    {selPlay?.name!==p.name&&<span style={{fontSize:10,color:"#6a7a90",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}> — {p.brief}</span>}
                  </div>
                  {selPlay?.name===p.name&&<div style={{marginTop:4}}>
                    <div style={{fontSize:10,color:"#8a9ab0",lineHeight:1.4,marginBottom:6}}>{p.brief}</div>
                    <div style={{fontSize:10,color:"#6a7a90",marginBottom:6}}>{Array.isArray(p.desc)?p.desc.map((line,i)=><div key={i} style={{display:"flex",gap:6,marginBottom:3,lineHeight:1.4}}><span style={{color:"#3a5570",flexShrink:0}}>•</span><span>{line}</span></div>):<div style={{lineHeight:1.4}}>{p.desc}</div>}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {p.strong&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:3,background:"#22c55e22",color:"#22c55e",border:"1px solid #22c55e44"}}>✓ vs {p.strong}: {p.strongWhy}</span>}
                      {p.weak&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:3,background:"#ef444422",color:"#ef4444",border:"1px solid #ef444444"}}>✗ vs {p.weak}: {p.weakWhy}</span>}
                    </div>
                  </div>}
                </button>)}
              </React.Fragment>}
            </div>
            {selPlay&&<button onClick={goPresnap} style={{...btn,marginTop:8,width:"100%",padding:11,background:"linear-gradient(135deg,#16a34a,#15803d)",color:"#fff",fontSize:15,fontWeight:800,letterSpacing:2}}>LINE UP →</button>}
          </div>
        )}

        {mode==="presnap"&&(
          <div style={{background:"#10151f",borderRadius:8,padding:12,border:"1px solid #2a3550"}}>
            <div style={{fontSize:13,color:"#f97316",fontWeight:700,marginBottom:4}}>PRE-SNAP READ</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div style={{fontSize:11,color:"#8a9ab0"}}>Your play: <span style={{color:"#4a9eff",fontWeight:700}}>{selPlay?.name}</span></div>
              {defSch&&selPlay&&<span style={{fontSize:10,fontWeight:700,color:mxColor(MX[selPlay.name]?.[defSch.key]||0),background:`${mxColor(MX[selPlay.name]?.[defSch.key]||0)}22`,padding:"2px 8px",borderRadius:4}}>{mxLabel(MX[selPlay.name]?.[defSch.key]||0)} MATCHUP</span>}
            </div>
            <div style={{fontSize:11,color:"#8a9ab0",marginBottom:2}}>Defense: <span style={{color:"#ef4444",fontWeight:700}}>{defSch?.name}</span></div>
            <div style={{fontSize:10,color:"#6a7a90",marginBottom:10}}>{defSch?.desc&&Array.isArray(defSch.desc)?defSch.desc.map((line,i)=><div key={i} style={{display:"flex",gap:5,marginBottom:2,lineHeight:1.4}}><span style={{color:"#3a5570",flexShrink:0}}>•</span><span>{line}</span></div>):<div style={{lineHeight:1.4}}>{defSch?.desc}</div>}</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={snap} style={{...btn,flex:2,padding:12,background:"linear-gradient(135deg,#16a34a,#15803d)",color:"#fff",fontSize:15,fontWeight:800,letterSpacing:2}}>⚡ SNAP</button>
              <button onClick={()=>{setMode("playcall");setShowGhost(true);}} style={{...btn,flex:1,padding:12,background:"#1a1510",border:"1px solid #4a3010",color:"#f97316",fontSize:13,fontWeight:700}}>🔊 AUDIBLE</button>
            </div>
          </div>
        )}

        {mode==="rpo"&&(
          <div style={{background:"#10151f",borderRadius:8,padding:12,border:"2px solid #f97316"}}>
            <div style={{fontSize:14,fontWeight:800,color:"#f97316",marginBottom:6}}>🏈 RUN-PASS OPTION</div>
            <div style={{fontSize:11,color:"#8a9ab0",marginBottom:10}}>Hand it off as designed, or pull the ball and throw?</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>doRPO("handoff")} style={{...btn,flex:1,padding:12,background:"#0a1810",border:"2px solid #22c55e",color:"#22c55e",fontSize:14,fontWeight:800}}>🏈 HAND OFF<div style={{fontSize:10,color:"#4a8a50",fontWeight:400,marginTop:2}}>Run as planned</div></button>
              <button onClick={()=>doRPO("pull")} style={{...btn,flex:1,padding:12,background:"#0a1020",border:"2px solid #4a9eff",color:"#4a9eff",fontSize:14,fontWeight:800}}>👀 PULL IT<div style={{fontSize:10,color:"#3a6a90",fontWeight:400,marginTop:2}}>Keep & throw</div></button>
            </div>
          </div>
        )}

        {mode==="fourth"&&(
          <div style={{background:"#10151f",borderRadius:8,padding:14,border:"2px solid #f97316"}}>
            <div style={{fontSize:15,fontWeight:800,color:"#f97316",marginBottom:8}}>4TH DOWN</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>doFourth("punt")} style={{...btn,flex:1,padding:"12px 8px",background:"#0e1520",border:"1px solid #1a2540",color:"#8ab4e0",fontSize:13,fontWeight:700}}>📢 Punt</button>
              <button onClick={()=>doFourth("fg")} style={{...btn,flex:1,padding:"12px 8px",background:fgD<=50?"#0e1a10":"#0e1520",border:`1px solid ${fgD<=50?"#2a5a2a":"#1a2540"}`,color:fgD<=50?"#4ade80":"#8ab4e0",fontSize:13,fontWeight:700}}>🥅 FG ({fgD}yds)</button>
              <button onClick={()=>doFourth("goforit")} style={{...btn,flex:1,padding:"12px 8px",background:"#1a1008",border:"1px solid #4a2a08",color:"#f97316",fontSize:13,fontWeight:700}}>💪 Go For It</button>
            </div>
          </div>
        )}

        {(mode==="snapping"||mode==="animating")&&<div style={{textAlign:"center",padding:12,color:"#fbbf24",fontSize:13,fontWeight:700}}>⏱ {mode==="snapping"?"Ball snapped...":"Play developing..."}</div>}

        {mode==="decision"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{fontSize:11,color:"#fbbf24",fontWeight:700}}>🏈 QB DECISION</div>
              <div style={{fontSize:10}}><span style={{color:"#5a7090"}}>Phase {phase}</span> <span style={{color:pCol,fontWeight:700}}>Pocket {pi}%</span></div>
            </div>
            <div style={{marginBottom:6}}>
              <div style={{fontSize:10,color:"#5a7090",marginBottom:4,fontWeight:600}}>THROW TO:</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                {getQBActions().filter(a=>a.cat==="throw").map(a=>(
                  <button key={a.target} onClick={()=>doQB(a)} style={{...btn,background:"#0e1520",border:`1px solid ${a.op.col}88`,padding:"6px 8px",color:"#d0dce8",display:"flex",flexDirection:"column",gap:4,textAlign:"left"}}>
                    <div style={{display:"flex",justifyContent:"space-between",width:"100%"}}>
                      <span style={{fontWeight:800,fontSize:13}}>{a.label} <span style={{fontSize:10,color:"#8ab4e0"}}>{a.sub}</span></span>
                      <span style={{fontSize:8,fontWeight:700,color:"#000",background:a.op.col,padding:"1px 4px",borderRadius:3}}>{a.op.lab}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",width:"100%",fontSize:11,background:"#05080c",padding:"3px 6px",borderRadius:4,fontFamily:"monospace"}}>
                      <span style={{color:"#4ade80",fontWeight:700}}>HIT:{a.cp}%</span>
                      <span style={{color:"#f87171",fontWeight:700}}>INT:{a.ip}%</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {getQBActions().filter(a=>a.cat==="move").map(a=>(<button key={a.type} onClick={()=>doQB(a)} style={{...btn,background:"#0e1520",border:"1px solid #1a2540",padding:"5px 8px",color:"#8ab4e0",fontSize:10,fontWeight:600,flex:"1 1 auto"}}>{a.label}<div style={{fontSize:8,color:"#4a6080"}}>{a.sub}</div></button>))}
              {getQBActions().filter(a=>a.cat==="look").map(a=>(<button key={a.type} onClick={()=>doQB(a)} style={{...btn,background:"#101820",border:"1px solid #2a3a50",padding:"5px 8px",color:"#60a0d0",fontSize:10,fontWeight:600,flex:"1 1 auto"}}>{a.label}<div style={{fontSize:8,color:"#3a6a90"}}>{a.sub}</div></button>))}
              {getQBActions().filter(a=>a.cat==="trick").map(a=>(<button key={a.type} onClick={()=>doQB(a)} style={{...btn,background:"#1a1030",border:"1px solid #4a2a6a",padding:"5px 8px",color:"#a855f7",fontSize:10,fontWeight:600,flex:"1 1 auto"}}>{a.label}<div style={{fontSize:8,color:"#6a4a90"}}>{a.sub}</div></button>))}
              {getQBActions().filter(a=>a.cat==="other").map(a=>(<button key={a.type} onClick={()=>doQB(a)} style={{...btn,background:"#1a1510",border:"1px solid #3a2a10",padding:"5px 8px",color:"#d4a034",fontSize:10,fontWeight:600,flex:"1 1 auto"}}>{a.label}<div style={{fontSize:8,color:"#7a6030"}}>{a.sub}</div></button>))}
            </div>
          </div>
        )}

        {mode==="runner"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div style={{fontSize:11,color:"#f59e0b",fontWeight:700}}>🏃 {bc.toUpperCase()} — MAKE A MOVE</div>
              <div style={{fontSize:10,color:"#5a7090"}}>{isCatch?`YAC ${runAct}/${MAX_YAC}`:`Move #${runAct+1}`}</div>
            </div>
            {nd&&<div style={{fontSize:10,marginBottom:4,color:nd.d<3?"#ef4444":nd.d<6?"#fbbf24":"#22c55e"}}>
              {nd.d<3?`⚠️ ${nd.p?.lab} closing! (${nd.d.toFixed(1)}yds)`:nd.d<6?`⚡ ${nd.p?.lab} nearby (${nd.d.toFixed(1)}yds)`:`✓ Open field — nearest ${nd.p?.lab} ${nd.d.toFixed(1)}yds`}
            </div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
              {getRunActions().map((a,i)=>(
                <button key={i} onClick={()=>doRun(a)} style={{...btn,background:"#0e1520",border:`1px solid ${a.color}44`,padding:"8px 10px",textAlign:"left",color:"#d0dce8"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:12,fontWeight:700,color:a.color}}>{a.label}</span>
                    <span style={{fontSize:9,fontWeight:700,color:a.color,background:`${a.color}22`,padding:"1px 5px",borderRadius:3}}>{a.pct}%</span>
                  </div>
                  <div style={{fontSize:9,color:"#6a7a90",marginTop:2}}>{a.sub}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {mode==="contact"&&contactData&&(
          <div style={{background:"#10151f",borderRadius:8,padding:14,border:"2px solid #ef4444",animation:"contactPulse 1s ease-in-out infinite"}}>
            <div style={{fontSize:16,fontWeight:900,color:"#ef4444",marginBottom:4,letterSpacing:1}}>⚠️ CONTACT!</div>
            <div style={{fontSize:11,color:"#8a9ab0",marginBottom:10}}>
              {contactData.nd.p?.lab||"Defender"} at {contactData.nd.d.toFixed(1)}yds — {contactData.d3} defender{contactData.d3>1?"s":""} nearby
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {contactData.options.map(o=>(
                <button key={o.type} onClick={()=>resolveContact(o)} style={{...btn,background:"#0a0e18",border:"1px solid #2a1a1a",padding:"8px 10px",textAlign:"left",color:"#d0dce8"}}>
                  <div style={{fontSize:12,fontWeight:700,marginBottom:4}}>{o.label}</div>
                  {o.type!=="dive"?(<React.Fragment>
                    <div style={{fontSize:10,color:"#22c55e"}}>Break free: {o.brk}%</div>
                    <div style={{fontSize:10,color:"#f87171"}}>Fumble: {o.fum}%</div>
                    <div style={{fontSize:10,color:"#8a8a8a"}}>Tackled: {o.tck}%</div>
                  </React.Fragment>):(<React.Fragment>
                    <div style={{fontSize:10,color:"#fbbf24"}}>+{o.yds} yards (safe)</div>
                    <div style={{fontSize:10,color:"#f87171"}}>Fumble: {o.fum}%</div>
                  </React.Fragment>)}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode==="result"&&result&&(
          <div style={{background:"#10151f",borderRadius:8,padding:12,border:`1px solid ${result.turnover?"#ef4444":result.incomplete?"#fbbf24":result.yds>=10?"#22c55e":"#1a2540"}`}}>
            <div style={{fontSize:17,fontWeight:800,marginBottom:4,color:result.turnover?"#ef4444":result.incomplete?"#fbbf24":result.yds>=10?"#22c55e":result.yds>=0?"#d0dce8":"#ef4444"}}>
              {result.turnover?"💥 TURNOVER":result.incomplete?"✋ INCOMPLETE":result.yds>=15?"🔥 BIG PLAY!":result.yds>=0?`+${result.yds} YARDS`:`${result.yds} YARDS`}
            </div>
            <div style={{fontSize:12,color:"#8a9ab0",marginBottom:4}}>{result.desc}</div>
            {debrief&&<div style={{fontSize:10,color:"#6a8ab0",marginBottom:8,lineHeight:1.4,padding:"4px 8px",background:"#0a0e18",borderRadius:4,borderLeft:"2px solid #4a6a90"}}>📋 {debrief}</div>}
            <div style={{fontSize:10,color:"#4a5a70",marginBottom:8}}>{selPlay?.name} vs {defSch?.name}</div>
            <button onClick={advance} style={{...btn,width:"100%",padding:10,background:"#162a4a",color:"#4a9eff",border:"1px solid #2a5a9a",fontSize:13,fontWeight:700}}>NEXT PLAY →</button>
          </div>
        )}

        {mode==="touchdown"&&(
          <div style={{background:"#10151f",borderRadius:8,padding:16,border:"2px solid #fbbf24",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:900,color:"#fbbf24",marginBottom:4}}>🏈 TOUCHDOWN! 🏈</div>
            <div style={{fontSize:14,color:"#22c55e",fontWeight:700,marginBottom:4}}>+7 POINTS</div>
            <div style={{fontSize:12,color:"#8a9ab0",marginBottom:10}}>{result?.desc}</div>
            <button onClick={advance} style={{...btn,width:"100%",padding:12,background:"linear-gradient(135deg,#fbbf24,#f97316)",color:"#000",fontSize:14,fontWeight:800,letterSpacing:1}}>KICKOFF →</button>
          </div>
        )}

        {log.length>0&&<div style={{marginTop:8,maxHeight:70,overflowY:"auto",fontSize:10,color:"#4a5a70"}}>{log.map((e,i)=><div key={i} style={{padding:"1px 0",opacity:1-i*0.06}}>{e}</div>)}</div>}
      </div>
      </React.Fragment>}
    </div>
  );
}
