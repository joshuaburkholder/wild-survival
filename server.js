const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const S = require('./public/shared.js');

const PORT = process.env.PORT || 3000;
const WORLD = 20000; // ~5 min to walk across (see SURFACE_SPEED in shared.js)
const MAX_LEAVES = 440;
const PUBLIC_CODE = 'PUBLIC';
const PREY_COUNT = 320, FISH_COUNT = 240, BAT_COUNT = 8, GEM_COUNT = 12, CAVE_FISH_COUNT = 14;
const PRICES = Object.fromEntries(Object.entries(S.RULES).map(([k, v]) => [k, v.price]));

// ---------- static file server ----------
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(__dirname, 'public', path.normalize(p).replace(/^(\.\.[\/\\])+/, ''));
  if (!file.startsWith(path.join(__dirname, 'public'))) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

// ---------- rooms ----------
const rooms = new Map();
let nextId = 1, nextLeaf = 1, nextCritter = 1;

function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c;
  do { c = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''); }
  while (rooms.has(c));
  return c;
}

function createRoom(code, isPublic) {
  const seed = Math.floor(Math.random() * 1e9);
  const world = S.genWorld(seed, WORLD);
  const room = {
    code, isPublic, seed, world, players: new Map(), leaves: new Map(), critters: new Map(),
    fruit: world.bushes.map(() => 2), start: Date.now(), respawn: [], trees: world.obstacles.filter((o) => S.CLIMB_H[o.type]),
    caves: Array.from({ length: S.ALL_CAVES }, (_, id) => { const def = S.genCave(seed, id); return { def, mush: def.mush.map(() => 2) }; }),
  };
  for (let i = 0; i < MAX_LEAVES; i++) spawnLeaf(room);
  for (let i = 0; i < PREY_COUNT; i++) spawnCritter(room, 'prey');
  if (world.ponds.length) for (let i = 0; i < FISH_COUNT; i++) spawnCritter(room, 'fish');
  for (let c = 0; c < S.ALL_CAVES; c++) {
    const flooded = room.caves[c].def.flooded;
    for (let i = 0; i < GEM_COUNT; i++) spawnGem(room, c);
    for (let i = 0; i < (flooded ? CAVE_FISH_COUNT : BAT_COUNT); i++) spawnCritter(room, flooded ? 'fish' : 'prey', c);
  }
  rooms.set(code, room);
  return room;
}

function spawnGem(room, c) {
  const p = S.caveSpot(room.caves[c].def, Math.random);
  const gem = { id: nextLeaf++, x: p.x, y: p.y, v: 10, c };
  room.leaves.set(gem.id, gem);
  return gem;
}

function spawnLeaf(room) {
  const leaf = {
    id: nextLeaf++, x: 100 + Math.random() * (WORLD - 200), y: 100 + Math.random() * (WORLD - 200),
    v: Math.random() < 0.15 ? 5 : Math.random() < 0.4 ? 2 : 1, c: -1,
  };
  room.leaves.set(leaf.id, leaf);
  return leaf;
}

function spawnCritter(room, k, cave = -1) {
  const w = room.world;
  let x, y, pond = -1;
  if (cave >= 0) {
    const p = S.caveSpot(room.caves[cave].def, Math.random); x = p.x; y = p.y;
  } else if (k === 'fish') {
    pond = Math.floor(Math.random() * w.ponds.length);
    const p = w.ponds[pond], a = Math.random() * 6.283, d = Math.random() * p.r * 0.7;
    x = p.x + Math.cos(a) * d; y = p.y + Math.sin(a) * d;
  } else {
    do { x = 100 + Math.random() * (WORLD - 200); y = 100 + Math.random() * (WORLD - 200); } while (S.inPond(w, x, y));
  }
  const c = { id: nextCritter++, k, x, y, a: Math.random() * 6.283, t: 1 + Math.random() * 2, go: 1, pond, cave };
  room.critters.set(c.id, c);
}

