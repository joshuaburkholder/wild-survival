'use strict';

const { genWorld, genCave, caveWalkable, biomeAt, BIOME_INFO, RULES, STAGES, STAGE_AT, STAGE_HP, stageOf } = Shared;

// ===================== Animals =====================
// L/B = body half-length / half-width (in units of size)
const ANIMALS = {
  wolf:   { label: 'Wolf',      emoji: '🐺', speed: 220, size: 17, L: 1.2,  B: 0.62, desc: 'Lunge: dash at the nearest animal and bite. Hunts critters.',
            ab: { name: 'Lunge', dur: 0.45, cd: 5, cost: 20, special: 'lunge', range: 520, speed: 950 } },
  deer:   { label: 'Deer',      emoji: '🦌', speed: 240, size: 18, L: 1.2,  B: 0.55, desc: 'Fast. Eats berries and hides in bushes.',
            ab: { name: 'Leap Sprint', dur: 1.3, cd: 6, cost: 25, mul: 2.2 } },
  rabbit: { label: 'Rabbit',    emoji: '🐇', speed: 265, size: 11, L: 0.95, B: 0.7,  desc: 'Tiny and quick. Eats berries and hides in bushes.',
            ab: { name: 'Zigzag', dur: 1.0, cd: 4, cost: 18, mul: 2.0 } },
  fox:    { label: 'Fox',       emoji: '🦊', speed: 235, size: 14, L: 1.1,  B: 0.5,  desc: 'Sneak Pounce: stealthy bite. Eats critters and berries.',
            ab: { name: 'Sneak Pounce', dur: 0.4, cd: 5, cost: 18, special: 'lunge', range: 430, speed: 1000, stealth: true } },
  otter:  { label: 'Otter',     emoji: '🦦', speed: 200, size: 13, L: 1.5,  B: 0.42, desc: 'Water animal: Space dives underwater. Nip: quick small bite. Eats fish and berries.',
            ab: { name: 'Nip', dur: 0.4, cd: 3.5, cost: 12, special: 'lunge', range: 320, speed: 850 } },
  lynx:   { label: 'Lynx',      emoji: '🐆', speed: 250, size: 17, L: 1.0,  B: 0.6,  desc: 'Pounce: huge fast lunge. Eats critters.',
            ab: { name: 'Pounce', dur: 0.38, cd: 5.5, cost: 22, special: 'lunge', range: 650, speed: 1150 } },
  bear:   { label: 'Bear',      emoji: '🐻', speed: 195, size: 26, L: 1.25, B: 0.9,  desc: 'Maul: heavy bite. Eats critters, fish and berries.',
            ab: { name: 'Maul', dur: 0.45, cd: 6.5, cost: 28, special: 'lunge', range: 320, speed: 720 } },
  croc:   { label: 'Crocodile', emoji: '🐊', speed: 160, size: 22, L: 1.75, B: 0.5,  desc: 'Water ambusher: Space dives. Death Roll bite. Eats fish and critters.',
            ab: { name: 'Death Roll', dur: 0.45, cd: 6, cost: 25, special: 'lunge', range: 380, speed: 850 } },
  squirrel: { label: 'Squirrel', emoji: '🐿️', speed: 270, size: 9,  L: 0.9,  B: 0.5,  desc: 'Tiny and super fast. Eats berries and hides in bushes.',
            ab: { name: 'Scurry', dur: 1.2, cd: 4, cost: 16, mul: 2.1 } },
  hedgehog: { label: 'Hedgehog', emoji: '🦔', speed: 170, size: 11, L: 0.9,  B: 0.65, desc: 'Slow but spiky. Eats berries and critters, hides in bushes.',
            ab: { name: 'Roll Dash', dur: 1.0, cd: 6, cost: 20, mul: 2.3 } },
  coyote: { label: 'Coyote',   emoji: '🐕', speed: 235, size: 15, L: 1.1,  B: 0.5,  desc: 'Snap: quick lunge bite. Cheap little hunter.',
            ab: { name: 'Snap', dur: 0.4, cd: 4.5, cost: 18, special: 'lunge', range: 400, speed: 900 } },
  beaver: { label: 'Beaver',   emoji: '🦫', speed: 190, size: 14, L: 1.2,  B: 0.6,  desc: 'Water animal: Space dives. Tail Slap: small bite. Eats berries and fish.',
            ab: { name: 'Tail Slap', dur: 0.4, cd: 4, cost: 14, special: 'lunge', range: 280, speed: 750 } },
  boar:   { label: 'Boar',     emoji: '🐗', speed: 210, size: 21, L: 1.2,  B: 0.8,  desc: 'Charge: heavy tusk lunge. Eats berries and critters.',
            ab: { name: 'Charge', dur: 0.45, cd: 6, cost: 24, special: 'lunge', range: 380, speed: 850 } },
  elk:    { label: 'Elk',      emoji: '🦌', speed: 235, size: 24, L: 1.35, B: 0.62, desc: 'Big antlered plant eater. Stampede burst. Hides in bushes.',
            ab: { name: 'Stampede', dur: 1.5, cd: 7, cost: 28, mul: 2.0 } },
  panther: { label: 'Panther', emoji: '🐈‍⬛', speed: 255, size: 18, L: 1.15, B: 0.55, desc: 'Shadow Pounce: stealthy long lunge. Eats critters.',
            ab: { name: 'Shadow Pounce', dur: 0.4, cd: 5.5, cost: 22, special: 'lunge', range: 600, speed: 1100, stealth: true } },
  lion:   { label: 'Lion',     emoji: '🦁', speed: 235, size: 22, L: 1.25, B: 0.75, desc: 'Roar Pounce: powerful lunge. Males grow a mane as adults.',
            ab: { name: 'Roar Pounce', dur: 0.45, cd: 6, cost: 26, special: 'lunge', range: 520, speed: 1000 } },
  skunk: { label: 'Skunk', emoji: '🦨', speed: 190, size: 10, L: 0.9, B: 0.5, desc: 'Small and stripey. Eats berries and critters, hides in bushes.',
            ab: { name: 'Spray Dash', dur: 1.0, cd: 5, cost: 16, mul: 2.0 } },
  raccoon: { label: 'Raccoon', emoji: '🦝', speed: 210, size: 12, L: 1.0, B: 0.55, desc: 'Sneaky. Eats berries and fish, hides in bushes.',
            ab: { name: 'Sneak Run', dur: 1.4, cd: 6, cost: 18, mul: 1.9 } },
  turtle: { label: 'Turtle', emoji: '🐢', speed: 120, size: 13, L: 1.0, B: 0.85, desc: 'Water animal: slow on land. Space dives. Shell Spin burst.',
            ab: { name: 'Shell Spin', dur: 1.2, cd: 7, cost: 16, mul: 2.4 } },
  capybara: { label: 'Capybara', emoji: '🐹', speed: 170, size: 16, L: 1.2, B: 0.7, desc: 'Calm water animal. Space dives. Eats berries, hides in bushes.',
            ab: { name: 'Calm Dash', dur: 1.5, cd: 6, cost: 18, mul: 1.9 } },
  goat: { label: 'Goat', emoji: '🐐', speed: 225, size: 15, L: 1.05, B: 0.55, desc: 'Headbutt: small lunge bite. Eats berries, hides in bushes.',
            ab: { name: 'Headbutt', dur: 0.4, cd: 4.5, cost: 18, special: 'lunge', range: 330, speed: 850 } },
  badger: { label: 'Badger', emoji: '🦡', speed: 195, size: 14, L: 1.05, B: 0.65, desc: 'Claw Dash: tough little biter. Eats critters and berries.',
            ab: { name: 'Claw Dash', dur: 0.4, cd: 4.5, cost: 16, special: 'lunge', range: 350, speed: 800 } },
  hyena: { label: 'Hyena', emoji: '🐕', speed: 230, size: 17, L: 1.15, B: 0.62, desc: 'Cackle Lunge: quick strong bite. Eats critters.',
            ab: { name: 'Cackle Lunge', dur: 0.42, cd: 5, cost: 20, special: 'lunge', range: 460, speed: 950 } },
  zebra: { label: 'Zebra', emoji: '🦓', speed: 250, size: 20, L: 1.3, B: 0.6, desc: 'Fast striped plant eater. Gallop burst. Hides in bushes.',
            ab: { name: 'Gallop', dur: 1.4, cd: 6, cost: 25, mul: 2.1 } },
  panda: { label: 'Panda', emoji: '🐼', speed: 160, size: 22, L: 1.2, B: 0.85, desc: 'Chunky and cute. Bamboo Roll burst. Eats berries, hides in bushes.',
            ab: { name: 'Bamboo Roll', dur: 1.2, cd: 6, cost: 20, mul: 2.0 } },
  cheetah: { label: 'Cheetah', emoji: '🐆', speed: 275, size: 16, L: 1.2, B: 0.45, desc: 'Fastest animal. Sprint Pounce: very long lunge. Eats critters.',
            ab: { name: 'Sprint Pounce', dur: 0.4, cd: 6, cost: 26, special: 'lunge', range: 700, speed: 1250 } },
  tiger: { label: 'Tiger', emoji: '🐅', speed: 240, size: 21, L: 1.25, B: 0.7, desc: 'Tiger Pounce: powerful lunge. Eats critters.',
            ab: { name: 'Tiger Pounce', dur: 0.45, cd: 6, cost: 26, special: 'lunge', range: 560, speed: 1050 } },
  snowleopard: { label: 'Snow Leopard', emoji: '🐆', speed: 250, size: 18, L: 1.15, B: 0.6, desc: 'Snow Pounce: stealthy long lunge. Eats critters.',
            ab: { name: 'Snow Pounce', dur: 0.4, cd: 5.5, cost: 24, special: 'lunge', range: 620, speed: 1100, stealth: true } },
  polarbear: { label: 'Polar Bear', emoji: '🐻‍❄️', speed: 190, size: 27, L: 1.35, B: 0.9, desc: 'Polar Maul: massive bite. Eats critters and fish.',
            ab: { name: 'Polar Maul', dur: 0.45, cd: 7, cost: 30, special: 'lunge', range: 330, speed: 720 } },
  hippo: { label: 'Hippo', emoji: '🦛', speed: 150, size: 24, L: 1.3, B: 0.95, desc: 'Water giant: Space dives. Chomp: huge bite. Eats berries and fish.',
            ab: { name: 'Chomp', dur: 0.45, cd: 7, cost: 28, special: 'lunge', range: 300, speed: 700 } },
  rhino: { label: 'Rhino', emoji: '🦏', speed: 185, size: 26, L: 1.35, B: 0.85, desc: 'Horn Charge: the hardest hit. Eats berries.',
            ab: { name: 'Horn Charge', dur: 0.45, cd: 7, cost: 30, special: 'lunge', range: 450, speed: 900 } },
  marmot: { label: 'Marmot', emoji: '🐿️', speed: 235, size: 9, L: 0.9, B: 0.55, desc: 'Tiny mountain dweller. Hides in bushes.',
            ab: { name: 'Burrow Dash', dur: 1.0, cd: 4, cost: 15, mul: 2.2 } },
  sheep: { label: 'Sheep', emoji: '🐑', speed: 200, size: 16, L: 1.1, B: 0.65, desc: 'Fluffy and cheap. Woolly Rush burst. Hides in bushes.',
            ab: { name: 'Woolly Rush', dur: 1.4, cd: 6, cost: 16, mul: 1.8 } },
  frog: { label: 'Frog', emoji: '🐸', speed: 185, size: 9, L: 0.9, B: 0.65, desc: 'Water animal: Space dives. Frog Leap. Eats critters and fish.',
            ab: { name: 'Frog Leap', dur: 0.8, cd: 3.5, cost: 14, mul: 2.4 } },
  salamander: { label: 'Salamander', emoji: '🦎', speed: 180, size: 10, L: 1.2, B: 0.4, desc: 'Fire-proof! Lives happily in the volcano lands.',
            ab: { name: 'Flame Skitter', dur: 1.1, cd: 5, cost: 16, mul: 2.1 } },
  redpanda: { label: 'Red Panda', emoji: '🦊', speed: 215, size: 11, L: 1.0, B: 0.55, desc: 'Bamboo lover. Tree Dash burst. Hides in bushes.',
            ab: { name: 'Tree Dash', dur: 1.2, cd: 5, cost: 16, mul: 2.0 } },
  llama: { label: 'Llama', emoji: '🦙', speed: 225, size: 19, L: 1.2, B: 0.55, desc: 'Mountain-tough. Spit Dash burst. Hides in bushes.',
            ab: { name: 'Spit Dash', dur: 1.3, cd: 6, cost: 22, mul: 2.0 } },
  monkey: { label: 'Monkey', emoji: '🐒', speed: 230, size: 14, L: 1.0, B: 0.5, desc: 'Swing Dash burst. Eats berries, hides in bushes.',
            ab: { name: 'Swing Dash', dur: 1.3, cd: 5, cost: 18, mul: 2.1 } },
  penguin: { label: 'Penguin', emoji: '🐧', speed: 150, size: 12, L: 0.9, B: 0.6, desc: 'Water animal that loves snow. Space dives. Belly Slide burst. Eats fish.',
            ab: { name: 'Belly Slide', dur: 1.2, cd: 5, cost: 14, mul: 2.6 } },
  camel: { label: 'Camel', emoji: '🐫', speed: 195, size: 23, L: 1.35, B: 0.7, desc: 'Desert survivor. Desert Dash burst. Hides in bushes.',
            ab: { name: 'Desert Dash', dur: 1.8, cd: 7, cost: 24, mul: 1.8 } },
  yak: { label: 'Yak', emoji: '🐃', speed: 175, size: 24, L: 1.3, B: 0.9, desc: 'Shaggy mountain ox. Yak Charge: lunge bite.',
            ab: { name: 'Yak Charge', dur: 0.45, cd: 6, cost: 24, special: 'lunge', range: 330, speed: 760 } },
  horse: { label: 'Horse', emoji: '🐎', speed: 280, size: 22, L: 1.4, B: 0.58, desc: 'Super fast plains runner. Full Gallop burst.',
            ab: { name: 'Full Gallop', dur: 1.6, cd: 7, cost: 28, mul: 2.0 } },
  bison: { label: 'Bison', emoji: '🦬', speed: 205, size: 25, L: 1.3, B: 0.92, desc: 'Humped and horned. Bison Charge: heavy lunge.',
            ab: { name: 'Bison Charge', dur: 0.45, cd: 6.5, cost: 28, special: 'lunge', range: 420, speed: 900 } },
  komodo: { label: 'Komodo Dragon', emoji: '🦎', speed: 170, size: 17, L: 1.5, B: 0.5, desc: 'Venom Bite: deadly lunge. Fire-proof in the volcano lands.',
            ab: { name: 'Venom Bite', dur: 0.45, cd: 5.5, cost: 22, special: 'lunge', range: 380, speed: 800 } },
  gorilla: { label: 'Gorilla', emoji: '🦍', speed: 190, size: 26, L: 1.25, B: 0.9, desc: 'Gorilla Smash: huge lunge. Eats berries and critters.',
            ab: { name: 'Gorilla Smash', dur: 0.45, cd: 7, cost: 28, special: 'lunge', range: 340, speed: 760 } },
  sparrow: { label: 'Sparrow', emoji: '🐦', speed: 215, size: 8, L: 0.9, B: 0.55, flyAlt: 80, desc: 'Tiny flyer: Space takes off. Eats berries, hides in bushes.',
            ab: { name: 'Flutter', dur: 1.0, cd: 4, cost: 14, mul: 2.0 } },
  hummingbird: { label: 'Hummingbird', emoji: '🐦', speed: 240, size: 6, L: 0.9, B: 0.5, flyAlt: 70, desc: 'Super-fast tiny flyer. Hover Dash. Eats berries.',
            ab: { name: 'Hover Dash', dur: 0.9, cd: 4, cost: 14, mul: 2.5 } },
  parrot: { label: 'Parrot', emoji: '🦜', speed: 205, size: 11, L: 1.0, B: 0.55, flyAlt: 95, desc: 'Colourful flyer. Squawk Dash. Eats berries.',
            ab: { name: 'Squawk Dash', dur: 1.3, cd: 5, cost: 16, mul: 2.0 } },
  bat: { label: 'Bat', emoji: '🦇', speed: 215, size: 9, L: 0.9, B: 0.5, flyAlt: 85, desc: 'Night flyer that loves caves. Echo Dash. Eats critters and berries.',
            ab: { name: 'Echo Dash', dur: 1.2, cd: 5, cost: 16, mul: 2.2 } },
  owl: { label: 'Owl', emoji: '🦉', speed: 200, size: 13, L: 1.0, B: 0.65, flyAlt: 100, desc: 'Silent Swoop: stealthy flying lunge. Eats critters.',
            ab: { name: 'Silent Swoop', dur: 0.45, cd: 5.5, cost: 22, special: 'lunge', range: 520, speed: 950, stealth: true } },
  eagle: { label: 'Eagle', emoji: '🦅', speed: 215, size: 17, L: 1.05, B: 0.6, flyAlt: 130, desc: 'King of the sky. Talon Dive: long lunge. Eats critters.',
            ab: { name: 'Talon Dive', dur: 0.45, cd: 6, cost: 26, special: 'lunge', range: 650, speed: 1150 } },
};
const STAGE_SPEED = [0.85, 0.95, 1, 0.9];
const SURFACE_SPEED = 0.3; // overland speed scale: 20000-unit world takes ~5 min to walk across
const SC_START = [0.55, 0.8, 1.0, 1.06], SC_END = [0.8, 1.0, 1.06, 1.06];
function scaleOf(age) {
  const i = stageOf(age), next = STAGE_AT[i + 1];
  if (next === undefined) return SC_START[i];
  return SC_START[i] + (SC_END[i] - SC_START[i]) * ((age - STAGE_AT[i]) / (next - STAGE_AT[i]));
}
const FOOD_ICON = { fruit: '🍓', prey: '🍖', fish: '🐟' };

const SAVE_KEY = 'wildSurvivalProfile';
function loadProfile() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { return {}; } }
function saveProfile() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ name: me.name, leaves: me.leaves, owned: me.owned, animal: me.animal, age: me.age })); } catch {}
}

// ===================== State =====================
const $ = (id) => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d');
const profile = loadProfile();
let view3d = (() => { try { return localStorage.getItem('wsView') !== '2d'; } catch { return true; } })();
const has3d = () => !!(window.V3 && window.V3.ready);
function setView(on) {
  view3d = on; try { localStorage.setItem('wsView', on ? '3d' : '2d'); } catch {}
  refreshViewBtn();
}
function refreshViewBtn() {
  const b = $('btnView'); if (!b) return;
  b.textContent = !has3d() ? 'View: 2D (3D unavailable)' : view3d ? 'View: 3D — click for 2D (V)' : 'View: 2D — click for 3D (V)';
}

