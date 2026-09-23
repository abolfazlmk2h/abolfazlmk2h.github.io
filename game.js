/**
 * Mugenjō (無限城) — Demon Slayer 3D Infinity Castle Simulation
 * Pure WebGL & Three.js with Web Audio API Biwa Synthesizer
 */

// --- Procedural Texture Generators ---
function createWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Dark rich Japanese Hinoki/Cedar wood
  ctx.fillStyle = '#21130d';
  ctx.fillRect(0, 0, 512, 512);

  // Grain lines
  for (let i = 0; i < 600; i++) {
    const y = Math.random() * 512;
    const h = 1 + Math.random() * 3;
    const alpha = 0.08 + Math.random() * 0.15;
    ctx.fillStyle = `rgba(16, 8, 4, ${alpha})`;
    ctx.fillRect(0, y, 512, h);
  }

  // Planks borders
  ctx.strokeStyle = 'rgba(10, 5, 2, 0.6)';
  ctx.lineWidth = 4;
  for (let x = 0; x <= 512; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createShojiTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Translucent Washi Paper
  ctx.fillStyle = '#f0e6d2';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle paper grain noise
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = `rgba(220, 205, 180, 0.4)`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Wooden Grid (Kumiko)
  ctx.strokeStyle = '#2b160b';
  ctx.lineWidth = 10;
  ctx.strokeRect(0, 0, 512, 512);

  ctx.lineWidth = 6;
  const cols = 4;
  const rows = 8;
  for (let c = 1; c < cols; c++) {
    ctx.beginPath();
    ctx.moveTo((512 / cols) * c, 0);
    ctx.lineTo((512 / cols) * c, 512);
    ctx.stroke();
  }
  for (let r = 1; r < rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, (512 / rows) * r);
    ctx.lineTo(512, (512 / rows) * r);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createTatamiTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Straw green-gold base
  ctx.fillStyle = '#8f885e';
  ctx.fillRect(0, 0, 512, 512);

  // Weave stripes
  for (let y = 0; y < 512; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? '#7a744e' : '#999266';
    ctx.fillRect(0, y, 512, 3);
  }

  // Black/Dark-gold border cloth (Heri)
  ctx.fillStyle = '#11151c';
  ctx.fillRect(0, 0, 36, 512);
  ctx.fillRect(512 - 36, 0, 36, 512);

  // Gold stitching on Heri
  ctx.fillStyle = '#c5a059';
  for (let y = 6; y < 512; y += 16) {
    ctx.fillRect(16, y, 4, 8);
    ctx.fillRect(512 - 20, y, 4, 8);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// --- Web Audio API: Nakime's Biwa Synthesizer ---
class BiwaSynthesizer {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.droneOsc = null;
    this.droneGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startAmbientDrone() {
    if (!this.enabled || this.droneOsc) return;
    this.init();
    if (!this.ctx) return;

    try {
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      this.droneOsc = this.ctx.createOscillator();
      this.droneOsc.type = 'sine';
      this.droneOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A1 resonance

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(110, this.ctx.currentTime);

      this.droneOsc.connect(filter);
      filter.connect(this.droneGain);
      this.droneGain.connect(this.ctx.destination);
      this.droneOsc.start();
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  stopAmbientDrone() {
    if (this.droneOsc) {
      try {
        this.droneOsc.stop();
        this.droneOsc.disconnect();
      } catch (e) {}
      this.droneOsc = null;
    }
  }

  playStrum() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Traditional Japanese Biwa pentatonic pitches (Hirajoshi scale: D3, Eb3, G3, A3, Bb3, D4)
    const pitches = [146.83, 155.56, 196.00, 220.00, 293.66];

    // Master Biwa Gain & Sawari Buzz Distortion
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.8, t);
    masterGain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
    masterGain.connect(this.ctx.destination);

    // Strum delay per string to simulate plectrum (Bachi) striking strings
    pitches.forEach((freq, idx) => {
      const stringDelay = idx * 0.024;
      const osc = this.ctx.createOscillator();
      const stringGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Sharp acoustic pluck waveform
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq * 1.05, t + stringDelay);
      // Biwa pitch slide / bend
      osc.frequency.exponentialRampToValueAtTime(freq, t + stringDelay + 0.12);

      // Resonant filter for hollow wooden body
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * 2.2, t + stringDelay);
      filter.Q.setValueAtTime(4.0, t + stringDelay);

      // Envelope
      stringGain.gain.setValueAtTime(0.0, t + stringDelay);
      stringGain.gain.linearRampToValueAtTime(0.35, t + stringDelay + 0.006);
      stringGain.gain.exponentialRampToValueAtTime(0.0001, t + stringDelay + 1.8);

      osc.connect(filter);
      filter.connect(stringGain);
      stringGain.connect(masterGain);

      osc.start(t + stringDelay);
      osc.stop(t + stringDelay + 2.2);
    });
  }
}

