import { STATE, TIMING } from '../data/constants.js';
import { selectRandomFish, MISS_MESSAGES } from '../data/fishData.js';
import { GameEvents } from '../core/EventEmitter.js';
import { Bobber } from '../components/Bobber.js';
import { RhythmGame } from '../components/RhythmGame.js';

/**
 * 釣魚系統 - 管理釣魚的核心遊戲邏輯
 */
export class FishingSystem {
    /**
     * @param {EventEmitter} eventEmitter - 事件發射器
     * @param {GameStateManager} stateManager - 狀態管理器
     */
    constructor(eventEmitter, stateManager) {
        this.events = eventEmitter;
        this.stateManager = stateManager;

        this.bobber = new Bobber();
        this.rhythmGame = new RhythmGame();

        this.currentFish = null;
        this.waitTimer = 0;
        this.hookTimer = 0;

        this.setupEventListeners();
    }

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        this.events.on(GameEvents.FISHING_CAST, () => this.cast());
        this.events.on(GameEvents.FISHING_HOOK, () => this.hook());
        this.events.on(GameEvents.FISHING_REEL, () => this.checkRhythmHit());
    }

    /**
     * 投竿
     */
    cast() {
        this.bobber.cast();
        this.stateManager.setState(STATE.CASTING);

        setTimeout(() => {
            this.stateManager.setState(STATE.WAITING);
            this.waitTimer = TIMING.WAIT_MIN + Math.random() * (TIMING.WAIT_MAX - TIMING.WAIT_MIN);
        }, TIMING.CAST_DURATION);
    }

    /**
     * 開始上鉤（魚咬餌）
     */
    startBite() {
        this.stateManager.setState(STATE.HOOKING);
        this.hookTimer = TIMING.HOOK_WINDOW;
        this.events.emit(GameEvents.FISHING_BITE);
    }

    /**
     * 嘗試上鉤
     */
    hook() {
        // 選擇魚類
        this.currentFish = selectRandomFish();
        this.rhythmGame.reset(this.currentFish.difficulty);
        this.stateManager.setState(STATE.REELING);
    }

    /**
     * 檢查節奏遊戲命中
     * @returns {Object} 命中結果
     */
    checkRhythmHit() {
        const result = this.rhythmGame.checkHit();

        if (result.hit) {
            this.events.emit(GameEvents.RHYTHM_HIT, {
                x: this.rhythmGame.x + this.rhythmGame.cursorPos,
                y: this.rhythmGame.y
            });

            if (result.completed) {
                this.catchFish();
            }
        } else {
            this.events.emit(GameEvents.RHYTHM_MISS, {
                x: this.rhythmGame.x + this.rhythmGame.cursorPos,
                y: this.rhythmGame.y
            });

            if (result.failed) {
                this.loseFish(MISS_MESSAGES.LINE_BREAK);
            }
        }

        return result;
    }

    /**
     * 成功釣到魚
     */
    catchFish() {
        this.stateManager.setState(STATE.CAUGHT);
        this.events.emit(GameEvents.FISHING_CATCH, { fish: this.currentFish });
        this.bobber.deactivate();
    }

    /**
     * 魚跑掉了
     * @param {Object} message - 失敗訊息
     */
    loseFish(message = MISS_MESSAGES.TOO_LATE) {
        this.currentFish = message;
        this.stateManager.setState(STATE.MISSED);
        this.events.emit(GameEvents.FISHING_MISS, { message });
        this.bobber.deactivate();
    }

    /**
     * 太早收竿（等待時點擊）
     */
    pullEarly() {
        this.currentFish = MISS_MESSAGES.TOO_EARLY;
        this.stateManager.setState(STATE.MISSED);
        this.events.emit(GameEvents.FISHING_MISS, { message: MISS_MESSAGES.TOO_EARLY });
        this.bobber.deactivate();
    }

    /**
     * 更新系統
     * @param {number} frameCount - 當前幀數
     */
    update(frameCount) {
        const state = this.stateManager.getState();

        switch (state) {
            case STATE.WAITING:
                this.waitTimer--;
                this.bobber.update(frameCount, false);
                if (this.waitTimer <= 0) {
                    this.startBite();
                }
                break;

            case STATE.HOOKING:
                this.hookTimer--;
                this.bobber.update(frameCount, true);
                if (this.hookTimer <= 0) {
                    this.loseFish(MISS_MESSAGES.TOO_LATE);
                }
                break;

            case STATE.REELING:
                this.rhythmGame.update();
                break;
        }
    }

    /**
     * 取得浮標渲染資料
     * @returns {Object}
     */
    getBobberRenderData() {
        return this.bobber.getRenderData();
    }

    /**
     * 取得節奏遊戲渲染資料
     * @returns {Object}
     */
    getRhythmGameRenderData() {
        return this.rhythmGame.getRenderData();
    }

    /**
     * 取得當前魚類
     * @returns {Object|null}
     */
    getCurrentFish() {
        return this.currentFish;
    }

    /**
     * 重置系統
     */
    reset() {
        this.bobber.reset();
        this.currentFish = null;
        this.waitTimer = 0;
        this.hookTimer = 0;
    }
}