const me = {
  name: profile.name || '', animal: ANIMALS[profile.animal] ? profile.animal : 'wolf',
  owned: (profile.owned || ['wolf', 'deer']).filter((a) => ANIMALS[a]), leaves: profile.leaves || 0, age: profile.age || 0,
  hp: 60, food: 80, x: 1500, y: 1500, angle: 0,
  energy: 100, exhausted: false, jump: 0, resting: false, moving: false, sprinting: false, swimming: false, dive: false, hidden: false,
  abTime: 0, abCd: 0, smellTime: 0, smellCd: 0, nightVision: false, lunge: null, menu: false,
  lastStage: undefined, flyAltT: 80, fly: false, climb: null, swing: null, swingLift: 0, alt: 0, treeNear: -1, biome: null, flash: 0, loc: -1, door: null, growFx: 0, eatTarget: null, eatCd: 0, starving: false,
};
let ws = null, myId = null, WORLD = 3000, seed = 1, roomCode = '', isPublic = false, prices = {};
let playing = false;
let leaves = new Map(), others = new Map(), critters = new Map();
let obstacles = [], ponds = [], bushes = [], fruit = [], entrances = [], caveDefs = [], mush = [], biomes = null;
let clock0 = 0;
const keys = {};
const pending = new Set();
let statusMsg = '', statusUntil = 0;
function say(msg, secs = 2) { statusMsg = msg; statusUntil = performance.now() + secs * 1000; }

// ===================== Lobby =====================
$('name').value = me.name;
function refreshPlayingAs() {
  const d = ANIMALS[me.animal];
  $('playingAs').textContent = `Playing as: ${d.emoji} ${d.label}  •  🍃 ${me.leaves}  •  ${STAGES[stageOf(me.age)]}`;
}
refreshPlayingAs();

