import { SCORE_CONFIG } from '../data/constants.js';
import { getTotalFishCount } from '../data/fishData.js';
import { GameEvents } from '../core/EventEmitter.js';

/**
 * 收藏系統 - 管理分數、收藏和統計資料
 */
export class CollectionSystem {
    /**
     * @param {EventEmitter} eventEmitter - 事件發射器
     */
    constructor(eventEmitter) {
        this.events = eventEmitter;

        this.score = 0;
        this.totalCaught = 0;
        this.collection = new Set();

        this.setupEventListeners();
    }

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        this.events.on(GameEvents.FISHING_CATCH, (data) => this.onFishCaught(data));
    }

    /**
     * 當魚被釣到時的處理
     * @param {Object} data - 包含魚類資料
     */
    onFishCaught(data) {
        const { fish } = data;

        // 更新分數
        this.score += fish.rarity * SCORE_CONFIG.RARITY_MULTIPLIER;

        // 更新總漁獲數
        this.totalCaught++;

        // 更新收藏
        const isNew = !this.collection.has(fish.name);
        if (isNew) {
            this.collection.add(fish.name);
        }

        // 發射更新事件
        this.events.emit(GameEvents.UI_UPDATE_SCORE, { score: this.score });
        this.events.emit(GameEvents.UI_UPDATE_COLLECTION, {
            collection: this.collection,
            totalCaught: this.totalCaught,
            isNew
        });
    }

    /**
     * 取得分數
     * @returns {number}
     */
    getScore() {
        return this.score;
    }

    /**
     * 取得總漁獲數
     * @returns {number}
     */
    getTotalCaught() {
        return this.totalCaught;
    }

    /**
     * 取得收藏數量
     * @returns {number}
     */
    getCollectionCount() {
        return this.collection.size;
    }

    /**
     * 取得收藏集合
     * @returns {Set<string>}
     */
    getCollection() {
        return this.collection;
    }

    /**
     * 檢查是否已收藏某魚
     * @param {string} fishName - 魚類名稱
     * @returns {boolean}
     */
    hasFish(fishName) {
        return this.collection.has(fishName);
    }

    /**
     * 取得收藏進度文字
     * @returns {string}
     */
    getProgressText() {
        return `${this.collection.size}/${getTotalFishCount()}`;
    }

    /**
     * 取得統計資料
     * @returns {Object}
     */
    getStats() {
        return {
            score: this.score,
            totalCaught: this.totalCaught,
            collectionCount: this.collection.size,
            totalFishTypes: getTotalFishCount(),
            completionRate: (this.collection.size / getTotalFishCount()) * 100
        };
    }

    /**
     * 重置所有資料
     */
    reset() {
        this.score = 0;
        this.totalCaught = 0;
        this.collection.clear();
    }
}
