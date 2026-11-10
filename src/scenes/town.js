import * as THREE from 'three';
import {
  add,
  mat,
  rng,
  rr,
  makeIsland,
  makeSky,
  makeSun,
  makeMoon,
  makeStars,
  makeCloud,
  makeCypress,
} from '../lib/lowpoly.js';
import {
  makeTown,
  makeHouse,
  makeMarketStall,
  makeCart,
  makeBarrel,
  makeCrate,
  makeWell,
  makeBanner,
  makeSack,
  makeCoin,
} from '../lib/world.js';
import { makeFigure, idlePose, pointWithArm, walkPose, raiseArm } from '../lib/figures.js';
import { walkTo, smoothstep, dampAngle } from './shared.js';
import { makePlazaIsland, addSampietrinoPlaza } from '../lib/piazza.js';

/* ------------------------------------------------------------------ */
/* copertina                                                           */
/* ------------------------------------------------------------------ */

export function buildCover() {
  const g = new THREE.Group();

  const sky = makeSky([
    [0, '#070d1c'],
    [0.42, '#152744'],
    [0.72, '#3b5470'],
    [0.88, '#b98163'],
    [1, '#241c20'],
  ]);
  g.add(sky);
  const stars = makeStars(520, 260);
  g.add(stars);
  g.add(makeMoon(9, [-81, 20, -174]));

  const island = makeIsland({
    radius: 20,
    depth: 4.6,
    hill: 2.8,
    seed: 4,
    top: '#4c6049',
    topAlt: '#3f513e',
    soil: '#4c3a2c',
    rock: '#33291f',
  });
  g.add(island.group);

  const town = makeTown({ heightAt: island.heightAt, lit: 0.82, seed: 23 });
  g.add(town.group);

  const warm = new THREE.PointLight('#ffb066', 55, 34, 1.8);
  warm.position.set(0, 6, 3);
  g.add(warm);

  const r = rng(77);
  const embers = [];
  for (let i = 0; i < 22; i++) {
    const a = rr(r, 0, Math.PI * 2);
    const rad = rr(r, 2, 15);
    const m = add(
      g,
      new THREE.IcosahedronGeometry(0.055, 0),
      mat('#ffd7a0', { emissive: '#ffae5c', emissiveIntensity: 2.2, roughness: 1 }),
      [Math.cos(a) * rad, rr(r, 2.6, 7), Math.sin(a) * rad],
      [0, 0, 0],
      [1, 1, 1],
      false
    );
    embers.push({ m, phase: rr(r, 0, Math.PI * 2), speed: rr(r, 0.3, 0.7), base: m.position.y });
  }

  const shootingMat = new THREE.MeshBasicMaterial({ color: '#fff0cc', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const shooting = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.055, 0.055), shootingMat);
  shooting.position.set(-70, 40, -150);
  g.add(shooting);

  return {
    group: g,
    mood: {
      bg: '#070d1c',
      fog: ['#131f33', 55, 195],
      hemi: ['#7c9bd0', '#2b2a2c', 0.85],
      sun: ['#b9cdf0', 1.5, [-0.35, 0.62, 0.25]],
      exposure: 1.12,
    },
    camera: { pos: [34, 16, 42], look: [-9, 4, 4], fov: 42 },
    update(t) {
      stars.update(t);
      town.update(t);
      for (const e of embers) {
        e.m.position.y = e.base + Math.sin(t * e.speed + e.phase) * 0.45;
        e.m.material.emissiveIntensity = 1.7 + Math.sin(t * 2.2 + e.phase) * 0.5;
      }
      warm.intensity = 52 + Math.sin(t * 1.3) * 5;

      const cycle = (t % 14) / 14;
      const u = cycle < 0.16 ? cycle / 0.16 : 0;
      shooting.position.set(-88 + u * 66, 44 - u * 18, -150);
      shooting.rotation.z = -0.35;
      shootingMat.opacity = Math.sin(u * Math.PI) * 0.85;
    },
  };
}

/* ------------------------------------------------------------------ */
/* il borgo                                                            */
/* ------------------------------------------------------------------ */

