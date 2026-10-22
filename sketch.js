// BALLOON SAFARI — p5.js
// Souris ou tactile : tirer
// Espace : pause | M : activer / couper le son

let targets = [];
let particles = [];
let shots = [];
let labels = [];

let state = "menu";
let score = 0;
let best = 0;
let combo = 0;
let popped = 0;
let clock = 0;
let nextSpawn = 0;
let lastHit = -10;
let freezeUntil = 0;
let recoil = 0;
let flash = 0;
let beatPulse = 0;
let reason = "";

let aim = { x: 0, y: 0 };
let audioCtx;
let soundOn = true;
let nextBeat = 0;
let beat = 0;

const animals = ["🐼", "🦊", "🐯", "🐨", "🐵", "🐰"];
const colors = ["#ff799c", "#64dbff", "#b99aff", "#65e7b0"];

function setup() {
  const c = createCanvas(windowWidth, windowHeight);
  pixelDensity(min(2, window.devicePixelRatio || 1));
  textFont("sans-serif");

  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";
  c.elt.style.touchAction = "none";

  aim = { x: width / 2, y: height / 2 };

  try {
    best = Number(localStorage.getItem("safariBest")) || 0;
  } catch (e) {}

  c.elt.addEventListener("pointermove", e => {
    aim = pointerPosition(e, c.elt);
  });

  c.elt.addEventListener("pointerdown", e => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();

    aim = pointerPosition(e, c.elt);
    unlockAudio();

    if (aim.y < 58 && aim.x > width - 54) {
      soundOn = !soundOn;
      return;
    }

    if (
      aim.y < 58 &&
      aim.x > width - 104 &&
      (state === "playing" || state === "paused")
    ) {
      togglePause();
      return;
    }

    if (state === "menu" || state === "over") {
      startGame();
    } else if (state === "paused") {
      togglePause();
    } else if (aim.y > wallY()) {
      fire(aim.x, aim.y);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "playing") state = "paused";
  });
}

function pointerPosition(e, canvas) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * width / r.width,
    y: (e.clientY - r.top) * height / r.height
  };
}

function wallY() {
  return 94;
}

function gunPosition() {
  return { x: width / 2, y: height - 20 };
}

function startGame() {
  targets = [];
  particles = [];
  shots = [];
  labels = [];
  score = 0;
  popped = 0;
  combo = 0;
  clock = 0;
  nextSpawn = 0.7;
  lastHit = -10;
  freezeUntil = 0;
  reason = "";
  state = "playing";

  if (audioCtx) nextBeat = audioCtx.currentTime;
}

function draw() {
  const dt = min(deltaTime, 40) / 1000;

  if (state === "playing") {
    clock += dt;
    updateGame(dt);
    updateMusic();
  }

  recoil = max(0, recoil - dt * 5);
  flash = max(0, flash - dt * 3);
  beatPulse = max(0, beatPulse - dt * 4);

  drawLandscape();
  drawBarrier();

  for (const t of targets) drawTarget(t);

  drawEffects(state === "paused" ? 0 : dt);
  drawGun();

  if (state === "playing") drawCrosshair();
  drawHUD();

  if (flash > 0) {
    noStroke();
    fill(255, 80, 100, flash * 65);
    rect(0, 0, width, height);
  }

  if (state !== "playing") drawOverlay();
}

// ---------- DÉCOR ----------

function drawLandscape() {
  const ctx = drawingContext;
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#25265c");
  sky.addColorStop(0.5, "#9b6596");
  sky.addColorStop(1, "#ffc78e");

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  noStroke();

  // Soleil au coucher.
  fill(255, 208, 140, 20);
  circle(width * 0.77, height * 0.43, 160 + beatPulse * 15);
  fill("#ffd79a");
  circle(width * 0.77, height * 0.43, 105);

  // Nuages.
  for (let i = 0; i < 5; i++) {
    const x = ((i * width / 4 + clock * 5) % (width + 180)) - 90;
    const y = height * (0.2 + (i % 3) * 0.09);
    fill(255, 225, 226, 30);
    ellipse(x, y, 130, 22);
    ellipse(x + 25, y - 10, 70, 30);
  }

  // Collines.
  fill("#626282");
  ellipse(width * 0.1, height * 0.98, width * 1.3, height * 0.65);
  fill("#494d6d");
  ellipse(width * 0.85, height, width * 1.4, height * 0.58);

  fill("#293e4d");
  rect(0, height * 0.86, width, height * 0.14);

  drawTree(width * 0.12, height * 0.86, min(1, height / 700));
  drawTree(width * 0.87, height * 0.88, min(0.8, height / 850));

  // Herbes.
  stroke("#446355");
  strokeWeight(2);
  for (let i = 0; i < width; i += 23) {
    const y = height * 0.91 + sin(i) * 12;
    line(i, y + 12, i + 4, y);
  }
  noStroke();
}

