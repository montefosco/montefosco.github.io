import * as THREE from 'three';

export const TAU = Math.PI * 2;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rr = (r, a, b) => a + (b - a) * r();
export const pick = (r, list) => list[Math.min(list.length - 1, Math.floor(r() * list.length))];

const materialCache = new Map();

export function mat(color, opts = {}) {
  const key = `${color}|${opts.roughness ?? ''}|${opts.metalness ?? ''}|${opts.emissive ?? ''}|${opts.emissiveIntensity ?? ''}|${opts.transparent ? 1 : 0}|${opts.opacity ?? ''}|${opts.side ?? ''}|${opts.depthWrite ?? ''}`;
  if (materialCache.has(key)) return materialCache.get(key);
  const m = new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: opts.roughness ?? 0.92,
    metalness: opts.metalness ?? 0,
    ...opts,
  });
  materialCache.set(key, m);
  return m;
}

export function glowMat(color, intensity = 1.4) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 1,
    flatShading: true,
  });
}

export const geoCache = new Map();

export function boxGeo(w, h, d) {
  const key = `b|${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}`;
  if (!geoCache.has(key)) geoCache.set(key, new THREE.BoxGeometry(w, h, d));
  return geoCache.get(key);
}

export function cylGeo(rt, rb, h, seg = 8) {
  const key = `c|${rt.toFixed(3)}|${rb.toFixed(3)}|${h.toFixed(3)}|${seg}`;
  if (!geoCache.has(key)) geoCache.set(key, new THREE.CylinderGeometry(rt, rb, h, seg));
  return geoCache.get(key);
}

export function coneGeo(r, h, seg = 6) {
  const key = `k|${r.toFixed(3)}|${h.toFixed(3)}|${seg}`;
  if (!geoCache.has(key)) geoCache.set(key, new THREE.ConeGeometry(r, h, seg));
  return geoCache.get(key);
}

export function icoGeo(r, detail = 0) {
  const key = `i|${r.toFixed(3)}|${detail}`;
  if (!geoCache.has(key)) geoCache.set(key, new THREE.IcosahedronGeometry(r, detail));
  return geoCache.get(key);
}

export function sphereGeo(r, w = 10, h = 8) {
  const key = `s|${r.toFixed(3)}|${w}|${h}`;
  if (!geoCache.has(key)) geoCache.set(key, new THREE.SphereGeometry(r, w, h));
  return geoCache.get(key);
}

export function add(parent, geometry, material, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1], cast = true) {
  const m = new THREE.Mesh(geometry, typeof material === 'string' || material.isMaterial ? (typeof material === 'string' ? mat(material) : material) : mat(material));
  m.position.set(pos[0], pos[1], pos[2]);
  m.rotation.set(rot[0], rot[1], rot[2]);
  m.scale.set(scale[0], scale[1], scale[2]);
  m.castShadow = cast;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

export function group(parent, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const g = new THREE.Group();
  g.position.set(pos[0], pos[1], pos[2]);
  g.rotation.set(rot[0], rot[1], rot[2]);
  if (parent) parent.add(g);
  return g;
}

/* ------------------------------------------------------------------ */
/* sky                                                                 */
/* ------------------------------------------------------------------ */

function gradientTexture(stops) {
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  for (const [at, color] of stops) grad.addColorStop(at, color);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 8, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function makeSky(stops, radius = 320) {
  const geometry = new THREE.SphereGeometry(radius, 28, 20);
  const material = new THREE.MeshBasicMaterial({
    map: gradientTexture(stops),
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = -10;
  return mesh;
}

export function makeStars(count = 420, radius = 250, color = '#dfe8ff') {
  const positions = new Float32Array(count * 3);
  const r = rng(99);
  for (let i = 0; i < count; i++) {
    const theta = r() * TAU;
    const y = 0.06 + r() * 0.94;
    const rad = Math.sqrt(1 - y * y);
    positions[i * 3] = Math.cos(theta) * rad * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = Math.sin(theta) * rad * radius;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color,
    size: 1.35,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    fog: false,
  });
  const points = new THREE.Points(geometry, material);
  points.update = (t) => {
    material.opacity = 0.72 + Math.sin(t * 0.8) * 0.12;
  };
  return points;
}

function glowSprite(color, size, opacity = 0.5) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,0.85)');
  grad.addColorStop(0.22, 'rgba(255,255,255,0.38)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.09)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tex,
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    })
  );
  sprite.scale.setScalar(size);
  return sprite;
}

