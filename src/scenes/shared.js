import * as THREE from 'three';
import { add, mat, boxGeo, cylGeo, icoGeo, TAU, rng, rr } from '../lib/lowpoly.js';

/** basamento roccioso per i diorami interni */
export function makeBase({ w = 15, d = 12, rock = '#45362a', rim = '#7c6a54' } = {}) {
  const g = new THREE.Group();

  add(g, boxGeo(w + 1.1, 0.9, d + 1.1), mat(rim), [0, -0.75, 0]);

  const cone = new THREE.Mesh(new THREE.ConeGeometry(Math.min(w, d) * 0.56, 7.4, 9, 1), mat(rock));
  cone.rotation.x = Math.PI;
  cone.position.y = -4.85;
  cone.castShadow = true;
  cone.receiveShadow = true;
  g.add(cone);

  const r = rng(w * 7 + d);
  for (let i = 0; i < 3; i++) {
    const chunk = new THREE.Mesh(icoGeo(rr(r, 0.6, 1.5), 0), mat(rock));
    chunk.position.set(rr(r, -w * 0.28, w * 0.28), -rr(r, 2.4, 5.6), rr(r, -d * 0.3, d * 0.3));
    chunk.rotation.set(rr(r, 0, TAU), rr(r, 0, TAU), rr(r, 0, TAU));
    chunk.castShadow = true;
    g.add(chunk);
  }

  return g;
}

/** pulviscolo luminoso sospeso */
export function makeMotes({ count = 44, spread = [9, 4.5, 5], center = [0, 2.6, 0], color = '#ffe6b8', size = 0.075, opacity = 0.6 } = {}) {
  const positions = new Float32Array(count * 3);
  const seeds = [];
  const r = rng(count * 13 + 7);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = rr(r, -spread[0] / 2, spread[0] / 2);
    positions[i * 3 + 1] = rr(r, -spread[1] / 2, spread[1] / 2);
    positions[i * 3 + 2] = rr(r, -spread[2] / 2, spread[2] / 2);
    seeds.push({ phase: rr(r, 0, TAU), speed: rr(r, 0.12, 0.4), amp: rr(r, 0.15, 0.6) });
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.position.set(center[0], center[1], center[2]);
  points.userData.update = (t) => {
    const arr = geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      arr[i * 3] += Math.sin(t * seeds[i].speed + seeds[i].phase) * 0.0022;
      arr[i * 3 + 1] += Math.sin(t * seeds[i].speed * 0.7 + seeds[i].phase) * 0.0018;
    }
    geometry.attributes.position.needsUpdate = true;
  };
  return points;
}

