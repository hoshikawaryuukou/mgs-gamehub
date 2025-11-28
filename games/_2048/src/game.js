/**
 * 2048 遊戲 - 模組化單檔版本
 * 
 * 結構：
 * - GridManager: 格子計算和定位
 * - Renderer: DOM 操作和畫面更新
 * - Animator: 動畫邏輯
 * - InputHandler: 使用者輸入處理
 * - GameLogic: 純遊戲邏輯
 * - Game: 主控制器
 */

// ============================================
// GridManager - 管理遊戲格子的計算和定位
// ============================================
class GridManager {
    constructor(elements) {
        this.tileContainer = elements.tileContainer;
        this.gridBackground = elements.gridBackground;
        this.size = 4;
    }

    getCellMetrics() {
        const containerWidth = this.tileContainer.offsetWidth;
        const firstCell = this.gridBackground.querySelector('.grid-cell');
        const cellSize = firstCell.offsetWidth;
        const gap = (containerWidth - 4 * cellSize) / 3;
        return { cellSize, gap };
    }

    getPosition(row, col) {
        const { cellSize, gap } = this.getCellMetrics();
        return {
            x: col * (cellSize + gap),
            y: row * (cellSize + gap)
        };
    }

    getFontSize(value, cellSize) {
        const digits = String(value).length;
        if (digits <= 2) return cellSize * 0.5;
        if (digits === 3) return cellSize * 0.4;
        if (digits === 4) return cellSize * 0.32;
        return cellSize * 0.25;
    }

    getTraversalOrder(direction) {
        const rowOrder = [...Array(this.size).keys()];
        const colOrder = [...Array(this.size).keys()];
        if (direction === 'down') rowOrder.reverse();
        if (direction === 'right') colOrder.reverse();
        return { rowOrder, colOrder };
    }

    getDirectionDelta(direction) {
        const deltas = {
            up: { rowDelta: -1, colDelta: 0 },
            down: { rowDelta: 1, colDelta: 0 },
            left: { rowDelta: 0, colDelta: -1 },
            right: { rowDelta: 0, colDelta: 1 }
        };
        return deltas[direction];
    }
}

// ============================================
// Renderer - 負責 DOM 操作和畫面更新
// ============================================
class Renderer {
    constructor(elements, gridManager) {
        this.tileContainer = elements.tileContainer;
        this.scoreElement = elements.scoreElement;
        this.bestScoreElement = elements.bestScoreElement;
        this.gameMessage = elements.gameMessage;
        this.gridManager = gridManager;
    }

    createTileElement(row, col, value) {
        const element = document.createElement('div');
        const tileClass = value <= 2048 ? `tile-${value}` : 'tile-super';
        element.className = `tile ${tileClass}`;
        element.textContent = value;

        const pos = this.gridManager.getPosition(row, col);
        const { cellSize } = this.gridManager.getCellMetrics();

        element.style.left = `${pos.x}px`;
        element.style.top = `${pos.y}px`;
        element.style.width = `${cellSize}px`;
        element.style.height = `${cellSize}px`;
        element.style.fontSize = `${this.gridManager.getFontSize(value, cellSize)}px`;

        this.tileContainer.appendChild(element);
        return element;
    }

    updateTileAppearance(tile) {
        const tileClass = tile.value <= 2048 ? `tile-${tile.value}` : 'tile-super';
        tile.element.className = `tile ${tileClass}`;
        tile.element.textContent = tile.value;
        const { cellSize } = this.gridManager.getCellMetrics();
        tile.element.style.fontSize = `${this.gridManager.getFontSize(tile.value, cellSize)}px`;
    }

    updateAllTilePositions(tiles) {
        const { cellSize } = this.gridManager.getCellMetrics();
        for (const tile of tiles) {
            const pos = this.gridManager.getPosition(tile.row, tile.col);
            tile.element.style.left = `${pos.x}px`;
            tile.element.style.top = `${pos.y}px`;
            tile.element.style.width = `${cellSize}px`;
            tile.element.style.height = `${cellSize}px`;
            tile.element.style.fontSize = `${this.gridManager.getFontSize(tile.value, cellSize)}px`;
        }
    }

    clearTiles() {
        this.tileContainer.innerHTML = '';
    }

    removeTileElement(tile) {
        if (tile.element && tile.element.parentNode) {
            tile.element.remove();
        }
    }

    showMessage(message, isWin) {
        this.gameMessage.querySelector('p').textContent = message;
        this.gameMessage.classList.add('active');
        if (isWin) this.gameMessage.classList.add('game-won');
    }

    hideMessage() {
        this.gameMessage.classList.remove('active', 'game-won');
    }
}

// ============================================
// Animator - 封裝所有動畫邏輯
// ============================================
class Animator {
    constructor(gridManager) {
        this.gridManager = gridManager;
    }

