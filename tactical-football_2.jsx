import { useState, useEffect, useCallback, useRef } from "react";

const FIELD_W = 680, FIELD_H = 460, PX_PER_YARD = FIELD_H / 38;
const ANIM_MS = 600, PASS_ANIM_MS = 480, MAX_QB_ACTIONS = 4;
const rand = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const R = (x, y) => ({ x, y });
function fieldDist(a, b) { const dx = (a.x - b.x) * 0.533, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }

const P = (id, pos, label, spd, str, skl) => ({ id, pos, label, spd, str, skl });
const OFF = [
  P("qb","QB","QB",6,5,9), P("rb","RB","RB",8,7,7),
  P("wr1","WR","W1",9,4,8), P("wr2","WR","W2",8,5,7), P("te","TE","TE",6,8,6),
  P("ol1","OL","▪",3,9,5), P("ol2","OL","▪",3,9,5), P("c","OL","▪",3,10,5),
  P("ol4","OL","▪",3,9,5), P("ol5","OL","▪",3,9,5),
];
const DEF = [
  P("de1","DL","DE",6,9,6), P("dt1","DL","DT",4,10,5),
  P("dt2","DL","DT",4,10,5), P("de2","DL","DE",6,9,6),
  P("olb1","LB","OLB",7,7,7), P("mlb","LB","MLB",7,8,8), P("olb2","LB","OLB",7,7,7),
  P("cb1","CB","CB",9,4,8), P("cb2","CB","CB",9,4,7),
  P("ss","S","SS",8,6,7), P("fs","S","FS",9,5,8),
];
const getP = (roster, id) => roster.find(p => p.id === id);
const OL_IDS = ["ol1","ol2","c","ol4","ol5"];
const DL_IDS = ["de1","dt1","dt2","de2"];
const CB_ASSIGN = { cb1: "wr1", cb2: "wr2" };

// 1-to-1 BLOCKING ASSIGNMENTS: each OL blocks a specific rusher
const OL_BLOCK_ASSIGN = { ol1: "de1", ol2: "dt1", c: null, ol4: "dt2", ol5: "de2" };
// Center picks up first unblocked blitzer (LB or extra rusher)

const routeLib = {
  go:(sx,sy,d)=>[R(sx+d*1,sy+5),R(sx+d*1,sy+12),R(sx+d*1,sy+21),R(sx+d*1,sy+30)],
  slant:(sx,sy,d)=>[R(sx+d*4,sy+3),R(sx+d*10,sy+6),R(sx+d*16,sy+9),R(sx+d*20,sy+12)],
  post:(sx,sy,d)=>[R(sx,sy+5),R(sx,sy+12),R(sx+d*10,sy+18),R(sx+d*16,sy+24)],
  out:(sx,sy,d)=>[R(sx,sy+5),R(sx,sy+10),R(sx-d*10,sy+10),R(sx-d*16,sy+10)],
  curl:(sx,sy)=>[R(sx,sy+5),R(sx,sy+11),R(sx,sy+10),R(sx,sy+9)],
  flat:(sx,sy,d)=>[R(sx+d*6,sy+1),R(sx+d*14,sy+2),R(sx+d*20,sy+3),R(sx+d*24,sy+4)],
  screen:(sx,sy,d)=>[R(sx+d*4,sy-2),R(sx+d*10,sy-3),R(sx+d*14,sy-2),R(sx+d*16,sy+2)],
  block:(sx,sy)=>[R(sx,sy+1),R(sx,sy+1.5),R(sx,sy+1.5),R(sx,sy+1.5)],
  dive:(sx,sy)=>[R(sx,sy-2),R(sx,sy+2),R(sx,sy+6),R(sx,sy+10)],
  sweep:(sx,sy,d)=>[R(sx+d*6,sy-3),R(sx+d*16,sy-1),R(sx+d*22,sy+3),R(sx+d*24,sy+8)],
  seam:(sx,sy,d)=>[R(sx+d*2,sy+1),R(sx+d*2,sy+5),R(sx+d*2,sy+12),R(sx+d*2,sy+20)],
  wheel:(sx,sy,d)=>[R(sx+d*6,sy+1),R(sx+d*12,sy+5),R(sx+d*10,sy+12),R(sx+d*8,sy+20)],
  checkdown:(sx,sy,d)=>[R(sx+d*3,sy-1),R(sx+d*6,sy+1),R(sx+d*8,sy+3),R(sx+d*10,sy+5)],
};

const FORM_I={qb:R(50,-3),rb:R(50,-7),wr1:R(8,0),wr2:R(92,0),te:R(66,0),ol1:R(38,0),ol2:R(43,0),c:R(50,0),ol4:R(57,0),ol5:R(62,0)};
const FORM_SG={qb:R(50,-5),rb:R(42,-5),wr1:R(6,0),wr2:R(94,0),te:R(68,0),ol1:R(38,0),ol2:R(43,0),c:R(50,0),ol4:R(57,0),ol5:R(62,0)};
const FORM_SP={qb:R(50,-5),rb:R(43,-5),wr1:R(5,0),wr2:R(95,0),te:R(78,0),ol1:R(38,0),ol2:R(43,0),c:R(50,0),ol4:R(57,0),ol5:R(62,0)};

const PLAYS = [
  {name:"HB Dive",icon:"🏈",type:"run",desc:"Power up the gut",formation:FORM_I,routes:{wr1:(f)=>routeLib.go(f.wr1.x,0,0),wr2:(f)=>routeLib.go(f.wr2.x,0,0),te:(f)=>routeLib.block(f.te.x,0),rb:(f)=>routeLib.dive(f.rb.x,f.rb.y)}},
  {name:"HB Sweep",icon:"↗️",type:"run",desc:"Speed to the edge",formation:FORM_I,routes:{wr1:(f)=>routeLib.block(f.wr1.x,0),wr2:(f)=>routeLib.go(f.wr2.x,0,0),te:(f)=>routeLib.block(f.te.x,0),rb:(f)=>routeLib.sweep(f.rb.x,f.rb.y,-1)}},
  {name:"Quick Slants",icon:"⚡",type:"pass",desc:"Fast timing inside",formation:FORM_SG,routes:{wr1:(f)=>routeLib.slant(f.wr1.x,0,1),wr2:(f)=>routeLib.slant(f.wr2.x,0,-1),te:(f)=>routeLib.seam(f.te.x,0,-1),rb:(f)=>routeLib.checkdown(f.rb.x,f.rb.y,-1)}},
  {name:"Deep Post",icon:"🎯",type:"pass",desc:"WR1 deep — big play",formation:FORM_SG,routes:{wr1:(f)=>routeLib.post(f.wr1.x,0,1),wr2:(f)=>routeLib.out(f.wr2.x,0,1),te:(f)=>routeLib.curl(f.te.x,0),rb:(f)=>routeLib.checkdown(f.rb.x,f.rb.y,-1)}},
  {name:"Play Action",icon:"🎭",type:"pass",desc:"Fake run, hit seam",formation:FORM_I,routes:{wr1:(f)=>routeLib.post(f.wr1.x,0,1),wr2:(f)=>routeLib.out(f.wr2.x,0,1),te:(f)=>routeLib.seam(f.te.x,0,-1),rb:(f)=>routeLib.dive(f.rb.x,f.rb.y)},playAction:true},
  {name:"Screen Pass",icon:"🪤",type:"pass",desc:"Dump behind the rush",formation:FORM_SG,routes:{wr1:(f)=>routeLib.go(f.wr1.x,0,0),wr2:(f)=>routeLib.go(f.wr2.x,0,0),te:(f)=>routeLib.flat(f.te.x,0,-1),rb:(f)=>routeLib.screen(f.rb.x,f.rb.y,-1)}},
  {name:"Wheel Route",icon:"🎡",type:"pass",desc:"RB swings deep",formation:FORM_SP,routes:{wr1:(f)=>routeLib.slant(f.wr1.x,0,1),wr2:(f)=>routeLib.go(f.wr2.x,0,0),te:(f)=>routeLib.out(f.te.x,0,1),rb:(f)=>routeLib.wheel(f.rb.x,f.rb.y,-1)}},
];

function getRoutes(play) {
  const r = {};
  for (const id of ["wr1","wr2","te","rb"]) {
    if (play.routes[id]) r[id] = play.routes[id](play.formation);
  }
  return r;
}

