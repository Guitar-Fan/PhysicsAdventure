/**
 * UIManager - Manages all user interface elements and interactions
 */
class UIManager {
    constructor() {
        // UI State
        this.selectedTool = null;
        this.isVisible = true;
        this.hudElements = new Map();
        
        // Physics data display
        this.physicsReadouts = {
            velocity: 0,
            acceleration: 0,
            force: 0,
            energy: 0
        };
        
        // Tool selection
        this.availableTools = ['ball', 'ramp', 'spring'];
        this.toolCooldowns = new Map();
        
        // Modal states
        this.activeModal = null;
        this.modalStack = [];
        
        // Animation states
        this.animationTime = 0;
        this.tutorialStep = 0;
        this.maxTutorialSteps = 3;
        
        // Event listeners
        this.eventListeners = new Map();
        
        // HUD Update frequency
        this.hudUpdateInterval = 100; // ms
        this.lastHudUpdate = 0;
    }

    async initialize() {
        this.setupToolSelection();
        this.setupModalHandlers();
        this.setupTutorialNavigation();
        this.setupPhysicsReadouts();
        this.setupEventListeners();
        
        console.log('UI Manager initialized');
    }

    setupToolSelection() {
        const toolsContainer = document.getElementById('toolsContainer');
        if (!toolsContainer) return;

        // Add click handlers for tools
        const tools = toolsContainer.querySelectorAll('.tool');
        tools.forEach(tool => {
            tool.addEventListener('click', (e) => {
                const toolType = tool.getAttribute('data-tool');
                this.selectTool(toolType);
            });
        });

        // Select first tool by default
        if (this.availableTools.length > 0) {
            this.selectTool(this.availableTools[0]);
        }
    }

