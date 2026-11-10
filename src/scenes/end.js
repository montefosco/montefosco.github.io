import * as THREE from 'three';
import {
  add,
  mat,
  boxGeo,
  cylGeo,
  coneGeo,
  rng,
  rr,
  makeSky,
  makeSun,
  makeMoon,
  makeStars,
  makeCloud,
  makeIsland,
  makeWater,
  makeTree,
  makeCypress,
  makeBird,
} from '../lib/lowpoly.js';
import { makeHouse, makeBanner, makeCrate, makeBarrel, makeCoin, makeCross, makeSack } from '../lib/world.js';
import { makeFigure, idlePose, pointWithArm, walkPose } from '../lib/figures.js';
import { makeMotes, makeBundle, makeChest, makeLedger, smoothstep } from './shared.js';
import { makePlazaIsland, addSampietrinoPlaza } from '../lib/piazza.js';
import { makeGalleon, GAL } from '../lib/galleon.js';
import { makeFinaleHold } from './finaleHold.js';

/* ------------------------------------------------------------------ */
/* quadro: venduti in Spagna                                           */
/* ------------------------------------------------------------------ */

export function buildSpagna() {
  const g = new THREE.Group();

  g.add(
    makeSky([
      [0, '#5f8cb8'],
      [0.4, '#a9c6d6'],
      [0.72, '#ecdfc2'],
      [1, '#f6e8ca'],
    ])
  );
  g.add(makeSun('#ffeec4', 11, [70, 52, -110]));
  g.add(makeCloud([-54, 38, -95], 2.6, '#f7efe0'));
  g.add(makeCloud([58, 46, -115], 2.0, '#fbf5e9'));

  // la piazza è parte del terreno: il suolo sotto di lei è livellato e il selciato è complanare
  const plaza = { x: 0, z: 0.4, radius: 7.6 };
  const { island, level, top: plazaY } = makePlazaIsland(
    {
      radius: 15,
      depth: 4.4,
      hill: 1.6,
      seed: 2,
      top: '#b9a274',
      topAlt: '#a8925f',
      soil: '#9a7852',
      rock: '#7a6046',
    },
    plaza
  );
  g.add(island.group);
  addSampietrinoPlaza(g, { ...plaza, level });
  const h = island.heightAt;

  const r = rng(46);
  const buildings = [
    [-6.6, -5.4, 0.3, '#c9a67a', 3.6, 3.0],
    [-1.6, -7.2, 0.02, '#d3b184', 3.2, 3.6],
    [3.8, -6.6, -0.3, '#c39d72', 3.5, 3.2],
    [8.0, -3.6, -0.7, '#cfa97c', 3.0, 2.8],
    [-9.4, 1.6, 0.7, '#d0ac80', 3.3, 2.9],
  ];
  for (const [x, z, ry, wall, hh, w] of buildings) {
    const house = makeHouse({
      w,
      d: 2.8,
      h: hh,
      wall,
      roof: '#b4604a',
      trim: '#6d5136',
      stone: '#bfa87f',
      seed: Math.floor(rr(r, 1, 999)),
      lit: 0.1,
      floors: 2,
      timber: false,
    });
    house.position.set(x, h(x, z) - 0.12, z);
    house.rotation.y = ry;
    g.add(house);
  }

  // palco della vendita
  const stage = new THREE.Group();
  add(stage, boxGeo(3.6, 0.55, 2.6), mat('#7d5a3a'), [0, 0.28, 0]);
  add(stage, boxGeo(3.7, 0.1, 2.7), mat('#96714a'), [0, 0.56, 0], [0, 0, 0], [1, 1, 1], false);
  for (const [x, z] of [[-1.5, -1.0], [1.5, -1.0], [-1.5, 1.0], [1.5, 1.0]]) {
    add(stage, boxGeo(0.14, 0.55, 0.14), mat('#5f432c'), [x, 0.28, z]);
  }
  for (let i = 0; i < 2; i++) {
    add(stage, boxGeo(1.6, 0.2, 0.5), mat('#8a674a'), [0, 0.1 + i * 0.2, 1.5 + (1 - i) * 0.42], [0, 0, 0], [1, 1, 1], false);
  }
  stage.position.set(0, plazaY, 1.2);
  g.add(stage);

  const platformTop = plazaY + 0.61;
  const domenico = makeFigure({
    x: 0,
    y: platformTop,
    z: 1.0,
    ry: 0.1,
    longRobe: true,
    robe: '#3f5060',
    accent: '#d9c7a5',
    hat: 'merchant',
    cloak: '#33434f',
  });
  g.add(domenico.group);

  const chest = makeChest({ w: 0.85, h: 0.5 });
  chest.position.set(-1.4, platformTop, 1.0);
  chest.rotation.y = 0.2;
  g.add(chest);
  for (let i = 0; i < 4; i++) {
    const c = makeCoin();
    c.position.set(-1.45 + i * 0.12, platformTop + 0.56, 1.15 + (i % 2) * 0.1);
    c.rotation.x = Math.PI / 2;
    g.add(c);
  }

  const ledger = makeLedger();
  ledger.position.set(-4.3, plazaY + 0.08, 3.4);
  g.add(ledger);
  add(g, boxGeo(2.2, 0.9, 1.1), mat('#8a674a'), [-4.3, plazaY + 0.45, 3.4]);
  add(g, boxGeo(2.3, 0.1, 1.2), mat('#a17c51'), [-4.3, plazaY + 0.94, 3.4], [0, 0, 0], [1, 1, 1], false);
  for (let i = 0; i < 5; i++) {
    const c = makeCoin();
    c.position.set(-4.7 + i * 0.18, plazaY + 1.0, 3.35 + (i % 2) * 0.12);
    c.rotation.x = Math.PI / 2;
    g.add(c);
  }

  // corda e paletti
  add(g, new THREE.TorusGeometry(2.5, 0.035, 4, 24), mat('#8a7048'), [0, plazaY + 0.06, 4.9], [Math.PI / 2, 0, 0], [1.35, 1, 0.85], false);
  for (const [x, z] of [[-3.2, 4.9], [3.2, 4.9]]) {
    add(g, cylGeo(0.07, 0.09, 1.1, 5), mat('#6d5136'), [x, plazaY + 0.55, z]);
  }

  const kids = [];
  const kidSpecs = [
    [-1.5, 3.6, 0.4, '#b5764f'],
    [-0.6, 4.1, -0.2, '#6b7a8c'],
    [0.4, 3.8, 0.1, '#a9704c'],
    [1.4, 4.4, -0.4, '#8d6b8e'],
  ];
  for (const [x, z, ry, robe] of kidSpecs) {
    const kid = makeFigure({ x, y: plazaY, z, ry, child: true, robe, accent: '#dccbaa' });
    if (x > 0.8) {
      const b = makeBundle('#b9a077');
      b.position.set(0.3, 0.6, 0.05);
      b.scale.setScalar(0.8);
      kid.body.add(b);
    }
    g.add(kid.group);
    kids.push(kid);
  }

  const kidBases = kids.map((k) => [k.group.position.x, k.group.position.z]);

  const buyerA = makeFigure({
    x: 4.6,
    y: plazaY,
    z: 3.4,
    ry: -1.7,
    longRobe: true,
    robe: '#5b4a55',
    accent: '#cdbb99',
    hat: 'cap',
    cloak: '#4a3b46',
  });
  g.add(buyerA.group);

  const buyerB = makeFigure({
    x: 5.6,
    y: plazaY,
    z: 4.5,
    ry: -1.4,
    longRobe: true,
    robe: '#6a5b47',
    accent: '#cdbb99',
    veil: '#b9a687',
    bun: true,
  });
  g.add(buyerB.group);

  const bearer = makeFigure({
    x: 5.4,
    y: plazaY,
    z: 5.0,
    ry: -2.1,
    robe: '#6a5a46',
    accent: '#c9b99a',
    hat: 'cap',
  });
  g.add(bearer.group);

  const moneySack = makeSack('#c2a878');
  moneySack.scale.setScalar(0.7);
  g.add(moneySack);

  const priest = makeFigure({
    x: -5.6,
    y: plazaY,
    z: 5.4,
    ry: 0.4,
    longRobe: true,
    robe: '#54473c',
    accent: '#c9b99a',
    beard: true,
  });
  g.add(priest.group);

  for (const [x, z, sc] of [
    [-11.8, 4.2, 2.6],
    [12.0, 0.0, 2.4],
    [-8.8, 9.2, 2.2],
    [8.8, 10.2, 2.0],
  ]) {
    const t = makeTree(sc, '#8a8a52');
    t.position.set(x, h(x, z), z);
    g.add(t);
  }
  for (const [x, z] of [[-12.4, -3.0], [12.4, 5.0]]) {
    const c = makeCypress(3.4, '#5c6b3f');
    c.position.set(x, h(x, z), z);
    g.add(c);
  }

  const basket = add(g, cylGeo(0.26, 0.2, 0.34, 8), mat('#a37e4b'), [3.9, plazaY + 0.17, 2.2]);
  const birds = [];
  for (let i = 0; i < 3; i++) {
    const b = makeBird('#3a3630');
    b.group.scale.setScalar(1.35);
    g.add(b.group);
    birds.push({ b, phase: rr(r, 0, Math.PI * 2), rad: rr(r, 8, 13), speed: rr(r, 0.08, 0.16), hgt: rr(r, 14, 18) });
  }

  const motes = makeMotes({ count: 40, spread: [12, 5, 8], center: [0, 3, 3], color: '#ffe3b0', opacity: 0.35, size: 0.07 });
  g.add(motes);

  return {
    group: g,
    mood: {
      bg: '#d8d0b8',
      fog: ['#e5d8b8', 45, 155],
      hemi: ['#cfdfdf', '#8a7148', 1.15],
      sun: ['#ffe7b8', 3.1, [0.38, 0.78, 0.34]],
      exposure: 1.04,
      shadow: 26,
    },
    camera: { pos: [12.2, 8.4, 15.6], look: [-1.2, 1.8, 1.4], fov: 42 },
    update(t, intro) {
      domenico.head.rotation.y = Math.sin(t * 0.4) * 0.2;
      domenico.armL.rotation.x = -0.35;
      domenico.armL.rotation.z = -0.75 - Math.sin(t * 0.6) * 0.12;
      domenico.armR.rotation.x = -0.5;
      domenico.armR.rotation.z = 0.6 + Math.sin(t * 0.5 + 1) * 0.1;

      const lead = smoothstep((intro - 0.2) / 0.65);
      kids.forEach((k, i) => {
        idlePose(k, t + i, 0.55);
        k.group.position.x = kidBases[i][0] + lead * (0.8 + i * 0.4);
        k.group.position.z = kidBases[i][1] + lead * (0.15 + i * 0.06);
        k.group.rotation.y = 0.4 - lead * 0.9;
        walkPose(k, t * 2 + i * 0.7, lead > 0.02 && lead < 0.98 ? 0.3 : 0);
        k.head.rotation.x = 0.2 + Math.sin(t * 0.3 + i) * 0.05;
      });
      pointWithArm(buyerA, 'right', 0.5 + Math.sin(t * 0.5) * 0.1);
      buyerA.head.rotation.y = -0.2;
      buyerB.armL.rotation.x = -0.6;

      const carry = smoothstep((intro - 0.12) / 0.4);
      const setDown = smoothstep((intro - 0.62) / 0.2);
      const bx = 5.4 - carry * 3.2;
      const bz = 5.0 - carry * 2.3;
      bearer.group.position.set(bx, plazaY, bz);
      bearer.group.rotation.y = Math.atan2(-bx, 1.2 - bz);
      walkPose(bearer, t * 2.5, carry > 0.02 && carry < 0.98 ? 0.55 : 0);
      bearer.armR.rotation.x = -0.2 - setDown * 0.3;
      bearer.armR.rotation.z = -0.04;
      const handX = bx - 0.12;
      const handZ = bz + 0.23;
      moneySack.position.set(
        handX + setDown * (1.7 - handX),
        plazaY + 0.04 + setDown * 0.57,
        handZ + setDown * (2.3 - handZ)
      );
      moneySack.rotation.z = Math.sin(t * 1.1) * 0.04 * (1 - setDown);

      for (const b of birds) {
        const a = b.phase + t * b.speed;
        b.b.group.position.set(Math.cos(a) * b.rad, b.hgt + Math.sin(t * 0.5 + b.phase) * 0.6, Math.sin(a) * b.rad + 4);
        b.b.group.rotation.y = -a;
        b.b.update(t, 5);
      }
      motes.userData.update(t);
    },
  };
}

