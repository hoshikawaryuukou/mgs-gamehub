import { GAME_WIDTH, GAME_HEIGHT, COLORS, UI_CONFIG } from '../data/constants.js';
import { FISH_TYPES } from '../data/fishData.js';

/**
 * 圖鑑 UI - 顯示魚類收藏
 */
export class Encyclopedia {
    /**
     * @param {CanvasRenderingContext2D} ctx - 畫布上下文
     * @param {SpriteRenderer} spriteRenderer - 精靈圖渲染器
     */
    constructor(ctx, spriteRenderer) {
        this.ctx = ctx;
        this.spriteRenderer = spriteRenderer;
    }

    /**
     * 繪製圖鑑
     * @param {Set<string>} collection - 已收藏的魚類名稱集合
     */
    draw(collection) {
        const { ENCYCLOPEDIA_PADDING, ENCYCLOPEDIA_ITEM_HEIGHT, ENCYCLOPEDIA_START_Y } = UI_CONFIG;

        // 背景
        this.ctx.fillStyle = COLORS.uiBgDark;
        this.ctx.fillRect(
            ENCYCLOPEDIA_PADDING,
            ENCYCLOPEDIA_PADDING,
            GAME_WIDTH - ENCYCLOPEDIA_PADDING * 2,
            GAME_HEIGHT - ENCYCLOPEDIA_PADDING * 2
        );

        // 標題
        this.ctx.fillStyle = COLORS.text;
        this.ctx.textAlign = 'center';
        this.ctx.font = '16px Courier New';
        this.ctx.fillText("魚類圖鑑", GAME_WIDTH / 2, 30);

        // 繪製魚類列表
        this.ctx.textAlign = 'left';
        this.ctx.font = '10px Courier New';

        const startX = 30;

        FISH_TYPES.forEach((fish, index) => {
            const y = ENCYCLOPEDIA_START_Y + index * ENCYCLOPEDIA_ITEM_HEIGHT;
            const isCaught = collection.has(fish.name);

            if (isCaught) {
                this.drawCaughtFish(fish, startX, y);
            } else {
                this.drawUnknownFish(startX, y);
            }
        });

        // 關閉提示
        this.ctx.fillStyle = COLORS.text;
        this.ctx.textAlign = 'center';
        this.ctx.fillText("按空白鍵關閉", GAME_WIDTH / 2, GAME_HEIGHT - 20);
        this.ctx.textAlign = 'left';
    }

    /**
     * 繪製已捕獲的魚
     * @param {Object} fish - 魚類資料
     * @param {number} x - X 座標
     * @param {number} y - Y 座標
     */
    drawCaughtFish(fish, x, y) {
        // 繪製精靈圖
        this.spriteRenderer.draw(fish.sprite, x, y - 10, 2);

        // 魚名
        this.ctx.fillStyle = COLORS.text;
        this.ctx.fillText(fish.name, x + 40, y);

        // 描述
        this.ctx.fillStyle = COLORS.textMuted;
        this.ctx.fillText(fish.desc, x + 40, y + 12);
    }

    /**
     * 繪製未知的魚
     * @param {number} x - X 座標
     * @param {number} y - Y 座標
     */
    drawUnknownFish(x, y) {
        // 問號方塊
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x, y - 5, 24, 16);

        // 問號文字
        this.ctx.fillStyle = COLORS.textDark;
        this.ctx.fillText("???", x + 40, y);
    }
}
