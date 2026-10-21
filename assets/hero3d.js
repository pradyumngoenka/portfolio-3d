import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const host = document.getElementById('hero3d');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
host.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
const baseCam = new THREE.Vector3(0.26, 1.24, 3.58);
const baseTgt = new THREE.Vector3(-0.02, 0.98, 0);
camera.position.copy(baseCam);

// ---- studio lighting ----
scene.add(new THREE.HemisphereLight(0xffd9b8, 0x84401f, 1.05));
const key = new THREE.DirectionalLight(0xfff0dd, 1.35);
key.position.set(1.8, 4.4, 2.2);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = -2.4; key.shadow.camera.right = 2.4;
key.shadow.camera.top = 3; key.shadow.camera.bottom = -0.5;
key.shadow.camera.far = 12; key.shadow.radius = 9; key.shadow.bias = -0.0004;
scene.add(key);
const rim = new THREE.DirectionalLight(0xffe4c8, 1.6); rim.position.set(-2.4, 2.7, -2.9); scene.add(rim);
const fill = new THREE.DirectionalLight(0xffc79a, 0.4); fill.position.set(-1.6, 1.6, 3.2); scene.add(fill);

// ---- studio floor: invisible shadow-catcher only ----
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 12),
  new THREE.ShadowMaterial({ opacity: 0.34, color: 0x3a1508 })
);
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

// ---- desk set (reel: light wood top, pale legs, dual monitors, keyboard, tower) ----
const desk = new THREE.Group();
const birch = new THREE.MeshStandardMaterial({ color: 0xd9b489, roughness: 0.55, metalness: 0.05 });
const paleMetal = new THREE.MeshStandardMaterial({ color: 0xcfc9c0, roughness: 0.4, metalness: 0.55 });
const darkMetal = new THREE.MeshStandardMaterial({ color: 0x221e1b, roughness: 0.45, metalness: 0.35 });
const top = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.032, 0.64, 3, 0.012), birch);
top.position.y = 0.745; top.castShadow = top.receiveShadow = true; desk.add(top);
[-0.62, 0.62].forEach(x => {
  const col = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, 0.05), paleMetal);
  col.position.set(x, 0.375, -0.02); col.castShadow = true; desk.add(col);
  const foot = new THREE.Mesh(new RoundedBoxGeometry(0.07, 0.025, 0.5, 2, 0.008), paleMetal);
  foot.position.set(x, 0.014, 0); foot.castShadow = true; desk.add(foot);
  const cross = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.4), paleMetal);
  cross.position.set(x, 0.71, -0.02); desk.add(cross);
});
function codeTexture(seed0) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 320;
  const g = c.getContext('2d');
  g.fillStyle = '#141720'; g.fillRect(0, 0, 512, 320);
  g.fillStyle = '#1d2230'; g.fillRect(0, 0, 512, 22);
  g.fillStyle = '#2a3040'; g.fillRect(0, 22, 46, 298);
  const cols = ['#e8a56b', '#9fd6a0', '#d9cfc0', '#c47b4a', '#8fb7d9', '#b48fd6'];
  let y = 40, seed = seed0;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  while (y < 308) {
    let x = 58 + (rnd() < .35 ? 24 + rnd() * 30 : 0);
    const n = 1 + Math.floor(rnd() * 3);
    for (let i = 0; i < n && x < 480; i++) {
      const w = 24 + rnd() * 85;
      g.fillStyle = cols[Math.floor(rnd() * cols.length)];
      g.fillRect(x, y - 9, Math.min(w, 494 - x), 8);
      x += Math.min(w, 494 - x) + 11;
    }
    y += 15.5;
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function makeMonitor(seed) {
  const m = new THREE.Group();
  const bez = new THREE.Mesh(new RoundedBoxGeometry(0.56, 0.345, 0.022, 2, 0.008), darkMetal);
  bez.castShadow = true; m.add(bez);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.53, 0.318),
    new THREE.MeshBasicMaterial({ map: codeTexture(seed) }));
  scr.position.z = 0.0125; m.add(scr);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.13, 0.03), darkMetal);
  neck.position.set(0, -0.23, -0.01); neck.castShadow = true; m.add(neck);
  const bs = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.014, 0.15, 2, 0.005), darkMetal);
  bs.position.set(0, -0.293, 0.01); bs.castShadow = true; m.add(bs);
  return m;
}
const monL = makeMonitor(11); monL.position.set(-0.31, 1.02, -0.17); monL.rotation.y = 0.24; monL.rotation.x = -0.04; desk.add(monL);
const monR = makeMonitor(47); monR.position.set(0.27, 1.02, -0.19); monR.rotation.y = -0.2; monR.rotation.x = -0.04; desk.add(monR);
// keyboard + mouse
const kb = new THREE.Mesh(new RoundedBoxGeometry(0.36, 0.016, 0.115, 2, 0.006), new THREE.MeshStandardMaterial({ color: 0x2c2724, roughness: 0.6 }));
kb.position.set(-0.02, 0.77, 0.1); kb.castShadow = true; desk.add(kb);
const mouse = new THREE.Mesh(new RoundedBoxGeometry(0.055, 0.025, 0.09, 2, 0.012), new THREE.MeshStandardMaterial({ color: 0x2c2724, roughness: 0.55 }));
mouse.position.set(0.28, 0.775, 0.1); mouse.castShadow = true; desk.add(mouse);
// notebook + mug
const nb = new THREE.Mesh(new RoundedBoxGeometry(0.15, 0.012, 0.2, 2, 0.004), new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.8 }));
nb.position.set(-0.6, 0.767, 0.08); nb.rotation.y = 0.15; nb.castShadow = true; desk.add(nb);
const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.03, 0.085, 14), new THREE.MeshStandardMaterial({ color: 0xefe6d8, roughness: 0.4 }));
mug.position.set(0.6, 0.804, 0.05); mug.castShadow = true; desk.add(mug);
// PC tower under desk, warm LED
const tower = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.4, 0.38, 2, 0.01), new THREE.MeshStandardMaterial({ color: 0x241f1c, roughness: 0.5, metalness: 0.2 }));
tower.position.set(-0.5, 0.2, -0.02); tower.castShadow = true; desk.add(tower);
const led = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.3, 0.012), new THREE.MeshBasicMaterial({ color: 0xff8a3d }));
led.position.set(-0.405, 0.2, 0.1); desk.add(led);
desk.position.set(-0.52, 0, -0.22);
scene.add(desk);

