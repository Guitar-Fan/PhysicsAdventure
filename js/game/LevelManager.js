/**
 * LevelManager - Manages game levels, objectives, and progression
 */
class LevelManager {
    constructor() {
        this.levels = [];
        this.currentLevel = null;
        this.currentObjectives = [];
        this.completedObjectives = [];
        this.levelStartTime = 0;
        this.accuracy = 1.0;
        this.attempts = 0;
        
        // Event listeners
        this.eventListeners = new Map();
        
        // Initialize level data
        this.initializeLevels();
    }

    async initialize() {
        console.log('Level Manager initialized with', this.levels.length, 'levels');
    }

    // Initialize all game levels
    initializeLevels() {
        this.levels = [
            // Level 0: Moon - Gravity Basics
            {
                id: 0,
                name: "Luna Station",
                planet: "Moon",
                gravity: Vector2D.GRAVITY_MOON,
                airDensity: 0, // No atmosphere
                background: 'moon',
                description: "Learn basic gravity on the Moon where objects fall slowly",
                concept: "Gravitational Force",
                objectives: [
                    {
                        id: 'gravity_demo',
                        type: 'demonstrate',
                        description: 'Drop a ball and observe lunar gravity',
                        target: 'ball_falls',
                        completed: false
                    },
                    {
                        id: 'catch_escapist',
                        type: 'interaction',
                        description: 'Use physics objects to guide the Escapist to the player',
                        target: 'player_escapist_contact',
                        completed: false
                    }
                ],
                playerStart: new Vector2D(100, 100),
                escapistStart: new Vector2D(700, 500),
                obstacles: [
                    { x: 400, y: 50, shape: 'rectangle', width: 200, height: 20, material: 'rock', color: '#666666' },
                    { x: 200, y: 200, shape: 'rectangle', width: 100, height: 20, material: 'rock', color: '#666666' }
                ],
                tools: ['ball', 'ramp'],
                hints: [
                    "Objects fall slower on the Moon due to weaker gravity",
                    "Use ramps to direct the ball's path",
                    "The Escapist must be guided back to following physics!"
                ]
            },

            // Level 1: Mars - Momentum and Collisions
            {
                id: 1,
                name: "Red Rock Canyon",
                planet: "Mars",
                gravity: Vector2D.GRAVITY_MARS,
                airDensity: 0.02, // Thin atmosphere
                background: 'mars',
                description: "Explore momentum conservation on Mars",
                concept: "Momentum Conservation",
                objectives: [
                    {
                        id: 'momentum_demo',
                        type: 'demonstrate',
                        description: 'Create a collision that transfers momentum',
                        target: 'momentum_transfer',
                        completed: false
                    },
                    {
                        id: 'chain_reaction',
                        type: 'setup',
                        description: 'Set up a chain reaction using multiple balls',
                        target: 'multiple_collisions',
                        completed: false
                    },
                    {
                        id: 'capture_escapist',
                        type: 'interaction',
                        description: 'Use momentum to push the Escapist into the capture zone',
                        target: 'escapist_in_zone',
                        completed: false
                    }
                ],
                playerStart: new Vector2D(80, 150),
                escapistStart: new Vector2D(600, 300),
                obstacles: [
                    { x: 300, y: 100, shape: 'circle', radius: 30, material: 'rock', color: '#8B4513' },
                    { x: 500, y: 200, shape: 'rectangle', width: 80, height: 120, material: 'rock', color: '#CD853F' },
                    { x: 400, y: 400, shape: 'rectangle', width: 150, height: 30, material: 'metal', color: '#C0C0C0' }
                ],
                captureZones: [
                    { x: 100, y: 350, width: 80, height: 80, color: '#00ff88' }
                ],
                tools: ['ball', 'ramp', 'spring'],
                hints: [
                    "Momentum = mass × velocity",
                    "In collisions, momentum is conserved",
                    "Heavier objects transfer more momentum"
                ]
            },

            // Level 2: Jupiter's Moon Europa - High Gravity
            {
                id: 2,
                name: "Europa Ice Fields",
                planet: "Europa",
                gravity: new Vector2D(0, -13.1), // Europa gravity
                airDensity: 0, // No significant atmosphere
                background: 'europa',
                description: "Experience higher gravity and ice physics",
                concept: "Weight vs Mass",
                objectives: [
                    {
                        id: 'weight_comparison',
                        type: 'demonstrate',
                        description: 'Compare how the same object behaves in different gravity',
                        target: 'gravity_comparison',
                        completed: false
                    },
                    {
                        id: 'ice_sliding',
                        type: 'physics',
                        description: 'Use low friction ice surfaces to reach the Escapist',
                        target: 'friction_demonstration',
                        completed: false
                    },
                    {
                        id: 'gravitational_assist',
                        type: 'advanced',
                        description: 'Use gravity to accelerate objects for maximum impact',
                        target: 'gravity_assist',
                        completed: false
                    }
                ],
                playerStart: new Vector2D(50, 200),
                escapistStart: new Vector2D(750, 100),
                obstacles: [
                    { x: 200, y: 50, shape: 'rectangle', width: 400, height: 20, material: 'ice', color: '#B0E0E6', friction: 0.1 },
                    { x: 600, y: 150, shape: 'rectangle', width: 20, height: 100, material: 'ice', color: '#B0E0E6', friction: 0.1 },
                    { x: 350, y: 300, shape: 'circle', radius: 40, material: 'ice', color: '#87CEEB', friction: 0.1 }
                ],
                tools: ['ball', 'ramp', 'spring', 'heavy_ball'],
                hints: [
                    "Weight = mass × gravity",
                    "Same mass, different weight on different planets",
                    "Ice has very low friction - objects slide easily!"
                ]
            },

            // Level 3: Asteroid - Zero Gravity
            {
                id: 3,
                name: "Asteroid Mining Station",
                planet: "Asteroid Ceres",
                gravity: Vector2D.ZERO_GRAVITY,
                airDensity: 0,
                background: 'asteroid',
                description: "Master physics in zero gravity environment",
                concept: "Newton's First Law",
                objectives: [
                    {
                        id: 'inertia_demo',
                        type: 'demonstrate',
                        description: 'Show that objects in motion stay in motion',
                        target: 'continuous_motion',
                        completed: false
                    },
                    {
                        id: 'action_reaction',
                        type: 'physics',
                        description: 'Use action-reaction pairs to move objects',
                        target: 'newtons_third_law',
                        completed: false
                    },
                    {
                        id: 'zero_g_navigation',
                        type: 'challenge',
                        description: 'Navigate the Escapist through zero gravity obstacles',
                        target: 'zero_g_completion',
                        completed: false
                    }
                ],
                playerStart: new Vector2D(100, 300),
                escapistStart: new Vector2D(700, 300),
                obstacles: [
                    { x: 300, y: 200, shape: 'circle', radius: 25, material: 'metal', color: '#A0A0A0' },
                    { x: 500, y: 350, shape: 'circle', radius: 30, material: 'metal', color: '#A0A0A0' },
                    { x: 400, y: 100, shape: 'rectangle', width: 60, height: 60, material: 'metal', color: '#808080' }
                ],
                tools: ['ball', 'thruster', 'magnetic_field'],
                hints: [
                    "Objects in motion stay in motion (Newton's 1st Law)",
                    "Every action has an equal and opposite reaction",
                    "No gravity means objects float forever once pushed!"
                ]
            },

            // Level 4: Earth - Complex Physics
            {
                id: 4,
                name: "Physics Laboratory",
                planet: "Earth",
                gravity: Vector2D.GRAVITY_EARTH,
                airDensity: 1.225,
                background: 'earth',
                description: "Apply all learned concepts in Earth's familiar environment",
                concept: "Energy Conservation",
                objectives: [
                    {
                        id: 'energy_transfer',
                        type: 'demonstrate',
                        description: 'Convert potential energy to kinetic energy',
                        target: 'energy_conversion',
                        completed: false
                    },
                    {
                        id: 'pendulum_motion',
                        type: 'physics',
                        description: 'Create a pendulum to transfer energy',
                        target: 'pendulum_setup',
                        completed: false
                    },
                    {
                        id: 'final_challenge',
                        type: 'master',
                        description: 'Use all physics concepts to restore the Escapist',
                        target: 'physics_mastery',
                        completed: false
                    }
                ],
                playerStart: new Vector2D(100, 400),
                escapistStart: new Vector2D(600, 100),
                obstacles: [
                    { x: 300, y: 50, shape: 'rectangle', width: 20, height: 200, material: 'wood', color: '#8B4513' },
                    { x: 500, y: 200, shape: 'rectangle', width: 100, height: 20, material: 'metal', color: '#C0C0C0' },
                    { x: 200, y: 350, shape: 'circle', radius: 20, material: 'rubber', color: '#FF6347' }
                ],
                captureZones: [
                    { x: 550, y: 50, width: 100, height: 100, color: '#FFD700' }
                ],
                tools: ['ball', 'ramp', 'spring', 'pendulum', 'lever'],
                hints: [
                    "Energy cannot be created or destroyed, only transformed",
                    "Potential Energy = mgh",
                    "Kinetic Energy = ½mv²",
                    "Use all your knowledge to complete this final challenge!"
                ]
            }
        ];
    }

