// 游戏配置
const config = {
    gridSize: 20, // 网格大小
    boardWidth: Math.min(window.innerWidth * (window.innerWidth <= 600 ? 0.95 : 0.7), window.innerHeight * 0.8),
    boardHeight: Math.min(window.innerHeight * (window.innerWidth <= 600 ? 0.7 : 0.6), window.innerWidth * 0.8),
    initialSpeed: 150, // 初始速度（毫秒）
    speedIncrease: 3, // 每吃一个食物增加的速度
    // 难度设置
    difficulty: {
        easy: {
            speed: 180, // 初级难度速度慢
            obstacleCount: 5 // 初级难度障碍物少
        },
        medium: {
            speed: 130, // 中级难度速度适中
            obstacleCount: 10 // 中级难度障碍物适中
        },
        hard: {
            speed: 90, // 地狱级难度速度快
            obstacleCount: 15 // 地狱级难度障碍物多
        }
    },
    maxLives: 10 // 最大生命值
};

// 方向常量
const Direction = {
    UP: 'UP',
    DOWN: 'DOWN',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT'
};

// 游戏状态
let snake = [];
let food = {};
let obstacles = []; // 障碍物数组
let direction = Direction.RIGHT;
let nextDirection = Direction.RIGHT;
let score = 0;
let lives = config.maxLives; // 生命值
let gameInterval = null;
let isPaused = false;
let gameSpeed = config.initialSpeed;
let currentDifficulty = 'medium'; // 默认中级难度
let startTime = null; // 游戏开始时间
let elapsedTime = 0; // 已经过时间（毫秒）
let timerInterval = null; // 计时器间隔

// DOM 元素
const gameBoard = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives'); // 生命值显示元素
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');
const easyButton = document.getElementById('easy-btn'); // 初级难度按钮
const mediumButton = document.getElementById('medium-btn'); // 中级难度按钮
const hardButton = document.getElementById('hard-btn'); // 地狱级难度按钮

// 计时器函数
function startTimer() {
    if (!startTime) {
        startTime = Date.now() - elapsedTime;
    }
    
    if (!timerInterval) {
        timerInterval = setInterval(() => {
            elapsedTime = Date.now() - startTime;
            updateScore();
        }, 1000);
    }
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    stopTimer();
    startTime = null;
    elapsedTime = 0;
}

// 初始化游戏
function initGame() {
    console.log('开始初始化游戏...');
    
    // 确保游戏板可见并设置正确尺寸
    gameBoard.style.display = 'block';
    gameBoard.style.width = `${config.boardWidth}px`;
    gameBoard.style.height = `${config.boardHeight}px`;
    
    // 清空游戏板
    gameBoard.innerHTML = '';
    
    console.log('游戏板元素:', gameBoard);
    if (!gameBoard) {
        console.error('错误：未找到游戏板元素');
        return;
    }
    
    // 重置游戏状态
    snake = [
        { x: 5, y: 10 },
        { x: 4, y: 10 },
        { x: 3, y: 10 }
    ];
    direction = Direction.RIGHT;
    nextDirection = Direction.RIGHT;
    score = 0;
    lives = config.maxLives; // 重置生命值
    gameSpeed = config.difficulty[currentDifficulty].speed; // 根据难度设置速度
    isPaused = false;
    resetTimer(); // 重置计时器
    
    // 更新分数和生命值显示
    updateScore();
    updateLives();
    
    // 生成食物
    generateFood();
    
    // 生成障碍物
    generateObstacles();
    
    // 绘制蛇、食物和障碍物
    drawSnake();
    drawFood();
    drawObstacles();
    
    // 隐藏游戏结束界面
    gameOverElement.style.display = 'none';
    
    // 添加调试日志验证绘图元素
    console.log('游戏板实际尺寸:', gameBoard.offsetWidth, 'x', gameBoard.offsetHeight);
    setTimeout(() => {
        console.log('DOM元素状态:', {
            snake: document.querySelectorAll('.snake-segment').length,
            food: document.querySelectorAll('.food').length,
            obstacles: document.querySelectorAll('.obstacle').length
        });
    }, 100);
}

// 开始游戏
function startGame() {
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    
    gameInterval = setInterval(moveSnake, gameSpeed);
    startButton.textContent = '重新开始';
    pauseButton.textContent = '暂停'; // 确保暂停按钮显示正确
    isPaused = false;
    startTimer(); // 开始计时
}