// --- Main 3D Simulation Setup ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07080c);
scene.fog = new THREE.FogExp2(0x07080c, 0.012);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// Shared Textures & Materials
const woodTex = createWoodTexture();
const shojiTex = createShojiTexture();
const tatamiTex = createTatamiTexture();

const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.7, metalness: 0.1 });
const beamMat = new THREE.MeshStandardMaterial({ color: 0x140b07, roughness: 0.8 });
const shojiMat = new THREE.MeshStandardMaterial({ map: shojiTex, roughness: 0.6, transparent: true, opacity: 0.95 });
const tatamiMat = new THREE.MeshStandardMaterial({ map: tatamiTex, roughness: 0.8 });
const lanternGlowMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });

// Shiftable Castle Modules
const shiftableRooms = [];
let shiftCount = 0;

// Ambient and Atmospheric Lights
const ambientLight = new THREE.AmbientLight(0x221a2c, 1.2);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0x4a6984, 0.8);
moonLight.position.set(40, 100, 50);
scene.add(moonLight);

// Builder: Japanese Castle Room / Chamber
function createCastleRoom(w = 16, h = 10, d = 20, withLantern = true) {
  const roomGroup = new THREE.Group();

  // Floor (Tatami)
  const floorGeo = new THREE.BoxGeometry(w, 0.6, d);
  const floor = new THREE.Mesh(floorGeo, tatamiMat);
  floor.position.y = -0.3;
  floor.receiveShadow = true;
  roomGroup.add(floor);

  // Ceiling (Dark Wood)
  const ceilGeo = new THREE.BoxGeometry(w, 0.6, d);
  const ceiling = new THREE.Mesh(ceilGeo, woodMat);
  ceiling.position.y = h;
  roomGroup.add(ceiling);

  // 4 Corner Pillars
  const pillarGeo = new THREE.BoxGeometry(0.8, h, 0.8);
  const offsets = [
    [-w/2 + 0.4, -d/2 + 0.4],
    [ w/2 - 0.4, -d/2 + 0.4],
    [-w/2 + 0.4,  d/2 - 0.4],
    [ w/2 - 0.4,  d/2 - 0.4]
  ];
  offsets.forEach(([px, pz]) => {
    const pillar = new THREE.Mesh(pillarGeo, beamMat);
    pillar.position.set(px, h / 2, pz);
    roomGroup.add(pillar);
  });

  // Shoji Walls (left and right)
  const wallGeo = new THREE.PlaneGeometry(d, h - 0.6);
  const leftWall = new THREE.Mesh(wallGeo, shojiMat);
  leftWall.position.set(-w / 2 + 0.1, h / 2, 0);
  leftWall.rotation.y = Math.PI / 2;
  roomGroup.add(leftWall);

  const rightWall = leftWall.clone();
  rightWall.position.set(w / 2 - 0.1, h / 2, 0);
  rightWall.rotation.y = -Math.PI / 2;
  roomGroup.add(rightWall);

  // Hanging Lantern
  if (withLantern) {
    const lanternGroup = new THREE.Group();
    lanternGroup.position.set(0, h - 2.5, 0);

    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2), beamMat);
    cord.position.y = 1;
    lanternGroup.add(cord);

    const lanternBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 1.2), lanternGlowMat);
    lanternGroup.add(lanternBox);

    const light = new THREE.PointLight(0xffaa33, 2.5, 35, 1.5);
    lanternGroup.add(light);

    roomGroup.add(lanternGroup);
  }

  return roomGroup;
}