    // Load a specific level
    loadLevel(levelIndex) {
        if (levelIndex < 0 || levelIndex >= this.levels.length) {
            console.error('Invalid level index:', levelIndex);
            return null;
        }

        this.currentLevel = this.levels[levelIndex];
        this.currentObjectives = [...this.currentLevel.objectives];
        this.completedObjectives = [];
        this.levelStartTime = Date.now();
        this.accuracy = 1.0;
        this.attempts = 0;

        // Reset objective completion status
        this.currentObjectives.forEach(objective => {
            objective.completed = false;
        });

        this.emit('levelLoaded', {
            level: this.currentLevel,
            objectives: this.currentObjectives
        });

        return this.currentLevel;
    }

    // Update level state
    update(deltaTime) {
        if (!this.currentLevel) return;

        // Check objectives
        this.checkObjectives();

        // Update level-specific logic
        this.updateLevelLogic(deltaTime);
    }

    // Check if objectives are completed
    checkObjectives() {
        let newCompletions = false;

        for (const objective of this.currentObjectives) {
            if (!objective.completed && this.isObjectiveComplete(objective)) {
                objective.completed = true;
                this.completedObjectives.push(objective);
                newCompletions = true;
                
                this.emit('objectiveComplete', {
                    objective: objective,
                    level: this.currentLevel
                });
            }
        }

        if (newCompletions) {
            this.updateAccuracy();
        }
    }

