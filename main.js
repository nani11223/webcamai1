import { CONFIG } from './config.js';
import { LandmarkProcessor } from './LandmarkProcessor.js';
import { GestureEngine } from './GestureEngine.js';
import { SceneManager } from './SceneManager.js';
import { UIRenderer } from './UIRenderer.js';

const videoElement = document.getElementById('videoElement');
const threeCanvas = document.getElementById('threeCanvas');
const uiCanvas = document.getElementById('uiCanvas');

// Initialize sub-systems
const landmarkProcessor = new LandmarkProcessor();
const gestureEngine = new GestureEngine();
const sceneManager = new SceneManager(threeCanvas);
const uiRenderer = new UIRenderer(uiCanvas);

// Setup Lock callback
gestureEngine.onLockCommand = () => {
    console.log('PINKY DOUBLE PRESS - LOCKING OBJECT');
    sceneManager.lockActiveObject();
};

let latestRawLandmarks = [];

// MediaPipe Callback
function onResults(results) {
    if (results.multiHandLandmarks) {
        latestRawLandmarks = results.multiHandLandmarks;
    } else {
        latestRawLandmarks = [];
    }
}

// MediaPipe Setup
const hands = new Hands({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.setOptions({
    maxNumHands: CONFIG.MAX_HANDS,
    modelComplexity: 1,
    minDetectionConfidence: CONFIG.MIN_DETECTION_CONFIDENCE,
    minTrackingConfidence: CONFIG.MIN_TRACKING_CONFIDENCE
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({image: videoElement});
    },
    width: 1280,
    height: 720
});
camera.start();

// Render Loop using RequestAnimationFrame (separated from camera tracking loop)
function renderLoop() {
    // 1. Process and Smooth Landmarks
    const smoothedHands = landmarkProcessor.process(latestRawLandmarks);
    
    // 2. Gesture State Machine
    const { state, activeControlPoints } = gestureEngine.process(smoothedHands);

    // 3. Update 3D Geometry
    sceneManager.updateActiveObject(activeControlPoints, state);
    sceneManager.render();

    // 4. Update 2D UI overlay
    uiRenderer.render(state, smoothedHands.length, sceneManager.lockedObjects.length);

    requestAnimationFrame(renderLoop);
}

// Start visual loop
requestAnimationFrame(renderLoop);
