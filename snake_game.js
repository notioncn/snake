const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const difficultySelect = document.getElementById('difficultySelect');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{x: 10, y: 10}];
let food = {x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount)};
let direction = {x: 0, y: 0};
let score = 0;
let lives = 3;
let gameSpeed = 200;
let isPaused = false;
let highScores = JSON.parse(localStorage.getItem('snakeHighScores')) || [];
let isGameRunning = false;

// 音效
const eatSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'+Array(300).join('0'));
const gameOverSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'+Array(500).join('1'));

// 难度设置
const difficulties = {
    easy: { speed: 200, obstacleCount: 3 },
    medium: { speed: 150, obstacleCount: 5 },
    hard: { speed: 100, obstacleCount: 7 }
};

difficultySelect.addEventListener('change', (e) => {
    const difficulty = difficulties[e.target.value];
    gameSpeed = difficulty.speed;
    resetGame();
});

// 更新排行榜显示
function updateLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '';
    
    const recentScores = [...highScores].reverse().slice(0, 10);
    
    recentScores.forEach((score, index) => {
        const li = document.createElement('li');
        li.className = 'leaderboard-item';
        li.innerHTML = `<span>${index + 1}.</span><span>${score.name}</span><span>${score.score}</span>`;
        li.addEventListener('click', () => {
            alert(`玩家: ${score.name}\n得分: ${score.score}\n时间: ${score.date}`);
        });
        leaderboardList.appendChild(li);
    });
}

// 添加移动端控制按钮事件
document.querySelectorAll('.arrow').forEach(btn => {
    btn.addEventListener('touchstart', (e) => {
        const key = e.target.getAttribute('data-key');
        handleTouch(key);
        e.preventDefault();
    }, {passive: false});
});

const mobileControls = document.getElementById('mobileControls');
window.addEventListener('resize', () => {
    mobileControls.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
});
mobileControls.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
const generateRandomMaze = (size) => {
  const maze = Array(size).fill().map(() => Array(size).fill(1));
  const divide = (x, y, width, height) => {
    if (width < 3 || height < 3) return;
    const vertical = Math.random() > 0.5;
    const wx = x + (vertical ? 0 : 2 + Math.floor(Math.random()*(width-2)));
    const wy = y + (vertical ? 2 + Math.floor(Math.random()*(height-2)) : 0);
    const px = wx + (vertical ? Math.floor(Math.random()*(width)) : 0);
    const py = wy + (vertical ? 0 : Math.floor(Math.random()*(height)));
    
    for(let i=vertical ? y : wy; i < (vertical ? y+height : wy+1); i++) {
      for(let j=vertical ? wx : x; j < (vertical ? wx+1 : x+width); j++) {
        if(!(i === py && j === px)) maze[i][j] = 0;
      }
    }
    divide(x, y, vertical ? wx-x : width, vertical ? height : wy-y);
    divide(vertical ? wx+1 : x, vertical ? y : wy+1, vertical ? x+width-wx-1 : width, vertical ? height : y+height-wy-1);
  };
  divide(0, 0, size, size);
  return maze;
};
const obstacles = [];

function generateMazeObstacles() {
  const obstacles = [];
  mazePattern.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === 1) {
        obstacles.push({x: x, y: y});
      }
    });
  });
  return obstacles;
}

// 添加开始按钮事件监听
document.getElementById('startBtn').addEventListener('click', () => {
    if (!isGameRunning) {
        isGameRunning = true;
        isPaused = false;
        resetGame();
        gameLoop();
    } else {
        isPaused = !isPaused;
    }
});

