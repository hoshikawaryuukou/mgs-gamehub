/**
 * 2048 遊戲 - 主控制器
 */
import {
    GridManager,
    Renderer,
    Animator,
    InputHandler,
    GameLogic
} from './core/index.js';

/**
 * Game - 主控制器，整合所有模組
 */
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

// 啟動遊戲
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
