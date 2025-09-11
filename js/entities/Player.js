/**
 * Player - The main character controlled by physics interactions
 */
class Player {
    constructor(startPosition) {
        this.position = startPosition.copy();
        this.radius = 20;
        this.color = '#00d4ff';
        this.glowColor = '#00ffff';
        
        // Physics body
        this.body = new RigidBody({
            position: this.position,
            radius: this.radius,
            mass: 2.0,
            restitution: 0.6,
            friction: 0.3,
            color: this.color,
            type: 'player'
        });
        
        // Visual effects
        this.glowIntensity = 0.5;
        this.pulseTime = 0;
        this.trailPoints = [];
        this.maxTrailPoints = 20;
        
        // State
        this.isActive = true;
        this.energy = 100;
        this.maxEnergy = 100;
        
        // Animation
        this.animationTime = 0;
        this.bobOffset = 0;
    }

    update(deltaTime) {
        if (!this.isActive) return;
        
        // Update position from physics body
        this.position = this.body.position.copy();
        
        // Update animations
        this.animationTime += deltaTime;
        this.pulseTime += deltaTime * 2;
        this.bobOffset = Math.sin(this.animationTime * 3) * 2;
        
        // Update trail
        this.updateTrail();
        
        // Update energy (slowly regenerate)
        this.energy = Math.min(this.maxEnergy, this.energy + deltaTime * 10);
        
        // Update glow based on movement
        const speed = this.body.velocity.magnitude();
        this.glowIntensity = 0.5 + Math.min(speed / 100, 0.5);
    }

    updateTrail() {
        // Add current position to trail
        this.trailPoints.push({
            position: this.position.copy(),
            timestamp: Date.now(),
            alpha: 1.0
        });
        
        // Remove old trail points
        const maxAge = 1000; // 1 second
        const currentTime = Date.now();
        this.trailPoints = this.trailPoints.filter(point => {
            const age = currentTime - point.timestamp;
            if (age > maxAge) return false;
            
            // Update alpha based on age
            point.alpha = 1.0 - (age / maxAge);
            return true;
        });
        
        // Limit trail length
        if (this.trailPoints.length > this.maxTrailPoints) {
            this.trailPoints.shift();
        }
    }

    render(renderer) {
        const renderPos = this.position.add(new Vector2D(0, this.bobOffset));
        
        // Render trail
        this.renderTrail(renderer);
        
        // Render glow effect
        this.renderGlow(renderer, renderPos);
        
        // Render main body
        renderer.renderCircle(renderPos, this.radius, {
            fillColor: this.color,
            strokeColor: '#ffffff',
            strokeWidth: 2
        });
        
        // Render inner details
        const pulseSize = 2 + Math.sin(this.pulseTime) * 1;
        renderer.renderCircle(renderPos, pulseSize, {
            fillColor: '#ffffff',
            alpha: 0.8
        });
        
        // Render energy indicator
        if (this.energy < this.maxEnergy) {
            this.renderEnergyBar(renderer, renderPos);
        }
        
        // Render physics indicator when moving
        if (this.body.velocity.magnitude() > 5) {
            this.renderMovementIndicator(renderer, renderPos);
        }
    }

    renderTrail(renderer) {
        if (this.trailPoints.length < 2) return;
        
        for (let i = 0; i < this.trailPoints.length - 1; i++) {
            const point = this.trailPoints[i];
            const size = (this.radius * 0.3) * point.alpha;
            
            renderer.renderCircle(point.position, size, {
                fillColor: this.glowColor,
                alpha: point.alpha * 0.3
            });
        }
    }

    renderGlow(renderer, position) {
        const glowRadius = this.radius + 10 + Math.sin(this.pulseTime) * 5;
        
        // Multiple glow layers for better effect
        for (let i = 0; i < 3; i++) {
            const layerRadius = glowRadius - (i * 3);
            const layerAlpha = (this.glowIntensity * 0.1) / (i + 1);
            
            renderer.renderCircle(position, layerRadius, {
                fillColor: this.glowColor,
                alpha: layerAlpha
            });
        }
    }

