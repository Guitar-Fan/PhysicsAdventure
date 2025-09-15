/**
 * Game Manager - Simplified using Matter.js physics engine
 * Handles game logic, physics simulation, and educational content
 */

class GameManager {
    constructor() {
        this.engine = null;
        this.world = null;
        this.render = null;
        this.runner = null;
        this.bodies = [];
        this.isRunning = false;
        this.currentLevel = 1;
        this.startTime = 0;
        this.physicsUtils = null;
        
        // Canvas and game state
        this.canvas = null;
        this.canvasWidth = 800;
        this.canvasHeight = 600;
        
        console.log('GameManager initialized with Matter.js');
    }
    
    init() {
        // Get canvas element
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Game canvas not found!');
            return false;
        }
        
        // Initialize physics utilities
        this.physicsUtils = new PhysicsUtils();
        
        // Set canvas size
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        
        // Create Matter.js engine
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        
        // Create Matter.js renderer
        this.render = Matter.Render.create({
            canvas: this.canvas,
            engine: this.engine,
            options: {
                width: this.canvasWidth,
                height: this.canvasHeight,
                wireframes: false,
                background: 'transparent',
                showAngleIndicator: true,
                showVelocity: true,
                showDebug: false,
                showStats: false
            }
        });
        
        // Start renderer
        Matter.Render.run(this.render);
        
        // Create ground
        this.createGround();
        
        // Setup mouse interaction
        this.setupMouseInteraction();
        
        // Setup keyboard controls
        this.setupKeyboardControls();
        
        // Start physics update loop
        this.startPhysicsLoop();
        