// Builder: Floating Staircase
function createStaircase(steps = 12, stepWidth = 6) {
  const stairGroup = new THREE.Group();
  const stepH = 0.5;
  const stepD = 1.2;

  for (let i = 0; i < steps; i++) {
    const stepGeo = new THREE.BoxGeometry(stepWidth, stepH, stepD);
    const step = new THREE.Mesh(stepGeo, woodMat);
    step.position.set(0, i * stepH, -i * stepD);
    stairGroup.add(step);
  }

  // Balustrade / Rails
  const railGeo = new THREE.BoxGeometry(0.3, 1.6, steps * stepD);
  const railL = new THREE.Mesh(railGeo, beamMat);
  railL.position.set(-stepWidth / 2, (steps * stepH) / 2 + 0.8, (-steps * stepD) / 2);
  railL.rotation.x = Math.atan2(steps * stepH, steps * stepD);
  stairGroup.add(railL);

  const railR = railL.clone();
  railR.position.x = stepWidth / 2;
  stairGroup.add(railR);

  return stairGroup;
}

// Generate the Infinite Castle Void World
function buildInfinityCastle() {
  // 1. Central Starting Platform
  const startRoom = createCastleRoom(20, 10, 24, true);
  startRoom.position.set(0, 0, 0);
  scene.add(startRoom);

  // 2. Procedural Floating Modules (Rooms & Corridors)
  const roomCount = 48;
  for (let i = 0; i < roomCount; i++) {
    const w = 14 + (Math.random() * 8);
    const h = 8 + (Math.random() * 6);
    const d = 16 + (Math.random() * 12);
    const room = createCastleRoom(w, h, d, Math.random() > 0.3);

    // Spread across non-Euclidean 3D space
    const x = (Math.random() - 0.5) * 220;
    const y = (Math.random() - 0.5) * 260;
    const z = (Math.random() - 0.5) * 220;
    room.position.set(x, y, z);

    // M.C. Escher Rotations (Normal, 90° sideways, or upside-down 180°)
    const rotType = Math.floor(Math.random() * 6);
    if (rotType === 1) room.rotation.z = Math.PI / 2;     // Vertical on wall
    else if (rotType === 2) room.rotation.z = -Math.PI / 2;
    else if (rotType === 3) room.rotation.x = Math.PI;    // Upside down on ceiling
    else if (rotType === 4) room.rotation.y = Math.PI / 2;

    scene.add(room);

    // Register room for Nakime's Biwa shifting
    shiftableRooms.push({
      mesh: room,
      basePos: room.position.clone(),
      baseRot: room.rotation.clone(),
      targetPos: room.position.clone(),
      targetRot: room.rotation.clone(),
      isShifting: false
    });
  }

  // 3. Floating Interconnecting Staircases
  for (let i = 0; i < 28; i++) {
    const stair = createStaircase(14, 5);
    stair.position.set(
      (Math.random() - 0.5) * 180,
      (Math.random() - 0.5) * 200,
      (Math.random() - 0.5) * 180
    );

    const angle = (Math.floor(Math.random() * 4) * Math.PI) / 2;
    stair.rotation.y = angle;

    if (Math.random() > 0.6) {
      stair.rotation.z = Math.PI / 2; // Vertical staircase on wall
    }

    scene.add(stair);

    shiftableRooms.push({
      mesh: stair,
      basePos: stair.position.clone(),
      baseRot: stair.rotation.clone(),
      targetPos: stair.position.clone(),
      targetRot: stair.rotation.clone(),
      isShifting: false
    });
  }

  // 4. Void Embers / Floating Dust Particles
  const particleGeo = new THREE.BufferGeometry();
  const particleCount = 1800;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 350;
    positions[i + 1] = (Math.random() - 0.5) * 350;
    positions[i + 2] = (Math.random() - 0.5) * 350;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0xf5a623,
    size: 0.8,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending
  });
  const emberParticles = new THREE.Points(particleGeo, particleMat);
  scene.add(emberParticles);
}

