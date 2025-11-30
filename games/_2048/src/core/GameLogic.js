/**
 * GameLogic - 純遊戲邏輯，不涉及 DOM
 */
export class GameLogic {
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
