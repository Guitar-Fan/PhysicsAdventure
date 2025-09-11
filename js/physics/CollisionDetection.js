/**
 * CollisionDetection - Handles collision detection between various shapes
 */
class CollisionDetection {
    constructor() {
        this.collisionPairs = [];
        this.spatialGrid = new SpatialGrid(100); // Grid cell size of 100 units
    }

    // Main collision detection method
    detectCollisions(bodies) {
        this.collisionPairs = [];
        
        // Reset collision states
        bodies.forEach(body => {
            body.colliding = false;
            body.collisionNormal = Vector2D.zero();
            body.collisionDepth = 0;
        });
        
        // Update spatial grid
        this.spatialGrid.clear();
        bodies.forEach(body => this.spatialGrid.insert(body));
        
        // Broad phase: find potential collision pairs
        const potentialPairs = this.broadPhase(bodies);
        
        // Narrow phase: detailed collision detection
        for (const pair of potentialPairs) {
            const collision = this.narrowPhase(pair[0], pair[1]);
            if (collision) {
                this.collisionPairs.push({
                    bodyA: pair[0],
                    bodyB: pair[1],
                    collision: collision
                });
            }
        }
        
        return this.collisionPairs;
    }

    // Broad phase collision detection using spatial grid
    broadPhase(bodies) {
        const pairs = [];
        const checkedPairs = new Set();
        
        for (const body of bodies) {
            const nearbyBodies = this.spatialGrid.query(body);
            
            for (const other of nearbyBodies) {
                if (body === other) continue;
                
                // Create unique pair identifier
                const pairId = body.id < other.id ? `${body.id}-${other.id}` : `${other.id}-${body.id}`;
                if (checkedPairs.has(pairId)) continue;
                checkedPairs.add(pairId);
                
                // AABB check for quick elimination
                if (this.aabbOverlap(body, other)) {
                    pairs.push([body, other]);
                }
            }
        }
        
        return pairs;
    }

    // AABB (Axis-Aligned Bounding Box) overlap test
    aabbOverlap(bodyA, bodyB) {
        const boundsA = bodyA.getBounds();
        const boundsB = bodyB.getBounds();
        
        return !(boundsA.right < boundsB.left || 
                boundsA.left > boundsB.right || 
                boundsA.top < boundsB.bottom || 
                boundsA.bottom > boundsB.top);
    }

    // Narrow phase collision detection
    narrowPhase(bodyA, bodyB) {
        // Skip if both bodies are static
        if (bodyA.isStatic && bodyB.isStatic) return null;
        
        // Dispatch to appropriate collision detection method
        const shapeA = bodyA.shape;
        const shapeB = bodyB.shape;
        
        if (shapeA === 'circle' && shapeB === 'circle') {
            return this.circleCircleCollision(bodyA, bodyB);
        } else if (shapeA === 'circle' && shapeB === 'rectangle') {
            return this.circleRectangleCollision(bodyA, bodyB);
        } else if (shapeA === 'rectangle' && shapeB === 'circle') {
            const collision = this.circleRectangleCollision(bodyB, bodyA);
            if (collision) {
                collision.normal = collision.normal.multiply(-1);
            }
            return collision;
        } else if (shapeA === 'rectangle' && shapeB === 'rectangle') {
            return this.rectangleRectangleCollision(bodyA, bodyB);
        }
        
        return null;
    }

    // Circle-Circle collision detection
    circleCircleCollision(circleA, circleB) {
        const distance = circleA.position.distance(circleB.position);
        const radiusSum = circleA.radius + circleB.radius;
        
        if (distance > radiusSum) return null;
        
        // Calculate collision normal and depth
        let normal;
        let depth;
        
        if (distance === 0) {
            // Circles are exactly on top of each other
            normal = new Vector2D(1, 0);
            depth = radiusSum;
        } else {
            normal = circleB.position.subtract(circleA.position).normalize();
            depth = radiusSum - distance;
        }
        
        return {
            normal: normal,
            depth: depth,
            contactPoint: circleA.position.add(normal.multiply(circleA.radius))
        };
    }

