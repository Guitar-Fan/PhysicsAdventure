/**
 * PhysicsEngine - Main physics simulation engine
 */
class PhysicsEngine {
    constructor(options = {}) {
        // World properties
        this.gravity = options.gravity || Vector2D.GRAVITY_EARTH;
        this.airDensity = options.airDensity || 1.225; // kg/m³ at sea level
        this.timeScale = options.timeScale || 1.0;
        this.paused = false;
        
        // Bodies and constraints
        this.bodies = [];
        this.constraints = [];
        this.forces = [];
        
        // Collision detection
        this.collisionDetection = new CollisionDetection();
        this.enableCollisions = true;
        
        // Integration settings
        this.fixedTimeStep = 1/60; // 60 FPS
        this.maxSubSteps = 8;
        this.accumulator = 0;
        
        // Performance tracking
        this.frameCount = 0;
        this.lastUpdateTime = 0;
        this.averageFrameTime = 0;
        
        // Physics constants and settings
        this.settings = {
            positionIterations: 3,
            velocityIterations: 8,
            warmStarting: true,
            allowSleep: true,
            continuousPhysics: true
        };
        
        // Events
        this.eventListeners = new Map();
        
        // World bounds
        this.bounds = options.bounds || {
            left: -1000,
            right: 1000,
            top: 1000,
            bottom: -1000
        };
        
        this.boundsEnabled = options.boundsEnabled !== false;
    }

    // Add a rigid body to the world
    addBody(body) {
        if (this.bodies.includes(body)) return;
        
        this.bodies.push(body);
        this.emit('bodyAdded', { body });
        return body;
    }

    // Remove a rigid body from the world
    removeBody(body) {
        const index = this.bodies.indexOf(body);
        if (index !== -1) {
            this.bodies.splice(index, 1);
            this.emit('bodyRemoved', { body });
        }
    }

    // Add a global force (like wind)
    addForce(force) {
        this.forces.push(force);
    }

    // Remove a global force
    removeForce(force) {
        const index = this.forces.indexOf(force);
        if (index !== -1) {
            this.forces.splice(index, 1);
        }
    }

    // Main physics update loop
    update(deltaTime) {
        if (this.paused) return;
        
        const startTime = performance.now();
        
        // Scale time
        deltaTime *= this.timeScale;
        
        // Accumulate time for fixed timestep
        this.accumulator += deltaTime;
        
        let subSteps = 0;
        while (this.accumulator >= this.fixedTimeStep && subSteps < this.maxSubSteps) {
            this.step(this.fixedTimeStep);
            this.accumulator -= this.fixedTimeStep;
            subSteps++;
        }
        
        // Interpolation factor for smooth rendering
        const alpha = this.accumulator / this.fixedTimeStep;
        
        // Update performance metrics
        this.updatePerformanceMetrics(performance.now() - startTime);
        
        return alpha;
    }

    // Single physics step
    step(deltaTime) {
        // Apply global forces
        this.applyGlobalForces();
        
        // Apply constraints (before integration)
        this.solveConstraints(deltaTime);
        
        // Integrate physics
        this.integrateBodies(deltaTime);
        
        // Handle collisions
        if (this.enableCollisions) {
            this.handleCollisions();
        }
        
        // Enforce world bounds
        if (this.boundsEnabled) {
            this.enforceBounds();
        }
        
        // Update spatial structures
        this.updateSpatialStructures();
        
        // Emit step event
        this.emit('step', { deltaTime, bodies: this.bodies });
        
        this.frameCount++;
    }

    // Apply global forces like gravity and wind
    applyGlobalForces() {
        for (const body of this.bodies) {
            if (body.isStatic || body.isSleeping) continue;
            
            // Apply gravity
            if (this.gravity && !this.gravity.isZero()) {
                const gravityForce = this.gravity.multiply(body.mass);
                body.applyForce(gravityForce);
            }
            
            // Apply global forces
            for (const force of this.forces) {
                if (typeof force === 'function') {
                    const calculatedForce = force(body, this);
                    if (calculatedForce) {
                        body.applyForce(calculatedForce);
                    }
                } else {
                    body.applyForce(force);
                }
            }
            
            // Apply air resistance
            if (this.airDensity > 0 && body.velocity.magnitude() > 0) {
                const dragCoefficient = body.dragCoefficient || 0.47; // Sphere
                const area = body.crossSectionalArea || (Math.PI * body.radius * body.radius);
                const dragMagnitude = 0.5 * this.airDensity * body.velocity.magnitudeSquared() * dragCoefficient * area;
                const dragForce = body.velocity.normalize().multiply(-dragMagnitude);
                body.applyForce(dragForce);
            }
        }
    }

    // Integrate all bodies
    integrateBodies(deltaTime) {
        for (const body of this.bodies) {
            if (body.isStatic || body.isSleeping) continue;
            
            // Calculate net force
            body.calculateNetForce();
            
            // Integrate
            body.integrate(deltaTime);
        }
    }

    // Handle collisions
    handleCollisions() {
        const collisionPairs = this.collisionDetection.detectCollisions(this.bodies);
        
        for (const pair of collisionPairs) {
            const { bodyA, bodyB, collision } = pair;
            
            // Emit collision event
            this.emit('collision', { bodyA, bodyB, collision });
            
            // Resolve collision
            bodyA.resolveCollision(bodyB, collision);
        }
    }

