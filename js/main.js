/**
 * Main game initialization and entry point
 */

// Game instance
let game = null;

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Initializing Physics Adventure...');
        
        // Initialize background effects
        initializeBackgroundEffects();
        
        // Initialize sound system
        soundManager.loadSounds();
        
        // Show loading state
        showLoadingScreen();
        
        // Initialize the game with detailed progress feedback
        updateLoadingProgress('Creating Game Manager...', 0);
        game = new GameManager();
        
        // Listen for initialization progress events
        game.on('initProgress', (data) => {
            const stepMessages = {
                'renderer': 'Setting up Graphics...',
                'physics': 'Loading Physics Engine...',
                'input': 'Configuring Input System...',
                'ui': 'Building User Interface...',
                'levels': 'Loading Levels...',
                'story': 'Preparing Story System...',
                'events': 'Setting up Event Handlers...',
                'gameloop': 'Starting Game Loop...',
                'complete': 'Game Ready!'
            };
            
            const message = stepMessages[data.step] || `Loading ${data.step}...`;
            updateLoadingProgress(message, data.progress);
        });
        
        game.on('initError', (data) => {
            console.error('Game initialization error:', data.error);
            showErrorScreen(data.error);
        });
        
        updateLoadingProgress('Initializing Systems...', 5);
        
        // Add a small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await game.initialize();
        
        updateLoadingProgress('Setting up Navigation...', 95);
        // Set up global event listeners
        setupGlobalEventListeners();
        
        // Set up screen navigation
        setupScreenNavigation();
        
        updateLoadingProgress('Game Ready!', 100);
        
        // Small delay to show 100% completion, then transition
        setTimeout(() => {
            console.log('Attempting to hide loading screen and show menu...');
            try {
                hideLoadingScreen();
                showScreen('mainMenu');
                console.log('Successfully transitioned to menu screen');
            } catch (error) {
                console.error('Error transitioning to menu:', error);
                showErrorScreen('Failed to start game: ' + error.message);
            }
        }, 500); // Reduced from 1000ms to 500ms
        
        console.log('Physics Adventure initialized successfully!');
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        showErrorScreen(error.message);
    }
});

// Screen management
function showScreen(screenId) {
    console.log(`Showing screen: ${screenId}`);
    
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    console.log(`Found ${screens.length} screens`);
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show the requested screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        console.log(`Successfully activated screen: ${screenId}`);
    } else {
        console.error(`Screen not found: ${screenId}`);
        return;
    }
    
    // Handle screen-specific setup
    handleScreenActivation(screenId);
}

function handleScreenActivation(screenId) {
    switch (screenId) {
        case 'gameScreen':
            if (game) {
                game.start();
            }
            break;
        case 'tutorialScreen':
            initializeTutorial();
            break;
        case 'conceptsScreen':
            initializeConceptsDisplay();
            break;
    }
}

function setupScreenNavigation() {
    // Menu navigation with enhanced interactions
    document.getElementById('startGameBtn')?.addEventListener('click', (e) => {
        soundManager.play('buttonClick');
        animateButtonClick(e.target);
        game.storyManager.startChapter('prologue');
        showScreen('storyScreen');
    });
    
    document.getElementById('tutorialBtn')?.addEventListener('click', (e) => {
        soundManager.play('buttonClick');
        animateButtonClick(e.target);
        showScreen('tutorialScreen');
    });
    
    document.getElementById('conceptsBtn')?.addEventListener('click', (e) => {
        soundManager.play('buttonClick');
        animateButtonClick(e.target);
        showScreen('conceptsScreen');
    });
    
    // Add hover effects to all menu buttons
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            soundManager.play('buttonHover');
            if (typeof gsap !== 'undefined') {
                gsap.to(btn, {
                    duration: 0.3,
                    scale: 1.05,
                    ease: "power2.out"
                });
            }
        });
        
        btn.addEventListener('mouseleave', () => {
            if (typeof gsap !== 'undefined') {
                gsap.to(btn, {
                    duration: 0.3,
                    scale: 1,
                    ease: "power2.out"
                });
            }
        });
    }
}

