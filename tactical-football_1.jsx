import { useState, useEffect, useCallback, useRef } from "react";

// ==================== CONSTANTS ====================
const FIELD_W = 680;
const FIELD_H = 460;
const PX_PER_YARD = FIELD_H / 38;
const ANIM_MS = 650;
const MAX_ACTIONS = 4;

// ==================== HELPERS ====================
const rand = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
const pctToX = (p) => (p / 100) * FIELD_W;
const yardToY = (y) => FIELD_H / 2 - y * PX_PER_YARD;

// ==================== PLAYERS ====================
const P = (id, pos, label, spd, str, skl) => ({ id, pos, label, spd, str, skl });

const OFF = [
  P("qb","QB","QB", 6, 5, 9),
  P("rb","RB","RB", 8, 7, 7),
  P("wr1","WR","W1", 9, 4, 8),
  P("wr2","WR","W2", 8, 5, 7),
  P("te","TE","TE", 6, 8, 6),
  P("ol1","OL","▪", 3, 9, 5), P("ol2","OL","▪", 3, 9, 5),
  P("c","OL","▪", 3, 10, 5),
  P("ol4","OL","▪", 3, 9, 5), P("ol5","OL","▪", 3, 9, 5),
];

const DEF = [
  P("de1","DL","DE", 6, 9, 6), P("dt1","DL","DT", 4, 10, 5),
  P("dt2","DL","DT", 4, 10, 5), P("de2","DL","DE", 6, 9, 6),
  P("olb1","LB","LB", 7, 7, 7), P("mlb","LB","LB", 7, 8, 8),
  P("olb2","LB","LB", 7, 7, 7),
  P("cb1","CB","CB", 9, 4, 8), P("cb2","CB","CB", 9, 4, 7),
  P("ss","S","SS", 8, 6, 7), P("fs","S","FS", 9, 5, 8),
];

const getP = (roster, id) => roster.find((p) => p.id === id);

// ==================== ROUTE BUILDERS ====================
const R = (x, y) => ({ x, y });

const routeLib = {
  goL:    (sx, sy) => [R(sx, sy+5), R(sx+1, sy+12), R(sx+1, sy+21), R(sx+1, sy+30)],
  goR:    (sx, sy) => [R(sx, sy+5), R(sx-1, sy+12), R(sx-1, sy+21), R(sx-1, sy+30)],
  slantIn:(sx, sy, dir) => [R(sx+dir*4,sy+3), R(sx+dir*10,sy+6), R(sx+dir*16,sy+9), R(sx+dir*20,sy+12)],
  post:   (sx, sy, dir) => [R(sx, sy+5), R(sx, sy+12), R(sx+dir*10, sy+18), R(sx+dir*16, sy+24)],
  out:    (sx, sy, dir) => [R(sx, sy+5), R(sx, sy+10), R(sx-dir*10, sy+10), R(sx-dir*16, sy+10)],
  curl:   (sx, sy) => [R(sx, sy+5), R(sx, sy+11), R(sx, sy+10), R(sx, sy+9)],
  flat:   (sx, sy, dir) => [R(sx+dir*6, sy+1), R(sx+dir*14, sy+2), R(sx+dir*20, sy+3), R(sx+dir*24, sy+4)],
  screen: (sx, sy, dir) => [R(sx+dir*4, sy-2), R(sx+dir*10, sy-3), R(sx+dir*14, sy-2), R(sx+dir*16, sy+2)],
  block:  (sx, sy) => [R(sx, sy+1), R(sx, sy+1.5), R(sx, sy+1.5), R(sx, sy+1.5)],
  dive:   (sx, sy) => [R(sx, sy-2), R(sx, sy+2), R(sx, sy+6), R(sx, sy+10)],
  sweep:  (sx, sy, dir) => [R(sx+dir*6, sy-3), R(sx+dir*16, sy-1), R(sx+dir*22, sy+3), R(sx+dir*24, sy+8)],
  seam:   (sx, sy, dir) => [R(sx+dir*2, sy+1), R(sx+dir*2, sy+5), R(sx+dir*2, sy+12), R(sx+dir*2, sy+20)],
  wheel:  (sx, sy, dir) => [R(sx+dir*6, sy+1), R(sx+dir*12, sy+5), R(sx+dir*10, sy+12), R(sx+dir*8, sy+20)],
  checkdown: (sx, sy, dir) => [R(sx+dir*3, sy-1), R(sx+dir*6, sy+1), R(sx+dir*8, sy+3), R(sx+dir*10, sy+5)],
};

// ==================== FORMATIONS ====================
const FORM_IFORM = {
  qb: R(50,-3), rb: R(50,-7), wr1: R(8,0), wr2: R(92,0), te: R(66,0),
  ol1: R(38,0), ol2: R(43,0), c: R(50,0), ol4: R(57,0), ol5: R(62,0),
};
const FORM_SHOTGUN = {
  qb: R(50,-5), rb: R(42,-5), wr1: R(6,0), wr2: R(94,0), te: R(68,0),
  ol1: R(38,0), ol2: R(43,0), c: R(50,0), ol4: R(57,0), ol5: R(62,0),
};
const FORM_SPREAD = {
  qb: R(50,-5), rb: R(43,-5), wr1: R(5,0), wr2: R(95,0), te: R(78,0),
  ol1: R(38,0), ol2: R(43,0), c: R(50,0), ol4: R(57,0), ol5: R(62,0),
};