    // Circle-Rectangle collision detection
    circleRectangleCollision(circle, rectangle) {
        // Find the closest point on the rectangle to the circle center
        const bounds = rectangle.getBounds();
        const closestPoint = new Vector2D(
            Math.max(bounds.left, Math.min(circle.position.x, bounds.right)),
            Math.max(bounds.bottom, Math.min(circle.position.y, bounds.top))
        );
        
        const distance = circle.position.distance(closestPoint);
        
        if (distance > circle.radius) return null;
        
        let normal;
        let depth;
        
        if (distance === 0) {
            // Circle center is inside rectangle
            // Find the closest edge
            const distToLeft = circle.position.x - bounds.left;
            const distToRight = bounds.right - circle.position.x;
            const distToBottom = circle.position.y - bounds.bottom;
            const distToTop = bounds.top - circle.position.y;
            
            const minDist = Math.min(distToLeft, distToRight, distToBottom, distToTop);
            
            if (minDist === distToLeft) {
                normal = new Vector2D(-1, 0);
                depth = circle.radius + distToLeft;
            } else if (minDist === distToRight) {
                normal = new Vector2D(1, 0);
                depth = circle.radius + distToRight;
            } else if (minDist === distToBottom) {
                normal = new Vector2D(0, -1);
                depth = circle.radius + distToBottom;
            } else {
                normal = new Vector2D(0, 1);
                depth = circle.radius + distToTop;
            }
        } else {
            normal = circle.position.subtract(closestPoint).normalize();
            depth = circle.radius - distance;
        }
        
        return {
            normal: normal,
            depth: depth,
            contactPoint: closestPoint
        };
    }

    // Rectangle-Rectangle collision detection using SAT
    rectangleRectangleCollision(rectA, rectB) {
        // For axis-aligned rectangles, we can use a simpler approach
        const boundsA = rectA.getBounds();
        const boundsB = rectB.getBounds();
        
        // Check for overlap
        const overlapX = Math.min(boundsA.right, boundsB.right) - Math.max(boundsA.left, boundsB.left);
        const overlapY = Math.min(boundsA.top, boundsB.top) - Math.max(boundsA.bottom, boundsB.bottom);
        
        if (overlapX <= 0 || overlapY <= 0) return null;
        
        // Find the minimum translation vector
        let normal;
        let depth;
        
        if (overlapX < overlapY) {
            // Horizontal separation is smaller
            depth = overlapX;
            if (rectA.position.x < rectB.position.x) {
                normal = new Vector2D(-1, 0);
            } else {
                normal = new Vector2D(1, 0);
            }
        } else {
            // Vertical separation is smaller
            depth = overlapY;
            if (rectA.position.y < rectB.position.y) {
                normal = new Vector2D(0, -1);
            } else {
                normal = new Vector2D(0, 1);
            }
        }
        
        return {
            normal: normal,
            depth: depth,
            contactPoint: new Vector2D(
                (Math.max(boundsA.left, boundsB.left) + Math.min(boundsA.right, boundsB.right)) / 2,
                (Math.max(boundsA.bottom, boundsB.bottom) + Math.min(boundsA.top, boundsB.top)) / 2
            )
        };
    }

    // Raycast from point in direction
    raycast(origin, direction, maxDistance = Infinity, bodies = null) {
        if (!bodies) bodies = this.spatialGrid.getAllBodies();
        
        let closestHit = null;
        let closestDistance = maxDistance;
        
        for (const body of bodies) {
            const hit = this.raycastBody(origin, direction, body, closestDistance);
            if (hit && hit.distance < closestDistance) {
                closestHit = hit;
                closestDistance = hit.distance;
            }
        }
        
        return closestHit;
    }

    // Raycast against a specific body
    raycastBody(origin, direction, body, maxDistance) {
        switch (body.shape) {
            case 'circle':
                return this.raycastCircle(origin, direction, body, maxDistance);
            case 'rectangle':
                return this.raycastRectangle(origin, direction, body, maxDistance);
            default:
                return null;
        }
    }

