import { PALETTE, SPRITES, getSpriteSize } from '../data/sprites.js';

/**
 * 精靈圖渲染器 - 處理像素精靈圖的渲染
 */
export class SpriteRenderer {
    /**
     * @param {CanvasRenderingContext2D} ctx - 畫布上下文
     */
    constructor(ctx) {
        this.ctx = ctx;
    }

    /**
     * 繪製精靈圖
     * @param {string} spriteKey - 精靈圖鍵值
     * @param {number} x - X 座標
     * @param {number} y - Y 座標
     * @param {number} scale - 縮放比例
     */
    draw(spriteKey, x, y, scale = 1) {
        const sprite = SPRITES[spriteKey];
        if (!sprite) return;

        for (let r = 0; r < sprite.length; r++) {
            const row = sprite[r];
            for (let c = 0; c < row.length; c++) {
                const char = row[c];
                const color = PALETTE[char];
                if (color) {
                    this.ctx.fillStyle = color;
                    this.ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
                }
            }
        }
    }

    /**
     * 繪製置中的精靈圖
     * @param {string} spriteKey - 精靈圖鍵值
     * @param {number} centerX - 中心 X 座標
     * @param {number} centerY - 中心 Y 座標
     * @param {number} scale - 縮放比例
     */
    drawCentered(spriteKey, centerX, centerY, scale = 1) {
        const size = getSpriteSize(spriteKey);
        const x = centerX - (size.width * scale) / 2;
        const y = centerY - (size.height * scale) / 2;
        this.draw(spriteKey, x, y, scale);
    }

    /**
     * 取得精靈圖的縮放後寬度
     * @param {string} spriteKey - 精靈圖鍵值
     * @param {number} scale - 縮放比例
     * @returns {number} 寬度
     */
    getWidth(spriteKey, scale = 1) {
        const size = getSpriteSize(spriteKey);
        return size.width * scale;
    }

    /**
     * 取得精靈圖的縮放後高度
     * @param {string} spriteKey - 精靈圖鍵值
     * @param {number} scale - 縮放比例
     * @returns {number} 高度
     */
    getHeight(spriteKey, scale = 1) {
        const size = getSpriteSize(spriteKey);
        return size.height * scale;
    }
}