// Button animation helper
function animateButtonClick(button) {
    if (typeof gsap !== 'undefined') {
        gsap.to(button, {
            duration: 0.1,
            scale: 0.95,
            ease: "power2.out",
            yoyo: true,
            repeat: 1
        });
    }
}

    // Back buttons
    const backButtons = document.querySelectorAll('.back-btn');
    backButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            showScreen('mainMenu');
        });
    });
    
    // Story to game transition
    document.getElementById('continueToGame')?.addEventListener('click', () => {
        showScreen('gameScreen');
    });
    
    // Level complete modal
    document.getElementById('nextLevel')?.addEventListener('click', () => {
        if (game) {
            game.levelManager.nextLevel();
        }
        game.uiManager.hideModal('levelCompleteModal');
    });
    
    document.getElementById('restartLevel')?.addEventListener('click', () => {
        if (game) {
            game.levelManager.restartLevel();
        }
        game.uiManager.hideModal('levelCompleteModal');
    });
    
    document.getElementById('mainMenu')?.addEventListener('click', () => {
        if (game) {
            game.pause();
        }
        showScreen('mainMenu');
        game.uiManager.hideModal('levelCompleteModal');
    });

    // Pause modal handlers
    document.getElementById('resumeGame')?.addEventListener('click', () => {
        if (game) {
            game.resume();
        }
        game.uiManager.hideModal('pauseModal');
    });
    
    document.getElementById('pauseRestartLevel')?.addEventListener('click', () => {
        if (game) {
            game.levelManager.restartLevel();
        }
        game.uiManager.hideModal('pauseModal');
    });
    
    document.getElementById('pauseMainMenu')?.addEventListener('click', () => {
        if (game) {
            game.pause();
        }
        showScreen('mainMenu');
        game.uiManager.hideModal('pauseModal');
    });
}

function initializeTutorial() {
    // Tutorial is handled by UI Manager
    if (game && game.uiManager) {
        game.uiManager.tutorialStep = 0;
        game.uiManager.updateTutorialStep();
        game.uiManager.updateTutorialNavigation();
    }
}

function initializeConceptsDisplay() {
    // Concepts are populated by the HTML and styled with CSS
    // Interactivity is handled by UI Manager
    console.log('Concepts screen initialized');
}

function setupGlobalEventListeners() {
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'Escape':
                if (game && game.isRunning()) {
                    showScreen('mainMenu');
                    game.pause();
                }
                break;
            case 'F11':
                toggleFullscreen();
                e.preventDefault();
                break;
            case 'F1':
                if (game) {
                    showScreen('tutorialScreen');
                }
                e.preventDefault();
                break;
            case 'F2':
                if (game) {
                    showScreen('conceptsScreen');
                }
                e.preventDefault();
                break;
        }
    });
    
    // Window resize
    window.addEventListener('resize', () => {
        if (game && game.renderer) {
            game.renderer.handleResize();
        }
    });
    
    // Visibility change (pause when tab is hidden)
    document.addEventListener('visibilitychange', () => {
        if (game) {
            if (document.hidden) {
                game.pause();
            } else {
                // Don't auto-resume, let player choose
            }
        }
    });
    
    // Prevent context menu on canvas
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
}

// Loading screen management
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('active');
    }
}

function updateLoadingProgress(message, percentage) {
    const loadingMessage = document.getElementById('loadingMessage');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if (loadingMessage) {
        loadingMessage.textContent = message;
    }
    
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
    
    if (progressText) {
        progressText.textContent = `${percentage}%`;
    }
    
    // Update loading tips based on progress
    updateLoadingTip(percentage);
    
    console.log(`Loading: ${message} (${percentage}%)`);
}

function updateLoadingTip(percentage) {
    const loadingTips = [
        "💡 Tip: Use drag and drop to create physics objects!",
        "🚀 Tip: Each planet has different gravity - experiment!",
        "⚡ Tip: Watch the force vectors to understand physics!",
        "🎯 Tip: Try different tools to see various physics concepts!",
        "🌟 Tip: The Escapist will learn as you demonstrate physics!"
    ];
    
    const tipElement = document.querySelector('.loading-tips p');
    if (tipElement && percentage > 0) {
        const tipIndex = Math.floor((percentage / 100) * loadingTips.length);
        const currentTip = loadingTips[Math.min(tipIndex, loadingTips.length - 1)];
        
        if (tipElement.textContent !== currentTip) {
            tipElement.style.opacity = '0';
            setTimeout(() => {
                tipElement.textContent = currentTip;
                tipElement.style.opacity = '0.8';
            }, 200);
        }
    }
}