function stepCritters(room, dt) {
  const w = room.world;
  for (const c of room.critters.values()) {
    c.t -= dt;
    if (c.t <= 0) { c.t = 1 + Math.random() * 2.5; c.a = Math.random() * 6.283; c.go = Math.random() < 0.7 ? 1 : 0; }
    // prey flee from nearby players
    let speed = c.k === 'fish' ? 50 : 38;
    if (c.k === 'prey') {
      for (const p of room.players.values()) {
        if (p.loc !== c.cave) continue;
        const d = Math.hypot(p.x - c.x, p.y - c.y);
        if (d < 170 && !p.h) { c.a = Math.atan2(c.y - p.y, c.x - p.x); c.go = 1; speed = 120; c.t = 0.6; break; }
      }
    }
    if (!c.go) continue;
    const nx = c.x + Math.cos(c.a) * speed * dt, ny = c.y + Math.sin(c.a) * speed * dt;
    if (c.cave >= 0) {
      if (!S.caveWalkable(room.caves[c.cave].def, nx, ny)) { c.a += Math.PI * (0.6 + Math.random() * 0.8); continue; }
    } else if (c.k === 'fish') {
      const p = w.ponds[c.pond];
      if (Math.hypot(nx - p.x, ny - p.y) > p.r * 0.85) { c.a = Math.atan2(p.y - c.y, p.x - c.x); continue; }
    } else if (S.inPond(w, nx, ny) || nx < 40 || ny < 40 || nx > WORLD - 40 || ny > WORLD - 40) { c.a += Math.PI; continue; }
    c.x = nx; c.y = ny;
  }
}

function send(ws, obj) { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); }
function broadcast(room, obj) { for (const p of room.players.values()) send(p.ws, obj); }
const hpMax = (p) => S.STAGE_HP[S.stageOf(p.age)];

function feed(p, food, hp) {
  p.food = Math.min(100, p.food + food);
  p.hp = Math.min(hpMax(p), p.hp + hp);
}

function sendInv(p) { send(p.ws, { t: 'inv', leaves: p.leaves, owned: p.owned, animal: p.animal }); }

function killPlayer(room, tg, by) {
  tg.age = 0; tg.food = 70; tg.hp = S.STAGE_HP[0]; tg.leaves = Math.floor(tg.leaves / 2);
  tg.x = 250 + Math.random() * (WORLD - 500); tg.y = 250 + Math.random() * (WORLD - 500);
  while (S.inPond(room.world, tg.x, tg.y)) { tg.x = 250 + Math.random() * (WORLD - 500); tg.y = 250 + Math.random() * (WORLD - 500); }
  tg.h = 0; tg.dv = 0; tg.loc = -1; tg.fl = 0; tg.cl = 0;
  send(tg.ws, { t: 'died', by, x: tg.x, y: tg.y, hp: tg.hp });
  sendInv(tg);
}

createRoom(PUBLIC_CODE, true);

