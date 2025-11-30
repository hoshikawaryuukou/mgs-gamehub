// ==================== 常數設定 ====================
const CONFIG = {
    // 畫布設定 (4:3 比例)
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,

    // 角色設定
    CHARACTER_RADIUS: 20,
    PLAYER_COLOR: '#4CAF50',
    PLAYER_COLOR_INVINCIBLE: '#81C784',
    ENEMY_COLOR: '#E53935',

    // 雪球設定
    SNOWBALL_RADIUS: 8,
    SNOWBALL_COLOR: '#FFFFFF',
    SNOWBALL_FLIGHT_TIME: 1000, // 毫秒

    // 數值設定
    PLAYER_HITS_TO_KNOCKOUT: 3,
    ENEMY_HITS_TO_KNOCKOUT: 2,
    PLAYER_LIVES: 3,
    THROW_COOLDOWN: 500, // 毫秒
    INVINCIBLE_TIME: 1000, // 毫秒
    STUN_TIME: 500, // 毫秒
    MAX_CHARGE_TIME: 800, // 毫秒

    // AI 設定
    AI_THROW_INTERVAL_MIN: 500,
    AI_THROW_INTERVAL_MAX: 1000,
    AI_MOVE_INTERVAL: 2000,

    // 關卡設定
    LEVELS: [
        { enemies: 5 },
        { enemies: 10 },
        { enemies: 20 }
    ],

    // 區域設定
    PLAYER_SPAWN_AREA: { minY: 0.6, maxY: 0.9 },
    ENEMY_SPAWN_AREA: { minY: 0.1, maxY: 0.4 }
};

// ==================== 角色狀態 ====================
const CharacterState = {
    IDLE: 'idle',
    MOVING: 'moving',
    CHARGING: 'charging',
    THROWING: 'throwing',
    STUNNED: 'stunned',
    INVINCIBLE: 'invincible'
};

// ==================== AI 行為狀態 ====================
const AIBehaviorState = {
    MOVING: 'moving',           // 移動中
    WAIT_BEFORE_THROW: 'wait_before_throw', // 移動後等待1秒
    THROWING: 'throwing',       // 投球
    WAIT_AFTER_THROW: 'wait_after_throw'    // 投球後等待0.5秒
};

// ==================== 遊戲狀態 ====================
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    VICTORY: 'victory',
    DEFEAT: 'defeat',
    COMPLETE: 'complete'
};

// ==================== 角色類別 ====================
class Character {
    constructor(x, y, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.isPlayer = isPlayer;
        this.radius = CONFIG.CHARACTER_RADIUS;
        this.state = CharacterState.IDLE;
        this.hitCount = 0;
        this.maxHits = isPlayer ? CONFIG.PLAYER_HITS_TO_KNOCKOUT : CONFIG.ENEMY_HITS_TO_KNOCKOUT;

        // 投擲相關
        this.chargeStartTime = 0;
        this.lastThrowTime = 0;
        this.targetX = 0;
        this.targetY = 0;

        // 狀態計時器
        this.stateTimer = 0;
        this.invincibleEndTime = 0;
        this.stunEndTime = 0;

        // AI 相關
        this.nextThrowTime = 0;
        this.moveTargetX = x;
        this.moveTargetY = y;
        this.nextMoveTime = 0;

        // AI 行為循環狀態
        this.aiBehaviorState = AIBehaviorState.MOVING;
        this.aiStateEndTime = 0;

        // 拖拉相關
        this.isDragging = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
    }

    update(deltaTime, currentTime) {
        // 檢查無敵狀態結束
        if (this.state === CharacterState.INVINCIBLE && currentTime >= this.invincibleEndTime) {
            this.state = CharacterState.IDLE;
        }

        // 檢查頭暈狀態結束
        if (this.state === CharacterState.STUNNED && currentTime >= this.stunEndTime) {
            this.state = CharacterState.IDLE;
        }
    }

    hit(currentTime) {
        // 無敵狀態不受傷害
        if (this.state === CharacterState.INVINCIBLE) {
            return false;
        }

        this.hitCount++;
        this.state = CharacterState.STUNNED;
        this.stunEndTime = currentTime + CONFIG.STUN_TIME;

        return this.hitCount >= this.maxHits;
    }

    respawn(x, y, currentTime) {
        this.x = x;
        this.y = y;
        this.hitCount = 0;
        this.state = CharacterState.INVINCIBLE;
        this.invincibleEndTime = currentTime + CONFIG.INVINCIBLE_TIME;
    }

