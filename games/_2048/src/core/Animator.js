/**
 * Animator - 封裝所有動畫邏輯
 */
export class Animator {
    constructor(gridManager) {
        this.gridManager = gridManager;
    }

    animateMove(animations) {
        if (animations.length === 0) return Promise.resolve();

        const promises = animations.map(anim => {
            const pos = this.gridManager.getPosition(anim.toRow, anim.toCol);
            return anime({
                targets: anim.tile.element,
                left: pos.x,
                top: pos.y,
                duration: 150,
                easing: 'easeOutQuad'
            }).finished;
        });

        return Promise.all(promises);
    }

    animateAppear(element) {
        return anime({
            targets: element,
            scale: [0, 1],
            opacity: [0, 1],
            duration: 200,
            easing: 'easeOutBack'
        }).finished;
    }

    animateMerge(element) {
        return anime({
            targets: element,
            scale: [1, 1.2, 1],
            duration: 200,
            easing: 'easeOutQuad'
        }).finished;
    }

    animateMessage(element) {
        return anime({
            targets: element,
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuad'
        }).finished;
    }

    animateScore(element, fromValue, toValue) {
        return anime({
            targets: element,
            innerHTML: [fromValue, toValue],
            round: 1,
            duration: 300,
            easing: 'easeOutQuad'
        }).finished;
    }
}
