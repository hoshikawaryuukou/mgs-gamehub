/**
 * InputHandler - 處理所有使用者輸入事件
 */
export class InputHandler {
    constructor(gameContainer, onMove, onNewGame, onResize) {
        this.gameContainer = gameContainer;
        this.onMove = onMove;
        this.onNewGame = onNewGame;
        this.onResize = onResize;

        this.setupKeyboardEvents();
        this.setupTouchEvents();
        this.setupButtonEvents();
        this.setupResizeEvent();
    }

    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            let direction = null;
            switch (e.key) {
                case 'ArrowUp': e.preventDefault(); direction = 'up'; break;
                case 'ArrowDown': e.preventDefault(); direction = 'down'; break;
                case 'ArrowLeft': e.preventDefault(); direction = 'left'; break;
                case 'ArrowRight': e.preventDefault(); direction = 'right'; break;
            }
            if (direction) this.onMove(direction);
        });
    }

    setupTouchEvents() {
        let touchStartX, touchStartY;
        const minSwipeDistance = 50;

        this.gameContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        this.gameContainer.addEventListener('touchend', (e) => {
            const deltaX = e.changedTouches[0].clientX - touchStartX;
            const deltaY = e.changedTouches[0].clientY - touchStartY;
            let direction = null;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) > minSwipeDistance) {
                    direction = deltaX > 0 ? 'right' : 'left';
                }
            } else {
                if (Math.abs(deltaY) > minSwipeDistance) {
                    direction = deltaY > 0 ? 'down' : 'up';
                }
            }
            if (direction) this.onMove(direction);
        }, { passive: true });
    }

    setupButtonEvents() {
        document.getElementById('new-game-btn').addEventListener('click', () => this.onNewGame());
        document.querySelector('.retry-btn').addEventListener('click', () => this.onNewGame());
    }

    setupResizeEvent() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.onResize(), 100);
        });
    }
}
