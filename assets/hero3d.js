import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

const host = document.getElementById('hero3d');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
host.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 50);
const baseCam = new THREE.Vector3(0.05, 1.06, 3.9);
const baseTgt = new THREE.Vector3(0.0, 1.0, 0);
camera.position.copy(baseCam);

// ---- studio lighting ----
scene.add(new THREE.HemisphereLight(0xffd9b8, 0x84401f, 0.95));
const key = new THREE.DirectionalLight(0xfff0dd, 1.35);
key.position.set(2.0, 3.8, 2.4);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = -2.6; key.shadow.camera.right = 2.6;
key.shadow.camera.top = 3.2; key.shadow.camera.bottom = -0.5;
key.shadow.camera.far = 14; key.shadow.radius = 8; key.shadow.bias = -0.0004;
scene.add(key);
const rim = new THREE.DirectionalLight(0xffe4c8, 1.5); rim.position.set(-2.4, 2.7, -2.9); scene.add(rim);
// soft face fill so the avatar reads clearly against the warm room (no shadows, tight falloff)
const faceFill = new THREE.PointLight(0xffe8d5, 5.0, 3.2, 2);
faceFill.position.set(1.35, 1.6, 1.7); scene.add(faceFill);

// ---- room: floor + back wall + side wall (L corner), alpha-faded edges ----
function wallTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  // vertical gradient: darker top, warm glow near base
  const vg = g.createLinearGradient(0, 0, 0, 512);
  vg.addColorStop(0, '#bb562c'); vg.addColorStop(0.6, '#c25c2f');
  vg.addColorStop(0.86, '#cd6c3c'); vg.addColorStop(1, '#d97e4c');
  g.fillStyle = vg; g.fillRect(0, 0, 1024, 512);
  // warm underlit glow band near base, brightest behind desk (center-left)
  const rg = g.createRadialGradient(430, 500, 30, 430, 500, 420);
  rg.addColorStop(0, 'rgba(255,160,90,0.28)'); rg.addColorStop(1, 'rgba(255,160,90,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 1024, 512);
  // alpha fade: top, left, right edges
  const img = g.getImageData(0, 0, 1024, 512); const d = img.data;
  for (let y = 0; y < 512; y++) for (let x = 0; x < 1024; x++) {
    const fx = Math.min(x / 260, (1023 - x) / 260, 1);
    const fy = Math.min(y / 200, 1);
    d[(y * 1024 + x) * 4 + 3] *= Math.min(fx, fy);
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function floorTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  const rg = g.createRadialGradient(256, 210, 40, 256, 256, 255);
  rg.addColorStop(0, '#cd6540'); rg.addColorStop(0.55, '#c35d34');
  rg.addColorStop(0.85, 'rgba(195,90,50,0.55)'); rg.addColorStop(1, 'rgba(190,86,44,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture(), transparent: true, roughness: 0.95 });
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(18, 6.5), wallMat);
backWall.position.set(0.9, 3.25, -1.35); scene.add(backWall);
const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 6.5), wallMat.clone());
sideWall.rotation.y = -Math.PI / 2; sideWall.position.set(3.4, 3.25, 0.8); scene.add(sideWall);
const mirror = new Reflector(new THREE.CircleGeometry(8.5, 48), {
  clipBias: 0.003, textureWidth: 1024, textureHeight: 1024, color: 0x8a4c2e });
mirror.rotation.x = -Math.PI / 2; mirror.position.set(0.6, -0.002, 1.2); scene.add(mirror);
const floor = new THREE.Mesh(new THREE.CircleGeometry(8.5, 48),
  new THREE.MeshStandardMaterial({ map: floorTexture(), transparent: true, opacity: 0.68, roughness: 0.4, metalness: 0.1 }));
floor.rotation.x = -Math.PI / 2; floor.position.set(0.6, 0, 1.2); floor.receiveShadow = true; scene.add(floor);

