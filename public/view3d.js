'use strict';
// ============================================================================
// 3D view (Three.js). Reads the game state owned by game.js (me, others, ...).
// ============================================================================
window.V3 = (function () {
  const out = { ready: false, yaw: -Math.PI / 2, pitch: 0.5, zoom: 1 };
  if (typeof THREE === 'undefined') return out;
  const T = THREE;

  let renderer, canvas3;
  try {
    canvas3 = document.createElement('canvas'); canvas3.id = 'game3d';
    document.body.insertBefore(canvas3, document.getElementById('game'));
    renderer = new T.WebGLRenderer({ canvas: canvas3, antialias: true });
  } catch (e) { console.warn('WebGL unavailable', e); if (canvas3 && canvas3.parentNode) canvas3.parentNode.removeChild(canvas3); return out; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(62, 1, 2, 14000);
  const hemi = new T.HemisphereLight(0xdff2ff, 0x4a5a3a, 0.7); scene.add(hemi);
  const sun = new T.DirectionalLight(0xfff2d8, 0.7); sun.position.set(500, 900, 300); scene.add(sun);
  const plight = new T.PointLight(0xffffff, 0, 520, 1.4); scene.add(plight);
  scene.background = new T.Color(0x8ec8f0);
  scene.fog = new T.Fog(0x8ec8f0, 300, 1800);

  // ---------------------------------------------------------------- helpers
  const geo = {
    sphere: new T.SphereGeometry(1, 12, 9), sphereLo: new T.SphereGeometry(1, 7, 5),
    cyl: new T.CylinderGeometry(1, 1, 1, 8), cone: new T.ConeGeometry(1, 1, 8), box: new T.BoxGeometry(1, 1, 1),
    oct: new T.OctahedronGeometry(1, 0), ico: new T.IcosahedronGeometry(1, 0), dodec: new T.DodecahedronGeometry(1, 0),
    circle: new T.CircleGeometry(1, 48), plane: new T.PlaneGeometry(1, 1), torus: new T.TorusGeometry(1, 0.08, 6, 24),
  };
  const matCache = new Map();
  function M(color, extra) {
    const key = color + (extra ? JSON.stringify(extra) : '');
    let m = matCache.get(key);
    if (!m) { m = new T.MeshStandardMaterial(Object.assign({ color, roughness: 0.92, metalness: 0, flatShading: true }, extra || {})); matCache.set(key, m); }
    return m;
  }
  const BM = (color, extra) => new T.MeshBasicMaterial(Object.assign({ color }, extra || {}));
  function mesh(g, color, sx, sy, sz, x, y, z, parent, extra) {
    const m = new T.Mesh(g, typeof color === 'string' ? M(color, extra) : color);
    m.scale.set(sx, sy, sz); m.position.set(x, y, z); if (parent) parent.add(m); return m;
  }
  const UP = new T.Vector3(0, 1, 0);
  function limb(parent, color, r, a, b, extra) { // cylinder from point a to point b
    const dir = new T.Vector3().subVectors(b, a), len = dir.length();
    const m = new T.Mesh(geo.cyl, M(color, extra)); m.scale.set(r, len, r);
    m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(UP, dir.normalize()); parent.add(m); return m;
  }
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const css = (c) => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c); return m ? '#' + [1, 2, 3].map((i) => (+m[i]).toString(16).padStart(2, '0')).join('') : c; };
  const rgbOf = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const frand = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  // ---------------------------------------------------------------- animals
  const LEG = { croc: 0.35, komodo: 0.35, salamander: 0.3, frog: 0.4, turtle: 0.35, otter: 0.45, beaver: 0.5, hedgehog: 0.4, penguin: 0.4, capybara: 0.6,
    badger: 0.55, skunk: 0.6, marmot: 0.55, hippo: 0.6, bear: 0.9, polarbear: 0.9, panda: 0.8, rhino: 0.8, gorilla: 0.9, raccoon: 0.65, squirrel: 0.6, rabbit: 0.55,
    deer: 1.25, elk: 1.3, horse: 1.3, zebra: 1.2, llama: 1.35, camel: 1.3, sheep: 0.8, goat: 1.0, boar: 0.7 };
  // looks for the animals that are hand-drawn in the 2D view (the others come from SPEC in game.js)
  const EX = {
    wolf: { coat: '#80858e', belly: '#d3d6db', leg: '#575b63', tail: 'bushy', tip: '#33363c', ear: 'point', earCol: '#4a4d54', snout: 0.9, snoutW: 0.4, snoutCol: '#c3c7cd', eye: '#f2c230', head: 0.52, ridge: '#5c6068' },
    deer: { coat: '#a8743f', belly: '#f1e0c4', leg: '#6e4a2a', tail: 'stub', tailCol: '#ffffff', ear: 'flap', earCol: '#a8743f', snout: 0.8, snoutW: 0.3, snoutCol: '#d8b88e', eye: '#3a2412', head: 0.38, antlers: true, longneck: true, young: '#fff3d9' },
    rabbit: { coat: '#d8cdbd', belly: '#fbf6ee', leg: '#cfc3b1', tail: 'stub', tailCol: '#ffffff', ear: 'long', snout: 0.3, snoutCol: '#faf4ea', nose: '#e58b9a', eye: '#222222', head: 0.5 },
    fox: { coat: '#e0702a', belly: '#fff2df', leg: '#26211f', tail: 'bushy', tip: '#ffffff', ear: 'point', earCol: '#e0702a', snout: 0.55, snoutW: 0.3, snoutCol: '#f6c79a', eye: '#f0c040', head: 0.46 },
    otter: { coat: '#6a4a30', belly: '#d6bc96', leg: '#4d3722', tail: 'long', ear: 'small', snout: 0.3, snoutW: 0.5, snoutCol: '#e2cba8', eye: '#222222', head: 0.46 },
    lynx: { coat: '#c9a56e', belly: '#efe2c6', leg: '#b79458', tail: 'short', tip: '#1c1c1c', ear: 'point', earCol: '#c9a56e', marks: 'spots', markCol: '#5a4326', snout: 0.3, snoutCol: '#f4ead7', nose: '#c97d82', eye: '#e6c84a', head: 0.5, ruff: true, tufts: true },
    bear: { coat: '#5a3b24', belly: '#6a4630', leg: '#3b2718', legR: 0.5, tail: 'stub', ear: 'round', snout: 0.5, snoutCol: '#b08c64', eye: '#1a1a1a', head: 0.6 },
    croc: { coat: '#4d7c3a', belly: '#7fa85c', leg: '#355a28', spread: 1.35, tail: 'long', ear: 'none', snout: 2.0, snoutW: 0.5, snoutCol: '#5d8a45', eye: '#e6c84a', head: 0.42, ridges: true },
    squirrel: { coat: '#9a5a2e', belly: '#ecd9b8', leg: '#8a4f26', tail: 'bushy', tailUp: true, tailCol: '#a35a2c', ear: 'point', snout: 0.3, snoutCol: '#ecd9b8', eye: '#222222', head: 0.5 },
    hedgehog: { coat: '#3f3023', belly: '#e0c29c', leg: '#c9a27a', tail: 'none', ear: 'small', earCol: '#d8b894', snout: 0.5, snoutCol: '#ecd3b0', eye: '#3a2a1a', head: 0.42, spikes: true },
    coyote: { coat: '#b59a72', belly: '#ead9ba', leg: '#7d6a4c', tail: 'bushy', tip: '#2e2a24', ear: 'point', earBig: true, earCol: '#a48b64', snout: 0.9, snoutW: 0.3, snoutCol: '#d8c4a0', eye: '#e0b030', head: 0.46 },
    beaver: { coat: '#7a5232', belly: '#a47a52', leg: '#4a3320', tail: 'paddle', tailCol: '#3b2a1c', ear: 'small', snout: 0.4, snoutCol: '#b88f66', eye: '#222222', head: 0.5, teeth: true },
    boar: { coat: '#5b4a40', belly: '#4a3b32', leg: '#2e241d', tail: 'stub', ear: 'point', earCol: '#3a2d25', ridge: '#2a1f19', snout: 1.0, snoutW: 0.5, snoutCol: '#6b574a', nose: '#c99a88', eye: '#222222', head: 0.62, tusks: true },
    elk: { coat: '#8c5a34', belly: '#dcc6a0', leg: '#5b3a22', tail: 'stub', tailCol: '#e9d9bd', ear: 'flap', earCol: '#6a4228', snout: 1.0, snoutCol: '#b89870', eye: '#2a1a0e', head: 0.4, antlers: true, longneck: true, young: '#f3e3c4', neckCol: '#4d3220' },
    panther: { coat: '#1d1d24', belly: '#2a2a34', leg: '#14141a', tail: 'thin', ear: 'round', snout: 0.35, snoutCol: '#2c2c36', nose: '#6b3b44', eye: '#9dff5a', head: 0.5 },
    lion: { coat: '#d6a85a', belly: '#ecd29a', leg: '#b8894a', tail: 'thin', tip: '#5a3a1a', ear: 'round', earCol: '#c79a52', snout: 0.4, snoutCol: '#ecd29a', eye: '#e0a020', head: 0.52, mane: '#6f4220' },
  };
  const specOf = (k) => Object.assign({ coat: '#888888' }, EX[k] || (typeof SPEC !== 'undefined' && SPEC[k]) || EX.wolf);
  const SPOTS3 = [[-.7, -.5], [-.45, .35], [-.2, -.4], [.05, .5], [.3, -.45], [-.6, .1], [.2, .1], [-.1, 0], [.55, .3], [.5, -.2], [-.3, .55], [.7, -.1]];

  function buildBird(key, stage, sp, d) {
    const s = d.size, hs = [1.3, 1.15, 1, 1][stage], pe = stage === 0 ? 1.4 : 1;
    const g = new T.Group(), body = new T.Group(); g.add(body);
    const by = s * 0.95, wings = [];
    mesh(geo.sphere, sp.coat, s * 1.1, s * 0.7, s * 0.72, 0, by, 0, body);
    mesh(geo.sphere, sp.belly, s * 0.95, s * 0.5, s * 0.62, s * 0.12, by - s * 0.22, 0, body);
    const H = s * (sp.head || 0.5) * hs, hx = s * 1.05, hy = by + s * 0.42;
    mesh(geo.sphere, sp.whiteHead ? '#f4f1ea' : sp.coat, H, H * 0.95, H * 0.95, hx, hy, 0, body);
    if (sp.disc) mesh(geo.sphere, '#efe3c8', H * 0.35, H * 0.8, H * 0.85, hx + H * 0.55, hy, 0, body);
    if (sp.throat) mesh(geo.sphere, sp.throat, H * 0.4, H * 0.3, H * 0.5, hx + H * 0.3, hy - H * 0.3, 0, body);
    if (sp.ears) for (const sd of [-1, 1]) mesh(geo.cone, sp.coat, H * 0.3, H * 0.9, H * 0.2, hx - H * 0.1, hy + H * 0.9, sd * H * 0.5, body);
    const beak = mesh(geo.cone, sp.beak, H * 0.28, H * (sp.longBeak ? 2.4 : 1.0), H * 0.28, hx + H * (sp.longBeak ? 1.7 : 1.15), hy - H * 0.1, 0, body); beak.rotation.z = -Math.PI / 2;
    for (const sd of [-1, 1]) { mesh(geo.sphereLo, sp.eye || '#ffffff', H * 0.2 * pe, H * 0.2 * pe, H * 0.2 * pe, hx + H * 0.5, hy + H * 0.2, sd * H * 0.6, body); mesh(geo.sphereLo, '#111111', H * 0.1 * pe, H * 0.1 * pe, H * 0.1 * pe, hx + H * 0.62, hy + H * 0.2, sd * H * 0.62, body); }
    mesh(geo.sphere, sp.wing, s * (sp.tailLen || 0.8) * 1.1, s * 0.09, s * 0.5, -s * 1.5, by, 0, body);
    for (const sd of [-1, 1]) {
      const pivot = new T.Group(); pivot.position.set(0, by + s * 0.2, sd * s * 0.5); body.add(pivot);
      mesh(geo.sphere, sp.wing, s * (sp.bat ? 0.9 : 0.6), s * 0.07, s * (sp.bat ? 1.9 : 1.5), -s * 0.1, 0, sd * s * (sp.bat ? 1.7 : 1.4), pivot);
      wings.push({ pivot, dir: sd });
    }
    const legs = [];
    for (const sd of [-1, 1]) { const lp = new T.Group(); lp.position.set(0, by - s * 0.4, sd * s * 0.28); mesh(geo.cyl, sp.beak, s * 0.07, s * 0.55, s * 0.07, 0, -s * 0.25, 0, lp); g.add(lp); }
    return { g, body, legs, wings, bat: !!sp.bat, phase2: 0, key, stage, bodyY: by, headY: hy + H * 1.6, size: s, alpha: 1, cloned: false, phase: Math.random() * 6 };
  }

  function buildAnimal(key, stage) {
    const d = ANIMALS[key] || ANIMALS.wolf, sp = specOf(key);
    if (sp.bird) return buildBird(key, stage, sp, d);
    const s = d.size, L = d.L * s, B = d.B * s;
    const hs = [1.4, 1.2, 1, 1][stage], pe = stage === 0 ? 1.4 : 1;
    const legH = s * (LEG[key] !== undefined ? LEG[key] * 0.82 : 0.72);
    const bodyY = legH + B * 0.72;
    const g = new T.Group(), body = new T.Group(); g.add(body);
    const legs = [];
    const legCol = sp.leg || sp.coat, lr = s * (sp.legR || 0.32) * 0.55, spread = sp.spread || 0.9;
    for (let i = 0; i < 4; i++) {
      const fx = i < 2 ? L * 0.55 : -L * 0.55, sd = i % 2 ? 1 : -1, hipY = bodyY - B * 0.15, len = hipY;
      const pivot = new T.Group(); pivot.position.set(fx, hipY, sd * B * spread * 0.8);
      mesh(geo.cyl, legCol, lr, len, lr, 0, -len / 2, 0, pivot);
      mesh(geo.sphereLo, legCol, lr * 1.5, lr * 0.8, lr * 1.3, lr * 0.5, -len + lr * 0.4, 0, pivot);
      g.add(pivot); legs.push({ pivot, dir: (i === 1 || i === 2) ? 1 : -1 });
    }
    // body
    if (sp.bumps) for (let i = 0; i < 22; i++) { const a = frand(i) * 6.283, e = frand(i + 50) * 1.2; mesh(geo.sphereLo, sp.bumps, s * 0.36, s * 0.34, s * 0.36, Math.cos(a) * L * 0.9 * Math.cos(e), bodyY + Math.sin(e) * B * 0.9, Math.sin(a) * B * 0.95 * Math.cos(e), body); }
    mesh(geo.sphere, sp.coat, L, B * 0.85, B, 0, bodyY, 0, body);
    mesh(geo.sphere, sp.belly || sp.coat, L * (sp.bellyBig ? 0.92 : 0.8), B * (sp.bellyBig ? 0.8 : 0.55), B * 0.93, L * 0.05, bodyY - B * 0.25, 0, body);
    if (sp.ridge) mesh(geo.sphere, sp.ridge, L * 0.7, B * 0.16, B * 0.3, L * 0.2, bodyY + B * 0.78, 0, body);
    const mk = sp.marks, mc = sp.markCol || '#222222';
    if (mk === 'stripes') for (let i = 0; i < 8; i++) { const u = -0.8 + i * 0.22, r = Math.sqrt(Math.max(0.05, 1 - u * u)); const t = mesh(geo.torus, mc, B * r * 0.99, B * r * 0.88 * 0.99, s * 0.7, L * u, bodyY, 0, body); t.rotation.y = Math.PI / 2; t.scale.set(B * r * 1.0, B * r * 0.86, s * 1.4); }
    else if (mk === 'spots' || mk === 'rosettes') for (const [px, py] of SPOTS3) {
      const top = Math.sqrt(Math.max(0, 1 - px * px - py * py)); if (top < 0.15) continue;
      mesh(geo.sphereLo, mc, s * (mk === 'rosettes' ? 0.2 : 0.11), s * 0.05, s * (mk === 'rosettes' ? 0.17 : 0.1), L * px, bodyY + B * 0.85 * top, B * py, body);
    }
    else if (mk === 'patches') { mesh(geo.sphere, mc, L * 0.38, B * 0.87, B * 1.02, L * 0.5, bodyY, 0, body); mesh(geo.sphere, mc, L * 0.32, B * 0.87, B * 1.02, -L * 0.75, bodyY, 0, body); }
    else if (mk === 'stripe1') mesh(geo.sphere, mc, L * 0.95, B * 0.12, B * 0.26, 0, bodyY + B * 0.84, 0, body);
    if (key === 'deer' || key === 'elk') { if (stage <= 1) for (let i = 0; i < 10; i++) mesh(geo.sphereLo, sp.young, s * 0.1, s * 0.05, s * 0.1, -L * 0.7 + (i % 5) * L * 0.33, bodyY + B * 0.78, (i < 5 ? -1 : 1) * B * 0.45, body); }
    if (sp.extra === 'humps2') { mesh(geo.sphere, sp.hump || sp.coat, s * 0.55, s * 0.7, s * 0.5, L * 0.2, bodyY + B * 0.9, 0, body); mesh(geo.sphere, sp.hump || sp.coat, s * 0.55, s * 0.7, s * 0.5, -L * 0.45, bodyY + B * 0.9, 0, body); }
    if (sp.extra === 'hump1') mesh(geo.sphere, sp.hump || sp.coat, s * 0.8, s * 0.7, B * 0.9, L * 0.3, bodyY + B * 0.7, 0, body);
    if (sp.extra === 'flippers') for (const sd of [-1, 1]) { const f = mesh(geo.sphere, sp.hump || '#14161b', s * 0.7, s * 0.1, s * 0.22, L * 0.1, bodyY + B * 0.1, sd * B * 1.0, body); f.rotation.x = sd * 0.5; }
    if (sp.shell) { mesh(geo.sphere, sp.shell, L * 1.0, B * 0.85, B * 1.0, -L * 0.05, bodyY + B * 0.3, 0, body); mesh(geo.sphere, '#5d8c45', L * 0.75, B * 0.6, B * 0.8, -L * 0.05, bodyY + B * 0.55, 0, body); }
    if (sp.spikes) for (let i = 0; i < 70; i++) {
      const a = frand(i) * 6.283, e = 0.05 + frand(i + 9) * 1.35, nx = Math.cos(a) * Math.cos(e), ny = Math.sin(e), nz = Math.sin(a) * Math.cos(e);
      if (nx > 0.8) continue;
      const c = new T.Mesh(geo.cone, M(i % 2 ? '#8b6f4f' : '#2f241a')); c.scale.set(s * 0.1, s * 0.5, s * 0.1);
      c.position.set(nx * L * 0.95, bodyY + ny * B * 0.9 + s * 0.15, nz * B); c.quaternion.setFromUnitVectors(UP, V(nx, ny, nz).normalize()); body.add(c);
    }
    if (sp.ridges) for (let i = 0; i < 9; i++) mesh(geo.cone, '#2f4f23', s * 0.12, s * 0.28, s * 0.12, L * 0.8 - i * (L * 1.8 / 9), bodyY + B * 0.85, 0, body);
    // tail
    const tc = sp.tailCol || sp.coat, tx = -L * 0.95, ty = bodyY + B * 0.15;
    switch (sp.tail) {
      case 'bushy': { const t1 = mesh(geo.sphere, tc, s * 0.8, s * 0.27, s * 0.27, tx - s * 0.5, ty + (sp.tailUp ? s * 0.5 : 0), 0, body); t1.rotation.z = sp.tailUp ? 0.9 : -0.25; if (sp.tip) mesh(geo.sphere, sp.tip, s * 0.3, s * 0.22, s * 0.22, tx - s * 1.1, ty - s * 0.15, 0, body); break; }
      case 'thin': limb(body, tc, s * 0.09, V(tx, ty, 0), V(tx - s * 1.5, ty - s * 0.2, 0)); if (sp.tip) mesh(geo.sphere, sp.tip, s * 0.2, s * 0.17, s * 0.17, tx - s * 1.6, ty - s * 0.22, 0, body); break;
      case 'short': mesh(geo.sphere, tc, s * 0.38, s * 0.2, s * 0.2, tx - s * 0.2, ty, 0, body); if (sp.tip) mesh(geo.sphere, sp.tip, s * 0.16, s * 0.15, s * 0.15, tx - s * 0.5, ty, 0, body); break;
      case 'stub': mesh(geo.sphere, tc, s * 0.22, s * 0.16, s * 0.16, tx - s * 0.1, ty, 0, body); break;
      case 'long': limb(body, tc, s * 0.2, V(tx, ty - s * 0.1, 0), V(tx - s * 1.2, ty - s * 0.3, 0)); limb(body, tc, s * 0.1, V(tx - s * 1.2, ty - s * 0.3, 0), V(tx - s * 2.2, ty - s * 0.25, 0)); break;
      case 'paddle': mesh(geo.sphere, tc, s * 0.9, s * 0.1, s * 0.45, tx - s * 0.7, ty - s * 0.2, 0, body); break;
    }
    // head
    const longneck = !!sp.longneck, neckUp = longneck ? s * 0.8 : 0;
    const H = s * (sp.head || 0.5) * hs;
    const hx = L * 0.9 + (longneck ? s * 0.55 : 0), hy = bodyY + B * 0.32 + neckUp;
    if (longneck) limb(body, sp.neckCol || sp.coat, s * 0.3, V(L * 0.7, bodyY + B * 0.2, 0), V(hx - H * 0.3, hy - H * 0.2, 0));
    const head = new T.Group(); head.position.set(hx, hy, 0); body.add(head);
    const ec = sp.earCol || sp.coat, eb = sp.earBig ? 1.35 : 1;
    for (const sd of [-1, 1]) {
      switch (sp.ear) {
        case 'point': { const e = mesh(geo.cone, ec, H * 0.3 * eb, H * 0.85 * eb, H * 0.2, -H * 0.15, H * 0.95, sd * H * 0.5, head); e.rotation.x = -sd * 0.35; break; }
        case 'round': mesh(geo.sphere, ec, H * 0.34 * eb, H * 0.34 * eb, H * 0.2, -H * 0.15, H * 0.82, sd * H * 0.62 * eb, head); break;
        case 'long': { const e = mesh(geo.sphere, ec, H * 0.18, H * 1.15, H * 0.14, -H * 0.2, H * 1.3, sd * H * 0.35, head); e.rotation.x = -sd * 0.25; break; }
        case 'flap': { const e = mesh(geo.sphere, ec, H * 0.35, H * 0.12, H * 0.6, -H * 0.25, H * 0.3, sd * H * 1.0, head); e.rotation.x = sd * 0.35; break; }
        case 'small': mesh(geo.sphere, ec, H * 0.2, H * 0.2, H * 0.14, -H * 0.2, H * 0.78, sd * H * 0.6, head); break;
      }
    }
    if (sp.tufts) for (const sd of [-1, 1]) limb(head, '#111111', H * 0.05, V(-H * 0.15, H * 1.5, sd * H * 0.55), V(-H * 0.25, H * 2.0, sd * H * 0.6));
    if (sp.ruff) for (const sd of [-1, 1]) mesh(geo.sphere, '#f1e8d6', H * 0.5, H * 0.45, H * 0.35, -H * 0.1, -H * 0.15, sd * H * 0.85, head);
    if (sp.mane && stage >= 2) { const mk2 = stage === 3 ? 1.15 : 1; mesh(geo.sphere, sp.mane, H * 1.1 * mk2, H * 1.45 * mk2, H * 1.5 * mk2, -H * 0.5, -H * 0.1, 0, head); for (let i = 0; i < 12; i++) { const a = i * 0.52; mesh(geo.sphereLo, '#7f4c26', H * 0.5, H * 0.45, H * 0.45, -H * 0.5, Math.sin(a) * H * 1.3 * mk2, Math.cos(a) * H * 1.35 * mk2, head); } }
    if (sp.extra === 'horns' || sp.horns) for (const sd of [-1, 1]) { limb(head, '#bfb39a', H * 0.12, V(-H * 0.1, H * 0.8, sd * H * 0.5), V(-H * 0.5, H * 1.35, sd * H * 0.95)); limb(head, '#bfb39a', H * 0.08, V(-H * 0.5, H * 1.35, sd * H * 0.95), V(-H * 0.3, H * 1.7, sd * H * 0.75)); }
    if (sp.antlers && stage >= 2) {
      const k = stage === 3 ? 1.3 : 1;
      for (const sd of [-1, 1]) {
        const base = V(-H * 0.15, H * 0.85, sd * H * 0.4), tip = V(-H * 0.7, H * 2.5 * k, sd * H * 1.0 * k);
        limb(head, '#e8dcc0', H * 0.1, base, tip);
        for (let j = 1; j <= 3; j++) { const p = base.clone().lerp(tip, j / 4); limb(head, '#e8dcc0', H * 0.07, p, V(p.x + H * 0.5, p.y + H * 0.35 * k, p.z + sd * H * 0.15)); }
      }
    }
    mesh(geo.sphere, sp.headCol || sp.coat, H, H * 0.9, H * 0.92, 0, 0, 0, head);
    const sl = (sp.snout === undefined ? 0.5 : sp.snout) * H, sw = (sp.snoutW || 0.36) * H;
    mesh(geo.sphere, sp.snoutCol || sp.coat, sl * 0.5 + H * 0.35, sw * 0.85, sw, H * 0.55 + sl * 0.5, -H * 0.12, 0, head);
    mesh(geo.sphereLo, sp.nose || '#111111', H * 0.14, H * 0.13, H * 0.17, H * 0.85 + sl, -H * 0.08, 0, head);
    if (sp.face === 'mask') for (const sd of [-1, 1]) mesh(geo.sphere, '#2a2a2a', H * 0.5, H * 0.28, H * 0.3, H * 0.3, H * 0.2, sd * H * 0.5, head);
    if (sp.face === 'panda') for (const sd of [-1, 1]) mesh(geo.sphere, '#111111', H * 0.28, H * 0.34, H * 0.2, H * 0.4, H * 0.22, sd * H * 0.55, head);
    if (sp.face === 'badger') for (const sd of [-1, 1]) mesh(geo.sphere, '#222222', H * 0.9, H * 0.12, H * 0.2, H * 0.3, H * 0.62, sd * H * 0.42, head);
    if (sp.face === 'frog') for (const sd of [-1, 1]) mesh(geo.sphere, sp.coat, H * 0.4, H * 0.4, H * 0.4, H * 0.1, H * 0.7, sd * H * 0.6, head);
    if (sp.face === 'beard') mesh(geo.sphere, '#d8d0bc', H * 0.18, H * 0.3, H * 0.18, H * 0.9 + sl, -H * 0.5, 0, head);
    if (sp.tusks) for (const sd of [-1, 1]) { const t = mesh(geo.cone, '#f4eedc', H * 0.12, H * 0.5, H * 0.12, H * 1.1 + sl * 0.5, -H * 0.15, sd * H * 0.5, head); t.rotation.z = -1.0; }
    if (sp.teeth) for (const sd of [-1, 1]) mesh(geo.box, '#ffd27a', H * 0.1, H * 0.22, H * 0.1, H * 1.05 + sl, -H * 0.4, sd * H * 0.08, head);
    if (sp.extra === 'horn1') { const h1 = mesh(geo.cone, '#ece6d4', H * 0.2, H * 0.9, H * 0.2, H * 0.9 + sl * 0.7, H * 0.25, 0, head); h1.rotation.z = -0.7; }
    if (key === 'croc') for (let i = 0; i < 5; i++) for (const sd of [-1, 1]) mesh(geo.cone, '#f5f5e8', H * 0.05, H * 0.12, H * 0.05, H * (0.8 + i * 0.5), -H * 0.32, sd * H * 0.42, head).rotation.x = Math.PI;
    for (const sd of [-1, 1]) {
      const ex = sp.face === 'frog' ? H * 0.2 : H * 0.5, ey = sp.face === 'frog' ? H * 0.9 : H * 0.28, ez = sp.face === 'frog' ? H * 0.6 : H * (sp.eyeOff ? sp.eyeOff * 1.2 : 0.6);
      mesh(geo.sphereLo, sp.eye || '#222222', H * 0.17 * pe, H * 0.17 * pe, H * 0.17 * pe, ex, ey, sd * ez, head);
      mesh(geo.sphereLo, '#050505', H * 0.09 * pe, H * 0.1 * pe, H * 0.09 * pe, ex + H * 0.1 * pe, ey, sd * ez, head);
    }
    if (stage === 3) mesh(geo.sphere, '#e9e9e9', sl * 0.4 + H * 0.2, sw * 0.5, sw * 0.7, H * 0.7 + sl * 0.4, -H * 0.2, 0, head, { transparent: true, opacity: 0.5 });
    return { g, body, legs, key, stage, bodyY, headY: hy + H * 1.4, size: s, alpha: 1, cloned: false, phase: Math.random() * 6 };
  }

  const shadowMat = new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false });
  const actors = new Map();
  function getActor(id, key, stage) {
    let a = actors.get(id);
    if (!a || a.key !== key || a.stage !== stage) {
      if (a) scene.remove(a.root);
      a = buildAnimal(key, stage);
      a.root = new T.Group(); a.root.add(a.g);
      const sh = new T.Mesh(geo.circle, shadowMat); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.6;
      const d = ANIMALS[key] || ANIMALS.wolf; sh.scale.set(d.L * d.size * 1.1, d.B * d.size * 1.1, 1); a.shadow = sh; a.shadowBase = [d.L * d.size * 1.1, d.B * d.size * 1.1]; a.g.add(sh);
      a.root.userData.id = id; scene.add(a.root); actors.set(id, a);
    }
    return a;
  }
  function setAlpha(a, alpha) {
    if (a.alpha === alpha) return;
    if (!a.cloned) { a.g.traverse((o) => { if (o.isMesh) o.material = o.material.clone(); }); a.cloned = true; }
    a.g.traverse((o) => { if (o.isMesh) { o.material.transparent = alpha < 1; o.material.opacity = alpha; o.material.depthWrite = alpha >= 1; } });
    a.alpha = alpha;
  }
  function placeActor(a, x, y, angle, scale, o) {
    a.root.visible = true;
    const lift = (o.lift || 0) + (o.alt || 0);
    if (o.tree) { const k = 64 * scale; x += -Math.cos(out.yaw) * k; y += -Math.sin(out.yaw) * k; } // climbers sit on the near side of the canopy
    a.root.position.set(x, lift, y);
    a.g.rotation.y = -angle; a.g.rotation.z = -(o.pitch || 0);
    a.root.scale.setScalar(scale);
    a.shadow.position.y = (0.6 - lift) / scale; const sk = Math.max(0.35, 1 - (o.alt || 0) / 170); a.shadow.scale.set(a.shadowBase[0] * sk, a.shadowBase[1] * sk, 1);
    if (a.wings) { const up = (o.alt || 0) > 25; a.phase2 += o.dt * (a.bat ? 16 : 20); const f = up ? Math.sin(a.phase2) * 0.9 : 1.2; for (const w of a.wings) w.pivot.rotation.x = w.dir * f; }
    a.phase += o.dt * (o.moving ? (o.sprint ? 20 : 13) : 0);
    const sw = Math.sin(a.phase) * 0.7;
    for (const lg of a.legs) lg.pivot.rotation.z = o.moving ? sw * lg.dir : 0;
    const bob = o.moving ? Math.abs(Math.sin(a.phase)) * a.size * 0.06 : 0;
    a.body.position.y = bob + (o.jump ? Math.sin((o.jump / 0.55) * Math.PI) * 30 : 0);
    a.body.scale.y = o.rest ? 0.8 : 1;
    setAlpha(a, o.alpha === undefined ? 1 : o.alpha);
  }

  // ---------------------------------------------------------------- critters
  const critterMeshes = new Map();
  function buildCritter(c, bat) {
    const g = new T.Group();
    if (c.k === 'fish') {
      mesh(geo.sphere, '#ff9a3c', 9, 4.5, 3, 0, 0, 0, g); const t = mesh(geo.cone, '#ff7a1c', 4, 8, 1.5, -10, 0, 0, g); t.rotation.z = Math.PI / 2;
      mesh(geo.sphereLo, '#111111', 1.2, 1.2, 1.2, 5, 1.5, 2.6, g); g.userData.fish = true;
    } else if (bat) {
      mesh(geo.sphere, '#3b2f46', 6, 3.6, 3.6, 0, 0, 0, g);
      const w1 = mesh(geo.sphere, '#2b2233', 5, 0.8, 11, -1, 0, 8, g), w2 = mesh(geo.sphere, '#2b2233', 5, 0.8, 11, -1, 0, -8, g); g.userData.wings = [w1, w2];
      mesh(geo.sphereLo, '#ff5a5a', 0.9, 0.9, 0.9, 5, 0.6, 1.4, g); mesh(geo.sphereLo, '#ff5a5a', 0.9, 0.9, 0.9, 5, 0.6, -1.4, g);
    } else {
      mesh(geo.sphere, '#8a6d4f', 7, 4.6, 4.6, 0, 4, 0, g); mesh(geo.sphere, '#9a7c5c', 3.6, 3.2, 3.2, 6, 4, 0, g);
      mesh(geo.sphereLo, '#7a5d41', 1.8, 1.8, 1.2, 5, 7, 2.6, g); mesh(geo.sphereLo, '#7a5d41', 1.8, 1.8, 1.2, 5, 7, -2.6, g);
      mesh(geo.cyl, '#a88a6a', 0.7, 8, 0.7, -8, 3, 0, g).rotation.z = Math.PI / 2;
    }
    return g;
  }

  // ---------------------------------------------------------------- world (surface)
  let worldG = null, builtSeed = null, fruitMesh = null, leafMesh = null, gemMesh = null, fruitClock = 0;
  const buckets = new Map(), canopyMats = new Set();
  let seeThrough = false;
  function P(key, g, color, x, y, z, sx, sy, sz, ry, ex) {
    let b = buckets.get(key); if (!b) { b = { g, color, ex, list: [] }; buckets.set(key, b); }
    b.list.push(x, y, z, sx, sy, sz, ry || 0);
  }
  function flush(parent) {
    const d = new T.Object3D();
    for (const [key, b] of buckets) {
      const n = b.list.length / 7, im = new T.InstancedMesh(b.g, M(b.color, b.ex), n);
      for (let i = 0; i < n; i++) { const o = i * 7; d.position.set(b.list[o], b.list[o + 1], b.list[o + 2]); d.scale.set(b.list[o + 3], b.list[o + 4], b.list[o + 5]); d.rotation.set(0, b.list[o + 6], 0); d.updateMatrix(); im.setMatrixAt(i, d.matrix); }
      im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; parent.add(im);
      if (/\.c\d?$/.test(key)) canopyMats.add(im.material);
    }
    buckets.clear();
  }
  function addObstacle(o) {
    const s = o.s || 1, x = o.x, z = o.y, ry = (x * 0.013 + z * 0.021) % 6.283;
    switch (o.type) {
      case 'tree': P('tree.t', geo.cyl, '#5b3a1e', x, 24, z, 8, 48, 8); P('tree.c1', geo.sphere, '#1f5a2c', x, 66 * s, z, 42 * s, 36 * s, 42 * s, ry); P('tree.c2', geo.sphere, '#2f7a3c', x - 9, 88 * s, z + 5, 28 * s, 24 * s, 28 * s, ry); break;
      case 'jungle': P('jg.t', geo.cyl, '#4a3320', x, 34, z, 10, 68, 10); P('jg.c1', geo.sphere, '#0f4a22', x, 92 * s, z, 54 * s, 42 * s, 54 * s, ry); P('jg.c2', geo.sphere, '#1f7d37', x - 12, 118 * s, z + 6, 36 * s, 28 * s, 36 * s, ry); P('jg.f', geo.sphereLo, '#ff7ab6', x + 30 * s, 100 * s, z - 14, 5, 5, 5); break;
      case 'pine': P('pine.t', geo.cyl, '#4a3320', x, 12, z, 6, 24, 6); for (let k = 0; k < 3; k++) { P('pine.c' + k, geo.cone, '#1f5e3a', x, (38 + k * 26) * s, z, (48 - k * 11) * s, 42 * s, (48 - k * 11) * s, ry); } P('pine.snow', geo.cone, '#f4f8fb', x, 112 * s, z, 14 * s, 22 * s, 14 * s); break;
      case 'cactus': P('cac.m', geo.cyl, '#3f8f4a', x, 30, z, 9, 60, 9); P('cac.a1', geo.cyl, '#3f8f4a', x - 17, 38, z, 5, 24, 5); P('cac.a2', geo.cyl, '#3f8f4a', x + 17, 30, z, 5, 20, 5); P('cac.h1', geo.cyl, '#3f8f4a', x - 11, 28, z, 8, 5, 5, 1.57); P('cac.f', geo.sphereLo, '#ff6fa8', x, 62, z, 4, 4, 4); break;
      case 'acacia': P('ac.t', geo.cyl, '#6a4a2a', x, 30, z, 6, 62, 6); P('ac.c1', geo.sphere, '#6b8f2a', x, 68, z, 66 * s, 11 * s, 66 * s, ry); P('ac.c2', geo.sphere, '#86ab3c', x + 10, 74, z - 6, 42 * s, 9 * s, 42 * s, ry); break;
      case 'mangrove': for (let k = -2; k <= 2; k++) P('mg.r', geo.cyl, '#3b2f22', x + k * 13, 16, z + (k % 2) * 6, 3, 38, 3); P('mg.c1', geo.sphere, '#2a6450', x, 54 * s, z, 44 * s, 32 * s, 44 * s, ry); P('mg.c2', geo.sphere, '#3e8c6c', x - 10, 72 * s, z, 28 * s, 20 * s, 28 * s, ry); break;
      case 'boulder': P('bo.a', geo.ico, '#7b7f86', x, 28, z, o.r * 1.4, o.r * 1.0, o.r * 1.2, ry); P('bo.b', geo.ico, '#9aa0a8', x - 8, 42, z - 6, o.r * 0.8, o.r * 0.6, o.r * 0.8, ry + 1); break;
      case 'obsidian': P('ob.a', geo.cone, '#1b1820', x - 10, 36 * s, z, 14, 72 * s, 14, ry); P('ob.b', geo.cone, '#2a2530', x + 12, 26 * s, z + 6, 12, 52 * s, 12, ry); P('ob.c', geo.cone, '#ff5a1e', x - 10, 40 * s, z, 4, 40 * s, 4, ry); break;
      case 'bamboo': for (let k = -1; k <= 1; k++) { P('bam.s', geo.cyl, '#7fb83a', x + k * 10, 58 * s, z + (k % 2) * 5, 3.2, 116 * s, 3.2); P('bam.n', geo.cyl, '#4f8f26', x + k * 10, 70 * s, z + (k % 2) * 5, 3.8, 3, 3.8); } P('bam.l', geo.sphere, '#4f9a2a', x, 112 * s, z, 16, 4, 6, ry); break;
      case 'blossom': P('bl.t', geo.cyl, '#5b3a1e', x, 26, z, 7, 52, 7); P('bl.c1', geo.sphere, '#ffaac8', x, 70 * s, z, 44 * s, 36 * s, 44 * s, ry); P('bl.c2', geo.sphere, '#ffcde1', x - 10, 90 * s, z + 5, 28 * s, 22 * s, 28 * s, ry); break;
      case 'shroom': P('sh.s', geo.cyl, '#e8e0f0', x, 22, z, 9, 44, 9); P('sh.c', geo.sphere, '#7a4bd6', x, 48 * s, z, 48 * s, 28 * s, 48 * s, ry); P('sh.d', geo.sphereLo, '#f0e8ff', x + 18 * s, 66 * s, z + 8, 7, 3, 7); P('sh.d2', geo.sphereLo, '#f0e8ff', x - 14 * s, 62 * s, z - 14, 6, 3, 6); break;
      case 'rock': { const col = o.b === 'desert' ? '#c9a56e' : o.b === 'snow' ? '#cfd8de' : o.b === 'volcano' ? '#2a2630' : o.b === 'mountain' ? '#6a6e75' : '#7d8087'; P('rock.' + (o.b || 'x'), geo.dodec, col, x, 11, z, 24, 16, 20, ry); break; }
    }
  }

  function buildWorld() {
    if (worldG) { scene.remove(worldG); worldG.traverse((o) => { if (o.geometry && !Object.values(geo).includes(o.geometry)) o.geometry.dispose(); }); }
    worldG = new T.Group(); scene.add(worldG);
    // terrain texture from the biome map
    const N = 1024, cv = document.createElement('canvas'); cv.width = cv.height = N;
    const c2 = cv.getContext('2d'), img = c2.createImageData(N, N);
    const rgb = {}; for (const k in BIOME_COL) rgb[k] = rgbOf(BIOME_COL[k][0]);
    for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
      const b = biomeAt(biomes, (px + 0.5) * WORLD / N, (py + 0.5) * WORLD / N), c = rgb[b] || rgb.forest, f = 0.93 + hash(px, py) * 0.14, i = (py * N + px) * 4;
      img.data[i] = Math.min(255, c[0] * f); img.data[i + 1] = Math.min(255, c[1] * f); img.data[i + 2] = Math.min(255, c[2] * f); img.data[i + 3] = 255;
    }
    c2.putImageData(img, 0, 0);
    const tex = new T.CanvasTexture(cv); tex.anisotropy = 4;
    const terrain = new T.Mesh(new T.PlaneGeometry(WORLD, WORLD), new T.MeshLambertMaterial({ map: tex }));
    terrain.rotation.x = -Math.PI / 2; terrain.position.set(WORLD / 2, 0, WORLD / 2); worldG.add(terrain);
    // world border
    for (const [x, z, w, d] of [[WORLD / 2, -10, WORLD + 40, 20], [WORLD / 2, WORLD + 10, WORLD + 40, 20], [-10, WORLD / 2, 20, WORLD], [WORLD + 10, WORLD / 2, 20, WORLD]]) mesh(geo.box, '#2b1d12', w, 60, d, x, 30, z, worldG);
    // ponds
    for (const p of ponds) {
      const pw = POND_COL[biomeAt(biomes, p.x, p.y)] || POND_COL.forest, lava = biomeAt(biomes, p.x, p.y) === 'volcano';
      const shore = mesh(geo.circle, pw[0], p.r + 10, p.r + 10, 1, p.x, 0.5, p.y, worldG); shore.rotation.x = -Math.PI / 2;
      const w = mesh(geo.circle, new T.MeshStandardMaterial({ color: pw[1], roughness: 0.25, metalness: 0.1, transparent: !lava, opacity: lava ? 1 : 0.82, emissive: lava ? 0xff4a10 : 0x000000, emissiveIntensity: lava ? 0.9 : 0 }), p.r, p.r, 1, p.x, 1.2, p.y, worldG);
      w.rotation.x = -Math.PI / 2;
      const deep = mesh(geo.circle, pw[2], p.r * 0.65, p.r * 0.65, 1, p.x, 1.4, p.y, worldG); deep.rotation.x = -Math.PI / 2; if (!lava) { deep.material = deep.material.clone(); deep.material.transparent = true; deep.material.opacity = 0.5; }
    }
    // ground tufts
    const rr = Shared.rng(seed + 99), NT = 40000, tm = new T.InstancedMesh(geo.cone, new T.MeshLambertMaterial({ color: 0xffffff }), NT), dm = new T.Object3D(), col = new T.Color();
    let nt = 0;
    for (let i = 0; i < NT; i++) {
      const x = rr() * WORLD, y = rr() * WORLD; if (inPondAt(x, y)) continue;
      const b = biomeAt(biomes, x, y), h = 3 + rr() * 5;
      dm.position.set(x, h / 2, y); dm.scale.set(0.9 + rr() * 0.6, h, 0.9 + rr() * 0.6); dm.rotation.set(0, rr() * 6, 0); dm.updateMatrix(); tm.setMatrixAt(nt, dm.matrix);
      col.set(BIOME_COL[b][0]).multiplyScalar(0.62 + rr() * 0.3); tm.setColorAt(nt, col); nt++;
    }
    tm.count = nt; tm.instanceMatrix.needsUpdate = true; tm.instanceColor.needsUpdate = true; tm.frustumCulled = false; worldG.add(tm);
    // obstacles and bushes
    for (const o of obstacles) addObstacle(o);
    for (const b of bushes) {
      const col = css((BUSH_COL[b.b] || BUSH_COL.forest)[0]), col2 = css((BUSH_COL[b.b] || BUSH_COL.forest)[1]);
      P('bush.' + b.b, geo.sphere, col, b.x, b.r * 0.34, b.y, b.r * 0.8, b.r * 0.5, b.r * 0.8, b.x, { transparent: true, opacity: 0.78 });
      P('bushb.' + b.b, geo.sphere, col2, b.x + b.r * 0.3, b.r * 0.5, b.y - b.r * 0.2, b.r * 0.5, b.r * 0.34, b.r * 0.5, b.y, { transparent: true, opacity: 0.78 });
    }
    flush(worldG);
    // fruit on bushes (3 slots per bush)
    fruitMesh = new T.InstancedMesh(geo.sphereLo, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }), bushes.length * 3);
    fruitMesh.frustumCulled = false; worldG.add(fruitMesh);
    // cave mouths and whirlpools
    for (const e of entrances) {
      if (e.water) {
        const sw = mesh(geo.circle, '#041424', 40, 40, 1, e.x, 1.6, e.y, worldG); sw.rotation.x = -Math.PI / 2;
        const ring = new T.Mesh(geo.torus, BM(0x66aaff)); ring.scale.set(46, 46, 46); ring.rotation.x = -Math.PI / 2; ring.position.set(e.x, 2, e.y); worldG.add(ring);
      } else {
        mesh(geo.ico, '#6f7279', 84, 46, 66, e.x, 18, e.y, worldG); mesh(geo.ico, '#8a8d94', 56, 34, 46, e.x - 14, 40, e.y - 10, worldG);
        const hole = mesh(geo.circle, '#050404', 34, 28, 1, e.x, 26, e.y + 34, worldG); hole.rotation.x = -0.55;
        const rim = mesh(geo.torus, '#55585e', 38, 32, 30, e.x, 26, e.y + 34, worldG); rim.rotation.x = -0.55;
      }
    }
    // leaves + cave gems
    leafMesh = new T.InstancedMesh(geo.sphereLo, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, emissive: 0x113311 }), 1400);
    leafMesh.frustumCulled = false; worldG.add(leafMesh);
    gemMesh = new T.InstancedMesh(geo.oct, new T.MeshBasicMaterial({ color: 0xffffff }), 400); gemMesh.frustumCulled = false; scene.add(gemMesh);
    builtSeed = seed;
  }
  function inPondAt(x, y) { for (const p of ponds) if (Math.hypot(p.x - x, p.y - y) < p.r) return true; return false; }

  const dm2 = new T.Object3D(), tmpCol = new T.Color();
  function updateFruit() {
    const now = performance.now(); if (now - fruitClock < 400 || !fruitMesh) return; fruitClock = now;
    let n = 0;
    for (let i = 0; i < bushes.length; i++) {
      const b = bushes[i], cnt = fruit[i] || 0; tmpCol.set(FRUIT_COL[b.b] || '#e63946');
      for (let k = 0; k < cnt; k++) {
        const a = i * 2.1 + k * 2.09, rr = b.r * 0.62;
        dm2.position.set(b.x + Math.cos(a) * rr, b.r * 0.42, b.y + Math.sin(a) * rr); dm2.scale.setScalar(5.5); dm2.rotation.set(0, 0, 0); dm2.updateMatrix();
        fruitMesh.setMatrixAt(n, dm2.matrix); fruitMesh.setColorAt(n, tmpCol); n++;
      }
    }
    fruitMesh.count = n; fruitMesh.instanceMatrix.needsUpdate = true; if (fruitMesh.instanceColor) fruitMesh.instanceColor.needsUpdate = true;
  }
  function updateLeaves(t, mode) {
    if (!leafMesh) return;
    const hot = me.smellTime > 0 || me.nightVision; let n = 0, g = 0;
    for (const l of leaves.values()) {
      if (l.c !== me.loc) continue;
      const bob = Math.sin(t * 3 + l.id) * 2 + 9;
      if (l.c >= 0) {
        if (g >= 400) continue;
        dm2.position.set(l.x, bob + 6, l.y); dm2.scale.set(8, 11, 8); dm2.rotation.set(0, t + l.id, 0); dm2.updateMatrix(); gemMesh.setMatrixAt(g, dm2.matrix);
        tmpCol.set(caveDefs[l.c] && caveDefs[l.c].flooded ? '#ffd0ff' : '#5eead4'); gemMesh.setColorAt(g, tmpCol); g++;
      } else {
        if (n >= 1400) continue;
        const sc = hot ? 1.7 : 1;
        dm2.position.set(l.x, bob, l.y); dm2.scale.set((9 + l.v) * sc, 2.2 * sc, (5 + l.v * 0.6) * sc); dm2.rotation.set(0.3, l.id, 0); dm2.updateMatrix();
        leafMesh.setMatrixAt(n, dm2.matrix); tmpCol.set(l.v >= 5 ? '#ffd54a' : l.v >= 2 ? '#6be07a' : '#2fb34a'); leafMesh.setColorAt(n, tmpCol); n++;
      }
    }
    leafMesh.count = n; leafMesh.instanceMatrix.needsUpdate = true; if (leafMesh.instanceColor) leafMesh.instanceColor.needsUpdate = true;
    gemMesh.count = g; gemMesh.instanceMatrix.needsUpdate = true; if (gemMesh.instanceColor) gemMesh.instanceColor.needsUpdate = true;
    leafMesh.visible = mode === 'surface'; gemMesh.visible = mode === 'cave';
  }

  // ---------------------------------------------------------------- caves
  const caveGroups = new Map();
  function buildCave(id) {
    const cv = caveDefs[id], g = new T.Group(), fl = cv.flooded;
    const floorCol = fl ? '#1a5876' : '#4a3f34', rimCol = fl ? '#0e3a52' : '#2e261f';
    const base = mesh(geo.plane, fl ? '#020a12' : '#0a0807', 6000, 6000, 1, cv.W / 2, -2, cv.H / 2, g); base.rotation.x = -Math.PI / 2;
    const ceil = mesh(geo.plane, fl ? '#041a28' : '#14100d', 6000, 6000, 1, cv.W / 2, 190, cv.H / 2, g); ceil.rotation.x = Math.PI / 2;
    for (const c of cv.chambers) { const r = mesh(geo.circle, rimCol, c.r + 16, c.r + 16, 1, c.x, 0.1, c.y, g); r.rotation.x = -Math.PI / 2; const f = mesh(geo.circle, floorCol, c.r, c.r, 1, c.x, 0.4, c.y, g); f.rotation.x = -Math.PI / 2; }
    for (const k of cv.corridors) {
      const a = cv.chambers[k.a], b = cv.chambers[k.b], len = Math.hypot(b.x - a.x, b.y - a.y), ang = Math.atan2(b.y - a.y, b.x - a.x);
      const r = mesh(geo.plane, rimCol, len, k.w + 28, 1, (a.x + b.x) / 2, 0.1, (a.y + b.y) / 2, g); r.rotation.x = -Math.PI / 2; r.rotation.z = ang;
      const f = mesh(geo.plane, floorCol, len, k.w, 1, (a.x + b.x) / 2, 0.45, (a.y + b.y) / 2, g); f.rotation.x = -Math.PI / 2; f.rotation.z = ang;
    }
    // walls: tall rocks wherever the floor ends
    const wallCol = fl ? '#12384c' : '#3a3028', wm = new T.InstancedMesh(geo.ico, M(wallCol), 900), d = new T.Object3D(); let wn = 0;
    const tryWall = (x, y) => { if (wn >= 900 || caveWalkable(cv, x, y)) return; const h = 80 + frand(wn) * 60, r = 22 + frand(wn + 7) * 16; d.position.set(x, h * 0.45, y); d.scale.set(r, h, r); d.rotation.set(0, frand(wn + 3) * 6, 0); d.updateMatrix(); wm.setMatrixAt(wn++, d.matrix); };
    for (const c of cv.chambers) for (let a = 0; a < 6.283; a += 0.1) tryWall(c.x + Math.cos(a) * (c.r + 18), c.y + Math.sin(a) * (c.r + 18));
    for (const k of cv.corridors) {
      const a = cv.chambers[k.a], b = cv.chambers[k.b], len = Math.hypot(b.x - a.x, b.y - a.y), nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
      for (let u = 0; u <= len; u += 34) for (const sd of [-1, 1]) tryWall(a.x + (b.x - a.x) * u / len + nx * sd * (k.w / 2 + 18), a.y + (b.y - a.y) * u / len + ny * sd * (k.w / 2 + 18));
    }
    wm.count = wn; wm.instanceMatrix.needsUpdate = true; wm.frustumCulled = false; g.add(wm);
    for (const p of cv.pillars) mesh(geo.cyl, wallCol, p.r, 120, p.r, p.x, 60, p.y, g);
    // glowing crystals
    const cm = new T.InstancedMesh(geo.oct, new T.MeshBasicMaterial({ color: 0xffffff }), cv.crystals.length * 3); let cn = 0;
    for (const c of cv.crystals) for (const [dx, dz, k] of [[0, 0, 1], [c.s * 0.6, c.s * 0.3, 0.6], [-c.s * 0.5, c.s * 0.35, 0.5]]) {
      d.position.set(c.x + dx, c.s * k * 1.4, c.y + dz); d.scale.set(c.s * k * 0.5, c.s * k * 1.5, c.s * k * 0.5); d.rotation.set(0, c.rot, 0.1); d.updateMatrix(); cm.setMatrixAt(cn, d.matrix); cm.setColorAt(cn, tmpCol.set(c.c)); cn++;
    }
    cm.frustumCulled = false; g.add(cm);
    // exits and air pockets
    g.userData.exits = [];
    cv.exits.forEach((ex) => {
      const portal = new T.Mesh(geo.plane, BM(fl ? 0x9fd8ff : 0xfff2b8, { transparent: true, opacity: 0.85, side: T.DoubleSide })); portal.scale.set(70, 120, 1); portal.position.set(ex.x, 60, ex.y); g.add(portal);
      const pl = new T.PointLight(fl ? 0x9fd8ff : 0xffe9a0, 1.4, 600, 1.2); pl.position.set(ex.x, 70, ex.y); g.add(pl); g.userData.exits.push(portal);
    });
    for (const a of cv.air) { const dsc = mesh(geo.circle, BM(0xbfe9ff, { transparent: true, opacity: 0.4 }), a.r, a.r, 1, a.x, 0.9, a.y, g); dsc.rotation.x = -Math.PI / 2; mesh(geo.cyl, BM(0xdff4ff, { transparent: true, opacity: 0.18 }), a.r, 190, a.r, a.x, 95, a.y, g); }
    // food: mushrooms (or kelp in flooded caves)
    g.userData.food = cv.mush.map((m) => {
      const grp = new T.Group(); grp.position.set(m.x, 0, m.y);
      if (fl) { for (let k = -1; k <= 1; k++) { const s2 = mesh(geo.cyl, '#4ade80', 2.5, 55, 2.5, k * 8, 27, 0, grp); s2.userData.sway = k; } }
      else { mesh(geo.cyl, '#d9d2c0', 3, 14, 3, 0, 7, 0, grp); mesh(geo.sphere, BM(0x3fb8ff), 13, 8, 13, 0, 15, 0, grp); }
      g.add(grp); return grp;
    });
    g.userData.fl = fl;
    return g;
  }

  // ---------------------------------------------------------------- underwater (pond floor)
  const waterGroups = new Map();
  function buildPondUnder(i) {
    const p = ponds[i], g = new T.Group(), r = Shared.rng(seed + i * 7919 + 13);
    const pt = () => { const a = r() * 6.283, d = Math.sqrt(r()) * p.r * 0.92; return [p.x + Math.cos(a) * d, p.y + Math.sin(a) * d]; };
    const floor = mesh(geo.circle, '#bda673', p.r, p.r, 1, p.x, 0, p.y, g); floor.rotation.x = -Math.PI / 2;
    const wall = new T.Mesh(new T.CylinderGeometry(p.r, p.r, 260, 40, 1, true), new T.MeshBasicMaterial({ color: 0x0b4a78, side: T.BackSide })); wall.position.set(p.x, 130, p.y); g.add(wall);
    const top = mesh(geo.circle, BM(0x6cc6ff, { transparent: true, opacity: 0.55, side: T.DoubleSide }), p.r, p.r, 1, p.x, 230, p.y, g); top.rotation.x = Math.PI / 2;
    for (let k = 0; k < p.r / 12; k++) { const [x, y] = pt(), s = 8 + r() * 18; mesh(geo.dodec, '#4d6a7a', s, s * 0.7, s, x, s * 0.4, y, g); }
    for (let k = 0; k < p.r / 24; k++) { const [x, y] = pt(), c = ['#ff6b8b', '#ffb347', '#c77dff', '#ff8fa3'][Math.floor(r() * 4)], s = 14 + r() * 16; for (let j = -2; j <= 2; j++) mesh(geo.cone, c, s * 0.18, s * (1 - Math.abs(j) * 0.18) * 1.6, s * 0.18, x + j * s * 0.35, s * 0.8, y + (j % 2) * 4, g); }
    g.userData.weeds = [];
    for (let k = 0; k < p.r / 9; k++) { const [x, y] = pt(), h = 30 + r() * 55; const w = mesh(geo.cyl, r() < 0.5 ? '#2fa05a' : '#1f8450', 1.5, h, 1.5, x, h / 2, y, g); w.userData = { h, ph: r() * 6, x, y }; g.userData.weeds.push(w); }
    g.userData.school = [];
    for (let k = 0; k < 14; k++) {
      const cx = p.x + (r() - 0.5) * p.r, cy = p.y + (r() - 0.5) * p.r, rad = 40 + r() * p.r * 0.55, sp = 0.15 + r() * 0.3, ph = r() * 6.283, col = ['#9fd8ff', '#ffe08a', '#b6f0c8', '#ffa8c5'][Math.floor(r() * 4)], y0 = 20 + r() * 110;
      const f = buildCritter({ k: 'fish' }, false); f.traverse((o) => { if (o.isMesh && o.material.color && o.material.color.getHex() === 0xff9a3c) o.material = M(col); }); f.scale.setScalar(0.45 + r() * 0.35); g.add(f); g.userData.school.push({ f, cx, cy, rad, sp, ph, y0 });
    }
    for (const e of entrances) if (e.water && Math.hypot(e.x - p.x, e.y - p.y) < p.r) {
      const hole = mesh(geo.circle, '#010609', 50, 50, 1, e.x, 0.8, e.y, g); hole.rotation.x = -Math.PI / 2;
      const ring = new T.Mesh(geo.torus, BM(0x9fe0ff)); ring.scale.set(56, 56, 56); ring.rotation.x = -Math.PI / 2; ring.position.set(e.x, 1.5, e.y); g.add(ring); g.userData.ring = ring;
      g.userData.mouth = e;
    }
    // rising bubbles
    const bg = new T.BufferGeometry(), N = 90, pos = new Float32Array(N * 3), seedv = [];
    for (let k = 0; k < N; k++) { const [x, y] = pt(); pos[k * 3] = x; pos[k * 3 + 1] = r() * 230; pos[k * 3 + 2] = y; seedv.push(r()); }
    bg.setAttribute('position', new T.BufferAttribute(pos, 3));
    const bubbles = new T.Points(bg, new T.PointsMaterial({ color: 0xd8f2ff, size: 4, transparent: true, opacity: 0.7 })); bubbles.frustumCulled = false; g.add(bubbles); g.userData.bubbles = { pts: bubbles, seedv };
    return g;
  }

  // ---------------------------------------------------------------- per-frame
  let curMode = null, curCaveG = null, curWaterG = null, curWaterIdx = -1, camInit = false;
  const camPos = new T.Vector3(), camTarget = new T.Vector3(), tmpV = new T.Vector3();
  const skyDay = new T.Color(0x8ec8f0), skyNight = new T.Color(0x070b22), fogCol = new T.Color(), want = new T.Color();
  const TINT = { desert: '#f0dca8', snow: '#e8f0f8', swamp: '#a8bf92', volcano: '#7a3a28', mountain: '#c0ccd8', mushroom: '#8a68c0', bamboo: '#b0dca8', jungle: '#92cfa0', meadow: '#cfe8f8', savanna: '#e8dca0', forest: '#8ec8f0' };
  let smooth = { d: 0 };

  function setMode(mode) {
    if (mode === curMode) return;
    if (curCaveG) { scene.remove(curCaveG); curCaveG = null; }
    if (curWaterG) { scene.remove(curWaterG); curWaterG = null; }
    worldG.visible = mode === 'surface';
    if (mode === 'cave') { let g = caveGroups.get(me.loc); if (!g) { g = buildCave(me.loc); caveGroups.set(me.loc, g); } curCaveG = g; scene.add(g); }
    curMode = mode; camInit = false;
  }

  function resizeIf() {
    const w = window.innerWidth, h = window.innerHeight;
    if (canvas3.width !== Math.floor(w * renderer.getPixelRatio()) || canvas3.height !== Math.floor(h * renderer.getPixelRatio())) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  }

  function render(dt, now) {
    if (!out.ready) return;
    resizeIf();
    if (builtSeed !== seed || !worldG) { buildWorld(); caveGroups.clear(); waterGroups.clear(); curMode = null; for (const a of actors.values()) scene.remove(a.root); actors.clear(); }
    const t = now / 1000;
    const mode = me.loc >= 0 ? 'cave' : (me.dive ? 'under' : 'surface');
    setMode(mode);
    const stage = stageOf(me.age), scale = scaleOf(me.age), def = ANIMALS[me.animal];

    // ----- underwater group for the current pond
    if (mode === 'under') {
      const pi = ponds.findIndex((p) => Math.hypot(p.x - me.x, p.y - me.y) < p.r);
      if (pi !== curWaterIdx || !curWaterG) {
        if (curWaterG) scene.remove(curWaterG);
        let g = waterGroups.get(pi); if (!g && pi >= 0) { g = buildPondUnder(pi); waterGroups.set(pi, g); }
        curWaterG = g || null; curWaterIdx = pi; if (g) scene.add(g);
      }
    } else if (curWaterG) { scene.remove(curWaterG); curWaterG = null; curWaterIdx = -1; }

    // ----- environment (sky, fog, lights)
    const dk = mode === 'surface' ? darkness() : 0; smooth.d += (dk - smooth.d) * Math.min(1, dt * 3);
    const bio = me.biome || 'forest';
    if (mode === 'surface') {
      want.copy(skyDay).lerp(new T.Color(TINT[bio] || '#8ec8f0'), 0.55).lerp(skyNight, smooth.d * 0.96);
      scene.background.lerp(want, Math.min(1, dt * 2)); scene.fog.color.copy(scene.background);
      scene.fog.near = 320 - smooth.d * 150 + me.alt * 0.8; scene.fog.far = (me.nightVision ? 1700 : 1800 - smooth.d * 950) + me.alt * 2.6;
      hemi.intensity = 0.72 - smooth.d * 0.5 + (me.nightVision ? 0.5 * smooth.d : 0); sun.intensity = 0.7 - smooth.d * 0.62;
      hemi.color.set(0xdff2ff).lerp(new T.Color(0x3a4a80), smooth.d); plight.intensity = 0;
    } else if (mode === 'under') {
      scene.background.set(0x0b4a78); scene.fog.color.set(0x0b4a78); scene.fog.near = 40; scene.fog.far = 700;
      hemi.intensity = 0.9; hemi.color.set(0x9fd8ff); sun.intensity = 0.3; plight.intensity = 0;
    } else {
      const fl = caveDefs[me.loc].flooded, bg = fl ? 0x02101c : 0x050403;
      scene.background.set(bg); scene.fog.color.set(bg); scene.fog.near = 40; scene.fog.far = me.nightVision ? 1400 : 760;
      hemi.intensity = me.nightVision ? 0.8 : 0.22; hemi.color.set(fl ? 0x7fb8e0 : 0xb0a090); sun.intensity = 0;
      plight.intensity = me.nightVision ? 2.4 : 1.9; plight.color.set(fl ? 0xa0d8ff : 0xffe2b0); plight.distance = me.nightVision ? 900 : 560;
    }

    // ----- player + others
    const seen = new Set();
    const lift = (x, y, jumping) => (mode === 'under' ? 16 : (mode === 'surface' && inPondAt(x, y) && !jumping ? -5 : 0));
    const meA = getActor('me', me.animal, stage);
    placeActor(meA, me.x, me.y, me.angle, scale, { dt, alt: me.alt, pitch: (me.lunge && me.lunge.bomb) ? 0.95 : 0, tree: !!me.climb, moving: me.moving, sprint: me.sprinting, jump: me.jump, rest: me.resting, lift: mode === 'under' ? 16 : (mode === 'cave' && caveDefs[me.loc].flooded ? 14 : lift(me.x, me.y, me.jump > 0)),
      alpha: me.hidden && !me.dive ? 0.55 : (me.abTime > 0 && def.ab.stealth ? 0.5 : 1) });
    seen.add('me');
    for (const [id, o] of others) {
      seen.add(id);
      const ost = stageOf(o.ag || 0), a = getActor(id, o.an, ost);
      let vis = true;
      if (o.h) vis = (mode === 'under' && o.dv) || (me.smellTime > 0 && Math.hypot(o.x - me.x, o.y - me.y) < 450);
      if (mode === 'under' && !o.dv) vis = vis && false;
      if (mode === 'surface' && o.dv) vis = false;
      a.root.visible = vis; if (!vis) continue;
      placeActor(a, o.x, o.y, o.a, scaleOf(o.ag || 0), { dt, alt: o.alt || 0, tree: !!o.cl, moving: !!o.m, jump: o.j ? 0.27 : 0, rest: o.r, lift: mode === 'under' ? 16 : (mode === 'cave' ? (caveDefs[me.loc].flooded ? 14 : 0) : lift(o.x, o.y, o.j)), alpha: o.f ? 0.3 : (o.h ? 0.5 : 1) });
    }
    for (const [id, a] of actors) if (!seen.has(id)) { scene.remove(a.root); actors.delete(id); }

    // ----- critters
    for (const [id, c] of critterMeshes) if (!critters.has(id)) { scene.remove(c); critterMeshes.delete(id); }
    for (const [id, c] of critters) {
      let m = critterMeshes.get(id);
      const bat = me.loc >= 0 && !caveDefs[me.loc].flooded && c.k !== 'fish';
      if (!m) { m = buildCritter(c, bat); critterMeshes.set(id, m); scene.add(m); }
      const fishY = c.k === 'fish' ? (mode === 'under' ? 30 + Math.sin(t + id) * 10 : (me.loc >= 0 ? 20 : 0.2)) : (bat ? 55 + Math.sin(t * 2 + id) * 12 : 0);
      m.position.set(c.x, fishY + (c.k === 'fish' && mode === 'surface' ? 0.1 : 0), c.y); m.rotation.y = -c.a;
      m.visible = c.k === 'fish' ? (mode !== 'surface' || true) : mode !== 'under';
      if (m.userData.wings) { const f = Math.sin(t * 16 + id) * 0.8; m.userData.wings[0].rotation.x = f; m.userData.wings[1].rotation.x = -f; }
    }

    // ----- animated pieces
    if (curWaterG) {
      const ud = curWaterG.userData;
      for (const w of ud.weeds) w.rotation.z = Math.sin(t * 1.4 + w.userData.ph) * 0.14;
      for (const s of ud.school) { const a = t * s.sp + s.ph; s.f.position.set(s.cx + Math.cos(a) * s.rad, s.y0 + Math.sin(t + s.ph) * 6, s.cy + Math.sin(a) * s.rad * 0.6); s.f.rotation.y = -Math.atan2(Math.cos(a) * s.rad * 0.6, -Math.sin(a) * s.rad); }
      if (ud.ring) ud.ring.scale.setScalar(56 + Math.sin(t * 3) * 3);
      const pa = ud.bubbles.pts.geometry.attributes.position; for (let k = 0; k < pa.count; k++) { let yy = pa.getY(k) + dt * (18 + ud.bubbles.seedv[k] * 14); if (yy > 230) yy = 0; pa.setY(k, yy); } pa.needsUpdate = true;
    }
    if (curCaveG) {
      const ud = curCaveG.userData;
      ud.food.forEach((grp, i) => { const n = (mush[me.loc] && mush[me.loc][i]) || 0; grp.visible = true; grp.scale.setScalar(n > 0 ? 1 : 0.5); if (ud.fl) grp.children.forEach((c) => { c.rotation.z = Math.sin(t * 1.6 + i + c.userData.sway) * 0.16; }); });
      for (const p of ud.exits) p.lookAt(camera.position.x, p.position.y, camera.position.z);
    }
    updateFruit(); updateLeaves(t, mode);
    const wantSee = !!me.climb;
    if (wantSee !== seeThrough) { seeThrough = wantSee; for (const m of canopyMats) { m.transparent = wantSee; m.opacity = wantSee ? 0.22 : 1; m.depthWrite = !wantSee; m.needsUpdate = true; } }
    if (mode === 'cave') plight.position.set(me.x, 70, me.y);

    // ----- camera
    const hov = mode === 'cave' ? 0.78 : 1;
    const dist = (70 + def.size * scale * 4.2 + Math.min(me.alt * 0.9, 320)) * out.zoom * hov, pit = Math.max(0.12, Math.min(1.35, out.pitch));
    const gy = (mode === 'under' ? 16 : 0) + def.size * scale * 1.1 + me.alt;
    camTarget.set(me.x, gy, me.y);
    tmpV.set(me.x - Math.cos(out.yaw) * Math.cos(pit) * dist, gy + Math.sin(pit) * dist + 8, me.y - Math.sin(out.yaw) * Math.cos(pit) * dist);
    if (mode === 'cave') tmpV.y = Math.min(tmpV.y, 150);
    // camera collision: pull the camera in along the ray if it would end up inside a tree/rock
    if (mode !== 'cave' && mode !== 'under' && !me.climb && obstacles) {
      const dx = tmpV.x - me.x, dz = tmpV.z - me.y, len2 = dx * dx + dz * dz;
      if (len2 > 1) {
        let tMin = 1;
        for (const o of obstacles) {
          const ox = o.x - me.x, oy = o.y - me.y, rr = o.r * 0.95 + 14;
          if (ox * ox + oy * oy > (Math.sqrt(len2) + rr) * (Math.sqrt(len2) + rr)) continue;
          if (ox * ox + oy * oy < rr * rr) continue; // player already touching it: ignore
          const t0 = (ox * dx + oy * dz) / len2; if (t0 <= 0) continue;
          const px = ox - dx * t0, py = oy - dz * t0, d2 = px * px + py * py;
          if (d2 >= rr * rr) continue;
          const tHit = t0 - Math.sqrt((rr * rr - d2) / len2);
          if (tHit > 0 && tHit < tMin) tMin = tHit;
        }
        if (tMin < 1) { tMin = Math.max(0.25, tMin); tmpV.x = me.x + dx * tMin; tmpV.z = me.y + dz * tMin; tmpV.y = camTarget.y + (tmpV.y - camTarget.y) * Math.max(tMin, 0.5) + (1 - tMin) * 30; }
      }
    }
    if (!camInit) { camPos.copy(tmpV); camInit = true; } else camPos.lerp(tmpV, 1 - Math.exp(-dt * 12));
    camera.position.copy(camPos); if (camera.position.y < 4) camera.position.y = 4;
    camera.lookAt(camTarget);
    renderer.render(scene, camera);
  }

  // ---------------------------------------------------------------- screen-space labels
  const pv = new T.Vector3();
  function toScreen(x, y, z, W, H) { pv.set(x, y, z).project(camera); return pv.z > 1 ? null : { x: (pv.x * 0.5 + 0.5) * W, y: (-pv.y * 0.5 + 0.5) * H }; }
  function drawLabels(ctx, W, H) {
    ctx.save(); ctx.textAlign = 'center';
    const lab = (text, p, col, big) => { ctx.font = (big ? '700 15px' : '600 13px') + ' Segoe UI'; ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillText(text, p.x + 1, p.y + 1); ctx.fillStyle = col; ctx.fillText(text, p.x, p.y); };
    const stage = stageOf(me.age), sc = scaleOf(me.age), a0 = actors.get('me');
    if (a0) { const p = toScreen(me.x, (a0.headY + 14) * sc + (me.jump ? 20 : 0), me.y, W, H); if (p) lab(`${me.name} · ${STAGES[stage]}`, p, '#ffe27a', true); }
    for (const [id, o] of others) {
      const a = actors.get(id); if (!a || !a.root.visible) continue;
      const st = stageOf(o.ag || 0), p = toScreen(o.x, (a.headY + 14) * scaleOf(o.ag || 0), o.y, W, H); if (!p) continue;
      lab(`${o.n} · ${STAGES[st]}`, p, '#ffffff', false);
      const w = 44, mhp = STAGE_HP[st]; ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(p.x - w / 2, p.y + 5, w, 5); ctx.fillStyle = '#e24a4a'; ctx.fillRect(p.x - w / 2, p.y + 5, w * Math.max(0, Math.min(1, (o.hp || 0) / mhp)), 5);
      if (o.h && me.smellTime > 0) lab('hiding', { x: p.x, y: p.y - 16 }, '#ff9a9a', false);
    }
    if (me.loc < 0 && me.dive === false) for (const e of entrances) { if (e.water) continue; const d = Math.hypot(e.x - me.x, e.y - me.y); if (d > 1100) continue; const p = toScreen(e.x, 80, e.y, W, H); if (p) lab('🕳️ Cave', p, '#ffffff', false); }
    if (me.loc < 0 && me.dive) for (const e of entrances) { if (!e.water) continue; const d = Math.hypot(e.x - me.x, e.y - me.y); if (d > 700) continue; const p = toScreen(e.x, 40, e.y, W, H); if (p) lab('🕳️ Cave', p, '#bfe9ff', false); }
    if (me.loc >= 0) caveDefs[me.loc].exits.forEach((ex) => { const p = toScreen(ex.x, 140, ex.y, W, H); if (p) lab(caveDefs[me.loc].flooded ? '⬆ Surface' : '☀️ Exit', p, '#fff2b8', true); });
    ctx.restore();
  }

  // ---------------------------------------------------------------- mouse / camera input
  function locked() { return document.pointerLockElement === canvas3; }
  window.addEventListener('mousemove', (e) => {
    if (!out.active) return;
    if (locked() || (e.buttons & 1)) { out.yaw += e.movementX * 0.0045; out.pitch = Math.max(0.12, Math.min(1.35, out.pitch + e.movementY * 0.004)); }
  });
  canvas3.addEventListener('mousedown', () => { if (out.active && !me.menu && canvas3.requestPointerLock) { try { canvas3.requestPointerLock(); } catch (e) {} } });
  window.addEventListener('wheel', (e) => { if (!out.active || me.menu) return; out.zoom = Math.max(0.5, Math.min(3, out.zoom * (e.deltaY > 0 ? 1.08 : 0.93))); }, { passive: true });

  // debug: show a row of animals next to the player (used for visual checks)
  const lineGroup = new T.Group(); scene.add(lineGroup);
  out.lineup = (keys, stage, spacing) => {
    lineGroup.clear();
    keys.forEach((k, i) => { const a = buildAnimal(k, stage); const sc = scaleOf(stage === 0 ? 0 : stage === 1 ? 100 : stage === 2 ? 300 : 500);
      a.g.scale.setScalar(sc); const col = i % 8, row = Math.floor(i / 8); a.g.position.set(me.x + (col - 3.5) * spacing, 0, me.y + 160 + row * spacing); a.g.rotation.y = -Math.PI * 0.35; lineGroup.add(a.g); });
  };
  out.ready = true; out.canvas = canvas3; out.render = render; out.drawLabels = drawLabels; out.active = false; out.renderer = renderer; out.scene = scene; out.camera = camera;
  out.setActive = (on) => { out.active = on; canvas3.style.display = on ? 'block' : 'none'; if (!on && locked()) document.exitPointerLock(); };
  out.setActive(false);
  return out;
})();
