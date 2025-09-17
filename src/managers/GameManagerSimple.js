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
    
    /**
     * Start the Zipline Platform Puzzle (First Puzzle)
     */
    startZiplinePuzzle() {
        console.log('🧩 Starting Zipline Platform Puzzle...');
        
        // Clear existing bodies
        this.clearLevel();
        
        // Set up the puzzle environment
        this.setupZiplinePuzzle();
        
        // Update UI for the puzzle
        this.updatePuzzleUI();
        
        // Start physics simulation
        this.startSimulation();
        
        console.log('Zipline puzzle initialized successfully');
    }
    
    setupZiplinePuzzle() {
        // Create ground on both sides with a gap in the middle
        const groundHeight = 50;
        const gapWidth = 300;
        const leftGroundWidth = (this.canvasWidth - gapWidth) / 2;
        const rightGroundWidth = leftGroundWidth;
        
        // Left side ground (where protagonist starts)
        const leftGround = Matter.Bodies.rectangle(
            leftGroundWidth / 2, 
            this.canvasHeight - groundHeight / 2,
            leftGroundWidth, 
            groundHeight,
            { 
                isStatic: true, 
                render: { 
                    fillStyle: '#654321',
                    strokeStyle: '#4a2c17',
                    lineWidth: 2
                } 
            }
        );
        
        // Right side ground (cave entrance area)
        const rightGround = Matter.Bodies.rectangle(
            leftGroundWidth + gapWidth + rightGroundWidth / 2,
            this.canvasHeight - groundHeight / 2,
            rightGroundWidth,
            groundHeight,
            { 
                isStatic: true, 
                render: { 
                    fillStyle: '#2a1810',
                    strokeStyle: '#1a0e08',
                    lineWidth: 2
                } 
            }
        );
        
        // Cave entrance visual (more elaborate)
        const caveEntrance = Matter.Bodies.rectangle(
            this.canvasWidth - 60,
            this.canvasHeight - groundHeight - 80,
            80,
            140,
            { 
                isStatic: true, 
                isSensor: true,
                render: { 
                    fillStyle: '#000000',
                    strokeStyle: '#333333',
                    lineWidth: 3
                }
            }
        );
        
        // Cave entrance details - stalactites
        const stalactite1 = Matter.Bodies.polygon(this.canvasWidth - 80, this.canvasHeight - groundHeight - 60, 3, 15, {
            isStatic: true,
            isSensor: true,
            render: { fillStyle: '#444444' }
        });
        
        const stalactite2 = Matter.Bodies.polygon(this.canvasWidth - 40, this.canvasHeight - groundHeight - 50, 3, 12, {
            isStatic: true,
            isSensor: true,
            render: { fillStyle: '#444444' }
        });
        
        // Zipline cable supports
        const ziplineY = this.canvasHeight - 200;
        const ziplineStart = Matter.Bodies.rectangle(
            leftGroundWidth - 20,
            ziplineY,
            40, 10,
            { 
                isStatic: true, 
                render: { 
                    fillStyle: '#666666',
                    strokeStyle: '#888888',
                    lineWidth: 2
                } 
            }
        );
        
        const ziplineEnd = Matter.Bodies.rectangle(
            leftGroundWidth + gapWidth + 20,
            ziplineY,
            40, 10,
            { 
                isStatic: true, 
                render: { 
                    fillStyle: '#666666',
                    strokeStyle: '#888888',
                    lineWidth: 2
                } 
            }
        );
        
        // Swing platform hanging from zipline (enhanced visuals)
        this.platform = Matter.Bodies.rectangle(
            leftGroundWidth + 20, // Start position near left side
            ziplineY + 30,
            60, 20,
            { 
                render: { 
                    fillStyle: '#8B4513',
                    strokeStyle: '#654321',
                    lineWidth: 2
                },
                frictionAir: 0.02, // Air resistance
                mass: 10 // Platform mass
            }
        );
        
        // Constraint to keep platform hanging from zipline (visible rope)
        this.ziplineConstraint = Matter.Constraint.create({
            pointA: { x: leftGroundWidth + 20, y: ziplineY },
            bodyB: this.platform,
            pointB: { x: 0, y: -10 },
            length: 30,
            stiffness: 0.8,
            render: {
                visible: true,
                strokeStyle: '#654321',
                lineWidth: 3
            }
        });
        
        // Protagonist character (enhanced)
        this.protagonist = Matter.Bodies.circle(
            leftGroundWidth - 50,
            this.canvasHeight - groundHeight - 25,
            15,
            { 
                render: { 
                    fillStyle: '#4CAF50',
                    strokeStyle: '#2E7D32',
                    lineWidth: 2
                },
                mass: 5
            }
        );
        
        // Add visual elements for environment
        // Background rocks
        const rock1 = Matter.Bodies.circle(leftGroundWidth - 100, this.canvasHeight - groundHeight - 15, 20, {
            isStatic: true,
            isSensor: true,
            render: { fillStyle: '#5D4E75' }
        });
        
        const rock2 = Matter.Bodies.circle(leftGroundWidth + gapWidth + 80, this.canvasHeight - groundHeight - 10, 15, {
            isStatic: true,
            isSensor: true,
            render: { fillStyle: '#5D4E75' }
        });
        
        // Target indicator (visual helper)
        const targetIndicator = Matter.Bodies.rectangle(
            leftGroundWidth + gapWidth / 2,
            ziplineY + 60,
            60, 5,
            {
                isStatic: true,
                isSensor: true,
                render: { 
                    fillStyle: '#FF6B35',
                    strokeStyle: '#FF4500',
                    lineWidth: 1
                }
            }
        );
        
        // Add all bodies to world
        Matter.World.add(this.world, [
            leftGround,
            rightGround,
            caveEntrance,
            stalactite1,
            stalactite2,
            ziplineStart,
            ziplineEnd,
            this.platform,
            this.ziplineConstraint,
            this.protagonist,
            rock1,
            rock2,
            targetIndicator
        ]);
        
        // Store references for later use
        this.puzzleElements = {
            leftGround,
            rightGround,
            platform: this.platform,
            protagonist: this.protagonist,
            ziplineConstraint: this.ziplineConstraint,
            gapWidth,
            leftGroundWidth,
            ziplineY,
            targetIndicator
        };
        
        // Initialize puzzle state
        this.puzzleState = {
            forceApplied: 0,
            platformPosition: leftGroundWidth + 20,
            targetPosition: leftGroundWidth + gapWidth / 2, // Middle of gap
            tolerance: 30,
            isComplete: false,
            canJump: false
        };
    }
    
    updatePuzzleUI() {
        // Create puzzle-specific UI overlay
        const gameScreen = document.getElementById('gameScreen');
        
        // Remove existing puzzle UI if any
        const existingUI = document.getElementById('ziplinePuzzleUI');
        if (existingUI) {
            existingUI.remove();
        }
        
        // Create new puzzle UI
        const puzzleUI = document.createElement('div');
        puzzleUI.id = 'ziplinePuzzleUI';
        puzzleUI.className = 'absolute bottom-4 left-4 right-4 z-20';
        
        puzzleUI.innerHTML = `
            <div class="glass-effect rounded-lg p-6 max-w-md mx-auto">
                <h3 class="text-xl font-bold text-physics-blue mb-4">🧩 Zipline Platform Puzzle</h3>
                
                <div class="space-y-4">
                    <div class="text-sm text-gray-300">
                        <p><strong>Objective:</strong> Push the platform to the middle of the gap so you can jump across!</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <label class="text-blue-400">Platform Mass:</label>
                            <div class="text-white">10 kg</div>
                        </div>
                        <div>
                            <label class="text-blue-400">Friction (μ):</label>
                            <div class="text-white">0.02</div>
                        </div>
                    </div>
                    
                    <div class="space-y-2">
                        <label class="text-blue-400 block">Applied Force (N):</label>
                        <div class="flex space-x-2">
                            <input type="number" id="forceInput" class="bg-gray-800 text-white px-3 py-2 rounded border border-blue-500 flex-1" 
                                   min="0" max="200" step="1" placeholder="Enter force..." />
                            <button id="applyForceBtn" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded">
                                Apply Force
                            </button>
                        </div>
                    </div>
                    
                    <div class="text-xs text-gray-400">
                        <p>💡 Tip: Calculate F = ma, considering friction on the zipline!</p>
                        <p>Target: Move platform to the middle (±30 pixels)</p>
                    </div>
                    
                    <div id="puzzleStatus" class="text-center py-2 rounded hidden">
                        <!-- Status messages will appear here -->
                    </div>
                    
                    <button id="jumpBtn" class="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded hidden">
                        🏃‍♂️ Jump to Platform!
                    </button>
                </div>
            </div>
        `;
        
        gameScreen.appendChild(puzzleUI);
        
        // Add event listeners
        document.getElementById('applyForceBtn').addEventListener('click', () => this.applyForceToPlatform());
        document.getElementById('jumpBtn').addEventListener('click', () => this.jumpToNextStage());
        
        // Allow Enter key in force input
        document.getElementById('forceInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.applyForceToPlatform();
            }
        });
    }
    
    applyForceToPlatform() {
        const forceInput = document.getElementById('forceInput');
        const force = parseFloat(forceInput.value);
        
        if (isNaN(force) || force < 0) {
            this.showPuzzleStatus('Please enter a valid positive force value!', 'error');
            return;
        }
        
        // Apply force to platform
        const forceVector = { x: force * 0.001, y: 0 }; // Scale down for reasonable movement
        Matter.Body.applyForce(this.platform, this.platform.position, forceVector);
        
        // Update puzzle state
        this.puzzleState.forceApplied = force;
        
        // Show status
        this.showPuzzleStatus(`Applied ${force}N force to the platform!`, 'info');
        
        // Check platform position after a delay
        setTimeout(() => this.checkPlatformPosition(), 2000);
        
        console.log(`Applied force: ${force}N to platform`);
    }
    
    checkPlatformPosition() {
        const currentPos = this.platform.position.x;
        const targetPos = this.puzzleState.targetPosition;
        const tolerance = this.puzzleState.tolerance;
        
        const distance = Math.abs(currentPos - targetPos);
        
        if (distance <= tolerance) {
            // Success!
            this.puzzleState.canJump = true;
            this.showPuzzleStatus('Perfect! The platform is in position. You can now jump!', 'success');
            document.getElementById('jumpBtn').classList.remove('hidden');
        } else if (currentPos < targetPos - tolerance) {
            // Too short
            this.showPuzzleStatus(`Platform is too close to the start. Need more force! (${Math.round(distance)} pixels away)`, 'warning');
        } else {
            // Overshot
            this.showPuzzleStatus(`Platform overshot the target! Try less force. (${Math.round(distance)} pixels away)`, 'warning');
        }
        
        // Reset platform after a few seconds if not successful
        if (!this.puzzleState.canJump) {
            setTimeout(() => this.resetPlatform(), 3000);
        }
    }
    
    resetPlatform() {
        // Move platform back to start position
        Matter.Body.setPosition(this.platform, {
            x: this.puzzleState.platformPosition,
            y: this.puzzleElements.ziplineY + 30
        });
        Matter.Body.setVelocity(this.platform, { x: 0, y: 0 });
        
        this.showPuzzleStatus('Platform reset. Try again!', 'info');
        document.getElementById('forceInput').value = '';
    }
    
    showPuzzleStatus(message, type = 'info') {
        const statusElement = document.getElementById('puzzleStatus');
        statusElement.textContent = message;
        statusElement.className = 'text-center py-2 rounded';
        
        switch (type) {
            case 'success':
                statusElement.classList.add('bg-green-900/50', 'text-green-400', 'border', 'border-green-500');
                break;
            case 'error':
                statusElement.classList.add('bg-red-900/50', 'text-red-400', 'border', 'border-red-500');
                break;
            case 'warning':
                statusElement.classList.add('bg-yellow-900/50', 'text-yellow-400', 'border', 'border-yellow-500');
                break;
            default:
                statusElement.classList.add('bg-blue-900/50', 'text-blue-400', 'border', 'border-blue-500');
        }
        
        statusElement.classList.remove('hidden');
    }
    
    jumpToNextStage() {
        if (!this.puzzleState.canJump) {
            this.showPuzzleStatus('Position the platform correctly first!', 'error');
            return;
        }
        
        // Animate protagonist jumping to platform, then to the other side
        this.animateProtagonistJump();
    }
    
    animateProtagonistJump() {
        // Phase 1: Jump to platform
        const platformPos = this.platform.position;
        const jumpForce = { x: 0.02, y: -0.05 };
        
        Matter.Body.applyForce(this.protagonist, this.protagonist.position, jumpForce);
        
        this.showPuzzleStatus('Jumping to platform...', 'info');
        
        // Check if reached platform
        setTimeout(() => {
            const protPos = this.protagonist.position;
            const platPos = this.platform.position;
            
            if (Math.abs(protPos.x - platPos.x) < 50 && Math.abs(protPos.y - platPos.y) < 50) {
                // Successfully on platform, now jump to other side
                setTimeout(() => {
                    const finalJumpForce = { x: 0.03, y: -0.04 };
                    Matter.Body.applyForce(this.protagonist, this.protagonist.position, finalJumpForce);
                    
                    this.showPuzzleStatus('Jumping to the other side...', 'info');
                    
                    // Check if reached the other side
                    setTimeout(() => {
                        if (this.protagonist.position.x > this.puzzleElements.leftGroundWidth + this.puzzleElements.gapWidth) {
                            this.completePuzzle();
                        }
                    }, 2000);
                }, 1000);
            }
        }, 1500);
    }
    
    completePuzzle() {
        this.puzzleState.isComplete = true;
        this.showPuzzleStatus('🎉 Puzzle Complete! Dr. Vector has escaped deeper into the cave...', 'success');
        
        // Remove the UI and show completion message
        setTimeout(() => {
            const puzzleUI = document.getElementById('ziplinePuzzleUI');
            if (puzzleUI) {
                puzzleUI.style.opacity = '0.5';
            }
            
            // Create completion overlay
            const gameScreen = document.getElementById('gameScreen');
            const completionOverlay = document.createElement('div');
            completionOverlay.id = 'completionOverlay';
            completionOverlay.className = 'absolute inset-0 z-30 flex items-center justify-center bg-black/70';
            
            completionOverlay.innerHTML = `
                <div class="glass-effect rounded-lg p-8 max-w-md text-center space-y-6">
                    <h2 class="text-3xl font-orbitron font-bold text-physics-blue animate-glow">
                        🎉 Puzzle Solved! 🎉
                    </h2>
                    
                    <div class="space-y-3 text-white">
                        <p>Excellent work! You successfully calculated the correct force and made it across the chasm.</p>
                        <p>Dr. Vector has fled deeper into the cave system, but you're hot on his trail!</p>
                        <p class="text-physics-blue font-semibold">Physics mastery level: Rising! 📈</p>
                    </div>
                    
                    <div class="flex justify-center space-x-4">
                        <button id="continueAdventureBtn" class="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors">
                            Continue Adventure →
                        </button>
                        <button id="backToMenuBtn" class="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors">
                            Back to Menu
                        </button>
                    </div>
                    
                    <div class="text-xs text-gray-400">
                        <p>🔬 Fun Fact: You just applied Newton's laws of motion!</p>
                        <p>F = ma (Force = mass × acceleration)</p>
                    </div>
                </div>
            `;
            
            gameScreen.appendChild(completionOverlay);
            
            // Add event listeners for completion buttons
            document.getElementById('continueAdventureBtn').addEventListener('click', () => {
                // For now, show a "coming soon" message
                // In the future, this would transition to puzzle 2
                alert('More puzzles coming soon! Dr. Vector is preparing new challenges...');
                this.returnToMenu();
            });
            
            document.getElementById('backToMenuBtn').addEventListener('click', () => {
                this.returnToMenu();
            });
            
        }, 2000);
    }
    
    returnToMenu() {
        // Clean up the puzzle
        this.clearLevel();
        
        // Remove overlays
        const completionOverlay = document.getElementById('completionOverlay');
        if (completionOverlay) {
            completionOverlay.remove();
        }
        
        const puzzleUI = document.getElementById('ziplinePuzzleUI');
        if (puzzleUI) {
            puzzleUI.remove();
        }
        
        // Return to main menu
        if (window.showScreen) {
            window.showScreen('mainMenu');
        }
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