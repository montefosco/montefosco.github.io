import * as THREE from 'three';
import {
  add,
  mat,
  boxGeo,
  cylGeo,
  coneGeo,
  group,
  rng,
  rr,
  makeSky,
  makeSun,
  makeCloud,
  makeIsland,
} from '../lib/lowpoly.js';
import {
  makeRoom,
  makeBed,
  makeChair,
  makeTable,
  makeShelf,
  makeCross,
  makePew,
  makeCandle,
  makeCoin,
} from '../lib/world.js';
import { makeFigure, idlePose, raiseArm, walkPose } from '../lib/figures.js';
import { makePriestModel, makeLectern } from '../lib/priest.js';
import { makeAngryEmote } from '../lib/emote.js';
import { makeBase, makeMotes, makeChest, makeLedger, makeToyHorse, smoothstep, pulse, dampAngle, gesture, makeDoor } from './shared.js';

/* ------------------------------------------------------------------ */
/* navata della chiesa                                                 */
/* ------------------------------------------------------------------ */

function makeNave() {
  const g = new THREE.Group();
  const W = 16;
  const D = 15;
  const H = 9.2;
  // la navata prosegue verso destra: così, vicino al prete, l'inquadratura non
  // arriva mai al bordo e non si vede il vuoto del cielo
  const EXT = 6;
  const WT = W + EXT;
  const CX = EXT / 2;

  const base = makeBase({ w: WT, d: D, rock: '#3b2e25', rim: '#7c6a54' });
  base.position.x = CX;
  g.add(base);

  add(g, boxGeo(WT, 0.6, D), mat('#b4a68f'), [CX, -0.3, 0]);
  for (let x = -W / 2 + 1.5; x < W / 2 + EXT; x += 2.1) {
    add(g, boxGeo(0.07, 0.02, D), mat('#a4957e'), [x, 0.011, 0], [0, 0, 0], [1, 1, 1], false);
  }
  for (let z = -D / 2 + 1.5; z < D / 2; z += 2.1) {
    add(g, boxGeo(WT, 0.02, 0.07), mat('#a4957e'), [CX, 0.011, z], [0, 0, 0], [1, 1, 1], false);
  }

  // pareti (senza ombre: la luce deve entrare)
  add(g, boxGeo(WT, H, 0.7), mat('#d9cab1'), [CX, H / 2, -D / 2], [0, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(0.7, H, D), mat('#d2c2a8'), [-W / 2, H / 2, 0], [0, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(WT + 0.4, 0.42, 0.95), mat('#bcae95'), [CX, H - 0.2, -D / 2 + 0.1], [0, 0, 0], [1, 1, 1], false);

  // colonne e arcate sulla parete sinistra
  for (const z of [-5.2, -1.4, 2.4, 6.2]) {
    add(g, cylGeo(0.42, 0.5, 7.4, 7), mat('#cfbfa4'), [-W / 2 + 1.1, 3.7, z]);
    add(g, boxGeo(1.5, 0.35, 1.5), mat('#bcae95'), [-W / 2 + 1.1, 7.5, z]);
    add(g, boxGeo(1.5, 0.3, 1.5), mat('#a8987c'), [-W / 2 + 1.1, 0.15, z]);
  }

  // rosone
  const rz = -D / 2 + 0.42;
  add(
    g,
    new THREE.CircleGeometry(2.05, 20),
    mat('#f6c78a', { emissive: '#f0a955', emissiveIntensity: 1.5, roughness: 1 }),
    [0, 6.3, rz],
    [0, 0, 0],
    [1, 1, 1],
    false
  );
  add(g, new THREE.TorusGeometry(2.14, 0.24, 5, 20), mat('#bcae95'), [0, 6.3, rz + 0.06], [0, 0, 0], [1, 1, 1], false);
  for (let i = 0; i < 8; i++) {
    add(g, boxGeo(0.14, 4.0, 0.08), mat('#9d8a6d'), [0, 6.3, rz + 0.12], [0, 0, (i / 8) * Math.PI], [1, 1, 1], false);
  }
  add(g, new THREE.CircleGeometry(0.4, 12), mat('#9d8a6d'), [0, 6.3, rz + 0.15], [0, 0, 0], [1, 1, 1], false);

  // finestre sulla parete sinistra
  for (const z of [-3.4, 0.6, 4.4]) {
    add(
      g,
      boxGeo(0.08, 3.1, 1.15),
      mat('#f2c98f', { emissive: '#e9a55c', emissiveIntensity: 1.2, roughness: 1 }),
      [-W / 2 + 0.72, 5.1, z],
      [0, 0, 0],
      [1, 1, 1],
      false
    );
    add(g, new THREE.CircleGeometry(0.58, 10), mat('#f2c98f', { emissive: '#e9a55c', emissiveIntensity: 1.2 }), [-W / 2 + 0.72, 6.6, z], [0, Math.PI / 2, 0], [1, 1, 1], false);
  }

  // altare
  add(g, boxGeo(4.4, 1.0, 1.5), mat('#b8a78d'), [0, 0.5, -6.5]);
  add(g, boxGeo(4.6, 0.1, 1.7), mat('#f0e6cf'), [0, 1.02, -6.5], [0, 0, 0], [1, 1, 1], false);
  const cross = makeCross();
  cross.position.set(0, 1.06, -6.55);
  cross.scale.setScalar(2.1);
  g.add(cross);
  for (const sx of [-1, 1]) {
    add(g, cylGeo(0.12, 0.2, 0.7, 6), mat('#b08a4f', { metalness: 0.4 }), [sx * 1.7, 1.4, -6.5]);
    add(g, cylGeo(0.07, 0.08, 0.6, 6), mat('#f2e6cc'), [sx * 1.7, 2.0, -6.5]);
  }

  // ambone: un semplice leggio a terra, davanti al prete (niente pedana né baldacchino)
  const lectern = makeLectern();
  lectern.position.set(4.85, 0, -2.6);
  g.add(lectern);

  // banchi
  const pews = [];
  for (const z of [0.9, 2.8, 4.7, 6.6]) {
    const pew = makePew({ w: 5.6 });
    pew.position.set(-2.6, 0, z);
    pew.rotation.y = Math.PI;
    g.add(pew);
    pews.push(pew);
  }

  // candele
  const candles = [];
  for (const [x, z, y] of [[-1.5, -5.9, 0], [1.5, -5.9, 0], [3.2, -6.3, 0], [6.4, -6.3, 0]]) {
    const c = makeCandle();
    c.group.position.set(x, y, z);
    c.group.scale.setScalar(y > 0 ? 0.9 : 1.5);
    g.add(c.group);
    candles.push(c);
  }

  return { group: g, candles };
}

function makeIncense(count = 6) {
  const puffs = [];
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.16, 0),
      new THREE.MeshBasicMaterial({ color: '#e8d9bd', transparent: true, opacity: 0, depthWrite: false })
    );
    mesh.userData.phase = i / count;
    puffs.push(mesh);
  }
  return puffs;
}

