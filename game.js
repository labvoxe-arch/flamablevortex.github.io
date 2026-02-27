// Blue Cat Steak Chase — a snake-like game
(function () {
  var canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var GRID = 20; // grid cell size in px
  var COLS = canvas.width / GRID;  // 20
  var ROWS = canvas.height / GRID; // 20

  var score = 0;
  var highScore = 0;
  var direction = { x: 1, y: 0 };
  var nextDirection = { x: 1, y: 0 };
  var snake = [];
  var steak = { x: 10, y: 10 };
  var running = false;
  var gameOver = false;
  var loopTimer = null;
  var TICK_MS = 120;

  // Pre-draw blue cat head image (drawn once via offscreen canvas)
  var catHead = document.createElement('canvas');
  catHead.width = GRID;
  catHead.height = GRID;
  var chc = catHead.getContext('2d');

  function drawCatHead(context, x, y, size) {
    var cx = x + size / 2;
    var cy = y + size / 2;
    var r = size * 0.42;
    // ears
    context.fillStyle = '#3b82f6';
    context.beginPath();
    context.moveTo(cx - r * 0.8, cy - r * 0.5);
    context.lineTo(cx - r * 1.1, cy - r * 1.4);
    context.lineTo(cx - r * 0.15, cy - r * 0.9);
    context.closePath();
    context.fill();
    context.beginPath();
    context.moveTo(cx + r * 0.8, cy - r * 0.5);
    context.lineTo(cx + r * 1.1, cy - r * 1.4);
    context.lineTo(cx + r * 0.15, cy - r * 0.9);
    context.closePath();
    context.fill();
    // inner ears
    context.fillStyle = '#93c5fd';
    context.beginPath();
    context.moveTo(cx - r * 0.65, cy - r * 0.55);
    context.lineTo(cx - r * 0.9, cy - r * 1.15);
    context.lineTo(cx - r * 0.25, cy - r * 0.8);
    context.closePath();
    context.fill();
    context.beginPath();
    context.moveTo(cx + r * 0.65, cy - r * 0.55);
    context.lineTo(cx + r * 0.9, cy - r * 1.15);
    context.lineTo(cx + r * 0.25, cy - r * 0.8);
    context.closePath();
    context.fill();
    // face circle
    context.fillStyle = '#5ea6ff';
    context.beginPath();
    context.arc(cx, cy, r, 0, Math.PI * 2);
    context.fill();
    // eyes
    context.fillStyle = '#fff';
    context.beginPath();
    context.arc(cx - r * 0.35, cy - r * 0.15, r * 0.22, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(cx + r * 0.35, cy - r * 0.15, r * 0.22, 0, Math.PI * 2);
    context.fill();
    // pupils
    context.fillStyle = '#0a0e1a';
    context.beginPath();
    context.arc(cx - r * 0.3, cy - r * 0.15, r * 0.12, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(cx + r * 0.4, cy - r * 0.15, r * 0.12, 0, Math.PI * 2);
    context.fill();
    // nose
    context.fillStyle = '#f9a8d4';
    context.beginPath();
    context.moveTo(cx, cy + r * 0.1);
    context.lineTo(cx - r * 0.12, cy + r * 0.25);
    context.lineTo(cx + r * 0.12, cy + r * 0.25);
    context.closePath();
    context.fill();
    // mouth
    context.strokeStyle = '#1e3a5f';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(cx, cy + r * 0.25);
    context.lineTo(cx - r * 0.15, cy + r * 0.45);
    context.moveTo(cx, cy + r * 0.25);
    context.lineTo(cx + r * 0.15, cy + r * 0.45);
    context.stroke();
    // whiskers
    context.strokeStyle = '#93c5fd';
    context.lineWidth = 0.8;
    context.beginPath();
    context.moveTo(cx - r * 0.3, cy + r * 0.15);
    context.lineTo(cx - r * 1.2, cy);
    context.moveTo(cx - r * 0.3, cy + r * 0.25);
    context.lineTo(cx - r * 1.2, cy + r * 0.35);
    context.moveTo(cx + r * 0.3, cy + r * 0.15);
    context.lineTo(cx + r * 1.2, cy);
    context.moveTo(cx + r * 0.3, cy + r * 0.25);
    context.lineTo(cx + r * 1.2, cy + r * 0.35);
    context.stroke();
  }

  function drawSteakIcon(context, x, y, size) {
    var cx = x + size / 2;
    var cy = y + size / 2;
    var r = size * 0.38;
    // steak body
    context.fillStyle = '#b45309';
    context.beginPath();
    context.ellipse(cx, cy, r * 1.1, r * 0.8, -0.2, 0, Math.PI * 2);
    context.fill();
    // inner meat
    context.fillStyle = '#dc2626';
    context.beginPath();
    context.ellipse(cx, cy, r * 0.7, r * 0.5, -0.2, 0, Math.PI * 2);
    context.fill();
    // fat strip
    context.fillStyle = '#fde68a';
    context.beginPath();
    context.ellipse(cx - r * 0.5, cy - r * 0.3, r * 0.35, r * 0.12, -0.6, 0, Math.PI * 2);
    context.fill();
    // bone
    context.fillStyle = '#f5f0e0';
    context.beginPath();
    context.moveTo(cx + r * 0.4, cy + r * 0.2);
    context.lineTo(cx + r * 1.3, cy + r * 0.8);
    context.lineTo(cx + r * 1.15, cy + r * 0.95);
    context.lineTo(cx + r * 0.3, cy + r * 0.4);
    context.closePath();
    context.fill();
    // bone knob
    context.beginPath();
    context.arc(cx + r * 1.25, cy + r * 0.85, r * 0.18, 0, Math.PI * 2);
    context.fill();
  }

  function randomSteakPos() {
    var pos;
    var attempts = 0;
    do {
      pos = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS)
      };
      attempts++;
    } while (isOnSnake(pos.x, pos.y) && attempts < 200);
    return pos;
  }

  function isOnSnake(x, y) {
    for (var i = 0; i < snake.length; i++) {
      if (snake[i].x === x && snake[i].y === y) return true;
    }
    return false;
  }

  function resetGame() {
    var startX = Math.floor(COLS / 2);
    var startY = Math.floor(ROWS / 2);
    snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    steak = randomSteakPos();
    score = 0;
    gameOver = false;
    updateScoreDisplay();
  }

  function updateScoreDisplay() {
    var el = document.getElementById('game-score');
    var hel = document.getElementById('game-high-score');
    if (el) el.textContent = 'Score: ' + score;
    if (hel) hel.textContent = 'Best: ' + highScore;
  }

  function draw() {
    // background
    ctx.fillStyle = '#0d1b3e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // grid lines (subtle)
    ctx.strokeStyle = 'rgba(59,130,246,0.08)';
    ctx.lineWidth = 0.5;
    for (var gx = 0; gx <= COLS; gx++) {
      ctx.beginPath();
      ctx.moveTo(gx * GRID, 0);
      ctx.lineTo(gx * GRID, canvas.height);
      ctx.stroke();
    }
    for (var gy = 0; gy <= ROWS; gy++) {
      ctx.beginPath();
      ctx.moveTo(0, gy * GRID);
      ctx.lineTo(canvas.width, gy * GRID);
      ctx.stroke();
    }

    // draw steak
    drawSteakIcon(ctx, steak.x * GRID, steak.y * GRID, GRID);

    // draw snake body (blue rounded segments)
    for (var i = snake.length - 1; i >= 1; i--) {
      var seg = snake[i];
      var shade = Math.round(40 + (i / snake.length) * 30);
      ctx.fillStyle = 'rgb(' + shade + ',' + (100 + shade) + ',246)';
      ctx.beginPath();
      ctx.arc(seg.x * GRID + GRID / 2, seg.y * GRID + GRID / 2, GRID * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw head as cat face
    var head = snake[0];
    drawCatHead(ctx, head.x * GRID, head.y * GRID, GRID);

    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(10,14,26,0.75)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#5ea6ff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 16);
      ctx.fillStyle = '#93c5fd';
      ctx.font = '16px sans-serif';
      ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 14);
      ctx.fillText('Press Space or Tap to restart', canvas.width / 2, canvas.height / 2 + 40);
    }

    // start screen
    if (!running && !gameOver) {
      ctx.fillStyle = 'rgba(10,14,26,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#5ea6ff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Blue Cat Steak Chase', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillStyle = '#93c5fd';
      ctx.font = '15px sans-serif';
      ctx.fillText('Press Space or Tap to start', canvas.width / 2, canvas.height / 2 + 12);
    }
  }

  function step() {
    direction = nextDirection;
    var head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // wall collision — wrap around
    if (head.x < 0) head.x = COLS - 1;
    if (head.x >= COLS) head.x = 0;
    if (head.y < 0) head.y = ROWS - 1;
    if (head.y >= ROWS) head.y = 0;

    // self collision
    if (isOnSnake(head.x, head.y)) {
      gameOver = true;
      running = false;
      if (score > highScore) highScore = score;
      updateScoreDisplay();
      clearInterval(loopTimer);
      draw();
      return;
    }

    snake.unshift(head);

    // eat steak?
    if (head.x === steak.x && head.y === steak.y) {
      score++;
      updateScoreDisplay();
      steak = randomSteakPos();
      // speed up slightly every 5 points
      if (score % 5 === 0 && TICK_MS > 60) {
        TICK_MS -= 8;
        clearInterval(loopTimer);
        loopTimer = setInterval(step, TICK_MS);
      }
    } else {
      snake.pop();
    }

    draw();
  }

  function startGame() {
    if (running) return;
    resetGame();
    TICK_MS = 120;
    running = true;
    loopTimer = setInterval(step, TICK_MS);
  }

  // controls
  document.addEventListener('keydown', function (e) {
    var key = e.key;
    // start / restart
    if (key === ' ' || key === 'Spacebar') {
      e.preventDefault();
      if (!running) startGame();
      return;
    }
    // direction changes
    if ((key === 'ArrowUp' || key === 'w' || key === 'W') && direction.y === 0) {
      nextDirection = { x: 0, y: -1 };
    } else if ((key === 'ArrowDown' || key === 's' || key === 'S') && direction.y === 0) {
      nextDirection = { x: 0, y: 1 };
    } else if ((key === 'ArrowLeft' || key === 'a' || key === 'A') && direction.x === 0) {
      nextDirection = { x: -1, y: 0 };
    } else if ((key === 'ArrowRight' || key === 'd' || key === 'D') && direction.x === 0) {
      nextDirection = { x: 1, y: 0 };
    }
  });

  // canvas tap to start/restart
  canvas.addEventListener('click', function () {
    if (!running) startGame();
  });

  // mobile buttons
  var btnUp = document.getElementById('btn-up');
  var btnDown = document.getElementById('btn-down');
  var btnLeft = document.getElementById('btn-left');
  var btnRight = document.getElementById('btn-right');

  if (btnUp) btnUp.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!running) { startGame(); return; }
    if (direction.y === 0) nextDirection = { x: 0, y: -1 };
  });
  if (btnDown) btnDown.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!running) { startGame(); return; }
    if (direction.y === 0) nextDirection = { x: 0, y: 1 };
  });
  if (btnLeft) btnLeft.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!running) { startGame(); return; }
    if (direction.x === 0) nextDirection = { x: -1, y: 0 };
  });
  if (btnRight) btnRight.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!running) { startGame(); return; }
    if (direction.x === 0) nextDirection = { x: 1, y: 0 };
  });

  // initial draw
  resetGame();
  draw();
})();
