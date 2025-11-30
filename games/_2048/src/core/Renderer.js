/**
 * Renderer - 負責 DOM 操作和畫面更新
 */
export class Renderer {
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
