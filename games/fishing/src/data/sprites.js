/**
 * 精靈圖資料定義
 */

// 調色板定義
export const PALETTE = {
    _: null,       // 透明
    x: '#000000',  // 輪廓（黑）
    w: '#FFFFFF',  // 白/高光
    o: '#FF6347',  // 橙色
    y: '#FFD700',  // 金色
    b: '#4682B4',  // 藍色
    g: '#C0C0C0',  // 灰色
    d: '#A9A9A9',  // 深灰
    r: '#FF0000',  // 紅色
};

// 精靈圖定義
export const SPRITES = {
    fish_sardine: [
        "__xxxx______",
        "_xggggx_____",
        "xggggggx____",
        "xggwwggx____",
        "xggggggx____",
        "xggggggx____",
        "_xggggx_____",
        "__xxxx______"
    ],
    fish_clown: [
        "___xxxx_____",
        "__xoooox____",
        "_xowwwoox___",
        "_xoooooox___",
        "_xowwwoox___",
        "__xoooox____",
        "___xxxx_____"
    ],
    fish_puffer: [
        "____xx______",
        "___xyyx_____",
        "__xyyyyx____",
        "_xyywyyyx___",
        "_xyyyyyyx___",
        "__xyyyyx____",
        "___xyyx_____"
    ],
    fish_tuna: [
        "__xxxxxx____",
        "_xbbbbbbx___",
        "xbbwwwwbbx__",
        "xbbbbbbbbx__",
        "xbbbbbbbbx__",
        "_xbbbbbbx___",
        "__xxxxxx____"
    ],
    fish_gold: [
        "____xxxx____",
        "___xyyyyx___",
        "__xyyyyyyx__",
        "_xyywwyyyyx_",
        "xyyyyyyyyyx_",
        "_xyyyyyyx___",
        "__xyyyyx____",
        "___xxxx_____"
    ]
};

/**
 * 取得精靈圖尺寸
 * @param {string} spriteKey - 精靈圖鍵值
 * @returns {{width: number, height: number}} 精靈圖尺寸
 */
export function getSpriteSize(spriteKey) {
    const sprite = SPRITES[spriteKey];
    if (!sprite) return { width: 0, height: 0 };

    return {
        width: sprite[0].length,
        height: sprite.length
    };
}