    canThrow(currentTime) {
        return (
            this.state !== CharacterState.STUNNED &&
            this.state !== CharacterState.THROWING &&
            currentTime - this.lastThrowTime >= CONFIG.THROW_COOLDOWN
        );
    }

    canStartCharge() {
        // 玩家可以隨時開始蓄力（只要不在頭暈狀態）
        return this.state !== CharacterState.STUNNED;
    }

    startCharge(currentTime) {
        if (this.canStartCharge()) {
            this.state = CharacterState.CHARGING;
            this.chargeStartTime = currentTime;
        }
    }

    getChargeProgress(currentTime) {
        if (this.state !== CharacterState.CHARGING) return 0;
        const elapsed = currentTime - this.chargeStartTime;
        return Math.min(elapsed / CONFIG.MAX_CHARGE_TIME, 1);
    }

    endCharge(currentTime) {
        if (this.state !== CharacterState.CHARGING) return null;

        const chargeProgress = this.getChargeProgress(currentTime);
        this.state = CharacterState.IDLE; // 直接回到待機，允許立即再次蓄力
        this.lastThrowTime = currentTime;

        return {
            startX: this.x,
            startY: this.y,
            chargeProgress: chargeProgress,
            isPlayerSnowball: this.isPlayer
        };
    }

    containsPoint(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return dx * dx + dy * dy <= this.radius * this.radius;
    }

    draw(ctx, currentTime) {
        ctx.save();

        // 選擇顏色
        let color = this.isPlayer ? CONFIG.PLAYER_COLOR : CONFIG.ENEMY_COLOR;

        // 無敵狀態閃爍效果
        if (this.state === CharacterState.INVINCIBLE) {
            const flash = Math.sin(currentTime / 50) > 0;
            color = flash ? CONFIG.PLAYER_COLOR_INVINCIBLE : CONFIG.PLAYER_COLOR;
            ctx.globalAlpha = 0.7;
        }

        // 頭暈狀態
        if (this.state === CharacterState.STUNNED) {
            ctx.globalAlpha = 0.5;
        }

        // 繪製角色
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 繪製眼睛
        const eyeOffset = 6;
        const eyeRadius = 4;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - eyeOffset, this.y - 5, eyeRadius, 0, Math.PI * 2);
        ctx.arc(this.x + eyeOffset, this.y - 5, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(this.x - eyeOffset, this.y - 5, 2, 0, Math.PI * 2);
        ctx.arc(this.x + eyeOffset, this.y - 5, 2, 0, Math.PI * 2);
        ctx.fill();

        // 頭暈狀態繪製星星
        if (this.state === CharacterState.STUNNED) {
            this.drawStars(ctx, currentTime);
        }

        // 繪製被擊中指示器
        this.drawHitIndicator(ctx);

        ctx.restore();

        // 繪製蓄力條
        if (this.state === CharacterState.CHARGING) {
            this.drawChargeBar(ctx, currentTime);
        }
    }