function updateIncense(puffs, t) {
  for (const p of puffs) {
    const u = (t * 0.055 + p.userData.phase) % 1;
    p.position.set(
      Math.sin(t * 0.35 + p.userData.phase * 6.3) * 0.32,
      1.8 + u * 4.3,
      -6.15 + Math.cos(t * 0.28 + p.userData.phase * 5.1) * 0.22
    );
    p.scale.setScalar(0.6 + u * 1.2);
    p.material.opacity = Math.sin(u * Math.PI) * 0.1;
  }
}

function makePriest(x, y, z, ry = 0.35, vestment = 'surplice') {
  return makePriestModel({
    x,
    y,
    z,
    ry,
    vestment,
    spectacles: true,
  });
}

/* ------------------------------------------------------------------ */
/* quadro: il prete Geminiano                                          */
/* ------------------------------------------------------------------ */

export function buildChiesa() {
  const g = new THREE.Group();
  const nave = makeNave();
  g.add(nave.group);

  g.add(
    makeSky([
      [0, '#243349'],
      [0.48, '#5c6c7e'],
      [0.76, '#b08f6e'],
      [1, '#4a3a30'],
    ])
  );
  g.add(makeCloud([-40, 18, -80], 2.4, '#e8dcc8'));

  const priest = makePriest(4.85, 0, -3.5, 0.3);
  g.add(priest.group);

  const people = [];
  const r = rng(51);
  const spots = [
    [-1.2, 2.2, Math.PI + 0.05],
    [0.4, 2.9, Math.PI - 0.08],
    [-2.4, 1.3, Math.PI + 0.1],
    [1.4, 1.6, Math.PI - 0.12],
  ];
  const robes = ['#6a5b47', '#5b4a55', '#4d5a6b', '#75604a'];
  for (let i = 0; i < spots.length; i++) {
    const [x, z, ry] = spots[i];
    const fig = makeFigure({
      x,
      y: 0,
      z,
      ry,
      longRobe: i % 2 === 0,
      robe: robes[i % robes.length],
      accent: '#cdbb99',
      veil: i === 1 ? '#b9a687' : null,
      bun: i === 1,
    });
    g.add(fig.group);
    people.push(fig);
  }

  const motes = makeMotes({ count: 60, spread: [9, 5, 7], center: [0, 3.4, 0], color: '#ffe2ad', opacity: 0.55 });
  g.add(motes);

  const warm = new THREE.PointLight('#ffb877', 34, 26, 1.9);
  warm.position.set(0, 4.2, 2.5);
  g.add(warm);

  const incense = makeIncense();
  for (const p of incense) g.add(p);

  return {
    group: g,
    mood: {
      bg: '#1a1713',
      fog: ['#2b221a', 26, 95],
      hemi: ['#7f8ea6', '#2a1d13', 0.7],
      sun: ['#ffd7a0', 3.1, [0.42, 0.72, -0.28]],
      exposure: 1.04,
      shadow: 26,
    },
    camera: { pos: [7.1, 2.4, 6.0], look: [4.0, 1.7, -3.0], fov: 35 },
    update(t) {
      for (let i = 0; i < people.length; i++) idlePose(people[i], t + i * 0.6, 0.8);
      motes.userData.update(t);
      for (const c of nave.candles) {
        c.flame.scale.y = 1 + Math.sin(t * 8.5 + c.group.position.x) * 0.14;
        c.flame.position.x = Math.sin(t * 6.2 + c.group.position.z) * 0.012;
      }
      const beat = gesture(t * 0.72 - 0.5);
      const breath = Math.sin(t * 0.5);
      priest.body.rotation.x = 0.03 + beat * 0.16;
      priest.body.position.y = breath * 0.012;
      priest.head.rotation.y = -0.18 + beat * 0.5 + breath * 0.06;
      priest.head.rotation.x = -0.05 + beat * 0.09;
      priest.armR.rotation.x = -0.42 - beat * 1.12;
      priest.armR.rotation.z = 0.16 + Math.sin(t * 0.72 + 1.1) * 0.16;
      priest.armL.rotation.x = -0.28 + Math.sin(t * 0.5 + 1.6) * 0.07;
      priest.armL.rotation.z = -0.5;
      warm.intensity = 32 + Math.sin(t * 1.6) * 3;
      updateIncense(incense, t);
      for (let i = 0; i < people.length; i++) people[i].head.rotation.y = 0.1 + Math.sin(t * 0.3 + i) * 0.04;
    },
  };
}