export function makeSun(color = '#ffdfae', size = 12, position = [80, 60, -140]) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(size, 16, 12),
    new THREE.MeshBasicMaterial({ color, fog: false })
  );
  g.add(core);
  g.add(glowSprite(color, size * 5.5, 0.5));
  g.position.set(...position);
  return g;
}

export function makeMoon(size = 9, position = [70, 70, -150]) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(size, 1),
    new THREE.MeshBasicMaterial({ color: '#f2ecd8', fog: false })
  );
  g.add(core);
  g.add(glowSprite('#cfdcff', size * 4.5, 0.35));
  g.position.set(...position);
  return g;
}

export function makeCloud(position, scale = 1, color = '#ffffff') {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: 1,
    transparent: true,
    opacity: 0.92,
    fog: false,
  });
  const blocks = [
    [0, 0, 0, 5.2, 2.5, 3.6],
    [-4.2, -0.6, 0.4, 3.6, 1.9, 2.7],
    [4.4, -0.4, -0.3, 4.1, 2.1, 3.1],
    [1.2, 1.5, 0.2, 3.2, 2.0, 2.4],
  ];
  for (const [x, y, z, sx, sy, sz] of blocks) {
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), m);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    g.add(mesh);
  }
  g.position.set(...position);
  g.scale.setScalar(scale);
  return g;
}

/* ------------------------------------------------------------------ */
/* terrain                                                             */
/* ------------------------------------------------------------------ */