// 暂停游戏
function pauseGame() {
    if (isPaused) {
        gameInterval = setInterval(moveSnake, gameSpeed);
        pauseButton.textContent = '暂停';
        isPaused = false;
        startTimer(); // 继续计时
    } else {
        clearInterval(gameInterval);
        pauseButton.textContent = '继续';
        isPaused = true;
        stopTimer(); // 暂停计时
    }
}

// 游戏结束
function gameOver() {
    clearInterval(gameInterval);
    gameInterval = null;
    stopTimer(); // 停止计时
    finalScoreElement.textContent = score;
    gameOverElement.style.display = 'block';
}

// 更新分数
function updateScore() {
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    scoreElement.textContent = `得分: ${score} | 时间: ${timeStr}`;
}

// 更新生命值
function updateLives() {
    if (livesElement) {
        livesElement.innerHTML = '';
        for (let i = 0; i < config.maxLives; i++) {
            const lifeIcon = document.createElement('span');
            lifeIcon.className = i < lives ? 'life-icon active' : 'life-icon';
            livesElement.appendChild(lifeIcon);
        }
    }
}

// 生成障碍物
function generateObstacles() {
    // 清空现有障碍物
    obstacles = [];
    
    // 计算可用的网格数
    const gridWidth = Math.floor(config.boardWidth / config.gridSize);
    const gridHeight = Math.floor(config.boardHeight / config.gridSize);
    
    // 根据当前难度确定障碍物数量
    const obstacleCount = config.difficulty[currentDifficulty].obstacleCount;
    
    // 随机生成障碍物位置
    for (let i = 0; i < obstacleCount; i++) {
        let obstaclePosition;
        let isValid;
        
        do {
            isValid = true;
            obstaclePosition = {
                x: Math.floor(Math.random() * gridWidth),
                y: Math.floor(Math.random() * gridHeight)
            };
            
            // 检查障碍物是否与蛇重叠
            for (let segment of snake) {
                if (segment.x === obstaclePosition.x && segment.y === obstaclePosition.y) {
                    isValid = false;
                    break;
                }
            }
            
            // 检查障碍物是否与食物重叠
            if (food.x === obstaclePosition.x && food.y === obstaclePosition.y) {
                isValid = false;
            }
            
            // 检查障碍物是否与其他障碍物重叠
            for (let obstacle of obstacles) {
                if (obstacle.x === obstaclePosition.x && obstacle.y === obstaclePosition.y) {
                    isValid = false;
                    break;
                }
            }
            
            // 确保蛇头周围有足够的空间
            const headSafeDistance = 3;
            if (Math.abs(obstaclePosition.x - snake[0].x) < headSafeDistance && 
                Math.abs(obstaclePosition.y - snake[0].y) < headSafeDistance) {
                isValid = false;
            }
            
        } while (!isValid);
        
        obstacles.push(obstaclePosition);
    }
}

// 绘制障碍物
function drawObstacles() {
    // 移除旧的障碍物
    const oldObstacles = document.querySelectorAll('.obstacle');
    oldObstacles.forEach(obstacle => obstacle.remove());
    
    // 绘制新的障碍物
    obstacles.forEach(obstacle => {
        const obstacleElement = document.createElement('div');
        obstacleElement.className = 'obstacle';
        obstacleElement.style.width = `${config.gridSize}px`;
        obstacleElement.style.height = `${config.gridSize}px`;
        obstacleElement.style.position = 'absolute';
        obstacleElement.style.left = `${obstacle.x * config.gridSize}px`;
        obstacleElement.style.top = `${obstacle.y * config.gridSize}px`;
        obstacleElement.style.backgroundColor = '#8B4513'; // 棕色障碍物
        obstacleElement.style.borderRadius = '2px';
        obstacleElement.style.zIndex = '8'; // 确保障碍物在适当的层级
        
        gameBoard.appendChild(obstacleElement);
    });
}

// 生成食物
function generateFood() {
    // 计算可用的网格数
    const gridWidth = Math.floor(config.boardWidth / config.gridSize);
    const gridHeight = Math.floor(config.boardHeight / config.gridSize);
    
    // 随机生成食物位置
    let foodPosition;
    let isValid;
    
    do {
        isValid = true;
        foodPosition = {
            x: Math.floor(Math.random() * gridWidth),
            y: Math.floor(Math.random() * gridHeight)
        };
        
        // 检查食物是否在蛇身上
        for (let segment of snake) {
            if (segment.x === foodPosition.x && segment.y === foodPosition.y) {
                isValid = false;
                break;
            }
        }
        
        // 检查食物是否与障碍物重叠
        for (let obstacle of obstacles) {
            if (obstacle.x === foodPosition.x && obstacle.y === foodPosition.y) {
                isValid = false;
                break;
            }
        }
        
    } while (!isValid);
    
    food = foodPosition;
}