/* ------------------------------------------------------------------ */
/* quadro: l'omelia                                                    */
/* ------------------------------------------------------------------ */

export function buildOmelia() {
  const g = new THREE.Group();
  const nave = makeNave();
  g.add(nave.group);

  g.add(
    makeSky([
      [0, '#1d2a3e'],
      [0.5, '#4a5468'],
      [0.78, '#9b7a60'],
      [1, '#3a2c25'],
    ])
  );
  g.add(makeCloud([42, 22, -85], 2.6, '#d9cdb9'));

  const priest = makePriest(4.85, 0, -3.45, 0.22);
  g.add(priest.group);

  // la cassa delle offerte sta a terra accanto al leggio, non più su una pedana
  const chest = makeChest({ w: 0.8, h: 0.4 });
  chest.position.set(5.9, 0, -2.5);
  chest.rotation.y = -0.35;
  g.add(chest);
  for (let i = 0; i < 4; i++) {
    const c = makeCoin();
    c.position.set(5.75 + i * 0.1, 0.5 + i * 0.012, -2.45);
    c.rotation.x = Math.PI / 2;
    g.add(c);
  }

  const sonia = makeFigure({
    x: 2.9,
    y: 0,
    z: -1.9,
    ry: 1.9,
    longRobe: true,
    robe: '#7a4f57',
    accent: '#cdbb99',
    veil: '#c9b18c',
    bun: true,
  });
  g.add(sonia.group);

  const claudio = makeFigure({
    x: 2.0,
    y: 0,
    z: -1.2,
    ry: 1.7,
    child: true,
    robe: '#b5764f',
    accent: '#e3d2b2',
  });
  g.add(claudio.group);

  const people = [];
  const r = rng(83);
  const spots = [
    [-3.6, 1.6, Math.PI + 0.06],
    [-4.6, 3.4, Math.PI - 0.04],
    [-1.6, 2.6, Math.PI + 0.1],
    [-3.0, 5.4, Math.PI - 0.1],
    [-0.6, 1.2, Math.PI],
  ];
  for (let i = 0; i < spots.length; i++) {
    const [x, z, ry] = spots[i];
    const fig = makeFigure({
      x,
      y: 0,
      z,
      ry,
      longRobe: i % 2 === 1,
      robe: ['#5d5040', '#4c5768', '#6d5b47', '#5a4a55', '#6a6150'][i],
      accent: '#cdbb99',
      veil: i === 2 ? '#b9a687' : null,
      bun: i === 2,
    });
    g.add(fig.group);
    people.push(fig);
  }

  const motes = makeMotes({ count: 70, spread: [9, 5, 7], center: [0, 3.6, 0], color: '#ffe3b0', opacity: 0.6 });
  g.add(motes);

  const warm = new THREE.PointLight('#ffb877', 40, 28, 1.9);
  warm.position.set(1.5, 4.6, 2);
  g.add(warm);

  const incense = makeIncense();
  for (const p of incense) g.add(p);

  return {
    group: g,
    mood: {
      bg: '#171410',
      fog: ['#2a211a', 24, 90],
      hemi: ['#7a89a1', '#291c12', 0.68],
      sun: ['#ffd49a', 3.3, [0.4, 0.7, -0.32]],
      exposure: 1.05,
      shadow: 26,
    },
    camera: { pos: [6.9, 2.5, 6.7], look: [2.4, 1.6, -2.8], fov: 36 },
    update(t, intro) {
      for (let i = 0; i < people.length; i++) idlePose(people[i], t + i * 0.5, 0.7);
      motes.userData.update(t);
      for (const c of nave.candles) {
        c.flame.scale.y = 1 + Math.sin(t * 9 + c.group.position.z) * 0.15;
      }

      const advance = smoothstep((intro - 0.2) / 0.55);
      sonia.group.position.x = 2.9 + advance * 0.25;
      sonia.group.position.z = -1.9 - advance * 1.3;
      claudio.group.position.x = 2.0 + advance * 0.2;
      claudio.group.position.z = -1.2 - advance * 1.2;

      const moving = advance > 0.02 && advance < 0.98;
      const settle = smoothstep((advance - 0.75) / 0.25);
      const turn = smoothstep(advance / 0.25);
      sonia.group.rotation.y = (1.9 + 1.05 * turn) * (1 - settle) + 1.75 * settle;
      claudio.group.rotation.y = (1.7 + 1.25 * turn) * (1 - settle) + 1.8 * settle;
      walkPose(sonia, t * 2.2, moving ? 0.3 : 0);
      walkPose(claudio, t * 2.7, moving ? 0.38 : 0);

      for (let i = 0; i < people.length; i++) {
        const w = Math.max(0, Math.sin(t * 0.8 - i * 0.7));
        raiseArm(people[i], i % 2 ? 'left' : 'right', w * w * 0.45, 0.2);
      }

      const lean = Math.min(1, Math.max(0, (intro - 0.1) / 0.6));
      const beat = gesture(t * 0.75 - 0.35);
      const breath = Math.sin(t * 0.5);
      priest.body.rotation.x = 0.04 + beat * 0.14 + 0.03 * lean;
      priest.body.position.y = breath * 0.012;
      priest.head.rotation.x = -0.06 + beat * 0.08;
      priest.head.rotation.y = 0.1 + breath * 0.2;
      priest.armR.rotation.x = -0.4 - beat * 1.15;
      priest.armR.rotation.z = 0.18 + Math.sin(t * 0.75 + 1) * 0.2;
      priest.armL.rotation.x = -0.3 + Math.sin(t * 0.5 + 1.5) * 0.08;
      priest.armL.rotation.z = -0.5;

      sonia.head.rotation.x = -0.16;
      sonia.armL.rotation.x = -0.95;
      sonia.armL.rotation.z = -0.42;
      sonia.armR.rotation.x = -0.95;
      sonia.armR.rotation.z = 0.42;
      claudio.head.rotation.y = 0.22 + Math.sin(t * 0.6) * 0.05;

      warm.intensity = 38 + Math.sin(t * 1.8) * 4;
      updateIncense(incense, t);
    },
  };
}

