import * as THREE from 'three';
import {
  add,
  mat,
  boxGeo,
  cylGeo,
  coneGeo,
  icoGeo,
  rng,
  rr,
  makeSky,
  makeSun,
  makeCloud,
  makeIsland,
  makeWater,
  makeCypress,
  makeTree,
  makeBird,
  makeSmokePuffs,
} from '../lib/lowpoly.js';
import {
  makeHouse,
  makeShip,
  makeDock,
  makeBanner,
  makeCart,
  makeBarrel,
  makeCrate,
  makeCoin,
} from '../lib/world.js';
import { makeFigure, idlePose, walkPose, raiseArm } from '../lib/figures.js';
import { makePriestModel } from '../lib/priest.js';
import { makeMotes, makeBundle, makeChest, makeLedger, smoothstep, dampAngle } from './shared.js';

/* ------------------------------------------------------------------ */
/* porta del borgo                                                     */
/* ------------------------------------------------------------------ */

function makeGate() {
  const g = new THREE.Group();
  const stone = '#cbbb9f';
  const dark = '#3c3229';

  add(g, boxGeo(3.8, 5.6, 1.6), mat(stone), [0, 2.8, 0]);
  add(g, boxGeo(2.2, 3.5, 0.3), mat(dark), [0, 1.75, 0.82]);
  add(g, new THREE.CircleGeometry(1.1, 12, 0, Math.PI), mat(dark), [0, 3.5, 0.84], [0, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(4.2, 0.35, 1.9), mat('#b6a68b'), [0, 5.55, 0]);
  add(g, boxGeo(4.6, 0.2, 2.1), mat('#a4937a'), [0, 5.78, 0], [0, 0, 0], [1, 1, 1], false);

  for (const sx of [-1, 1]) {
    add(g, boxGeo(1.7, 6.4, 1.7), mat('#d3c2a6'), [sx * 2.9, 3.2, 0]);
    add(g, boxGeo(1.95, 0.3, 1.95), mat('#a4937a'), [sx * 2.9, 6.5, 0], [0, 0, 0], [1, 1, 1], false);
    add(g, coneGeo(1.4, 1.8, 4), mat('#a9573f'), [sx * 2.9, 7.55, 0], [0, Math.PI / 4, 0]);
    add(g, boxGeo(0.16, 1.0, 0.1), mat('#2f2a26'), [sx * 2.9, 4.6, 0.87], [0, 0, 0], [1, 1, 1], false);
  }

  const doors = [];
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * 1.08, 0, 0.76);
    g.add(pivot);
    add(pivot, boxGeo(1.06, 3.3, 0.14), mat('#5c4028'), [-sx * 0.53, 1.68, 0]);
    add(pivot, boxGeo(0.9, 0.08, 0.16), mat('#3f2c1c'), [-sx * 0.53, 2.6, 0.02], [0, 0, 0], [1, 1, 1], false);
    add(pivot, boxGeo(0.9, 0.08, 0.16), mat('#3f2c1c'), [-sx * 0.53, 1.05, 0.02], [0, 0, 0], [1, 1, 1], false);
    doors.push({ pivot, sx });
  }

  return { group: g, doors };
}

/* ------------------------------------------------------------------ */
/* quadro: la partenza                                                 */
/* ------------------------------------------------------------------ */

