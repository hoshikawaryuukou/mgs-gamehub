import { GAME_WIDTH, RHYTHM_CONFIG } from '../data/constants.js';

/**
 * 節奏遊戲組件 - 處理釣魚時的節奏小遊戲
 */
export class RhythmGame {
    constructor() {
        this.barWidth = RHYTHM_CONFIG.BAR_WIDTH;
        this.barHeight = RHYTHM_CONFIG.BAR_HEIGHT;
        this.x = (GAME_WIDTH - this.barWidth) / 2;
        this.y = 50;

        this.reset(1);
    }

    /**
     * 重置節奏遊戲
     * @param {number} difficulty - 難度係數
     */
    reset(difficulty) {
        this.progress = RHYTHM_CONFIG.INITIAL_PROGRESS;
        this.tension = 0;
        this.cursorPos = 0;
        this.cursorDir = 1;
        this.cursorSpeed = RHYTHM_CONFIG.BASE_CURSOR_SPEED * difficulty;
        this.targetWidth = Math.max(
            RHYTHM_CONFIG.MIN_TARGET_WIDTH,
            RHYTHM_CONFIG.BASE_TARGET_WIDTH - (difficulty * RHYTHM_CONFIG.TARGET_WIDTH_REDUCTION)
        );
        this.targetPos = 0;
        this.difficulty = difficulty;

        this.randomizeTarget();
    }

    /**
     * 隨機化目標區域位置
     */
    randomizeTarget() {
        this.targetPos = Math.random() * (this.barWidth - this.targetWidth);
    }

    /**
     * 更新遊戲狀態
     */
    update() {
        this.cursorPos += this.cursorDir * this.cursorSpeed;

        if (this.cursorPos >= this.barWidth || this.cursorPos <= 0) {
            this.cursorDir *= -1;
        }
    }

    /**
     * 檢查點擊是否命中目標區域
     * @returns {{hit: boolean, progress: number, tension: number, completed: boolean, failed: boolean}}
     */
    checkHit() {
        const hitStart = this.targetPos;
        const hitEnd = this.targetPos + this.targetWidth;
        const isHit = this.cursorPos >= hitStart && this.cursorPos <= hitEnd;

        if (isHit) {
            this.progress += RHYTHM_CONFIG.PROGRESS_PER_HIT;
            this.randomizeTarget();
            this.cursorSpeed *= RHYTHM_CONFIG.SPEED_MULTIPLIER;
        } else {
            this.tension += RHYTHM_CONFIG.TENSION_PER_MISS;
        }

        return {
            hit: isHit,
            progress: this.progress,
            tension: this.tension,
            completed: this.progress >= 100,
            failed: this.tension >= 100
        };
    }

    /**
     * 取得渲染資料
     * @returns {Object} 渲染所需資料
     */
    getRenderData() {
        return {
            x: this.x,
            y: this.y,
            barWidth: this.barWidth,
            barHeight: this.barHeight,
            cursorPos: this.cursorPos,
            targetPos: this.targetPos,
            targetWidth: this.targetWidth,
            progress: Math.min(this.progress, 100),
            tension: Math.min(this.tension, 100)
        };
    }

    /**
     * 檢查遊戲是否完成（成功）
     * @returns {boolean}
     */
    isCompleted() {
        return this.progress >= 100;
    }

    /**
     * 檢查遊戲是否失敗
     * @returns {boolean}
     */
    isFailed() {
        return this.tension >= 100;
    }
}