function drawTree(x, y, s) {
  push();
  translate(x, y);
  scale(s);

  stroke("#263845");
  strokeWeight(13);
  line(0, 0, 3, -125);
  strokeWeight(7);
  line(3, -85, -42, -135);
  line(3, -100, 55, -145);

  noStroke();
  fill("#293f4b");
  ellipse(0, -145, 190, 48);
  ellipse(-50, -136, 100, 35);
  ellipse(55, -153, 115, 38);
  pop();
}

function drawBarrier() {
  noStroke();
  fill(255, 111, 130, 20);
  rect(0, wallY() - 5, width, 17);

  stroke("#ffb9bd");
  strokeWeight(3);
  line(0, wallY(), width, wallY());

  for (let x = 8; x < width; x += 28) {
    noStroke();
    fill("#ff7793");
    triangle(x, wallY(), x + 9, wallY(), x + 4.5, wallY() + 7);
  }
}

// ---------- CIBLES ----------

function spawnTarget() {
  let type = "normal";
  const roll = random();

  if (popped >= 5 && roll < 0.14) type = "bomb";
  else if (roll < 0.24) type = "gold";
  else if (roll < 0.32) type = "ice";

  const r = min(random(26, 34), width * 0.085);
  const x = random(r + 15, width - r - 15);
  const travel = max(220, height - wallY());

  targets.push({
    x,
    baseX: x,
    y: height + 65,
    r,
    type,
    animal: random(animals),
    phase: random(TWO_PI),
    speed: travel * (0.12 + min(popped, 70) * 0.0015),
    color: type === "gold" ? "#ffd568"
      : type === "ice" ? "#a6efff"
      : random(colors)
  });
}

function updateGame(dt) {
  if (clock >= nextSpawn) {
    spawnTarget();
    nextSpawn = clock + max(0.42, 1.25 - popped * 0.015);
  }

  if (clock - lastHit > 1.4) combo = 0;

  for (let i = targets.length - 1; i >= 0; i--) {
    const t = targets[i];
    t.y -= t.speed * dt * (clock < freezeUntil ? 0.38 : 1);
    t.phase += dt * 1.7;
    t.x = constrain(
      t.baseX + sin(t.phase) * 18,
      t.r + 5,
      width - t.r - 5
    );

    if (t.y - t.r <= wallY()) {
      if (t.type === "bomb") targets.splice(i, 1);
      else {
        endGame("Un ballon a atteint la barrière !");
        break;
      }
    }
  }
}

function drawTarget(t) {
  push();
  translate(t.x, t.y);
  rotate(sin(t.phase) * 0.06);

  if (t.type === "bomb") {
    stroke("#ffd27b");
    strokeWeight(3);
    line(3, -t.r + 4, 12, -t.r - 13);

    noStroke();
    fill("#ffe49c");
    circle(12, -t.r - 13, 7 + beatPulse * 5);

    fill("#252c47");
    stroke("#ff7988");
    strokeWeight(2);
    circle(0, 0, t.r * 2);

    noStroke();
    fill("#ff91a0");
    textAlign(CENTER, CENTER);
    textSize(29);
    text("×", 0, -1);
    pop();
    return;
  }

  // Cordes du panier.
  stroke(255, 225, 198, 180);
  strokeWeight(1.3);
  line(-t.r * 0.5, t.r * 0.6, -12, t.r + 25);
  line(t.r * 0.5, t.r * 0.6, 12, t.r + 25);
  noStroke();

  // Ballon.
  const c = color(t.color);
  c.setAlpha(30);
  fill(c);
  ellipse(0, 0, t.r * 2.25, t.r * 2.4);

  fill(t.color);
  ellipse(0, 0, t.r * 1.8, t.r * 2);

  fill(255, 255, 255, 35);
  ellipse(0, 0, t.r * 0.85, t.r * 2);

  fill(255, 200);
  ellipse(-t.r * 0.36, -t.r * 0.3, t.r * 0.16, t.r * 0.45);

  fill(t.color);
  triangle(0, t.r - 3, -5, t.r + 5, 5, t.r + 5);

  // Animal dans son panier.
  textAlign(CENTER, CENTER);
  textSize(t.r * 0.85);
  text(t.animal, 0, t.r + 18);

  fill("#b97952");
  rect(-15, t.r + 28, 30, 15, 4);
  fill("#ecc695");
  rect(-17, t.r + 26, 34, 5, 3);

  if (t.type !== "normal") {
    fill(t.type === "gold" ? "#946112" : "#397f9d");
    textSize(24);
    text(t.type === "gold" ? "★" : "❄", 0, 0);
  }

  pop();
}

