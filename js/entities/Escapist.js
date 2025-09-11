/**
 * Escapist - The antagonist who has "escaped" physics and must be brought back
 */
class Escapist {
    constructor(startPosition) {
        this.position = startPosition.copy();
        this.originalPosition = startPosition.copy();
        this.radius = 25;
        
        // The Escapist defies physics, so it has special properties
        this.body = new RigidBody({
            position: this.position,
            radius: this.radius,
            mass: 1.0,
            restitution: 0.9,
            friction: 0.1,
            color: '#ff0080',
            type: 'escapist'
        });
        
        // Physics defiance properties
        this.physicsCompliance = 0.0; // 0 = completely defies physics, 1 = follows physics normally
        this.targetCompliance = 0.0;
        this.complianceRate = 0.5; // How fast compliance changes
        
        // Visual properties
        this.energyField = {
            radius: 50,
            intensity: 1.0,
            pulseSpeed: 3.0,
            color: '#ff0080'
        };
        
        // Behavior states
        this.state = 'escaping'; // 'escaping', 'fleeing', 'caught', 'complying'
        this.fleeDistance = 100; // Distance to maintain from player
        this.escapeSpeed = 80;
        this.awarenessRadius = 150;
        
        // Animation
        this.animationTime = 0;
        this.phaseOffset = Math.random() * Math.PI * 2;
        this.floatHeight = 0;
        this.rotationSpeed = 2.0;
        this.rotation = 0;
        
        // Trail effect for supernatural movement
        this.energyTrail = [];
        this.maxTrailPoints = 30;
        
        // Physics interaction history
        this.recentInteractions = [];
        this.maxInteractionHistory = 10;
        
        // Special abilities
        this.canPhaseThrough = true;
        this.canFloat = true;
        this.canTeleport = false; // Unlocked in later levels
        
        // Progress tracking
        this.captureProgress = 0; // How close to being "caught" by physics
        this.maxCaptureProgress = 100;
    }

    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // Update physics compliance gradually
        this.updatePhysicsCompliance(deltaTime);
        
        // Update behavior based on current state
        this.updateBehavior(deltaTime);
        
        // Update visual effects
        this.updateVisualEffects(deltaTime);
        
        // Update position from physics body (modified by compliance)
        this.updatePosition(deltaTime);
        
        // Update trail
        this.updateEnergyTrail();
        