    animateMove(animations) {
        if (animations.length === 0) return Promise.resolve();

        const promises = animations.map(anim => {
            const pos = this.gridManager.getPosition(anim.toRow, anim.toCol);
            return anime({
                targets: anim.tile.element,
                left: pos.x,
                top: pos.y,
                duration: 150,
                easing: 'easeOutQuad'
            }).finished;
        });

        return Promise.all(promises);
    }

    animateAppear(element) {
        return anime({
            targets: element,
            scale: [0, 1],
            opacity: [0, 1],
            duration: 200,
            easing: 'easeOutBack'
        }).finished;
    }

    animateMerge(element) {
        return anime({
            targets: element,
            scale: [1, 1.2, 1],
            duration: 200,
            easing: 'easeOutQuad'
        }).finished;
    }

    animateMessage(element) {
        return anime({
            targets: element,
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuad'
        }).finished;
    }

    animateScore(element, fromValue, toValue) {
        return anime({
            targets: element,
            innerHTML: [fromValue, toValue],
            round: 1,
            duration: 300,
            easing: 'easeOutQuad'
        }).finished;
    }
}

// ============================================
// InputHandler - 處理所有使用者輸入事件
// ============================================
class InputHandler {
    constructor(gameContainer, onMove, onNewGame, onResize) {
        this.gameContainer = gameContainer;
        this.onMove = onMove;
        this.onNewGame = onNewGame;
        this.onResize = onResize;

        this.setupKeyboardEvents();
        this.setupTouchEvents();
        this.setupButtonEvents();
        this.setupResizeEvent();
    }

    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            let direction = null;
            switch (e.key) {
                case 'ArrowUp': e.preventDefault(); direction = 'up'; break;
                case 'ArrowDown': e.preventDefault(); direction = 'down'; break;
                case 'ArrowLeft': e.preventDefault(); direction = 'left'; break;
                case 'ArrowRight': e.preventDefault(); direction = 'right'; break;
            }
            if (direction) this.onMove(direction);
        });
    }

    setupTouchEvents() {
        let touchStartX, touchStartY;
        const minSwipeDistance = 50;

        this.gameContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        this.gameContainer.addEventListener('touchend', (e) => {
            const deltaX = e.changedTouches[0].clientX - touchStartX;
            const deltaY = e.changedTouches[0].clientY - touchStartY;
            let direction = null;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) > minSwipeDistance) {
                    direction = deltaX > 0 ? 'right' : 'left';
                }
            } else {
                if (Math.abs(deltaY) > minSwipeDistance) {
                    direction = deltaY > 0 ? 'down' : 'up';
                }
            }
            if (direction) this.onMove(direction);
        }, { passive: true });
    }

    setupButtonEvents() {
        document.getElementById('new-game-btn').addEventListener('click', () => this.onNewGame());
        document.querySelector('.retry-btn').addEventListener('click', () => this.onNewGame());
    }

    setupResizeEvent() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.onResize(), 100);
        });
    }
}

// ============================================
// GameLogic - 純遊戲邏輯，不涉及 DOM
// ============================================
class GameLogic {
    constructor(size = 4) {
        this.size = size;
        this.grid = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
        this.gameOver = false;
        this.won = false;
    }

    initGrid() {
        this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(null));
        this.score = 0;
        this.gameOver = false;
        this.won = false;
    }

    getRandomEmptyCell() {
        const emptyCells = [];
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] === null) {
                    emptyCells.push({ row, col });
                }
            }
        }
        if (emptyCells.length === 0) return null;
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    getRandomValue() {
        return Math.random() < 0.9 ? 2 : 4;
    }

    placeTile(row, col, tile) {
        this.grid[row][col] = tile;
    }

    calculateMove(direction, gridManager) {
        const animations = [];
        const merges = [];
        let moved = false;

        const newGrid = Array(this.size).fill(null).map(() => Array(this.size).fill(null));
        const { rowOrder, colOrder } = gridManager.getTraversalOrder(direction);
        const { rowDelta, colDelta } = gridManager.getDirectionDelta(direction);

        for (const row of rowOrder) {
            for (const col of colOrder) {
                const tile = this.grid[row][col];
                if (!tile) continue;

                let newRow = row;
                let newCol = col;

                while (true) {
                    const nextRow = newRow + rowDelta;
                    const nextCol = newCol + colDelta;

                    if (nextRow < 0 || nextRow >= this.size ||
                        nextCol < 0 || nextCol >= this.size) break;

                    const nextTile = newGrid[nextRow][nextCol];

                    if (nextTile === null) {
                        newRow = nextRow;
                        newCol = nextCol;
                    } else if (nextTile.value === tile.value && !nextTile.merged) {
                        newRow = nextRow;
                        newCol = nextCol;
                        nextTile.merged = true;
                        merges.push({
                            tile1: tile,
                            tile2: nextTile,
                            row: newRow,
                            col: newCol,
                            newValue: tile.value * 2
                        });
                        break;
                    } else {
                        break;
                    }
                }

                if (newRow !== row || newCol !== col) {
                    moved = true;
                    animations.push({
                        tile, fromRow: row, fromCol: col, toRow: newRow, toCol: newCol
                    });
                }

                const existingTile = newGrid[newRow][newCol];
                if (!(existingTile && existingTile.value === tile.value)) {
                    newGrid[newRow][newCol] = tile;
                    tile.row = newRow;
                    tile.col = newCol;
                }
            }
        }

        this.grid = newGrid;
        return { moved, animations, merges };
    }

    applyMerge(merge) {
        const { tile2, row, col, newValue } = merge;
        tile2.value = newValue;
        tile2.merged = false;
        tile2.row = row;
        tile2.col = col;
        this.grid[row][col] = tile2;
        this.score += newValue;
        if (newValue === 2048 && !this.won) this.won = true;
    }

    resetMergedFlags() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col]) this.grid[row][col].merged = false;
            }
        }
    }

    canMove() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] === null) return true;
            }
        }
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const tile = this.grid[row][col];
                if (!tile) continue;
                if (col < this.size - 1) {
                    const rightTile = this.grid[row][col + 1];
                    if (rightTile && rightTile.value === tile.value) return true;
                }
                if (row < this.size - 1) {
                    const downTile = this.grid[row + 1][col];
                    if (downTile && downTile.value === tile.value) return true;
                }
            }
        }
        return false;
    }

    updateBestScore() {
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore);
            return true;
        }
        return false;
    }
}

