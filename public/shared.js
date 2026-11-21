// Shared between the browser and the Node server (world generation + game rules).
(function (root) {
  function rng(s) {
    return () => {
      s |= 0; s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function genWorld(seed, world) {
    const r = rng(seed);
    const ponds = [], bushes = [], obstacles = [];
    const cx = world / 2;
    const k = (world / 3000) ** 1.5; // content scales with the world (less than its area, to keep it light)
    // biomes: every point belongs to its nearest site (borders wobble a little)
    const sites = [{ x: cx, y: cx, t: 'forest', p: r() * 6.3, q: r() * 6.3 }];
    for (const bt of [].concat(...[0, 1, 2, 3].map(() => ['desert', 'snow', 'swamp', 'jungle', 'savanna', 'mountain', 'volcano', 'bamboo', 'meadow', 'mushroom', 'forest', 'desert', 'snow']))) {
      let sx, sy, tries = 0;
      do { sx = 150 + r() * (world - 300); sy = 150 + r() * (world - 300); tries++; }
      while (tries < 80 && sites.some((o) => Math.hypot(o.x - sx, o.y - sy) < (o.t === 'forest' ? 1100 : 800)));
      sites.push({ x: sx, y: sy, t: bt, p: r() * 6.3, q: r() * 6.3 });
    }
    const biomes = { sites };
    const bAt = (x, y) => biomeAt(biomes, x, y);
    for (let i = 0; i < Math.round(9 * k); i++) {
      let p;
      for (let tries = 0; tries < 20; tries++) {
        p = { x: 150 + r() * (world - 300), y: 150 + r() * (world - 300), r: 110 + r() * 150 };
        if (Math.hypot(p.x - cx, p.y - cx) > p.r + 260) break;
      }
      ponds.push(p);
    }
    const free = (x, y, rad) => Math.hypot(x - cx, y - cx) > 250 && !ponds.some((p) => Math.hypot(p.x - x, p.y - y) < p.r + rad);
    const TREE = { forest: ['tree', 1], jungle: ['jungle', 1], snow: ['pine', 0.75], desert: ['cactus', 0.22], swamp: ['mangrove', 0.6], savanna: ['acacia', 0.3],
      mountain: ['boulder', 0.5], volcano: ['obsidian', 0.55], bamboo: ['bamboo', 1], meadow: ['blossom', 0.18], mushroom: ['shroom', 0.7] };
    const BUSH = { forest: 1, jungle: 1, snow: 0.5, desert: 0.3, swamp: 0.8, savanna: 0.85, mountain: 0.25, volcano: 0.12, bamboo: 0.9, meadow: 1, mushroom: 0.85 };
    const TREE_R = { cactus: 18, boulder: 38, obsidian: 26, bamboo: 14, shroom: 30 };
    for (let i = 0; i < Math.round(1800 * k); i++) {
      const x = r() * world, y = r() * world, s = 0.8 + r() * 0.6, roll = r(), b = bAt(x, y), [type, acc] = TREE[b];
      if (roll < acc && free(x, y, 30)) obstacles.push({ type, x, y, r: TREE_R[type] || 28, s, b });
    }
    for (let i = 0; i < Math.round(520 * k); i++) {
      const x = r() * world, y = r() * world, br = 44 + r() * 20, roll = r(), b = bAt(x, y);
      if (roll < BUSH[b] && free(x, y, 40)) bushes.push({ x, y, r: br, b });
    }
    for (let i = 0; i < Math.round(150 * k); i++) { const x = r() * world, y = r() * world; if (free(x, y, 24)) obstacles.push({ type: 'rock', x, y, r: 22, b: bAt(x, y) }); }
    // cave entrances: 3 caves, each with two mouths far apart on the surface (a cave is also a shortcut)
    const entrances = [];
    for (let c = 0; c < CAVE_COUNT; c++) {
      for (let e = 0; e < 2; e++) {
        let x, y, tries = 0;
        do { x = 300 + r() * (world - 600); y = 300 + r() * (world - 600); tries++; }
        while (tries < 80 && (!free(x, y, 90) || entrances.some((q) => Math.hypot(q.x - x, q.y - y) < 600)));
        entrances.push({ x, y, cave: c, end: e });
      }
    }
    // flooded caves: entrances on the floor of ponds (dive to use them)
    for (let c = 0; c < FLOODED_COUNT; c++) {
      for (let e = 0; e < 2; e++) {
        const p = ponds[(c * 2 + e) % ponds.length], a = r() * 6.283, d = r() * p.r * 0.4;
        entrances.push({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, cave: CAVE_COUNT + c, end: e, water: true });
      }
    }
    const clear = (o, pad) => !entrances.some((q) => Math.hypot(q.x - o.x, q.y - o.y) < 110 + pad);
    return { ponds, bushes: bushes.filter((b) => clear(b, b.r)), obstacles: obstacles.filter((o) => clear(o, o.r)), entrances, biomes };
  }

  // ---------- caves ----------
  const CAVE_COUNT = 3, FLOODED_COUNT = 2, ALL_CAVES = CAVE_COUNT + FLOODED_COUNT;
  function genCave(seed, id) {
    const r = rng(seed * 31 + id * 1013 + 7);
    const W = 2200, H = 1500, n = 6;
    const chambers = [];
    for (let i = 0; i < n; i++) {
      chambers.push({
        x: 260 + (i * (W - 520)) / (n - 1) + (r() - 0.5) * 60,
        y: H / 2 + Math.sin(i * 1.4 + id * 2) * (H * 0.28) + (r() - 0.5) * 80,
        r: 150 + r() * 80,
      });
    }
    const corridors = [];
    for (let i = 0; i < n - 1; i++) corridors.push({ a: i, b: i + 1, w: 96 });
    corridors.push({ a: 1, b: 4, w: 84 });
    const first = chambers[0], last = chambers[n - 1];
    const exits = [{ x: first.x - first.r * 0.55, y: first.y }, { x: last.x + last.r * 0.55, y: last.y }];
    const inside = (c, k) => { const a = r() * 6.283, d = Math.sqrt(r()) * c.r * k; return { x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d }; };
    const crystals = [], mush = [], pillars = [];
    const cols = ['#6ee7ff', '#c084fc', '#7dffb0', '#ff8ad8'];
    chambers.forEach((c, i) => {
      const nc = 5 + Math.floor(r() * 5);
      for (let k = 0; k < nc; k++) {
        const a = r() * 6.283, d = c.r * (0.8 + r() * 0.1);
        crystals.push({ x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d, s: 12 + r() * 16, rot: r() * 6.283, c: cols[Math.floor(r() * cols.length)] });
      }
      for (let k = 0; k < 2; k++) mush.push(inside(c, 0.65));
      for (let k = 0; k < 2; k++) { const p = inside(c, 0.6); pillars.push({ x: p.x, y: p.y, r: 14 + r() * 14 }); }
    });
    const flooded = id >= CAVE_COUNT;
    const air = flooded ? [2, 4].map((i) => ({ ...inside(chambers[i], 0.5), r: 62 })) : [];
    return { W, H, chambers, corridors, exits, crystals, mush, pillars, flooded, air };
  }
  function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }
  function caveWalkable(cv, x, y) {
    for (const c of cv.chambers) if (Math.hypot(c.x - x, c.y - y) < c.r - 6) return true;
    for (const k of cv.corridors) {
      const a = cv.chambers[k.a], b = cv.chambers[k.b];
      if (segDist(x, y, a.x, a.y, b.x, b.y) < k.w / 2 - 4) return true;
    }
    return false;
  }
  function caveSpot(cv, rand) {
    const c = cv.chambers[Math.floor(rand() * cv.chambers.length)], a = rand() * 6.283, d = Math.sqrt(rand()) * c.r * 0.7;
    return { x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d };
  }

  function biomeAt(bm, x, y) {
    let best = 'forest', bd = 1e12;
    for (const s of bm.sites) {
      const d = Math.hypot(s.x - x, s.y - y) + 220 * Math.sin(x * 0.0024 + s.p) + 220 * Math.sin(y * 0.0027 + s.q);
      if (d < bd) { bd = d; best = s.t; }
    }
    return best;
  }
  const BIOME_INFO = {
    forest:  { name: 'Forest',    emoji: '🌲' },
    jungle:  { name: 'Jungle',    emoji: '🌴', note: 'berries regrow fast' },
    savanna: { name: 'Savanna',   emoji: '🌾', note: 'open plains: everyone runs a bit faster' },
    desert:  { name: 'Desert',    emoji: '🏜️', hazard: 'scorching! extra hunger, slow stamina recovery' },
    snow:    { name: 'Snowfield', emoji: '❄️', hazard: 'freezing! you lose health (rest to warm up)' },
    swamp:   { name: 'Swamp',     emoji: '🐸', hazard: 'muddy! you move slowly' },
  };
  // animals that are at home in a harsh biome
  const TOLERANT = {
    desert: ['fox', 'coyote', 'hyena', 'cheetah', 'lion', 'rhino', 'panther', 'goat', 'badger', 'boar', 'zebra', 'hedgehog'],
    snow: ['polarbear', 'snowleopard', 'wolf', 'elk', 'goat', 'fox', 'rabbit', 'lynx', 'bear', 'panda'],
    swamp: ['boar', 'raccoon', 'skunk', 'hedgehog'],
  };
  Object.assign(BIOME_INFO, {
    mountain: { name: 'Mountains',      emoji: '⛰️', hazard: 'thin air! your stamina drains faster' },
    volcano:  { name: 'Volcano Lands',  emoji: '🌋', hazard: 'scorched ground and lava! you lose health' },
    bamboo:   { name: 'Bamboo Forest',  emoji: '🎍', note: 'berries regrow fast' },
    meadow:   { name: 'Flower Meadow',  emoji: '🌸', note: 'berries are extra nourishing' },
    mushroom: { name: 'Mushroom Grove', emoji: '🍄', note: 'it glows at night' },
  });
  TOLERANT.mountain = ['goat', 'yak', 'llama', 'marmot', 'snowleopard', 'bear', 'bison', 'elk', 'rabbit'];
  TOLERANT.volcano = ['komodo', 'salamander', 'boar', 'rhino', 'lion', 'hyena', 'camel'];
  TOLERANT.desert.push('camel', 'komodo');
  TOLERANT.snow.push('penguin', 'yak');
  function tolerates(biome, animal) {
    if (!TOLERANT[biome]) return true;
    if (biome === 'swamp' && RULES[animal] && RULES[animal].aquatic) return true;
    return TOLERANT[biome].includes(animal);
  }
  const inPond = (w, x, y) => w.ponds.some((p) => Math.hypot(p.x - x, p.y - y) < p.r);
  const inBush = (w, x, y) => w.bushes.some((b) => Math.hypot(b.x - x, b.y - y) < b.r * 0.85);

  // ---------- name filter ----------
  // Words blocked anywhere inside a name (after removing symbols/digits tricks and repeated letters)
  const BAD_ANYWHERE = ['fuck', 'shit', 'bitch', 'cunt', 'pussy', 'whore', 'slut', 'bastard', 'asshole', 'nigger', 'nigga',
    'faggot', 'retard', 'rapist', 'nazi', 'hitler', 'penis', 'vagina', 'porn', 'dickhead', 'blowjob', 'handjob', 'cumshot',
    'motherfucker', 'wanker', 'twat', 'dildo', 'jizz', 'molest', 'pedo', 'jackass', 'dumbass', 'bullshit', 'horny'];
  // Short words that are only blocked when they stand alone (so "Essex" or "Peacock" are fine)
  const BAD_WHOLE = ['ass', 'sex', 'cock', 'dick', 'fag', 'tit', 'tits', 'cum', 'anal', 'hoe', 'rape', 'damn', 'crap', 'piss', 'boob', 'boobs', 'nude'];
  const LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i', '+': 't', '|': 'i' };
  const squash = (str) => str.replace(/(.)\1+/g, '$1');
  const clean = (str) => squash(String(str).toLowerCase().replace(/[01345788@$!+|]/g, (ch) => LEET[ch] || ch).replace(/[^a-z]/g, ''));
  const ANY = BAD_ANYWHERE.map(squash), WHOLE = new Set(BAD_WHOLE.map(squash));
  function isBadName(name) {
    const raw = String(name || '').toLowerCase();
    const joined = clean(raw);
    if (ANY.some((w) => joined.includes(w))) return true;
    return raw.split(/[^a-z0-9@$!+|]+/).filter(Boolean).some((tok) => WHOLE.has(clean(tok)));
  }

  // Life stages (seconds alive, while fed)
  const STAGES = ['Pup', 'Juvenile', 'Adult', 'Elder'];
  const STAGE_AT = [0, 60, 180, 420];
  const STAGE_HP = [60, 80, 100, 90];
  const DMG_MULT = [0.5, 0.75, 1, 0.9];
  const stageOf = (age) => STAGE_AT.reduce((st, t, i) => (age >= t ? i : st), 0);

  // diet: fruit (bush berries), prey (land critters), fish (pond fish)
  const RULES = {
    wolf:   { price: 0,   diet: ['prey'],                  dmg: 30 },
    deer:   { price: 0,   diet: ['fruit'],                 hides: true },
    rabbit: { price: 25,  diet: ['fruit'],                 hides: true },
    fox:    { price: 60,  diet: ['prey', 'fruit'],         dmg: 20 },
    otter:  { price: 90,  diet: ['fish', 'fruit'],         aquatic: true, dmg: 12 },
    lynx:   { climbs: true, price: 100, diet: ['prey'],                  dmg: 28 },
    bear:   { climbs: true, price: 200, diet: ['prey', 'fruit', 'fish'], dmg: 40 },
    croc:   { price: 260, diet: ['fish', 'prey'],          dmg: 45, aquatic: true },
    squirrel: { climbs: true, price: 15,  diet: ['fruit'],                 hides: true },
    hedgehog: { price: 35,  diet: ['fruit', 'prey'],         hides: true },
    coyote:   { price: 40,  diet: ['prey'],                  dmg: 16 },
    beaver:   { price: 70,  diet: ['fruit', 'fish'],         aquatic: true, dmg: 10 },
    boar:     { price: 150, diet: ['fruit', 'prey'],         dmg: 32 },
    elk:      { price: 170, diet: ['fruit'],                 hides: true },
    panther:  { climbs: true, price: 280, diet: ['prey'],                  dmg: 34 },
    lion:     { price: 350, diet: ['prey'],                  dmg: 42 },
    skunk:      { price: 25,  diet: ['fruit', 'prey'],       hides: true },
    raccoon:    { climbs: true, price: 50,  diet: ['fruit', 'fish'],       hides: true },
    turtle:     { price: 55,  diet: ['fruit', 'fish'],       aquatic: true },
    capybara:   { price: 65,  diet: ['fruit'],               aquatic: true, hides: true },
    goat:       { price: 90,  diet: ['fruit'],               hides: true, dmg: 14 },
    badger:     { price: 95,  diet: ['prey', 'fruit'],       dmg: 20 },
    hyena:      { price: 120, diet: ['prey'],                dmg: 22 },
    zebra:      { price: 130, diet: ['fruit'],               hides: true },
    panda:      { price: 250, diet: ['fruit'],               hides: true },
    cheetah:    { price: 260, diet: ['prey'],                dmg: 26 },
    tiger:      { climbs: true, price: 300, diet: ['prey'],                dmg: 40 },
    snowleopard:{ climbs: true, price: 320, diet: ['prey'],                dmg: 36 },
    polarbear:  { price: 380, diet: ['prey', 'fish'],        dmg: 46 },
    hippo:      { price: 420, diet: ['fruit', 'fish'],       aquatic: true, dmg: 44 },
    rhino:      { price: 450, diet: ['fruit'],               dmg: 50 },
    marmot:     { climbs: true, price: 20,  diet: ['fruit'],               hides: true },
    sheep:      { price: 30,  diet: ['fruit'],               hides: true },
    frog:       { price: 40,  diet: ['prey', 'fish'],        aquatic: true, hides: true },
    salamander: { price: 45,  diet: ['prey', 'fruit'],       hides: true },
    redpanda:   { climbs: true, price: 70,  diet: ['fruit'],               hides: true },
    llama:      { price: 80,  diet: ['fruit'],               hides: true },
    monkey:     { climbs: true, price: 85,  diet: ['fruit'],               hides: true },
    penguin:    { price: 100, diet: ['fish'],                aquatic: true, dmg: 8 },
    camel:      { price: 110, diet: ['fruit'],               hides: true },
    yak:        { price: 140, diet: ['fruit'],               dmg: 22 },
    horse:      { price: 160, diet: ['fruit'] },
    bison:      { price: 190, diet: ['fruit'],               dmg: 34 },
    komodo:     { price: 230, diet: ['prey'],                dmg: 36 },
    gorilla:    { climbs: true, price: 330, diet: ['fruit', 'prey'],       dmg: 40 },
    hummingbird:{ price: 45,  diet: ['fruit'],               flies: true, flyMax: 3500, hides: true },
    sparrow:    { price: 15,  diet: ['fruit'],               flies: true, flyMax: 3500, hides: true },
    parrot:     { price: 90,  diet: ['fruit'],               flies: true, flyMax: 3500, hides: true },
    bat:        { price: 100, diet: ['prey', 'fruit'],       flies: true, flyMax: 3500 },
    owl:        { price: 200, diet: ['prey'],                flies: true, flyMax: 3500, dmg: 24 },
    eagle:      { price: 380, diet: ['prey'],                flies: true, flyMax: 3500, dmg: 38 },
  };

  const CLIMB_H = { tree: 62, jungle: 92, pine: 70, blossom: 66, mangrove: 50, acacia: 68 };
  const api = { CLIMB_H, biomeAt, BIOME_INFO, tolerates, isBadName, CAVE_COUNT, FLOODED_COUNT, ALL_CAVES, genCave, caveWalkable, caveSpot, rng, genWorld, inPond, inBush, STAGES, STAGE_AT, STAGE_HP, DMG_MULT, stageOf, RULES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Shared = api;
})(typeof window !== 'undefined' ? window : this);
