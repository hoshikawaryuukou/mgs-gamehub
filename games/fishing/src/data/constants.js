/**
 * 遊戲常數配置
 */

// 畫布尺寸
export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 240;

// 物理常數
export const GRAVITY = 0.2;

// 顏色配置
export const COLORS = {
    // 環境
    sky: '#87CEEB',
    water: '#4682B4',
    waterDark: '#2F4F4F',
    grass: '#228B22',

    // 角色/物件
    player: '#FF6347',
    bobber: '#FF0000',
    bobberWhite: '#FFFFFF',
    rod: '#8B4513',

    // UI
    uiBg: 'rgba(0, 0, 0, 0.7)',
    uiBgDark: 'rgba(0, 0, 0, 0.9)',
    uiBgOverlay: 'rgba(0, 0, 0, 0.5)',
    text: '#FFFFFF',
    textMuted: '#AAA',
    textDark: '#555',

    // 節奏遊戲
    barBg: '#333333',
    barTarget: '#00FF00',
    barCursor: '#FFFF00',
    progressBar: '#00FF00',
    tensionBar: '#FF0000',

    // 效果
    hitEffect: '#00FF00',
    missEffect: '#FF0000',
    alertEffect: '#FFFF00'
};

// 遊戲狀態
export const STATE = {
    IDLE: 'IDLE',
    CASTING: 'CASTING',
    WAITING: 'WAITING',
    HOOKING: 'HOOKING',
    REELING: 'REELING',
    CAUGHT: 'CAUGHT',
    MISSED: 'MISSED',
    ENCYCLOPEDIA: 'ENCYCLOPEDIA'
};

// 時間配置（以幀為單位，60fps）
export const TIMING = {
    // 投竿動畫時間（毫秒）
    CAST_DURATION: 500,

    // 等待咬餌時間範圍（幀）
    WAIT_MIN: 100,
    WAIT_MAX: 300,

    // 上鉤反應時間（幀）
    HOOK_WINDOW: 60,

    // 輸入冷卻時間（幀）
    INPUT_COOLDOWN_NORMAL: 10,
    INPUT_COOLDOWN_RESULT: 20,
    INPUT_COOLDOWN_MISS: 30
};

// 節奏遊戲配置
export const RHYTHM_CONFIG = {
    BAR_WIDTH: 200,
    BAR_HEIGHT: 10,
    INITIAL_PROGRESS: 20,
    PROGRESS_PER_HIT: 15,
    TENSION_PER_MISS: 20,
    SPEED_MULTIPLIER: 1.05,
    BASE_CURSOR_SPEED: 2,
    BASE_TARGET_WIDTH: 60,
    MIN_TARGET_WIDTH: 20,
    TARGET_WIDTH_REDUCTION: 10
};

// 浮標配置
export const BOBBER_CONFIG = {
    // 投擲範圍
    CAST_X_CENTER: GAME_WIDTH / 2,
    CAST_X_RANGE: 120,
    CAST_Y_MIN: 130,
    CAST_Y_RANGE: 80,

    // 漂浮動畫
    FLOAT_SPEED_NORMAL: 0.1,
    FLOAT_AMPLITUDE_NORMAL: 2,
    FLOAT_SPEED_HOOKING: 0.5,
    FLOAT_AMPLITUDE_HOOKING: 5
};

// 釣竿配置
export const ROD_CONFIG = {
    START_X: GAME_WIDTH + 20,
    START_Y: GAME_HEIGHT + 20,
    TIP_X: GAME_WIDTH - 60,
    TIP_Y: GAME_HEIGHT - 60
};

// UI 配置
export const UI_CONFIG = {
    // HUD 位置
    HUD_X: 10,
    HUD_Y_START: 20,
    HUD_LINE_HEIGHT: 15,

    // 圖鑑按鈕
    BOOK_ICON_SIZE: 20,
    BOOK_ICON_PADDING: 10,

    // 圖鑑
    ENCYCLOPEDIA_PADDING: 10,
    ENCYCLOPEDIA_ITEM_HEIGHT: 35,
    ENCYCLOPEDIA_START_Y: 50
};

// 分數配置
export const SCORE_CONFIG = {
    RARITY_MULTIPLIER: 100
};