// ---------- sockets ----------
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  let player = null, room = null;

  function joinRoom(r, msg) {
    room = r;
    const owned = Array.isArray(msg.owned) ? msg.owned.filter((a) => a in PRICES) : [];
    for (const free of ['wolf', 'deer']) if (!owned.includes(free)) owned.push(free);
    const animal = owned.includes(msg.animal) ? msg.animal : 'wolf';
    player = {
      id: nextId++, ws, name: String(msg.name || 'Animal').slice(0, 14), animal, owned,
      leaves: Math.max(0, Math.min(100000, Number(msg.leaves) || 0)),
      x: WORLD / 2 + (Math.random() - 0.5) * 200, y: WORLD / 2 + (Math.random() - 0.5) * 200,
      a: 0, j: 0, rest: 0, h: 0, f: 0, dv: 0, mv: 0, loc: -1, fl: 0, cl: 0, clT: 0, al: 0, alPeak: 0, alT: 0,
      age: Math.max(0, Math.min(1e6, Number(msg.age) || 0)), hp: 1, food: 80, lastHit: 0,
    };
    player.hp = hpMax(player);
    room.players.set(player.id, player);
    send(ws, {
      t: 'welcome', id: player.id, room: room.code, isPublic: room.isPublic, seed: room.seed, world: WORLD,
      elapsed: Date.now() - room.start, leaves: [...room.leaves.values()], fruit: room.fruit, mush: room.caves.map((c) => c.mush),
      me: { animal: player.animal, owned: player.owned, leaves: player.leaves, x: player.x, y: player.y, age: player.age, hp: player.hp, food: player.food },
      prices: PRICES,
    });
  }

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.t === 'create' || msg.t === 'join') {
      const nm = String(msg.name || '').trim();
      if (!nm) return send(ws, { t: 'error', message: 'Please enter a name.' });
      if (S.isBadName(nm)) return send(ws, { t: 'error', message: 'That name is not allowed. Please pick a friendly name.' });
    }
    if (msg.t === 'create') { joinRoom(createRoom(makeCode(), false), msg); return; }
    if (msg.t === 'join') {
      const code = String(msg.room || PUBLIC_CODE).toUpperCase().trim();
      const r = rooms.get(code);
      if (!r) return send(ws, { t: 'error', message: `No server with code "${code}"` });
      joinRoom(r, msg); return;
    }
    if (!player) return;
    const rule = S.RULES[player.animal];

    if (msg.t === 'move') {
      const x = Number(msg.x), y = Number(msg.y);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        player.x = Math.max(0, Math.min(WORLD, x));
        player.y = Math.max(0, Math.min(WORLD, y));
      }
      player.a = Number(msg.a) || 0; player.j = msg.j ? 1 : 0; player.rest = msg.r ? 1 : 0; player.f = msg.f ? 1 : 0; player.mv = msg.m ? 1 : 0;
      // hiding is validated against the shared world
      player.h = 0; player.dv = 0;
      if (player.loc !== -1) { /* no bushes or ponds underground */ }
      else if (msg.h && rule.hides && S.inBush(room.world, player.x, player.y)) player.h = 1;
      else if (msg.dv && rule.aquatic && S.inPond(room.world, player.x, player.y)) { player.h = 1; player.dv = 1; }
      // flying and climbing (validated: only flyers fly, and climbers must be near a tree)
      player.fl = msg.fl && rule.flies ? 1 : 0; player.cl = 0;
      if (player.fl) { player.h = 0; player.dv = 0; }
      player.al = player.fl ? Math.max(0, Math.min(rule.flyMax || 100, Number(msg.al) || 0)) : 0;
      { const tn = Date.now(); player.alPeak = Math.max(player.al, (player.alPeak || 0) - 800 * Math.min(0.5, (tn - (player.alT || tn)) / 1000)); player.alT = tn; }
      if (msg.cl && rule.climbs && player.loc === -1) {
        const nowT = Date.now();
        if (room.trees.some((o) => Math.hypot(o.x - player.x, o.y - player.y) < o.r + 70)) player.clT = nowT;
        if (nowT - player.clT < 900) player.cl = 1;
      }
    } else if (msg.t === 'collect') {
      const leaf = room.leaves.get(msg.id);
      if (leaf && leaf.c === player.loc && Math.hypot(leaf.x - player.x, leaf.y - player.y) < 90) {
        room.leaves.delete(leaf.id);
        player.leaves += leaf.v;
        broadcast(room, { t: 'leafGone', id: leaf.id });
        sendInv(player);
      }
    } else if (msg.t === 'eat') {
      if (msg.kind === 'mush') {
        const cave = room.caves[player.loc], m = cave && cave.def.mush[msg.id];
        if (m && rule.diet.includes('fruit') && cave.mush[msg.id] > 0 && Math.hypot(m.x - player.x, m.y - player.y) < 80) {
          cave.mush[msg.id]--;
          feed(player, 40, 8);
          broadcast(room, { t: 'mush', c: player.loc, i: msg.id, n: cave.mush[msg.id] });
        }
      } else if (msg.kind === 'bush' && player.loc === -1) {
        const b = room.world.bushes[msg.id];
        if (b && rule.diet.includes('fruit') && room.fruit[msg.id] > 0 && Math.hypot(b.x - player.x, b.y - player.y) < b.r + 45) {
          room.fruit[msg.id]--;
          feed(player, 45 + (b.b === 'meadow' ? 15 : 0), 8);
          broadcast(room, { t: 'fruit', i: msg.id, n: room.fruit[msg.id] });
        }
      } else if (msg.kind === 'critter') {
        const c = room.critters.get(msg.id);
        if (c && c.cave === player.loc && rule.diet.includes(c.k) && Math.hypot(c.x - player.x, c.y - player.y) < 95) {
          room.critters.delete(c.id);
          room.respawn.push({ k: c.k, cave: c.cave, at: Date.now() + 8000 });
          feed(player, c.k === 'fish' ? 28 : 38, 10);
        }
      }
    } else if (msg.t === 'enter') {
      const en = room.world.entrances[msg.i];
      if (en && player.loc === -1 && Math.hypot(en.x - player.x, en.y - player.y) < 130 && (en.water ? (player.dv && rule.aquatic) : !player.dv)) {
        const ex = room.caves[en.cave].def.exits[en.end];
        player.loc = en.cave; player.x = ex.x; player.y = ex.y; player.h = 0; player.dv = 0;
        send(ws, { t: 'loc', loc: en.cave, x: ex.x, y: ex.y });
      }
    } else if (msg.t === 'leave') {
      const cave = room.caves[player.loc];
      const ex = cave && cave.def.exits[msg.end];
      if (ex && Math.hypot(ex.x - player.x, ex.y - player.y) < 140) {
        const en = room.world.entrances.find((e) => e.cave === player.loc && e.end === msg.end);
        player.loc = -1; player.x = en.x; player.y = en.y + (en.water ? 0 : 95); player.h = 0;
        send(ws, { t: 'loc', loc: -1, x: player.x, y: player.y });
      }
    } else if (msg.t === 'buy') {
      const cost = PRICES[msg.animal];
      if (cost !== undefined && !player.owned.includes(msg.animal) && player.leaves >= cost) {
        player.leaves -= cost; player.owned.push(msg.animal); player.animal = msg.animal; sendInv(player);
      }
    } else if (msg.t === 'select') {
      if (player.owned.includes(msg.animal)) { player.animal = msg.animal; sendInv(player); }
    } else if (msg.t === 'hit') {
      const now = Date.now();
      const tg = room.players.get(msg.id);
      if (!tg || tg === player || tg.loc !== player.loc || !rule.dmg || now - player.lastHit < 700 || tg.h || (tg.fl && !player.fl) || (tg.cl && !player.cl && !player.fl)) return;
      if (Math.hypot(tg.x - player.x, tg.y - player.y) > 175) return;
      player.lastHit = now;
      const bomb = player.fl ? 1 + Math.min(1.2, (player.alPeak || 0) / 600) : 1; // dive bombs from height hit harder (up to 2.2x)
      tg.hp -= Math.round(rule.dmg * S.DMG_MULT[S.stageOf(player.age)] * bomb);
      if (tg.hp <= 0) {
        killPlayer(room, tg, player.name);
        player.leaves += 10; feed(player, 30, 15); sendInv(player);
        send(ws, { t: 'killed', name: tg.name });
      }
    }
  });

  ws.on('close', () => {
    if (!player || !room) return;
    room.players.delete(player.id);
    broadcast(room, { t: 'left', id: player.id });
    if (!room.isPublic && room.players.size === 0) rooms.delete(room.code);
  });
});

