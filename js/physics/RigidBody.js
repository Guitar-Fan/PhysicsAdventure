/**
 * RigidBody - Physics body with mass, position, velocity, and forces
 */
class RigidBody {
    constructor(options = {}) {
        // Basic properties
        this.position = options.position || Vector2D.zero();
        this.velocity = options.velocity || Vector2D.zero();
        this.acceleration = options.acceleration || Vector2D.zero();
        
        // Physical properties
        this.mass = options.mass || 1.0;
        this.inverseMass = this.mass > 0 ? 1.0 / this.mass : 0;
        this.restitution = options.restitution || 0.8; // Bounciness (0-1)
        this.friction = options.friction || 0.1; // Surface friction
        this.drag = options.drag || 0.001; // Air resistance
        
        // Shape and collision
        this.radius = options.radius || 10;
        this.shape = options.shape || 'circle'; // 'circle', 'rectangle', 'polygon'
        this.width = options.width || this.radius * 2;
        this.height = options.height || this.radius * 2;
        
        // State
        this.isStatic = options.isStatic || false;
        this.isKinematic = options.isKinematic || false;
        this.isSleeping = false;
        this.sleepThreshold = 0.01;
        
        // Forces
        this.forces = [];
        this.torque = 0;
        this.angularVelocity = options.angularVelocity || 0;
        this.angle = options.angle || 0;
        this.angularDrag = options.angularDrag || 0.01;
        
        // Material properties
        this.density = options.density || 1.0;
        this.material = options.material || 'default';
        
        // Visual properties
        this.color = options.color || '#ffffff';
        this.strokeColor = options.strokeColor || '#000000';
        this.strokeWidth = options.strokeWidth || 1;
        
        // Identification
        this.id = options.id || Math.random().toString(36).substr(2, 9);
        this.type = options.type || 'rigidbody';
        this.tags = options.tags || [];
        
        // Physics state tracking
        this.previousPosition = this.position.copy();
        this.netForce = Vector2D.zero();
        this.netTorque = 0;
        
        // Collision data
        this.colliding = false;
        this.collisionNormal = Vector2D.zero();
        this.collisionDepth = 0;
        
        // Calculate derived properties
        this.updateDerivedProperties();
    }

    // Update properties that depend on mass, size, etc.
    updateDerivedProperties() {
        if (this.mass <= 0) {
            this.inverseMass = 0;
            this.isStatic = true;
        } else {
            this.inverseMass = 1.0 / this.mass;
        }
        
        // Calculate moment of inertia based on shape
        this.updateMomentOfInertia();
    }

    updateMomentOfInertia() {
        if (this.isStatic) {
            this.momentOfInertia = 0;
            this.inverseMomentOfInertia = 0;
            return;
        }
        
        switch (this.shape) {
            case 'circle':
                this.momentOfInertia = 0.5 * this.mass * this.radius * this.radius;
                break;
            case 'rectangle':
                this.momentOfInertia = (this.mass * (this.width * this.width + this.height * this.height)) / 12;
                break;
            default:
                this.momentOfInertia = this.mass * this.radius * this.radius;
        }
        
        this.inverseMomentOfInertia = this.momentOfInertia > 0 ? 1.0 / this.momentOfInertia : 0;
    }

    // Apply forces
    applyForce(force, point = null) {
        if (this.isStatic) return;
        
        this.forces.push({
            force: force.copy(),
            point: point ? point.copy() : null,
            timestamp: Date.now()
        });
    }

    applyImpulse(impulse, point = null) {
        if (this.isStatic) return;
        
        // Apply linear impulse
        this.velocity.addMut(impulse.multiply(this.inverseMass));
        
        // Apply angular impulse if point is specified
        if (point) {
            const r = point.subtract(this.position);
            const angularImpulse = r.cross(impulse);
            this.angularVelocity += angularImpulse * this.inverseMomentOfInertia;
        }
    }

    applyTorque(torque) {
        if (this.isStatic) return;
        this.torque += torque;
    }

    // Clear forces (called after physics integration)
    clearForces() {
        this.forces = [];
        this.torque = 0;
        this.netForce.set(0, 0);
        this.netTorque = 0;
    }

    // Calculate net force from all applied forces
    calculateNetForce() {
        this.netForce.set(0, 0);
        this.netTorque = this.torque;
        
        for (const forceData of this.forces) {
            this.netForce.addMut(forceData.force);
            
            // Calculate torque from off-center forces
            if (forceData.point) {
                const r = forceData.point.subtract(this.position);
                this.netTorque += r.cross(forceData.force);
            }
        }
        
        // Apply drag forces
        if (this.velocity.magnitude() > 0) {
            const dragForce = this.velocity.normalize().multiply(-this.drag * this.velocity.magnitudeSquared());
            this.netForce.addMut(dragForce);
        }
        
        // Apply angular drag
        if (Math.abs(this.angularVelocity) > 0) {
            const angularDragTorque = -this.angularDrag * this.angularVelocity * Math.abs(this.angularVelocity);
            this.netTorque += angularDragTorque;
        }
    }

    // Physics integration using Verlet integration
    integrate(deltaTime) {
        if (this.isStatic) return;
        
        // Store previous position for collision resolution
        this.previousPosition.setFromVector(this.position);
        
        // Calculate acceleration from net force
        this.acceleration = this.netForce.multiply(this.inverseMass);
        
        // Update velocity
        this.velocity.addMut(this.acceleration.multiply(deltaTime));
        
        // Update position
        this.position.addMut(this.velocity.multiply(deltaTime));
        
        // Update rotation
        const angularAcceleration = this.netTorque * this.inverseMomentOfInertia;
        this.angularVelocity += angularAcceleration * deltaTime;
        this.angle += this.angularVelocity * deltaTime;
        
        // Sleep detection
        this.updateSleepState();
        
        // Clear forces for next frame
        this.clearForces();
    }