/** raggio di luce volumetrico finto */
export function makeShaft({ w = 4, h = 9, color = '#ffd9a0', opacity = 0.09 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 160);
  grad.addColorStop(0, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.32)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 160);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({
    map: tex,
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  mesh.renderOrder = 3;
  return mesh;
}

export function smoothstep(u) {
  const x = Math.min(1, Math.max(0, u));
  return x * x * (3 - 2 * x);
}

/** impulso 0 → 1 → 0, usato per le azioni ritmiche delle scene */
export function pulse(t, period, rise = 0.16, hold = 0.4) {
  const u = (((t % period) + period) % period) / period;
  if (u < rise) return u / rise;
  if (u < rise + hold) return 1;
  if (u < rise * 2 + hold) return 1 - (u - rise - hold) / rise;
  return 0;
}

export function walkTo(fig, from, to, u) {
  const k = smoothstep(u);
  const x = from[0] + (to[0] - from[0]) * k;
  const z = from[1] + (to[1] - from[1]) * k;
  fig.group.position.x = x;
  fig.group.position.z = z;
  if (to[0] !== from[0] || to[1] !== from[1]) {
    fig.group.rotation.y = Math.atan2(to[0] - from[0], to[1] - from[1]);
  }
  return k;
}

export function makeBundle(color = '#c2ab80') {
  const g = new THREE.Group();
  const sack = add(g, icoGeo(0.24, 1), mat(color), [0, 0.24, 0], [0, 0, 0], [1, 1.1, 0.85]);
  sack.scale.z = 0.85;
  add(g, cylGeo(0.07, 0.1, 0.14, 6), mat('#8a7248'), [0, 0.5, 0], [0, 0, 0], [1, 1, 1], false);
  add(g, cylGeo(0.02, 0.02, 1.25, 4), mat('#6d5136'), [0.32, 0.62, 0], [0, 0, 0.08], [1, 1, 1], false);
  return g;
}

export function makeChest({ w = 1.15, h = 0.7, color = '#6d4a2f' } = {}) {
  const g = new THREE.Group();
  add(g, boxGeo(w, h, w * 0.68), mat(color), [0, h / 2, 0]);
  add(g, boxGeo(w + 0.04, 0.1, w * 0.72), mat('#4f3522'), [0, h + 0.02, 0], [0, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(0.1, h, w * 0.74), mat('#3f3a33', { metalness: 0.55, roughness: 0.5 }), [-w * 0.28, h / 2, 0], [0, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(0.1, h, w * 0.74), mat('#3f3a33', { metalness: 0.55, roughness: 0.5 }), [w * 0.28, h / 2, 0], [0, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(0.18, 0.22, 0.08), mat('#caa35c', { metalness: 0.7, roughness: 0.35 }), [0, h * 0.72, w * 0.35], [0, 0, 0], [1, 1, 1], false);
  return g;
}

export function makeLedger() {
  const g = new THREE.Group();
  add(g, boxGeo(0.52, 0.03, 0.7), mat('#5d3f2c'), [0, 0.015, 0], [0, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(0.46, 0.05, 0.64), mat('#efe3c6'), [0.01, 0.05, 0], [0, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(0.05, 0.055, 0.64), mat('#6d5138'), [-0.24, 0.05, 0], [0, 0, 0], [1, 1, 1], false);
  for (let i = 0; i < 3; i++) {
    add(g, boxGeo(0.34, 0.006, 0.02), mat('#8d7a63'), [0.04, 0.08, -0.2 + i * 0.12], [0, 0, 0], [1, 1, 1], false);
  }
  return g;
}

export function makeToyHorse() {
  const g = new THREE.Group();
  add(g, boxGeo(0.34, 0.16, 0.13), mat('#b9734a'), [0, 0.2, 0]);
  add(g, boxGeo(0.12, 0.16, 0.12), mat('#c58455'), [0.18, 0.31, 0], [0, 0, -0.35]);
  add(g, boxGeo(0.07, 0.05, 0.09), mat('#8d5535'), [0.26, 0.4, 0], [0, 0, -0.35]);
  for (const [x, z] of [[-0.12, -0.05], [0.12, -0.05], [-0.12, 0.05], [0.12, 0.05]]) {
    add(g, cylGeo(0.022, 0.022, 0.16, 4), mat('#9c6239'), [x, 0.08, z], [0, 0, 0], [1, 1, 1], false);
  }
  add(g, boxGeo(0.06, 0.09, 0.04), mat('#7e4a2c'), [-0.19, 0.16, 0], [0, 0, 0.5], [1, 1, 1], false);
  return g;
}

/* ------------------------------------------------------------------ */
/* helper di movimento morbido                                         */
/* ------------------------------------------------------------------ */

/** interpolazione esponenziale (k = 0..1 per frame) */
export function damp(current, target, k = 0.1) {
  return current + (target - current) * k;
}

/** come damp, ma per angoli: sceglie sempre la rotazione più corta */
export function dampAngle(current, target, k = 0.1) {
  const diff = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + diff * k;
}

/** gesto morbido 0 → 1 → 0 (niente scatti al passaggio per lo zero) */
export function gesture(x) {
  return smoothstep(Math.max(0, Math.sin(x)));
}

/**
 * Porta con cerniera. open = 0 chiusa, 1 aperta (si apre verso l'interno
 * della stanza). La cerniera sta sul lato +z della porta.
 */
export function makeDoor({ w = 2.1, h = 2.6, color = '#7a3f3f', frame = '#463126', trim = '#c9a86a' } = {}) {
  const g = new THREE.Group();
  add(g, boxGeo(0.12, h + 0.3, w + 0.3), mat(frame), [-0.02, (h + 0.3) / 2, 0], [0, 0, 0], [1, 1, 1], false);

  const pivot = new THREE.Group();
  pivot.position.set(0.04, 0, w / 2);
  g.add(pivot);
  add(pivot, boxGeo(0.07, h, w), mat(color), [0, h / 2, -w / 2]);
  add(pivot, boxGeo(0.09, 0.09, w * 0.9), mat(trim, { metalness: 0.4 }), [0.02, h * 0.78, -w / 2], [0, 0, 0], [1, 1, 1], false);
  add(pivot, boxGeo(0.09, 0.09, w * 0.9), mat(trim, { metalness: 0.4 }), [0.02, h * 0.22, -w / 2], [0, 0, 0], [1, 1, 1], false);
  add(pivot, boxGeo(0.1, 0.1, 0.1), mat(trim, { metalness: 0.6 }), [0.06, h * 0.48, -w + 0.2], [0, 0, 0], [1, 1, 1], false);

  const door = {
    group: g,
    pivot,
    open: 0,
    setOpen(u) {
      door.open = u;
      pivot.rotation.y = -smoothstep(u) * 1.45;
    },
  };
  door.setOpen(0);
  return door;
}
