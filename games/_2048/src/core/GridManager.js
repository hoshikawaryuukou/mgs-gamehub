/**
 * GridManager - 管理遊戲格子的計算和定位
 */
export class GridManager {
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