export function buildBorgo() {
  const g = new THREE.Group();

  g.add(
    makeSky([
      [0, '#5c88b4'],
      [0.45, '#a7c5d4'],
      [0.78, '#ecdfc6'],
      [1, '#f6e8cc'],
    ])
  );
  g.add(makeSun('#ffe3b4', 10, [78, 46, -110]));
  g.add(makeCloud([-55, 42, -105], 2.6));
  g.add(makeCloud([62, 52, -120], 2.0, '#fbf5ea'));
  g.add(makeCloud([8, 58, -140], 1.6, '#fdf8ee'));

  const island = makeIsland({
    radius: 20,
    depth: 4.2,
    hill: 2.7,
    seed: 6,
    top: '#93a071',
    topAlt: '#839260',
    soil: '#8a6a4b',
    rock: '#6b5643',
  });
  g.add(island.group);

  const town = makeTown({ heightAt: island.heightAt, lit: 0.18, seed: 12 });
  g.add(town.group);

  const plazaY = island.heightAt(0, 0) + 0.45;
  const people = [];
  const palette = [
    { robe: '#7a4f57', accent: '#dcc9a8', veil: '#c9b18c' },
    { robe: '#4f6076', accent: '#cfc2a8', hat: 'cap' },
    { robe: '#6f7448', accent: '#d8c8ab' },
    { robe: '#8a5a3a', accent: '#e0d2b8', hat: 'cap' },
  ];
  const spots = [
    [2.4, 3.6, 2.1],
    [-3.2, 3.2, -0.2],
    [1.2, 0.2, 5.8],
    [-1.8, 2.2, 4.2],
    [4.0, 1.0, 9.6],
    [-3.4, 4.4, 8.9],
  ];
  for (let i = 0; i < spots.length; i++) {
    const [x, z, ry] = spots[i];
    const p = palette[i % palette.length];
    const fig = makeFigure({
      x,
      y: i >= 4 ? island.heightAt(0, 8.6) + 0.45 : plazaY,
      z,
      ry,
      ...p,
      longRobe: i % 2 === 0,
      bag: i === 1,
    });
    g.add(fig.group);
    people.push(fig);
  }

  const cart = makeCart();
  cart.group.position.set(5.2, island.heightAt(5.2, 11.4) - 0.1, 11.4);
  cart.group.rotation.y = -0.9;
  g.add(cart.group);

  const banner = makeBanner({ color: '#3d5a6b', accent: '#e7d6b6' });
  banner.position.set(6.6, plazaY - 0.05, -0.4);
  g.add(banner);

  const travelers = [
    { fig: makeFigure({ x: -0.7, y: island.heightAt(0, 8.2) + 0.05, z: 8.2, ry: Math.PI, robe: '#5b4a55', accent: '#cdbb99', veil: '#b9a687', bun: true }), x: -0.7, delay: 0 },
    { fig: makeFigure({ x: 0.4, y: island.heightAt(0, 8.8) + 0.05, z: 8.8, ry: Math.PI, robe: '#4f6076', accent: '#cfc2a8', hat: 'cap', bag: true }), x: 0.4, delay: 0.35 },
  ];
  for (const tr of travelers) g.add(tr.fig.group);

  return {
    group: g,
    mood: {
      bg: '#c6d6dc',
      fog: ['#d8ded9', 70, 210],
      hemi: ['#bdd6ea', '#6d6a50', 1.25],
      sun: ['#ffe0b0', 2.5, [0.5, 0.72, 0.45]],
      exposure: 1.0,
    },
    camera: { pos: [30, 14.5, 36], look: [0, 3.2, 1.2], fov: 41 },
    update(t, intro) {
      town.update(t);
      for (const p of people) idlePose(p, t, 1);

      const cycle = 15;
      const cu = (t % cycle) / cycle;
      let k = 0;
      let forward = true;
      if (cu < 0.44) k = smoothstep(cu / 0.44);
      else if (cu < 0.5) k = 1;
      else if (cu < 0.94) { k = 1 - smoothstep((cu - 0.5) / 0.44); forward = false; }
      for (const tr of travelers) {
        const u = Math.min(1, Math.max(0, k - tr.delay * 0.15));
        const z = 8.2 + tr.delay * 0.6 - u * 6.6;
        tr.fig.group.position.set(tr.x, island.heightAt(tr.x, z) + 0.05, z);
        tr.fig.group.rotation.y = dampAngle(tr.fig.group.rotation.y, forward ? Math.PI : 0, 0.07);
        walkPose(tr.fig, t * 3.1 + tr.delay * 3, 0.55 * (u > 0.02 && u < 0.98 ? 1 : 0));
      }

      const roll = (Math.sin(t * 0.22) + 1) / 2;
      cart.group.position.z = 11.4 - roll * 1.1;
      cart.group.position.y = island.heightAt(5.2, cart.group.position.z) - 0.1;
      cart.wheels.forEach((w) => (w.rotation.x = t * 0.45 + roll * 2));
      banner.rotation.z = Math.sin(t * 0.7) * 0.025;
    },
  };
}