/* ------------------------------------------------------------------ */
/* quadro finale: la stiva, Claudio e i bambini                         */
/* ------------------------------------------------------------------ */

export function buildFinale() {
  const g = new THREE.Group();

  const sky = makeSky([
    [0, '#03050b'],
    [0.36, '#0a1120'],
    [0.62, '#152238'],
    [0.82, '#2b3a52'],
    [1, '#4a3f45'],
  ]);
  g.add(sky);
  const stars = makeStars(720, 290);
  g.add(stars);
  g.add(makeMoon(8, [10, 9, -70]));

  const shootMat = new THREE.MeshBasicMaterial({ color: '#f6ead0', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const shoot = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.06, 0.06), shootMat);
  shoot.position.set(56, 24, -95);
  g.add(shoot);
  g.add(makeCloud([-55, 8, -90], 3.2, '#586a86'));
  g.add(makeCloud([40, 4, -105], 2.6, '#4a5b76'));

  const island = makeIsland({
    radius: 26,
    depth: 3.4,
    hill: 0.7,
    seed: 33,
    top: '#25414a',
    topAlt: '#1e353d',
    soil: '#1b2a30',
    rock: '#141d22',
    sectors: 44,
    rings: 8,
    tufts: false,
  });
  island.group.position.y = -1.2;
  g.add(island.group);

  // mare un poco più sfaccettato: più anelli e più settori
  const water = makeWater({ radius: 26, y: 0.18, color: '#224c5e', rings: 18, sectors: 84, amp: 0.22, speed: 0.8 });
  water.water.material.emissive = new THREE.Color('#123a4c');
  water.water.material.emissiveIntensity = 0.7;
  g.add(water);

  const ship = makeGalleon({ hull: '#6b4e38', hullAlt: '#5a4130', sail: '#c9c2b4', flag: '#7a3b32', trim: '#5b4630' });
  ship.position.set(-1.2, 0.42, 0);
  ship.rotation.y = 0.1;
  g.add(ship);

  const hold = makeFinaleHold(ship);

  const home = makeIsland({
    radius: 4.2,
    depth: 2.4,
    hill: 1.4,
    seed: 5,
    top: '#2c3f3a',
    topAlt: '#243431',
    soil: '#2a2620',
    rock: '#1b1a18',
    float: true,
    tufts: false,
  });
  home.group.position.set(30, -4.5, -66);
  g.add(home.group);
  add(g, boxGeo(0.7, 2.6, 0.7), mat('#3b3530'), [30, -2.6, -66]);
  add(g, coneGeo(0.55, 0.8, 4), mat('#2f2a26'), [30, -1.0, -66], [0, Math.PI / 4, 0]);
  const farLight = add(
    g,
    new THREE.IcosahedronGeometry(0.32, 0),
    mat('#ffd09a', { emissive: '#ffab54', emissiveIntensity: 2.4 }),
    [30.1, -3.4, -65.7],
    [0, 0, 0],
    [1, 1, 1],
    false
  );

  const lanternData = [];
  const lr = rng(9);
  for (let i = 0; i < 10; i++) {
    const material = new THREE.MeshBasicMaterial({ color: '#ffcf94', transparent: true, opacity: 0.85, fog: false });
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(rr(lr, 0.11, 0.2), 0), material);
    g.add(mesh);
    lanternData.push({
      mesh,
      material,
      x: rr(lr, -22, 20),
      z: rr(lr, -14, -6),
      phase: rr(lr, 0, 1),
      speed: rr(lr, 0.018, 0.04),
      sway: rr(lr, 0.3, 1.2),
    });
  }

  return {
    group: g,
    mood: {
      bg: '#05080f',
      fog: ['#0c1626', 60, 190],
      hemi: ['#4a6088', '#161b22', 0.8],
      sun: ['#a9c4ee', 1.5, [-0.35, 0.55, 0.75]],
      exposure: 1.25,
      shadow: 32,
    },
    camera: { pos: [-2.0, 6.0, 21.5], look: [-4.4, 3.4, 0], fov: 40 },
    update(t) {
      stars.update(t);
      water.update(t, 0.2);
      ship.position.y = 0.42 + Math.sin(t * 0.55) * 0.07;
      ship.rotation.z = Math.sin(t * 0.42) * 0.01;
      ship.rotation.x = Math.sin(t * 0.37 + 1) * 0.006;
      ship.position.x = -1.2 + Math.sin(t * 0.045) * 0.8;
      ship.userData.update(t);
      hold.update(t);
      farLight.material.emissiveIntensity = 2.0 + Math.sin(t * 2.1) * 0.4;

      for (const l of lanternData) {
        const p = (l.phase + t * l.speed) % 1;
        l.mesh.position.set(l.x + Math.sin(t * 0.4 + l.phase * 6) * l.sway, p * 7 - 0.5, l.z);
        l.material.opacity = 0.85 * Math.sin(Math.min(1, p * 1.4) * Math.PI);
      }

      const sc = (t % 17) / 17;
      const su = sc < 0.14 ? sc / 0.14 : 0;
      shoot.position.set(56 - su * 42, 24 - su * 12, -95);
      shootMat.opacity = Math.sin(su * Math.PI) * 0.8;
    },
  };
}
