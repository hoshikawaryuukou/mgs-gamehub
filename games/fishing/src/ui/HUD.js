import { GAME_WIDTH, COLORS, UI_CONFIG } from '../data/constants.js';
import { getTotalFishCount } from '../data/fishData.js';

/**
 * HUD（抬頭顯示器）- 顯示遊戲狀態資訊
 */
export class HUD {
    /**
     * @param {CanvasRenderingContext2D} ctx - 畫布上下文
     */
    constructor(ctx) {
        this.ctx = ctx;
    }

    /**
     * 繪製 HUD
     * @param {Object} data - HUD 資料
     * @param {number} data.score - 分數
     * @param {number} data.collectionCount - 收藏數量
     * @param {number} data.totalCaught - 總漁獲數
     */
    draw(data) {
        const { score, collectionCount, totalCaught } = data;
        const { HUD_X, HUD_Y_START, HUD_LINE_HEIGHT } = UI_CONFIG;

        this.ctx.fillStyle = COLORS.text;
        this.ctx.font = '10px Courier New';

        this.ctx.fillText("按空白鍵拋竿", HUD_X, HUD_Y_START);
        this.ctx.fillText(`分數: ${score}`, HUD_X, HUD_Y_START + HUD_LINE_HEIGHT);
        this.ctx.fillText(`圖鑑: ${collectionCount}/${getTotalFishCount()}`, HUD_X, HUD_Y_START + HUD_LINE_HEIGHT * 2);
        this.ctx.fillText(`總漁獲: ${totalCaught}`, HUD_X, HUD_Y_START + HUD_LINE_HEIGHT * 3);

        this.drawBookIcon();
    }

    /**
     * 繪製圖鑑按鈕
     */
    drawBookIcon() {
        const bookX = GAME_WIDTH - UI_CONFIG.BOOK_ICON_SIZE - UI_CONFIG.BOOK_ICON_PADDING;
        const bookY = UI_CONFIG.BOOK_ICON_PADDING;

        // 書本外框
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(bookX, bookY, 20, 24);

        // 書本內頁
        this.ctx.fillStyle = '#F5DEB3';
        this.ctx.fillRect(bookX + 2, bookY + 2, 16, 20);

        // 書脊
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(bookX, bookY, 4, 24);

        // 標籤
        this.ctx.fillStyle = '#000';
        this.ctx.font = '10px Courier New';
        this.ctx.fillText("B", bookX + 7, bookY + 15);
    }
}