// --- Player State & Controls ---
const player = {
  pos: new THREE.Vector3(0, 3, 0),
  vel: new THREE.Vector3(),
  yaw: 0,
  pitch: 0,
  isGrounded: true,
  stamina: 100,
  isDashing: false,
  dashCooldown: 0
};

const keys = {};
const biwa = new BiwaSynthesizer();

window.addEventListener('keydown', (e) => {
  keys[e.code] = true;

  if (e.code === 'KeyB') {
    triggerBiwaShift();
  }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    executeSlayerDash();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

// Pointer Lock
const blocker = document.getElementById('blocker');
const startBtn = document.getElementById('start-btn');
let isLocked = false;

function lockPointer() {
  document.body.requestPointerLock = document.body.requestPointerLock || document.body.mozRequestPointerLock;
  document.body.requestPointerLock();
  biwa.init();
  biwa.startAmbientDrone();
}

startBtn.addEventListener('click', lockPointer);
blocker.addEventListener('click', lockPointer);

document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === document.body) {
    isLocked = true;
    blocker.style.display = 'none';
    biwa.startAmbientDrone();
  } else {
    isLocked = false;
    blocker.style.display = 'flex';
  }
});

document.addEventListener('mousemove', (e) => {
  if (!isLocked) return;
  const sens = 0.0022;
  player.yaw -= e.movementX * sens;
  player.pitch -= e.movementY * sens;
  player.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, player.pitch));
});

// UI Buttons
document.getElementById('btn-biwa').addEventListener('click', (e) => {
  e.stopPropagation();
  triggerBiwaShift();
});

document.getElementById('btn-dash').addEventListener('click', (e) => {
  e.stopPropagation();
  executeSlayerDash();
});

const soundBtn = document.getElementById('btn-sound');
soundBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  biwa.enabled = !biwa.enabled;
  if (biwa.enabled && isLocked) {
    biwa.startAmbientDrone();
  } else {
    biwa.stopAmbientDrone();
  }
  soundBtn.textContent = biwa.enabled ? '🔊 AUDIO: ON' : '🔇 AUDIO: OFF';
});

// Nakime Biwa Shift Execution
let cameraShake = 0;
function triggerBiwaShift() {
  biwa.playStrum();
  shiftCount++;
  document.getElementById('shift-count').textContent = shiftCount;
  cameraShake = 0.45;

  // Pick 12 to 18 random modules to rotate / translate
  const targets = [];
  while (targets.length < 16) {
    const idx = Math.floor(Math.random() * shiftableRooms.length);
    if (!targets.includes(idx)) targets.push(idx);
  }

  targets.forEach((idx) => {
    const item = shiftableRooms[idx];
    const shiftAxes = ['x', 'y', 'z'];
    const axis = shiftAxes[Math.floor(Math.random() * shiftAxes.length)];

    // 90 degree rotation
    item.targetRot[axis] += (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 2);

    // Optional slide translation along rails
    const slideOffset = (Math.random() - 0.5) * 35;
    item.targetPos[axis] += slideOffset;
    item.isShifting = true;
  });

  const hint = document.getElementById('action-hint');
  hint.textContent = '⚡ Nakime struck the Biwa — Dimensional Shift in Progress!';
  setTimeout(() => {
    hint.innerHTML = 'Press <strong>[B]</strong> or click <strong>STRUM BIWA</strong> to shift the Castle';
  }, 3500);
}

