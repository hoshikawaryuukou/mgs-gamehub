/**
 * 簡單的事件發射器，用於模組間解耦通訊
 */
export class EventEmitter {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * 註冊事件監聽器
     * @param {string} event - 事件名稱
     * @param {Function} callback - 回調函數
     * @returns {Function} 取消訂閱函數
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);

        // 返回取消訂閱函數
        return () => this.off(event, callback);
    }

    /**
     * 註冊一次性事件監聽器
     * @param {string} event - 事件名稱
     * @param {Function} callback - 回調函數
     */
    once(event, callback) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            callback(...args);
        };
        this.on(event, wrapper);
    }

    /**
     * 移除事件監聽器
     * @param {string} event - 事件名稱
     * @param {Function} callback - 回調函數
     */
    off(event, callback) {
        if (!this.listeners.has(event)) return;

        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * 發射事件
     * @param {string} event - 事件名稱
     * @param {*} data - 傳遞的資料
     */
    emit(event, data) {
        if (!this.listeners.has(event)) return;

        this.listeners.get(event).forEach(callback => {
            callback(data);
        });
    }

    /**
     * 清除所有監聽器
     */
    clear() {
        this.listeners.clear();
    }
}

// 遊戲事件常數
export const GameEvents = {
    // 狀態變更
    STATE_CHANGED: 'state:changed',

    // 輸入事件
    INPUT_ACTION: 'input:action',
    INPUT_TOGGLE_ENCYCLOPEDIA: 'input:toggleEncyclopedia',

    // 釣魚事件
    FISHING_CAST: 'fishing:cast',
    FISHING_BITE: 'fishing:bite',
    FISHING_HOOK: 'fishing:hook',
    FISHING_REEL: 'fishing:reel',
    FISHING_CATCH: 'fishing:catch',
    FISHING_MISS: 'fishing:miss',

    // 節奏遊戲事件
    RHYTHM_HIT: 'rhythm:hit',
    RHYTHM_MISS: 'rhythm:miss',
    RHYTHM_COMPLETE: 'rhythm:complete',
    RHYTHM_FAIL: 'rhythm:fail',

    // UI 事件
    UI_UPDATE_SCORE: 'ui:updateScore',
    UI_UPDATE_COLLECTION: 'ui:updateCollection',

    // 粒子效果
    PARTICLE_CREATE: 'particle:create'
};
