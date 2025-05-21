const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 400;

const scoreElem = document.getElementById("score");
const messageElem = document.getElementById("message");
const startBtn = document.getElementById("startBtn");

let keys = {};
let gravity = 0.5;
let gameRunning = false;

const player = {
  x: 50,
  y: 0,
  width: 40,
  height: 40,
  vx: 0,
  vy: 0,
  speed: 4,
  jumpPower: 12,
  onGround: false,
};

const groundHeight = 50;
let score = 0;
let scrollX = 0;

// ステージサイズ（横幅）
const stageWidth = 2400; // 3画面分
const blocks = [];
const blockSize = 40;

// 敵とコイン用配列
const enemies = [];
const coins = [];

// 音声
const sounds = {
  jump: new Audio("assets/jump.wav"),
  coin: new Audio("assets/coin.mp3"),
  gameover: new Audio("assets/gameover.wav"),
};

function createStage() {
  blocks.length = 0;
  enemies.length = 0;
  coins.length = 0;
  // 地面ブロック
  for(let i=0; i < stageWidth / blockSize; i++) {
    blocks.push({x: i*blockSize, y: canvas.height - groundHeight, width: blockSize, height: groundHeight});
  }
  // 障害物ブロックを数個設置
  blocks.push({x: 300, y: canvas.height - groundHeight - blockSize, width: blockSize, height: blockSize});
  blocks.push({x: 600, y: canvas.height - groundHeight - 2*blockSize, width: blockSize, height: blockSize});
  blocks.push({x: 850, y: canvas.height - groundHeight - blockSize, width: blockSize, height: blockSize});
  blocks.push({x: 1300, y: canvas.height - groundHeight - blockSize, width: blockSize, height: blockSize});
  
  // 敵の配置
  enemies.push({x: 400, y: canvas.height - groundHeight - 40, width: 40, height: 40, direction: 1, speed: 2});
  enemies.push({x: 1000, y: canvas.height - groundHeight - 40, width: 40, height: 40, direction: -1, speed: 2});
  enemies.push({x: 1700, y: canvas.height - groundHeight - 40, width: 40, height: 40, direction: 1, speed: 3});
  
  // コインの配置
  coins.push({x: 320, y: canvas.height - groundHeight - 70, width: 20, height: 20, collected: false});
  coins.push({x: 620, y: canvas.height - groundHeight - 110, width: 20, height: 20, collected: false});
  coins.push({x: 900, y: canvas.height - groundHeight - 70, width: 20, height: 20, collected: false});
  coins.push({x: 1350, y: canvas.height - groundHeight - 70, width: 20, height: 20, collected: false});
  coins.push({x: 1750, y: canvas.height - groundHeight - 70, width: 20, height: 20, collected: false});
}

function resetGame() {
  player.x = 50;
  player.y = canvas.height - groundHeight - player.height;
  player.vx = 0;
  player.vy = 0;
  player.onGround = true;
  score = 0;
  scrollX = 0;
  messageElem.textContent = "";
  createStage();
  gameRunning = true;
}

function update() {
  if(!gameRunning) return;

  // プレイヤーの操作
  if(keys["ArrowLeft"]) player.vx = -player.speed;
  else if(keys["ArrowRight"]) player.vx = player.speed;
  else player.vx = 0;

  // ジャンプ
  if(keys["Space"] && player.onGround) {
    player.vy = -player.jumpPower;
    player.onGround = false;
    sounds.jump.play();
  }

  // 重力
  player.vy += gravity;

  // 水平方向移動の衝突判定（壁）
  let nextX = player.x + player.vx;
  if(nextX < 0) nextX = 0;
  if(nextX + player.width > stageWidth) nextX = stageWidth - player.width;

  // 縦方向の移動と衝突判定
  let nextY = player.y + player.vy;

  // 地面とブロックの当たり判定
  player.onGround = false;
  for(const block of blocks) {
    // 横判定は次X
    if(nextX + player.width > block.x && nextX < block.x + block.width) {
      // 縦判定は次Y
      if(nextY + player.height > block.y && player.y + player.height <= block.y) {
        // 着地
        nextY = block.y - player.height;
        player.vy = 0;
        player.onGround = true;
      }
    }
  }

  player.x = nextX;
  player.y = nextY;

  // スクロール処理（プレイヤーが画面の真ん中より右に行ったらスクロール）
  if(player.x - scrollX > canvas.width / 2) {
    scrollX = player.x - canvas.width / 2;
    if(scrollX > stageWidth - canvas.width) scrollX = stageWidth - canvas.width;
  }

  // 敵の動き
  for(const enemy of enemies) {
    enemy.x += enemy.speed * enemy.direction;
    // 壁で方向転換
    if(enemy.x < 0 || enemy.x + enemy.width > stageWidth) enemy.direction *= -1;
  }

  // 衝突判定（敵）
  for(const enemy of enemies) {
    if(rectIntersect(player, enemy)) {
      gameOver();
      return;
    }
  }

  // コインの取得判定
  for(const coin of coins) {
    if(!coin.collected && rectIntersect(player, coin)) {
      coin.collected = true;
      score++;
      scoreElem.textContent = score;
      sounds.coin.play();
    }
  }
}

function rectIntersect(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 背景
  ctx.fillStyle = "#87ceeb"; // 空色
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 地面グラデーション
  const grad = ctx.createLinearGradient(0, canvas.height - groundHeight, 0, canvas.height);
  grad.addColorStop(0, "#2ecc71");
  grad.addColorStop(1, "#27ae60");
  ctx.fillStyle = grad;
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  // スクロールを考慮して描画
  ctx.save();
  ctx.translate(-scrollX, 0);

  // ブロック
  ctx.fillStyle = "#8e44ad";
  for(const block of blocks) {
    ctx.fillRect(block.x, block.y, block.width, block.height);
  }

  // 敵
  ctx.fillStyle = "#a0522d";
  for(const enemy of enemies) {
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  }

  // コイン（星）
  ctx.fillStyle = "yellow";
  for(const coin of coins) {
    if(!coin.collected) {
      // 星形を描く簡易版
      drawStar(ctx, coin.x, coin.y, 5, 10, 5);
    }
  }

  // プレイヤー
  ctx.fillStyle = "red";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.restore();
}


function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  let step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}
