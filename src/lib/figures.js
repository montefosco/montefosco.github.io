import * as THREE from 'three';
import { add, mat, boxGeo, cylGeo, coneGeo, icoGeo, sphereGeo, TAU } from './lowpoly.js';

/**
 * Personaggio low poly stilizzato, con testa grande e sagoma riconoscibile.
 * Restituisce group + parti animabili (body, head, armL, armR, legL, legR).
 */
export function makeFigure({
  x = 0,
  y = 0,
  z = 0,
  ry = 0,
  scale = 1,
  skin = '#e7b48f',
  hair = '#3b2b23',
  robe = '#6d5f86',
  accent = '#d9c7a5',
  trousers = '#4b423a',
  boots = '#332b26',
  longRobe = false,
  child = false,
  hat = null,
  veil = null,
  beard = false,
  cloak = null,
  book = false,
  bag = false,
  staff = false,
  pendant = false,
  bun = false,
} = {}) {
  const s = (child ? 0.68 : 1) * scale;
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  g.scale.setScalar(s);

  const body = new THREE.Group();
  g.add(body);

  const skinMat = mat(skin, { roughness: 0.78 });
  const robeMat = mat(robe, { roughness: 0.96 });
  const accentMat = mat(accent);

  let legL = null;
  let legR = null;

  if (longRobe) {
    add(body, cylGeo(0.23, 0.4, 1.02, 8), robeMat, [0, 0.51, 0]);
    add(body, cylGeo(0.4, 0.42, 0.055, 8), accentMat, [0, 0.028, 0], [0, 0, 0], [1, 1, 1], false);
  } else {
    const legMat = mat(trousers);
    const bootMat = mat(boots);
    legL = new THREE.Group();
    legL.position.set(-0.108, 0.56, 0);
    body.add(legL);
    add(legL, boxGeo(0.15, 0.5, 0.17), legMat, [0, -0.25, 0]);
    add(legL, boxGeo(0.17, 0.12, 0.26), bootMat, [0, -0.5, 0.04]);

    legR = new THREE.Group();
    legR.position.set(0.108, 0.56, 0);
    body.add(legR);
    add(legR, boxGeo(0.15, 0.5, 0.17), legMat, [0, -0.25, 0]);
    add(legR, boxGeo(0.17, 0.12, 0.26), bootMat, [0, -0.5, 0.04]);
  }

  add(body, cylGeo(0.2, 0.27, 0.74, 7), robeMat, [0, 0.93, 0]);
  add(body, cylGeo(0.245, 0.255, 0.075, 7), mat(accent, { roughness: 0.9 }), [0, 0.79, 0], [0, 0, 0], [1, 1, 1], false);

  if (cloak) {
    const cape = add(
      body,
      new THREE.CylinderGeometry(0.3, 0.55, 1.25, 9, 1, true, 0.65, TAU - 1.3),
      mat(cloak, { side: THREE.DoubleSide }),
      [0, 0.78, -0.02],
      [0, 0, 0],
      [1, 1, 1],
      true
    );
    cape.rotation.y = Math.PI;
  }

  add(body, cylGeo(0.09, 0.1, 0.12, 6), skinMat, [0, 1.34, 0], [0, 0, 0], [1, 1, 1], false);

  const head = new THREE.Group();
  head.position.set(0, 1.46, 0);
  head.scale.setScalar(child ? 1.18 : 1);
  body.add(head);

  const skull = add(head, icoGeo(0.205, 1), skinMat, [0, 0.1, 0], [0, 0, 0], [0.95, 1.06, 0.97]);
  skull.castShadow = true;

  add(head, coneGeo(0.028, 0.075, 5), mat(skin, { roughness: 0.78 }), [0, 0.085, 0.2], [Math.PI / 2, 0, 0], [1, 1, 1], false);

  const eyeMat = mat('#241f1d', { roughness: 0.4 });
  add(head, sphereGeo(0.024, 6, 5), eyeMat, [-0.072, 0.12, 0.178], [0, 0, 0], [1, 1, 1], false);
  add(head, sphereGeo(0.024, 6, 5), eyeMat, [0.072, 0.12, 0.178], [0, 0, 0], [1, 1, 1], false);
  add(head, boxGeo(0.062, 0.014, 0.012), mat(hair, { roughness: 1 }), [-0.072, 0.175, 0.185], [0, 0, 0.09], [1, 1, 1], false);
  add(head, boxGeo(0.062, 0.014, 0.012), mat(hair, { roughness: 1 }), [0.072, 0.175, 0.185], [0, 0, -0.09], [1, 1, 1], false);
  add(head, boxGeo(0.065, 0.012, 0.01), mat('#8a5b4c', { roughness: 1 }), [0, 0.012, 0.188], [0, 0, 0], [1, 1, 1], false);

  add(head, sphereGeo(0.045, 6, 5), skinMat, [-0.196, 0.09, 0], [0, 0, 0], [0.6, 1, 1], false);
  add(head, sphereGeo(0.045, 6, 5), skinMat, [0.196, 0.09, 0], [0, 0, 0], [0.6, 1, 1], false);

  const hairMat = mat(hair, { roughness: 1 });
  const hairCap = add(
    head,
    new THREE.SphereGeometry(0.212, 9, 6, 0, TAU, 0, Math.PI * 0.56),
    hairMat,
    [0, 0.105, -0.005],
    [0.1, 0, 0]
  );
  hairCap.castShadow = false;

  if (bun) {
    add(head, sphereGeo(0.105, 7, 6), hairMat, [0, 0.02, -0.2], [0, 0, 0], [1, 1, 1], false);
  }

  if (beard) {
    const beardMesh = add(head, icoGeo(0.13, 0), hairMat, [0, -0.045, 0.1], [0.2, 0, 0], [1, 1.1, 0.75], false);
    beardMesh.castShadow = false;
  }

  if (veil) {
    const veilMat = mat(veil, { side: THREE.DoubleSide, roughness: 1 });
    const v = add(
      head,
      new THREE.CylinderGeometry(0.235, 0.43, 0.78, 10, 1, true, 0.52, TAU - 1.04),
      veilMat,
      [0, -0.16, -0.01]
    );
    v.castShadow = true;
    add(head, new THREE.TorusGeometry(0.215, 0.022, 4, 12), mat(accent), [0, 0.235, 0], [Math.PI / 2, 0, 0], [1, 1, 0.9], false);
  }

  if (hat === 'biretta') {
    add(head, cylGeo(0.24, 0.24, 0.035, 8), mat('#2c2420'), [0, 0.255, 0], [0, 0, 0], [1, 1, 1], false);
    add(head, cylGeo(0.19, 0.2, 0.14, 8), mat('#7d2f3a'), [0, 0.33, 0]);
  } else if (hat === 'merchant') {
    add(head, cylGeo(0.33, 0.33, 0.035, 10), mat('#2f2722'), [0, 0.25, 0], [0, 0, 0], [1, 1, 1], false);
    add(head, cylGeo(0.185, 0.2, 0.2, 8), mat('#3d302a'), [0, 0.35, 0]);
    add(head, cylGeo(0.202, 0.202, 0.04, 8), mat(accent), [0, 0.285, 0], [0, 0, 0], [1, 1, 1], false);
  } else if (hat === 'cap') {
    add(head, new THREE.SphereGeometry(0.215, 9, 5, 0, TAU, 0, Math.PI * 0.5), mat(robe), [0, 0.165, 0], [0, 0, 0], [1, 1, 1], false);
  }

  if (pendant) {
    add(body, boxGeo(0.035, 0.13, 0.02), mat('#c9a86a', { metalness: 0.4, roughness: 0.4 }), [0, 1.02, 0.245], [0, 0, 0], [1, 1, 1], false);
    add(body, boxGeo(0.1, 0.032, 0.02), mat('#c9a86a', { metalness: 0.4, roughness: 0.4 }), [0, 1.045, 0.245], [0, 0, 0], [1, 1, 1], false);
  }

  const sleeve = longRobe ? cylGeo(0.08, 0.115, 0.56, 6) : cylGeo(0.072, 0.098, 0.55, 6);
  const armL = new THREE.Group();
  armL.position.set(-0.265, 1.23, 0);
  body.add(armL);
  add(armL, sleeve, robeMat, [0, -0.28, 0]);
  add(armL, icoGeo(0.077, 0), skinMat, [0, -0.59, 0]);

  const armR = new THREE.Group();
  armR.position.set(0.265, 1.23, 0);
  body.add(armR);
  add(armR, sleeve, robeMat, [0, -0.28, 0]);
  add(armR, icoGeo(0.077, 0), skinMat, [0, -0.59, 0]);

  armL.rotation.z = 0.07;
  armR.rotation.z = -0.07;

  if (book) {
    const hand = new THREE.Group();
    hand.position.set(0, 0.86, 0.3);
    hand.rotation.x = -0.5;
    body.add(hand);
    add(hand, boxGeo(0.24, 0.04, 0.32), mat('#7a3f32'), [0, 0, 0], [0, 0, 0], [1, 1, 1], false);
    add(hand, boxGeo(0.215, 0.05, 0.29), mat('#efe2c8'), [0, 0.01, 0], [0, 0, 0], [1, 1, 1], false);
    armL.rotation.x = -0.75;
    armL.rotation.z = -0.28;
    armR.rotation.x = -0.75;
    armR.rotation.z = 0.28;
  }

  if (bag) {
    add(body, boxGeo(0.3, 0.26, 0.14), mat('#5a3f2c'), [0.24, 0.72, 0.06], [0, 0, -0.12]);
    add(body, cylGeo(0.02, 0.02, 0.5, 4), mat('#3c2a1e'), [0.22, 1.02, 0.06], [0, 0, 0.25], [1, 1, 1], false);
  }

  if (staff) {
    add(body, cylGeo(0.028, 0.032, 1.55, 5), mat('#6b4c33'), [-0.33, 0.78, 0.12], [0, 0, 0.03], [1, 1, 1], false);
    armR.rotation.x = -0.5;
  }

  return {
    group: g,
    body,
    head,
    armL,
    armR,
    legL,
    legR,
    height: 1.72 * s,
    scale: s,
  };
}

