export const CONFIG = {
    // MediaPipe & Tracking
    MAX_HANDS: 2,
    MIN_DETECTION_CONFIDENCE: 0.7,
    MIN_TRACKING_CONFIDENCE: 0.7,
    
    // Smoothing & Latency
    TARGET_FPS: 60,
    SMOOTHING_FACTOR: 0.3, // Lower is smoother but more latency. 0.3 is a good balance.
    MAX_HAND_TRACKING_LOSS_FRAMES: 10,
    
    // Gestures
    GESTURE_CONFIDENCE_THRESHOLD: 0.6,
    GESTURE_DEBOUNCE_MS: 150,
    PINKY_DOUBLE_PRESS_WINDOW_MS: 600,
    LOCK_COOLDOWN_MS: 1000,
    
    // 3D Rendering & Colors
    SCENE: {
        BACKGROUND: 0x0f172a, // Tailwind slate-900
        GRID_COLOR: 0x334155, // slate-700
    },
    COLORS: {
        IDLE: 0x94a3b8,        // slate-400
        HOVERING: 0x38bdf8,    // sky-400
        SELECTED: 0x818cf8,    // indigo-400
        MANIPULATING: 0x06b6d4, // cyan-500
        CREATING: 0x10b981,    // emerald-500
        LOCKED: 0xf59e0b,      // amber-500
    }
};
