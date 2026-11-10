import * as THREE from 'three';

/**
 * Simboli da fumetto per chi impreca (@#$%!?), in nero, senza bordo. È uno sprite sopra la testa.
 */
export function makeAngryEmote(size = 1.5) {
  const W = 512;
  const H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d');

  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineJoin = 'round';
  c.font = '900 150px "Arial Black", Impact, "Helvetica Neue", Arial, sans-serif';

  // ogni simbolo leggermente storto, come nei fumetti
  const glyphs = [
    ['@', 78, -0.18],
    ['#', 190, 0.12],
    ['$', 300, -0.1],
    ['%', 400, 0.16],
    ['!', 470, -0.08],
  ];
  c.save();
  c.translate(0, 132);
  for (const [ch, x, rot] of glyphs) {
    c.save();
    c.translate(x, 0);
    c.rotate(rot);
    c.fillStyle = '#0b0b0b';
    c.fillText(ch, 0, 0);
    c.restore();
  }
  c.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthTest: false, depthWrite: false, fog: false, toneMapped: false });
  const sprite = new THREE.Sprite(mat);
  sprite.center.set(0.5, 0.1);
  sprite.renderOrder = 20;
  sprite.visible = false;
  sprite.userData.set = (amount, t) => {
    const a = Math.min(1, Math.max(0, amount));
    mat.opacity = a;
    sprite.visible = a > 0.01;
    const pop = (0.75 + 0.25 * a) * (1 + Math.sin(t * 15) * 0.045 * a);
    sprite.scale.set(size * pop, (size * pop * H) / W, 1);
    mat.rotation = Math.sin(t * 12) * 0.07 * a;
  };
  return sprite;
}
