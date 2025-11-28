/**
 * Zuma Clone - Vanilla JS Implementation
 */

// --- Constants ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const BALL_RADIUS = 16;
const BALL_DIAMETER = BALL_RADIUS * 2;
const BALL_SPEED = 0.5; // Speed of the chain
const BULLET_SPEED = 12;
const COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00']; // Red, Green, Blue, Yellow
const INSERT_ADJUST_SPEED = 5; // Speed at which balls adjust position after insertion

// --- Helper Classes ---

class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vector2(this.x - v.x, this.y - v.y); }
    mult(n) { return new Vector2(this.x * n, this.y * n); }
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    normalize() {
        const m = this.mag();
        return m === 0 ? new Vector2(0, 0) : new Vector2(this.x / m, this.y / m);
    }
    dist(v) { return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2); }
}

// --- Game Components ---

class Path {
    constructor() {
        this.points = [];
        this.totalLength = 0;
        this.generateSpiralPath();
    }

    generateSpiralPath() {
        // Create a spiral path starting from outside and going in
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;

        // Adjusted to fit in 800x600 and loop ~3 times
        const startRadius = 270;
        const endRadius = 50;
        const numLoops = 3;
        const totalSteps = 300; // Number of points to generate
        const totalAngle = numLoops * Math.PI * 2;

        this.points = [];

        for (let i = 0; i <= totalSteps; i++) {
            const t = i / totalSteps;
            const angle = t * totalAngle; // 0 to 6PI
            const radius = startRadius - (startRadius - endRadius) * t;

            // Start from top (-PI/2) to look nice
            const finalAngle = angle - Math.PI / 2;

            const x = centerX + Math.cos(finalAngle) * radius;
            const y = centerY + Math.sin(finalAngle) * radius;
            this.points.push(new Vector2(x, y));
        }

        // Calculate total length and segment lengths for interpolation
        this.totalLength = 0;
        this.distances = [0]; // Cumulative distance at each point
        for (let i = 0; i < this.points.length - 1; i++) {
            const d = this.points[i].dist(this.points[i + 1]);
            this.totalLength += d;
            this.distances.push(this.totalLength);
        }
    }

    getPointAtDistance(dist) {
        if (dist < 0) dist = 0;
        if (dist >= this.totalLength) return null; // End of path

        // Binary search or simple scan to find the segment
        // Optimization: Could cache last index if moving sequentially
        let index = 0;
        for (let i = 0; i < this.distances.length - 1; i++) {
            if (dist >= this.distances[i] && dist < this.distances[i + 1]) {
                index = i;
                break;
            }
        }

        const p1 = this.points[index];
        const p2 = this.points[index + 1];
        const segmentDist = this.distances[index + 1] - this.distances[index];
        const progress = (dist - this.distances[index]) / segmentDist;

        const x = p1.x + (p2.x - p1.x) * progress;
        const y = p1.y + (p2.y - p1.y) * progress;

        // Calculate angle for rotation if needed
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

        return { x, y, angle };
    }
}

class Ball {
    constructor(color, distance) {
        this.color = color;
        this.distance = distance; // Distance along the path
        this.x = 0;
        this.y = 0;
        this.angle = 0;

        // Linked List pointers
        this.prev = null; // Towards the start of the path (higher distance usually, but depends on implementation. Let's say Head is at max distance)
        this.next = null; // Towards the end of the path (lower distance)

        // State
        this.targetDistance = null; // For smooth insertion animation
        this.isInserting = false;
        this.markedForRemoval = false;
    }

    updatePosition(path) {
        const pos = path.getPointAtDistance(this.distance);
        if (pos) {
            this.x = pos.x;
            this.y = pos.y;
            this.angle = pos.angle;
            return true; // Still on path
        }
        return false; // Reached end
    }
}

class Bullet {
    constructor(x, y, angle, color) {
        this.pos = new Vector2(x, y);
        this.vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(BULLET_SPEED);
        this.color = color;
        this.radius = BALL_RADIUS;
        this.active = true;
    }

