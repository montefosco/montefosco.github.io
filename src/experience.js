import * as THREE from 'three';
import { clamp } from './lib/lowpoly.js';
import { builders } from './scenes/index.js';

const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

export class Experience {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
    this.pixelRatio = this.maxPixelRatio;
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0b1020');
    this.scene.fog = new THREE.Fog('#131f33', 55, 195);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.3, 900);
    this.camera.position.set(32, 16, 44);

    this.hemi = new THREE.HemisphereLight('#a9c2ee', '#3b3428', 1);
    this.scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight('#ffd7a3', 2.2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.05;
    const sc = this.sun.shadow.camera;
    sc.left = -30;
    sc.right = 30;
    sc.top = 30;
    sc.bottom = -30;
    sc.near = 5;
    sc.far = 220;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    this.cache = new Map();
    this.current = null;
    this.clock = new THREE.Clock();
    this.t = 0;
    this.elapsed = 0;
    this.intro = 1;
    this.camT = 1;
    this.from = new THREE.Vector3();
    this.to = new THREE.Vector3();
    this.lookTo = new THREE.Vector3();
    this.look = new THREE.Vector3();
    this.fovFrom = 42;
    this.fovTo = 42;
    this.pointer = new THREE.Vector2();
    this.smoothPointer = new THREE.Vector2();
    this.running = false;
    this.failedUpdate = new Set();

    // meno movimento se il sistema lo chiede
    this.calm = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

    // controllo prestazioni: se i frame sono lenti scendiamo di risoluzione
    this.slowTime = 0;
    this.fastTime = 0;

    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    this.onVisibility = this.onVisibility.bind(this);
    this.onContextLost = this.onContextLost.bind(this);
    this.onContextRestored = this.onContextRestored.bind(this);

    window.addEventListener('resize', this.resize);
    window.addEventListener('orientationchange', this.resize);
    document.addEventListener('visibilitychange', this.onVisibility);
    canvas.addEventListener('webglcontextlost', this.onContextLost, false);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored, false);
    this.resize();
  }

  resize() {
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // su schermi stretti (telefono in verticale) allarghiamo un po' il campo visivo
    this.aspectBoost = w / h < 0.9 ? 1 + (0.9 - w / h) * 0.55 : 1;
    this.camera.updateProjectionMatrix();
  }

  onVisibility() {
    // evita il salto di tempo quando si torna sulla scheda
    this.clock.getDelta();
  }

  onContextLost(e) {
    e.preventDefault();
    this.renderer.setAnimationLoop(null);
    this.running = false;
  }

  onContextRestored() {
    this.start();
  }

  setPointer(x, y) {
    this.pointer.set(clamp(x, -1, 1), clamp(y, -1, 1));
  }

  getScene(name) {
    if (!this.cache.has(name)) {
      const build = builders[name];
      if (!build) return null;
      const built = build();
      if (!built) return null;
      built.group.name = name;
      this.cache.set(name, built);
    }
    return this.cache.get(name);
  }

  /** mostra un quadro; restituisce false se la scena non si è potuta costruire */
  show(name) {
    let built = null;
    try {
      built = this.getScene(name);
    } catch (err) {
      console.error(`Scena "${name}" non costruita`, err);
      return false;
    }
    if (!built) return false;

    if (this.current && this.current.group !== built.group) {
      this.scene.remove(this.current.group);
    }
    this.scene.add(built.group);
    this.current = built;

    const m = built.mood;
    this.scene.background.set(m.bg);
    this.scene.fog = new THREE.Fog(m.fog[0], m.fog[1], m.fog[2]);
    this.hemi.color.set(m.hemi[0]);
    this.hemi.groundColor.set(m.hemi[1]);
    this.hemi.intensity = m.hemi[2];
    this.sun.color.set(m.sun[0]);
    this.sun.intensity = m.sun[1];
    this.sun.position.set(m.sun[2][0], m.sun[2][1], m.sun[2][2]).normalize().multiplyScalar(85);
    this.sun.target.position.set(0, 0, 0);
    this.sun.target.updateMatrixWorld();

    const s = m.shadow || 30;
    const sc = this.sun.shadow.camera;
    if (sc.right !== s) {
      sc.left = -s;
      sc.right = s;
      sc.top = s;
      sc.bottom = -s;
      sc.updateProjectionMatrix();
    }

    this.renderer.toneMappingExposure = m.exposure || 1.05;

    // la camera parte appena più lontana e si avvicina piano piano
    this.to.set(built.camera.pos[0], built.camera.pos[1], built.camera.pos[2]);
    this.lookTo.set(built.camera.look[0], built.camera.look[1], built.camera.look[2]);
    const pull = this.calm ? 1.0 : 1.13;
    this.from.copy(this.to).sub(this.lookTo).multiplyScalar(pull).add(this.lookTo);
    this.from.y += this.calm ? 0 : 0.9;
    this.look.copy(this.lookTo);

    this.fovTo = built.camera.fov || 42;
    this.fovFrom = this.fovTo * (this.calm ? 1 : 1.04);
    this.camera.fov = this.fovFrom * this.aspectBoost;
    this.camera.position.copy(this.from);
    this.camera.lookAt(this.look);
    this.camera.updateProjectionMatrix();

    this.camT = 0;
    this.elapsed = 0;
    this.intro = 0;
    this.smoothPointer.set(0, 0);
    return true;
  }

  adaptQuality(dt) {
    if (dt > 0.034) {
      this.slowTime += dt;
      this.fastTime = 0;
    } else {
      this.fastTime += dt;
      this.slowTime = Math.max(0, this.slowTime - dt * 0.5);
    }
    if (this.slowTime > 2.2 && this.pixelRatio > 1) {
      this.pixelRatio = Math.max(1, this.pixelRatio - 0.25);
      this.renderer.setPixelRatio(this.pixelRatio);
      this.renderer.setSize(window.innerWidth, window.innerHeight, false);
      this.slowTime = 0;
    }
  }

  frame() {
    const raw = this.clock.getDelta();
    const dt = Math.min(0.05, raw);
    this.t += dt;
    this.adaptQuality(raw);

    // il puntatore segue in modo morbido, indipendente dagli fps
    const pk = 1 - Math.exp(-dt * 3.2);
    this.smoothPointer.lerp(this.pointer, pk);

    if (this.current) {
      this.elapsed += dt;
      this.intro = Math.min(1, this.intro + dt / 2.4);
      this.camT = Math.min(1, this.camT + dt / 2.2);
      const k = easeOutQuart(this.camT);
      const sway = this.calm ? 0.2 : 1;

      this.camera.position.lerpVectors(this.from, this.to, k);
      this.camera.position.x += (Math.sin(this.t * 0.16) * 0.38 + this.smoothPointer.x * 0.95) * sway;
      this.camera.position.y += (Math.sin(this.t * 0.21 + 1.2) * 0.22 - this.smoothPointer.y * 0.5) * sway;
      this.camera.position.z += Math.cos(this.t * 0.12) * 0.32 * sway;

      this.look.copy(this.lookTo);
      this.look.x += this.smoothPointer.x * 0.6 * sway;
      this.look.y -= this.smoothPointer.y * 0.3 * sway;
      this.camera.lookAt(this.look);

      const fov = (this.fovFrom + (this.fovTo - this.fovFrom) * k) * this.aspectBoost;
      if (Math.abs(this.camera.fov - fov) > 0.001) {
        this.camera.fov = fov;
        this.camera.updateProjectionMatrix();
      }

      if (this.current.update) {
        // un errore in una scena non deve bloccare tutto il rendering
        try {
          this.current.update(this.elapsed, this.intro, dt);
        } catch (err) {
          if (!this.failedUpdate.has(this.current)) {
            this.failedUpdate.add(this.current);
            console.error('Errore nell\'animazione della scena', err);
          }
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.clock.getDelta();
    this.renderer.setAnimationLoop(this.frame);
  }
}
