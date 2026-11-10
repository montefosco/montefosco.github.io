import * as THREE from 'three';
import { add, mat, boxGeo, cylGeo, coneGeo, icoGeo, TAU } from './lowpoly.js';

/**
 * Grande nave a tre alberi, chiusa, modellata per sezioni.
 * Lo scafo è generato da stazioni (sezioni trasversali) lungo l'asse x: prua verso +x.
 * Il fianco vicino alla camera (+z) sotto il ponte è "aperto": una parete di vetro
 * quasi invisibile con ordinate e fasciame a vista, così si vede dentro la stiva.
 */

export const GAL = {
  L: 15,
  HL: 7.5,
  BMAX: 2.35,
  DECK: 3.3,
  FLOOR: 0.55,
  U_STERN: -0.94,
};

const { HL, BMAX, DECK, FLOOR, U_STERN } = GAL;

/* ---------- profilo dello scafo ---------- */

function beam(u) {
  const a = Math.abs(u);
  if (u >= 0) return BMAX * Math.pow(1 - Math.pow(a, 2.3), 0.75);
  return BMAX * Math.pow(Math.max(0, 1 - Math.pow(a, 3.2)), 0.55);
}
function keelY(u) {
  const a = Math.abs(u);
  return u >= 0 ? -1.2 + 2.9 * Math.pow(a, 2.4) : -1.2 + 1.4 * Math.pow(a, 3);
}
function topY(u) {
  const a = Math.abs(u);
  return u >= 0 ? 3.65 + 0.95 * Math.pow(a, 2.2) : 3.65 + 0.45 * Math.pow(a, 2.5);
}
const profile = (t) => Math.pow(Math.sin((t * Math.PI) / 2), 0.85) * (1 - 0.1 * t * t * t);
const tDeck = (u) => (DECK - keelY(u)) / (topY(u) - keelY(u));
const tAt = (u, y) => (y - keelY(u)) / (topY(u) - keelY(u));

function hp(u, t, side, inset = 1) {
  const yk = keelY(u);
  return new THREE.Vector3(u * HL, yk + (topY(u) - yk) * t, side * beam(u) * profile(t) * inset);
}

const STATIONS = (() => {
  const n = 22;
  const list = [];
  for (let i = 0; i <= n; i++) list.push(U_STERN + ((1 - U_STERN) * i) / n);
  return list;
})();

function hash(a, b) {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** griglia di punti: righe da chiglia a ponte (parte 'low') o da ponte a falchetta ('up') */
function wallGrid(side, part, rows, inset = 1) {
  const grid = [];
  for (const u of STATIONS) {
    const td = tDeck(u);
    const col = [];
    for (let j = 0; j <= rows; j++) {
      const f = j / rows;
      const t = part === 'low' ? td * f : td + (1 - td) * f;
      col.push(hp(u, t, side, inset));
    }
    grid.push(col);
  }
  return grid;
}

function gridMesh(grid, colorA, colorB, material, seedOffset = 0) {
  const pos = [];
  const col = [];
  const a = new THREE.Color(colorA);
  const b = new THREE.Color(colorB);
  const c = new THREE.Color();
  const push = (p) => pos.push(p.x, p.y, p.z);
  for (let i = 0; i < grid.length - 1; i++) {
    for (let j = 0; j < grid[i].length - 1; j++) {
      const p00 = grid[i][j];
      const p10 = grid[i + 1][j];
      const p01 = grid[i][j + 1];
      const p11 = grid[i + 1][j + 1];
      c.copy(j % 2 ? a : b).offsetHSL(0, 0, (hash(i + seedOffset, j) - 0.5) * 0.035);
      [p00, p10, p01, p10, p11, p01].forEach((p) => {
        push(p);
        col.push(c.r, c.g, c.b);
      });
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, material);
}

function gridLines(grid, color, opacity, { rows = true, cols = true } = {}) {
  const pts = [];
  if (rows) {
    for (let j = 0; j < grid[0].length; j++) {
      for (let i = 0; i < grid.length - 1; i++) pts.push(grid[i][j], grid[i + 1][j]);
    }
  }
  if (cols) {
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length - 1; j++) pts.push(grid[i][j], grid[i][j + 1]);
    }
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
}

function tube(points, radius, color, radial = 4, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'chordal');
  const geo = new THREE.TubeGeometry(curve, Math.max(8, points.length * 2), radius, radial, closed);
  const m = new THREE.Mesh(geo, mat(color));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** contorno in pianta (x, z) a una certa quota, come Shape */
function outlineShape(stationList, yOf, inset = 1, xMin = -Infinity, xMax = Infinity) {
  const pts = [];
  const list = stationList.filter((u) => u * HL >= xMin && u * HL <= xMax);
  for (const u of list) {
    const t = Math.min(1, Math.max(0, tAt(u, yOf(u))));
    pts.push([u * HL, beam(u) * profile(t) * inset]);
  }
  const shape = new THREE.Shape();
  shape.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
  for (let i = pts.length - 1; i >= 0; i--) shape.lineTo(pts[i][0], -pts[i][1]);
  shape.closePath();
  return shape;
}

function slab(shape, depth, y, color, cast = true) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, typeof color === 'string' ? mat(color) : color);
  m.position.y = y;
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}