    renderEnergyBar(renderer, position) {
        const barWidth = this.radius * 2;
        const barHeight = 4;
        const barPos = position.add(new Vector2D(0, -this.radius - 10));
        
        // Background
        renderer.renderRectangle(barPos, barWidth, barHeight, {
            fillColor: '#333333',
            alpha: 0.8
        });
        
        // Energy fill
        const fillWidth = barWidth * (this.energy / this.maxEnergy);
        const fillPos = barPos.add(new Vector2D(-(barWidth - fillWidth) / 2, 0));
        
        renderer.renderRectangle(fillPos, fillWidth, barHeight, {
            fillColor: '#00ff88',
            alpha: 0.9
        });
    }

    renderMovementIndicator(renderer, position) {
        const velocity = this.body.velocity;
        if (velocity.magnitude() < 1) return;
        
        // Render velocity vector
        const vectorScale = 0.2;
        const vectorEnd = position.add(velocity.multiply(vectorScale));
        
        renderer.renderLine(position, vectorEnd, {
            color: '#ffaa00',
            width: 3,
            alpha: 0.8
        });
        
        // Render arrowhead
        const arrowSize = 8;
        const angle = velocity.angle();
        
        const arrowPoint1 = vectorEnd.add(Vector2D.fromAngle(angle + Math.PI - 0.3, arrowSize));
        const arrowPoint2 = vectorEnd.add(Vector2D.fromAngle(angle + Math.PI + 0.3, arrowSize));
        
        renderer.context.fillStyle = '#ffaa00';
        renderer.context.globalAlpha = 0.8;
        renderer.context.beginPath();
        renderer.context.moveTo(vectorEnd.x, vectorEnd.y);
        renderer.context.lineTo(arrowPoint1.x, arrowPoint1.y);
        renderer.context.lineTo(arrowPoint2.x, arrowPoint2.y);
        renderer.context.closePath();
        renderer.context.fill();
        renderer.context.globalAlpha = 1;
    }

    // Player actions
    applyForce(force) {
        if (!this.isActive) return;
        
        const energyCost = force.magnitude() * 0.1;
        if (this.energy >= energyCost) {
            this.body.applyForce(force);
            this.energy -= energyCost;
        }
    }

    teleportTo(position) {
        this.position = position.copy();
        this.body.position = position.copy();
        this.body.velocity.set(0, 0);
        this.clearTrail();
    }

    clearTrail() {
        this.trailPoints = [];
    }

    // State management
    activate() {
        this.isActive = true;
        this.body.wake();
    }

    deactivate() {
        this.isActive = false;
        this.body.velocity.set(0, 0);
    }

    reset() {
        this.energy = this.maxEnergy;
        this.clearTrail();
        this.animationTime = 0;
        this.pulseTime = 0;
    }

    // Collision handling
    onCollision(other, collision) {
        // Handle collision with other entities
        if (other.type === 'escapist') {
            this.onEscapistContact(other);
        }
    }

    onEscapistContact(escapist) {
        // Player has made contact with the escapist
        this.glowIntensity = 1.0;
        
        // Create visual effect
        // This would trigger particle effects in the renderer
    }

    // Utility methods
    getPosition() {
        return this.position.copy();
    }

    getVelocity() {
        return this.body.velocity.copy();
    }

    getSpeed() {
        return this.body.velocity.magnitude();
    }

    isMoving() {
        return this.getSpeed() > 1;
    }

    getDistanceTo(target) {
        const targetPos = target.position || target;
        return this.position.distance(targetPos);
    }

    // Serialization
    toJSON() {
        return {
            position: { x: this.position.x, y: this.position.y },
            energy: this.energy,
            isActive: this.isActive,
            body: this.body.toJSON()
        };
    }

    static fromJSON(data) {
        const player = new Player(new Vector2D(data.position.x, data.position.y));
        player.energy = data.energy;
        player.isActive = data.isActive;
        player.body = RigidBody.fromJSON(data.body);
        return player;
    }
}