// ---------- TIR ET COMBOS ----------

function fire(x, y) {
  recoil = 1;
  const gun = gunPosition();
  shots.push({ x1: gun.x, y1: gun.y - 35, x2: x, y2: y, life: 0.18 });
  tone(170, 0.07, "triangle", 0.055, 70);

  let index = -1;

  for (let i = targets.length - 1; i >= 0; i--) {
    const t = targets[i];
    if (dist(x, y, t.x, t.y) < t.r + 8) {
      index = i;
      break;
    }
  }

  if (index < 0) {
    combo = 0;
    explode(x, y, "#fff3c9", 5);
    return;
  }

  const t = targets[index];

  if (t.type === "bomb") {
    explode(t.x, t.y, "#ff6e85", 38);
    endGame("Attention aux bombes !");
    return;
  }

  combo = clock - lastHit <= 1.4 ? combo + 1 : 1;
  lastHit = clock;
  popped++;

  const multiplier = min(5, 1 + floor((combo - 1) / 3));
  const points = (t.type === "gold" ? 5 : 1) * multiplier;

  score += points;
  saveBest();
  explode(t.x, t.y, t.color, 22);

  labels.push({
    x: t.x, y: t.y,
    text: "+" + points, life: 1,
    color: "#fff2b4"
  });

  // L’animal libéré s’envole joyeusement.
  particles.push({
    x: t.x, y: t.y + t.r + 20,
    vx: random(-45, 45), vy: -130,
    life: 1.3, maxLife: 1.3,
    animal: t.animal, size: 30
  });

  tone(520 + multiplier * 90, 0.14, "sine", 0.08, 1000);

  if (t.type === "ice") {
    freezeUntil = clock + 4;
    labels.push({
      x: width / 2, y: height / 2,
      text: "❄ RALENTI !", life: 1.5, color: "#c9f8ff"
    });
  }

  targets.splice(index, 1);
}

function endGame(message) {
  state = "over";
  reason = message;
  flash = 1;
  saveBest();
  tone(190, 0.5, "sawtooth", 0.045, 45);
}

function saveBest() {
  if (score <= best) return;
  best = score;

  try {
    localStorage.setItem("safariBest", best);
  } catch (e) {}
}

// ---------- LANCEUR RPG ----------

function drawGun() {
  const g = gunPosition();
  const direction = constrain(
    atan2(aim.x - g.x, g.y - aim.y),
    -1.15, 1.15
  );

  push();
  translate(g.x, g.y + recoil * 7);
  rotate(direction);

  noStroke();

  // Ombre.
  fill(10, 18, 31, 80);
  ellipse(0, 20, 105, 35);

  // Poignée et tube.
  fill("#172a3e");
  rect(-11, -10, 22, 47, 7);

  fill("#29495b");
  rect(-21, -74, 42, 89, 10);

  fill("#5e8990");
  rect(-19, -72, 12, 76, 6);

  fill("#e6bd76");
  rect(-25, -66, 50, 13, 4);
  rect(-24, -18, 48, 11, 4);

  // Bouche du lanceur.
  fill("#172b3e");
  rect(-27, -87, 54, 23, 7);
  fill("#75e4df");
  rect(-21, -86, 42, 6, 3);

  // Viseur.
  fill("#f9d989");
  rect(-5, -98, 10, 13, 3);

  // Emblème.
  fill("#ffe499");
  textAlign(CENTER, CENTER);
  textSize(24);
  text("★", 0, -39);

  if (recoil > 0.6) {
    fill("#fff2b4");
    starShape(0, -105, 8, 21, 6);
  }

  pop();
}

