import { COLORS, BOBBER_CONFIG } from '../data/constants.js';

/**
 * 浮標組件 - 處理浮標的狀態與渲染資料
 */
export class Bobber {
    constructor() {
        this.reset();
    }

    /**
     * 重置浮標狀態
     */
    reset() {
        this.x = 0;
        this.y = 0;
        this.active = false;
        this.floatOffset = 0;
    }

    /**
     * 投擲浮標到隨機位置
     */
    cast() {
        this.x = BOBBER_CONFIG.CAST_X_CENTER + (Math.random() * BOBBER_CONFIG.CAST_X_RANGE - BOBBER_CONFIG.CAST_X_RANGE / 2);
        this.y = BOBBER_CONFIG.CAST_Y_MIN + Math.random() * BOBBER_CONFIG.CAST_Y_RANGE;
        this.active = true;
    }

    /**
     * 更新浮標狀態
     * @param {number} frameCount - 當前幀數
     * @param {boolean} isHooking - 是否正在上鉤
     */
    update(frameCount, isHooking) {
        if (!this.active) return;

        if (isHooking) {
            // 劇烈晃動
            this.floatOffset = Math.sin(frameCount * BOBBER_CONFIG.FLOAT_SPEED_HOOKING) * BOBBER_CONFIG.FLOAT_AMPLITUDE_HOOKING;
        } else {
            // 平緩漂浮
            this.floatOffset = Math.sin(frameCount * BOBBER_CONFIG.FLOAT_SPEED_NORMAL) * BOBBER_CONFIG.FLOAT_AMPLITUDE_NORMAL;
        }
    }

    /**
     * 取得渲染資料
     * @returns {Object} 渲染所需資料
     */
    getRenderData() {
        return {
            x: this.x,
            y: this.y + this.floatOffset,
            active: this.active
        };
    }

    /**
     * 停用浮標
     */
    deactivate() {
        this.active = false;
    }
}
