/**
 * 粒子類別
 */
class Particle {
    constructor(x, y, color, vx, vy, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }

    isAlive() {
        return this.life > 0;
    }

    getAlpha() {
        return this.life / this.maxLife;
    }
}

/**
 * 粒子系統 - 管理遊戲中的粒子效果
 */
export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    /**
     * 建立粒子
     * @param {number} x - X 座標
     * @param {number} y - Y 座標
     * @param {string} color - 顏色
     * @param {Object} options - 選項
     */
    create(x, y, color, options = {}) {
        const {
            count = 1,
            spreadX = 2,
            spreadY = 2,
            baseVY = -2,
            life = 20
        } = options;

        for (let i = 0; i < count; i++) {
            const vx = (Math.random() - 0.5) * spreadX;
            const vy = baseVY + (Math.random() - 0.5);
            this.particles.push(new Particle(x, y, color, vx, vy, life));
        }
    }

    /**
     * 建立命中效果粒子
     * @param {number} x - X 座標
     * @param {number} y - Y 座標
     * @param {boolean} isHit - 是否命中
     */
    createHitEffect(x, y, isHit) {
        const color = isHit ? '#00FF00' : '#FF0000';
        this.create(x, y, color, { count: 3, spreadX: 3, spreadY: 1 });
    }

    /**
     * 建立釣到魚的慶祝效果
     * @param {number} x - X 座標
     * @param {number} y - Y 座標
     */
    createCelebration(x, y) {
        const colors = ['#FFD700', '#FF6347', '#00FF00', '#87CEEB'];
        colors.forEach(color => {
            this.create(x, y, color, { count: 5, spreadX: 4, spreadY: 3, life: 30 });
        });
    }

    /**
     * 更新所有粒子
     */
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (!this.particles[i].isAlive()) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * 繪製所有粒子
     * @param {CanvasRenderingContext2D} ctx - 畫布上下文
     */
    draw(ctx) {
        this.particles.forEach(p => {
            ctx.globalAlpha = p.getAlpha();
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 2, 2);
        });
        ctx.globalAlpha = 1;
    }

    /**
     * 清除所有粒子
     */
    clear() {
        this.particles = [];
    }

    /**
     * 取得粒子數量
     * @returns {number}
     */
    getCount() {
        return this.particles.length;
    }
}