// ---- desk (video frame: dark walnut top, black standing-desk frame) ----
const desk = new THREE.Group();
const walnutTop = new THREE.MeshStandardMaterial({ color: 0x6e4a2c, roughness: 0.46, metalness: 0.06 });
const blackMetal = new THREE.MeshStandardMaterial({ color: 0x191715, roughness: 0.42, metalness: 0.5 });
const top = new THREE.Mesh(new RoundedBoxGeometry(1.52, 0.032, 0.62, 3, 0.01), walnutTop);
top.position.y = 0.735; top.castShadow = top.receiveShadow = true; desk.add(top);
// standing-desk frame: lift columns + T feet + under-top brackets
[-0.62, 0.62].forEach(x => {
  const leg = new THREE.Group();
  const col = new THREE.Mesh(new RoundedBoxGeometry(0.075, 0.70, 0.075, 2, 0.012), blackMetal);
  col.position.set(0, 0.365, 0); col.castShadow = true; leg.add(col);
  const foot = new THREE.Mesh(new RoundedBoxGeometry(0.10, 0.026, 0.56, 2, 0.01), blackMetal);
  foot.position.set(0, 0.013, 0.03); foot.castShadow = true; leg.add(foot);
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.035, 0.5), blackMetal);
  bracket.position.set(0, 0.70, 0); bracket.castShadow = true; leg.add(bracket);
  leg.position.set(x, 0, 0);
  desk.add(leg);
});
// small controller under right front edge
const ctrl = new THREE.Mesh(new RoundedBoxGeometry(0.09, 0.02, 0.05, 2, 0.006), blackMetal);
ctrl.position.set(0.5, 0.712, 0.26); desk.add(ctrl);
function codeTexture(seed0) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 320;
  const g = c.getContext('2d');
  g.fillStyle = '#1e1e28'; g.fillRect(0, 0, 512, 320);          // editor bg
  g.fillStyle = '#25252f'; g.fillRect(0, 0, 40, 320);           // activity bar
  g.fillStyle = '#2d2d3a'; g.fillRect(40, 0, 120, 320);         // sidebar
  g.fillStyle = '#7c5cbf'; g.fillRect(0, 306, 512, 14);         // vscode purple status bar
  const cols = ['#e8a56b', '#9fd6a0', '#d9cfc0', '#c47b4a', '#8fb7d9', '#b48fd6'];
  let y = 26, seed = seed0;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  while (y < 296) {
    let x = 176 + (rnd() < .35 ? 20 + rnd() * 34 : 0);
    const n = 1 + Math.floor(rnd() * 3);
    for (let i = 0; i < n && x < 486; i++) {
      const w = 22 + rnd() * 80;
      g.fillStyle = cols[Math.floor(rnd() * cols.length)];
      g.fillRect(x, y - 8, Math.min(w, 500 - x), 7);
      x += Math.min(w, 500 - x) + 10;
    }
    y += 14;
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function makeMonitor(seed) {
  const m = new THREE.Group();
  const bez = new THREE.Mesh(new RoundedBoxGeometry(0.57, 0.35, 0.02, 2, 0.008), blackMetal);
  bez.castShadow = true; m.add(bez);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.545, 0.325),
    new THREE.MeshBasicMaterial({ map: codeTexture(seed) }));
  scr.position.z = 0.0115; m.add(scr);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.11, 0.026), blackMetal);
  neck.position.set(0, -0.225, -0.012); neck.castShadow = true; m.add(neck);
  const bs = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.014, 20), blackMetal);
  bs.position.set(0, -0.282, 0.005); bs.scale.z = 0.72; bs.castShadow = true; m.add(bs);
  return m;
}
const monL = makeMonitor(11); monL.position.set(-0.30, 1.0, -0.19); monL.rotation.y = 0.26; monL.rotation.x = -0.045; desk.add(monL);
const monR = makeMonitor(47); monR.position.set(0.28, 1.0, -0.21); monR.rotation.y = -0.22; monR.rotation.x = -0.045; desk.add(monR);
// keyboard with keys
function kbTexture() {
  const c = document.createElement('canvas'); c.width = 360; c.height = 120;
  const g = c.getContext('2d'); g.fillStyle = '#211d1a'; g.fillRect(0, 0, 360, 120);
  g.fillStyle = '#3a342e';
  for (let r = 0; r < 5; r++) for (let k = 0; k < 15; k++) g.fillRect(6 + k * 23.5, 8 + r * 21.5, 19, 17);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const kb = new THREE.Mesh(new RoundedBoxGeometry(0.37, 0.014, 0.12, 2, 0.005),
  new THREE.MeshStandardMaterial({ map: kbTexture(), roughness: 0.6 }));
kb.position.set(-0.04, 0.756, 0.12); kb.rotation.y = 0.03; kb.castShadow = true; desk.add(kb);
const mouse = new THREE.Mesh(new RoundedBoxGeometry(0.052, 0.024, 0.085, 2, 0.012),
  new THREE.MeshStandardMaterial({ color: 0x2c2724, roughness: 0.55 }));
mouse.position.set(0.26, 0.761, 0.12); mouse.castShadow = true; desk.add(mouse);
desk.position.set(0.55, 0, -0.25);
scene.add(desk);

// ---- avatar ----
let mixer, clips = {}, avatar, cur, bones = {}, procIdle = false, procTalk = 0;
const clock = new THREE.Clock();
function play(name, fade = 0.25) {
  const next = clips[name]; if (!next || cur === next) return;
  next.reset(); next.setLoop(THREE.LoopRepeat); next.play();
  if (cur) { next.crossFadeFrom(cur, fade, false); }
  cur = next;
}
const avatarLoader = new GLTFLoader();
avatarLoader.setMeshoptDecoder(MeshoptDecoder);
avatarLoader.load('assets/avatar.glb', (g) => {
  avatar = g.scene;
  avatar.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = true; } });
  scene.add(avatar);
  mixer = new THREE.AnimationMixer(avatar);
  g.animations.forEach(c => clips[c.name] = mixer.clipAction(c));
  // strip horizontal root motion from walk so the tween drives travel
  const walk = g.animations.find(c => c.name === 'walk');
  if (walk) walk.tracks.forEach(tr => {
    if (/Hips\.position$/.test(tr.name)) {
      const v = tr.values; for (let i = 0; i < v.length; i += 3) { v[i] = 0; v[i + 2] = 0; }
    }
  });
  // bone refs + bind pose for procedural idle/talk
  bones = {}; avatar.traverse(o => { if (o.isBone) { bones[o.name] = o; o.userData.base = o.rotation.clone(); } });
  avatar.position.z = 0.34; avatar.position.x = 2.6;
  play('walk', 0);
  const t0 = performance.now();
  (function walkIn() {
    const k = Math.min(1, (performance.now() - t0) / 2100);
    avatar.position.x = 2.6 + (1.52 - 2.6) * (1 - Math.pow(1 - k, 3));
    if (k < 1) requestAnimationFrame(walkIn); else { if (cur) { cur.fadeOut(0.35); cur = null; } procIdle = true; }
  })();
  window.__heroReady = true;
});
window.heroAvatar = { play: (n) => {
    if (clips[n]) { procIdle = false; procTalk = 0; play(n); return; }
    if (n === 'talk') { procTalk = 6.5; procIdle = true; return; }
    if (n === 'idle') { if (cur) { cur.fadeOut(0.35); cur = null; } procIdle = true; return; }
    play(n);
  } };