export function buildPartenza() {
  const g = new THREE.Group();

  g.add(
    makeSky([
      [0, '#3f4d78'],
      [0.38, '#8a6a76'],
      [0.62, '#d08a5f'],
      [0.8, '#f0bd82'],
      [1, '#5c3f35'],
    ])
  );
  g.add(makeSun('#ffcf94', 6, [-85, 8, -70]));
  g.add(makeCloud([-50, 34, -80], 2.6, '#e7c4ac'));
  g.add(makeCloud([46, 44, -100], 2.0, '#f2d7bd'));

  const island = makeIsland({
    radius: 14,
    depth: 4.2,
    hill: 1.7,
    seed: 8,
    top: '#8a9566',
    topAlt: '#7a8558',
    soil: '#7d6046',
    rock: '#5c4a39',
  });
  g.add(island.group);
  const h = island.heightAt;

  const gate = makeGate();
  gate.group.position.set(0, h(0, -2.6) - 0.1, -2.6);
  g.add(gate.group);
  const banner = makeBanner({ color: '#a8493c', accent: '#e7d6b6' });
  banner.position.set(3.1, h(3.1, -2.6) - 0.1, -1.4);
  g.add(banner);

  // strada
  for (let i = 0; i < 12; i++) {
    const z = 0.2 + i * 0.95;
    const y = h(0.4, z) + 0.03;
    add(g, boxGeo(3.4 - i * 0.03, 0.18, 1.05), mat(i % 2 ? '#b3a086' : '#ad9a80'), [0.2, y, z], [0, 0.02, 0], [1, 1, 1], false);
  }

  const houses = [
    [-6.9, -2.0, 0.42, '#e7dac2', '#a9573f', 3.4],
    [6.9, -2.4, -0.4, '#decfb6', '#96503c', 3.1],
    [-8.2, 3.4, 0.9, '#e9dcc4', '#b4624a', 2.8],
  ];
  const r = rng(21);
  for (const [x, z, ry, wall, roof, w] of houses) {
    const house = makeHouse({ w, d: 2.7, h: 3.5, wall, roof, seed: Math.floor(rr(r, 1, 999)), lit: 0.22, floors: 2, timber: true });
    house.position.set(x, h(x, z) - 0.12, z);
    house.rotation.y = ry;
    g.add(house);
  }

  for (const [x, z, sc] of [
    [-11.0, 1.2, 4.4],
    [11.2, 2.0, 4.0],
    [-9.5, -6.0, 3.8],
    [9.6, -7.0, 4.2],
    [-5.2, 8.2, 3.4],
    [6.4, 8.6, 3.6],
  ]) {
    const cyp = makeCypress(sc);
    cyp.position.set(x, h(x, z), z);
    g.add(cyp);
  }

  const priest = makePriestModel({
    x: 1.7,
    y: h(1.7, 0.3),
    z: 0.3,
    ry: 0.5,
    vestment: 'cassock',
    hat: 'biretta',
    spectacles: true,
  });
  g.add(priest.group);

  const domenico = makeFigure({
    x: 2.7,
    y: h(2.7, 3.6),
    z: 3.6,
    ry: 2.75,
    longRobe: true,
    robe: '#3f5060',
    accent: '#d9c7a5',
    hat: 'merchant',
    bag: true,
    cloak: '#33434f',
  });
  g.add(domenico.group);

  const claudio = makeFigure({
    x: 0.3,
    y: h(0.3, 5.2),
    z: 5.2,
    ry: 3.35,
    child: true,
    robe: '#b5764f',
    accent: '#e3d2b2',
  });
  g.add(claudio.group);
  const bundle1 = makeBundle('#b9a077');
  bundle1.position.set(-0.34, 0.62, 0.08);
  bundle1.scale.setScalar(0.85);
  claudio.body.add(bundle1);

  const sonia = makeFigure({
    x: -1.9,
    y: h(-1.9, 1.5),
    z: 1.5,
    ry: 0.15,
    longRobe: true,
    robe: '#7f4a52',
    accent: '#cdbb99',
    veil: '#c9b18c',
    bun: true,
  });
  g.add(sonia.group);

  const geppetto = makeFigure({
    x: -4.7,
    y: h(-4.7, 0.6),
    z: 0.6,
    ry: 0.95,
    longRobe: true,
    robe: '#4a586c',
    accent: '#c9b99a',
    book: true,
  });
  g.add(geppetto.group);

  const walkers = [domenico, claudio];
  const kid2 = makeFigure({
    x: -1.0,
    y: h(-1.0, 6.4),
    z: 6.4,
    ry: 3.25,
    child: true,
    robe: '#6b7a8c',
    accent: '#d9c9a8',
  });
  g.add(kid2.group);
  const bundle2 = makeBundle('#c2ab80');
  bundle2.position.set(0.32, 0.6, 0.05);
  bundle2.scale.setScalar(0.8);
  kid2.body.add(bundle2);
  walkers.push(kid2);

  const kid3 = makeFigure({
    x: 1.9,
    y: h(1.9, 6.9),
    z: 6.9,
    ry: 3.1,
    child: true,
    robe: '#a9704c',
    accent: '#dccbaa',
  });
  g.add(kid3.group);
  walkers.push(kid3);

  const walkerBases = walkers.map((f) => [f.group.position.x, f.group.position.z]);
  const walkerTargets = [
    [1.5, 0.6],
    [0.3, 1.4],
    [-0.4, 2.4],
    [1.1, 3.0],
  ];

  const villagers = [
    [-4.3, 5.4, 2.4],
    [4.7, 5.0, -2.2],
  ];
  const crowd = [];
  for (const [x, z, ry] of villagers) {
    const fig = makeFigure({ x, y: h(x, z), z, ry, longRobe: true, robe: '#6a5b47', accent: '#cdbb99', veil: '#b9a687', bun: true });
    g.add(fig.group);
    crowd.push(fig);
  }

  const cart = makeCart();
  cart.group.position.set(8.6, h(8.6, 4.2) - 0.1, 4.2);
  cart.group.rotation.y = -1.3;
  g.add(cart.group);

  const birds = [];
  for (let i = 0; i < 4; i++) {
    const b = makeBird('#3a3630');
    b.group.scale.setScalar(0.9);
    g.add(b.group);
    birds.push({ b, phase: rr(r, 0, Math.PI * 2), rad: rr(r, 6, 11), speed: rr(r, 0.1, 0.22), hgt: rr(r, 9, 13) });
  }

  return {
    group: g,
    mood: {
      bg: '#8a6a76',
      fog: ['#c49179', 40, 135],
      hemi: ['#a9a9c8', '#6a4a35', 0.95],
      sun: ['#ffbf85', 2.6, [-0.55, 0.38, 0.35]],
      exposure: 1.05,
      shadow: 26,
    },
    camera: { pos: [13.5, 7.8, 18.5], look: [-0.6, 2.9, 1.8], fov: 41 },
    update(t, intro) {
      const open = Math.min(1, Math.max(0, (intro - 0.12) / 0.6));
      for (const d of gate.doors) d.pivot.rotation.y = d.sx * smoothstep(open) * 1.35;

      const march = smoothstep((intro - 0.12) / 0.7);
      walkers.forEach((f, i) => {
        const u = Math.max(0, Math.min(1, march * 1.35 - i * 0.08));
        const from = walkerBases[i];
        const to = walkerTargets[i];
        const x = from[0] + (to[0] - from[0]) * u;
        const z = from[1] + (to[1] - from[1]) * u;
        f.group.position.set(x, h(x, z) + 0.02, z);
        const turnBack = i === 1 && u > 0.9;
        f.group.rotation.y = dampAngle(f.group.rotation.y, turnBack ? 0.35 : Math.PI, 0.09);
        const walking = u > 0.01 && u < 0.985;
        walkPose(f, t * 2.4 + i * 1.2, walking ? 0.4 : 0);
        const wave = i === 1 ? smoothstep((u - 0.9) / 0.1) : 0;
        if (wave > 0.001) raiseArm(f, 'right', wave * 0.55, 0.2);
      });
      crowd.forEach((f, i) => idlePose(f, t + i, 0.7));

      const send = smoothstep((intro - 0.3) / 0.45);
      sonia.group.position.x = -1.9 + send * 0.5;
      sonia.group.position.z = 1.5 + send * 0.5;
      sonia.group.position.y = h(sonia.group.position.x, sonia.group.position.z);
      sonia.group.rotation.y = 0.15 + send * 0.25;
      sonia.head.rotation.y = 0.4;
      sonia.armR.rotation.x = -1.35;
      sonia.armR.rotation.z = 0.2;
      sonia.body.rotation.x = 0.05;
      claudio.head.rotation.y = 0.55;
      claudio.head.rotation.z = 0.06;
      claudio.armL.rotation.z = 0.25;

      domenico.armR.rotation.x = -0.45 + Math.sin(t * 0.8) * 0.1;
      domenico.armR.rotation.z = 0.2;
      domenico.head.rotation.y = -0.15;

      raiseArm(priest, 'right', 0.55 + Math.sin(t * 0.7) * 0.1, 0.22);
      priest.head.rotation.y = 0.35;

      geppetto.head.rotation.x = 0.12;
      geppetto.armL.rotation.x = -0.5;

      for (const b of birds) {
        const a = b.phase + t * b.speed;
        b.b.group.position.set(Math.cos(a) * b.rad, b.hgt + Math.sin(t * 0.6 + b.phase) * 0.5, Math.sin(a) * b.rad + 2);
        b.b.group.rotation.y = -a;
        b.b.update(t, 7);
      }
      cart.wheels.forEach((w) => (w.rotation.x = 0));
    },
  };
}

