import * as THREE from 'three';
import {
  add,
  group,
  mat,
  rng,
  rr,
  pick,
  geoCache,
  boxGeo,
  cylGeo,
  coneGeo,
  icoGeo,
  sphereGeo,
  makeCypress,
  makeTree,
  makeBird,
  TAU,
} from './lowpoly.js';

/* ------------------------------------------------------------------ */
/* geometrie                                                           */
/* ------------------------------------------------------------------ */

function gableGeom(w, d, h) {
  const key = `g|${w.toFixed(3)}|${d.toFixed(3)}|${h.toFixed(3)}`;
  if (geoCache.has(key)) return geoCache.get(key);
  const hw = w / 2;
  const hd = d / 2;
  const positions = new Float32Array([
    -hw, 0, -hd, hw, 0, -hd, hw, 0, hd, -hw, 0, hd, 0, h, -hd, 0, h, hd,
  ]);
  const indices = [0, 4, 5, 0, 5, 3, 1, 2, 5, 1, 5, 4, 0, 1, 4, 3, 5, 2];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geoCache.set(key, geo);
  return geo;
}

function roofMaterial(color) {
  return mat(color, { side: THREE.DoubleSide });
}

/* ------------------------------------------------------------------ */
/* case                                                                */
/* ------------------------------------------------------------------ */

