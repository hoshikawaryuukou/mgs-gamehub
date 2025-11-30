import { GAME_WIDTH, UI_CONFIG } from '../data/constants.js';
import { GameEvents } from './EventEmitter.js';

/**
 * 輸入管理器 - 處理所有使用者輸入
 */
export class InputManager {
    /**
     * @param {HTMLCanvasElement} canvas - 遊戲畫布
     * @param {EventEmitter} eventEmitter - 事件發射器
     */
    constructor(canvas, eventEmitter) {
        this.canvas = canvas;
        this.events = eventEmitter;
        this.enabled = true;

        this.bindEvents();
    }

    /**
     * 綁定輸入事件
     */
    bindEvents() {
        // 鍵盤事件
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // 滑鼠事件
        this.canvas.addEventListener('mousedown', (e) => this.handlePointerDown(e));

        // 觸控事件
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handlePointerDown(e);
        });
    }

    /**
     * 處理鍵盤按下
     * @param {KeyboardEvent} e - 鍵盤事件
     */
    handleKeyDown(e) {
        if (!this.enabled) return;

        switch (e.code) {
            case 'Space':
                this.events.emit(GameEvents.INPUT_ACTION, { source: 'keyboard' });
                break;
            case 'KeyB':
                this.events.emit(GameEvents.INPUT_TOGGLE_ENCYCLOPEDIA);
                break;
        }
    }

    /**
     * 處理指標按下（滑鼠/觸控）
     * @param {MouseEvent|TouchEvent} e - 指標事件
     */
    handlePointerDown(e) {
        if (!this.enabled) return;

        const pos = this.getCanvasPosition(e);

        // 檢查是否點擊圖鑑按鈕
        if (this.isBookIconClicked(pos)) {
            this.events.emit(GameEvents.INPUT_TOGGLE_ENCYCLOPEDIA);
            return;
        }

        this.events.emit(GameEvents.INPUT_ACTION, {
            source: 'pointer',
            position: pos
        });
    }

    /**
     * 取得畫布上的點擊位置
     * @param {MouseEvent|TouchEvent} e - 事件
     * @returns {{x: number, y: number}} 畫布座標
     */
    getCanvasPosition(e) {
        let clientX, clientY;

        if (e.type === 'touchstart') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    /**
     * 檢查是否點擊了圖鑑按鈕
     * @param {{x: number, y: number}} pos - 點擊位置
     * @returns {boolean} 是否點擊圖鑑按鈕
     */
    isBookIconClicked(pos) {
        const bookX = GAME_WIDTH - UI_CONFIG.BOOK_ICON_SIZE - UI_CONFIG.BOOK_ICON_PADDING;
        const bookY = UI_CONFIG.BOOK_ICON_PADDING;
        const size = UI_CONFIG.BOOK_ICON_SIZE + UI_CONFIG.BOOK_ICON_PADDING;

        return (
            pos.x >= bookX &&
            pos.x <= bookX + size &&
            pos.y >= bookY &&
            pos.y <= bookY + size
        );
    }

    /**
     * 啟用輸入
     */
    enable() {
        this.enabled = true;
    }

    /**
     * 停用輸入
     */
    disable() {
        this.enabled = false;
    }
}
