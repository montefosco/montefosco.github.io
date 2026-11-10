import * as THREE from 'three';
import { add, mat, boxGeo, cylGeo, coneGeo, icoGeo, sphereGeo } from '../lib/lowpoly.js';
import { makeBarrel, makeCrate, makeSack } from '../lib/world.js';
import { makeFigure } from '../lib/figures.js';
import { GAL } from '../lib/galleon.js';

const FLOOR = GAL.FLOOR;
const CORE_SCALE = 1.3;

/**
 * Interno della stiva: Claudio disteso sul giaciglio, i bambini attorno che lo guardano.
 * Tutto è figlio della nave, quindi segue il dondolio.
 */
export function makeFinaleHold(ship) {
  const hold = new THREE.Group();
  ship.add(hold);

  /* ---------- giaciglio di Claudio ---------- */
  const core = new THREE.Group();
  core.position.set(0, FLOOR, 0);
  core.scale.setScalar(CORE_SCALE);
  hold.add(core);
  const bedTop = 0.2;
  add(core, boxGeo(2.0, 0.2, 0.95), mat('#5a4129'), [0.05, 0.1, -0.15]);
  add(core, boxGeo(1.9, 0.1, 0.85), mat('#b79d6c'), [0.05, 0.25, -0.15], [0, 0, 0], [1, 1, 1], false); // paglia
  add(core, boxGeo(0.5, 0.12, 0.5), mat('#d9d0bd'), [-0.62, bedTop + 0.12, -0.15], [0, 0, 0], [1, 1, 1], false); // cuscino

  const claudioPivot = new THREE.Group();
  claudioPivot.position.set(0.12, bedTop + 0.1, -0.15);
  claudioPivot.rotation.y = Math.PI / 2; // testa verso poppa (-x)
  core.add(claudioPivot);
  const claudio = makeFigure({
    child: true,
    skin: '#d8cfc2',
    hair: '#3a2c22',
    robe: '#a79a86',
    accent: '#cfc4ad',
    trousers: '#6b5f50',
    hat: null,
  });
  claudio.group.rotation.x = -Math.PI / 2;
  claudio.group.position.set(0, 0.0, 0.0);
  claudioPivot.add(claudio.group);
  // mani incrociate sul petto, occhi chiusi
  claudio.armL.rotation.set(-0.95, 0, 0.5);
  claudio.armR.rotation.set(-0.95, 0, -0.5);
  const lid = mat('#cfc4b6');
  add(claudio.head, boxGeo(0.07, 0.035, 0.022), lid, [-0.072, 0.12, 0.185], [0, 0, 0], [1, 1, 1], false);
  add(claudio.head, boxGeo(0.07, 0.035, 0.022), lid, [0.072, 0.12, 0.185], [0, 0, 0], [1, 1, 1], false);
  // lenzuolo dalla vita in giù
  add(core, boxGeo(0.78, 0.17, 0.62), mat('#e6dfd0'), [0.62, bedTop + 0.27, -0.15]);
  add(core, boxGeo(0.7, 0.07, 0.58), mat('#d4ccba'), [0.64, bedTop + 0.38, -0.15], [0, 0, 0.04], [1, 1, 1], false);
  add(core, boxGeo(0.14, 0.05, 0.6), mat('#cfc6b2'), [0.2, bedTop + 0.33, -0.15], [0, 0, 0.1], [1, 1, 1], false);

  /* ---------- candela e lanterne ---------- */
  const candleBox = makeCrate(0.4);
  candleBox.position.set(-1.35, 0, -0.15);
  candleBox.rotation.y = 0.3;
  core.add(candleBox);
  add(core, cylGeo(0.035, 0.04, 0.2, 5), mat('#efe6cf'), [-1.35, 0.5, -0.15], [0, 0, 0], [1, 1, 1], false);
  const flame = add(
    hold,
    coneGeo(0.032, 0.11, 5),
    mat('#ffe3a3', { emissive: '#ffb347', emissiveIntensity: 3.2 }),
    [-1.35, 0.66, -0.15],
    [0, 0, 0],
    [1, 1, 1],
    false
  );
  const candleLight = new THREE.PointLight('#ffb26a', 9, 6.5, 2);
  candleLight.position.set(-1.35, 0.85, -0.05);
  core.add(candleLight);

  // lanterna appesa sopra il giaciglio
  add(hold, cylGeo(0.012, 0.012, 0.75, 4), mat('#2a1d15'), [0.2, GAL.DECK - 0.55, -0.4], [0, 0, 0], [1, 1, 1], false);
  const lantern = add(hold, boxGeo(0.26, 0.34, 0.26), mat('#ffd39a', { emissive: '#ffab54', emissiveIntensity: 2.6 }), [0.2, GAL.DECK - 1.05, -0.4], [0, 0, 0], [1, 1, 1], false);
  add(hold, coneGeo(0.22, 0.16, 4), mat('#2a1d15'), [0.2, GAL.DECK - 0.82, -0.4], [0, Math.PI / 4, 0], [1, 1, 1], false);
  const lanternLight = new THREE.PointLight('#ffb870', 15, 10.5, 2);
  lanternLight.position.set(0.2, GAL.DECK - 1.1, 0.15);
  hold.add(lanternLight);

  // lanterne a poppa e a prua della stiva
  const lampLights = [];
  for (const [x, z] of [[-4.6, -1.0], [4.0, -0.9]]) {
    add(hold, cylGeo(0.012, 0.012, 0.5, 4), mat('#2a1d15'), [x, GAL.DECK - 0.45, z], [0, 0, 0], [1, 1, 1], false);
    add(hold, boxGeo(0.2, 0.26, 0.2), mat('#ffd39a', { emissive: '#ffab54', emissiveIntensity: 2.2 }), [x, GAL.DECK - 0.82, z], [0, 0, 0], [1, 1, 1], false);
    const l = new THREE.PointLight('#ff9d55', 6, 7, 2);
    l.position.set(x, GAL.DECK - 0.9, z + 0.2);
    hold.add(l);
    lampLights.push(l);
  }

  /* ---------- bambini ---------- */
  const robes = ['#8a7a68', '#6b7a8c', '#a9704c', '#8d6b8e', '#b5764f', '#7d8a6a', '#9a8366', '#6e6f8c', '#a5806b'];
  const hairs = ['#2f2620', '#4a3424', '#1f1a17', '#6a4a2c', '#3b2b23', '#2a2420', '#5a3d27', '#241c18', '#4a3a2a'];
  const center = new THREE.Vector2(0.0, -0.15);
  const spec = [
    // x, z, quanto guarda a sinistra/destra, testa giù, braccia
    { x: -0.75, z: -1.25, look: 0.1, bow: 0.5, pose: 'clasp' },
    { x: 0.15, z: -1.3, look: 0.0, bow: 0.45, pose: 'mouth' },
    { x: 0.95, z: -1.15, look: -0.15, bow: 0.55, pose: 'clasp' },
    { x: -1.75, z: -0.55, look: 0.2, bow: 0.5, pose: 'arm' },
    { x: 1.75, z: -0.25, look: -0.1, bow: 0.4, pose: 'reach' },
    { x: -1.65, z: 0.9, look: 0.35, bow: 0.5, pose: 'clasp' },
    { x: 1.7, z: 1.0, look: -0.35, bow: 0.45, pose: 'mouth' },
    { x: 2.3, z: -0.75, look: -0.1, bow: 0.35, pose: 'clasp' },
  ];
  const kids = [];
  spec.forEach((k, i) => {
    const ry = Math.atan2(center.x - k.x, center.y - k.z) + k.look;
    const fig = makeFigure({
      x: k.x,
      y: 0,
      z: k.z,
      ry,
      child: true,
      robe: robes[i % robes.length],
      accent: '#d9c9a5',
      hair: hairs[i % hairs.length],
      trousers: '#4b423a',
      bun: false,
    });
    fig.head.rotation.x = k.bow;
    if (k.pose === 'clasp') {
      fig.armL.rotation.set(-0.85, 0, 0.42);
      fig.armR.rotation.set(-0.85, 0, -0.42);
    } else if (k.pose === 'mouth') {
      fig.armL.rotation.set(-2.15, 0, 0.35);
      fig.armR.rotation.set(-0.7, 0, -0.35);
    } else if (k.pose === 'arm') {
      fig.armR.rotation.set(-0.8, 0, -0.35);
      fig.armL.rotation.set(-0.5, 0, 0.25);
    } else if (k.pose === 'reach') {
      fig.armL.rotation.set(-1.15, 0, 0.1);
      fig.armR.rotation.set(-0.55, 0, -0.3);
    }
    core.add(fig.group);
    kids.push({ fig, k, phase: i * 1.37 });
  });

  // due bambini seduti più in fondo
  const seated = [];
  for (const [x, z, face, robe, hair] of [
    [-3.3, -0.9, 1.0, '#7d8a6a', '#4a3424'],
    [3.35, 0.2, -1.1, '#9a8366', '#241c18'],
  ]) {
    const crate = makeCrate(0.65);
    crate.position.set(x, FLOOR, z);
    hold.add(crate);
    const fig = makeFigure({ x, y: FLOOR + 0.44, z, ry: face > 0 ? Math.PI / 2 - 0.1 : -Math.PI / 2 + 0.1, child: true, scale: 1.3, robe, hair, accent: '#d9c9a5' });
    fig.legL.rotation.x = -1.5;
    fig.legR.rotation.x = -1.5;
    fig.head.rotation.x = 0.4;
    fig.armL.rotation.set(-0.5, 0, 0.3);
    fig.armR.rotation.set(-0.5, 0, -0.3);
    hold.add(fig.group);
    seated.push(fig);
  }

  /* ---------- carico e ingombri ---------- */
  const scatter = (obj, x, z, ry = 0, y = FLOOR) => {
    obj.position.set(x, y, z);
    obj.rotation.y = ry;
    hold.add(obj);
    return obj;
  };
  // poppa
  scatter(makeBarrel('#8a6747'), -5.1, 0.6);
  scatter(makeBarrel('#7d5c3e'), -4.55, 1.15, 0.5);
  scatter(makeBarrel('#8a6747'), -5.4, -0.6);
  scatter(makeCrate(0.7), -4.5, -1.1, 0.2);
  scatter(makeCrate(0.5), -4.55, -1.15, 0.5, FLOOR + 0.7);
  scatter(makeSack('#c4ab7b'), -3.6, 1.2, 0.3).scale.setScalar(0.8);
  scatter(makeSack('#b9a077'), -3.2, -1.35, 1.2).scale.setScalar(0.75);
  // prua
  scatter(makeBarrel('#8a6747'), 4.6, 0.9);
  scatter(makeBarrel('#7d5c3e'), 4.55, -0.4, 0.3);
  scatter(makeBarrel('#8a6747'), 5.15, 0.15, 0.1);
  scatter(makeCrate(0.75), 4.0, 1.25, 0.15);
  scatter(makeCrate(0.55), 4.1, 1.3, 0.2, FLOOR + 0.75);
  scatter(makeSack('#c4ab7b'), 3.25, -1.25, 0.6).scale.setScalar(0.85);
  scatter(makeSack('#b9a077'), 2.75, 1.4, 1.6).scale.setScalar(0.7);
  // fagotti dei bambini, accanto al lato vicino
  for (const [x, z] of [[-2.2, 1.45], [2.45, 1.5], [-2.7, 0.2]]) {
    const b = new THREE.Group();
    add(b, icoGeo(0.2, 1), mat('#b8a07a'), [0, 0.2, 0], [0, 0, 0], [1, 1, 0.85]);
    add(b, cylGeo(0.012, 0.012, 0.8, 4), mat('#6d5136'), [0.16, 0.38, 0], [0, 0, 0.1], [1, 1, 1], false);
    b.position.set(x, FLOOR, z);
    hold.add(b);
  }
  // ciotola d'acqua e pane accanto al giaciglio
  add(hold, cylGeo(0.16, 0.1, 0.1, 7), mat('#7c6a58'), [1.25, FLOOR + 0.05, 0.62], [0, 0, 0], [1, 1, 1], false);
  add(hold, icoGeo(0.09, 0), mat('#c89b5f'), [1.5, FLOOR + 0.07, 0.72], [0, 0, 0], [1, 0.7, 1], false);
  // catene a terra (la stiva è una stiva di merce)
  {
    const chain = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.025, 4, 9, 4.6),
      mat('#3a3d42', { metalness: 0.6, roughness: 0.45 })
    );
    chain.rotation.x = -Math.PI / 2;
    chain.position.set(-2.8, FLOOR + 0.03, 0.5);
    hold.add(chain);
    const chain2 = chain.clone();
    chain2.position.set(2.7, FLOOR + 0.03, -0.55);
    chain2.rotation.z = 1.2;
    hold.add(chain2);
  }
  // oblò sul lato lontano: lama di luna
  for (const x of [-3.6, -1.6, 1.8, 3.8]) {
    add(
      hold,
      boxGeo(0.34, 0.34, 0.05),
      mat('#bcd3f0', { emissive: '#6d8fc4', emissiveIntensity: 1.25 }),
      [x, 1.75, -1.835 + Math.abs(x) * 0.0],
      [0, 0, 0],
      [1, 1, 1],
      false
    );
  }

  return {
    group: hold,
    update(t) {
      const flick = 1 + Math.sin(t * 9.1) * 0.06 + Math.sin(t * 15.7 + 1) * 0.05;
      candleLight.intensity = 9 * flick;
      flame.scale.set(1, flick, 1);
      lanternLight.intensity = 15 + Math.sin(t * 3.4) * 1.4;
      lampLights.forEach((l, i) => (l.intensity = 6 + Math.sin(t * 2.7 + i * 2) * 0.7));
      lantern.material.emissiveIntensity = 2.4 + Math.sin(t * 3.4) * 0.3;

      claudio.body.position.y = 0;
      kids.forEach(({ fig, k, phase }) => {
        const b = Math.sin(t * 1.2 + phase);
        fig.body.position.y = b * 0.006;
        fig.head.rotation.x = k.bow + Math.sin(t * 0.45 + phase) * 0.05;
        fig.head.rotation.y = Math.sin(t * 0.3 + phase) * 0.05;
      });
      seated.forEach((fig, i) => {
        fig.head.rotation.x = 0.4 + Math.sin(t * 0.5 + i) * 0.05;
      });
    },
  };
}