// ---- sizing / camera / loop ----
function resize() {
  const w = host.clientWidth || 320, h = host.clientHeight || 420;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  const mob = w < 520;
  baseCam.set(mob ? 0.5 : 0.1, mob ? 1.5 : 1.46, mob ? 6.4 : 4.7);
  baseTgt.set(mob ? 0.85 : 0.45, mob ? 1.0 : 1.05, 0);
}
resize(); addEventListener('resize', resize);
let mx = 0, my = 0, lastPtr = 0, hYaw = 0, hPitch = 0;
const finePtr = matchMedia('(pointer:fine)').matches;
addEventListener('pointermove', e => { mx = (e.clientX / innerWidth - .5); my = (e.clientY / innerHeight - .5); lastPtr = performance.now(); }, { passive: true });
let running = true, intro0 = performance.now();
new IntersectionObserver(es => es.forEach(e => running = e.isIntersecting), { threshold: 0.02 }).observe(host);
(function loop() {
  requestAnimationFrame(loop);
  if (!running) return;
  const dt = clock.getDelta(), t = clock.elapsedTime;
  if (mixer) mixer.update(dt);
  if (avatar && procIdle) {
    const B = (n) => bones[n];
    const set = (n, x, y, z) => { const b = B(n); if (b && b.userData.base) b.rotation.set(b.userData.base.x + x, b.userData.base.y + y, b.userData.base.z + z); };
    // subtle cursor-follow: head/neck ease toward pointer, recenter when idle
    let tYaw = 0, tPitch = 0;
    if (finePtr && performance.now() - lastPtr < 3500) { tYaw = mx * 0.22; tPitch = my * 0.12; }
    const damp = Math.min(1, dt * 3.2);
    hYaw += (tYaw - hYaw) * damp; hPitch += (tPitch - hPitch) * damp;
    const br = Math.sin(t * 1.7) * 0.018;
    set('Spine01', br, 0, 0);
    set('Spine02', br * 0.7, Math.sin(t * 0.9) * 0.012 - hYaw * 0.10, -hYaw * 0.06);
    set('neck', Math.sin(t * 1.1) * 0.02 + hPitch * 0.35, Math.sin(t * 0.55) * 0.05 - hYaw * 0.45, 0);
    set('Head', Math.sin(t * 0.8) * 0.025 + hPitch * 0.6, Math.sin(t * 0.45) * 0.06 - hYaw * 0.75, 0);
    set('LeftArm', 0, 0, 0.52 + Math.sin(t * 1.7 + 0.5) * 0.015);
    set('RightArm', 0, 0, -0.52 - Math.sin(t * 1.7 + 0.5) * 0.015);
    set('LeftForeArm', 0, 0, 0.12);
    set('RightForeArm', 0, 0, -0.12);
    if (procTalk > 0) {
      procTalk -= dt;
      const g = Math.sin(t * 3.2) * 0.22;
      set('RightArm', -0.95 + g * 0.5, -0.15, -0.30 + g * 0.25);
      set('RightForeArm', -0.85 + g * 0.6, 0, 0);
      set('Head', Math.sin(t * 2.1) * 0.05, Math.sin(t * 1.3) * 0.08, 0);
    }
  }
  const k = Math.min(1, (performance.now() - intro0) / 2600);
  const ease = 1 - Math.pow(1 - k, 3);
  camera.position.set(
    baseCam.x + 0.8 * (1 - ease) + mx * 0.26,
    baseCam.y + 0.18 * (1 - ease) - my * 0.1 + Math.sin(t * 0.6) * 0.01,
    baseCam.z + 0.65 * (1 - ease));
  camera.lookAt(baseTgt);
  renderer.render(scene, camera);
})();
