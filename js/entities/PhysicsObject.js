/**
 * PhysicsObject - Interactive objects that demonstrate physics concepts
 */
class PhysicsObject {
    constructor(body, type = 'generic') {
        this.body = body;
        this.type = type;
        this.id = body.id;
        
        // Visual properties
        this.baseColor = body.color || '#ffffff';
        this.currentColor = this.baseColor;
        this.glowColor = null;
        this.glowIntensity = 0;
        
        // Animation properties
        this.animationTime = 0;
        this.pulseRate = 0;
        this.bounceHeight = 0;
        
        // Physics demonstration
        this.showForceVectors = false;
        this.vectorScale = 0.1;
        this.isHighlighted = false;
        
        // Interaction tracking
        this.lastCollisionTime = 0;
        this.collisionCount = 0;
        this.totalImpactForce = 0;
        
        // Special properties based on type
        this.setupTypeProperties();
        
        // Trail for moving objects
        this.trail = [];
        this.maxTrailLength = 15;
        this.trailEnabled = false;
        
        // Sound and effects
        this.lastSoundTime = 0;
        this.soundCooldown = 100; // ms
        
        // Educational information
        this.educationalData = this.getEducationalData();
    }

    setupTypeProperties() {
        switch (this.type) {
            case 'ball':
                this.pulseRate = 1.0;
                this.glowColor = '#00d4ff';
                this.trailEnabled = true;
                break;
                
            case 'heavy_ball':
                this.pulseRate = 0.5;
                this.glowColor = '#ff6600';
                this.body.color = '#8B4513';
                this.trailEnabled = true;
                break;
                
            case 'ramp':
                this.showForceVectors = true;
                this.body.color = '#8B4513';
                break;
                
            case 'spring':
                this.pulseRate = 2.0;
                this.glowColor = '#00ff88';
                this.body.color = '#00ff88';
                break;
                
            case 'platform':
                this.body.color = '#666666';
                break;
                
            case 'pendulum_bob':
                this.pulseRate = 0.8;
                this.glowColor = '#ffaa00';
                this.trailEnabled = true;
                break;
                
            case 'lever':
                this.showForceVectors = true;
                this.body.color = '#8B4513';
                break;
        }
    }

    getEducationalData() {
        const data = {
            concepts: [],
            equations: [],
            description: '',
            realWorldExamples: []
        };

        switch (this.type) {
            case 'ball':
                data.concepts = ['Gravity', 'Kinetic Energy', 'Momentum'];
                data.equations = ['F = ma', 'KE = ½mv²', 'p = mv'];
                data.description = 'A simple sphere that demonstrates basic physics principles';
                data.realWorldExamples = ['Throwing a basketball', 'Dropping an apple', 'Bowling ball'];
                break;
                
            case 'heavy_ball':
                data.concepts = ['Mass vs Weight', 'Gravitational Force', 'Inertia'];
                data.equations = ['F = mg', 'F = ma'];
                data.description = 'A dense sphere that shows how mass affects motion';
                data.realWorldExamples = ['Cannonball', 'Bowling ball vs tennis ball'];
                break;
                
            case 'ramp':
                data.concepts = ['Inclined Planes', 'Normal Force', 'Friction'];
                data.equations = ['F_parallel = mg sin(θ)', 'F_normal = mg cos(θ)'];
                data.description = 'An inclined surface that demonstrates force components';
                data.realWorldExamples = ['Wheelchair ramps', 'Mountain roads', 'Playground slides'];
                break;
                
            case 'spring':
                data.concepts = ['Elastic Potential Energy', 'Hooke\'s Law', 'Simple Harmonic Motion'];
                data.equations = ['F = -kx', 'PE = ½kx²'];
                data.description = 'An elastic object that stores and releases energy';
                data.realWorldExamples = ['Car suspension', 'Trampolines', 'Pogo sticks'];
                break;
        }

        return data;
    }

    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // Update position from physics body
        this.position = this.body.position.copy();
        
        // Update visual effects
        this.updateVisualEffects(deltaTime);
        
        // Update trail
        if (this.trailEnabled) {
            this.updateTrail();
        }
        