/* ------------------------------------------------------------------ */
/* il mercato                                                          */
/* ------------------------------------------------------------------ */

export function buildMercato() {
  const g = new THREE.Group();

  g.add(
    makeSky([
      [0, '#5f8cb8'],
      [0.5, '#b0ccd8'],
      [0.82, '#f0e2c4'],
      [1, '#f8ebce'],
    ])
  );
  g.add(makeSun('#ffe8bd', 9, [70, 48, -100]));
  g.add(makeCloud([-48, 40, -90], 2.2));
  g.add(makeCloud([54, 46, -110], 1.7, '#fbf4e6'));

  // la piazza è parte del terreno: il suolo sotto di lei è livellato e il selciato è complanare
  const plaza = { x: 0, z: 1.2, radius: 7.4 };
  const { island, level, top: baseY } = makePlazaIsland(
    {
      radius: 12,
      depth: 3.6,
      hill: 0.7,
      seed: 15,
      top: '#96a273',
      topAlt: '#86945f',
      soil: '#8d6c4b',
      rock: '#6a5541',
    },
    plaza
  );
  g.add(island.group);
  addSampietrinoPlaza(g, { ...plaza, level });

  const r = rng(31);
  const houseSpots = [
    [-5.4, -5.2, 0.32, '#e9dcc4', '#a9573f', 2.9],
    [0.4, -6.0, 0.02, '#ead7b6', '#b4624a', 3.1],
    [5.2, -5.0, -0.3, '#dfd0b8', '#96503c', 2.7],
  ];
  for (const [x, z, ry, wall, roof, w] of houseSpots) {
    const h = makeHouse({
      w,
      d: 2.6,
      h: 3.4,
      wall,
      roof,
      seed: Math.floor(rr(r, 1, 999)),
      lit: 0.15,
      floors: 2,
      timber: true,
    });
    h.position.set(x, island.heightAt(x, z) - 0.1, z);
    h.rotation.y = ry;
    g.add(h);
  }

  const stallA = makeMarketStall({ colorA: '#e7d7ba', colorB: '#b3553f', goods: '#d98b3f' });
  stallA.position.set(-2.7, baseY, 1.4);
  stallA.rotation.y = 0.28;
  g.add(stallA);

  const stallB = makeMarketStall({ colorA: '#e2d3b7', colorB: '#3d5a6b', goods: '#b7452f' });
  stallB.position.set(2.5, baseY, 1.0);
  stallB.rotation.y = -0.32;
  g.add(stallB);

  const well = makeWell();
  well.position.set(0, baseY, 4.9);
  well.scale.setScalar(0.85);
  g.add(well);

  const cart = makeCart();
  cart.group.position.set(1.9, baseY, 6.0);
  cart.group.rotation.y = 1.15;
  g.add(cart.group);

  for (const [x, z] of [
    [-5.6, 3.1],
    [5.4, 3.6],
    [-2.2, 5.9],
    [3.8, 5.3],
  ]) {
    const b = makeBarrel();
    b.position.set(x, baseY, z);
    g.add(b);
  }
  const crate = makeCrate(0.7);
  crate.position.set(-4.8, baseY, 0.2);
  g.add(crate);

  const coins = [];
  for (let i = 0; i < 3; i++) {
    const c = makeCoin();
    c.position.set(2.2 + i * 0.24, baseY + 0.9, 0.5);
    c.rotation.x = Math.PI / 2;
    g.add(c);
    coins.push(c);
  }
  const sack = makeSack('#c2a878');
  sack.position.set(-3.9, baseY, 0.4);
  g.add(sack);

  const bale = makeCrate(0.9);
  bale.position.set(4.0, baseY, 0.1);
  bale.rotation.y = 0.3;
  g.add(bale);
  add(g, new THREE.BoxGeometry(0.92, 0.3, 0.92), mat('#3f5d78'), [4.0, baseY + 0.95, 0.1], [0, 0.3, 0], [1, 1, 1], false);

  const banner = makeBanner({ color: '#b4503c', accent: '#e7d6b6' });
  banner.position.set(-6.2, island.heightAt(-6.2, 7.0) - 0.1, 7.0);
  g.add(banner);

  const people = [];
  const merchant = makeFigure({
    x: -2.0,
    y: baseY,
    z: -0.4,
    ry: 2.4,
    longRobe: true,
    robe: '#4c5d75',
    accent: '#d9c7a5',
    hat: 'merchant',
    bag: true,
  });
  g.add(merchant.group);
  people.push(merchant);

  const woman = makeFigure({
    x: 1.0,
    y: baseY,
    z: 3.1,
    ry: -2.7,
    longRobe: true,
    robe: '#8a4f57',
    accent: '#cbb493',
    veil: '#cbb493',
    bun: true,
  });
  g.add(woman.group);
  people.push(woman);

  const french = makeFigure({
    x: 3.6,
    y: baseY,
    z: 2.2,
    ry: -2.2,
    robe: '#4f6b52',
    accent: '#e0cfa9',
    hat: 'cap',
    cloak: '#3f5541',
  });
  g.add(french.group);
  people.push(french);

  const kidA = makeFigure({
    x: -0.6,
    y: baseY,
    z: 3.6,
    ry: 0.4,
    child: true,
    robe: '#b5764f',
    accent: '#e3d2b2',
  });
  g.add(kidA.group);
  people.push(kidA);

  const kidB = makeFigure({
    x: 0.2,
    y: baseY,
    z: 4.3,
    ry: -0.5,
    child: true,
    robe: '#6b7a8c',
    accent: '#d9c9a8',
  });
  g.add(kidB.group);
  people.push(kidB);

  const buyer = makeFigure({
    x: -4.0,
    y: baseY,
    z: 3.4,
    ry: 1.1,
    longRobe: true,
    robe: '#6a5b47',
    accent: '#cdbb99',
    veil: '#b9a687',
    bun: true,
  });
  g.add(buyer.group);
  people.push(buyer);

  const tossCoin = makeCoin();
  g.add(tossCoin);

  const porter = makeFigure({
    x: 2.9,
    y: baseY,
    z: 5.6,
    ry: Math.PI,
    robe: '#6a5b47',
    accent: '#cdbb99',
    hat: 'cap',
    bag: true,
  });
  g.add(porter.group);

  return {
    group: g,
    mood: {
      bg: '#cfdada',
      fog: ['#dfe3d8', 45, 150],
      hemi: ['#c4dcee', '#6f6a4f', 1.3],
      sun: ['#ffe2b4', 2.6, [0.52, 0.7, 0.42]],
      exposure: 1.0,
    },
    camera: { pos: [15, 7.8, 18.6], look: [0.4, 2.1, 2.2], fov: 42 },
    update(t) {
      for (let i = 0; i < people.length; i++) {
        idlePose(people[i], t + i * 0.7, 1);
      }
      merchant.armR.rotation.x = -0.8 + Math.sin(t * 1.1) * 0.25;
      merchant.armR.rotation.z = -0.3;
      woman.armL.rotation.x = -0.9;
      french.armL.rotation.x = -0.5 + Math.sin(t * 0.8) * 0.2;
      pointWithArm(kidA, 'right', 0.6);

      const phase = (t * 0.55) % 1;
      const lift = Math.sin(Math.min(1, phase) * Math.PI);
      tossCoin.position.set(-2.0 + Math.sin(t * 0.4) * 0.15, baseY + 0.95 + lift * 0.9, -0.2 - lift * 0.7);
      tossCoin.rotation.set(Math.PI / 2 + t * 5, 0, t * 3);
      coins.forEach((c, i) => (c.rotation.z = t * (0.4 + i * 0.2)));

      const cycle = 12;
      const cu = (t % cycle) / cycle;
      let k = 0;
      let forward = true;
      if (cu < 0.42) k = smoothstep(cu / 0.42);
      else if (cu < 0.5) k = 1;
      else if (cu < 0.92) { k = 1 - smoothstep((cu - 0.5) / 0.42); forward = false; }
      porter.group.position.x = 2.9;
      porter.group.position.z = 5.6 - k * 3.4;
      porter.group.rotation.y = dampAngle(porter.group.rotation.y, forward ? Math.PI : 0, 0.07);
      walkPose(porter, t * 3.2, 0.5 * (k > 0.02 && k < 0.98 ? 1 : 0));

      const roll = (Math.sin(t * 0.2) + 1) / 2;
      cart.group.position.z = 6.0 + roll * 0.9;
      cart.wheels.forEach((w) => (w.rotation.x = t * 0.4 + roll));
      banner.rotation.z = Math.sin(t * 0.8) * 0.022;
    },
  };
}