// ==================== DEFENSE SCHEMES WITH DESCRIPTIONS ====================
const DEF_SCHEMES = {
  base43:{
    name:"4-3 Base",
    desc:"Standard — 4 linemen, 3 linebackers. Balanced vs run and pass.",
    tip:"Safe choice. No glaring weaknesses.",
    pos:{de1:R(34,1.5),dt1:R(46,1),dt2:R(54,1),de2:R(66,1.5),olb1:R(28,5),mlb:R(50,5),olb2:R(72,5),cb1:R(10,7),cb2:R(90,7),ss:R(55,14),fs:R(45,18)}
  },
  nickel:{
    name:"Nickel",
    desc:"Extra defensive back replaces a linebacker. Built to stop the pass.",
    tip:"Deep routes are covered. Try runs or quick passes.",
    pos:{de1:R(36,1.5),dt1:R(46,1),dt2:R(54,1),de2:R(64,1.5),olb1:R(30,5),mlb:R(50,5),olb2:R(78,5),cb1:R(8,6),cb2:R(92,6),ss:R(60,12),fs:R(40,18)}
  },
  blitz:{
    name:"All-Out Blitz",
    desc:"Linebackers rush the QB. Extreme pressure but leaves receivers open.",
    tip:"Get rid of it fast or get sacked. Quick throws punish this.",
    pos:{de1:R(34,1.5),dt1:R(46,1),dt2:R(54,1),de2:R(66,1.5),olb1:R(38,2.5),mlb:R(50,3),olb2:R(62,2.5),cb1:R(10,7),cb2:R(90,7),ss:R(55,8),fs:R(45,15)}
  },
  cover2:{
    name:"Cover 2",
    desc:"Two safeties play deep, each covering half the field. Shuts down deep balls.",
    tip:"Attack the middle of the field between the safeties, or run.",
    pos:{de1:R(34,1.5),dt1:R(46,1),dt2:R(54,1),de2:R(66,1.5),olb1:R(30,5),mlb:R(50,5.5),olb2:R(70,5),cb1:R(10,4),cb2:R(90,4),ss:R(30,18),fs:R(70,18)}
  },
  goalline:{
    name:"Goal Line Stack",
    desc:"Everyone near the line of scrimmage. Maximum run stopping power.",
    tip:"Run game is dead. Try a quick pass or play action.",
    pos:{de1:R(32,1),dt1:R(44,0.8),dt2:R(56,0.8),de2:R(68,1),olb1:R(36,2.5),mlb:R(50,2.5),olb2:R(64,2.5),cb1:R(14,4),cb2:R(86,4),ss:R(50,8),fs:R(50,13)}
  },
};

const pickDefScheme = (down, dst, ballOn) => {
  const w = { base43: 30, nickel: 20, blitz: 15, cover2: 20, goalline: 0 };
  // Goal line ONLY near the endzone
  if (ballOn >= 85) { w.goalline = 30; w.base43 -= 10; }
  if (dst <= 2 && ballOn >= 85) { w.goalline += 20; w.blitz += 5; }
  if (dst >= 8) { w.nickel += 15; w.cover2 += 15; }
  if (down >= 3 && dst >= 5) { w.nickel += 10; w.cover2 += 10; w.blitz += 8; }
  const e = Object.entries(w).filter(([,v]) => v > 0);
  const t = e.reduce((s, [, v]) => s + v, 0);
  let r = Math.random() * t; for (const [k, v] of e) { r -= v; if (r <= 0) return { key: k, ...DEF_SCHEMES[k] }; }
  return { key: "base43", ...DEF_SCHEMES.base43 };
};

// ==================== POCKET WALL: 1-to-1 BLOCKING ====================
function computeOLWall(qbPos, phase, scheme) {
  const pos = {};
  const wallY = qbPos.y + 3.5;
  const halfWidth = 14;
  const slots = [
    { xOff: -halfWidth, curve: 0 },
    { xOff: -halfWidth * 0.5, curve: 0.6 },
    { xOff: 0, curve: 1.0 },
    { xOff: halfWidth * 0.5, curve: 0.6 },
    { xOff: halfWidth, curve: 0 },
  ];
  OL_IDS.forEach((olId, i) => {
    const slot = slots[i];
    const x = clamp(qbPos.x + slot.xOff, 5, 95);
    const y = wallY + slot.curve * 1.5;
    pos[olId] = R(x, y);
  });
  return pos;
}

function computeDefPositions(scheme, phase, qbP, offP, olPos, pocketIntegrity, isRun, bcPos, lookDir) {
  const pos = {}; const ms = Math.min(phase, 4); const tgt = isRun && bcPos ? bcPos : qbP;
  const pctIntact = pocketIntegrity / 100;

  for (const p of DEF) {
    const s = scheme.pos[p.id]; if (!s) continue;

    if (p.pos === "DL") {
      let rx = s.x + (tgt.x - s.x) * 0.18 * ms;
      let ry = s.y - (s.y - tgt.y) * 0.35 * ms;
      // 1-to-1 blocking: find MY assigned OL
      if (pctIntact > 0.08 && !isRun && olPos) {
        // Find which OL is assigned to block this DL
        let myOL = null;
        for (const [olId, dlId] of Object.entries(OL_BLOCK_ASSIGN)) {
          if (dlId === p.id && olPos[olId]) { myOL = olPos[olId]; break; }
        }
        if (myOL) {
          // DL is LOCKED to their blocker — cannot get past them
          const pen = (1 - pctIntact) * 5; // penetration through wall
          const minY = myOL.y - pen;
          if (ry < minY) ry = minY;
          // Stay engaged laterally
          rx = rx + (myOL.x - rx) * pctIntact * 0.5;
          // Edge rushers get ridden outside
          if (p.id === "de1") rx = Math.min(rx, myOL.x - 1 - ms * 0.8);
          if (p.id === "de2") rx = Math.max(rx, myOL.x + 1 + ms * 0.8);
        }
      }
      pos[p.id] = R(rx, ry);
    } else if (p.pos === "LB") {
      if (scheme.key === "blitz") {
        let rx = s.x + (tgt.x - s.x) * 0.22 * ms;
        let ry = s.y - (s.y - tgt.y) * 0.35 * ms;
        // Center picks up the closest blitzing LB
        if (pctIntact > 0.15 && !isRun && olPos) {
          const ctr = olPos["c"];
          if (ctr) {
            // Find closest LB to center — that's who center blocks
            let closestLB = null, cd = 999;
            for (const lbId of ["olb1", "mlb", "olb2"]) {
              const lbS = scheme.pos[lbId];
              if (lbS && Math.abs(lbS.x - ctr.x) < cd) { cd = Math.abs(lbS.x - ctr.x); closestLB = lbId; }
            }
            if (closestLB === p.id) {
              const minY = ctr.y - (1 - pctIntact) * 4;
              if (ry < minY) ry = minY;
              rx += (ctr.x - rx) * pctIntact * 0.4;
            }
          }
        }
        pos[p.id] = R(rx, ry);
      } else if (isRun && bcPos) {
        pos[p.id] = R(s.x + (bcPos.x - s.x) * 0.15 * ms, s.y + (bcPos.y - s.y) * 0.15 * ms);
      } else {
        pos[p.id] = R(s.x, s.y + ms * 0.5);
      }
    } else if (p.pos === "CB") {
      const wrId = CB_ASSIGN[p.id];
      const wr = offP[wrId];
      if (wr) {
        // CB ALWAYS trails their receiver — never let them get far away
        const lag = (10 - p.spd) * 0.5 + 1.0;
        const rate = Math.max(0.10, 0.20 * ms - lag * 0.02);
        const cushion = ms <= 1 ? 2.5 : 1.0; // initial cushion, then close
        pos[p.id] = R(
          s.x + (wr.x - s.x) * rate,
          clamp(s.y + (wr.y - s.y) * rate - cushion, s.y - 3, 35)
        );
      } else pos[p.id] = s;
    } else if (p.pos === "S") {
      const threats = ["wr1","wr2","te"].map(id => ({id, pos: offP[id]})).filter(t => t.pos);
      let target = threats.reduce((a, b) => (b.pos && b.pos.y > (a?.pos?.y || 0) ? b : a), null);
      // LOOK-OFF: QB eyes shift safeties
      if (lookDir && ms >= 1) {
        const shifted = threats.filter(t => {
          if (lookDir === "left") return t.pos.x < 40;
          if (lookDir === "right") return t.pos.x > 60;
          return false;
        });
        if (shifted.length > 0) target = shifted[0];
      }
      if (target && target.pos) {
        const rd = ms <= 1 ? 0.03 : 0.07;
        pos[p.id] = R(s.x + (target.pos.x - s.x) * rd * ms, s.y + Math.max(0, (target.pos.y - s.y) * rd * ms));
      } else pos[p.id] = s;
    }
  }
  return pos;
}

