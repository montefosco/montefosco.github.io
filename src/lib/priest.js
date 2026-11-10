import * as THREE from 'three';
import { add, mat, boxGeo, cylGeo, coneGeo, icoGeo, sphereGeo } from './lowpoly.js';
import { makeFigure } from './figures.js';

/**
 * Prete Geminiano, modello curato.
 * Mantiene la stessa interfaccia di makeFigure (group, body, head, armL, armR…),
 * quindi le scene possono animarlo come gli altri personaggi.
 *
 * vestment:
 *  - 'surplice' → talare nera + cotta bianca + stola (predica in chiesa)
 *  - 'cassock'  → talare nera con fascia viola e croce (all'aperto)
 */
export function makePriestModel({
  x = 0,
  y = 0,
  z = 0,
  ry = 0,
  vestment = 'surplice',
  hat = null,
  spectacles = true,
} = {}) {
  const fig = makeFigure({
    x,
    y,
    z,
    ry,
    longRobe: true,
    robe: '#26242c',
    accent: '#c9a86a',
    skin: '#e3b08c',
    hair: '#b9b4ac',
    beard: true,
    hat,
    pendant: false,
  });

  const { body, head, armL, armR } = fig;
  const purple = mat('#6a2f66', { roughness: 0.85 });
  const gold = mat('#c9a86a', { metalness: 0.45, roughness: 0.4 });
  const white = mat('#efe9dc', { roughness: 1 });
  const lace = mat('#fbf6ea', { roughness: 1 });

  // colletto bianco da sacerdote
  add(body, cylGeo(0.108, 0.112, 0.045, 8), white, [0, 1.335, 0], [0, 0, 0], [1, 1, 1], false);

  if (vestment === 'surplice') {
    // cotta bianca, ampia, con bordo di pizzo
    add(body, cylGeo(0.29, 0.5, 0.96, 10), white, [0, 0.78, 0]);
    add(body, cylGeo(0.505, 0.51, 0.07, 10), lace, [0, 0.3, 0], [0, 0, 0], [1, 1, 1], false);
    add(body, cylGeo(0.497, 0.5, 0.025, 10), gold, [0, 0.345, 0], [0, 0, 0], [1, 1, 1], false);

    // maniche ampie della cotta (seguono il braccio)
    for (const arm of [armL, armR]) {
      add(arm, cylGeo(0.125, 0.175, 0.44, 7), white, [0, -0.25, 0]);
      add(arm, cylGeo(0.178, 0.18, 0.035, 7), lace, [0, -0.47, 0], [0, 0, 0], [1, 1, 1], false);
    }

    // stola viola con rifiniture dorate: collo + due lembi sul petto
    const collar = add(body, new THREE.TorusGeometry(0.2, 0.04, 4, 12), purple, [0, 1.27, 0], [Math.PI / 2, 0, 0], [1, 1, 0.8], false);
    collar.castShadow = false;
    for (const sx of [-1, 1]) {
      add(body, boxGeo(0.09, 0.86, 0.022), purple, [sx * 0.105, 0.82, 0.366], [-0.22, 0, 0], [1, 1, 1], false);
      add(body, boxGeo(0.1, 0.05, 0.028), gold, [sx * 0.105, 0.45, 0.44], [-0.22, 0, 0], [1, 1, 1], false);
      add(body, boxGeo(0.1, 0.05, 0.028), gold, [sx * 0.105, 1.18, 0.318], [-0.22, 0, 0], [1, 1, 1], false);
    }
    // croce pettorale
    add(body, boxGeo(0.03, 0.14, 0.02), gold, [0, 0.98, 0.395], [-0.22, 0, 0], [1, 1, 1], false);
    add(body, boxGeo(0.095, 0.03, 0.02), gold, [0, 1.01, 0.395], [-0.22, 0, 0], [1, 1, 1], false);
  } else {
    // talare con fascia viola, nappa e croce pettorale
    add(body, cylGeo(0.262, 0.272, 0.11, 9), purple, [0, 0.82, 0], [0, 0, 0], [1, 1, 1], false);
    add(body, boxGeo(0.06, 0.4, 0.04), purple, [0.2, 0.55, 0.2], [0, 0, 0.1], [1, 1, 1], false);
    add(body, boxGeo(0.075, 0.07, 0.05), gold, [0.205, 0.33, 0.2], [0, 0, 0.1], [1, 1, 1], false);
    add(body, boxGeo(0.03, 0.15, 0.02), gold, [0, 1.0, 0.255], [0, 0, 0], [1, 1, 1], false);
    add(body, boxGeo(0.1, 0.032, 0.02), gold, [0, 1.03, 0.255], [0, 0, 0], [1, 1, 1], false);
    // bottoni lungo la veste
    for (let i = 0; i < 5; i++) {
      add(body, sphereGeo(0.016, 5, 4), gold, [0, 1.15 - i * 0.14, 0.235 + i * 0.012], [0, 0, 0], [1, 1, 1], false);
    }
  }

  // testa: tonsura, sopracciglia folte, occhiali tondi, barba corta
  if (!hat) {
    add(head, cylGeo(0.095, 0.1, 0.03, 8), mat('#e3b08c', { roughness: 0.78 }), [0, 0.306, -0.005], [0, 0, 0], [1, 1, 1], false);
  }
  const brow = mat('#a29d95', { roughness: 1 });
  add(head, boxGeo(0.08, 0.02, 0.014), brow, [-0.072, 0.172, 0.188], [0, 0, 0.18], [1, 1, 1], false);
  add(head, boxGeo(0.08, 0.02, 0.014), brow, [0.072, 0.172, 0.188], [0, 0, -0.18], [1, 1, 1], false);

  if (spectacles) {
    const rim = mat('#3a3128', { metalness: 0.4, roughness: 0.5 });
    for (const sx of [-1, 1]) {
      add(head, new THREE.TorusGeometry(0.043, 0.0065, 4, 10), rim, [sx * 0.072, 0.12, 0.192], [0, 0, 0], [1, 1, 1], false);
    }
    add(head, boxGeo(0.034, 0.008, 0.008), rim, [0, 0.126, 0.195], [0, 0, 0], [1, 1, 1], false);
    add(head, boxGeo(0.008, 0.008, 0.19), rim, [-0.118, 0.126, 0.1], [0, 0, 0], [1, 1, 1], false);
    add(head, boxGeo(0.008, 0.008, 0.19), rim, [0.118, 0.126, 0.1], [0, 0, 0], [1, 1, 1], false);
  }

  // naso un po' più marcato
  add(head, coneGeo(0.032, 0.09, 5), mat('#dca682', { roughness: 0.78 }), [0, 0.07, 0.205], [Math.PI / 2, 0, 0], [1, 1, 1], false);

  // la biretta, se c'è, ha un piccolo pompon
  if (hat === 'biretta') {
    add(head, icoGeo(0.04, 0), mat('#7d2f3a'), [0, 0.43, 0], [0, 0, 0], [1, 1, 1], false);
  }

  return fig;
}

/** leggio inclinato con libro aperto, da mettere davanti al prete */
export function makeLectern() {
  const g = new THREE.Group();
  const wood = '#6b4a30';
  add(g, boxGeo(0.62, 0.9, 0.46), mat(wood), [0, 0.45, 0]);
  add(g, boxGeo(0.7, 0.07, 0.56), mat('#80593a'), [0, 0.93, 0.0], [-0.32, 0, 0]);
  add(g, boxGeo(0.46, 0.05, 0.34), mat('#efe3c6'), [0, 1.0, 0.0], [-0.32, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(0.02, 0.055, 0.34), mat('#7d5a3a'), [0, 1.003, 0.0], [-0.32, 0, 0], [1, 1, 1], false);
  // piccola croce sul davanti
  add(g, boxGeo(0.04, 0.22, 0.03), mat('#c9a86a', { metalness: 0.4 }), [0, 0.5, 0.245], [0, 0, 0], [1, 1, 1], false);
  add(g, boxGeo(0.14, 0.04, 0.03), mat('#c9a86a', { metalness: 0.4 }), [0, 0.56, 0.245], [0, 0, 0], [1, 1, 1], false);
  return g;
}