function discGeometry(radius, rings, sectors, yFunc) {
  const positions = [];
  const indices = [];
  positions.push(0, yFunc(0, 0), 0);
  for (let r = 1; r <= rings; r++) {
    const rad = radius * (r / rings);
    for (let s = 0; s < sectors; s++) {
      const a = (s / sectors) * TAU;
      const x = Math.cos(a) * rad;
      const z = Math.sin(a) * rad;
      positions.push(x, yFunc(x, z), z);
    }
  }
  const idx = (r, s) => 1 + (r - 1) * sectors + (((s % sectors) + sectors) % sectors);
  for (let s = 0; s < sectors; s++) indices.push(0, idx(1, s + 1), idx(1, s));
  for (let r = 1; r < rings; r++) {
    for (let s = 0; s < sectors; s++) {
      const a = idx(r, s);
      const b = idx(r, s + 1);
      const c = idx(r + 1, s);
      const d = idx(r + 1, s + 1);
      indices.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/** altezza naturale dell'isola, senza modifiche: serve anche a livellare le piazze */
export function islandBaseHeight({ radius = 20, hill = 2.2, seed = 1 } = {}) {
  const wave = (x, z) =>
    0.5 * Math.sin(x * 0.42 + seed) * Math.cos(z * 0.34 - seed * 0.7) +
    0.28 * Math.sin((x + z) * 0.33 + seed * 2.1);

  return (x, z) => {
    const d = Math.min(1, Math.hypot(x, z) / radius);
    const fall = Math.pow(1 - d, 1.7);
    return hill * fall + wave(x, z) * 0.55 * fall;
  };
}

export function makeIsland({
  radius = 20,
  depth = 4.2,
  hill = 2.2,
  seed = 1,
  top = '#8b9e6a',
  topAlt = '#7d9161',
  soil = '#7b5e45',
  rock = '#584839',
  sectors = 40,
  rings = 6,
  float = true,
  tufts = true,
  tuftClear = null, // (x, z) => true se lì non devono crescere cespugli (es. dentro una piazza)
  heightMod = null, // (x, z, hBase) => nuova altezza: permette di scavare baie, alzare zone ecc.
  tint = null, // (x, z, h) => colore del terreno in quel punto (spiaggia, fondale…)
  selfShadow = true, // false evita le righe d'ombra sui prati visti di striscio
} = {}) {
  const g = new THREE.Group();
  const baseHeight = islandBaseHeight({ radius, hill, seed });
  const heightAt = heightMod ? (x, z) => heightMod(x, z, baseHeight(x, z)) : baseHeight;

  const terrainGeo = discGeometry(radius, rings, sectors, heightAt);
  if (tint) {
    const pos = terrainGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      c.set(tint(pos.getX(i), pos.getZ(i), pos.getY(i)) || top);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }
  const terrain = new THREE.Mesh(
    terrainGeo,
    new THREE.MeshStandardMaterial({
      color: tint ? '#ffffff' : top,
      vertexColors: !!tint,
      flatShading: true,
      roughness: 1,
      side: THREE.DoubleSide,
    })
  );
  terrain.receiveShadow = true;
  terrain.castShadow = selfShadow;
  g.add(terrain);

  const soilGeo = new THREE.CylinderGeometry(radius * 0.998, radius * 0.8, depth, sectors, 1, true);
  const soilMesh = new THREE.Mesh(soilGeo, mat(soil, { side: THREE.DoubleSide }));
  soilMesh.position.y = -depth / 2;
  soilMesh.castShadow = true;
  soilMesh.receiveShadow = true;
  g.add(soilMesh);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.992, 0.26, 4, sectors),
    mat(topAlt, { side: THREE.DoubleSide })
  );
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = -0.06;
  rim.castShadow = true;
  rim.receiveShadow = true;
  g.add(rim);

  if (float) {
    const h = depth * 1.9;
    const under = new THREE.Mesh(
      new THREE.ConeGeometry(radius * 0.8, h, 11, 1),
      mat(rock, { side: THREE.DoubleSide })
    );
    under.rotation.x = Math.PI;
    under.position.y = -depth - h / 2 + 0.05;
    under.castShadow = true;
    under.receiveShadow = true;
    g.add(under);

    const r = rng(seed * 13 + 5);
    for (let i = 0; i < 4; i++) {
      const a = rr(r, 0, TAU);
      const rad = rr(r, radius * 0.22, radius * 0.6);
      const chunk = new THREE.Mesh(
        new THREE.IcosahedronGeometry(rr(r, 1.1, 2.6), 0),
        mat(rock)
      );
      chunk.position.set(Math.cos(a) * rad, -depth - rr(r, 0.4, 3.2), Math.sin(a) * rad);
      chunk.rotation.set(rr(r, 0, TAU), rr(r, 0, TAU), rr(r, 0, TAU));
      chunk.scale.y = rr(r, 1.1, 2.2);
      chunk.castShadow = true;
      g.add(chunk);
    }
  }

  if (tufts) {
    const r = rng(seed * 31 + 7);
    for (let i = 0; i < 14; i++) {
      const a = rr(r, 0, TAU);
      const rad = rr(r, radius * 0.62, radius * 0.95);
      const x = Math.cos(a) * rad;
      const z = Math.sin(a) * rad;
      if (tuftClear && tuftClear(x, z)) continue;
      const bush = new THREE.Mesh(
        new THREE.IcosahedronGeometry(rr(r, 0.3, 0.62), 0),
        mat(pick(r, ['#6f8a54', '#7d975d', '#5f7a48']))
      );
      bush.position.set(x, heightAt(x, z) + 0.22, z);
      bush.scale.y = rr(r, 0.7, 1.1);
      bush.castShadow = true;
      g.add(bush);
    }
  }

  return { group: g, heightAt, radius };
}

export function makeSea({ radius = 150, y = 0, color = '#2c6476', rings = 18, sectors = 64, amp = 0.35 } = {}) {
  const geometry = discGeometry(radius, rings, sectors, () => 0);
  const positions = geometry.attributes.position;
  const base = [];
  for (let i = 0; i < positions.count; i++) {
    base.push({ x: positions.getX(i), z: positions.getZ(i) });
  }
  const material = new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: 0.25,
    metalness: 0.2,
    transparent: true,
    opacity: 0.96,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = y;
  mesh.receiveShadow = true;

  mesh.update = (t) => {
    for (let i = 0; i < positions.count; i++) {
      const { x, z } = base[i];
      const d = Math.hypot(x, z);
      const yy =
        Math.sin(d * 0.19 - t * 1.15) * amp * 0.7 +
        Math.sin(x * 0.11 + t * 0.7) * amp * 0.5 +
        Math.cos(z * 0.14 - t * 0.9) * amp * 0.4;
      positions.setY(i, yy * Math.min(1, d / 8));
    }
    positions.needsUpdate = true;
  };
  return mesh;
}

export function makeWater({ radius = 18, y = 0.3, color = '#2f6f86', rings = 9, sectors = 48, amp = 0.16, speed = 1 } = {}) {
  const geometry = discGeometry(radius, rings, sectors, () => 0);
  const positions = geometry.attributes.position;
  const base = [];
  for (let i = 0; i < positions.count; i++) base.push({ x: positions.getX(i), z: positions.getZ(i) });
  const material = new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: 0.22,
    metalness: 0.22,
    transparent: true,
    opacity: 0.94,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = y;
  mesh.receiveShadow = true;

  const deep = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 1.005, 36),
    mat('#1c4a5c', { metalness: 0.1, roughness: 0.5 })
  );
  deep.rotation.x = -Math.PI / 2;
  deep.position.y = y - 0.55;
  deep.receiveShadow = true;

  const g = new THREE.Group();
  g.add(deep);
  g.add(mesh);

  g.update = (t, boost = 0) => {
    for (let i = 0; i < positions.count; i++) {
      const { x, z } = base[i];
      const d = Math.hypot(x, z);
      const yy =
        Math.sin(d * 0.9 - t * 1.8 * speed) * amp * 0.7 +
        Math.sin(x * 0.6 + t * 1.1 * speed) * amp * 0.4 +
        Math.cos(z * 0.75 - t * 1.3 * speed) * amp * 0.35;
      positions.setY(i, yy * (1 + boost * 2.4));
    }
    positions.needsUpdate = true;
  };
  g.water = mesh;
  return g;
}