// 绘制蛇
function drawSnake() {
    // 移除旧的蛇段
    const oldSegments = document.querySelectorAll('.snake-segment');
    oldSegments.forEach(segment => segment.remove());
    
    // 绘制新的蛇
    snake.forEach((segment, index) => {
        const snakeSegment = document.createElement('div');
        snakeSegment.className = 'snake-segment';
        snakeSegment.style.width = `${config.gridSize}px`;
        snakeSegment.style.height = `${config.gridSize}px`;
        snakeSegment.style.position = 'absolute';
        snakeSegment.style.left = `${segment.x * config.gridSize}px`;
        snakeSegment.style.top = `${segment.y * config.gridSize}px`;
        snakeSegment.style.zIndex = '10'; // 确保蛇在最上层
        
        // 蛇头和蛇身使用不同颜色
        if (index === 0) {
            snakeSegment.style.backgroundColor = '#2E8B57'; // 深绿色蛇头
            snakeSegment.style.borderRadius = '4px';
        } else {
            snakeSegment.style.backgroundColor = '#3CB371'; // 中绿色蛇身
            snakeSegment.style.borderRadius = '2px';
        }
        
        gameBoard.appendChild(snakeSegment);
    });
}

// 绘制食物
function drawFood() {
    // 移除旧的食物元素
    const oldFood = document.querySelectorAll('.food');
    oldFood.forEach(food => food.remove());
    
    // 创建新的食物元素
    const foodElement = document.createElement('div');
    foodElement.style.zIndex = '9';
    foodElement.className = 'food';
    foodElement.style.width = `${config.gridSize}px`;
    foodElement.style.height = `${config.gridSize}px`;
    foodElement.style.position = 'absolute';
    foodElement.style.left = `${food.x * config.gridSize}px`;
    foodElement.style.top = `${food.y * config.gridSize}px`;
    foodElement.style.backgroundColor = '#FF4500'; // 红橙色食物
    foodElement.style.borderRadius = '50%'; // 圆形食物
    
    gameBoard.appendChild(foodElement);
}

// 移动蛇
function moveSnake() {
    // 更新方向
    direction = nextDirection;
    
    // 获取蛇头位置
    const head = { ...snake[0] };
    
    // 根据方向移动蛇头
    switch (direction) {
        case Direction.UP:
            head.y -= 1;
            break;
        case Direction.DOWN:
            head.y += 1;
            break;
        case Direction.LEFT:
            head.x -= 1;
            break;
        case Direction.RIGHT:
            head.x += 1;
            break;
    }
    
    // 检查碰撞
    const collisionResult = checkCollision(head);
    if (collisionResult === true) {
        gameOver();
        return;
    }
    
    // 将新头部添加到蛇数组的前面
    snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        // 增加分数
        score += 10;
        updateScore();
        
        // 生成新食物
        generateFood();
        
        // 随机调整障碍物数量和位置
        const currentObstacleCount = config.difficulty[currentDifficulty].obstacleCount;
        const randomChange = Math.floor(Math.random() * 5) - 2; // -2到2的随机数
        config.difficulty[currentDifficulty].obstacleCount = Math.max(3, Math.min(20, currentObstacleCount + randomChange));
        generateObstacles();
        
        // 增加游戏速度（仅在非障碍物碰撞时）
        if (collisionResult !== 'obstacle') {
            gameSpeed = Math.max(50, gameSpeed - config.speedIncrease);
            clearInterval(gameInterval);
            gameInterval = setInterval(moveSnake, gameSpeed);
        }
    } else {
        // 如果没有吃到食物，移除蛇尾
        snake.pop();
    }
    
    // 重新绘制蛇、食物和障碍物
    drawSnake();
    drawFood();
    drawObstacles();
}

