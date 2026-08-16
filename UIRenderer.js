export class UIRenderer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 0;

        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    updateFPS() {
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;
        }
    }

    render(gestureState, numHands, lockedCount) {
        this.updateFPS();
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Performance Panel
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        this.ctx.fillRect(20, 20, 220, 110);
        this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        this.ctx.strokeRect(20, 20, 220, 110);

        this.ctx.font = '12px "Courier New", monospace';
        this.ctx.fillStyle = '#38bdf8'; // sky-400
        
        this.ctx.fillText(`FPS: ${this.fps}`, 35, 45);
        this.ctx.fillText(`HANDS: ${numHands}`, 35, 65);
        this.ctx.fillText(`LOCKED OBJS: ${lockedCount}`, 35, 85);
        
        let stateColor = '#94a3b8'; // default idle
        if (gestureState === 'MANIPULATING') stateColor = '#06b6d4';
        if (gestureState === 'COMMAND_PENDING') stateColor = '#10b981';
        if (gestureState === 'LOCKED') stateColor = '#f59e0b';

        this.ctx.fillStyle = stateColor;
        this.ctx.fillText(`STATE: ${gestureState}`, 35, 105);

        // Draw XYZ Gizmo reference at bottom right
        const gizmoX = this.canvas.width - 60;
        const gizmoY = this.canvas.height - 60;

        this.ctx.lineWidth = 2;
        
        // X-axis (Red)
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.moveTo(gizmoX, gizmoY);
        this.ctx.lineTo(gizmoX + 30, gizmoY);
        this.ctx.stroke();
        this.ctx.fillStyle = '#ef4444';
        this.ctx.fillText('X', gizmoX + 35, gizmoY + 4);

        // Y-axis (Green)
        this.ctx.strokeStyle = '#22c55e';
        this.ctx.beginPath();
        this.ctx.moveTo(gizmoX, gizmoY);
        this.ctx.lineTo(gizmoX, gizmoY - 30);
        this.ctx.stroke();
        this.ctx.fillStyle = '#22c55e';
        this.ctx.fillText('Y', gizmoX - 4, gizmoY - 35);

        // Z-axis (Blue, angled)
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.beginPath();
        this.ctx.moveTo(gizmoX, gizmoY);
        this.ctx.lineTo(gizmoX - 20, gizmoY + 20);
        this.ctx.stroke();
        this.ctx.fillStyle = '#3b82f6';
        this.ctx.fillText('Z', gizmoX - 28, gizmoY + 28);
    }
}