function drawCrosshair() {
  push();
  translate(aim.x, aim.y);
  noFill();
  stroke(255, 246, 207, 210);
  strokeWeight(1.5);
  circle(0, 0, 25 + recoil * 8);
  line(-19, 0, -9, 0);
  line(9, 0, 19, 0);
  line(0, -19, 0, -9);
  line(0, 9, 0, 19);
  pop();
}

function starShape(x, y, inner, outer, count) {
  beginShape();
  for (let i = 0; i < count * 2; i++) {
    const angle = -HALF_PI + i * PI / count;
    const r = i % 2 === 0 ? outer : inner;
    vertex(x + cos(angle) * r, y + sin(angle) * r);
  }
  endShape(CLOSE);
}

// ---------- PARTICULES ----------

function explode(x, y, shade, count) {
  for (let i = 0; i < count; i++) {
    const angle = random(TWO_PI);
    const speed = random(60, 230);

    particles.push({
      x, y,
      vx: cos(angle) * speed,
      vy: sin(angle) * speed,
      life: random(0.4, 0.9),
      maxLife: 0.9,
      size: random(3, 8),
      color: shade
    });
  }
}

function drawEffects(dt) {
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    s.life -= dt;
    if (s.life <= 0) {
      shots.splice(i, 1);
      continue;
    }

    stroke(255, 220, 133, s.life / 0.18 * 170);
    strokeWeight(4);
    line(s.x1, s.y1, s.x2, s.y2);

    noStroke();
    fill("#fff1af");
    const t = constrain((0.18 - s.life) / 0.08, 0, 1);
    starShape(lerp(s.x1, s.x2, t), lerp(s.y1, s.y2, t), 4, 10, 5);
  }

  noStroke();

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (!p.animal) p.vy += 190 * dt;

    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    if (p.animal) {
      push();
      drawingContext.globalAlpha = min(1, p.life * 2);
      textAlign(CENTER, CENTER);
      textSize(p.size);
      text(p.animal, p.x, p.y);
      pop();
    } else {
      const c = color(p.color);
      c.setAlpha(min(255, p.life * 380));
      fill(c);
      starShape(p.x, p.y, p.size * 0.45, p.size, 5);
    }
  }

  for (let i = labels.length - 1; i >= 0; i--) {
    const l = labels[i];
    l.life -= dt;
    l.y -= dt * 35;

    if (l.life <= 0) {
      labels.splice(i, 1);
      continue;
    }

    fill(l.color);
    textAlign(CENTER, CENTER);
    textSize(23);
    text(l.text, l.x, l.y);
  }
}

// ---------- INTERFACE ----------

function drawHUD() {
  noStroke();
  fill(16, 26, 48, 225);
  rect(10, 10, width - 20, 66, 18);

  fill("#fff3cf");
  textAlign(LEFT, TOP);
  textSize(22);
  text("★ " + score, 24, 19);

  fill("#adbdd1");
  textSize(11);
  text("RECORD " + best, 25, 48);

  drawIconButton(width - 35, soundOn ? "♫" : "♪", soundOn);

  if (state === "playing" || state === "paused") {
    drawIconButton(width - 85, state === "paused" ? "▶" : "Ⅱ", true);
  }

  textAlign(CENTER, CENTER);

  if (combo >= 3 && state === "playing") {
    const multiplier = min(5, 1 + floor((combo - 1) / 3));
    fill("#ffe297");
    textSize(19);
    text("COMBO ×" + multiplier, width / 2, wallY() + 30);
  }

  if (clock < freezeUntil && state === "playing") {
    fill("#d0f7ff");
    textSize(16);
    text("❄ " + ceil(freezeUntil - clock) + " s", width / 2, wallY() + 57);
  }
}

function drawIconButton(x, label, active) {
  fill(active ? "#385365" : "#35394c");
  rect(x - 19, 20, 38, 38, 12);

  fill(active ? "#ffe9b0" : "#8390a6");
  textAlign(CENTER, CENTER);
  textSize(22);
  text(label, x, 38);

  if (!active) {
    stroke("#adb6c8");
    strokeWeight(2);
    line(x - 10, 29, x + 10, 48);
    noStroke();
  }
}

