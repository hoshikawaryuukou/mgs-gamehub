import { STATE } from '../data/constants.js';
import { GameEvents } from './EventEmitter.js';

/**
 * 遊戲狀態管理器 - 管理遊戲狀態轉換
 */
export class GameStateManager {
    /**
     * @param {EventEmitter} eventEmitter - 事件發射器
     */
    constructor(eventEmitter) {
        this.events = eventEmitter;
        this.currentState = STATE.IDLE;
        this.previousState = null;

        // 定義有效的狀態轉換
        this.validTransitions = {
            [STATE.IDLE]: [STATE.CASTING, STATE.ENCYCLOPEDIA],
            [STATE.CASTING]: [STATE.WAITING],
            [STATE.WAITING]: [STATE.HOOKING, STATE.MISSED],
            [STATE.HOOKING]: [STATE.REELING, STATE.MISSED],
            [STATE.REELING]: [STATE.CAUGHT, STATE.MISSED],
            [STATE.CAUGHT]: [STATE.IDLE],
            [STATE.MISSED]: [STATE.IDLE],
            [STATE.ENCYCLOPEDIA]: [STATE.IDLE]
        };
    }

    /**
     * 取得當前狀態
     * @returns {string} 當前狀態
     */
    getState() {
        return this.currentState;
    }

    /**
     * 取得前一個狀態
     * @returns {string|null} 前一個狀態
     */
    getPreviousState() {
        return this.previousState;
    }

    /**
     * 檢查是否可以轉換到指定狀態
     * @param {string} newState - 目標狀態
     * @returns {boolean} 是否可以轉換
     */
    canTransitionTo(newState) {
        const allowed = this.validTransitions[this.currentState];
        return allowed && allowed.includes(newState);
    }

    /**
     * 轉換到新狀態
     * @param {string} newState - 目標狀態
     * @param {Object} data - 附加資料
     * @returns {boolean} 是否成功轉換
     */
    setState(newState, data = {}) {
        if (!this.canTransitionTo(newState)) {
            console.warn(`Invalid state transition: ${this.currentState} -> ${newState}`);
            return false;
        }

        this.previousState = this.currentState;
        this.currentState = newState;

        this.events.emit(GameEvents.STATE_CHANGED, {
            from: this.previousState,
            to: this.currentState,
            ...data
        });

        return true;
    }

    /**
     * 強制設定狀態（跳過驗證）
     * @param {string} newState - 目標狀態
     * @param {Object} data - 附加資料
     */
    forceState(newState, data = {}) {
        this.previousState = this.currentState;
        this.currentState = newState;

        this.events.emit(GameEvents.STATE_CHANGED, {
            from: this.previousState,
            to: this.currentState,
            forced: true,
            ...data
        });
    }

    /**
     * 檢查當前是否為指定狀態
     * @param {string} state - 要檢查的狀態
     * @returns {boolean} 是否為該狀態
     */
    isState(state) {
        return this.currentState === state;
    }

    /**
     * 檢查當前是否為多個狀態之一
     * @param {string[]} states - 要檢查的狀態陣列
     * @returns {boolean} 是否為其中之一
     */
    isAnyState(states) {
        return states.includes(this.currentState);
    }

    /**
     * 檢查是否處於遊戲進行中狀態
     * @returns {boolean} 是否進行中
     */
    isPlaying() {
        return this.isAnyState([
            STATE.CASTING,
            STATE.WAITING,
            STATE.HOOKING,
            STATE.REELING
        ]);
    }

    /**
     * 檢查是否處於結果顯示狀態
     * @returns {boolean} 是否顯示結果
     */
    isShowingResult() {
        return this.isAnyState([STATE.CAUGHT, STATE.MISSED]);
    }

    /**
     * 重置到初始狀態
     */
    reset() {
        this.previousState = this.currentState;
        this.currentState = STATE.IDLE;

        this.events.emit(GameEvents.STATE_CHANGED, {
            from: this.previousState,
            to: this.currentState,
            reset: true
        });
    }
}