/* ---------- vele ---------- */

function squareSail(w, h, bulge, color, segW = 8, segH = 5) {
  const geo = new THREE.PlaneGeometry(w, h, segW, segH);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const fx = (x + w / 2) / w;
    const fy = (y + h / 2) / h;
    p.setZ(i, Math.sin(fx * Math.PI) * bulge * (0.55 + 0.45 * Math.sin(fy * Math.PI)) + Math.cos(fy * Math.PI) * 0.05);
  }
  geo.computeVertexNormals();
  geo.rotateY(Math.PI / 2); // piano z-y, rigonfiamento verso prua (+x)
  const m = new THREE.Mesh(geo, mat(color, { side: THREE.DoubleSide, roughness: 0.95 }));
  m.castShadow = true;
  m.receiveShadow = false;
  return m;
}

function lateen(len, h, color) {
  const shape = new THREE.Shape();
  shape.moveTo(-len / 2, -h / 2);
  shape.lineTo(len / 2, -h / 2);
  shape.lineTo(-len / 2 + 0.2, h / 2);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape, 2);
  const m = new THREE.Mesh(geo, mat(color, { side: THREE.DoubleSide, roughness: 0.95 }));
  m.castShadow = true;
  return m;
}

/* ---------- nave ---------- */

export function makeGalleon({
  hull = '#3a2a1f',
  hullAlt = '#2f2219',
  inner = '#7a5a3c',
  innerAlt = '#6a4c32',
  sail = '#cfc8b8',
  trim = '#5b4630',
  flag = '#7a3b32',
} = {}) {
  const g = new THREE.Group();

  /* --- scafo: lato lontano (pieno, visto da dentro e da fuori) --- */
  const solid = mat('#ffffff', { vertexColors: true, side: THREE.DoubleSide, roughness: 0.95 });
  const farLow = wallGrid(-1, 'low', 7);
  const farUp = wallGrid(-1, 'up', 2);
  const nearUp = wallGrid(1, 'up', 2);
  for (const grid of [farLow, farUp, nearUp]) {
    const m = gridMesh(grid, hull, hullAlt, solid);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }

  // rivestimento interno del lato lontano: tavolato chiaro che si vede dalla stiva
  const lining = gridMesh(wallGrid(-1, 'low', 7, 0.965), inner, innerAlt, solid, 5);
  lining.receiveShadow = true;
  g.add(lining);

  /* --- lato vicino: parete trasparente + ordinate e corsi di fasciame a vista --- */
  const nearLow = wallGrid(1, 'low', 7);
  const glass = new THREE.Mesh(
    gridMesh(nearLow, '#a9cfe2', '#a9cfe2', mat('#ffffff', { vertexColors: true })).geometry,
    new THREE.MeshStandardMaterial({
      color: '#b6d9ea',
      vertexColors: false,
      flatShading: true,
      transparent: true,
      opacity: 0.1,
      roughness: 0.1,
      metalness: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  glass.renderOrder = 4;
  g.add(glass);
  const lines = gridLines(nearLow, '#e3cfa2', 0.34, { rows: true, cols: false });
  lines.renderOrder = 5;
  g.add(lines);

  // ordinate (costole) sui due lati
  for (let i = 1; i < STATIONS.length - 1; i += 2) {
    const u = STATIONS[i];
    const td = tDeck(u);
    for (const side of [-1, 1]) {
      if (side > 0 && i % 4 !== 1) continue;
      const pts = [];
      for (let k = 0; k <= 6; k++) pts.push(hp(u, (td * k) / 6, side, side > 0 ? 1.0 : 0.965));
      g.add(tube(pts, side > 0 ? 0.045 : 0.065, side > 0 ? '#8a6a46' : '#5a402a'));
    }
  }

  // fasce di rinforzo (ruote) e falchetta, su entrambi i lati
  for (const side of [-1, 1]) {
    for (const [f, r, c] of [[0.2, 0.07, '#2a1d15'], [0.995, 0.11, '#2a1d15']]) {
      const pts = STATIONS.map((u) => hp(u, tDeck(u) * f, side, 1.012));
      g.add(tube(pts, r, c, 4));
    }
    const rail = STATIONS.map((u) => hp(u, 1, side, 1.0));
    rail.forEach((p) => (p.y += 0.04));
    g.add(tube(rail, 0.09, trim, 4));
  }

  // specchio di poppa
  {
    const u = STATIONS[0];
    const pts = [];
    for (let k = 0; k <= 8; k++) pts.push(hp(u, k / 8, -1));
    for (let k = 8; k >= 0; k--) pts.push(hp(u, k / 8, 1));
    const shape = new THREE.Shape();
    pts.forEach((p, i) => (i ? shape.lineTo(-p.z, p.y) : shape.moveTo(-p.z, p.y)));
    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateY(Math.PI / 2);
    const m = new THREE.Mesh(geo, mat(hull, { side: THREE.DoubleSide }));
    m.position.x = u * HL;
    m.castShadow = true;
    g.add(m);
    // finestre di poppa e fascia decorata
    for (const z of [-0.55, 0, 0.55]) {
      add(g, boxGeo(0.06, 0.5, 0.36), mat('#ffd9a0', { emissive: '#ffa850', emissiveIntensity: 2.2 }), [u * HL - 0.02, 3.95, z], [0, 0, 0], [1, 1, 1], false);
    }
  }

  /* --- ponte principale (chiuso) --- */
  const deckShape = outlineShape(STATIONS, () => DECK, 0.985);
  const deck = slab(deckShape, 0.16, DECK - 0.16, '#8a6b48');
  g.add(deck);
  // assi del ponte
  for (let z = -1.9; z <= 1.9; z += 0.38) {
    add(g, boxGeo(10.8, 0.012, 0.025), mat('#5b4129'), [-0.6, DECK + 0.012, z], [0, 0, 0], [1, 1, 1], false);
  }

  /* --- pavimento della stiva --- */
  const floorShape = outlineShape(
    STATIONS,
    () => FLOOR,
    0.97,
    -7.1,
    6.0
  );
  const floor = slab(floorShape, 0.16, FLOOR - 0.16, '#7b5c3b', false);
  g.add(floor);
  for (let x = -6.6; x < 5.8; x += 0.5) {
    add(g, boxGeo(0.04, 0.012, 3.0), mat('#4f3a26'), [x, FLOOR + 0.006, 0], [0, 0, 0], [1, 1, 1], false);
  }

  // travi sotto il ponte (bagli) e pontali
  for (let x = -6.2; x <= 5.6; x += 1.45) {
    const u = x / HL;
    const w = beam(u) * profile(tDeck(u)) * 0.97;
    add(g, boxGeo(0.26, 0.2, w * 2), mat('#4a3523'), [x, DECK - 0.26, 0], [0, 0, 0], [1, 1, 1], false);
  }
  add(g, boxGeo(12.4, 0.16, 0.22), mat('#4a3523'), [-0.5, DECK - 0.4, -0.2], [0, 0, 0], [1, 1, 1], false);
  for (const x of [-4.4, 4.2]) {
    add(g, cylGeo(0.13, 0.15, DECK - FLOOR - 0.2, 6), mat('#5a4129'), [x, (DECK + FLOOR) / 2 - 0.1, -1.05]);
  }

  /* --- cassero di poppa --- */
  const castleShape = outlineShape(STATIONS, () => DECK, 0.9, -6.95, -2.6);
  const castleH = 1.75;
  const castle = slab(castleShape, castleH, DECK, '#6e5038');
  g.add(castle);
  const castleRoof = slab(outlineShape(STATIONS, () => DECK, 0.99, -7.05, -2.45), 0.14, DECK + castleH, '#7a5b3d');
  g.add(castleRoof);
  // finestre del cassero, lato vicino
  for (const x of [-6.0, -5.1, -4.2, -3.3]) {
    const u = x / HL;
    const w = beam(u) * profile(tDeck(u)) * 0.9;
    add(g, boxGeo(0.46, 0.5, 0.05), mat('#ffd9a0', { emissive: '#ffa850', emissiveIntensity: 2.0 }), [x, DECK + 0.95, w + 0.025], [0, 0, 0], [1, 1, 1], false);
    add(g, boxGeo(0.56, 0.6, 0.04), mat('#2a1d15'), [x, DECK + 0.95, w + 0.012], [0, 0, 0], [1, 1, 1], false);
    add(g, boxGeo(0.46, 0.5, 0.05), mat('#ffd9a0', { emissive: '#ffa850', emissiveIntensity: 2.0 }), [x, DECK + 0.95, -w - 0.025], [0, 0, 0], [1, 1, 1], false);
  }
  // ringhiera della poppa alta
  {
    for (const side of [-1, 1]) {
      const pts = STATIONS.filter((v) => v * HL >= -6.9 && v * HL <= -2.5).map((u) => hp(u, tDeck(u), side, 0.99).setY(DECK + castleH + 0.55));
      g.add(tube(pts, 0.04, trim, 4));
      pts.forEach((p, i) => {
        if (i % 2 === 0) add(g, cylGeo(0.035, 0.035, 0.55, 4), mat(trim), [p.x, DECK + castleH + 0.28, p.z], [0, 0, 0], [1, 1, 1], false);
      });
    }
  }
  // lanterne di poppa
  for (const z of [-0.95, 0.95]) {
    add(g, cylGeo(0.03, 0.03, 1.4, 4), mat('#3a2d22'), [-6.55, DECK + castleH + 0.7, z]);
    add(g, boxGeo(0.28, 0.4, 0.28), mat('#ffd39a', { emissive: '#ffab54', emissiveIntensity: 2.6 }), [-6.55, DECK + castleH + 1.55, z], [0, 0, 0], [1, 1, 1], false);
    add(g, coneGeo(0.24, 0.22, 4), mat('#2a1d15'), [-6.55, DECK + castleH + 1.86, z], [0, Math.PI / 4, 0], [1, 1, 1], false);
  }
  // timone
  add(g, boxGeo(0.12, 2.4, 0.5), mat('#2a1d15'), [-7.2, 0.2, 0]);
  add(g, boxGeo(0.7, 0.09, 0.09), mat('#2a1d15'), [-7.4, 2.6, 0], [0, 0, 0], [1, 1, 1], false);

  /* --- castello di prua --- */
  const foreShape = outlineShape(STATIONS, () => DECK, 0.9, 4.4, 6.6);
  g.add(slab(foreShape, 1.15, DECK, '#6e5038'));
  g.add(slab(outlineShape(STATIONS, () => DECK, 0.99, 4.3, 6.8), 0.12, DECK + 1.15, '#7a5b3d'));
  for (const x of [4.9, 5.7]) {
    const u = x / HL;
    const w = beam(u) * profile(tDeck(u)) * 0.9;
    add(g, boxGeo(0.34, 0.34, 0.05), mat('#ffd9a0', { emissive: '#ffa850', emissiveIntensity: 1.6 }), [x, DECK + 0.62, w + 0.025], [0, 0, 0], [1, 1, 1], false);
  }

  // bompresso e polena
  add(g, cylGeo(0.12, 0.2, 3.4, 6), mat('#4a3523'), [8.6, 4.35, 0], [0, 0, -1.2]);
  add(g, icoGeo(0.3, 0), mat('#c9a86a', { metalness: 0.3, roughness: 0.6 }), [7.35, 3.55, 0], [0, 0, 0], [1, 1.4, 0.8]);
  // vela di straglio
  {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(3.2, 0.9);
    shape.lineTo(0, 3.0);
    shape.closePath();
    const jib = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat(sail, { side: THREE.DoubleSide }));
    jib.position.set(5.0, 3.9, 0.0);
    jib.rotation.y = 0;
    jib.castShadow = true;
    g.add(jib);
  }

  /* --- alberi, pennoni, vele --- */
  const masts = [
    { x: 3.7, top: 9.0, w: 4.0, h: 2.3, c: sail },
    { x: 0.3, top: 10.2, w: 5.0, h: 2.8, c: sail },
  ];
  const sails = [];
  const BRACE = 0.85;
  for (const m of masts) {
    const h = m.top - DECK;
    add(g, cylGeo(0.1, 0.17, h, 7), mat('#5b4129'), [m.x, DECK + h / 2, 0]);
    add(g, cylGeo(0.26, 0.3, 0.3, 7), mat('#3a2a1f'), [m.x, DECK + 0.15, 0], [0, 0, 0], [1, 1, 1], false);

    // pennoni e vele orientati ("braccio"), così le vele si vedono di tre quarti
    const rig = new THREE.Group();
    rig.position.set(m.x, 0, 0);
    rig.rotation.y = BRACE;
    g.add(rig);
    const y1 = DECK + h * 0.84;
    add(rig, cylGeo(0.05, 0.06, m.w + 0.7, 5), mat('#5b4129'), [0, y1, 0], [Math.PI / 2, 0, 0], [1, 1, 1], false);
    const s1 = squareSail(m.w, m.h, 0.55, m.c);
    s1.position.set(0.05, y1 - m.h / 2 - 0.05, 0);
    rig.add(s1);
    const y2 = DECK + h * 0.97;
    add(rig, cylGeo(0.04, 0.045, m.w * 0.72 + 0.5, 5), mat('#5b4129'), [0, y2 - 0.4, 0], [Math.PI / 2, 0, 0], [1, 1, 1], false);
    const s2 = squareSail(m.w * 0.7, m.h * 0.62, 0.42, m.c, 6, 4);
    s2.position.set(0.04, y2 - 0.4 - m.h * 0.31 - 0.05, 0);
    rig.add(s2);
    // corda di tenuta delle vele (bugne)
    add(rig, cylGeo(0.03, 0.03, m.w, 4), mat('#3a2d22'), [0.06, y1 - m.h - 0.05, 0], [Math.PI / 2, 0, 0], [1, 1, 1], false);

    add(g, cylGeo(0.42, 0.34, 0.2, 8), mat('#3f2d1f'), [m.x, DECK + h * 0.58, 0]);
    sails.push(s1, s2);
    const rope = [];
    for (const side of [-1, 1]) {
      for (const dx of [-0.9, 0, 0.9]) {
        rope.push(new THREE.Vector3(m.x, DECK + h * 0.58, side * 0.25), new THREE.Vector3(m.x + dx, DECK + 0.3, side * 1.95));
      }
    }
    g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(rope), new THREE.LineBasicMaterial({ color: '#1c140f' })));
    for (const side of [-1, 1]) {
      for (let k = 0; k < 4; k++) {
        const y = DECK + 0.9 + k * 0.72;
        const f = 1 - (0.9 + k * 0.72) / (h * 0.58 - 0.2);
        const w = Math.max(0.3, 1.9 * f + 0.25);
        const pts = [new THREE.Vector3(m.x - 0.85 * f - 0.05, y, side * w), new THREE.Vector3(m.x + 0.85 * f + 0.05, y, side * w)];
        g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#2a1d15' })));
      }
    }
  }
  // albero di mezzana + vela latina
  {
    const x = -4.1;
    const top = DECK + castleH + 4.6;
    const base = DECK + castleH;
    add(g, cylGeo(0.08, 0.13, top - base, 6), mat('#5b4129'), [x, (base + top) / 2, 0]);
    const lat = lateen(4.2, 3.0, sail);
    lat.position.set(x - 0.35, base + 2.3, 0.05);
    g.add(lat);
    add(g, cylGeo(0.035, 0.045, 5.6, 5), mat('#5b4129'), [x - 0.15, base + 3.2, 0], [0, 0, 0.62]);
    sails.push(lat);
  }

  // bandiera
  const flagGroup = new THREE.Group();
  flagGroup.position.set(0.3, 10.2, 0);
  g.add(flagGroup);
  const flagMesh = add(flagGroup, new THREE.PlaneGeometry(1.3, 0.62, 6, 1), mat(flag, { side: THREE.DoubleSide }), [-0.65, 0.1, 0], [0, 0, 0], [1, 1, 1], false);
  const baseFlag = flagMesh.geometry.attributes.position.array.slice();
  add(g, cylGeo(0.02, 0.02, 0.7, 4), mat('#3a2d22'), [0.3, 10.45, 0], [0, 0, 0], [1, 1, 1], false);

  /* --- oggetti sul ponte --- */
  // boccaporto
  add(g, boxGeo(1.7, 0.2, 1.2), mat('#4a3523'), [2.0, DECK + 0.1, 0.1]);
  add(g, boxGeo(1.45, 0.05, 0.95), mat('#ffcf94', { emissive: '#ffa850', emissiveIntensity: 1.1 }), [2.0, DECK + 0.21, 0.1], [0, 0, 0], [1, 1, 1], false);
  for (let i = -3; i <= 3; i++) add(g, boxGeo(0.05, 0.07, 0.95), mat('#2a1d15'), [2.0 + i * 0.22, DECK + 0.25, 0.1], [0, 0, 0], [1, 1, 1], false);
  // cabestano
  add(g, cylGeo(0.28, 0.34, 0.6, 8), mat('#4a3523'), [-1.3, DECK + 0.3, 0.2]);
  add(g, cylGeo(0.1, 0.1, 0.1, 6), mat('#2a1d15'), [-1.3, DECK + 0.66, 0.2]);
  // barili e casse sul ponte
  for (const [x, z, s] of [[-2.2, -1.25, 1], [-2.7, -1.0, 0.85], [5.3, 0.95, 0.9]]) {
    add(g, cylGeo(0.3 * s, 0.27 * s, 0.7 * s, 8), mat('#8a6747'), [x, DECK + 0.35 * s, z]);
    add(g, new THREE.TorusGeometry(0.295 * s, 0.035, 4, 9), mat('#3f342a'), [x, DECK + 0.5 * s, z], [Math.PI / 2, 0, 0], [1, 1, 1], false);
  }
  add(g, boxGeo(0.7, 0.55, 0.7), mat('#98724b'), [-1.6, DECK + 0.28, -1.35]);
  add(g, boxGeo(0.5, 0.4, 0.5), mat('#8a6747'), [-1.7, DECK + 0.75, -1.35], [0, 0.4, 0], [1, 1, 1], false);
  // scialuppa rovesciata sul ponte
  {
    const boat = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 5, 0, TAU, 0, Math.PI / 2), mat('#6b4a33'));
    boat.scale.set(1.5, 0.55, 0.62);
    boat.position.set(-0.5, DECK + 0.02, -1.0);
    boat.castShadow = true;
    g.add(boat);
  }
  // fanale a prua
  add(g, cylGeo(0.02, 0.02, 0.5, 4), mat('#3a2d22'), [6.0, DECK + 1.4, 0.0]);
  add(g, boxGeo(0.22, 0.3, 0.22), mat('#ffd39a', { emissive: '#ffab54', emissiveIntensity: 2.6 }), [6.0, DECK + 1.75, 0], [0, 0, 0], [1, 1, 1], false);

  // schiuma attorno allo scafo, alla linea di galleggiamento
  {
    const WL = 0.1;
    const pts = STATIONS.filter((u) => keelY(u) < WL - 0.05);
    const w = (u, k) => beam(u) * profile(Math.min(1, Math.max(0, tAt(u, WL)))) * k;
    const shape = new THREE.Shape();
    shape.moveTo(pts[0] * HL - 0.25 * 1, 0);
    pts.forEach((u) => shape.lineTo(u * HL, w(u, 1.1)));
    shape.lineTo(pts[pts.length - 1] * HL + 0.35, 0);
    for (let i = pts.length - 1; i >= 0; i--) shape.lineTo(pts[i] * HL, -w(pts[i], 1.1));
    shape.closePath();
    const hole = new THREE.Path();
    hole.moveTo(pts[0] * HL + 0.1, 0);
    pts.forEach((u) => hole.lineTo(u * HL, -w(u, 0.96)));
    for (let i = pts.length - 1; i >= 0; i--) hole.lineTo(pts[i] * HL, w(pts[i], 0.96));
    hole.closePath();
    shape.holes.push(hole);
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    const foam = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ color: '#cfe6ee', transparent: true, opacity: 0.38, depthWrite: false, fog: true })
    );
    foam.position.y = WL + 0.05;
    foam.renderOrder = 3;
    g.add(foam);
  }

  g.userData.update = (t) => {
    const p = flagMesh.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = baseFlag[i * 3];
      p.setZ(i, Math.sin(x * 5 - t * 4) * 0.09 * (0.65 - x));
    }
    p.needsUpdate = true;
  };

  return g;
}