// 检查碰撞
function checkCollision(head) {
    const gridWidth = config.boardWidth / config.gridSize;
    const gridHeight = config.boardHeight / config.gridSize;
    
    // 穿墙处理
    if (head.x < 0) {
        head.x = gridWidth - 1;
    } else if (head.x >= gridWidth) {
        head.x = 0;
    }
    if (head.y < 0) {
        head.y = gridHeight - 1;
    } else if (head.y >= gridHeight) {
        head.y = 0;
    }
    
    // 检查是否撞到自己（从第二个段开始检查，因为头部不可能撞到自己）
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    // 检查是否撞到障碍物
    for (let obstacle of obstacles) {
        if (head.x === obstacle.x && head.y === obstacle.y) {
            // 减少生命值
            lives--;
            updateLives();
            
            // 如果生命值为0，游戏结束
            if (lives <= 0) {
                return true;
            }
            
            // 否则，移除这个障碍物
            obstacles = obstacles.filter(o => !(o.x === obstacle.x && o.y === obstacle.y));
            drawObstacles();
            
            // 不结束游戏，但返回特殊值表示碰到了障碍物
            return 'obstacle';
        }
    }
    
    return false;
}

// 处理键盘输入
function handleKeydown(event) {
    // 防止方向键滚动页面
    if ([37, 38, 39, 40].includes(event.keyCode)) {
        event.preventDefault();
    }
    
    // 只有在游戏运行时才处理方向键
    if (!gameInterval || isPaused) return;
    
    // 根据按键设置下一个方向
    switch (event.keyCode) {
        case 38: // 上箭头
            if (direction !== Direction.DOWN) {
                nextDirection = Direction.UP;
            }
            break;
        case 40: // 下箭头
            if (direction !== Direction.UP) {
                nextDirection = Direction.DOWN;
            }
            break;
        case 37: // 左箭头
            if (direction !== Direction.RIGHT) {
                nextDirection = Direction.LEFT;
            }
            break;
        case 39: // 右箭头
            if (direction !== Direction.LEFT) {
                nextDirection = Direction.RIGHT;
            }
            break;
    }
}

// 处理方向按钮点击
function handleDirectionButtonClick(direction) {
    // 只有在游戏运行时才处理方向按钮
    if (!gameInterval || isPaused) return;
    
    switch (direction) {
        case 'up':
            if (direction !== Direction.DOWN) {
                nextDirection = Direction.UP;
            }
            break;
        case 'down':
            if (direction !== Direction.UP) {
                nextDirection = Direction.DOWN;
            }
            break;
        case 'left':
            if (direction !== Direction.RIGHT) {
                nextDirection = Direction.LEFT;
            }
            break;
        case 'right':
            if (direction !== Direction.LEFT) {
                nextDirection = Direction.RIGHT;
            }
            break;
    }
}

// 设置难度
function setDifficulty(difficulty) {
    currentDifficulty = difficulty;
    // 更新难度按钮样式
    if (easyButton) easyButton.classList.toggle('active', difficulty === 'easy');
    if (mediumButton) mediumButton.classList.toggle('active', difficulty === 'medium');
    if (hardButton) hardButton.classList.toggle('active', difficulty === 'hard');
    
    // 如果游戏正在运行，重新开始游戏
    if (gameInterval) {
        initGame();
        startGame();
    }
}

// 事件监听
document.addEventListener('keydown', handleKeydown);
startButton.addEventListener('click', function() {
    initGame();
    startGame();
});
pauseButton.addEventListener('click', pauseGame);
restartButton.addEventListener('click', function() {
    initGame();
    startGame();
});

// 难度按钮事件监听
if (easyButton) {
    easyButton.addEventListener('click', function() {
        setDifficulty('easy');
    });
}

if (mediumButton) {
    mediumButton.addEventListener('click', function() {
        setDifficulty('medium');
    });
}

if (hardButton) {
    hardButton.addEventListener('click', function() {
        setDifficulty('hard');
    });
}

// 方向按钮事件监听
const upButton = document.getElementById('up-btn');
const downButton = document.getElementById('down-btn');
const leftButton = document.getElementById('left-btn');
const rightButton = document.getElementById('right-btn');

upButton.addEventListener('click', function() {
    handleDirectionButtonClick('up');
});
downButton.addEventListener('click', function() {
    handleDirectionButtonClick('down');
});
leftButton.addEventListener('click', function() {
    handleDirectionButtonClick('left');
});
rightButton.addEventListener('click', function() {
    handleDirectionButtonClick('right');
});

// 初始化游戏
document.addEventListener('DOMContentLoaded', function() {
    initGame();
});