// state broadcast 20x/sec (each player only sees their own location: surface or one cave)
setInterval(() => {
  for (const room of rooms.values()) {
    if (!room.players.size) continue;
    stepCritters(room, 0.05);
    const all = [...room.players.values()].map((p) => ({
      loc: p.loc, id: p.id, n: p.name, an: p.animal, hp: p.hp, ag: Math.floor(p.age), fd: Math.round(p.food), h: p.h, dv: p.dv, fl: p.fl, cl: p.cl, al: Math.round(p.al || 0),
      x: Math.round(p.x), y: Math.round(p.y), a: +p.a.toFixed(2), j: p.j, r: p.rest, f: p.f, m: p.mv,
    }));
    const byLoc = new Map();
    for (const c of room.critters.values()) {
      if (!byLoc.has(c.cave)) byLoc.set(c.cave, []);
      byLoc.get(c.cave).push([c.id, Math.round(c.x), Math.round(c.y), c.k === 'fish' ? 1 : 0, +c.a.toFixed(1)]);
    }
    for (const p of room.players.values()) {
      send(p.ws, { t: 'state', players: all.filter((q) => q.loc === p.loc), critters: byLoc.get(p.loc) || [] });
    }
  }
}, 50);

// aging, hunger, regeneration (1/sec)
setInterval(() => {
  for (const room of rooms.values()) for (const p of room.players.values()) {
    let drain = 0.35, cold = 0, by = 'the cold';
    if (p.loc === -1) { // harsh biomes hurt animals that are not adapted to them
      const bio = S.biomeAt(room.world.biomes, p.x, p.y);
      if (!p.fl && !S.tolerates(bio, p.animal)) {
        if (bio === 'desert') drain += 0.7;
        if (bio === 'snow' && !p.rest) cold = 2;
        if (bio === 'volcano' && !p.rest) { cold = 2; by = 'the heat'; }
      }
      const lp = room.world.ponds.find((q) => Math.hypot(q.x - p.x, q.y - p.y) < q.r);
      if (!p.fl && lp && S.biomeAt(room.world.biomes, lp.x, lp.y) === 'volcano' && !S.tolerates('volcano', p.animal)) { cold += 8; by = 'lava'; }
    }
    p.food = Math.max(0, p.food - drain);
    if (p.food > 0) p.age += 1;
    if (p.food <= 0) {
      p.hp -= 2;
      if (p.hp <= 0) { killPlayer(room, p, 'starvation'); continue; }
    } else {
      p.hp = Math.min(hpMax(p), p.hp + (p.rest ? 6 : 1));
    }
    if (cold) { p.hp -= cold; if (p.hp <= 0) { killPlayer(room, p, by); continue; } }
    if (p.hp > hpMax(p)) p.hp = hpMax(p);
  }
}, 1000);