// ============================================
// Game - 主控制器，整合所有模組
// ============================================
class Game {
    constructor() {
        this.elements = {
            tileContainer: document.getElementById('tile-container'),
            scoreElement: document.getElementById('score'),
            bestScoreElement: document.getElementById('best-score'),
            gameMessage: document.getElementById('game-message'),
            gameContainer: document.querySelector('.game-container'),
            gridBackground: document.querySelector('.grid-background')
        };

        this.gridManager = new GridManager(this.elements);
        this.renderer = new Renderer(this.elements, this.gridManager);
        this.animator = new Animator(this.gridManager);
        this.logic = new GameLogic();
        this.tiles = [];
        this.isAnimating = false;

        this.inputHandler = new InputHandler(
            this.elements.gameContainer,
            (direction) => this.handleMove(direction),
            () => this.init(),
            () => this.handleResize()
        );

        this.init();
    }

    init() {
        this.logic.initGrid();
        this.tiles = [];
        this.isAnimating = false;
        this.renderer.clearTiles();
        this.renderer.hideMessage();
        this.addRandomTile();
        this.addRandomTile();
        this.updateScoreDisplay();
    }

    async handleMove(direction) {
        if (this.logic.gameOver || this.isAnimating) return;

        const moveResult = this.logic.calculateMove(direction, this.gridManager);

        if (moveResult.moved) {
            this.isAnimating = true;
            await this.animator.animateMove(moveResult.animations);
            this.applyMerges(moveResult.merges);
            this.addRandomTile();
            this.updateScoreDisplay();
            this.checkGameState();
            this.isAnimating = false;
        }
    }

    applyMerges(merges) {
        for (const merge of merges) {
            this.renderer.removeTileElement(merge.tile1);
            const index = this.tiles.indexOf(merge.tile1);
            if (index > -1) this.tiles.splice(index, 1);

            this.logic.applyMerge(merge);
            this.renderer.updateTileAppearance(merge.tile2);
            this.animator.animateMerge(merge.tile2.element);
        }
        this.logic.resetMergedFlags();
    }

    addRandomTile() {
        const cell = this.logic.getRandomEmptyCell();
        if (!cell) return;

        const { row, col } = cell;
        const value = this.logic.getRandomValue();
        const element = this.renderer.createTileElement(row, col, value);
        const tile = { element, value, row, col, merged: false };

        this.logic.placeTile(row, col, tile);
        this.tiles.push(tile);
        this.animator.animateAppear(element);
    }

    checkGameState() {
        if (this.logic.won) {
            this.logic.gameOver = true;
            this.renderer.showMessage('你贏了！', true);
            this.animator.animateMessage(this.elements.gameMessage);
        } else if (!this.logic.canMove()) {
            this.logic.gameOver = true;
            this.renderer.showMessage('遊戲結束！', false);
            this.animator.animateMessage(this.elements.gameMessage);
        }
    }

    updateScoreDisplay() {
        const currentScore = parseInt(this.elements.scoreElement.textContent) || 0;
        if (currentScore !== this.logic.score) {
            this.animator.animateScore(this.elements.scoreElement, currentScore, this.logic.score);
        }
        if (this.logic.updateBestScore()) {
            const currentBest = parseInt(this.elements.bestScoreElement.textContent) || 0;
            this.animator.animateScore(this.elements.bestScoreElement, currentBest, this.logic.bestScore);
        }
    }

    handleResize() {
        this.renderer.updateAllTilePositions(this.tiles);
    }
}

// ============================================
// 啟動遊戲
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
