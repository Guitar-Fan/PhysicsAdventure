/**
 * GameManager - Main game controller and state management
 */
class GameManager {
    constructor() {
        // Core systems
        this.physicsEngine = null;
        this.renderer = null;
        this.inputManager = null;
        this.levelManager = null;
        this.uiManager = null;
        this.storyManager = null;
        
        // Game state
        this.gameState = 'mainMenu'; // mainMenu, story, playing, paused, levelComplete, gameOver
        this.currentLevel = 0;
        this.score = 0;
        this.startTime = 0;
        this.gameTime = 0;
        
        // Game settings
        this.settings = {
            showPhysicsVectors: true,
            showTrajectory: true,
            soundEnabled: true,
            musicEnabled: true,
            particleEffects: true,
            visualEffects: true
        };
        
        // Player progress
        this.progress = {
            levelsCompleted: 0,
            conceptsLearned: [],
            bestTimes: {},
            achievements: [],
            totalPlayTime: 0
        };
        
        // Game entities
        this.player = null;
        this.escapist = null;
        this.physicsObjects = [];
        
        // Event listeners
        this.eventListeners = new Map();
        
        // Performance monitoring
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.fps = 60;
        
        // Load saved progress
        this.loadProgress();
    }

    // Initialize the game
    async initialize() {
        try {
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize canvas and rendering
            await this.initializeRenderer();
            
            // Initialize physics engine
            await this.initializePhysics();
            
            // Initialize input handling
            await this.initializeInput();
            
            // Initialize UI system
            await this.initializeUI();
            
            // Initialize level management
            await this.initializeLevels();
            
            // Initialize story system
            await this.initializeStory();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Start game loop
            this.startGameLoop();
            
            // Hide loading screen and show main menu
            this.hideLoadingScreen();
            this.showMainMenu();
            
            console.log('Physics Adventure initialized successfully!');
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('Failed to initialize game. Please refresh and try again.');
        }
    }