export function makeHouse({
  w = 3.4,
  d = 2.9,
  h = 3.2,
  wall = '#e8dcc6',
  roof = '#b25d45',
  trim = '#6b4e3a',
  stone = '#a9977e',
  seed = 1,
  lit = 0.4,
  floors = 2,
  timber = false,
} = {}) {
  const g = new THREE.Group();
  const r = rng(seed * 17 + 3);
  const plinth = 0.4;

  add(g, boxGeo(w + 0.22, plinth + 0.5, d + 0.22), mat(stone), [0, plinth / 2 - 0.25, 0]);
  add(g, boxGeo(w, h, d), mat(wall, { roughness: 1 }), [0, plinth + h / 2, 0]);

  const roofMesh = add(
    g,
    gableGeom(w * 1.14, d * 1.12, 1.2 + w * 0.06),
    roofMaterial(roof),
    [0, plinth + h + 0.02, 0]
  );
  roofMesh.castShadow = true;

  add(g, boxGeo(0.36, 1.1, 0.36), mat('#9a8066'), [w * 0.26, plinth + h + 0.85, d * 0.12]);
  add(g, boxGeo(0.44, 0.1, 0.44), mat('#7d6753'), [w * 0.26, plinth + h + 1.42, d * 0.12]);

  const frameMat = mat(trim, { roughness: 0.9 });
  const woodMat = mat('#4a3427', { roughness: 0.9 });
  const litMat = mat('#f6c988', { emissive: '#f0a955', emissiveIntensity: 1.15, roughness: 1 });
  const darkMat = mat('#2b2c31', { roughness: 0.35, metalness: 0.1 });

  // porta
  add(g, boxGeo(0.92, 1.45, 0.08), frameMat, [0, plinth + 0.72, d / 2 + 0.03], [0, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(0.68, 1.2, 0.1), woodMat, [0, plinth + 0.6, d / 2 + 0.06]);

  const windowRow = (faceZ, flip) => {
    for (let f = 0; f < floors; f++) {
      for (const sx of [-1, 1]) {
        const x = sx * w * 0.235;
        const y = plinth + 0.85 + f * (h / floors) * 0.82;
        if (y > plinth + h - 0.55) continue;
        // il telaio entra nel muro: il retro non tocca mai il piano della facciata
        add(g, boxGeo(0.58, 0.76, 0.06), frameMat, [x, y, faceZ - flip * 0.005], [0, 0, 0], [1, 1, 1], false);
        const isLit = lit > r();
        add(
          g,
          boxGeo(0.44, 0.6, 0.02),
          isLit ? litMat : darkMat,
          [x, y, faceZ + flip * 0.02],
          [0, 0, 0],
          [1, 1, 1],
          false
        );
        add(g, boxGeo(0.12, 0.64, 0.035), frameMat, [x - 0.36, y, faceZ + flip * 0.02], [0, 0, 0], [1, 1, 1], false);
        add(g, boxGeo(0.12, 0.64, 0.035), frameMat, [x + 0.36, y, faceZ + flip * 0.02], [0, 0, 0], [1, 1, 1], false);
      }
    }
  };

  windowRow(d / 2, 1);
  windowRow(-d / 2, -1);

  // finestre laterali
  for (const sx of [-1, 1]) {
    for (let f = 0; f < floors; f++) {
      const y = plinth + 0.9 + f * (h / floors) * 0.82;
      if (y > plinth + h - 0.55) continue;
      add(g, boxGeo(0.06, 0.66, 0.5), frameMat, [sx * (w / 2 + 0.02), y, -d * 0.1], [0, 0, 0], [1, 1, 1], false);
      add(
        g,
        boxGeo(0.03, 0.52, 0.38),
        lit > r() ? litMat : darkMat,
        [sx * (w / 2 + 0.05), y, -d * 0.1],
        [0, 0, 0],
        [1, 1, 1],
        false
      );
    }
  }

  if (timber) {
    add(g, boxGeo(w + 0.03, 0.11, 0.07), woodMat, [0, plinth + h * 0.52, d / 2 + 0.04], [0, 0, 0], [1, 1, 1], false);
    add(g, boxGeo(0.11, h, 0.07), woodMat, [-w * 0.3, plinth + h / 2, d / 2 + 0.04], [0, 0, 0], [1, 1, 1], false);
    add(g, boxGeo(0.11, h, 0.07), woodMat, [w * 0.3, plinth + h / 2, d / 2 + 0.04], [0, 0, 0], [1, 1, 1], false);
  }

  return g;
}

/* ------------------------------------------------------------------ */
/* chiesa                                                              */
/* ------------------------------------------------------------------ */

export function makeChurch() {
  const g = new THREE.Group();
  const stone = '#ded2bd';
  const stoneDark = '#c3b49c';
  const roof = '#8d4a3c';

  add(g, boxGeo(9.2, 0.34, 12), mat('#b6a68c'), [0, 0.17, 0]);

  // navata
  add(g, boxGeo(6.3, 4.9, 8.3), mat(stone, { roughness: 1 }), [0, 2.75, -0.7]);
  add(g, gableGeom(6.85, 8.8, 2.1), roofMaterial(roof), [0, 5.22, -0.7]);

  // facciata
  add(g, boxGeo(6.9, 7.3, 0.55), mat('#e6dac5'), [0, 3.8, 3.72]);
  add(g, gableGeom(6.9, 0.62, 1.55), roofMaterial(roof), [0, 7.44, 3.72]);
  add(g, boxGeo(0.18, 1.4, 0.7), mat(stoneDark), [0, 7.5, 3.98]);

  // portale: porta ad arco unica, incorniciata da stipiti e ghiera in pietra
  const doorShape = new THREE.Shape();
  doorShape.moveTo(-0.825, 0);
  doorShape.lineTo(-0.825, 2.7);
  doorShape.absarc(0, 2.7, 0.825, Math.PI, 0, true);
  doorShape.lineTo(0.825, 0);
  doorShape.closePath();
  const door = add(
    g,
    new THREE.ExtrudeGeometry(doorShape, { depth: 0.04, bevelEnabled: false, curveSegments: 10 }),
    mat('#3c2f24', { roughness: 0.95 }),
    [0, 0, 4.0],
    [0, 0, 0],
    [1, 1, 1],
    false
  );
  door.castShadow = false;
  for (const sx of [-1, 1]) {
    add(g, boxGeo(0.2, 2.72, 0.18), mat('#b7a68d'), [sx * 0.925, 1.36, 4.06], [0, 0, 0], [1, 1, 1], false);
  }
  const archRing = add(g, new THREE.TorusGeometry(0.925, 0.1, 4, 16, Math.PI), mat('#b7a68d'), [0, 2.7, 4.07], [0, 0, 0], [1, 1, 1], false);
  archRing.castShadow = false;
  add(g, boxGeo(0.28, 0.36, 0.2), mat('#d2c4ab'), [0, 3.46, 4.07], [0, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(2.3, 0.16, 0.5), mat(stoneDark), [0, 0.4, 4.2], [0, 0, 0], [1, 1, 1], false);

  // rosone: vetro e ghiera staccati dalla facciata, senza superfici complanari
  const rose = add(
    g,
    new THREE.CircleGeometry(0.92, 16),
    mat('#f4c27a', { emissive: '#e9a453', emissiveIntensity: 1.1, roughness: 1 }),
    [0, 5.5, 4.04],
    [0, 0, 0],
    [1, 1, 1],
    false
  );
  rose.castShadow = false;
  const ring = add(g, new THREE.TorusGeometry(0.95, 0.09, 4, 16), mat('#b7a68d'), [0, 5.5, 4.16], [0, 0, 0], [1, 1, 1], false);
  ring.castShadow = false;
  add(g, boxGeo(0.1, 1.8, 0.05), mat('#8d7a63'), [0, 5.5, 4.14], [0, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(1.8, 0.1, 0.05), mat('#8d7a63'), [0, 5.5, 4.14], [0, 0, 0], [1, 1, 1], false);

  // finestre laterali
  for (const sx of [-1, 1]) {
    for (const z of [-3.5, -1, 1.6]) {
      add(g, boxGeo(0.1, 1.6, 0.62), mat('#31404e', { emissive: '#3c5568', emissiveIntensity: 0.35, roughness: 0.6 }), [sx * 3.17, 3.1, z], [0, 0, 0], [1, 1, 1], false);
      add(g, boxGeo(0.07, 0.5, 0.7), mat(stoneDark), [sx * 3.2, 3.95, z], [0, 0, 0], [1, 1, 1], false);
    }
  }

  // abside
  add(g, cylGeo(2.5, 2.7, 4.9, 10), mat(stone), [0, 2.75, -5.0]);
  add(g, coneGeo(2.75, 1.9, 10), roofMaterial(roof), [0, 5.85, -5.0]);

  // campanile
  add(g, boxGeo(2.5, 10.2, 2.5), mat('#d6c8b1'), [3.75, 5.1, -3.1]);
  add(g, boxGeo(2.9, 0.4, 2.9), mat(stoneDark), [3.75, 10.25, -3.1]);
  for (const [dx, dz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) {
    add(g, boxGeo(0.26, 1.05, 0.26), mat('#c8b9a1'), [3.75 + dx, 9.5, -3.1 + dz]);
  }
  add(g, boxGeo(0.1, 1.2, 0.8), mat('#2f2a26'), [3.75, 9.45, -3.1 + 1.26], [0, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(0.8, 1.2, 0.1), mat('#2f2a26'), [3.75 + 1.26, 9.45, -3.1], [0, 0, 0], [1, 1, 1], false);
  add(g, coneGeo(2.1, 3.4, 4), roofMaterial('#7f4438'), [3.75, 12.1, -3.1], [0, Math.PI / 4, 0]);
  add(g, cylGeo(0.035, 0.035, 1.1, 4), mat('#3b3630'), [3.75, 14.1, -3.1], [0, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(0.5, 0.07, 0.07), mat('#3b3630'), [3.75, 14.3, -3.1], [0, 0, 0], [1, 1, 1], false);

  // campana
  const bellPivot = new THREE.Group();
  bellPivot.position.set(3.75, 10.1, -3.1);
  g.add(bellPivot);
  add(bellPivot, cylGeo(0.06, 0.06, 0.35, 4), mat('#5c4a34'), [0, -0.12, 0], [0, 0, 0], [1, 1, 1], false);
  add(bellPivot, coneGeo(0.3, 0.5, 8), mat('#b08b45', { metalness: 0.7, roughness: 0.35 }), [0, -0.55, 0], [Math.PI, 0, 0]);
  add(bellPivot, icoGeo(0.08, 0), mat('#6d5730'), [0, -0.85, 0], [0, 0, 0], [1, 1, 1], false);

  return { group: g, bellPivot };
}

/* ------------------------------------------------------------------ */
/* elementi del borgo                                                  */
/* ------------------------------------------------------------------ */

export function makeBanner({ color = '#b4503c', accent = '#e7d6b6' } = {}) {
  const g = new THREE.Group();
  add(g, cylGeo(0.045, 0.05, 2.6, 5), mat('#5a4231'), [0, 1.3, 0]);
  add(g, sphereGeo(0.07, 6, 5), mat('#c9a86a', { metalness: 0.4 }), [0, 2.62, 0], [0, 0, 0], [1, 1, 1], false);
  const cloth = add(g, boxGeo(0.74, 1.25, 0.04), mat(color, { side: THREE.DoubleSide }), [0.4, 1.72, 0]);
  add(g, boxGeo(0.74, 0.1, 0.05), mat(accent), [0.4, 2.3, 0.005], [0, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(0.16, 0.16, 0.05), mat(accent, { side: THREE.DoubleSide }), [0.4, 1.72, 0.03], [0, 0, Math.PI / 4], [1, 1, 1], false);
  g.userData.cloth = cloth;
  return g;
}

export function makeMarketStall({ colorA = '#e7d7ba', colorB = '#b3553f', goods = '#d98b3f' } = {}) {
  const g = new THREE.Group();
  const wood = mat('#6d5039');
  for (const [x, z] of [[-1.25, -0.72], [1.25, -0.72], [-1.25, 0.72], [1.25, 0.72]]) {
    add(g, cylGeo(0.05, 0.06, 2.4, 5), wood, [x, 1.2, z]);
  }
  add(g, boxGeo(2.7, 0.12, 1.35), mat('#8a674a'), [0, 0.82, 0]);
  add(g, boxGeo(2.6, 0.06, 0.12), mat('#cbb695'), [0, 0.13, 0.55], [0, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(2.6, 0.06, 0.12), mat('#cbb695'), [0, 0.13, -0.55], [0, 0, 0], [1, 1, 1], false);

  const slope = group(g, [0, 2.38, 0.62], [-0.26, 0, 0]);
  const backSlope = group(g, [0, 2.38, -0.62], [0.26, 0, 0]);
  for (let i = 0; i < 5; i++) {
    const x = -1.04 + i * 0.52;
    const c = i % 2 === 0 ? colorA : colorB;
    add(slope, boxGeo(0.52, 0.05, 1.34), mat(c, { side: THREE.DoubleSide }), [x, 0, 0], [0, 0, 0], [1, 1, 1], false);
    add(backSlope, boxGeo(0.52, 0.05, 1.34), mat(c, { side: THREE.DoubleSide }), [x, 0, 0], [0, 0, 0], [1, 1, 1], false);
  }

  const r = rng(Math.round((colorB.charCodeAt(1) + goods.charCodeAt(2)) * 7));
  for (let i = 0; i < 7; i++) {
    const x = -1 + i * 0.32;
    const z = rr(r, -0.34, 0.34);
    const kind = i % 3;
    if (kind === 0) {
      add(g, sphereGeo(0.12, 7, 6), mat(goods), [x, 0.95, z], [0, 0, 0], [1, 0.9, 1], false);
    } else if (kind === 1) {
      add(g, icoGeo(0.14, 0), mat('#c9a24f'), [x, 0.96, z], [0, 0, 0], [1, 0.8, 1], false);
    } else {
      add(g, cylGeo(0.1, 0.13, 0.2, 6), mat('#b9a06a'), [x, 0.97, z], [0, 0, 0], [1, 1, 1], false);
    }
  }
  add(g, boxGeo(0.7, 0.5, 0.6), mat('#7d5c3e'), [-1.9, 0.25, 0.3]);
  return g;
}

export function makeCart() {
  const g = new THREE.Group();
  add(g, boxGeo(2.8, 0.22, 1.5), mat('#7b5637'), [0, 0.8, 0]);
  for (const [x, z] of [[-1.2, -0.6], [1.2, -0.6], [-1.2, 0.6], [1.2, 0.6]]) {
    add(g, boxGeo(0.12, 0.66, 0.12), mat('#5d4029'), [x, 0.48, z]);
  }
  const wheels = [];
  for (const [x, z] of [[-1.42, 0.5], [1.42, 0.5], [-1.42, -0.5], [1.42, -0.5]]) {
    const w = add(g, cylGeo(0.46, 0.46, 0.12, 10), mat('#4c3524'), [x, 0.46, z], [0, 0, Math.PI / 2]);
    add(w, cylGeo(0.14, 0.14, 0.2, 6), mat('#8a674a'), [0, 0, 0], [0, 0, 0], [1, 1, 1], false);
    wheels.push(w);
  }
  add(g, boxGeo(2.3, 0.1, 0.1), mat('#5d4029'), [0, 0.95, 0.85], [0, 0, 0], [1, 1, 1], false);

  for (let i = 0; i < 3; i++) {
    add(g, boxGeo(0.62, 0.55, 0.62), mat(i % 2 ? '#8d6a47' : '#a07a52'), [-0.82 + i * 0.72, 1.17, -0.16]);
    add(g, boxGeo(0.64, 0.08, 0.64), mat('#6a4c33'), [-0.82 + i * 0.72, 1.47, -0.16], [0, 0, 0], [1, 1, 1], false);
  }
  add(g, icoGeo(0.55, 0), mat('#d6b56a'), [0.9, 1.35, 0.05], [0, 0, 0], [1.1, 0.8, 1], false);

  return { group: g, wheels };
}

export function makeBarrel(color = '#8a6747') {
  const g = new THREE.Group();
  add(g, cylGeo(0.36, 0.32, 0.85, 8), mat(color), [0, 0.425, 0]);
  add(g, new THREE.TorusGeometry(0.35, 0.045, 4, 10), mat('#4f4237'), [0, 0.62, 0], [Math.PI / 2, 0, 0], [1, 1, 1], false);
  add(g, new THREE.TorusGeometry(0.355, 0.045, 4, 10), mat('#4f4237'), [0, 0.25, 0], [Math.PI / 2, 0, 0], [1, 1, 1], false);
  return g;
}

export function makeCrate(size = 0.6) {
  const g = new THREE.Group();
  add(g, boxGeo(size, size, size), mat('#98724b'), [0, size / 2, 0]);
  add(g, boxGeo(size * 1.02, size * 0.1, size * 1.02), mat('#6d4f32'), [0, size * 0.24, 0], [0, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(size * 1.02, size * 0.1, size * 1.02), mat('#6d4f32'), [0, size * 0.76, 0], [0, 0, 0], [1, 1, 1], false);
  return g;
}

export function makeSack(color = '#c4ab7b') {
  const g = new THREE.Group();
  const bag = add(g, icoGeo(0.42, 1), mat(color), [0, 0.42, 0]);
  bag.scale.set(1, 1.15, 0.9);
  add(g, cylGeo(0.12, 0.16, 0.22, 6), mat('#8d774f'), [0, 0.86, 0], [0, 0, 0], [1, 1, 1], false);
  return g;
}

export function makeWell() {
  const g = new THREE.Group();
  add(g, cylGeo(1.15, 1.25, 0.9, 12), mat('#a99a83'), [0, 0.45, 0]);
  add(g, cylGeo(0.92, 0.92, 0.1, 12), mat('#2f4a52'), [0, 0.9, 0], [0, 0, 0], [1, 1, 1], false);
  for (const [x, z] of [[-0.95, 0], [0.95, 0]]) {
    add(g, boxGeo(0.14, 2.2, 0.14), mat('#6d5039'), [x, 1.55, 0]);
  }
  add(g, gableGeom(2.5, 1.5, 0.6), roofMaterial('#a9573f'), [0, 2.6, 0]);
  add(g, cylGeo(0.06, 0.06, 1.7, 5), mat('#5c4028'), [0, 2.4, 0], [0, 0, Math.PI / 2], [1, 1, 1], false);
  add(g, boxGeo(0.04, 0.9, 0.04), mat('#3f342a'), [0, 1.9, 0], [0, 0, 0], [1, 1, 1], false);
  return g;
}

/* ------------------------------------------------------------------ */
/* borgo                                                               */
/* ------------------------------------------------------------------ */

export function makeTown({ heightAt = () => 0, seed = 11, lit = 0.35, church = true, wall = true } = {}) {
  const g = new THREE.Group();
  const r = rng(seed);
  const h0 = heightAt(0, 0);

  // piazza e terrazza della chiesa
  add(g, cylGeo(7.6, 7.9, 0.55, 14), mat('#b8a88f'), [0, h0 + 0.18, -1.0]);

  let bellPivot = null;
  if (church) {
    const c = makeChurch();
    c.group.position.set(0, h0 + 0.47, -2.4);
    g.add(c.group);
    bellPivot = c.bellPivot;
  }

  // piazza del mercato
  const marketY = heightAt(0, 8.6) + 0.35;
  add(g, cylGeo(5.6, 5.9, 0.5, 12), mat('#b0a087'), [0, marketY - 0.12, 8.6]);

  const blocked = (x, z) => {
    if (Math.hypot(x, z + 2.4) < 6.0) return true;
    if (Math.hypot(x, z - 8.6) < 6.2) return true;
    if (Math.abs(x) < 2.4 && z > 8) return true;
    if (Math.hypot(x - 8.1, z - 2.2) < 4.6) return true;
    if (Math.hypot(x + 8.1, z - 2.2) < 4.6) return true;
    return false;
  };

  const houses = [];
  const walls = ['#e8dcc6', '#efe3cd', '#dccdb5', '#e6d3b8', '#d9c9b0', '#f0e5d2'];
  const roofs = ['#a9573f', '#b4624a', '#96503c', '#ad6247', '#8f4a39', '#b87052'];

  let tries = 0;
  while (houses.length < 22 && tries < 800) {
    tries++;
    const a = rr(r, 0, TAU);
    const rad = rr(r, 6.2, 13.6);
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad;
    if (blocked(x, z)) continue;
    if (houses.some((p) => Math.hypot(p.x - x, p.z - z) < 3.5)) continue;
    const w = rr(r, 2.6, 3.9);
    const d = rr(r, 2.4, 3.2);
    const h = rr(r, 2.6, 4.2);
    const house = makeHouse({
      w,
      d,
      h,
      wall: pick(r, walls),
      roof: pick(r, roofs),
      seed: Math.floor(rr(r, 1, 9999)),
      lit: lit,
      floors: r() > 0.5 ? 2 : 3,
      timber: r() > 0.55,
    });
    house.position.set(x, heightAt(x, z) - 0.18, z);
    house.rotation.y = Math.atan2(x, z) + rr(r, -0.28, 0.28);
    g.add(house);
    houses.push({ x, z, w, d });
  }

  // università e banca
  const uni = makeHouse({
    w: 5.2,
    d: 3.8,
    h: 4.6,
    wall: '#e7d6b8',
    roof: '#96503c',
    seed: 41,
    lit: lit,
    floors: 3,
    timber: true,
  });
  uni.position.set(-8.6, heightAt(-8.6, 2.2) - 0.2, 2.2);
  uni.rotation.y = Math.PI * 0.5;
  g.add(uni);
  const bannerU = makeBanner({ color: '#38506b', accent: '#e7d6b6' });
  bannerU.position.set(-10.4, heightAt(-10.4, 4.2) - 0.2, 4.2);
  g.add(bannerU);

  const bank = makeHouse({
    w: 4.6,
    d: 3.6,
    h: 4.0,
    wall: '#d7cbb5',
    roof: '#8f4a39',
    seed: 53,
    lit: lit,
    floors: 2,
    timber: false,
  });
  bank.position.set(8.6, heightAt(8.6, 2.2) - 0.2, 2.2);
  bank.rotation.y = -Math.PI * 0.5;
  g.add(bank);
  // insegna appoggiata davanti alla facciata (prima attraversava muro e finestre)
  add(bank, boxGeo(2.6, 1.9, 0.2), mat('#4d6173'), [0, 2.4, 1.95], [0, 0, 0], [1, 1, 1], false);

  // mercato
  const stalls = [
    [-3.1, 7.0, 0.35, '#e7d7ba', '#b3553f'],
    [3.0, 7.2, -0.4, '#e2d3b7', '#3d5a6b'],
    [-2.7, 10.0, -0.15, '#e7d7ba', '#b3553f'],
    [3.1, 10.2, 0.2, '#e2d3b7', '#6c7f4f'],
  ];
  for (const [x, z, rot, ca, cb] of stalls) {
    const s = makeMarketStall({ colorA: ca, colorB: cb, goods: pick(r, ['#d98b3f', '#b7452f', '#c9a24f']) });
    s.position.set(x, marketY + 0.12, z);
    s.rotation.y = rot;
    g.add(s);
  }
  const well = makeWell();
  well.position.set(0, marketY + 0.12, 8.7);
  well.scale.setScalar(0.8);
  g.add(well);

  for (const [x, z] of [[-4.7, 6.3], [4.8, 11.4], [-4.4, 11.2], [5.0, 6.2]]) {
    const b = makeBarrel();
    b.position.set(x, marketY + 0.1, z);
    g.add(b);
  }
  for (const [x, z, s] of [[5.4, 8.7, 0.6], [-5.6, 8.9, 0.5], [4.7, 9.9, 0.45]]) {
    const c = makeCrate(s);
    c.position.set(x, marketY + 0.1, z);
    c.rotation.y = rr(r, 0, 1);
    g.add(c);
  }

  // porta del borgo: corpo centrale, due torri accostate (senza compenetrazioni) e tetto tra le torri
  const gateY = heightAt(0, 14.4);
  const gate = new THREE.Group();
  const gateW = 4.6; // larghezza del passaggio
  const towerW = 1.4; // torri quadrate
  const towerX = gateW / 2 + towerW / 2; // le torri toccano il corpo centrale, non lo attraversano
  // fondazione: scende sotto il terreno, così il gate non galleggia sui pendii
  add(gate, boxGeo(towerX * 2 + towerW, 1.6, 2.4), mat('#b4a48a'), [0, -0.8, 0]);
  add(gate, boxGeo(gateW, 4.6, 2.2), mat('#cbbb9f'), [0, 2.3, 0]);
  add(gate, boxGeo(2.1, 2.7, 0.3), mat('#3c3229'), [0, 1.35, 1.08]);
  // arco scuro appena davanti alla facciata: niente piani coincidenti (z-fighting)
  add(gate, new THREE.CircleGeometry(1.05, 12, 0, Math.PI), mat('#3c3229'), [0, 2.7, 1.13], [0, 0, 0], [1, 1, 1], false);
  // tetto a due falde, con la base esattamente della larghezza del corpo centrale
  add(gate, gableGeom(gateW, 2.4, 1.1), roofMaterial('#a9573f'), [0, 4.6, 0]);
  for (const sx of [-1, 1]) {
    add(gate, boxGeo(towerW, 5.6, towerW), mat('#d3c2a6'), [sx * towerX, 2.8, 0]);
    // piramide a base quadrata: il raggio fa sì che la base coincida con la torre
    add(gate, coneGeo(towerW / (2 * Math.SQRT1_2), 1.3, 4), roofMaterial('#8f4a39'), [sx * towerX, 6.25, 0], [0, Math.PI / 4, 0]);
  }
  gate.position.set(0, gateY - 0.15, 14.4);
  g.add(gate);

  if (wall) {
    for (let a = 0; a < TAU; a += 0.26) {
      const x = Math.cos(a) * 15.4;
      const z = Math.sin(a) * 15.4;
      // lascia libero il passaggio del gate, fino alle torri
      if (Math.abs(x) < 5.0 && z > 11) continue;
      if (Math.hypot(x, z + 8) < 4) continue;
      const seg = new THREE.Group();
      seg.position.set(x, heightAt(x, z) + 0.55, z);
      seg.rotation.y = -a + Math.PI / 2;
      add(seg, boxGeo(2.1, 1.5, 0.6), mat('#b7a78d'));
      add(seg, boxGeo(2.15, 0.24, 0.78), mat('#9c8b74'), [0, 0.82, 0], [0, 0, 0], [1, 1, 1], false);
      g.add(seg);
    }
  }

  // cipressi e alberi
  const outer = [
    [-16.4, 4.5], [16.6, 5.4], [-13.2, -11.5], [12.8, -12.6], [-17.5, -2.5],
    [17.2, -3.4], [-6.4, 16.2], [7.2, 16.8], [-18.6, 10.5], [18.4, 11.2],
  ];
  for (const [x, z] of outer) {
    if (Math.hypot(x, z) > 18.4) continue;
    const t = makeCypress(rr(r, 3.2, 4.8));
    t.position.set(x, heightAt(x, z), z);
    t.rotation.y = rr(r, 0, TAU);
    g.add(t);
  }
  for (const [x, z] of [[-12.5, 7.2], [13.2, 7.8], [-11.8, -5.4], [10.4, -8.2]]) {
    const t = makeTree(rr(r, 2.2, 3));
    t.position.set(x, heightAt(x, z), z);
    g.add(t);
  }

  // uccelli
  const birds = [];
  for (let i = 0; i < 5; i++) {
    const b = makeBird('#3a3630');
    b.group.position.set(rr(r, -9, 9), rr(r, 9, 14), rr(r, -9, 9));
    b.group.scale.setScalar(rr(r, 0.7, 1.1));
    b.phase = rr(r, 0, TAU);
    b.rad = rr(r, 6, 12);
    b.speed = rr(r, 0.15, 0.3);
    b.height = rr(r, 9, 14);
    g.add(b.group);
    birds.push(b);
  }

  const update = (t) => {
    if (bellPivot) bellPivot.rotation.z = Math.sin(t * 1.6) * 0.16 * Math.max(0, Math.sin(t * 0.32));
    for (const b of birds) {
      b.update(t, 9);
      const a = b.phase + t * b.speed;
      b.group.position.set(Math.cos(a) * b.rad, b.height + Math.sin(t * 0.8 + b.phase) * 0.8, Math.sin(a) * b.rad);
      b.group.rotation.y = -a;
    }
  };

  return { group: g, update, bellPivot };
}

/* ------------------------------------------------------------------ */
/* mare, navi, molo                                                    */
/* ------------------------------------------------------------------ */

export function makeShip({ scale = 1, hull = '#5f4030', sail = '#f1e6cf', flag = '#b4453a', trim = '#8b6a48' } = {}) {
  const g = new THREE.Group();
  g.scale.setScalar(scale);

  const hullGeo = new THREE.SphereGeometry(1, 14, 9, 0, TAU, Math.PI / 2, Math.PI / 2);
  const hullMesh = add(g, hullGeo, mat(hull), [0, 0.55, 0], [0, 0, 0], [1.05, 1.25, 2.4]);
  hullMesh.castShadow = true;

  const deck = add(g, cylGeo(1, 1, 0.1, 14), mat('#9a7a54'), [0, 0.5, 0], [0, 0, 0], [1.03, 1, 2.36]);
  deck.castShadow = false;

  const railGeo = new THREE.TorusGeometry(1.03, 0.07, 4, 20);
  railGeo.rotateX(-Math.PI / 2);
  railGeo.scale(1.02, 1, 2.38);
  add(g, railGeo, mat(trim), [0, 0.66, 0], [0, 0, 0], [1, 1, 1], false);

  add(g, boxGeo(1.5, 0.85, 1.1), mat('#7a5b3d'), [0, 0.9, -1.7]);
  add(g, boxGeo(1.7, 0.12, 1.3), mat('#a17c51'), [0, 1.36, -1.7], [0, 0, 0], [1, 1, 1], false);

  add(g, cylGeo(0.09, 0.13, 4.8, 6), mat('#6b4a30'), [0, 2.9, 0.15]);
  add(g, cylGeo(0.05, 0.05, 2.9, 4), mat('#6b4a30'), [0, 4.0, 0.15], [0, 0, Math.PI / 2]);
  add(g, cylGeo(0.035, 0.035, 2.2, 4), mat('#6b4a30'), [0, 5.3, 0.1], [0, 0, Math.PI / 2]);
  add(g, cylGeo(0.055, 0.07, 1.9, 4), mat('#6b4a30'), [0, 0.9, 2.7], [Math.PI / 2.4, 0, 0]);

  const sailGeo = new THREE.PlaneGeometry(2.9, 2.6, 6, 4);
  const pos = sailGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setZ(i, Math.sin(((x + 1.45) / 2.9) * Math.PI) * 0.42 + Math.cos(((y + 1.3) / 2.6) * Math.PI) * 0.05);
  }
  sailGeo.computeVertexNormals();
  const sailMesh = add(g, sailGeo, mat(sail, { side: THREE.DoubleSide, roughness: 0.95 }), [0, 2.9, 0.2]);
  sailMesh.castShadow = true;

  const smallSail = add(g, new THREE.PlaneGeometry(1.8, 1.3, 4, 3), mat(sail, { side: THREE.DoubleSide }), [0, 4.55, 0.32]);
  smallSail.castShadow = false;

  const flagGroup = new THREE.Group();
  flagGroup.position.set(0, 5.35, 0.1);
  g.add(flagGroup);
  const flagMesh = add(flagGroup, new THREE.PlaneGeometry(0.9, 0.45, 5, 1), mat(flag, { side: THREE.DoubleSide }), [0.45, 0, 0]);
  flagMesh.castShadow = false;
  const baseFlag = flagMesh.geometry.attributes.position.array.slice();

  g.userData.update = (t) => {
    const p = flagMesh.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = baseFlag[i * 3];
      p.setZ(i, Math.sin(x * 5 - t * 4) * 0.09 * (x + 0.45));
    }
    p.needsUpdate = true;
  };

  return g;
}

export function makeRowBoat({ scale = 1, color = '#6b4a33' } = {}) {
  const g = new THREE.Group();
  g.scale.setScalar(scale);
  const hullGeo = new THREE.SphereGeometry(1, 10, 6, 0, TAU, Math.PI / 2, Math.PI / 2);
  add(g, hullGeo, mat(color), [0, 0.32, 0], [0, 0, 0], [0.85, 0.75, 1.9]);
  add(g, cylGeo(0.82, 0.82, 0.06, 10), mat('#a07a4f'), [0, 0.32, 0], [0, 0, 0], [1, 1, 2.2]);
  for (const z of [-0.7, 0.7]) {
    add(g, boxGeo(1.5, 0.08, 0.3), mat('#8a674a'), [0, 0.36, z], [0, 0, 0], [1, 1, 1], false);
  }
  add(g, cylGeo(0.04, 0.04, 2.3, 4), mat('#5e4129'), [0, 1.15, 0.2], [0, 0, 0.5]);
  return g;
}

export function makeDock({ length = 9, width = 3, y = 0.5 } = {}) {
  const g = new THREE.Group();
  const plankMat = mat('#9b7a52');
  for (let i = 0; i < length; i += 0.62) {
    add(g, boxGeo(width, 0.12, 0.56), plankMat, [0, y, -length / 2 + i], [0, 0, 0], [1, 1, 1], false);
  }
  for (const x of [-width / 2 + 0.2, width / 2 - 0.2]) {
    for (let i = 0; i < 4; i++) {
      add(g, cylGeo(0.13, 0.15, y + 1.4, 6), mat('#6b4e35'), [x, (y - 1.4) / 2, -length / 2 + 2 + i * 2.4]);
    }
  }
  add(g, boxGeo(0.16, 0.3, length), mat('#5f452f'), [width / 2 - 0.1, y + 0.22, 0], [0, 0, 0], [1, 1, 1], false);
  return g;
}

/* ------------------------------------------------------------------ */
/* interni                                                             */
/* ------------------------------------------------------------------ */

export function makeRoom({
  w = 13,
  d = 10,
  h = 5.6,
  floorColor = '#8a6a48',
  wallColor = '#e7d9c2',
  wood = '#6a4a33',
  windowColor = '#f6d9a2',
  windowEmissive = '#e7a85c',
  windowIntensity = 0.95,
} = {}) {
  const g = new THREE.Group();
  const wallMat = mat(wallColor, { roughness: 1 });
  const woodMat = mat(wood);

  add(g, boxGeo(w, 0.5, d), mat(floorColor), [0, -0.25, 0]);
  for (let i = -w / 2 + 0.6; i < w / 2; i += 1.2) {
    add(g, boxGeo(0.06, 0.02, d), mat('#6f5238'), [i, 0.005, 0], [0, 0, 0], [1, 1, 1], false);
  }
  add(g, boxGeo(w, h, 0.4), wallMat, [0, h / 2, -d / 2]);
  add(g, boxGeo(0.4, h, d), wallMat, [-w / 2, h / 2, 0]);

  for (let i = -w / 2 + 2; i < w / 2; i += 4.2) {
    add(g, boxGeo(0.34, h, 0.34), woodMat, [i, h / 2, -d / 2 + 0.35]);
  }
  add(g, boxGeo(w, 0.34, 0.34), woodMat, [0, h - 0.2, -d / 2 + 0.35]);
  add(g, boxGeo(w, 0.26, 0.26), woodMat, [0, 2.6, -d / 2 + 0.3], [0, 0, 0], [1, 1, 1], false);

  // finestra
  add(g, boxGeo(2.6, 2.2, 0.14), mat('#b09b7d'), [-w * 0.22, 3.5, -d / 2 + 0.22], [0, 0, 0], [1, 1, 1], false);
  add(
    g,
    boxGeo(2.2, 1.85, 0.06),
    mat(windowColor, { emissive: windowEmissive, emissiveIntensity: windowIntensity, roughness: 1 }),
    [-w * 0.22, 3.5, -d / 2 + 0.3],
    [0, 0, 0],
    [1, 1, 1],
    false
  );
  add(g, boxGeo(0.09, 1.85, 0.08), mat('#7a5f42'), [-w * 0.22, 3.5, -d / 2 + 0.34], [0, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(2.2, 0.09, 0.08), mat('#7a5f42'), [-w * 0.22, 3.5, -d / 2 + 0.34], [0, 0, 0], [1, 1, 1], false);

  return g;
}

export function makeBed({ w = 2.2, color = '#b5674f' } = {}) {
  const g = new THREE.Group();
  add(g, boxGeo(w, 0.55, 1.25), mat('#6d4e34'), [0, 0.42, 0]);
  add(g, boxGeo(w - 0.16, 0.26, 1.1), mat('#efe0c4'), [0, 0.83, 0]);
  add(g, boxGeo(w - 0.2, 0.14, 0.8), mat(color), [0, 1.02, 0.18]);
  add(g, boxGeo(0.62, 0.16, 0.34), mat('#f6ecd8'), [-w / 2 + 0.5, 1.06, -0.38]);
  add(g, boxGeo(w + 0.1, 1.3, 0.14), mat('#7d5a3c'), [0, 0.65, -0.68]);
  return g;
}

export function makeChair() {
  const g = new THREE.Group();
  add(g, boxGeo(0.62, 0.1, 0.6), mat('#7b5b3e'), [0, 0.52, 0]);
  add(g, boxGeo(0.62, 0.75, 0.1), mat('#7b5b3e'), [0, 0.9, -0.26]);
  for (const [x, z] of [[-0.24, -0.22], [0.24, -0.22], [-0.24, 0.22], [0.24, 0.22]]) {
    add(g, boxGeo(0.08, 0.52, 0.08), mat('#5d432d'), [x, 0.26, z]);
  }
  return g;
}

export function makeTable({ w = 2.6, d = 1.4, h = 0.95, color = '#7a5838' } = {}) {
  const g = new THREE.Group();
  add(g, boxGeo(w, 0.12, d), mat(color), [0, h, 0]);
  for (const [x, z] of [[-w / 2 + 0.16, -d / 2 + 0.16], [w / 2 - 0.16, -d / 2 + 0.16], [-w / 2 + 0.16, d / 2 - 0.16], [w / 2 - 0.16, d / 2 - 0.16]]) {
    add(g, boxGeo(0.12, h, 0.12), mat('#5d432d'), [x, h / 2, z]);
  }
  return g;
}

export function makeShelf({ w = 2.4, h = 2.8, d = 0.5 } = {}) {
  const g = new THREE.Group();
  add(g, boxGeo(0.1, h, d), mat('#6a4a33'), [-w / 2, h / 2, 0]);
  add(g, boxGeo(0.1, h, d), mat('#6a4a33'), [w / 2, h / 2, 0]);
  const bookColors = ['#8d4a3c', '#3f5a6b', '#6c7f4f', '#b08a4f', '#7a4a62'];
  for (let s = 0; s < 3; s++) {
    const y = 0.5 + s * 0.8;
    add(g, boxGeo(w, 0.08, d), mat('#7d5a3c'), [0, y, 0]);
    let x = -w / 2 + 0.16;
    while (x < w / 2 - 0.3) {
      const bw = 0.1 + Math.random() * 0.06;
      const bh = 0.3 + Math.random() * 0.16;
      add(g, boxGeo(bw, bh, 0.3), mat(bookColors[Math.floor(Math.random() * bookColors.length)]), [x + bw / 2, y + bh / 2, 0.02], [0, 0, 0], [1, 1, 1], false);
      x += bw + 0.03;
    }
  }
  return g;
}

export function makeCandle() {
  const g = new THREE.Group();
  add(g, cylGeo(0.11, 0.13, 0.16, 7), mat('#8d7a5e', { metalness: 0.3 }), [0, 0.08, 0]);
  add(g, cylGeo(0.055, 0.065, 0.42, 6), mat('#f2e6cc'), [0, 0.37, 0]);
  const flame = add(
    g,
    coneGeo(0.055, 0.2, 5),
    mat('#ffd08a', { emissive: '#ffb45c', emissiveIntensity: 2.4, roughness: 1 }),
    [0, 0.68, 0],
    [0, 0, 0],
    [1, 1, 1],
    false
  );
  return { group: g, flame };
}

export function makeCross() {
  const g = new THREE.Group();
  add(g, boxGeo(0.1, 0.8, 0.08), mat('#5a4432'), [0, 0.4, 0]);
  add(g, boxGeo(0.46, 0.1, 0.08), mat('#5a4432'), [0, 0.58, 0]);
  add(g, boxGeo(0.14, 0.3, 0.1), mat('#c9a86a', { metalness: 0.3 }), [0, 0.4, 0.03], [0, 0, 0], [1, 1, 1], false);
  return g;
}

export function makePulpit() {
  const g = new THREE.Group();
  add(g, boxGeo(1.9, 2.4, 1.9), mat('#7a5638'), [0, 1.2, 0]);
  add(g, boxGeo(2.4, 0.2, 2.4), mat('#6a4a30'), [0, 2.4, 0]);
  add(g, boxGeo(0.12, 0.85, 0.12), mat('#6a4a30'), [-1.05, 2.9, -1.05]);
  add(g, boxGeo(0.12, 0.85, 0.12), mat('#6a4a30'), [1.05, 2.9, -1.05]);
  add(g, boxGeo(0.12, 0.85, 0.12), mat('#6a4a30'), [-1.05, 2.9, 1.05]);
  add(g, boxGeo(0.12, 0.85, 0.12), mat('#6a4a30'), [1.05, 2.9, 1.05]);
  add(g, boxGeo(2.5, 0.16, 2.5), mat('#8a623f'), [0, 3.4, 0]);
  add(g, boxGeo(2.2, 0.1, 2.2), mat('#5f4229'), [0, 2.5, 0], [0, 0, 0], [1, 1, 1], false);
  // scalini
  for (let i = 0; i < 4; i++) {
    add(g, boxGeo(1.0, 0.24, 0.5), mat('#8a6a4a'), [0, 0.12 + i * 0.24, 1.2 + (3 - i) * 0.45]);
  }
  return g;
}

export function makePew({ w = 4.2 } = {}) {
  const g = new THREE.Group();
  add(g, boxGeo(w, 0.14, 0.5), mat('#7d5838'), [0, 0.52, 0]);
  add(g, boxGeo(w, 0.85, 0.12), mat('#6d4a2f'), [0, 0.95, -0.32]);
  add(g, boxGeo(w, 0.12, 0.42), mat('#6d4a2f'), [0, 0.16, 0.15], [0, 0, 0], [1, 1, 1], false);
  for (const sx of [-1, 1]) {
    add(g, boxGeo(0.14, 1.35, 0.6), mat('#5d402a'), [sx * (w / 2 - 0.1), 0.68, -0.05]);
  }
  return g;
}

export function makeCoin(color = '#d5ac5a') {
  return new THREE.Mesh(
    cylGeo(0.11, 0.11, 0.025, 8),
    mat(color, { metalness: 0.75, roughness: 0.3, emissive: '#a5721f', emissiveIntensity: 0.25 })
  );
}