        console.log('GameManager initialized successfully');
        return true;
    }
    
    createGround() {
        const ground = Matter.Bodies.rectangle(
            this.canvasWidth / 2, 
            this.canvasHeight - 30, 
            this.canvasWidth, 
            60, 
            { 
                isStatic: true,
                label: 'ground',
                render: {
                    fillStyle: '#1f2937',
                    strokeStyle: '#374151',
                    lineWidth: 2
                }
            }
        );
        
        Matter.World.add(this.world, ground);
        console.log('Ground created');
    }
    
    setupMouseInteraction() {
        this.canvas.addEventListener('click', (event) => {
            if (!this.isRunning) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            // Create physics object at click position
            this.createPhysicsObject(x, y);
            
            // Play sound feedback
            if (window.uiComponent && window.uiComponent.audioEnabled) {
                window.uiComponent.playSound('click');
            }
        });
        
        // Add drag interaction for applying forces
        let isDragging = false;
        let dragStart = null;
        let dragTarget = null;
        
        this.canvas.addEventListener('mousedown', (event) => {
            if (!this.isRunning) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const mousePos = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
            
            // Find body under mouse
            const body = this.getBodyAtPosition(mousePos);
            if (body && body.label !== 'ground') {
                isDragging = true;
                dragStart = mousePos;
                dragTarget = body;
                this.canvas.style.cursor = 'grabbing';
            }
        });
        
        this.canvas.addEventListener('mousemove', (event) => {
            if (!isDragging || !dragTarget) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const mousePos = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
            
            // Visual feedback for force direction
            this.drawForceVector(dragStart, mousePos);
        });
        
        this.canvas.addEventListener('mouseup', (event) => {
            if (!isDragging || !dragTarget) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const mousePos = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
            
            // Calculate and apply force
            const force = {
                x: (mousePos.x - dragStart.x) * 0.001,
                y: (mousePos.y - dragStart.y) * 0.001
            };
            
            this.physicsUtils.applyForceWithVisualization(dragTarget, force);
            
            // Reset drag state
            isDragging = false;
            dragStart = null;
            dragTarget = null;
            this.canvas.style.cursor = 'default';
        });
    }
    
    setupKeyboardControls() {
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'Space':
                    event.preventDefault();
                    this.togglePause();
                    break;
                case 'KeyR':
                    event.preventDefault();
                    this.resetLevel();
                    break;
                case 'KeyC':
                    event.preventDefault();
                    this.clearObjects();
                    break;
                case 'Digit1':
                case 'Digit2':
                case 'Digit3':
                case 'Digit4':
                case 'Digit5':
                    event.preventDefault();
                    const level = parseInt(event.code.slice(-1));
                    this.startLevel(level);
                    break;
            }
        });
    }
    
    createPhysicsObject(x, y) {
        const body = this.physicsUtils.createRandomPhysicsObject(x, y);
        
        // Add to world
        Matter.World.add(this.world, body);
        this.bodies.push(body);
        
        console.log(`Created ${body.physicsType} object with ${body.material} material`);
        
        // Update UI with object count
        this.updatePhysicsDisplay();
    }
    
    getBodyAtPosition(position) {
        const bodies = Matter.Composite.allBodies(this.world);
        
        for (let body of bodies) {
            if (Matter.Bounds.contains(body.bounds, position)) {
                // More precise hit detection
                const vertices = body.vertices;
                if (this.pointInPolygon(position, vertices)) {
                    return body;
                }
            }
        }
        return null;
    }
    
    pointInPolygon(point, vertices) {
        let inside = false;
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            if (((vertices[i].y > point.y) !== (vertices[j].y > point.y)) &&
                (point.x < (vertices[j].x - vertices[i].x) * (point.y - vertices[i].y) / (vertices[j].y - vertices[i].y) + vertices[i].x)) {
                inside = !inside;
            }
        }
        return inside;
    }
    
    drawForceVector(start, end) {
        const ctx = this.canvas.getContext('2d');
        
        // Clear previous force vector (this is simplified)
        // In a real implementation, you'd want to redraw the entire frame
        
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        
        // Draw arrowhead
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headSize = 10;
        
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
            end.x - headSize * Math.cos(angle - Math.PI / 6),
            end.y - headSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
            end.x - headSize * Math.cos(angle + Math.PI / 6),
            end.y - headSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
    }
    
    startLevel(levelNumber) {
        this.currentLevel = levelNumber;
        this.startTime = Date.now();
        
        // Set physics environment based on level
        const environments = ['earth', 'moon', 'space', 'jupiter', 'asteroid'];
        const environment = environments[levelNumber - 1] || 'earth';
        
        const envData = this.physicsUtils.setEnvironment(environment);
        
        // Update Matter.js gravity
        this.engine.world.gravity.y = envData.gravity / 10; // Scale for reasonable simulation
        
        // Clear existing objects
        this.clearObjects();
        
        // Reset physics state
        this.isRunning = true;
        
        console.log(`Started Level ${levelNumber}: ${envData.name} (${envData.gravity} m/s²)`);
        
        // Update UI
        if (window.uiComponent) {
            window.uiComponent.updateLevelIndicator(levelNumber);
        }
        
        this.updatePhysicsDisplay();
    }
    
    startPhysicsLoop() {
        this.runner = Matter.Runner.create();
        Matter.Runner.run(this.runner, this.engine);
        
        // Update display loop
        setInterval(() => {
            if (this.isRunning) {
                this.updatePhysicsDisplay();
            }
        }, 100); // Update display 10 times per second
    }
    
    updatePhysicsDisplay() {
        const allBodies = Matter.Composite.allBodies(this.world);
        const gameTime = this.isRunning ? (Date.now() - this.startTime) / 1000 : 0;
        
        const physicsData = this.physicsUtils.createPhysicsDataDisplay(allBodies, gameTime);
        
        // Update UI component
        if (window.uiComponent) {
            window.uiComponent.showPhysicsData(physicsData);
        }
    }
    
    togglePause() {
        this.isRunning = !this.isRunning;
        
        if (this.isRunning) {
            if (this.runner) {
                Matter.Runner.start(this.runner, this.engine);
            }
            console.log('Physics resumed');
        } else {
            if (this.runner) {
                Matter.Runner.stop(this.runner);
            }
            console.log('Physics paused');
        }
        
        // Update UI
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.textContent = this.isRunning ? '⏸️' : '▶️';
        }
    }
    
    resetLevel() {
        this.clearObjects();
        this.startTime = Date.now();
        this.isRunning = true;
        
        console.log(`Level ${this.currentLevel} reset`);
        
        // Show success message
        if (window.uiComponent) {
            window.uiComponent.showSuccess('Level reset successfully!');
        }
    }
    
    clearObjects() {
        // Remove all non-static bodies (keep ground)
        const allBodies = Matter.Composite.allBodies(this.world);
        const bodiesToRemove = allBodies.filter(body => !body.isStatic);
        
        Matter.World.remove(this.world, bodiesToRemove);
        this.bodies = [];
        
        console.log('All objects cleared');
        this.updatePhysicsDisplay();
    }
    
    destroy() {
        if (this.render) {
            Matter.Render.stop(this.render);
        }
        
        if (this.runner) {
            Matter.Runner.stop(this.runner);
        }
        
        if (this.engine) {
            Matter.Engine.clear(this.engine);
        }
        
        this.isRunning = false;
        console.log('GameManager destroyed');
    }
}

// Initialize global game manager
window.gameManager = new GameManager();