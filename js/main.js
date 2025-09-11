/**
 * Main game initialization and entry point
 */

// Game instance
let game = null;

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Initializing Physics Adventure...');
        
        // Show loading state
        showLoadingScreen();
        
        // Initialize the game
        game = new GameManager();
        await game.initialize();
        
        // Set up global event listeners
        setupGlobalEventListeners();
        
        // Set up screen navigation
        setupScreenNavigation();
        
        // Hide loading screen and show menu
        hideLoadingScreen();
        showScreen('menuScreen');
        
        console.log('Physics Adventure initialized successfully!');
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        showErrorScreen(error.message);
    }
});

// Screen management
function showScreen(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show the requested screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
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
    // Menu navigation
    document.getElementById('startGameBtn')?.addEventListener('click', () => {
        game.storyManager.startChapter('prologue');
        showScreen('storyScreen');
    });
    
    document.getElementById('tutorialBtn')?.addEventListener('click', () => {
        showScreen('tutorialScreen');
    });
    
    document.getElementById('conceptsBtn')?.addEventListener('click', () => {
        showScreen('conceptsScreen');
    });
    
    // Back buttons
    const backButtons = document.querySelectorAll('.back-btn');
    backButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            showScreen('menuScreen');
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
        showScreen('menuScreen');
        game.uiManager.hideModal('levelCompleteModal');
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
                    showScreen('menuScreen');
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

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.remove('active');
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