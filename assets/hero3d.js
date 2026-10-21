import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const host = document.getElementById('hero3d');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
host.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
const baseCam = new THREE.Vector3(0.42, 1.45, 3.85);
const baseTgt = new THREE.Vector3(-0.05, 1.0, 0);
camera.position.copy(baseCam);

scene.add(new THREE.HemisphereLight(0xffe2c4, 0x6e3216, 1.15));
const key = new THREE.DirectionalLight(0xfff2df, 1.6); key.position.set(2.5, 4, 3); scene.add(key);
const fill = new THREE.DirectionalLight(0xffb37a, 0.5); fill.position.set(-3, 2, 1.5); scene.add(fill);

// ---- desk set (reel: standing desk + monitor with code + props) ----
const desk = new THREE.Group();
const wood = new THREE.MeshStandardMaterial({ color: 0x9c6a42, roughness: 0.75 });
const darkMetal = new THREE.MeshStandardMaterial({ color: 0x2b2624, roughness: 0.5, metalness: 0.4 });
const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.62), wood); top.position.y = 0.98; desk.add(top);
[-0.62, 0.62].forEach(x => { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.98, 0.5), darkMetal); leg.position.set(x, 0.49, 0); desk.add(leg); });
// monitor
function codeTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 320;
  const g = c.getContext('2d'); g.fillStyle = '#171310'; g.fillRect(0, 0, 512, 320);
  const cols = ['#e8a56b', '#9fd6a0', '#d9cfc0', '#c47b4a', '#8fb7d9'];
  let y = 26;
  g.font = '15px monospace';
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  while (y < 305) {
    let x = 18 + (rnd() < .3 ? 26 : 0);
    const n = 1 + Math.floor(rnd() * 3);
    for (let i = 0; i < n && x < 470; i++) {
      const w = 26 + rnd() * 90;
      g.fillStyle = cols[Math.floor(rnd() * cols.length)];
      g.fillRect(x, y - 10, Math.min(w, 490 - x), 9);
      x += Math.min(w, 490 - x) + 12;
    }
    y += 17;
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const mon = new THREE.Group();
const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.45, 0.03), darkMetal); mon.add(bezel);
const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.67, 0.4), new THREE.MeshBasicMaterial({ map: codeTexture() }));
scr.position.z = 0.017; mon.add(scr);
const stand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.05), darkMetal); stand.position.y = -0.29; mon.add(stand);
const foot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.16), darkMetal); foot.position.y = -0.37; mon.add(foot);
mon.position.set(-0.12, 1.42, -0.14); mon.rotation.y = 0.22; mon.rotation.x = -0.05; desk.add(mon);
// keyboard + mug + plant + books
const kb = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.015, 0.14), new THREE.MeshStandardMaterial({ color: 0x3a3430, roughness: 0.6 }));
kb.position.set(-0.1, 1.015, 0.14); desk.add(kb);
const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.032, 0.09, 12), new THREE.MeshStandardMaterial({ color: 0xd8cfc2, roughness: 0.5 }));
mug.position.set(0.32, 1.05, 0.1); desk.add(mug);
const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.08, 10), new THREE.MeshStandardMaterial({ color: 0xb85c33, roughness: 0.8 }));
pot.position.set(0.55, 1.045, -0.12); desk.add(pot);
const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.075, 0), new THREE.MeshStandardMaterial({ color: 0x5c7d43, roughness: 0.9 }));
leaf.position.set(0.55, 1.15, -0.12); leaf.scale.y = 1.25; desk.add(leaf);
[0, 1, 2].forEach(i => {
  const bk = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.028, 0.11), new THREE.MeshStandardMaterial({ color: [0x7d4b2a, 0x4a5a68, 0xc9b48a][i], roughness: 0.8 }));
  bk.position.set(-0.6, 1.02 + i * 0.03, -0.1); bk.rotation.y = (i - 1) * 0.18; desk.add(bk);
});
desk.position.set(-0.62, 0, -0.15);
scene.add(desk);
// soft blob shadow under set
const shTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 8, 64, 64, 62); r.addColorStop(0, 'rgba(40,12,4,.5)'); r.addColorStop(1, 'rgba(40,12,4,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
[[-0.62, 1.1], [0.62, 0.55]].forEach(([x, s]) => {
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(s, s * 0.5), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.set(x, 0.005, 0); scene.add(sh);
});

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
  avatar.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
  scene.add(avatar);
  mixer = new THREE.AnimationMixer(avatar);
  g.animations.forEach(c => clips[c.name] = mixer.clipAction(c));
  // walk in from the right, then idle
  avatar.position.x = 1.9;
  play('walk', 0);
  const t0 = performance.now();
  (function walkIn() {
    const k = Math.min(1, (performance.now() - t0) / 2100);
    avatar.position.x = 1.9 + (0.58 - 1.9) * (1 - Math.pow(1 - k, 3));
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
  baseCam.set(0.42, mob ? 1.3 : 1.45, mob ? 4.6 : 3.85);
  baseTgt.set(-0.05, mob ? 0.9 : 1.0, 0);
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
    baseCam.x + 0.9 * (1 - ease) + mx * 0.28,
    baseCam.y + 0.25 * (1 - ease) - my * 0.12 + Math.sin(t * 0.6) * 0.012,
    baseCam.z + 0.7 * (1 - ease));
  camera.lookAt(baseTgt);
  renderer.render(scene, camera);
})();