    // Check if a specific objective is complete
    isObjectiveComplete(objective) {
        switch (objective.target) {
            case 'ball_falls':
                return this.checkBallFalls();
            case 'player_escapist_contact':
                return this.checkPlayerEscapistContact();
            case 'momentum_transfer':
                return this.checkMomentumTransfer();
            case 'multiple_collisions':
                return this.checkMultipleCollisions();
            case 'escapist_in_zone':
                return this.checkEscapistInZone();
            case 'gravity_comparison':
                return this.checkGravityComparison();
            case 'friction_demonstration':
                return this.checkFrictionDemo();
            case 'gravity_assist':
                return this.checkGravityAssist();
            case 'continuous_motion':
                return this.checkContinuousMotion();
            case 'newtons_third_law':
                return this.checkNewtonsThirdLaw();
            case 'zero_g_completion':
                return this.checkZeroGCompletion();
            case 'energy_conversion':
                return this.checkEnergyConversion();
            case 'pendulum_setup':
                return this.checkPendulumSetup();
            case 'physics_mastery':
                return this.checkPhysicsMastery();
            default:
                return false;
        }
    }

    // Objective checking methods
    checkBallFalls() {
        // Check if any ball has fallen a significant distance
        // This would be implemented with physics engine integration
        return this.objectHasFallen('ball', 100);
    }

    checkPlayerEscapistContact() {
        // Check if player and escapist are close enough
        return this.entitiesInContact('player', 'escapist', 50);
    }

    checkMomentumTransfer() {
        // Check if a collision occurred with momentum transfer
        return this.collisionOccurred() && this.momentumWasTransferred();
    }

    checkMultipleCollisions() {
        // Check if multiple objects collided in sequence
        return this.sequentialCollisions >= 3;
    }

    checkEscapistInZone() {
        // Check if escapist is in a capture zone
        if (!this.currentLevel.captureZones) return false;
        return this.entityInZone('escapist', this.currentLevel.captureZones[0]);
    }

    checkGravityComparison() {
        // Check if player demonstrated gravity differences
        return this.gravityDemonstrationComplete;
    }

    checkFrictionDemo() {
        // Check if object slid on ice surface
        return this.objectSlidOnIce;
    }

    checkGravityAssist() {
        // Check if gravity was used to accelerate an object
        return this.gravityAssistUsed;
    }

    checkContinuousMotion() {
        // Check if object moved continuously without external force
        return this.continuousMotionDemo;
    }

    checkNewtonsThirdLaw() {
        // Check if action-reaction was demonstrated
        return this.actionReactionDemo;
    }

    checkZeroGCompletion() {
        // Check if navigation completed in zero gravity
        return this.zeroGNavigationComplete;
    }

    checkEnergyConversion() {
        // Check if potential energy was converted to kinetic
        return this.energyConversionDemo;
    }

    checkPendulumSetup() {
        // Check if pendulum was created and swung
        return this.pendulumCreated && this.pendulumSwung;
    }

    checkPhysicsMastery() {
        // Check if all physics concepts were applied
        return this.allConceptsApplied;
    }

    // Helper methods for objective checking
    objectHasFallen(objectType, minDistance) {
        // Implementation would check physics engine for fallen objects
        return true; // Placeholder
    }

    entitiesInContact(entity1, entity2, maxDistance) {
        // Implementation would check distance between entities
        return false; // Placeholder
    }

    collisionOccurred() {
        // Implementation would check physics engine collision events
        return false; // Placeholder
    }

    momentumWasTransferred() {
        // Implementation would analyze collision momentum transfer
        return false; // Placeholder
    }