function drawOverlay() {
  noStroke();
  fill(9, 18, 34, 185);
  rect(0, 80, width, height - 80);

  const panelWidth = min(width - 28, 420);
  const centerY = max(250, height / 2);
  const left = width / 2 - panelWidth / 2;

  fill("#1d3447");
  stroke("#638782");
  strokeWeight(2);
  rect(left, centerY - 170, panelWidth, 340, 26);
  noStroke();

  textAlign(CENTER, CENTER);

  if (state === "menu") {
    textSize(38);
    text("🐼  🦊  🐯", width / 2, centerY - 122);

    fill("#ffe3a4");
    textSize(min(29, panelWidth / 12));
    text("BALLOON SAFARI", width / 2, centerY - 69);

    fill("#dae8e9");
    textSize(14);
    text("Libère les animaux avant la barrière !", width / 2, centerY - 25);
    text("★ Bonus    ❄ Ralenti    💣 À éviter", width / 2, centerY + 9);
    text("Tirs rapides = combos jusqu’à ×5", width / 2, centerY + 42);

    actionButton("COMMENCER", centerY + 112, panelWidth);
  } else if (state === "paused") {
    fill("#ffe3a4");
    textSize(32);
    text("PAUSE", width / 2, centerY - 45);

    fill("#dae8e9");
    textSize(15);
    text("La savane t’attend…", width / 2, centerY + 10);

    actionButton("REPRENDRE", centerY + 112, panelWidth);
  } else {
    fill("#ffadad");
    textSize(29);
    text("FIN DE L’AVENTURE", width / 2, centerY - 115);

    fill("#dae8e9");
    textSize(13);
    text(reason, width / 2, centerY - 70);

    fill("#ffe3a4");
    textSize(42);
    text(score + " points", width / 2, centerY - 12);

    fill("#dae8e9");
    textSize(15);
    text(popped + " animaux libérés", width / 2, centerY + 34);
    text("Record : " + best, width / 2, centerY + 62);

    actionButton("REJOUER", centerY + 121, panelWidth);
  }
}

function actionButton(label, y, panelWidth) {
  const w = min(panelWidth - 40, 270);
  fill("#152738");
  rect(width / 2 - w / 2, y - 20, w, 46, 13);

  fill("#f4cc7e");
  rect(width / 2 - w / 2, y - 25, w, 46, 13);

  fill("#25394a");
  textSize(16);
  text(label, width / 2, y - 2);
}

function togglePause() {
  if (state === "playing") state = "paused";
  else if (state === "paused") {
    state = "playing";
    if (audioCtx) nextBeat = audioCtx.currentTime;
  }
}

function keyPressed() {
  if (key === " ") {
    togglePause();
    return false;
  }

  if (key === "m" || key === "M") {
    unlockAudio();
    soundOn = !soundOn;
  }
}

// ---------- MUSIQUE SANS BIBLIOTHÈQUE ----------

function unlockAudio() {
  try {
    if (!audioCtx) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      audioCtx = new Audio();
    }

    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (e) {}
}

function tone(frequency, duration, type, volume, endFrequency, when) {
  if (!audioCtx || !soundOn || audioCtx.state !== "running") return;

  const time = when === undefined ? audioCtx.currentTime : when;
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, time);

  if (endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, time + duration);
  }

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(volume, time + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);

  oscillator.start(time);
  oscillator.stop(time + duration + 0.02);
  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
  };
}

function updateMusic() {
  if (!audioCtx || !soundOn || audioCtx.state !== "running") return;

  const now = audioCtx.currentTime;
  if (now < nextBeat) return;

  const bpm = min(136, 100 + popped * 0.45);
  const interval = 60 / bpm / 2;
  nextBeat = now + interval;
  beatPulse = 1;

  // Percussions douces.
  if (beat % 2 === 0) tone(120, 0.12, "sine", 0.09, 42);
  else tone(950, 0.045, "triangle", 0.018, 420);

  // Mélodie pentatonique.
  const melody = [523.25, 659.25, 783.99, 880, 783.99, 659.25, 587.33, 659.25];
  if (beat % 2 === 0) {
    tone(melody[floor(beat / 2) % melody.length], 0.15, "sine", 0.035);
  }

  beat++;
}

function windowResized() {
  const oldWidth = width;
  const oldHeight = height;

  resizeCanvas(windowWidth, windowHeight);

  for (const t of targets) {
    t.baseX *= width / oldWidth;
    t.x *= width / oldWidth;
    t.y = wallY() + (t.y - wallY()) *
      (height - wallY()) / max(1, oldHeight - wallY());
    t.speed *= height / oldHeight;
  }

  aim.x = constrain(aim.x, 0, width);
  aim.y = constrain(aim.y, 0, height);
}