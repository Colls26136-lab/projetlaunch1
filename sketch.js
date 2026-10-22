let balloons = [];
let particles = [];
let score = 0;
let gameOver = false;
let nextLaunch = 0;
const wallHeight = 30;

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);

  canvas.elt.style.touchAction = "none";
  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";

  // Souris, doigt et stylet.
  canvas.elt.addEventListener("pointerdown", (event) => {
    event.preventDefault();

    const bounds = canvas.elt.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * width / bounds.width;
    const y = (event.clientY - bounds.top) * height / bounds.height;

    if (gameOver) {
      restartGame();
    } else {
      shoot(x, y);
    }
  });

  textFont("sans-serif");
}

function draw() {
  background(12, 17, 30);

  // Décor.
  stroke(255, 12);
  strokeWeight(1);
  for (let x = 0; x < width; x += 45) {
    line(x, wallHeight, x, height);
  }
  noStroke();

  // Mur à protéger.
  drawingContext.shadowBlur = 18;
  drawingContext.shadowColor = "#ff405c";
  fill("#ff405c");
  rect(0, 0, width, wallHeight);
  drawingContext.shadowBlur = 0;

  if (!gameOver) {
    if (millis() >= nextLaunch) {
      launchBalloon();
      nextLaunch = millis() + max(400, 1400 - score * 25);
    }

    // Limiter le déplacement après un ralentissement du navigateur.
    const dt = min(deltaTime, 40) / 1000;

    for (const balloon of balloons) {
      balloon.y -= balloon.speed * dt;

      if (balloon.y - balloon.radius <= wallHeight) {
        gameOver = true;
        break;
      }
    }
  }

  for (const balloon of balloons) {
    drawBalloon(balloon);
  }

  updateParticles();

  // Interface.
  fill(255);
  textAlign(LEFT, TOP);
  textSize(22);
  text("🎯 " + score, 18, wallHeight + 18);

  fill(170, 185, 210);
  textAlign(CENTER, BOTTOM);
  textSize(13);
  text("Touche les ballons avant le mur rouge !", width / 2, height - 16);

  if (gameOver) {
    drawGameOver();
  }
}

function launchBalloon() {
  const radius = min(random(24, 38), width / 5);

  balloons.push({
    x: random(radius + 8, width - radius - 8),
    y: height + radius,
    radius,
    speed: height * (0.11 + min(score, 60) * 0.003),
    shade: random([
      "#00d9ff",
      "#ff65b5",
      "#ffd166",
      "#a78bfa",
      "#49e6a0"
    ])
  });
}

function drawBalloon(balloon) {
  const { x, y, radius, shade } = balloon;

  // Ficelle.
  noFill();
  stroke(255, 90);
  strokeWeight(1.5);
  bezier(
    x, y + radius,
    x - 10, y + radius + 15,
    x + 10, y + radius + 28,
    x, y + radius + 42
  );
  noStroke();

  // Halo.
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = shade;

  fill(shade);
  ellipse(x, y, radius * 1.8, radius * 2);

  drawingContext.shadowBlur = 0;

  // Nœud et reflet.
  triangle(
    x, y + radius - 2,
    x - 5, y + radius + 6,
    x + 5, y + radius + 6
  );

  fill(255, 150);
  ellipse(x - radius * 0.3, y - radius * 0.3, radius * 0.25, radius * 0.5);
}

function shoot(x, y) {
  // Commencer par le ballon affiché au premier plan.
  for (let i = balloons.length - 1; i >= 0; i--) {
    const balloon = balloons[i];

    // Zone de tir légèrement élargie pour le tactile.
    if (dist(x, y, balloon.x, balloon.y) <= balloon.radius + 8) {
      for (let j = 0; j < 18; j++) {
        particles.push({
          x: balloon.x,
          y: balloon.y,
          vx: random(-220, 220),
          vy: random(-220, 220),
          life: 1,
          shade: balloon.shade
        });
      }

      balloons.splice(i, 1);
      score++;
      break;
    }
  }
}

function updateParticles() {
  const dt = min(deltaTime, 40) / 1000;

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 250 * dt;
    p.life -= dt * 1.8;

    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    const shade = color(p.shade);
    shade.setAlpha(p.life * 255);
    fill(shade);
    circle(p.x, p.y, 7 * p.life);
  }
}

function drawGameOver() {
  fill(5, 8, 18, 220);
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);

  fill("#ff405c");
  textSize(min(46, width / 9));
  text("GAME OVER", width / 2, height / 2 - 65);

  fill(255);
  textSize(23);
  text("Score : " + score, width / 2, height / 2 - 10);

  fill(180, 195, 220);
  textSize(16);
  text("Touche l’écran pour rejouer", width / 2, height / 2 + 45);
}

function restartGame() {
  balloons = [];
  particles = [];
  score = 0;
  gameOver = false;
  nextLaunch = millis() + 500;
}

function windowResized() {
  const oldWidth = width;
  const oldHeight = height;

  resizeCanvas(windowWidth, windowHeight);

  for (const balloon of balloons) {
    balloon.x *= width / oldWidth;
    balloon.y = wallHeight +
      (balloon.y - wallHeight) *
      (height - wallHeight) / max(1, oldHeight - wallHeight);
    balloon.speed *= height / oldHeight;
  }
}