/* ------------------------------------------------------------------ */
/* interni di casa                                                     */
/* ------------------------------------------------------------------ */

/** porta d'ingresso sulla parete sinistra della stanza */
function addHomeDoor(g, { night = false } = {}) {
  const door = makeDoor({
    w: 1.7,
    h: 2.9,
    color: night ? '#5e3535' : '#7a3f3f',
    frame: '#463126',
    trim: '#c9a86a',
  });
  door.group.position.set(-6.22, 0, 3.9);
  g.add(door.group);
  return door;
}

function furnishRoom({ night = false } = {}) {
  const g = new THREE.Group();
  const room = makeRoom({
    w: 13,
    d: 10,
    h: 5.6,
    floorColor: night ? '#6f5238' : '#8a6a48',
    wallColor: night ? '#cfc0a8' : '#e7d9c2',
    windowColor: night ? '#cfe2f4' : '#f6d9a2',
    windowEmissive: night ? '#6d8fb8' : '#e7a85c',
    windowIntensity: night ? 0.9 : 1.05,
  });
  g.add(room);
  g.add(makeBase({ w: 13, d: 10, rock: '#3c2f26', rim: '#7d6b55' }));

  add(g, boxGeo(6.4, 0.025, 4.2), mat(night ? '#5e3b33' : '#7c4638'), [0.2, 0.014, 0.9], [0, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(6.0, 0.03, 3.8), mat(night ? '#6d463a' : '#8d5341'), [0.2, 0.016, 0.9], [0, 0, 0], [1, 1, 1], false);

  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 3.4),
    new THREE.MeshBasicMaterial({ color: night ? '#a9c6e3' : '#ffd9a0', transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(-1.6, 0.03, -2.2);
  pool.rotation.z = 0.2;
  g.add(pool);

  return { group: g };
}

/* ------------------------------------------------------------------ */
/* quadro: la famiglia                                                 */
/* ------------------------------------------------------------------ */

export function buildFamiglia() {
  const g = new THREE.Group();
  const { group: room } = furnishRoom({ night: false });
  g.add(room);

  g.add(
    makeSky([
      [0, '#5f84ad'],
      [0.44, '#a9c2ce'],
      [0.78, '#efdcbc'],
      [1, '#f6e7cd'],
    ])
  );
  g.add(makeSun('#ffe0ae', 9, [-70, 40, 110]));
  g.add(makeCloud([34, 16, -60], 2.2, '#f6ead8'));

  const bed = makeBed({ w: 2.2, color: '#a95b48' });
  bed.position.set(-4.0, 0, -3.1);
  g.add(bed);
  const toy = makeToyHorse();
  toy.position.set(-3.7, 1.1, -3.0);
  toy.rotation.y = 0.7;
  g.add(toy);

  const table = makeTable({ w: 2.4, d: 1.3, h: 0.9 });
  table.position.set(1.1, 0, 0.4);
  g.add(table);

  const chair = makeChair();
  chair.position.set(1.1, 0, 1.6);
  chair.rotation.y = Math.PI;
  g.add(chair);

  const chair2 = makeChair();
  chair2.position.set(2.6, 0, 0.1);
  chair2.rotation.y = -Math.PI / 2;
  g.add(chair2);

  const candle = makeCandle();
  candle.group.position.set(0.6, 0.96, 0.4);
  g.add(candle.group);

  const shelf = makeShelf({ w: 2.6, h: 2.9 });
  shelf.position.set(4.7, 0, -4.5);
  shelf.rotation.y = 0.02;
  g.add(shelf);

  const cross = makeCross();
  cross.position.set(0.6, 3.5, -4.72);
  cross.scale.setScalar(1.7);
  g.add(cross);

  const homeDoor = addHomeDoor(g, { night: false });
  homeDoor.setOpen(1);

  add(g, boxGeo(0.03, 2.75, 2.25), mat('#463126'), [-6.27, 2.55, 1.5], [0, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(0.05, 2.5, 2.1), mat('#7a3f3f'), [-6.24, 2.55, 1.5], [0, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(0.07, 0.1, 2.25), mat('#c9a86a'), [-6.2, 3.9, 1.5], [0, 0, 0], [1, 1, 1], false);

  const chest = makeChest({ w: 1.1, h: 0.65 });
  chest.position.set(4.8, 0, 2.4);
  chest.rotation.y = -0.4;
  g.add(chest);

  const cloth = add(g, boxGeo(0.5, 0.06, 0.4), mat('#e8dcc4'), [1.9, 0.945, 0.65], [0, 0.3, 0], [1, 1, 1], false);

  const sonia = makeFigure({
    x: -2.9,
    y: 0,
    z: -3.9,
    ry: 2.0,
    longRobe: true,
    robe: '#8a4f57',
    accent: '#cdbb99',
    veil: '#c9b18c',
    bun: true,
  });
  g.add(sonia.group);

  const claudio = makeFigure({
    x: -1.0,
    y: 0,
    z: -2.5,
    ry: 0.4,
    child: true,
    robe: '#b5764f',
    accent: '#e3d2b2',
    hair: '#4a3527',
  });
  g.add(claudio.group);

  const geppetto = makeFigure({
    x: 2.9,
    y: 0,
    z: -0.1,
    ry: -1.4,
    longRobe: true,
    robe: '#4d5a6b',
    accent: '#cdbb99',
    book: true,
    hair: '#4a3a2c',
  });
  g.add(geppetto.group);

  const motes = makeMotes({ count: 40, spread: [6, 3.5, 4], center: [-1.8, 2.4, -1.8], color: '#ffe2b0', opacity: 0.5, size: 0.06 });
  g.add(motes);

  const warm = new THREE.PointLight('#ffb877', 16, 9, 2);
  warm.position.set(0.6, 1.6, 0.4);
  g.add(warm);

  return {
    group: g,
    mood: {
      bg: '#8d8a7a',
      fog: ['#cdbfa4', 24, 85],
      hemi: ['#c4d3e2', '#6b5a45', 1.15],
      sun: ['#ffd9a4', 2.35, [0.5, 0.62, -0.42]],
      exposure: 1.02,
      shadow: 22,
    },
    camera: { pos: [8.8, 3.6, 10.2], look: [-2.4, 2.2, -1.6], fov: 40 },
    update(t, intro) {
      idlePose(sonia, t * 0.8, 0.7);
      idlePose(claudio, t * 1.1 + 1, 0.9);
      idlePose(geppetto, t * 0.9 + 2, 0.6);
      motes.userData.update(t);

      // la porta di casa si chiude piano piano, come se qualcuno fosse appena entrato
      const closing = smoothstep((t - 0.5) / 2.4);
      homeDoor.setOpen(1 - closing);

      const rise = Math.min(1, Math.max(0, (intro - 0.2) / 0.7));
      sonia.head.rotation.x = -0.22 + rise * 0.12;
      sonia.armL.rotation.x = -1.05;
      sonia.armL.rotation.z = -0.5;
      sonia.armR.rotation.x = -1.05;
      sonia.armR.rotation.z = 0.5;

      const care = pulse(t, 11, 0.16, 0.5);
      claudio.group.position.x = -1.0 - care * 0.7;
      claudio.group.position.z = -2.5 - care * 1.1;
      claudio.group.rotation.y = 0.4 + care * 0.7;
      walkPose(claudio, t * 2.6, care > 0.04 ? 0.35 : 0);
      sonia.body.rotation.x = 0.03 + care * 0.14;
      sonia.armL.rotation.x = -1.05 - care * 0.25;
      sonia.armR.rotation.x = -1.05 - care * 0.25;

      const cough = Math.pow(Math.max(0, Math.sin(t * 0.62 - 0.6)), 24);
      claudio.body.rotation.x = cough * 0.16;
      claudio.head.rotation.x = cough * 0.28;
      claudio.head.rotation.y = 0.16 + Math.sin(t * 0.5) * 0.06;

      const glance = pulse(t, 9, 0.15, 0.25);
      geppetto.head.rotation.y = -0.55 + glance * 0.85;
      geppetto.head.rotation.x = glance * 0.14;

      geppetto.armL.rotation.x = -0.62;
      geppetto.armL.rotation.z = -0.34;
      geppetto.armR.rotation.x = -0.62;
      geppetto.armR.rotation.z = 0.34;

      candle.flame.scale.y = 1 + Math.sin(t * 9.4) * 0.16;
      candle.flame.position.x = Math.sin(t * 7.1) * 0.014;
      warm.intensity = 15 + Math.sin(t * 6.5) * 1.6;
      cloth.rotation.y = 0.3;
    },
  };
}

/* ------------------------------------------------------------------ */
/* quadro: il dubbio di Geppetto                                       */
/* ------------------------------------------------------------------ */

/**
 * La discussione dura un ciclo di 25 secondi e poi ricomincia.
 * Ogni battuta ha la sua nuvoletta, i suoi gesti e il suo "ascolto":
 *   1. Geppetto:  «Non è fattibile, madre.»            (alza il libro)
 *   2. Sonia:     «Il prete ha promesso…»              (mani aperte, fiduciosa)
 *   3. Geppetto:  «Sono bambini! E il mare?»           (fa un passo avanti, agitato)
 *   4. Sonia:     «Ho fede. Claudio partirà.»          (mano sulla spalla del figlio)
 *   5. Geppetto:  «…»                                  (abbassa la testa, si porta la mano alla fronte)
 */
const DUBBIO_LOOP = 25;
const DUBBIO_LINES = [
  { who: 'g', name: 'Geppetto', text: 'Non è fattibile, madre.', a: 0.8, b: 5.0 },
  { who: 's', name: 'Sonia', text: 'Il prete ha promesso: Claudio guarirà.', a: 5.4, b: 10.2 },
  { who: 'g', name: 'Geppetto', text: 'Sono bambini! Come attraverseranno il mare?', a: 10.6, b: 15.8 },
  { who: 's', name: 'Sonia', text: 'Ho fede. Claudio partirà.', a: 16.2, b: 20.4 },
  { who: 'g', name: 'Geppetto', text: 'Madre…', a: 20.8, b: 24.0 },
];

/** finestra 0 → 1 → 0 con bordi morbidi */
function win(u, a, b, r = 0.3) {
  return smoothstep((u - a) / r) * (1 - smoothstep((u - b + r) / r));
}

export function buildDubbio() {
  const g = new THREE.Group();
  const { group: room } = furnishRoom({ night: true });
  g.add(room);

  g.add(
    makeSky([
      [0, '#0d1524'],
      [0.48, '#26364e'],
      [0.8, '#4d5568'],
      [1, '#1d2029'],
    ])
  );
  g.add(makeCloud([-30, 10, -70], 2.6, '#b9c6da'));

  const bed = makeBed({ w: 2.2, color: '#6b4a52' });
  bed.position.set(-4.3, 0, -3.3);
  g.add(bed);

  // il tavolo sta dietro ai due che discutono: resta nel quadro, ma non copre la scena
  const tableSet = new THREE.Group();
  tableSet.position.set(-0.1, 0, -2.3);
  g.add(tableSet);

  const table = makeTable({ w: 2.9, d: 1.5, h: 0.92, color: '#6d4c32' });
  tableSet.add(table);

  const ledger = makeLedger();
  ledger.position.set(-1.0, 0.95, 0.1);
  ledger.rotation.y = 0.5;
  tableSet.add(ledger);

  add(tableSet, boxGeo(0.62, 0.42, 0.32), mat('#41342a'), [0.75, 1.13, -0.05], [0, -0.3, 0], [1, 1, 1], true);
  add(tableSet, new THREE.TorusGeometry(0.16, 0.025, 4, 10), mat('#2e251d'), [0.75, 1.4, -0.05], [Math.PI / 2, 0, -0.3], [1, 1, 1], false);
  add(tableSet, boxGeo(0.1, 0.05, 0.03), mat('#c9a86a', { metalness: 0.6 }), [0.75, 1.13, 0.13], [0, 0, 0], [1, 1, 1], false);

  for (let i = 0; i < 3; i++) {
    add(tableSet, boxGeo(0.34, 0.06, 0.26), mat(i % 2 ? '#8a4a3c' : '#4e5f70'), [-0.65 + i * 0.18, 0.98 + i * 0.06, 0.45], [0, 0.3 - i * 0.2, 0], [1, 1, 1], false);
  }

  const candleA = makeCandle();
  candleA.group.position.set(1.2, 0.96, -0.5);
  tableSet.add(candleA.group);
  const candleB = makeCandle();
  candleB.group.position.set(-1.7, 0.97, -0.45);
  tableSet.add(candleB.group);

  const cross = makeCross();
  cross.position.set(3.6, 3.4, -4.72);
  cross.scale.setScalar(1.6);
  g.add(cross);

  const homeDoor = addHomeDoor(g, { night: true });
  homeDoor.setOpen(0);

  const chair = makeChair();
  chair.position.set(2.6, 0, -2.0);
  chair.rotation.y = 0.5;
  g.add(chair);

  /* --- personaggi --------------------------------------------------- */
  // asse "verso destra sullo schermo" visto dalla camera: i due si guardano lungo questo asse
  const px = 0.75;
  const pz = -0.66;
  const centre = [0.55, 1.35];
  const gap = 1.02;
  const G0 = [centre[0] - px * gap, centre[1] - pz * gap];
  const S0 = [centre[0] + px * gap, centre[1] + pz * gap];
  const RY_G = 1.95;
  const RY_S = -0.22;

  const geppetto = makeFigure({
    x: G0[0],
    y: 0,
    z: G0[1],
    ry: RY_G,
    longRobe: true,
    robe: '#4a586c',
    accent: '#c9b99a',
    hair: '#4a3a2c',
  });
  g.add(geppetto.group);

  // il libro è nella mano sinistra (la più vicina alla camera): quando alza il braccio lo mostra a Sonia
  const bookGroup = new THREE.Group();
  bookGroup.position.set(0.02, -0.62, 0.1);
  bookGroup.rotation.set(0.2, 0, 0);
  geppetto.armL.add(bookGroup);
  add(bookGroup, boxGeo(0.07, 0.3, 0.22), mat('#7a3f32'), [0, 0, 0], [0, 0, 0], [1, 1, 1], false);
  add(bookGroup, boxGeo(0.05, 0.27, 0.19), mat('#efe2c8'), [0.045, 0, 0], [0, 0, 0], [1, 1, 1], false);

  const sonia = makeFigure({
    x: S0[0],
    y: 0,
    z: S0[1],
    ry: RY_S,
    longRobe: true,
    robe: '#7f4a52',
    accent: '#c9b99a',
    veil: '#b9a687',
    bun: true,
  });
  g.add(sonia.group);

  // Claudio sta accanto alla madre, sul lato della mano destra di lei
  const claudio = makeFigure({
    x: S0[0] + 0.66,
    y: 0,
    z: S0[1] + 0.27,
    ry: RY_S - 0.05,
    child: true,
    robe: '#a9704c',
    accent: '#dccbaa',
  });
  g.add(claudio.group);

  // emoticon della rabbia sopra Geppetto
  const angry = makeAngryEmote(1.5);
  g.add(angry);

  const motes = makeMotes({ count: 30, spread: [5, 3, 4], center: [0, 2.4, 0], color: '#cfe0f2', opacity: 0.4, size: 0.06 });
  g.add(motes);

  // luce delle candele sul tavolo + una luce calda morbida sui volti, altrimenti i due restano in ombra
  const candleLight = new THREE.PointLight('#ffae6e', 22, 11, 2);
  candleLight.position.set(0.3, 1.8, -1.9);
  g.add(candleLight);
  const faceLight = new THREE.PointLight('#ffc890', 15, 8.5, 2);
  faceLight.position.set(centre[0] + 0.9, 2.5, centre[1] + 1.7);
  g.add(faceLight);

  /* --- animazione --------------------------------------------------- */
  const stepPos = (fig, base, off) => {
    fig.group.position.x = base[0] + px * off;
    fig.group.position.z = base[1] + pz * off;
  };

  return {
    group: g,
    mood: {
      bg: '#0c111a',
      fog: ['#1b2433', 22, 80],
      hemi: ['#6d82a8', '#2a211b', 1.0],
      sun: ['#bcd3f0', 1.9, [-0.44, 0.56, -0.42]],
      exposure: 1.12,
      shadow: 22,
    },
    camera: { pos: [4.7, 3.0, 7.7], look: [-0.45, 1.7, 1.75], fov: 36 },
    update(t, intro, dt = 0.016) {
      idlePose(geppetto, t, 0.5);
      idlePose(sonia, t + 2, 0.45);
      idlePose(claudio, t + 4, 0.6);
      motes.userData.update(t);

      const u = (((t - 0.2) % DUBBIO_LOOP) + DUBBIO_LOOP) % DUBBIO_LOOP;
      const w = DUBBIO_LINES.map((l) => win(u, l.a, l.b));
      const [w1, w2, w3, w4, w5] = w;
      const gSpeak = Math.max(w1, w3);
      const sSpeak = Math.max(w2, w4);

      // emoticon: appare quando Geppetto si arrabbia, più forte nella seconda battuta
      angry.userData.set(Math.max(w1 * 0.9, w3), t);
      angry.position.set(geppetto.group.position.x, 1.95 + Math.abs(Math.sin(t * 9)) * 0.04 * gSpeak, geppetto.group.position.z);

      /* ----- Geppetto ----- */
      const step = 0.3 * win(u, 10.0, 16.0, 0.7) - 0.16 * win(u, 16.4, 24.4, 0.8);
      const prevG = geppetto._off ?? 0;
      geppetto._off = prevG + (step - prevG) * 0.1;
      stepPos(geppetto, G0, geppetto._off);
      const moveG = Math.abs(step - prevG) > 0.004;
      geppetto.stride = (geppetto.stride || 0) + dt * 5.2;
      walkPose(geppetto, geppetto.stride, moveG ? 0.4 : 0);

      geppetto.body.rotation.x = 0.03 + gSpeak * 0.06 + w3 * 0.09 + w5 * 0.1;
      geppetto.head.rotation.x = 0.02 + Math.sin(u * 9.5) * 0.045 * gSpeak + w5 * 0.34;
      geppetto.head.rotation.y = Math.sin(u * 4.6) * 0.07 * gSpeak - Math.sin(u * 2.4) * 0.13 * w2 + Math.sin(u * 2.4) * 0.1 * w4;

      // mano vicina (con il libro): lo alza quando parla, lo scuote quando si agita
      geppetto.armL.rotation.x = -0.45 - w1 * (0.75 + Math.sin(u * 2.7) * 0.1) - w3 * (0.95 + Math.sin(u * 8.2) * 0.22) + w5 * 0.2;
      geppetto.armL.rotation.z = -0.22 - w1 * 0.12 - w3 * 0.18;
      // mano lontana: gesto aperto, poi mano al mento mentre ascolta, poi alla fronte
      geppetto.armR.rotation.x =
        -0.2 - w1 * (0.7 + Math.sin(u * 3.3) * 0.12) - w2 * 1.35 - w3 * (0.7 + Math.sin(u * 6.4) * 0.28) - w4 * 0.35 - w5 * 2.3;
      geppetto.armR.rotation.z = 0.14 + w1 * 0.42 + w3 * 0.78 - w5 * 0.5;

      /* ----- Sonia ----- */
      const back = 0.14 * win(u, 10.2, 16.0, 0.7);
      const prevS = sonia._off ?? 0;
      sonia._off = prevS + (back - prevS) * 0.1;
      stepPos(sonia, S0, sonia._off);

      sonia.body.rotation.y = 0.5 * w4 + 0.4 * w5 - 0.1 * w3;
      sonia.body.rotation.x = 0.02 + w3 * 0.05;
      sonia.head.rotation.x = 0.1 - w2 * 0.15 - w4 * 0.12 + Math.sin(u * 8.5) * 0.04 * sSpeak + w5 * 0.2;
      // la testa guarda Geppetto; nel momento della decisione si volta verso il figlio
      sonia.head.rotation.y = -0.42 * (1 - w4 * 0.8 - w5) + Math.sin(u * 7.2) * 0.2 * w3 + Math.sin(u * 5.1) * 0.05 * sSpeak + w5 * 0.45;

      // mani giunte mentre ascolta; si aprono quando risponde; la destra va sulla spalla di Claudio
      sonia.armL.rotation.x = -1.18 - w3 * 0.1 + w4 * 0.05;
      sonia.armL.rotation.z = 0.38 - w3 * 0.06;
      sonia.armR.rotation.x = -1.18 + w2 * (0.4 + Math.sin(u * 3.0) * 0.1) - w3 * 0.1 + w4 * 0.9 + w5 * 0.9;
      sonia.armR.rotation.z = -0.38 + w2 * 1.05 + w4 * 1.3 + w5 * 1.3;

      /* ----- Claudio ----- */
      const cough = Math.pow(Math.max(0, Math.sin(t * 0.62 - 0.6)), 26);
      claudio.body.rotation.x = cough * 0.15;
      claudio.head.rotation.x = 0.12 - w2 * 0.2 + cough * 0.25 + w5 * 0.1;
      claudio.head.rotation.y = -0.3 - w2 * 0.4 - w4 * 0.2 + Math.sin(t * 0.5) * 0.05;

      candleA.flame.scale.y = 1 + Math.sin(t * 10.2) * 0.16;
      candleB.flame.scale.y = 1 + Math.sin(t * 8.1 + 2) * 0.14;
      candleLight.intensity = 21 + Math.sin(t * 7.3) * 2.5;
      faceLight.intensity = 14.5 + Math.sin(t * 5.1) * 1.2;
    },
  };
}
