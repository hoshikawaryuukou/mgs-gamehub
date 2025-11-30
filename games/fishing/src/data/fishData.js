/**
 * 魚類資料定義
 */

// 魚類資料
export const FISH_TYPES = [
    {
        id: 'sardine',
        name: "沙丁魚",
        rarity: 1,
        difficulty: 1,
        probability: 0.30,
        color: "#C0C0C0",
        sprite: "fish_sardine",
        desc: "常見的小魚，成群結隊。"
    },
    {
        id: 'clown',
        name: "小丑魚",
        rarity: 2,
        difficulty: 1.5,
        probability: 0.25,
        color: "#FF8C00",
        sprite: "fish_clown",
        desc: "色彩鮮豔，喜歡海葵。"
    },
    {
        id: 'puffer',
        name: "河豚",
        rarity: 3,
        difficulty: 2,
        probability: 0.20,
        color: "#FFFF00",
        sprite: "fish_puffer",
        desc: "生氣時會鼓起來，有毒。"
    },
    {
        id: 'tuna',
        name: "鮪魚",
        rarity: 4,
        difficulty: 3,
        probability: 0.15,
        color: "#000080",
        sprite: "fish_tuna",
        desc: "游得很快，肉質鮮美。"
    },
    {
        id: 'gold',
        name: "黃金鯉魚",
        rarity: 5,
        difficulty: 4,
        probability: 0.10,
        color: "#FFD700",
        sprite: "fish_gold",
        desc: "傳說中的魚，帶來好運。"
    }
];

// 失敗訊息
export const MISS_MESSAGES = {
    TOO_EARLY: { name: "什麼都沒釣到", rarity: 0 },
    TOO_LATE: { name: "魚跑了...", rarity: 0 },
    LINE_BREAK: { name: "線斷了！", rarity: 0 }
};

/**
 * 根據機率隨機選擇魚類
 * @returns {Object} 選中的魚類資料
 */
export function selectRandomFish() {
    const roll = Math.random();
    let cumulative = 0;

    for (const fish of FISH_TYPES) {
        cumulative += fish.probability;
        if (roll <= cumulative) {
            return fish;
        }
    }

    // 預設返回最後一種（最稀有）
    return FISH_TYPES[FISH_TYPES.length - 1];
}

/**
 * 根據 ID 取得魚類資料
 * @param {string} id - 魚類 ID
 * @returns {Object|null} 魚類資料
 */
export function getFishById(id) {
    return FISH_TYPES.find(fish => fish.id === id) || null;
}

/**
 * 根據名稱取得魚類資料
 * @param {string} name - 魚類名稱
 * @returns {Object|null} 魚類資料
 */
export function getFishByName(name) {
    return FISH_TYPES.find(fish => fish.name === name) || null;
}

/**
 * 取得魚類總數
 * @returns {number} 魚類總數
 */
export function getTotalFishCount() {
    return FISH_TYPES.length;
}