    setupModalHandlers() {
        // Level complete modal handlers are set up in GameManager
        // This handles general modal functionality
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.hideActiveModal();
            }
        });
    }

    setupTutorialNavigation() {
        const nextBtn = document.getElementById('nextStep');
        const prevBtn = document.getElementById('prevStep');
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextTutorialStep());
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevTutorialStep());
        }
        
        this.updateTutorialNavigation();
    }

    setupPhysicsReadouts() {
        this.readoutElements = {
            velocity: document.getElementById('velocityDisplay'),
            acceleration: document.getElementById('accelerationDisplay'),
            force: document.getElementById('forceDisplay')
        };
    }

    setupEventListeners() {
        // Concept card interactions
        const conceptCards = document.querySelectorAll('.concept-card');
        conceptCards.forEach(card => {
            card.addEventListener('click', () => {
                const concept = card.getAttribute('data-concept');
                this.showConceptDetails(concept);
            });
        });
    }

    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // Update HUD elements
        const currentTime = Date.now();
        if (currentTime - this.lastHudUpdate > this.hudUpdateInterval) {
            this.updateHUD();
            this.lastHudUpdate = currentTime;
        }
        
        // Update tool cooldowns
        this.updateToolCooldowns(deltaTime);
        
        // Update animations
        this.updateAnimations(deltaTime);
    }

    updateHUD() {
        // Update physics readouts
        this.updatePhysicsReadouts();
        
        // Update level information
        this.updateLevelInfo();
        
        // Update tool availability
        this.updateToolAvailability();
    }

    updatePhysicsReadouts() {
        if (this.readoutElements.velocity) {
            this.readoutElements.velocity.textContent = `${this.physicsReadouts.velocity.toFixed(1)} m/s`;
        }
        
        if (this.readoutElements.acceleration) {
            this.readoutElements.acceleration.textContent = `${this.physicsReadouts.acceleration.toFixed(1)} m/s²`;
        }
        
        if (this.readoutElements.force) {
            this.readoutElements.force.textContent = `${this.physicsReadouts.force.toFixed(1)} N`;
        }
    }

    updateLevelInfo() {
        // Update level-specific information display
        // This would be called with current level data
    }

    updateToolAvailability() {
        const tools = document.querySelectorAll('.tool');
        tools.forEach(tool => {
            const toolType = tool.getAttribute('data-tool');
            const cooldownTime = this.toolCooldowns.get(toolType) || 0;
            
            if (cooldownTime > 0) {
                tool.classList.add('disabled');
                tool.style.opacity = '0.5';
            } else {
                tool.classList.remove('disabled');
                tool.style.opacity = '1';
            }
        });
    }

    updateToolCooldowns(deltaTime) {
        for (const [tool, cooldown] of this.toolCooldowns.entries()) {
            if (cooldown > 0) {
                this.toolCooldowns.set(tool, Math.max(0, cooldown - deltaTime * 1000));
            }
        }
    }

    updateAnimations(deltaTime) {
        // Animate pulsing elements
        const pulseElements = document.querySelectorAll('.tool.selected');
        pulseElements.forEach(element => {
            const pulseValue = Math.sin(this.animationTime * 3) * 0.1 + 0.9;
            element.style.transform = `scale(${pulseValue})`;
        });
    }

    // Tool management
    selectTool(toolType) {
        if (!this.availableTools.includes(toolType)) return;
        
        const cooldown = this.toolCooldowns.get(toolType) || 0;
        if (cooldown > 0) return;
        
        // Deselect previous tool
        if (this.selectedTool) {
            const prevTool = document.querySelector(`[data-tool="${this.selectedTool}"]`);
            if (prevTool) prevTool.classList.remove('selected');
        }
        
        // Select new tool
        this.selectedTool = toolType;
        const toolElement = document.querySelector(`[data-tool="${toolType}"]`);
        if (toolElement) {
            toolElement.classList.add('selected');
        }
        
        // Update cursor or visual feedback
        this.updateGameCursor(toolType);
        
        this.emit('toolSelected', { tool: toolType });
    }

    getSelectedTool() {
        return this.selectedTool;
    }

    setToolCooldown(toolType, cooldownTime) {
        this.toolCooldowns.set(toolType, cooldownTime);
    }

    updateGameCursor(toolType) {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        
        switch (toolType) {
            case 'ball':
                canvas.style.cursor = 'crosshair';
                break;
            case 'ramp':
                canvas.style.cursor = 'cell';
                break;
            case 'spring':
                canvas.style.cursor = 'grab';
                break;
            default:
                canvas.style.cursor = 'default';
        }
    }

    // Physics data updates
    updatePhysicsData(data) {
        this.physicsReadouts.velocity = data.velocity || 0;
        this.physicsReadouts.acceleration = data.acceleration || 0;
        this.physicsReadouts.force = data.force || 0;
        this.physicsReadouts.energy = data.energy || 0;
    }

    // Level information
    updateLevelInfo(levelData) {
        const levelNameElement = document.getElementById('levelName');
        const gravityInfoElement = document.getElementById('gravityInfo');
        const currentConceptElement = document.getElementById('currentConcept');
        
        if (levelNameElement && levelData.name) {
            levelNameElement.textContent = levelData.name;
        }
        
        if (gravityInfoElement && levelData.gravity) {
            const gravityMagnitude = levelData.gravity.magnitude();
            gravityInfoElement.textContent = `Gravity: ${gravityMagnitude.toFixed(2)} m/s²`;
        }
        
        if (currentConceptElement && levelData.concept) {
            currentConceptElement.textContent = levelData.concept;
        }
    }

    // Modal management
    showModal(modalId, data = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        this.hideActiveModal();
        
        this.activeModal = modalId;
        this.modalStack.push(modalId);
        modal.classList.add('active');
        
        // Populate modal with data
        this.populateModal(modalId, data);
        
        this.emit('modalShown', { modal: modalId, data });
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.classList.remove('active');
        
        if (this.activeModal === modalId) {
            this.activeModal = null;
        }
        
        // Remove from modal stack
        const index = this.modalStack.indexOf(modalId);
        if (index > -1) {
            this.modalStack.splice(index, 1);
        }
        
        this.emit('modalHidden', { modal: modalId });
    }

    hideActiveModal() {
        if (this.activeModal) {
            this.hideModal(this.activeModal);
        }
    }

    populateModal(modalId, data) {
        switch (modalId) {
            case 'levelCompleteModal':
                this.populateLevelCompleteModal(data);
                break;
        }
    }

    populateLevelCompleteModal(data) {
        const conceptElement = document.getElementById('conceptLearned');
        const timeElement = document.getElementById('completionTime');
        const accuracyElement = document.getElementById('accuracy');
        
        if (conceptElement && data.concept) {
            conceptElement.textContent = data.concept;
        }
        
        if (timeElement && data.time) {
            timeElement.textContent = data.time;
        }
        
        if (accuracyElement && data.accuracy !== undefined) {
            accuracyElement.textContent = `${data.accuracy}%`;
        }
    }

    showLevelComplete(data) {
        this.showModal('levelCompleteModal', data);
        
        // Add celebration effects
        this.createCelebrationEffects();
    }

    createCelebrationEffects() {
        // Create particle effects or animations for level completion
        const gameContainer = document.getElementById('gameContainer');
        if (!gameContainer) return;
        
        const celebration = document.createElement('div');
        celebration.className = 'celebration-effect';
        gameContainer.appendChild(celebration);
        
        setTimeout(() => {
            if (celebration.parentNode) {
                celebration.parentNode.removeChild(celebration);
            }
        }, 2000);
    }

    // Tutorial management
    nextTutorialStep() {
        if (this.tutorialStep < this.maxTutorialSteps - 1) {
            this.tutorialStep++;
            this.updateTutorialStep();
            this.updateTutorialNavigation();
        }
    }

    prevTutorialStep() {
        if (this.tutorialStep > 0) {
            this.tutorialStep--;
            this.updateTutorialStep();
            this.updateTutorialNavigation();
        }
    }

    updateTutorialStep() {
        const steps = document.querySelectorAll('.step');
        steps.forEach((step, index) => {
            if (index === this.tutorialStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    updateTutorialNavigation() {
        const nextBtn = document.getElementById('nextStep');
        const prevBtn = document.getElementById('prevStep');
        
        if (prevBtn) {
            prevBtn.disabled = this.tutorialStep === 0;
        }
        
        if (nextBtn) {
            if (this.tutorialStep === this.maxTutorialSteps - 1) {
                nextBtn.textContent = 'Start Playing';
            } else {
                nextBtn.textContent = 'Next';
            }
        }
    }

    // Concept visualization
    showConceptDetails(concept) {
        // Show detailed information about a physics concept
        const conceptData = this.getConceptData(concept);
        this.showModal('conceptDetailModal', conceptData);
    }

    getConceptData(concept) {
        const concepts = {
            gravity: {
                title: 'Gravitational Force',
                equation: 'F = G(m₁m₂)/r²',
                description: 'Objects with mass attract each other with a force proportional to their masses and inversely proportional to the square of the distance between them.',
                examples: ['Apple falling from tree', 'Moon orbiting Earth', 'Tides'],
                planetVariations: {
                    Earth: '9.81 m/s²',
                    Moon: '1.62 m/s²',
                    Mars: '3.71 m/s²',
                    Jupiter: '24.79 m/s²'
                }
            },
            momentum: {
                title: 'Momentum',
                equation: 'p = mv',
                description: 'The momentum of an object is the product of its mass and velocity. Momentum is conserved in collisions.',
                examples: ['Billiard balls colliding', 'Car crash', 'Rocket propulsion'],
                applications: ['Vehicle safety design', 'Sports equipment', 'Space travel']
            },
            energy: {
                title: 'Energy Conservation',
                equation: 'E = KE + PE = ½mv² + mgh',
                description: 'Energy cannot be created or destroyed, only transformed between kinetic and potential energy.',
                examples: ['Pendulum swinging', 'Roller coaster', 'Bouncing ball'],
                types: ['Kinetic Energy', 'Potential Energy', 'Thermal Energy', 'Elastic Energy']
            }
        };
        
        return concepts[concept] || {};
    }

    // Visual feedback
    showMessage(message, type = 'info', duration = 3000) {
        const messageContainer = this.getMessageContainer();
        
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.textContent = message;
        
        messageContainer.appendChild(messageElement);
        
        // Animate in
        setTimeout(() => messageElement.classList.add('show'), 10);
        
        // Remove after duration
        setTimeout(() => {
            messageElement.classList.remove('show');
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
            }, 300);
        }, duration);
    }

    getMessageContainer() {
        let container = document.getElementById('messageContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'messageContainer';
            container.className = 'message-container';
            document.body.appendChild(container);
        }
        return container;
    }

    showTooltip(element, text, position = 'top') {
        // Implementation for showing contextual tooltips
        const tooltip = document.createElement('div');
        tooltip.className = `tooltip tooltip-${position}`;
        tooltip.textContent = text;
        
        document.body.appendChild(tooltip);
        
        // Position tooltip relative to element
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        
        if (position === 'top') {
            tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
        } else {
            tooltip.style.top = rect.bottom + 10 + 'px';
        }
        
        return tooltip;
    }

    hideTooltip(tooltip) {
        if (tooltip && tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
        }
    }

    // HUD visibility
    setHUDVisible(visible) {
        this.isVisible = visible;
        const hud = document.getElementById('gameHUD');
        if (hud) {
            hud.style.display = visible ? 'block' : 'none';
        }
    }

    toggleHUD() {
        this.setHUDVisible(!this.isVisible);
    }

    // Screen management helpers
    showLoadingState() {
        this.showMessage('Loading...', 'info', 0); // 0 duration means it stays until manually removed
    }

    hideLoadingState() {
        const messages = document.querySelectorAll('.message');
        messages.forEach(msg => {
            if (msg.textContent === 'Loading...') {
                msg.classList.remove('show');
            }
        });
    }

    // Achievement display
    showAchievement(achievement) {
        const achievementElement = document.createElement('div');
        achievementElement.className = 'achievement-notification';
        achievementElement.innerHTML = `
            <div class="achievement-icon">🏆</div>
            <div class="achievement-text">
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-description">${achievement.description}</div>
            </div>
        `;
        
        document.body.appendChild(achievementElement);
        
        setTimeout(() => achievementElement.classList.add('show'), 10);
        
        setTimeout(() => {
            achievementElement.classList.remove('show');
            setTimeout(() => {
                if (achievementElement.parentNode) {
                    achievementElement.parentNode.removeChild(achievementElement);
                }
            }, 500);
        }, 4000);
    }

    // Render method for canvas-based UI elements
    render(renderer) {
        // Render any canvas-based UI elements here
        if (this.isVisible) {
            this.renderHints(renderer);
            this.renderDebugInfo(renderer);
        }
    }

    renderHints(renderer) {
        // Render contextual hints on the game canvas
        // This would show physics formulas, tips, etc.
    }

    renderDebugInfo(renderer) {
        if (renderer.showDebug) {
            const debugInfo = [
                `Selected Tool: ${this.selectedTool || 'None'}`,
                `Active Modal: ${this.activeModal || 'None'}`,
                `Tutorial Step: ${this.tutorialStep + 1}/${this.maxTutorialSteps}`
            ];
            
            renderer.renderText(debugInfo.join('\n'), new Vector2D(10, 100), {
                color: '#00d4ff',
                font: '12px monospace'
            });
        }
    }

    // Pause menu management
    showPauseMenu() {
        this.showModal('pauseModal');
    }

    hidePauseMenu() {
        this.hideModal('pauseModal');
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
                    console.error(`Error in UI event listener for ${event}:`, error);
                }
            }
        }
    }

    // Cleanup
    destroy() {
        this.eventListeners.clear();
        this.hideActiveModal();
    }
}