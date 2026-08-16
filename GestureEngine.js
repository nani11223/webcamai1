import { CONFIG } from './config.js';

export const GESTURE_STATES = {
    IDLE: 'IDLE',
    MANIPULATING: 'MANIPULATING',
    COMMAND_PENDING: 'COMMAND_PENDING',
    LOCKED: 'LOCKED'
};

export class GestureEngine {
    constructor() {
        this.currentState = GESTURE_STATES.IDLE;
        this.onLockCommand = null;
        
        // Add global keyboard listener for locking
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.triggerLock();
            }
        });
    }

    triggerLock() {
        if (this.currentState === GESTURE_STATES.LOCKED) return;
        this.currentState = GESTURE_STATES.LOCKED;
        if (this.onLockCommand) this.onLockCommand();
        setTimeout(() => { this.currentState = GESTURE_STATES.IDLE; }, CONFIG.LOCK_COOLDOWN_MS);
    }

    // Helper to see if finger is generally extended (tip is above PIP joint in Y, assuming upright hand)
    isFingerExtended(landmarks, tipIdx, pipIdx) {
        if (!landmarks) return false;
        // Basic heuristic: if the tip is further from wrist(0) than the PIP joint, it's somewhat extended
        const dTip = Math.hypot(landmarks[tipIdx].x - landmarks[0].x, landmarks[tipIdx].y - landmarks[0].y);
        const dPip = Math.hypot(landmarks[pipIdx].x - landmarks[0].x, landmarks[pipIdx].y - landmarks[0].y);
        return dTip > dPip;
    }

    process(smoothedHands) {
        if (this.currentState === GESTURE_STATES.LOCKED) {
            return { state: this.currentState, activeControlPoints: [] };
        }

        if (smoothedHands.length === 0) {
            this.currentState = GESTURE_STATES.IDLE;
            return { state: this.currentState, activeControlPoints: [] };
        }

        let controlPoints = [];

        smoothedHands.forEach(hand => {
            const activeFingers = {};
            
            // Thumb is usually always tracked as a control point for base
            activeFingers.thumb = hand[4]; 
            
            // Check Index (Tip:8, PIP:6)
            if (this.isFingerExtended(hand, 8, 6)) activeFingers.index = hand[8];
            // Check Middle (Tip:12, PIP:10)
            if (this.isFingerExtended(hand, 12, 10)) activeFingers.middle = hand[12];
            // Check Ring (Tip:16, PIP:14)
            if (this.isFingerExtended(hand, 16, 14)) activeFingers.ring = hand[16];

            controlPoints.push(activeFingers);
        });

        if (this.currentState !== GESTURE_STATES.LOCKED) {
            this.currentState = GESTURE_STATES.MANIPULATING;
        }

        return {
            state: this.currentState,
            activeControlPoints: controlPoints
        };
    }
}