    drawStars(ctx, currentTime) {
        const starCount = 3;
        const orbitRadius = this.radius + 10;
        const rotationSpeed = currentTime / 200;

        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < starCount; i++) {
            const angle = rotationSpeed + (i * Math.PI * 2) / starCount;
            const starX = this.x + Math.cos(angle) * orbitRadius;
            const starY = this.y - 15 + Math.sin(angle) * 5;
            this.drawStar(ctx, starX, starY, 5, 3);
        }
    }

    drawStar(ctx, x, y, radius, points) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? radius : radius / 2;
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }

    drawHitIndicator(ctx) {
        const indicatorY = this.y + this.radius + 10;
        const indicatorWidth = 30;
        const dotRadius = 4;
        const startX = this.x - indicatorWidth / 2;

        for (let i = 0; i < this.maxHits; i++) {
            const dotX = startX + (i * indicatorWidth) / (this.maxHits - 1 || 1);
            ctx.beginPath();
            ctx.arc(dotX, indicatorY, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = i < this.hitCount ? '#F44336' : '#BDBDBD';
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    drawChargeBar(ctx, currentTime) {
        const progress = this.getChargeProgress(currentTime);
        const barWidth = 8;
        const barHeight = 40;
        const barX = this.x + this.radius + 10;
        const barY = this.y - barHeight / 2;

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // 進度
        const fillHeight = barHeight * progress;
        const gradient = ctx.createLinearGradient(barX, barY + barHeight, barX, barY);
        gradient.addColorStop(0, '#4CAF50');
        gradient.addColorStop(0.5, '#FFEB3B');
        gradient.addColorStop(1, '#F44336');

        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY + barHeight - fillHeight, barWidth, fillHeight);

        // 邊框
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}

// ==================== 雪球類別 ====================
class Snowball {
    constructor(startX, startY, targetY, chargeProgress, isPlayerSnowball) {
        this.startX = startX;
        this.startY = startY;
        this.x = startX;
        this.y = startY;
        this.radius = CONFIG.SNOWBALL_RADIUS;
        this.isPlayerSnowball = isPlayerSnowball;

        // 雪球只在 Y 軸上直線飛行
        // 根據蓄力調整飛行距離（最大為整個畫布高度）
        const direction = isPlayerSnowball ? -1 : 1; // 玩家向上投，敵人向下投
        const maxDistance = CONFIG.CANVAS_HEIGHT * 0.8; // 最大飛行距離
        const distance = maxDistance * chargeProgress;

        this.finalX = startX; // X 不變
        this.finalY = startY + direction * distance;

        // 確保不超出畫布
        this.finalY = Math.max(0, Math.min(CONFIG.CANVAS_HEIGHT, this.finalY));

        this.startTime = performance.now();
        this.flightTime = CONFIG.SNOWBALL_FLIGHT_TIME * chargeProgress;
        if (this.flightTime < 200) this.flightTime = 200; // 最小飛行時間
        this.isActive = true;
    }

    update(currentTime) {
        if (!this.isActive) return;

        const elapsed = currentTime - this.startTime;
        const progress = Math.min(elapsed / this.flightTime, 1);

        // 線性移動
        this.x = this.startX + (this.finalX - this.startX) * progress;
        this.y = this.startY + (this.finalY - this.startY) * progress;

        // 檢查是否到達目標
        if (progress >= 1) {
            this.isActive = false;
        }
    }

    draw(ctx) {
        if (!this.isActive) return;

        ctx.save();

        // 繪製陰影
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 5, this.radius * 0.8, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fill();

        // 繪製雪球
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.SNOWBALL_COLOR;
        ctx.fill();
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 高光
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y - 2, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();

        ctx.restore();
    }

    checkCollision(character) {
        if (!this.isActive) return false;

        // 不能打中自己隊伍
        if (this.isPlayerSnowball === character.isPlayer) return false;

        const dx = this.x - character.x;
        const dy = this.y - character.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < this.radius + character.radius;
    }
}

// ==================== 粒子系統 ====================
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.radius = Math.random() * 4 + 2;
        this.life = 1;
        this.decay = Math.random() * 0.03 + 0.02;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.vx *= 0.95;
        this.vy *= 0.95;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y));
        }
    }

    update() {
        this.particles = this.particles.filter(p => {
            p.update();
            return p.life > 0;
        });
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }
}