    // Raycast against circle
    raycastCircle(origin, direction, circle, maxDistance) {
        const toCircle = circle.position.subtract(origin);
        const projectionLength = toCircle.dot(direction);
        
        if (projectionLength < 0) return null; // Ray pointing away from circle
        
        const closestPoint = origin.add(direction.multiply(projectionLength));
        const distanceToCenter = circle.position.distance(closestPoint);
        
        if (distanceToCenter > circle.radius) return null; // No intersection
        
        const halfChord = Math.sqrt(circle.radius * circle.radius - distanceToCenter * distanceToCenter);
        const intersectionDistance = projectionLength - halfChord;
        
        if (intersectionDistance < 0 || intersectionDistance > maxDistance) return null;
        
        const hitPoint = origin.add(direction.multiply(intersectionDistance));
        const normal = hitPoint.subtract(circle.position).normalize();
        
        return {
            body: circle,
            point: hitPoint,
            normal: normal,
            distance: intersectionDistance
        };
    }

    // Raycast against rectangle
    raycastRectangle(origin, direction, rectangle, maxDistance) {
        const bounds = rectangle.getBounds();
        
        // Calculate intersection with each edge
        const tMin = (bounds.left - origin.x) / direction.x;
        const tMax = (bounds.right - origin.x) / direction.x;
        const tyMin = (bounds.bottom - origin.y) / direction.y;
        const tyMax = (bounds.top - origin.y) / direction.y;
        
        const t1 = Math.min(tMin, tMax);
        const t2 = Math.max(tMin, tMax);
        const ty1 = Math.min(tyMin, tyMax);
        const ty2 = Math.max(tyMin, tyMax);
        
        const tNear = Math.max(t1, ty1);
        const tFar = Math.min(t2, ty2);
        
        if (tNear > tFar || tNear < 0 || tNear > maxDistance) return null;
        
        const hitPoint = origin.add(direction.multiply(tNear));
        
        // Calculate normal based on which face was hit
        let normal;
        if (Math.abs(hitPoint.x - bounds.left) < 0.001) {
            normal = new Vector2D(-1, 0);
        } else if (Math.abs(hitPoint.x - bounds.right) < 0.001) {
            normal = new Vector2D(1, 0);
        } else if (Math.abs(hitPoint.y - bounds.bottom) < 0.001) {
            normal = new Vector2D(0, -1);
        } else {
            normal = new Vector2D(0, 1);
        }
        
        return {
            body: rectangle,
            point: hitPoint,
            normal: normal,
            distance: tNear
        };
    }
}

/**
 * SpatialGrid - Spatial partitioning for efficient collision detection
 */
class SpatialGrid {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    // Clear the grid
    clear() {
        this.grid.clear();
    }

    // Insert a body into the grid
    insert(body) {
        const cells = this.getCells(body);
        for (const cell of cells) {
            const key = `${cell.x},${cell.y}`;
            if (!this.grid.has(key)) {
                this.grid.set(key, []);
            }
            this.grid.get(key).push(body);
        }
    }

    // Query nearby bodies
    query(body) {
        const nearbyBodies = new Set();
        const cells = this.getCells(body);
        
        for (const cell of cells) {
            const key = `${cell.x},${cell.y}`;
            const cellBodies = this.grid.get(key);
            if (cellBodies) {
                cellBodies.forEach(b => nearbyBodies.add(b));
            }
        }
        
        return Array.from(nearbyBodies);
    }

    // Get all bodies in the grid
    getAllBodies() {
        const allBodies = new Set();
        for (const cellBodies of this.grid.values()) {
            cellBodies.forEach(body => allBodies.add(body));
        }
        return Array.from(allBodies);
    }

    // Get grid cells occupied by a body
    getCells(body) {
        const bounds = body.getBounds();
        const cells = [];
        
        const minX = Math.floor(bounds.left / this.cellSize);
        const maxX = Math.floor(bounds.right / this.cellSize);
        const minY = Math.floor(bounds.bottom / this.cellSize);
        const maxY = Math.floor(bounds.top / this.cellSize);
        
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                cells.push({ x, y });
            }
        }
        
        return cells;
    }
}