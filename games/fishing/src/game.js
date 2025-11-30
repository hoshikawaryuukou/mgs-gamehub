import { STATE, TIMING } from './data/constants.js';
import { EventEmitter, GameEvents } from './core/EventEmitter.js';
import { InputManager } from './core/InputManager.js';
import { GameStateManager } from './core/GameStateManager.js';
import { Renderer } from './graphics/Renderer.js';
import { FishingSystem } from './systems/FishingSystem.js';
import { CollectionSystem } from './systems/CollectionSystem.js';
import { HUD } from './ui/HUD.js';
import { Encyclopedia } from './ui/Encyclopedia.js';

/**
 * 主遊戲類別 - 協調所有子系統
 */
class Game {
    constructor() {
        // 取得畫布
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // 核心系統
        this.events = new EventEmitter();
        this.stateManager = new GameStateManager(this.events);
        this.inputManager = new InputManager(this.canvas, this.events);

        // 繪圖系統
        this.renderer = new Renderer(this.ctx);

        // 遊戲系統
        this.fishingSystem = new FishingSystem(this.events, this.stateManager);
        this.collectionSystem = new CollectionSystem(this.events);

        // UI 系統
        this.hud = new HUD(this.ctx);
        this.encyclopedia = new Encyclopedia(this.ctx, this.renderer.getSpriteRenderer());

        // 遊戲狀態
        this.frameCount = 0;
        this.inputCooldown = 0;

        // 設置事件監聽
        this.setupEventListeners();

        // 開始遊戲循環
        this.loop();
    }

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        // 處理輸入動作
        this.events.on(GameEvents.INPUT_ACTION, () => this.handleAction());
        this.events.on(GameEvents.INPUT_TOGGLE_ENCYCLOPEDIA, () => this.toggleEncyclopedia());

        // 處理節奏遊戲效果
        this.events.on(GameEvents.RHYTHM_HIT, (data) => {
            this.renderer.createHitEffect(data.x, data.y, true);
        });

        this.events.on(GameEvents.RHYTHM_MISS, (data) => {
            this.renderer.createHitEffect(data.x, data.y, false);
        });
    }

    /**
     * 切換圖鑑顯示
     */
    toggleEncyclopedia() {
        if (this.inputCooldown > 0) return;

        const state = this.stateManager.getState();

        if (state === STATE.IDLE) {
            this.stateManager.forceState(STATE.ENCYCLOPEDIA);
            this.inputCooldown = TIMING.INPUT_COOLDOWN_NORMAL;
        } else if (state === STATE.ENCYCLOPEDIA) {
            this.stateManager.forceState(STATE.IDLE);
            this.inputCooldown = TIMING.INPUT_COOLDOWN_NORMAL;
        }
    }

    /**
     * 處理主要動作輸入
     */
    handleAction() {
        if (this.inputCooldown > 0) return;

        const state = this.stateManager.getState();

        switch (state) {
            case STATE.IDLE:
                this.fishingSystem.cast();
                break;

            case STATE.ENCYCLOPEDIA:
                this.stateManager.forceState(STATE.IDLE);
                this.inputCooldown = TIMING.INPUT_COOLDOWN_NORMAL;
                break;

            case STATE.WAITING:
                this.fishingSystem.pullEarly();
                this.inputCooldown = TIMING.INPUT_COOLDOWN_MISS;
                break;

            case STATE.HOOKING:
                this.fishingSystem.hook();
                break;

            case STATE.REELING:
                this.fishingSystem.checkRhythmHit();
                break;

            case STATE.CAUGHT:
            case STATE.MISSED:
                this.stateManager.forceState(STATE.IDLE);
                this.inputCooldown = TIMING.INPUT_COOLDOWN_RESULT;
                break;
        }
    }

    /**
     * 更新遊戲邏輯
     */
    update() {
        this.frameCount++;

        if (this.inputCooldown > 0) {
            this.inputCooldown--;
        }

        // 更新釣魚系統
        this.fishingSystem.update(this.frameCount);
    }

    /**
     * 繪製遊戲畫面
     */
    draw() {
        const state = this.stateManager.getState();

        // 清除並繪製背景
        this.renderer.clear();
        this.renderer.drawEnvironment();

        // 繪製釣竿
        const { tipX, tipY } = this.renderer.drawRod();

        // 繪製浮標（如果在釣魚狀態）
        if (this.stateManager.isPlaying()) {
            const bobberData = this.fishingSystem.getBobberRenderData();
            this.renderer.drawBobber(bobberData, tipX, tipY);
        }

        // 繪製上鉤提示
        if (state === STATE.HOOKING) {
            const bobberData = this.fishingSystem.getBobberRenderData();
            this.renderer.drawHookAlert(bobberData.x, bobberData.y - this.fishingSystem.bobber.floatOffset);
        }

        // 繪製節奏遊戲
        if (state === STATE.REELING) {
            const rhythmData = this.fishingSystem.getRhythmGameRenderData();
            this.renderer.drawRhythmGame(rhythmData);
        }

        // 繪製結果畫面
        if (state === STATE.CAUGHT) {
            const fish = this.fishingSystem.getCurrentFish();
            this.renderer.drawOverlay(
                `釣到了 ${fish.name}!`,
                `稀有度: ${fish.rarity}`,
                fish.sprite
            );
        } else if (state === STATE.MISSED) {
            this.renderer.drawOverlay("失敗!", "再試一次");
        }

        // 繪製 HUD（閒置狀態）
        if (state === STATE.IDLE) {
            this.hud.draw({
                score: this.collectionSystem.getScore(),
                collectionCount: this.collectionSystem.getCollectionCount(),
                totalCaught: this.collectionSystem.getTotalCaught()
            });
        }

        // 繪製圖鑑
        if (state === STATE.ENCYCLOPEDIA) {
            this.encyclopedia.draw(this.collectionSystem.getCollection());
        }

        // 繪製粒子效果
        this.renderer.updateAndDrawParticles();
    }

    /**
     * 遊戲主循環
     */
    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

// 啟動遊戲
new Game();
