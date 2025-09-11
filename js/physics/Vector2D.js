/**
 * Vector2D - 2D Vector mathematics for physics calculations
 */
class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    // Static factory methods
    static zero() {
        return new Vector2D(0, 0);
    }

    static fromAngle(angle, magnitude = 1) {
        return new Vector2D(
            Math.cos(angle) * magnitude,
            Math.sin(angle) * magnitude
        );
    }

    static fromPoints(point1, point2) {
        return new Vector2D(
            point2.x - point1.x,
            point2.y - point1.y
        );
    }

    // Basic operations
    add(vector) {
        return new Vector2D(this.x + vector.x, this.y + vector.y);
    }

    subtract(vector) {
        return new Vector2D(this.x - vector.x, this.y - vector.y);
    }

    multiply(scalar) {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }

    divide(scalar) {
        if (scalar === 0) throw new Error("Division by zero");
        return new Vector2D(this.x / scalar, this.y / scalar);
    }

    // In-place operations (mutating)
    addMut(vector) {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }

    subtractMut(vector) {
        this.x -= vector.x;
        this.y -= vector.y;
        return this;
    }

    multiplyMut(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    divideMut(scalar) {
        if (scalar === 0) throw new Error("Division by zero");
        this.x /= scalar;
        this.y /= scalar;
        return this;
    }

    // Vector properties
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    magnitudeSquared() {
        return this.x * this.x + this.y * this.y;
    }

    angle() {
        return Math.atan2(this.y, this.x);
    }

    normalize() {
        const mag = this.magnitude();
        if (mag === 0) return Vector2D.zero();
        return this.divide(mag);
    }

    normalizeMut() {
        const mag = this.magnitude();
        if (mag === 0) {
            this.x = 0;
            this.y = 0;
        } else {
            this.x /= mag;
            this.y /= mag;
        }
        return this;
    }

    // Vector operations
    dot(vector) {
        return this.x * vector.x + this.y * vector.y;
    }

    cross(vector) {
        return this.x * vector.y - this.y * vector.x;
    }

    distance(vector) {
        return this.subtract(vector).magnitude();
    }

    distanceSquared(vector) {
        return this.subtract(vector).magnitudeSquared();
    }

    // Utility methods
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector2D(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }

    rotateMut(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const newX = this.x * cos - this.y * sin;
        const newY = this.x * sin + this.y * cos;
        this.x = newX;
        this.y = newY;
        return this;
    }

    lerp(vector, t) {
        return new Vector2D(
            this.x + (vector.x - this.x) * t,
            this.y + (vector.y - this.y) * t
        );
    }

    reflect(normal) {
        // Reflect vector across a normal vector
        const normalizedNormal = normal.normalize();
        return this.subtract(normalizedNormal.multiply(2 * this.dot(normalizedNormal)));
    }

    project(vector) {
        // Project this vector onto another vector
        const dotProduct = this.dot(vector);
        const magnitudeSquared = vector.magnitudeSquared();
        if (magnitudeSquared === 0) return Vector2D.zero();
        return vector.multiply(dotProduct / magnitudeSquared);
    }

    // Limiting operations
    limit(maxMagnitude) {
        const mag = this.magnitude();
        if (mag > maxMagnitude) {
            return this.normalize().multiply(maxMagnitude);
        }
        return new Vector2D(this.x, this.y);
    }

    limitMut(maxMagnitude) {
        const mag = this.magnitude();
        if (mag > maxMagnitude) {
            this.normalizeMut().multiplyMut(maxMagnitude);
        }
        return this;
    }

    // Comparison
    equals(vector, tolerance = 0.0001) {
        return Math.abs(this.x - vector.x) < tolerance && 
               Math.abs(this.y - vector.y) < tolerance;
    }

    isZero(tolerance = 0.0001) {
        return this.magnitude() < tolerance;
    }

    // String representation
    toString() {
        return `Vector2D(${this.x.toFixed(3)}, ${this.y.toFixed(3)})`;
    }

    // Copy
    copy() {
        return new Vector2D(this.x, this.y);
    }

    // Set values
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    setFromVector(vector) {
        this.x = vector.x;
        this.y = vector.y;
        return this;
    }

    // Physics-specific methods
    applyForce(force, mass) {
        // F = ma, so a = F/m
        const acceleration = force.divide(mass);
        return this.add(acceleration);
    }

    applyForceMut(force, mass) {
        const acceleration = force.divide(mass);
        return this.addMut(acceleration);
    }

    // Convert to different coordinate systems
    toScreen(screenHeight) {
        // Convert from physics coordinates (y-up) to screen coordinates (y-down)
        return new Vector2D(this.x, screenHeight - this.y);
    }

    fromScreen(screenHeight) {
        // Convert from screen coordinates (y-down) to physics coordinates (y-up)
        return new Vector2D(this.x, screenHeight - this.y);
    }

    // Random vectors
    static random(minMagnitude = 0, maxMagnitude = 1) {
        const angle = Math.random() * Math.PI * 2;
        const magnitude = minMagnitude + Math.random() * (maxMagnitude - minMagnitude);
        return Vector2D.fromAngle(angle, magnitude);
    }

    static randomDirection() {
        return Vector2D.fromAngle(Math.random() * Math.PI * 2);
    }

    // Physics constants as static vectors
    static get GRAVITY_EARTH() { return new Vector2D(0, -9.81); }
    static get GRAVITY_MOON() { return new Vector2D(0, -1.62); }
    static get GRAVITY_MARS() { return new Vector2D(0, -3.71); }
    static get GRAVITY_JUPITER() { return new Vector2D(0, -24.79); }
    static get ZERO_GRAVITY() { return new Vector2D(0, 0); }
}