// Slayer Dash (Thunder / Water Breathing Style)
function executeSlayerDash() {
  if (player.dashCooldown > 0 || player.stamina < 30) return;

  player.stamina -= 35;
  player.dashCooldown = 1.2;
  player.isDashing = true;

  // Forward vector based on camera yaw
  const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw)).normalize();
  player.vel.add(forward.multiplyScalar(32));

  // Camera FOV warp effect
  camera.fov = 88;
  camera.updateProjectionMatrix();
  setTimeout(() => {
    camera.fov = 72;
    camera.updateProjectionMatrix();
    player.isDashing = false;
  }, 220);
}

// Build the World
buildInfinityCastle();

// --- Game Loop ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);

  // Smooth architectural room transitions
  shiftableRooms.forEach((item) => {
    if (item.isShifting) {
      item.mesh.position.lerp(item.targetPos, delta * 3.5);
      item.mesh.quaternion.slerp(new THREE.Quaternion().setFromEuler(item.targetRot), delta * 3.5);

      if (item.mesh.position.distanceTo(item.targetPos) < 0.1) {
        item.isShifting = false;
      }
    }
  });

  // Player Input Movement
  if (isLocked) {
    const moveDir = new THREE.Vector3();
    if (keys['KeyW']) moveDir.z -= 1;
    if (keys['KeyS']) moveDir.z += 1;
    if (keys['KeyA']) moveDir.x -= 1;
    if (keys['KeyD']) moveDir.x += 1;
    moveDir.normalize();

    // Rotate movement according to yaw
    const cosY = Math.cos(player.yaw);
    const sinY = Math.sin(player.yaw);
    const worldMove = new THREE.Vector3(
      moveDir.x * cosY - moveDir.z * sinY,
      0,
      moveDir.x * sinY + moveDir.z * cosY
    );

    const speed = 14;
    player.vel.x += worldMove.x * speed * delta * 8;
    player.vel.z += worldMove.z * speed * delta * 8;

    // Jump
    if (keys['Space'] && player.isGrounded) {
      player.vel.y = 11;
      player.isGrounded = false;
    }
  }

  // Gravity & Drag
  player.vel.y -= 26 * delta; // Gravity
  player.vel.x *= Math.pow(0.04, delta);
  player.vel.z *= Math.pow(0.04, delta);

  player.pos.addScaledVector(player.vel, delta);

  // Basic Platform Collision (Ground at Y=0 on central floor)
  if (player.pos.y <= 2.2 && Math.abs(player.pos.x) < 20 && Math.abs(player.pos.z) < 24) {
    player.pos.y = 2.2;
    player.vel.y = 0;
    player.isGrounded = true;
  } else if (player.pos.y < -300) {
    // Respawn if fell into bottomless chasm
    player.pos.set(0, 6, 0);
    player.vel.set(0, 0, 0);
  }

  // Stamina regeneration
  if (player.stamina < 100) {
    player.stamina = Math.min(100, player.stamina + 25 * delta);
  }
  if (player.dashCooldown > 0) {
    player.dashCooldown -= delta;
  }
  document.getElementById('stamina-bar').style.width = `${player.stamina}%`;

  // Depth meter update
  const depth = Math.round(player.pos.y - 150);
  document.getElementById('depth-meter').textContent = `${depth} m`;

  // Camera orientation & screen shake
  camera.position.copy(player.pos);
  if (cameraShake > 0) {
    camera.position.x += (Math.random() - 0.5) * cameraShake;
    camera.position.y += (Math.random() - 0.5) * cameraShake;
    cameraShake = Math.max(0, cameraShake - delta * 0.8);
  }

  const euler = new THREE.Euler(player.pitch, player.yaw, 0, 'YXZ');
  camera.quaternion.setFromEuler(euler);

  renderer.render(scene, camera);
}

// Window Resize Handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start loop
animate();