function connect(mode, code) {
  $('error').textContent = '';
  me.name = $('name').value.trim() || 'Animal';
  if (Shared.isBadName(me.name)) { $('error').textContent = 'That name is not allowed. Please pick a friendly name.'; return; }
  if (ws) try { ws.close(); } catch {}
  ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`);
  ws.onopen = () => {
    const base = { name: me.name, animal: me.animal, owned: me.owned, leaves: me.leaves, age: me.age };
    send(mode === 'create' ? { t: 'create', ...base } : { t: 'join', room: code, ...base });
  };
  ws.onmessage = (e) => handle(JSON.parse(e.data));
  ws.onerror = () => { $('error').textContent = 'Cannot reach the server. Is it running?'; };
  ws.onclose = () => { if (playing) { leaveGame(); $('error').textContent = 'Disconnected from server.'; } };
}
function setRoomInfo() {
  const base = isPublic ? '🌍 Public Server' : `🔒 Private Server — code: <b>${roomCode}</b>`;
  $('roomInfo').innerHTML = base + (me.loc >= 0 ? (caveDefs[me.loc].flooded ? `<br>🌊 Flooded cave ${me.loc - Shared.CAVE_COUNT + 1}` : `<br>🕳️ Cave system ${me.loc + 1}`) : '');
}
function send(o) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); }

$('btnPublic').onclick = () => connect('join', 'PUBLIC');
$('btnCreate').onclick = () => connect('create');
$('btnJoin').onclick = () => {
  const c = $('code').value.trim();
  if (!c) { $('error').textContent = 'Type a server code first.'; return; }
  connect('join', c);
};
$('btnLeave').onclick = () => { setMenu(false); if (ws) ws.close(); leaveGame(); };
$('btnShop').onclick = () => setMenu(true);
$('btnLobbyMenu').onclick = () => setMenu(true);
$('btnResume').onclick = () => setMenu(false);
$('btnView').onclick = () => setView(!view3d);

function setMenu(on) {
  me.menu = on;
  if (on && document.exitPointerLock) document.exitPointerLock();
  refreshViewBtn();
  $('menu').classList.toggle('hidden', !on);
  $('btnLeave').classList.toggle('hidden', !playing);
  $('btnResume').textContent = playing ? 'Resume (H)' : 'Close';
  for (const k in keys) keys[k] = false;
  if (on) renderShop();
  refreshPlayingAs();
}

function leaveGame() {
  playing = false;
  $('lobby').classList.remove('hidden');
  $('hud').classList.add('hidden');
  refreshPlayingAs();
}

// ===================== Network =====================
function handle(m) {
  if (m.t === 'error') { $('error').textContent = m.message; return; }
  if (m.t === 'welcome') {
    myId = m.id; roomCode = m.room; isPublic = m.isPublic; seed = m.seed; WORLD = m.world; prices = m.prices;
    clock0 = performance.now() - m.elapsed;
    leaves = new Map(m.leaves.map((l) => [l.id, l]));
    others.clear(); critters.clear(); pending.clear();
    fruit = m.fruit;
    ({ obstacles, ponds, bushes, entrances, biomes } = genWorld(seed, WORLD));
    caveDefs = Array.from({ length: Shared.ALL_CAVES }, (_, i) => genCave(seed, i));
    mush = m.mush;
    decor.clear();
    Object.assign(me, m.me);
    me.energy = 100; me.exhausted = false; me.lunge = null; me.hidden = false; me.dive = false; me.fly = false; me.climb = null; me.swing = null; me.alt = 0; me.loc = -1; me.lastStage = stageOf(me.age);
    playing = true;
    $('lobby').classList.add('hidden');
    $('hud').classList.remove('hidden');
    setRoomInfo();
    say(isPublic ? 'Welcome to the public server!' : `Private server created! Share code ${roomCode}`, 4);
    saveProfile(); updateHud();
  } else if (m.t === 'state') {
    const seen = new Set();
    for (const p of m.players) {
      if (p.id === myId) { me.hp = p.hp; me.age = p.ag; me.food = p.fd; continue; }
      seen.add(p.id);
      const o = others.get(p.id);
      if (o) Object.assign(o, { tx: p.x, ty: p.y, a: p.a, j: p.j, r: p.r, f: p.f, h: p.h, dv: p.dv, fl: p.fl, cl: p.cl, al: p.al, m: p.m, an: p.an, n: p.n, hp: p.hp, ag: p.ag });
      else others.set(p.id, { ...p, tx: p.x, ty: p.y });
    }
    for (const id of [...others.keys()]) if (!seen.has(id)) others.delete(id);
    const cs = new Set();
    for (const [id, x, y, k, a] of m.critters) {
      cs.add(id);
      const c = critters.get(id);
      if (c) { c.tx = x; c.ty = y; c.a = a; } else critters.set(id, { id, x, y, tx: x, ty: y, k: k ? 'fish' : 'prey', a });
    }
    for (const id of [...critters.keys()]) if (!cs.has(id)) critters.delete(id);
  } else if (m.t === 'left') others.delete(m.id);
  else if (m.t === 'leafGone') { leaves.delete(m.id); pending.delete(m.id); }
  else if (m.t === 'leafNew') leaves.set(m.leaf.id, m.leaf);
  else if (m.t === 'fruit') fruit[m.i] = m.n;
  else if (m.t === 'mush') { if (mush[m.c]) mush[m.c][m.i] = m.n; }
  else if (m.t === 'loc') {
    me.loc = m.loc; me.x = m.x; me.y = m.y; me.lunge = null; me.dive = false; me.climb = null; me.swing = null; me.abTime = 0; me.flash = 0.5; if (m.loc >= 0 && caveDefs[m.loc].flooded) me.fly = false;
    others.clear(); critters.clear(); pending.clear();
    setRoomInfo();
    say(m.loc < 0 ? '☀️ Back on the surface' : caveDefs[m.loc].flooded ? '🌊 Flooded cave! Your breath drains — find the 💨 air pockets' : '🕳️ You entered the caves — press N for night vision', 3.5);
  }
  else if (m.t === 'died') {
    me.loc = -1; setRoomInfo(); me.x = m.x; me.y = m.y; me.age = 0; me.hp = m.hp; me.food = 70; me.lunge = null; me.dive = false; me.fly = false; me.climb = null; me.swing = null; me.alt = 0; me.lastStage = 0;
    say(`💀 ${m.by === 'starvation' ? 'You starved' : m.by === 'the cold' ? 'You froze' : m.by === 'the heat' ? 'You burned' : m.by === 'lava' ? 'You fell in lava' : m.by + ' got you'}! Back to Pup (lost half your leaves)`, 4); saveProfile();
  } else if (m.t === 'killed') say(`🏆 You took down ${m.name}! +10 leaves`, 3);
  else if (m.t === 'inv') { me.leaves = m.leaves; me.owned = m.owned; if (m.animal !== me.animal) { me.fly = false; me.alt = 0; me.flyAltT = 80; me.climb = null; me.swing = null; me.lunge = null; } me.animal = m.animal; saveProfile(); renderShop(); updateHud(); }
}

// ===================== Input =====================
const inPondNow = () => me.loc < 0 && ponds.some((p) => Math.hypot(p.x - me.x, p.y - me.y) < p.r);

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase();
  if (k === 'h') { e.preventDefault(); if (!e.repeat) setMenu(!me.menu); return; }
  if (k === 'escape' && me.menu) { setMenu(false); return; }
  if (k === 'v' && playing && !e.repeat) { setView(!view3d); return; }
  if (!playing || me.menu) return;
  if (['w', 'a', 's', 'd', ' ', 'f', 'r', 't', 'n', 'e', 'c', 'q', 'z', 'shift'].includes(k)) e.preventDefault();
  if (e.repeat) return;
  keys[k] = true;
  if (k === ' ') doJumpOrDive();
  if (k === 'f') doAbility();
  if (k === 't') doSmell();
  if (k === 'e') doEat();
  if (k === 'c') doClimb();
  if (k === 'n') { me.nightVision = !me.nightVision; say(me.nightVision ? '🟢 Night vision ON' : 'Night vision OFF', 1.2); }
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

function doJumpOrDive() {
  const rule = RULES[me.animal];
  if (me.loc >= 0 && caveDefs[me.loc].flooded) return;
  if (me.climb) return;
  if (rule.flies) { // birds and bats: Space takes off / lands
    if (me.fly) { me.fly = false; say('Landed', 1); }
    else { me.fly = true; me.dive = false; me.flyAltT = ANIMALS[me.animal].flyAlt || 80; const mx = RULES[me.animal].flyMax; say(`🕊️ Flying! Q/Z = up/down${mx >= 3000 ? ' — no height limit!' : ' (max ' + mx + ')'} · Space = land`, 3); }

    return;
  }
  if (rule.aquatic && inPondNow()) {
    if (me.dive) { me.dive = false; me.flash = 0.45; say('Surfaced', 1); }
    else if (me.energy >= 10) { me.dive = true; me.flash = 0.45; say('🌊 Diving! (Space to surface)', 1.5); }
    else say('Too tired to dive!', 1);
    return;
  }
  if (me.jump > 0 || me.resting) return;
  if (me.energy < 8) return say('Too tired to jump!', 1);
  me.energy -= 8; me.jump = 0.0001;
}

// ---- climbing and swinging (squirrel, monkey, cats, bears...) ----
function nearestTree() {
  let bi = -1, bd = 1e9;
  obstacles.forEach((o, i) => { if (!Shared.CLIMB_H[o.type]) return; const d = Math.hypot(o.x - me.x, o.y - me.y); if (d < o.r + 45 && d < bd) { bd = d; bi = i; } });
  return bi;
}
function doClimb() {
  const rule = RULES[me.animal];
  if (!rule.climbs || me.loc >= 0 || me.fly || me.dive || me.swing) return;
  if (me.climb) { // climb down next to the trunk
    const o = obstacles[me.climb.idx], a = me.angle; me.climb = null; me.alt = Math.max(me.alt, 10);
    me.x = o.x + Math.cos(a) * (o.r + 26); me.y = o.y + Math.sin(a) * (o.r + 26); say('Climbed down', 1); return;
  }
  const bi = nearestTree();
  if (bi < 0) return say('No tree nearby to climb', 1);
  if (me.energy < 12) return say('Too tired to climb!', 1);
  me.energy -= 12; me.climb = { idx: bi }; me.x = obstacles[bi].x; me.y = obstacles[bi].y;
  say('🧗 Up the tree! WASD to swing to another tree, C to climb down', 3.5);
}
function climbStep(dt, dx0, dy0, moving) {
  me.energy = Math.min(100, me.energy + 5 * dt);
  if (me.swing) {
    const sw = me.swing; sw.t += dt / sw.dur; const k = Math.min(1, sw.t), a = obstacles[sw.from], b = obstacles[sw.to];
    me.x = a.x + (b.x - a.x) * k; me.y = a.y + (b.y - a.y) * k; me.angle = Math.atan2(b.y - a.y, b.x - a.x); me.swingLift = Math.sin(k * Math.PI) * 38;
    if (k >= 1) { me.climb = { idx: sw.to }; me.swing = null; me.swingLift = 0; }
    return;
  }
  const o = obstacles[me.climb.idx]; me.x = o.x; me.y = o.y; me.swingLift = 0;
  if (!moving) return;
  const ang = Math.atan2(dy0, dx0); let best = -1, bs = 1e9;
  obstacles.forEach((t, i) => {
    if (i === me.climb.idx || !Shared.CLIMB_H[t.type]) return;
    const d = Math.hypot(t.x - o.x, t.y - o.y); if (d > 320 || d < 40) return;
    const da = Math.abs(Math.atan2(Math.sin(Math.atan2(t.y - o.y, t.x - o.x) - ang), Math.cos(Math.atan2(t.y - o.y, t.x - o.x) - ang))); if (da > 0.9) return;
    const sc = d + da * 120; if (sc < bs) { bs = sc; best = i; }
  });
  if (best >= 0 && me.energy >= 10) {
    me.energy -= 10; const dist = Math.hypot(obstacles[best].x - o.x, obstacles[best].y - o.y);
    me.swing = { from: me.climb.idx, to: best, t: 0, dur: 0.3 + dist / 800 }; me.angle = ang; say('🐒 Swing!', 0.6);
  }
}

function edibleCritter(c, rule) { return rule.diet.includes(c.k); }

function doAbility() {
  const a = ANIMALS[me.animal].ab, rule = RULES[me.animal];
  if (me.abCd > 0 || me.abTime > 0 || me.dive || me.climb) return;
  if (me.energy < a.cost) return say('Not enough stamina!', 1);
  if (a.special === 'lunge') {
    let best = null, bd = a.range + (me.fly ? me.alt * 1.3 : 0), kind = null;
    for (const [id, o] of others) {
      if (o.h || (o.fl && !me.fly) || (o.cl && !me.fly)) continue;
      const d = Math.hypot(o.x - me.x, o.y - me.y);
      if (d < bd) { bd = d; best = id; kind = 'player'; }
    }
    for (const [id, c] of critters) {
      if (!edibleCritter(c, rule)) continue;
      const d = Math.hypot(c.x - me.x, c.y - me.y);
      if (d < bd) { bd = d; best = id; kind = 'critter'; }
    }
    const tg = best && (kind === 'player' ? others.get(best) : critters.get(best));
    me.lunge = { id: best, kind, dir: tg ? Math.atan2(tg.y - me.y, tg.x - me.x) : me.angle, hit: false };
    if (tg) me.angle = me.lunge.dir;
    if (tg && me.fly && me.alt > 40) { // DIVE BOMB from altitude
      const dist = Math.hypot(tg.x - me.x, tg.y - me.y), sp = a.speed + me.alt * 0.5;
      Object.assign(me.lunge, { bomb: true, speed: sp, alt0: me.alt, dur: Math.max(a.dur, dist / sp + 0.2, Math.min(2.4, me.alt / 1500)) });
      me.flyAltT = 25; say(`💥 ${a.name} — DIVE BOMB! (${Math.round(me.alt)} up)`, 1.5);
    } else say(tg ? `${a.name}!` : `${a.name}! (nothing in range)`, 1);
  } else say(`${a.name}!`, 1);
  me.energy -= a.cost; me.abTime = (me.lunge && me.lunge.dur) || a.dur; me.abCd = a.cd;
}

function doSmell() {
  if (me.smellCd > 0) return;
  if (me.energy < 10) return say('Not enough stamina!', 1);
  me.energy -= 10; me.smellTime = 4; me.smellCd = 6;
  say('👃 Sniffing the air…', 1.5);
}

function doEat() {
  const t = me.eatTarget, now = performance.now();
  if (me.door) { // a cave door takes priority over food
    if (now >= me.eatCd) { me.eatCd = now + 700; send(me.door.kind === 'enter' ? { t: 'enter', i: me.door.i } : { t: 'leave', end: me.door.end }); }
    return;
  }
  if (!t || now < me.eatCd) return;
  me.eatCd = now + 350;
  send({ t: 'eat', kind: t.kind, id: t.id });
  say('😋 Nom nom!', 0.8);
}

// ===================== Shop =====================
function renderShop() {
  const el = $('shop');
  el.innerHTML = '';
  $('menuLeaves').textContent = `🍃 ${me.leaves}`;
  for (const key of Object.keys(ANIMALS).sort((x, y) => RULES[x].price - RULES[y].price)) {
    const a = ANIMALS[key], r = RULES[key], own = me.owned.includes(key), cost = r.price;
    const tag = (r.flies ? '🕊️ flyer · ' : '') + (r.climbs ? '🧗 climber · ' : '') + (r.aquatic ? '🌊 water animal' : r.hides ? '🌿 plant eater' : '🍖 predator');
    const div = document.createElement('div');
    div.className = 'item' + (me.animal === key ? ' active' : '');
    div.innerHTML = `<div>${a.emoji} <b>${a.label}</b> <span class="stageTag">${tag}</span><small>${a.desc}</small></div>`;
    const btn = document.createElement('button');
    if (own) { btn.textContent = me.animal === key ? 'Using' : 'Use'; btn.disabled = me.animal === key; btn.onclick = () => chooseAnimal(key); }
    else { btn.textContent = `🍃 ${cost}`; btn.disabled = me.leaves < cost; btn.onclick = () => buyAnimal(key, cost); }
    div.appendChild(btn); el.appendChild(div);
  }
}
function buyAnimal(key, cost) {
  if (playing) return send({ t: 'buy', animal: key });
  if (me.leaves < cost || me.owned.includes(key)) return;
  me.leaves -= cost; me.owned.push(key); me.animal = key; saveProfile(); renderShop(); refreshPlayingAs();
}
function chooseAnimal(key) {
  if (playing) return send({ t: 'select', animal: key });
  me.animal = key; saveProfile(); renderShop(); refreshPlayingAs();
}
function updateHud() {
  $('leafCount').textContent = `🍃 ${me.leaves}`;
  if (me.menu) $('menuLeaves').textContent = `🍃 ${me.leaves}`;
}

// ===================== Time of day =====================
const DAY_LEN = 150000;
function darkness() {
  const t = (((performance.now() - clock0) % DAY_LEN) / DAY_LEN);
  if (t < 0.5) return 0;
  if (t < 0.6) return (t - 0.5) / 0.1;
  if (t < 0.9) return 1;
  return 1 - (t - 0.9) / 0.1;
}

// ===================== Update =====================
let last = performance.now(), sendTimer = 0, ageSave = 0;
function update(dt) {
  const def = ANIMALS[me.animal], rule = RULES[me.animal];
  const stage = stageOf(me.age), scale = scaleOf(me.age);

  if (me.lastStage !== undefined && stage > me.lastStage) { say(`🎉 You grew into a ${STAGES[stage]}!`, 3.5); me.growFx = 2; }
  me.lastStage = stage;
  me.growFx = Math.max(0, me.growFx - dt);
  me.flash = Math.max(0, me.flash - dt);

  me.abCd = Math.max(0, me.abCd - dt);
  me.smellCd = Math.max(0, me.smellCd - dt);
  me.smellTime = Math.max(0, me.smellTime - dt);
  me.abTime = Math.max(0, me.abTime - dt);
  if (me.jump > 0) { me.jump += dt; if (me.jump > 0.55) me.jump = 0; }
  if (me.abTime <= 0) me.lunge = null;
  ageSave += dt; if (ageSave > 5) { ageSave = 0; saveProfile(); }

  const inWater = inPondNow();
  const flooded = me.loc >= 0 && caveDefs[me.loc].flooded;
  const bio = me.loc < 0 ? biomeAt(biomes, me.x, me.y) : 'cave';
  const tol = me.fly || Shared.tolerates(bio, me.animal);
  if (bio !== me.biome) {
    const prev = me.biome; me.biome = bio;
    const bi = BIOME_INFO[bio];
    if (prev && prev !== 'cave' && bio !== 'cave') say(`${bi.emoji} ${bi.name}` + (bi.hazard && !tol ? ` — ${bi.hazard}` : bi.note ? ` — ${bi.note}` : ''), 3.5);
  }
  me.swimming = inWater && me.jump === 0 && !me.fly && !me.climb;
  if (me.dive && !(rule.aquatic && inWater)) me.dive = false;
  if (me.fly && flooded) me.fly = false;

  let dx0 = (keys['d'] ? 1 : 0) - (keys['a'] ? 1 : 0), dy0 = (keys['s'] ? 1 : 0) - (keys['w'] ? 1 : 0);
  const moving = !!(dx0 || dy0);
  const render3d = view3d && has3d();
  if (render3d) { // WASD is relative to where the camera looks
    if (keys['arrowleft']) V3.yaw -= dt * 2.2;
    if (keys['arrowright']) V3.yaw += dt * 2.2;
    if (keys['arrowup']) V3.pitch = Math.max(0.12, V3.pitch - dt * 1.2);
    if (keys['arrowdown']) V3.pitch = Math.min(1.35, V3.pitch + dt * 1.2);
    if (moving) { const fw = -dy0, fx = Math.cos(V3.yaw), fy = Math.sin(V3.yaw); const nx = fx * fw - fy * dx0, ny = fy * fw + fx * dx0; dx0 = nx; dy0 = ny; }
  }
  me.moving = (moving && !me.lunge && !me.climb) || !!me.swing;
  me.resting = !!keys['r'] && !moving && me.jump === 0 && !me.swimming && !me.fly;
  me.sprinting = false;
  if (me.exhausted && me.energy >= 20) me.exhausted = false;

  const px0 = me.x, py0 = me.y;
  if (me.climb) {
    climbStep(dt, dx0, dy0, moving);
  } else if (me.lunge) {
    const L = me.lunge, tg = L.id && (L.kind === 'player' ? others.get(L.id) : critters.get(L.id));
    if (tg) L.dir = Math.atan2(tg.y - me.y, tg.x - me.x);
    const lsp = L.speed || def.ab.speed, over = L.bomb && tg && Math.hypot(tg.x - me.x, tg.y - me.y) < 22; // a bomber hovers right above its target while it drops
    if (!over) { me.x += Math.cos(L.dir) * lsp * dt; me.y += Math.sin(L.dir) * lsp * dt; } me.angle = L.dir;
    if (tg && !L.hit && Math.hypot(tg.x - me.x, tg.y - me.y) < 55 + def.size && (!L.bomb || me.alt < 70)) {
      L.hit = true;
      send(L.kind === 'player' ? { t: 'hit', id: L.id } : { t: 'eat', kind: 'critter', id: L.id });
      me.abTime = Math.min(me.abTime, 0.08);
    }
  } else if (me.resting) {
    me.energy = Math.min(100, me.energy + 32 * dt);
  } else {
    if (moving) {
      const len = Math.hypot(dx0, dy0), dx = dx0 / len, dy = dy0 / len;
      let sp = def.speed * STAGE_SPEED[stage] * (me.loc < 0 && !me.dive ? SURFACE_SPEED : 1);
      if (me.abTime > 0) sp *= def.ab.mul || 1;
      if (me.swimming) sp *= rule.aquatic ? 1.3 : 0.55; else if (rule.aquatic) sp *= 0.85;
      if (me.dive) sp *= 1.1;
      if (me.fly) sp *= 1.35;
      if (bio === 'savanna') sp *= 1.08;
      if (bio === 'swamp' && !tol && !me.swimming) sp *= 0.75;
      if (bio === 'snow' && !tol) sp *= 0.85;
      if (flooded) sp *= (rule.aquatic ? 1.3 : 0.6) * (me.energy <= 0 ? 0.4 : 1);
      if (keys['shift'] && !me.exhausted && me.energy > 0 && !me.dive) { me.sprinting = true; sp *= 1.6; }
      if (me.swimming && !rule.aquatic && me.energy <= 0) sp *= 0.5;
      me.x += dx * sp * dt; me.y += dy * sp * dt;
      me.angle = Math.atan2(dy, dx);
    }
    const tiredSwim = me.swimming && !rule.aquatic;
    if (me.sprinting) me.energy -= 14 * (bio === 'mountain' && !tol ? 1.5 : 1) * dt;
    if (tiredSwim) me.energy -= 6 * dt;
    if (me.dive) me.energy -= 5 * dt;
    /* flying is free: no energy drain */
    if (flooded) {
      if (caveDefs[me.loc].air.some((a) => Math.hypot(a.x - me.x, a.y - me.y) < a.r)) me.energy += 25 * dt;
      else me.energy -= 3 * dt;
    }
    if (!me.sprinting && !tiredSwim && !me.dive && !flooded && !me.fly) me.energy += (moving ? 4 : 9) * (bio === 'desert' && !tol ? 0.5 : 1) * (bio === 'mountain' && !tol ? 0.6 : 1) * dt;
    if (me.energy <= 0) {
      me.energy = 0;
      if (me.sprinting) { me.exhausted = true; say('😮‍💨 Exhausted! Catch your breath', 1.5); }
      if (me.dive) { me.dive = false; say('Out of breath!', 1.5); }
      if (me.fly) { me.fly = false; say('Out of energy — landing!', 1.5); }
    }
    me.energy = Math.min(100, me.energy);
  }

  // collisions
  const pr = def.size * scale * 0.8, airborne = me.jump > 0.08 && me.jump < 0.47;
  for (const o of (me.loc < 0 && !me.climb && !me.fly) ? obstacles : []) {
    if (o.type === 'rock' && airborne) continue;
    const d = Math.hypot(me.x - o.x, me.y - o.y), min = o.r + pr;
    if (d < min && d > 0.01) { me.x = o.x + ((me.x - o.x) / d) * min; me.y = o.y + ((me.y - o.y) / d) * min; }
  }
  me.x = Math.max(10, Math.min(WORLD - 10, me.x));
  me.y = Math.max(10, Math.min(WORLD - 10, me.y));
  if (me.loc >= 0) { // cave walls
    const cv = caveDefs[me.loc];
    if (!caveWalkable(cv, me.x, me.y)) {
      if (caveWalkable(cv, me.x, py0)) me.y = py0;
      else if (caveWalkable(cv, px0, me.y)) me.x = px0;
      else { me.x = px0; me.y = py0; }
    }
  }

  // hiding: plant eaters in bushes, water animals while diving
  me.hidden = (me.loc < 0 && !me.fly && !me.climb && !!rule.hides && bushes.some((b) => Math.hypot(b.x - me.x, b.y - me.y) < b.r * 0.85)) || me.dive;

  // leaf pickup
  for (const l of leaves.values()) {
    if (l.c !== me.loc) continue;
    const d = Math.hypot(l.x - me.x, l.y - me.y);
    if (!pending.has(l.id) && d < 42 && !me.dive) { pending.add(l.id); send({ t: 'collect', id: l.id }); }
  }

  // edible things nearby
  let tgt = null, best = 1e9;
  for (const c of critters.values()) {
    if (!edibleCritter(c, rule)) continue;
    const d = Math.hypot(c.x - me.x, c.y - me.y);
    if (d < 60 && d < best) { best = d; tgt = { kind: 'critter', id: c.id, icon: FOOD_ICON[c.k] }; }
  }
  if (!tgt && rule.diet.includes('fruit') && !me.dive && !me.climb) {
    if (me.loc < 0) {
      bushes.forEach((b, i) => {
        const d = Math.hypot(b.x - me.x, b.y - me.y);
        if (fruit[i] > 0 && d < b.r + 25 && d < best) { best = d; tgt = { kind: 'bush', id: i, icon: FOOD_ICON.fruit }; }
      });
    } else {
      caveDefs[me.loc].mush.forEach((m, i) => {
        const d = Math.hypot(m.x - me.x, m.y - me.y);
        if (mush[me.loc] && mush[me.loc][i] > 0 && d < 60 && d < best) { best = d; tgt = { kind: 'mush', id: i, icon: '🍄' }; }
      });
    }
  }
  me.eatTarget = tgt;
  me.door = null;
  me.treeNear = (rule.climbs && me.loc < 0 && !me.fly && !me.climb && !me.dive) ? nearestTree() : -1;
  if (me.fly || me.climb) { /* no cave doors in the air or up a tree */ } else if (me.loc < 0) entrances.forEach((e, i) => { if (e.water ? !me.dive : me.dive) return; if (Math.hypot(e.x - me.x, e.y - me.y) < 90) me.door = { kind: 'enter', i, water: !!e.water }; });
  else caveDefs[me.loc].exits.forEach((ex, end) => { if (Math.hypot(ex.x - me.x, ex.y - me.y) < 100) me.door = { kind: 'leave', end }; });

  // smoothing of others and critters
  for (const o of others.values()) {
    o.x += (o.tx - o.x) * Math.min(1, dt * 12); o.y += (o.ty - o.y) * Math.min(1, dt * 12);
    const ot = o.fl ? (o.al || (ANIMALS[o.an] && ANIMALS[o.an].flyAlt) || 95) : o.cl ? 62 : 0; o.alt = (o.alt || 0) + (ot - (o.alt || 0)) * Math.min(1, dt * 6);
  }
  { // my own altitude (flying / up a tree)
    if (me.fly && !rule.flies) { me.fly = false; me.alt = 0; } // safety: only flyers can be airborne
    const ctype = me.climb && obstacles[me.climb.idx] ? obstacles[me.climb.idx].type : null;
    if (me.fly && !(me.lunge && me.lunge.bomb)) { // Q climbs, Z descends (limit depends on the animal)
      const mx = rule.flyMax || 100, rate = 110 + mx * 0.06;
      if (keys['q']) { me.flyAltT = Math.min(mx, me.flyAltT + rate * dt); }
      if (keys['z']) me.flyAltT = Math.max(25, me.flyAltT - rate * 1.5 * dt);
      me.flyAltT = Math.min(me.flyAltT, mx);
    }
    const altT = me.fly ? me.flyAltT : me.climb ? (Shared.CLIMB_H[ctype] || 60) + (me.swingLift || 0) : 0;
    if (me.lunge && me.lunge.bomb) me.alt = Math.max(0, me.alt - (me.lunge.alt0 / me.lunge.dur) * dt * 1.1); // plunge onto the target
    else me.alt += (altT - me.alt) * Math.min(1, dt * (me.fly ? 4 : 6));
  }
  for (const c of critters.values()) { c.x += (c.tx - c.x) * Math.min(1, dt * 12); c.y += (c.ty - c.y) * Math.min(1, dt * 12); }

  // network
  sendTimer += dt;
  if (sendTimer > 0.05) {
    sendTimer = 0;
    send({ t: 'move', x: me.x, y: me.y, a: me.angle, j: me.jump > 0, r: me.resting, m: me.moving || !!me.lunge,
           f: me.abTime > 0 && !!def.ab.stealth, h: me.hidden, dv: me.dive, fl: me.fly, cl: !!me.climb, al: me.fly ? Math.round(me.alt) : 0 });
  }

  // starvation warning
  if (me.food <= 0 && !me.starving) { me.starving = true; say('⚠️ Starving! Find food — you are losing health', 3); }
  if (me.food > 10) me.starving = false;

  // HUD
  const mhp = STAGE_HP[stage];
  $('hp').style.width = Math.max(0, Math.min(100, (me.hp / mhp) * 100)) + '%';
  $('hpTxt').textContent = `Health ${Math.ceil(me.hp)}/${mhp}`;
  $('energy').style.width = me.energy + '%';
  $('stamTxt').textContent = me.exhausted ? 'Stamina — exhausted!' : me.dive ? 'Stamina (breath)' : 'Stamina';
  $('food').style.width = Math.max(0, me.food) + '%';
  $('foodTxt').textContent = `Hunger ${Math.ceil(me.food)}%`;
  $('food').classList.toggle('low', me.food < 25);
  const from = STAGE_AT[stage], to = STAGE_AT[stage + 1];
  $('age').style.width = (to ? ((me.age - from) / (to - from)) * 100 : 100) + '%';
  $('ageTxt').textContent = `Age: ${STAGES[stage]}` + (to ? ` → ${STAGES[stage + 1]} in ${Math.ceil(to - me.age)}s` : ' (fully grown)');
  { const bi = BIOME_INFO[bio], el = $('biomeInfo');
    if (!bi) el.textContent = '';
    else { const bad = !!bi.hazard && !tol; el.textContent = `${bi.emoji} ${bi.name}` + (bad ? ` — ${bi.hazard}` : tol && bi.hazard ? ' — you are adapted' : bi.note ? ` — ${bi.note}` : ''); el.className = bad ? 'warn' : ''; } }
  $('kF').textContent = `F ${def.ab.name}` + (me.abCd > 0 ? ` (${Math.ceil(me.abCd)}s)` : '');
  $('kF').className = me.abTime > 0 ? 'on' : me.abCd > 0 ? 'cool' : '';
  $('kS').className = me.sprinting ? 'on' : me.exhausted ? 'cool' : '';
  $('kE').className = me.eatTarget || me.door ? 'on' : '';
  $('kR').className = me.resting ? 'on' : '';
  $('kT').textContent = 'T Smell' + (me.smellCd > 0 ? ` (${Math.ceil(me.smellCd)}s)` : '');
  $('kT').className = me.smellTime > 0 ? 'on' : me.smellCd > 0 ? 'cool' : '';
  $('kN').className = me.nightVision ? 'on' : '';
  $('kSp').textContent = rule.flies ? (me.fly ? 'Space Land' : 'Space Fly') : rule.aquatic && inWater ? (me.dive ? 'Space Surface' : 'Space Dive') : 'Space Jump';
  { const kq = $('kQ'); kq.style.display = rule.flies && me.fly ? '' : 'none'; kq.className = keys['q'] || keys['z'] ? 'on' : ''; kq.textContent = `Q▲ Z▼  Alt ${Math.round(me.alt)}` + (rule.flyMax >= 3000 ? '' : me.alt >= rule.flyMax - 2 ? ' (max)' : ''); }
  { const kc = $('kC'); kc.style.display = rule.climbs ? '' : 'none'; kc.className = me.climb ? 'on' : me.treeNear >= 0 ? 'on' : ''; kc.textContent = me.climb ? 'C Climb down · WASD swing' : 'C Climb'; }
  if (me.hidden && !me.dive && performance.now() > statusUntil) { statusMsg = '🌿 Hidden in the bushes'; statusUntil = performance.now() + 100; }
  $('status').textContent = performance.now() < statusUntil ? statusMsg : '';
  $('prompt').textContent = me.menu ? '' : me.door ? (me.door.kind === 'enter' ? (me.door.water ? 'Press E to swim into the flooded cave 🌊' : 'Press E to enter the cave 🕳️') : 'Press E to leave the cave ☀️') : me.eatTarget ? `Press E to eat ${me.eatTarget.icon}` : me.climb ? 'WASD: swing to another tree · C: climb down' : me.treeNear >= 0 ? 'Press C to climb the tree 🧗' : '';
  updateHud();
}

// ===================== Drawing =====================
function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
addEventListener('resize', resize); resize();

// ---- drawing helpers (local space: animal faces +x) ----
function E(x, y, rx, ry, col, rot = 0) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, 7); ctx.fill();
}
function TRI(x1, y1, x2, y2, x3, y3, col) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath(); ctx.fill();
}
function LINE(x1, y1, x2, y2, col, w) {
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

// Data-driven looks for the extra animals (see the default case in drawBody)
const SPOTS = [[-.7, -.5], [-.45, .35], [-.2, -.4], [.05, .5], [.3, -.45], [-.6, .1], [.2, .1], [-.1, 0], [.55, .3], [.5, -.2], [-.3, .55], [.7, -.1]];
const SPEC = {
  skunk:   { coat: '#232323', belly: '#333', tail: 'bushy', tip: '#f5f5f5', marks: 'stripe1', markCol: '#f2f2f2', ear: 'round', snout: 0.3, snoutCol: '#2e2e2e', nose: '#d68', eye: '#e8e8e8', head: 0.46 },
  raccoon: { coat: '#7d7a78', belly: '#bdb9b4', leg: '#3a3836', tail: 'bushy', tip: '#2a2a2a', ear: 'round', face: 'mask', snout: 0.4, snoutCol: '#c9c5c0', eye: '#e8e8e8', head: 0.48 },
  turtle:  { coat: '#7aa65a', belly: '#a9c98a', leg: '#6a9150', tail: 'short', shell: '#4f7a3a', ear: 'none', snout: 0.3, snoutCol: '#7aa65a', eye: '#111', head: 0.4, spread: 1.15, legR: 0.38 },
  capybara:{ coat: '#9a7a55', belly: '#c9ad84', leg: '#7a5e40', tail: 'none', ear: 'small', snout: 0.55, snoutW: 0.5, snoutCol: '#a6845c', eye: '#222', head: 0.55 },
  goat:    { coat: '#e8e2d4', belly: '#ffffff', leg: '#cfc7b5', tail: 'short', ear: 'flap', extra: 'horns', face: 'beard', snout: 0.6, snoutCol: '#efe7d6', eye: '#caa23a', head: 0.44 },
  badger:  { coat: '#7a7a7e', belly: '#3a3a3e', leg: '#2a2a2e', tail: 'short', ear: 'small', headCol: '#e8e8e8', face: 'badger', snout: 0.5, snoutCol: '#e0e0e0', eye: '#222', head: 0.5 },
  hyena:   { coat: '#b59a6a', belly: '#d8c49a', leg: '#8a7348', tail: 'short', tip: '#2a2218', marks: 'spots', markCol: '#4a3a22', ridge: '#5a4828', ear: 'round', earBig: true, snout: 0.6, snoutCol: '#3a3022', eye: '#e8c34a', head: 0.52 },
  zebra:   { coat: '#f4f4f4', belly: '#ffffff', leg: '#e0e0e0', tail: 'thin', tip: '#111', marks: 'stripes', markCol: '#141414', ridge: '#111', ear: 'point', snout: 0.95, snoutCol: '#2a2a2a', eye: '#222', head: 0.4 },
  panda:   { coat: '#f6f6f6', belly: '#fff', leg: '#151515', tail: 'short', marks: 'patches', markCol: '#151515', ear: 'round', earCol: '#151515', face: 'panda', snout: 0.35, snoutCol: '#f0f0f0', eye: '#fff', head: 0.58, legR: 0.45 },
  cheetah: { coat: '#e2b560', belly: '#f5e2b0', leg: '#c79a40', tail: 'thin', tip: '#2a2010', marks: 'spots', markCol: '#3a2a10', ear: 'round', face: 'tears', snout: 0.4, snoutCol: '#f1dcaa', nose: '#222', eye: '#d49a22', head: 0.44 },
  tiger:   { coat: '#e07a28', belly: '#fff1dd', leg: '#c8661e', tail: 'thin', tip: '#1a1208', marks: 'stripes', markCol: '#1a1208', ear: 'round', face: 'tigerface', snout: 0.5, snoutCol: '#f4e6d0', nose: '#c97d82', eye: '#e8c34a', head: 0.54 },
  snowleopard: { coat: '#e6e8ec', belly: '#fafafa', leg: '#cfd2d8', tail: 'bushy', tip: '#555a64', marks: 'rosettes', markCol: '#555a64', ear: 'round', snout: 0.4, snoutCol: '#f4f5f7', nose: '#c97d82', eye: '#9fd0ff', head: 0.5 },
  polarbear:{ coat: '#f4f6f8', belly: '#ffffff', leg: '#e8eaee', legR: 0.5, tail: 'stub', ear: 'round', snout: 0.6, snoutCol: '#e8eaee', eye: '#222', head: 0.56 },
  hippo:   { coat: '#8a7d9a', belly: '#b5a8c2', leg: '#6f6380', legR: 0.5, tail: 'stub', ear: 'small', snout: 0.5, snoutW: 0.78, snoutCol: '#a89bb8', eye: '#222', eyeOff: 0.7, head: 0.66 },
  rhino:   { coat: '#8a8d93', belly: '#a9acb2', leg: '#6d7076', legR: 0.5, tail: 'thin', tip: '#4a4d52', ear: 'point', extra: 'horn1', snout: 0.8, snoutCol: '#7d8087', eye: '#222', head: 0.56 },
  marmot:  { coat: '#8a7a62', belly: '#cdb898', leg: '#6a5c48', tail: 'bushy', ear: 'small', snout: 0.35, snoutCol: '#cdb898', eye: '#222', head: 0.5 },
  sheep:   { coat: '#f5f2ea', belly: '#ffffff', leg: '#3a3330', tail: 'short', bumps: '#fbf9f2', ear: 'flap', earCol: '#3a3330', headCol: '#3a3330', snout: 0.45, snoutCol: '#4a4440', eye: '#e0c070', head: 0.42 },
  frog:    { coat: '#4fae4a', belly: '#cfe8a8', leg: '#3d8e3a', spread: 1.35, legR: 0.36, tail: 'none', ear: 'none', face: 'frog', marks: 'spots', markCol: '#2e6e2c', snout: 0.25, snoutW: 0.65, snoutCol: '#58b952', eye: '#4fae4a', head: 0.55 },
  salamander: { coat: '#e8741e', belly: '#f7b878', leg: '#c85e14', spread: 1.2, legR: 0.26, tail: 'long', ear: 'none', marks: 'spots', markCol: '#1a1a1a', snout: 0.3, snoutW: 0.5, snoutCol: '#ee8a3a', eye: '#111', head: 0.5 },
  redpanda:{ coat: '#c4552a', belly: '#2a1e1a', leg: '#2a1e1a', tail: 'bushy', tip: '#7a3a1a', ear: 'point', snout: 0.3, snoutCol: '#f5efe6', eye: '#111', head: 0.5 },
  llama:   { coat: '#f1e8d4', belly: '#ffffff', leg: '#d9cdb0', tail: 'short', ear: 'long', earCol: '#e6d9bb', snout: 0.6, snoutCol: '#e0d2b4', eye: '#2a1e12', head: 0.45 },
  monkey:  { coat: '#8a5a34', belly: '#d8b48a', leg: '#6a4424', tail: 'thin', ear: 'round', earBig: true, earCol: '#d8b48a', headCol: '#e0b48a', snout: 0.3, snoutCol: '#d8a878', eye: '#222', head: 0.5 },
  penguin: { coat: '#1c1f26', belly: '#ffffff', bellyBig: true, leg: '#ff9f1c', legR: 0.2, spread: 0.7, tail: 'stub', extra: 'flippers', hump: '#14161b', ear: 'none', snout: 0.3, snoutW: 0.22, snoutCol: '#ff9f1c', eye: '#ffffff', head: 0.42 },
  camel:   { coat: '#c9a56a', belly: '#e2c690', leg: '#a8844a', tail: 'thin', tip: '#6a4a22', extra: 'humps2', hump: '#b8935a', ear: 'small', snout: 0.7, snoutCol: '#b8935a', eye: '#2a1e12', head: 0.46 },
  yak:     { coat: '#3a2e28', belly: '#2a201c', leg: '#2a201c', tail: 'short', bumps: '#2a201c', horns: true, ear: 'small', snout: 0.5, snoutCol: '#4a3c34', eye: '#e0c070', head: 0.56 },
  horse:   { coat: '#8a5a38', belly: '#a8754c', leg: '#3a2518', tail: 'thin', tailCol: '#2a1c12', tip: '#2a1c12', ridge: '#2a1c12', ear: 'point', snout: 1.0, snoutW: 0.34, snoutCol: '#7a4c2c', eye: '#222', head: 0.42 },
  bison:   { coat: '#4a3526', belly: '#3a2a1e', leg: '#2e2016', legR: 0.46, tail: 'short', tip: '#2a1e14', extra: 'hump1', hump: '#5a4332', ridge: '#2a1e14', horns: true, ear: 'small', snout: 0.5, snoutCol: '#3a2a1e', eye: '#222', head: 0.62 },
  komodo:  { coat: '#6b6a3a', belly: '#9a9660', leg: '#55542c', spread: 1.3, tail: 'long', ear: 'none', marks: 'spots', markCol: '#3e3d1e', snout: 0.8, snoutW: 0.3, snoutCol: '#7b7a44', eye: '#d4a02a', head: 0.42 },
  gorilla: { coat: '#2b2b30', belly: '#3a3a40', leg: '#222226', legR: 0.52, tail: 'none', ear: 'small', earCol: '#222226', headCol: '#303036', snout: 0.3, snoutW: 0.45, snoutCol: '#4a4a52', eye: '#6a4a2a', head: 0.6 },
  sparrow: { bird: true, coat: '#a07a52', belly: '#e8d8bc', wing: '#7a5a3a', beak: '#d8a64a', head: 0.5, tailLen: 0.8 },
  hummingbird: { bird: true, coat: '#2fb36a', belly: '#e8fff0', wing: '#9be7c0', beak: '#222222', throat: '#e0245e', head: 0.45, tailLen: 0.6, longBeak: true },
  parrot: { bird: true, coat: '#e0302a', belly: '#f2c230', wing: '#2a6ee0', beak: '#222222', head: 0.55, tailLen: 1.3 },
  bat: { bird: true, bat: true, coat: '#3b2f46', belly: '#52425e', wing: '#2b2233', beak: '#222222', head: 0.5, tailLen: 0.3, ears: true, eye: '#ff6a6a' },
  owl: { bird: true, coat: '#8a6a48', belly: '#e0cfae', wing: '#6a4a2e', beak: '#e0a030', eye: '#f2c230', head: 0.62, tailLen: 0.7, disc: true },
  eagle: { bird: true, coat: '#5a3b24', belly: '#f1ede4', wing: '#4a2f1c', beak: '#f2b830', head: 0.5, tailLen: 0.9, whiteHead: true },
};

let bodyFly = false;
function drawBird(sp, s, L, B, stage, hs) {
  const t = performance.now() / 1000, flap = bodyFly ? Math.sin(t * (sp.bat ? 16 : 22)) : 0.2, span = bodyFly ? 1 : 0.5, pe = stage === 0 ? 1.4 : 1;
  TRI(-L * 0.9, -s * 0.28, -L - s * (sp.tailLen || 0.8), 0, -L * 0.9, s * 0.28, sp.wing);
  for (const sd of [-1, 1]) {
    const k = 0.8 + 0.2 * flap;
    if (sp.bat) TRI(L * 0.3, sd * B * 0.5, -L * 0.9, sd * s * 2.3 * span * k, -L * 0.7, sd * B * 0.6, sp.wing);
    else E(-L * 0.05, sd * (B * 0.6 + s * 1.15 * span * k), s * 0.62, s * 1.25 * span * k + B * 0.2, sp.wing);
  }
  E(0, 0, L, B, sp.coat); E(L * 0.15, 0, L * 0.65, B * 0.55, sp.belly);
  const H = s * (sp.head || 0.5) * hs, hx = L * 0.95;
  if (sp.ears) for (const sd of [-1, 1]) TRI(hx - H * 0.3, sd * H * 0.5, hx - H * 0.1, sd * H * 1.5, hx + H * 0.3, sd * H * 0.6, sp.coat);
  E(hx, 0, H, H * 0.9, sp.whiteHead ? '#f4f1ea' : sp.coat);
  if (sp.disc) E(hx + H * 0.3, 0, H * 0.7, H * 0.85, '#efe3c8');
  if (sp.throat) E(hx + H * 0.2, 0, H * 0.4, H * 0.3, sp.throat);
  TRI(hx + H * 0.7, -H * 0.22, hx + H * (sp.longBeak ? 2.2 : 1.25), 0, hx + H * 0.7, H * 0.22, sp.beak);
  for (const sd of [-1, 1]) { E(hx + H * 0.35, sd * H * 0.42, H * 0.2 * pe, H * 0.2 * pe, sp.eye || '#ffffff'); E(hx + H * 0.4, sd * H * 0.42, H * 0.1 * pe, H * 0.1 * pe, '#111111'); }
}

function drawBody(key, s, L, B, stage, phase, hs) {
  const swing = Math.sin(phase) * s * 0.4;
  const pe = stage === 0 ? 1.4 : 1; // pups have big eyes
  const legs = (col, spread, r) => {
    for (let i = 0; i < 4; i++) {
      const fx = i < 2 ? L * 0.6 : -L * 0.6, sd = i % 2 ? 1 : -1, sw = (i === 1 || i === 2 ? 1 : -1) * swing;
      E(fx + sw, sd * B * spread, s * r, s * r * 0.55, col);
    }
  };
  const eyes = (hx, H, col, off = 0.42) => {
    for (const sd of [-1, 1]) {
      E(hx + H * 0.35, sd * H * off, H * 0.2 * pe, H * 0.2 * pe, col);
      E(hx + H * 0.4, sd * H * off, H * 0.11 * pe, H * 0.11 * pe, '#111');
    }
  };
  let hx = L * 0.95, H = s * 0.5 * hs, snoutEnd = 0;

  switch (key) {
    case 'wolf': {
      legs('#575b63', 0.95, 0.36);
      E(-L - s * 0.45, 0, s * 0.7, s * 0.26, '#80858e'); E(-L - s * 0.95, 0, s * 0.28, s * 0.2, '#33363c');
      E(0, 0, L, B, '#80858e'); E(-L * 0.1, 0, L * 0.75, B * 0.55, '#5c6068'); E(L * 0.15, 0, L * 0.6, B * 0.32, '#d3d6db');
      E(L * 0.7, 0, s * 0.55, B * 0.8, '#8d929b');
      H = s * 0.52 * hs;
      for (const sd of [-1, 1]) TRI(hx - H * 0.3, sd * H * 0.5, hx - H * 0.15, sd * H * 1.25, hx + H * 0.35, sd * H * 0.6, '#4a4d54');
      E(hx, 0, H, H * 0.92, '#8d929b');
      E(hx + H * 0.95, 0, H * 0.8, H * 0.4, '#c3c7cd'); E(hx + H * 1.65, 0, H * 0.17, H * 0.14, '#111');
      eyes(hx, H, '#f2c230'); snoutEnd = hx + H * 1.7; break;
    }
    case 'deer': {
      legs('#6e4a2a', 0.8, 0.28);
      E(-L - s * 0.05, 0, s * 0.3, s * 0.27, '#ffffff');
      E(0, 0, L, B, '#a8743f'); E(L * 0.05, 0, L * 0.75, B * 0.4, '#f1e0c4');
      if (stage <= 1) for (let i = 0; i < 9; i++) E(-L * 0.7 + (i % 5) * L * 0.33, (i < 5 ? -1 : 1) * B * 0.5, s * 0.1, s * 0.1, '#fff3d9');
      E(L * 0.95, 0, s * 0.55, s * 0.26, '#a8743f'); // neck
      hx = L + s * 0.6; H = s * 0.38 * hs;
      for (const sd of [-1, 1]) { E(hx - H * 0.4, sd * H * 1.2, H * 0.9, H * 0.38, '#a8743f', sd * 0.6); E(hx - H * 0.4, sd * H * 1.2, H * 0.55, H * 0.2, '#e9b9a0', sd * 0.6); }
      if (stage >= 2) {
        const k = stage === 3 ? 1.25 : 1;
        for (const sd of [-1, 1]) {
          LINE(hx - H * 0.3, sd * H * 0.5, hx - H * 0.9, sd * H * 2.2 * k, '#e8dcc0', 3);
          LINE(hx - H * 0.55, sd * H * 1.2 * k, hx + H * 0.4, sd * H * 1.8 * k, '#e8dcc0', 2.5);
          LINE(hx - H * 0.8, sd * H * 1.9 * k, hx - H * 1.6, sd * H * 2.3 * k, '#e8dcc0', 2.5);
        }
      }
      E(hx, 0, H, H * 0.85, '#b5814a');
      E(hx + H * 0.95, 0, H * 0.85, H * 0.42, '#d8b88e'); E(hx + H * 1.7, 0, H * 0.2, H * 0.16, '#222');
      eyes(hx, H, '#3a2412'); snoutEnd = hx + H * 1.8; break;
    }
    case 'rabbit': {
      legs('#cfc3b1', 0.9, 0.28);
      E(-L * 0.5, 0, s * 0.55, B * 1.0, '#d3c7b4'); // haunch
      E(-L - s * 0.25, 0, s * 0.28, s * 0.28, '#ffffff');
      E(0, 0, L, B, '#d8cdbd'); E(L * 0.3, 0, L * 0.5, B * 0.5, '#fbf6ee');
      hx = L * 0.85; H = s * 0.5 * hs;
      for (const sd of [-1, 1]) { E(hx - H * 0.2, sd * H * 0.5, H * 1.25, H * 0.3, '#d8cdbd', sd * 0.25); E(hx - H * 0.2, sd * H * 0.5, H * 0.9, H * 0.15, '#f0b7b7', sd * 0.25); }
      E(hx, 0, H, H * 0.9, '#e1d6c6'); E(hx + H * 0.75, 0, H * 0.45, H * 0.35, '#faf4ea'); E(hx + H * 1.1, 0, H * 0.14, H * 0.11, '#e58b9a');
      for (const sd of [-1, 1]) LINE(hx + H * 0.9, sd * H * 0.2, hx + H * 1.3, sd * H * 0.5, 'rgba(60,50,40,.5)', 1);
      eyes(hx, H, '#222', 0.5); snoutEnd = hx + H * 1.2; break;
    }
    case 'fox': {
      legs('#26211f', 0.85, 0.3);
      E(-L - s * 0.7, 0, s * 0.95, s * 0.3, '#e0702a'); E(-L - s * 1.5, 0, s * 0.4, s * 0.25, '#ffffff');
      E(0, 0, L, B, '#e0702a'); E(L * 0.5, 0, L * 0.45, B * 0.55, '#fff2df');
      hx = L * 0.95; H = s * 0.46 * hs;
      for (const sd of [-1, 1]) { TRI(hx - H * 0.4, sd * H * 0.4, hx - H * 0.1, sd * H * 1.5, hx + H * 0.3, sd * H * 0.6, '#e0702a'); TRI(hx - H * 0.2, sd * H * 0.95, hx - H * 0.1, sd * H * 1.5, hx + H * 0.1, sd * H * 1.0, '#222'); }
      E(hx, 0, H, H * 0.9, '#e87a30'); E(hx + H * 0.15, 0, H * 0.8, H * 0.8, '#e87a30');
      E(hx + H * 0.3, 0, H * 0.75, H * 0.95, '#fff2df');
      E(hx + H * 0.1, 0, H * 0.75, H * 0.6, '#e87a30');
      E(hx + H * 1.0, 0, H * 0.85, H * 0.32, '#f6c79a'); E(hx + H * 1.8, 0, H * 0.16, H * 0.13, '#111');
      eyes(hx, H, '#f0c040'); snoutEnd = hx + H * 1.9; break;
    }
    case 'lynx': {
      legs('#b79458', 0.95, 0.38);
      E(-L - s * 0.3, 0, s * 0.4, s * 0.21, '#c9a56e'); E(-L - s * 0.58, 0, s * 0.17, s * 0.19, '#1c1c1c');
      E(0, 0, L, B, '#c9a56e'); E(L * 0.1, 0, L * 0.65, B * 0.4, '#efe2c6');
      const spots = [[-.7,-.5],[-.45,.35],[-.2,-.4],[.05,.5],[.3,-.45],[-.6,.1],[.2,.1],[-.1,0],[.55,.3],[.5,-.2]];
      for (const [px, py] of spots) E(L * px, B * py, s * 0.1, s * 0.09, '#5a4326');
      hx = L * 0.92; H = s * 0.5 * hs;
      for (const sd of [-1, 1]) {
        TRI(hx - H * 0.3, sd * H * 0.45, hx - H * 0.05, sd * H * 1.2, hx + H * 0.35, sd * H * 0.6, '#c9a56e');
        LINE(hx - H * 0.05, sd * H * 1.2, hx - H * 0.2, sd * H * 1.75, '#111', 2.5); // ear tufts
        E(hx - H * 0.1, sd * H * 0.95, H * 0.55, H * 0.45, '#f1e8d6'); // cheek ruff
      }
      E(hx, 0, H, H * 0.9, '#d1ad76');
      for (const sd of [-1, 1]) LINE(hx - H * 0.5, sd * H * 0.2, hx + H * 0.3, sd * H * 0.32, '#5a4326', 1.8);
      E(hx + H * 0.75, 0, H * 0.5, H * 0.34, '#f4ead7'); E(hx + H * 1.15, 0, H * 0.15, H * 0.12, '#c97d82');
      eyes(hx, H, '#e6c84a'); snoutEnd = hx + H * 1.2; break;
    }
    case 'bear': {
      legs('#3b2718', 0.95, 0.5);
      for (let i = 0; i < 4; i++) { const fx = i < 2 ? L * 0.6 : -L * 0.6, sd = i % 2 ? 1 : -1, sw = (i === 1 || i === 2 ? 1 : -1) * swing; for (const c of [-0.18, 0, 0.18]) E(fx + sw + s * 0.42, sd * B * 0.95 + c * s, s * 0.08, s * 0.05, '#e8e2d4'); }
      E(-L - s * 0.1, 0, s * 0.25, s * 0.22, '#5a3b24');
      E(0, 0, L, B, '#5a3b24'); E(L * 0.3, 0, L * 0.6, B * 0.75, '#6a4630'); E(-L * 0.2, 0, L * 0.5, B * 0.5, '#4d3220');
      hx = L * 1.0; H = s * 0.6 * hs;
      for (const sd of [-1, 1]) { E(hx - H * 0.2, sd * H * 0.8, H * 0.38, H * 0.38, '#5a3b24'); E(hx - H * 0.2, sd * H * 0.8, H * 0.2, H * 0.2, '#9c7452'); }
      E(hx, 0, H, H * 0.95, '#654229');
      E(hx + H * 0.8, 0, H * 0.6, H * 0.45, '#b08c64'); E(hx + H * 1.3, 0, H * 0.2, H * 0.16, '#111');
      eyes(hx, H, '#1a1a1a', 0.5); snoutEnd = hx + H * 1.4; break;
    }
    case 'otter': {
      legs('#4d3722', 1.0, 0.3);
      E(-L - s * 0.85, 0, s * 1.15, s * 0.28, '#6a4a30'); E(-L - s * 1.9, 0, s * 0.5, s * 0.14, '#5d4029');
      E(0, 0, L, B, '#6a4a30'); E(L * 0.35, 0, L * 0.6, B * 0.55, '#d6bc96');
      hx = L * 0.92; H = s * 0.46 * hs;
      for (const sd of [-1, 1]) E(hx - H * 0.3, sd * H * 0.85, H * 0.22, H * 0.22, '#5d4029');
      E(hx, 0, H, H * 0.92, '#765236');
      E(hx + H * 0.6, 0, H * 0.55, H * 0.55, '#e2cba8'); E(hx + H * 1.0, 0, H * 0.2, H * 0.15, '#111');
      for (const sd of [-1, 1]) for (const k of [0, 1]) LINE(hx + H * 0.9, sd * H * 0.2, hx + H * 1.4, sd * (H * 0.45 + k * H * 0.25), 'rgba(255,255,255,.7)', 1);
      eyes(hx, H, '#222', 0.45); snoutEnd = hx + H * 1.2; break;
    }
    case 'squirrel': {
      legs('#8a4f26', 0.85, 0.25);
      E(-L - s * 0.2, 0, s * 1.1, s * 0.62, '#a35a2c'); E(-L - s * 0.35, 0, s * 0.8, s * 0.4, '#c9803f'); E(-L - s * 0.6, 0, s * 0.45, s * 0.2, '#e8b27a');
      E(0, 0, L, B, '#9a5a2e'); E(L * 0.35, 0, L * 0.5, B * 0.55, '#ecd9b8');
      hx = L * 0.85; H = s * 0.5 * hs;
      for (const sd of [-1, 1]) { TRI(hx - H * 0.3, sd * H * 0.55, hx - H * 0.1, sd * H * 1.25, hx + H * 0.2, sd * H * 0.7, '#8a4f26'); LINE(hx - H * 0.1, sd * H * 1.25, hx - H * 0.2, sd * H * 1.6, '#3a2212', 1.5); }
      E(hx, 0, H, H * 0.92, '#a8622f'); E(hx + H * 0.7, 0, H * 0.5, H * 0.42, '#ecd9b8'); E(hx + H * 1.1, 0, H * 0.13, H * 0.1, '#222');
      for (const sd of [-1, 1]) E(hx + H * 0.5, sd * H * 0.5, H * 0.32, H * 0.28, '#e8c9a0');
      eyes(hx, H, '#222', 0.5); snoutEnd = hx + H * 1.2; break;
    }
    case 'hedgehog': {
      legs('#c9a27a', 0.8, 0.22);
      E(0, 0, L * 1.05, B * 1.15, '#3f3023');
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * 6.283 + 0.12; if (Math.cos(a) > 0.8) continue;
        const px = -L * 0.1 + Math.cos(a) * L * 0.95, py = Math.sin(a) * B * 1.05, nx = Math.cos(a), ny = Math.sin(a);
        TRI(px - ny * s * 0.13, py + nx * s * 0.13, px + nx * s * 0.38, py + ny * s * 0.38, px + ny * s * 0.13, py - nx * s * 0.13, i % 2 ? '#8b6f4f' : '#2f241a');
      }
      E(-L * 0.1, 0, L * 0.8, B * 0.85, '#5a4531');
      for (let i = 0; i < 10; i++) E(-L * 0.7 + (i % 5) * L * 0.28, (i < 5 ? -1 : 1) * B * 0.45, s * 0.1, s * 0.06, '#a98a63');
      hx = L * 0.95; H = s * 0.42 * hs;
      for (const sd of [-1, 1]) E(hx - H * 0.3, sd * H * 0.8, H * 0.25, H * 0.25, '#d8b894');
      E(hx, 0, H, H * 0.85, '#e0c29c'); E(hx + H * 0.9, 0, H * 0.7, H * 0.35, '#ecd3b0'); E(hx + H * 1.55, 0, H * 0.17, H * 0.14, '#111');
      eyes(hx, H, '#3a2a1a'); snoutEnd = hx + H * 1.6; break;
    }
    case 'coyote': {
      legs('#7d6a4c', 0.85, 0.3);
      E(-L - s * 0.55, 0, s * 0.75, s * 0.24, '#a48b64'); E(-L - s * 1.1, 0, s * 0.25, s * 0.18, '#2e2a24');
      E(0, 0, L, B, '#b59a72'); E(-L * 0.1, 0, L * 0.75, B * 0.5, '#8f7a58'); E(L * 0.2, 0, L * 0.55, B * 0.35, '#ead9ba');
      hx = L * 0.95; H = s * 0.46 * hs;
      for (const sd of [-1, 1]) { TRI(hx - H * 0.4, sd * H * 0.4, hx - H * 0.1, sd * H * 1.6, hx + H * 0.3, sd * H * 0.6, '#a48b64'); TRI(hx - H * 0.2, sd * H * 0.7, hx - H * 0.1, sd * H * 1.35, hx + H * 0.1, sd * H * 0.75, '#d9b9a0'); }
      E(hx, 0, H, H * 0.85, '#b99d74'); E(hx + H * 1.0, 0, H * 0.9, H * 0.3, '#d8c4a0'); E(hx + H * 1.8, 0, H * 0.15, H * 0.12, '#111');
      eyes(hx, H, '#e0b030'); snoutEnd = hx + H * 1.9; break;
    }
    case 'beaver': {
      legs('#4a3320', 0.95, 0.3);
      E(-L - s * 0.8, 0, s * 0.95, s * 0.5, '#3b2a1c');
      for (let k = -2; k <= 2; k++) LINE(-L - s * 0.2 - Math.abs(k) * s * 0.05, k * s * 0.18, -L - s * 1.5 + Math.abs(k) * s * 0.1, k * s * 0.22, 'rgba(0,0,0,.3)', 1.2);
      E(0, 0, L, B, '#7a5232'); E(L * 0.2, 0, L * 0.6, B * 0.45, '#a47a52');
      hx = L * 0.9; H = s * 0.5 * hs;
      for (const sd of [-1, 1]) E(hx - H * 0.3, sd * H * 0.85, H * 0.22, H * 0.22, '#5a3d24');
      E(hx, 0, H, H * 0.92, '#845a38'); E(hx + H * 0.8, 0, H * 0.5, H * 0.42, '#b88f66'); E(hx + H * 1.2, 0, H * 0.15, H * 0.12, '#111');
      for (const sd of [-1, 1]) E(hx + H * 1.25, sd * H * 0.08, H * 0.14, H * 0.1, '#ffd27a');
      eyes(hx, H, '#222', 0.45); snoutEnd = hx + H * 1.3; break;
    }
    case 'boar': {
      legs('#2e241d', 0.95, 0.38);
      E(-L - s * 0.2, 0, s * 0.2, s * 0.12, '#4a3b32');
      E(0, 0, L, B, '#5b4a40'); E(L * 0.4, 0, L * 0.6, B * 0.8, '#4a3b32');
      for (let i = 0; i < 9; i++) E(L * 0.75 - i * L * 0.19, 0, s * 0.2, s * 0.32, '#2a1f19');
      hx = L * 1.0; H = s * 0.62 * hs;
      for (const sd of [-1, 1]) TRI(hx - H * 0.4, sd * H * 0.5, hx - H * 0.2, sd * H * 1.2, hx + H * 0.3, sd * H * 0.65, '#3a2d25');
      E(hx, 0, H, H * 0.95, '#4a3b32'); E(hx + H * 1.0, 0, H * 1.0, H * 0.52, '#6b574a'); E(hx + H * 1.95, 0, H * 0.2, H * 0.3, '#c99a88');
      for (const sd of [-1, 1]) TRI(hx + H * 1.4, sd * H * 0.45, hx + H * 2.0, sd * H * 0.9, hx + H * 1.6, sd * H * 0.5, '#f4eedc');
      eyes(hx, H, '#222', 0.5); snoutEnd = hx + H * 2.1; break;
    }
    case 'elk': {
      legs('#5b3a22', 0.8, 0.3);
      E(-L - s * 0.05, 0, s * 0.25, s * 0.22, '#e9d9bd');
      E(0, 0, L, B, '#8c5a34'); E(L * 0.05, 0, L * 0.75, B * 0.4, '#dcc6a0');
      if (stage <= 1) for (let i = 0; i < 9; i++) E(-L * 0.7 + (i % 5) * L * 0.33, (i < 5 ? -1 : 1) * B * 0.5, s * 0.1, s * 0.1, '#f3e3c4');
      E(L * 0.95, 0, s * 0.6, s * 0.32, '#4d3220');
      hx = L + s * 0.65; H = s * 0.4 * hs;
      for (const sd of [-1, 1]) E(hx - H * 0.4, sd * H * 1.2, H * 0.9, H * 0.36, '#6a4228', sd * 0.6);
      if (stage >= 2) {
        const k = stage === 3 ? 1.3 : 1;
        for (const sd of [-1, 1]) {
          LINE(hx - H * 0.3, sd * H * 0.5, hx - H * 1.5, sd * H * 2.8 * k, '#e8dcc0', 4);
          for (let j = 1; j <= 3; j++) LINE(hx - H * (0.3 + j * 0.35), sd * H * (0.5 + j * 0.65) * k, hx + H * (0.6 - j * 0.1), sd * H * (0.9 + j * 0.8) * k, '#e8dcc0', 3);
        }
      }
      E(hx, 0, H, H * 0.85, '#6a4228'); E(hx + H * 1.0, 0, H * 0.9, H * 0.45, '#b89870'); E(hx + H * 1.8, 0, H * 0.2, H * 0.16, '#222');
      eyes(hx, H, '#2a1a0e'); snoutEnd = hx + H * 1.9; break;
    }
    case 'panther': {
      legs('#14141a', 0.95, 0.34);
      E(-L - s * 0.95, 0, s * 1.2, s * 0.2, '#1d1d24');
      E(0, 0, L, B, '#1d1d24'); E(L * 0.1, 0, L * 0.7, B * 0.4, '#2a2a34');
      for (const [px, py] of [[-.6, -.4], [-.2, .35], [.2, -.35], [.5, .3], [-.5, .3], [0, 0]]) E(L * px, B * py, s * 0.13, s * 0.1, '#262630');
      hx = L * 0.95; H = s * 0.5 * hs;
      for (const sd of [-1, 1]) E(hx - H * 0.2, sd * H * 0.8, H * 0.32, H * 0.32, '#1d1d24');
      E(hx, 0, H, H * 0.9, '#22222b'); E(hx + H * 0.75, 0, H * 0.5, H * 0.38, '#2c2c36'); E(hx + H * 1.15, 0, H * 0.15, H * 0.12, '#6b3b44');
      eyes(hx, H, '#9dff5a'); snoutEnd = hx + H * 1.2; break;
    }
    case 'lion': {
      legs('#b8894a', 0.95, 0.38);
      E(-L - s * 0.6, 0, s * 0.8, s * 0.14, '#d6a85a'); E(-L - s * 1.3, 0, s * 0.3, s * 0.25, '#5a3a1a');
      E(0, 0, L, B, '#d6a85a'); E(L * 0.15, 0, L * 0.65, B * 0.4, '#ecd29a');
      if (stage <= 1) for (let i = 0; i < 7; i++) E(-L * 0.6 + (i % 4) * L * 0.35, (i < 4 ? -1 : 1) * B * 0.5, s * 0.1, s * 0.08, '#b88a4a');
      hx = L * 0.95; H = s * 0.52 * hs;
      if (stage >= 2) { const mk = stage === 3 ? 1.15 : 1; E(hx - H * 0.2, 0, H * 1.7 * mk, H * 1.55 * mk, '#6f4220'); for (let i = 0; i < 10; i++) { const a = i * 0.628; E(hx - H * 0.2 + Math.cos(a) * H * 1.4 * mk, Math.sin(a) * H * 1.3 * mk, H * 0.45, H * 0.38, '#7f4c26'); } }
      for (const sd of [-1, 1]) E(hx - H * 0.2, sd * H * 0.8, H * 0.28, H * 0.28, '#c79a52');
      E(hx, 0, H, H * 0.9, '#dcae5e'); E(hx + H * 0.8, 0, H * 0.6, H * 0.42, '#ecd29a'); E(hx + H * 1.3, 0, H * 0.17, H * 0.14, '#3a2418');
      eyes(hx, H, '#e0a020'); snoutEnd = hx + H * 1.4; break;
    }
    default: {
      const sp = SPEC[key]; if (!sp) break;
      if (sp.bird) { drawBird(sp, s, L, B, stage, hs); break; }
      const tc = sp.tailCol || sp.coat;
      legs(sp.leg || sp.coat, sp.spread || 0.9, sp.legR || 0.32);
      if (sp.tail === 'bushy') { E(-L - s * 0.55, 0, s * 0.8, s * 0.27, tc); if (sp.tip) E(-L - s * 1.05, 0, s * 0.3, s * 0.22, sp.tip); }
      else if (sp.tail === 'thin') { E(-L - s * 0.8, 0, s * 1.05, s * 0.13, tc); if (sp.tip) E(-L - s * 1.75, 0, s * 0.2, s * 0.17, sp.tip); }
      else if (sp.tail === 'short') { E(-L - s * 0.25, 0, s * 0.38, s * 0.2, tc); if (sp.tip) E(-L - s * 0.5, 0, s * 0.15, s * 0.15, sp.tip); }
      else if (sp.tail === 'stub') E(-L - s * 0.12, 0, s * 0.2, s * 0.14, tc);
      else if (sp.tail === 'long') { E(-L - s * 0.9, 0, s * 1.3, s * 0.26, tc); E(-L - s * 2.0, 0, s * 0.7, s * 0.13, tc); }
      if (sp.bumps) for (let i = 0; i < 14; i++) { const a = i * 0.449; E(Math.cos(a) * L * 1.0, Math.sin(a) * B * 1.08, s * 0.32, s * 0.32, sp.bumps); }
      E(0, 0, L, B, sp.coat); E(L * 0.15, 0, L * (sp.bellyBig ? 0.85 : 0.6), B * (sp.bellyBig ? 0.8 : 0.4), sp.belly);
      if (sp.ridge) E(L * 0.35, 0, L * 0.75, B * 0.28, sp.ridge);
      const mk = sp.marks, mc = sp.markCol || '#222';
      if (mk === 'stripes') for (let i = 0; i < 8; i++) { const x = -L * 0.85 + i * L * 0.24; for (const sd of [-1, 1]) LINE(x, sd * B * 0.95, x + s * 0.12, sd * B * 0.12, mc, s * 0.13); }
      else if (mk === 'spots') for (const [px, py] of SPOTS) E(L * px, B * py, s * 0.1, s * 0.09, mc);
      else if (mk === 'rosettes') for (const [px, py] of SPOTS) { E(L * px, B * py, s * 0.2, s * 0.17, mc); E(L * px, B * py, s * 0.1, s * 0.08, sp.coat); }
      else if (mk === 'patches') { E(L * 0.5, 0, L * 0.4, B * 1.02, mc); E(-L * 0.75, 0, L * 0.32, B * 1.0, mc); }
      else if (mk === 'stripe1') E(-L * 0.1, 0, L * 0.95, B * 0.26, mc);
      if (sp.extra === 'humps2') { E(L * 0.15, 0, s * 0.55, B * 0.85, sp.hump || sp.coat); E(-L * 0.45, 0, s * 0.55, B * 0.85, sp.hump || sp.coat); }
      if (sp.extra === 'hump1') E(L * 0.3, 0, s * 0.75, B * 0.95, sp.hump || sp.coat);
      if (sp.extra === 'flippers') for (const sd of [-1, 1]) E(L * 0.1, sd * B * 1.0, s * 0.75, s * 0.2, sp.hump || '#14161b', sd * 0.35);
      if (sp.shell) { // turtle shell
        E(-L * 0.05, 0, L * 0.98, B * 1.02, sp.shell); E(-L * 0.05, 0, L * 0.75, B * 0.8, '#5d8c45');
        for (const [px, py] of [[0, 0], [-.45, 0], [.4, 0], [-.2, -.5], [-.2, .5], [.2, -.5], [.2, .5]]) E(L * px - L * 0.05, B * py, s * 0.28, s * 0.24, 'rgba(30,60,20,.45)');
      }
      hx = L * 0.95; H = s * (sp.head || 0.5) * hs;
      const ec = sp.earCol || sp.coat, eb = sp.earBig ? 1.35 : 1;
      for (const sd of [-1, 1]) {
        if (sp.ear === 'point') TRI(hx - H * 0.3, sd * H * 0.45, hx - H * 0.1, sd * H * 1.4, hx + H * 0.3, sd * H * 0.6, ec);
        else if (sp.ear === 'round') E(hx - H * 0.2, sd * H * 0.8 * eb, H * 0.35 * eb, H * 0.35 * eb, ec);
        else if (sp.ear === 'long') E(hx - H * 0.2, sd * H * 0.6, H * 1.1, H * 0.26, ec, sd * 0.3);
        else if (sp.ear === 'flap') E(hx - H * 0.2, sd * H * 1.0, H * 0.6, H * 0.25, ec, sd * 0.15);
        else if (sp.ear === 'small') E(hx - H * 0.2, sd * H * 0.85, H * 0.2, H * 0.2, ec);
      }
      if (sp.extra === 'horns' || sp.horns) for (const sd of [-1, 1]) { LINE(hx - H * 0.1, sd * H * 0.5, hx - H * 0.8, sd * H * 0.95, '#bfb39a', 3.5); LINE(hx - H * 0.8, sd * H * 0.95, hx - H * 1.4, sd * H * 0.55, '#bfb39a', 3); }
      E(hx, 0, H, H * 0.9, sp.headCol || sp.coat);
      if (sp.face === 'mask') for (const sd of [-1, 1]) E(hx + H * 0.35, sd * H * 0.4, H * 0.55, H * 0.3, '#2a2a2a');
      if (sp.face === 'badger') for (const sd of [-1, 1]) E(hx + H * 0.3, sd * H * 0.45, H * 1.0, H * 0.22, '#222');
      if (sp.face === 'panda') for (const sd of [-1, 1]) E(hx + H * 0.35, sd * H * 0.45, H * 0.3, H * 0.34, '#111');
      if (sp.face === 'frog') for (const sd of [-1, 1]) { E(hx + H * 0.1, sd * H * 0.6, H * 0.4, H * 0.4, sp.coat); E(hx + H * 0.2, sd * H * 0.6, H * 0.22, H * 0.22, '#f4e04a'); E(hx + H * 0.26, sd * H * 0.6, H * 0.09, H * 0.15, '#111'); }
      const sl = (sp.snout === undefined ? 0.5 : sp.snout) * H, sw = (sp.snoutW || 0.36) * H;
      E(hx + H * 0.55 + sl * 0.5, 0, sl * 0.5 + H * 0.3, sw, sp.snoutCol || sp.coat);
      E(hx + H * 0.8 + sl, 0, H * 0.15, H * 0.12, sp.nose || '#111');
      if (sp.face === 'tears') for (const sd of [-1, 1]) LINE(hx + H * 0.45, sd * H * 0.32, hx + H * 0.95, sd * H * 0.2, '#2a1a08', 1.8);
      if (sp.face === 'tigerface') for (const sd of [-1, 1]) { LINE(hx - H * 0.4, sd * H * 0.3, hx + H * 0.1, sd * H * 0.5, '#1a1208', 2); LINE(hx - H * 0.2, sd * H * 0.6, hx + H * 0.2, sd * H * 0.75, '#1a1208', 2); }
      if (sp.face === 'beard') E(hx + H * 0.9 + sl, 0, H * 0.18, H * 0.3, '#d8d0bc');
      if (sp.extra === 'horn1') { E(hx + H * 0.6 + sl * 0.75, 0, H * 0.6, H * 0.2, '#ece6d4'); E(hx + H * 0.15, 0, H * 0.35, H * 0.14, '#d9d2bc'); }
      eyes(hx, H, sp.eye || '#222', sp.eyeOff || 0.42);
      snoutEnd = hx + H * 0.8 + sl; break;
    }
    case 'croc': {
      legs('#355a28', 1.35, 0.4);
      E(-L - s * 0.9, 0, s * 1.4, s * 0.34, '#4d7c3a'); E(-L - s * 2.1, 0, s * 0.7, s * 0.16, '#44703a');
      E(0, 0, L, B, '#4d7c3a'); E(L * 0.2, 0, L * 0.85, B * 0.45, '#7fa85c');
      for (let i = 0; i < 9; i++) { const rx = L * 0.8 - i * (L * 1.9 / 9); TRI(rx, -s * 0.08, rx - s * 0.18, 0, rx, s * 0.08, '#2f4f23'); E(rx, 0, s * 0.12, s * 0.16, '#33572a'); }
      hx = L * 0.95; H = s * 0.42 * hs;
      E(hx, 0, H, H * 1.0, '#547f3f');
      E(hx + H * 1.2, 0, H * 1.6, H * 0.5, '#5d8a45'); E(hx + H * 2.6, 0, H * 0.5, H * 0.45, '#5d8a45');
      for (let i = 0; i < 5; i++) for (const sd of [-1, 1]) E(hx + H * (0.8 + i * 0.42), sd * H * 0.5, H * 0.08, H * 0.08, '#f5f5e8');
      E(hx + H * 3.0, -H * 0.15, H * 0.07, H * 0.07, '#111'); E(hx + H * 3.0, H * 0.15, H * 0.07, H * 0.07, '#111');
      for (const sd of [-1, 1]) { E(hx + H * 0.3, sd * H * 0.5, H * 0.3 * pe, H * 0.3 * pe, '#6d9a52'); E(hx + H * 0.35, sd * H * 0.5, H * 0.14 * pe, H * 0.14 * pe, '#e6c84a'); E(hx + H * 0.4, sd * H * 0.5, H * 0.06, H * 0.12, '#111'); }
      snoutEnd = hx + H * 3.1; break;
    }
  }
  if (stage === 3) { // elder: greying muzzle and coat
    E(snoutEnd - H * 0.7, 0, H * 0.7, H * 0.35, 'rgba(235,235,235,.5)');
    E(-L * 0.1, 0, L * 0.7, B * 0.45, 'rgba(210,210,210,.16)');
  }
}

function drawAnimal(o) {
  const d = ANIMALS[o.key] || ANIMALS.wolf, s = d.size * o.scale;
  const t = performance.now() / 1000;
  const h = (o.jump > 0 ? Math.sin((o.jump / 0.55) * Math.PI) * 34 * Math.max(0.6, o.scale) : 0) + Math.min(o.alt || 0, 200) * 0.6;
  bodyFly = (o.alt || 0) > 25;
  const hs = [1.4, 1.2, 1, 1][o.stage];
  const phase = o.moving ? t * (o.sprint ? 20 : 13) : 0;
  const span = d.L * s;

  ctx.save();
  if (o.swimming) { // ripples
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2;
    for (let i = 0; i < 2; i++) { const ph = (t * 0.8 + i * 0.5) % 1, r = ph * span * 1.4 + span * 0.5; ctx.globalAlpha = (1 - ph) * 0.6; ctx.beginPath(); ctx.ellipse(o.x, o.y, r, r * 0.7, 0, 0, 7); ctx.stroke(); }
  }
  ctx.globalAlpha = o.alpha;
  if (!o.swimming) { ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(o.x, o.y + s * 0.5, span * Math.max(0.4, 1 - h / 160), s * 0.6 * Math.max(0.4, 1 - h / 160), 0, 0, 7); ctx.fill(); }
  ctx.translate(o.x, o.y - h);
  ctx.rotate(o.angle);
  if (o.rest) ctx.scale(1, 0.85);
  drawBody(o.key, s, d.L * s, d.B * s, o.stage, phase, hs);
  ctx.restore();

  if (o.diving) { // bubbles
    ctx.save(); ctx.strokeStyle = 'rgba(200,235,255,.8)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) { const k = (t * 0.9 + i * 0.25) % 1; ctx.beginPath(); ctx.arc(o.x + Math.sin(i * 7 + t) * span * 0.6, o.y - k * 30, 3 + i, 0, 7); ctx.stroke(); }
    ctx.restore();
  }

  if (o.name) {
    ctx.save(); ctx.globalAlpha = Math.max(o.alpha, 0.7);
    ctx.font = '600 13px Segoe UI'; ctx.textAlign = 'center';
    const label = `${o.name} · ${STAGES[o.stage]}`, ty = o.y - span * 0.9 - s * 1.2 - h;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillText(label, o.x + 1, ty + 1);
    ctx.fillStyle = o.isMe ? '#ffe27a' : '#fff'; ctx.fillText(label, o.x, ty);
    if (!o.isMe && o.hp !== undefined) {
      const mhp = STAGE_HP[o.stage], w = 40;
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(o.x - w / 2, ty + 5, w, 5);
      ctx.fillStyle = '#e24a4a'; ctx.fillRect(o.x - w / 2, ty + 5, w * Math.max(0, Math.min(1, o.hp / mhp)), 5);
    }
    if (o.rest) { ctx.fillStyle = '#9ad'; ctx.fillText('Zzz', o.x + s, ty - 14); }
    ctx.restore();
  }
}

// ---- underwater scene ----
const decor = new Map();
function pondDecor(i) {
  if (decor.has(i)) return decor.get(i);
  const p = ponds[i], r = Shared.rng(seed + i * 7919 + 13);
  const pt = () => { const a = r() * 6.283, d = Math.sqrt(r()) * p.r * 0.95; return [p.x + Math.cos(a) * d, p.y + Math.sin(a) * d]; };
  const many = (n, f) => Array.from({ length: n }, f);
  const d = {
    sand: many(Math.round(p.r * 0.9), () => { const [x, y] = pt(); return { x, y, r: 1.5 + r() * 3 }; }),
    rocks: many(Math.round(p.r / 16), () => { const [x, y] = pt(); return { x, y, r: 9 + r() * 20 }; }),
    corals: many(Math.round(p.r / 28), () => { const [x, y] = pt(); return { x, y, s: 14 + r() * 14, c: ['#ff6b8b', '#ffb347', '#c77dff', '#ff8fa3'][Math.floor(r() * 4)] }; }),
    weeds: many(Math.round(p.r / 4.5), () => { const [x, y] = pt(); return { x, y, h: 50 + r() * 80, ph: r() * 6, w: 3 + r() * 3, c: r() < 0.5 ? '#2fa05a' : '#1f8450', n: r() < 0.4 ? 2 : 1 }; }),
    school: many(12, () => ({ cx: p.x + (r() - 0.5) * p.r, cy: p.y + (r() - 0.5) * p.r, rad: 40 + r() * p.r * 0.55, sp: 0.15 + r() * 0.3, ph: r() * 6.283, c: ['#9fd8ff', '#ffe08a', '#b6f0c8', '#ffa8c5'][Math.floor(r() * 4)], sz: 0.8 + r() * 0.7 })),
  };
  decor.set(i, d);
  return d;
}
function drawFish(x, y, ang, sc, col, t, glow) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(sc, sc);
  if (glow) { ctx.fillStyle = 'rgba(255,230,140,.25)'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, 7); ctx.fill(); }
  const wig = Math.sin(t * 9 + x * 0.1) * 5;
  E(0, 0, 10, 5, col); TRI(-8, 0, -17, -6 + wig, -17, 6 + wig, col);
  E(2, 1.5, 6, 2, 'rgba(255,255,255,.35)'); E(5, -1.5, 1.4, 1.4, '#111');
  ctx.restore();
}
function drawWeed(w, t) {
  const sway = Math.sin(t * 1.4 + w.ph) * 14;
  ctx.strokeStyle = w.c; ctx.lineWidth = w.w; ctx.lineCap = 'round';
  for (let k = 0; k < w.n; k++) {
    const off = (k - (w.n - 1) / 2) * 7, hh = w.h * (1 - k * 0.2);
    ctx.beginPath(); ctx.moveTo(w.x + off, w.y);
    ctx.bezierCurveTo(w.x + off + sway * 0.4, w.y - hh * 0.35, w.x + off - sway * 0.5, w.y - hh * 0.7, w.x + off + sway, w.y - hh);
    ctx.stroke();
  }
}

function drawUnderwater(cx, cy, W, H, t) {
  ctx.fillStyle = '#06202e'; ctx.fillRect(cx, cy, W, H);
  const pi = ponds.findIndex((p) => Math.hypot(p.x - me.x, p.y - me.y) < p.r);
  if (pi < 0) return;
  const p = ponds[pi], d = pondDecor(pi);
  const stage = stageOf(me.age);

  ctx.save();
  ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.clip();
  const g = ctx.createRadialGradient(me.x, me.y - 60, 20, me.x, me.y, Math.max(W, H) * 0.7);
  g.addColorStop(0, '#3aa0d4'); g.addColorStop(0.5, '#1d6ea6'); g.addColorStop(1, '#0a3a62');
  ctx.fillStyle = g; ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);

  // seabed
  ctx.fillStyle = 'rgba(214,190,130,.35)';
  for (const s of d.sand) { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill(); }
  for (const r of d.rocks) { E(r.x, r.y, r.r, r.r * 0.7, '#4d6a7a'); E(r.x - r.r * 0.25, r.y - r.r * 0.25, r.r * 0.5, r.r * 0.35, '#6f8e9e'); }
  for (const c of d.corals) {
    ctx.strokeStyle = c.c; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let k = -2; k <= 2; k++) {
      const tx = c.x + k * c.s * 0.35, ty = c.y - c.s * (1 - Math.abs(k) * 0.2);
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(tx, ty); ctx.stroke(); E(tx, ty, 4, 4, c.c);
    }
  }
  for (const e of entrances) if (e.water && Math.hypot(e.x - p.x, e.y - p.y) < p.r) {
    for (let k = 3; k >= 0; k--) E(e.x, e.y, 62 + k * 10, 48 + k * 8, `rgba(8,24,40,${0.35 + 0.1 * (3 - k)})`);
    E(e.x, e.y, 48, 36, '#010609');
    ctx.strokeStyle = `rgba(150,220,255,${0.4 + 0.2 * Math.sin(t * 3)})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(e.x, e.y, 66 + Math.sin(t * 3) * 3, 52, 0, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(190,235,255,.9)'; ctx.font = '600 12px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('🕳️ Cave', e.x, e.y - 62);
  }
  // back weeds
  d.weeds.forEach((w, i) => { if (i % 3 !== 0) drawWeed(w, t); });

  // decorative schools of fish
  for (const f of d.school) {
    const a = t * f.sp + f.ph, x = f.cx + Math.cos(a) * f.rad, y = f.cy + Math.sin(a) * f.rad * 0.6;
    const ang = Math.atan2(Math.cos(a) * f.rad * 0.6, -Math.sin(a) * f.rad);
    for (let k = 0; k < 3; k++) drawFish(x - Math.cos(ang) * k * 22 + k * 3, y - Math.sin(ang) * k * 22, ang, f.sz * (1 - k * 0.12), f.c, t, false);
  }
  // real (edible) fish
  for (const c of critters.values()) if (c.k === 'fish' && Math.hypot(c.x - p.x, c.y - p.y) < p.r) drawFish(c.x, c.y, c.a, 1.6, '#ff9a3c', t, true);

  // other animals in this pond (divers clearly, surface swimmers as faint shapes)
  for (const o of others.values()) {
    if (Math.hypot(o.x - p.x, o.y - p.y) > p.r) continue;
    const under = !!o.dv;
    drawAnimal({ key: o.an, x: o.x, y: o.y, angle: o.a, jump: 0, rest: false, alpha: under ? 0.95 : 0.35, name: under ? o.n : '', isMe: false,
                 scale: scaleOf(o.ag || 0), stage: stageOf(o.ag || 0), moving: !!o.m, swimming: false, hp: o.hp });
  }
  // me
  drawAnimal({ key: me.animal, x: me.x, y: me.y, angle: me.angle, jump: 0, rest: false, alpha: 1, name: me.name, isMe: true,
               scale: scaleOf(me.age), stage, moving: me.moving, sprint: me.sprinting, swimming: false, diving: true });
  // front weeds
  d.weeds.forEach((w, i) => { if (i % 3 === 0) drawWeed(w, t); });

  // light rays from the surface
  for (let k = 0; k < 6; k++) {
    const x0 = cx + (k - 0.5) * (W / 5) + Math.sin(t * 0.35 + k * 1.7) * 50;
    ctx.fillStyle = `rgba(200,240,255,${0.05 + 0.025 * Math.sin(t + k)})`;
    ctx.beginPath(); ctx.moveTo(x0, cy - 10); ctx.lineTo(x0 + 70, cy - 10); ctx.lineTo(x0 + 220, cy + H + 10); ctx.lineTo(x0 + 60, cy + H + 10); ctx.closePath(); ctx.fill();
  }
  // ambient bubbles
  ctx.strokeStyle = 'rgba(210,240,255,.55)'; ctx.lineWidth = 1.2;
  for (let i = 0; i < 18; i++) {
    const k = (t * 0.12 + i * 0.137) % 1, bx = me.x + Math.sin(i * 12.9) * W * 0.5 + Math.sin(t + i) * 8, by = cy + H - k * (H + 20);
    ctx.beginPath(); ctx.arc(bx, by, 2 + (i % 4), 0, 7); ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(120,200,235,.5)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.stroke();
}

// ---- caves ----
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

function drawCave(cx, cy, W, H, t) {
  const cv = caveDefs[me.loc], lv = me.loc;
  ctx.fillStyle = cv.flooded ? '#03101a' : '#120e0b'; ctx.fillRect(cx, cy, W, H);
  const T = 70;
  for (let gx = Math.floor(cx / T); gx <= (cx + W) / T; gx++)
    for (let gy = Math.floor(cy / T); gy <= (cy + H) / T; gy++) if (hash(gx, gy + 99) < 0.3) { ctx.fillStyle = '#1a1410'; ctx.fillRect(gx * T, gy * T, T, T); }
  const paint = (col, grow) => {
    ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = 'round';
    for (const c of cv.chambers) { ctx.beginPath(); ctx.arc(c.x, c.y, c.r + grow, 0, 7); ctx.fill(); }
    for (const k of cv.corridors) { const a = cv.chambers[k.a], b = cv.chambers[k.b]; ctx.lineWidth = k.w + grow * 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
  };
  if (cv.flooded) { paint('#020a12', 28); paint('#0e3a52', 9); paint('#1a5876', -3); } else { paint('#090706', 28); paint('#2e261f', 9); paint('#4a3f34', -3); }
  // floor pebbles
  for (let gx = Math.floor(cx / 40); gx <= (cx + W) / 40; gx++)
    for (let gy = Math.floor(cy / 40); gy <= (cy + H) / 40; gy++) {
      const v = hash(gx + 500, gy + 500); if (v < 0.72) continue;
      const x = gx * 40 + v * 30, y = gy * 40 + hash(gy, gx) * 30;
      if (caveWalkable(cv, x, y)) E(x, y, 3 + v * 3, 2 + v * 2, cv.flooded ? '#7a9aa6' : '#5d5045');
    }
  for (const p of cv.pillars) { E(p.x + 3, p.y + 4, p.r, p.r * 0.75, 'rgba(0,0,0,.35)'); E(p.x, p.y, p.r, p.r * 0.8, '#3a3028'); E(p.x - 3, p.y - 3, p.r * 0.55, p.r * 0.4, '#5a4c3c'); }
  for (const c of cv.crystals) {
    for (const [dx, dy, k] of [[0, 0, 1], [c.s * 0.5, c.s * 0.25, 0.6], [-c.s * 0.45, c.s * 0.3, 0.5]]) {
      const s = c.s * k, x = c.x + dx, y = c.y + dy;
      ctx.fillStyle = c.c; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.45, y); ctx.lineTo(x, y + s * 0.5); ctx.lineTo(x - s * 0.45, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.45, y); ctx.lineTo(x, y); ctx.closePath(); ctx.fill();
    }
  }
  // mushrooms (the glowing ones are food)
  cv.mush.forEach((m, i) => {
    const n = (mush[lv] && mush[lv][i]) || 0;
    if (cv.flooded) { // sea-kelp (food)
      ctx.strokeStyle = n > 0 ? '#4ade80' : '#2f6b4a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let k = -1; k <= 1; k++) { const sw = Math.sin(t * 1.6 + i + k) * 10; ctx.beginPath(); ctx.moveTo(m.x + k * 8, m.y + 10); ctx.bezierCurveTo(m.x + k * 8 + sw, m.y - 4, m.x + k * 8 - sw, m.y - 20, m.x + k * 8 + sw, m.y - 34); ctx.stroke(); }
      return;
    }
    E(m.x, m.y + 4, 3, 7, '#d9d2c0'); E(m.x, m.y - 4, 13, 9, n > 0 ? '#3fb8ff' : '#3a5a70'); E(m.x - 4, m.y - 7, 3, 2, 'rgba(255,255,255,.7)'); E(m.x + 4, m.y - 5, 2, 1.6, 'rgba(255,255,255,.6)');
  });
  // gems (worth 10 leaves)
  for (const l of leaves.values()) if (l.c === lv) {
    const pulse = 1 + Math.sin(t * 4 + l.id) * 0.12, s = 12 * pulse;
    if (cv.flooded) { E(l.x, l.y, 9 * pulse, 9 * pulse, '#f6e7ff'); E(l.x - 3, l.y - 3, 3, 3, 'rgba(255,255,255,.9)'); continue; }
    ctx.fillStyle = '#5eead4'; ctx.beginPath(); ctx.moveTo(l.x, l.y - s); ctx.lineTo(l.x + s * 0.7, l.y); ctx.lineTo(l.x, l.y + s); ctx.lineTo(l.x - s * 0.7, l.y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.moveTo(l.x, l.y - s); ctx.lineTo(l.x + s * 0.7, l.y); ctx.lineTo(l.x, l.y); ctx.closePath(); ctx.fill();
  }
  // air pockets (flooded caves)
  for (const a of cv.air) {
    E(a.x, a.y, a.r, a.r * 0.8, 'rgba(190,235,255,.28)');
    ctx.strokeStyle = 'rgba(220,245,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(a.x, a.y, a.r + Math.sin(t * 3) * 3, a.r * 0.8, 0, 0, 7); ctx.stroke();
    ctx.fillStyle = '#e6f6ff'; ctx.font = '600 13px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('💨 Air', a.x, a.y - a.r - 8);
  }
  // exits
  cv.exits.forEach((ex) => {
    E(ex.x, ex.y, 46, 58, '#fff6c8'); E(ex.x, ex.y, 32, 44, '#ffffff');
    ctx.fillStyle = '#ffeaa0'; ctx.font = '600 13px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(cv.flooded ? '⬆ Surface' : '☀️ Exit', ex.x, ex.y - 70);
  });
  // bats
  for (const c of critters.values()) {
    if (cv.flooded) { drawFish(c.x, c.y, c.a, 1.5, '#ffb36b', t, true); continue; }
    const flap = Math.sin(t * 16 + c.id) * 0.7;
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a);
    TRI(0, -2, -4, -13 - flap * 8, -11, -5 - flap * 6, '#2b2233'); TRI(0, 2, -4, 13 + flap * 8, -11, 5 + flap * 6, '#2b2233');
    E(0, 0, 6, 3.6, '#3b2f46'); E(5, -1, 0.9, 0.9, '#ff5a5a'); E(5, 1, 0.9, 0.9, '#ff5a5a');
    ctx.restore();
  }
  for (const o of others.values()) {
    drawAnimal({ key: o.an, x: o.x, y: o.y, angle: o.a, jump: o.j ? 0.27 : 0, rest: o.r, alpha: o.f ? 0.25 : 1, name: o.n, isMe: false,
                 scale: scaleOf(o.ag || 0), stage: stageOf(o.ag || 0), moving: !!o.m, swimming: false, hp: o.hp });
  }
  const def = ANIMALS[me.animal];
  drawAnimal({ key: me.animal, x: me.x, y: me.y, angle: me.angle, jump: me.jump, rest: me.resting,
               alpha: me.abTime > 0 && def.ab.stealth ? 0.55 : 1, name: me.name, isMe: true,
               scale: scaleOf(me.age), stage: stageOf(me.age), moving: me.moving, sprint: me.sprinting, swimming: false, diving: cv.flooded });
  if (cv.flooded) { // drifting bubbles
    ctx.strokeStyle = 'rgba(210,240,255,.5)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 16; i++) {
      const k = (t * 0.12 + i * 0.151) % 1, bx = me.x + Math.sin(i * 12.9) * W * 0.5 + Math.sin(t + i) * 8, by = cy + H - k * (H + 20);
      ctx.beginPath(); ctx.arc(bx, by, 2 + (i % 4), 0, 7); ctx.stroke();
    }
  }
}