        // Check for capture conditions
        this.updateCaptureProgress(deltaTime);
    }

    updatePhysicsCompliance(deltaTime) {
        // Gradually move towards target compliance
        const difference = this.targetCompliance - this.physicsCompliance;
        const change = Math.sign(difference) * this.complianceRate * deltaTime;
        
        if (Math.abs(difference) > Math.abs(change)) {
            this.physicsCompliance += change;
        } else {
            this.physicsCompliance = this.targetCompliance;
        }
        
        // Clamp between 0 and 1
        this.physicsCompliance = Math.max(0, Math.min(1, this.physicsCompliance));
        
        // Apply compliance to physics body
        this.applyPhysicsCompliance();
    }

    applyPhysicsCompliance() {
        // The more compliant, the more the Escapist follows normal physics
        this.body.mass = 0.5 + (this.physicsCompliance * 1.5);
        this.body.restitution = 0.9 - (this.physicsCompliance * 0.3);
        this.body.friction = 0.1 + (this.physicsCompliance * 0.4);
        
        // Reduce supernatural abilities as compliance increases
        this.canPhaseThrough = this.physicsCompliance < 0.7;
        this.canFloat = this.physicsCompliance < 0.5;
        
        // Visual feedback - color shifts as compliance increases
        const hue = 320 - (this.physicsCompliance * 80); // From magenta to blue
        this.body.color = `hsl(${hue}, 100%, 50%)`;
        this.energyField.color = `hsl(${hue}, 80%, 60%)`;
    }

    updateBehavior(deltaTime) {
        switch (this.state) {
            case 'escaping':
                this.behaviorEscaping(deltaTime);
                break;
            case 'fleeing':
                this.behaviorFleeing(deltaTime);
                break;
            case 'caught':
                this.behaviorCaught(deltaTime);
                break;
            case 'complying':
                this.behaviorComplying(deltaTime);
                break;
        }
    }

    behaviorEscaping(deltaTime) {
        // Default behavior - float around randomly, defying gravity
        if (this.canFloat) {
            // Sinusoidal floating motion
            const floatForce = new Vector2D(0, Math.sin(this.animationTime * 2 + this.phaseOffset) * 50);
            this.body.applyForce(floatForce);
        }
        
        // Random drift
        if (Math.random() < 0.02) { // 2% chance per frame to change direction
            const randomForce = Vector2D.random(0, 30);
            this.body.applyForce(randomForce);
        }
        
        // Anti-gravity when compliance is low
        if (this.physicsCompliance < 0.3) {
            const antiGravity = new Vector2D(0, 9.81 * this.body.mass * (1 - this.physicsCompliance));
            this.body.applyForce(antiGravity);
        }
    }

    behaviorFleeing(deltaTime) {
        // Flee from player and physics objects
        const player = this.findNearestPlayer();
        if (player) {
            const distance = this.position.distance(player.position);
            
            if (distance < this.awarenessRadius) {
                // Calculate flee direction
                const fleeDirection = this.position.subtract(player.position).normalize();
                const fleeForce = fleeDirection.multiply(this.escapeSpeed);
                
                // Apply supernatural movement if not compliant
                if (this.physicsCompliance < 0.5) {
                    this.body.velocity.addMut(fleeForce.multiply(deltaTime));
                } else {
                    this.body.applyForce(fleeForce);
                }
                
                // Increase compliance slightly when fleeing (pressure effect)
                this.increaseCompliance(0.1 * deltaTime);
            }
        }
        
        // Also flee from physics objects that might trap it
        this.fleeFromPhysicsObjects(deltaTime);
    }

    behaviorCaught(deltaTime) {
        // Struggle against physics, but gradually become more compliant
        this.increaseCompliance(0.3 * deltaTime);
        
        // Dramatic visual effects
        this.energyField.intensity = 1.5 + Math.sin(this.animationTime * 10) * 0.5;
        
        // Eventually transition to complying
        if (this.physicsCompliance > 0.8) {
            this.setState('complying');
        }
    }

    behaviorComplying(deltaTime) {
        // Fully subject to physics now
        this.targetCompliance = 1.0;
        
        // Calm visual effects
        this.energyField.intensity = 0.3;
        this.rotationSpeed = 0.5;
    }

    updateVisualEffects(deltaTime) {
        // Update floating animation
        this.floatHeight = Math.sin(this.animationTime * 1.5 + this.phaseOffset) * 10 * (1 - this.physicsCompliance);
        
        // Update rotation
        this.rotation += this.rotationSpeed * deltaTime;
        
        // Update energy field
        this.energyField.radius = 40 + Math.sin(this.animationTime * this.energyField.pulseSpeed) * 15;
        this.energyField.intensity = Math.max(0.3, 1.0 - this.physicsCompliance * 0.7);
    }

    updatePosition(deltaTime) {
        // Blend between physics position and supernatural position
        const physicsPos = this.body.position.copy();
        const supernaturalPos = physicsPos.add(new Vector2D(0, this.floatHeight));
        
        // Interpolate based on compliance
        this.position = physicsPos.lerp(supernaturalPos, 1 - this.physicsCompliance);
        
        // Update body position if defying physics
        if (this.physicsCompliance < 0.9) {
            this.body.position = this.position.copy();
        }
    }

    updateEnergyTrail() {
        // Add current position to trail
        this.energyTrail.push({
            position: this.position.copy(),
            timestamp: Date.now(),
            intensity: this.energyField.intensity
        });
        
        // Remove old trail points
        const maxAge = 800; // 0.8 seconds
        const currentTime = Date.now();
        this.energyTrail = this.energyTrail.filter(point => {
            return (currentTime - point.timestamp) < maxAge;
        });
        
        // Limit trail length
        if (this.energyTrail.length > this.maxTrailPoints) {
            this.energyTrail.shift();
        }
    }

    updateCaptureProgress(deltaTime) {
        // Increase capture progress when near physics objects or player
        const player = this.findNearestPlayer();
        if (player && this.position.distance(player.position) < 60) {
            this.captureProgress += deltaTime * 20;
            this.increaseCompliance(0.2 * deltaTime);
        }
        
        // Decrease when free
        if (this.captureProgress > 0 && !this.isNearConstraints()) {
            this.captureProgress -= deltaTime * 5;
        }
        
        // Clamp progress
        this.captureProgress = Math.max(0, Math.min(this.maxCaptureProgress, this.captureProgress));
        
        // State transitions based on progress
        if (this.captureProgress > 80 && this.state !== 'caught' && this.state !== 'complying') {
            this.setState('caught');
        } else if (this.captureProgress < 20 && this.state === 'caught') {
            this.setState('fleeing');
        }
    }

    render(renderer) {
        // Render energy trail
        this.renderEnergyTrail(renderer);
        
        // Render energy field
        this.renderEnergyField(renderer);
        
        // Render main body
        const renderPos = this.position;
        
        // Pulsing effect based on compliance
        const pulseSize = this.radius + Math.sin(this.animationTime * 5) * 3 * (1 - this.physicsCompliance);
        
        renderer.save();
        renderer.context.translate(renderPos.x, renderPos.y);
        renderer.context.rotate(this.rotation);
        
        // Main body with shifting color
        renderer.renderCircle(Vector2D.zero(), pulseSize, {
            fillColor: this.body.color,
            strokeColor: '#ffffff',
            strokeWidth: 2,
            alpha: 0.9
        });
        
        // Inner energy core
        const coreSize = pulseSize * 0.4;
        renderer.renderCircle(Vector2D.zero(), coreSize, {
            fillColor: '#ffffff',
            alpha: 0.6 + Math.sin(this.animationTime * 8) * 0.3
        });
        
        // Rotating energy bands (when not compliant)
        if (this.physicsCompliance < 0.8) {
            this.renderEnergyBands(renderer, pulseSize);
        }
        
        renderer.restore();
        
        // Render compliance indicator
        if (this.physicsCompliance > 0.1) {
            this.renderComplianceIndicator(renderer, renderPos);
        }
        
        // Render capture progress
        if (this.captureProgress > 0) {
            this.renderCaptureProgress(renderer, renderPos);
        }
    }

    renderEnergyTrail(renderer) {
        if (this.energyTrail.length < 2) return;
        
        for (let i = 0; i < this.energyTrail.length; i++) {
            const point = this.energyTrail[i];
            const age = Date.now() - point.timestamp;
            const maxAge = 800;
            const alpha = (1 - age / maxAge) * 0.4 * point.intensity;
            const size = this.radius * 0.5 * alpha;
            
            renderer.renderCircle(point.position, size, {
                fillColor: this.energyField.color,
                alpha: alpha
            });
        }
    }

    renderEnergyField(renderer) {
        const intensity = this.energyField.intensity;
        
        // Multiple layers for depth
        for (let i = 0; i < 3; i++) {
            const layerRadius = this.energyField.radius - (i * 8);
            const layerAlpha = (intensity * 0.1) / (i + 1);
            
            renderer.renderCircle(this.position, layerRadius, {
                fillColor: this.energyField.color,
                alpha: layerAlpha
            });
        }
    }

    renderEnergyBands(renderer, bodyRadius) {
        const bandCount = 3;
        const rotationOffset = this.animationTime * 2;
        
        for (let i = 0; i < bandCount; i++) {
            const angle = (i * Math.PI * 2 / bandCount) + rotationOffset;
            const distance = bodyRadius * 0.7;
            const bandPos = Vector2D.fromAngle(angle, distance);
            
            renderer.renderCircle(bandPos, 3, {
                fillColor: '#ffffff',
                alpha: 0.8
            });
        }
    }

    renderComplianceIndicator(renderer, position) {
        const barWidth = this.radius * 2;
        const barHeight = 4;
        const barPos = position.add(new Vector2D(0, -this.radius - 15));
        
        // Background
        renderer.renderRectangle(barPos, barWidth, barHeight, {
            fillColor: '#333333',
            alpha: 0.8
        });
        
        // Compliance fill
        const fillWidth = barWidth * this.physicsCompliance;
        const fillPos = barPos.add(new Vector2D(-(barWidth - fillWidth) / 2, 0));
        
        // Color shifts from red (non-compliant) to blue (compliant)
        const hue = 320 - (this.physicsCompliance * 80);
        const fillColor = `hsl(${hue}, 100%, 50%)`;
        
        renderer.renderRectangle(fillPos, fillWidth, barHeight, {
            fillColor: fillColor,
            alpha: 0.9
        });
        
        // Label
        renderer.renderText('Physics Compliance', barPos.add(new Vector2D(-barWidth/2, -15)), {
            color: '#ffffff',
            font: '10px Arial',
            alpha: 0.7
        });
    }

    renderCaptureProgress(renderer, position) {
        const progressRadius = this.radius + 10;
        const progressAngle = (this.captureProgress / this.maxCaptureProgress) * Math.PI * 2;
        
        // Draw progress arc
        renderer.context.strokeStyle = '#00ff88';
        renderer.context.lineWidth = 4;
        renderer.context.globalAlpha = 0.8;
        renderer.context.beginPath();
        renderer.context.arc(position.x, position.y, progressRadius, -Math.PI / 2, -Math.PI / 2 + progressAngle);
        renderer.context.stroke();
        renderer.context.globalAlpha = 1;
    }

    // Behavior helper methods
    findNearestPlayer() {
        // This would be injected or accessed from game manager
        // For now, return null - will be implemented with proper game integration
        return null;
    }

    fleeFromPhysicsObjects(deltaTime) {
        // Find nearby physics objects and flee from them
        // Implementation depends on physics engine integration
    }

    isNearConstraints() {
        // Check if escapist is near objects that would constrain it
        const player = this.findNearestPlayer();
        if (player && this.position.distance(player.position) < 80) {
            return true;
        }
        return false;
    }

    // State management
    setState(newState) {
        if (this.state !== newState) {
            this.onStateExit(this.state);
            this.state = newState;
            this.onStateEnter(newState);
        }
    }

    onStateEnter(state) {
        switch (state) {
            case 'fleeing':
                this.rotationSpeed = 4.0;
                break;
            case 'caught':
                this.energyField.pulseSpeed = 6.0;
                break;
            case 'complying':
                this.targetCompliance = 1.0;
                break;
        }
    }

    onStateExit(state) {
        // Cleanup when leaving states
    }

    // Physics compliance manipulation
    increaseCompliance(amount) {
        this.targetCompliance = Math.min(1.0, this.targetCompliance + amount);
    }

    decreaseCompliance(amount) {
        this.targetCompliance = Math.max(0.0, this.targetCompliance - amount);
    }

    forceCompliance(value) {
        this.physicsCompliance = Math.max(0, Math.min(1, value));
        this.targetCompliance = this.physicsCompliance;
    }

    // Interaction methods
    onPlayerContact(player) {
        this.increaseCompliance(0.5);
        this.setState('caught');
        
        // Record interaction
        this.recentInteractions.push({
            type: 'player_contact',
            timestamp: Date.now(),
            position: this.position.copy()
        });
        
        if (this.recentInteractions.length > this.maxInteractionHistory) {
            this.recentInteractions.shift();
        }
    }

    onPhysicsObjectCollision(object, collision) {
        this.increaseCompliance(0.1);
        
        // Record interaction
        this.recentInteractions.push({
            type: 'physics_collision',
            timestamp: Date.now(),
            object: object,
            position: this.position.copy()
        });
    }

    // Special abilities
    teleportTo(position) {
        if (this.canTeleport && this.physicsCompliance < 0.5) {
            this.position = position.copy();
            this.body.position = position.copy();
            this.body.velocity.set(0, 0);
            
            // Create teleport effect
            // This would trigger particle effects
        }
    }

    phaseThrough(object) {
        return this.canPhaseThrough && this.physicsCompliance < 0.7;
    }

    // Utility methods
    getPosition() {
        return this.position.copy();
    }

    getComplianceLevel() {
        return this.physicsCompliance;
    }

    isCaptured() {
        return this.physicsCompliance >= 0.9;
    }

    getState() {
        return this.state;
    }

    // Serialization
    toJSON() {
        return {
            position: { x: this.position.x, y: this.position.y },
            physicsCompliance: this.physicsCompliance,
            targetCompliance: this.targetCompliance,
            state: this.state,
            captureProgress: this.captureProgress,
            body: this.body.toJSON()
        };
    }

    static fromJSON(data) {
        const escapist = new Escapist(new Vector2D(data.position.x, data.position.y));
        escapist.physicsCompliance = data.physicsCompliance;
        escapist.targetCompliance = data.targetCompliance;
        escapist.state = data.state;
        escapist.captureProgress = data.captureProgress;
        escapist.body = RigidBody.fromJSON(data.body);
        return escapist;
    }
}