// Initialize background effects
function initializeBackgroundEffects() {
    // Initialize particles.js
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: {
                    value: 80,
                    density: {
                        enable: true,
                        value_area: 800
                    }
                },
                color: {
                    value: "#00d4ff"
                },
                shape: {
                    type: "circle",
                    stroke: {
                        width: 0,
                        color: "#000000"
                    }
                },
                opacity: {
                    value: 0.5,
                    random: false,
                    anim: {
                        enable: false,
                        speed: 1,
                        opacity_min: 0.1,
                        sync: false
                    }
                },
                size: {
                    value: 3,
                    random: true,
                    anim: {
                        enable: false,
                        speed: 40,
                        size_min: 0.1,
                        sync: false
                    }
                },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: "#00d4ff",
                    opacity: 0.4,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 2,
                    direction: "none",
                    random: false,
                    straight: false,
                    out_mode: "out",
                    bounce: false
                }
            },
            interactivity: {
                detect_on: "canvas",
                events: {
                    onhover: {
                        enable: true,
                        mode: "repulse"
                    },
                    onclick: {
                        enable: true,
                        mode: "push"
                    },
                    resize: true
                }
            },
            retina_detect: true
        });
    }
    
    // Initialize GSAP animations for menu
    if (typeof gsap !== 'undefined') {
        // Animate title on load
        gsap.from(".game-title", {
            duration: 2,
            y: -100,
            opacity: 0,
            ease: "bounce.out",
            delay: 0.5
        });
        
        // Animate subtitle
        gsap.from(".game-subtitle", {
            duration: 1.5,
            y: 50,
            opacity: 0,
            ease: "power2.out",
            delay: 1
        });
        
        // Animate buttons one by one
        gsap.from(".menu-btn", {
            duration: 1,
            x: -200,
            opacity: 0,
            ease: "back.out(1.7)",
            stagger: 0.2,
            delay: 1.5
        });
    }
}

// Sound Manager
class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
    }
    
    loadSounds() {
        if (typeof Howl === 'undefined') return;
        
        // Using placeholder sounds (you can replace with actual sound files)
        this.sounds.buttonHover = new Howl({
            src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBiCJz/LNeSsFJHfH8N+SQw'],
            volume: 0.1
        });
        
        this.sounds.buttonClick = new Howl({
            src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBiCJz/LNeSsFJHfH8N+SQw'],
            volume: 0.2
        });
    }
    
    play(soundName) {
        if (this.enabled && this.sounds[soundName]) {
            this.sounds[soundName].play();
        }
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

// Global sound manager instance
const soundManager = new SoundManager();

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        // Add fade out effect
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transition = 'opacity 0.5s ease-out';
        
        // Remove from DOM after animation
        setTimeout(() => {
            loadingScreen.classList.remove('active');
            loadingScreen.style.display = 'none';
        }, 500);
    }
}

function showErrorScreen(message) {
    hideLoadingScreen();
    
    // Create error screen if it doesn't exist
    let errorScreen = document.getElementById('errorScreen');
    if (!errorScreen) {
        errorScreen = document.createElement('div');
        errorScreen.id = 'errorScreen';
        errorScreen.className = 'screen error-screen';
        errorScreen.innerHTML = `
            <div class="error-content">
                <h2>⚠️ Game Failed to Load</h2>
                <p id="errorMessage">${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Reload Page</button>
            </div>
        `;
        document.body.appendChild(errorScreen);
    } else {
        document.getElementById('errorMessage').textContent = message;
    }
    
    errorScreen.classList.add('active');
}

// Utility functions
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Error attempting to enable fullscreen:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// Development helpers
function toggleDebugMode() {
    if (game && game.renderer) {
        game.renderer.showDebug = !game.renderer.showDebug;
        console.log('Debug mode:', game.renderer.showDebug ? 'ON' : 'OFF');
    }
}

function resetGame() {
    if (game) {
        game.destroy();
    }
    location.reload();
}

// Expose some functions globally for debugging
window.toggleDebugMode = toggleDebugMode;
window.resetGame = resetGame;
window.game = () => game;

// Performance monitoring
let performanceStats = {
    frameCount: 0,
    lastFpsUpdate: 0,
    fps: 0
};

function updatePerformanceStats() {
    performanceStats.frameCount++;
    const now = performance.now();
    
    if (now - performanceStats.lastFpsUpdate > 1000) {
        performanceStats.fps = Math.round(performanceStats.frameCount * 1000 / (now - performanceStats.lastFpsUpdate));
        performanceStats.frameCount = 0;
        performanceStats.lastFpsUpdate = now;
        
        // Update FPS display if it exists
        const fpsDisplay = document.getElementById('fpsDisplay');
        if (fpsDisplay) {
            fpsDisplay.textContent = `${performanceStats.fps} FPS`;
        }
    }
}

// Start performance monitoring
function startPerformanceMonitoring() {
    function updateStats() {
        updatePerformanceStats();
        requestAnimationFrame(updateStats);
    }
    updateStats();
}

// Initialize performance monitoring
startPerformanceMonitoring();

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (game) {
        game.destroy();
    }
});

// Service worker registration for potential offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker could be added later for offline play
        console.log('Service worker support detected');
    });
}

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showScreen,
        toggleDebugMode,
        resetGame
    };
}