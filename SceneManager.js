import { CONFIG } from './config.js';

export class SceneManager {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        this.scene = new THREE.Scene();
        
        this.camera = new THREE.PerspectiveCamera(45, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000);
        this.camera.position.z = 2; 
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(1, 1, 1);
        this.scene.add(dirLight);

        this.lockedObjects = [];
        
        // Active dynamic mesh
        this.activeGeometry = new THREE.BufferGeometry();
        
        // Use double-sided material since it's a dynamic plane/prism
        this.activeMaterial = new THREE.MeshPhongMaterial({ 
            color: CONFIG.COLORS.MANIPULATING, 
            transparent: true, 
            opacity: 0.6,
            side: THREE.DoubleSide,
            wireframe: false
        });
        
        this.activeMesh = new THREE.Mesh(this.activeGeometry, this.activeMaterial);
        this.activeMesh.visible = false;
        
        // Wireframe overlay for active mesh
        this.wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x00ffcc, linewidth: 2 });
        this.activeWireframe = new THREE.LineSegments(new THREE.WireframeGeometry(this.activeGeometry), this.wireframeMaterial);
        this.activeMesh.add(this.activeWireframe);
        
        this.scene.add(this.activeMesh);

        window.addEventListener('resize', () => {
            this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
            this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
            this.camera.updateProjectionMatrix();
        });
    }

    mapCoordinate(lm) {
        return new THREE.Vector3(
            (lm.x - 0.5) * 2 * -1,
            -(lm.y - 0.5) * 2,
            -lm.z * 2
        );
    }

    updateActiveObject(controlPoints, state) {
        // We need exactly two hands to draw connections between corresponding fingers
        if (controlPoints.length < 2) {
            this.activeMesh.visible = false;
            return;
        }

        this.activeMesh.visible = true;

        const hand1 = controlPoints[0];
        const hand2 = controlPoints[1];

        // Gather active pairs based on which fingers are extended (assumed active if present in the data)
        // GestureEngine will filter out fingers that are not actively "up" or "pinching"
        const vertices = [];
        const indices = [];

        // For simplicity, let's map standard order: Thumb, Index, Middle, Ring
        const activePairs = [];
        if (hand1.thumb && hand2.thumb) activePairs.push([this.mapCoordinate(hand1.thumb), this.mapCoordinate(hand2.thumb)]);
        if (hand1.index && hand2.index) activePairs.push([this.mapCoordinate(hand1.index), this.mapCoordinate(hand2.index)]);
        if (hand1.middle && hand2.middle) activePairs.push([this.mapCoordinate(hand1.middle), this.mapCoordinate(hand2.middle)]);
        if (hand1.ring && hand2.ring) activePairs.push([this.mapCoordinate(hand1.ring), this.mapCoordinate(hand2.ring)]);

        const pairCount = activePairs.length;

        if (pairCount < 2) {
            // Need at least 2 pairs to form a 2D plane (4 points)
            this.activeMesh.visible = false;
            return;
        }

        // Flatten vertices: all H1 points, then all H2 points
        activePairs.forEach(pair => vertices.push(pair[0].x, pair[0].y, pair[0].z));
        activePairs.forEach(pair => vertices.push(pair[1].x, pair[1].y, pair[1].z));
        
        const vArray = new Float32Array(vertices);
        this.activeGeometry.setAttribute('position', new THREE.BufferAttribute(vArray, 3));

        if (pairCount === 2) {
            // 2D Plane (2 pairs = 4 points)
            // H1_0, H1_1, H2_0, H2_1
            indices.push(
                0, 1, 2, // H1_0 -> H1_1 -> H2_0
                1, 3, 2  // H1_1 -> H2_1 -> H2_0
            );
        } else if (pairCount === 3) {
            // 3D Triangular Prism (3 pairs = 6 points)
            // Base 1 (Hand 1): 0, 1, 2
            // Base 2 (Hand 2): 3, 4, 5
            indices.push(
                0, 1, 2, // Base 1
                3, 5, 4, // Base 2 (reversed for facing)
                // Side 0-1 to 3-4
                0, 3, 4,
                0, 4, 1,
                // Side 1-2 to 4-5
                1, 4, 5,
                1, 5, 2,
                // Side 2-0 to 5-3
                2, 5, 3,
                2, 3, 0
            );
        } else if (pairCount === 4) {
            // 3D Hexahedron (4 pairs = 8 points)
            // Base 1: 0, 1, 2, 3
            // Base 2: 4, 5, 6, 7
            indices.push(
                0, 1, 2, 0, 2, 3, // Base 1
                4, 6, 5, 4, 7, 6, // Base 2
                0, 4, 5, 0, 5, 1, // Side 0-1
                1, 5, 6, 1, 6, 2, // Side 1-2
                2, 6, 7, 2, 7, 3, // Side 2-3
                3, 7, 4, 3, 4, 0  // Side 3-0
            );
        }

        this.activeGeometry.setIndex(indices);
        this.activeGeometry.computeVertexNormals();

        // Update wireframe
        this.activeMesh.remove(this.activeWireframe);
        this.activeWireframe = new THREE.LineSegments(new THREE.WireframeGeometry(this.activeGeometry), this.wireframeMaterial);
        this.activeMesh.add(this.activeWireframe);

        if (state === 'COMMAND_PENDING') {
            this.activeMaterial.color.setHex(CONFIG.COLORS.CREATING);
        } else {
            this.activeMaterial.color.setHex(CONFIG.COLORS.MANIPULATING);
        }
    }

    lockActiveObject() {
        if (!this.activeMesh.visible || this.activeGeometry.attributes.position.count === 0) return;

        const lockGeo = this.activeGeometry.clone();
        const lockMat = new THREE.MeshPhongMaterial({ 
            color: CONFIG.COLORS.LOCKED, 
            transparent: true, 
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const lockedMesh = new THREE.Mesh(lockGeo, lockMat);
        
        // Add wireframe
        const wireMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1, transparent: true, opacity: 0.3 });
        const wire = new THREE.LineSegments(new THREE.WireframeGeometry(lockGeo), wireMat);
        lockedMesh.add(wire);

        this.scene.add(lockedMesh);
        this.lockedObjects.push(lockedMesh);
        
        this.activeMesh.visible = false;
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
