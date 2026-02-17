import { useState, useEffect, useCallback, useRef } from "react";

// ==================== CONSTANTS ====================
const FIELD_W = 680;
const FIELD_H = 460;
const PX_PER_YARD = FIELD_H / 38;
const ANIM_MS = 600;
const PASS_ANIM_MS = 480;
const MAX_QB_ACTIONS = 4;
const MAX_RUN_ACTIONS = 4; // separate budget for runner

const rand = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const R = (x, y) => ({ x, y });

// Real-yard distance (x 0-100 = 53.3 yds wide)
function fieldDist(a, b) {
  const dx = (a.x - b.x) * 0.533;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ==================== PLAYERS ====================
const P = (id, pos, label, spd, str, skl) => ({ id, pos, label, spd, str, skl });

const OFF = [
  P("qb","QB","QB", 6, 5, 9),
  P("rb","RB","RB", 8, 7, 7),
  P("wr1","WR","W1", 9, 4, 8),
  P("wr2","WR","W2", 8, 5, 7),
  P("te","TE","TE", 6, 8, 6),
  P("ol1","OL","▪", 3, 9, 5), P("ol2","OL","▪", 3, 9, 5),
  P("c","OL","▪", 3, 10, 5), P("ol4","OL","▪", 3, 9, 5), P("ol5","OL","▪", 3, 9, 5),
];
const DEF = [
  P("de1","DL","DE", 6, 9, 6), P("dt1","DL","DT", 4, 10, 5),
  P("dt2","DL","DT", 4, 10, 5), P("de2","DL","DE", 6, 9, 6),
  P("olb1","LB","LB", 7, 7, 7), P("mlb","LB","LB", 7, 8, 8), P("olb2","LB","LB", 7, 7, 7),
  P("cb1","CB","CB", 9, 4, 8), P("cb2","CB","CB", 9, 4, 7),
  P("ss","S","SS", 8, 6, 7), P("fs","S","FS", 9, 5, 8),
];
const getP = (roster, id) => roster.find(p => p.id === id);
const OL_IDS = ["ol1","ol2","c","ol4","ol5"];
const DL_IDS = ["de1","dt1","dt2","de2"];

// ==================== ROUTES ====================
const routeLib = {
  goL:(sx,sy)=>[R(sx,sy+5),R(sx+1,sy+12),R(sx+1,sy+21),R(sx+1,sy+30)],
  goR:(sx,sy)=>[R(sx,sy+5),R(sx-1,sy+12),R(sx-1,sy+21),R(sx-1,sy+30)],
  slantIn:(sx,sy,d)=>[R(sx+d*4,sy+3),R(sx+d*10,sy+6),R(sx+d*16,sy+9),R(sx+d*20,sy+12)],
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

// ==================== FORMATIONS ====================
const FORM_I={qb:R(50,-3),rb:R(50,-7),wr1:R(8,0),wr2:R(92,0),te:R(66,0),ol1:R(38,0),ol2:R(43,0),c:R(50,0),ol4:R(57,0),ol5:R(62,0)};
const FORM_SG={qb:R(50,-5),rb:R(42,-5),wr1:R(6,0),wr2:R(94,0),te:R(68,0),ol1:R(38,0),ol2:R(43,0),c:R(50,0),ol4:R(57,0),ol5:R(62,0)};
const FORM_SP={qb:R(50,-5),rb:R(43,-5),wr1:R(5,0),wr2:R(95,0),te:R(78,0),ol1:R(38,0),ol2:R(43,0),c:R(50,0),ol4:R(57,0),ol5:R(62,0)};

const PLAYS = [
  {name:"HB Dive",icon:"🏈",type:"run",desc:"Power run up the middle",formation:FORM_I,
    routes:{wr1:routeLib.goL(8,0),wr2:routeLib.goR(92,0),te:routeLib.block(66,0),rb:routeLib.dive(50,-7)}},
  {name:"HB Sweep",icon:"↗️",type:"run",desc:"Outside run — speed vs edge",formation:FORM_I,
    routes:{wr1:routeLib.block(8,0),wr2:routeLib.goR(92,0),te:routeLib.block(66,0),rb:routeLib.sweep(50,-7,-1)}},
  {name:"Quick Slants",icon:"⚡",type:"pass",desc:"Fast timing routes inside",formation:FORM_SG,
    routes:{wr1:routeLib.slantIn(6,0,1),wr2:routeLib.slantIn(94,0,-1),te:routeLib.seam(68,0,-1),rb:routeLib.checkdown(42,-5,-1)}},
  {name:"Deep Post",icon:"🎯",type:"pass",desc:"WR1 deep post — big play",formation:FORM_SG,
    routes:{wr1:routeLib.post(6,0,1),wr2:routeLib.out(94,0,1),te:routeLib.curl(68,0),rb:routeLib.checkdown(42,-5,-1)}},
  {name:"Play Action",icon:"🎭",type:"pass",desc:"Fake dive, hit TE on seam",formation:FORM_I,
    routes:{wr1:routeLib.post(8,0,1),wr2:routeLib.out(92,0,1),te:routeLib.seam(66,0,-1),rb:routeLib.dive(50,-7)},playAction:true},
  {name:"Screen Pass",icon:"🪤",type:"pass",desc:"Let them rush, dump to RB",formation:FORM_SG,
    routes:{wr1:routeLib.goL(6,0),wr2:routeLib.goR(94,0),te:routeLib.flat(68,0,-1),rb:routeLib.screen(42,-5,-1)}},
  {name:"Wheel Route",icon:"🎡",type:"pass",desc:"RB swings deep — LB killer",formation:FORM_SP,
    routes:{wr1:routeLib.slantIn(5,0,1),wr2:routeLib.goR(95,0),te:routeLib.out(78,0,1),rb:routeLib.wheel(43,-5,-1)}},
];

// ==================== DEFENSE SCHEMES ====================
const DEF_SCHEMES = {
  base43:{name:"4-3 Base",pos:{de1:R(34,1.5),dt1:R(46,1),dt2:R(54,1),de2:R(66,1.5),olb1:R(28,5),mlb:R(50,5),olb2:R(72,5),cb1:R(10,7),cb2:R(90,7),ss:R(55,14),fs:R(45,18)}},
  nickel:{name:"Nickel",pos:{de1:R(36,1.5),dt1:R(46,1),dt2:R(54,1),de2:R(64,1.5),olb1:R(30,5),mlb:R(50,5),olb2:R(78,5),cb1:R(8,6),cb2:R(92,6),ss:R(60,12),fs:R(40,18)}},
  blitz:{name:"Blitz",pos:{de1:R(34,1.5),dt1:R(46,1),dt2:R(54,1),de2:R(66,1.5),olb1:R(38,2.5),mlb:R(50,3),olb2:R(62,2.5),cb1:R(10,7),cb2:R(90,7),ss:R(55,8),fs:R(45,15)}},
  cover2:{name:"Cover 2",pos:{de1:R(34,1.5),dt1:R(46,1),dt2:R(54,1),de2:R(66,1.5),olb1:R(30,5),mlb:R(50,5.5),olb2:R(70,5),cb1:R(10,4),cb2:R(90,4),ss:R(30,18),fs:R(70,18)}},
  goalline:{name:"Goal Line",pos:{de1:R(32,1),dt1:R(44,0.8),dt2:R(56,0.8),de2:R(68,1),olb1:R(36,2.5),mlb:R(50,2.5),olb2:R(64,2.5),cb1:R(14,4),cb2:R(86,4),ss:R(50,8),fs:R(50,13)}},
};

const pickDefScheme = (down,dst,ballOn) => {
  const w={base43:25,nickel:20,blitz:15,cover2:20,goalline:5};
  if(dst<=2){w.goalline+=25;w.blitz+=10;}if(dst>=8){w.nickel+=15;w.cover2+=15;}
  if(down>=3&&dst>=5){w.nickel+=10;w.cover2+=10;w.blitz+=8;}if(ballOn>=90)w.goalline+=20;
  const entries=Object.entries(w);const total=entries.reduce((s,[,v])=>s+v,0);
  let r=Math.random()*total;for(const[k,v]of entries){r-=v;if(r<=0)return{key:k,...DEF_SCHEMES[k]};}return{key:"base43",...DEF_SCHEMES.base43};
};

const CB_ASSIGN={cb1:"wr1",cb2:"wr2"};

// ==================== O-LINE BLOCKING SYSTEM ====================
// OL positions: they step forward and engage nearest DL
function computeOLPositions(formation, phase, scheme) {
  const olPositions = {};
  const dlStarts = {};
  for (const dlId of DL_IDS) {
    dlStarts[dlId] = scheme.pos[dlId];
  }
  for (const olId of OL_IDS) {
    const s = formation[olId];
    // OL pushes forward to meet rushers
    const pushFwd = Math.min(phase * 0.6, 2);
    // Find nearest DL and shift toward them
    let nearestDL = null; let nearDist = 999;
    for (const [dlId, dlPos] of Object.entries(dlStarts)) {
      const d = Math.abs(s.x - dlPos.x);
      if (d < nearDist) { nearDist = d; nearestDL = dlPos; }
    }
    let shiftX = 0;
    if (nearestDL && nearDist < 20) {
      shiftX = (nearestDL.x - s.x) * Math.min(phase * 0.08, 0.25);
    }
    olPositions[olId] = R(s.x + shiftX, s.y + pushFwd);
  }
  return olPositions;
}

// ==================== DEFENSE AI WITH BLOCKING ====================
function computeDefPos(scheme, phase, qbP, offP, isRun, bcId, olPositions) {
  const pos = {};
  const ms = Math.min(phase, 3);

  for (const p of DEF) {
    const s = scheme.pos[p.id]; if (!s) continue;

    if (p.pos === "DL") {
      // DL tries to rush QB but gets blocked by nearest OL
      const target = isRun && bcId !== "qb" && offP[bcId] ? offP[bcId] : qbP;
      let rushX = s.x + (target.x - s.x) * 0.12 * ms;
      let rushY = s.y - (s.y - target.y) * 0.25 * ms;

      // BLOCKING: find nearest OL and get slowed
      if (olPositions) {
        let nearOL = null; let nearDist = 999;
        for (const olId of OL_IDS) {
          const olP = olPositions[olId];
          if (!olP) continue;
          const d = fieldDist(R(rushX, rushY), olP);
          if (d < nearDist) { nearDist = d; nearOL = olP; }
        }
        if (nearOL && nearDist < 5) {
          // OL is engaging this rusher — push them back toward their start
          const blockStr = 0.6 + (ms < 2 ? 0.3 : 0); // OL stronger early
          const olStr = 9; // avg OL strength
          const dlStr = p.str;
          const advantage = (olStr - dlStr + 2) * 0.1 * blockStr;
          // Rusher gets stuck near the OL position
          rushX = nearOL.x + (rushX - nearOL.x) * clamp(1 - advantage, 0.15, 0.8);
          rushY = nearOL.y + (rushY - nearOL.y) * clamp(1 - advantage, 0.15, 0.8);
          // Add some lateral push
          if (p.id === "de1" || p.id === "de2") {
            const pushDir = p.id === "de1" ? -1 : 1;
            rushX += pushDir * (ms * 0.5) * clamp(advantage, -0.3, 0.3);
          }
        }
      }
      pos[p.id] = R(rushX, rushY);

    } else if (p.pos === "LB") {
      if (scheme.key === "blitz") {
        // Blitzing LBs also get blocked if they hit the OL
        let rushX = s.x + (qbP.x - s.x) * 0.15 * ms;
        let rushY = s.y - (s.y - qbP.y) * 0.28 * ms;
        if (olPositions) {
          for (const olId of OL_IDS) {
            const olP = olPositions[olId];
            if (!olP) continue;
            if (fieldDist(R(rushX, rushY), olP) < 3) {
              rushX = olP.x + (rushX - olP.x) * 0.4;
              rushY = olP.y + (rushY - olP.y) * 0.4;
              break;
            }
          }
        }
        pos[p.id] = R(rushX, rushY);
      } else if (isRun && offP[bcId]) {
        const t = offP[bcId];
        pos[p.id] = R(s.x + (t.x - s.x) * 0.12 * ms, s.y - (s.y - t.y) * 0.15 * ms);
      } else {
        pos[p.id] = R(s.x, s.y + ms * 0.5);
      }
    } else if (p.pos === "CB") {
      const wr = offP[CB_ASSIGN[p.id]];
      if (wr) {
        const lag = (10 - p.spd) * 0.8 + 1.5;
        const trackRate = Math.max(0.05, 0.15 * ms - lag * 0.03);
        const cushion = ms <= 1 ? 2 : 0.5;
        pos[p.id] = R(s.x + (wr.x - s.x) * trackRate, clamp(s.y + (wr.y - s.y) * trackRate - cushion, s.y - 3, 32));
      } else pos[p.id] = s;
    } else if (p.pos === "S") {
      const threats = ["wr1","wr2","te"].map(id => offP[id]).filter(Boolean);
      const deepest = threats.reduce((a, b) => (b && b.y > (a?.y || 0) ? b : a), null);
      if (deepest) {
        const rd = ms <= 1 ? 0.02 : 0.05;
        pos[p.id] = R(s.x + (deepest.x - s.x) * rd * ms, s.y + Math.max(0, (deepest.y - s.y) * rd * ms));
      } else pos[p.id] = s;
    }
  }
  return pos;
}

// ==================== GAME LOGIC ====================
function getOpenness(recId, offP, defP) {
  const rec = offP[recId]; if (!rec) return { openness: 0, label: "N/A", color: "#666" };
  let nearest = 999;
  for (const id of Object.keys(defP)) { const d = fieldDist(rec, defP[id]); if (d < nearest) nearest = d; }
  if (nearest > 8) return { openness: 3, label: "WIDE OPEN", color: "#22c55e" };
  if (nearest > 5) return { openness: 2, label: "OPEN", color: "#86efac" };
  if (nearest > 3) return { openness: 1, label: "CONTESTED", color: "#fbbf24" };
  return { openness: 0, label: "COVERED", color: "#ef4444" };
}

function getNearestDef(runnerPos, defP) {
  let nearest = 999; let nearId = null;
  for (const [id, dp] of Object.entries(defP)) {
    const d = fieldDist(runnerPos, dp);
    if (d < nearest) { nearest = d; nearId = id; }
  }
  return { dist: nearest, id: nearId, player: getP(DEF, nearId) };
}

function getPressure(phase, scheme) {
  let b = phase * 18; if (scheme.key === "blitz") b += 22; if (scheme.key === "cover2") b -= 8;
  return clamp(b + rand(-8, 5), 0, 100);
}

function resolveThrow(recId, phase, qbP, offP, defP, scheme) {
  const rec = getP(OFF, recId);
  const open = getOpenness(recId, offP, defP), recPos = offP[recId];
  const pressure = getPressure(phase, scheme);
  let catchProb = 0.40 + open.openness * 0.15 + rec.skl * 0.02 - (pressure / 250);
  catchProb = clamp(catchProb, 0.12, 0.95);
  const intProb = open.openness <= 0 ? 0.10 + phase * 0.02 : open.openness === 1 ? 0.03 : 0.01;
  if (Math.random() < intProb) return { complete: false, intercepted: true, yards: 0, desc: `INTERCEPTED! ${recId.toUpperCase()} was blanketed`, targetPos: recPos };
  if (Math.random() > catchProb) {
    const reasons = ["ball sails high under pressure", "pass hits the turf", "CB knocks it away", "receiver can't haul it in"];
    return { complete: false, intercepted: false, yards: 0, desc: `Incomplete — ${reasons[rand(0, reasons.length - 1)]}`, targetPos: recPos };
  }
  return { complete: true, intercepted: false, yards: Math.round(recPos.y), catcherId: recId, desc: `${recId.toUpperCase()} makes the catch!`, targetPos: recPos };
}

function resolveSack(phase, scheme) {
  const p = getPressure(phase, scheme); const ch = (p - 45) / 130;
  if (Math.random() < ch) { const loss = rand(3, 8); return { sacked: true, yards: -loss, desc: `SACKED! Loss of ${loss}` }; }
  return { sacked: false };
}

// ==================== MAIN COMPONENT ====================
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
  const [passResult, setPassResult] = useState(null);

  // CAMERA: offset in yards to keep ball carrier on screen
  const [cameraY, setCameraY] = useState(0);
  // RUNNER action count (separate from QB phase)
  const [runActions, setRunActions] = useState(0);
  // Narrative feedback
  const [actionNarrative, setActionNarrative] = useState("");
  // Defender proximity info for runner
  const [nearestDefInfo, setNearestDefInfo] = useState(null);

  // Camera follow
  const targetCamRef = useRef(0);
  useEffect(() => {
    let target = 0;
    if (mode !== "playcall") {
      const carrier = ballCarrierPos || (ballCarrier === "qb" ? qbPos : null);
      if (carrier) {
        // If carrier is more than 8 yards from center, shift camera
        if (carrier.y > 8) target = carrier.y - 8;
        else if (carrier.y < -8) target = carrier.y + 8;
      }
    }
    targetCamRef.current = target;
    setCameraY(target);
  }, [mode, ballCarrierPos, qbPos, ballCarrier, actionPhase, runActions]);

  const yardToY = useCallback((y) => {
    return FIELD_H / 2 - (y - cameraY) * PX_PER_YARD;
  }, [cameraY]);
  const pctToX = (p) => (p / 100) * FIELD_W;

  // ==================== POSITION COMPUTATION ====================
  const getOLPos = useCallback((phase) => {
    if (!selectedPlay || !defScheme) return {};
    return computeOLPositions(selectedPlay.formation, phase, defScheme);
  }, [selectedPlay, defScheme]);

  const getOffPos = useCallback((phase) => {
    if (!selectedPlay) return {};
    const pos = {}, f = selectedPlay.formation;
    for (const id of ["wr1","wr2","te","rb"]) {
      const route = selectedPlay.routes[id];
      if (!route) { pos[id] = f[id]; continue; }
      pos[id] = phase === 0 ? f[id] : route[clamp(phase - 1, 0, route.length - 1)];
    }
    pos.qb = qbPos;
    // OL from blocking system
    const olPos = getOLPos(phase);
    Object.assign(pos, olPos);
    return pos;
  }, [selectedPlay, qbPos, getOLPos]);

  const getDefP = useCallback((phase) => {
    if (!defScheme) return {};
    const offP = getOffPos(phase);
    const olPos = getOLPos(phase);
    return computeDefPos(defScheme, phase, qbPos, offP, isRunPlay, ballCarrier, olPos);
  }, [defScheme, getOffPos, getOLPos, qbPos, isRunPlay, ballCarrier]);

  const offPos = getOffPos(actionPhase);
  const defPos = getDefP(actionPhase);
  const pressure = defScheme ? getPressure(actionPhase, defScheme) : 0;

  // Ball follows carrier
  useEffect(() => {
    if (ballState !== "held") return;
    if (ballCarrier === "qb") setBallPos({ ...qbPos });
    else if (ballCarrierPos) setBallPos({ ...ballCarrierPos });
    else { const p = offPos[ballCarrier]; if (p) setBallPos({ ...p }); }
  }, [ballState, ballCarrier, qbPos, ballCarrierPos, offPos, actionPhase]);

  // ==================== ACTIONS ====================
  const snapBall = () => {
    const def = pickDefScheme(game.down, game.distance, game.ballOn);
    setDefScheme(def); setActionPhase(0);
    const startQb = selectedPlay.formation.qb;
    setQbPos(startQb); setBallCarrier("qb"); setBallCarrierPos(null);
    setIsRunPlay(false); setPlayResult(null); setHandedOff(false);
    setBallState("held"); setBallPos({ ...startQb }); setBallAnim(false); setPassResult(null);
    setRunActions(0); setActionNarrative(""); setNearestDefInfo(null); setCameraY(0);
    const cPos = selectedPlay.formation.c;
    setBallPos({ ...cPos }); setBallState("air"); setBallAnim(true);
    setTimeout(() => {
      setBallPos({ ...startQb });
      setTimeout(() => {
        setBallState("held"); setBallAnim(false);
        setActionPhase(1);
        setTimeout(() => setMode("decision"), ANIM_MS);
      }, 250);
    }, 120);
    setMode("snapping");
  };

  const endPlay = (yards, desc, turnover = false, incomplete = false) => {
    if (incomplete) setBallState("ground");
    if (turnover) setBallState("loose");
    setPlayResult({ yards, desc, turnover, incomplete }); setMode("result");
    setActionNarrative("");
  };

  const animate = (nextPhase) => {
    setMode("animating");
    setTimeout(() => {
      setActionPhase(nextPhase);
      const sack = resolveSack(nextPhase, defScheme);
      if (sack.sacked) { setTimeout(() => endPlay(sack.yards, sack.desc), ANIM_MS); return; }
      if (nextPhase >= MAX_QB_ACTIONS - 1) {
        setTimeout(() => setMode("decision"), ANIM_MS);
        return;
      }
      setTimeout(() => setMode("decision"), ANIM_MS);
    }, 250);
  };

  const doAction = (action) => {
    const np = actionPhase + 1;
    setActionNarrative("");
    switch (action.type) {
      case "dropback":
        setQbPos(p => R(p.x, p.y - 2.5)); animate(np); break;
      case "scramble_left":
        setQbPos(p => R(clamp(p.x - 14, 5, 95), p.y - 1)); animate(np); break;
      case "scramble_right":
        setQbPos(p => R(clamp(p.x + 14, 5, 95), p.y + 1)); animate(np); break;
      case "throw": {
        const curOff = getOffPos(actionPhase), curDef = getDefP(actionPhase);
        const result = resolveThrow(action.target, actionPhase, qbPos, curOff, curDef, defScheme);
        const targetFieldPos = curOff[action.target];
        setBallState("air"); setBallAnim(true);
        setPassResult({ result, np, targetFieldPos, targetId: action.target });
        setTimeout(() => setBallPos({ ...targetFieldPos }), 40);
        setTimeout(() => {
          setBallAnim(false);
          if (result.intercepted) { setBallState("loose"); endPlay(0, result.desc, true); }
          else if (!result.complete) { setBallState("ground"); endPlay(0, result.desc, false, true); }
          else {
            setBallState("held"); setBallCarrier(result.catcherId);
            setBallCarrierPos({ ...targetFieldPos }); setBallPos({ ...targetFieldPos });
            setIsRunPlay(true); setRunActions(0);
            setActionNarrative(`${result.catcherId.toUpperCase()} makes the catch at +${result.yards}!`);
            // Update nearest defender info
            const nd = getNearestDef(targetFieldPos, curDef);
            setNearestDefInfo(nd);
            setMode("animating");
            setTimeout(() => { setActionPhase(np); setTimeout(() => setMode("runner_decision"), ANIM_MS); }, 250);
          }
          setPassResult(null);
        }, PASS_ANIM_MS);
        break;
      }
      case "handoff": {
        setIsRunPlay(true); setBallCarrier("rb"); setHandedOff(true);
        const rbRoute = selectedPlay.routes.rb;
        const rbP = rbRoute ? rbRoute[clamp(actionPhase - 1, 0, rbRoute.length - 1)] : selectedPlay.formation.rb;
        setBallCarrierPos(rbP); setBallState("held"); setBallPos({ ...rbP });
        setRunActions(0); setActionNarrative("Handoff to RB!");
        setMode("animating");
        setTimeout(() => { setActionPhase(np); setTimeout(() => setMode("runner_decision"), ANIM_MS); }, 250);
        break;
      }
      case "tuck_run":
        setIsRunPlay(true); setBallCarrier("qb"); setBallCarrierPos({ ...qbPos });
        setRunActions(0); setActionNarrative("QB tucks it and runs!");
        setMode("animating");
        setTimeout(() => { setActionPhase(np); setTimeout(() => setMode("runner_decision"), ANIM_MS); }, 250);
        break;
      default: break;
    }
  };

  // ==================== RUNNER ACTIONS ====================
  const doRunnerAction = (action) => {
    const newRunActions = runActions + 1;
    let newPos = ballCarrierPos ? { ...ballCarrierPos } : { ...qbPos };
    const runner = getP(OFF, ballCarrier);
    const curDef = getDefP(actionPhase);
    const nd = getNearestDef(newPos, curDef);
    let narrative = "";
    let forceEnd = false;
    let endDesc = "";

    switch (action.type) {
      case "sprint": {
        const gain = (runner.spd - 3) * 0.8 + rand(0, 3);
        newPos = R(newPos.x, newPos.y + gain);
        narrative = `${ballCarrier.toUpperCase()} puts his head down and sprints — +${Math.round(gain)} yards!`;
        break;
      }
      case "juke_left": {
        const success = Math.random() < (runner.skl / 12 + 0.15);
        if (success) {
          newPos = R(clamp(newPos.x - 12, 3, 97), newPos.y + rand(2, 5));
          narrative = `Quick juke left! ${ballCarrier.toUpperCase()} shakes the defender!`;
        } else {
          newPos = R(clamp(newPos.x - 5, 3, 97), newPos.y + rand(0, 1));
          narrative = `Juke left — ${nd.player?.label || "defender"} reads it, barely any gain.`;
          if (nd.dist < 4) { forceEnd = true; endDesc = `${nd.player?.label || "Defender"} wraps up after the failed juke`; }
        }
        break;
      }
      case "juke_right": {
        const success = Math.random() < (runner.skl / 12 + 0.15);
        if (success) {
          newPos = R(clamp(newPos.x + 12, 3, 97), newPos.y + rand(2, 5));
          narrative = `Quick juke right! ${ballCarrier.toUpperCase()} makes him miss!`;
        } else {
          newPos = R(clamp(newPos.x + 5, 3, 97), newPos.y + rand(0, 1));
          narrative = `Juke right — didn't fool anyone.`;
          if (nd.dist < 4) { forceEnd = true; endDesc = `Tackled after the failed juke`; }
        }
        break;
      }
      case "spin": {
        const success = Math.random() < (runner.skl / 13 + 0.1);
        if (success) {
          newPos = R(newPos.x + rand(-6, 6), newPos.y + rand(4, 7));
          narrative = `SPIN MOVE! ${ballCarrier.toUpperCase()} breaks the tackle!`;
        } else {
          forceEnd = true;
          endDesc = `Spin move fails — ${nd.player?.label || "defender"} tackles through it`;
          narrative = endDesc;
        }
        break;
      }
      case "stiff_arm": {
        const success = Math.random() < (runner.str / 12 + 0.1);
        if (success) {
          newPos = R(newPos.x, newPos.y + rand(3, 6));
          narrative = `STIFF ARM! ${ballCarrier.toUpperCase()} throws the defender aside!`;
        } else {
          newPos = R(newPos.x, newPos.y + rand(0, 2));
          narrative = `Stiff arm attempt — ${nd.player?.label || "defender"} absorbs it.`;
          if (nd.dist < 3) { forceEnd = true; endDesc = `Wrapped up after the failed stiff arm`; }
        }
        break;
      }
      case "cut_sideline": {
        // Head for sideline — hard to tackle but limits field
        const dir = newPos.x < 50 ? -1 : 1;
        newPos = R(clamp(newPos.x + dir * 18, 2, 98), newPos.y + rand(1, 4));
        narrative = `${ballCarrier.toUpperCase()} breaks for the sideline!`;
        break;
      }
      case "dive": {
        newPos = R(newPos.x, newPos.y + rand(1, 3));
        setBallCarrierPos(newPos); setBallPos({ ...newPos });
        setActionNarrative(`${ballCarrier.toUpperCase()} dives forward — safe play.`);
        endPlay(Math.round(newPos.y), `${ballCarrier.toUpperCase()} dives forward for +${Math.max(0, Math.round(newPos.y))}`);
        return;
      }
      case "protect_ball": {
        // No yards but much harder to fumble / get stripped
        newPos = R(newPos.x, newPos.y + rand(0, 1));
        narrative = `${ballCarrier.toUpperCase()} tucks the ball and braces for contact.`;
        break;
      }
      default: break;
    }

    setBallCarrierPos(newPos); setBallPos({ ...newPos });
    if (ballCarrier === "qb") setQbPos(newPos);
    setRunActions(newRunActions);
    setActionNarrative(narrative);

    if (forceEnd) {
      setTimeout(() => endPlay(Math.round(newPos.y), endDesc || narrative), ANIM_MS);
      setMode("animating");
      return;
    }

    // Tackle check with updated defender positions
    const updatedDef = computeDefPos(defScheme, actionPhase, ballCarrier === "qb" ? newPos : qbPos,
      { ...getOffPos(actionPhase), [ballCarrier]: newPos }, true, ballCarrier, getOLPos(actionPhase));
    const newNd = getNearestDef(newPos, updatedDef);
    setNearestDefInfo(newNd);

    // Tackle probability based on proximity
    const tp = newNd.dist < 2 ? 0.90 : newNd.dist < 3.5 ? 0.55 : newNd.dist < 5 ? 0.25 : newNd.dist < 7 ? 0.10 : 0.03;
    const tackled = Math.random() < tp;

    if (tackled) {
      const tackler = newNd.player;
      const yds = Math.round(newPos.y);
      const tackleDescs = [
        `${tackler?.label || "Defender"} brings him down at +${yds}`,
        `${tackler?.label || "Defender"} wraps up for the tackle at +${yds}`,
        `Dragged down by ${tackler?.label || "the defender"} after +${yds}`,
      ];
      setTimeout(() => endPlay(yds, tackleDescs[rand(0, tackleDescs.length - 1)]), ANIM_MS);
      setMode("animating");
    } else if (newRunActions >= MAX_RUN_ACTIONS) {
      const yds = Math.round(newPos.y);
      setTimeout(() => endPlay(yds, `${ballCarrier.toUpperCase()} finally brought down after +${yds}`), ANIM_MS);
      setMode("animating");
    } else {
      setMode("animating");
      setTimeout(() => setMode("runner_decision"), ANIM_MS);
    }
  };

  const advanceGame = () => {
    if (!playResult) return;
    const r = playResult;
    setGame(g => {
      let { ballOn, down, distance, score, quarter, playsRun } = { ...g }; playsRun++;
      if (r.turnover) { setLog(l => [`💥 ${r.desc}`, ...l].slice(0, 25)); return { ballOn: 25, down: 1, distance: 10, score, quarter, playsRun }; }
      const nb = clamp(ballOn + r.yards, 0, 100);
      if (nb >= 100) { const ns = { ...score, you: score.you + 7 }; setLog(l => [`🏈 TD! ${r.desc}`, ...l].slice(0, 25)); return { ballOn: 25, down: 1, distance: 10, score: ns, quarter, playsRun }; }
      if (nb <= 0) { const ns = { ...score, cpu: score.cpu + 2 }; setLog(l => [`⚠️ Safety!`, ...l].slice(0, 25)); return { ballOn: 25, down: 1, distance: 10, score: ns, quarter, playsRun }; }
      const gained = nb - ballOn, nd = distance - gained;
      if (nd <= 0) { setLog(l => [`✅ 1st down! +${gained}`, ...l].slice(0, 25)); return { ballOn: nb, down: 1, distance: Math.min(10, 100 - nb), score, quarter: Math.min(4, Math.floor(playsRun / 12) + 1), playsRun }; }
      if (down >= 4) { setLog(l => [`↩️ Turnover on downs`, ...l].slice(0, 25)); return { ballOn: 25, down: 1, distance: 10, score, quarter, playsRun }; }
      setLog(l => [`${gained >= 0 ? "+" : ""}${gained} — ${r.desc}`, ...l].slice(0, 25));
      return { ballOn: nb, down: down + 1, distance: nd, score, quarter: Math.min(4, Math.floor(playsRun / 12) + 1), playsRun };
    });
    setMode("playcall"); setSelectedPlay(null); setDefScheme(null); setPlayResult(null);
    setActionPhase(0); setHandedOff(false); setBallState("held"); setBallAnim(false);
    setPassResult(null); setCameraY(0); setRunActions(0); setActionNarrative(""); setNearestDefInfo(null);
  };

  // ==================== ACTION LISTS ====================
  const getQBActions = () => {
    const actions = [];
    for (const id of ["wr1","wr2","te","rb"]) {
      if (id === "rb" && handedOff) continue;
      const pos = offPos[id]; if (!pos) continue;
      const open = getOpenness(id, offPos, defPos);
      const yds = Math.round(pos.y);
      actions.push({ type: "throw", target: id, category: "throw", label: id.toUpperCase(), sublabel: `${yds > 0 ? "+" : ""}${yds}yds`, openness: open });
    }
    if (actionPhase < MAX_QB_ACTIONS - 1) {
      actions.push({ type: "dropback", category: "move", label: "Drop Back", sublabel: "Buy time" });
      actions.push({ type: "scramble_left", category: "move", label: "Scramble L", sublabel: "Roll left" });
      actions.push({ type: "scramble_right", category: "move", label: "Scramble R", sublabel: "Roll right" });
    }
    if (actionPhase <= 1 && !handedOff) actions.push({ type: "handoff", category: "other", label: "Hand Off", sublabel: "Give to RB" });
    actions.push({ type: "tuck_run", category: "other", label: "Tuck & Run", sublabel: "QB keeps it" });
    return actions;
  };

  const getRunnerActions = () => {
    const nd = nearestDefInfo;
    const defClose = nd && nd.dist < 5;
    const actions = [
      { type: "sprint", category: "move", label: "Sprint", sublabel: "Straight upfield", risk: defClose ? "med" : "low" },
      { type: "juke_left", category: "move", label: "Juke Left", sublabel: "Quick cut left", risk: defClose ? "med" : "low" },
      { type: "juke_right", category: "move", label: "Juke Right", sublabel: "Quick cut right", risk: defClose ? "med" : "low" },
    ];
    if (defClose) {
      actions.push({ type: "spin", category: "evasion", label: "Spin Move", sublabel: "Break a tackle", risk: "high" });
      actions.push({ type: "stiff_arm", category: "evasion", label: "Stiff Arm", sublabel: "Push off tackler", risk: "med" });
    }
    actions.push({ type: "cut_sideline", category: "move", label: "Sideline", sublabel: "Break to boundary", risk: "low" });
    actions.push({ type: "dive", category: "safe", label: "Dive", sublabel: "End play safely", risk: "none" });
    return actions;
  };

  // ==================== RENDER ====================
  const renderPlayer = (id, pos, team) => {
    if (!pos) return null;
    const isOff = team === "off";
    const roster = isOff ? OFF : DEF;
    const player = getP(roster, id); if (!player) return null;
    const isOL = player.pos === "OL";
    const hasBall = isOff && ballState === "held" && id === ballCarrier && mode !== "playcall";
    const isTarget = isOff && !isOL && mode === "decision" && ballCarrier === "qb" && ["wr1","wr2","te","rb"].includes(id);
    const px = pctToX(pos.x), py = yardToY(pos.y);
    if (py < -40 || py > FIELD_H + 40) return null; // off screen
    const sz = isOL ? 24 : 30;
    let borderColor = isOff ? (isOL ? "#3a6aaa" : "#4a8ad4") : (player.pos === "DL" ? "#b33" : "#e05555");
    if (hasBall) borderColor = "#fbbf24";
    if (isTarget) borderColor = getOpenness(id, offPos, defPos).color;
    // OL engaged state: show them brighter when blocking
    const olEngaged = isOL && mode !== "playcall";

    return (
      <div key={`${team}-${id}`} style={{
        position: "absolute", left: px - sz / 2, top: py - sz / 2, width: sz, height: sz,
        borderRadius: "50%",
        background: isOff ? (isOL ? (olEngaged ? "#2a5580" : "#1a3d6e") : "#1e56a0") : (player.pos === "DL" ? "#7a1a1a" : "#b82020"),
        border: `${hasBall || isTarget ? 3 : 2}px solid ${borderColor}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: isOL ? 8 : 9, fontWeight: 700, color: "#fff", zIndex: 10,
        transition: mode === "animating" || mode === "snapping" ? `all ${ANIM_MS}ms ease` : "none",
        boxShadow: olEngaged ? "0 0 6px rgba(58,106,170,0.4)" : "0 1px 3px rgba(0,0,0,0.5)",
        fontFamily: "monospace",
      }}>
        {player.label}
      </div>
    );
  };

  const renderRunnerOverlay = () => {
    if (!ballCarrierPos || !isRunPlay || ballCarrier === "qb" || mode === "playcall") return null;
    if (ballState !== "held") return null;
    const sz = 32, px = pctToX(ballCarrierPos.x), py = yardToY(ballCarrierPos.y);
    if (py < -40 || py > FIELD_H + 40) return null;
    return (
      <div style={{
        position: "absolute", left: px - sz / 2, top: py - sz / 2, width: sz, height: sz,
        borderRadius: "50%", background: "#1e56a0", border: "3px solid #fbbf24",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 9, fontWeight: 700, color: "#fff", zIndex: 12,
        transition: mode === "animating" ? `all ${ANIM_MS}ms ease` : "none",
        fontFamily: "monospace",
      }}>
        {getP(OFF, ballCarrier)?.label}
      </div>
    );
  };

  const renderBall = () => {
    if (mode === "playcall") return null;
    const bx = pctToX(ballPos.x), by = yardToY(ballPos.y);
    if (by < -40 || by > FIELD_H + 40) return null;
    const isAir = ballState === "air", isGround = ballState === "ground", isLoose = ballState === "loose", isHeld = ballState === "held";
    const holdOff = isHeld ? -18 : 0;
    const rot = isGround ? "rotate(45deg)" : isLoose ? "rotate(120deg)" : isAir ? "rotate(-30deg)" : "rotate(-15deg)";

    return (
      <>
        {isAir && <div style={{ position: "absolute", left: bx - 6, top: by + 8, width: 12, height: 6, borderRadius: "50%", background: "rgba(0,0,0,0.3)", transition: ballAnim ? `all ${PASS_ANIM_MS}ms ease-out` : "none", zIndex: 18 }} />}
        <div style={{
          position: "absolute", left: bx - 10, top: by - 10 + holdOff,
          width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: isAir ? 18 : 15, zIndex: isAir ? 25 : isHeld ? 20 : 16,
          transform: `${rot} scale(${isAir ? 1.3 : 1})`,
          transition: isAir && ballAnim ? `all ${PASS_ANIM_MS}ms ease-out` : mode === "animating" || mode === "snapping" ? `all ${ANIM_MS}ms ease` : "none",
          filter: isAir ? "drop-shadow(0 4px 8px rgba(0,0,0,0.6))" : isHeld ? "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" : "none",
          opacity: isGround || isLoose ? 0.7 : 1, pointerEvents: "none",
        }}>🏈</div>
        {isHeld && <div style={{
          position: "absolute", left: bx - 18, top: by - 18, width: 36, height: 36, borderRadius: "50%",
          border: "2px solid rgba(251,191,36,0.5)", zIndex: 13,
          transition: mode === "animating" || mode === "snapping" ? `all ${ANIM_MS}ms ease` : "none",
          animation: "pulse 1.5s ease-in-out infinite", pointerEvents: "none",
        }} />}
      </>
    );
  };

  const downLabel = ["","1st","2nd","3rd","4th"][game.down] || "4th";
  const ballLabel = game.ballOn > 50 ? `OPP ${100 - game.ballOn}` : `OWN ${game.ballOn}`;
  const btn = { border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", transition: "all 0.1s" };

  const riskColor = { low: "#22c55e", med: "#fbbf24", high: "#ef4444", none: "#888" };

  return (
    <div style={{ fontFamily: "'SF Mono','Cascadia Code','Courier New',monospace", background: "#080c14", color: "#d0dce8", minHeight: "100vh", padding: "10px 10px 40px" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:0.8;transform:scale(1.08)}}`}</style>

      {/* SCOREBOARD */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 14px", background: "#10151f", borderRadius: 8, border: "1px solid #1a2540", maxWidth: FIELD_W, margin: "0 auto 8px" }}>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: "#4a9eff", fontWeight: 700 }}>YOU</div><div style={{ fontSize: 24, fontWeight: 800, color: "#4a9eff" }}>{game.score.you}</div></div>
          <div style={{ color: "#2a3550" }}>vs</div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: "#ef4444", fontWeight: 700 }}>CPU</div><div style={{ fontSize: 24, fontWeight: 800, color: "#ef4444" }}>{game.score.cpu}</div></div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{downLabel} & {game.distance}</div>
          <div style={{ fontSize: 11, color: "#5a7090" }}>{ballLabel} · Q{game.quarter}</div>
        </div>
      </div>

      {/* FIELD */}
      <div style={{ position: "relative", width: FIELD_W, height: FIELD_H, margin: "0 auto", background: "linear-gradient(180deg,#165c28 0%,#1a6830 50%,#165c28 100%)", borderRadius: 6, overflow: "hidden", border: "2px solid #2a8040" }}>
        {Array.from({ length: 12 }, (_, i) => {
          const yo = (i - 5.5) * 5 + cameraY; const y = yardToY(yo); if (y < -10 || y > FIELD_H + 10) return null;
          const num = game.ballOn + yo; const disp = num > 50 ? 100 - num : num;
          return (<div key={`yl${i}`}><div style={{ position: "absolute", left: 0, right: 0, top: y, height: 1, background: "rgba(255,255,255,0.12)" }} />{disp >= 0 && disp <= 50 && <div style={{ position: "absolute", left: 6, top: y - 7, fontSize: 9, color: "rgba(255,255,255,0.2)", fontWeight: 600 }}>{Math.round(disp)}</div>}</div>);
        })}
        <div style={{ position: "absolute", left: 0, right: 0, top: yardToY(0) - 1.5, height: 3, background: "rgba(255,215,0,0.55)", zIndex: 5 }} />
        {game.distance <= 30 && <div style={{ position: "absolute", left: 0, right: 0, top: yardToY(game.distance) - 1, height: 2, background: "rgba(74,158,255,0.45)", zIndex: 5 }} />}

        {Object.entries(offPos).map(([id, pos]) => renderPlayer(id, pos, "off"))}
        {Object.entries(defPos).map(([id, pos]) => renderPlayer(id, pos, "def"))}
        {renderRunnerOverlay()}
        {renderBall()}

        {defScheme && mode !== "playcall" && (
          <div style={{ position: "absolute", top: 5, left: "50%", transform: "translateX(-50%)", background: "rgba(200,40,40,0.75)", padding: "2px 10px", borderRadius: 4, fontSize: 10, fontWeight: 700, color: "#fff", zIndex: 30 }}>{defScheme.name}</div>
        )}

        {/* Status bar */}
        {mode !== "playcall" && mode !== "result" && (
          <div style={{ position: "absolute", bottom: 5, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, alignItems: "center", background: "rgba(0,0,0,0.6)", padding: "3px 12px", borderRadius: 4, fontSize: 10, color: "#aaa", zIndex: 30 }}>
            {mode === "runner_decision" || (isRunPlay && mode === "animating") ? (
              <>
                <span>Run {runActions}/{MAX_RUN_ACTIONS}</span>
                <span style={{ color: "#333" }}>|</span>
                <span>Nearest: {nearestDefInfo ? `${nearestDefInfo.player?.label || "?"} ${nearestDefInfo.dist.toFixed(1)}yds` : "—"}</span>
              </>
            ) : (
              <>
                <span>Phase {actionPhase}/{MAX_QB_ACTIONS - 1}</span>
                <span style={{ color: "#333" }}>|</span>
                <span>Pressure</span>
                <div style={{ width: 50, height: 6, background: "#222", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${pressure}%`, height: "100%", borderRadius: 3, background: pressure > 70 ? "#ef4444" : pressure > 40 ? "#fbbf24" : "#22c55e", transition: "all 0.3s" }} />
                </div>
              </>
            )}
          </div>
        )}

        {ballState === "air" && ballAnim && <div style={{ position: "absolute", top: FIELD_H - 28, left: "50%", transform: "translateX(-50%)", background: "rgba(251,191,36,0.85)", padding: "2px 12px", borderRadius: 4, fontSize: 11, fontWeight: 800, color: "#000", zIndex: 30, letterSpacing: 1 }}>BALL IN THE AIR!</div>}
        {ballState === "ground" && mode === "result" && <div style={{ position: "absolute", top: FIELD_H - 28, left: "50%", transform: "translateX(-50%)", background: "rgba(180,180,180,0.7)", padding: "2px 12px", borderRadius: 4, fontSize: 11, fontWeight: 700, color: "#222", zIndex: 30 }}>INCOMPLETE</div>}
        {ballState === "loose" && mode === "result" && <div style={{ position: "absolute", top: FIELD_H - 28, left: "50%", transform: "translateX(-50%)", background: "rgba(239,68,68,0.85)", padding: "2px 12px", borderRadius: 4, fontSize: 11, fontWeight: 700, color: "#fff", zIndex: 30 }}>TURNOVER</div>}
      </div>

      {/* NARRATIVE */}
      {actionNarrative && (
        <div style={{ maxWidth: FIELD_W, margin: "6px auto 0", padding: "6px 12px", background: "#12181f", borderRadius: 6, borderLeft: "3px solid #fbbf24", fontSize: 12, color: "#e0d8c0", fontStyle: "italic" }}>
          {actionNarrative}
        </div>
      )}

      {/* CONTROLS */}
      <div style={{ maxWidth: FIELD_W, margin: "6px auto 0" }}>
        {mode === "playcall" && (
          <div>
            <div style={{ fontSize: 11, color: "#5a7090", marginBottom: 6, fontWeight: 700, letterSpacing: 1 }}>CALL YOUR PLAY</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 5 }}>
              {PLAYS.map(p => (
                <button key={p.name} onClick={() => setSelectedPlay(p)} style={{ ...btn, background: selectedPlay?.name === p.name ? "#162a4a" : "#0e1520", border: selectedPlay?.name === p.name ? "2px solid #3a7acc" : "1px solid #1a2540", padding: "7px 10px", textAlign: "left", color: "#d0dce8" }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{p.icon} {p.name}</div>
                  <div style={{ fontSize: 10, color: "#5a7090", marginTop: 2 }}>{p.desc}</div>
                </button>
              ))}
            </div>
            {selectedPlay && <button onClick={snapBall} style={{ ...btn, marginTop: 8, width: "100%", padding: 11, background: "linear-gradient(135deg,#16a34a,#15803d)", color: "#fff", fontSize: 15, fontWeight: 800, letterSpacing: 2 }}>⚡ SNAP</button>}
          </div>
        )}

        {(mode === "snapping" || (mode === "animating" && !isRunPlay)) && (
          <div style={{ textAlign: "center", padding: 14, color: "#fbbf24", fontSize: 14, fontWeight: 700 }}>⏱ {mode === "snapping" ? "Ball snapped..." : "Players moving..."}</div>
        )}

        {mode === "animating" && isRunPlay && (
          <div style={{ textAlign: "center", padding: 10, color: "#f59e0b", fontSize: 13, fontWeight: 600 }}>⏱ {ballCarrier.toUpperCase()} running...</div>
        )}

        {mode === "decision" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>🏈 QB DECISION</div>
              <div style={{ fontSize: 10, color: "#5a7090" }}>Action {actionPhase} of {MAX_QB_ACTIONS - 1}</div>
            </div>
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: "#5a7090", marginBottom: 4, fontWeight: 600 }}>THROW TO:</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {getQBActions().filter(a => a.category === "throw").map(a => (
                  <button key={a.target} onClick={() => doAction(a)} style={{ ...btn, background: "#0e1520", border: `1px solid ${a.openness.color}44`, padding: "6px 10px", color: "#d0dce8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div><span style={{ fontWeight: 700, fontSize: 12 }}>{a.label}</span><span style={{ fontSize: 10, color: "#5a7090", marginLeft: 6 }}>{a.sublabel}</span></div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: a.openness.color, background: `${a.openness.color}18`, padding: "2px 6px", borderRadius: 3 }}>{a.openness.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {getQBActions().filter(a => a.category === "move").map(a => (
                <button key={a.type} onClick={() => doAction(a)} style={{ ...btn, background: "#0e1520", border: "1px solid #1a2540", padding: "6px 10px", color: "#8ab4e0", fontSize: 11, fontWeight: 600, flex: "1 1 auto" }}>
                  {a.label}<div style={{ fontSize: 9, color: "#4a6080", fontWeight: 400 }}>{a.sublabel}</div>
                </button>
              ))}
              {getQBActions().filter(a => a.category === "other").map(a => (
                <button key={a.type} onClick={() => doAction(a)} style={{ ...btn, background: "#1a1510", border: "1px solid #3a2a10", padding: "6px 10px", color: "#d4a034", fontSize: 11, fontWeight: 600, flex: "1 1 auto" }}>
                  {a.label}<div style={{ fontSize: 9, color: "#7a6030", fontWeight: 400 }}>{a.sublabel}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* RUNNER DECISION */}
        {mode === "runner_decision" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700 }}>🏃 {ballCarrier.toUpperCase()} — MAKE A MOVE</div>
              <div style={{ fontSize: 10, color: "#5a7090" }}>Move {runActions + 1} of {MAX_RUN_ACTIONS}</div>
            </div>
            {nearestDefInfo && (
              <div style={{ fontSize: 10, marginBottom: 6, color: nearestDefInfo.dist < 3 ? "#ef4444" : nearestDefInfo.dist < 6 ? "#fbbf24" : "#22c55e" }}>
                {nearestDefInfo.dist < 3 ? `⚠️ ${nearestDefInfo.player?.label} RIGHT ON YOU (${nearestDefInfo.dist.toFixed(1)} yds)` :
                 nearestDefInfo.dist < 6 ? `⚡ ${nearestDefInfo.player?.label} closing in (${nearestDefInfo.dist.toFixed(1)} yds)` :
                 `✓ Open field — nearest ${nearestDefInfo.player?.label} at ${nearestDefInfo.dist.toFixed(1)} yds`}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
              {getRunnerActions().map(a => (
                <button key={a.type} onClick={() => doRunnerAction(a)} style={{
                  ...btn,
                  background: a.category === "safe" ? "#1a1510" : a.category === "evasion" ? "#1a1020" : "#0e1520",
                  border: a.category === "safe" ? "1px solid #3a2a10" : a.category === "evasion" ? "1px solid #3a1a3a" : "1px solid #1a2540",
                  padding: "8px 8px", textAlign: "center",
                  color: a.category === "safe" ? "#d4a034" : a.category === "evasion" ? "#d084e0" : "#8ab4e0",
                  fontSize: 11, fontWeight: 600,
                }}>
                  {a.label}
                  <div style={{ fontSize: 9, color: "#5a7090", fontWeight: 400 }}>{a.sublabel}</div>
                  <div style={{ fontSize: 8, color: riskColor[a.risk], marginTop: 2 }}>{a.risk !== "none" ? `● ${a.risk} risk` : "● safe"}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === "result" && playResult && (
          <div style={{ background: "#10151f", borderRadius: 8, padding: 12, border: `1px solid ${playResult.turnover ? "#ef4444" : playResult.incomplete ? "#fbbf24" : playResult.yards >= 10 ? "#22c55e" : "#1a2540"}` }}>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4, color: playResult.turnover ? "#ef4444" : playResult.incomplete ? "#fbbf24" : playResult.yards >= 10 ? "#22c55e" : playResult.yards >= 0 ? "#d0dce8" : "#ef4444" }}>
              {playResult.turnover ? "💥 TURNOVER" : playResult.incomplete ? "✋ INCOMPLETE" : playResult.yards >= 15 ? "🔥 BIG PLAY!" : playResult.yards >= 0 ? `+${playResult.yards} YARDS` : `${playResult.yards} YARDS`}
            </div>
            <div style={{ fontSize: 12, color: "#8a9ab0", marginBottom: 8 }}>{playResult.desc}</div>
            <div style={{ fontSize: 10, color: "#4a5a70", marginBottom: 10 }}>{selectedPlay?.name} vs {defScheme?.name}</div>
            <button onClick={advanceGame} style={{ ...btn, width: "100%", padding: 10, background: "#162a4a", color: "#4a9eff", border: "1px solid #2a5a9a", fontSize: 13, fontWeight: 700 }}>NEXT PLAY →</button>
          </div>
        )}

        {log.length > 0 && (
          <div style={{ marginTop: 8, maxHeight: 80, overflowY: "auto", fontSize: 10, color: "#4a5a70" }}>
            {log.map((e, i) => <div key={i} style={{ padding: "1px 0", opacity: 1 - i * 0.06 }}>{e}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}