export function idlePose(fig, t, amount = 1) {
  const b = Math.sin(t * 1.7 + fig.group.position.x) * amount;
  fig.body.position.y = b * 0.008;
  fig.body.scale.y = 1 + b * 0.006;
  fig.head.rotation.y = Math.sin(t * 0.55 + fig.group.position.z) * 0.09 * amount;
  fig.head.rotation.z = Math.sin(t * 0.8) * 0.018 * amount;
}

export function walkPose(fig, phase, amount = 1) {
  // l'intensità del passo sale e scende in modo morbido: niente gambe che scattano
  const prev = fig._walk ?? 0;
  const a = prev + (amount - prev) * 0.14;
  fig._walk = a < 0.003 && amount === 0 ? 0 : a;

  if (fig._walk === 0) {
    if (fig._wasWalking) {
      if (fig.legL) fig.legL.rotation.x = 0;
      if (fig.legR) fig.legR.rotation.x = 0;
      fig.head.rotation.z = 0;
      fig._wasWalking = false;
    }
    return;
  }

  fig._wasWalking = true;
  const s = Math.sin(phase);
  if (fig.legL) fig.legL.rotation.x = s * 0.55 * fig._walk;
  if (fig.legR) fig.legR.rotation.x = -s * 0.55 * fig._walk;
  fig.body.position.y = Math.abs(Math.cos(phase)) * 0.05 * fig._walk;
  fig.armL.rotation.x = -s * 0.4 * fig._walk;
  fig.armR.rotation.x = s * 0.4 * fig._walk;
  fig.head.rotation.z = s * 0.025 * fig._walk;
}

export function raiseArm(fig, side, amount, outward = 0.35) {
  const arm = side === 'left' ? fig.armL : fig.armR;
  arm.rotation.z = (side === 'left' ? -1 : 1) * (outward + amount * 1.35);
  arm.rotation.x = -amount * 0.55;
}

export function pointWithArm(fig, side, amount = 1) {
  const arm = side === 'left' ? fig.armL : fig.armR;
  arm.rotation.x = -amount * 1.25;
  arm.rotation.z = (side === 'left' ? -1 : 1) * 0.18;
}