    // Enforce world bounds
    enforceBounds() {
        for (const body of this.bodies) {
            if (body.isStatic) continue;
            
            const bounds = body.getBounds();
            let corrected = false;
            
            // Left bound
            if (bounds.left < this.bounds.left) {
                body.position.x = this.bounds.left + (body.position.x - bounds.left);
                if (body.velocity.x < 0) {
                    body.velocity.x *= -body.restitution;
                }
                corrected = true;
            }
            
            // Right bound
            if (bounds.right > this.bounds.right) {
                body.position.x = this.bounds.right - (bounds.right - body.position.x);
                if (body.velocity.x > 0) {
                    body.velocity.x *= -body.restitution;
                }
                corrected = true;
            }
            
            // Bottom bound
            if (bounds.bottom < this.bounds.bottom) {
                body.position.y = this.bounds.bottom + (body.position.y - bounds.bottom);
                if (body.velocity.y < 0) {
                    body.velocity.y *= -body.restitution;
                }
                corrected = true;
            }
            
            // Top bound
            if (bounds.top > this.bounds.top) {
                body.position.y = this.bounds.top - (bounds.top - body.position.y);
                if (body.velocity.y > 0) {
                    body.velocity.y *= -body.restitution;
                }
                corrected = true;
            }
            
            if (corrected) {
                this.emit('boundsCollision', { body });
            }
        }
    }

    // Solve constraints (springs, joints, etc.)
    solveConstraints(deltaTime) {
        for (let i = 0; i < this.settings.positionIterations; i++) {
            for (const constraint of this.constraints) {
                constraint.solve(deltaTime);
            }
        }
    }

    // Update spatial data structures
    updateSpatialStructures() {
        // This is handled internally by the collision detection system
    }

    // Update performance metrics
    updatePerformanceMetrics(frameTime) {
        this.lastUpdateTime = frameTime;
        this.averageFrameTime = (this.averageFrameTime * 0.9) + (frameTime * 0.1);
    }

    // Raycast
    raycast(origin, direction, maxDistance = Infinity) {
        return this.collisionDetection.raycast(origin, direction, maxDistance, this.bodies);
    }

    // Query for bodies in a region
    queryRegion(bounds) {
        const result = [];
        for (const body of this.bodies) {
            const bodyBounds = body.getBounds();
            if (this.boundsOverlap(bounds, bodyBounds)) {
                result.push(body);
            }
        }
        return result;
    }

    boundsOverlap(boundsA, boundsB) {
        return !(boundsA.right < boundsB.left || 
                boundsA.left > boundsB.right || 
                boundsA.top < boundsB.bottom || 
                boundsA.bottom > boundsB.top);
    }

    // Find body at point
    queryPoint(point) {
        for (const body of this.bodies) {
            if (body.containsPoint(point)) {
                return body;
            }
        }
        return null;
    }

    // Get bodies by tag
    getBodiesByTag(tag) {
        return this.bodies.filter(body => body.tags.includes(tag));
    }

    // Get body by ID
    getBodyById(id) {
        return this.bodies.find(body => body.id === id);
    }

    // Physics properties
    setGravity(gravity) {
        this.gravity = gravity instanceof Vector2D ? gravity : new Vector2D(gravity.x, gravity.y);
        this.emit('gravityChanged', { gravity: this.gravity });
    }

    getGravity() {
        return this.gravity.copy();
    }

    // Time control
    pause() {
        this.paused = true;
        this.emit('paused');
    }

    resume() {
        this.paused = false;
        this.emit('resumed');
    }

    setTimeScale(scale) {
        this.timeScale = Math.max(0, scale);
        this.emit('timeScaleChanged', { timeScale: this.timeScale });
    }

    // World properties
    setBounds(bounds) {
        this.bounds = { ...bounds };
        this.emit('boundsChanged', { bounds: this.bounds });
    }

    // Clear all bodies
    clear() {
        this.bodies.length = 0;
        this.constraints.length = 0;
        this.forces.length = 0;
        this.emit('worldCleared');
    }

    // Event system
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const callbacks = this.eventListeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data = {}) {
        if (this.eventListeners.has(event)) {
            const callbacks = this.eventListeners.get(event);
            for (const callback of callbacks) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in physics event listener for ${event}:`, error);
                }
            }
        }
    }

    // Debug and statistics
    getStatistics() {
        const activeBodies = this.bodies.filter(body => !body.isStatic && !body.isSleeping).length;
        const totalKineticEnergy = this.bodies.reduce((total, body) => {
            return total + body.getKineticEnergy();
        }, 0);
        
        return {
            totalBodies: this.bodies.length,
            activeBodies,
            staticBodies: this.bodies.filter(body => body.isStatic).length,
            sleepingBodies: this.bodies.filter(body => body.isSleeping).length,
            totalConstraints: this.constraints.length,
            totalKineticEnergy,
            frameCount: this.frameCount,
            averageFrameTime: this.averageFrameTime,
            lastUpdateTime: this.lastUpdateTime,
            timeScale: this.timeScale,
            paused: this.paused
        };
    }

    // Serialization
    serialize() {
        return {
            gravity: { x: this.gravity.x, y: this.gravity.y },
            airDensity: this.airDensity,
            timeScale: this.timeScale,
            bounds: this.bounds,
            bodies: this.bodies.map(body => body.toJSON()),
            settings: this.settings
        };
    }

    deserialize(data) {
        this.clear();
        this.gravity = new Vector2D(data.gravity.x, data.gravity.y);
        this.airDensity = data.airDensity;
        this.timeScale = data.timeScale;
        this.bounds = data.bounds;
        this.settings = { ...this.settings, ...data.settings };
        
        for (const bodyData of data.bodies) {
            const body = RigidBody.fromJSON(bodyData);
            this.addBody(body);
        }
    }
}