// ==================== PLAYS ====================
const PLAYS = [
  {
    name: "HB Dive", icon: "🏈", type: "run", desc: "Power run up the middle",
    formation: FORM_IFORM,
    routes: {
      wr1: routeLib.goL(8, 0), wr2: routeLib.goR(92, 0),
      te: routeLib.block(66, 0), rb: routeLib.dive(50, -7),
    },
  },
  {
    name: "HB Sweep", icon: "↗️", type: "run", desc: "Outside run — RB speed vs edge",
    formation: FORM_IFORM,
    routes: {
      wr1: routeLib.block(8, 0), wr2: routeLib.goR(92, 0),
      te: routeLib.block(66, 0), rb: routeLib.sweep(50, -7, -1),
    },
  },
  {
    name: "Quick Slants", icon: "⚡", type: "pass", desc: "Fast timing routes inside",
    formation: FORM_SHOTGUN,
    routes: {
      wr1: routeLib.slantIn(6, 0, 1), wr2: routeLib.slantIn(94, 0, -1),
      te: routeLib.seam(68, 0, -1), rb: routeLib.checkdown(42, -5, -1),
    },
  },
  {
    name: "Deep Post", icon: "🎯", type: "pass", desc: "WR1 runs a deep post — big play potential",
    formation: FORM_SHOTGUN,
    routes: {
      wr1: routeLib.post(6, 0, 1), wr2: routeLib.out(94, 0, 1),
      te: routeLib.curl(68, 0), rb: routeLib.checkdown(42, -5, -1),
    },
  },
  {
    name: "Play Action", icon: "🎭", type: "pass", desc: "Fake dive, hit TE on a seam",
    formation: FORM_IFORM,
    routes: {
      wr1: routeLib.post(8, 0, 1), wr2: routeLib.out(92, 0, 1),
      te: routeLib.seam(66, 0, -1), rb: routeLib.dive(50, -7),
    },
    playAction: true,
  },
  {
    name: "Screen Pass", icon: "🪤", type: "pass", desc: "Let them rush, dump to RB behind blockers",
    formation: FORM_SHOTGUN,
    routes: {
      wr1: routeLib.goL(6, 0), wr2: routeLib.goR(94, 0),
      te: routeLib.flat(68, 0, -1), rb: routeLib.screen(42, -5, -1),
    },
  },
  {
    name: "Wheel Route", icon: "🎡", type: "pass", desc: "RB swings out and goes deep — LB killer",
    formation: FORM_SPREAD,
    routes: {
      wr1: routeLib.slantIn(5, 0, 1), wr2: routeLib.goR(95, 0),
      te: routeLib.out(78, 0, 1), rb: routeLib.wheel(43, -5, -1),
    },
  },
];

// ==================== DEFENSE SCHEMES ====================
const DEF_SCHEMES = {
  base43: {
    name: "4-3 Base", pos: {
      de1:R(34,1.5), dt1:R(46,1), dt2:R(54,1), de2:R(66,1.5),
      olb1:R(28,5), mlb:R(50,5), olb2:R(72,5),
      cb1:R(10,7), cb2:R(90,7), ss:R(55,14), fs:R(45,18),
    },
  },
  nickel: {
    name: "Nickel", pos: {
      de1:R(36,1.5), dt1:R(46,1), dt2:R(54,1), de2:R(64,1.5),
      olb1:R(30,5), mlb:R(50,5), olb2:R(78,5),
      cb1:R(8,6), cb2:R(92,6), ss:R(60,12), fs:R(40,18),
    },
  },
  blitz: {
    name: "Blitz", pos: {
      de1:R(34,1.5), dt1:R(46,1), dt2:R(54,1), de2:R(66,1.5),
      olb1:R(38,2.5), mlb:R(50,3), olb2:R(62,2.5),
      cb1:R(10,7), cb2:R(90,7), ss:R(55,8), fs:R(45,15),
    },
  },
  cover2: {
    name: "Cover 2", pos: {
      de1:R(34,1.5), dt1:R(46,1), dt2:R(54,1), de2:R(66,1.5),
      olb1:R(30,5), mlb:R(50,5.5), olb2:R(70,5),
      cb1:R(10,4), cb2:R(90,4), ss:R(30,18), fs:R(70,18),
    },
  },
  goalline: {
    name: "Goal Line", pos: {
      de1:R(32,1), dt1:R(44,0.8), dt2:R(56,0.8), de2:R(68,1),
      olb1:R(36,2.5), mlb:R(50,2.5), olb2:R(64,2.5),
      cb1:R(14,4), cb2:R(86,4), ss:R(50,8), fs:R(50,13),
    },
  },
};