    // Initialize renderer
    async initializeRenderer() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) throw new Error('Game canvas not found');
        
        this.renderer = new Renderer(canvas);
        await this.renderer.initialize();
        
        // Set up responsive canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    // Initialize physics engine
    async initializePhysics() {
        this.physicsEngine = new PhysicsEngine({
            gravity: Vector2D.GRAVITY_MOON, // Start on moon
            bounds: {
                left: 0,
                right: this.renderer.canvas.width,
                top: this.renderer.canvas.height,
                bottom: 0
            }
        });
        
        // Set up physics event listeners
        this.physicsEngine.on('collision', (data) => this.handlePhysicsCollision(data));
        this.physicsEngine.on('boundsCollision', (data) => this.handleBoundsCollision(data));
    }

    // Initialize input management
    async initializeInput() {
        this.inputManager = new InputManager(this.renderer.canvas);
        await this.inputManager.initialize();
        
        // Set up input event listeners
        this.inputManager.on('click', (data) => this.handleClick(data));
        this.inputManager.on('drag', (data) => this.handleDrag(data));
        this.inputManager.on('keypress', (data) => this.handleKeyPress(data));
    }

    // Initialize UI system
    async initializeUI() {
        this.uiManager = new UIManager();
        await this.uiManager.initialize();
        
        // Set up UI event listeners
        this.uiManager.on('toolSelected', (data) => this.handleToolSelection(data));
        this.uiManager.on('levelComplete', (data) => this.handleLevelComplete(data));
    }

    // Initialize level management
    async initializeLevels() {
        this.levelManager = new LevelManager();
        await this.levelManager.initialize();
        
        // Set up level event listeners
        this.levelManager.on('levelLoaded', (data) => this.handleLevelLoaded(data));
        this.levelManager.on('objectiveComplete', (data) => this.handleObjectiveComplete(data));
    }

    // Initialize story system
    async initializeStory() {
        this.storyManager = new StoryManager();
        await this.storyManager.initialize();
        
        // Set up story event listeners
        this.storyManager.on('storyComplete', () => this.startGame());
        this.storyManager.on('storySkipped', () => this.startGame());
    }

    // Set up event listeners
    setupEventListeners() {
        // Menu buttons
        document.getElementById('startGame')?.addEventListener('click', () => this.showStory());
        document.getElementById('tutorialBtn')?.addEventListener('click', () => this.showTutorial());
        document.getElementById('conceptsBtn')?.addEventListener('click', () => this.showConcepts());
        
        // Story buttons
        document.getElementById('continueStory')?.addEventListener('click', () => this.storyManager.nextSegment());
        document.getElementById('skipStory')?.addEventListener('click', () => this.storyManager.skip());
        
        // Level complete modal
        document.getElementById('nextLevel')?.addEventListener('click', () => this.nextLevel());
        document.getElementById('replayLevel')?.addEventListener('click', () => this.replayLevel());
        
        // Tutorial navigation
        document.getElementById('nextStep')?.addEventListener('click', () => this.nextTutorialStep());
        document.getElementById('prevStep')?.addEventListener('click', () => this.prevTutorialStep());
        document.getElementById('exitTutorial')?.addEventListener('click', () => this.showMainMenu());
        
        // Concepts screen
        document.getElementById('backToMenu')?.addEventListener('click', () => this.showMainMenu());
    }

    // Game loop
    startGameLoop() {
        const loop = (currentTime) => {
            const deltaTime = (currentTime - this.lastFrameTime) / 1000;
            this.lastFrameTime = currentTime;
            
            this.update(deltaTime);
            this.render();
            
            // Calculate FPS
            this.frameCount++;
            if (this.frameCount % 60 === 0) {
                this.fps = Math.round(1 / deltaTime);
            }
            
            requestAnimationFrame(loop);
        };
        
        this.lastFrameTime = performance.now();
        requestAnimationFrame(loop);
    }

    // Update game state
    update(deltaTime) {
        if (this.gameState === 'playing') {
            // Update game time
            this.gameTime += deltaTime;
            
            // Update physics
            this.physicsEngine.update(deltaTime);
            
            // Update game entities
            this.updateEntities(deltaTime);
            
            // Update level objectives
            this.levelManager.update(deltaTime);
            
            // Update UI
            this.uiManager.update(deltaTime);
            
            // Check level completion
            this.checkLevelCompletion();
        }
    }

    // Update game entities
    updateEntities(deltaTime) {
        // Update player
        if (this.player) {
            this.player.update(deltaTime);
        }
        
        // Update escapist
        if (this.escapist) {
            this.escapist.update(deltaTime);
        }
        
        // Update physics objects
        for (const obj of this.physicsObjects) {
            obj.update(deltaTime);
        }
    }

    // Render game
    render() {
        if (this.gameState === 'playing') {
            // Clear canvas
            this.renderer.clear();
            
            // Render level background
            this.levelManager.render(this.renderer);
            
            // Render physics objects
            for (const body of this.physicsEngine.bodies) {
                this.renderer.renderRigidBody(body);
            }
            
            // Render game entities
            if (this.player) this.renderer.renderEntity(this.player);
            if (this.escapist) this.renderer.renderEntity(this.escapist);
            
            // Render physics visualization
            if (this.settings.showPhysicsVectors) {
                this.renderPhysicsVectors();
            }
            
            // Render UI overlays
            this.uiManager.render(this.renderer);
        }
    }

    // Render physics vectors and trajectories
    renderPhysicsVectors() {
        for (const body of this.physicsEngine.bodies) {
            if (body.isStatic) continue;
            
            // Render velocity vector
            if (body.velocity.magnitude() > 0.1) {
                this.renderer.renderVector(
                    body.position,
                    body.velocity.multiply(0.1),
                    '#ffaa00',
                    'Velocity'
                );
            }
            
            // Render acceleration vector
            if (body.acceleration.magnitude() > 0.1) {
                this.renderer.renderVector(
                    body.position,
                    body.acceleration.multiply(0.1),
                    '#ff6600',
                    'Acceleration'
                );
            }
        }
    }

    // Game state management
    showMainMenu() {
        this.gameState = 'mainMenu';
        this.showScreen('mainMenu');
    }

    showStory() {
        this.gameState = 'story';
        this.showScreen('storyIntro');
        this.storyManager.start();
    }

    showTutorial() {
        this.gameState = 'tutorial';
        this.showScreen('tutorialScreen');
    }

    showConcepts() {
        this.gameState = 'concepts';
        this.showScreen('conceptsScreen');
    }

    startGame() {
        this.gameState = 'playing';
        this.showScreen('gameScreen');
        this.startTime = Date.now();
        this.gameTime = 0;
        this.loadLevel(0);
    }

    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.physicsEngine.pause();
            this.uiManager.showPauseMenu();
        }
    }

    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.physicsEngine.resume();
            this.uiManager.hidePauseMenu();
        }
    }

    // Level management
    loadLevel(levelIndex) {
        this.currentLevel = levelIndex;
        
        // Clear existing state
        this.physicsEngine.clear();
        this.physicsObjects = [];
        
        // Load level data
        const levelData = this.levelManager.loadLevel(levelIndex);
        if (!levelData) {
            console.error('Failed to load level:', levelIndex);
            return;
        }
        
        // Set physics properties for the level
        this.physicsEngine.setGravity(levelData.gravity);
        this.physicsEngine.airDensity = levelData.airDensity || 0;
        
        // Create level entities
        this.createLevelEntities(levelData);
        
        // Update UI
        this.uiManager.updateLevelInfo(levelData);
        
        this.emit('levelLoaded', { level: levelIndex, data: levelData });
    }

    createLevelEntities(levelData) {
        // Create player
        this.player = new Player(levelData.playerStart);
        
        // Create escapist
        this.escapist = new Escapist(levelData.escapistStart);
        
        // Create static level geometry
        for (const obstacle of levelData.obstacles || []) {
            const body = new RigidBody({
                position: new Vector2D(obstacle.x, obstacle.y),
                shape: obstacle.shape,
                width: obstacle.width,
                height: obstacle.height,
                radius: obstacle.radius,
                isStatic: true,
                material: obstacle.material,
                color: obstacle.color
            });
            this.physicsEngine.addBody(body);
        }
    }

    nextLevel() {
        this.currentLevel++;
        this.hideModal('levelCompleteModal');
        
        if (this.currentLevel >= this.levelManager.getTotalLevels()) {
            this.showGameComplete();
        } else {
            this.loadLevel(this.currentLevel);
        }
    }

    replayLevel() {
        this.hideModal('levelCompleteModal');
        this.loadLevel(this.currentLevel);
    }

    checkLevelCompletion() {
        if (this.levelManager.isLevelComplete()) {
            this.completeLevel();
        }
    }

    completeLevel() {
        this.gameState = 'levelComplete';
        
        // Calculate completion stats
        const completionTime = this.gameTime;
        const accuracy = this.levelManager.getAccuracy();
        const conceptLearned = this.levelManager.getCurrentConcept();
        
        // Update progress
        this.progress.levelsCompleted = Math.max(this.progress.levelsCompleted, this.currentLevel + 1);
        if (!this.progress.conceptsLearned.includes(conceptLearned)) {
            this.progress.conceptsLearned.push(conceptLearned);
        }
        
        // Save best time
        const levelKey = `level_${this.currentLevel}`;
        if (!this.progress.bestTimes[levelKey] || completionTime < this.progress.bestTimes[levelKey]) {
            this.progress.bestTimes[levelKey] = completionTime;
        }
        
        // Show completion modal
        this.uiManager.showLevelComplete({
            time: this.formatTime(completionTime),
            accuracy: Math.round(accuracy * 100),
            concept: conceptLearned
        });
        
        // Save progress
        this.saveProgress();
        
        this.emit('levelComplete', {
            level: this.currentLevel,
            time: completionTime,
            accuracy: accuracy,
            concept: conceptLearned
        });
    }

    // Input handling
    handleClick(data) {
        if (this.gameState === 'playing') {
            const selectedTool = this.uiManager.getSelectedTool();
            if (selectedTool) {
                this.placeTool(selectedTool, data.position);
            }
        }
    }

    handleDrag(data) {
        // Handle dragging physics objects
        if (this.gameState === 'playing') {
            const body = this.physicsEngine.queryPoint(data.start);
            if (body && !body.isStatic) {
                const force = data.end.subtract(data.start).multiply(100);
                body.applyForce(force);
            }
        }
    }

    handleKeyPress(data) {
        switch (data.key) {
            case 'Escape':
                if (this.gameState === 'playing') {
                    this.pauseGame();
                } else if (this.gameState === 'paused') {
                    this.resumeGame();
                }
                break;
            case 'r':
            case 'R':
                if (this.gameState === 'playing') {
                    this.replayLevel();
                }
                break;
            case ' ':
                if (this.gameState === 'playing') {
                    this.pauseGame();
                } else if (this.gameState === 'paused') {
                    this.resumeGame();
                }
                break;
        }
    }

    // Tool placement
    placeTool(tool, position) {
        let body = null;
        
        switch (tool) {
            case 'ball':
                body = new RigidBody({
                    position: position,
                    radius: 15,
                    mass: 1,
                    restitution: 0.8,
                    color: '#00d4ff',
                    type: 'ball'
                });
                break;
                
            case 'ramp':
                body = new RigidBody({
                    position: position,
                    shape: 'rectangle',
                    width: 80,
                    height: 20,
                    isStatic: true,
                    color: '#8B4513',
                    type: 'ramp'
                });
                break;
                
            case 'spring':
                // Springs would need special handling with constraints
                body = new RigidBody({
                    position: position,
                    radius: 10,
                    mass: 0.5,
                    restitution: 1.2,
                    color: '#00ff88',
                    type: 'spring'
                });
                break;
        }
        
        if (body) {
            this.physicsEngine.addBody(body);
            this.physicsObjects.push(body);
            this.emit('toolPlaced', { tool, body, position });
        }
    }

    // Collision handling
    handlePhysicsCollision(data) {
        const { bodyA, bodyB, collision } = data;
        
        // Check for special interactions
        if (this.isPlayerEscapistCollision(bodyA, bodyB)) {
            this.handlePlayerEscapistInteraction();
        }
        
        // Create particle effects
        if (this.settings.particleEffects) {
            this.createCollisionParticles(collision.contactPoint, collision.normal);
        }
    }

    isPlayerEscapistCollision(bodyA, bodyB) {
        return (bodyA === this.player?.body && bodyB === this.escapist?.body) ||
               (bodyB === this.player?.body && bodyA === this.escapist?.body);
    }

    handlePlayerEscapistInteraction() {
        // Player caught the escapist - level objective might be complete
        this.levelManager.triggerPlayerEscapistInteraction();
    }

    // Utility methods
    showScreen(screenId) {
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    resizeCanvas() {
        if (this.renderer) {
            this.renderer.resize();
            
            // Update physics bounds
            if (this.physicsEngine) {
                this.physicsEngine.setBounds({
                    left: 0,
                    right: this.renderer.canvas.width,
                    top: this.renderer.canvas.height,
                    bottom: 0
                });
            }
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Progress management
    saveProgress() {
        localStorage.setItem('physicsAdventureProgress', JSON.stringify(this.progress));
    }

    loadProgress() {
        const saved = localStorage.getItem('physicsAdventureProgress');
        if (saved) {
            try {
                this.progress = { ...this.progress, ...JSON.parse(saved) };
            } catch (error) {
                console.warn('Failed to load saved progress:', error);
            }
        }
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
                    console.error(`Error in game event listener for ${event}:`, error);
                }
            }
        }
    }

    // Debug methods
    getDebugInfo() {
        return {
            gameState: this.gameState,
            currentLevel: this.currentLevel,
            fps: this.fps,
            physicsStats: this.physicsEngine.getStatistics(),
            progress: this.progress
        };
    }
}