    entityInZone(entityType, zone) {
        // Implementation would check if entity is within zone bounds
        return false; // Placeholder
    }

    // Update level-specific logic
    updateLevelLogic(deltaTime) {
        // Level-specific updates can be added here
        switch (this.currentLevel.id) {
            case 0:
                this.updateMoonLevel(deltaTime);
                break;
            case 1:
                this.updateMarsLevel(deltaTime);
                break;
            case 2:
                this.updateEuropaLevel(deltaTime);
                break;
            case 3:
                this.updateAsteroidLevel(deltaTime);
                break;
            case 4:
                this.updateEarthLevel(deltaTime);
                break;
        }
    }

    updateMoonLevel(deltaTime) {
        // Moon-specific logic
    }

    updateMarsLevel(deltaTime) {
        // Mars-specific logic
    }

    updateEuropaLevel(deltaTime) {
        // Europa-specific logic
    }

    updateAsteroidLevel(deltaTime) {
        // Asteroid-specific logic
    }

    updateEarthLevel(deltaTime) {
        // Earth-specific logic
    }

    // Trigger events from game manager
    triggerPlayerEscapistInteraction() {
        this.playerEscapistContact = true;
    }

    triggerCollision(bodyA, bodyB, collision) {
        this.lastCollision = {
            bodyA: bodyA,
            bodyB: bodyB,
            collision: collision,
            timestamp: Date.now()
        };
    }

    // Level completion
    isLevelComplete() {
        return this.completedObjectives.length === this.currentObjectives.length;
    }

    getCurrentConcept() {
        return this.currentLevel ? this.currentLevel.concept : '';
    }

    getAccuracy() {
        return this.accuracy;
    }

    updateAccuracy() {
        // Calculate accuracy based on attempts and completions
        this.attempts++;
        const completionRatio = this.completedObjectives.length / this.currentObjectives.length;
        const attemptPenalty = Math.max(0, (this.attempts - 1) * 0.1);
        this.accuracy = Math.max(0, completionRatio - attemptPenalty);
    }

    // Render level background and static elements
    render(renderer) {
        if (!this.currentLevel) return;

        // Render background
        this.renderBackground(renderer);

        // Render capture zones
        if (this.currentLevel.captureZones) {
            for (const zone of this.currentLevel.captureZones) {
                renderer.renderCaptureZone(zone);
            }
        }

        // Render level info
        this.renderLevelInfo(renderer);
    }

    renderBackground(renderer) {
        const ctx = renderer.context;
        const canvas = renderer.canvas;

        // Set background based on planet
        switch (this.currentLevel.background) {
            case 'moon':
                this.renderMoonBackground(ctx, canvas);
                break;
            case 'mars':
                this.renderMarsBackground(ctx, canvas);
                break;
            case 'europa':
                this.renderEuropaBackground(ctx, canvas);
                break;
            case 'asteroid':
                this.renderAsteroidBackground(ctx, canvas);
                break;
            case 'earth':
                this.renderEarthBackground(ctx, canvas);
                break;
        }
    }

    renderMoonBackground(ctx, canvas) {
        // Gray lunar surface with Earth in the background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#000020');
        gradient.addColorStop(0.7, '#1a1a2e');
        gradient.addColorStop(1, '#333333');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Earth in background
        ctx.fillStyle = '#4A90E2';
        ctx.beginPath();
        ctx.arc(canvas.width - 100, 100, 40, 0, Math.PI * 2);
        ctx.fill();
    }

    renderMarsBackground(ctx, canvas) {
        // Red martian landscape
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#2F1B14');
        gradient.addColorStop(0.7, '#8B4513');
        gradient.addColorStop(1, '#CD853F');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    renderEuropaBackground(ctx, canvas) {
        // Icy blue surface
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#000040');
        gradient.addColorStop(0.7, '#1E3A8A');
        gradient.addColorStop(1, '#60A5FA');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    renderAsteroidBackground(ctx, canvas) {
        // Dark space with stars
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw stars
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 2;
            ctx.fillRect(x, y, size, size);
        }
    }

    renderEarthBackground(ctx, canvas) {
        // Blue sky
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    renderLevelInfo(renderer) {
        // This would be handled by UI manager
    }

    // Utility methods
    getTotalLevels() {
        return this.levels.length;
    }

    getLevelData(index) {
        return this.levels[index] || null;
    }

    getCurrentLevelData() {
        return this.currentLevel;
    }

    getObjectives() {
        return this.currentObjectives;
    }

    getCompletedObjectives() {
        return this.completedObjectives;
    }

    // Event system
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            const callbacks = this.eventListeners.get(event);
            for (const callback of callbacks) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in level event listener for ${event}:`, error);
                }
            }
        }
    }
}