    updateSleepState() {
        const kineticEnergy = 0.5 * this.mass * this.velocity.magnitudeSquared() +
                             0.5 * this.momentOfInertia * this.angularVelocity * this.angularVelocity;
        
        if (kineticEnergy < this.sleepThreshold) {
            this.isSleeping = true;
            this.velocity.set(0, 0);
            this.angularVelocity = 0;
        } else {
            this.isSleeping = false;
        }
    }

    // Wake up the body
    wake() {
        this.isSleeping = false;
    }

    // Collision response
    resolveCollision(other, collision) {
        if (this.isStatic && other.isStatic) return;
        
        this.wake();
        other.wake();
        
        const normal = collision.normal;
        const depth = collision.depth;
        
        // Separate objects
        const totalInverseMass = this.inverseMass + other.inverseMass;
        if (totalInverseMass > 0) {
            const separationVector = normal.multiply(depth / totalInverseMass);
            
            if (!this.isStatic) {
                this.position.addMut(separationVector.multiply(this.inverseMass));
            }
            if (!other.isStatic) {
                other.position.subtractMut(separationVector.multiply(other.inverseMass));
            }
        }
        
        // Calculate relative velocity
        const relativeVelocity = other.velocity.subtract(this.velocity);
        const velocityAlongNormal = relativeVelocity.dot(normal);
        
        // Don't resolve if velocities are separating
        if (velocityAlongNormal > 0) return;
        
        // Calculate restitution
        const e = Math.min(this.restitution, other.restitution);
        
        // Calculate impulse scalar
        let impulseScalar = -(1 + e) * velocityAlongNormal / totalInverseMass;
        
        // Apply impulse
        const impulse = normal.multiply(impulseScalar);
        
        if (!this.isStatic) {
            this.velocity.subtractMut(impulse.multiply(this.inverseMass));
        }
        if (!other.isStatic) {
            other.velocity.addMut(impulse.multiply(other.inverseMass));
        }
        
        // Friction
        this.applyFriction(other, normal, impulseScalar);
        
        // Mark as colliding
        this.colliding = true;
        other.colliding = true;
        this.collisionNormal = normal;
        other.collisionNormal = normal.multiply(-1);
    }

    applyFriction(other, normal, impulseScalar) {
        const relativeVelocity = other.velocity.subtract(this.velocity);
        const tangent = relativeVelocity.subtract(normal.multiply(relativeVelocity.dot(normal)));
        
        if (tangent.isZero()) return;
        
        tangent.normalizeMut();
        
        const frictionCoefficient = Math.sqrt(this.friction * other.friction);
        let frictionImpulse = -relativeVelocity.dot(tangent) / (this.inverseMass + other.inverseMass);
        
        // Clamp friction
        const maxFriction = Math.abs(impulseScalar) * frictionCoefficient;
        frictionImpulse = Math.max(-maxFriction, Math.min(maxFriction, frictionImpulse));
        
        const frictionVector = tangent.multiply(frictionImpulse);
        
        if (!this.isStatic) {
            this.velocity.subtractMut(frictionVector.multiply(this.inverseMass));
        }
        if (!other.isStatic) {
            other.velocity.addMut(frictionVector.multiply(other.inverseMass));
        }
    }

    // Utility methods
    getKineticEnergy() {
        return 0.5 * this.mass * this.velocity.magnitudeSquared() +
               0.5 * this.momentOfInertia * this.angularVelocity * this.angularVelocity;
    }

    getPotentialEnergy(gravity) {
        return this.mass * Math.abs(gravity.y) * this.position.y;
    }

    getMomentum() {
        return this.velocity.multiply(this.mass);
    }

    getAngularMomentum() {
        return this.angularVelocity * this.momentOfInertia;
    }

    // Bounds checking
    getBounds() {
        switch (this.shape) {
            case 'circle':
                return {
                    left: this.position.x - this.radius,
                    right: this.position.x + this.radius,
                    top: this.position.y + this.radius,
                    bottom: this.position.y - this.radius
                };
            case 'rectangle':
                const hw = this.width / 2;
                const hh = this.height / 2;
                return {
                    left: this.position.x - hw,
                    right: this.position.x + hw,
                    top: this.position.y + hh,
                    bottom: this.position.y - hh
                };
            default:
                return this.getBounds();
        }
    }

    containsPoint(point) {
        switch (this.shape) {
            case 'circle':
                return this.position.distance(point) <= this.radius;
            case 'rectangle':
                const bounds = this.getBounds();
                return point.x >= bounds.left && point.x <= bounds.right &&
                       point.y >= bounds.bottom && point.y <= bounds.top;
            default:
                return false;
        }
    }

    // Serialization
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            position: { x: this.position.x, y: this.position.y },
            velocity: { x: this.velocity.x, y: this.velocity.y },
            angle: this.angle,
            angularVelocity: this.angularVelocity,
            mass: this.mass,
            restitution: this.restitution,
            friction: this.friction,
            shape: this.shape,
            radius: this.radius,
            width: this.width,
            height: this.height,
            isStatic: this.isStatic,
            material: this.material,
            color: this.color
        };
    }

    static fromJSON(data) {
        return new RigidBody({
            id: data.id,
            type: data.type,
            position: new Vector2D(data.position.x, data.position.y),
            velocity: new Vector2D(data.velocity.x, data.velocity.y),
            angle: data.angle,
            angularVelocity: data.angularVelocity,
            mass: data.mass,
            restitution: data.restitution,
            friction: data.friction,
            shape: data.shape,
            radius: data.radius,
            width: data.width,
            height: data.height,
            isStatic: data.isStatic,
            material: data.material,
            color: data.color
        });
    }
}