// darkness around you + glowing things that stay visible from far away
function drawCaveLight(cx, cy, W, H, t) {
  const nv = me.nightVision, R = nv ? 580 : 250, lv = me.loc, cv = caveDefs[lv];
  const g = ctx.createRadialGradient(W / 2, H / 2, R * 0.15, W / 2, H / 2, R);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, cv.flooded ? `rgba(0,8,18,${nv ? 0.55 : 0.93})` : `rgba(2,3,6,${nv ? 0.62 : 0.96})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (nv) { ctx.fillStyle = 'rgba(60,255,120,.10)'; ctx.fillRect(0, 0, W, H); }
  ctx.save(); ctx.translate(-cx, -cy); ctx.globalCompositeOperation = 'lighter';
  const glow = (x, y, r, col) => {
    if (x < cx - r || x > cx + W + r || y < cy - r || y > cy + H + r) return;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  };
  for (const c of cv.crystals) glow(c.x, c.y, c.s * 3.4, hexA(c.c, 0.5 + Math.sin(t * 2 + c.rot) * 0.12));
  cv.mush.forEach((m, i) => glow(m.x, m.y, 70, (mush[lv] && mush[lv][i] > 0) ? (cv.flooded ? 'rgba(90,255,150,.4)' : 'rgba(70,190,255,.5)') : 'rgba(70,120,160,.12)'));
  for (const l of leaves.values()) if (l.c === lv) glow(l.x, l.y, 48 + Math.sin(t * 4 + l.id) * 5, cv.flooded ? 'rgba(255,190,255,.6)' : 'rgba(120,255,235,.65)');
  cv.exits.forEach((ex) => glow(ex.x, ex.y, 150, cv.flooded ? 'rgba(150,220,255,.7)' : 'rgba(255,240,170,.75)'));
  for (const a of cv.air) glow(a.x, a.y, 140, 'rgba(180,230,255,.6)');
  ctx.restore();
}

const BIOME_COL = {
  forest: ['#3f8a4a', '#468f50', '#2f6f3a'], jungle: ['#2d7a3c', '#348646', '#1f5a2c'], desert: ['#dcc080', '#e4c98c', '#b59a5e'],
  snow: ['#eef3f6', '#e1eaf0', '#b8c8d4'], swamp: ['#50694a', '#566f50', '#3a5236'], savanna: ['#bfae55', '#c8b85e', '#8f8035'],
};
const POND_COL = { // [shore, water, deep]
  forest: ['#3a7a52', '#2f6fa8', '#285f94'], jungle: ['#2f6a45', '#2f6fa8', '#285f94'], savanna: ['#7a8a4a', '#2f6fa8', '#285f94'],
  desert: ['#c9ad6a', '#2f9fc8', '#2688b0'], snow: ['#dfeaf0', '#a9d6ea', '#8cc5de'], swamp: ['#3a5236', '#4f7a52', '#46704a'],
};
const BUSH_COL = {
  forest: ['rgba(30,110,45,.9)', 'rgba(55,150,65,.88)'], jungle: ['rgba(20,95,45,.92)', 'rgba(40,160,70,.9)'], desert: ['rgba(140,120,60,.92)', 'rgba(180,160,80,.9)'],
  snow: ['rgba(110,150,160,.92)', 'rgba(190,225,235,.9)'], swamp: ['rgba(70,90,40,.92)', 'rgba(100,125,55,.9)'], savanna: ['rgba(170,150,60,.92)', 'rgba(210,190,90,.9)'],
};
const FRUIT_COL = { forest: '#e63946', jungle: '#ff9f1c', desert: '#d63aa8', snow: '#5aa9ff', swamp: '#c4d94a', savanna: '#f2c230' };
Object.assign(BIOME_COL, {
  mountain: ['#8a8f96', '#7c8189', '#5f646b'], volcano: ['#3a3340', '#443c4c', '#ff7a2a'], bamboo: ['#6aa24a', '#72ab52', '#4a7f33'],
  meadow: ['#6fc25a', '#78ca62', '#4a9a3a'], mushroom: ['#4a3a6a', '#52427a', '#7a5ab0'],
});
Object.assign(POND_COL, {
  mountain: ['#8a9199', '#5a98c0', '#4686ac'], volcano: ['#2a1a14', '#e0531a', '#ffb02a'], bamboo: ['#3a7a52', '#2f9a98', '#2a8586'],
  meadow: ['#6a9a52', '#4aa6d8', '#3a92c4'], mushroom: ['#4a3a6a', '#4a7ac8', '#3a62ac'],
});
Object.assign(BUSH_COL, {
  mountain: ['rgba(100,110,95,.92)', 'rgba(140,155,130,.9)'], volcano: ['rgba(60,45,45,.93)', 'rgba(110,60,40,.9)'], bamboo: ['rgba(60,140,50,.92)', 'rgba(100,180,70,.9)'],
  meadow: ['rgba(60,150,60,.92)', 'rgba(110,200,90,.9)'], mushroom: ['rgba(80,50,130,.93)', 'rgba(130,90,190,.9)'],
});
Object.assign(FRUIT_COL, { mountain: '#9be7ff', volcano: '#ff7a2a', bamboo: '#f2e14a', meadow: '#ff7ab6', mushroom: '#8ff0ff' });

// weather / mood overlay for the biome you are standing in
function drawBiomeFx(W, H, t) {
  const bio = me.biome, tol = Shared.tolerates(bio, me.animal);
  const vignette = (rgb, a) => {
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(1, `rgba(${rgb},${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };
  if (bio === 'snow') {
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (let i = 0; i < 80; i++) {
      const x = (i * 97.3 + t * (18 + (i % 5) * 6) + Math.sin(t + i) * 20) % W, y = (i * 53.7 + t * (45 + (i % 4) * 14)) % H;
      ctx.beginPath(); ctx.arc(x, y, 1.5 + (i % 3) * 0.6, 0, 7); ctx.fill();
    }
    if (!tol) vignette('120,180,255', 0.28);
  } else if (bio === 'desert') {
    ctx.fillStyle = `rgba(255,170,50,${0.05 + 0.02 * Math.sin(t * 2)})`; ctx.fillRect(0, 0, W, H);
    if (!tol) vignette('255,120,20', 0.22);
  } else if (bio === 'swamp') {
    ctx.fillStyle = 'rgba(120,160,90,.10)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(200,225,170,.07)';
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(((i * 311 + t * 12) % (W + 400)) - 200, (i * 137) % H, 220, 50, 0, 0, 7); ctx.fill(); }
  } else if (bio === 'jungle') { ctx.fillStyle = 'rgba(0,50,20,.10)'; ctx.fillRect(0, 0, W, H); }
  else if (bio === 'savanna') { ctx.fillStyle = 'rgba(255,200,80,.05)'; ctx.fillRect(0, 0, W, H); }
  else if (bio === 'mountain') {
    ctx.fillStyle = 'rgba(220,230,240,.07)'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) { const x = (i * 131 + t * 220) % (W + 200) - 100, y = (i * 71) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 70, y + 6); ctx.stroke(); }
    if (!tol) vignette('140,160,190', 0.22);
  } else if (bio === 'volcano') {
    ctx.fillStyle = 'rgba(255,60,0,.07)'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { const x = (i * 83.7 + Math.sin(t + i) * 25) % W, y = H - ((i * 47.3 + t * (40 + (i % 5) * 18)) % H); ctx.fillStyle = `rgba(255,${120 + (i % 4) * 30},40,.85)`; ctx.beginPath(); ctx.arc(x, y, 1.6 + (i % 3) * 0.6, 0, 7); ctx.fill(); }
    if (!tol) vignette('255,50,0', 0.3);
  } else if (bio === 'bamboo') {
    ctx.fillStyle = 'rgba(80,200,90,.06)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,200,.05)';
    for (let k = 0; k < 4; k++) { const x0 = k * W / 3 + Math.sin(t * 0.3 + k) * 40; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0 + 60, 0); ctx.lineTo(x0 + 220, H); ctx.lineTo(x0 + 120, H); ctx.closePath(); ctx.fill(); }
  } else if (bio === 'meadow') {
    ctx.fillStyle = 'rgba(255,230,160,.05)'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) { const x = (i * 123.3 + t * (14 + (i % 4) * 6) + Math.sin(t + i) * 30) % W, y = (i * 61.1 + t * (20 + (i % 3) * 8)) % H; ctx.fillStyle = i % 2 ? 'rgba(255,170,200,.85)' : 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.ellipse(x, y, 4, 2.2, t + i, 0, 7); ctx.fill(); }
  } else if (bio === 'mushroom') {
    ctx.fillStyle = 'rgba(150,90,220,.10)'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { const x = (i * 97.1 + Math.sin(t * 0.7 + i) * 30) % W, y = (i * 59.3 + Math.cos(t * 0.5 + i) * 30) % H; ctx.fillStyle = `rgba(140,240,255,${0.35 + 0.35 * Math.sin(t * 2 + i)})`; ctx.beginPath(); ctx.arc(x, y, 2 + (i % 3), 0, 7); ctx.fill(); }
  }
}