    update() {
        this.pos = this.pos.add(this.vel);
        // Check bounds
        if (this.pos.x < -50 || this.pos.x > CANVAS_WIDTH + 50 ||
            this.pos.y < -50 || this.pos.y > CANVAS_HEIGHT + 50) {
            this.active = false;
        }
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.path = new Path();

        // Game State
        this.balls = []; // Array for easy iteration, but logic relies on Linked List
        this.head = null; // The ball furthest along the path
        this.tail = null; // The ball closest to the start

        this.bullets = [];
        this.shooterPos = new Vector2(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        this.shooterAngle = 0;
        this.nextBulletColor = this.getRandomColor();
        this.currentBulletColor = this.getRandomColor();

        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;

        // Input
        this.mousePos = new Vector2(0, 0);
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
        });
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.gameOver) this.shoot();
        });
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                // Swap colors
                const temp = this.currentBulletColor;
                this.currentBulletColor = this.nextBulletColor;
                this.nextBulletColor = temp;
            }
        });
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());

        // Initial balls
        this.spawnInitialBalls(20);

        this.lastTime = 0;
        requestAnimationFrame((t) => this.loop(t));
    }

    getRandomColor() {
        return COLORS[Math.floor(Math.random() * COLORS.length)];
    }

    spawnInitialBalls(count) {
        let startDist = 100; // Start a bit into the path
        for (let i = 0; i < count; i++) {
            const ball = new Ball(this.getRandomColor(), startDist + i * BALL_DIAMETER);
            this.addBallToChain(ball);
        }
    }

    addBallToChain(ball) {
        // Add to the end (tail) of the chain
        // In this implementation:
        // Head is the ball furthest along the path (highest distance index? No, let's say path starts at 0. 
        // So balls move from 0 -> totalLength.
        // Head = ball with highest distance. Tail = ball with lowest distance.

        if (!this.head) {
            this.head = ball;
            this.tail = ball;
        } else {
            // Add to tail (lowest distance)
            // OldTail (Higher Dist) -> NewBall (Lower Dist)
            this.tail.next = ball;
            ball.prev = this.tail;
            this.tail = ball;
        }
        this.balls.push(ball);
    }

    restart() {
        this.balls = [];
        this.head = null;
        this.tail = null;
        this.bullets = [];
        this.score = 0;
        this.gameOver = false;
        document.getElementById('game-over').classList.add('hidden');
        this.spawnInitialBalls(20);
        this.updateScore(0);
    }

    updateScore(points) {
        this.score += points;
        document.getElementById('score').innerText = `Score: ${this.score}`;
    }

    shoot() {
        const bullet = new Bullet(
            this.shooterPos.x,
            this.shooterPos.y,
            this.shooterAngle,
            this.currentBulletColor
        );
        this.bullets.push(bullet);

        this.currentBulletColor = this.nextBulletColor;
        this.nextBulletColor = this.getRandomColor();
    }

    loop(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (!this.gameOver && !this.isPaused) {
            this.update();
        }
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }

    update() {
        // 1. Update Shooter Angle
        this.shooterAngle = Math.atan2(
            this.mousePos.y - this.shooterPos.y,
            this.mousePos.x - this.shooterPos.x
        );

        // 2. Move Chain
        // Logic: The "push" comes from the back (Tail).
        // Only the tail moves automatically. Other balls move only if pushed by the ball behind them.

        if (this.tail) {
            this.tail.distance += BALL_SPEED;
        }

        let current = this.tail;
        while (current && current.prev) {
            const ballAhead = current.prev;
            const minDist = current.distance + BALL_DIAMETER;

            // If ballAhead is behind where it should be (overlapped by current), push it.
            if (ballAhead.distance < minDist) {
                ballAhead.distance = minDist;
            }

            current = current.prev;
        }

        // Check Game Over (Check Head)
        if (this.head && this.head.distance >= this.path.totalLength) {
            this.gameOver = true;
            const el = document.getElementById('game-over');
            el.querySelector('h1').innerText = "GAME OVER";
            el.querySelector('h1').style.color = "#ff4444";
            el.classList.remove('hidden');
        }

        // Update positions
        this.balls.forEach(b => b.updatePosition(this.path));

        // 3. Update Bullets & Collision
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update();

            if (!b.active) {
                this.bullets.splice(i, 1);
                continue;
            }

            // Collision Check
            // Find closest ball
            let hitBall = null;
            let minD = Infinity;

            for (const ball of this.balls) {
                const d = b.pos.dist(new Vector2(ball.x, ball.y));
                if (d < BALL_DIAMETER && d < minD) {
                    minD = d;
                    hitBall = ball;
                }
            }

            if (hitBall) {
                this.handleCollision(b, hitBall);
                this.bullets.splice(i, 1);
            }
        }

        // Remove balls marked for removal
        this.balls = this.balls.filter(b => !b.markedForRemoval);

        // Check Victory
        if (this.balls.length === 0 && !this.gameOver) {
            this.gameOver = true;
            const el = document.getElementById('game-over');
            el.querySelector('h1').innerText = "VICTORY!";
            el.querySelector('h1').style.color = "#44ff44";
            el.classList.remove('hidden');
        }
    }

    handleCollision(bullet, hitBall) {
        // Determine insertion point (before or after hitBall)
        // We can check the angle or simply where the bullet hit relative to the ball's center along the path tangent.
        // Simple heuristic: if bullet is "ahead" of ball in path direction, insert before (higher distance).
        // Else insert after (lower distance).

        // Let's use the path angle at the ball's position.
        const pathAngle = hitBall.angle;
        const bulletAngle = Math.atan2(bullet.pos.y - hitBall.y, bullet.pos.x - hitBall.x);

        // Normalize angle difference
        let diff = bulletAngle - pathAngle;
        while (diff <= -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        // If diff is roughly in front (e.g., -90 to 90 degrees relative to forward vector? No.)
        // The path angle points "forward" along the path.
        // If the bullet hits the "front" face of the ball, it should insert *after* (lower distance, pushing back).
        // If it hits the "back" face, it should insert *before* (higher distance, pushing front).

        // Actually, simpler: compare distances.
        // But bullet doesn't have a path distance.
        // Let's just use the visual hit.

        const newBall = new Ball(bullet.color, hitBall.distance); // Temp distance

        // Insert Logic
        // We need to insert into the Linked List

        // If we hit the "front" (higher distance side), we insert as hitBall.prev
        // If we hit the "back" (lower distance side), we insert as hitBall.next

        // Let's assume we always insert "behind" (lower distance) for simplicity unless we hit the very front?
        // Let's try to determine based on relative position.
        // Vector from Ball to Bullet.
        // Vector of Path Tangent.
        // Dot product.
        const dx = Math.cos(hitBall.angle);
        const dy = Math.sin(hitBall.angle);
        const toBulletX = bullet.pos.x - hitBall.x;
        const toBulletY = bullet.pos.y - hitBall.y;
        const dot = dx * toBulletX + dy * toBulletY;

        let insertAfter = false; // After means lower distance (towards tail)

        if (dot > 0) {
            // Bullet is "in front" of the ball (towards head)
            // So we should insert *ahead* of hitBall (between hitBall and hitBall.prev)
            // Wait, "ahead" means higher distance.
            // So newBall.distance > hitBall.distance.
            insertAfter = false;
        } else {
            // Bullet is "behind" the ball
            // Insert between hitBall and hitBall.next
            insertAfter = true;
        }

        if (insertAfter) {
            // Insert between hitBall and hitBall.next
            // hitBall -> newBall -> hitBall.next
            newBall.distance = hitBall.distance - BALL_DIAMETER;

            newBall.prev = hitBall;
            newBall.next = hitBall.next;

            if (hitBall.next) {
                hitBall.next.prev = newBall;
            } else {
                this.tail = newBall;
            }
            hitBall.next = newBall;

        } else {
            // Insert between hitBall.prev and hitBall
            // hitBall.prev -> newBall -> hitBall
            newBall.distance = hitBall.distance + BALL_DIAMETER;

            newBall.next = hitBall;
            newBall.prev = hitBall.prev;

            if (hitBall.prev) {
                hitBall.prev.next = newBall;
            } else {
                this.head = newBall;
            }
            hitBall.prev = newBall;
        }

        this.balls.push(newBall);

        // Check Matches
        this.checkMatches(newBall);
    }

    checkMatches(startBall) {
        // Check neighbors for same color
        let matchCount = 1;
        let start = startBall;
        let end = startBall;

        // Check forward (prev pointers, higher distance)
        let curr = startBall.prev;
        while (curr && curr.color === startBall.color) {
            matchCount++;
            start = curr;
            curr = curr.prev;
        }

        // Check backward (next pointers, lower distance)
        curr = startBall.next;
        while (curr && curr.color === startBall.color) {
            matchCount++;
            end = curr;
            curr = curr.next;
        }

        if (matchCount >= 3) {
            // Remove balls from start to end
            this.removeRange(start, end);
            this.updateScore(matchCount * 10);

            // TODO: Handle gap closing (magnetic effect)
            // For now, the gap will just stay or be filled by movement logic if we implemented gravity/push
            // Our update loop pushes from head, but doesn't pull.
            // To fix gaps, we need to pull the tail side towards the head side if colors match?
            // Or just pull tail side forward to close gap?
            // Standard Zuma: Back chain stops. Front chain moves. If back chain ends match front chain ends, back chain gets pulled.
            // For this MVP, let's just let the back chain catch up naturally (since we move everyone by speed).
            // Wait, if we remove balls, there is a distance gap.
            // The `update` loop:
            // current.distance += speed
            // if (current.next) check min distance.
            // This logic PUSHES balls apart if they overlap, but doesn't PULL them together if there's a gap.
            // So a gap will remain and move along the track.
            // To close the gap, we need to manually adjust distances of the 'tail' side of the gap.

            // Let's implement a simple "Gravity" / "Vacuum" where the tail side slides forward to close the gap.
            this.closeGap(start.prev, end.next);
        }
    }

    closeGap(frontBall, backBall) {
        // frontBall is the ball ahead of the gap (higher distance)
        // backBall is the ball behind the gap (lower distance)

        // Magnetic Effect: If colors match, pull frontBall (and its chain) backwards
        if (frontBall && backBall && frontBall.color === backBall.color) {
            const targetDist = backBall.distance + BALL_DIAMETER;
            const shift = targetDist - frontBall.distance; // shift will be negative (moving back)

            // Move frontBall and everything ahead of it (prev)
            let curr = frontBall;
            while (curr) {
                curr.distance += shift;
                curr = curr.prev;
            }

            // Check for new matches after closing
            this.checkMatches(frontBall);
        }
    }

    removeRange(startNode, endNode) {
        // Remove nodes from Linked List
        const before = startNode.prev; // Higher distance side
        const after = endNode.next;    // Lower distance side

        if (before) {
            before.next = after;
        } else {
            this.head = after;
        }

        if (after) {
            after.prev = before;
        } else {
            this.tail = before;
        }

        // Mark for removal from array
        let curr = startNode;
        while (curr) {
            curr.markedForRemoval = true;
            if (curr === endNode) break;
            curr = curr.next;
        }
    }

    draw() {
        // Clear
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw Path (Groove effect)
        if (this.path.points.length > 0) {
            // Outer border (lighter)
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#555';
            this.ctx.lineWidth = 44;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.moveTo(this.path.points[0].x, this.path.points[0].y);
            for (let i = 1; i < this.path.points.length; i++) {
                this.ctx.lineTo(this.path.points[i].x, this.path.points[i].y);
            }
            this.ctx.stroke();

            // Inner groove (darker)
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#111';
            this.ctx.lineWidth = 36;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.moveTo(this.path.points[0].x, this.path.points[0].y);
            for (let i = 1; i < this.path.points.length; i++) {
                this.ctx.lineTo(this.path.points[i].x, this.path.points[i].y);
            }
            this.ctx.stroke();
        }

        // Draw Skull/Hole at end
        const endPt = this.path.points[this.path.points.length - 1];
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(endPt.x, endPt.y, 30, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = "20px Arial";
        this.ctx.fillText("☠️", endPt.x - 12, endPt.y + 7);

        // Draw Balls
        // Draw from tail to head to handle overlap correctly? Doesn't matter much for 2D circles.
        for (const ball of this.balls) {
            this.drawBall(ball.x, ball.y, ball.color);
        }

        // Draw Bullets
        for (const b of this.bullets) {
            this.drawBall(b.pos.x, b.pos.y, b.color);
        }

        // Draw Shooter
        this.ctx.save();
        this.ctx.translate(this.shooterPos.x, this.shooterPos.y);
        this.ctx.rotate(this.shooterAngle);

        // Shooter Body
        this.ctx.fillStyle = '#888';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 40, 0, Math.PI * 2);
        this.ctx.fill();

        // Nozzle
        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(0, -10, 50, 20);

        // Next Ball (Back) - Smaller
        // Draw a small "holder" for the next ball
        this.ctx.fillStyle = '#555';
        this.ctx.beginPath();
        this.ctx.arc(-25, 0, 12, 0, Math.PI * 2);
        this.ctx.fill();
        this.drawBall(-25, 0, this.nextBulletColor, 10);

        // Current Ball (Mouth/Center)
        this.drawBall(15, 0, this.currentBulletColor);

        this.ctx.restore();
    }

    drawBall(x, y, color, radius = BALL_RADIUS) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);

        // Gradient for 3D look
        const grad = this.ctx.createRadialGradient(x - radius / 3, y - radius / 3, radius / 5, x, y, radius);
        grad.addColorStop(0, 'white');
        grad.addColorStop(0.3, color);
        grad.addColorStop(1, 'black');

        this.ctx.fillStyle = grad;
        this.ctx.fill();
        this.ctx.lineWidth = 1; // Reset line width
        this.ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        this.ctx.stroke();
    }
}

// Start Game
window.onload = () => {
    const game = new Game();
};
