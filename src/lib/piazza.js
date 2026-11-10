import * as THREE from 'three';
import { makeIsland, islandBaseHeight, mat, boxGeo } from './lowpoly.js';

/* ------------------------------------------------------------------ */
/* piazze a sampietrino, complanari al terreno                         */
/* ------------------------------------------------------------------ */

/** quanto il selciato emerge dal livello della piazza (appena un gradino, nessuna sopraelevazione) */
export const PAVE_TOP = 0.06;

const TONES = ['#d3c5a8', '#c9b99b', '#dccfb4', '#bfae8f'];
const GROUT = '#8f8068';
const CURB = '#b3a384';

/**
 * Isola con la piazza incorporata nel terreno.
 * Dentro il raggio della piazza il suolo è piano (heightMod), quindi selciato, oggetti
 * e persone poggiano sullo stesso piano e nessun cespuglio può entrare nel selciato.
 * Restituisce l'isola, il livello del suolo della piazza e la quota del selciato.
 */
export function makePlazaIsland(islandOpts, plaza) {
  const { x: cx, z: cz, radius } = plaza;
  const baseHeight = islandBaseHeight(islandOpts);
  const level = baseHeight(cx, cz);

  // margine di sicurezza: copre tutti i triangoli del terreno che toccano il selciato
  const flat = radius + 1.6;
  const blend = 3.2;
  const heightMod = (x, z, hBase) => {
    const d = Math.hypot(x - cx, z - cz);
    const t = Math.min(1, Math.max(0, (d - flat) / blend));
    const s = t * t * (3 - 2 * t);
    return level * (1 - s) + hBase * s;
  };

  const island = makeIsland({
    rings: 14,
    sectors: 72,
    ...islandOpts,
    heightMod,
    tuftClear: (x, z) => Math.hypot(x - cx, z - cz) < radius + 1.8,
  });

  return { island, level, top: level + PAVE_TOP };
}

/**
 * Selciato a sampietrino: file concentriche di pietre rettangolari sfalsate
 * (come l'acciottolato di riferimento, ma in corsi regolari), su fuga scura
 * e fascia di bordo. Solo pavimentazione: nessuna fontana, lampione o arredo.
 */
export function addSampietrinoPlaza(parent, { x, z, radius, level, pitch = 0.3, gap = 0.035, arc = 0.25 }) {
  const g = new THREE.Group();
  const top = level + PAVE_TOP;

  // fuga: base scura sotto tutte le pietre
  const disc = new THREE.CircleGeometry(radius, 96);
  disc.rotateX(-Math.PI / 2);
  const grout = new THREE.Mesh(disc, mat(GROUT, { roughness: 1 }));
  grout.position.set(x, level + 0.03, z);
  grout.receiveShadow = true;
  g.add(grout);

  // pietre, raggruppate per tono in InstancedMesh
  const buckets = TONES.map(() => []);
  const dummy = new THREE.Object3D();
  const innerR = 0.5;
  const outerR = radius - 0.4;
  for (let k = 0; ; k++) {
    const r = innerR + k * pitch;
    if (r + pitch * 0.5 > outerR) break;
    const count = Math.max(10, Math.round((2 * Math.PI * r) / arc));
    const step = (2 * Math.PI) / count;
    const shift = (k % 2) * step * 0.5; // sfalsamento a mattoni tra una fila e l'altra
    for (let i = 0; i < count; i += 1) {
      const a = shift + i * step;
      // variazione di tono deterministica: prevalgono i toni in diagonale, qualche pietra più scura
      const noise = Math.abs(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1;
      const tone = noise < 0.2 ? 3 : (i + k * 2) % 3;

      dummy.position.set(x + Math.cos(a) * r, level + PAVE_TOP / 2, z + Math.sin(a) * r);
      dummy.rotation.set(0, Math.PI / 2 - a, 0); // asse Z radiale, asse X tangenziale
      dummy.scale.set(step * r - gap, PAVE_TOP, pitch - gap);
      dummy.updateMatrix();
      buckets[tone].push(dummy.matrix.clone());
    }
  }

  const unit = boxGeo(1, 1, 1);
  buckets.forEach((matrices, t) => {
    if (!matrices.length) return;
    const stones = new THREE.InstancedMesh(unit, mat(TONES[t], { roughness: 0.95 }), matrices.length);
    matrices.forEach((m, i) => stones.setMatrixAt(i, m));
    stones.instanceMatrix.needsUpdate = true;
    stones.castShadow = false;
    stones.receiveShadow = true;
    g.add(stones);
  });

  // fascia di bordo, complanare al selciato
  const curbGeo = new THREE.RingGeometry(radius - 0.4, radius, 96);
  curbGeo.rotateX(-Math.PI / 2);
  const curb = new THREE.Mesh(curbGeo, mat(CURB, { roughness: 0.95 }));
  curb.position.set(x, top, z);
  curb.receiveShadow = true;
  g.add(curb);

  parent.add(g);
  return g;
}