const pickDefScheme = (down, dst, ballOn) => {
  const w = { base43:25, nickel:20, blitz:15, cover2:20, goalline:5 };
  if (dst <= 2) { w.goalline += 25; w.blitz += 10; }
  if (dst >= 8) { w.nickel += 15; w.cover2 += 15; }
  if (down >= 3 && dst >= 5) { w.nickel += 10; w.cover2 += 10; w.blitz += 8; }
  if (ballOn >= 90) w.goalline += 20;
  const entries = Object.entries(w);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  let r = Math.random() * total;
  for (const [k, v] of entries) { r -= v; if (r <= 0) return { key: k, ...DEF_SCHEMES[k] }; }
  return { key: "base43", ...DEF_SCHEMES.base43 };
};

// ==================== DEFENSE AI ====================
const CB_ASSIGN = { cb1: "wr1", cb2: "wr2" };

function computeDefPositions(scheme, phase, qbPos, offPos, isRun, ballCarrierId) {
  const pos = {};
  for (const p of DEF) {
    const start = scheme.pos[p.id];
    if (!start) continue;
    const ms = Math.min(phase, 3);

    if (p.pos === "DL") {
      const target = isRun && ballCarrierId !== "qb" && offPos[ballCarrierId] ? offPos[ballCarrierId] : qbPos;
      const dx = (target.x - start.x) * 0.12 * ms;
      const dy = (start.y - target.y) * 0.25 * ms;
      pos[p.id] = R(start.x + dx, start.y - dy);
    } else if (p.pos === "LB") {
      if (scheme.key === "blitz") {
        const dx = (qbPos.x - start.x) * 0.15 * ms;
        const dy = (start.y - qbPos.y) * 0.28 * ms;
        pos[p.id] = R(start.x + dx, start.y - dy);
      } else if (isRun && offPos[ballCarrierId]) {
        const t = offPos[ballCarrierId];
        const dx = (t.x - start.x) * 0.12 * ms;
        const dy = (start.y - t.y) * 0.15 * ms;
        pos[p.id] = R(start.x + dx, start.y - dy);
      } else {
        pos[p.id] = R(start.x, start.y + ms * 0.5);
      }
    } else if (p.pos === "CB") {
      const wrId = CB_ASSIGN[p.id];
      const wr = offPos[wrId];
      if (wr) {
        const lag = (10 - p.spd) * 0.6;
        const dx = (wr.x - start.x) * (0.2 * ms - lag * 0.04);
        const dy = (wr.y - start.y) * (0.2 * ms - lag * 0.04);
        pos[p.id] = R(start.x + dx, clamp(start.y + dy, start.y - 2, 35));
      } else {
        pos[p.id] = start;
      }
    } else if (p.pos === "S") {
      const threats = ["wr1","wr2","te"].map((id) => offPos[id]).filter(Boolean);
      const deepest = threats.reduce((a, b) => (b && b.y > (a?.y||0) ? b : a), null);
      if (deepest) {
        const dx = (deepest.x - start.x) * 0.06 * ms;
        const dy = Math.max(0, (deepest.y - start.y) * 0.08 * ms);
        pos[p.id] = R(start.x + dx, start.y + dy);
      } else {
        pos[p.id] = start;
      }
    }
  }
  return pos;
}

// ==================== GAME LOGIC ====================
function getReceiverOpenness(recId, offPos, defPos) {
  const rec = offPos[recId];
  if (!rec) return { openness: 0, label: "N/A", color: "#666" };
  let nearest = 999;
  for (const id of Object.keys(defPos)) {
    const d = dist(rec, defPos[id]);
    if (d < nearest) nearest = d;
  }
  const yardDist = nearest / (FIELD_W / 100) * 1.2;
  if (yardDist > 12) return { openness: 3, label: "WIDE OPEN", color: "#22c55e" };
  if (yardDist > 7) return { openness: 2, label: "OPEN", color: "#86efac" };
  if (yardDist > 4) return { openness: 1, label: "CONTESTED", color: "#fbbf24" };
  return { openness: 0, label: "COVERED", color: "#ef4444" };
}

function computePressure(phase, scheme) {
  let base = phase * 22;
  if (scheme.key === "blitz") base += 20;
  if (scheme.key === "cover2") base -= 5;
  return clamp(base + rand(-5, 5), 0, 100);
}

function resolveThrow(recId, phase, qbPos, offPos, defPos, scheme) {
  const qb = getP(OFF, "qb");
  const rec = getP(OFF, recId);
  const openness = getReceiverOpenness(recId, offPos, defPos);
  const recPos = offPos[recId];
  const yardsDownfield = recPos.y;
  const pressure = computePressure(phase, scheme);
  let catchProb = 0.35 + openness.openness * 0.14 + rec.skl * 0.03 - (pressure / 200);
  catchProb = clamp(catchProb, 0.08, 0.95);
  const intProb = openness.openness <= 0 ? 0.08 + phase * 0.03 : 0.02;

  if (Math.random() < intProb) {
    return { complete: false, intercepted: true, yards: 0, desc: `INTERCEPTED! ${recId.toUpperCase()} was blanketed — defender reads the throw` };
  }
  if (Math.random() > catchProb) {
    const reasons = ["ball sails high under pressure","pass hits the turf","CB knocks it away","receiver can't haul it in"];
    return { complete: false, intercepted: false, yards: 0, desc: `Incomplete — ${reasons[rand(0,reasons.length-1)]}` };
  }
  const yac = clamp(Math.round((rec.spd - 5) * 0.8 + rand(-1, 4)), 0, 12);
  const totalYards = Math.round(yardsDownfield + yac);
  return { complete: true, intercepted: false, yards: totalYards, yac, desc: `${recId.toUpperCase()} catches it${yac > 3 ? ` and picks up ${yac} YAC!` : "!"}`, catcherId: recId };
}

