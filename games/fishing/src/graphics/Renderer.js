import { GAME_WIDTH, GAME_HEIGHT, COLORS, ROD_CONFIG } from '../data/constants.js';
import { SpriteRenderer } from './SpriteRenderer.js';
import { ParticleSystem } from './ParticleSystem.js';

/**
 * 繪圖管理器 - 處理遊戲的所有繪製操作
 */
export class Renderer {
    /**
     * @param {CanvasRenderingContext2D} ctx - 畫布上下文
     */
    constructor(ctx) {
        this.ctx = ctx;
        this.spriteRenderer = new SpriteRenderer(ctx);
        this.particleSystem = new ParticleSystem();
    }

    /**
     * 清除畫面
     */
    clear() {
        this.ctx.fillStyle = COLORS.sky;
        this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    /**
     * 繪製環境背景
     */
    drawEnvironment() {
        // 水面
        this.ctx.fillStyle = COLORS.water;
        this.ctx.fillRect(0, 100, GAME_WIDTH, GAME_HEIGHT - 100);

        // 水平線
        this.ctx.fillStyle = COLORS.waterDark;
        this.ctx.fillRect(0, 98, GAME_WIDTH, 4);
    }

    /**
     * 繪製釣竿
     * @returns {{tipX: number, tipY: number}} 竿尖位置
     */
    drawRod() {
        const { START_X, START_Y, TIP_X, TIP_Y } = ROD_CONFIG;

        // 釣竿陰影
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(START_X, START_Y);
        this.ctx.lineTo(TIP_X, TIP_Y);
        this.ctx.stroke();

        // 釣竿主體
        this.ctx.strokeStyle = COLORS.rod;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(START_X, START_Y);
        this.ctx.lineTo(TIP_X, TIP_Y);
        this.ctx.stroke();

        this.ctx.lineWidth = 1;

        return { tipX: TIP_X, tipY: TIP_Y };
    }

    /**
     * 繪製浮標
     * @param {Object} bobberData - 浮標渲染資料
     * @param {number} rodTipX - 竿尖 X 座標
     * @param {number} rodTipY - 竿尖 Y 座標
     */
    drawBobber(bobberData, rodTipX, rodTipY) {
        if (!bobberData.active) return;

        const { x, y } = bobberData;

        // 魚線
        this.ctx.beginPath();
        this.ctx.moveTo(rodTipX, rodTipY);
        this.ctx.lineTo(x, y);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.stroke();

        // 浮標主體
        this.ctx.fillStyle = COLORS.bobberWhite;
        this.ctx.fillRect(x - 3, y - 3, 6, 6);
        this.ctx.fillStyle = COLORS.bobber;
        this.ctx.fillRect(x - 3, y, 6, 3);
    }

    /**
     * 繪製上鉤提示
     * @param {number} x - X 座標
     * @param {number} y - Y 座標
     */
    drawHookAlert(x, y) {
        this.ctx.fillStyle = COLORS.alertEffect;
        this.ctx.font = '20px Courier New';
        this.ctx.fillText('!', x, y - 20);
    }

    /**
     * 繪製節奏遊戲 UI
     * @param {Object} data - 節奏遊戲渲染資料
     */
    drawRhythmGame(data) {
        const { x, y, barWidth, barHeight, cursorPos, targetPos, targetWidth, progress, tension } = data;

        // 背景遮罩
        this.ctx.fillStyle = COLORS.uiBgOverlay;
        this.ctx.fillRect(0, 0, GAME_WIDTH, 100);

        // 節奏條背景
        this.ctx.fillStyle = COLORS.barBg;
        this.ctx.fillRect(x, y, barWidth, barHeight);

        // 目標區域
        this.ctx.fillStyle = COLORS.barTarget;
        this.ctx.fillRect(x + targetPos, y, targetWidth, barHeight);

        // 游標
        this.ctx.fillStyle = COLORS.barCursor;
        this.ctx.fillRect(x + cursorPos - 2, y - 2, 4, barHeight + 4);

        // 進度條
        this.ctx.fillStyle = COLORS.barBg;
        this.ctx.fillRect(x, y - 15, barWidth, 5);
        this.ctx.fillStyle = COLORS.progressBar;
        this.ctx.fillRect(x, y - 15, barWidth * (progress / 100), 5);

        // 張力條
        this.ctx.fillStyle = COLORS.barBg;
        this.ctx.fillRect(x, y + 15, barWidth, 5);
        this.ctx.fillStyle = COLORS.tensionBar;
        this.ctx.fillRect(x, y + 15, barWidth * (tension / 100), 5);

        // 標籤
        this.ctx.fillStyle = COLORS.text;
        this.ctx.font = '10px Courier New';
        this.ctx.fillText("進度", x - 30, y - 10);
        this.ctx.fillText("張力", x - 30, y + 20);

        // 提示文字
        this.ctx.fillText("按空白鍵命中綠色區域!", x, y + 40);
    }

    /**
     * 繪製覆蓋層（結果畫面）
     * @param {string} title - 標題
     * @param {string} subtitle - 副標題
     * @param {string} spriteKey - 精靈圖鍵值
     */
    drawOverlay(title, subtitle, spriteKey) {
        this.ctx.fillStyle = COLORS.uiBg;
        this.ctx.fillRect(40, 60, GAME_WIDTH - 80, GAME_HEIGHT - 120);

        this.ctx.fillStyle = COLORS.text;
        this.ctx.textAlign = 'center';
        this.ctx.font = '20px Courier New';
        this.ctx.fillText(title, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);

        if (spriteKey) {
            const scale = 4;
            const width = this.spriteRenderer.getWidth(spriteKey, scale);
            this.spriteRenderer.draw(spriteKey, (GAME_WIDTH - width) / 2, GAME_HEIGHT / 2 - 10, scale);
        }

        if (subtitle) {
            this.ctx.font = '12px Courier New';
            this.ctx.fillText(subtitle, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 35);
        }

        this.ctx.font = '10px Courier New';
        this.ctx.fillText("按空白鍵繼續", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
        this.ctx.textAlign = 'left';
    }

    /**
     * 更新並繪製粒子
     */
    updateAndDrawParticles() {
        this.particleSystem.update();
        this.particleSystem.draw(this.ctx);
    }

    /**
     * 建立粒子效果
     * @param {number} x - X 座標
     * @param {number} y - Y 座標
     * @param {string} color - 顏色
     */
    createParticle(x, y, color) {
        this.particleSystem.create(x, y, color);
    }

    /**
     * 建立命中效果
     * @param {number} x - X 座標
     * @param {number} y - Y 座標
     * @param {boolean} isHit - 是否命中
     */
    createHitEffect(x, y, isHit) {
        this.particleSystem.createHitEffect(x, y, isHit);
    }

    /**
     * 取得精靈圖渲染器
     * @returns {SpriteRenderer}
     */
    getSpriteRenderer() {
        return this.spriteRenderer;
    }
}