// PURSUIT: fixed yards per action
function pursueRunner(prevDef, runnerPos, step) {
  const np = {};
  for (const p of DEF) {
    const prev = prevDef[p.id]; if (!prev) continue;
    const closeYards = p.spd * 0.45 + 0.5 + step * 0.15;
    const dist = fieldDist(prev, runnerPos);
    if (dist < 0.5) { np[p.id] = {...runnerPos}; continue; }
    const rate = Math.min(closeYards / dist, 1.0);
    np[p.id] = R(prev.x + (runnerPos.x - prev.x) * rate, prev.y + (runnerPos.y - prev.y) * rate);
  }
  return np;
}

// POST-CATCH COVERAGE SHADOW: the DB covering that receiver stays close
function applyCoverageShadow(defPos, catcherPos, catcherId) {
  const np = {...defPos};
  // Find the DB who was covering this receiver
  let covDB = null;
  if (catcherId === "wr1") covDB = "cb1";
  else if (catcherId === "wr2") covDB = "cb2";
  else if (catcherId === "te") covDB = "ss"; // SS often covers TE
  else if (catcherId === "rb") covDB = "mlb"; // MLB covers RB

  if (covDB && np[covDB]) {
    // Place the covering DB 2-4 yards behind the catcher (they were trailing)
    const trail = 2 + Math.random() * 2;
    np[covDB] = R(
      catcherPos.x + (Math.random() - 0.5) * 4,
      catcherPos.y - trail
    );
  }
  // Also bring the nearest safety toward the catch point
  const safeties = ["ss","fs"];
  for (const sid of safeties) {
    if (sid === covDB) continue;
    if (np[sid]) {
      const d = fieldDist(np[sid], catcherPos);
      if (d > 10) {
        // Safety closes halfway on the catch
        np[sid] = R(
          np[sid].x + (catcherPos.x - np[sid].x) * 0.4,
          np[sid].y + (catcherPos.y - np[sid].y) * 0.4
        );
      }
    }
  }
  return np;
}

function getOpenness(recId, offP, defP) {
  const rec = offP[recId]; if (!rec) return { openness: 0, label: "N/A", color: "#666" };
  let n = 999; for (const id of Object.keys(defP)) { const d = fieldDist(rec, defP[id]); if (d < n) n = d; }
  if (n > 8) return { openness: 3, label: "WIDE OPEN", color: "#22c55e" };
  if (n > 5) return { openness: 2, label: "OPEN", color: "#86efac" };
  if (n > 3) return { openness: 1, label: "CONTESTED", color: "#fbbf24" };
  return { openness: 0, label: "COVERED", color: "#ef4444" };
}

function getNearestDef(pos, defP) {
  let n = 999, nid = null;
  for (const [id, dp] of Object.entries(defP)) { const d = fieldDist(pos, dp); if (d < n) { n = d; nid = id; } }
  return { dist: n, id: nid, player: getP(DEF, nid) };
}

function getPressure(phase, scheme, pi) {
  let b = (100 - pi) * 0.6 + phase * 8;
  if (scheme.key === "blitz") b += 15;
  return clamp(b + rand(-5, 5), 0, 100);
}

function calcThrowProbs(recId, phase, offP, defP, scheme, pi) {
  const rec = getP(OFF, recId), open = getOpenness(recId, offP, defP);
  const pressure = getPressure(phase, scheme, pi);
  let cp = 0.40 + open.openness * 0.15 + rec.skl * 0.02 - (pressure / 250);
  cp = clamp(cp, 0.10, 0.95);
  const ip = open.openness <= 0 ? 0.10 + phase * 0.02 : open.openness === 1 ? 0.03 : 0.01;
  return { catchPct: Math.round(cp * 100), intPct: Math.round(clamp(ip, 0, 1) * 100), openness: open };
}

function resolveThrow(recId, phase, offP, defP, scheme, pi) {
  const probs = calcThrowProbs(recId, phase, offP, defP, scheme, pi), recPos = offP[recId];
  if (Math.random() * 100 < probs.intPct) return { complete: false, intercepted: true, yards: 0, desc: `INTERCEPTED targeting ${recId.toUpperCase()}!`, targetPos: recPos };
  if (Math.random() * 100 > probs.catchPct) {
    const r = ["ball sails high","pass hits turf","CB bats it away","can't haul it in"];
    return { complete: false, intercepted: false, yards: 0, desc: `Incomplete — ${r[rand(0,r.length-1)]}`, targetPos: recPos };
  }
  return { complete: true, intercepted: false, yards: Math.round(recPos.y), catcherId: recId, desc: `${recId.toUpperCase()} makes the catch!`, targetPos: recPos };
}

function resolveSack(phase, scheme, pi) {
  const p = getPressure(phase, scheme, pi);
  const ch = pi < 15 ? (p - 30) / 100 : (p - 55) / 150;
  if (Math.random() < ch) { const l = rand(3, 8); return { sacked: true, yards: -l, desc: `SACKED! Loss of ${l}` }; }
  return { sacked: false };
}

function Fireworks({ show }) {
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    if (!show) { setParticles([]); return; }
    const ps = [];
    for (let burst = 0; burst < 5; burst++) {
      const cx = 80 + Math.random() * (FIELD_W - 160), cy = 60 + Math.random() * 150;
      const color = ["#fbbf24","#22c55e","#ef4444","#4a9eff","#f97316","#a855f7"][Math.floor(Math.random()*6)];
      for (let i = 0; i < 18; i++) {
        const angle = (i/18)*Math.PI*2+Math.random()*0.3, speed = 2+Math.random()*3;
        ps.push({id:`${burst}-${i}`,cx,cy,angle,speed,color,delay:burst*300,life:800+Math.random()*400});
      }
    }
    setParticles(ps);
  }, [show]);
  if (!show || !particles.length) return null;
  return (<div style={{position:"absolute",inset:0,zIndex:50,pointerEvents:"none",overflow:"hidden"}}>
    {particles.map(p=>(<div key={p.id} style={{position:"absolute",left:p.cx,top:p.cy,width:6,height:6,borderRadius:"50%",
      background:p.color,boxShadow:`0 0 6px ${p.color}`,animation:`fw ${p.life}ms ease-out ${p.delay}ms forwards`,
      "--dx":`${Math.cos(p.angle)*p.speed*30}px`,"--dy":`${Math.sin(p.angle)*p.speed*30}px`}}/>))}
  </div>);
}

