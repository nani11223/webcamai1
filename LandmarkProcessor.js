import { CONFIG } from './config.js';

export class LandmarkProcessor {
    constructor() {
        this.smoothedLandmarks = new Map(); // handIndex -> array of smoothed {x, y, z}
        this.smoothingFactor = CONFIG.SMOOTHING_FACTOR;
    }

    /**
     * Applies Exponential Moving Average (EMA) to reduce jitter.
     */
    process(multiHandLandmarks) {
        if (!multiHandLandmarks || multiHandLandmarks.length === 0) {
            this.smoothedLandmarks.clear();
            return [];
        }

        const processedResult = [];

        multiHandLandmarks.forEach((landmarks, handIdx) => {
            if (!this.smoothedLandmarks.has(handIdx)) {
                // Initialize with raw values on first frame
                this.smoothedLandmarks.set(handIdx, landmarks.map(lm => ({ x: lm.x, y: lm.y, z: lm.z })));
            } else {
                const currentSmoothed = this.smoothedLandmarks.get(handIdx);
                const nextSmoothed = landmarks.map((lm, i) => {
                    return {
                        x: currentSmoothed[i].x + this.smoothingFactor * (lm.x - currentSmoothed[i].x),
                        y: currentSmoothed[i].y + this.smoothingFactor * (lm.y - currentSmoothed[i].y),
                        z: currentSmoothed[i].z + this.smoothingFactor * (lm.z - currentSmoothed[i].z)
                    };
                });
                this.smoothedLandmarks.set(handIdx, nextSmoothed);
            }
            
            processedResult.push(this.smoothedLandmarks.get(handIdx));
        });

        return processedResult;
    }

    clear() {
        this.smoothedLandmarks.clear();
    }
}