        // Update glow based on motion
        this.updateGlow(deltaTime);
        
        // Check for collision effects
        this.updateCollisionEffects(deltaTime);
        
        // Update bounce animation
        this.updateBounceAnimation(deltaTime);
    }

    updateVisualEffects(deltaTime) {
        // Pulse effect based on type
        if (this.pulseRate > 0) {
            const pulseValue = Math.sin(this.animationTime * this.pulseRate * Math.PI * 2);
            this.currentColor = this.interpolateColor(this.baseColor, this.glowColor || this.baseColor, 
                                                     Math.abs(pulseValue) * 0.3);
        }
        
        // Highlight effect
        if (this.isHighlighted) {
            this.glowIntensity = 0.8 + Math.sin(this.animationTime * 5) * 0.2;
        } else {
            this.glowIntensity *= 0.95; // Fade out glow
        }
    }

    updateTrail() {
        const speed = this.body.velocity.magnitude();
        
        if (speed > 5) { // Only create trail when moving
            this.trail.push({
                position: this.position.copy(),
                timestamp: Date.now(),
                speed: speed
            });
            
            // Remove old trail points
            const maxAge = 1000; // 1 second
            const currentTime = Date.now();
            this.trail = this.trail.filter(point => {
                return (currentTime - point.timestamp) < maxAge;
            });
            
            // Limit trail length
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        }
    }

    updateGlow(deltaTime) {
        const speed = this.body.velocity.magnitude();
        const targetGlow = Math.min(speed / 100, 1.0);
        
        // Smooth transition to target glow
        this.glowIntensity += (targetGlow - this.glowIntensity) * deltaTime * 5;
    }

    updateCollisionEffects(deltaTime) {
        // Fade collision indicators
        const timeSinceCollision = Date.now() - this.lastCollisionTime;
        if (timeSinceCollision < 500) { // 0.5 seconds
            const alpha = 1 - (timeSinceCollision / 500);
            this.glowIntensity = Math.max(this.glowIntensity, alpha);
        }
    }

    updateBounceAnimation(deltaTime) {
        // Animate bounce effect after collisions
        if (this.bounceHeight > 0) {
            this.bounceHeight -= deltaTime * 100; // Decay bounce
            this.bounceHeight = Math.max(0, this.bounceHeight);
        }
    }

    render(renderer) {
        const renderPos = this.position.add(new Vector2D(0, this.bounceHeight));
        
        // Render trail
        if (this.trailEnabled && this.trail.length > 0) {
            this.renderTrail(renderer);
        }
        
        // Render glow effect
        if (this.glowIntensity > 0.1) {
            this.renderGlow(renderer, renderPos);
        }
        
        // Render main body
        this.renderBody(renderer, renderPos);
        
        // Render force vectors
        if (this.showForceVectors) {
            this.renderForceVectors(renderer, renderPos);
        }
        
        // Render educational information if highlighted
        if (this.isHighlighted) {
            this.renderEducationalInfo(renderer, renderPos);
        }
        
        // Render collision indicator
        if (this.body.colliding) {
            this.renderCollisionIndicator(renderer, renderPos);
        }
    }

    renderBody(renderer, position) {
        const options = {
            fillColor: this.currentColor,
            strokeColor: this.body.strokeColor || '#ffffff',
            strokeWidth: this.body.strokeWidth || 1,
            alpha: this.body.alpha || 1
        };
        
        switch (this.body.shape) {
            case 'circle':
                // Add pulse effect to radius
                const pulseRadius = this.body.radius + Math.sin(this.animationTime * this.pulseRate * 6) * 1;
                renderer.renderCircle(position, pulseRadius, options);
                
                // Render inner detail for certain types
                if (this.type === 'ball' || this.type === 'heavy_ball') {
                    const innerRadius = pulseRadius * 0.3;
                    renderer.renderCircle(position, innerRadius, {
                        fillColor: '#ffffff',
                        alpha: 0.6
                    });
                }
                break;
                
            case 'rectangle':
                renderer.renderRectangle(position, this.body.width, this.body.height, {
                    ...options,
                    rotation: this.body.angle
                });
                
                // Add texture for certain types
                if (this.type === 'ramp') {
                    this.renderRampTexture(renderer, position);
                }
                break;
        }
    }

    renderRampTexture(renderer, position) {
        // Add wood grain or texture to ramps
        const ctx = renderer.context;
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(this.body.angle);
        
        // Draw grain lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        
        const width = this.body.width;
        const height = this.body.height;
        const grainCount = 5;
        
        for (let i = 0; i < grainCount; i++) {
            const y = (-height / 2) + (height / grainCount) * i;
            ctx.beginPath();
            ctx.moveTo(-width / 2, y);
            ctx.lineTo(width / 2, y);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    renderTrail(renderer) {
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const age = Date.now() - point.timestamp;
            const maxAge = 1000;
            const alpha = (1 - age / maxAge) * 0.5;
            const size = (this.body.radius * 0.5) * alpha;
            
            const trailColor = this.glowColor || this.baseColor;
            renderer.renderCircle(point.position, size, {
                fillColor: trailColor,
                alpha: alpha
            });
        }
    }

    renderGlow(renderer, position) {
        if (!this.glowColor || this.glowIntensity <= 0) return;
        
        const glowRadius = this.body.radius + 15;
        const layers = 3;
        
        for (let i = 0; i < layers; i++) {
            const layerRadius = glowRadius - (i * 5);
            const layerAlpha = (this.glowIntensity * 0.2) / (i + 1);
            
            renderer.renderCircle(position, layerRadius, {
                fillColor: this.glowColor,
                alpha: layerAlpha
            });
        }
    }

    renderForceVectors(renderer, position) {
        // Render velocity vector
        if (this.body.velocity.magnitude() > 1) {
            const velocityEnd = position.add(this.body.velocity.multiply(this.vectorScale));
            renderer.renderLine(position, velocityEnd, {
                color: '#ffaa00',
                width: 2,
                alpha: 0.8
            });
            
            // Velocity label
            renderer.renderText('v', velocityEnd.add(new Vector2D(5, -5)), {
                color: '#ffaa00',
                font: '12px Arial'
            });
        }
        
        // Render net force vector
        if (this.body.netForce && this.body.netForce.magnitude() > 0.1) {
            const forceEnd = position.add(this.body.netForce.multiply(this.vectorScale * 0.1));
            renderer.renderLine(position, forceEnd, {
                color: '#ff6600',
                width: 2,
                alpha: 0.8
            });
            
            // Force label
            renderer.renderText('F', forceEnd.add(new Vector2D(5, -5)), {
                color: '#ff6600',
                font: '12px Arial'
            });
        }
    }

    renderEducationalInfo(renderer, position) {
        const info = this.educationalData;
        const infoPos = position.add(new Vector2D(this.body.radius + 20, -50));
        
        // Background
        const bgWidth = 200;
        const bgHeight = 80;
        renderer.renderRectangle(infoPos, bgWidth, bgHeight, {
            fillColor: 'rgba(0, 0, 0, 0.8)',
            strokeColor: '#00d4ff',
            strokeWidth: 1
        });
        
        // Title
        renderer.renderText(this.type.replace('_', ' ').toUpperCase(), 
                          infoPos.add(new Vector2D(-bgWidth/2 + 10, -bgHeight/2 + 10)), {
            color: '#00d4ff',
            font: 'bold 12px Arial'
        });
        
        // Concepts
        const conceptText = 'Concepts: ' + info.concepts.slice(0, 2).join(', ');
        renderer.renderText(conceptText, 
                          infoPos.add(new Vector2D(-bgWidth/2 + 10, -bgHeight/2 + 30)), {
            color: '#ffffff',
            font: '10px Arial'
        });
        
        // Key equation
        if (info.equations.length > 0) {
            renderer.renderText(info.equations[0], 
                              infoPos.add(new Vector2D(-bgWidth/2 + 10, -bgHeight/2 + 50)), {
                color: '#ffaa00',
                font: '10px monospace'
            });
        }
    }

    renderCollisionIndicator(renderer, position) {
        const indicatorRadius = this.body.radius + 8;
        const time = Date.now() * 0.01;
        
        renderer.renderCircle(position, indicatorRadius, {
            fillColor: null,
            strokeColor: '#ff4444',
            strokeWidth: 3,
            alpha: 0.7 + Math.sin(time) * 0.3
        });
    }

    // Interaction methods
    onCollision(other, collision) {
        this.lastCollisionTime = Date.now();
        this.collisionCount++;
        
        // Calculate impact force
        const relativeVelocity = this.body.velocity.subtract(other.velocity || Vector2D.zero());
        const impactForce = relativeVelocity.magnitude() * this.body.mass;
        this.totalImpactForce += impactForce;
        
        // Visual effects
        this.glowIntensity = 1.0;
        this.bounceHeight = Math.min(impactForce * 0.1, 10);
        
        // Sound effect (would be implemented with actual audio)
        this.triggerSoundEffect(impactForce);
        
        // Educational feedback
        this.triggerEducationalFeedback(other, collision);
    }

    triggerSoundEffect(force) {
        const currentTime = Date.now();
        if (currentTime - this.lastSoundTime > this.soundCooldown) {
            this.lastSoundTime = currentTime;
            
            // Different sounds based on object type and force
            const soundType = this.getSoundType(force);
            // Would play actual sound here
            console.log(`Playing ${soundType} sound for ${this.type} with force ${force.toFixed(2)}`);
        }
    }

    getSoundType(force) {
        if (force > 100) return 'heavy_impact';
        if (force > 50) return 'medium_impact';
        return 'light_impact';
    }

    triggerEducationalFeedback(other, collision) {
        // Create educational feedback based on the interaction
        const feedback = this.generateEducationalFeedback(other, collision);
        // This would be displayed in the UI
    }

    generateEducationalFeedback(other, collision) {
        const feedback = {
            concept: '',
            explanation: '',
            equation: '',
            values: {}
        };
        
        switch (this.type) {
            case 'ball':
                feedback.concept = 'Elastic Collision';
                feedback.explanation = 'Energy and momentum are conserved in this collision';
                feedback.equation = 'p₁ + p₂ = p₁\' + p₂\'';
                feedback.values = {
                    'Initial momentum': this.body.getMomentum().magnitude().toFixed(2),
                    'Impact force': collision.normal.magnitude().toFixed(2)
                };
                break;
        }
        
        return feedback;
    }

    // Utility methods
    highlight() {
        this.isHighlighted = true;
    }

    unhighlight() {
        this.isHighlighted = false;
    }

    setTrailEnabled(enabled) {
        this.trailEnabled = enabled;
        if (!enabled) {
            this.trail = [];
        }
    }

    setShowForceVectors(show) {
        this.showForceVectors = show;
    }

    getPhysicsData() {
        return {
            position: this.body.position.copy(),
            velocity: this.body.velocity.copy(),
            acceleration: this.body.acceleration.copy(),
            mass: this.body.mass,
            kineticEnergy: this.body.getKineticEnergy(),
            momentum: this.body.getMomentum(),
            speed: this.body.velocity.magnitude()
        };
    }

    getInteractionStats() {
        return {
            collisionCount: this.collisionCount,
            totalImpactForce: this.totalImpactForce,
            averageImpactForce: this.collisionCount > 0 ? this.totalImpactForce / this.collisionCount : 0,
            lastCollisionTime: this.lastCollisionTime
        };
    }

    // Helper methods
    interpolateColor(color1, color2, factor) {
        // Simple color interpolation - would be expanded for full RGB support
        return color1; // Placeholder
    }

    // Serialization
    toJSON() {
        return {
            type: this.type,
            body: this.body.toJSON(),
            collisionCount: this.collisionCount,
            totalImpactForce: this.totalImpactForce
        };
    }

    static fromJSON(data) {
        const body = RigidBody.fromJSON(data.body);
        const obj = new PhysicsObject(body, data.type);
        obj.collisionCount = data.collisionCount || 0;
        obj.totalImpactForce = data.totalImpactForce || 0;
        return obj;
    }
}