// ==================== COMPONENT ====================
export default function TacticalFootball() {
  const [game, setGame] = useState({ ballOn: 25, down: 1, distance: 10, score: { you: 0, cpu: 0 }, quarter: 1, playsRun: 0 });
  const [mode, setMode] = useState("playcall");
  const [selectedPlay, setSelectedPlay] = useState(null);
  const [defScheme, setDefScheme] = useState(null);
  const [actionPhase, setActionPhase] = useState(0);
  const [qbPos, setQbPos] = useState(R(50, -3));
  const [ballCarrier, setBallCarrier] = useState("qb");
  const [ballCarrierPos, setBallCarrierPos] = useState(null);
  const [isRunPlay, setIsRunPlay] = useState(false);
  const [playResult, setPlayResult] = useState(null);
  const [log, setLog] = useState([]);
  const [handedOff, setHandedOff] = useState(false);
  const [ballPos, setBallPos] = useState(R(50, -3));
  const [ballState, setBallState] = useState("held");
  const [ballAnim, setBallAnim] = useState(false);
  const [cameraY, setCameraY] = useState(0);
  const [runActions, setRunActions] = useState(0);
  const [actionNarrative, setActionNarrative] = useState("");
  const [liveDefPos, setLiveDefPos] = useState({});
  const [liveOLPos, setLiveOLPos] = useState({});
  const [showTD, setShowTD] = useState(false);
  const [pocketIntegrity, setPocketIntegrity] = useState(100);
  const [lookDir, setLookDir] = useState(null);
  const [routes, setRoutes] = useState({});

  useEffect(() => {
    let t = 0;
    if (mode !== "playcall" && mode !== "fourth_down" && mode !== "presnap") {
      const c = ballCarrierPos || (ballCarrier === "qb" ? qbPos : null);
      if (c && c.y > 8) t = c.y - 8;
      else if (c && c.y < -8) t = c.y + 8;
    }
    setCameraY(t);
  }, [mode, ballCarrierPos, qbPos, ballCarrier, actionPhase, runActions]);

  const yardToY = useCallback((y) => FIELD_H / 2 - (y - cameraY) * PX_PER_YARD, [cameraY]);
  const pctToX = (p) => (p / 100) * FIELD_W;

  const getOffPos = useCallback((phase) => {
    if (!selectedPlay) return {};
    const pos = {}, f = selectedPlay.formation;
    for (const id of ["wr1","wr2","te","rb"]) {
      const route = routes[id];
      if (!route) { pos[id] = f[id]; continue; }
      pos[id] = phase === 0 ? f[id] : route[clamp(phase - 1, 0, route.length - 1)];
    }
    pos.qb = qbPos;
    for (const olId of OL_IDS) { if (liveOLPos[olId]) pos[olId] = liveOLPos[olId]; }
    return pos;
  }, [selectedPlay, qbPos, liveOLPos, routes]);

  const recomputePositions = useCallback((phase, qbP, pi, ld, bcPos) => {
    if (!defScheme || !selectedPlay) return;
    const olP = computeOLWall(qbP, phase, defScheme);
    setLiveOLPos(olP);
    const offP = {};
    for (const id of ["wr1","wr2","te","rb"]) {
      const route = routes[id];
      offP[id] = phase === 0 ? selectedPlay.formation[id] : route ? route[clamp(phase-1,0,route.length-1)] : selectedPlay.formation[id];
    }
    offP.qb = qbP; Object.assign(offP, olP);
    const defP = computeDefPositions(defScheme, phase, qbP, offP, olP, pi, !!bcPos, bcPos, ld);
    setLiveDefPos(defP);
  }, [defScheme, selectedPlay, routes]);

  const offPos = getOffPos(actionPhase);
  const pressure = defScheme ? getPressure(actionPhase, defScheme, pocketIntegrity) : 0;

  useEffect(() => {
    if (ballState !== "held") return;
    if (ballCarrier === "qb") setBallPos({ ...qbPos });
    else if (ballCarrierPos) setBallPos({ ...ballCarrierPos });
    else { const p = offPos[ballCarrier]; if (p) setBallPos({ ...p }); }
  }, [ballState, ballCarrier, qbPos, ballCarrierPos, offPos, actionPhase]);

  useEffect(() => {
    if (actionPhase > 0 && defScheme && selectedPlay && !isRunPlay) {
      recomputePositions(actionPhase, qbPos, pocketIntegrity, lookDir, null);
    }
  }, [actionPhase, defScheme, selectedPlay, isRunPlay, qbPos, pocketIntegrity, lookDir, recomputePositions]);

  const selectPlay = (play) => { setSelectedPlay(play); setRoutes(getRoutes(play)); };

  const showPresnap = () => {
    const def = pickDefScheme(game.down, game.distance, game.ballOn);
    setDefScheme(def);
    const sq = selectedPlay.formation.qb;
    setQbPos(sq);
    const olP = computeOLWall(sq, 0, def);
    setLiveOLPos(olP);
    const offP = { ...selectedPlay.formation, qb: sq, ...olP };
    setLiveDefPos(computeDefPositions(def, 0, sq, offP, olP, 100, false, null, null));
    setPocketIntegrity(100); setLookDir(null); setMode("presnap");
  };

  const doAudible = () => { setMode("playcall"); };

  const snapBall = () => {
    setActionPhase(0); setBallCarrier("qb"); setBallCarrierPos(null);
    setIsRunPlay(false); setPlayResult(null); setHandedOff(false);
    setBallState("held"); setBallAnim(false); setRunActions(0);
    setActionNarrative(""); setCameraY(0); setShowTD(false);
    const sq = selectedPlay.formation.qb;
    setQbPos(sq); setBallPos({...sq}); setPocketIntegrity(100); setLookDir(null);
    setBallPos({...selectedPlay.formation.c}); setBallState("air"); setBallAnim(true);
    setTimeout(() => {
      setBallPos({...sq});
      setTimeout(() => { setBallState("held"); setBallAnim(false); setActionPhase(1); setTimeout(() => setMode("decision"), ANIM_MS); }, 250);
    }, 120);
    setMode("snapping");
  };

  const endPlay = (yards, desc, turnover=false, incomplete=false) => {
    if (incomplete) setBallState("ground"); if (turnover) setBallState("loose");
    const newBallOn = game.ballOn + yards;
    if (newBallOn >= 100 && !turnover && !incomplete) {
      setShowTD(true);
      setPlayResult({yards,desc,turnover,incomplete,isTD:true}); setMode("touchdown");
    } else {
      setPlayResult({yards,desc,turnover,incomplete}); setMode("result");
    }
    setActionNarrative("");
  };

  const animate = (np, newQbPos, newPI) => {
    setMode("animating");
    setTimeout(() => {
      setActionPhase(np);
      const s = resolveSack(np, defScheme, newPI);
      if (s.sacked) { setTimeout(()=>endPlay(s.yards,s.desc), ANIM_MS); return; }
      setTimeout(() => setMode("decision"), ANIM_MS);
    }, 250);
  };

  const doAction = (action) => {
    const np = actionPhase + 1; setActionNarrative("");
    let newPI = pocketIntegrity;

    switch (action.type) {
      case "look_left": case "look_right": {
        // Look-off: doesn't degrade pocket, just shifts safeties
        const dir = action.type === "look_left" ? "left" : "right";
        setLookDir(dir);
        setActionNarrative(`QB stares ${dir} — safeties bite that direction`);
        animate(np, qbPos, newPI);
        break;
      }
      case "dropback": {
        newPI = Math.max(0, newPI - (defScheme.key === "blitz" ? rand(18, 28) : rand(8, 16)));
        setPocketIntegrity(newPI);
        const nq = R(qbPos.x, qbPos.y - 2.5);
        setQbPos(nq); animate(np, nq, newPI); break;
      }
      case "scramble_left": {
        newPI = Math.max(0, newPI - rand(5, 12));
        setPocketIntegrity(newPI);
        const nq = R(clamp(qbPos.x - 14, 5, 95), qbPos.y - 1);
        setQbPos(nq); animate(np, nq, newPI); break;
      }
      case "scramble_right": {
        newPI = Math.max(0, newPI - rand(5, 12));
        setPocketIntegrity(newPI);
        const nq = R(clamp(qbPos.x + 14, 5, 95), qbPos.y + 1);
        setQbPos(nq); animate(np, nq, newPI); break;
      }
      case "throw": {
        const curOff = getOffPos(actionPhase);
        const result = resolveThrow(action.target, actionPhase, curOff, liveDefPos, defScheme, newPI);
        const tp = curOff[action.target];
        setBallState("air"); setBallAnim(true);
        setTimeout(() => setBallPos({...tp}), 40);
        setTimeout(() => {
          setBallAnim(false);
          if (result.intercepted) { setBallState("loose"); endPlay(0, result.desc, true); }
          else if (!result.complete) { setBallState("ground"); endPlay(0, result.desc, false, true); }
          else {
            setBallState("held"); setBallCarrier(result.catcherId);
            setBallCarrierPos({...tp}); setBallPos({...tp});
            setIsRunPlay(true); setRunActions(0);
            // Apply coverage shadow: put the covering DB near the catch point
            const shadowDef = applyCoverageShadow(liveDefPos, tp, result.catcherId);
            // Then pursue from those positions
            const pursuedDef = pursueRunner(shadowDef, tp, 1);
            setLiveDefPos(pursuedDef);
            setActionNarrative(`${result.catcherId.toUpperCase()} catches at +${result.yards}!`);
            setMode("animating");
            setTimeout(() => { setActionPhase(np); setTimeout(() => setMode("runner_decision"), ANIM_MS); }, 250);
          }
        }, PASS_ANIM_MS);
        break;
      }
      case "handoff": {
        newPI = Math.max(0, newPI - rand(5, 10));
        setPocketIntegrity(newPI);
        setIsRunPlay(true); setBallCarrier("rb"); setHandedOff(true);
        const rbR = routes.rb;
        const rbP = rbR ? rbR[clamp(actionPhase-1,0,rbR.length-1)] : selectedPlay.formation.rb;
        setBallCarrierPos(rbP); setBallState("held"); setBallPos({...rbP});
        setRunActions(0); setActionNarrative("Handoff to RB!");
        setLiveDefPos(pursueRunner(liveDefPos, rbP, 1));
        setMode("animating");
        setTimeout(() => { setActionPhase(np); setTimeout(() => setMode("runner_decision"), ANIM_MS); }, 250);
        break;
      }
      case "tuck_run": {
        setIsRunPlay(true); setBallCarrier("qb"); setBallCarrierPos({...qbPos});
        setRunActions(0); setActionNarrative("QB tucks and runs!");
        setMode("animating");
        setTimeout(() => { setActionPhase(np); setTimeout(() => setMode("runner_decision"), ANIM_MS); }, 250);
        break;
      }
      default: break;
    }
  };

  const doRunnerAction = (action) => {
    const ra = runActions + 1;
    let np = ballCarrierPos ? {...ballCarrierPos} : {...qbPos};
    const runner = getP(OFF, ballCarrier);
    const nd = getNearestDef(np, liveDefPos);
    let narr = ""; let forceEnd = false; let endDesc = "";

    switch (action.type) {
      case "sprint": { const g = (runner.spd-3)*0.8+rand(0,3); np = R(np.x, np.y+g); narr = `Sprint — +${Math.round(g)}!`; break; }
      case "juke_left": {
        if (Math.random() < runner.skl/12+0.15) { np = R(clamp(np.x-14,3,97), np.y+rand(2,5)); narr = "Juke left! Makes him miss!"; }
        else { np = R(clamp(np.x-5,3,97), np.y+rand(0,1)); narr = "Juke left — read it."; if(nd.dist<4){forceEnd=true;endDesc=`${nd.player?.label||"Def"} wraps up`;} }
        break;
      }
      case "juke_right": {
        if (Math.random() < runner.skl/12+0.15) { np = R(clamp(np.x+14,3,97), np.y+rand(2,5)); narr = "Juke right! Shakes free!"; }
        else { np = R(clamp(np.x+5,3,97), np.y+rand(0,1)); narr = "Juke right — nope."; if(nd.dist<4){forceEnd=true;endDesc="Tackled after failed juke";} }
        break;
      }
      case "spin": {
        if (Math.random() < runner.skl/13+0.1) { np = R(np.x+rand(-6,6), np.y+rand(4,7)); narr = "SPIN MOVE! Breaks free!"; }
        else { forceEnd=true; endDesc="Spin fails — tackled"; narr=endDesc; }
        break;
      }
      case "stiff_arm": {
        if (Math.random() < runner.str/12+0.1) { np = R(np.x, np.y+rand(3,6)); narr = "STIFF ARM!"; }
        else { np = R(np.x, np.y+rand(0,2)); narr = "Stiff arm absorbed."; if(nd.dist<3){forceEnd=true;endDesc="Wrapped up";} }
        break;
      }
      case "cut_sideline": { const d = np.x<50?-1:1; np = R(clamp(np.x+d*18,2,98), np.y+rand(1,4)); narr = "Breaks for the sideline!"; break; }
      case "dive": {
        np = R(np.x, np.y+rand(1,3));
        setBallCarrierPos(np); setBallPos({...np}); setActionNarrative("Dives forward.");
        endPlay(Math.round(np.y), `Dives for +${Math.max(0,Math.round(np.y))}`); return;
      }
      default: break;
    }

    if (game.ballOn + Math.round(np.y) >= 100) {
      setBallCarrierPos(np); setBallPos({...np}); setRunActions(ra); setActionNarrative(narr || "Into the endzone!");
      endPlay(Math.round(np.y), `${ballCarrier.toUpperCase()} into the ENDZONE!`); return;
    }

    setBallCarrierPos(np); setBallPos({...np});
    if (ballCarrier === "qb") setQbPos(np);
    setRunActions(ra); setActionNarrative(narr);

    if (forceEnd) { setMode("animating"); setTimeout(()=>endPlay(Math.round(np.y), endDesc||narr), ANIM_MS); return; }

    const newDef = pursueRunner(liveDefPos, np, ra);
    setLiveDefPos(newDef);

    const nnd = getNearestDef(np, newDef);
    let tp = 0;
    if (nnd.dist < 1.5) tp = 0.90;
    else if (nnd.dist < 2.5) tp = 0.65;
    else if (nnd.dist < 3.5) tp = 0.35;
    else if (nnd.dist < 4) tp = 0.15;

    if (Math.random() < tp) {
      const yds = Math.round(np.y);
      setMode("animating"); setTimeout(()=>endPlay(yds, `${nnd.player?.label||"Defender"} tackles at +${yds}`), ANIM_MS);
    } else {
      setMode("animating"); setTimeout(() => setMode("runner_decision"), ANIM_MS);
    }
  };

  const doFourthDown = (choice) => {
    if (choice === "punt") {
      const py = 35 + rand(0, 15);
      setLog(l => [`📢 Punt for ${py} yards`, ...l].slice(0, 25));
      setGame(g => ({...g, ballOn: 25, down: 1, distance: 10}));
    } else if (choice === "fg") {
      const fgd = 100 - game.ballOn + 17;
      const mp = fgd <= 30 ? 0.95 : fgd <= 40 ? 0.82 : fgd <= 50 ? 0.60 : fgd <= 55 ? 0.35 : 0.15;
      if (Math.random() < mp) {
        setLog(l => [`🥅 FG GOOD! ${fgd} yards!`, ...l].slice(0, 25));
        setGame(g => ({...g, ballOn: 25, down: 1, distance: 10, score: {...g.score, you: g.score.you + 3}}));
      } else {
        setLog(l => [`❌ FG MISSED from ${fgd}!`, ...l].slice(0, 25));
        setGame(g => ({...g, ballOn: 25, down: 1, distance: 10}));
      }
    } else { setMode("playcall"); return; }
    setMode("playcall"); setSelectedPlay(null); setDefScheme(null); setPlayResult(null);
    setActionPhase(0); setHandedOff(false); setBallState("held"); setBallAnim(false);
    setCameraY(0); setRunActions(0); setActionNarrative(""); setLiveDefPos({}); setLiveOLPos({});
  };

  const advanceGame = () => {
    if (!playResult) return; const r = playResult; setShowTD(false);
    setGame(g => {
      let{ballOn,down,distance,score,quarter,playsRun}={...g}; playsRun++;
      if(r.turnover){setLog(l=>[`💥 ${r.desc}`,...l].slice(0,25));return{ballOn:25,down:1,distance:10,score,quarter,playsRun};}
      const nb=clamp(ballOn+r.yards,0,100);
      if(r.isTD||nb>=100){const ns={...score,you:score.you+7};setLog(l=>[`🏈 TOUCHDOWN!`,...l].slice(0,25));return{ballOn:25,down:1,distance:10,score:ns,quarter:Math.min(4,Math.floor(playsRun/12)+1),playsRun};}
      if(nb<=0){const ns={...score,cpu:score.cpu+2};setLog(l=>[`⚠️ Safety!`,...l].slice(0,25));return{ballOn:25,down:1,distance:10,score:ns,quarter,playsRun};}
      const gained=nb-ballOn,nd=distance-gained;
      if(nd<=0){setLog(l=>[`✅ 1st! +${gained}`,...l].slice(0,25));return{ballOn:nb,down:1,distance:Math.min(10,100-nb),score,quarter:Math.min(4,Math.floor(playsRun/12)+1),playsRun};}
      if(down>=4){setLog(l=>[`${gained>=0?"+":""}${gained} — ${r.desc}`,...l].slice(0,25));return{ballOn:nb,down:4,distance:nd,score,quarter:Math.min(4,Math.floor(playsRun/12)+1),playsRun};}
      setLog(l=>[`${gained>=0?"+":""}${gained} — ${r.desc}`,...l].slice(0,25));
      return{ballOn:nb,down:down+1,distance:nd,score,quarter:Math.min(4,Math.floor(playsRun/12)+1),playsRun};
    });
    setTimeout(()=>{setGame(g=>{if(g.down===4){setMode("fourth_down");}else{setMode("playcall");}return g;});},50);
    setSelectedPlay(null); setDefScheme(null); setPlayResult(null);
    setActionPhase(0); setHandedOff(false); setBallState("held"); setBallAnim(false);
    setCameraY(0); setRunActions(0); setActionNarrative(""); setLiveDefPos({}); setLiveOLPos({}); setRoutes({});
  };

  const getQBActions = () => {
    const actions = [];
    for (const id of ["wr1","wr2","te","rb"]) {
      if (id==="rb"&&handedOff) continue;
      const pos = offPos[id]; if (!pos) continue;
      const probs = calcThrowProbs(id, actionPhase, offPos, liveDefPos, defScheme, pocketIntegrity);
      const yds = Math.round(pos.y);
      actions.push({type:"throw",target:id,category:"throw",label:id.toUpperCase(),sublabel:`${yds>0?"+":""}${yds}yds`,openness:probs.openness,catchPct:probs.catchPct,intPct:probs.intPct});
    }
    if (actionPhase<MAX_QB_ACTIONS-1) {
      actions.push({type:"dropback",category:"move",label:"Drop Back",sublabel:"More time, pocket degrades"});
      actions.push({type:"scramble_left",category:"move",label:"Scramble L",sublabel:"Roll out left"});
      actions.push({type:"scramble_right",category:"move",label:"Scramble R",sublabel:"Roll out right"});
      if (!lookDir) {
        actions.push({type:"look_left",category:"look",label:"👀 Look Left",sublabel:"Shift safeties left, open right"});
        actions.push({type:"look_right",category:"look",label:"👀 Look Right",sublabel:"Shift safeties right, open left"});
      }
    }
    if (actionPhase<=1&&!handedOff) actions.push({type:"handoff",category:"other",label:"Hand Off",sublabel:"Give to RB"});
    actions.push({type:"tuck_run",category:"other",label:"Tuck & Run",sublabel:"QB keeps it"});
    return actions;
  };

  const getRunnerActions = () => {
    const nd = getNearestDef(ballCarrierPos||qbPos, liveDefPos), cl = nd.dist < 5;
    const a = [
      {type:"sprint",category:"move",label:"Sprint",sublabel:"Upfield",risk:cl?"med":"low"},
      {type:"juke_left",category:"move",label:"Juke Left",sublabel:"Quick cut",risk:cl?"med":"low"},
      {type:"juke_right",category:"move",label:"Juke Right",sublabel:"Quick cut",risk:cl?"med":"low"},
    ];
    if (cl) {
      a.push({type:"spin",category:"evasion",label:"Spin Move",sublabel:"Break tackle",risk:"high"});
      a.push({type:"stiff_arm",category:"evasion",label:"Stiff Arm",sublabel:"Push off",risk:"med"});
    }
    a.push({type:"cut_sideline",category:"move",label:"Sideline",sublabel:"Edge",risk:"low"});
    a.push({type:"dive",category:"safe",label:"Dive",sublabel:"End play safe",risk:"none"});
    return a;
  };

  // ==================== RENDER ====================
  const renderPlayer = (id, pos, team) => {
    if (!pos) return null;
    const isOff = team==="off", roster = isOff?OFF:DEF;
    const player = getP(roster,id); if(!player) return null;
    const isOL = player.pos==="OL";
    const hasBall = isOff&&ballState==="held"&&id===ballCarrier&&mode!=="playcall"&&mode!=="presnap";
    const px=pctToX(pos.x),py=yardToY(pos.y);
    if(py<-40||py>FIELD_H+40) return null;
    const sz=isOL?24:30;
    let bc=isOff?(isOL?"#5588bb":"#4a8ad4"):(player.pos==="DL"?"#b33":"#e05555");
    if(hasBall)bc="#fbbf24";
    const inPlay = mode!=="playcall"&&mode!=="fourth_down";
    return (<div key={`${team}-${id}`} style={{
      position:"absolute",left:px-sz/2,top:py-sz/2,width:sz,height:sz,borderRadius:"50%",
      background:isOff?(isOL?(inPlay?"#2a5a90":"#1a3d6e"):"#1e56a0"):(player.pos==="DL"?"#7a1a1a":"#b82020"),
      border:`${hasBall?3:2}px solid ${bc}`,display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:isOL?8:9,fontWeight:700,color:"#fff",zIndex:isOL?9:10,transition:`all ${ANIM_MS}ms ease`,
      boxShadow:isOL&&inPlay?"0 0 10px rgba(58,106,170,0.6)":"0 1px 3px rgba(0,0,0,0.5)",fontFamily:"monospace",
    }}>{player.label}</div>);
  };

  const renderRunnerOverlay = () => {
    if(!ballCarrierPos||!isRunPlay||ballCarrier==="qb"||mode==="playcall"||ballState!=="held") return null;
    const sz=32,px=pctToX(ballCarrierPos.x),py=yardToY(ballCarrierPos.y);
    if(py<-40||py>FIELD_H+40) return null;
    return (<div style={{position:"absolute",left:px-sz/2,top:py-sz/2,width:sz,height:sz,borderRadius:"50%",
      background:"#1e56a0",border:"3px solid #fbbf24",display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:9,fontWeight:700,color:"#fff",zIndex:12,transition:`all ${ANIM_MS}ms ease`,fontFamily:"monospace",
    }}>{getP(OFF,ballCarrier)?.label}</div>);
  };

  const renderBall = () => {
    if(mode==="playcall"||mode==="fourth_down") return null;
    const bx=pctToX(ballPos.x),by=yardToY(ballPos.y);
    if(by<-40||by>FIELD_H+40) return null;
    const isAir=ballState==="air",isHeld=ballState==="held";
    const ho=isHeld?-18:0;
    const rot=ballState==="ground"?"rotate(45deg)":ballState==="loose"?"rotate(120deg)":isAir?"rotate(-30deg)":"rotate(-15deg)";
    return (<>
      {isAir&&<div style={{position:"absolute",left:bx-6,top:by+8,width:12,height:6,borderRadius:"50%",background:"rgba(0,0,0,0.3)",transition:ballAnim?`all ${PASS_ANIM_MS}ms ease-out`:"none",zIndex:18}}/>}
      <div style={{position:"absolute",left:bx-10,top:by-10+ho,width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:isAir?18:15,zIndex:isAir?25:isHeld?20:16,transform:`${rot} scale(${isAir?1.3:1})`,
        transition:isAir&&ballAnim?`all ${PASS_ANIM_MS}ms ease-out`:`all ${ANIM_MS}ms ease`,
        filter:isAir?"drop-shadow(0 4px 8px rgba(0,0,0,0.6))":isHeld?"drop-shadow(0 1px 2px rgba(0,0,0,0.4))":"none",
        opacity:ballState==="ground"||ballState==="loose"?0.7:1,pointerEvents:"none",
      }}>🏈</div>
      {isHeld&&<div style={{position:"absolute",left:bx-18,top:by-18,width:36,height:36,borderRadius:"50%",
        border:"2px solid rgba(251,191,36,0.5)",zIndex:13,transition:`all ${ANIM_MS}ms ease`,animation:"pulse 1.5s ease-in-out infinite",pointerEvents:"none"}}/>}
    </>);
  };

  const dlStr=["","1st","2nd","3rd","4th"][game.down]||"4th";
  const bl=game.ballOn>50?`OPP ${100-game.ballOn}`:`OWN ${game.ballOn}`;
  const btn={border:"none",borderRadius:6,cursor:"pointer",fontFamily:"inherit",transition:"all 0.1s"};
  const rc={low:"#22c55e",med:"#fbbf24",high:"#ef4444",none:"#888"};
  const nearDef = (ballCarrierPos||(isRunPlay&&ballCarrier==="qb"))?getNearestDef(ballCarrierPos||qbPos,liveDefPos):null;
  const fgDist = 100 - game.ballOn + 17;
  const pocketColor = pocketIntegrity > 60 ? "#22c55e" : pocketIntegrity > 30 ? "#fbbf24" : "#ef4444";

  return (
    <div style={{fontFamily:"'SF Mono','Cascadia Code','Courier New',monospace",background:"#080c14",color:"#d0dce8",minHeight:"100vh",padding:"10px 10px 40px"}}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:0.8;transform:scale(1.08)}}
        @keyframes fw{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(0);opacity:0}}
        @keyframes tdBounce{0%{transform:scale(0) rotate(-10deg);opacity:0}50%{transform:scale(1.15) rotate(3deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}
        @keyframes tdGlow{0%,100%{text-shadow:0 0 20px #fbbf24,0 0 40px #f97316}50%{text-shadow:0 0 40px #fbbf24,0 0 80px #f97316,0 0 120px #ef4444}}
      `}</style>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 14px",background:"#10151f",borderRadius:8,border:"1px solid #1a2540",maxWidth:FIELD_W,margin:"0 auto 8px"}}>
        <div style={{display:"flex",gap:20,alignItems:"center"}}>
          <div style={{textAlign:"center"}}><div style={{fontSize:10,color:"#4a9eff",fontWeight:700}}>YOU</div><div style={{fontSize:24,fontWeight:800,color:"#4a9eff"}}>{game.score.you}</div></div>
          <div style={{color:"#2a3550"}}>vs</div>
          <div style={{textAlign:"center"}}><div style={{fontSize:10,color:"#ef4444",fontWeight:700}}>CPU</div><div style={{fontSize:24,fontWeight:800,color:"#ef4444"}}>{game.score.cpu}</div></div>
        </div>
        <div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:700}}>{dlStr} & {game.distance}</div><div style={{fontSize:11,color:"#5a7090"}}>{bl} · Q{game.quarter}</div></div>
      </div>

      <div style={{position:"relative",width:FIELD_W,height:FIELD_H,margin:"0 auto",background:"linear-gradient(180deg,#165c28 0%,#1a6830 50%,#165c28 100%)",borderRadius:6,overflow:"hidden",border:"2px solid #2a8040"}}>
        {Array.from({length:14},(_,i)=>{
          const yo=(i-6.5)*5+cameraY;const y=yardToY(yo);if(y<-10||y>FIELD_H+10)return null;
          const num=game.ballOn+yo;const d=num>50?100-num:num;
          return(<div key={`yl${i}`}><div style={{position:"absolute",left:0,right:0,top:y,height:1,background:"rgba(255,255,255,0.12)"}}/>{d>=0&&d<=50&&<div style={{position:"absolute",left:6,top:y-7,fontSize:9,color:"rgba(255,255,255,0.2)",fontWeight:600}}>{Math.round(d)}</div>}</div>);
        })}
        <div style={{position:"absolute",left:0,right:0,top:yardToY(0)-1.5,height:3,background:"rgba(255,215,0,0.55)",zIndex:5}}/>
        {game.distance<=30&&<div style={{position:"absolute",left:0,right:0,top:yardToY(game.distance)-1,height:2,background:"rgba(74,158,255,0.45)",zIndex:5}}/>}
        {Object.entries(offPos).map(([id,pos])=>renderPlayer(id,pos,"off"))}
        {Object.entries(liveDefPos).map(([id,pos])=>renderPlayer(id,pos,"def"))}
        {renderRunnerOverlay()}
        {renderBall()}
        <Fireworks show={showTD} />
        {defScheme&&mode!=="playcall"&&mode!=="fourth_down"&&(
          <div style={{position:"absolute",top:5,left:"50%",transform:"translateX(-50%)",background:"rgba(200,40,40,0.75)",padding:"2px 10px",borderRadius:4,fontSize:10,fontWeight:700,color:"#fff",zIndex:30}}>
            {defScheme.name}{lookDir&&<span style={{marginLeft:6,color:"#fbbf24"}}>👀{lookDir==="left"?"←":"→"}</span>}
          </div>
        )}
        {mode!=="playcall"&&mode!=="result"&&mode!=="touchdown"&&mode!=="fourth_down"&&mode!=="presnap"&&(
          <div style={{position:"absolute",bottom:5,left:"50%",transform:"translateX(-50%)",display:"flex",gap:8,alignItems:"center",background:"rgba(0,0,0,0.6)",padding:"3px 12px",borderRadius:4,fontSize:10,color:"#aaa",zIndex:30}}>
            {isRunPlay?(<><span>Run #{runActions}</span><span style={{color:"#333"}}>|</span><span>Nearest: {nearDef?`${nearDef.player?.label||"?"} ${nearDef.dist.toFixed(1)}yds`:"—"}</span></>)
            :(<><span>Phase {actionPhase}/{MAX_QB_ACTIONS-1}</span><span style={{color:"#333"}}>|</span>
              <span>Pocket</span><div style={{width:50,height:6,background:"#222",borderRadius:3,overflow:"hidden"}}><div style={{width:`${pocketIntegrity}%`,height:"100%",borderRadius:3,background:pocketColor,transition:"all 0.3s"}}/></div>
              <span style={{color:pocketColor,fontWeight:700}}>{pocketIntegrity}%</span>
            </>)}
          </div>
        )}
        {ballState==="air"&&ballAnim&&<div style={{position:"absolute",top:FIELD_H-28,left:"50%",transform:"translateX(-50%)",background:"rgba(251,191,36,0.85)",padding:"2px 12px",borderRadius:4,fontSize:11,fontWeight:800,color:"#000",zIndex:30,letterSpacing:1}}>BALL IN THE AIR!</div>}
        {ballState==="ground"&&mode==="result"&&<div style={{position:"absolute",top:FIELD_H-28,left:"50%",transform:"translateX(-50%)",background:"rgba(180,180,180,0.7)",padding:"2px 12px",borderRadius:4,fontSize:11,fontWeight:700,color:"#222",zIndex:30}}>INCOMPLETE</div>}
        {ballState==="loose"&&mode==="result"&&<div style={{position:"absolute",top:FIELD_H-28,left:"50%",transform:"translateX(-50%)",background:"rgba(239,68,68,0.85)",padding:"2px 12px",borderRadius:4,fontSize:11,fontWeight:700,color:"#fff",zIndex:30}}>TURNOVER</div>}
        {mode==="touchdown"&&(
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:40}}>
            <div style={{fontSize:64,animation:"tdBounce 0.6s ease-out forwards",marginBottom:8}}>🏈</div>
            <div style={{fontSize:42,fontWeight:900,color:"#fbbf24",animation:"tdGlow 1.5s ease-in-out infinite",letterSpacing:4}}>TOUCHDOWN!</div>
            <div style={{fontSize:16,color:"#fff",marginTop:8,fontWeight:600}}>+7 points</div>
            <div style={{fontSize:13,color:"#aaa",marginTop:4}}>{playResult?.desc}</div>
          </div>
        )}
      </div>

      {actionNarrative&&<div style={{maxWidth:FIELD_W,margin:"6px auto 0",padding:"6px 12px",background:"#12181f",borderRadius:6,borderLeft:"3px solid #fbbf24",fontSize:12,color:"#e0d8c0",fontStyle:"italic"}}>{actionNarrative}</div>}

      <div style={{maxWidth:FIELD_W,margin:"6px auto 0"}}>
        {mode==="playcall"&&(
          <div>
            <div style={{fontSize:11,color:"#5a7090",marginBottom:6,fontWeight:700,letterSpacing:1}}>
              CALL YOUR PLAY {defScheme && <span style={{color:"#ef4444",marginLeft:8}}>Defense showing: {defScheme.name}</span>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:5}}>
              {PLAYS.map(p=>(<button key={p.name} onClick={()=>selectPlay(p)} style={{...btn,background:selectedPlay?.name===p.name?"#162a4a":"#0e1520",border:selectedPlay?.name===p.name?"2px solid #3a7acc":"1px solid #1a2540",padding:"7px 10px",textAlign:"left",color:"#d0dce8"}}>
                <div style={{fontSize:12,fontWeight:700}}>{p.icon} {p.name}</div><div style={{fontSize:10,color:"#5a7090",marginTop:2}}>{p.desc}</div>
              </button>))}
            </div>
            {selectedPlay&&<button onClick={showPresnap} style={{...btn,marginTop:8,width:"100%",padding:11,background:"linear-gradient(135deg,#16a34a,#15803d)",color:"#fff",fontSize:15,fontWeight:800,letterSpacing:2}}>LINE UP →</button>}
          </div>
        )}

        {mode==="presnap"&&(
          <div style={{background:"#10151f",borderRadius:8,padding:12,border:"1px solid #2a3a50"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div>
                <div style={{fontSize:13,fontWeight:800,color:"#4a9eff",marginBottom:2}}>Your play: {selectedPlay?.name}</div>
                <div style={{fontSize:11,color:"#5a7090"}}>{selectedPlay?.desc}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:13,fontWeight:800,color:"#ef4444",marginBottom:2}}>Defense: {defScheme?.name}</div>
                <div style={{fontSize:11,color:"#5a7090",maxWidth:260}}>{defScheme?.desc}</div>
              </div>
            </div>
            <div style={{background:"#0a0e16",borderRadius:6,padding:"6px 10px",marginBottom:10,borderLeft:"3px solid #f97316"}}>
              <div style={{fontSize:10,color:"#f97316",fontWeight:700,marginBottom:2}}>💡 SCOUTING TIP</div>
              <div style={{fontSize:11,color:"#c0a870"}}>{defScheme?.tip}</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={snapBall} style={{...btn,flex:2,padding:12,background:"linear-gradient(135deg,#16a34a,#15803d)",color:"#fff",fontSize:15,fontWeight:800,letterSpacing:2}}>⚡ SNAP</button>
              <button onClick={doAudible} style={{...btn,flex:1,padding:12,background:"#1a1510",border:"1px solid #4a3010",color:"#f97316",fontSize:13,fontWeight:700}}>🔊 AUDIBLE<div style={{fontSize:9,color:"#7a5020",fontWeight:400}}>Change play</div></button>
            </div>
          </div>
        )}

        {mode==="fourth_down"&&(
          <div style={{background:"#10151f",borderRadius:8,padding:14,border:"2px solid #f97316"}}>
            <div style={{fontSize:15,fontWeight:800,color:"#f97316",marginBottom:8,letterSpacing:1}}>⚠️ 4TH DOWN</div>
            <div style={{fontSize:12,color:"#8a9ab0",marginBottom:12}}>{dlStr} & {game.distance} at {bl}</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>doFourthDown("punt")} style={{...btn,flex:1,padding:"12px 8px",background:"#0e1520",border:"1px solid #1a2540",color:"#8ab4e0",fontSize:13,fontWeight:700}}>
                📢 Punt<div style={{fontSize:10,color:"#5a7090",fontWeight:400,marginTop:2}}>Flip field</div>
              </button>
              <button onClick={()=>doFourthDown("fg")} style={{...btn,flex:1,padding:"12px 8px",background:fgDist<=50?"#0e1a10":"#0e1520",border:`1px solid ${fgDist<=50?"#2a5a2a":"#1a2540"}`,color:fgDist<=50?"#4ade80":"#8ab4e0",fontSize:13,fontWeight:700}}>
                🥅 FG<div style={{fontSize:10,color:"#5a7090",fontWeight:400,marginTop:2}}>{fgDist}yds ({fgDist<=30?"95":fgDist<=40?"82":fgDist<=50?"60":fgDist<=55?"35":"15"}%)</div>
              </button>
              <button onClick={()=>doFourthDown("goforit")} style={{...btn,flex:1,padding:"12px 8px",background:"#1a1008",border:"1px solid #4a2a08",color:"#f97316",fontSize:13,fontWeight:700}}>
                💪 Go For It<div style={{fontSize:10,color:"#7a5020",fontWeight:400,marginTop:2}}>High risk</div>
              </button>
            </div>
          </div>
        )}

        {(mode==="snapping"||(mode==="animating"&&!isRunPlay))&&<div style={{textAlign:"center",padding:14,color:"#fbbf24",fontSize:14,fontWeight:700}}>⏱ {mode==="snapping"?"Ball snapped...":"Players moving..."}</div>}
        {mode==="animating"&&isRunPlay&&<div style={{textAlign:"center",padding:10,color:"#f59e0b",fontSize:13,fontWeight:600}}>⏱ {ballCarrier.toUpperCase()} running...</div>}

        {mode==="decision"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{fontSize:11,color:"#fbbf24",fontWeight:700}}>🏈 QB DECISION</div>
              <div style={{display:"flex",gap:8,alignItems:"center",fontSize:10}}>
                <span style={{color:"#5a7090"}}>Phase {actionPhase}/{MAX_QB_ACTIONS-1}</span>
                <span style={{color:pocketColor,fontWeight:700}}>Pocket {pocketIntegrity}%</span>
              </div>
            </div>
            <div style={{marginBottom:6}}>
              <div style={{fontSize:10,color:"#5a7090",marginBottom:4,fontWeight:600}}>THROW TO:</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {getQBActions().filter(a=>a.category==="throw").map(a=>(
                  <button key={a.target} onClick={()=>doAction(a)} style={{...btn,background:"#0e1520",border:`1px solid ${a.openness.color}88`,padding:"6px 8px",color:"#d0dce8",display:"flex",flexDirection:"column",gap:5,textAlign:"left"}}>
                    <div style={{display:"flex",justifyContent:"space-between",width:"100%"}}>
                      <span style={{fontWeight:800,fontSize:13}}>{a.label} <span style={{fontSize:10,color:"#8ab4e0"}}>{a.sublabel}</span></span>
                      <span style={{fontSize:9,fontWeight:700,color:"#000",background:a.openness.color,padding:"2px 5px",borderRadius:3}}>{a.openness.label}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",width:"100%",fontSize:11,background:"#05080c",padding:"4px 6px",borderRadius:4,fontFamily:"monospace"}}>
                      <span style={{color:"#4ade80",fontWeight:700}}>HIT: {a.catchPct}%</span>
                      <span style={{color:"#f87171",fontWeight:700}}>INT: {a.intPct}%</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {getQBActions().filter(a=>a.category==="move").map(a=>(<button key={a.type} onClick={()=>doAction(a)} style={{...btn,background:"#0e1520",border:"1px solid #1a2540",padding:"6px 10px",color:"#8ab4e0",fontSize:11,fontWeight:600,flex:"1 1 auto"}}>{a.label}<div style={{fontSize:9,color:"#4a6080",fontWeight:400}}>{a.sublabel}</div></button>))}
              {getQBActions().filter(a=>a.category==="look").map(a=>(<button key={a.type} onClick={()=>doAction(a)} style={{...btn,background:"#101820",border:"1px solid #2a3a50",padding:"6px 10px",color:"#60a0d0",fontSize:11,fontWeight:600,flex:"1 1 auto"}}>{a.label}<div style={{fontSize:9,color:"#3a6a90",fontWeight:400}}>{a.sublabel}</div></button>))}
              {getQBActions().filter(a=>a.category==="other").map(a=>(<button key={a.type} onClick={()=>doAction(a)} style={{...btn,background:"#1a1510",border:"1px solid #3a2a10",padding:"6px 10px",color:"#d4a034",fontSize:11,fontWeight:600,flex:"1 1 auto"}}>{a.label}<div style={{fontSize:9,color:"#7a6030",fontWeight:400}}>{a.sublabel}</div></button>))}
            </div>
          </div>
        )}

        {mode==="runner_decision"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div style={{fontSize:11,color:"#f59e0b",fontWeight:700}}>🏃 {ballCarrier.toUpperCase()} — MAKE A MOVE</div>
              <div style={{fontSize:10,color:"#5a7090"}}>Move #{runActions+1}</div>
            </div>
            {nearDef&&<div style={{fontSize:10,marginBottom:6,color:nearDef.dist<3?"#ef4444":nearDef.dist<6?"#fbbf24":"#22c55e"}}>
              {nearDef.dist<3?`⚠️ ${nearDef.player?.label} RIGHT ON YOU (${nearDef.dist.toFixed(1)}yds)`:nearDef.dist<6?`⚡ ${nearDef.player?.label} closing (${nearDef.dist.toFixed(1)}yds)`:`✓ Open field — nearest ${nearDef.player?.label} at ${nearDef.dist.toFixed(1)}yds`}
            </div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4}}>
              {getRunnerActions().map(a=>(<button key={a.type} onClick={()=>doRunnerAction(a)} style={{...btn,
                background:a.category==="safe"?"#1a1510":a.category==="evasion"?"#1a1020":"#0e1520",
                border:a.category==="safe"?"1px solid #3a2a10":a.category==="evasion"?"1px solid #3a1a3a":"1px solid #1a2540",
                padding:"8px 8px",textAlign:"center",
                color:a.category==="safe"?"#d4a034":a.category==="evasion"?"#d084e0":"#8ab4e0",fontSize:11,fontWeight:600,
              }}>{a.label}<div style={{fontSize:9,color:"#5a7090",fontWeight:400}}>{a.sublabel}</div><div style={{fontSize:8,color:rc[a.risk],marginTop:2}}>● {a.risk==="none"?"safe":a.risk+" risk"}</div></button>))}
            </div>
          </div>
        )}

        {mode==="result"&&playResult&&(
          <div style={{background:"#10151f",borderRadius:8,padding:12,border:`1px solid ${playResult.turnover?"#ef4444":playResult.incomplete?"#fbbf24":playResult.yards>=10?"#22c55e":"#1a2540"}`}}>
            <div style={{fontSize:17,fontWeight:800,marginBottom:4,color:playResult.turnover?"#ef4444":playResult.incomplete?"#fbbf24":playResult.yards>=10?"#22c55e":playResult.yards>=0?"#d0dce8":"#ef4444"}}>
              {playResult.turnover?"💥 TURNOVER":playResult.incomplete?"✋ INCOMPLETE":playResult.yards>=15?"🔥 BIG PLAY!":playResult.yards>=0?`+${playResult.yards} YARDS`:`${playResult.yards} YARDS`}
            </div>
            <div style={{fontSize:12,color:"#8a9ab0",marginBottom:8}}>{playResult.desc}</div>
            <div style={{fontSize:10,color:"#4a5a70",marginBottom:10}}>{selectedPlay?.name} vs {defScheme?.name}</div>
            <button onClick={advanceGame} style={{...btn,width:"100%",padding:10,background:"#162a4a",color:"#4a9eff",border:"1px solid #2a5a9a",fontSize:13,fontWeight:700}}>NEXT PLAY →</button>
          </div>
        )}

        {mode==="touchdown"&&(
          <div style={{background:"#10151f",borderRadius:8,padding:16,border:"2px solid #fbbf24",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:900,color:"#fbbf24",marginBottom:4}}>🏈 TOUCHDOWN! 🏈</div>
            <div style={{fontSize:14,color:"#22c55e",fontWeight:700,marginBottom:4}}>+7 POINTS</div>
            <div style={{fontSize:12,color:"#8a9ab0",marginBottom:10}}>{playResult?.desc}</div>
            <button onClick={advanceGame} style={{...btn,width:"100%",padding:12,background:"linear-gradient(135deg,#fbbf24,#f97316)",color:"#000",fontSize:14,fontWeight:800,letterSpacing:1}}>KICKOFF →</button>
          </div>
        )}

        {log.length>0&&<div style={{marginTop:8,maxHeight:80,overflowY:"auto",fontSize:10,color:"#4a5a70"}}>{log.map((e,i)=><div key={i} style={{padding:"1px 0",opacity:1-i*0.06}}>{e}</div>)}</div>}
      </div>
    </div>
  );
}