/* ------------------------------------------------------------------ */
/* vegetation                                                          */
/* ------------------------------------------------------------------ */

export function makeCypress(height = 4, color = '#3f5a3a') {
  const g = new THREE.Group();
  add(g, cylGeo(0.12, 0.16, height * 0.22, 5), '#5b4632', [0, height * 0.11, 0]);
  const layers = 3;
  for (let i = 0; i < layers; i++) {
    const t = i / layers;
    const h = height * (0.52 - t * 0.1);
    add(g, coneGeo(height * (0.15 - t * 0.035), h, 7), color, [0, height * (0.18 + t * 0.28) + h / 2, 0]);
  }
  return g;
}

export function makePine(height = 4, color = '#4a6b45') {
  const g = new THREE.Group();
  add(g, cylGeo(0.13, 0.2, height * 0.4, 5), '#5b4632', [0, height * 0.2, 0]);
  for (let i = 0; i < 3; i++) {
    const t = i / 3;
    const h = height * (0.34 - t * 0.06);
    add(g, coneGeo(height * (0.24 - t * 0.055), h, 7), color, [0, height * (0.35 + t * 0.19) + h / 2, 0]);
  }
  return g;
}

export function makeTree(height = 2.6, color = '#6d8a52') {
  const g = new THREE.Group();
  add(g, cylGeo(0.11, 0.16, height * 0.5, 5), '#5b4632', [0, height * 0.25, 0]);
  const crown = add(g, icoGeo(height * 0.33, 0), color, [0, height * 0.7, 0]);
  crown.scale.y = 1.15;
  return g;
}

export function makeBird(color = '#2b2a2c') {
  const g = new THREE.Group();
  const material = mat(color);
  add(g, icoGeo(0.14, 0), color, [0, 0, 0], [0, 0, 0], [1, 0.7, 1.8]);
  const wingL = new THREE.Group();
  wingL.position.set(-0.09, 0.05, 0);
  add(wingL, boxGeo(0.55, 0.035, 0.16), material, [-0.26, 0, 0]);
  const wingR = new THREE.Group();
  wingR.position.set(0.09, 0.05, 0);
  add(wingR, boxGeo(0.55, 0.035, 0.16), material, [0.26, 0, 0]);
  g.add(wingL, wingR);
  return {
    group: g,
    update(t, speed = 8) {
      const f = Math.sin(t * speed) * 0.55;
      wingL.rotation.z = f;
      wingR.rotation.z = -f;
    },
  };
}

export function makeSmokePuffs(count = 3, color = '#e9e4da') {
  const puffs = [];
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.32, 0),
      new THREE.MeshStandardMaterial({
        color,
        flatShading: true,
        roughness: 1,
        transparent: true,
        opacity: 0.22,
      })
    );
    puffs.push(mesh);
  }
  return puffs;
}