// ==================== 遊戲主類別 ====================
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // 設置畫布大小
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;

        // 遊戲狀態
        this.gameState = GameState.MENU;
        this.currentLevel = 0;
        this.playerLives = CONFIG.PLAYER_LIVES;

        // 遊戲物件
        this.player = null;
        this.enemies = [];
        this.snowballs = [];
        this.particleSystem = new ParticleSystem();

        // 輸入狀態
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;

        // 時間
        this.lastTime = 0;

        // UI 元素
        this.ui = {
            startScreen: document.getElementById('start-screen'),
            victoryScreen: document.getElementById('victory-screen'),
            defeatScreen: document.getElementById('defeat-screen'),
            completeScreen: document.getElementById('complete-screen'),
            currentLevel: document.getElementById('current-level'),
            enemiesLeft: document.getElementById('enemies-left'),
            lives: document.getElementById('lives'),
            hits: document.getElementById('hits'),
            victoryMessage: document.getElementById('victory-message')
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.gameLoop(0);
    }

    setupEventListeners() {
        // 滑鼠事件
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));

        // 觸控事件
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        // 按鈕事件
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('next-level-btn').addEventListener('click', () => this.nextLevel());
        document.getElementById('retry-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
    }

    getCanvasCoordinates(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    handleMouseDown(e) {
        const coords = this.getCanvasCoordinates(e.clientX, e.clientY);
        this.mouseX = coords.x;
        this.mouseY = coords.y;
        this.isMouseDown = true;

        if (this.gameState !== GameState.PLAYING || !this.player) return;

        // 檢查是否點擊玩家（用於拖曳）
        if (this.player.containsPoint(coords.x, coords.y)) {
            this.player.isDragging = true;
            this.player.dragOffsetX = coords.x - this.player.x;
            this.player.dragOffsetY = coords.y - this.player.y;
        }

        // 無論是否拖曳，都開始蓄力
        this.player.startCharge(performance.now());
    }

    handleMouseMove(e) {
        const coords = this.getCanvasCoordinates(e.clientX, e.clientY);
        this.mouseX = coords.x;
        this.mouseY = coords.y;

        if (this.gameState !== GameState.PLAYING || !this.player) return;

        // 拖拉移動
        if (this.player.isDragging) {
            let newX = coords.x - this.player.dragOffsetX;
            let newY = coords.y - this.player.dragOffsetY;

            // 限制在畫布內
            newX = Math.max(this.player.radius, Math.min(CONFIG.CANVAS_WIDTH - this.player.radius, newX));
            newY = Math.max(this.player.radius, Math.min(CONFIG.CANVAS_HEIGHT - this.player.radius, newY));

            this.player.x = newX;
            this.player.y = newY;
        }
    }

    handleMouseUp(e) {
        if (this.gameState !== GameState.PLAYING || !this.player) {
            this.isMouseDown = false;
            return;
        }

        // 結束拖拉
        if (this.player.isDragging) {
            this.player.isDragging = false;
        }

        // 結束蓄力並投擲（雪球只在 Y 軸上直線飛行）
        if (this.player.state === CharacterState.CHARGING) {
            const snowballData = this.player.endCharge(performance.now());
            if (snowballData) {
                this.snowballs.push(new Snowball(
                    snowballData.startX,
                    snowballData.startY,
                    0, // targetY 不再使用，由 Snowball 內部計算
                    snowballData.chargeProgress,
                    snowballData.isPlayerSnowball
                ));
            }
        }

        this.isMouseDown = false;
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    }

    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.handleMouseUp(null);
    }

    startGame() {
        this.currentLevel = 0;
        this.playerLives = CONFIG.PLAYER_LIVES;
        this.initLevel();
        this.gameState = GameState.PLAYING;
        this.hideAllScreens();
    }

    nextLevel() {
        this.currentLevel++;
        if (this.currentLevel >= CONFIG.LEVELS.length) {
            this.gameState = GameState.COMPLETE;
            this.showScreen('complete');
        } else {
            this.initLevel();
            this.gameState = GameState.PLAYING;
            this.hideAllScreens();
        }
    }

    restartGame() {
        this.startGame();
    }

    initLevel() {
        const levelConfig = CONFIG.LEVELS[this.currentLevel];

        // 創建玩家
        const playerX = CONFIG.CANVAS_WIDTH / 2;
        const playerY = CONFIG.CANVAS_HEIGHT * 0.75;
        this.player = new Character(playerX, playerY, true);

        // 創建敵人
        this.enemies = [];
        const enemyCount = levelConfig.enemies;

        for (let i = 0; i < enemyCount; i++) {
            const x = this.randomInRange(
                CONFIG.CHARACTER_RADIUS + 50,
                CONFIG.CANVAS_WIDTH - CONFIG.CHARACTER_RADIUS - 50
            );
            const y = this.randomInRange(
                CONFIG.CANVAS_HEIGHT * CONFIG.ENEMY_SPAWN_AREA.minY,
                CONFIG.CANVAS_HEIGHT * CONFIG.ENEMY_SPAWN_AREA.maxY
            );

            const enemy = new Character(x, y, false);
            // 初始化 AI 行為狀態
            enemy.aiBehaviorState = AIBehaviorState.MOVING;
            this.setNewMoveTarget(enemy);
            this.enemies.push(enemy);
        }

        // 清空雪球
        this.snowballs = [];

        // 更新 UI
        this.updateUI();
    }

    randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    updateAI(currentTime) {
        for (const enemy of this.enemies) {
            // 跳過頭暈狀態
            if (enemy.state === CharacterState.STUNNED) {
                // 頭暈結束後重置行為循環
                if (currentTime >= enemy.stunEndTime) {
                    enemy.aiBehaviorState = AIBehaviorState.MOVING;
                    this.setNewMoveTarget(enemy);
                }
                continue;
            }

            // AI 行為狀態機：移動 -> 停1秒 -> 投球 -> 停0.5秒 -> 循環
            switch (enemy.aiBehaviorState) {
                case AIBehaviorState.MOVING:
                    // 移動向目標
                    const dx = enemy.moveTargetX - enemy.x;
                    const dy = enemy.moveTargetY - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance > 5) {
                        const speed = 2;
                        enemy.x += (dx / distance) * speed;
                        enemy.y += (dy / distance) * speed;
                    } else {
                        // 到達目標，進入等待狀態（1秒）
                        enemy.aiBehaviorState = AIBehaviorState.WAIT_BEFORE_THROW;
                        enemy.aiStateEndTime = currentTime + 1000;
                    }
                    break;

                case AIBehaviorState.WAIT_BEFORE_THROW:
                    // 等待1秒後投球
                    if (currentTime >= enemy.aiStateEndTime) {
                        enemy.aiBehaviorState = AIBehaviorState.THROWING;
                    }
                    break;

                case AIBehaviorState.THROWING:
                    // 投擲雪球
                    if (enemy.canThrow(currentTime)) {
                        const snowball = new Snowball(
                            enemy.x,
                            enemy.y,
                            0,
                            0.5 + Math.random() * 0.5,
                            false
                        );
                        this.snowballs.push(snowball);
                        enemy.lastThrowTime = currentTime;
                    }
                    // 進入投球後等待狀態（0.5秒）
                    enemy.aiBehaviorState = AIBehaviorState.WAIT_AFTER_THROW;
                    enemy.aiStateEndTime = currentTime + 500;
                    break;

                case AIBehaviorState.WAIT_AFTER_THROW:
                    // 等待0.5秒後重新開始移動
                    if (currentTime >= enemy.aiStateEndTime) {
                        enemy.aiBehaviorState = AIBehaviorState.MOVING;
                        this.setNewMoveTarget(enemy);
                    }
                    break;
            }
        }
    }

    setNewMoveTarget(enemy) {
        enemy.moveTargetX = this.randomInRange(
            CONFIG.CHARACTER_RADIUS + 30,
            CONFIG.CANVAS_WIDTH - CONFIG.CHARACTER_RADIUS - 30
        );
        enemy.moveTargetY = this.randomInRange(
            CONFIG.CANVAS_HEIGHT * CONFIG.ENEMY_SPAWN_AREA.minY,
            CONFIG.CANVAS_HEIGHT * CONFIG.ENEMY_SPAWN_AREA.maxY
        );
    }

    checkCollisions(currentTime) {
        for (const snowball of this.snowballs) {
            if (!snowball.isActive) continue;

            // 玩家雪球打敵人
            if (snowball.isPlayerSnowball) {
                for (let i = this.enemies.length - 1; i >= 0; i--) {
                    const enemy = this.enemies[i];
                    if (snowball.checkCollision(enemy)) {
                        snowball.isActive = false;
                        this.particleSystem.emit(snowball.x, snowball.y, 15);

                        if (enemy.hit(currentTime)) {
                            // 敵人被淘汰
                            this.particleSystem.emit(enemy.x, enemy.y, 30);
                            this.enemies.splice(i, 1);

                            // 檢查勝利
                            if (this.enemies.length === 0) {
                                this.handleVictory();
                            }
                        }
                        this.updateUI();
                        break;
                    }
                }
            }
            // 敵人雪球打玩家
            else {
                if (snowball.checkCollision(this.player)) {
                    snowball.isActive = false;
                    this.particleSystem.emit(snowball.x, snowball.y, 15);

                    if (this.player.hit(currentTime)) {
                        // 玩家被淘汰
                        this.playerLives--;
                        this.particleSystem.emit(this.player.x, this.player.y, 30);

                        if (this.playerLives <= 0) {
                            this.handleDefeat();
                        } else {
                            // 重生
                            const respawnX = CONFIG.CANVAS_WIDTH / 2;
                            const respawnY = CONFIG.CANVAS_HEIGHT * 0.75;
                            this.player.respawn(respawnX, respawnY, currentTime);
                        }
                    }
                    this.updateUI();
                }
            }
        }

        // 清理無效雪球
        this.snowballs = this.snowballs.filter(s => s.isActive);
    }

    handleVictory() {
        this.gameState = GameState.VICTORY;
        const isLastLevel = this.currentLevel >= CONFIG.LEVELS.length - 1;
        this.ui.victoryMessage.textContent = isLastLevel
            ? '恭喜通過最後一關！'
            : `第 ${this.currentLevel + 1} 關完成！`;
        document.getElementById('next-level-btn').textContent = isLastLevel ? '完成遊戲' : '下一關';
        this.showScreen('victory');
    }

    handleDefeat() {
        this.gameState = GameState.DEFEAT;
        this.showScreen('defeat');
    }

    showScreen(screen) {
        this.hideAllScreens();
        switch (screen) {
            case 'start':
                this.ui.startScreen.classList.remove('hidden');
                break;
            case 'victory':
                this.ui.victoryScreen.classList.remove('hidden');
                break;
            case 'defeat':
                this.ui.defeatScreen.classList.remove('hidden');
                break;
            case 'complete':
                this.ui.completeScreen.classList.remove('hidden');
                break;
        }
    }

    hideAllScreens() {
        this.ui.startScreen.classList.add('hidden');
        this.ui.victoryScreen.classList.add('hidden');
        this.ui.defeatScreen.classList.add('hidden');
        this.ui.completeScreen.classList.add('hidden');
    }

    updateUI() {
        this.ui.currentLevel.textContent = this.currentLevel + 1;
        this.ui.enemiesLeft.textContent = this.enemies.length;
        this.ui.lives.textContent = '❤️'.repeat(this.playerLives) + '🖤'.repeat(CONFIG.PLAYER_LIVES - this.playerLives);
        this.ui.hits.textContent = this.player ? this.player.hitCount : 0;
    }

    update(deltaTime, currentTime) {
        if (this.gameState !== GameState.PLAYING) return;

        // 更新玩家
        if (this.player) {
            this.player.update(deltaTime, currentTime);
        }

        // 更新敵人
        for (const enemy of this.enemies) {
            enemy.update(deltaTime, currentTime);
        }

        // 更新 AI
        this.updateAI(currentTime);

        // 更新雪球
        for (const snowball of this.snowballs) {
            snowball.update(currentTime);
        }

        // 碰撞檢測
        this.checkCollisions(currentTime);

        // 更新粒子
        this.particleSystem.update();
    }

    draw() {
        const ctx = this.ctx;
        const currentTime = performance.now();

        // 清空畫布
        ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // 繪製背景
        this.drawBackground(ctx);

        // 繪製遊戲元素
        if (this.gameState === GameState.PLAYING || this.gameState === GameState.VICTORY || this.gameState === GameState.DEFEAT) {
            // 繪製敵人
            for (const enemy of this.enemies) {
                enemy.draw(ctx, currentTime);
            }

            // 繪製玩家
            if (this.player) {
                this.player.draw(ctx, currentTime);
            }

            // 繪製雪球
            for (const snowball of this.snowballs) {
                snowball.draw(ctx);
            }

            // 繪製粒子
            this.particleSystem.draw(ctx);

            // 繪製瞄準線（蓄力時）
            if (this.player && this.player.state === CharacterState.CHARGING) {
                this.drawAimLine(ctx, currentTime);
            }
        }
    }

    drawBackground(ctx) {
        // 雪地背景
        const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
        gradient.addColorStop(0, '#E3F2FD');
        gradient.addColorStop(1, '#BBDEFB');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // 分隔線
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(0, CONFIG.CANVAS_HEIGHT / 2);
        ctx.lineTo(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 隨機雪花裝飾
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 97) % CONFIG.CANVAS_WIDTH;
            const y = (i * 73) % CONFIG.CANVAS_HEIGHT;
            const size = (i % 3) + 1;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawAimLine(ctx, currentTime) {
        const progress = this.player.getChargeProgress(currentTime);

        // 雪球只在 Y 軸上向上飛（玩家向上投擲）
        const maxDistance = CONFIG.CANVAS_HEIGHT * 0.8;
        const distance = maxDistance * progress;

        const endX = this.player.x; // X 保持不變
        const endY = this.player.y - distance; // 向上飛

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(this.player.x, this.player.y);
        ctx.lineTo(endX, Math.max(0, endY));
        ctx.stroke();

        // 終點圓圈
        ctx.beginPath();
        ctx.arc(endX, Math.max(0, endY), 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.setLineDash([]);
        ctx.stroke();

        ctx.restore();
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime, timestamp);
        this.draw();

        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// ==================== 啟動遊戲 ====================
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