function resolveSack(phase, scheme) {
  const pressure = computePressure(phase, scheme);
  const sackChance = (pressure - 30) / 100;
  if (Math.random() < sackChance) {
    const loss = rand(3, 8);
    return { sacked: true, yards: -loss, desc: `SACKED! QB dragged down for a loss of ${loss}` };
  }
  return { sacked: false };
}

function resolveRun(runnerId, runnerPos, defPos) {
  const runner = getP(OFF, runnerId);
  let nearest = 999;
  for (const [, dp] of Object.entries(defPos)) {
    const d = dist(runnerPos, dp);
    if (d < nearest) nearest = d;
  }
  const tackleProb = nearest < 6 ? 0.85 : nearest < 10 ? 0.5 : nearest < 15 ? 0.25 : 0.08;
  return { tackled: Math.random() < tackleProb };
}

// ==================== OL POSITIONS ====================
function getOLPositions(formation, phase, scheme) {
  const pos = {};
  for (const id of ["ol1","ol2","c","ol4","ol5"]) {
    const start = formation[id];
    const pushback = scheme.key === "blitz" ? phase * 0.8 : phase * 0.4;
    pos[id] = R(start.x, start.y + 1 - pushback * 0.3);
  }
  return pos;
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

  const getOffPositions = useCallback((phase) => {
    if (!selectedPlay) return {};
    const pos = {};
    const f = selectedPlay.formation;
    for (const id of ["wr1","wr2","te","rb"]) {
      const route = selectedPlay.routes[id];
      if (!route) { pos[id] = f[id]; continue; }
      const idx = clamp(phase - 1, 0, route.length - 1);
      pos[id] = phase === 0 ? f[id] : route[idx];
    }
    pos.qb = qbPos;
    const olPos = getOLPositions(f, phase, defScheme || { key: "base43" });
    Object.assign(pos, olPos);
    return pos;
  }, [selectedPlay, qbPos, defScheme]);

  const getDefPositions = useCallback((phase) => {
    if (!defScheme) return {};
    const offPos = getOffPositions(phase);
    return computeDefPositions(defScheme, phase, qbPos, offPos, isRunPlay, ballCarrier);
  }, [defScheme, getOffPositions, qbPos, isRunPlay, ballCarrier]);

  const offPos = getOffPositions(actionPhase);
  const defPos = getDefPositions(actionPhase);
  const pressure = defScheme ? computePressure(actionPhase, defScheme) : 0;

  // ==================== ACTIONS ====================
  const snapBall = () => {
    const def = pickDefScheme(game.down, game.distance, game.ballOn);
    setDefScheme(def);
    setActionPhase(0);
    setQbPos(selectedPlay.formation.qb);
    setBallCarrier("qb");
    setBallCarrierPos(null);
    setIsRunPlay(false);
    setPlayResult(null);
    setHandedOff(false);
    setMode("snapping");
    setTimeout(() => {
      setActionPhase(1);
      setTimeout(() => setMode("decision"), ANIM_MS);
    }, 200);
  };

  const endPlay = (yards, desc, turnover = false, incomplete = false) => {
    setPlayResult({ yards, desc, turnover, incomplete });
    setMode("result");
  };

  const animate = (nextPhase) => {
    setMode("animating");
    setTimeout(() => {
      setActionPhase(nextPhase);
      if (nextPhase >= MAX_ACTIONS - 1) {
        const sack = resolveSack(nextPhase, defScheme);
        if (sack.sacked) { setTimeout(() => endPlay(sack.yards, sack.desc), ANIM_MS); return; }
      }
      const sack = resolveSack(nextPhase, defScheme);
      if (sack.sacked) { setTimeout(() => endPlay(sack.yards, sack.desc), ANIM_MS); }
      else { setTimeout(() => setMode("decision"), ANIM_MS); }
    }, 300);
  };

  const doAction = (action) => {
    const nextPhase = actionPhase + 1;
    switch (action.type) {
      case "dropback":
        setQbPos((p) => R(p.x, p.y - 2.5));
        animate(nextPhase);
        break;
      case "scramble_left":
        setQbPos((p) => R(clamp(p.x - 14, 5, 95), p.y - 1));
        animate(nextPhase);
        break;
      case "scramble_right":
        setQbPos((p) => R(clamp(p.x + 14, 5, 95), p.y + 1));
        animate(nextPhase);
        break;
      case "throw": {
        const curOff = getOffPositions(actionPhase);
        const curDef = getDefPositions(actionPhase);
        const result = resolveThrow(action.target, actionPhase, qbPos, curOff, curDef, defScheme);
        if (result.intercepted) { endPlay(0, result.desc, true); }
        else if (!result.complete) { endPlay(0, result.desc, false, true); }
        else {
          setBallCarrier(result.catcherId);
          setBallCarrierPos(curOff[result.catcherId]);
          setIsRunPlay(true);
          setMode("animating");
          setTimeout(() => { setActionPhase(nextPhase); setTimeout(() => setMode("runner_decision"), ANIM_MS); }, 300);
        }
        break;
      }
      case "handoff":
        setIsRunPlay(true);
        setBallCarrier("rb");
        setHandedOff(true);
        const rbRoute = selectedPlay.routes.rb;
        setBallCarrierPos(rbRoute ? rbRoute[clamp(actionPhase - 1, 0, rbRoute.length - 1)] : selectedPlay.formation.rb);
        setMode("animating");
        setTimeout(() => { setActionPhase(nextPhase); setTimeout(() => setMode("runner_decision"), ANIM_MS); }, 300);
        break;
      case "tuck_run":
        setIsRunPlay(true);
        setBallCarrier("qb");
        setBallCarrierPos({ ...qbPos });
        setMode("animating");
        setTimeout(() => { setActionPhase(nextPhase); setTimeout(() => setMode("runner_decision"), ANIM_MS); }, 300);
        break;
      default: break;
    }
  };

  const doRunnerAction = (action) => {
    const nextPhase = actionPhase + 1;
    let newPos = ballCarrierPos ? { ...ballCarrierPos } : { ...qbPos };
    const runner = getP(OFF, ballCarrier);

    switch (action.type) {
      case "sprint":
        newPos = R(newPos.x, newPos.y + (runner.spd - 3) * 0.7 + rand(0, 3));
        break;
      case "cut_left":
        newPos = R(clamp(newPos.x - 15, 3, 97), newPos.y + rand(1, 4));
        break;
      case "cut_right":
        newPos = R(clamp(newPos.x + 15, 3, 97), newPos.y + rand(1, 4));
        break;
      case "dive":
        newPos = R(newPos.x, newPos.y + rand(1, 3));
        setBallCarrierPos(newPos);
        endPlay(Math.round(newPos.y), `${ballCarrier.toUpperCase()} dives forward for +${Math.max(0,Math.round(newPos.y))}`);
        return;
      case "spin": {
        const success = Math.random() < (runner.skl / 14);
        if (success) { newPos = R(newPos.x + rand(-8, 8), newPos.y + rand(3, 6)); }
        else { setBallCarrierPos(newPos); endPlay(Math.round(newPos.y), `Spin move fails — tackled for ${Math.round(newPos.y)}`); return; }
        break;
      }
      default: break;
    }

    setBallCarrierPos(newPos);
    if (ballCarrier === "qb") setQbPos(newPos);

    const curDef = computeDefPositions(defScheme, nextPhase, ballCarrier === "qb" ? newPos : qbPos,
      { ...getOffPositions(nextPhase), [ballCarrier]: newPos }, true, ballCarrier);
    const tackleResult = resolveRun(ballCarrier, newPos, curDef);

    if (tackleResult.tackled || nextPhase >= MAX_ACTIONS) {
      const yards = Math.round(newPos.y);
      endPlay(yards, `${ballCarrier.toUpperCase()} brought down after ${yards > 0 ? "+" : ""}${yards} yards`);
    } else {
      setMode("animating");
      setTimeout(() => { setActionPhase(nextPhase); setTimeout(() => setMode("runner_decision"), ANIM_MS); }, 300);
    }
  };

  const advanceGame = () => {
    if (!playResult) return;
    const r = playResult;
    setGame((g) => {
      let { ballOn, down, distance, score, quarter, playsRun } = { ...g };
      playsRun++;
      if (r.turnover) {
        setLog((l) => [`💥 ${r.desc}`, ...l].slice(0, 25));
        return { ballOn: 25, down: 1, distance: 10, score, quarter, playsRun };
      }
      const newBallOn = clamp(ballOn + r.yards, 0, 100);
      if (newBallOn >= 100) {
        const ns = { ...score, you: score.you + 7 };
        setLog((l) => [`🏈 TOUCHDOWN! ${r.desc}`, ...l].slice(0, 25));
        return { ballOn: 25, down: 1, distance: 10, score: ns, quarter, playsRun };
      }
      if (newBallOn <= 0) {
        const ns = { ...score, cpu: score.cpu + 2 };
        setLog((l) => [`⚠️ SAFETY!`, ...l].slice(0, 25));
        return { ballOn: 25, down: 1, distance: 10, score: ns, quarter, playsRun };
      }
      const gained = newBallOn - ballOn;
      const newDist = distance - gained;
      if (newDist <= 0) {
        setLog((l) => [`✅ 1st down! ${gained >= 0 ? "+" : ""}${gained} — ${r.desc}`, ...l].slice(0, 25));
        return { ballOn: newBallOn, down: 1, distance: Math.min(10, 100 - newBallOn), score, quarter: Math.min(4, Math.floor(playsRun/12)+1), playsRun };
      }
      if (down >= 4) {
        setLog((l) => [`↩️ Turnover on downs`, ...l].slice(0, 25));
        return { ballOn: 25, down: 1, distance: 10, score, quarter, playsRun };
      }
      setLog((l) => [`${gained >= 0 ? "+" : ""}${gained} — ${r.desc}`, ...l].slice(0, 25));
      return { ballOn: newBallOn, down: down + 1, distance: newDist, score, quarter: Math.min(4, Math.floor(playsRun/12)+1), playsRun };
    });
    setMode("playcall"); setSelectedPlay(null); setDefScheme(null); setPlayResult(null); setActionPhase(0); setHandedOff(false);
  };

  // ==================== ACTION LISTS ====================
  const getQBActions = () => {
    const actions = [];
    for (const id of ["wr1","wr2","te","rb"]) {
      if (id === "rb" && handedOff) continue;
      const pos = offPos[id];
      if (!pos) continue;
      const open = getReceiverOpenness(id, offPos, defPos);
      const yds = Math.round(pos.y);
      actions.push({ type: "throw", target: id, category: "throw", label: id.toUpperCase(), sublabel: `${yds > 0 ? "+" : ""}${yds}yds`, openness: open });
    }
    if (actionPhase < MAX_ACTIONS - 1) {
      actions.push({ type: "dropback", category: "move", label: "Drop Back", sublabel: "Buy time" });
      actions.push({ type: "scramble_left", category: "move", label: "Scramble L", sublabel: "Roll left" });
      actions.push({ type: "scramble_right", category: "move", label: "Scramble R", sublabel: "Roll right" });
    }
    if (actionPhase <= 1 && !handedOff) actions.push({ type: "handoff", category: "other", label: "Hand Off", sublabel: "Give to RB" });
    actions.push({ type: "tuck_run", category: "other", label: "Tuck & Run", sublabel: "QB keeps it" });
    return actions;
  };

  const getRunnerActions = () => [
    { type: "sprint", category: "move", label: "Sprint", sublabel: "Max yards upfield" },
    { type: "cut_left", category: "move", label: "Cut Left", sublabel: "Break to sideline" },
    { type: "cut_right", category: "move", label: "Cut Right", sublabel: "Break to sideline" },
    { type: "spin", category: "move", label: "Spin Move", sublabel: "Risky — beat a tackler" },
    { type: "dive", category: "other", label: "Dive", sublabel: "Safe — end play" },
  ];

  // ==================== RENDER ====================
  const renderPlayer = (id, pos, team) => {
    if (!pos) return null;
    const isOff = team === "off";
    const roster = isOff ? OFF : DEF;
    const player = getP(roster, id);
    if (!player) return null;
    const isOL = player.pos === "OL";
    const isBall = isOff && id === ballCarrier && mode !== "playcall";
    const isTarget = isOff && !isOL && mode === "decision" && ballCarrier === "qb" && ["wr1","wr2","te","rb"].includes(id);
    const px = pctToX(pos.x); const py = yardToY(pos.y);
    const sz = isBall ? 34 : isOL ? 22 : 30;
    let borderColor = isOff ? (isOL ? "#2a5a9a" : "#60a5fa") : (player.pos === "DL" ? "#b33" : "#f87171");
    if (isBall) borderColor = "#fbbf24";
    if (isTarget) { const o = getReceiverOpenness(id, offPos, defPos); borderColor = o.color; }

    return (
      <div key={`${team}-${id}`} style={{
        position: "absolute", left: px - sz/2, top: py - sz/2, width: sz, height: sz,
        borderRadius: "50%",
        background: isOff ? (isBall ? "#d97706" : isOL ? "#1a3d6e" : "#2563eb") : (player.pos === "DL" ? "#7a1a1a" : "#dc2626"),
        border: `${isBall || isTarget ? 3 : 2}px solid ${borderColor}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: isOL ? 7 : isBall ? 10 : 9, fontWeight: 700, color: "#fff", zIndex: isBall ? 15 : 10,
        transition: mode === "animating" || mode === "snapping" ? `all ${ANIM_MS}ms ease` : "none",
        boxShadow: isBall ? "0 0 14px rgba(217,119,6,0.5)" : "0 1px 3px rgba(0,0,0,0.4)",
        fontFamily: "monospace", letterSpacing: -0.5,
      }}>
        {player.label}
      </div>
    );
  };

  // Ball carrier overlay for runner (separate from route position)
  const renderBallCarrierOverlay = () => {
    if (!ballCarrierPos || !isRunPlay || ballCarrier === "qb" || mode === "playcall") return null;
    const sz = 34; const px = pctToX(ballCarrierPos.x); const py = yardToY(ballCarrierPos.y);
    return (
      <div style={{
        position: "absolute", left: px - sz/2, top: py - sz/2, width: sz, height: sz,
        borderRadius: "50%", background: "#d97706", border: "3px solid #fbbf24",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 700, color: "#fff", zIndex: 15,
        transition: mode === "animating" ? `all ${ANIM_MS}ms ease` : "none",
        boxShadow: "0 0 14px rgba(217,119,6,0.5)", fontFamily: "monospace",
      }}>
        {getP(OFF, ballCarrier)?.label}
      </div>
    );
  };

  const downLabel = ["","1st","2nd","3rd","4th"][game.down] || "4th";
  const ballLabel = game.ballOn > 50 ? `OPP ${100 - game.ballOn}` : `OWN ${game.ballOn}`;

  const btnBase = { border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", transition: "all 0.1s" };

  return (
    <div style={{ fontFamily: "'SF Mono', 'Cascadia Code', 'Courier New', monospace", background: "#080c14", color: "#d0dce8", minHeight: "100vh", padding: "10px 10px 40px" }}>

      {/* SCOREBOARD */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "6px 14px", background: "#10151f", borderRadius: 8, marginBottom: 8,
        border: "1px solid #1a2540", maxWidth: FIELD_W, margin: "0 auto 8px",
      }}>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#4a9eff", fontWeight: 700 }}>YOU</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#4a9eff" }}>{game.score.you}</div>
          </div>
          <div style={{ color: "#2a3550" }}>vs</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 700 }}>CPU</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#ef4444" }}>{game.score.cpu}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{downLabel} & {game.distance}</div>
          <div style={{ fontSize: 11, color: "#5a7090" }}>{ballLabel} · Q{game.quarter}</div>
        </div>
      </div>

      {/* FIELD */}
      <div style={{
        position: "relative", width: FIELD_W, height: FIELD_H, margin: "0 auto",
        background: "linear-gradient(180deg, #165c28 0%, #1a6830 50%, #165c28 100%)",
        borderRadius: 6, overflow: "hidden", border: "2px solid #2a8040",
      }}>
        {Array.from({ length: 10 }, (_, i) => {
          const yoff = (i - 4.5) * 5;
          const y = yardToY(yoff);
          if (y < 0 || y > FIELD_H) return null;
          const num = game.ballOn + yoff;
          const disp = num > 50 ? 100 - num : num;
          return (
            <div key={`yl${i}`}>
              <div style={{ position:"absolute", left:0, right:0, top:y, height:1, background:"rgba(255,255,255,0.12)" }}/>
              {disp >= 0 && disp <= 50 && <div style={{ position:"absolute", left:6, top:y-7, fontSize:9, color:"rgba(255,255,255,0.2)", fontWeight:600 }}>{disp}</div>}
            </div>
          );
        })}
        {/* LOS */}
        <div style={{ position:"absolute", left:0, right:0, top:yardToY(0)-1.5, height:3, background:"rgba(255,215,0,0.55)", zIndex:5 }}/>
        {/* 1st down */}
        {game.distance <= 25 && <div style={{ position:"absolute", left:0, right:0, top:yardToY(game.distance)-1, height:2, background:"rgba(74,158,255,0.45)", zIndex:5 }}/>}

        {Object.entries(offPos).map(([id, pos]) => renderPlayer(id, pos, "off"))}
        {Object.entries(defPos).map(([id, pos]) => renderPlayer(id, pos, "def"))}
        {renderBallCarrierOverlay()}

        {defScheme && mode !== "playcall" && (
          <div style={{ position:"absolute", top:5, left:"50%", transform:"translateX(-50%)", background:"rgba(200,40,40,0.75)", padding:"2px 10px", borderRadius:4, fontSize:10, fontWeight:700, color:"#fff", zIndex:20 }}>
            {defScheme.name}
          </div>
        )}

        {mode !== "playcall" && mode !== "result" && (
          <div style={{ position:"absolute", bottom:5, left:"50%", transform:"translateX(-50%)", display:"flex", gap:8, alignItems:"center", background:"rgba(0,0,0,0.5)", padding:"3px 12px", borderRadius:4, fontSize:10, color:"#aaa", zIndex:20 }}>
            <span>Phase {actionPhase}/{MAX_ACTIONS-1}</span>
            <span style={{color:"#333"}}>|</span>
            <span>Pressure</span>
            <div style={{ width:50, height:6, background:"#222", borderRadius:3, overflow:"hidden" }}>
              <div style={{ width:`${pressure}%`, height:"100%", borderRadius:3, background: pressure>70?"#ef4444":pressure>40?"#fbbf24":"#22c55e", transition:"all 0.3s" }}/>
            </div>
          </div>
        )}
      </div>

      {/* CONTROLS */}
      <div style={{ maxWidth: FIELD_W, margin: "8px auto 0" }}>

        {/* PLAY CALL */}
        {mode === "playcall" && (
          <div>
            <div style={{ fontSize: 11, color: "#5a7090", marginBottom: 6, fontWeight: 700, letterSpacing: 1 }}>CALL YOUR PLAY</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 5 }}>
              {PLAYS.map((p) => (
                <button key={p.name} onClick={() => setSelectedPlay(p)} style={{
                  ...btnBase,
                  background: selectedPlay?.name === p.name ? "#162a4a" : "#0e1520",
                  border: selectedPlay?.name === p.name ? "2px solid #3a7acc" : "1px solid #1a2540",
                  padding: "7px 10px", textAlign: "left", color: "#d0dce8",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{p.icon} {p.name}</div>
                  <div style={{ fontSize: 10, color: "#5a7090", marginTop: 2 }}>{p.desc}</div>
                </button>
              ))}
            </div>
            {selectedPlay && (
              <button onClick={snapBall} style={{
                ...btnBase, marginTop: 8, width: "100%", padding: 11,
                background: "linear-gradient(135deg,#16a34a,#15803d)", color: "#fff",
                fontSize: 15, fontWeight: 800, letterSpacing: 2,
              }}>⚡ SNAP</button>
            )}
          </div>
        )}

        {(mode === "snapping" || mode === "animating") && (
          <div style={{ textAlign: "center", padding: 14, color: "#fbbf24", fontSize: 14, fontWeight: 700 }}>
            ⏱ {mode === "snapping" ? "Ball snapped..." : "Players moving..."}
          </div>
        )}

        {/* QB DECISION */}
        {mode === "decision" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 6 }}>
              <div style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>🏈 QB DECISION</div>
              <div style={{ fontSize: 10, color: "#5a7090" }}>Action {actionPhase} of {MAX_ACTIONS-1}</div>
            </div>
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: "#5a7090", marginBottom: 4, fontWeight: 600 }}>THROW TO:</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {getQBActions().filter(a => a.category==="throw").map(a => (
                  <button key={a.target} onClick={() => doAction(a)} style={{
                    ...btnBase, background: "#0e1520", border: `1px solid ${a.openness.color}44`,
                    padding: "6px 10px", color: "#d0dce8", display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 12 }}>{a.label}</span>
                      <span style={{ fontSize: 10, color: "#5a7090", marginLeft: 6 }}>{a.sublabel}</span>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: a.openness.color, background: `${a.openness.color}18`, padding: "2px 6px", borderRadius: 3 }}>
                      {a.openness.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {getQBActions().filter(a => a.category==="move").map(a => (
                <button key={a.type} onClick={() => doAction(a)} style={{
                  ...btnBase, background: "#0e1520", border: "1px solid #1a2540",
                  padding: "6px 10px", color: "#8ab4e0", fontSize: 11, fontWeight: 600, flex: "1 1 auto",
                }}>
                  {a.label}<div style={{ fontSize: 9, color: "#4a6080", fontWeight: 400 }}>{a.sublabel}</div>
                </button>
              ))}
              {getQBActions().filter(a => a.category==="other").map(a => (
                <button key={a.type} onClick={() => doAction(a)} style={{
                  ...btnBase, background: "#1a1510", border: "1px solid #3a2a10",
                  padding: "6px 10px", color: "#d4a034", fontSize: 11, fontWeight: 600, flex: "1 1 auto",
                }}>
                  {a.label}<div style={{ fontSize: 9, color: "#7a6030", fontWeight: 400 }}>{a.sublabel}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* RUNNER DECISION */}
        {mode === "runner_decision" && (
          <div>
            <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, marginBottom: 6 }}>
              🏃 {ballCarrier.toUpperCase()} HAS THE BALL
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {getRunnerActions().map(a => (
                <button key={a.type} onClick={() => doRunnerAction(a)} style={{
                  ...btnBase,
                  background: a.category==="other" ? "#1a1510" : "#0e1520",
                  border: a.category==="other" ? "1px solid #3a2a10" : "1px solid #1a2540",
                  padding: "8px 12px", color: a.category==="other" ? "#d4a034" : "#8ab4e0",
                  fontSize: 12, fontWeight: 600, flex: "1 1 auto", textAlign: "center",
                }}>
                  {a.label}<div style={{ fontSize: 9, color: "#5a7090", fontWeight: 400 }}>{a.sublabel}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* RESULT */}
        {mode === "result" && playResult && (
          <div style={{
            background: "#10151f", borderRadius: 8, padding: 12,
            border: `1px solid ${playResult.turnover ? "#ef4444" : playResult.incomplete ? "#fbbf24" : playResult.yards >= 10 ? "#22c55e" : "#1a2540"}`,
          }}>
            <div style={{
              fontSize: 17, fontWeight: 800, marginBottom: 4,
              color: playResult.turnover ? "#ef4444" : playResult.incomplete ? "#fbbf24" : playResult.yards >= 10 ? "#22c55e" : playResult.yards >= 0 ? "#d0dce8" : "#ef4444",
            }}>
              {playResult.turnover ? "💥 TURNOVER" : playResult.incomplete ? "✋ INCOMPLETE" : playResult.yards >= 15 ? "🔥 BIG PLAY!" : playResult.yards >= 0 ? `+${playResult.yards} YARDS` : `${playResult.yards} YARDS`}
            </div>
            <div style={{ fontSize: 12, color: "#8a9ab0", marginBottom: 8 }}>{playResult.desc}</div>
            <div style={{ fontSize: 10, color: "#4a5a70", marginBottom: 10 }}>
              {selectedPlay?.name} vs {defScheme?.name} · {actionPhase} actions
            </div>
            <button onClick={advanceGame} style={{
              ...btnBase, width: "100%", padding: 10, background: "#162a4a", color: "#4a9eff",
              border: "1px solid #2a5a9a", fontSize: 13, fontWeight: 700,
            }}>NEXT PLAY →</button>
          </div>
        )}

        {log.length > 0 && (
          <div style={{ marginTop: 8, maxHeight: 90, overflowY: "auto", fontSize: 10, color: "#4a5a70" }}>
            {log.map((e, i) => <div key={i} style={{ padding: "1px 0", opacity: 1 - i * 0.06 }}>{e}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}