function drawNightGlow(cx, cy, W, H, t, dark) {
  ctx.save(); ctx.translate(-cx, -cy); ctx.globalCompositeOperation = 'lighter';
  for (const b of bushes) {
    if (b.b !== 'mushroom' || b.x < cx - 120 || b.x > cx + W + 120 || b.y < cy - 120 || b.y > cy + H + 120) continue;
    const r = b.r * 2.2, g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
    g.addColorStop(0, `rgba(110,230,255,${0.45 * dark})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 7); ctx.fill();
  }
  for (const o of obstacles) {
    if (o.type !== 'shroom' || o.x < cx - 150 || o.x > cx + W + 150 || o.y < cy - 150 || o.y > cy + H + 150) continue;
    const g = ctx.createRadialGradient(o.x, o.y - 20, 0, o.x, o.y - 20, 110);
    g.addColorStop(0, `rgba(170,120,255,${0.5 * dark})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, o.y - 20, 110, 0, 7); ctx.fill();
  }
  ctx.restore();
}

function hash(x, y) { let h = (x * 374761393 + y * 668265263) ^ seed; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967296; }

function draw() {
  const W = canvas.width, H = canvas.height;
  const cx = me.x - W / 2, cy = me.y - H / 2;
  const t = performance.now() / 1000;
  ctx.fillStyle = '#3f8a4a'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(-cx, -cy);
  const vis = (x, y, m) => x > cx - m && x < cx + W + m && y > cy - m && y < cy + H + m;
  const smelling = me.smellTime > 0;
  if (me.loc >= 0) drawCave(cx, cy, W, H, t);
  else if (me.dive) drawUnderwater(cx, cy, W, H, t);
  else {

  // grass
  const T = 40;
  for (let gx = Math.floor(cx / T); gx <= (cx + W) / T; gx++)
    for (let gy = Math.floor(cy / T); gy <= (cy + H) / T; gy++) {
      const gb = biomeAt(biomes, gx * T + T / 2, gy * T + T / 2), pal = BIOME_COL[gb], v = hash(gx, gy);
      ctx.fillStyle = v < 0.28 ? pal[1] : pal[0]; ctx.fillRect(gx * T, gy * T, T + 1, T + 1);
      if (v > 0.86) {
        ctx.fillStyle = pal[2];
        if (gb === 'meadow') { E(gx * T + 12, gy * T + 14, 3, 3, '#ff9fc4'); E(gx * T + 26, gy * T + 24, 3, 3, '#fff3a8'); }
        else if (gb === 'mushroom') E(gx * T + 18, gy * T + 18, 2.5, 2.5, '#9be7ff');
        else if (gb === 'volcano') E(gx * T + 16, gy * T + 20, 3, 2, '#ff7a2a');
        else if (gb === 'mountain') ctx.fillRect(gx * T + 8, gy * T + 22, 10, 3);
        else if (gb === 'bamboo') ctx.fillRect(gx * T + 12, gy * T + 6, 2, 18);
        else if (gb === 'desert') ctx.fillRect(gx * T + 6, gy * T + 18, 18, 2);
        else if (gb === 'snow') ctx.fillRect(gx * T + 14, gy * T + 14, 3, 3);
        else if (gb === 'swamp') E(gx * T + 20, gy * T + 22, 8, 3, pal[2]);
        else { ctx.fillRect(gx * T + 10, gy * T + 10, 3, 10); ctx.fillRect(gx * T + 16, gy * T + 14, 3, 8); }
      }
    }
  ctx.strokeStyle = '#2b1d12'; ctx.lineWidth = 12; ctx.strokeRect(0, 0, WORLD, WORLD);

  // ponds
  for (const p of ponds) {
    if (!vis(p.x, p.y, p.r + 20)) continue;
    const pw = POND_COL[biomeAt(biomes, p.x, p.y)] || POND_COL.forest;
    ctx.fillStyle = pw[0]; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 6, 0, 7); ctx.fill();
    ctx.fillStyle = pw[1]; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    ctx.fillStyle = pw[2]; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.65, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(p.x + Math.sin(t + i * 2) * 6, p.y + Math.cos(t * 0.8 + i) * 6, p.r * (0.3 + i * 0.22), 0.3, 1.3); ctx.stroke(); }
  }
  // rocks
  for (const o of obstacles) if (o.type === 'rock' && vis(o.x, o.y, 60)) {
    const rc = o.b === 'desert' ? ['#c9a56e', '#dfc08a'] : o.b === 'snow' ? ['#cfd8de', '#eef3f6'] : o.b === 'volcano' ? ['#2a2630', '#443e4c'] : o.b === 'mountain' ? ['#6a6e75', '#8a8f97'] : ['#7d8087', '#9ea1a8'];
    ctx.fillStyle = rc[0]; ctx.beginPath(); ctx.ellipse(o.x, o.y, o.r, o.r * 0.8, 0, 0, 7); ctx.fill();
    ctx.fillStyle = rc[1]; ctx.beginPath(); ctx.ellipse(o.x - 5, o.y - 5, o.r * 0.5, o.r * 0.4, 0, 0, 7); ctx.fill();
  }

  // whirlpools mark flooded caves (dive here)
  for (const e of entrances) if (e.water && vis(e.x, e.y, 80)) {
    ctx.strokeStyle = 'rgba(10,40,80,.55)'; ctx.lineWidth = 3;
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(e.x, e.y, 20 + k * 14, 14 + k * 9, t * (k % 2 ? -0.6 : 0.6), 0, 5); ctx.stroke(); }
    E(e.x, e.y, 12, 9, 'rgba(5,25,50,.7)');
  }
  // cave entrances
  for (const e of entrances) if (!e.water && vis(e.x, e.y, 120)) {
    E(e.x + 4, e.y + 10, 80, 58, 'rgba(0,0,0,.25)');
    E(e.x, e.y, 74, 56, '#6f7279'); E(e.x - 10, e.y - 12, 56, 38, '#8a8d94'); E(e.x - 20, e.y - 22, 30, 18, '#a3a6ad');
    E(e.x, e.y + 8, 38, 28, '#0b0908'); E(e.x, e.y + 12, 30, 20, '#000');
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = '600 12px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('🕳️ Cave', e.x, e.y - 66);
  }

  // leaves
  for (const l of leaves.values()) {
    if (l.c !== -1 || !vis(l.x, l.y, 30)) continue;
    const bob = Math.sin(t * 3 + l.id) * 2;
    if (smelling || me.nightVision) { ctx.fillStyle = 'rgba(255,240,120,.35)'; ctx.beginPath(); ctx.arc(l.x, l.y + bob, 16 + Math.sin(t * 6) * 3, 0, 7); ctx.fill(); }
    ctx.save(); ctx.translate(l.x, l.y + bob); ctx.rotate(l.id);
    ctx.fillStyle = l.v >= 5 ? '#ffd54a' : l.v >= 2 ? '#6be07a' : '#2fb34a';
    ctx.beginPath(); ctx.ellipse(0, 0, 9 + l.v, 5 + l.v * 0.6, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke();
    ctx.restore();
  }

  // critters (prey on land, fish in ponds)
  for (const c of critters.values()) {
    if (!vis(c.x, c.y, 30)) continue;
    if (smelling && Math.hypot(c.x - me.x, c.y - me.y) < 700) { ctx.strokeStyle = 'rgba(255,230,120,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c.x, c.y, 16, 0, 7); ctx.stroke(); }
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a);
    if (c.k === 'fish') {
      const wig = Math.sin(t * 10 + c.id) * 0.3;
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, 7); ctx.fill();
      E(0, 0, 9, 4.5, '#ff9a3c'); TRI(-8, 0, -15, -5 + wig * 6, -15, 5 + wig * 6, '#ff7a1c'); E(4, -1, 1.2, 1.2, '#111');
    } else {
      E(-5, 0, 5, 2, '#a88a6a'); E(0, 0, 7, 4.6, '#8a6d4f'); E(6, 0, 3.6, 3.2, '#9a7c5c');
      E(5, -3, 1.8, 1.8, '#7a5d41'); E(5, 3, 1.8, 1.8, '#7a5d41'); E(8, -1, 0.9, 0.9, '#111'); E(8, 1, 0.9, 0.9, '#111');
    }
    ctx.restore();
  }

  // other players
  for (const o of others.values()) {
    if (o.h) continue;
    const st = stageOf(o.ag || 0), sw = ponds.some((p) => Math.hypot(p.x - o.x, p.y - o.y) < p.r);
    drawAnimal({ key: o.an, x: o.x, y: o.y, angle: o.a, jump: o.j ? 0.27 : 0, rest: o.r, alpha: o.f ? 0.25 : 1, name: o.n, isMe: false,
                 scale: scaleOf(o.ag || 0), stage: st, moving: !!o.m, swimming: sw && !o.j && !o.fl && !o.cl, hp: o.hp, alt: o.alt });
  }
  // me
  const stage = stageOf(me.age), scale = scaleOf(me.age), def = ANIMALS[me.animal];
  drawAnimal({ key: me.animal, x: me.x, y: me.y, angle: me.angle, jump: me.jump, rest: me.resting,
               alpha: me.dive ? 0.4 : (me.abTime > 0 && def.ab.stealth) || me.hidden ? 0.55 : 1, name: me.name, isMe: true,
               scale, stage, moving: me.moving, sprint: me.sprinting, swimming: me.swimming, diving: me.dive, alt: me.alt });

  // growth effect
  if (me.growFx > 0) {
    const k = 1 - me.growFx / 2;
    ctx.strokeStyle = `rgba(255,230,120,${1 - k})`; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(me.x, me.y, 30 + k * 110, 0, 7); ctx.stroke();
    ctx.fillStyle = `rgba(255,240,160,${1 - k})`;
    for (let i = 0; i < 10; i++) { const a = i * 0.628 + t * 2, r = 20 + k * 90; ctx.beginPath(); ctx.arc(me.x + Math.cos(a) * r, me.y + Math.sin(a) * r - k * 20, 4 * (1 - k) + 1, 0, 7); ctx.fill(); }
  }

  // bushes with fruit (drawn over animals so hidden ones sit inside)
  bushes.forEach((b, i) => {
    if (!vis(b.x, b.y, 100)) return;
    const bc = BUSH_COL[b.b] || BUSH_COL.forest;
    ctx.fillStyle = bc[0]; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
    ctx.fillStyle = bc[1];
    for (let k = 0; k < 5; k++) { const a = k * 1.26 + b.x; ctx.beginPath(); ctx.arc(b.x + Math.cos(a) * b.r * 0.5, b.y + Math.sin(a) * b.r * 0.5, b.r * 0.45, 0, 7); ctx.fill(); }
    for (let k = 0; k < (fruit[i] || 0); k++) {
      const a = i * 2.1 + k * 2.09, rr = b.r * 0.55, fx = b.x + Math.cos(a) * rr, fy = b.y + Math.sin(a) * rr;
      ctx.fillStyle = FRUIT_COL[b.b] || '#e63946'; ctx.beginPath(); ctx.arc(fx, fy, 6, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(fx - 2, fy - 2, 1.8, 0, 7); ctx.fill();
    }
  });
  // hidden players revealed by smell
  if (smelling) for (const o of others.values()) if (o.h && Math.hypot(o.x - me.x, o.y - me.y) < 450) {
    ctx.strokeStyle = '#ff5a5a'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(o.x, o.y, 36, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#ff9a9a'; ctx.font = '600 12px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('hiding: ' + o.n, o.x, o.y - 42);
  }

  // trees and other tall plants (drawn over animals)
  for (const o of obstacles) if (o.type !== 'rock' && vis(o.x, o.y, 130)) {
    const s = o.s;
    if (o.type === 'tree') {
      ctx.fillStyle = '#5b3a1e'; ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 0.55, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(20,70,30,.92)'; ctx.beginPath(); ctx.arc(o.x, o.y - 10, 52 * s, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(40,110,50,.9)'; ctx.beginPath(); ctx.arc(o.x - 10, o.y - 18, 34 * s, 0, 7); ctx.fill();
    } else if (o.type === 'jungle') {
      ctx.fillStyle = '#4a3320'; ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 0.6, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(12,70,32,.95)'; ctx.beginPath(); ctx.arc(o.x, o.y - 12, 64 * s, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(30,125,55,.92)'; ctx.beginPath(); ctx.arc(o.x - 14, o.y - 20, 42 * s, 0, 7); ctx.fill();
      ctx.fillStyle = '#ff7ab6'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(o.x + Math.cos(k * 1.9 + o.x) * 36 * s, o.y - 12 + Math.sin(k * 1.9 + o.x) * 36 * s, 3.5, 0, 7); ctx.fill(); }
    } else if (o.type === 'pine') {
      ctx.fillStyle = '#4a3320'; ctx.beginPath(); ctx.arc(o.x, o.y, 9, 0, 7); ctx.fill();
      for (let k = 0; k < 3; k++) {
        const w = (58 - k * 14) * s, y = o.y - 6 - k * 16 * s;
        TRI(o.x - w, y + 18, o.x, y - 30 * s, o.x + w, y + 18, '#1f5e3a');
        TRI(o.x - w * 0.55, y + 4, o.x, y - 30 * s, o.x + w * 0.55, y + 4, 'rgba(255,255,255,.88)');
      }
    } else if (o.type === 'cactus') {
      E(o.x, o.y - 8, 10, 28, '#3f8f4a'); E(o.x - 16, o.y - 14, 6, 13, '#3f8f4a'); E(o.x - 11, o.y - 4, 10, 5, '#3f8f4a'); E(o.x + 16, o.y - 8, 6, 11, '#3f8f4a'); E(o.x + 11, o.y + 1, 10, 5, '#3f8f4a');
      ctx.fillStyle = 'rgba(255,255,255,.6)'; for (let k = 0; k < 6; k++) ctx.fillRect(o.x - 6 + (k % 3) * 6, o.y - 28 + k * 5, 2, 2);
      E(o.x, o.y - 36, 4, 4, '#ff6fa8');
    } else if (o.type === 'acacia') {
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(o.x - 6, o.y - 30, 12, 34);
      E(o.x, o.y - 34, 74 * s, 22 * s, '#6b8f2a'); E(o.x + 12, o.y - 40, 46 * s, 14 * s, '#86ab3c');
    } else if (o.type === 'boulder') {
      E(o.x + 4, o.y + 8, o.r * 1.5, o.r * 1.1, 'rgba(0,0,0,.25)'); E(o.x, o.y, o.r * 1.4, o.r * 1.1, '#7b7f86'); E(o.x - 8, o.y - 10, o.r * 0.9, o.r * 0.65, '#9aa0a8'); E(o.x - 14, o.y - 16, o.r * 0.4, o.r * 0.3, '#c0c6cd');
    } else if (o.type === 'obsidian') {
      TRI(o.x - 26, o.y + 12, o.x - 4, o.y - 46 * s, o.x + 10, o.y + 12, '#1b1820'); TRI(o.x - 4, o.y + 12, o.x + 16, o.y - 30 * s, o.x + 30, o.y + 12, '#2a2530'); TRI(o.x - 10, o.y + 12, o.x - 2, o.y - 40 * s, o.x + 2, o.y - 10, 'rgba(255,90,30,.5)');
    } else if (o.type === 'bamboo') {
      for (let k = -1; k <= 1; k++) {
        ctx.fillStyle = '#7fb83a'; ctx.fillRect(o.x + k * 9 - 3, o.y - 50 * s, 6, 56 * s);
        ctx.fillStyle = '#5a8f26'; for (let j = 0; j < 4; j++) ctx.fillRect(o.x + k * 9 - 3, o.y - 50 * s + j * 14 * s, 6, 2);
        E(o.x + k * 9 + 8, o.y - 40 * s, 10, 3, '#4f9a2a');
      }
    } else if (o.type === 'blossom') {
      ctx.fillStyle = '#5b3a1e'; ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 0.5, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,170,200,.93)'; ctx.beginPath(); ctx.arc(o.x, o.y - 14, 50 * s, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,205,225,.92)'; ctx.beginPath(); ctx.arc(o.x - 12, o.y - 22, 32 * s, 0, 7); ctx.fill();
    } else if (o.type === 'shroom') {
      ctx.fillStyle = '#e8e0f0'; ctx.fillRect(o.x - 8, o.y - 14, 16, 26);
      E(o.x, o.y - 24, 52 * s, 34 * s, '#7a4bd6'); E(o.x - 8, o.y - 30, 34 * s, 20 * s, '#9a6af0');
      ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(o.x + Math.cos(k * 1.3 + o.x) * 30 * s, o.y - 24 + Math.sin(k * 1.3 + o.x) * 16 * s, 4, 0, 7); ctx.fill(); }
    } else if (o.type === 'mangrove') {
      for (let k = -2; k <= 2; k++) LINE(o.x + k * 10, o.y + 12, o.x + k * 17, o.y - 14, '#3b2f22', 3);
      ctx.fillStyle = 'rgba(40,100,80,.94)'; ctx.beginPath(); ctx.arc(o.x, o.y - 20, 48 * s, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(62,140,108,.9)'; ctx.beginPath(); ctx.arc(o.x - 10, o.y - 28, 30 * s, 0, 7); ctx.fill();
    }
  }

  // smell ring + highlights
  if (smelling) {
    const rad = 120 + (4 - me.smellTime) * 220;
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(me.x, me.y, rad, 0, 7); ctx.stroke();
    for (const o of others.values()) {
      const dist = Math.hypot(o.x - me.x, o.y - me.y);
      if (!o.h && dist < 1000) { ctx.strokeStyle = '#ff5a5a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(o.x, o.y, 30, 0, 7); ctx.stroke(); }
    }
  }
  }
  ctx.restore();

  // edge arrows while smelling
  if (smelling && me.loc < 0) {
    const targets = [];
    for (const l of leaves.values()) { const d = Math.hypot(l.x - me.x, l.y - me.y); if (d < 800 && d > Math.min(W, H) / 2.2) targets.push({ x: l.x, y: l.y, c: '#ffe066' }); }
    for (const o of others.values()) { const d = Math.hypot(o.x - me.x, o.y - me.y); if (!o.h && d < 1200 && d > Math.min(W, H) / 2.2) targets.push({ x: o.x, y: o.y, c: '#ff5a5a' }); }
    for (const tg of targets) {
      const a = Math.atan2(tg.y - me.y, tg.x - me.x), r = Math.min(W, H) / 2 - 30;
      ctx.save(); ctx.translate(W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r); ctx.rotate(a);
      ctx.fillStyle = tg.c; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -6); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill(); ctx.restore();
    }
  }

  // underwater tint
  if (me.dive && me.loc < 0) {
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(0,30,60,0)'); v.addColorStop(1, 'rgba(0,15,35,.6)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(30,120,200,.12)'; ctx.fillRect(0, 0, W, H);
  }
  if (me.flash > 0) { ctx.fillStyle = `rgba(220,245,255,${me.flash * 1.2})`; ctx.fillRect(0, 0, W, H); }

  if (me.loc < 0 && !me.dive) drawBiomeFx(W, H, t);

  // day / night
  const dark = me.loc >= 0 ? 0 : darkness();
  if (me.loc >= 0) drawCaveLight(cx, cy, W, H, t);
  if (dark > 0) {
    if (me.nightVision) {
      ctx.fillStyle = `rgba(0,40,10,${0.35 * dark})`; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = `rgba(80,255,120,${0.10 * dark})`; ctx.fillRect(0, 0, W, H);
    } else {
      const g = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, Math.max(W, H) * 0.55);
      g.addColorStop(0, `rgba(5,8,30,${0.25 * dark})`);
      g.addColorStop(0.35, `rgba(5,8,30,${0.8 * dark})`);
      g.addColorStop(1, `rgba(2,3,15,${0.96 * dark})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  }

  if (me.loc < 0 && !me.dive && dark > 0) drawNightGlow(cx, cy, W, H, t, dark);

  drawBombFx(W, H);
  drawMinimap(W, H);
}

function drawMinimap(W, H) {
  const mw = 130, mx = W - mw - 12, my = H - mw - 12;
  const ms = mw / (me.loc >= 0 ? caveDefs[me.loc].W : WORLD);
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(mx, my, mw, mw);
  if (me.loc >= 0) {
    const cv = caveDefs[me.loc]; ctx.fillStyle = 'rgba(160,140,110,.55)'; ctx.strokeStyle = 'rgba(160,140,110,.55)';
    for (const c of cv.chambers) { ctx.beginPath(); ctx.arc(mx + c.x * ms, my + c.y * ms, c.r * ms, 0, 7); ctx.fill(); }
    for (const k of cv.corridors) { const a = cv.chambers[k.a], b = cv.chambers[k.b]; ctx.lineWidth = k.w * ms; ctx.beginPath(); ctx.moveTo(mx + a.x * ms, my + a.y * ms); ctx.lineTo(mx + b.x * ms, my + b.y * ms); ctx.stroke(); }
    ctx.fillStyle = '#fff6c8'; for (const ex of cv.exits) { ctx.beginPath(); ctx.arc(mx + ex.x * ms, my + ex.y * ms, 3, 0, 7); ctx.fill(); }
  } else {
    const cell = mw / 20; ctx.globalAlpha = 0.8;
    for (let gx = 0; gx < 20; gx++) for (let gy = 0; gy < 20; gy++) {
      ctx.fillStyle = BIOME_COL[biomeAt(biomes, (gx + 0.5) * WORLD / 20, (gy + 0.5) * WORLD / 20)][0];
      ctx.fillRect(mx + gx * cell, my + gy * cell, cell + 0.5, cell + 0.5);
    }
    ctx.globalAlpha = 1;
    for (const e of entrances) { ctx.fillStyle = e.water ? '#6fc3ff' : '#c9c2b4'; ctx.beginPath(); ctx.arc(mx + e.x * ms, my + e.y * ms, 3, 0, 7); ctx.fill(); }
  }
  ctx.fillStyle = 'rgba(60,130,200,.7)';
  for (const p of (me.loc < 0 ? ponds : [])) { ctx.beginPath(); ctx.arc(mx + p.x * ms, my + p.y * ms, p.r * ms, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.arc(mx + me.x * ms, my + me.y * ms, 4, 0, 7); ctx.fill();
  ctx.fillStyle = '#ff6b6b';
  for (const o of others.values()) { if (o.h) continue; ctx.beginPath(); ctx.arc(mx + o.x * ms, my + o.y * ms, 3, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#fff'; ctx.font = '12px Segoe UI'; ctx.textAlign = 'left';
  ctx.fillText(`Players: ${others.size + 1}`, mx, my - 6);
}

// speed lines while dive bombing
function drawBombFx(W, H) {
  if (!(me.lunge && me.lunge.bomb)) return;
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2;
  const t = performance.now() / 1000;
  for (let i = 0; i < 26; i++) {
    const a = i * 0.2417 + t * 0.5, r0 = Math.min(W, H) * (0.32 + ((i * 37) % 10) / 60), r1 = r0 + 70 + (i % 5) * 26;
    ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0); ctx.lineTo(W / 2 + Math.cos(a) * r1, H / 2 + Math.sin(a) * r1); ctx.stroke();
  }
  ctx.restore();
}

// 2D overlay drawn on top of the 3D view (weather, labels, minimap)
function drawHud3D(W, H, t) {
  ctx.clearRect(0, 0, W, H);
  if (me.loc < 0 && !me.dive) drawBiomeFx(W, H, t);
  if (me.nightVision) { ctx.fillStyle = 'rgba(60,255,120,.10)'; ctx.fillRect(0, 0, W, H); }
  if (me.dive) { ctx.fillStyle = 'rgba(30,120,200,.10)'; ctx.fillRect(0, 0, W, H); }
  if (me.flash > 0) { ctx.fillStyle = `rgba(220,245,255,${me.flash * 1.2})`; ctx.fillRect(0, 0, W, H); }
  drawBombFx(W, H);
  V3.drawLabels(ctx, W, H);
  drawMinimap(W, H);
}

// ===================== Loop =====================
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const want3d = playing && view3d && has3d();
  if (has3d() && V3.active !== want3d) { V3.setActive(want3d); document.body.classList.toggle('mode3d', want3d); }
  if (playing) {
    update(dt);
    if (want3d) { V3.render(dt, now); drawHud3D(canvas.width, canvas.height, now / 1000); } else draw();
  } else { ctx.fillStyle = '#12261a'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