// leaf / fruit / critter respawn
setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    if (!room.players.size) continue;
    if (room.leaves.size < MAX_LEAVES) broadcast(room, { t: 'leafNew', leaf: spawnLeaf(room) });
    room.respawn = room.respawn.filter((r) => { if (now >= r.at) { spawnCritter(room, r.k, r.cave); return false; } return true; });
    for (let c = 0; c < S.ALL_CAVES; c++) {
      let n = 0; for (const l of room.leaves.values()) if (l.c === c) n++;
      if (n < GEM_COUNT) broadcast(room, { t: 'leafNew', leaf: spawnGem(room, c) });
    }
  }
}, 1500);
setInterval(() => {
  for (const room of rooms.values()) {
    if (!room.players.size) continue;
    room.fruit.forEach((n, i) => {
      if (n < 3 && Math.random() < (['jungle', 'bamboo'].includes(room.world.bushes[i].b) ? 0.7 : 0.35)) { room.fruit[i]++; broadcast(room, { t: 'fruit', i, n: room.fruit[i] }); }
    });
    room.caves.forEach((cave, c) => cave.mush.forEach((n, i) => {
      if (n < 3 && Math.random() < 0.3) { cave.mush[i]++; broadcast(room, { t: 'mush', c, i, n: cave.mush[i] }); }
    }));
  }
}, 8000);

server.listen(PORT, () => console.log(`Wild Survival running at http://localhost:${PORT}`));