function resetGame() {
    isGameRunning = false;
    if (lives <= 0) {  // 修改判断条件为生命值耗尽
        const result = confirm(`游戏结束！你的得分是：${score}\n是否要重新开始游戏？`);
        if (result) {
            // 保留原有记录分数逻辑
            const playerName = prompt('请输入你的名字：');
            if (playerName) {
                highScores.push({ name: playerName, score: score, date: new Date().toLocaleString() });
                highScores = highScores.slice(-10);
                localStorage.setItem('snakeHighScores', JSON.stringify(highScores));
                updateLeaderboard();
            }
        } else {
            isPaused = true;
            return;
        }
    }

    const mazeSize = 20;
    mazePattern = generateRandomMaze(mazeSize);
    snake = [{x: 10, y: 10}];
    direction = {x: 0, y: 0};
    score = 0;
    lives = 3;
    gameSpeed = difficulties[difficultySelect.value].speed;
    obstacles.length = 0;
    const difficulty = difficulties[difficultySelect.value];
    obstacles.push(...Array(difficulty.obstacleCount).fill().map(() => ({
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    })));
}

// 添加暂停功能
window.addEventListener('keydown', e => {
    function handleTouch(key) {
        if(key === 'Space') {
            isPaused = !isPaused;
        } else {
            switch (key) {
                case 'ArrowUp':
                case 'KeyW':
                    if (direction.y === 0) direction = {x: 0, y: -1};
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    if (direction.y === 0) direction = {x: 0, y: 1};
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    if (direction.x === 0) direction = {x: -1, y: 0};
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    if (direction.x === 0) direction = {x: 1, y: 0};
                    break;
            }
        }
        event.preventDefault();
    }

    handleTouch(e.code);
    // 添加移动端触摸事件监听
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('touchstart', (e) => {
            const key = e.target.getAttribute('data-key');
            handleTouch(key);
            e.preventDefault();
        }, {passive: false});
    });
});

function generateObstacles() {
  const obs = [];
  for(let i = 0; i < 3; i++) {
    obs.push({
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    });
  }
  return obs;
}

function update() {
    if (lives <= 0) {
        resetGame();
        return;
    }

    const head = {x: snake[0].x + direction.x, y: snake[0].y + direction.y};

    // 添加障碍物碰撞检测
    if (obstacles.some(obs => obs.x === head.x && obs.y === head.y)) {
        lives--;
        gameSpeed = Math.min(gameSpeed + 20, 200);
        if(lives <= 0) {
            resetGame();
            return;
        }
        return; // 碰到障碍物后暂停一帧
    }

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount || snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        resetGame();
        return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        food = {x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount)};
        eatSound.play();
        // 根据分数提高游戏速度
        gameSpeed = Math.max(difficulties[difficultySelect.value].speed - score * 2, 50);
    } else {
        snake.pop();
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scalePattern = () => {
  const patternCanvas = document.createElement('canvas');
  const pctx = patternCanvas.getContext('2d');
  patternCanvas.width = patternCanvas.height = 20;
  pctx.fillStyle = '#4CAF50';
  pctx.fillRect(0, 0, 20, 20);
  pctx.fillStyle = '#2E7D32';
  pctx.beginPath();
  pctx.arc(10, 10, 6, 0, Math.PI*2);
  pctx.fill();
  return ctx.createPattern(patternCanvas, 'repeat');
};
    snake.forEach((segment, index) => {
      ctx.beginPath();
      ctx.roundRect(
        segment.x * gridSize + 2,
        segment.y * gridSize + 2,
        gridSize - 4,
        gridSize - 4,
        8
      );
      ctx.fillStyle = scalePattern();
      ctx.fill();
    });

    ctx.fillStyle = '#f00';
ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);

    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('得分: ' + score, 10, 30);

    // 绘制障碍物
    ctx.fillStyle = '#00f';
    obstacles.forEach(obs => {
        ctx.fillRect(obs.x * gridSize, obs.y * gridSize, gridSize, gridSize);
    });

    // 显示操作提示
    ctx.fillText('暂停: 空格键', canvas.width/2 - 60, 30);
    // 显示生命值
    ctx.fillText('生命: ' + lives, canvas.width - 120, 30);
}

function gameLoop() {
    if (isGameRunning && !isPaused) {
        update();
        draw();
    }
    setTimeout(gameLoop, gameSpeed);
}