// ---- avatar ----
let mixer, clips = {}, avatar, cur;
const clock = new THREE.Clock();
function play(name, fade = 0.25) {
  const next = clips[name]; if (!next || cur === next) return;
  next.reset(); next.setLoop(THREE.LoopRepeat); next.play();
  if (cur) { next.crossFadeFrom(cur, fade, false); }
  cur = next;
}
new GLTFLoader().load('assets/avatar_rigged.glb', (g) => {
  avatar = g.scene;
  avatar.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = true; } });
  scene.add(avatar);
  mixer = new THREE.AnimationMixer(avatar);
  g.animations.forEach(c => clips[c.name] = mixer.clipAction(c));
  avatar.position.x = 1.9;
  play('walk', 0);
  const t0 = performance.now();
  (function walkIn() {
    const k = Math.min(1, (performance.now() - t0) / 2100);
    avatar.position.x = 1.9 + (0.44 - 1.9) * (1 - Math.pow(1 - k, 3));
    if (k < 1) requestAnimationFrame(walkIn); else play('idle');
  })();
  window.__heroReady = true;
});
window.heroAvatar = { play: (n) => play(n) };

// ---- sizing / camera / loop ----
function resize() {
  const w = host.clientWidth || 320, h = host.clientHeight || 420;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  const mob = w < 520;
  baseCam.set(0.26, mob ? 1.18 : 1.24, mob ? 4.4 : 3.58);
  baseTgt.set(-0.02, mob ? 0.92 : 0.98, 0);
}
resize(); addEventListener('resize', resize);
let mx = 0, my = 0;
addEventListener('pointermove', e => { mx = (e.clientX / innerWidth - .5); my = (e.clientY / innerHeight - .5); }, { passive: true });
let running = true, intro0 = performance.now();
new IntersectionObserver(es => es.forEach(e => running = e.isIntersecting), { threshold: 0.02 }).observe(host);
(function loop() {
  requestAnimationFrame(loop);
  if (!running) return;
  const dt = clock.getDelta(), t = clock.elapsedTime;
  if (mixer) mixer.update(dt);
  const k = Math.min(1, (performance.now() - intro0) / 2600);
  const ease = 1 - Math.pow(1 - k, 3);
  camera.position.set(
    baseCam.x + 0.8 * (1 - ease) + mx * 0.26,
    baseCam.y + 0.2 * (1 - ease) - my * 0.1 + Math.sin(t * 0.6) * 0.01,
    baseCam.z + 0.65 * (1 - ease));
  camera.lookAt(baseTgt);
  renderer.render(scene, camera);
})();