/* ------------------------------------------------------------------ */
/* porto                                                               */
/* ------------------------------------------------------------------ */

function makePort({ seed = 8, ships = [], lit = 0.2, lamp = false } = {}) {
  const g = new THREE.Group();
  const WATER_Y = 0.72;
  const smooth = (a, b, x) => {
    const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return u * u * (3 - 2 * u);
  };

  const wave = (x, z) =>
    0.15 * Math.sin(x * 0.42 + seed) * Math.cos(z * 0.34 - seed * 0.7) +
    0.1 * Math.sin((x + z) * 0.33 + seed * 2.1);

  // terra pianeggiante senza picchi o montagne triangolari al centro, con baia scavata davanti al molo
  const heightMod = (x, z) => {
    const d = Math.min(1, Math.hypot(x, z) / 16);
    const land = (1.85 + wave(x, z)) * (1.0 - smooth(0.65, 1.0, d));
    const bayD = Math.hypot(x / 11, (z - 15) / 9);
    const bay = smooth(0, 1, (1 - bayD) / 0.45);
    return land * (1 - bay) + -0.6 * bay;
  };

  const grass = new THREE.Color('#8fa070');
  const grassAlt = new THREE.Color('#7a8d5a');
  const sand = new THREE.Color('#cdb98f');
  const seabed = new THREE.Color('#3f6d73');
  const tint = (x, z, y) => {
    const c = grass.clone();
    c.lerp(grassAlt, 0.5 + 0.5 * Math.sin(x * 0.55 + seed) * Math.cos(z * 0.45 - seed));
    c.lerp(sand, 1 - smooth(0.95, 1.55, y));
    c.lerp(seabed, 1 - smooth(-0.6, 0.45, y));
    return c;
  };

  const island = makeIsland({
    radius: 16,
    depth: 4.6,
    hill: 0,
    seed,
    top: '#84936a',
    topAlt: '#75845c',
    soil: '#7a6049',
    rock: '#5b4a39',
    rings: 16,
    sectors: 72,
    heightMod,
    tint,
    selfShadow: false,
  });
  g.add(island.group);
  const h = island.heightAt;
  const r = rng(seed * 5 + 3);

  const water = makeWater({ radius: 12.8, y: WATER_Y, color: '#336f80', rings: 10, sectors: 54, amp: 0.16, speed: 1 });
  water.position.set(0, 0, 10);
  g.add(water);

  // cascata sul bordo
  const falls = [];
  for (let i = 0; i < 4; i++) {
    const slab = add(
      g,
      boxGeo(4.4 - i * 0.35, 1.7, 0.45),
      mat('#9ed4e2', { transparent: true, opacity: 0.5 - i * 0.06, roughness: 0.2, metalness: 0.1 }),
      [0, 0.3 - i * 1.55, 22.5],
      [0, 0, 0],
      [1, 1, 1],
      false
    );
    falls.push(slab);
  }
  const mist = makeSmokePuffs(4, '#dceef4');
  mist.forEach((p, i) => {
    p.scale.setScalar(2.2 + i * 0.4);
    p.position.set(rr(r, -2.2, 2.2), -6.4, 22.4);
    p.material.opacity = 0.16;
    g.add(p);
  });

  // molo
  add(g, boxGeo(9.2, 0.7, 3.6), mat('#a3947c'), [0.6, 1.1, 8.1]);
  add(g, boxGeo(9.6, 0.18, 3.9), mat('#c1b198'), [0.6, 1.5, 8.1], [0, 0, 0], [1, 1, 1], false);
  for (let i = 0; i < 3; i++) {
    add(g, boxGeo(2.4, 0.26, 0.7), mat('#b3a289'), [3.4, 1.28 - i * 0.26, 10.1 + i * 0.62], [0, 0, 0], [1, 1, 1], false);
  }
  for (const [x, z] of [[-3.6, 6.6], [-3.6, 9.4], [4.6, 6.6], [4.6, 9.4]]) {
    add(g, cylGeo(0.15, 0.18, 1.2, 6), mat('#5f452f'), [x, 1.55, z]);
    add(g, coneGeo(0.22, 0.25, 6), mat('#4a3525'), [x, 2.2, z]);
  }
  add(g, boxGeo(0.14, 0.14, 3.6), mat('#6d5136'), [-3.6, 2.0, 8.0], [0, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(0.14, 0.14, 3.6), mat('#6d5136'), [4.6, 2.0, 8.0], [0, 0, 0], [1, 1, 1], false);

  // case e magazzini
  const buildings = [
    [-8.4, 1.2, 0.55, '#e7dac2', '#a9573f', 4.2],
    [-3.2, -4.6, 0.1, '#decfb6', '#96503c', 3.4],
    [2.4, -6.2, -0.15, '#e9dcc4', '#b4624a', 3.2],
    [7.4, -2.0, -0.5, '#d7c9b2', '#8f4a39', 3.0],
    [-9.6, 6.4, 0.85, '#e2d4bc', '#ad6247', 2.9],
  ];
  for (const [x, z, ry, wall, roof, w] of buildings) {
    const house = makeHouse({ w, d: 3.0, h: 3.6, wall, roof, seed: Math.floor(rr(r, 1, 999)), lit, floors: 2, timber: true });
    house.position.set(x, h(x, z) - 0.12, z);
    house.rotation.y = ry;
    g.add(house);
  }

  // campanile sul colle
  add(g, boxGeo(2.3, 7.0, 2.3), mat('#d6c8b1'), [5.6, h(5.6, -4.6) + 3.4, -4.6]);
  add(g, boxGeo(2.6, 0.3, 2.6), mat('#b6a68b'), [5.6, h(5.6, -4.6) + 7.0, -4.6], [0, 0, 0], [1, 1, 1], false);
  add(g, coneGeo(1.8, 2.0, 4), mat('#8f4a39'), [5.6, h(5.6, -4.6) + 8.15, -4.6], [0, Math.PI / 4, 0]);

  // faro, su uno scoglio all'ingresso della baia (lato ovest)
  const LX = -12.4;
  const LZ = 5.2;
  const rock = add(g, icoGeo(1.8, 0), mat('#6b5946'), [LX, 0.5, LZ], [0, 0, 0], [1, 0.9, 1]);
  add(g, cylGeo(0.85, 1.15, 5.6, 8), mat('#e6dcc4'), [LX, 3.9, LZ]);
  add(g, cylGeo(0.85, 0.85, 0.3, 8), mat('#9c8a6f'), [LX, 6.7, LZ], [0, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(1.0, 0.9, 1.0), mat('#3b3a38'), [LX, 7.25, LZ]);
  const lampMesh = add(g, boxGeo(0.6, 0.6, 0.6), mat('#ffd9a2', { emissive: '#ffb05c', emissiveIntensity: lamp ? 2.4 : 1.4 }), [LX, 7.25, LZ], [0, 0, 0], [1, 1, 1], false);
  add(g, coneGeo(0.85, 0.7, 4), mat('#8f4a39'), [LX, 8.05, LZ], [0, Math.PI / 4, 0]);
  if (lamp) {
    const l = new THREE.PointLight('#ffc27a', 40, 26, 1.9);
    l.position.set(LX, 7.2, LZ);
    g.add(l);
  }

  // cipressi e alberi sulle alture, solo dove la terra è ben sopra il mare
  const treeSpots = [
    ['c', -12.2, 1.6, 3.6], ['c', -11.2, -3.6, 3.9], ['c', 9.8, 1.8, 3.4], ['c', 11.4, -3.2, 3.8],
    ['c', -6.2, -8.0, 3.8], ['c', 6.6, -8.2, 4.1], ['c', 0.2, -9.6, 3.6], ['c', -7.4, -3.2, 3.2],
    ['t', -1.6, 2.2, 2.4], ['t', 3.6, 0.6, 2.2], ['t', -5.6, 3.6, 2.2], ['t', 8.4, 3.4, 2.1],
  ];
  for (const [kind, x, z, sc] of treeSpots) {
    const y = h(x, z);
    if (y < 1.0) continue;
    const tree = kind === 'c' ? makeCypress(sc, '#4a6741') : makeTree(sc, '#7a9358');
    tree.position.set(x, y - 0.05, z);
    g.add(tree);
  }

  const shipData = [];
  for (const [x, z, s, ry] of ships) {
    const ship = makeShip({ scale: s });
    ship.position.set(x, 0.72, z);
    ship.rotation.y = ry;
    g.add(ship);
    shipData.push({ ship, baseY: 0.72, phase: rr(r, 0, Math.PI * 2), amp: rr(r, 0.06, 0.12) });
  }

  const gulls = [];
  for (let i = 0; i < 4; i++) {
    const bird = makeBird('#4a4a48');
    g.add(bird.group);
    gulls.push({ bird, phase: rr(r, 0, Math.PI * 2), rad: rr(r, 8, 14), speed: rr(r, 0.14, 0.28), hgt: rr(r, 9, 14) });
  }

  return { group: g, h, water, falls, mist, ships: shipData, gulls, lampMesh, quayY: 1.5 };
}

function makeQuayKids(list) {
  const kids = [];
  for (const spec of list) {
    const fig = makeFigure({ ...spec, child: true, y: 1.5 });
    kids.push(fig);
  }
  return kids;
}

/* ------------------------------------------------------------------ */
/* quadro: Genova, il mare che non si apre                             */
/* ------------------------------------------------------------------ */

export function buildGenova() {
  const g = new THREE.Group();

  g.add(
    makeSky([
      [0, '#728a9e'],
      [0.42, '#a7bac4'],
      [0.74, '#d5d8cf'],
      [1, '#e8ddc4'],
    ])
  );
  g.add(makeSun('#fff0cc', 8, [26, 30, 150]));
  g.add(makeCloud([-60, 34, 70], 2.8, '#e9eeea'));
  g.add(makeCloud([52, 40, 90], 2.2, '#f2f4ee'));

  const port = makePort({
    seed: 8,
    lit: 0.16,
    ships: [
      [2.8, 13.4, 1.15, 0.3],
      [-4.6, 14.6, 1.0, -0.38],
      [8.2, 17.2, 0.85, 0.9],
    ],
  });
  g.add(port.group);

  const kids = makeQuayKids([
    { x: -1.9, z: 8.7, ry: 0.12, robe: '#b5764f', accent: '#e3d2b2' },
    { x: -0.8, z: 9.1, ry: -0.1, robe: '#6b7a8c', accent: '#d9c9a8' },
    { x: 0.2, z: 9.3, ry: 0.05, robe: '#a9704c', accent: '#dccbaa' },
    { x: 1.2, z: 9.0, ry: -0.14, robe: '#8d6b8e', accent: '#dccbaa' },
    { x: 2.1, z: 8.6, ry: 0.16, robe: '#6f7448', accent: '#d8c8ab' },
  ]);
  for (const kid of kids) g.add(kid.group);

  const kidBases = kids.map((k) => [k.group.position.x, k.group.position.z]);

  const domenico = makeFigure({
    x: 4.0,
    y: 1.5,
    z: 7.4,
    ry: 2.4,
    longRobe: true,
    robe: '#3f5060',
    accent: '#d9c7a5',
    hat: 'merchant',
    bag: true,
  });
  g.add(domenico.group);

  const friar = makeFigure({
    x: -4.2,
    y: 1.5,
    z: 7.6,
    ry: 0.35,
    longRobe: true,
    robe: '#54473c',
    accent: '#c9b99a',
    beard: true,
  });
  g.add(friar.group);

  const motes = makeMotes({ count: 30, spread: [10, 4, 5], center: [0, 3, 13], color: '#dbe9ee', opacity: 0.35, size: 0.09 });
  g.add(motes);

  return {
    group: g,
    mood: {
      bg: '#9fb2bd',
      fog: ['#c3ccce', 40, 150],
      hemi: ['#c3d6e6', '#5c6660', 1.2],
      sun: ['#ffedd0', 2.1, [0.28, 0.6, -0.75]],
      exposure: 1.0,
      shadow: 26,
    },
    camera: { pos: [7.6, 6.8, 2.6], look: [-2.6, 2.6, 10.2], fov: 42 },
    update(t, intro) {
      port.water.update(t);
      port.gulls.forEach((gl, i) => {
        const a = gl.phase + t * gl.speed;
        gl.bird.group.position.set(Math.cos(a) * gl.rad, gl.hgt + Math.sin(t * 0.5 + gl.phase) * 0.7, 12 + Math.sin(a) * gl.rad * 0.7);
        gl.bird.group.rotation.y = -a;
        gl.bird.update(t, 6);
      });
      for (const s of port.ships) {
        s.ship.position.y = s.baseY + Math.sin(t * 0.8 + s.phase) * s.amp;
        s.ship.rotation.z = Math.sin(t * 0.62 + s.phase) * 0.025;
        s.ship.userData.update(t);
      }
      const step = smoothstep((intro - 0.12) / 0.6);
      for (let i = 0; i < kids.length; i++) {
        idlePose(kids[i], t + i * 0.6, 0.7);
        const move = Math.max(0, Math.min(1, step * 1.25 - i * 0.05));
        kids[i].group.position.x = kidBases[i][0];
        kids[i].group.position.z = kidBases[i][1] + move * 0.45;
        const w = move * (0.55 + 0.45 * Math.sin(t * 0.5 + i * 0.6));
        raiseArm(kids[i], i % 2 ? 'left' : 'right', w, 0.18);
        kids[i].head.rotation.y = Math.sin(t * 0.35 + i) * 0.08;
      }
      kids[2].head.rotation.x = -0.12 * step;

      domenico.armL.rotation.x = -0.75;
      domenico.armL.rotation.z = -0.3;
      domenico.head.rotation.y = 0.2;

      friar.head.rotation.x = 0.22;
      const bless = 0.35 + 0.3 * Math.sin(t * 0.7);
      friar.armL.rotation.x = -0.85 - bless * 0.3;
      friar.armL.rotation.z = -0.4 - bless * 0.25;
      friar.armR.rotation.x = -0.85 - bless * 0.3;
      friar.armR.rotation.z = 0.4 + bless * 0.25;
      motes.userData.update(t);
    },
  };
}

/* ------------------------------------------------------------------ */
/* quadro: le navi di Domenico                                         */
/* ------------------------------------------------------------------ */

export function buildNavi() {
  const g = new THREE.Group();

  g.add(
    makeSky([
      [0, '#20304e'],
      [0.32, '#565070'],
      [0.55, '#a86862'],
      [0.72, '#f0a878'],
      [0.86, '#c07a5e'],
      [1, '#3a2622'],
    ])
  );
  g.add(makeSun('#ffb680', 7, [-80, 10, -60]));
  g.add(makeCloud([-50, 30, 90], 2.6, '#d8a896'));
  g.add(makeCloud([44, 38, 110], 2.0, '#f0c3a4'));

  const port = makePort({
    seed: 19,
    lit: 0.55,
    lamp: true,
    ships: [
      [-2.6, 12.9, 1.25, 0.14],
      [4.4, 15.4, 1.0, -0.42],
      [-9.4, 15.9, 0.9, 0.5],
    ],
  });
  g.add(port.group);

  const chest = makeChest({ w: 0.95, h: 0.55 });
  chest.position.set(2.2, 1.58, 7.4);
  chest.rotation.y = -0.4;
  g.add(chest);
  for (let i = 0; i < 6; i++) {
    const c = makeCoin();
    c.position.set(2.0 + (i % 3) * 0.14, 2.14 + Math.floor(i / 3) * 0.02, 7.4 + (i % 2) * 0.1);
    c.rotation.x = Math.PI / 2;
    g.add(c);
  }

  const domenico = makeFigure({
    x: 3.6,
    y: 1.5,
    z: 8.4,
    ry: 2.5,
    longRobe: true,
    robe: '#3f5060',
    accent: '#d9c7a5',
    hat: 'merchant',
    cloak: '#33434f',
  });
  g.add(domenico.group);

  const ledger = makeLedger();
  ledger.position.set(2.9, 1.62, 9.0);
  ledger.rotation.y = 0.9;
  g.add(ledger);

  // passerella verso la nave principale
  const plank = add(g, boxGeo(1.5, 0.12, 5.4), mat('#8f6c47'), [1.3, 1.55, 11.0], [0.04, 0.56, 0], [1, 1, 1], true);
  add(g, boxGeo(0.14, 0.5, 5.4), mat('#6d5136'), [0.6, 1.8, 11.0], [0.04, 0.56, 0], [1, 1, 1], false);
  add(g, boxGeo(0.14, 0.5, 5.4), mat('#6d5136'), [2.0, 1.8, 11.0], [0.04, 0.56, 0], [1, 1, 1], false);

  const boarding = [];
  const specs = [
    [0.4, 9.6, 0.55],
    [0.9, 10.6, 0.62],
    [1.4, 11.6, 0.7],
  ];
  for (const [x, z, y] of specs) {
    const fig = makeFigure({ x, y: y + 1.3, z, ry: 0.2, child: true, robe: '#b5764f', accent: '#e3d2b2' });
    g.add(fig.group);
    boarding.push(fig);
  }
  // percorso lungo la passerella (inizio banchina → fiancata della nave)
  const boardPath = { from: [0.08, 1.69, 9.05], to: [2.52, 1.53, 12.95], heading: 0.56 };

  const kidDeck = makeFigure({ x: 0.4, y: 0.62, z: 0.6, ry: 2.2, child: true, robe: '#6b7a8c', accent: '#d9c9a8' });
  port.ships[0].ship.add(kidDeck.group);
  const kidDeck2 = makeFigure({ x: -0.4, y: 0.62, z: -0.8, ry: 2.6, child: true, robe: '#a9704c', accent: '#dccbaa' });
  port.ships[0].ship.add(kidDeck2.group);

  const waiting = [];
  for (let i = 0; i < 4; i++) {
    const fig = makeFigure({
      x: -2.4 + i * 0.8,
      y: 1.5,
      z: 9.2 + (i % 2) * 0.3,
      ry: 0.3 + i * 0.05,
      child: true,
      robe: ['#8d6b8e', '#6f7448', '#a9704c', '#6b7a8c'][i],
      accent: '#dccbaa',
    });
    g.add(fig.group);
    waiting.push(fig);
  }

  const lanternPoles = [];
  for (const [x, z] of [[-1.6, 6.8], [5.0, 6.8]]) {
    add(g, cylGeo(0.07, 0.09, 3.4, 5), mat('#4d3826'), [x, 3.2, z]);
    const lamp = add(g, boxGeo(0.34, 0.4, 0.34), mat('#ffd9a2', { emissive: '#ffab54', emissiveIntensity: 2.2 }), [x, 4.95, z], [0, 0, 0], [1, 1, 1], false);
    add(g, coneGeo(0.3, 0.3, 4), mat('#3b2f26'), [x, 5.25, z], [0, Math.PI / 4, 0]);
    lanternPoles.push(lamp);
  }

  const motes = makeMotes({ count: 40, spread: [10, 4, 6], center: [0, 3, 10], color: '#ffd7a0', opacity: 0.5, size: 0.075 });
  g.add(motes);

  return {
    group: g,
    mood: {
      bg: '#4a4050',
      fog: ['#8a6158', 45, 160],
      hemi: ['#8a94b8', '#4a3026', 1.1],
      sun: ['#ffb27a', 2.8, [-0.52, 0.32, -0.62]],
      exposure: 1.16,
      shadow: 26,
    },
    camera: { pos: [16.5, 10.8, 26.0], look: [-2.0, 3.0, 8.0], fov: 42 },
    update(t, intro) {
      port.water.update(t);
      port.gulls.forEach((gl) => {
        const a = gl.phase + t * gl.speed;
        gl.bird.group.position.set(Math.cos(a) * gl.rad, gl.hgt + Math.sin(t * 0.5 + gl.phase) * 0.7, 10 + Math.sin(a) * gl.rad * 0.7);
        gl.bird.group.rotation.y = -a;
        gl.bird.update(t, 6);
      });
      for (const s of port.ships) {
        s.ship.position.y = s.baseY + Math.sin(t * 0.75 + s.phase) * s.amp;
        s.ship.rotation.z = Math.sin(t * 0.58 + s.phase) * 0.03;
        s.ship.userData.update(t);
      }
      port.falls.forEach((f, i) => {
        f.position.y = 0.3 - i * 1.55 + Math.sin(t * 1.3 + i) * 0.06;
        f.scale.y = 1 + Math.sin(t * 2.1 + i * 0.7) * 0.05;
      });

      boarding.forEach((fig, i) => {
        const u = (t * 0.06 + i / boarding.length) % 1;
        const fade = smoothstep(Math.min(1, Math.min(u, 1 - u) / 0.1));
        fig.group.position.set(
          boardPath.from[0] + (boardPath.to[0] - boardPath.from[0]) * u,
          boardPath.from[1] + (boardPath.to[1] - boardPath.from[1]) * u,
          boardPath.from[2] + (boardPath.to[2] - boardPath.from[2]) * u
        );
        fig.group.rotation.y = boardPath.heading;
        fig.group.scale.setScalar(fig.scale * (0.001 + 0.999 * fade));
        walkPose(fig, t * 3 + i * 0.8, 0.4);
      });
      waiting.forEach((fig, i) => idlePose(fig, t + i * 0.7, 0.7));
      kidDeck.armR.rotation.x = -0.9;
      kidDeck.head.rotation.y = -0.3;

      domenico.armR.rotation.x = -0.95 - Math.sin(t * 0.9) * 0.15;
      domenico.armR.rotation.z = 0.35;
      domenico.head.rotation.y = 0.25;
      domenico.head.rotation.x = 0.12;

      motes.userData.update(t);
      lanternPoles.forEach((l, i) => {
        l.position.x = (i === 0 ? -1.6 : 5.0) + Math.sin(t * 1.3 + i) * 0.05;
        l.material.emissiveIntensity = 2.0 + Math.sin(t * 5.2) * 0.25;
      });
    },
  };
}
